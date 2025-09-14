// Cache Integration Tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createCacheManager, defaultCacheConfig } from '../../packages/utils/src/cache';

describe('Cache Integration', () => {
    let cacheManager: any;

    beforeAll(async () => {
        cacheManager = createCacheManager({
            ...defaultCacheConfig,
            host: 'memory' // Use memory cache for testing
        });
        await cacheManager.connect();
    });

    afterAll(async () => {
        await cacheManager.disconnect();
    });

    describe('Basic Operations', () => {
        it('should set and get values', async () => {
            const key = 'test-key';
            const value = { message: 'Hello, World!' };

            // Set value
            const setResult = await cacheManager.set(key, value);
            expect(setResult).toBe(true);

            // Get value
            const getResult = await cacheManager.get(key);
            expect(getResult).toEqual(value);
        });

        it('should handle TTL expiration', async () => {
            const key = 'ttl-test-key';
            const value = { message: 'TTL test' };

            // Set value with 1 second TTL
            await cacheManager.set(key, value, { ttl: 1 });

            // Should exist immediately
            let result = await cacheManager.get(key);
            expect(result).toEqual(value);

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should be null after expiration
            result = await cacheManager.get(key);
            expect(result).toBeNull();
        });

        it('should handle cache tags', async () => {
            const key1 = 'tagged-key-1';
            const key2 = 'tagged-key-2';
            const value1 = { message: 'Tagged 1' };
            const value2 = { message: 'Tagged 2' };

            // Set values with tags
            await cacheManager.set(key1, value1, { tags: ['test', 'group1'] });
            await cacheManager.set(key2, value2, { tags: ['test', 'group2'] });

            // Both should exist
            expect(await cacheManager.get(key1)).toEqual(value1);
            expect(await cacheManager.get(key2)).toEqual(value2);

            // Delete by tag
            const deletedCount = await cacheManager.delByTags(['group1']);
            expect(deletedCount).toBe(1);

            // First key should be gone, second should remain
            expect(await cacheManager.get(key1)).toBeNull();
            expect(await cacheManager.get(key2)).toEqual(value2);
        });
    });

    describe('Pattern Operations', () => {
        it('should delete by pattern', async () => {
            // Set multiple keys with pattern
            await cacheManager.set('test:key1', 'value1');
            await cacheManager.set('test:key2', 'value2');
            await cacheManager.set('other:key1', 'value3');

            // Delete by pattern
            const deletedCount = await cacheManager.delPattern('test:*');
            expect(deletedCount).toBe(2);

            // Test keys should be gone, other should remain
            expect(await cacheManager.get('test:key1')).toBeNull();
            expect(await cacheManager.get('test:key2')).toBeNull();
            expect(await cacheManager.get('other:key1')).toBe('value3');
        });
    });

    describe('Remember Function', () => {
        it('should cache function results', async () => {
            const key = 'function-test';
            let callCount = 0;

            const expensiveFunction = async () => {
                callCount++;
                return { result: 'expensive computation', callCount };
            };

            // First call should execute function
            const result1 = await cacheManager.remember(key, expensiveFunction);
            expect(result1.result).toBe('expensive computation');
            expect(result1.callCount).toBe(1);
            expect(callCount).toBe(1);

            // Second call should use cache
            const result2 = await cacheManager.remember(key, expensiveFunction);
            expect(result2.result).toBe('expensive computation');
            expect(result2.callCount).toBe(1); // Should be cached value
            expect(callCount).toBe(1); // Function should not be called again
        });

        it('should handle function errors', async () => {
            const key = 'error-function-test';
            let callCount = 0;

            const errorFunction = async () => {
                callCount++;
                throw new Error('Function error');
            };

            // Should throw error and not cache
            await expect(cacheManager.remember(key, errorFunction)).rejects.toThrow('Function error');
            expect(callCount).toBe(1);

            // Should not be cached
            const cached = await cacheManager.get(key);
            expect(cached).toBeNull();
        });
    });

    describe('Statistics', () => {
        it('should track cache statistics', async () => {
            // Clear cache first
            await cacheManager.flush();

            // Perform operations
            await cacheManager.set('stats:key1', 'value1');
            await cacheManager.set('stats:key2', 'value2');
            await cacheManager.get('stats:key1'); // Hit
            await cacheManager.get('stats:key3'); // Miss
            await cacheManager.del('stats:key1');

            const stats = await cacheManager.stats();

            expect(stats.sets).toBe(2);
            expect(stats.hits).toBe(1);
            expect(stats.misses).toBe(1);
            expect(stats.deletes).toBe(1);
            expect(stats.hitRate).toBe(0.5); // 1 hit out of 2 total requests
        });
    });
});
