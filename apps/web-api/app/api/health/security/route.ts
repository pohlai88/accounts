import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHealth, getSecurityStats } from '../../../../middleware/security-middleware';

export async function GET(_req: NextRequest) {
  try {
    // Get security health status
    const health = await getSecurityHealth();
    const stats = await getSecurityStats();

    // Determine overall health status
    const overallStatus = health.status === 'unhealthy' ? 'unhealthy' :
      health.status === 'degraded' ? 'degraded' : 'healthy';

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      security: {
        health,
        statistics: stats
      },
      issues: (health as { issues?: unknown[] }).issues || [],
      recommendations: generateSecurityRecommendations(health, stats)
    };

    return NextResponse.json(response, {
      status: overallStatus === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'security'
      }
    });

  } catch (error) {
    console.error('Security health check error:', error);

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Security health check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'security'
      }
    });
  }
}

function generateSecurityRecommendations(health: { status: string;[key: string]: unknown }, stats: { [key: string]: unknown }): string[] {
  const recommendations: string[] = [];

  if (health.status === 'unhealthy') {
    recommendations.push('Immediate security review required');
    recommendations.push('Consider implementing additional monitoring');
  }

  if (health.status === 'degraded') {
    recommendations.push('Review security event patterns');
    recommendations.push('Consider rate limiting adjustments');
  }

  if ((stats as { totalEvents?: number }).totalEvents && (stats as { totalEvents: number }).totalEvents > 10000) {
    recommendations.push('High security event volume - consider log rotation');
  }

  if ((stats as { recentEvents?: number }).recentEvents && (stats as { recentEvents: number }).recentEvents > 100) {
    recommendations.push('Recent high activity - monitor for potential attacks');
  }

  const topAttackingIPs = (stats as { topAttackingIPs?: unknown[] }).topAttackingIPs;
  if (topAttackingIPs && Array.isArray(topAttackingIPs) && topAttackingIPs.length > 0) {
    recommendations.push('Consider blocking suspicious IP addresses');
  }

  if (recommendations.length === 0) {
    recommendations.push('Security posture is good - continue monitoring');
  }

  return recommendations;
}
