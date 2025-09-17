/**
 * Comprehensive Error Handling System
 * Provides centralized error handling, logging, and user feedback
 */
// @ts-nocheck


import { toast } from "sonner";

export enum ErrorType {
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  NETWORK = "network",
  DATABASE = "database",
  BUSINESS_RULE = "business_rule",
  SYSTEM = "system",
  UNKNOWN = "unknown",
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: string;
  code?: string;
  timestamp: Date;
  userId?: string;
  companyId?: string;
  context?: Record<string, any>;
  stack?: string;
}

export interface ErrorHandlingOptions {
  showToast?: boolean;
  logError?: boolean;
  reportError?: boolean;
  fallbackMessage?: string;
  context?: Record<string, any>;
}

class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorQueue: AppError[] = [];
  private maxQueueSize = 100;

  static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Handle any error with comprehensive processing
   */
  handleError(error: Error | AppError | string, options: ErrorHandlingOptions = {}): AppError {
    const appError = this.normalizeError(error, options.context);

    // Default options
    const {
      showToast = true,
      logError = true,
      reportError = appError.severity === ErrorSeverity.CRITICAL,
      fallbackMessage = "An unexpected error occurred",
    } = options;

    // Log error
    if (logError) {
      this.logError(appError);
    }

    // Show user feedback
    if (showToast) {
      this.showUserFeedback(appError, fallbackMessage);
    }

    // Report critical errors
    if (reportError) {
      this.reportError(appError);
    }

    // Add to queue for analysis
    this.addToQueue(appError);

    return appError;
  }

  /**
   * Handle validation errors specifically
   */
  handleValidationError(
    errors: Record<string, string[]> | string[],
    context?: Record<string, any>,
  ): AppError {
    const message = Array.isArray(errors)
      ? errors.join(", ")
      : Object.values(errors).flat().join(", ");

    return this.handleError(
      this.createAppError(
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        `Validation failed: ${message}`,
        { validationErrors: errors },
      ),
      { context, fallbackMessage: "Please check your input and try again" },
    );
  }

  /**
   * Handle authentication errors
   */
  handleAuthError(error: Error | string, context?: Record<string, any>): AppError {
    return this.handleError(
      this.createAppError(
        ErrorType.AUTHENTICATION,
        ErrorSeverity.HIGH,
        typeof error === "string" ? error : error.message,
        { originalError: error },
      ),
      { context, fallbackMessage: "Authentication failed. Please sign in again." },
    );
  }

  /**
   * Handle authorization errors
   */
  handleAuthorizationError(
    action: string,
    resource: string,
    context?: Record<string, any>,
  ): AppError {
    return this.handleError(
      this.createAppError(
        ErrorType.AUTHORIZATION,
        ErrorSeverity.HIGH,
        `Access denied: Cannot ${action} ${resource}`,
        { action, resource },
      ),
      { context, fallbackMessage: "You do not have permission to perform this action" },
    );
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: Error, context?: Record<string, any>): AppError {
    const isOffline = !navigator.onLine;
    const message = isOffline
      ? "You appear to be offline. Please check your internet connection."
      : "Network error occurred. Please try again.";

    return this.handleError(
      this.createAppError(ErrorType.NETWORK, ErrorSeverity.MEDIUM, message, {
        originalError: error,
        isOffline,
      }),
      { context },
    );
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error: Error, operation: string, context?: Record<string, any>): AppError {
    return this.handleError(
      this.createAppError(
        ErrorType.DATABASE,
        ErrorSeverity.HIGH,
        `Database error during ${operation}`,
        { originalError: error, operation },
      ),
      { context, fallbackMessage: "A database error occurred. Please try again later." },
    );
  }

  /**
   * Handle business rule violations
   */
  handleBusinessRuleError(rule: string, message: string, context?: Record<string, any>): AppError {
    return this.handleError(
      this.createAppError(ErrorType.BUSINESS_RULE, ErrorSeverity.MEDIUM, message, {
        rule,
        ...context,
      }),
      { context, showToast: true },
    );
  }

  /**
   * Handle system errors
   */
  handleSystemError(error: Error, context?: Record<string, any>): AppError {
    return this.handleError(
      this.createAppError(ErrorType.SYSTEM, ErrorSeverity.CRITICAL, "A system error occurred", {
        originalError: error,
      }),
      { context, fallbackMessage: "A system error occurred. Our team has been notified." },
    );
  }

  /**
   * Create a standardized AppError
   */
  private createAppError(
    type: ErrorType,
    severity: ErrorSeverity,
    message: string,
    details?: Record<string, any>,
  ): AppError {
    return {
      id: this.generateErrorId(),
      type,
      severity,
      message,
      details: details ? JSON.stringify(details) : undefined,
      timestamp: new Date(),
      context: details,
    };
  }

  /**
   * Normalize any error to AppError format
   */
  private normalizeError(
    error: Error | AppError | string,
    context?: Record<string, any>,
  ): AppError {
    if (typeof error === "string") {
      return this.createAppError(ErrorType.UNKNOWN, ErrorSeverity.MEDIUM, error, context);
    }

    if ("type" in error && "severity" in error) {
      // Already an AppError
      return { ...error, context: { ...error.context, ...context } };
    }

    // Regular Error object
    const appError = this.createAppError(
      this.categorizeError(error),
      this.determineSeverity(error),
      error.message,
      { ...context, stack: error.stack },
    );

    return appError;
  }

  /**
   * Categorize error based on message and properties
   */
  private categorizeError(error: Error): ErrorType {
    const message = error.message.toLowerCase();

    if (message.includes("auth") || message.includes("unauthorized")) {
      return ErrorType.AUTHENTICATION;
    }
    if (message.includes("permission") || message.includes("forbidden")) {
      return ErrorType.AUTHORIZATION;
    }
    if (message.includes("network") || message.includes("fetch")) {
      return ErrorType.NETWORK;
    }
    if (message.includes("database") || message.includes("sql")) {
      return ErrorType.DATABASE;
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();

    if (message.includes("critical") || message.includes("fatal")) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes("auth") || message.includes("permission")) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes("validation") || message.includes("business")) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Log error to console and external services
   */
  private logError(error: AppError): void {
    const logData = {
      id: error.id,
      type: error.type,
      severity: error.severity,
      message: error.message,
      timestamp: error.timestamp.toISOString(),
      context: error.context,
    };

    // Console logging with appropriate level
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error("🚨 CRITICAL ERROR:", logData);
        break;
      case ErrorSeverity.HIGH:
        console.error("❌ HIGH SEVERITY ERROR:", logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn("⚠️ MEDIUM SEVERITY ERROR:", logData);
        break;
      case ErrorSeverity.LOW:
        console.info("ℹ️ LOW SEVERITY ERROR:", logData);
        break;
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === "production") {
      this.sendToExternalLogger(error);
    }
  }

  /**
   * Show user-friendly feedback
   */
  private showUserFeedback(error: AppError, fallbackMessage: string): void {
    const message = this.getUserFriendlyMessage(error) || fallbackMessage;

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        toast.error(message, {
          duration: 10000,
          description: "Our team has been notified and is working on a fix.",
        });
        break;
      case ErrorSeverity.HIGH:
        toast.error(message, { duration: 8000 });
        break;
      case ErrorSeverity.MEDIUM:
        toast.warning(message, { duration: 6000 });
        break;
      case ErrorSeverity.LOW:
        toast.info(message, { duration: 4000 });
        break;
    }
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return error.message.replace("Validation failed: ", "");
      case ErrorType.AUTHENTICATION:
        return "Please sign in to continue";
      case ErrorType.AUTHORIZATION:
        return "You do not have permission to perform this action";
      case ErrorType.NETWORK:
        return "Connection issue. Please check your internet and try again.";
      case ErrorType.DATABASE:
        return "Data operation failed. Please try again.";
      case ErrorType.BUSINESS_RULE:
        return error.message;
      default:
        return error.message;
    }
  }

  /**
   * Report error to external monitoring service
   */
  private reportError(error: AppError): void {
    // In production, integrate with services like Sentry, Bugsnag, etc.
    if (process.env.NODE_ENV === "production") {
      // Example: Sentry.captureException(error)
      console.log("📊 Reporting error to monitoring service:", error.id);
    }
  }

  /**
   * Send to external logging service
   */
  private sendToExternalLogger(error: AppError): void {
    // In production, send to services like LogRocket, DataDog, etc.
    console.log("📝 Sending to external logger:", error.id);
  }

  /**
   * Add error to queue for analysis
   */
  private addToQueue(error: AppError): void {
    this.errorQueue.push(error);

    // Maintain queue size
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    this.errorQueue.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
    });

    return {
      total: this.errorQueue.length,
      byType,
      bySeverity,
      recent: this.errorQueue.slice(-10),
    };
  }

  /**
   * Clear error queue
   */
  clearErrorQueue(): void {
    this.errorQueue = [];
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance();

// Convenience functions
export const handleError = (error: Error | string, options?: ErrorHandlingOptions) =>
  errorHandler.handleError(error, options);

export const handleValidationError = (
  errors: Record<string, string[]> | string[],
  context?: Record<string, any>,
) => errorHandler.handleValidationError(errors, context);

export const handleAuthError = (error: Error | string, context?: Record<string, any>) =>
  errorHandler.handleAuthError(error, context);

export const handleAuthorizationError = (
  action: string,
  resource: string,
  context?: Record<string, any>,
) => errorHandler.handleAuthorizationError(action, resource, context);

export const handleNetworkError = (error: Error, context?: Record<string, any>) =>
  errorHandler.handleNetworkError(error, context);

export const handleDatabaseError = (
  error: Error,
  operation: string,
  context?: Record<string, any>,
) => errorHandler.handleDatabaseError(error, operation, context);

export const handleBusinessRuleError = (
  rule: string,
  message: string,
  context?: Record<string, any>,
) => errorHandler.handleBusinessRuleError(rule, message, context);

export const handleSystemError = (error: Error, context?: Record<string, any>) =>
  errorHandler.handleSystemError(error, context);

// Global error boundary handler
export const setupGlobalErrorHandling = () => {
  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", event => {
    handleSystemError(new Error(event.reason), { type: "unhandledrejection" });
  });

  // Handle uncaught errors
  window.addEventListener("error", event => {
    handleSystemError(event.error, {
      type: "uncaught",
      filename: event.filename,
      lineno: event.lineno,
    });
  });
};
