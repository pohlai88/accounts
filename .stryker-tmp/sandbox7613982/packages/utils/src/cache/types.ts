// @ts-nocheck
// Cache Types and Interfaces
export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  ttl: number; // default TTL in seconds
  keyPrefix: string;
  retryAttempts: number;
  retryDelay: number;
}

export interface CacheOptions {
  ttl?: number; // TTL in seconds
  tags?: string[]; // Cache tags for invalidation
  namespace?: string; // Namespace for key scoping
}

export interface CacheItem<T = unknown> {
  value: T;
  ttl: number;
  createdAt: number;
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

export interface CacheAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean>;
  del(key: string): Promise<boolean>;
  delPattern(pattern: string): Promise<number>;
  delByTags(tags: string[]): Promise<number>;
  exists(key: string): Promise<boolean>;
  ttl(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<boolean>;
  flush(): Promise<boolean>;
  stats(): Promise<CacheStats>;
  ping(): Promise<boolean>;
}
