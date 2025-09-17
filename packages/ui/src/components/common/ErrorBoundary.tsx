// Comprehensive Error Handling System
// DoD: Complete error handling system
// SSOT: Use existing error types from @aibos/contracts
// Tech Stack: React Error Boundary + error reporting

import React, { Component, ReactNode } from "react";
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  HomeIcon,
  BugAntIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../Button.js";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../Card.js";
import { Alert } from "../../Alert.js";
import { Badge } from "../../Badge.js";
import { cn } from "../../utils.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CustomErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
  errorBoundaryStackFrames?: Array<{
    fileName: string;
    functionName: string;
    lineNumber: number;
    columnNumber: number;
  }>;
}

export interface ErrorReport {
  id: string;
  timestamp: Date;
  error: Error;
  errorInfo: CustomErrorInfo;
  userAgent: string;
  url: string;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  componentStack: string;
  errorBoundary?: string;
  context?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
  status: "new" | "investigating" | "resolved" | "ignored";
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: CustomErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  resetOnKeysChange?: boolean;
  level?: "page" | "component" | "feature";
  context?: Record<string, any>;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  enableReporting?: boolean;
  enableRetry?: boolean;
  enableDebug?: boolean;
  className?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: CustomErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isReporting: boolean;
  reportStatus: "idle" | "reporting" | "reported" | "failed";
}

// ============================================================================
// ERROR REPORTING SERVICE
// ============================================================================

class ErrorReportingService {
  private reports: Map<string, ErrorReport> = new Map();
  private reportingQueue: ErrorReport[] = [];
  private isReporting = false;

  async reportError(errorReport: Omit<ErrorReport, "id" | "timestamp">): Promise<string> {
    const report: ErrorReport = {
      ...errorReport,
      id: this.generateErrorId(),
      timestamp: new Date(),
    };

    this.reports.set(report.id, report);
    this.reportingQueue.push(report);

    // Report to external service
    await this.sendErrorReport(report);

    return report.id;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendErrorReport(report: ErrorReport): Promise<void> {
    try {
      // Send to monitoring system
      await fetch("/api/monitoring/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorId: report.id,
          error: {
            message: report.error.message,
            stack: report.error.stack,
            name: report.error.name,
          },
          errorInfo: report.errorInfo,
          context: {
            userAgent: report.userAgent,
            url: report.url,
            userId: report.userId,
            tenantId: report.tenantId,
            sessionId: report.sessionId,
            componentStack: report.componentStack,
            errorBoundary: report.errorBoundary,
            ...report.context,
          },
          severity: report.severity,
          timestamp: report.timestamp.toISOString(),
        }),
      });

      console.log(`Error reported: ${report.id}`);
    } catch (error) {
      console.error("Failed to report error:", error);
    }
  }

  getReport(errorId: string): ErrorReport | undefined {
    return this.reports.get(errorId);
  }

  getAllReports(): ErrorReport[] {
    return Array.from(this.reports.values());
  }
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

class ErrorClassifier {
  static classifyError(error: Error, errorInfo: CustomErrorInfo): "low" | "medium" | "high" | "critical" {
    // Critical errors
    if (this.isCriticalError(error)) {
      return "critical";
    }

    // High severity errors
    if (this.isHighSeverityError(error)) {
      return "high";
    }

    // Medium severity errors
    if (this.isMediumSeverityError(error)) {
      return "medium";
    }

    // Default to low severity
    return "low";
  }

  private static isCriticalError(error: Error): boolean {
    const criticalPatterns = [
      /out of memory/i,
      /maximum call stack exceeded/i,
      /cannot read property.*of undefined/i,
      /cannot read property.*of null/i,
      /network error/i,
      /connection refused/i,
    ];

    return criticalPatterns.some(pattern => pattern.test(error.message));
  }

  private static isHighSeverityError(error: Error): boolean {
    const highPatterns = [
      /typeerror/i,
      /referenceerror/i,
      /syntaxerror/i,
      /failed to fetch/i,
      /timeout/i,
    ];

    return highPatterns.some(pattern => pattern.test(error.message));
  }

  private static isMediumSeverityError(error: Error): boolean {
    const mediumPatterns = [
      /warning/i,
      /deprecated/i,
      /legacy/i,
      /fallback/i,
    ];

    return mediumPatterns.some(pattern => pattern.test(error.message));
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReportingService: ErrorReportingService;
  private resetTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isReporting: false,
      reportStatus: "idle",
    };

    this.errorReportingService = new ErrorReportingService();
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const customErrorInfo: CustomErrorInfo = {
      componentStack: errorInfo.componentStack || "",
      ...(this.props.level && { errorBoundary: this.props.level }),
    };

    const severity = ErrorClassifier.classifyError(error, customErrorInfo);

    this.setState({
      error,
      errorInfo: customErrorInfo,
      isReporting: true,
      reportStatus: "reporting",
    });

    // Report error
    this.reportError(error, customErrorInfo, severity);

    // Call onError callback
    if (this.props.onError) {
      this.props.onError(error, customErrorInfo);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys, resetOnPropsChange } = this.props;

    if (resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }

