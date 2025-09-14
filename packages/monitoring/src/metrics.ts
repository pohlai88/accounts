/**
 * @aibos/monitoring - Metrics Collection
 *
 * Prometheus-style metrics collection and aggregation
 */

import { register, collectDefaultMetrics, Counter, Histogram, Gauge, Summary } from "prom-client";
import { CacheService } from "@aibos/cache";

export interface MetricConfig {
  name: string;
  help: string;
  labelNames?: string[];
  buckets?: number[];
  percentiles?: number[];
}

export interface PerformanceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per second
  };
  responseTime: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
  };
  errors: {
    total: number;
    rate: number; // errors per second
    byType: Record<string, number>;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
  system: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
    };
    uptime: number;
  };
}

export class MetricsCollector {
  private cache: CacheService;
  private counters: Map<string, Counter> = new Map();
  private histograms: Map<string, Histogram> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private summaries: Map<string, Summary> = new Map();

  constructor(cache: CacheService) {
    this.cache = cache;
    this.initializeDefaultMetrics();
    this.initializeCustomMetrics();
  }

  private initializeDefaultMetrics(): void {
    // Collect default Node.js metrics
    collectDefaultMetrics({
      register,
      prefix: "aibos_",
    });
  }

  private initializeCustomMetrics(): void {
    // Request metrics
    this.createCounter("http_requests_total", "Total number of HTTP requests", [
      "method",
      "route",
      "status_code",
    ]);
    this.createCounter("http_errors_total", "Total number of HTTP errors", ["error_type", "route"]);

    // Response time metrics
    this.createHistogram(
      "http_request_duration_seconds",
      "HTTP request duration in seconds",
      ["method", "route"],
      [0.1, 0.5, 1, 2, 5, 10],
    );

    // Cache metrics
    this.createCounter("cache_operations_total", "Total number of cache operations", [
      "operation",
      "result",
    ]);
    this.createGauge("cache_hit_rate", "Cache hit rate percentage");

    // Business metrics
    this.createCounter("invoices_created_total", "Total number of invoices created", ["tenant_id"]);
    this.createCounter("invoices_processed_total", "Total number of invoices processed", [
      "tenant_id",
      "status",
    ]);
    this.createCounter("attachments_uploaded_total", "Total number of attachments uploaded", [
      "tenant_id",
      "type",
    ]);

    // System metrics
    this.createGauge("active_connections", "Number of active connections");
    this.createGauge("database_connections", "Number of database connections");
    this.createGauge("redis_connections", "Number of Redis connections");
  }

  private createCounter(name: string, help: string, labelNames: string[] = []): Counter {
    const counter = new Counter({
      name: `aibos_${name}`,
      help,
      labelNames,
      registers: [register],
    });
    this.counters.set(name, counter);
    return counter;
  }

  private createHistogram(
    name: string,
    help: string,
    labelNames: string[] = [],
    buckets: number[] = [0.1, 0.5, 1, 2, 5, 10],
  ): Histogram {
    const histogram = new Histogram({
      name: `aibos_${name}`,
      help,
      labelNames,
      buckets,
      registers: [register],
    });
    this.histograms.set(name, histogram);
    return histogram;
  }

