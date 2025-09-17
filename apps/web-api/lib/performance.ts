// Performance Optimization System
// DoD: Caching, query optimization, performance monitoring
// SSOT: Use existing cache package from @aibos/cache
// Tech Stack: Redis + query optimization

import { getCacheService } from "@aibos/cache";
import { createClient } from "@supabase/supabase-js";
import { monitoring } from "./monitoring";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Performance configuration
interface PerformanceConfig {
    caching: {
        enabled: boolean;
        defaultTTL: number; // seconds
        maxMemoryUsage: number; // bytes
        enableCompression: boolean;
        enableEncryption: boolean;
    };
    queryOptimization: {
        enabled: boolean;
        maxQueryTime: number; // milliseconds
        enableQueryCaching: boolean;
        enableConnectionPooling: boolean;
        maxConnections: number;
    };
    monitoring: {
        enabled: boolean;
        sampleRate: number;
        enableRealTime: boolean;
        enableSlowQueryLogging: boolean;
        slowQueryThreshold: number; // milliseconds
    };
    compression: {
        enabled: boolean;
        minSize: number; // bytes
        algorithm: "gzip" | "brotli" | "deflate";
    };
}

// Default configuration
const defaultConfig: PerformanceConfig = {
    caching: {
        enabled: true,
        defaultTTL: 300, // 5 minutes
        maxMemoryUsage: 100 * 1024 * 1024, // 100MB
        enableCompression: true,
        enableEncryption: false,
    },
    queryOptimization: {
        enabled: true,
        maxQueryTime: 5000, // 5 seconds
        enableQueryCaching: true,
        enableConnectionPooling: true,
        maxConnections: 20,
    },
    monitoring: {
        enabled: true,
        sampleRate: 0.1, // 10% sampling
        enableRealTime: true,
        enableSlowQueryLogging: true,
        slowQueryThreshold: 1000, // 1 second
    },
    compression: {
        enabled: true,
        minSize: 1024, // 1KB
        algorithm: "gzip",
    },
};

// Cache key generator
class CacheKeyGenerator {
    static generateKey(prefix: string, ...parts: (string | number)[]): string {
        return `${prefix}:${parts.join(":")}`;
    }

    static generateTenantKey(tenantId: string, prefix: string, ...parts: (string | number)[]): string {
        return this.generateKey(`tenant:${tenantId}`, prefix, ...parts);
    }

    static generateUserKey(userId: string, prefix: string, ...parts: (string | number)[]): string {
        return this.generateKey(`user:${userId}`, prefix, ...parts);
    }

    static generateAPIKey(endpoint: string, method: string, params: Record<string, any>): string {
        const sortedParams = Object.keys(params)
            .sort()
            .map(key => `${key}=${params[key]}`)
            .join("&");
        return this.generateKey("api", endpoint, method, sortedParams);
    }
}

// Query optimizer
class QueryOptimizer {
    private slowQueries: Map<string, number> = new Map();
    private queryCache: Map<string, any> = new Map();

    async optimizeQuery<T>(
        queryFn: () => Promise<T>,
        cacheKey: string,
        ttl: number = 300,
        tenantId?: string
    ): Promise<T> {
        const startTime = Date.now();

        try {
            // Check cache first
            if (this.config.queryOptimization.enableQueryCaching) {
                const cached = await this.getFromCache(cacheKey, tenantId);
                if (cached !== null) {
                    const duration = Date.now() - startTime;
                    this.recordQueryMetrics(cacheKey, duration, true, true);
                    return cached as T;
                }
            }

            // Execute query
            const result = await queryFn();
            const duration = Date.now() - startTime;

            // Cache result
            if (this.config.queryOptimization.enableQueryCaching) {
                await this.setCache(cacheKey, result, ttl, tenantId);
            }

            // Record metrics
            this.recordQueryMetrics(cacheKey, duration, true, false);

            // Log slow queries
            if (duration > this.config.monitoring.slowQueryThreshold) {
                this.logSlowQuery(cacheKey, duration);
            }

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.recordQueryMetrics(cacheKey, duration, false, false);
            throw error;
        }
    }

    private async getFromCache<T>(key: string, tenantId?: string): Promise<T | null> {
        try {
            const cache = getCacheService();
            const fullKey = tenantId ? CacheKeyGenerator.generateTenantKey(tenantId, key) : key;
            return await cache.get(fullKey);
        } catch (error) {
            console.error("Cache get error:", error);
            return null;
        }
    }

