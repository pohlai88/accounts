/**
 * @aibos/cache - Cache Implementation
 * 
 * TTL-based caching with Redis backend and in-memory fallback
 */

import { RedisClient } from './redis';

export interface CacheOptions {
    ttl?: number; // Time to live in seconds
    namespace?: string; // Cache namespace for key isolation
    serialize?: boolean; // Whether to serialize/deserialize values
}

export interface CacheStats {
    hits: number;
    misses: number;
    sets: number;
    deletes: number;
    errors: number;
}

export class CacheService {
    private redis: RedisClient;
    private stats: CacheStats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
    };
    private memoryCache: Map<string, { value: unknown; expires: number }> = new Map();

    constructor(redis: RedisClient) {
        this.redis = redis;
    }

    private getKey(key: string, namespace?: string): string {
        if (namespace) {
            return `${namespace}:${key}`;
        }
        return key;
    }

    private serialize(value: unknown): string {
        if (typeof value === 'string') {
            return value;
        }
        return JSON.stringify(value);
    }

    private deserialize(value: string): unknown {
        try {
            return JSON.parse(value);
        } catch {
            return value;
        }
    }

    private isExpired(expires: number): boolean {
        return Date.now() > expires;
    }

    async get<T = unknown>(key: string, options: CacheOptions = {}): Promise<T | null> {
        try {
            const fullKey = this.getKey(key, options.namespace);

            // Try Redis first
            if (this.redis.isHealthy()) {
                const value = await this.redis.get(fullKey);
                if (value !== null) {
                    this.stats.hits++;
                    return options.serialize !== false ? this.deserialize(value) as T : value as T;
                }
            }

            // Fallback to memory cache
            const memoryKey = fullKey;
            const cached = this.memoryCache.get(memoryKey);
            if (cached && !this.isExpired(cached.expires)) {
                this.stats.hits++;
                return cached.value as T;
            }

            // Clean up expired memory cache
            if (cached && this.isExpired(cached.expires)) {
                this.memoryCache.delete(memoryKey);
            }

            this.stats.misses++;
            return null;
        } catch (error) {
            this.stats.errors++;
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set<T = unknown>(key: string, value: T, options: CacheOptions = {}): Promise<boolean> {
        try {
            const fullKey = this.getKey(key, options.namespace);
            const ttl = options.ttl || 3600; // Default 1 hour
            const serializedValue = options.serialize !== false ? this.serialize(value) : String(value);

            // Set in Redis
            if (this.redis.isHealthy()) {
                await this.redis.set(fullKey, serializedValue, ttl);
            }

            // Set in memory cache as fallback
            const memoryKey = fullKey;
            this.memoryCache.set(memoryKey, {
                value: options.serialize !== false ? value : serializedValue,
                expires: Date.now() + (ttl * 1000),
            });

            this.stats.sets++;
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Cache set error:', error);
            return false;
        }
    }

    async del(key: string, options: CacheOptions = {}): Promise<boolean> {
        try {
            const fullKey = this.getKey(key, options.namespace);

            // Delete from Redis
            if (this.redis.isHealthy()) {
                await this.redis.del(fullKey);
            }

            // Delete from memory cache
            const memoryKey = fullKey;
            this.memoryCache.delete(memoryKey);

            this.stats.deletes++;
            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Cache delete error:', error);
            return false;
        }
    }

    async exists(key: string, options: CacheOptions = {}): Promise<boolean> {
        try {
            const fullKey = this.getKey(key, options.namespace);

            // Check Redis first
            if (this.redis.isHealthy()) {
                const exists = await this.redis.exists(fullKey);
                if (exists > 0) {
                    return true;
                }
            }

            // Check memory cache
            const memoryKey = fullKey;
            const cached = this.memoryCache.get(memoryKey);
            if (cached && !this.isExpired(cached.expires)) {
                return true;
            }

            // Clean up expired memory cache
            if (cached && this.isExpired(cached.expires)) {
                this.memoryCache.delete(memoryKey);
            }

            return false;
        } catch (error) {
            this.stats.errors++;
            console.error('Cache exists error:', error);
            return false;
        }
    }

    async expire(key: string, ttl: number, options: CacheOptions = {}): Promise<boolean> {
        try {
            const fullKey = this.getKey(key, options.namespace);

            // Set expiry in Redis
            if (this.redis.isHealthy()) {
                await this.redis.expire(fullKey, ttl);
            }

            // Update memory cache expiry
            const memoryKey = fullKey;
            const cached = this.memoryCache.get(memoryKey);
            if (cached) {
                cached.expires = Date.now() + (ttl * 1000);
            }

            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Cache expire error:', error);
            return false;
        }
    }

    async ttl(key: string, options: CacheOptions = {}): Promise<number> {
        try {
            const fullKey = this.getKey(key, options.namespace);

            // Get TTL from Redis
            if (this.redis.isHealthy()) {
                const ttl = await this.redis.ttl(fullKey);
                if (ttl > 0) {
                    return ttl;
                }
            }

            // Get TTL from memory cache
            const memoryKey = fullKey;
            const cached = this.memoryCache.get(memoryKey);
            if (cached && !this.isExpired(cached.expires)) {
                return Math.ceil((cached.expires - Date.now()) / 1000);
            }

            return -1;
        } catch (error) {
            this.stats.errors++;
            console.error('Cache TTL error:', error);
            return -1;
        }
    }

    async clear(namespace?: string): Promise<boolean> {
        try {
            if (namespace) {
                // Clear specific namespace
                const pattern = `${namespace}:*`;

                // Clear from Redis
                if (this.redis.isHealthy()) {
                    const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          for (const key of keys) {
            await this.redis.del(key);
          }
        }
                }

                // Clear from memory cache
                for (const [key] of this.memoryCache) {
                    if (key.startsWith(`${namespace}:`)) {
                        this.memoryCache.delete(key);
                    }
                }
            } else {
                // Clear all
                if (this.redis.isHealthy()) {
                    await this.redis.flushdb();
                }
                this.memoryCache.clear();
            }

            return true;
        } catch (error) {
            this.stats.errors++;
            console.error('Cache clear error:', error);
            return false;
        }
    }

    getStats(): CacheStats {
        return { ...this.stats };
    }

    resetStats(): void {
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            errors: 0,
        };
    }

    // Clean up expired memory cache entries
    cleanup(): void {
      for (const [key, cached] of Array.from(this.memoryCache.entries())) {
        if (this.isExpired(cached.expires)) {
          this.memoryCache.delete(key);
        }
      }
    }
}

// Singleton cache service
let cacheService: CacheService | null = null;

export function getCacheService(redis?: RedisClient): CacheService {
    if (!cacheService) {
        if (!redis) {
            throw new Error('Redis client required for cache service');
        }
        cacheService = new CacheService(redis);
    }
    return cacheService;
}
