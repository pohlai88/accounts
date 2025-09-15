// Memory Cache Adapter (Fallback)
import { CacheAdapter, CacheConfig, CacheOptions, CacheStats, CacheItem } from "./types.js";

export class MemoryCacheAdapter implements CacheAdapter {
  private cache = new Map<string, CacheItem>();
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

    // Start cleanup interval
    setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = this.buildKey(key);
      const item = this.cache.get(fullKey);

      if (!item) {
        this.cacheStats.misses++;
        this.updateHitRate();
        return null;
      }

      // Check if item has expired
      if (this.isExpired(item)) {
        this.cache.delete(fullKey);
        this.cacheStats.misses++;
        this.updateHitRate();
        return null;
      }

      this.cacheStats.hits++;
      this.updateHitRate();
      return item.value as T;
    } catch (error) {
      console.error("Memory cache get error:", error);
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
      const fullKey = this.buildKey(key);
      const ttl = options.ttl || this.config.ttl;

      const item: CacheItem<T> = {
        value,
        ttl,
        createdAt: Date.now(),
        tags: options.tags,
      };

      this.cache.set(fullKey, item);
      this.cacheStats.sets++;
      return true;
    } catch (error) {
      console.error("Memory cache set error:", error);
      return false;
    }
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const result = this.cache.delete(fullKey);
      this.cacheStats.deletes++;
      return result;
    } catch (error) {
      console.error("Memory cache delete error:", error);
      return false;
    }
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = this.buildKey(pattern);
      const regex = new RegExp(fullPattern.replace(/\*/g, ".*"));
      let deletedCount = 0;

      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }

      this.cacheStats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      console.error("Memory cache delete pattern error:", error);
      return 0;
    }
  }

  /**
   * Delete keys by tags
   */
  async delByTags(tags: string[]): Promise<number> {
    try {
      let deletedCount = 0;

      for (const [key, item] of this.cache.entries()) {
        if (item.tags && item.tags.some(tag => tags.includes(tag))) {
          this.cache.delete(key);
          deletedCount++;
        }
      }

      this.cacheStats.deletes += deletedCount;
      return deletedCount;
    } catch (error) {
      console.error("Memory cache delete by tags error:", error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      return this.cache.has(fullKey);
    } catch (error) {
      console.error("Memory cache exists error:", error);
      return false;
    }
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      const fullKey = this.buildKey(key);
      const item = this.cache.get(fullKey);

      if (!item) {
        return -1;
      }

      if (item.ttl <= 0) {
        return -1; // Never expires
      }

      const now = Date.now();
      const expirationTime = item.createdAt + item.ttl * 1000;
      const remaining = Math.max(0, Math.floor((expirationTime - now) / 1000));

      return remaining;
    } catch (error) {
      console.error("Memory cache TTL error:", error);
      return -1;
    }
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const fullKey = this.buildKey(key);
      const item = this.cache.get(fullKey);

      if (!item) {
        return false;
      }

      item.ttl = ttl;
      this.cache.set(fullKey, item);
      return true;
    } catch (error) {
      console.error("Memory cache expire error:", error);
      return false;
    }
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<boolean> {
    try {
      this.cache.clear();
      this.cacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
      };
      return true;
    } catch (error) {
      console.error("Memory cache flush error:", error);
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
   * Ping (always returns true for memory cache)
   */
  async ping(): Promise<boolean> {
    return true;
  }

  /**
   * Build full cache key with prefix
   */
  private buildKey(key: string): string {
    return `${this.config.keyPrefix}:${key}`;
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
   * Clean up expired items
   */
  private cleanup(): void {
    // const now = Date.now();
    let cleanedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (this.isExpired(item)) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`Memory cache: cleaned up ${cleanedCount} expired items`);
    }
  }
}
