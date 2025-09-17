/**
 * Redis Configuration for Enhanced GL Entry Validation
 * Provides distributed caching for enterprise-grade performance
 */
// @ts-nocheck


import { Redis } from "ioredis";

let redis: Redis | null = null;

/**
 * Initialize Redis connection
 */
export function createRedisClient(): Redis | null {
  // Only create Redis client if explicitly enabled
  if (!process.env.ENABLE_REDIS_VALIDATION_CACHE) {
    return null;
  }

  if (redis) {
    return redis;
  }

  try {
    redis = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379"),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_VALIDATION_DB || "1"), // Use separate DB for validation cache
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      keepAlive: 30000,
      keyPrefix: "gl_validation:",
      // Connection timeout
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    redis.on("connect", () => {
      console.log("✅ Redis connected for GL validation caching");
    });

    redis.on("error", error => {
      console.warn("⚠️ Redis connection error (falling back to memory cache):", error.message);
    });

    redis.on("close", () => {
      console.log("🔌 Redis connection closed");
    });

    return redis;
  } catch (error) {
    console.warn("⚠️ Failed to create Redis client (using memory cache only):", error);
    return null;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis | null {
  return redis || createRedisClient();
}

/**
 * Redis cache utilities for validation
 */
export class ValidationCache {
  private redis: Redis | null;
  private memoryCache = new Map<string, { data: any; expiry: number }>();

  constructor(redisClient?: Redis | null) {
    this.redis = redisClient || getRedisClient();
  }

  /**
   * Get cached data with fallback to memory cache
   */
  async get<T>(key: string): Promise<T | null> {
    // Try Redis first
    if (this.redis) {
      try {
        const cached = await this.redis.get(key);
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn("Redis get error, falling back to memory:", error);
      }
    }

    // Fallback to memory cache
    const memoryCached = this.memoryCache.get(key);
    if (memoryCached && memoryCached.expiry > Date.now()) {
      return memoryCached.data;
    }

    return null;
  }

  /**
   * Set cached data with TTL
   */
  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    const serialized = JSON.stringify(data);

    // Set in Redis
    if (this.redis) {
      try {
        await this.redis.setex(key, ttlSeconds, serialized);
      } catch (error) {
        console.warn("Redis set error:", error);
      }
    }

    // Also set in memory cache as fallback
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }

  /**
   * Delete cached data
   */
  async del(key: string): Promise<void> {
    // Delete from Redis
    if (this.redis) {
      try {
        await this.redis.del(key);
      } catch (error) {
        console.warn("Redis del error:", error);
      }
    }

    // Delete from memory cache
    this.memoryCache.delete(key);
  }

  /**
   * Clear all cached data with pattern
   */
  async clear(pattern?: string): Promise<void> {
    // Clear Redis with pattern
    if (this.redis && pattern) {
      try {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } catch (error) {
        console.warn("Redis clear error:", error);
      }
    }

    // Clear memory cache
    if (pattern) {
      const regex = new RegExp(pattern.replace("*", ".*"));
      for (const key of this.memoryCache.keys()) {
        if (regex.test(key)) {
          this.memoryCache.delete(key);
        }
      }
    } else {
      this.memoryCache.clear();
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    redisConnected: boolean;
    memoryCacheSize: number;
    redisInfo?: any;
  }> {
    const stats = {
      redisConnected: false,
      memoryCacheSize: this.memoryCache.size,
      redisInfo: undefined as any,
    };

    if (this.redis) {
      try {
        stats.redisConnected = this.redis.status === "ready";
        if (stats.redisConnected) {
          const info = await this.redis.info("memory");
          stats.redisInfo = this.parseRedisInfo(info);
        }
      } catch (error) {
        console.warn("Redis stats error:", error);
      }
    }

    return stats;
  }

  /**
   * Parse Redis INFO response
   */
  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    info.split("\r\n").forEach(line => {
      if (line.includes(":")) {
        const [key, value] = line.split(":");
        result[key] = value;
      }
    });
    return result;
  }

  /**
   * Health check for cache system
   */
  async healthCheck(): Promise<{
    status: "healthy" | "degraded" | "unhealthy";
    redis: boolean;
    memory: boolean;
    latency?: number;
  }> {
    const result = {
      status: "healthy" as const,
      redis: false,
      memory: true,
      latency: undefined as number | undefined,
    };

    // Test memory cache
    try {
      const testKey = "health_check_" + Date.now();
      this.memoryCache.set(testKey, { data: true, expiry: Date.now() + 1000 });
      const retrieved = this.memoryCache.get(testKey);
      result.memory = !!retrieved;
      this.memoryCache.delete(testKey);
    } catch (error) {
      result.memory = false;
    }

    // Test Redis
    if (this.redis) {
      try {
        const start = Date.now();
        await this.redis.ping();
        result.latency = Date.now() - start;
        result.redis = true;
      } catch (error) {
        result.redis = false;
      }
    }

    // Determine overall status
    if (result.redis && result.memory) {
      result.status = "healthy" as const;
    } else if (result.memory) {
      result.status = "degraded" as const; // Redis down but memory cache working
    } else {
      result.status = "unhealthy" as const;
    }

    return result;
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        console.warn("Error closing Redis connection:", error);
      }
    }
    this.memoryCache.clear();
  }
}

// Export singleton instance
export const validationCache = new ValidationCache();

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Closing Redis connections...");
  await validationCache.close();
});

process.on("SIGINT", async () => {
  console.log("Closing Redis connections...");
  await validationCache.close();
});
