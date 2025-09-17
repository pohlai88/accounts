// Production Monitoring Integration
import { monitoring, MonitoringIntegration } from "@aibos/monitoring";
import { EventEmitter } from "events";

export class ProductionMonitoringIntegration extends EventEmitter {
  private isInitialized = false;

  async initialize(config?: unknown) {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize centralized monitoring system
      await monitoring.initialize();

      this.isInitialized = true;
      monitoring.info("Production monitoring system initialized", { component: "monitoring-integration" });
    } catch (error) {
      monitoring.error("Failed to initialize monitoring system", error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  // Monitoring handlers are now handled by the centralized monitoring system
  // This method is kept for backward compatibility but delegates to the centralized system
  private setupMonitoringHandlers() {
    // All monitoring is now handled by the centralized MonitoringIntegration
    // Global error handlers, performance monitoring, and health checks are automatically set up
  }

  private setupPerformanceMonitoring() {
    // Performance monitoring is now handled by the centralized MonitoringIntegration
    // Memory usage, CPU usage, and other system metrics are automatically tracked
  }

  // ============================================================================
  // PUBLIC API METHODS (Delegate to centralized monitoring)
  // ============================================================================

  public recordMetric(
    name: string,
    value: number,
    unit: string,
    tags: Record<string, string> = {},
    context: Record<string, string> = {}
  ): void {
    monitoring.recordMetric(name, value, unit, tags, context);
  }

  public recordAPIMetric(
    endpoint: string,
    method: string,
    duration: number,
    statusCode: number,
    responseSize: number,
    context: Record<string, string> = {}
  ): void {
    monitoring.recordAPIMetric(endpoint, method, duration, statusCode, responseSize, context);
  }

  public log(
    level: "debug" | "info" | "warn" | "error" | "fatal",
    message: string,
    metadata: Record<string, unknown> = {},
    context: Record<string, string> = {}
  ): void {
    monitoring.log(level, message, metadata, context);
  }

  public trackError(
    error: Error | string,
    context: Record<string, string> = {},
    level: "error" | "warning" | "info" = "error",
    tags: string[] = []
  ): string {
    return monitoring.trackError(error, context, level, tags);
  }

  public trackAPIError(
    error: Error | string,
    method: string,
    path: string,
    statusCode: number,
    context: Record<string, string> = {}
  ): string {
    return monitoring.trackAPIError(error, method, path, statusCode, context);
  }

  public startTrace(
    operation: string,
    context: Record<string, string> = {}
  ): string {
    return monitoring.startTrace(operation, context);
  }

  public endTrace(traceId: string, success: boolean = true, metadata: Record<string, unknown> = {}): void {
    monitoring.endTrace(traceId, success, metadata);
  }

  public async checkHealth(): Promise<Record<string, unknown>> {
    return await monitoring.checkHealth();
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  public getMetricsCollector() {
    return monitoring.getMetricsCollector();
  }

  public getLogger() {
    return monitoring.getLogger();
  }

  public getTracingManager() {
    return monitoring.getTracingManager();
  }

  public getHealthChecker() {
    return monitoring.getHealthChecker();
  }

  public isReady(): boolean {
    return this.isInitialized && monitoring.isReady();
  }
}

// Export singleton instance for backward compatibility
export const productionMonitoring = new ProductionMonitoringIntegration();

// Export monitoring instance for direct access
export { monitoring } from "@aibos/monitoring";
