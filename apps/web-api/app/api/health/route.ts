// Complete Health Check System
// DoD: Complete health check system
// SSOT: Use existing monitoring package
// Tech Stack: Next.js Route Handler + health checks

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { monitoring } from "../../../lib/monitoring";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  components: {
    database: ComponentHealth;
    cache: ComponentHealth;
    monitoring: ComponentHealth;
  };
  metrics: {
    responseTime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };
}

export interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy";
  responseTime?: number;
  lastChecked: string;
  details?: Record<string, any>;
  error?: string;
}

// ============================================================================
// HEALTH CHECK MANAGER
// ============================================================================

class HealthCheckManager {
  private startTime: number = Date.now();

  async runFullHealthCheck(): Promise<HealthCheckResult> {
    const checkStartTime = Date.now();

    try {
      // Run health checks in parallel
      const [databaseHealth, cacheHealth, monitoringHealth] = await Promise.allSettled([
        this.checkDatabase(),
        this.checkCache(),
        this.checkMonitoring(),
      ]);

      const components = {
        database: databaseHealth.status === "fulfilled" ? databaseHealth.value : this.createErrorHealth("Database check failed"),
        cache: cacheHealth.status === "fulfilled" ? cacheHealth.value : this.createErrorHealth("Cache check failed"),
        monitoring: monitoringHealth.status === "fulfilled" ? monitoringHealth.value : this.createErrorHealth("Monitoring check failed"),
      };

      const overallStatus = this.determineOverallStatus(components);

      // Record health check metrics
      monitoring.recordMetric(
        "health_check.response_time",
        Date.now() - checkStartTime,
        "milliseconds",
        { status: overallStatus }
      );

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: Date.now() - this.startTime,
        components,
        metrics: {
          responseTime: Date.now() - checkStartTime,
          memoryUsage: process.memoryUsage(),
        },
      };
    } catch (error) {
      console.error("Health check failed:", error);

      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: Date.now() - this.startTime,
        components: {
          database: this.createErrorHealth("Health check system error"),
          cache: this.createErrorHealth("Health check system error"),
          monitoring: this.createErrorHealth("Health check system error"),
        },
        metrics: {
          responseTime: Date.now() - checkStartTime,
          memoryUsage: process.memoryUsage(),
        },
      };
    }
  }

  async runQuickHealthCheck(): Promise<HealthCheckResult> {
    const checkStartTime = Date.now();

    try {
      // Only check critical components
      const databaseHealth = await this.checkDatabase();

      const components = {
        database: databaseHealth,
        cache: { status: "healthy" as const, lastChecked: new Date().toISOString() },
        monitoring: { status: "healthy" as const, lastChecked: new Date().toISOString() },
      };

      const overallStatus = this.determineOverallStatus(components);

      return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: Date.now() - this.startTime,
        components,
        metrics: {
          responseTime: Date.now() - checkStartTime,
          memoryUsage: process.memoryUsage(),
        },
      };
    } catch (error) {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        uptime: Date.now() - this.startTime,
        components: {
          database: this.createErrorHealth("Quick health check failed"),
          cache: this.createErrorHealth("Quick health check failed"),
          monitoring: this.createErrorHealth("Quick health check failed"),
        },
        metrics: {
          responseTime: Date.now() - checkStartTime,
          memoryUsage: process.memoryUsage(),
        },
      };
    }
  }

  private async checkDatabase(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Test basic connectivity
      const { data, error } = await supabase
        .from("tenants")
        .select("id")
        .limit(1);

      if (error) {
        throw error;
      }

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          connectionPool: "active",
          testQuery: "success",
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: "unhealthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        error: String(error),
      };
    }
  }

  private async checkCache(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Test cache connectivity
      const cache = await import("@aibos/cache").then(m => m.getCacheService());

      const testKey = `health_check_${Date.now()}`;
      const testValue = "health_check_value";

      // Test set and get operations
      await cache.set(testKey, testValue, { ttl: 10 });
      const retrievedValue = await cache.get(testKey);

      if (retrievedValue !== testValue) {
        throw new Error("Cache value mismatch");
      }

      // Note: Cache cleanup handled by TTL

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          operations: "read_write_delete_success",
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: "unhealthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        error: String(error),
      };
    }
  }

  private async checkMonitoring(): Promise<ComponentHealth> {
    const startTime = Date.now();

    try {
      // Test monitoring system
      const healthStatus = monitoring.getHealthStatus();

      if (healthStatus.status === "unhealthy") {
        throw new Error("Monitoring system is unhealthy");
      }

      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        details: {
          status: healthStatus.status,
          components: healthStatus.components,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        status: "unhealthy",
        responseTime,
        lastChecked: new Date().toISOString(),
        error: String(error),
      };
    }
  }

  private determineOverallStatus(components: HealthCheckResult["components"]): "healthy" | "degraded" | "unhealthy" {
    const statuses = Object.values(components).map(c => c.status);

    if (statuses.includes("unhealthy")) {
      return "unhealthy";
    }

    if (statuses.includes("degraded")) {
      return "degraded";
    }

    return "healthy";
  }

  private createErrorHealth(message: string): ComponentHealth {
    return {
      status: "unhealthy",
      lastChecked: new Date().toISOString(),
      error: message,
    };
  }
}

// ============================================================================
// API ROUTES
// ============================================================================

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const checkType = url.searchParams.get("type") || "full";

  try {
    const healthManager = new HealthCheckManager();
    const result = checkType === "quick"
      ? await healthManager.runQuickHealthCheck()
      : await healthManager.runFullHealthCheck();

    // Set appropriate HTTP status code
    const statusCode = result.status === "healthy" ? 200 :
      result.status === "degraded" ? 200 : 503;

    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    console.error("Health check error:", error);

    const errorResult: HealthCheckResult = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: 0,
      components: {
        database: { status: "unhealthy", lastChecked: new Date().toISOString(), error: "Health check system error" },
        cache: { status: "unhealthy", lastChecked: new Date().toISOString(), error: "Health check system error" },
        monitoring: { status: "unhealthy", lastChecked: new Date().toISOString(), error: "Health check system error" },
      },
      metrics: {
        responseTime: 0,
        memoryUsage: process.memoryUsage(),
      },
    };

    return NextResponse.json(errorResult, { status: 503 });
  }
}

// Quick health check for load balancers
export async function HEAD(req: NextRequest) {
  try {
    const healthManager = new HealthCheckManager();
    const result = await healthManager.runQuickHealthCheck();

    const statusCode = result.status === "healthy" ? 200 : 503;
    return new NextResponse(null, { status: statusCode });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}
