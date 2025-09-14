/**
 * @aibos/cache - Redis Client Configuration
 *
 * Redis client setup with connection pooling and error handling
 */

import { Redis, RedisOptions } from "ioredis";

export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
  connectTimeout?: number;
  commandTimeout?: number;
}

export class RedisClient {
  private client: Redis;
  private isConnected: boolean = false;

  constructor(config: CacheConfig) {
    const redisOptions: RedisOptions = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db || 0,
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      lazyConnect: config.lazyConnect || true,
      connectTimeout: config.connectTimeout || 10000,
      commandTimeout: config.commandTimeout || 5000,
    };

    this.client = new Redis(redisOptions);

    // Event handlers
    this.client.on("connect", () => {
      this.isConnected = true;
      console.log("Redis client connected");
    });

    this.client.on("error", error => {
      this.isConnected = false;
      console.error("Redis client error:", error);
    });

    this.client.on("close", () => {
      this.isConnected = false;
      console.log("Redis client disconnected");
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<"OK"> {
    if (ttlSeconds) {
      return await this.client.setex(key, ttlSeconds, value);
    }
    return await this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<number> {
    return await this.client.expire(key, ttlSeconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  async flushdb(): Promise<"OK"> {
    return await this.client.flushdb();
  }

  async info(): Promise<string> {
    return await this.client.info();
  }
}

// Default configuration
export const defaultCacheConfig: CacheConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || "0"),
};

// Singleton instance
let redisClient: RedisClient | null = null;

export function getRedisClient(config?: CacheConfig): RedisClient {
  if (!redisClient) {
    redisClient = new RedisClient(config || defaultCacheConfig);
  }
  return redisClient;
}

export async function initializeCache(config?: CacheConfig): Promise<RedisClient> {
  const client = getRedisClient(config);
  await client.connect();
  return client;
}