    private async setCache<T>(key: string, value: T, ttl: number, tenantId?: string): Promise<void> {
        try {
            const cache = getCacheService();
            const fullKey = tenantId ? CacheKeyGenerator.generateTenantKey(tenantId, key) : key;
            await cache.set(fullKey, value, { ttl });
        } catch (error) {
            console.error("Cache set error:", error);
        }
    }

    private recordQueryMetrics(key: string, duration: number, success: boolean, fromCache: boolean): void {
        if (!this.config.monitoring.enabled) return;

        monitoring.recordMetric("query.duration", duration, "milliseconds", {
            query: key,
            success: success.toString(),
            from_cache: fromCache.toString(),
        });

        monitoring.recordMetric("query.count", 1, "count", {
            query: key,
            success: success.toString(),
            from_cache: fromCache.toString(),
        });
    }

    private logSlowQuery(key: string, duration: number): void {
        if (!this.config.monitoring.enableSlowQueryLogging) return;

        console.warn(`Slow query detected: ${key} took ${duration}ms`);

        // Record slow query
        monitoring.recordMetric("query.slow", 1, "count", {
            query: key,
            duration: duration.toString(),
        });
    }

    private config: PerformanceConfig;

    constructor(config: PerformanceConfig) {
        this.config = config;
    }
}

// Response compressor
class ResponseCompressor {
    private config: PerformanceConfig;

    constructor(config: PerformanceConfig) {
        this.config = config;
    }

    async compress(data: any): Promise<Buffer> {
        if (!this.config.compression.enabled) {
            return Buffer.from(JSON.stringify(data));
        }

        const jsonString = JSON.stringify(data);
        const jsonBuffer = Buffer.from(jsonString);

        if (jsonBuffer.length < this.config.compression.minSize) {
            return jsonBuffer;
        }

        try {
            const zlib = await import("zlib");
            const { promisify } = await import("util");

            let compressFn;
            switch (this.config.compression.algorithm) {
                case "gzip":
                    compressFn = promisify(zlib.gzip);
                    break;
                case "deflate":
                    compressFn = promisify(zlib.deflate);
                    break;
                case "brotli":
                    compressFn = promisify(zlib.brotliCompress);
                    break;
                default:
                    compressFn = promisify(zlib.gzip);
            }

            return await compressFn(jsonBuffer);
        } catch (error) {
            console.error("Compression error:", error);
            return jsonBuffer;
        }
    }

    getCompressionHeaders(): Record<string, string> {
        if (!this.config.compression.enabled) {
            return {};
        }

        switch (this.config.compression.algorithm) {
            case "gzip":
                return { "Content-Encoding": "gzip" };
            case "deflate":
                return { "Content-Encoding": "deflate" };
            case "brotli":
                return { "Content-Encoding": "br" };
            default:
                return { "Content-Encoding": "gzip" };
        }
    }
}

// Performance monitoring
class PerformanceMonitor {
    private config: PerformanceConfig;
    private metrics: Map<string, number[]> = new Map();

    constructor(config: PerformanceConfig) {
        this.config = config;
    }

    recordAPIMetric(
        endpoint: string,
        method: string,
        duration: number,
        statusCode: number,
        responseSize: number,
        tenantId?: string
    ): void {
        if (!this.config.monitoring.enabled) return;

        const tags = {
            endpoint,
            method,
            status: statusCode.toString(),
            tenant: tenantId || "unknown",
        };

        // Record duration
        monitoring.recordMetric("api.duration", duration, "milliseconds", tags, tenantId);

        // Record response size
        monitoring.recordMetric("api.response_size", responseSize, "bytes", tags, tenantId);

        // Record request count
        monitoring.recordMetric("api.requests", 1, "count", tags, tenantId);

        // Record error count
        if (statusCode >= 400) {
            monitoring.recordMetric("api.errors", 1, "count", tags, tenantId);
        }

        // Track response time percentiles
        this.trackPercentiles(`api.duration:${endpoint}:${method}`, duration);
    }

    recordCacheMetric(
        operation: "hit" | "miss" | "set" | "delete",
        key: string,
        duration: number,
        size: number,
        tenantId?: string
    ): void {
        if (!this.config.monitoring.enabled) return;

        const tags = {
            operation,
            tenant: tenantId || "unknown",
        };

        monitoring.recordMetric("cache.operations", 1, "count", tags, tenantId);
        monitoring.recordMetric("cache.duration", duration, "milliseconds", tags, tenantId);
        monitoring.recordMetric("cache.size", size, "bytes", tags, tenantId);

        if (operation === "hit") {
            monitoring.recordMetric("cache.hits", 1, "count", tags, tenantId);
        } else if (operation === "miss") {
            monitoring.recordMetric("cache.misses", 1, "count", tags, tenantId);
        }
    }

