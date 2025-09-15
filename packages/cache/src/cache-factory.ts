/**
 * Cache Factory - Factory pattern for creating cache instances
 */

import { CacheService } from "./cache";
import { RedisClient, getRedisClient } from "./redis";

export class CacheFactory {
    /**
     * Create a new cache service instance
     */
    static createCacheService(redisClient?: RedisClient): CacheService {
        const client = redisClient || getRedisClient();
        return new CacheService(client);
    }

    /**
     * Create a cache service with default configuration
     */
    static createDefaultCacheService(): CacheService {
        return this.createCacheService();
    }

    /**
     * Create a cache service with custom Redis client
     */
    static createCacheServiceWithClient(redisClient: RedisClient): CacheService {
        return new CacheService(redisClient);
    }
}
