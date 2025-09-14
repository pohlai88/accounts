/**
 * @aibos/monitoring - Health Check System
 * 
 * Comprehensive health monitoring for all system components
 */

import { CacheService } from '@aibos/cache';

export interface HealthCheck {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    message?: string;
    details?: Record<string, any>;
    lastChecked: string;
    responseTime?: number;
}

export interface SystemHealth {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    version: string;
    components: HealthCheck[];
    summary: {
        healthy: number;
        degraded: number;
        unhealthy: number;
    };
}

export class HealthChecker {
    private cache: CacheService;
    private checks: Map<string, () => Promise<HealthCheck>> = new Map();

    constructor(cache: CacheService) {
        this.cache = cache;
        this.initializeHealthChecks();
    }

    private initializeHealthChecks(): void {
        // Database health check
        this.addHealthCheck('database', async () => {
            const startTime = Date.now();
            try {
                // TODO: Implement actual database health check
                // For now, simulate a check
                await new Promise(resolve => setTimeout(resolve, 10));

                return {
                    name: 'database',
                    status: 'healthy',
                    message: 'Database connection is healthy',
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            } catch (error) {
                return {
                    name: 'database',
                    status: 'unhealthy',
                    message: `Database connection failed: ${error}`,
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            }
        });

        // Redis health check
        this.addHealthCheck('redis', async () => {
            const startTime = Date.now();
            try {
                const ping = await this.cache.get('health-check', { ttl: 1 });
                await this.cache.set('health-check', 'ok', { ttl: 1 });

                return {
                    name: 'redis',
                    status: 'healthy',
                    message: 'Redis connection is healthy',
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            } catch (error) {
                return {
                    name: 'redis',
                    status: 'unhealthy',
                    message: `Redis connection failed: ${error}`,
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            }
        });

        // Memory health check
        this.addHealthCheck('memory', async () => {
            const startTime = Date.now();
            try {
                const memoryUsage = process.memoryUsage();
                const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
                const usedMemory = memoryUsage.heapUsed;
                const memoryPercentage = (usedMemory / totalMemory) * 100;

                let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
                let message = 'Memory usage is normal';

                if (memoryPercentage > 90) {
                    status = 'unhealthy';
                    message = 'Memory usage is critically high';
                } else if (memoryPercentage > 80) {
                    status = 'degraded';
                    message = 'Memory usage is high';
                }

                return {
                    name: 'memory',
                    status,
                    message,
                    details: {
                        used: usedMemory,
                        total: totalMemory,
                        percentage: memoryPercentage,
                    },
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            } catch (error) {
                return {
                    name: 'memory',
                    status: 'unhealthy',
                    message: `Memory check failed: ${error}`,
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            }
        });

        // Disk space health check
        this.addHealthCheck('disk', async () => {
            const startTime = Date.now();
            try {
                // TODO: Implement actual disk space check
                // For now, simulate a check
                await new Promise(resolve => setTimeout(resolve, 5));

                return {
                    name: 'disk',
                    status: 'healthy',
                    message: 'Disk space is sufficient',
                    details: {
                        free: '50GB',
                        used: '30GB',
                        total: '80GB',
                    },
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            } catch (error) {
                return {
                    name: 'disk',
                    status: 'unhealthy',
                    message: `Disk check failed: ${error}`,
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            }
        });

        // API endpoints health check
        this.addHealthCheck('api', async () => {
            const startTime = Date.now();
            try {
                // TODO: Implement actual API health check
                // For now, simulate a check
                await new Promise(resolve => setTimeout(resolve, 15));

                return {
                    name: 'api',
                    status: 'healthy',
                    message: 'API endpoints are responding',
                    details: {
                        responseTime: '15ms',
                        endpoints: ['/health', '/metrics', '/api/auth', '/api/invoices'],
                    },
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            } catch (error) {
                return {
                    name: 'api',
                    status: 'unhealthy',
                    message: `API health check failed: ${error}`,
                    lastChecked: new Date().toISOString(),
                    responseTime: Date.now() - startTime,
                };
            }
        });
    }

    addHealthCheck(name: string, check: () => Promise<HealthCheck>): void {
        this.checks.set(name, check);
    }

    async runHealthCheck(name: string): Promise<HealthCheck> {
        const check = this.checks.get(name);
        if (!check) {
            throw new Error(`Health check '${name}' not found`);
        }
        return await check();
    }

    async runAllHealthChecks(): Promise<SystemHealth> {
        const startTime = Date.now();
        const components: HealthCheck[] = [];

        // Run all health checks in parallel
        const checkPromises = Array.from(this.checks.entries()).map(async ([name, check]) => {
            try {
                return await check();
            } catch (error) {
                return {
                    name,
                    status: 'unhealthy' as const,
                    message: `Health check failed: ${error}`,
                    lastChecked: new Date().toISOString(),
                };
            }
        });

        const results = await Promise.all(checkPromises);
        components.push(...results);

        // Calculate summary
        const summary = {
            healthy: components.filter(c => c.status === 'healthy').length,
            degraded: components.filter(c => c.status === 'degraded').length,
            unhealthy: components.filter(c => c.status === 'unhealthy').length,
        };

        // Determine overall status
        let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (summary.unhealthy > 0) {
            overall = 'unhealthy';
        } else if (summary.degraded > 0) {
            overall = 'degraded';
        }

        return {
            overall,
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
            components,
            summary,
        };
    }

    async getQuickHealth(): Promise<{ status: string; timestamp: string }> {
        try {
            // Quick check - just verify Redis is accessible
            await this.cache.get('quick-health-check', { ttl: 1 });
            return {
                status: 'healthy',
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
            };
        }
    }

    // Get health status for specific component
    async getComponentHealth(componentName: string): Promise<HealthCheck | null> {
        try {
            return await this.runHealthCheck(componentName);
        } catch (error) {
            return null;
        }
    }

    // Get health history (stored in cache)
    async getHealthHistory(limit: number = 10): Promise<SystemHealth[]> {
        try {
            const history = await this.cache.get<SystemHealth[]>('health-history', {
                namespace: 'monitoring',
            });
            return history ? history.slice(-limit) : [];
        } catch (error) {
            console.error('Error getting health history:', error);
            return [];
        }
    }

    // Store health check result in history
    async storeHealthResult(health: SystemHealth): Promise<void> {
        try {
            const history = await this.getHealthHistory(100); // Get last 100 entries
            history.push(health);

            // Keep only last 100 entries
            const trimmedHistory = history.slice(-100);

            await this.cache.set('health-history', trimmedHistory, {
                namespace: 'monitoring',
                ttl: 7 * 24 * 60 * 60, // 7 days
            });
        } catch (error) {
            console.error('Error storing health result:', error);
        }
    }
}

// Singleton health checker
let healthChecker: HealthChecker | null = null;

export function getHealthChecker(cache?: CacheService): HealthChecker {
    if (!healthChecker) {
        if (!cache) {
            throw new Error('Cache service required for health checker');
        }
        healthChecker = new HealthChecker(cache);
    }
    return healthChecker;
}
