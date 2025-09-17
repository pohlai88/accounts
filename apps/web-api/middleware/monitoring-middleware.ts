/**
 * Monitoring Middleware for API Routes
 *
 * Automatically tracks API metrics, errors, and performance
 * Integrates with centralized monitoring system
 */

import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@aibos/monitoring";

export interface MonitoringMiddlewareConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableErrorTracking: boolean;
  sampleRate: number;
  slowQueryThreshold: number; // milliseconds
}

const defaultConfig: MonitoringMiddlewareConfig = {
  enableMetrics: true,
  enableTracing: true,
  enableErrorTracking: true,
  sampleRate: 0.1, // 10% sampling
  slowQueryThreshold: 1000, // 1 second
};

export function withMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config: Partial<MonitoringMiddlewareConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const method = req.method;
    const path = req.nextUrl.pathname;

    // Extract context from request
    const context = {
      requestId,
      traceId: req.headers.get("x-trace-id") || undefined,
      spanId: req.headers.get("x-span-id") || undefined,
      tenantId: req.headers.get("x-tenant-id") || undefined,
      userId: req.headers.get("x-user-id") || undefined,
      correlationId: req.headers.get("x-correlation-id") || undefined,
      userAgent: req.headers.get("user-agent") || undefined,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
    };

    // Start trace if enabled
    let traceId = "";
    if (finalConfig.enableTracing && Math.random() < finalConfig.sampleRate) {
      traceId = monitoring.startTrace(`api.${method}.${path}`, context);
    }

    try {
      // Log request start
      monitoring.info(`API Request: ${method} ${path}`, {
        method,
        path,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      }, context);

      // Execute the handler
      const response = await handler(req);

      // Calculate metrics
      const duration = Date.now() - startTime;
      const statusCode = response.status;
      const responseSize = parseInt(response.headers.get("content-length") || "0");

      // Record API metrics
      if (finalConfig.enableMetrics) {
        monitoring.recordAPIMetric(path, method, duration, statusCode, responseSize, context);
      }

      // Check for slow queries
      if (duration > finalConfig.slowQueryThreshold) {
        monitoring.warn(`Slow API request: ${method} ${path}`, {
          duration,
          threshold: finalConfig.slowQueryThreshold,
        }, context);
      }

      // Log successful response
      monitoring.info(`API Response: ${method} ${path}`, {
        method,
        path,
        statusCode,
        duration,
        responseSize,
      }, context);

      // End trace
      if (traceId) {
        monitoring.endTrace(traceId, true, {
          statusCode,
          duration,
          responseSize,
        });
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));

      // Track API error
      if (finalConfig.enableErrorTracking) {
        monitoring.trackAPIError(errorObj, method, path, 500, context);
      }

      // Log error
      monitoring.error(`API Error: ${method} ${path}`, errorObj, {
        method,
        path,
        duration,
      }, context);

      // End trace with error
      if (traceId) {
        monitoring.endTrace(traceId, false, {
          error: errorObj.message,
          duration,
        });
      }

      // Re-throw the error to be handled by the application
      throw error;
    }
  };
}

/**
 * Middleware factory for API routes
 */
export function createMonitoringMiddleware(config?: Partial<MonitoringMiddlewareConfig>) {
  return {
    withMonitoring: (handler: (req: NextRequest) => Promise<NextResponse>) =>
      withMonitoring(handler, config),
  };
}

/**
 * Utility function to extract monitoring context from request
 */
export function extractMonitoringContext(req: NextRequest) {
  return {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    traceId: req.headers.get("x-trace-id") || undefined,
    spanId: req.headers.get("x-span-id") || undefined,
    tenantId: req.headers.get("x-tenant-id") || undefined,
    userId: req.headers.get("x-user-id") || undefined,
    correlationId: req.headers.get("x-correlation-id") || undefined,
    userAgent: req.headers.get("user-agent") || undefined,
    ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined,
  };
}

/**
 * Utility function to record business metrics
 */
export function recordBusinessMetric(
  event: string,
  value: number,
  unit: string,
  context: Record<string, string> = {}
) {
  monitoring.recordBusinessMetric(event, value, unit, context);
}

/**
 * Get monitoring health status
 */
export async function getMonitoringHealth() {
  return await monitoring.checkHealth();
}

/**
 * Get monitoring statistics
 */
export function getMonitoringStats() {
  return {
    metrics: {}, // Placeholder - metrics collection simplified
    logger: monitoring.getLogger().getLogStats(),
    health: "healthy", // Simplified for now
  };
}
