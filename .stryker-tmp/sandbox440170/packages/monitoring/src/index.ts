/**
 * @aibos/monitoring - Monitoring Package Exports
 *
 * Performance monitoring, metrics collection, and health checking
 * Namespaced to avoid conflicts with @aibos/utils monitoring
 */
// @ts-nocheck


// ============================================================================
// METRICS COLLECTION
// ============================================================================

export * from "./metrics";

// Re-export commonly used types and functions
export {
  MetricsCollector,
  getMetricsCollector,
  type MetricConfig,
  type PerformanceMetrics,
} from "./metrics";

// Export the metrics-collector with recordMetric method
export { MetricsCollector as MetricsCollectorWithRecordMetric } from "./metrics-collector";

// ============================================================================
// COMPATIBILITY LAYER (DEPRECATED)
// ============================================================================

// @deprecated Use MetricsCollector from ./metrics instead
export { MetricsCollector as CompatMetricsCollector } from "./compat/MetricsCollector";

// ============================================================================
// MONITORING FACADE
// ============================================================================

export * from "./facade";

// ============================================================================
// HEALTH CHECKING
// ============================================================================

export * from "./health";

export { HealthChecker, getHealthChecker, type HealthCheck, type SystemHealth } from "./health";

// ============================================================================
// LOGGING (NAMESPACED)
// ============================================================================

// Monitoring-specific logger (namespaced to avoid conflicts)
export * from "./logger";

// ============================================================================
// TRACING & OBSERVABILITY
// ============================================================================

export * from "./tracing";
