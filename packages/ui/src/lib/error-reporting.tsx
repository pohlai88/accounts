// Production Error Reporting
// DoD: Production error reporting
// SSOT: Use existing monitoring patterns
// Tech Stack: Error reporting service + monitoring

import React, { useState, useEffect } from "react";
import { monitoring } from "./monitoring.js";
import { ErrorBoundary } from "../components/common/ErrorBoundary.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ErrorReport {
    id: string;
    timestamp: Date;
    error: {
        name: string;
        message: string;
        stack?: string;
        cause?: any;
    };
    context: {
        url: string;
        userAgent: string;
        userId?: string;
        tenantId?: string;
        sessionId?: string;
        componentStack?: string;
        errorBoundary?: string;
        userActions?: string[];
        performance?: {
            memoryUsage: number;
            loadTime: number;
            renderTime: number;
        };
    };
    severity: "low" | "medium" | "high" | "critical";
    status: "new" | "investigating" | "resolved" | "ignored";
    tags: Record<string, string>;
    fingerprint: string;
}

export interface ErrorReportingConfig {
    enabled: boolean;
    sampleRate: number;
    maxReportsPerSession: number;
    enableUserTracking: boolean;
    enablePerformanceTracking: boolean;
    enableUserActionTracking: boolean;
    enableFingerprinting: boolean;
    enableBreadcrumbs: boolean;
    maxBreadcrumbs: number;
    reportingEndpoint: string;
    reportingTimeout: number;
    enableRetry: boolean;
    maxRetries: number;
    retryDelay: number;
}

export interface Breadcrumb {
    id: string;
    timestamp: Date;
    type: "navigation" | "user" | "error" | "performance" | "custom";
    message: string;
    data?: Record<string, any>;
    level: "info" | "warning" | "error";
}

export interface UserAction {
    id: string;
    timestamp: Date;
    type: "click" | "input" | "navigation" | "scroll" | "resize";
    element?: string;
    value?: string;
    url: string;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const defaultConfig: ErrorReportingConfig = {
    enabled: true,
    sampleRate: 0.1, // 10% sampling
    maxReportsPerSession: 100,
    enableUserTracking: true,
    enablePerformanceTracking: true,
    enableUserActionTracking: true,
    enableFingerprinting: true,
    enableBreadcrumbs: true,
    maxBreadcrumbs: 50,
    reportingEndpoint: "/api/monitoring/errors",
    reportingTimeout: 10000,
    enableRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
};

// ============================================================================
// ERROR REPORTING SERVICE
// ============================================================================

export class ErrorReportingService {
    private config: ErrorReportingConfig;
    private reports: Map<string, ErrorReport> = new Map();
    private breadcrumbs: Breadcrumb[] = [];
    private userActions: UserAction[] = [];
    private sessionId: string;
    private userId?: string;
    private tenantId?: string;
    private reportCount = 0;
    private isInitialized = false;

    constructor(config: Partial<ErrorReportingConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
        this.sessionId = this.generateSessionId();
        this.initialize();
    }

    private initialize(): void {
        if (!this.config.enabled || this.isInitialized) {
            return;
        }

        try {
            // Set up global error handlers
            this.setupGlobalErrorHandlers();

            // Set up user action tracking
            if (this.config.enableUserActionTracking) {
                this.setupUserActionTracking();
            }

            // Set up performance tracking
            if (this.config.enablePerformanceTracking) {
                this.setupPerformanceTracking();
            }

            // Set up breadcrumb tracking
            if (this.config.enableBreadcrumbs) {
                this.setupBreadcrumbTracking();
            }

            this.isInitialized = true;
            console.log("✅ Error reporting service initialized");
        } catch (error) {
            console.error("Failed to initialize error reporting service:", error);
        }
    }

    private setupGlobalErrorHandlers(): void {
        if (typeof window === "undefined") return;

        // Unhandled errors
        window.addEventListener("error", (event) => {
            this.handleError(event.error, {
                type: "unhandled",
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
            });
        });

        // Unhandled promise rejections
        window.addEventListener("unhandledrejection", (event) => {
            this.handleError(new Error(event.reason), {
                type: "unhandled_promise_rejection",
                reason: event.reason,
            });
        });

        // Console errors
        const originalConsoleError = console.error;
        console.error = (...args) => {
            originalConsoleError.apply(console, args);

            if (args.length > 0 && args[0] instanceof Error) {
                this.handleError(args[0], {
                    type: "console_error",
                    args: args.slice(1),
                });
            }
        };
    }

    private setupUserActionTracking(): void {
        if (typeof window === "undefined") return;

        // Click tracking
        document.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;
            this.addUserAction({
                type: "click",
                element: this.getElementSelector(target),
                url: window.location.href,
            });
        });

        // Input tracking
        document.addEventListener("input", (event) => {
            const target = event.target as HTMLInputElement;
            this.addUserAction({
                type: "input",
                element: this.getElementSelector(target),
                value: target.value.substring(0, 100), // Limit value length
                url: window.location.href,
            });
        });

