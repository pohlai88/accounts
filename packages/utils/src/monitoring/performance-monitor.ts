// Performance monitoring for V1 compliance
// Tracks API P95 ≤ 500ms, UI TTFB ≤ 200ms, Error rate ≤ 1%

import { performance } from "perf_hooks";
import { axiom } from "@aibos/utils/axiom";

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface APIMetrics extends PerformanceMetrics {
  method: string;
  path: string;
  statusCode: number;
  requestId: string;
  tenantId?: string;
  companyId?: string;
  userId?: string;
}

export interface UIMetrics extends PerformanceMetrics {
  page: string;
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  fid: number;
  userAgent: string;
  sessionId: string;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsBuffer: PerformanceMetrics[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Flush metrics every 10 seconds
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 10000);
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Track API performance metrics
   */
  public trackAPI(metrics: APIMetrics): void {
    // Add to buffer
    this.metricsBuffer.push(metrics);

    // Check V1 compliance thresholds
    this.checkAPICompliance(metrics);

    // Immediate flush for errors or slow requests
    if (!metrics.success || metrics.duration > 1000) {
      this.flushMetrics();
    }
  }

  /**
   * Track UI performance metrics
   */
  public trackUI(metrics: UIMetrics): void {
    // Add to buffer
    this.metricsBuffer.push(metrics);

    // Check V1 compliance thresholds
    this.checkUICompliance(metrics);

    // Immediate flush for poor performance
    if (metrics.ttfb > 200 || metrics.lcp > 2500) {
      this.flushMetrics();
    }
  }

  /**
   * Track custom operation performance
   */
  public trackOperation(
    operation: string,
    duration: number,
    success: boolean,
    metadata?: Record<string, unknown>,
    error?: string,
  ): void {
    const metrics: PerformanceMetrics = {
      operation,
      duration,
      timestamp: Date.now(),
      success,
      error,
      metadata,
    };

    this.metricsBuffer.push(metrics);

    // Immediate flush for errors or slow operations
    if (!success || duration > 5000) {
      this.flushMetrics();
    }
  }

  /**
   * Create a performance timer for measuring operations
   */
  public createTimer(operation: string, metadata?: Record<string, unknown>) {
    const startTime = performance.now();

    return {
      end: (success: boolean = true, error?: string) => {
        const duration = performance.now() - startTime;
        this.trackOperation(operation, duration, success, metadata, error);
        return duration;
      },
    };
  }

  /**
   * Flush metrics to Axiom
   */
  private async flushMetrics(): Promise<void> {
    if (this.metricsBuffer.length === 0) { return; }

    const metricsToFlush = [...this.metricsBuffer];
    this.metricsBuffer = [];

    try {
      // Send to Axiom
      await axiom.ingest(
        "performance_metrics",
        metricsToFlush.map(metric => ({
          ...metric,
          _time: new Date(metric.timestamp).toISOString(),
          environment: process.env.NODE_ENV || "development",
          service: "aibos-accounts",
          version: process.env.APP_VERSION || "1.0.0",
        })),
      );
    } catch (error) {
      console.error("Failed to flush performance metrics:", error);
      // Re-add metrics to buffer for retry
      this.metricsBuffer.unshift(...metricsToFlush);
    }
  }

  /**
   * Check API compliance against V1 thresholds
   */
  private checkAPICompliance(metrics: APIMetrics): void {
    const violations: string[] = [];

    // V1 Requirement: API P95 ≤ 500ms
    if (metrics.duration > 500) {
      violations.push(`API response time ${metrics.duration}ms exceeds 500ms threshold`);
    }

    // V1 Requirement: Error rate ≤ 1%
    if (!metrics.success && metrics.statusCode >= 500) {
      violations.push(`Server error: ${metrics.statusCode} - ${metrics.error}`);
    }

    if (violations.length > 0) {
      this.reportComplianceViolation("API_PERFORMANCE", violations, metrics);
    }
  }

  /**
   * Check UI compliance against V1 thresholds
   */
  private checkUICompliance(metrics: UIMetrics): void {
    const violations: string[] = [];

    // V1 Requirement: UI TTFB ≤ 200ms
    if (metrics.ttfb > 200) {
      violations.push(`TTFB ${metrics.ttfb}ms exceeds 200ms threshold`);
    }

    // Additional Web Vitals checks
    if (metrics.lcp > 2500) {
      violations.push(`LCP ${metrics.lcp}ms exceeds 2500ms threshold`);
    }

    if (metrics.cls > 0.1) {
      violations.push(`CLS ${metrics.cls} exceeds 0.1 threshold`);
    }

    if (metrics.fid > 100) {
      violations.push(`FID ${metrics.fid}ms exceeds 100ms threshold`);
    }

    if (violations.length > 0) {
      this.reportComplianceViolation("UI_PERFORMANCE", violations, metrics);
    }
  }

  /**
   * Report V1 compliance violations
   */
  private async reportComplianceViolation(
    type: string,
    violations: string[],
    metrics: PerformanceMetrics,
  ): Promise<void> {
    try {
      await axiom.ingest("compliance_violations", [
        {
          _time: new Date().toISOString(),
          type,
          violations,
          metrics,
          severity: "warning",
          environment: process.env.NODE_ENV || "development",
          service: "aibos-accounts",
        },
      ]);
    } catch (error) {
      console.error("Failed to report compliance violation:", error);
    }
  }

  /**
   * Get performance summary for the last period
   */
  public async getPerformanceSummary(_hours: number = 1): Promise<{
    apiMetrics: {
      averageResponseTime: number;
      p95ResponseTime: number;
      errorRate: number;
      totalRequests: number;
    };
    uiMetrics: {
      averageTTFB: number;
      p95TTFB: number;
      averageLCP: number;
      averageCLS: number;
    };
    complianceStatus: {
      apiCompliant: boolean;
      uiCompliant: boolean;
      violations: string[];
    };
  }> {
    // This would query Axiom for aggregated metrics
    // For now, return a placeholder implementation
    return {
      apiMetrics: {
        averageResponseTime: 0,
        p95ResponseTime: 0,
        errorRate: 0,
        totalRequests: 0,
      },
      uiMetrics: {
        averageTTFB: 0,
        p95TTFB: 0,
        averageLCP: 0,
        averageCLS: 0,
      },
      complianceStatus: {
        apiCompliant: true,
        uiCompliant: true,
        violations: [],
      },
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushMetrics(); // Final flush
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();
