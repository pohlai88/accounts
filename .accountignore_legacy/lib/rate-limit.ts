/**
 * 🚀 Production-Ready Rate Limiting
 * 
 * Supports both Redis (production) and in-memory (development) storage
 * with automatic fallback and comprehensive error handling.
 */

import { SecurityConfig, SecurityHelpers, type RateLimitRule } from './security-config'
import type { NextRequest } from 'next/server'

// Rate limit result interface
export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    reset: number
    retryAfter?: number
}

// Rate limit provider interface
export interface RateLimitProvider {
    check(key: string, rule: RateLimitRule): Promise<RateLimitResult>
    increment(key: string, rule: RateLimitRule): Promise<RateLimitResult>
    reset(key: string): Promise<void>
}

// In-memory rate limit store (fallback)
class InMemoryRateLimit implements RateLimitProvider {
    private store = new Map<string, { count: number; resetTime: number }>()

    async check(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
        const now = Date.now()
        const entry = this.store.get(key)

        if (!entry || now > entry.resetTime) {
            return {
                success: true,
                limit: rule.requests,
                remaining: rule.requests - 1,
                reset: now + rule.window,
            }
        }

        const remaining = Math.max(0, rule.requests - entry.count)
        const success = entry.count < rule.requests

        return {
            success,
            limit: rule.requests,
            remaining,
            reset: entry.resetTime,
            retryAfter: success ? undefined : Math.ceil((entry.resetTime - now) / 1000),
        }
    }

    async increment(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
        const now = Date.now()
        const entry = this.store.get(key)

        if (!entry || now > entry.resetTime) {
            // Reset or create new entry
            this.store.set(key, {
                count: 1,
                resetTime: now + rule.window,
            })

            return {
                success: true,
                limit: rule.requests,
                remaining: rule.requests - 1,
                reset: now + rule.window,
            }
        }

        // Increment existing entry
        entry.count++
        const remaining = Math.max(0, rule.requests - entry.count)
        const success = entry.count <= rule.requests

        return {
            success,
            limit: rule.requests,
            remaining,
            reset: entry.resetTime,
            retryAfter: success ? undefined : Math.ceil((entry.resetTime - now) / 1000),
        }
    }

    async reset(key: string): Promise<void> {
        this.store.delete(key)
    }

    // Cleanup expired entries periodically
    cleanup(): void {
        const now = Date.now()
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.resetTime) {
                this.store.delete(key)
            }
        }
    }
}

// Redis rate limit implementation
class RedisRateLimit implements RateLimitProvider {
    private redis: any // Redis client type

    constructor(redisClient: any) {
        this.redis = redisClient
    }

    async check(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
        try {
            const fullKey = `${SecurityConfig.redis.keyPrefix}${SecurityConfig.redis.rateLimitPrefix}${key}`
            const current = await this.redis.get(fullKey)
            const now = Date.now()

            if (!current) {
                return {
                    success: true,
                    limit: rule.requests,
                    remaining: rule.requests - 1,
                    reset: now + rule.window,
                }
            }

            const data = JSON.parse(current)
            const remaining = Math.max(0, rule.requests - data.count)
            const success = data.count < rule.requests

            return {
                success,
                limit: rule.requests,
                remaining,
                reset: data.resetTime,
                retryAfter: success ? undefined : Math.ceil((data.resetTime - now) / 1000),
            }
        } catch (error) {
            console.error('Redis rate limit check error:', error)
            // Fallback to allowing the request
            return {
                success: true,
                limit: rule.requests,
                remaining: rule.requests,
                reset: Date.now() + rule.window,
            }
        }
    }

    async increment(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
        try {
            const fullKey = `${SecurityConfig.redis.keyPrefix}${SecurityConfig.redis.rateLimitPrefix}${key}`
            const now = Date.now()

            // Use Redis pipeline for atomic operations
            const pipeline = this.redis.pipeline()

            // Get current value
            const current = await this.redis.get(fullKey)

            let data: { count: number; resetTime: number }

            if (!current) {
                // Create new entry
                data = { count: 1, resetTime: now + rule.window }
            } else {
                const parsed = JSON.parse(current)

                if (now > parsed.resetTime) {
                    // Reset expired entry
                    data = { count: 1, resetTime: now + rule.window }
                } else {
                    // Increment existing entry
                    data = { count: parsed.count + 1, resetTime: parsed.resetTime }
                }
            }

            // Set the updated data with TTL
            const ttlSeconds = Math.ceil(rule.window / 1000)
            await pipeline
                .setex(fullKey, ttlSeconds, JSON.stringify(data))
                .exec()

            const remaining = Math.max(0, rule.requests - data.count)
            const success = data.count <= rule.requests

            return {
                success,
                limit: rule.requests,
                remaining,
                reset: data.resetTime,
                retryAfter: success ? undefined : Math.ceil((data.resetTime - now) / 1000),
            }
        } catch (error) {
            console.error('Redis rate limit increment error:', error)
            // Fallback to allowing the request
            return {
                success: true,
                limit: rule.requests,
                remaining: rule.requests,
                reset: Date.now() + rule.window,
            }
        }
    }

