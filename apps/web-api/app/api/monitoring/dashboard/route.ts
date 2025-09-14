// Production Monitoring Dashboard
import { NextRequest } from 'next/server';
import { getSecurityContext } from '../../_lib/request';
import { ok, problem } from '../../_lib/response';
import { monitoring } from '../../../../lib/monitoring-integration';

export async function GET(req: NextRequest) {
    try {
        // Get security context
        const ctx = await getSecurityContext(req);

        // Initialize monitoring if not already done
        if (!monitoring['isInitialized']) {
            await monitoring.initialize();
        }

        // Get comprehensive monitoring data
        const healthStatus = monitoring.getHealthStatus();
        const systemMetrics = monitoring.getSystemMetrics();
        const applicationMetrics = monitoring.getApplicationMetrics();
        const aggregatedMetrics = monitoring.getAggregatedMetrics(ctx.tenantId, 3600000); // Last hour

        // Calculate key performance indicators
        const kpis = calculateKPIs(aggregatedMetrics);

        // Get real-time statistics
        const realTimeStats = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            version: process.env.APP_VERSION || 'unknown',
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch
        };

        // Get business metrics
        const businessMetrics = {
            totalRequests: kpis.totalRequests,
            errorRate: kpis.errorRate,
            averageResponseTime: kpis.averageResponseTime,
            cacheHitRate: kpis.cacheHitRate,
            activeUsers: kpis.activeUsers,
            rulesCreated: kpis.rulesCreated,
            realtimeConnections: kpis.realtimeConnections
        };

        // Get security metrics
        const securityMetrics = {
            securityEvents: kpis.securityEvents,
            rateLimitHits: kpis.rateLimitHits,
            authenticationFailures: kpis.authenticationFailures,
            suspiciousActivity: kpis.suspiciousActivity
        };

        // Get performance metrics
        const performanceMetrics = {
            responseTime: {
                p50: kpis.p50ResponseTime,
                p95: kpis.p95ResponseTime,
                p99: kpis.p99ResponseTime
            },
            throughput: kpis.throughput,
            errorRate: kpis.errorRate,
            availability: kpis.availability
        };

        // Get tenant-specific metrics
        const tenantMetrics = {
            tenantId: ctx.tenantId,
            requests: kpis.tenantRequests,
            errors: kpis.tenantErrors,
            cacheHits: kpis.tenantCacheHits,
            cacheMisses: kpis.tenantCacheMisses,
            realtimeEvents: kpis.tenantRealtimeEvents
        };

        const dashboard = {
            health: healthStatus,
            realTime: realTimeStats,
            business: businessMetrics,
            security: securityMetrics,
            performance: performanceMetrics,
            tenant: tenantMetrics,
            system: systemMetrics,
            application: applicationMetrics,
            aggregated: aggregatedMetrics
        };

        return ok(dashboard, ctx.requestId);

    } catch (error: unknown) {
        console.error('Monitoring dashboard error:', error);

        return problem({
            status: 500,
            title: 'Monitoring dashboard error',
            code: 'MONITORING_ERROR',
            detail: 'Failed to retrieve monitoring data',
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        });
    }
}

function calculateKPIs(metrics: unknown[]): unknown {
    if (!metrics || metrics.length === 0) {
        return {
            totalRequests: 0,
            errorRate: 0,
            averageResponseTime: 0,
            cacheHitRate: 0,
            activeUsers: 0,
            rulesCreated: 0,
            realtimeConnections: 0,
            securityEvents: 0,
            rateLimitHits: 0,
            authenticationFailures: 0,
            suspiciousActivity: 0,
            p50ResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            throughput: 0,
            availability: 100,
            tenantRequests: 0,
            tenantErrors: 0,
            tenantCacheHits: 0,
            tenantCacheMisses: 0,
            tenantRealtimeEvents: 0
        };
    }

    // Calculate KPIs from metrics
    const apiMetrics = metrics.filter(m => m.name?.startsWith('api.'));
    const cacheMetrics = metrics.filter(m => m.name?.startsWith('cache.'));
    const businessMetrics = metrics.filter(m => m.name?.startsWith('business.'));
    const securityMetrics = metrics.filter(m => m.name?.startsWith('security.'));
    const realtimeMetrics = metrics.filter(m => m.name?.startsWith('realtime.'));

    const totalRequests = apiMetrics
        .filter(m => m.name === 'api.requests.total')
        .reduce((sum, m) => sum + (m.value || 0), 0);

    const totalErrors = apiMetrics
        .filter(m => m.name === 'api.requests.errors')
        .reduce((sum, m) => sum + (m.value || 0), 0);

    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;

    const responseTimeMetrics = apiMetrics
        .filter(m => m.name === 'api.requests.duration')
        .map(m => m.value || 0);

    const averageResponseTime = responseTimeMetrics.length > 0
        ? responseTimeMetrics.reduce((sum, time) => sum + time, 0) / responseTimeMetrics.length
        : 0;

    const cacheHits = cacheMetrics
        .filter(m => m.name === 'cache.operations.total' && m.tags?.operation === 'hit')
        .reduce((sum, m) => sum + (m.value || 0), 0);

    const cacheMisses = cacheMetrics
        .filter(m => m.name === 'cache.operations.total' && m.tags?.operation === 'miss')
        .reduce((sum, m) => sum + (m.value || 0), 0);

    const cacheHitRate = (cacheHits + cacheMisses) > 0
        ? (cacheHits / (cacheHits + cacheMisses)) * 100
        : 0;

    const rulesCreated = businessMetrics
        .filter(m => m.name === 'business.rules_created')
        .reduce((sum, m) => sum + (m.value || 0), 0);

    const securityEvents = securityMetrics
        .filter(m => m.name === 'security.events.total')
        .reduce((sum, m) => sum + (m.value || 0), 0);

    const realtimeConnections = realtimeMetrics
        .filter(m => m.name === 'realtime.connections.total')
        .reduce((sum, m) => sum + (m.value || 0), 0);

    // Calculate percentiles
    const sortedResponseTimes = responseTimeMetrics.sort((a, b) => a - b);
    const p50ResponseTime = calculatePercentile(sortedResponseTimes, 50);
    const p95ResponseTime = calculatePercentile(sortedResponseTimes, 95);
    const p99ResponseTime = calculatePercentile(sortedResponseTimes, 99);

    return {
        totalRequests,
        errorRate: Math.round(errorRate * 100) / 100,
        averageResponseTime: Math.round(averageResponseTime * 100) / 100,
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        activeUsers: 0, // Would need user tracking
        rulesCreated,
        realtimeConnections,
        securityEvents,
        rateLimitHits: 0, // Would need rate limit tracking
        authenticationFailures: 0, // Would need auth failure tracking
        suspiciousActivity: 0, // Would need suspicious activity tracking
        p50ResponseTime: Math.round(p50ResponseTime * 100) / 100,
        p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
        p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
        throughput: totalRequests / 3600, // Requests per second (assuming 1 hour window)
        availability: errorRate < 5 ? 100 : Math.max(0, 100 - errorRate),
        tenantRequests: totalRequests, // Simplified - would filter by tenant
        tenantErrors: totalErrors, // Simplified - would filter by tenant
        tenantCacheHits: cacheHits, // Simplified - would filter by tenant
        tenantCacheMisses: cacheMisses, // Simplified - would filter by tenant
        tenantRealtimeEvents: realtimeConnections // Simplified - would filter by tenant
    };
}

function calculatePercentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = (percentile / 100) * (sortedArray.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1];

    return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
}
