// Cache Middleware for API Gateway
import { ApiRequest, GatewayResponse, Middleware } from "./types";
import { CacheManager, CacheOptions } from "../cache";

export function createCacheMiddleware(cacheManager: CacheManager): Middleware {
  return {
    name: "cache",
    execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
      // Only cache GET requests
      if (req.method !== "GET") {
        return await next();
      }

      // Generate cache key
      const cacheKey = generateCacheKey(req);

      try {
        // Try to get from cache
        const cached = await cacheManager.get<GatewayResponse>(cacheKey);
        if (cached) {
          // Add cache hit header
          cached.headers["X-Cache"] = "HIT";
          cached.headers["X-Cache-Key"] = cacheKey;
          return cached;
        }

        // Execute next middleware/handler
        const response = await next();

        // Only cache successful responses
        if (response.status >= 200 && response.status < 300) {
          // Add cache miss header
          response.headers["X-Cache"] = "MISS";
          response.headers["X-Cache-Key"] = cacheKey;

          // Cache the response
          const cacheOptions: CacheOptions = {
            ttl: getCacheTTL(req.path),
            tags: getCacheTags(req.path),
          };

          await cacheManager.set(cacheKey, response, cacheOptions);
        }

        return response;
      } catch (error) {
        console.error("Cache middleware error:", error);
        // If cache fails, continue without caching
        return await next();
      }
    },
  };
}

/**
 * Generate cache key from request
 */
function generateCacheKey(req: ApiRequest): string {
  const path = req.path;
  const query = Object.keys(req.query)
    .sort()
    .map(key => `${key}=${req.query[key]}`)
    .join("&");

  const user = req.user?.id || "anonymous";
  const tenant = req.user?.tenantId || "default";

  return `api:${tenant}:${user}:${path}${query ? `?${query}` : ""}`;
}

/**
 * Get cache TTL based on path
 */
function getCacheTTL(path: string): number {
  // Different TTL for different endpoints
  if (path.startsWith("/api/health")) {
    return 30; // 30 seconds
  }

  if (path.startsWith("/api/ping")) {
    return 10; // 10 seconds
  }

  if (path.startsWith("/api/invoices") || path.startsWith("/api/customers")) {
    return 300; // 5 minutes
  }

  if (path.startsWith("/api/journals") || path.startsWith("/api/accounts")) {
    return 600; // 10 minutes
  }

  // Default TTL
  return 60; // 1 minute
}

/**
 * Get cache tags based on path
 */
function getCacheTags(path: string): string[] {
  const tags: string[] = [];

  if (path.startsWith("/api/invoices")) {
    tags.push("invoices");
  }

  if (path.startsWith("/api/customers")) {
    tags.push("customers");
  }

  if (path.startsWith("/api/journals")) {
    tags.push("journals");
  }

  if (path.startsWith("/api/accounts")) {
    tags.push("accounts");
  }

  // Add general API tag
  tags.push("api");

  return tags;
}

/**
 * Cache invalidation middleware
 */
export function createCacheInvalidationMiddleware(cacheManager: CacheManager): Middleware {
  return {
    name: "cacheInvalidation",
    execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
      // Execute the request first
      const response = await next();

      // Only invalidate on successful mutations
      if (response.status >= 200 && response.status < 300) {
        try {
          // Invalidate related cache entries
          await invalidateRelatedCache(req, cacheManager);
        } catch (error) {
          console.error("Cache invalidation error:", error);
          // Don't fail the request if cache invalidation fails
        }
      }

      return response;
    },
  };
}

/**
 * Invalidate related cache entries
 */
async function invalidateRelatedCache(req: ApiRequest, cacheManager: CacheManager): Promise<void> {
  const path = req.path;
  const method = req.method;

  // Only invalidate on mutations
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return;
  }

  const tags: string[] = [];

  // Determine which tags to invalidate based on the endpoint
  if (path.startsWith("/api/invoices")) {
    tags.push("invoices");
  }

  if (path.startsWith("/api/customers")) {
    tags.push("customers");
  }

  if (path.startsWith("/api/journals")) {
    tags.push("journals");
  }

  if (path.startsWith("/api/accounts")) {
    tags.push("accounts");
  }

  // Always invalidate general API cache
  tags.push("api");

  if (tags.length > 0) {
    await cacheManager.invalidateByTags(tags);
  }
}
