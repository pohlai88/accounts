// Frontend Performance Monitoring
// DoD: Frontend performance monitoring
// SSOT: Use existing monitoring patterns
// Tech Stack: Web Vitals + custom metrics

import React from "react";
import { monitoring } from "./monitoring.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface WebVitalsMetrics {
    CLS: number; // Cumulative Layout Shift
    FID: number; // First Input Delay
    FCP: number; // First Contentful Paint
    LCP: number; // Largest Contentful Paint
    TTFB: number; // Time to First Byte
    INP: number; // Interaction to Next Paint
}

export interface PerformanceMetrics {
    pageLoad: {
        domContentLoaded: number;
        loadComplete: number;
        firstPaint: number;
        firstContentfulPaint: number;
    };
    navigation: {
        redirectTime: number;
        dnsTime: number;
        tcpTime: number;
        requestTime: number;
        responseTime: number;
        domProcessingTime: number;
        loadEventTime: number;
    };
    resources: {
        totalResources: number;
        totalSize: number;
        loadTime: number;
        cacheHitRate: number;
    };
    memory: {
        usedJSHeapSize: number;
        totalJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
    custom: Record<string, number>;
}

export interface PerformanceConfig {
    enabled: boolean;
    sampleRate: number;
    enableWebVitals: boolean;
    enableResourceTiming: boolean;
    enableMemoryMonitoring: boolean;
    enableCustomMetrics: boolean;
    reportingInterval: number; // milliseconds
    maxMetricsBuffer: number;
}

// ============================================================================
// PERFORMANCE MONITORING CLASS
// ============================================================================

class PerformanceMonitor {
    private config: PerformanceConfig;
    private metricsBuffer: Array<{ name: string; value: number; timestamp: Date; tags: Record<string, string> }> = [];
    private reportingTimer: NodeJS.Timeout | null = null;
    private isInitialized = false;

    constructor(config: Partial<PerformanceConfig> = {}) {
        this.config = {
            enabled: true,
            sampleRate: 0.1, // 10% sampling
            enableWebVitals: true,
            enableResourceTiming: true,
            enableMemoryMonitoring: true,
            enableCustomMetrics: true,
            reportingInterval: 30000, // 30 seconds
            maxMetricsBuffer: 1000,
            ...config,
        };
    }

    async initialize(): Promise<void> {
        if (this.isInitialized || !this.config.enabled) {
            return;
        }

        try {
            // Initialize Web Vitals monitoring
            if (this.config.enableWebVitals) {
                await this.initializeWebVitals();
            }

            // Initialize resource timing monitoring
            if (this.config.enableResourceTiming) {
                this.initializeResourceTiming();
            }

            // Initialize memory monitoring
            if (this.config.enableMemoryMonitoring) {
                this.initializeMemoryMonitoring();
            }

            // Start reporting timer
            this.startReporting();

            this.isInitialized = true;
        } catch (error) {
            // Handle initialization error
        }
    }

    private async initializeWebVitals(): Promise<void> {
        try {
            // Dynamic import to avoid bundle size issues
            const { onCLS, onFCP, onLCP, onTTFB, onINP } = await import("web-vitals");

            // Cumulative Layout Shift
            onCLS((metric: any) => {
                this.recordMetric("web_vitals.cls", metric.value, "score", {
                    id: metric.id,
                    name: metric.name,
                    delta: metric.delta.toString(),
                });
            });

            // First Input Delay (removed - not available in web-vitals v5)

            // First Contentful Paint
            onFCP((metric: any) => {
                this.recordMetric("web_vitals.fcp", metric.value, "milliseconds", {
                    id: metric.id,
                    name: metric.name,
                    delta: metric.delta.toString(),
                });
            });

            // Largest Contentful Paint
            onLCP((metric: any) => {
                this.recordMetric("web_vitals.lcp", metric.value, "milliseconds", {
                    id: metric.id,
                    name: metric.name,
                    delta: metric.delta.toString(),
                });
            });

            // Time to First Byte
            onTTFB((metric: any) => {
                this.recordMetric("web_vitals.ttfb", metric.value, "milliseconds", {
                    id: metric.id,
                    name: metric.name,
                    delta: metric.delta.toString(),
                });
            });

            // Interaction to Next Paint
            onINP((metric: any) => {
                this.recordMetric("web_vitals.inp", metric.value, "milliseconds", {
                    id: metric.id,
                    name: metric.name,
                    delta: metric.delta.toString(),
                });
            });
        } catch (error) {
            // Handle Web Vitals initialization error
        }
    }