    recordDatabaseMetric(
        operation: string,
        table: string,
        duration: number,
        rowsAffected: number,
        tenantId?: string
    ): void {
        if (!this.config.monitoring.enabled) return;

        const tags = {
            operation,
            table,
            tenant: tenantId || "unknown",
        };

        monitoring.recordMetric("database.operations", 1, "count", tags, tenantId);
        monitoring.recordMetric("database.duration", duration, "milliseconds", tags, tenantId);
        monitoring.recordMetric("database.rows_affected", rowsAffected, "count", tags, tenantId);
    }

    private trackPercentiles(key: string, value: number): void {
        if (!this.metrics.has(key)) {
            this.metrics.set(key, []);
        }

        const values = this.metrics.get(key)!;
        values.push(value);

        // Keep only last 1000 values
        if (values.length > 1000) {
            values.shift();
        }

        // Calculate percentiles every 100 values
        if (values.length % 100 === 0) {
            this.calculatePercentiles(key, values);
        }
    }

    private calculatePercentiles(key: string, values: number[]): void {
        const sorted = [...values].sort((a, b) => a - b);
        const len = sorted.length;

        const p50 = sorted[Math.floor(len * 0.5)] || 0;
        const p95 = sorted[Math.floor(len * 0.95)] || 0;
        const p99 = sorted[Math.floor(len * 0.99)] || 0;

        monitoring.recordMetric("performance.p50", p50, "milliseconds", { metric: key });
        monitoring.recordMetric("performance.p95", p95, "milliseconds", { metric: key });
        monitoring.recordMetric("performance.p99", p99, "milliseconds", { metric: key });
    }
}

// Main performance optimization system
export class PerformanceOptimizationSystem {
    private config: PerformanceConfig;
    private queryOptimizer: QueryOptimizer;
    private responseCompressor: ResponseCompressor;
    private performanceMonitor: PerformanceMonitor;
    private cache: any;

    constructor(config: Partial<PerformanceConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
        this.queryOptimizer = new QueryOptimizer(this.config);
        this.responseCompressor = new ResponseCompressor(this.config);
        this.performanceMonitor = new PerformanceMonitor(this.config);
        this.cache = getCacheService();
    }

    async initialize(): Promise<void> {
        try {
            // Initialize cache
            await this.cache.initialize();

            // Set up performance monitoring
            this.setupPerformanceMonitoring();

            console.log("✅ Performance optimization system initialized");
        } catch (error) {
            console.error("Failed to initialize performance optimization system:", error);
            throw error;
        }
    }

