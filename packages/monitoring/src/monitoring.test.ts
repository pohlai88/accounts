/**
 * @aibos/monitoring - Monitoring Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MetricsCollector } from './metrics';
import { HealthChecker } from './health';

// Mock cache service
const mockCache = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    getStats: vi.fn(() => ({ hits: 10, misses: 5, sets: 15, deletes: 2, errors: 0 })),
} as any;

describe('MetricsCollector', () => {
    let metrics: MetricsCollector;

    beforeEach(() => {
        vi.clearAllMocks();
        metrics = new MetricsCollector(mockCache);
    });

    describe('Request Tracking', () => {
        it('should track HTTP requests', () => {
            expect(() => {
                metrics.trackRequest('GET', '/api/test', 200, 150);
            }).not.toThrow();
        });

        it('should track HTTP errors', () => {
            expect(() => {
                metrics.trackRequest('POST', '/api/test', 500, 200);
            }).not.toThrow();
        });
    });

    describe('Cache Tracking', () => {
        it('should track cache hits', () => {
            expect(() => {
                metrics.trackCacheOperation('get', 'hit');
            }).not.toThrow();
        });

        it('should track cache misses', () => {
            expect(() => {
                metrics.trackCacheOperation('get', 'miss');
            }).not.toThrow();
        });
    });

    describe('Business Metrics', () => {
        it('should track invoice creation', () => {
            expect(() => {
                metrics.trackInvoiceCreated('tenant-1');
            }).not.toThrow();
        });

        it('should track invoice processing', () => {
            expect(() => {
                metrics.trackInvoiceProcessed('tenant-1', 'posted');
            }).not.toThrow();
        });

        it('should track attachment uploads', () => {
            expect(() => {
                metrics.trackAttachmentUploaded('tenant-1', 'pdf');
            }).not.toThrow();
        });
    });

    describe('System Metrics', () => {
        it('should update connection counts', () => {
            expect(() => {
                metrics.updateActiveConnections(10);
                metrics.updateDatabaseConnections(5);
                metrics.updateRedisConnections(3);
            }).not.toThrow();
        });

        it('should update cache hit rate', () => {
            expect(() => {
                metrics.updateCacheHitRate(85.5);
            }).not.toThrow();
        });
    });

    describe('Metrics Retrieval', () => {
        it('should get performance metrics', async () => {
            const performanceMetrics = await metrics.getPerformanceMetrics();

            expect(performanceMetrics).toHaveProperty('requests');
            expect(performanceMetrics).toHaveProperty('responseTime');
            expect(performanceMetrics).toHaveProperty('errors');
            expect(performanceMetrics).toHaveProperty('cache');
            expect(performanceMetrics).toHaveProperty('system');
        });

        it('should get Prometheus metrics', async () => {
            const prometheusMetrics = await metrics.getPrometheusMetrics();

            expect(typeof prometheusMetrics).toBe('string');
            expect(prometheusMetrics).toContain('aibos_');
        });
    });
});

describe('HealthChecker', () => {
    let healthChecker: HealthChecker;

    beforeEach(() => {
        vi.clearAllMocks();
        healthChecker = new HealthChecker(mockCache);
    });

    describe('Health Checks', () => {
        it('should run individual health checks', async () => {
            const dbHealth = await healthChecker.runHealthCheck('database');

            expect(dbHealth).toHaveProperty('name', 'database');
            expect(dbHealth).toHaveProperty('status');
            expect(dbHealth).toHaveProperty('lastChecked');
        });

        it('should run all health checks', async () => {
            const systemHealth = await healthChecker.runAllHealthChecks();

            expect(systemHealth).toHaveProperty('overall');
            expect(systemHealth).toHaveProperty('timestamp');
            expect(systemHealth).toHaveProperty('uptime');
            expect(systemHealth).toHaveProperty('components');
            expect(systemHealth).toHaveProperty('summary');
        });

        it('should get quick health status', async () => {
            const quickHealth = await healthChecker.getQuickHealth();

            expect(quickHealth).toHaveProperty('status');
            expect(quickHealth).toHaveProperty('timestamp');
        });
    });

    describe('Health History', () => {
        it('should store and retrieve health history', async () => {
            const systemHealth = await healthChecker.runAllHealthChecks();
            await healthChecker.storeHealthResult(systemHealth);

            const history = await healthChecker.getHealthHistory(5);
            expect(Array.isArray(history)).toBe(true);
        });
    });

    describe('Component Health', () => {
        it('should get specific component health', async () => {
            const dbHealth = await healthChecker.getComponentHealth('database');

            expect(dbHealth).toHaveProperty('name', 'database');
            expect(dbHealth).toHaveProperty('status');
        });

        it('should return null for non-existent component', async () => {
            const unknownHealth = await healthChecker.getComponentHealth('unknown');

            expect(unknownHealth).toBeNull();
        });
    });
});
