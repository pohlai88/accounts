// =====================================================
// Phase 10: Performance Monitoring System
// Real-time performance tracking and optimization
// =====================================================

import React from 'react';

// Extended PerformanceEntry interfaces for specific entry types
interface PerformanceEntryWithProcessingStart extends PerformanceEntry {
    processingStart?: number;
}

interface PerformanceEntryWithHadRecentInput extends PerformanceEntry {
    hadRecentInput?: boolean;
    value?: number;
}

interface PerformanceEntryWithTransferSize extends PerformanceEntry {
    transferSize?: number;
}

interface PerformanceNavigationTimingExtended extends PerformanceNavigationTiming {
    navigationStart?: number;
}

// Navigator interface extensions for connection and device memory
interface NavigatorWithConnection extends Navigator {
    connection?: {
        effectiveType?: string;
    };
    mozConnection?: {
        effectiveType?: string;
    };
    webkitConnection?: {
        effectiveType?: string;
    };
    deviceMemory?: number;
}

interface PerformanceMetrics {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
    ttfb: number; // Time to First Byte
    tti: number; // Time to Interactive
    fmp: number; // First Meaningful Paint
    si: number; // Speed Index
}

interface PerformanceReport {
    timestamp: number;
    url: string;
    metrics: PerformanceMetrics;
    userAgent: string;
    connectionType: string;
    deviceMemory: number;
    hardwareConcurrency: number;
    score: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        fcp: 0,
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
        tti: 0,
        fmp: 0,
        si: 0
    };

    private observers: PerformanceObserver[] = [];
    private reports: PerformanceReport[] = [];

    constructor() {
        this.initializeObservers();
        this.startMonitoring();
    }

    private initializeObservers() {
        // First Contentful Paint
        if ('PerformanceObserver' in window) {
            try {
                const fcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
                    if (fcpEntry) {
                        this.metrics.fcp = fcpEntry.startTime;
                    }
                });
                fcpObserver.observe({ entryTypes: ['paint'] });
                this.observers.push(fcpObserver);
            } catch (error) {
                console.warn('FCP observer failed:', error);
            }

            // Largest Contentful Paint
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    if (lastEntry) {
                        this.metrics.lcp = lastEntry.startTime;
                    }
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
                this.observers.push(lcpObserver);
            } catch (error) {
                console.warn('LCP observer failed:', error);
            }

            // First Input Delay
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        if (entry.entryType === 'first-input') {
                            const fidEntry = entry as PerformanceEntryWithProcessingStart;
                            this.metrics.fid = (fidEntry.processingStart || 0) - entry.startTime;
                        }
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
                this.observers.push(fidObserver);
            } catch (error) {
                console.warn('FID observer failed:', error);
            }

            // Cumulative Layout Shift
            try {
                const clsObserver = new PerformanceObserver((list) => {
                    let clsValue = 0;
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        const clsEntry = entry as PerformanceEntryWithHadRecentInput;
                        if (!clsEntry.hadRecentInput) {
                            clsValue += clsEntry.value || 0;
                        }
                    });
                    this.metrics.cls = clsValue;
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(clsObserver);
            } catch (error) {
                console.warn('CLS observer failed:', error);
            }
        }
    }

    private startMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.calculateMetrics();
                this.generateReport();
            }, 1000);
        });

        // Monitor navigation performance
        if ('PerformanceNavigationTiming' in window) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTimingExtended;
            if (navigation) {
                this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
                this.metrics.tti = navigation.loadEventEnd - (navigation.navigationStart || navigation.fetchStart);
            }
        }

        // Monitor resource loading
        this.monitorResourceLoading();
    }

    private calculateMetrics() {
        // Calculate First Meaningful Paint
        const paintEntries = performance.getEntriesByType('paint');
        const fmpEntry = paintEntries.find(entry => entry.name === 'first-meaningful-paint');
        if (fmpEntry) {
            this.metrics.fmp = fmpEntry.startTime;
        }

        // Calculate Speed Index (simplified)
        this.metrics.si = this.calculateSpeedIndex();
    }

    private calculateSpeedIndex(): number {
        // Simplified Speed Index calculation
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        const lcpEntry = performance.getEntriesByType('largest-contentful-paint')[0];

        if (fcpEntry && lcpEntry) {
            return (fcpEntry.startTime + lcpEntry.startTime) / 2;
        }

        return this.metrics.fcp || 0;
    }

    private monitorResourceLoading() {
        const resources = performance.getEntriesByType('resource');
        let totalSize = 0;
        let loadTime = 0;

        resources.forEach(resource => {
            const resourceWithTransferSize = resource as PerformanceEntryWithTransferSize;
            if (resourceWithTransferSize.transferSize) {
                totalSize += resourceWithTransferSize.transferSize;
            }
            loadTime += resource.duration;
        });

        // Log performance insights
        console.log('Performance Insights:', {
            totalResources: resources.length,
            totalSize: this.formatBytes(totalSize),
            averageLoadTime: loadTime / resources.length,
            slowestResource: this.findSlowestResource(resources)
        });
    }

    private findSlowestResource(resources: PerformanceEntry[]): PerformanceEntry | null {
        return resources.reduce((slowest, current) => {
            return current.duration > (slowest?.duration || 0) ? current : slowest;
        }, null as PerformanceEntry | null);
    }

    private generateReport(): PerformanceReport {
        const report: PerformanceReport = {
            timestamp: Date.now(),
            url: window.location.href,
            metrics: { ...this.metrics },
            userAgent: navigator.userAgent,
            connectionType: this.getConnectionType(),
            deviceMemory: this.getDeviceMemory(),
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
            score: this.calculateScore()
        };

        this.reports.push(report);
        this.sendReport(report);

        return report;
    }

    private calculateScore(): number {
        const { fcp, lcp, fid, cls, tti } = this.metrics;

        // Lighthouse scoring algorithm (simplified)
        const fcpScore = this.scoreMetric(fcp, [1800, 3000]);
        const lcpScore = this.scoreMetric(lcp, [2500, 4000]);
        const fidScore = this.scoreMetric(fid, [100, 300]);
        const clsScore = this.scoreMetric(cls, [0.1, 0.25]);
        const ttiScore = this.scoreMetric(tti, [3800, 7300]);

        return Math.round((fcpScore + lcpScore + fidScore + clsScore + ttiScore) / 5);
    }

    private scoreMetric(value: number, thresholds: [number, number]): number {
        if (value <= thresholds[0]) return 100;
        if (value <= thresholds[1]) return 100 - ((value - thresholds[0]) / (thresholds[1] - thresholds[0])) * 20;
        return Math.max(0, 80 - ((value - thresholds[1]) / thresholds[1]) * 80);
    }

    private getConnectionType(): string {
        const nav = navigator as NavigatorWithConnection;
        const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
        return connection?.effectiveType || 'unknown';
    }

    private getDeviceMemory(): number {
        const nav = navigator as NavigatorWithConnection;
        return nav.deviceMemory || 0;
    }

    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    private sendReport(report: PerformanceReport) {
        // Send to analytics service
        if (typeof window !== 'undefined' && 'fetch' in window) {
            fetch('/api/analytics/performance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(report)
            }).catch(error => {
                console.warn('Failed to send performance report:', error);
            });
        }
    }

    public getMetrics(): PerformanceMetrics {
        return { ...this.metrics };
    }

    public getScore(): number {
        return this.calculateScore();
    }

    public getReports(): PerformanceReport[] {
        return [...this.reports];
    }

    public getPerformanceInsights(): string[] {
        const insights: string[] = [];
        const { fcp, lcp, fid, cls, tti } = this.metrics;

        if (fcp > 3000) insights.push('First Contentful Paint is slow. Consider optimizing critical rendering path.');
        if (lcp > 4000) insights.push('Largest Contentful Paint is slow. Optimize images and critical resources.');
        if (fid > 300) insights.push('First Input Delay is high. Reduce JavaScript execution time.');
        if (cls > 0.25) insights.push('Cumulative Layout Shift is high. Avoid layout shifts during page load.');
        if (tti > 7300) insights.push('Time to Interactive is slow. Reduce JavaScript bundle size.');

        return insights;
    }

    public cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers = [];
    }
}