    private setupPerformanceMonitoring(): void {
        // Monitor memory usage
        setInterval(() => {
            const memUsage = process.memoryUsage();
            monitoring.recordMetric("performance.memory.rss", memUsage.rss, "bytes");
            monitoring.recordMetric("performance.memory.heap_used", memUsage.heapUsed, "bytes");
            monitoring.recordMetric("performance.memory.heap_total", memUsage.heapTotal, "bytes");
        }, 30000); // Every 30 seconds

        // Monitor event loop lag
        setInterval(() => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000;
                monitoring.recordMetric("performance.event_loop.lag", lag, "milliseconds");
            });
        }, 10000); // Every 10 seconds
    }

    // Cache operations
    async get<T>(key: string, tenantId?: string): Promise<T | null> {
        const startTime = Date.now();

        try {
            const fullKey = tenantId ? CacheKeyGenerator.generateTenantKey(tenantId, key) : key;
            const result = await this.cache.get(fullKey);

            const duration = Date.now() - startTime;
            this.performanceMonitor.recordCacheMetric(
                result !== null ? "hit" : "miss",
                key,
                duration,
                result ? JSON.stringify(result).length : 0,
                tenantId
            );

            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            this.performanceMonitor.recordCacheMetric("miss", key, duration, 0, tenantId);
            throw error;
        }
    }

    async set<T>(key: string, value: T, ttl: number = this.config.caching.defaultTTL, tenantId?: string): Promise<void> {
        const startTime = Date.now();

        try {
            const fullKey = tenantId ? CacheKeyGenerator.generateTenantKey(tenantId, key) : key;
            await this.cache.set(fullKey, value, ttl);

            const duration = Date.now() - startTime;
            const size = JSON.stringify(value).length;
            this.performanceMonitor.recordCacheMetric("set", key, duration, size, tenantId);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.performanceMonitor.recordCacheMetric("set", key, duration, 0, tenantId);
            throw error;
        }
    }

    async delete(key: string, tenantId?: string): Promise<void> {
        const startTime = Date.now();

        try {
            const fullKey = tenantId ? CacheKeyGenerator.generateTenantKey(tenantId, key) : key;
            await this.cache.delete(fullKey);

            const duration = Date.now() - startTime;
            this.performanceMonitor.recordCacheMetric("delete", key, duration, 0, tenantId);
        } catch (error) {
            const duration = Date.now() - startTime;
            this.performanceMonitor.recordCacheMetric("delete", key, duration, 0, tenantId);
            throw error;
        }
    }

    // Query optimization
    async optimizeQuery<T>(
        queryFn: () => Promise<T>,
        cacheKey: string,
        ttl: number = this.config.caching.defaultTTL,
        tenantId?: string
    ): Promise<T> {
        return await this.queryOptimizer.optimizeQuery(queryFn, cacheKey, ttl, tenantId);
    }

    // Response compression
    async compressResponse(data: any): Promise<{ data: Buffer; headers: Record<string, string> }> {
        const compressed = await this.responseCompressor.compress(data);
        const headers = this.responseCompressor.getCompressionHeaders();

        return {
            data: compressed,
            headers,
        };
    }

    // API performance tracking
    trackAPIRequest(
        endpoint: string,
        method: string,
        duration: number,
        statusCode: number,
        responseSize: number,
        tenantId?: string
    ): void {
        this.performanceMonitor.recordAPIMetric(endpoint, method, duration, statusCode, responseSize, tenantId);
    }

    // Database performance tracking
    trackDatabaseOperation(
        operation: string,
        table: string,
        duration: number,
        rowsAffected: number,
        tenantId?: string
    ): void {
        this.performanceMonitor.recordDatabaseMetric(operation, table, duration, rowsAffected, tenantId);
    }

    // Get performance metrics
    async getPerformanceMetrics(tenantId?: string): Promise<any> {
        try {
            const { data: metrics, error } = await supabase
                .from("monitoring_metrics")
                .select("*")
                .eq("tenant_id", tenantId || "system")
                .gte("timestamp", new Date(Date.now() - 3600000).toISOString()) // Last hour
                .order("timestamp", { ascending: false });

            if (error) {
                throw error;
            }

            // Group metrics by name
            const groupedMetrics = (metrics || []).reduce((acc, metric) => {
                if (!acc[metric.name]) {
                    acc[metric.name] = [];
                }
                acc[metric.name].push(metric);
                return acc;
            }, {} as Record<string, any[]>);

            // Calculate statistics
            const statistics: Record<string, any> = {};
            for (const [name, values] of Object.entries(groupedMetrics)) {
                const typedValues = values as Array<{ value: string }>;
                const numericValues = typedValues.map((v: { value: string }) => parseFloat(v.value));
                statistics[name] = {
                    count: typedValues.length,
                    min: Math.min(...numericValues),
                    max: Math.max(...numericValues),
                    avg: numericValues.reduce((sum: number, val: number) => sum + val, 0) / numericValues.length,
                    p50: this.calculatePercentile(numericValues, 0.5),
                    p95: this.calculatePercentile(numericValues, 0.95),
                    p99: this.calculatePercentile(numericValues, 0.99),
                };
            }

            return {
                statistics,
                generatedAt: new Date().toISOString(),
                timeRange: {
                    start: new Date(Date.now() - 3600000).toISOString(),
                    end: new Date().toISOString(),
                },
            };
        } catch (error) {
            console.error("Failed to get performance metrics:", error);
            throw error;
        }
    }

    private calculatePercentile(values: number[], percentile: number): number {
        const sorted = [...values].sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[index] || 0;
    }

    // Health check
    getHealthStatus(): any {
        return {
            status: "healthy",
            components: {
                cache: this.cache ? "healthy" : "unhealthy",
                queryOptimizer: "healthy",
                responseCompressor: "healthy",
                performanceMonitor: "healthy",
            },
            config: {
                caching: this.config.caching.enabled,
                queryOptimization: this.config.queryOptimization.enabled,
                monitoring: this.config.monitoring.enabled,
                compression: this.config.compression.enabled,
            },
        };
    }
}

// Export singleton instance
export const performance = new PerformanceOptimizationSystem();
