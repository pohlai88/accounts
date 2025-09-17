// @ts-nocheck
// D3 Puppeteer Health Check System - Monitor PDF Generation Pool
// V1 Requirement: Health check page.create() every 60s, auto-restart pool on fail

import { getPuppeteerPool } from "./pdf-pool.js";
import { logger } from "@aibos/utils";

export interface HealthCheckResult {
  timestamp: Date;
  status: "healthy" | "degraded" | "unhealthy";
  poolStats: {
    totalBrowsers: number;
    healthyBrowsers: number;
    averageAge: number;
    averageUsage: number;
  };
  responseTime: number;
  errors: string[];
  warnings: string[];
}

export interface HealthCheckConfig {
  checkInterval: number; // milliseconds
  testTimeout: number; // milliseconds
  maxConsecutiveFailures: number;
  restartThreshold: number; // percentage of healthy browsers
}

const DEFAULT_CONFIG: HealthCheckConfig = {
  checkInterval: 60000, // 60 seconds as per V1 requirement
  testTimeout: 10000, // 10 seconds for test operations
  maxConsecutiveFailures: 3,
  restartThreshold: 50, // Restart if less than 50% browsers are healthy
};

class PuppeteerHealthMonitor {
  private config: HealthCheckConfig;
  private isRunning: boolean = false;
  private checkTimer?: NodeJS.Timeout;
  private consecutiveFailures: number = 0;
  private lastHealthCheck?: HealthCheckResult;
  private healthHistory: HealthCheckResult[] = [];
  private maxHistorySize: number = 100;

  constructor(config: Partial<HealthCheckConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Start the health monitoring system
   */
  start(): void {
    if (this.isRunning) {
      logger.warn("Health monitor is already running");
      return;
    }

    this.isRunning = true;
    logger.info("Starting Puppeteer health monitor", {
      checkInterval: this.config.checkInterval,
      testTimeout: this.config.testTimeout,
      maxConsecutiveFailures: this.config.maxConsecutiveFailures,
    });

    // Perform initial health check
    this.performHealthCheck();

    // Schedule periodic checks
    this.checkTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.config.checkInterval);
  }