        // Navigation tracking
        window.addEventListener("popstate", () => {
            this.addUserAction({
                type: "navigation",
                url: window.location.href,
            });
        });
    }

    private setupPerformanceTracking(): void {
        if (typeof window === "undefined") return;

        // Track page load performance
        window.addEventListener("load", () => {
            setTimeout(() => {
                const performance = this.getPerformanceMetrics();
                this.addBreadcrumb({
                    type: "performance",
                    message: "Page load completed",
                    data: performance,
                    level: "info",
                });
            }, 0);
        });

        // Track memory usage
        setInterval(() => {
            if ("memory" in performance) {
                const memory = (performance as any).memory;
                this.addBreadcrumb({
                    type: "performance",
                    message: "Memory usage",
                    data: {
                        usedJSHeapSize: memory.usedJSHeapSize,
                        totalJSHeapSize: memory.totalJSHeapSize,
                    },
                    level: "info",
                });
            }
        }, 30000); // Every 30 seconds
    }

    private setupBreadcrumbTracking(): void {
        if (typeof window === "undefined") return;

        // Track navigation
        const originalPushState = history.pushState;
        history.pushState = function (...args) {
            originalPushState.apply(history, args);
            (this as any).addBreadcrumb({
                type: "navigation",
                message: "Navigation",
                data: { url: window.location.href },
                level: "info",
            });
        };

        // Track errors as breadcrumbs
        window.addEventListener("error", (event) => {
            this.addBreadcrumb({
                type: "error",
                message: event.message,
                data: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                },
                level: "error",
            });
        });
    }

    private handleError(error: Error, context: Record<string, any> = {}): void {
        if (!this.config.enabled) return;

        // Apply sampling
        if (Math.random() > this.config.sampleRate) {
            return;
        }

        // Check report limit
        if (this.reportCount >= this.config.maxReportsPerSession) {
            return;
        }

        try {
            const report = this.createErrorReport(error, context);
            this.reports.set(report.id, report);
            this.reportCount++;

            // Send report
            this.sendReport(report);
        } catch (reportError) {
            console.error("Failed to create error report:", reportError);
        }
    }

    private createErrorReport(error: Error, context: Record<string, any>): ErrorReport {
        const id = this.generateReportId();
        const timestamp = new Date();

        // Determine severity
        const severity = this.determineSeverity(error, context);

        // Create fingerprint
        const fingerprint = this.config.enableFingerprinting
            ? this.createFingerprint(error, context)
            : id;

        // Get performance metrics
        const performanceMetrics = this.getPerformanceMetrics();

        const report: ErrorReport = {
            id,
            timestamp,
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                cause: error.cause,
            },
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent,
                userId: this.userId,
                tenantId: this.tenantId,
                sessionId: this.sessionId,
                componentStack: context.componentStack,
                errorBoundary: context.errorBoundary,
                userActions: this.getRecentUserActions(),
                performance: performanceMetrics,
                ...context,
            },
            severity,
            status: "new",
            tags: this.extractTags(error, context),
            fingerprint,
        };

        return report;
    }

    private determineSeverity(error: Error, context: Record<string, any>): "low" | "medium" | "high" | "critical" {
        // Critical errors
        if (error.name === "ChunkLoadError" ||
            error.message.includes("Loading chunk") ||
            error.message.includes("out of memory") ||
            error.message.includes("maximum call stack exceeded")) {
            return "critical";
        }

        // High severity errors
        if (error.name === "TypeError" ||
            error.name === "ReferenceError" ||
            error.name === "SyntaxError" ||
            error.message.includes("failed to fetch") ||
            error.message.includes("network error")) {
            return "high";
        }

        // Medium severity errors
        if (error.name === "Error" ||
            error.message.includes("warning") ||
            context.type === "console_error") {
            return "medium";
        }

        // Default to low
        return "low";
    }

    private createFingerprint(error: Error, context: Record<string, any>): string {
        const components = [
            error.name,
            error.message,
            context.filename || "",
            context.lineno || "",
            context.colno || "",
        ];

        return btoa(components.join("|")).substring(0, 16);
    }

    private extractTags(error: Error, context: Record<string, any>): Record<string, string> {
        const tags: Record<string, string> = {
            error_type: error.name,
            error_message: error.message.substring(0, 100),
        };

        if (context.type) {
            tags.error_source = context.type;
        }

        if (context.filename) {
            tags.filename = context.filename;
        }

        if (this.userId) {
            tags.user_id = this.userId;
        }

        if (this.tenantId) {
            tags.tenant_id = this.tenantId;
        }

        return tags;
    }

    private getPerformanceMetrics(): { memoryUsage: number; loadTime: number; renderTime: number } {
        const memoryUsage = "memory" in performance ? (performance as any).memory.usedJSHeapSize : 0;
        const loadTime = performance.now();
        const renderTime = performance.now();

        return {
            memoryUsage,
            loadTime,
            renderTime,
        };
    }

    private getRecentUserActions(): string[] {
        return this.userActions
            .slice(-10) // Last 10 actions
            .map(action => `${action.type}:${action.element || "unknown"}`);
    }

    private async sendReport(report: ErrorReport): Promise<void> {
        try {
            const response = await fetch(this.config.reportingEndpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    errorReport: report,
                    breadcrumbs: this.breadcrumbs.slice(-this.config.maxBreadcrumbs),
                    userActions: this.userActions.slice(-10),
                }),
                signal: AbortSignal.timeout(this.config.reportingTimeout),
            });

            if (!response.ok) {
                throw new Error(`Error reporting failed: ${response.status} ${response.statusText}`);
            }

            console.log(`✅ Error report sent: ${report.id}`);
        } catch (error) {
            console.error("Failed to send error report:", error);

            // Retry if enabled
            if (this.config.enableRetry) {
                this.retryReport(report);
            }
        }
    }

    private retryReport(report: ErrorReport, attempt = 1): void {
        if (attempt > this.config.maxRetries) {
            console.error(`Failed to send error report after ${this.config.maxRetries} attempts: ${report.id}`);
            return;
        }

        setTimeout(async () => {
            try {
                await this.sendReport(report);
            } catch (error) {
                this.retryReport(report, attempt + 1);
            }
        }, this.config.retryDelay * attempt);
    }

    private addBreadcrumb(breadcrumb: Omit<Breadcrumb, "id" | "timestamp">): void {
        if (!this.config.enableBreadcrumbs) return;

        const newBreadcrumb: Breadcrumb = {
            ...breadcrumb,
            id: this.generateBreadcrumbId(),
            timestamp: new Date(),
        };

        this.breadcrumbs.push(newBreadcrumb);

        // Limit breadcrumbs
        if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(-this.config.maxBreadcrumbs);
        }
    }

    private addUserAction(action: Omit<UserAction, "id" | "timestamp">): void {
        if (!this.config.enableUserActionTracking) return;

        const newAction: UserAction = {
            ...action,
            id: this.generateActionId(),
            timestamp: new Date(),
        };

        this.userActions.push(newAction);

        // Limit user actions
        if (this.userActions.length > 100) {
            this.userActions = this.userActions.slice(-100);
        }
    }

    private getElementSelector(element: HTMLElement): string {
        if (element.id) {
            return `#${element.id}`;
        }

        if (element.className) {
            return `.${element.className.split(" ")[0]}`;
        }

        return element.tagName.toLowerCase();
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateReportId(): string {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateBreadcrumbId(): string {
        return `breadcrumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateActionId(): string {
        return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Public methods
    setUser(userId: string, tenantId?: string): void {
        this.userId = userId;
        this.tenantId = tenantId;
    }

    clearUser(): void {
        this.userId = undefined;
        this.tenantId = undefined;
    }

    addCustomBreadcrumb(message: string, data?: Record<string, any>, level: "info" | "warning" | "error" = "info"): void {
        this.addBreadcrumb({
            type: "custom",
            message,
            data,
            level,
        });
    }

    captureException(error: Error, context?: Record<string, any>): void {
        this.handleError(error, { ...context, type: "captured" });
    }

    captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: Record<string, any>): void {
        const error = new Error(message);
        this.handleError(error, { ...context, type: "message", level });
    }

    getReports(): ErrorReport[] {
        return Array.from(this.reports.values());
    }

    getBreadcrumbs(): Breadcrumb[] {
        return [...this.breadcrumbs];
    }

    getUserActions(): UserAction[] {
        return [...this.userActions];
    }

    updateConfig(config: Partial<ErrorReportingConfig>): void {
        this.config = { ...this.config, ...config };
    }

    destroy(): void {
        this.reports.clear();
        this.breadcrumbs = [];
        this.userActions = [];
        this.isInitialized = false;
    }
}

// ============================================================================
// HOOKS
// ============================================================================

export function useErrorReporting(): ErrorReportingService {
    const [service] = useState(() => new ErrorReportingService());

    useEffect(() => {
        return () => {
            service.destroy();
        };
    }, [service]);

    return service;
}

export function useErrorCapture(): {
    captureException: (error: Error, context?: Record<string, any>) => void;
    captureMessage: (message: string, level?: "info" | "warning" | "error", context?: Record<string, any>) => void;
} {
    const service = useErrorReporting();

    return {
        captureException: service.captureException.bind(service),
        captureMessage: service.captureMessage.bind(service),
    };
}

// ============================================================================
// ERROR BOUNDARY INTEGRATION
// ============================================================================

export function withErrorReporting<P extends object>(
    Component: React.ComponentType<P>
): React.ComponentType<P> {
    return function ErrorReportingWrapper(props: P) {
        const errorReporting = useErrorReporting();

        return (
            <ErrorBoundary
                onError={(error, errorInfo) => {
                    errorReporting.captureException(error, {
                        componentStack: errorInfo.componentStack,
                        errorBoundary: "withErrorReporting",
                    });
                }}
            >
                <Component {...props} />
            </ErrorBoundary>
        );
};
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const errorReporting = new ErrorReportingService();

export default ErrorReportingService;
