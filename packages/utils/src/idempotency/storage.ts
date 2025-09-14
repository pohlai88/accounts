// Idempotency Storage Implementations
import { IdempotencyKey, IdempotencyStorage } from './types';
import { CacheManager } from '../cache';

export class RedisIdempotencyStorage implements IdempotencyStorage {
    private cache: CacheManager;
    private keyPrefix: string;

    constructor(cache: CacheManager, keyPrefix = 'idempotency') {
        this.cache = cache;
        this.keyPrefix = keyPrefix;
    }

    async get(key: string): Promise<IdempotencyKey | null> {
        const fullKey = `${this.keyPrefix}:${key}`;
        return await this.cache.get<IdempotencyKey>(fullKey);
    }

    async set(key: string, value: IdempotencyKey): Promise<boolean> {
        const fullKey = `${this.keyPrefix}:${key}`;
        const ttl = Math.max(0, Math.floor((value.expiresAt - Date.now()) / 1000));
        return await this.cache.set(fullKey, value, { ttl });
    }

    async update(key: string, updates: Partial<IdempotencyKey>): Promise<boolean> {
        const existing = await this.get(key);
        if (!existing) {
            return false;
        }

        const updated = { ...existing, ...updates };
        return await this.set(key, updated);
    }

    async delete(key: string): Promise<boolean> {
        const fullKey = `${this.keyPrefix}:${key}`;
        return await this.cache.del(fullKey);
    }

    async cleanup(): Promise<number> {
        // Clean up expired keys
        const pattern = `${this.keyPrefix}:*`;
        return await this.cache.delPattern(pattern);
    }
}

export class MemoryIdempotencyStorage implements IdempotencyStorage {
    private storage = new Map<string, IdempotencyKey>();
    private keyPrefix: string;

    constructor(keyPrefix = 'idempotency') {
        this.keyPrefix = keyPrefix;

        // Start cleanup interval
        setInterval(() => {
            this.cleanup();
        }, 60000); // Clean up every minute
    }

    async get(key: string): Promise<IdempotencyKey | null> {
        const fullKey = `${this.keyPrefix}:${key}`;
        const item = this.storage.get(fullKey);

        if (!item) {
            return null;
        }

        // Check if expired
        if (Date.now() > item.expiresAt) {
            this.storage.delete(fullKey);
            return null;
        }

        return item;
    }

    async set(key: string, value: IdempotencyKey): Promise<boolean> {
        const fullKey = `${this.keyPrefix}:${key}`;
        this.storage.set(fullKey, value);
        return true;
    }

    async update(key: string, updates: Partial<IdempotencyKey>): Promise<boolean> {
        const existing = await this.get(key);
        if (!existing) {
            return false;
        }

        const updated = { ...existing, ...updates };
        return await this.set(key, updated);
    }

    async delete(key: string): Promise<boolean> {
        const fullKey = `${this.keyPrefix}:${key}`;
        return this.storage.delete(fullKey);
    }

    async cleanup(): Promise<number> {
        const now = Date.now();
        let cleanedCount = 0;

        for (const [key, item] of this.storage.entries()) {
            if (now > item.expiresAt) {
                this.storage.delete(key);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }
}
