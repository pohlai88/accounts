/**
 * @aibos/api-gateway - Rate Limiting
 *
 * Tenant-based rate limiting with Redis backend
 */

import { Request, Response, NextFunction } from "express";
import { CacheService } from "@aibos/cache";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

export interface RateLimitStats {
  total: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class RateLimitService {
  private cache: CacheService;
  private config: RateLimitConfig;

  constructor(cache: CacheService, config: RateLimitConfig) {
    this.cache = cache;
    this.config = config;
  }

  private generateKey(req: Request): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(req);
    }

    // Default key generation: tenant + user + IP
    const tenantId = (req.headers["x-tenant-id"] as string) || "anonymous";
    const userId = (req.headers["x-user-id"] as string) || "anonymous";
    const ip = req.ip || req.connection.remoteAddress || "unknown";

    return `rate-limit:${tenantId}:${userId}:${ip}`;
  }

  private async getCurrentCount(key: string): Promise<{ count: number; resetTime: number }> {
    const cached = await this.cache.get<{ count: number; resetTime: number }>(key, {
      namespace: "rate-limit",
      ttl: Math.ceil(this.config.windowMs / 1000),
    });

    if (cached) {
      return cached;
    }

    const resetTime = Date.now() + this.config.windowMs;
    return { count: 0, resetTime };
  }

  private async incrementCount(key: string): Promise<{ count: number; resetTime: number }> {
    const current = await this.getCurrentCount(key);
    const newCount = current.count + 1;
    const resetTime = current.resetTime;

    await this.cache.set(
      key,
      { count: newCount, resetTime },
      {
        namespace: "rate-limit",
        ttl: Math.ceil(this.config.windowMs / 1000),
      },
    );

    return { count: newCount, resetTime };
  }

  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const key = this.generateKey(req);
        const { count, resetTime } = await this.incrementCount(key);

        const remaining = Math.max(0, this.config.maxRequests - count);
        const retryAfter =
          count > this.config.maxRequests ? Math.ceil((resetTime - Date.now()) / 1000) : undefined;

        // Set rate limit headers
        res.set({
          "X-RateLimit-Limit": this.config.maxRequests.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": new Date(resetTime).toISOString(),
          ...(retryAfter && { "Retry-After": retryAfter.toString() }),
        });

        // Check if limit exceeded
        if (count > this.config.maxRequests) {
          if (this.config.onLimitReached) {
            this.config.onLimitReached(req, res);
          }

          return res.status(429).json({
            error: "Too Many Requests",
            message: "Rate limit exceeded",
            retryAfter,
            limit: this.config.maxRequests,
            remaining: 0,
            resetTime: new Date(resetTime).toISOString(),
          });
        }

        next();
      } catch (error) {
        // Log error to monitoring service instead of console
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error("Rate limit error:", error);
        }
        // Fail open - allow request if rate limiting fails
        next();
      }
    };
  }

  async getStats(req: Request): Promise<RateLimitStats> {
    const key = this.generateKey(req);
    const { count, resetTime } = await this.getCurrentCount(key);

    return {
      total: this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - count),
      resetTime,
      retryAfter:
        count > this.config.maxRequests ? Math.ceil((resetTime - Date.now()) / 1000) : undefined,
    };
  }
}

// Predefined rate limit configurations
export const RATE_LIMIT_CONFIGS = {
  // Strict limits for sensitive operations
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
  },

  // Standard limits for regular API usage
  STANDARD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  },

  // Relaxed limits for public endpoints
  RELAXED: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
  },

  // Per-minute limits for high-frequency operations
  PER_MINUTE: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,
  },

  // Per-hour limits for bulk operations
  PER_HOUR: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
  },
} as const;

// Tenant-specific rate limiting
export class TenantRateLimitService extends RateLimitService {
  constructor(cache: CacheService, baseConfig: RateLimitConfig) {
    super(cache, {
      ...baseConfig,
      keyGenerator: (req: Request) => {
        const tenantId = (req.headers["x-tenant-id"] as string) || "anonymous";
        const endpoint = req.path;
        const method = req.method;
        return `tenant-rate-limit:${tenantId}:${method}:${endpoint}`;
      },
    });
  }
}

// User-specific rate limiting
export class UserRateLimitService extends RateLimitService {
  constructor(cache: CacheService, baseConfig: RateLimitConfig) {
    super(cache, {
      ...baseConfig,
      keyGenerator: (req: Request) => {
        const tenantId = (req.headers["x-tenant-id"] as string) || "anonymous";
        const userId = (req.headers["x-user-id"] as string) || "anonymous";
        const endpoint = req.path;
        const method = req.method;
        return `user-rate-limit:${tenantId}:${userId}:${method}:${endpoint}`;
      },
    });
  }
}
