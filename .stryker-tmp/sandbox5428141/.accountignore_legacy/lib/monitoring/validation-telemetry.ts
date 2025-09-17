/**
 * Validation Telemetry and Monitoring Service
 * Enterprise-grade monitoring for GL Entry validation performance and errors
 */
// @ts-nocheck


export interface ValidationMetrics {
  validationCount: number;
  successRate: number;
  averageProcessingTime: number;
  errorsByCode: Record<string, number>;
  warningsByCode: Record<string, number>;
  performancePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

export interface ValidationEvent {
  eventId: string;
  timestamp: string;
  companyId: string;
  voucherType: string;
  voucherNo: string;
  eventType: "validation_success" | "validation_failure" | "validation_warning";
  processingTimeMs: number;
  errorCount: number;
  warningCount: number;
  entryCount: number;
  totalAmount: number;
  errors?: Array<{
    code: string;
    field: string;
    message: string;
    severity: string;
    category: string;
  }>;
  warnings?: Array<{
    code: string;
    field: string;
    message: string;
    severity: string;
    category: string;
  }>;
  context?: {
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    userId?: string;
  };
}

export interface PerformanceAlert {
  alertId: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
  type: "performance_degradation" | "error_spike" | "validation_failure_rate" | "cache_miss_rate";
  message: string;
  metrics: Record<string, number>;
  companyId?: string;
  voucherType?: string;
}

class ValidationTelemetryService {
  private events: ValidationEvent[] = [];
  private metrics: Map<string, ValidationMetrics> = new Map();
  private alerts: PerformanceAlert[] = [];
  private metricsBuffer: ValidationEvent[] = [];
  private readonly maxBufferSize = 1000;
  private readonly metricsFlushInterval = 60000; // 1 minute

  constructor() {
    // Start metrics aggregation
    this.startMetricsAggregation();

    // Set up graceful shutdown
    process.on("SIGTERM", () => this.shutdown());
    process.on("SIGINT", () => this.shutdown());
  }

  /**
   * Record a validation event
   */
  async recordValidationEvent(
    event: Omit<ValidationEvent, "eventId" | "timestamp">,
  ): Promise<void> {
    const validationEvent: ValidationEvent = {
      ...event,
      eventId: this.generateEventId(),
      timestamp: new Date().toISOString(),
    };

    // Add to buffer for metrics aggregation
    this.metricsBuffer.push(validationEvent);

    // Keep buffer size manageable
    if (this.metricsBuffer.length > this.maxBufferSize) {
      this.metricsBuffer = this.metricsBuffer.slice(-this.maxBufferSize);
    }

    // Store recent events for debugging
    this.events.push(validationEvent);
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }

    // Check for performance alerts
    await this.checkPerformanceAlerts(validationEvent);

    // Send to external monitoring service in production
    if (process.env.NODE_ENV === "production") {
      await this.sendToExternalMonitoring(validationEvent);
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      this.logEventToConsole(validationEvent);
    }
  }

  /**
   * Get current validation metrics
   */
  getMetrics(companyId?: string, voucherType?: string): ValidationMetrics {
    const key = this.getMetricsKey(companyId, voucherType);
    return this.metrics.get(key) || this.getDefaultMetrics();
  }

  /**
   * Get recent validation events
   */
  getRecentEvents(limit: number = 50, companyId?: string): ValidationEvent[] {
    let events = this.events;

    if (companyId) {
      events = events.filter(e => e.companyId === companyId);
    }

    return events
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get performance alerts
   */
  getAlerts(severity?: PerformanceAlert["severity"]): PerformanceAlert[] {
    let alerts = this.alerts;

    if (severity) {
      alerts = alerts.filter(a => a.severity === severity);
    }

    return alerts
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);
  }

