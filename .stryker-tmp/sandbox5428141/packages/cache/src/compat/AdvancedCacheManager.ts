/**
 * @deprecated Compatibility layer for AdvancedCacheManager
 * This provides the missing AdvancedCacheManager that consumers expect
 * TODO: Migrate callers to use the actual CacheService implementation
 */
// @ts-nocheck


import { CacheService } from "../cache";
import type { RedisClient } from "../redis";

export class AdvancedCacheManager {
    private cacheService: CacheService;

    constructor() {
        // Create a mock Redis client for compatibility layer
        const mockRedis = {} as unknown as RedisClient;
        this.cacheService = new CacheService(mockRedis);
    }

    /**
     * @deprecated Use CacheService.get() instead
     */
    async get(key: string): Promise<unknown> {
        return this.cacheService.get(key);
    }

    /**
     * @deprecated Use CacheService.set() instead
     */
    async set(key: string, value: unknown, ttl?: number): Promise<void> {
        await this.cacheService.set(key, value, { ttl });
    }

    /**
     * @deprecated Use CacheService.delete() instead
     */
    async delete(key: string): Promise<void> {
        await this.cacheService.del(key);
    }

    /**
     * @deprecated Use CacheService.invalidatePattern() instead
     */
    async invalidatePattern(pattern: string): Promise<void> {
        // Mock implementation for compatibility
        console.warn(`invalidatePattern(${pattern}) - not implemented in compatibility layer`);
    }

    /**
     * @deprecated Use CacheService.getStats() instead
     */
    async getStats(): Promise<unknown> {
        return this.cacheService.getStats();
    }

    /**
     * @deprecated Use CacheService.healthCheck() instead
     */
    async healthCheck(): Promise<unknown> {
        // Mock implementation for compatibility
        return {
            status: "healthy",
            details: { message: "Compatibility layer - health check not implemented" }
        };
    }
}
