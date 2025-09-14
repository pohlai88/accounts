/**
 * @aibos/cache - Cache Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RedisClient } from './redis';
import { CacheService } from './cache';

// Mock Redis client
const mockRedis = {
    isHealthy: vi.fn(() => true),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    exists: vi.fn(),
    expire: vi.fn(),
    ttl: vi.fn(),
    keys: vi.fn(),
    flushdb: vi.fn(),
};

describe('CacheService', () => {
    let cache: CacheService;
    let redis: RedisClient;

    beforeEach(() => {
        vi.clearAllMocks();
        redis = mockRedis as unknown;
        cache = new CacheService(redis);
    });

    describe('Basic Operations', () => {
        it('should get value from Redis', async () => {
            mockRedis.get.mockResolvedValue('{"test": "value"}');

            const result = await cache.get('test-key');

            expect(result).toEqual({ test: 'value' });
            expect(mockRedis.get).toHaveBeenCalledWith('test-key');
        });

        it('should return null for non-existent key', async () => {
            mockRedis.get.mockResolvedValue(null);

            const result = await cache.get('non-existent');

            expect(result).toBeNull();
        });

        it('should set value in Redis', async () => {
            mockRedis.set.mockResolvedValue('OK');

            const result = await cache.set('test-key', { test: 'value' });

            expect(result).toBe(true);
            expect(mockRedis.set).toHaveBeenCalledWith('test-key', '{"test":"value"}', 3600);
        });

        it('should delete key from Redis', async () => {
            mockRedis.del.mockResolvedValue(1);

            const result = await cache.del('test-key');

            expect(result).toBe(true);
            expect(mockRedis.del).toHaveBeenCalledWith('test-key');
        });
    });

    describe('Namespace Support', () => {
        it('should use namespace in keys', async () => {
            mockRedis.get.mockResolvedValue('{"test": "value"}');

            await cache.get('test-key', { namespace: 'tenant-1' });

            expect(mockRedis.get).toHaveBeenCalledWith('tenant-1:test-key');
        });
    });

    describe('Statistics', () => {
        it('should track cache hits and misses', async () => {
            mockRedis.get.mockResolvedValue('{"test": "value"}');

            await cache.get('test-key');
            await cache.get('non-existent');

            const stats = cache.getStats();
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
        });
    });

    describe('Error Handling', () => {
        it('should handle Redis errors gracefully', async () => {
            mockRedis.isHealthy.mockReturnValue(false);
            mockRedis.get.mockRejectedValue(new Error('Redis error'));

            const result = await cache.get('test-key');

            expect(result).toBeNull();
        });
    });
});
