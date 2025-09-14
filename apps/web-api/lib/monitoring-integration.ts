// Production Monitoring Integration
import { MetricsCollector, TracingManager, Logger } from '@aibos/monitoring';
import { EventEmitter } from 'events';

// Global monitoring instances
let metricsCollector: MetricsCollector | null = null;
let tracingManager: TracingManager | null = null;
let logger: Logger | null = null;

export class ProductionMonitoringIntegration extends EventEmitter {
    private isInitialized = false;

    async initialize(config?: unknown) {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize Metrics Collector
            metricsCollector = new MetricsCollector({
                enableRealTime: true,
                enableBatchProcessing: true,
                batchSize: 1000,
                batchInterval: 60000, // 1 minute
                retentionPeriod: 30, // 30 days
                enableCompression: false,
                maxMetricsPerMinute: 10000,
                enableAggregation: true,
                aggregationInterval: 300000, // 5 minutes
                ...config?.metrics
            });

            // Initialize Tracing Manager
            tracingManager = new TracingManager({
                enableTracing: true,
                sampleRate: 0.1, // 10% sampling
                maxTracesPerSecond: 1000,
                retentionPeriod: 7, // 7 days
                enableB3Headers: true,
                enableW3CTraceContext: true,
                ...config?.tracing
            });

            // Initialize Logger
            logger = new Logger({
                level: 'info',
                enableConsole: true,
                enableFile: true,
                enableStructuredLogging: true,
                enableCorrelation: true,
                enableSampling: true,
                sampleRate: 0.1, // 10% sampling
                logDirectory: './logs',
                maxFileSize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                enableRotation: true,
                enableCompression: true,
                ...config?.logging
            });

            // Set up monitoring event handlers
            this.setupMonitoringHandlers();

            this.isInitialized = true;
            console.log('✅ Production monitoring system initialized');

        } catch (error) {
            console.error('Failed to initialize monitoring system:', error);
            throw error;
        }
    }

    private setupMonitoringHandlers() {
        if (!metricsCollector || !tracingManager || !logger) {
            return;
        }

        // Set up error handling
        process.on('uncaughtException', (error) => {
            logger!.error('Uncaught Exception', { error: error.message, stack: error.stack });
            metricsCollector!.recordMetric('system.uncaught_exceptions', 1, 'count', { severity: 'critical' });
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger!.error('Unhandled Rejection', { reason: String(reason), promise: String(promise) });
            metricsCollector!.recordMetric('system.unhandled_rejections', 1, 'count', { severity: 'high' });
        });

        // Set up performance monitoring
        this.setupPerformanceMonitoring();
    }

    private setupPerformanceMonitoring() {
        if (!metricsCollector) return;

        // Monitor memory usage
        setInterval(() => {
            const memUsage = process.memoryUsage();
            metricsCollector!.recordMetric('system.memory.heap_used', memUsage.heapUsed, 'bytes');
            metricsCollector!.recordMetric('system.memory.heap_total', memUsage.heapTotal, 'bytes');
            metricsCollector!.recordMetric('system.memory.external', memUsage.external, 'bytes');
            metricsCollector!.recordMetric('system.memory.rss', memUsage.rss, 'bytes');
        }, 30000); // Every 30 seconds

        // Monitor CPU usage
        setInterval(() => {
            const cpuUsage = process.cpuUsage();
            metricsCollector!.recordMetric('system.cpu.user', cpuUsage.user, 'microseconds');
            metricsCollector!.recordMetric('system.cpu.system', cpuUsage.system, 'microseconds');
        }, 30000); // Every 30 seconds

        // Monitor event loop lag
        setInterval(() => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
                metricsCollector!.recordMetric('system.event_loop_lag', lag, 'milliseconds');
            });
        }, 10000); // Every 10 seconds
    }

    // API Request Monitoring
    recordAPIRequest(
        endpoint: string,
        method: string,
        statusCode: number,
        duration: number,
        tenantId: string,
        userId?: string
    ) {
        if (!metricsCollector) return;

        const tags = {
            endpoint,
            method,
            status: statusCode.toString(),
            tenant: tenantId,
            ...(userId && { user: userId })
        };

        // Record request count
        metricsCollector.recordMetric('api.requests.total', 1, 'count', tags);

        // Record request duration
        metricsCollector.recordMetric('api.requests.duration', duration, 'milliseconds', tags);

        // Record error rate
        if (statusCode >= 400) {
            metricsCollector.recordMetric('api.requests.errors', 1, 'count', tags);
        }

        // Record success rate
        if (statusCode < 400) {
            metricsCollector.recordMetric('api.requests.success', 1, 'count', tags);
        }
    }

    // Cache Monitoring
    recordCacheOperation(
        operation: 'hit' | 'miss' | 'set' | 'delete',
        key: string,
        tenantId: string,
        duration?: number
    ) {
        if (!metricsCollector) return;

        const tags = {
            operation,
            tenant: tenantId,
            key: key.substring(0, 50) // Truncate long keys
        };

        metricsCollector.recordMetric('cache.operations.total', 1, 'count', tags);

        if (duration !== undefined) {
            metricsCollector.recordMetric('cache.operations.duration', duration, 'milliseconds', tags);
        }
    }

    // Database Monitoring
    recordDatabaseOperation(
        operation: string,
        table: string,
        duration: number,
        tenantId: string,
        success: boolean
    ) {
        if (!metricsCollector) return;

        const tags = {
            operation,
            table,
            tenant: tenantId,
            success: success.toString()
        };

        metricsCollector.recordMetric('database.operations.total', 1, 'count', tags);
        metricsCollector.recordMetric('database.operations.duration', duration, 'milliseconds', tags);

        if (!success) {
            metricsCollector.recordMetric('database.operations.errors', 1, 'count', tags);
        }
    }

    // Real-time Events Monitoring
    recordRealtimeEvent(
        eventType: string,
        tenantId: string,
        userId?: string,
        success: boolean = true
    ) {
        if (!metricsCollector) return;

        const tags = {
            event_type: eventType,
            tenant: tenantId,
            success: success.toString(),
            ...(userId && { user: userId })
        };

        metricsCollector.recordMetric('realtime.events.total', 1, 'count', tags);

        if (!success) {
            metricsCollector.recordMetric('realtime.events.errors', 1, 'count', tags);
        }
    }

    // Security Events Monitoring
    recordSecurityEvent(
        eventType: string,
        severity: 'low' | 'medium' | 'high' | 'critical',
        tenantId: string,
        userId?: string,
        details?: unknown
    ) {
        if (!metricsCollector || !logger) return;

        const tags = {
            event_type: eventType,
            severity,
            tenant: tenantId,
            ...(userId && { user: userId })
        };

        metricsCollector.recordMetric('security.events.total', 1, 'count', tags);

        // Log security event
        logger.warn('Security event detected', {
            eventType,
            severity,
            tenantId,
            userId,
            details
        });
    }

    // Business Metrics
    recordBusinessMetric(
        metricName: string,
        value: number,
        unit: string,
        tenantId: string,
        tags: Record<string, string> = {}
    ) {
        if (!metricsCollector) return;

        metricsCollector.recordMetric(
            `business.${metricName}`,
            value,
            unit,
            {
                tenant: tenantId,
                ...tags
            }
        );
    }

    // Health Check
    getHealthStatus() {
        if (!this.isInitialized) {
            return {
                status: 'unhealthy',
                message: 'Monitoring system not initialized',
                components: {
                    metrics: 'not_initialized',
                    tracing: 'not_initialized',
                    logging: 'not_initialized'
                }
            };
        }

        const metricsHealth = metricsCollector?.getHealthStatus() || { status: 'unknown' };
        const tracingHealth = tracingManager?.getHealthStatus() || { status: 'unknown' };
        const loggingHealth = logger?.getHealthStatus() || { status: 'unknown' };

        const overallStatus = [metricsHealth.status, tracingHealth.status, loggingHealth.status]
            .every(status => status === 'healthy') ? 'healthy' : 'degraded';

        return {
            status: overallStatus,
            message: 'Monitoring system operational',
            components: {
                metrics: metricsHealth.status,
                tracing: tracingHealth.status,
                logging: loggingHealth.status
            },
            metrics: metricsCollector?.getStats(),
            traces: tracingManager?.getStats(),
            logs: logger?.getStats()
        };
    }

    // Get aggregated metrics
    getAggregatedMetrics(tenantId?: string, timeWindow?: number) {
        if (!metricsCollector) return [];

        return metricsCollector.getAggregatedMetrics(tenantId, timeWindow);
    }

    // Get system metrics
    getSystemMetrics() {
        if (!metricsCollector) return null;

        return metricsCollector.getSystemMetrics();
    }

    // Get application metrics
    getApplicationMetrics() {
        if (!metricsCollector) return null;

        return metricsCollector.getApplicationMetrics();
    }

    // Logging methods
    info(message: string, metadata?: unknown, context?: unknown) {
        logger?.info(message, metadata, context);
    }

    warn(message: string, metadata?: unknown, context?: unknown) {
        logger?.warn(message, metadata, context);
    }

    error(message: string, metadata?: unknown, context?: unknown) {
        logger?.error(message, metadata, context);
    }

    debug(message: string, metadata?: unknown, context?: unknown) {
        logger?.debug(message, metadata, context);
    }
}

// Export singleton instance
export const monitoring = new ProductionMonitoringIntegration();
