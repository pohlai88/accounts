// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { performance } from "perf_hooks";

export interface PerformanceMetrics {
  requestId: string;
  method: string;
  url: string;
  statusCode: number;
  duration: number;
  timestamp: number;
  tenantId?: string;
  userId?: string;
  memoryUsage?: NodeJS.MemoryUsage;
  cpuUsage?: NodeJS.CpuUsage;
}

export interface PerformanceConfig {
  enabled: boolean;
  logSlowRequests: boolean;
  slowRequestThreshold: number; // milliseconds
  enableMemoryTracking: boolean;
  enableCpuTracking: boolean;
  enableDetailedLogging: boolean;
}

export class PerformanceMiddleware {
  private config: PerformanceConfig;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 1000;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      enabled: true,
      logSlowRequests: true,
      slowRequestThreshold: 1000, // 1 second
      enableMemoryTracking: true,
      enableCpuTracking: true,
      enableDetailedLogging: process.env.NODE_ENV === "development",
      ...config,
    };
  }

  /**
   * Start performance tracking
   */
  startTracking(req: NextRequest): PerformanceTracker {
    if (!this.config.enabled) {
      return new NoOpPerformanceTracker(req, this.config, metrics => this.recordMetrics(metrics)) as unknown as PerformanceTracker;
    }

    return new PerformanceTracker(req, this.config, metrics => this.recordMetrics(metrics));
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    // Log slow requests
    if (this.config.logSlowRequests && metrics.duration > this.config.slowRequestThreshold) {
      console.warn("Slow request detected:", {
        requestId: metrics.requestId,
        method: metrics.method,
        url: metrics.url,
        duration: metrics.duration,
        statusCode: metrics.statusCode,
        tenantId: metrics.tenantId,
      });
    }

    // Detailed logging in development
    if (this.config.enableDetailedLogging) {
      console.log("Performance metrics:", metrics);
    }
  }

  /**
   * Get performance statistics
   */
  getStats(timeWindow?: number): {
    totalRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    errorRate: number;
    requestsPerSecond: number;
    memoryUsage: NodeJS.MemoryUsage | null;
    topSlowEndpoints: Array<{ endpoint: string; avgDuration: number; count: number }>;
  } {
    const now = Date.now();
    const window = timeWindow || 60000; // 1 minute default
    const cutoff = now - window;

    const recentMetrics = this.metrics.filter(m => m.timestamp > cutoff);

    if (recentMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        slowRequests: 0,
        errorRate: 0,
        requestsPerSecond: 0,
        memoryUsage: null,
        topSlowEndpoints: [],
      };
    }

    const totalRequests = recentMetrics.length;
    const averageResponseTime =
      recentMetrics.reduce((sum, m) => sum + m.duration, 0) / totalRequests;
    const slowRequests = recentMetrics.filter(
      m => m.duration > this.config.slowRequestThreshold,
    ).length;
    const errorRequests = recentMetrics.filter(m => m.statusCode >= 400).length;
    const errorRate = (errorRequests / totalRequests) * 100;
    const requestsPerSecond = (totalRequests / window) * 1000;

    // Group by endpoint for slow endpoint analysis
    const endpointGroups = recentMetrics.reduce(
      (groups, metric) => {
        const endpoint = `${metric.method} ${metric.url}`;
        if (!groups[endpoint]) {
          groups[endpoint] = { durations: [], count: 0 };
        }
        groups[endpoint].durations.push(metric.duration);
        groups[endpoint].count++;
        return groups;
      },
      {} as Record<string, { durations: number[]; count: number }>,
    );

    const topSlowEndpoints = Object.entries(endpointGroups)
      .map(([endpoint, data]) => ({
        endpoint,
        avgDuration: data.durations.reduce((sum, d) => sum + d, 0) / data.durations.length,
        count: data.count,
      }))
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 10);

    const memoryUsage = this.config.enableMemoryTracking ? process.memoryUsage() : null;

    return {
      totalRequests,
      averageResponseTime,
      slowRequests,
      errorRate,
      requestsPerSecond,
      memoryUsage,
      topSlowEndpoints,
    };
  }

  /**
   * Get health status based on performance
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
    metrics: unknown;
  } {
    const stats = this.getStats();
    const issues: string[] = [];

    // Check response time
    if (stats.averageResponseTime > 2000) {
      issues.push(`High average response time: ${stats.averageResponseTime.toFixed(2)}ms`);
    }

    // Check error rate
    if (stats.errorRate > 5) {
      issues.push(`High error rate: ${stats.errorRate.toFixed(2)}%`);
    }

    // Check slow requests
    if (stats.slowRequests > stats.totalRequests * 0.1) {
      issues.push(
        `High slow request rate: ${((stats.slowRequests / stats.totalRequests) * 100).toFixed(2)}%`,
      );
    }

    // Check memory usage
    if (stats.memoryUsage && stats.memoryUsage.heapUsed > 500 * 1024 * 1024) {
      // 500MB
      issues.push(`High memory usage: ${(stats.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (issues.length > 0) {
      status = issues.length > 2 ? "unhealthy" : "degraded";
    }

    return {
      status,
      issues,
      metrics: stats,
    };
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }
}

export class PerformanceTracker {
  private startTime: number;
  private startCpuUsage: NodeJS.CpuUsage;
  private requestId: string;
  private method: string;
  private url: string;
  private tenantId?: string;
  private userId?: string;
  private config: PerformanceConfig;
  private onComplete: (metrics: PerformanceMetrics) => void;

  constructor(
    req: NextRequest,
    config: PerformanceConfig,
    onComplete: (metrics: PerformanceMetrics) => void,
  ) {
    this.startTime = performance.now();
    this.startCpuUsage = process.cpuUsage();
    this.requestId =
      req.headers.get("x-request-id") ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.method = req.method;
    this.url = req.url;
    this.tenantId = req.headers.get("x-tenant-id") || undefined;
    this.userId = req.headers.get("x-user-id") || undefined;
    this.config = config;
    this.onComplete = onComplete;
  }

  /**
   * Complete performance tracking
   */
  complete(res: NextResponse): void {
    const endTime = performance.now();
    const duration = endTime - this.startTime;

    const metrics: PerformanceMetrics = {
      requestId: this.requestId,
      method: this.method,
      url: this.url,
      statusCode: res.status,
      duration,
      timestamp: Date.now(),
      tenantId: this.tenantId,
      userId: this.userId,
    };

    if (this.config.enableMemoryTracking) {
      metrics.memoryUsage = process.memoryUsage();
    }

    if (this.config.enableCpuTracking) {
      metrics.cpuUsage = process.cpuUsage(this.startCpuUsage);
    }

    this.onComplete(metrics);
  }
}