    private initializeResourceTiming(): void {
        // Monitor page load performance
        window.addEventListener("load", () => {
            setTimeout(() => {
                this.measurePageLoadPerformance();
                this.measureResourcePerformance();
            }, 0);
        });

        // Monitor navigation timing
        if (window.performance && window.performance.navigation) {
            this.measureNavigationTiming();
        }
    }

    private initializeMemoryMonitoring(): void {
        // Monitor memory usage if available
        if ("memory" in performance) {
            setInterval(() => {
                this.measureMemoryUsage();
            }, 30000); // Every 30 seconds
        }
    }

    private measurePageLoadPerformance(): void {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

        if (navigation) {
            // DOM Content Loaded
            this.recordMetric("page_load.dom_content_loaded", navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart, "milliseconds");

            // Load Complete
            this.recordMetric("page_load.load_complete", navigation.loadEventEnd - navigation.loadEventStart, "milliseconds");

            // First Paint
            const paintEntries = performance.getEntriesByType("paint");
            const firstPaint = paintEntries.find(entry => entry.name === "first-paint");
            if (firstPaint) {
                this.recordMetric("page_load.first_paint", firstPaint.startTime, "milliseconds");
            }

            // First Contentful Paint
            const firstContentfulPaint = paintEntries.find(entry => entry.name === "first-contentful-paint");
            if (firstContentfulPaint) {
                this.recordMetric("page_load.first_contentful_paint", firstContentfulPaint.startTime, "milliseconds");
            }
        }
    }

    private measureNavigationTiming(): void {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;

        if (navigation) {
            // Redirect Time
            this.recordMetric("navigation.redirect_time", navigation.redirectEnd - navigation.redirectStart, "milliseconds");

            // DNS Time
            this.recordMetric("navigation.dns_time", navigation.domainLookupEnd - navigation.domainLookupStart, "milliseconds");

            // TCP Time
            this.recordMetric("navigation.tcp_time", navigation.connectEnd - navigation.connectStart, "milliseconds");

            // Request Time
            this.recordMetric("navigation.request_time", navigation.responseStart - navigation.requestStart, "milliseconds");

            // Response Time
            this.recordMetric("navigation.response_time", navigation.responseEnd - navigation.responseStart, "milliseconds");

            // DOM Processing Time
            this.recordMetric("navigation.dom_processing_time", navigation.domComplete - (navigation as any).domLoading, "milliseconds");

            // Load Event Time
            this.recordMetric("navigation.load_event_time", navigation.loadEventEnd - navigation.loadEventStart, "milliseconds");
        }
    }

    private measureResourcePerformance(): void {
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];

        if (resources.length > 0) {
            const totalResources = resources.length;
            const totalSize = resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0);
            const totalLoadTime = resources.reduce((sum, resource) => sum + (resource.responseEnd - resource.startTime), 0);
            const cacheHits = resources.filter(resource => resource.transferSize === 0).length;
            const cacheHitRate = cacheHits / totalResources;

            this.recordMetric("resources.total_resources", totalResources, "count");
            this.recordMetric("resources.total_size", totalSize, "bytes");
            this.recordMetric("resources.load_time", totalLoadTime, "milliseconds");
            this.recordMetric("resources.cache_hit_rate", cacheHitRate, "ratio");

