// Idempotency Manager - Main idempotency interface
import {
  IdempotencyKey,
  IdempotencyOperationResult,
  IdempotencyConfig,
  IdempotencyOptions,
  IdempotencyStorage,
} from "./types";

export { IdempotencyOptions } from "./types";
import { RedisIdempotencyStorage } from "./storage";
import { MemoryIdempotencyStorage } from "./storage";
import { CacheManager } from "../cache";
import { createHash } from "crypto";

export class IdempotencyManager {
  private storage: IdempotencyStorage;
  private config: IdempotencyConfig;

  constructor(config: IdempotencyConfig, cacheManager?: CacheManager) {
    this.config = config;

    // Choose storage based on config
    if (config.storage === "redis" && cacheManager) {
      this.storage = new RedisIdempotencyStorage(cacheManager, config.keyPrefix);
    } else {
      this.storage = new MemoryIdempotencyStorage(config.keyPrefix);
    }
  }

  /**
   * Generate idempotency key from request
   */
  generateKey(userId: string, tenantId: string, operation: string, requestData: unknown): string {
    const requestHash = this.hashRequest(requestData);
    const keyData = `${userId}:${tenantId}:${operation}:${requestHash}`;
    return createHash("sha256").update(keyData).digest("hex");
  }

  /**
   * Execute operation with idempotency
   */
  async execute<T>(
    key: string,
    userId: string,
    tenantId: string,
    operation: string,
    requestData: unknown,
    operationFn: () => Promise<T>,
    options: IdempotencyOptions = {},
  ): Promise<IdempotencyOperationResult<T>> {
    const ttl = options.ttl || this.config.ttl;
    const maxRetries = options.maxRetries || 3;
    const retryAfter = options.retryAfter || this.config.retryAfter;
    const requestHash = this.hashRequest(requestData);

    // Check if key already exists
    const existing = await this.storage.get(key);

    if (existing) {
      // Validate request hash matches
      if (existing.requestHash !== requestHash) {
        throw new Error("Idempotency key exists with different request data");
      }

      // Check if operation is still pending
      if (existing.status === "pending") {
        // Check if we should retry
        if (existing.retryCount >= maxRetries) {
          return {
            isNew: false,
            key,
            status: "failed",
            error: "Maximum retries exceeded",
            retryAfter: retryAfter,
          };
        }

        // Check if enough time has passed for retry
        const timeSinceCreated = Date.now() - existing.createdAt;
        if (timeSinceCreated < retryAfter * 1000) {
          return {
            isNew: false,
            key,
            status: "pending",
            retryAfter: Math.ceil((retryAfter * 1000 - timeSinceCreated) / 1000),
          };
        }

        // Update retry count and try again
        await this.storage.update(key, {
          retryCount: existing.retryCount + 1,
        });
      } else {
        // Return existing result
        return {
          isNew: false,
          key,
          status: existing.status,
          response: existing.response as T | undefined,
          error: existing.error,
        };
      }
    }

    // Create new idempotency key
    const idempotencyKey: IdempotencyKey = {
      key,
      userId,
      tenantId,
      operation: options.operation || operation,
      status: "pending",
      requestHash,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttl * 1000,
      retryCount: 0,
      maxRetries,
    };

    // Store the key
    await this.storage.set(key, idempotencyKey);

    try {
      // Execute the operation
      const result = await operationFn();

      // Update with success result
      await this.storage.update(key, {
        status: "completed",
        response: result,
      });

      return {
        isNew: true,
        key,
        status: "completed",
        response: result,
      };
    } catch (error) {
      // Update with error result
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      await this.storage.update(key, {
        status: "failed",
        error: errorMessage,
      });

      return {
        isNew: true,
        key,
        status: "failed",
        error: errorMessage,
      };
    }
  }

  /**
   * Get idempotency key status
   */
  async getStatus(key: string): Promise<IdempotencyKey | null> {
    return await this.storage.get(key);
  }

  /**
   * Delete idempotency key
   */
  async delete(key: string): Promise<boolean> {
    return await this.storage.delete(key);
  }

  /**
   * Clean up expired keys
   */
  async cleanup(): Promise<number> {
    return await this.storage.cleanup();
  }

  /**
   * Hash request data for comparison
   */
  private hashRequest(requestData: unknown): string {
    const normalized = JSON.stringify(
      requestData,
      Object.keys(requestData as Record<string, unknown>).sort(),
    );
    return createHash("sha256").update(normalized).digest("hex");
  }

  /**
   * Get configuration
   */
  getConfig(): IdempotencyConfig {
    return { ...this.config };
  }
}

/**
 * Create a new idempotency manager
 */
export function createIdempotencyManager(
  config: IdempotencyConfig,
  cacheManager?: CacheManager,
): IdempotencyManager {
  return new IdempotencyManager(config, cacheManager);
}

/**
 * Default idempotency configuration
 */
export const defaultIdempotencyConfig: IdempotencyConfig = {
  ttl: parseInt(process.env.IDEMPOTENCY_TTL || "3600"), // 1 hour
  keyPrefix: process.env.IDEMPOTENCY_KEY_PREFIX || "idempotency",
  storage: (process.env.IDEMPOTENCY_STORAGE as "redis" | "memory" | "database") || "memory",
  retryAfter: parseInt(process.env.IDEMPOTENCY_RETRY_AFTER || "60"), // 1 minute
};
