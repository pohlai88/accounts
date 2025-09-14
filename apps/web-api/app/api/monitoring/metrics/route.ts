import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSecurityContext } from '../../_lib/request';
import { ok, problem } from '../../_lib/response';

// Mock metrics data (in production, use real MetricsCollector)
const mockMetrics = {
  system: {
    cpu: {
      usage: 45.2,
      loadAverage: [1.2, 1.5, 1.8],
      cores: 8
    },
    memory: {
      used: 2048576000,
      free: 4097152000,
      total: 6145728000,
      heapUsed: 1024288000,
      heapTotal: 2048576000,
      external: 512144000
    },
    disk: {
      used: 50000000000,
      free: 100000000000,
      total: 150000000000,
      usagePercent: 33.3
    },
    network: {
      bytesIn: 1024000,
      bytesOut: 2048000,
      packetsIn: 1500,
      packetsOut: 1200
    },
    process: {
      pid: 12345,
      uptime: 3600,
      memoryUsage: {
        rss: 2048576000,
        heapTotal: 2048576000,
        heapUsed: 1024288000,
        external: 512144000,
        arrayBuffers: 0
      },
      cpuUsage: {
        user: 1000000,
        system: 500000
      }
    }
  },
  application: {
    requests: {
      total: 15000,
      successful: 14850,
      failed: 150,
      rate: 250.5,
      avgResponseTime: 120,
      p95ResponseTime: 300,
      p99ResponseTime: 500
    },
    errors: {
      total: 150,
      rate: 2.5,
      byType: {
        'validation_error': 50,
        'authentication_error': 30,
        'authorization_error': 20,
        'internal_error': 50
      },
      byEndpoint: {
        '/api/users': 30,
        '/api/tenants': 25,
        '/api/auth': 20,
        '/api/data': 75
      }
    },
    cache: {
      hits: 12000,
      misses: 3000,
      hitRate: 0.8,
      evictions: 150,
      memoryUsage: 512000000
    },
    database: {
      connections: 10,
      queries: 5000,
      avgQueryTime: 25,
      slowQueries: 50,
      deadlocks: 0
    },
    security: {
      blockedRequests: 25,
      suspiciousActivities: 5,
      failedLogins: 15,
      rateLimitHits: 100
    }
  }
};

const MetricsQuerySchema = z.object({
  type: z.enum(['system', 'application', 'all']).default('all'),
  timeRange: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h'),
  granularity: z.enum(['1m', '5m', '15m', '1h', '1d']).default('5m')
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const url = new URL(req.url);
    const query = MetricsQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Filter metrics based on query
    const responseData: unknown = {};

    if (query.type === 'all' || query.type === 'system') {
      responseData.system = mockMetrics.system;
    }

    if (query.type === 'all' || query.type === 'application') {
      responseData.application = mockMetrics.application;
    }

    // Add time range information
    responseData.timeRange = {
      start: new Date(Date.now() - this.getTimeRangeMs(query.timeRange)).toISOString(),
      end: new Date().toISOString(),
      granularity: query.granularity
    };

    // Add health status
    responseData.health = {
      status: this.calculateHealthStatus(mockMetrics),
      timestamp: new Date().toISOString()
    };

    return ok(responseData, ctx.requestId);

  } catch (error: unknown) {
    console.error('Get metrics error:', error);

    if (error && typeof error === 'object' && 'status' in error) {
      return problem({
        status: error.status,
        title: error.message,
        code: 'AUTHENTICATION_ERROR',
        detail: error.message,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }

    if (error.name === 'ZodError') {
      return problem({
        status: 400,
        title: 'Validation error',
        code: 'VALIDATION_ERROR',
        detail: 'Invalid query parameters',
        errors: error.errors,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }

    return problem({
      status: 500,
      title: 'Internal server error',
      code: 'INTERNAL_ERROR',
      detail: 'Failed to get metrics',
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    });
  }
}

function getTimeRangeMs(timeRange: string): number {
  switch (timeRange) {
    case '1h': return 60 * 60 * 1000;
    case '6h': return 6 * 60 * 60 * 1000;
    case '24h': return 24 * 60 * 60 * 1000;
    case '7d': return 7 * 24 * 60 * 60 * 1000;
    case '30d': return 30 * 24 * 60 * 60 * 1000;
    default: return 24 * 60 * 60 * 1000;
  }
}

function calculateHealthStatus(metrics: unknown): 'healthy' | 'degraded' | 'unhealthy' {
  const { system, application } = metrics;

  // Check system health
  if (system.memory.usagePercent > 90 || system.cpu.usage > 90) {
    return 'unhealthy';
  }

  if (system.memory.usagePercent > 80 || system.cpu.usage > 80) {
    return 'degraded';
  }

  // Check application health
  if (application.errors.rate > 50 || application.requests.avgResponseTime > 5000) {
    return 'unhealthy';
  }

  if (application.errors.rate > 10 || application.requests.avgResponseTime > 2000) {
    return 'degraded';
  }

  return 'healthy';
}

