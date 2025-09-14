// Redis Cache Adapter
import { CacheAdapter, CacheConfig, CacheOptions, CacheStats, CacheItem } from "./types";

export class RedisCacheAdapter implements CacheAdapter {
  private client: unknown;
  private config: CacheConfig;
  private cacheStats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
  };

  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid bundling Redis in browser
      const { createClient } = await import("redis");

      this.client = createClient({
        socket: {
          host: this.config.host,
          port: this.config.port,
        },
        password: this.config.password,
        database: this.config.db || 0,
      });

      (this.client as { on: (event: string, callback: (err: Error) => void) => void }).on(
        "error",
        (err: Error) => {
          console.error("Redis Client Error:", err);
        },
      );

      await (this.client as { connect: () => Promise<void> }).connect();
      console.log("Redis cache connected successfully");
    } catch (error) {
      console.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await (this.client as { quit: () => Promise<void> }).quit();
      this.client = null;
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const fullKey = this.buildKey(key);
      const result = await (this.client as { get: (key: string) => Promise<string | null> }).get(
        fullKey,
      );

      if (result === null) {
        this.cacheStats.misses++;
        this.updateHitRate();
        return null;
      }

      const item: CacheItem<T> = JSON.parse(result);

      // Check if item has expired
      if (this.isExpired(item)) {
        await this.del(key);
        this.cacheStats.misses++;
        this.updateHitRate();
        return null;
      }

      this.cacheStats.hits++;
      this.updateHitRate();
      return item.value;
    } catch (error) {
      console.error("Cache get error:", error);
      this.cacheStats.misses++;
      this.updateHitRate();
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const fullKey = this.buildKey(key);
      const ttl = options.ttl || this.config.ttl;

      const item: CacheItem<T> = {
        value,
        ttl,
        createdAt: Date.now(),
        tags: options.tags,
      };

      const serialized = JSON.stringify(item);

      if (ttl > 0) {
        await (
          this.client as { setEx: (key: string, ttl: number, value: string) => Promise<void> }
        ).setEx(fullKey, ttl, serialized);
      } else {
        await (this.client as { set: (key: string, value: string) => Promise<void> }).set(
          fullKey,
          serialized,
        );
      }

      // Store tags for invalidation
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(fullKey, options.tags);
      }

      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const fullKey = this.buildKey(key);
      const result = await (this.client as { del: (key: string) => Promise<number> }).del(fullKey);

      // Clean up tags
      await this.cleanupTags(fullKey);

      this.cacheStats.deletes++;
      return result > 0;
    } catch (error) {
      console.error("Cache delete error:", error);
      return false;
    }
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const fullPattern = this.buildKey(pattern);
      const keys = await (this.client as { keys: (pattern: string) => Promise<string[]> }).keys(
        fullPattern,
      );

      if (keys.length === 0) {
        return 0;
      }

      const result = await (this.client as { del: (keys: string[]) => Promise<number> }).del(keys);
      this.cacheStats.deletes += result;
      return result;
    } catch (error) {
      console.error("Cache delete pattern error:", error);
      return 0;
    }
  }

  /**
   * Delete keys by tags
   */
  async delByTags(tags: string[]): Promise<number> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      let deletedCount = 0;

      for (const tag of tags) {
        const tagKey = this.buildTagKey(tag);
        const keys = await (
          this.client as { sMembers: (key: string) => Promise<string[]> }
        ).sMembers(tagKey);

        if (keys.length > 0) {
          const result = await (this.client as { del: (keys: string[]) => Promise<number> }).del(
            keys,
          );
          deletedCount += result;
          this.cacheStats.deletes += result;
        }

        // Clean up tag set
        await (this.client as { del: (key: string) => Promise<number> }).del(tagKey);
      }

      return deletedCount;
    } catch (error) {
      console.error("Cache delete by tags error:", error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const fullKey = this.buildKey(key);
      const result = await (this.client as { exists: (key: string) => Promise<number> }).exists(
        fullKey,
      );
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const fullKey = this.buildKey(key);
      return await (this.client as { ttl: (key: string) => Promise<number> }).ttl(fullKey);
    } catch (error) {
      console.error("Cache TTL error:", error);
      return -1;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const fullKey = this.buildKey(key);
      const result = await (
        this.client as { expire: (key: string, ttl: number) => Promise<number> }
      ).expire(fullKey, ttl);
      return result === 1;
    } catch (error) {
      console.error("Cache expire error:", error);
      return false;
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error("Redis client not connected");
      }

      const pattern = this.buildKey("*");
      const keys = await (this.client as { keys: (pattern: string) => Promise<string[]> }).keys(
        pattern,
      );

      if (keys.length > 0) {
        await (this.client as { del: (keys: string[]) => Promise<number> }).del(keys);
      }

      this.cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
      };

      return true;
    } catch (error) {
      console.error("Cache flush error:", error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    return { ...this.cacheStats };
  }

  /**
   * Ping Redis server
   */
  async ping(): Promise<boolean> {
    try {
      if (!this.client) {
        return false;
      }

      const result = await (this.client as { ping: () => Promise<string> }).ping();
      return result === "PONG";
    } catch (error) {
      console.error("Cache ping error:", error);
      return false;
    }
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
  }

  /**
   * Build tag key
   */
  private buildTagKey(tag: string): string {
    return `${this.config.keyPrefix}:tags:${tag}`;
  }

  /**
   * Check if cache item is expired
   */
  private isExpired(item: CacheItem): boolean {
    if (item.ttl <= 0) {
      return false; // Never expires
    }

    const now = Date.now();
    const expirationTime = item.createdAt + item.ttl * 1000;
    return now > expirationTime;
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    this.cacheStats.hitRate = total > 0 ? this.cacheStats.hits / total : 0;
  }

  /**
   * Store tags for key
   */
  private async storeTags(key: string, tags: string[]): Promise<void> {
    for (const tag of tags) {
      const tagKey = this.buildTagKey(tag);
      await (this.client as { sAdd: (key: string, member: string) => Promise<number> }).sAdd(
        tagKey,
        key,
      );
      // Set expiration for tag set
      await (this.client as { expire: (key: string, ttl: number) => Promise<number> }).expire(
        tagKey,
        this.config.ttl,
      );
    }
  }

  /**
   * Clean up tags for key
   */
  private async cleanupTags(key: string): Promise<void> {
    // This is a simplified cleanup - in production you might want to track
    // which tags a key belongs to for more efficient cleanup
    const pattern = this.buildTagKey("*");
    const tagKeys = await (this.client as { keys: (pattern: string) => Promise<string[]> }).keys(
      pattern,
    );

    for (const tagKey of tagKeys) {
      await (this.client as { sRem: (key: string, member: string) => Promise<number> }).sRem(
        tagKey,
        key,
      );
    }
  }
}