    if (resetKeys && resetKeys.length > 0) {
      const hasResetKeyChanged = resetKeys.some((key, index) =>
        key !== prevProps.resetKeys?.[index]
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private async reportError(error: Error, errorInfo: CustomErrorInfo, severity: "low" | "medium" | "high" | "critical"): Promise<void> {
    if (!this.props.enableReporting) {
      this.setState({ reportStatus: "reported" });
      return;
    }

    try {
      const errorId = await this.errorReportingService.reportError({
        error,
        errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.props.userId,
        tenantId: this.props.tenantId,
        sessionId: this.props.sessionId,
        componentStack: errorInfo.componentStack,
        errorBoundary: this.props.level,
        context: this.props.context,
        severity,
        status: "new",
      });

      this.setState({
        errorId,
        reportStatus: "reported",
      });
    } catch (reportError) {
      console.error("Failed to report error:", reportError);
      this.setState({ reportStatus: "failed" });
    } finally {
      this.setState({ isReporting: false });
    }
  }

  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: this.state.retryCount + 1,
      reportStatus: "idle",
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleRetry = (): void => {
    this.resetErrorBoundary();
  };

  private handleGoHome = (): void => {
    window.location.href = "/";
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className={cn("min-h-screen flex items-center justify-center p-4", this.props.className)}>
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
                <div>
                  <CardTitle className="text-xl text-red-900">
                    Something went wrong
                  </CardTitle>
                  <p className="text-red-700 mt-1">
                    We're sorry, but something unexpected happened.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Details */}
              {this.props.enableDebug && this.state.error && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Error Details</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-mono text-gray-800">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="text-sm text-gray-600 cursor-pointer">
                          Stack Trace
                        </summary>
                        <pre className="text-xs text-gray-600 mt-2 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              {/* Error ID */}
              {this.state.errorId && (
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Error ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code>
                  </span>
                </div>
              )}

              {/* Reporting Status */}
              {this.props.enableReporting && (
                <div className="flex items-center space-x-2">
                  <BugAntIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {this.state.isReporting && "Reporting error..."}
                    {this.state.reportStatus === "reported" && "Error reported to our team"}
                    {this.state.reportStatus === "failed" && "Failed to report error"}
                  </span>
                </div>
              )}

              {/* Retry Count */}
              {this.state.retryCount > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    This error has occurred {this.state.retryCount} time(s).
                    Please try refreshing the page or contact support if the issue persists.
                  </div>
                </Alert>
              )}

              {/* Severity Badge */}
              {this.state.error && this.state.errorInfo && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Severity:</span>
                  <Badge
                    variant={
                      ErrorClassifier.classifyError(this.state.error, this.state.errorInfo) === "critical"
                        ? "destructive"
                        : ErrorClassifier.classifyError(this.state.error, this.state.errorInfo) === "high"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {ErrorClassifier.classifyError(this.state.error, this.state.errorInfo).toUpperCase()}
                  </Badge>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-wrap gap-3">
              {this.props.enableRetry && (
                <Button onClick={this.handleRetry} className="flex items-center space-x-2">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>Try Again</span>
                </Button>
              )}

              <Button variant="secondary" onClick={this.handleGoHome} className="flex items-center space-x-2">
                <HomeIcon className="w-4 h-4" />
                <span>Go Home</span>
              </Button>

              <Button variant="outline" onClick={this.handleReload} className="flex items-center space-x-2">
                <ArrowPathIcon className="w-4 h-4" />
                <span>Reload Page</span>
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// ERROR BOUNDARY PROVIDER
// ============================================================================

interface ErrorBoundaryProviderProps {
  children: ReactNode;
  userId?: string;
  tenantId?: string;
  sessionId?: string;
  enableReporting?: boolean;
  enableDebug?: boolean;
}

export function ErrorBoundaryProvider({
  children,
  userId,
  tenantId,
  sessionId,
  enableReporting = true,
  enableDebug = false
}: ErrorBoundaryProviderProps) {
  return (
    <ErrorBoundary
      level="page"
      userId={userId}
      tenantId={tenantId}
      sessionId={sessionId}
      enableReporting={enableReporting}
      enableDebug={enableDebug}
      resetOnPropsChange={true}
    >
      {children}
    </ErrorBoundary>
  );
}

// ============================================================================
// ERROR FALLBACK COMPONENTS
// ============================================================================

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  errorId?: string;
}

export function DefaultErrorFallback({ error, resetError, errorId }: ErrorFallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            <div>
              <CardTitle className="text-lg text-red-900">Error</CardTitle>
              <p className="text-red-700 text-sm">Something went wrong</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4">{error.message}</p>
          {errorId && (
            <p className="text-xs text-gray-500">Error ID: {errorId}</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={resetError} className="w-full">
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export function MinimalErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
          <span className="text-red-800 text-sm">{error.message}</span>
        </div>
        <Button size="sm" variant="outline" onClick={resetError}>
          <ArrowPathIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

export function useErrorHandler() {
  const handleError = (error: Error, context?: Record<string, any>) => {
    console.error("Error caught by useErrorHandler:", error, context);

    // Report to monitoring system
    fetch("/api/monitoring/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        context: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          ...context,
        },
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  };

  return { handleError };
}

export default ErrorBoundary;