  /**
   * Clear old alerts
   */
  clearOldAlerts(olderThanHours: number = 24): void {
    const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => new Date(alert.timestamp) > cutoff);
  }

  /**
   * Get validation health status
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    metrics: ValidationMetrics;
    alerts: number;
    lastEventTime?: string;
  } {
    const overallMetrics = this.getMetrics();
    const criticalAlerts = this.getAlerts("critical").length;
    const highAlerts = this.getAlerts("high").length;

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    // Determine health status
    if (criticalAlerts > 0 || overallMetrics.successRate < 0.8) {
      status = "unhealthy";
    } else if (
      highAlerts > 0 ||
      overallMetrics.successRate < 0.95 ||
      overallMetrics.averageProcessingTime > 1000
    ) {
      status = "degraded";
    }

    return {
      status,
      metrics: overallMetrics,
      alerts: criticalAlerts + highAlerts,
      lastEventTime:
        this.events.length > 0 ? this.events[this.events.length - 1].timestamp : undefined,
    };
  }

  /**
   * Export metrics for external systems
   */
  exportMetrics(): {
    timestamp: string;
    metrics: Record<string, ValidationMetrics>;
    events: ValidationEvent[];
    alerts: PerformanceAlert[];
    health: ReturnType<ValidationTelemetryService["getHealthStatus"]>;
  } {
    const metricsMap: Record<string, ValidationMetrics> = {};
    this.metrics.forEach((metrics, key) => {
      metricsMap[key] = metrics;
    });

    return {
      timestamp: new Date().toISOString(),
      metrics: metricsMap,
      events: this.getRecentEvents(100),
      alerts: this.getAlerts(),
      health: this.getHealthStatus(),
    };
  }

  /**
   * Start metrics aggregation process
   */
  private startMetricsAggregation(): void {
    setInterval(() => {
      this.aggregateMetrics();
    }, this.metricsFlushInterval);
  }

  /**
   * Aggregate metrics from buffer
   */
  private aggregateMetrics(): void {
    if (this.metricsBuffer.length === 0) return;

    // Group events by company and voucher type
    const groups = new Map<string, ValidationEvent[]>();

    this.metricsBuffer.forEach(event => {
      const key = this.getMetricsKey(event.companyId, event.voucherType);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(event);
    });

    // Calculate metrics for each group
    groups.forEach((events, key) => {
      const metrics = this.calculateMetrics(events);
      this.metrics.set(key, metrics);
    });

    // Also calculate overall metrics
    const overallMetrics = this.calculateMetrics(this.metricsBuffer);
    this.metrics.set("overall", overallMetrics);

    // Clear buffer
    this.metricsBuffer = [];
  }

  /**
   * Calculate metrics from events
   */
  private calculateMetrics(events: ValidationEvent[]): ValidationMetrics {
    if (events.length === 0) return this.getDefaultMetrics();

    const successCount = events.filter(e => e.eventType === "validation_success").length;
    const processingTimes = events.map(e => e.processingTimeMs).sort((a, b) => a - b);

    const errorsByCode: Record<string, number> = {};
    const warningsByCode: Record<string, number> = {};

    events.forEach(event => {
      event.errors?.forEach(error => {
        errorsByCode[error.code] = (errorsByCode[error.code] || 0) + 1;
      });
      event.warnings?.forEach(warning => {
        warningsByCode[warning.code] = (warningsByCode[warning.code] || 0) + 1;
      });
    });

    return {
      validationCount: events.length,
      successRate: successCount / events.length,
      averageProcessingTime:
        processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length,
      errorsByCode,
      warningsByCode,
      performancePercentiles: {
        p50: processingTimes[Math.floor(processingTimes.length * 0.5)] || 0,
        p95: processingTimes[Math.floor(processingTimes.length * 0.95)] || 0,
        p99: processingTimes[Math.floor(processingTimes.length * 0.99)] || 0,
      },
    };
  }

  /**
   * Check for performance alerts
   */
  private async checkPerformanceAlerts(event: ValidationEvent): Promise<void> {
    const recentEvents = this.metricsBuffer.slice(-50); // Last 50 events

    // Check for slow validation
    if (event.processingTimeMs > 2000) {
      await this.createAlert({
        severity: "high",
        type: "performance_degradation",
        message: `Slow validation detected: ${event.processingTimeMs}ms for ${event.voucherType} ${event.voucherNo}`,
        metrics: { processingTime: event.processingTimeMs },
        companyId: event.companyId,
        voucherType: event.voucherType,
      });
    }

    // Check for error spikes
    const recentErrors = recentEvents.filter(e => e.eventType === "validation_failure");
    if (recentErrors.length > 10) {
      await this.createAlert({
        severity: "medium",
        type: "error_spike",
        message: `High error rate detected: ${recentErrors.length} failures in recent validations`,
        metrics: { errorCount: recentErrors.length, totalEvents: recentEvents.length },
      });
    }

    // Check for validation failure rate
    if (recentEvents.length >= 20) {
      const failureRate = recentErrors.length / recentEvents.length;
      if (failureRate > 0.2) {
        await this.createAlert({
          severity: failureRate > 0.5 ? "critical" : "high",
          type: "validation_failure_rate",
          message: `High validation failure rate: ${(failureRate * 100).toFixed(1)}%`,
          metrics: { failureRate, totalEvents: recentEvents.length },
        });
      }
    }
  }

  /**
   * Create a performance alert
   */
  private async createAlert(alert: Omit<PerformanceAlert, "alertId" | "timestamp">): Promise<void> {
    const performanceAlert: PerformanceAlert = {
      ...alert,
      alertId: this.generateEventId(),
      timestamp: new Date().toISOString(),
    };

    this.alerts.push(performanceAlert);

    // Keep alerts manageable
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    // Log critical alerts immediately
    if (alert.severity === "critical") {
      console.error("🚨 CRITICAL VALIDATION ALERT:", performanceAlert);
    }

    // Send to external alerting system in production
    if (process.env.NODE_ENV === "production") {
      await this.sendAlertToExternalSystem(performanceAlert);
    }
  }

  /**
   * Send event to external monitoring service
   */
  private async sendToExternalMonitoring(event: ValidationEvent): Promise<void> {
    try {
      // In a real implementation, this would send to services like:
      // - DataDog, New Relic, Sentry, etc.
      // - Custom analytics endpoints
      // - Logging services like CloudWatch, Splunk, etc.

      // Example implementation:
      // await fetch(process.env.MONITORING_ENDPOINT, {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(event)
      // })

      console.log("📊 Validation event sent to monitoring service:", event.eventId);
    } catch (error) {
      console.warn("Failed to send validation event to monitoring service:", error);
    }
  }

  /**
   * Send alert to external alerting system
   */
  private async sendAlertToExternalSystem(alert: PerformanceAlert): Promise<void> {
    try {
      // In a real implementation, this would send to:
      // - PagerDuty, Slack, email notifications
      // - Incident management systems
      // - Custom webhook endpoints

      console.log("🚨 Alert sent to external system:", alert.alertId);
    } catch (error) {
      console.warn("Failed to send alert to external system:", error);
    }
  }

  /**
   * Log event to console in development
   */
  private logEventToConsole(event: ValidationEvent): void {
    const emoji =
      event.eventType === "validation_success"
        ? "✅"
        : event.eventType === "validation_failure"
          ? "❌"
          : "⚠️";

    console.log(
      `${emoji} Validation ${event.eventType}: ${event.voucherType} ${event.voucherNo} ` +
        `(${event.processingTimeMs}ms, ${event.errorCount} errors, ${event.warningCount} warnings)`,
    );

    if (event.errors && event.errors.length > 0) {
      console.log("  Errors:", event.errors.map(e => `${e.code}: ${e.message}`).join(", "));
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `val_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get metrics key for grouping
   */
  private getMetricsKey(companyId?: string, voucherType?: string): string {
    if (companyId && voucherType) {
      return `${companyId}_${voucherType}`;
    } else if (companyId) {
      return companyId;
    } else if (voucherType) {
      return `all_${voucherType}`;
    }
    return "overall";
  }

  /**
   * Get default metrics structure
   */
  private getDefaultMetrics(): ValidationMetrics {
    return {
      validationCount: 0,
      successRate: 1.0,
      averageProcessingTime: 0,
      errorsByCode: {},
      warningsByCode: {},
      performancePercentiles: {
        p50: 0,
        p95: 0,
        p99: 0,
      },
    };
  }

  /**
   * Graceful shutdown
   */
  private async shutdown(): Promise<void> {
    console.log("Shutting down validation telemetry service...");

    // Flush remaining metrics
    this.aggregateMetrics();

    // Export final metrics
    const finalMetrics = this.exportMetrics();
    console.log("Final validation metrics:", JSON.stringify(finalMetrics, null, 2));
  }
}

// Export singleton instance
export const validationTelemetry = new ValidationTelemetryService();

// Export utilities
export const ValidationTelemetryUtils = {
  formatMetrics: (metrics: ValidationMetrics) => {
    return {
      "Total Validations": metrics.validationCount.toLocaleString(),
      "Success Rate": `${(metrics.successRate * 100).toFixed(2)}%`,
      "Avg Processing Time": `${metrics.averageProcessingTime.toFixed(2)}ms`,
      "P95 Processing Time": `${metrics.performancePercentiles.p95}ms`,
      "Top Errors":
        Object.entries(metrics.errorsByCode)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([code, count]) => `${code}: ${count}`)
          .join(", ") || "None",
    };
  },

  getPerformanceGrade: (metrics: ValidationMetrics): "A" | "B" | "C" | "D" | "F" => {
    const successRate = metrics.successRate;
    const avgTime = metrics.averageProcessingTime;

    if (successRate >= 0.99 && avgTime <= 100) return "A";
    if (successRate >= 0.95 && avgTime <= 300) return "B";
    if (successRate >= 0.9 && avgTime <= 500) return "C";
    if (successRate >= 0.8 && avgTime <= 1000) return "D";
    return "F";
  },

  createPerformanceReport: (metrics: ValidationMetrics) => {
    const grade = ValidationTelemetryUtils.getPerformanceGrade(metrics);
    const formatted = ValidationTelemetryUtils.formatMetrics(metrics);

    return {
      grade,
      summary: `Performance Grade: ${grade}`,
      details: formatted,
      recommendations: ValidationTelemetryUtils.getRecommendations(metrics),
    };
  },

  getRecommendations: (metrics: ValidationMetrics): string[] => {
    const recommendations: string[] = [];

    if (metrics.successRate < 0.95) {
      recommendations.push("Investigate and fix common validation errors to improve success rate");
    }

    if (metrics.averageProcessingTime > 500) {
      recommendations.push(
        "Optimize validation logic and database queries to reduce processing time",
      );
    }

    if (metrics.performancePercentiles.p95 > 1000) {
      recommendations.push("Address performance outliers that cause slow validations");
    }

    const topErrors = Object.entries(metrics.errorsByCode)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    if (topErrors.length > 0) {
      recommendations.push(
        `Focus on fixing top error: ${topErrors[0][0]} (${topErrors[0][1]} occurrences)`,
      );
    }

    return recommendations;
  },
};