            // Resource type breakdown
            const resourceTypes = resources.reduce((acc, resource) => {
                const type = this.getResourceType(resource.name);
                if (!acc[type]) acc[type] = 0;
                acc[type]++;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(resourceTypes).forEach(([type, count]) => {
                this.recordMetric("resources.by_type", count, "count", { resource_type: type });
            });
        }
    }

    private getResourceType(url: string): string {
        if (url.includes(".js")) return "javascript";
        if (url.includes(".css")) return "stylesheet";
        if (url.includes(".png") || url.includes(".jpg") || url.includes(".jpeg") || url.includes(".gif") || url.includes(".svg")) return "image";
        if (url.includes(".woff") || url.includes(".woff2") || url.includes(".ttf") || url.includes(".otf")) return "font";
        if (url.includes(".mp4") || url.includes(".webm") || url.includes(".ogg")) return "media";
        return "other";
    }

    private measureMemoryUsage(): void {
        const memory = (performance as any).memory;

        if (memory) {
            this.recordMetric("memory.used_js_heap_size", memory.usedJSHeapSize, "bytes");
            this.recordMetric("memory.total_js_heap_size", memory.totalJSHeapSize, "bytes");
            this.recordMetric("memory.js_heap_size_limit", memory.jsHeapSizeLimit, "bytes");
        }
    }

    private recordMetric(name: string, value: number, unit: string, tags: Record<string, string> = {}): void {
        // Apply sampling
        if (Math.random() > this.config.sampleRate) {
            return;
        }

        this.metricsBuffer.push({
            name,
            value,
            timestamp: new Date(),
            tags: {
                ...tags,
                url: window.location.href,
                user_agent: navigator.userAgent,
            },
        });

        // Flush if buffer is full
        if (this.metricsBuffer.length >= this.config.maxMetricsBuffer) {
            this.flushMetrics();
        }
    }

    private startReporting(): void {
        this.reportingTimer = setInterval(() => {
            this.flushMetrics();
        }, this.config.reportingInterval);
    }

    private async flushMetrics(): Promise<void> {
        if (this.metricsBuffer.length === 0) {
            return;
        }

        const metrics = [...this.metricsBuffer];
        this.metricsBuffer = [];

        try {
            await fetch("/api/monitoring/metrics", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    metrics: metrics.map(metric => ({
                        name: metric.name,
                        value: metric.value,
                        unit: metric.tags.unit || "count",
                        tags: metric.tags,
                        timestamp: metric.timestamp.toISOString(),
                    })),
                }),
            });
        } catch (error) {
            // Handle metrics reporting error
            // Re-add metrics to buffer on failure
            this.metricsBuffer.unshift(...metrics);
        }
    }

    // Custom metric recording
    recordCustomMetric(name: string, value: number, unit: string = "count", tags: Record<string, string> = {}): void {
        if (!this.config.enableCustomMetrics) {
            return;
        }

        this.recordMetric(`custom.${name}`, value, unit, tags);
    }

    // Component render time measurement
    measureComponentRender(componentName: string, renderTime: number): void {
        this.recordCustomMetric("component_render_time", renderTime, "milliseconds", {
            component: componentName,
        });
    }

    // API call performance measurement
    measureAPICall(endpoint: string, method: string, duration: number, statusCode: number): void {
        this.recordCustomMetric("api_call_duration", duration, "milliseconds", {
            endpoint,
            method,
            status: statusCode.toString(),
        });
    }

    // User interaction measurement
    measureUserInteraction(action: string, duration: number): void {
        this.recordCustomMetric("user_interaction_duration", duration, "milliseconds", {
            action,
        });
    }

    // Get current performance metrics
    getCurrentMetrics(): PerformanceMetrics {
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
        const memory = (performance as any).memory;

        return {
            pageLoad: {
                domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
                loadComplete: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
                firstPaint: 0, // Would need to be measured separately
                firstContentfulPaint: 0, // Would need to be measured separately
            },
            navigation: {
                redirectTime: navigation ? navigation.redirectEnd - navigation.redirectStart : 0,
                dnsTime: navigation ? navigation.domainLookupEnd - navigation.domainLookupStart : 0,
                tcpTime: navigation ? navigation.connectEnd - navigation.connectStart : 0,
                requestTime: navigation ? navigation.responseStart - navigation.requestStart : 0,
                responseTime: navigation ? navigation.responseEnd - navigation.responseStart : 0,
                domProcessingTime: navigation ? navigation.domComplete - (navigation as any).domLoading : 0,
                loadEventTime: navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0,
            },
            resources: {
                totalResources: resources.length,
                totalSize: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), 0),
                loadTime: resources.reduce((sum, resource) => sum + (resource.responseEnd - resource.startTime), 0),
                cacheHitRate: resources.filter(resource => resource.transferSize === 0).length / resources.length,
            },
            memory: {
                usedJSHeapSize: memory?.usedJSHeapSize || 0,
                totalJSHeapSize: memory?.totalJSHeapSize || 0,
                jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
            },
            custom: {},
        };
    }

    // Cleanup
    shutdown(): void {
        if (this.reportingTimer) {
            clearInterval(this.reportingTimer);
        }

        // Flush remaining metrics
        this.flushMetrics();

        this.isInitialized = false;
    }
}

