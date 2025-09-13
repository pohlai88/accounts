// =====================================================
// Phase 10: Error Monitoring & Analytics System
// Comprehensive error tracking and user analytics
// =====================================================

interface ErrorEvent {
    id: string;
    timestamp: number;
    type: 'javascript' | 'network' | 'promise' | 'resource' | 'custom';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    stack?: string;
    url: string;
    userAgent: string;
    userId?: string;
    sessionId: string;
    context: Record<string, any>;
    resolved: boolean;
    resolvedAt?: number;
}

interface UserEvent {
    id: string;
    timestamp: number;
    type: 'page_view' | 'click' | 'form_submit' | 'navigation' | 'error' | 'performance';
    userId?: string;
    sessionId: string;
    url: string;
    element?: string;
    data: Record<string, any>;
}

interface AnalyticsReport {
    timestamp: number;
    period: 'hour' | 'day' | 'week' | 'month';
    errors: {
        total: number;
        byType: Record<string, number>;
        bySeverity: Record<string, number>;
        resolved: number;
        unresolved: number;
    };
    users: {
        total: number;
        active: number;
        new: number;
        returning: number;
    };
    performance: {
        averageLoadTime: number;
        errorRate: number;
        successRate: number;
    };
    features: {
        mostUsed: string[];
        leastUsed: string[];
        errorProne: string[];
    };
}

class ErrorMonitor {
    private errors: ErrorEvent[] = [];
    private userEvents: UserEvent[] = [];
    private sessionId: string;
    private userId?: string;
    private isInitialized: boolean = false;

    constructor() {
        this.sessionId = this.generateSessionId();
        this.initialize();
    }

