// Error tracking for V1 compliance
// Comprehensive error monitoring with Axiom integration

import { axiom } from "../axiom";

export interface ErrorContext {
  requestId?: string;
  tenantId?: string;
  companyId?: string;
  userId?: string;
  userAgent?: string;
  ipAddress?: string;
  sessionId?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorEvent {
  id: string;
  timestamp: number;
  level: "error" | "warning" | "info";
  message: string;
  error?: Error;
  stack?: string;
  context: ErrorContext;
  fingerprint?: string;
  tags?: string[];
}

export interface ErrorSummary {
  totalErrors: number;
  errorRate: number;
  topErrors: Array<{
    message: string;
    count: number;
    lastSeen: string;
  }>;
  errorsByLevel: Record<string, number>;
  complianceStatus: {
    isCompliant: boolean;
    currentErrorRate: number;
    threshold: number;
  };
}

export class ErrorTracker {
  private static instance: ErrorTracker;
  private errorBuffer: ErrorEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private errorCounts: Map<string, number> = new Map();

  private constructor() {
    // Flush errors every 5 seconds
    this.flushInterval = setInterval(() => {
      this.flushErrors();
    }, 5000);

    // Set up global error handlers
    this.setupGlobalHandlers();
  }

  public static getInstance(): ErrorTracker {
    if (!ErrorTracker.instance) {
      ErrorTracker.instance = new ErrorTracker();
    }
    return ErrorTracker.instance;
  }

  /**
   * Track an error event
   */
  public trackError(
    error: Error | string,
    context: ErrorContext = {},
    level: "error" | "warning" | "info" = "error",
    tags: string[] = [],
  ): string {
    const errorId = this.generateErrorId();
    const timestamp = Date.now();

    const errorEvent: ErrorEvent = {
      id: errorId,
      timestamp,
      level,
      message: typeof error === "string" ? error : error.message,
      error: typeof error === "string" ? undefined : error,
      stack: typeof error === "string" ? undefined : error.stack,
      context,
      fingerprint: this.generateFingerprint(error, context),
      tags,
    };

    // Add to buffer
    this.errorBuffer.push(errorEvent);

    // Update error counts
    const fingerprint = errorEvent.fingerprint || errorEvent.message;
    this.errorCounts.set(fingerprint, (this.errorCounts.get(fingerprint) || 0) + 1);

    // Check V1 compliance
    this.checkErrorRateCompliance();

    // Immediate flush for critical errors
    if (level === "error") {
      this.flushErrors();
    }

    return errorId;
  }

  /**
   * Track API errors with additional context
   */
  public trackAPIError(
    error: Error | string,
    method: string,
    path: string,
    statusCode: number,
    context: ErrorContext = {},
  ): string {
    return this.trackError(
      error,
      {
        ...context,
        operation: `${method} ${path}`,
        metadata: {
          ...context.metadata,
          method,
          path,
          statusCode,
        },
      },
      "error",
      ["api", "http"],
    );
  }

  /**
   * Track business logic errors
   */
  public trackBusinessError(
    error: Error | string,
    operation: string,
    context: ErrorContext = {},
  ): string {
    return this.trackError(
      error,
      {
        ...context,
        operation,
        metadata: {
          ...context.metadata,
          category: "business_logic",
        },
      },
      "error",
      ["business", "logic"],
    );
  }

  /**
   * Track database errors
   */
  public trackDatabaseError(
    error: Error | string,
    query: string,
    context: ErrorContext = {},
  ): string {
    return this.trackError(
      error,
      {
        ...context,
        operation: "database_query",
        metadata: {
          ...context.metadata,
          query: query.substring(0, 200), // Truncate long queries
          category: "database",
        },
      },
      "error",
      ["database", "sql"],
    );
  }

  /**
   * Track validation errors
   */
  public trackValidationError(
    error: Error | string,
    field: string,
    value: unknown,
    context: ErrorContext = {},
  ): string {
    return this.trackError(
      error,
      {
        ...context,
        operation: "validation",
        metadata: {
          ...context.metadata,
          field,
          value: typeof value === "object" ? JSON.stringify(value) : String(value),
          category: "validation",
        },
      },
      "warning",
      ["validation", "input"],
    );
  }

  /**
   * Track security-related errors
   */
  public trackSecurityError(
    error: Error | string,
    securityEvent: string,
    context: ErrorContext = {},
  ): string {
    return this.trackError(
      error,
      {
        ...context,
        operation: securityEvent,
        metadata: {
          ...context.metadata,
          securityEvent,
          category: "security",
        },
      },
      "error",
      ["security", "auth"],
    );
  }