  private createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    const gauge = new Gauge({
      name: `aibos_${name}`,
      help,
      labelNames,
      registers: [register],
    });
    this.gauges.set(name, gauge);
    return gauge;
  }

  private createSummary(
    name: string,
    help: string,
    labelNames: string[] = [],
    percentiles: number[] = [0.5, 0.9, 0.95, 0.99],
  ): Summary {
    const summary = new Summary({
      name: `aibos_${name}`,
      help,
      labelNames,
      percentiles,
      registers: [register],
    });
    this.summaries.set(name, summary);
    return summary;
  }

  // Request tracking
  trackRequest(method: string, route: string, statusCode: number, duration: number): void {
    const counter = this.counters.get("http_requests_total");
    const histogram = this.histograms.get("http_request_duration_seconds");

    if (counter) {
      counter.inc({ method, route, status_code: statusCode.toString() });
    }

    if (histogram) {
      histogram.observe({ method, route }, duration / 1000);
    }

    // Track errors
    if (statusCode >= 400) {
      const errorCounter = this.counters.get("http_errors_total");
      if (errorCounter) {
        errorCounter.inc({ error_type: this.getErrorType(statusCode), route });
      }
    }
  }

  // Cache tracking
  trackCacheOperation(operation: string, result: "hit" | "miss" | "error"): void {
    const counter = this.counters.get("cache_operations_total");
    if (counter) {
      counter.inc({ operation, result });
    }
  }

  // Business metrics
  trackInvoiceCreated(tenantId: string): void {
    const counter = this.counters.get("invoices_created_total");
    if (counter) {
      counter.inc({ tenant_id: tenantId });
    }
  }

  trackInvoiceProcessed(tenantId: string, status: string): void {
    const counter = this.counters.get("invoices_processed_total");
    if (counter) {
      counter.inc({ tenant_id: tenantId, status });
    }
  }

  trackAttachmentUploaded(tenantId: string, type: string): void {
    const counter = this.counters.get("attachments_uploaded_total");
    if (counter) {
      counter.inc({ tenant_id: tenantId, type });
    }
  }

  // System metrics
  updateActiveConnections(count: number): void {
    const gauge = this.gauges.get("active_connections");
    if (gauge) {
      gauge.set(count);
    }
  }

  updateDatabaseConnections(count: number): void {
    const gauge = this.gauges.get("database_connections");
    if (gauge) {
      gauge.set(count);
    }
  }

  updateRedisConnections(count: number): void {
    const gauge = this.gauges.get("redis_connections");
    if (gauge) {
      gauge.set(count);
    }
  }

  updateCacheHitRate(hitRate: number): void {
    const gauge = this.gauges.get("cache_hit_rate");
    if (gauge) {
      gauge.set(hitRate);
    }
  }

  private getErrorType(statusCode: number): string {
    if (statusCode >= 500) return "server_error";
    if (statusCode >= 400) return "client_error";
    return "unknown";
  }

  // Get aggregated metrics
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const cacheStats = this.cache.getStats();
      const hitRate =
        cacheStats.hits + cacheStats.misses > 0
          ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100
          : 0;

      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal + memoryUsage.external;

      return {
        requests: {
          total: 0, // Would be calculated from counters
          successful: 0,
          failed: 0,
          rate: 0,
        },
        responseTime: {
          average: 0,
          p50: 0,
          p95: 0,
          p99: 0,
          max: 0,
        },
        errors: {
          total: 0,
          rate: 0,
          byType: {},
        },
        cache: {
          hits: cacheStats.hits,
          misses: cacheStats.misses,
          hitRate,
        },
        system: {
          memory: {
            used: memoryUsage.heapUsed,
            total: totalMemory,
            percentage: (memoryUsage.heapUsed / totalMemory) * 100,
          },
          cpu: {
            usage: 0, // Would need additional library for CPU usage
          },
          uptime: process.uptime(),
        },
      };
    } catch (error) {
      console.error("Error getting performance metrics:", error);
      throw error;
    }
  }

  // Get Prometheus metrics
  async getPrometheusMetrics(): Promise<string> {
    return register.metrics();
  }

  // Reset all metrics
  resetMetrics(): void {
    register.clear();
    this.initializeDefaultMetrics();
    this.initializeCustomMetrics();
  }

  // Get metrics as JSON
  async getMetricsAsJson(): Promise<any> {
    const metrics = await register.getMetricsAsJSON();
    return metrics;
  }
}

// Singleton metrics collector
let metricsCollector: MetricsCollector | null = null;

export function getMetricsCollector(cache?: CacheService): MetricsCollector {
  if (!metricsCollector) {
    if (!cache) {
      throw new Error("Cache service required for metrics collector");
    }
    metricsCollector = new MetricsCollector(cache);
  }
  return metricsCollector;
}