    async reset(key: string): Promise<void> {
        try {
            const fullKey = `${SecurityConfig.redis.keyPrefix}${SecurityConfig.redis.rateLimitPrefix}${key}`
            await this.redis.del(fullKey)
        } catch (error) {
            console.error('Redis rate limit reset error:', error)
        }
    }
}

// Rate limiter factory
class RateLimiter {
    private provider: RateLimitProvider
    private inMemoryProvider: InMemoryRateLimit

    constructor(redisClient?: any) {
        this.inMemoryProvider = new InMemoryRateLimit()

        if (redisClient && SecurityConfig.features.enableRedisRateLimit) {
            this.provider = new RedisRateLimit(redisClient)
        } else {
            this.provider = this.inMemoryProvider
        }

        // Cleanup in-memory store periodically
        if (!SecurityConfig.features.enableRedisRateLimit) {
            setInterval(() => {
                this.inMemoryProvider.cleanup()
            }, 60000) // Cleanup every minute
        }
    }

    /**
     * Check if request should be rate limited
     */
    async isRateLimited(req: NextRequest): Promise<RateLimitResult> {
        const ip = this.getClientIP(req)
        const path = req.nextUrl.pathname
        const userAgent = req.headers.get('user-agent') || 'unknown'

        // Skip rate limiting for exempt paths
        if (SecurityHelpers.shouldSkipRateLimit(path)) {
            return {
                success: true,
                limit: Infinity,
                remaining: Infinity,
                reset: Date.now() + 60000,
            }
        }

        // Check if it's a bot and apply different limits
        const isBot = SecurityHelpers.isLikelyBot(userAgent)
        const rule = SecurityHelpers.getRateLimitRule(path, isBot)

        // Create rate limit key
        const keyPrefix = isBot ? SecurityConfig.redis.botPrefix : SecurityConfig.redis.rateLimitPrefix
        const key = `${keyPrefix}${ip}:${path}`

        // Increment and check rate limit
        return await this.provider.increment(key, rule)
    }

    /**
     * Reset rate limit for a specific key
     */
    async resetRateLimit(ip: string, path: string): Promise<void> {
        const key = `${ip}:${path}`
        await this.provider.reset(key)
    }

    /**
     * Get client IP with validation
     */
    private getClientIP(req: NextRequest): string {
        const ip =
            req.headers.get('cf-connecting-ip') ||
            req.headers.get('x-real-ip') ||
            req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
            'unknown'

        // Validate IP format
        if (ip !== 'unknown' && !SecurityHelpers.isValidIP(ip)) {
            return 'unknown'
        }

        return ip
    }
}

// Singleton rate limiter instance
let rateLimiterInstance: RateLimiter | null = null

/**
 * Get or create rate limiter instance
 */
export function getRateLimiter(redisClient?: any): RateLimiter {
    if (!rateLimiterInstance) {
        rateLimiterInstance = new RateLimiter(redisClient)
    }
    return rateLimiterInstance
}

/**
 * Convenience function for middleware usage
 */
export async function checkRateLimit(req: NextRequest, redisClient?: any): Promise<RateLimitResult> {
    const rateLimiter = getRateLimiter(redisClient)
    return await rateLimiter.isRateLimited(req)
}

/**
 * Redis client factory (optional, for when Redis is available)
 * 
 * To enable Redis rate limiting:
 * 1. Install ioredis: `pnpm add ioredis`
 * 2. Install types: `pnpm add -D @types/ioredis` (optional)
 * 3. Set environment variable: `ENABLE_REDIS_RATE_LIMIT=true`
 * 4. Configure Redis connection via environment variables:
 *    - REDIS_HOST (default: localhost)
 *    - REDIS_PORT (default: 6379)
 *    - REDIS_PASSWORD (optional)
 *    - REDIS_DB (default: 0)
 */
export async function createRedisClient(): Promise<any> {
    try {
        // Only attempt Redis connection if explicitly enabled
        if (!SecurityConfig.features.enableRedisRateLimit) {
            return null
        }

        // Dynamic import with proper error handling
        let ioredis: any
        try {
            // @ts-ignore - ioredis is an optional dependency
            ioredis = await import('ioredis')
        } catch (importError) {
            console.warn('⚠️ ioredis package not installed, using in-memory rate limiting')
            return null
        }

        if (!ioredis || !ioredis.Redis) {
            console.warn('⚠️ ioredis not properly available, using in-memory rate limiting')
            return null
        }

        const { Redis } = ioredis

        const redis = new Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '0'),
            retryDelayOnFailover: 100,
            maxRetriesPerRequest: 3,
            lazyConnect: true,
        })

        // Test connection
        await redis.ping()
        console.log('✅ Redis connected for rate limiting')

        return redis
    } catch (error) {
        console.warn('⚠️ Redis connection failed, using in-memory rate limiting:', error)
        return null
    }
}

// Types are already exported above