  /**
   * Stop the health monitoring system
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = undefined;
    }

    logger.info("Puppeteer health monitor stopped");
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      logger.debug("Performing Puppeteer health check");

      // Get pool statistics
      const pool = getPuppeteerPool();
      const poolStats = pool.getStats();

      // Test basic pool functionality
      await this.testPoolFunctionality();

      // Analyze pool health
      const healthAnalysis = this.analyzePoolHealth(poolStats);
      warnings.push(...healthAnalysis.warnings);

      // Determine overall status
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";

      if (poolStats.healthyBrowsers === 0) {
        status = "unhealthy";
        errors.push("No healthy browsers available");
      } else if (
        poolStats.healthyBrowsers <
        poolStats.totalBrowsers * (this.config.restartThreshold / 100)
      ) {
        status = "degraded";
        warnings.push(
          `Only ${poolStats.healthyBrowsers}/${poolStats.totalBrowsers} browsers are healthy`,
        );
      }

      const responseTime = Date.now() - startTime;

      const result: HealthCheckResult = {
        timestamp: new Date(),
        status,
        poolStats,
        responseTime,
        errors,
        warnings,
      };

      await this.handleHealthCheckResult(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      errors.push(`Health check failed: ${errorMessage}`);

      const result: HealthCheckResult = {
        timestamp: new Date(),
        status: "unhealthy",
        poolStats: { totalBrowsers: 0, healthyBrowsers: 0, averageAge: 0, averageUsage: 0 },
        responseTime,
        errors,
        warnings,
      };

      await this.handleHealthCheckResult(result);
    }
  }

  /**
   * Test basic pool functionality
   */
  private async testPoolFunctionality(): Promise<void> {
    const pool = getPuppeteerPool();

    // Test PDF generation with simple HTML
    const testHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Health Check</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { color: #2563eb; font-size: 24px; margin-bottom: 10px; }
            .timestamp { color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="header">Puppeteer Health Check</div>
          <div class="timestamp">Generated: ${new Date().toISOString()}</div>
          <p>This PDF was generated as part of the health check process.</p>
        </body>
      </html>
    `;

    const result = await pool.generatePdf({
      html: testHtml,
      format: "A4",
      timeout: this.config.testTimeout,
    });

    if (!result.success) {
      throw new Error(`PDF generation test failed: ${result.error}`);
    }

    if (result.buffer.length === 0) {
      throw new Error("PDF generation test produced empty buffer");
    }

    logger.debug("PDF generation test passed", {
      bufferSize: result.buffer.length,
      generationTime: result.generationTime,
      retryCount: result.retryCount,
    });
  }

  /**
   * Analyze pool health and generate warnings
   */
  private analyzePoolHealth(stats: any): { warnings: string[] } {
    const warnings: string[] = [];

    // Check browser age
    if (stats.averageAge > 20) {
      // 20 minutes
      warnings.push(`High average browser age: ${stats.averageAge.toFixed(1)} minutes`);
    }

    // Check browser usage
    if (stats.averageUsage > 80) {
      warnings.push(`High average browser usage: ${stats.averageUsage} operations`);
    }

    // Check pool size
    if (stats.totalBrowsers === 0) {
      warnings.push("No browsers in pool");
    } else if (stats.totalBrowsers < 2) {
      warnings.push("Pool size below recommended minimum");
    }

    return { warnings };
  }

  /**
   * Handle health check result and take appropriate actions
   */
  private async handleHealthCheckResult(result: HealthCheckResult): Promise<void> {
    this.lastHealthCheck = result;
    this.addToHistory(result);

    // Log result
    const logData = {
      status: result.status,
      responseTime: result.responseTime,
      poolStats: result.poolStats,
      errorsCount: result.errors.length,
      warningsCount: result.warnings.length,
    };

    if (result.status === "healthy") {
      logger.info("Puppeteer health check passed", logData);
      this.consecutiveFailures = 0;
    } else if (result.status === "degraded") {
      logger.warn("Puppeteer health check shows degraded performance", {
        ...logData,
        warnings: result.warnings,
      });
      this.consecutiveFailures++;
    } else {
      logger.error("Puppeteer health check failed", {
        ...logData,
        errors: result.errors,
        warnings: result.warnings,
      });
      this.consecutiveFailures++;
    }

    // Take corrective actions if needed
    if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      await this.handleConsecutiveFailures();
    }
  }

  /**
   * Handle consecutive failures by restarting the pool
   */
  private async handleConsecutiveFailures(): Promise<void> {
    logger.error("Maximum consecutive failures reached, attempting pool recovery", {
      consecutiveFailures: this.consecutiveFailures,
      maxFailures: this.config.maxConsecutiveFailures,
    });

    try {
      const pool = getPuppeteerPool();

      // Force a health check on the pool to clean up unhealthy browsers
      await pool.performHealthCheck();

      // Reset failure counter
      this.consecutiveFailures = 0;

      logger.info("Pool recovery completed successfully");
    } catch (error) {
      logger.error("Pool recovery failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      // Don't reset failure counter if recovery failed
      // This will trigger another recovery attempt on the next check
    }
  }

  /**
   * Add result to history and maintain size limit
   */
  private addToHistory(result: HealthCheckResult): void {
    this.healthHistory.push(result);

    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get current health status
   */
  getCurrentHealth(): HealthCheckResult | null {
    return this.lastHealthCheck || null;
  }

  /**
   * Get health history
   */
  getHealthHistory(limit?: number): HealthCheckResult[] {
    if (limit) {
      return this.healthHistory.slice(-limit);
    }
    return [...this.healthHistory];
  }

  /**
   * Get health statistics
   */
  getHealthStats(): {
    totalChecks: number;
    healthyChecks: number;
    degradedChecks: number;
    unhealthyChecks: number;
    averageResponseTime: number;
    uptime: number;
  } {
    const totalChecks = this.healthHistory.length;
    const healthyChecks = this.healthHistory.filter(h => h.status === "healthy").length;
    const degradedChecks = this.healthHistory.filter(h => h.status === "degraded").length;
    const unhealthyChecks = this.healthHistory.filter(h => h.status === "unhealthy").length;

    const averageResponseTime =
      totalChecks > 0
        ? this.healthHistory.reduce((sum, h) => sum + h.responseTime, 0) / totalChecks
        : 0;

    const uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 0;

    return {
      totalChecks,
      healthyChecks,
      degradedChecks,
      unhealthyChecks,
      averageResponseTime: Math.round(averageResponseTime),
      uptime: Math.round(uptime * 100) / 100,
    };
  }

  /**
   * Check if the system is currently healthy
   */
  isHealthy(): boolean {
    return this.lastHealthCheck?.status === "healthy";
  }
}

// Singleton instance
let monitorInstance: PuppeteerHealthMonitor | null = null;

/**
 * Get the global health monitor instance
 */
export function getHealthMonitor(): PuppeteerHealthMonitor {
  if (!monitorInstance) {
    monitorInstance = new PuppeteerHealthMonitor();
  }
  return monitorInstance;
}

/**
 * Start health monitoring
 */
export function startHealthMonitoring(config?: Partial<HealthCheckConfig>): void {
  if (config) {
    // Create new instance with custom config
    monitorInstance = new PuppeteerHealthMonitor(config);
  } else {
    getHealthMonitor();
  }
  monitorInstance!.start();
}

/**
 * Stop health monitoring
 */
export function stopHealthMonitoring(): void {
  if (monitorInstance) {
    monitorInstance.stop();
  }
}

/**
 * Get current health status
 */
export function getCurrentHealth(): HealthCheckResult | null {
  const monitor = getHealthMonitor();
  return monitor.getCurrentHealth();
}

/**
 * Check if PDF generation is currently available
 */
export function isPdfGenerationAvailable(): boolean {
  const monitor = getHealthMonitor();
  return monitor.isHealthy();
}
