/**
 * @aibos/cache - Redis Client Configuration
 *
 * Redis client setup with connection pooling and error handling
 */

import { Redis, RedisOptions } from "ioredis";

export interface CacheConfig {
  host: string;
  port: number;
  username?: string;
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
      username: config.username,
      password: config.password,
      db: config.db || 0,
      lazyConnect: config.lazyConnect || true,
      connectTimeout: config.connectTimeout || 10000,
      commandTimeout: config.commandTimeout || 5000,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      // Enable auto-pipelining for better performance (35-50% improvement)
      enableAutoPipelining: true,
      // Better error handling for debugging
      showFriendlyErrorStack: process.env.NODE_ENV === 'development',
      // Retry configuration
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
    };

    this.client = new Redis(redisOptions);

    // Event handlers
    this.client.on("connect", () => {
      this.isConnected = true;
      
    });

    this.client.on("ready", () => {
      this.isConnected = true;
      
    });

    this.client.on("error", error => {
      this.isConnected = false;
      console.error("Redis client error:", error);
    });

    this.client.on("close", () => {
      this.isConnected = false;
      
    });

    this.client.on("end", () => {
      this.isConnected = false;
      
    });
  }

  async connect(): Promise<void> {
    // ioredis connects automatically, but we can trigger it with ping
    try {
      await this.client.ping();
      this.isConnected = true;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected && (this.client.status === 'ready' || this.client.status === 'connecting');
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
  username: process.env.REDIS_USERNAME,
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

// Helper function to create Redis client from URL
export function createRedisClientFromUrl(url?: string): RedisClient {
  const redisUrl = url || process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error("Redis URL not provided. Set REDIS_URL environment variable or pass url parameter.");
  }

  // Parse Redis URL: redis://username:password@host:port/db
  const urlObj = new URL(redisUrl);

  const config: CacheConfig = {
    host: urlObj.hostname,
    port: parseInt(urlObj.port),
    username: urlObj.username || undefined,
    password: urlObj.password || undefined,
    db: urlObj.pathname ? parseInt(urlObj.pathname.slice(1)) : 0,
  };

  return new RedisClient(config);
}
