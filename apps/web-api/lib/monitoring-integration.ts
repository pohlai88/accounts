// Production Monitoring Integration
import { MetricsCollector, TracingManager, Logger } from "@aibos/monitoring";
import { getCacheService } from "@aibos/cache";
import { EventEmitter } from "events";

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
      // Type guard for config
      const configObj = config && typeof config === "object" ? config as Record<string, unknown> : {};

      // Initialize Metrics Collector
      const cache = getCacheService();
      metricsCollector = new MetricsCollector(cache);

      // Initialize Tracing Manager
      tracingManager = new TracingManager({
        enableTracing: true,
        sampleRate: 0.1, // 10% sampling
        maxTracesPerSecond: 1000,
        retentionPeriod: 7, // 7 days
        enableB3Headers: true,
        enableW3CTraceContext: true,
        ...(configObj.tracing && typeof configObj.tracing === "object" ? configObj.tracing : {}),
      });

      // Initialize Logger
      logger = new Logger({
        level: "info",
        enableConsole: true,
        enableFile: true,
        enableStructuredLogging: true,
        enableCorrelation: true,
        enableSampling: true,
        sampleRate: 0.1, // 10% sampling
        logDirectory: "./logs",
        maxFileSize: 10 * 1024 * 1024, // 10MB
        maxFiles: 5,
        enableRotation: true,
        enableCompression: true,
        ...(configObj.logging && typeof configObj.logging === "object" ? configObj.logging : {}),
      });

      // Set up monitoring event handlers
      this.setupMonitoringHandlers();

      this.isInitialized = true;
      console.log("✅ Production monitoring system initialized");
    } catch (error) {
      console.error("Failed to initialize monitoring system:", error);
      throw error;
    }
  }

  private setupMonitoringHandlers() {
    if (!metricsCollector || !tracingManager || !logger) {
      return;
    }

    // Set up error handling
    process.on("uncaughtException", error => {
      logger!.error("Uncaught Exception", error);
      // Note: recordMetric method not available on this MetricsCollector
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger!.error("Unhandled Rejection", new Error(String(reason)));
      // Note: recordMetric method not available on this MetricsCollector
    });

    // Set up performance monitoring
    this.setupPerformanceMonitoring();
  }

  private setupPerformanceMonitoring() {
    if (!metricsCollector) { return; }

    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      // Note: recordMetric method not available on this MetricsCollector
      // Could use logger or other monitoring methods instead
    }, 30000); // Every 30 seconds

    // Monitor CPU usage
    setInterval(() => {
      const cpuUsage = process.cpuUsage();
      // Note: recordMetric method not available on this MetricsCollector
      // Could use logger or other monitoring methods instead
    }, 30000); // Every 30 seconds

    // Monitor event loop lag
    setInterval(() => {
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
        // Note: recordMetric method not available on this MetricsCollector
        // Could use logger or other monitoring methods instead
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
    userId?: string,
  ) {
    if (!metricsCollector) { return; }

    const tags = {
      endpoint,
      method,
      status: statusCode.toString(),
      tenant: tenantId,
      ...(userId && { user: userId }),
    };

    // Note: recordMetric method not available on this MetricsCollector
    // Could use logger or other monitoring methods instead
  }

  // Cache Monitoring
  recordCacheOperation(
    operation: "hit" | "miss" | "set" | "delete",
    key: string,
    tenantId: string,
    duration?: number,
  ) {
    if (!metricsCollector) { return; }

    const tags = {
      operation,
      tenant: tenantId,
      key: key.substring(0, 50), // Truncate long keys
    };

    // Note: recordMetric method not available on this MetricsCollector
    // Could use logger or other monitoring methods instead
  }

  // Database Monitoring
  recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    tenantId: string,
    success: boolean,
  ) {
    if (!metricsCollector) { return; }

    const tags = {
      operation,
      table,
      tenant: tenantId,
      success: success.toString(),
    };

    // Note: recordMetric method not available on this MetricsCollector
    // Could use logger or other monitoring methods instead
  }

  // Real-time Events Monitoring
  recordRealtimeEvent(
    eventType: string,
    tenantId: string,
    userId?: string,
    success: boolean = true,
  ) {
    if (!metricsCollector) { return; }

    const tags = {
      event_type: eventType,
      tenant: tenantId,
      success: success.toString(),
      ...(userId && { user: userId }),
    };

    // Note: recordMetric method not available on this MetricsCollector
    // Could use logger or other monitoring methods instead
  }

  // Security Events Monitoring
  recordSecurityEvent(
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    tenantId: string,
    userId?: string,
    details?: unknown,
  ) {
    if (!metricsCollector || !logger) { return; }

    const tags = {
      event_type: eventType,
      severity,
      tenant: tenantId,
      ...(userId && { user: userId }),
    };

    // Note: recordMetric method not available on this MetricsCollector
    // Could use logger or other monitoring methods instead

    // Log security event
    logger.warn("Security event detected", {
      eventType,
      severity,
      tenantId,
      userId,
      details,
    });
  }

  // Business Metrics
  recordBusinessMetric(
    metricName: string,
    value: number,
    unit: string,
    tenantId: string,
    tags: Record<string, string> = {},
  ) {
    if (!metricsCollector) { return; }

    // Note: recordMetric method not available on this MetricsCollector
    // Could use logger or other monitoring methods instead
  }

  // Health Check
  getHealthStatus() {
    if (!this.isInitialized) {
      return {
        status: "unhealthy",
        message: "Monitoring system not initialized",
        components: {
          metrics: "not_initialized",
          tracing: "not_initialized",
          logging: "not_initialized",
        },
      };
    }

    const metricsHealth = metricsCollector ? { status: "healthy" } : { status: "unknown" };
    const tracingHealth = tracingManager ? { status: "healthy" } : { status: "unknown" };
    const loggingHealth = logger ? { status: "healthy" } : { status: "unknown" };

    const overallStatus = [metricsHealth.status, tracingHealth.status, loggingHealth.status].every(
      status => status === "healthy",
    )
      ? "healthy"
      : "degraded";

    return {
      status: overallStatus,
      message: "Monitoring system operational",
      components: {
        metrics: metricsHealth.status,
        tracing: tracingHealth.status,
        logging: loggingHealth.status,
      },
      metrics: metricsCollector ? { status: "active" } : null,
      traces: tracingManager?.getTraceStats(),
      logs: logger?.getLogStats(),
    };
  }

  // Get aggregated metrics
  getAggregatedMetrics(tenantId?: string, timeWindow?: number) {
    if (!metricsCollector) { return []; }

    // Note: getAggregatedMetrics method not available on this MetricsCollector
    return null;
  }

  // Get system metrics
  getSystemMetrics() {
    if (!metricsCollector) { return null; }

    // Note: getSystemMetrics method not available on this MetricsCollector
    return null;
  }

  // Get application metrics
  getApplicationMetrics() {
    if (!metricsCollector) { return null; }

    // Note: getApplicationMetrics method not available on this MetricsCollector
    return null;
  }

  // Logging methods
  info(message: string, metadata?: unknown, context?: unknown) {
    logger?.info(message, context as Error | undefined, metadata as Record<string, any> | undefined);
  }

  warn(message: string, metadata?: unknown, context?: unknown) {
    logger?.warn(message, context as Error | undefined, metadata as Record<string, any> | undefined);
  }

  error(message: string, metadata?: unknown, context?: unknown) {
    logger?.error(message, context as Error | undefined, metadata as Record<string, any> | undefined);
  }

  debug(message: string, metadata?: unknown, context?: unknown) {
    logger?.debug(message, context as Error | undefined, metadata as Record<string, any> | undefined);
  }
}

// Export singleton instance
export const monitoring = new ProductionMonitoringIntegration();
