import { NextRequest, NextResponse } from "next/server";
import { MetricsCollector, TracingManager, Logger } from "@aibos/monitoring";

// Global monitoring instances
let metricsCollector: MetricsCollector | null = null;
let tracingManager: TracingManager | null = null;
let logger: Logger | null = null;

export function createMonitoringMiddleware(config?: unknown) {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector({
      enableRealTime: true,
      enableBatchProcessing: true,
      batchSize: 1000,
      batchInterval: 60000,
      retentionPeriod: 30,
      enableAggregation: true,
      aggregationInterval: 300000,
      ...config?.metrics,
    });
  }

  if (!tracingManager) {
    tracingManager = new TracingManager({
      enableTracing: true,
      sampleRate: 0.1,
      maxTracesPerSecond: 1000,
      retentionPeriod: 7,
      enableB3Headers: true,
      enableW3CTraceContext: true,
      ...config?.tracing,
    });
  }

  if (!logger) {
    logger = new Logger({
      level: "info",
      enableConsole: true,
      enableFile: true,
      enableStructuredLogging: true,
      enableCorrelation: true,
      ...config?.logging,
    });
  }

  return { metricsCollector, tracingManager, logger };
}

export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: unknown,
) {
  const { metricsCollector, tracingManager, logger } = createMonitoringMiddleware(config);

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = performance.now();
    const requestId = req.headers.get("x-request-id") || generateRequestId();
    const tenantId = req.headers.get("x-tenant-id") || "unknown";
    const userId = req.headers.get("x-user-id") || "unknown";

    // Extract trace context
    const traceContext = tracingManager?.extractTraceContext(
      Object.fromEntries(req.headers.entries()),
    );

    // Start trace span
    const span = tracingManager?.startSpan(
      `${req.method} ${req.nextUrl.pathname}`,
      "server",
      traceContext || undefined,
      {
        "http.method": req.method,
        "http.url": req.nextUrl.pathname,
        "http.user_agent": req.headers.get("user-agent") || "",
        "tenant.id": tenantId,
        "user.id": userId,
      },
      tenantId,
      userId,
    );

    try {
      // Log request start
      logger?.info(
        "Request started",
        {
          method: req.method,
          url: req.nextUrl.pathname,
          userAgent: req.headers.get("user-agent"),
          ipAddress: getClientIP(req),
        },
        {
          traceId: span?.traceId,
          spanId: span?.id,
          tenantId,
          userId,
          requestId,
        },
      );

      // Execute handler
      const response = await handler(req);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record metrics
      metricsCollector?.recordApiRequest(
        req.nextUrl.pathname,
        req.method,
        response.status,
        duration,
        tenantId,
        userId,
      );

      // End trace span
      if (span) {
        tracingManager?.endSpan(span.id, response.status >= 400 ? "error" : "ok", {
          "http.status_code": response.status,
          "http.response_size": response.headers.get("content-length") || 0,
        });
      }

      // Log request completion
      logger?.info(
        "Request completed",
        {
          method: req.method,
          url: req.nextUrl.pathname,
          statusCode: response.status,
          duration,
        },
        {
          traceId: span?.traceId,
          spanId: span?.id,
          tenantId,
          userId,
          requestId,
        },
      );

      // Add monitoring headers
      response.headers.set("X-Request-ID", requestId);
      response.headers.set("X-Response-Time", `${duration.toFixed(2)}ms`);
      if (span) {
        response.headers.set("X-Trace-ID", span.traceId);
      }

      return response;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Record error metrics
      metricsCollector?.recordApiRequest(
        req.nextUrl.pathname,
        req.method,
        500,
        duration,
        tenantId,
        userId,
      );

      // End trace span with error
      if (span) {
        tracingManager?.endSpan(span.id, "error", {
          "error.name": error instanceof Error ? error.name : "UnknownError",
          "error.message": error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Log error
      logger?.error(
        "Request failed",
        error instanceof Error ? error : new Error("Unknown error"),
        {
          method: req.method,
          url: req.nextUrl.pathname,
          duration,
        },
        {
          traceId: span?.traceId,
          spanId: span?.id,
          tenantId,
          userId,
          requestId,
        },
      );

      // Return error response
      return NextResponse.json(
        {
          success: false,
          error: {
            type: "about:blank",
            title: "Internal Server Error",
            status: 500,
            detail: "An unexpected error occurred",
            instance: req.nextUrl.pathname,
          },
        },
        { status: 500 },
      );
    }
  };
}

// Monitoring health check
export async function getMonitoringHealth() {
  const { metricsCollector, tracingManager, logger } = createMonitoringMiddleware();

  try {
    const metricsHealth = metricsCollector?.getHealthStatus();
    const traceStats = tracingManager?.getTraceStats();
    const logStats = logger?.getLogStats();

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      components: {
        metrics: {
          status: metricsHealth?.status || "unknown",
          issues: metricsHealth?.issues || [],
          recommendations: metricsHealth?.recommendations || [],
        },
        tracing: {
          status: "healthy",
          totalTraces: traceStats?.totalTraces || 0,
          activeSpans: traceStats?.activeSpans || 0,
          errorRate: traceStats?.errorRate || 0,
        },
        logging: {
          status: "healthy",
          totalLogs: logStats?.totalLogs || 0,
          errorRate: logStats?.errorRate || 0,
        },
      },
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Get monitoring statistics
export async function getMonitoringStats() {
  const { metricsCollector, tracingManager, logger } = createMonitoringMiddleware();

  try {
    const systemMetrics = metricsCollector?.getSystemMetrics();
    const appMetrics = metricsCollector?.getApplicationMetrics();
    const traceStats = tracingManager?.getTraceStats();
    const logStats = logger?.getLogStats();

    return {
      timestamp: new Date().toISOString(),
      system: systemMetrics,
      application: appMetrics,
      tracing: traceStats,
      logging: logStats,
    };
  } catch (error) {
    console.error("Failed to get monitoring stats:", error);
    return {
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Utility functions
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }

  return "unknown";
}
