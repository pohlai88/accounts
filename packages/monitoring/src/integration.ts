/**
 * @aibos/monitoring - Centralized Monitoring Integration
 *
 * Single source of truth for all monitoring, logging, and observability
 * Consolidates MetricsCollector, Logger, TracingManager, and ErrorTracker
 */

import { MetricsCollector } from "./metrics";
import { Logger } from "./logger";
import { TracingManager } from "./tracing";
import { HealthChecker } from "./health";
import { EventEmitter } from "events";
import { getCacheService } from "@aibos/cache";

export interface MonitoringConfig {
  metrics: {
    enabled: boolean;
    sampleRate: number;
    retentionPeriod: number;
    enableRealTime: boolean;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error" | "fatal";
    enableConsole: boolean;
    enableFile: boolean;
    enableRemote: boolean;
    logDirectory: string;
    maxFileSize: number;
    maxFiles: number;
    enableRotation: boolean;
    enableCompression: boolean;
    enableStructuredLogging: boolean;
    enableCorrelation: boolean;
    enableSampling: boolean;
    sampleRate: number;
  };
  tracing: {
    enabled: boolean;
    sampleRate: number;
    maxTracesPerSecond: number;
    retentionPeriod: number;
    enableB3Headers: boolean;
    enableW3CTraceContext: boolean;
  };
  health: {
    enabled: boolean;
    checkInterval: number;
    timeout: number;
    enableDetailedChecks: boolean;
  };
  errorTracking: {
    enabled: boolean;
    flushInterval: number;
    maxBufferSize: number;
    enableFingerprinting: boolean;
  };
}

export interface MonitoringContext {
  traceId?: string;
  spanId?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  operation?: string;
  tags?: Record<string, string>;
}

export class MonitoringIntegration extends EventEmitter {
  private static instance: MonitoringIntegration;
  private config: MonitoringConfig;
  private metricsCollector: MetricsCollector;
  private logger: Logger;
  private tracingManager: TracingManager;
  private healthChecker: HealthChecker;
  private isInitialized = false;

  private constructor(config: MonitoringConfig) {
    super();
    this.config = config;

    // Initialize components
    const cache = getCacheService();
    this.metricsCollector = new MetricsCollector(cache);
    this.logger = new Logger(config.logging);
    this.tracingManager = new TracingManager(config.tracing);
    this.healthChecker = new HealthChecker(cache);
  }