    private initialize() {
        if (typeof window === 'undefined') return;

        this.setupErrorHandlers();
        this.setupUserEventTracking();
        this.setupPerformanceMonitoring();
        this.setupNetworkMonitoring();
        this.isInitialized = true;

        console.log('Error monitoring initialized');
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private setupErrorHandlers() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.captureError({
                type: 'javascript',
                severity: 'high',
                message: event.message,
                stack: event.error?.stack,
                context: {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                }
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError({
                type: 'promise',
                severity: 'high',
                message: event.reason?.message || 'Unhandled promise rejection',
                stack: event.reason?.stack,
                context: {
                    reason: event.reason,
                    promise: event.promise
                }
            });
        });

        // Resource loading errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.captureError({
                    type: 'resource',
                    severity: 'medium',
                    message: `Failed to load resource: ${event.target}`,
                    context: {
                        tagName: (event.target as Element)?.tagName,
                        src: (event.target as HTMLImageElement)?.src,
                        href: (event.target as HTMLLinkElement)?.href
                    }
                });
            }
        }, true);
    }

    private setupUserEventTracking() {
        // Page view tracking
        this.trackUserEvent({
            type: 'page_view',
            data: {
                path: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash,
                referrer: document.referrer
            }
        });

        // Click tracking
        document.addEventListener('click', (event) => {
            const target = event.target as Element;
            if (target) {
                this.trackUserEvent({
                    type: 'click',
                    element: this.getElementSelector(target),
                    data: {
                        text: target.textContent?.slice(0, 100),
                        className: target.className,
                        id: target.id,
                        tagName: target.tagName
                    }
                });
            }
        });

        // Form submission tracking
        document.addEventListener('submit', (event) => {
            const form = event.target as HTMLFormElement;
            if (form) {
                this.trackUserEvent({
                    type: 'form_submit',
                    element: this.getElementSelector(form),
                    data: {
                        action: form.action,
                        method: form.method,
                        fieldCount: form.elements.length
                    }
                });
            }
        });

        // Navigation tracking
        window.addEventListener('popstate', () => {
            this.trackUserEvent({
                type: 'navigation',
                data: {
                    path: window.location.pathname,
                    search: window.location.search,
                    hash: window.location.hash
                }
            });
        });
    }

    private setupPerformanceMonitoring() {
        // Monitor performance metrics
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
                if (navigation) {
                    this.trackUserEvent({
                        type: 'performance',
                        data: {
                            loadTime: navigation.loadEventEnd - navigation.navigationStart,
                            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
                            firstPaint: this.getFirstPaint(),
                            firstContentfulPaint: this.getFirstContentfulPaint()
                        }
                    });
                }
            }, 1000);
        });
    }

    private setupNetworkMonitoring() {
        // Monitor network requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();

                this.trackUserEvent({
                    type: 'performance',
                    data: {
                        url: args[0] as string,
                        method: 'GET',
                        status: response.status,
                        duration: endTime - startTime,
                        success: response.ok
                    }
                });

                return response;
            } catch (error) {
                this.captureError({
                    type: 'network',
                    severity: 'medium',
                    message: `Network request failed: ${args[0]}`,
                    context: {
                        url: args[0],
                        method: 'GET',
                        error: error
                    }
                });
                throw error;
            }
        };
    }

    private getElementSelector(element: Element): string {
        if (element.id) {
            return `#${element.id}`;
        }
        if (element.className) {
            return `.${element.className.split(' ')[0]}`;
        }
        return element.tagName.toLowerCase();
    }

    private getFirstPaint(): number {
        const paintEntries = performance.getEntriesByType('paint');
        const fpEntry = paintEntries.find(entry => entry.name === 'first-paint');
        return fpEntry ? fpEntry.startTime : 0;
    }

    private getFirstContentfulPaint(): number {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : 0;
    }

    public captureError(errorData: {
        type: ErrorEvent['type'];
        severity: ErrorEvent['severity'];
        message: string;
        stack?: string;
        context?: Record<string, any>;
    }) {
        const error: ErrorEvent = {
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: errorData.type,
            severity: errorData.severity,
            message: errorData.message,
            stack: errorData.stack,
            url: window.location.href,
            userAgent: navigator.userAgent,
            userId: this.userId,
            sessionId: this.sessionId,
            context: errorData.context || {},
            resolved: false
        };

        this.errors.push(error);
        this.sendErrorToServer(error);

        console.error('Error captured:', error);
    }

    public trackUserEvent(eventData: {
        type: UserEvent['type'];
        element?: string;
        data: Record<string, any>;
    }) {
        const event: UserEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            type: eventData.type,
            userId: this.userId,
            sessionId: this.sessionId,
            url: window.location.href,
            element: eventData.element,
            data: eventData.data
        };

        this.userEvents.push(event);
        this.sendEventToServer(event);
    }

    private async sendErrorToServer(error: ErrorEvent) {
        try {
            await fetch('/api/analytics/errors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(error)
            });
        } catch (err) {
            console.warn('Failed to send error to server:', err);
        }
    }

    private async sendEventToServer(event: UserEvent) {
        try {
            await fetch('/api/analytics/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(event)
            });
        } catch (err) {
            console.warn('Failed to send event to server:', err);
        }
    }

    public setUserId(userId: string) {
        this.userId = userId;
    }

    public getErrors(): ErrorEvent[] {
        return [...this.errors];
    }

    public getErrorsBySeverity(severity: string): ErrorEvent[] {
        return this.errors.filter(error => error.severity === severity);
    }

    public getErrorsByType(type: string): ErrorEvent[] {
        return this.errors.filter(error => error.type === type);
    }

    public getUserEvents(): UserEvent[] {
        return [...this.userEvents];
    }

    public getUserEventsByType(type: string): UserEvent[] {
        return this.userEvents.filter(event => event.type === type);
    }

    public resolveError(errorId: string): boolean {
        const error = this.errors.find(e => e.id === errorId);
        if (error) {
            error.resolved = true;
            error.resolvedAt = Date.now();
            return true;
        }
        return false;
    }

    public generateAnalyticsReport(period: 'hour' | 'day' | 'week' | 'month'): AnalyticsReport {
        const now = Date.now();
        const periodMs = this.getPeriodMs(period);
        const startTime = now - periodMs;

        const recentErrors = this.errors.filter(e => e.timestamp >= startTime);
        const recentEvents = this.userEvents.filter(e => e.timestamp >= startTime);

        const errorCounts = recentErrors.reduce((acc, error) => {
            acc.byType[error.type] = (acc.byType[error.type] || 0) + 1;
            acc.bySeverity[error.severity] = (acc.bySeverity[error.severity] || 0) + 1;
            return acc;
        }, { byType: {} as Record<string, number>, bySeverity: {} as Record<string, number> });

        const userCounts = this.calculateUserCounts(recentEvents);
        const performance = this.calculatePerformanceMetrics(recentEvents);
        const features = this.calculateFeatureUsage(recentEvents);

        return {
            timestamp: now,
            period,
            errors: {
                total: recentErrors.length,
                byType: errorCounts.byType,
                bySeverity: errorCounts.bySeverity,
                resolved: recentErrors.filter(e => e.resolved).length,
                unresolved: recentErrors.filter(e => !e.resolved).length
            },
            users: userCounts,
            performance,
            features
        };
    }

    private getPeriodMs(period: string): number {
        switch (period) {
            case 'hour': return 60 * 60 * 1000;
            case 'day': return 24 * 60 * 60 * 1000;
            case 'week': return 7 * 24 * 60 * 60 * 1000;
            case 'month': return 30 * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000;
        }
    }

    private calculateUserCounts(events: UserEvent[]) {
        const uniqueUsers = new Set(events.map(e => e.userId).filter(Boolean));
        const pageViews = events.filter(e => e.type === 'page_view');
        const uniqueSessions = new Set(events.map(e => e.sessionId));

        return {
            total: uniqueUsers.size,
            active: uniqueSessions.size,
            new: 0, // Would need historical data to calculate
            returning: 0 // Would need historical data to calculate
        };
    }

    private calculatePerformanceMetrics(events: UserEvent[]) {
        const performanceEvents = events.filter(e => e.type === 'performance');
        const loadTimes = performanceEvents.map(e => e.data.loadTime).filter(Boolean);
        const averageLoadTime = loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length : 0;

        const totalEvents = events.length;
        const errorEvents = events.filter(e => e.type === 'error').length;
        const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;
        const successRate = 100 - errorRate;

        return {
            averageLoadTime,
            errorRate,
            successRate
        };
    }

    private calculateFeatureUsage(events: UserEvent[]) {
        const featureUsage = events.reduce((acc, event) => {
            if (event.element) {
                acc[event.element] = (acc[event.element] || 0) + 1;
            }
            return acc;
        }, {} as Record<string, number>);

        const sortedFeatures = Object.entries(featureUsage)
            .sort(([, a], [, b]) => b - a)
            .map(([feature]) => feature);

        return {
            mostUsed: sortedFeatures.slice(0, 5),
            leastUsed: sortedFeatures.slice(-5),
            errorProne: [] // Would need error correlation analysis
        };
    }

    public cleanup() {
        // Clean up event listeners and resources
        this.isInitialized = false;
    }
}

// Initialize error monitor
let errorMonitor: ErrorMonitor | null = null;

export function initializeErrorMonitoring() {
    if (typeof window !== 'undefined' && !errorMonitor) {
        errorMonitor = new ErrorMonitor();
    }
    return errorMonitor;
}

export function getErrorMonitor(): ErrorMonitor | null {
    return errorMonitor;
}

export function trackError(errorData: {
    type: ErrorEvent['type'];
    severity: ErrorEvent['severity'];
    message: string;
    stack?: string;
    context?: Record<string, any>;
}) {
    const monitor = getErrorMonitor();
    if (monitor) {
        monitor.captureError(errorData);
    }
}

export function trackUserEvent(eventData: {
    type: UserEvent['type'];
    element?: string;
    data: Record<string, any>;
}) {
    const monitor = getErrorMonitor();
    if (monitor) {
        monitor.trackUserEvent(eventData);
    }
}

export function setUserId(userId: string) {
    const monitor = getErrorMonitor();
    if (monitor) {
        monitor.setUserId(userId);
    }
}

export default ErrorMonitor;
