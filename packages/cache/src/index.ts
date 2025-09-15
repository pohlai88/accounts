/**
 * @aibos/cache - Cache Package Exports
 *
 * Redis-based caching system with idempotency support
 * Namespaced to avoid conflicts with @aibos/utils cache
 */

// ============================================================================
// REDIS CONNECTION & CONFIGURATION
// ============================================================================

export * from "./redis";

// Re-export commonly used types and functions
export { RedisClient, getRedisClient, initializeCache, defaultCacheConfig } from "./redis";

// ============================================================================
// CACHE SERVICE
// ============================================================================

export * from "./cache";

export { CacheService, getCacheService, type CacheOptions, type CacheStats } from "./cache";

// ============================================================================
// CACHE FACTORY
// ============================================================================

export * from "./cache-factory";

export { CacheFactory } from "./cache-factory";

// ============================================================================
// IDEMPOTENCY SERVICE
// ============================================================================

export * from "./idempotency";

export {
  IdempotencyService,
  getIdempotencyService,
  type IdempotencyOptions,
  type IdempotencyResult,
} from "./idempotency";

// ============================================================================
// COMPATIBILITY LAYER (DEPRECATED)
// ============================================================================

// @deprecated Use CacheService from ./cache instead
export { AdvancedCacheManager } from "./compat/AdvancedCacheManager";
