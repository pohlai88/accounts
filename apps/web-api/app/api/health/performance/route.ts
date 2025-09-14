import { NextRequest, NextResponse } from "next/server";
import { createPerformanceMiddleware } from "../../../../middleware/performance-middleware";
import { createCacheMiddleware } from "../../../../middleware/cache-middleware";
import { getCacheService } from "@aibos/cache";

// Initialize middleware
const performanceMiddleware = createPerformanceMiddleware({
  enabled: true,
  logSlowRequests: true,
  slowRequestThreshold: 1000,
  enableMemoryTracking: true,
  enableCpuTracking: true,
});

const cacheMiddleware = createCacheMiddleware(
  getCacheService(), // Use cache service
  {
    enabled: true,
    defaultTTL: 300,
    cacheableMethods: ["GET"],
    cacheableRoutes: ["/api/health"],
  },
);

export async function GET(req: NextRequest) {
  try {
    // Get performance statistics
    const perfStats = performanceMiddleware.getStats();
    const perfHealth = performanceMiddleware.getHealthStatus();

    // Get cache statistics
    const cacheStats = cacheMiddleware.getCacheStats();
    const cacheHealth = await cacheMiddleware.healthCheck();

    // Get system information
    const systemInfo = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    };

    // Determine overall health status
    const overallStatus =
      perfHealth.status === "healthy" && cacheHealth.status === "healthy"
        ? "healthy"
        : perfHealth.status === "unhealthy" || cacheHealth.status === "unhealthy"
          ? "unhealthy"
          : "degraded";

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      performance: {
        ...perfStats,
        health: perfHealth,
      },
      cache: {
        ...cacheStats,
        health: cacheHealth,
      },
      system: systemInfo,
      issues: [
        ...perfHealth.issues,
        ...(cacheHealth.status === "unhealthy" ? ["Cache system unhealthy"] : []),
      ],
    };

    return NextResponse.json(response, {
      status: overallStatus === "healthy" ? 200 : 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "performance",
      },
    });
  } catch (error) {
    console.error("Performance health check error:", error);

    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-Health-Check": "performance",
        },
      },
    );
  }
}
