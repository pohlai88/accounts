/**
 * @aibos/cache - Idempotency System
 *
 * Idempotency key system for preventing duplicate operations
 */

import { CacheService } from "./cache";
import { createHash } from "crypto";

export interface IdempotencyOptions {
  ttl?: number; // Time to live in seconds (default: 24 hours)
  namespace?: string; // Cache namespace
}

export interface IdempotencyResult<T = unknown> {
  isDuplicate: boolean;
  result?: T;
  key: string;
}

export class IdempotencyService {
  private cache: CacheService;
  private defaultTtl: number;

  constructor(cache: CacheService, defaultTtl: number = 86400) {
    // 24 hours
    this.cache = cache;
    this.defaultTtl = defaultTtl;
  }

  private generateKey(key: string, tenantId?: string, userId?: string): string {
    const components = [key];
    if (tenantId) components.push(tenantId);
    if (userId) components.push(userId);

    const combined = components.join(":");
    return createHash("sha256").update(combined).digest("hex");
  }

  async checkKey(key: string, options: IdempotencyOptions = {}): Promise<IdempotencyResult> {
    const fullKey = this.generateKey(key);
    const ttl = options.ttl || this.defaultTtl;
    const namespace = options.namespace || "idempotency";

    try {
      const cached = await this.cache.get(fullKey, {
        namespace,
        ttl,
        serialize: true,
      });

      if (cached) {
        return {
          isDuplicate: true,
          result: cached,
          key: fullKey,
        };
      }

      return {
        isDuplicate: false,
        key: fullKey,
      };
    } catch (error) {
      console.error("Idempotency check error:", error);
      return {
        isDuplicate: false,
        key: fullKey,
      };
    }
  }

  async storeResult<T = unknown>(
    key: string,
    result: T,
    options: IdempotencyOptions = {},
  ): Promise<boolean> {
    const fullKey = this.generateKey(key);
    const ttl = options.ttl || this.defaultTtl;
    const namespace = options.namespace || "idempotency";

    try {
      return await this.cache.set(fullKey, result, {
        namespace,
        ttl,
        serialize: true,
      });
    } catch (error) {
      console.error("Idempotency store error:", error);
      return false;
    }
  }

  async executeWithIdempotency<T = unknown>(
    key: string,
    operation: () => Promise<T>,
    options: IdempotencyOptions = {},
  ): Promise<IdempotencyResult<T>> {
    const checkResult = await this.checkKey(key, options);

    if (checkResult.isDuplicate) {
      return checkResult as IdempotencyResult<T>;
    }

    try {
      const result = await operation();
      await this.storeResult(key, result, options);

      return {
        isDuplicate: false,
        result,
        key: checkResult.key,
      };
    } catch (error) {
      console.error("Idempotency operation error:", error);
      throw error;
    }
  }

  async invalidateKey(key: string, options: IdempotencyOptions = {}): Promise<boolean> {
    const fullKey = this.generateKey(key);
    const namespace = options.namespace || "idempotency";

    try {
      return await this.cache.del(fullKey, { namespace });
    } catch (error) {
      console.error("Idempotency invalidate error:", error);
      return false;
    }
  }

  async invalidateNamespace(namespace: string): Promise<boolean> {
    try {
      return await this.cache.clear(namespace);
    } catch (error) {
      console.error("Idempotency namespace invalidate error:", error);
      return false;
    }
  }

  // Generate idempotency key from request data
  static generateRequestKey(
    method: string,
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): string {
    const components = [method.toUpperCase(), path];

    if (body) {
      const bodyStr = typeof body === "string" ? body : JSON.stringify(body);
      components.push(bodyStr);
    }

    if (headers) {
      const relevantHeaders = ["content-type", "authorization", "x-tenant-id"];
      const headerStr = relevantHeaders
        .filter(h => headers[h])
        .map(h => `${h}:${headers[h]}`)
        .join("|");
      if (headerStr) {
        components.push(headerStr);
      }
    }

    return createHash("sha256").update(components.join("|")).digest("hex");
  }
}

// Singleton idempotency service
let idempotencyService: IdempotencyService | null = null;

export function getIdempotencyService(cache?: CacheService): IdempotencyService {
  if (!idempotencyService) {
    if (!cache) {
      throw new Error("Cache service required for idempotency service");
    }
    idempotencyService = new IdempotencyService(cache);
  }
  return idempotencyService;
}