export class NoOpPerformanceTracker {
  private startTime: number = 0;
  private startCpuUsage: NodeJS.CpuUsage = { user: 0, system: 0 };
  private requestId: string = "";
  private method: string = "";
  private url: string = "";
  private tenantId?: string;
  private userId?: string;
  private config: PerformanceConfig;
  private onComplete: (metrics: PerformanceMetrics) => void;

  constructor(
    _req: NextRequest,
    config: PerformanceConfig,
    onComplete: (metrics: PerformanceMetrics) => void,
  ) {
    this.config = config;
    this.onComplete = onComplete;
  }

  complete(_res: NextResponse): void {
    // No-op for disabled performance tracking
  }
}

// Middleware factory
export function createPerformanceMiddleware(config?: Partial<PerformanceConfig>) {
  return new PerformanceMiddleware(config);
}

// Next.js middleware wrapper
export function withPerformance(
  handler: (req: NextRequest) => Promise<NextResponse>,
  performanceMiddleware: PerformanceMiddleware,
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const tracker = performanceMiddleware.startTracking(req);

    try {
      const response = await handler(req);
      tracker.complete(response);
      return response;
    } catch (error) {
      // Create error response for tracking
      const errorResponse = NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      tracker.complete(errorResponse);
      throw error;
    }
  };
}