  public static getInstance(config?: Partial<MonitoringConfig>): MonitoringIntegration {
    if (!MonitoringIntegration.instance) {
      const defaultConfig: MonitoringConfig = {
        metrics: {
          enabled: true,
          sampleRate: 0.1,
          retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
          enableRealTime: true,
        },
        logging: {
          level: "info",
          enableConsole: process.env.NODE_ENV === "development",
          enableFile: true,
          enableRemote: true,
          logDirectory: "./logs",
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxFiles: 5,
          enableRotation: true,
          enableCompression: true,
          enableStructuredLogging: true,
          enableCorrelation: true,
          enableSampling: true,
          sampleRate: 0.1,
        },
        tracing: {
          enabled: true,
          sampleRate: 0.1,
          maxTracesPerSecond: 1000,
          retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
          enableB3Headers: true,
          enableW3CTraceContext: true,
        },
        health: {
          enabled: true,
          checkInterval: 30000, // 30 seconds
          timeout: 5000, // 5 seconds
          enableDetailedChecks: true,
        },
        errorTracking: {
          enabled: true,
          flushInterval: 5000, // 5 seconds
          maxBufferSize: 1000,
          enableFingerprinting: true,
        },
        ...config,
      };

      MonitoringIntegration.instance = new MonitoringIntegration(defaultConfig);
    }
    return MonitoringIntegration.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set up global error handlers
      this.setupGlobalErrorHandlers();

      // Set up performance monitoring
      this.setupPerformanceMonitoring();

      this.isInitialized = true;
      this.logger.info("Monitoring system initialized", { component: "monitoring-integration" });
    } catch (error) {
      this.logger.error("Failed to initialize monitoring system", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // ============================================================================
  // METRICS COLLECTION
  // ============================================================================

  public recordMetric(
    name: string,
    value: number,
    unit: string,
    tags: Record<string, string> = {},
    context: MonitoringContext = {}
  ): void {
    if (!this.config.metrics.enabled) return;

    this.metricsCollector.recordMetric(name, value, unit, {
      ...tags,
      ...context.tags,
      tenantId: context.tenantId || "",
      userId: context.userId || "",
      requestId: context.requestId || "",
    });
  }

  public recordAPIMetric(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    responseSize: number,
    context: MonitoringContext = {}
  ): void {
    this.recordMetric("api.response_time", duration, "milliseconds", {
      endpoint,
      method,
      status_code: statusCode.toString(),
    }, context);

    this.recordMetric("api.response_size", responseSize, "bytes", {
      endpoint,
      method,
    }, context);

    this.recordMetric("api.requests", 1, "count", {
      endpoint,
      method,
      status_code: statusCode.toString(),
    }, context);
  }

  public recordBusinessMetric(
    event: string,
    value: number,
    unit: string,
    context: MonitoringContext = {}
  ): void {
    this.recordMetric(`business.${event}`, value, unit, {}, context);
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  public log(
    level: "debug" | "info" | "warn" | "error" | "fatal",
    message: string,
    metadata: Record<string, unknown> = {},
    context: MonitoringContext = {}
  ): void {
    if (level === "debug") {
      this.logger.debug(message, metadata, {
        traceId: context.traceId,
        spanId: context.spanId,
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        tags: context.tags,
      });
    } else if (level === "info") {
      this.logger.info(message, metadata, {
        traceId: context.traceId,
        spanId: context.spanId,
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        tags: context.tags,
      });
    } else if (level === "warn") {
      this.logger.warn(message, metadata, {
        traceId: context.traceId,
        spanId: context.spanId,
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        tags: context.tags,
      });
    } else if (level === "error") {
      this.logger.error(message, undefined, metadata, {
        traceId: context.traceId,
        spanId: context.spanId,
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        tags: context.tags,
      });
    } else if (level === "fatal") {
      this.logger.fatal(message, undefined, metadata, {
        traceId: context.traceId,
        spanId: context.spanId,
        tenantId: context.tenantId,
        userId: context.userId,
        requestId: context.requestId,
        correlationId: context.correlationId,
        tags: context.tags,
      });
    }
  }

  public info(message: string, metadata: Record<string, unknown> = {}, context: MonitoringContext = {}): void {
    this.log("info", message, metadata, context);
  }

  public warn(message: string, metadata: Record<string, unknown> = {}, context: MonitoringContext = {}): void {
    this.log("warn", message, metadata, context);
  }

  public error(message: string, error?: Error, metadata: Record<string, unknown> = {}, context: MonitoringContext = {}): void {
    this.logger.error(message, error, metadata, {
      traceId: context.traceId,
      spanId: context.spanId,
      tenantId: context.tenantId,
      userId: context.userId,
      requestId: context.requestId,
      correlationId: context.correlationId,
      tags: context.tags,
    });
  }

  // ============================================================================
  // ERROR TRACKING
  // ============================================================================

  public trackError(
    error: Error | string,
    context: MonitoringContext = {},
    level: "error" | "warning" | "info" = "error",
    tags: string[] = []
  ): string {
    const errorId = this.generateErrorId();

    // Log the error
    this.error(
      typeof error === "string" ? error : error.message,
      typeof error === "string" ? undefined : error,
      { errorId, tags },
      context
    );

    // Record error metric
    this.recordMetric("system.errors", 1, "count", {
      level,
      error_type: typeof error === "string" ? "string" : error.constructor.name,
    }, context);

    return errorId;
  }

  public trackAPIError(
    error: Error | string,
    method: string,
    path: string,
    statusCode: number,
    context: MonitoringContext = {}
  ): string {
    const errorId = this.trackError(error, context, "error", ["api", method.toLowerCase()]);

    this.recordMetric("api.errors", 1, "count", {
      method,
      path,
      status_code: statusCode.toString(),
    }, context);

    return errorId;
  }

  // ============================================================================
  // TRACING
  // ============================================================================

  public startTrace(
    operation: string,
    context: MonitoringContext = {}
  ): string {
    if (!this.config.tracing.enabled) return "";

    const span = this.tracingManager.startSpan(operation, "internal", undefined, context.tags || {}, context.tenantId, context.userId);
    return span.id;
  }

  public endTrace(traceId: string, success: boolean = true, metadata: Record<string, unknown> = {}): void {
    if (!this.config.tracing.enabled || !traceId) return;

    this.tracingManager.endSpan(traceId, success ? "ok" : "error", metadata as Record<string, string | number | boolean>);
  }

  // ============================================================================
  // HEALTH CHECKING
  // ============================================================================

  public async checkHealth(): Promise<Record<string, unknown>> {
    if (!this.config.health.enabled) return { status: "disabled" };

    const health = await this.healthChecker.runAllHealthChecks();
    return health as unknown as Record<string, unknown>;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupGlobalErrorHandlers(): void {
    process.on("uncaughtException", (error) => {
      this.trackError(error, {}, "error", ["uncaught"]);
      this.recordMetric("system.errors.uncaught_exception", 1, "count");
    });

    process.on("unhandledRejection", (reason, promise) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.trackError(error, {}, "error", ["unhandled_rejection"]);
      this.recordMetric("system.errors.unhandled_rejection", 1, "count");
    });
  }

  private setupPerformanceMonitoring(): void {
    if (!this.config.metrics.enabled) return;

    // Monitor memory usage
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.recordMetric("system.memory.heap_used", memUsage.heapUsed, "bytes");
      this.recordMetric("system.memory.heap_total", memUsage.heapTotal, "bytes");
      this.recordMetric("system.memory.external", memUsage.external, "bytes");
      this.recordMetric("system.memory.rss", memUsage.rss, "bytes");
    }, 30000); // Every 30 seconds

    // Monitor CPU usage
    setInterval(() => {
      const cpuUsage = process.cpuUsage();
      this.recordMetric("system.cpu.user", cpuUsage.user, "microseconds");
      this.recordMetric("system.cpu.system", cpuUsage.system, "microseconds");
    }, 30000); // Every 30 seconds
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // PUBLIC GETTERS
  // ============================================================================

  public getMetricsCollector(): MetricsCollector {
    return this.metricsCollector;
  }

  public getLogger(): Logger {
    return this.logger;
  }

  public getTracingManager(): TracingManager {
    return this.tracingManager;
  }

  public getHealthChecker(): HealthChecker {
    return this.healthChecker;
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const monitoring = MonitoringIntegration.getInstance();
