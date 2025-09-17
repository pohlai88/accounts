// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import {
  getMonitoringHealth,
  getMonitoringStats,
} from "../../../../middleware/monitoring-middleware";

export async function GET(req: NextRequest) {
  try {
    // Get monitoring health status
    const health = await getMonitoringHealth();
    const stats = await getMonitoringStats();

    // Determine overall health status
    const overallStatus =
      health.status === "unhealthy"
        ? "unhealthy"
        : health.components?.metrics?.status === "degraded"
          ? "degraded"
          : "healthy";

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      monitoring: {
        health,
        statistics: stats,
      },
      issues: health.components
        ? [
            ...(health.components.metrics?.issues || []),
            ...(health.components.tracing?.status === "unhealthy"
              ? ["Tracing system unhealthy"]
              : []),
            ...(health.components.logging?.status === "unhealthy"
              ? ["Logging system unhealthy"]
              : []),
          ]
        : [],
      recommendations: health.components?.metrics?.recommendations || [],
    };

    return NextResponse.json(response, {
      status: overallStatus === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "monitoring",
      },
    });
  } catch (error) {
    console.error("Monitoring health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Monitoring health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": "monitoring",
        },
      },
    );
  }
}
