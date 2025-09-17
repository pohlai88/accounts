// @ts-nocheck
import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home, Bug } from "lucide-react";
import { cn } from "@aibos/ui/utils";
import { Button } from "@aibos/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@aibos/ui/Card";

// Error types from @aibos/contracts
export interface ErrorDetails {
    message: string;
    stack?: string;
    componentStack?: string;
    errorBoundary?: string;
    timestamp: string;
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
}

export interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
    errorId: string;
    retryCount: number;
}

export interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo, errorDetails: ErrorDetails) => void;
    onRetry?: () => void;
    onReset?: () => void;
    className?: string;
    showDetails?: boolean;
    maxRetries?: number;
    retryDelay?: number;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    private retryTimeoutId: NodeJS.Timeout | null = null;

    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
            errorId: "",
            retryCount: 0,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
        return {
            hasError: true,
            error,
            errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        const errorDetails: ErrorDetails = {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack || undefined,
            errorBoundary: this.constructor.name,
            timestamp: new Date().toISOString(),
            userId: this.getUserId(),
            sessionId: this.getSessionId(),
            url: window.location.href,
            userAgent: navigator.userAgent,
        };

        // Log error to console in development
        if (process.env.NODE_ENV === "development") {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
            console.error("Error Details:", errorDetails);
        }

        // Call onError callback if provided
        this.props.onError?.(error, errorInfo, errorDetails);

        // Send error to monitoring service in production
        if (process.env.NODE_ENV === "production") {
            this.sendErrorToMonitoring(errorDetails);
        }

        this.setState({
            error,
            errorInfo,
        });
    }

    private getUserId(): string | undefined {
        // Try to get user ID from various sources
        try {
            // Check if there's a user context or store
            const userElement = document.querySelector('[data-user-id]');
            if (userElement) {
                const userId = userElement.getAttribute('data-user-id');
                return userId || undefined;
            }
        } catch {
            // Ignore errors
        }
        return undefined;
    }

    private getSessionId(): string | undefined {
        try {
            // Try to get session ID from sessionStorage or localStorage
            return sessionStorage.getItem('sessionId') || localStorage.getItem('sessionId') || undefined;
        } catch {
            return undefined;
        }
    }

    private sendErrorToMonitoring(errorDetails: ErrorDetails) {
        try {
            // Send to monitoring service (e.g., Sentry, LogRocket, etc.)
            // This is a placeholder - implement based on your monitoring solution
            if (typeof window !== 'undefined' && (window as any).gtag) {
                (window as any).gtag('event', 'exception', {
                    description: errorDetails.message,
                    fatal: false,
                    custom_map: {
                        error_id: this.state.errorId,
                        component_stack: errorDetails.componentStack,
                    },
                });
            }
        } catch {
            // Ignore monitoring errors
        }
    }

    private handleRetry = () => {
        const { maxRetries = 3, retryDelay = 1000 } = this.props;
        const { retryCount } = this.state;

        if (retryCount >= maxRetries) {
            return;
        }

        this.setState(prevState => ({
            retryCount: prevState.retryCount + 1,
        }));

        // Call onRetry callback if provided
        this.props.onRetry?.();

        // Reset error state after delay
        this.retryTimeoutId = setTimeout(() => {
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
            });
        }, retryDelay);
    };

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
            retryCount: 0,
        });

        // Call onReset callback if provided
        this.props.onReset?.();
    };

    private handleGoHome = () => {
        window.location.href = '/';
    };

    private handleReportBug = () => {
        const { error, errorId } = this.state;
        const bugReportUrl = `mailto:support@aibos.com?subject=Bug Report - ${errorId}&body=Error: ${error?.message}\n\nError ID: ${errorId}\n\nPlease describe what you were doing when this error occurred:`;
        window.open(bugReportUrl);
    };

    componentWillUnmount() {
        if (this.retryTimeoutId) {
            clearTimeout(this.retryTimeoutId);
        }
    }

    render() {
        const { hasError, error, errorInfo, retryCount } = this.state;
        const { children, fallback, className, showDetails = false, maxRetries = 3 } = this.props;

        if (hasError) {
            // Use custom fallback if provided
            if (fallback) {
                return fallback;
            }

            return (
                <div className={cn("min-h-screen flex items-center justify-center p-4", className)}>
                    <Card className="w-full max-w-2xl">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-semibold text-gray-900">
                                Something went wrong
                            </CardTitle>
                            <CardDescription className="text-gray-600">
                                We're sorry, but something unexpected happened. Our team has been notified.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Error Message */}
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                <div className="flex items-start">
                                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-red-800">Error Details</h3>
                                        <p className="mt-1 text-sm text-red-700">
                                            {error?.message || "An unknown error occurred"}
                                        </p>
                                        {showDetails && error?.stack && (
                                            <details className="mt-2">
                                                <summary className="text-sm text-red-600 cursor-pointer hover:text-red-800">
                                                    Show technical details
                                                </summary>
                                                <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-32">
                                                    {error.stack}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Error ID */}
                            <div className="text-center">
                                <p className="text-sm text-gray-500">
                                    Error ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    onClick={this.handleRetry}
                                    disabled={retryCount >= maxRetries}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    {retryCount >= maxRetries ? "Max retries reached" : "Try Again"}
                                </Button>

                                <Button
                                    onClick={this.handleReset}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Reset
                                </Button>

                                <Button
                                    onClick={this.handleGoHome}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Home className="h-4 w-4" />
                                    Go Home
                                </Button>

                                <Button
                                    onClick={this.handleReportBug}
                                    variant="outline"
                                    className="flex items-center gap-2"
                                >
                                    <Bug className="h-4 w-4" />
                                    Report Bug
                                </Button>
                            </div>

                            {/* Retry Count */}
                            {retryCount > 0 && (
                                <div className="text-center text-sm text-gray-500">
                                    Retry attempts: {retryCount} / {maxRetries}
                                </div>
                            )}

                            {/* Help Text */}
                            <div className="text-center text-sm text-gray-500">
                                <p>
                                    If this problem persists, please contact support with the Error ID above.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            );
        }

        return children;
    }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
    Component: React.ComponentType<P>,
    errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
    const WrappedComponent = (props: P) => (
        <ErrorBoundary {...errorBoundaryProps}>
            <Component {...props} />
        </ErrorBoundary>
    );

    WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

    return WrappedComponent;
}

// Hook for error boundary context
export function useErrorBoundary() {
    const [error, setError] = React.useState<Error | null>(null);

    const resetError = React.useCallback(() => {
        setError(null);
    }, []);

    const captureError = React.useCallback((error: Error) => {
        setError(error);
    }, []);

    React.useEffect(() => {
        if (error) {
            throw error;
        }
    }, [error]);

    return { captureError, resetError };
}

export default ErrorBoundary;