  /**
   * Get error summary for monitoring dashboard
   */
  public async getErrorSummary(hours: number = 1): Promise<ErrorSummary> {
    const now = Date.now();
    const cutoff = now - hours * 60 * 60 * 1000;

    const recentErrors = this.errorBuffer.filter(e => e.timestamp >= cutoff);
    const totalErrors = recentErrors.length;

    // Calculate error rate (errors per minute)
    const errorRate = totalErrors / (hours * 60);

    // Get top errors by fingerprint
    const errorCounts = new Map<string, { count: number; lastSeen: number; message: string }>();
    recentErrors.forEach(error => {
      const key = error.fingerprint || error.message;
      const existing = errorCounts.get(key);
      if (existing) {
        existing.count++;
        existing.lastSeen = Math.max(existing.lastSeen, error.timestamp);
      } else {
        errorCounts.set(key, {
          count: 1,
          lastSeen: error.timestamp,
          message: error.message,
        });
      }
    });

    const topErrors = Array.from(errorCounts.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10)
      .map(([, data]) => ({
        message: data.message,
        count: data.count,
        lastSeen: new Date(data.lastSeen).toISOString(),
      }));

    // Count errors by level
    const errorsByLevel = recentErrors.reduce(
      (acc, error) => {
        acc[error.level] = (acc[error.level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // V1 compliance check: Error rate ≤ 1%
    const threshold = 0.01; // 1%
    const isCompliant = errorRate <= threshold;

    return {
      totalErrors,
      errorRate,
      topErrors,
      errorsByLevel,
      complianceStatus: {
        isCompliant,
        currentErrorRate: errorRate,
        threshold,
      },
    };
  }

  /**
   * Setup global error handlers
   */
  private setupGlobalHandlers(): void {
    // Handle uncaught exceptions
    process.on("uncaughtException", error => {
      this.trackError(
        error,
        {
          operation: "uncaught_exception",
        },
        "error",
        ["uncaught", "critical"],
      );
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (reason, promise) => {
      this.trackError(
        reason instanceof Error ? reason : new Error(String(reason)),
        {
          operation: "unhandled_rejection",
          metadata: { promise: String(promise) },
        },
        "error",
        ["unhandled", "promise"],
      );
    });
  }

  /**
   * Flush errors to Axiom
   */
  private async flushErrors(): Promise<void> {
    if (this.errorBuffer.length === 0) return;

    const errorsToFlush = [...this.errorBuffer];
    this.errorBuffer = [];

    try {
      await axiom.ingest(
        "error_events",
        errorsToFlush.map(error => ({
          ...error,
          _time: new Date(error.timestamp).toISOString(),
          environment: process.env.NODE_ENV || "development",
          service: "aibos-accounts",
          version: process.env.APP_VERSION || "1.0.0",
          // Serialize error object for Axiom
          errorDetails: error.error
            ? {
                name: error.error.name,
                message: error.error.message,
                stack: error.error.stack,
              }
            : undefined,
        })),
      );
    } catch (error) {
      console.error("Failed to flush errors to Axiom:", error);
      // Re-add errors to buffer for retry
      this.errorBuffer.unshift(...errorsToFlush);
    }
  }

  /**
   * Check error rate compliance
   */
  private checkErrorRateCompliance(): void {
    const recentErrors = this.errorBuffer.filter(
      e => e.timestamp > Date.now() - 60 * 1000, // Last minute
    );

    const errorRate = recentErrors.length / 60; // Errors per second

    // V1 Requirement: Error rate ≤ 1%
    if (errorRate > 0.01) {
      this.reportComplianceViolation(errorRate);
    }
  }

  /**
   * Report error rate compliance violation
   */
  private async reportComplianceViolation(currentRate: number): Promise<void> {
    try {
      await axiom.ingest("compliance_violations", [
        {
          _time: new Date().toISOString(),
          type: "ERROR_RATE",
          violation: `Error rate ${currentRate} exceeds 1% threshold`,
          currentRate,
          threshold: 0.01,
          severity: "critical",
          environment: process.env.NODE_ENV || "development",
          service: "aibos-accounts",
        },
      ]);
    } catch (error) {
      console.error("Failed to report error rate violation:", error);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate error fingerprint for grouping similar errors
   */
  private generateFingerprint(error: Error | string, context: ErrorContext): string {
    const message = typeof error === "string" ? error : error.message;
    const operation = context.operation || "unknown";

    // Create a hash-like fingerprint
    const combined = `${operation}:${message}`;
    return combined
      .replace(/[0-9]+/g, "N") // Replace numbers with N
      .replace(/[a-f0-9-]{8,}/gi, "ID") // Replace IDs with ID
      .toLowerCase();
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    this.flushErrors(); // Final flush
  }
}

// Export singleton instance
export const errorTracker = ErrorTracker.getInstance();