// Performance optimization utilities
export class PerformanceOptimizer {
    static async preloadCriticalResources() {
        const criticalResources = [
            '/fonts/geist-sans.woff2',
            '/fonts/geist-mono.woff2',
            '/icons/icon-192x192.png',
            '/icons/icon-512x512.png'
        ];

        for (const resource of criticalResources) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.woff2') ? 'font' : 'image';
            if (resource.endsWith('.woff2')) {
                link.crossOrigin = 'anonymous';
            }
            document.head.appendChild(link);
        }
    }

    static async optimizeImages() {
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            // Add loading="lazy" for non-critical images
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }

            // Add decoding="async" for better performance
            if (!img.hasAttribute('decoding')) {
                img.setAttribute('decoding', 'async');
            }
        });
    }

    static async deferNonCriticalCSS() {
        const nonCriticalCSS = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
        ];

        for (const css of nonCriticalCSS) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = css;
            link.as = 'style';
            link.onload = () => {
                link.rel = 'stylesheet';
            };
            document.head.appendChild(link);
        }
    }

    static async enableServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        }
    }

    static async enableResourceHints() {
        // DNS prefetch for external domains
        const externalDomains = [
            'fonts.googleapis.com',
            'fonts.gstatic.com'
        ];

        externalDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `//${domain}`;
            document.head.appendChild(link);
        });
    }
}

// Initialize performance monitoring
let performanceMonitor: PerformanceMonitor | null = null;

export function initializePerformanceMonitoring() {
    if (typeof window !== 'undefined' && !performanceMonitor) {
        performanceMonitor = new PerformanceMonitor();
    }
    return performanceMonitor;
}

export function getPerformanceMonitor(): PerformanceMonitor | null {
    return performanceMonitor;
}

export function cleanupPerformanceMonitoring() {
    if (performanceMonitor) {
        performanceMonitor.cleanup();
        performanceMonitor = null;
    }
}

// Performance monitoring hook for React
export function usePerformanceMonitoring() {
    const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
    const [score, setScore] = React.useState<number>(0);
    const [insights, setInsights] = React.useState<string[]>([]);

    React.useEffect(() => {
        const monitor = initializePerformanceMonitoring();
        if (monitor) {
            const updateMetrics = () => {
                setMetrics(monitor.getMetrics());
                setScore(monitor.getScore());
                setInsights(monitor.getPerformanceInsights());
            };

            // Update metrics after page load
            window.addEventListener('load', updateMetrics);

            // Update metrics periodically
            const interval = setInterval(updateMetrics, 5000);

            return () => {
                window.removeEventListener('load', updateMetrics);
                clearInterval(interval);
            };
        }
    }, []);

    return { metrics, score, insights };
}

export default PerformanceMonitor;
