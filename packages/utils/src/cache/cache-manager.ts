// Cache Manager - Main cache interface
import { CacheAdapter, CacheConfig, CacheOptions, CacheStats } from "./types";
import { RedisCacheAdapter } from "./redis-adapter";
import { MemoryCacheAdapter } from "./memory-adapter";

export class CacheManager {
  private adapter: CacheAdapter;
  private config: CacheConfig;
  private isConnected = false;

  constructor(config: CacheConfig) {
    this.config = config;

    // Choose adapter based on environment
    if (config.host && config.host !== "memory") {
      this.adapter = new RedisCacheAdapter(config);
    } else {
      this.adapter = new MemoryCacheAdapter(config);
    }
  }

  /**
   * Initialize cache connection
   */
  async connect(): Promise<void> {
    try {
      if ("connect" in this.adapter) {
        await (this.adapter as { connect: () => Promise<void> }).connect();
      }
      this.isConnected = true;
      console.log("Cache manager connected successfully");
    } catch (error) {
      console.error("Failed to connect to cache:", error);
      // Fallback to memory cache
      this.adapter = new MemoryCacheAdapter(this.config);
      this.isConnected = true;
      console.log("Fell back to memory cache");
    }
  }

  /**
   * Disconnect from cache
   */
  async disconnect(): Promise<void> {
    try {
      if ("disconnect" in this.adapter) {
        await (this.adapter as { disconnect: () => Promise<void> }).disconnect();
      }
      this.isConnected = false;
      console.log("Cache manager disconnected");
    } catch (error) {
      console.error("Error disconnecting from cache:", error);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isConnected) {
      return null;
    }

    return await this.adapter.get<T>(key);
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    return await this.adapter.set(key, value, options);
  }

  /**
   * Delete key from cache
   */
  async del(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    return await this.adapter.del(key);
  }

  /**
   * Delete keys by pattern
   */
  async delPattern(pattern: string): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    return await this.adapter.delPattern(pattern);
  }

  /**
   * Delete keys by tags
   */
  async delByTags(tags: string[]): Promise<number> {
    if (!this.isConnected) {
      return 0;
    }

    return await this.adapter.delByTags(tags);
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    return await this.adapter.exists(key);
  }

  /**
   * Get TTL for key
   */
  async ttl(key: string): Promise<number> {
    if (!this.isConnected) {
      return -1;
    }

    return await this.adapter.ttl(key);
  }

  /**
   * Set expiration for key
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    return await this.adapter.expire(key, ttl);
  }

  /**
   * Flush all cache
   */
  async flush(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    return await this.adapter.flush();
  }

  /**
   * Get cache statistics
   */
  async stats(): Promise<CacheStats> {
    if (!this.isConnected) {
      return {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        hitRate: 0,
      };
    }

    return await this.adapter.stats();
  }

  /**
   * Ping cache server
   */
  async ping(): Promise<boolean> {
    if (!this.isConnected) {
      return false;
    }

    return await this.adapter.ping();
  }

  /**
   * Cache a function result
   */
  async remember<T>(key: string, fn: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    // Try to get from cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn();
    await this.set(key, result, options);
    return result;
  }

  /**
   * Cache a function result with tags
   */
  async rememberWithTags<T>(
    key: string,
    tags: string[],
    fn: () => Promise<T>,
    options: CacheOptions = {},
  ): Promise<T> {
    return await this.remember(key, fn, { ...options, tags });
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    return await this.delByTags(tags);
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidateByPattern(pattern: string): Promise<number> {
    return await this.delPattern(pattern);
  }

  /**
   * Get cache configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Check if cache is connected
   */
  isCacheConnected(): boolean {
    return this.isConnected;
  }
}

/**
 * Create a new cache manager instance
 */
export function createCacheManager(config: CacheConfig): CacheManager {
  return new CacheManager(config);
}

/**
 * Default cache configuration
 */
export const defaultCacheConfig: CacheConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
  ttl: parseInt(process.env.CACHE_TTL || "300"), // 5 minutes
  keyPrefix: process.env.CACHE_KEY_PREFIX || "aibos",
  retryAttempts: 3,
  retryDelay: 1000,
};