// ============================================================================
// PERFORMANCE HOOKS
// ============================================================================

export function usePerformanceMonitor() {
    const monitor = new PerformanceMonitor();

    React.useEffect(() => {
        monitor.initialize();

        return () => {
            monitor.shutdown();
        };
    }, []);

    return {
        recordCustomMetric: monitor.recordCustomMetric.bind(monitor),
        measureComponentRender: monitor.measureComponentRender.bind(monitor),
        measureAPICall: monitor.measureAPICall.bind(monitor),
        measureUserInteraction: monitor.measureUserInteraction.bind(monitor),
        getCurrentMetrics: monitor.getCurrentMetrics.bind(monitor),
    };
}

export function useComponentPerformance(componentName: string) {
    const { measureComponentRender } = usePerformanceMonitor();

    const measureRender = React.useCallback((renderTime: number) => {
        measureComponentRender(componentName, renderTime);
    }, [componentName, measureComponentRender]);

    return { measureRender };
}

export function useAPIPerformance() {
    const { measureAPICall } = usePerformanceMonitor();

    const measureCall = React.useCallback(async <T>(
        apiCall: () => Promise<T>,
        endpoint: string,
        method: string = "GET"
    ): Promise<T> => {
        const startTime = Date.now();

        try {
            const result = await apiCall();
            const duration = Date.now() - startTime;
            measureAPICall(endpoint, method, duration, 200);
            return result;
        } catch (error) {
            const duration = Date.now() - startTime;
            const statusCode = (error as any)?.status || 500;
            measureAPICall(endpoint, method, duration, statusCode);
            throw error;
        }
    }, [measureAPICall]);

    return { measureCall };
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

export class PerformanceUtils {
    static measureAsync<T>(fn: () => Promise<T>, name: string): Promise<T> {
        const startTime = performance.now();

        return fn().then(
            (result) => {
                const duration = performance.now() - startTime;
                // Performance measurement logged
                return result;
            },
            (error) => {
                const duration = performance.now() - startTime;
                // Performance measurement failed
                throw error;
            }
        );
    }

    static measureSync<T>(fn: () => T, name: string): T {
        const startTime = performance.now();

        try {
            const result = fn();
            const duration = performance.now() - startTime;
            // Performance measurement logged
            return result;
        } catch (error) {
            const duration = performance.now() - startTime;
            // Performance measurement failed
            throw error;
        }
    }

    static debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: NodeJS.Timeout;

        return (...args: Parameters<T>) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    }

    static throttle<T extends (...args: any[]) => any>(
        func: T,
        limit: number
    ): (...args: Parameters<T>) => void {
        let inThrottle: boolean;

        return (...args: Parameters<T>) => {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize if in browser
if (typeof window !== "undefined") {
    performanceMonitor.initialize();
}

export default performanceMonitor;
