import { NextRequest, NextResponse } from 'next/server';
import { AdvancedCacheManager } from '@aibos/cache';
import { createHash } from 'crypto';

export interface CacheMiddlewareConfig {
    enabled: boolean;
    defaultTTL: number;
    cacheableMethods: string[];
    cacheableRoutes: string[];
    excludeHeaders: string[];
    tenantHeader: string;
}

export class CacheMiddleware {
    private cacheManager: AdvancedCacheManager;
    private config: CacheMiddlewareConfig;

    constructor(cacheManager: AdvancedCacheManager, config: Partial<CacheMiddlewareConfig> = {}) {
        this.cacheManager = cacheManager;
        this.config = {
            enabled: true,
            defaultTTL: 300, // 5 minutes
            cacheableMethods: ['GET'],
            cacheableRoutes: ['/api/rules', '/api/tenants', '/api/users'],
            excludeHeaders: ['authorization', 'x-request-id', 'x-trace-id'],
            tenantHeader: 'x-tenant-id',
            ...config
        };
    }

    /**
     * Generate cache key from request
     */
    private generateCacheKey(req: NextRequest, tenantId: string): string {
        const url = new URL(req.url);
        const path = url.pathname;
        const query = url.searchParams.toString();
        const method = req.method;

        // Create hash of relevant headers (excluding auth headers)
        const relevantHeaders = Object.fromEntries(
            Object.entries(req.headers).filter(([key]) =>
                !this.config.excludeHeaders.includes(key.toLowerCase())
            )
        );
        const headersHash = createHash('sha256')
            .update(JSON.stringify(relevantHeaders))
            .digest('hex')
            .substring(0, 8);

        return `${method}:${path}:${query}:${headersHash}`;
    }

    /**
     * Check if request should be cached
     */
    private shouldCache(req: NextRequest): boolean {
        if (!this.config.enabled) return false;
        if (!this.config.cacheableMethods.includes(req.method)) return false;

        const url = new URL(req.url);
        return this.config.cacheableRoutes.some(route =>
            url.pathname.startsWith(route)
        );
    }

    /**
     * Get cached response
     */
    async getCachedResponse(req: NextRequest, tenantId: string): Promise<NextResponse | null> {
        if (!this.shouldCache(req)) return null;

        try {
            const cacheKey = this.generateCacheKey(req, tenantId);
            const cachedData = await this.cacheManager.get<{
                status: number;
                headers: Record<string, string>;
                body: unknown;
                timestamp: number;
            }>(tenantId, cacheKey);

            if (!cachedData) return null;

            // Check if cache is still valid (additional TTL check)
            const now = Date.now();
            const cacheAge = now - cachedData.timestamp;
            const maxAge = this.config.defaultTTL * 1000;

            if (cacheAge > maxAge) {
                // Cache expired, delete it
                await this.cacheManager.delete(tenantId, cacheKey);
                return null;
            }

            // Return cached response
            const response = NextResponse.json(cachedData.body, {
                status: cachedData.status
            });

            // Restore headers
            Object.entries(cachedData.headers).forEach(([key, value]) => {
                response.headers.set(key, value);
            });

            // Add cache headers
            response.headers.set('X-Cache', 'HIT');
            response.headers.set('X-Cache-Age', Math.floor(cacheAge / 1000).toString());

            return response;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    /**
     * Cache response
     */
    async cacheResponse(
        req: NextRequest,
        res: NextResponse,
        tenantId: string,
        ttl?: number
    ): Promise<void> {
        if (!this.shouldCache(req)) return;
        if (res.status >= 400) return; // Don't cache error responses

        try {
            const cacheKey = this.generateCacheKey(req, tenantId);
            const body = await res.clone().json().catch(() => null);

            if (!body) return;

            const cacheData = {
                status: res.status,
                headers: Object.fromEntries(res.headers.entries()),
                body,
                timestamp: Date.now()
            };

            await this.cacheManager.set(
                tenantId,
                cacheKey,
                cacheData,
                ttl || this.config.defaultTTL
            );
        } catch (error) {
            console.error('Cache set error:', error);
        }
    }

    /**
     * Invalidate cache for tenant
     */
    async invalidateTenantCache(tenantId: string, pattern?: string): Promise<number> {
        try {
            const searchPattern = pattern || '*';
            return await this.cacheManager.invalidatePattern(tenantId, searchPattern);
        } catch (error) {
            console.error('Cache invalidation error:', error);
            return 0;
        }
    }

    /**
     * Invalidate specific route cache
     */
    async invalidateRouteCache(tenantId: string, route: string): Promise<number> {
        try {
            const pattern = `*:${route}:*`;
            return await this.cacheManager.invalidatePattern(tenantId, pattern);
        } catch (error) {
            console.error('Route cache invalidation error:', error);
            return 0;
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.cacheManager.getStats();
    }

    /**
     * Health check
     */
    async healthCheck() {
        return await this.cacheManager.healthCheck();
    }
}

// Middleware factory
export function createCacheMiddleware(
    cacheManager: AdvancedCacheManager,
    config?: Partial<CacheMiddlewareConfig>
) {
    return new CacheMiddleware(cacheManager, config);
}

// Next.js middleware wrapper
export function withCache(
    handler: (req: NextRequest) => Promise<NextResponse>,
    cacheMiddleware: CacheMiddleware
) {
    return async (req: NextRequest): Promise<NextResponse> => {
        const tenantId = req.headers.get('x-tenant-id') || 'default';

        // Try to get cached response
        const cachedResponse = await cacheMiddleware.getCachedResponse(req, tenantId);
        if (cachedResponse) {
            return cachedResponse;
        }

        // Execute handler
        const response = await handler(req);

        // Cache successful responses
        if (response.status < 400) {
            await cacheMiddleware.cacheResponse(req, response, tenantId);
        }

        // Add cache headers
        response.headers.set('X-Cache', 'MISS');

        return response;
    };
}
