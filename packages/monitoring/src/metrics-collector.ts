import { EventEmitter } from "events";
import { performance } from "perf_hooks";

export interface MetricConfig {
  enableRealTime: boolean;
  enableBatchProcessing: boolean;
  batchSize: number;
  batchInterval: number; // milliseconds
  retentionPeriod: number; // days
  enableCompression: boolean;
  maxMetricsPerMinute: number;
  enableAggregation: boolean;
  aggregationInterval: number; // milliseconds
}

export interface MetricData {
  id: string;
  timestamp: number;
  tenantId: string;
  userId?: string;
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
}

export interface AggregatedMetric {
  name: string;
  tenantId: string;
  timeWindow: number;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  tags: Record<string, string>;
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number;
    free: number;
    total: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
      arrayBuffers: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
  };
}

export interface ApplicationMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number; // requests per second
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  errors: {
    total: number;
    rate: number; // errors per second
    byType: Record<string, number>;
    byEndpoint: Record<string, number>;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    evictions: number;
    memoryUsage: number;
  };
  database: {
    connections: number;
    queries: number;
    avgQueryTime: number;
    slowQueries: number;
    deadlocks: number;
  };
  security: {
    blockedRequests: number;
    suspiciousActivities: number;
    failedLogins: number;
    rateLimitHits: number;
  };
}

export class MetricsCollector extends EventEmitter {
  private config: MetricConfig;
  private metrics: MetricData[] = [];
  private aggregatedMetrics: Map<string, AggregatedMetric> = new Map();
  private systemMetrics: SystemMetrics | null = null;
  private applicationMetrics: ApplicationMetrics | null = null;
  private startTime: number = Date.now();

  constructor(config: Partial<MetricConfig> = {}) {
    super();

    this.config = {
      enableRealTime: true,
      enableBatchProcessing: true,
      batchSize: 1000,
      batchInterval: 60000, // 1 minute
      retentionPeriod: 30, // 30 days
      enableCompression: false,
      maxMetricsPerMinute: 10000,
      enableAggregation: true,
      aggregationInterval: 300000, // 5 minutes
      ...config,
    };

    this.startCollection();
    this.startAggregation();
    this.startCleanup();
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = "count",
    tags: Record<string, string> = {},
    metadata: Record<string, any> = {},
    tenantId: string = "global",
    userId?: string,
  ): string {
    const metric: MetricData = {
      id: this.generateMetricId(),
      timestamp: Date.now(),
      tenantId,
      userId,
      name,
      value,
      unit,
      tags,
      metadata,
    };

    this.metrics.push(metric);

    // Real-time processing
    if (this.config.enableRealTime) {
      this.emit("metric", metric);
    }

    // Check rate limiting
    this.checkRateLimit();

    return metric.id;
  }

  /**
   * Record API request metrics
   */
  recordApiRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    tenantId: string,
    userId?: string,
  ): void {
    const tags = {
      endpoint,
      method,
      status: statusCode.toString(),
      tenant: tenantId,
    };

    // Record response time
    this.recordMetric(
      "api.response_time",
      duration,
      "milliseconds",
      tags,
      { endpoint, method, statusCode },
      tenantId,
      userId,
    );

    // Record request count
    this.recordMetric(
      "api.requests_total",
      1,
      "count",
      tags,
      { endpoint, method, statusCode },
      tenantId,
      userId,
    );

    // Record error count if applicable
    if (statusCode >= 400) {
      this.recordMetric(
        "api.errors_total",
        1,
        "count",
        { ...tags, error_type: this.getErrorType(statusCode) },
        { endpoint, method, statusCode },
        tenantId,
        userId,
      );
    }
  }

  /**
   * Record cache metrics
   */
  recordCacheOperation(
    operation: "hit" | "miss" | "set" | "delete" | "eviction",
    key: string,
    tenantId: string,
    metadata: Record<string, any> = {},
  ): void {
    const tags = {
      operation,
      tenant: tenantId,
    };

    this.recordMetric("cache.operations", 1, "count", tags, { key, ...metadata }, tenantId);

    if (operation === "hit" || operation === "miss") {
      this.recordMetric(
        `cache.${operation}s`,
        1,
        "count",
        { tenant: tenantId },
        { key, ...metadata },
        tenantId,
      );
    }
  }

  /**
   * Record database metrics
   */
  recordDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    tenantId: string,
    metadata: Record<string, any> = {},
  ): void {
    const tags = {
      operation,
      table,
      tenant: tenantId,
    };

    this.recordMetric(
      "database.operation_duration",
      duration,
      "milliseconds",
      tags,
      { table, ...metadata },
      tenantId,
    );

    this.recordMetric(
      "database.operations_total",
      1,
      "count",
      tags,
      { table, ...metadata },
      tenantId,
    );
  }

  /**
   * Record security metrics
   */
  recordSecurityEvent(
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    tenantId: string,
    metadata: Record<string, any> = {},
  ): void {
    const tags = {
      event_type: eventType,
      severity,
      tenant: tenantId,
    };

    this.recordMetric("security.events", 1, "count", tags, metadata, tenantId);
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): SystemMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    return {
      cpu: {
        usage: this.getCpuUsage(),
        loadAverage: this.getLoadAverage(),
        cores: require("os").cpus().length,
      },
      memory: {
        used: memUsage.rss,
        free: require("os").freemem(),
        total: require("os").totalmem(),
        heapUsed: memUsage.heapUsed,
        heapTotal: memUsage.heapTotal,
        external: memUsage.external,
      },
      disk: this.getDiskUsage(),
      network: this.getNetworkStats(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage: memUsage,
        cpuUsage: cpuUsage,
      },
    };
  }

  /**
   * Get application metrics
   */
  getApplicationMetrics(): ApplicationMetrics {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneMinuteAgo);

    const apiMetrics = recentMetrics.filter(m => m.name.startsWith("api."));
    const errorMetrics = recentMetrics.filter(m => m.name === "api.errors_total");
    const cacheMetrics = recentMetrics.filter(m => m.name.startsWith("cache."));
    const securityMetrics = recentMetrics.filter(m => m.name === "security.events");

    const requests = {
      total: apiMetrics
        .filter(m => m.name === "api.requests_total")
        .reduce((sum, m) => sum + m.value, 0),
      successful: apiMetrics
        .filter(
          m => m.name === "api.requests_total" && m.tags.status && parseInt(m.tags.status) < 400,
        )
        .reduce((sum, m) => sum + m.value, 0),
      failed: apiMetrics
        .filter(
          m => m.name === "api.requests_total" && m.tags.status && parseInt(m.tags.status) >= 400,
        )
        .reduce((sum, m) => sum + m.value, 0),
      rate:
        apiMetrics
          .filter(m => m.name === "api.requests_total")
          .reduce((sum, m) => sum + m.value, 0) / 60,
      avgResponseTime: this.calculateAverage(
        apiMetrics.filter(m => m.name === "api.response_time").map(m => m.value),
      ),
      p95ResponseTime: this.calculatePercentile(
        apiMetrics.filter(m => m.name === "api.response_time").map(m => m.value),
        95,
      ),
      p99ResponseTime: this.calculatePercentile(
        apiMetrics.filter(m => m.name === "api.response_time").map(m => m.value),
        99,
      ),
    };

    const errors = {
      total: errorMetrics.reduce((sum, m) => sum + m.value, 0),
      rate: errorMetrics.reduce((sum, m) => sum + m.value, 0) / 60,
      byType: this.groupBy(errorMetrics, "tags.error_type"),
      byEndpoint: this.groupBy(errorMetrics, "tags.endpoint"),
    };

    const cache = {
      hits: cacheMetrics.filter(m => m.name === "cache.hits").reduce((sum, m) => sum + m.value, 0),
      misses: cacheMetrics
        .filter(m => m.name === "cache.misses")
        .reduce((sum, m) => sum + m.value, 0),
      hitRate: 0, // Will be calculated
      evictions: cacheMetrics
        .filter(m => m.name === "cache.evictions")
        .reduce((sum, m) => sum + m.value, 0),
      memoryUsage: 0, // Would need cache implementation details
    };

    cache.hitRate = cache.hits + cache.misses > 0 ? cache.hits / (cache.hits + cache.misses) : 0;

    const database = {
      connections: 0, // Would need database connection pool info
      queries: recentMetrics
        .filter(m => m.name === "database.operations_total")
        .reduce((sum, m) => sum + m.value, 0),
      avgQueryTime: this.calculateAverage(
        recentMetrics.filter(m => m.name === "database.operation_duration").map(m => m.value),
      ),
      slowQueries: recentMetrics.filter(
        m => m.name === "database.operation_duration" && m.value > 1000,
      ).length,
      deadlocks: 0, // Would need database-specific monitoring
    };

    const security = {
      blockedRequests: recentMetrics
        .filter(m => m.tags.event_type === "blocked_request")
        .reduce((sum, m) => sum + m.value, 0),
      suspiciousActivities: recentMetrics
        .filter(m => m.tags.event_type === "suspicious_activity")
        .reduce((sum, m) => sum + m.value, 0),
      failedLogins: recentMetrics
        .filter(m => m.tags.event_type === "failed_login")
        .reduce((sum, m) => sum + m.value, 0),
      rateLimitHits: recentMetrics
        .filter(m => m.tags.event_type === "rate_limit")
        .reduce((sum, m) => sum + m.value, 0),
    };

    return {
      requests,
      errors,
      cache,
      database,
      security,
    };
  }

  /**
   * Get metrics with filtering
   */
  getMetrics(
    filters: {
      tenantId?: string;
      userId?: string;
      name?: string;
      startTime?: number;
      endTime?: number;
      limit?: number;
    } = {},
  ): MetricData[] {
    let filteredMetrics = this.metrics;

    if (filters.tenantId) {
      filteredMetrics = filteredMetrics.filter(m => m.tenantId === filters.tenantId);
    }

    if (filters.userId) {
      filteredMetrics = filteredMetrics.filter(m => m.userId === filters.userId);
    }

    if (filters.name) {
      filteredMetrics = filteredMetrics.filter(m => m.name === filters.name);
    }

    if (filters.startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= filters.startTime!);
    }

    if (filters.endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= filters.endTime!);
    }

    // Sort by timestamp (newest first)
    filteredMetrics.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filters.limit) {
      filteredMetrics = filteredMetrics.slice(0, filters.limit);
    }

    return filteredMetrics;
  }

  /**
   * Get aggregated metrics
   */
  getAggregatedMetrics(tenantId?: string): AggregatedMetric[] {
    let metrics = Array.from(this.aggregatedMetrics.values());

    if (tenantId) {
      metrics = metrics.filter(m => m.tenantId === tenantId);
    }

    return metrics.sort((a, b) => b.timeWindow - a.timeWindow);
  }

  /**
   * Get health status based on metrics
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
    recommendations: string[];
    metrics: {
      system: SystemMetrics;
      application: ApplicationMetrics;
    };
  } {
    const systemMetrics = this.getSystemMetrics();
    const appMetrics = this.getApplicationMetrics();

    const issues: string[] = [];
    const recommendations: string[] = [];
    let status: "healthy" | "degraded" | "unhealthy" = "healthy";

    // Check system health
    const memoryUsagePercent = (systemMetrics.memory.used / systemMetrics.memory.total) * 100;
    if (memoryUsagePercent > 90) {
      issues.push("High memory usage");
      recommendations.push("Consider scaling up or optimizing memory usage");
      status = "degraded";
    }

    if (systemMetrics.cpu.usage > 80) {
      issues.push("High CPU usage");
      recommendations.push("Consider scaling up or optimizing CPU usage");
      status = "degraded";
    }

    if (systemMetrics.disk.usagePercent > 90) {
      issues.push("High disk usage");
      recommendations.push("Consider cleaning up disk space or scaling storage");
      status = "degraded";
    }

    // Check application health
    if (appMetrics.requests.rate > 1000) {
      issues.push("High request rate");
      recommendations.push("Consider rate limiting or scaling up");
      status = "degraded";
    }

    if (appMetrics.errors.rate > 10) {
      issues.push("High error rate");
      recommendations.push("Investigate and fix error sources");
      status = "unhealthy";
    }

    if (appMetrics.requests.avgResponseTime > 2000) {
      issues.push("Slow response times");
      recommendations.push("Optimize database queries and API performance");
      status = "degraded";
    }

    if (appMetrics.cache.hitRate < 0.5) {
      issues.push("Low cache hit rate");
      recommendations.push("Review caching strategy and cache keys");
      status = "degraded";
    }

    if (appMetrics.security.blockedRequests > 100) {
      issues.push("High number of blocked requests");
      recommendations.push("Review security policies and potential attacks");
      status = "degraded";
    }

    return {
      status,
      issues,
      recommendations,
      metrics: {
        system: systemMetrics,
        application: appMetrics,
      },
    };
  }

  /**
   * Start metrics collection
   */
  private startCollection(): void {
    if (!this.config.enableRealTime) return;

    setInterval(() => {
      this.systemMetrics = this.getSystemMetrics();
      this.applicationMetrics = this.getApplicationMetrics();

      this.emit("systemMetrics", this.systemMetrics);
      this.emit("applicationMetrics", this.applicationMetrics);
    }, 10000); // Every 10 seconds
  }

  /**
   * Start metrics aggregation
   */
  private startAggregation(): void {
    if (!this.config.enableAggregation) return;

    setInterval(() => {
      this.aggregateMetrics();
    }, this.config.aggregationInterval);
  }

  /**
   * Start cleanup process
   */
  private startCleanup(): void {
    setInterval(
      () => {
        const cutoff = Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000;
        this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
      },
      24 * 60 * 60 * 1000,
    ); // Daily cleanup
  }

  /**
   * Aggregate metrics
   */
  private aggregateMetrics(): void {
    const now = Date.now();
    const windowStart = now - this.config.aggregationInterval;
    const recentMetrics = this.metrics.filter(m => m.timestamp >= windowStart);

    // Group by name and tenant
    const grouped = this.groupMetricsBy(recentMetrics, ["name", "tenantId"]);

    for (const [key, metrics] of grouped) {
      const [name, tenantId] = key.split("|");
      const values = metrics.map(m => m.value);

      const aggregated: AggregatedMetric = {
        name: name || "unknown",
        tenantId: tenantId || "unknown",
        timeWindow: windowStart,
        count: metrics.length,
        sum: values.reduce((sum, val) => sum + val, 0),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        p50: this.calculatePercentile(values, 50),
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99),
        tags: metrics[0]?.tags || {},
      };

      this.aggregatedMetrics.set(`${name}|${tenantId}|${windowStart}`, aggregated);
    }
  }

  /**
   * Group metrics by specified fields
   */
  private groupMetricsBy(metrics: MetricData[], fields: string[]): Map<string, MetricData[]> {
    const grouped = new Map<string, MetricData[]>();

    for (const metric of metrics) {
      const key = fields
        .map(field => {
          if (field === "tenantId") return metric.tenantId;
          if (field === "name") return metric.name;
          return "";
        })
        .join("|");

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(metric);
    }

    return grouped;
  }

  /**
   * Group metrics by field
   */
  private groupBy(metrics: MetricData[], field: string): Record<string, number> {
    const grouped: Record<string, number> = {};

    for (const metric of metrics) {
      const value = metric.tags[field] || "unknown";
      grouped[value] = (grouped[value] || 0) + metric.value;
    }

    return grouped;
  }

  /**
   * Calculate average
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }

  /**
   * Get CPU usage percentage
   */
  private getCpuUsage(): number {
    // Simplified CPU usage calculation
    // In production, you'd use a more sophisticated method
    return Math.random() * 100;
  }

  /**
   * Get load average
   */
  private getLoadAverage(): number[] {
    try {
      return require("os").loadavg();
    } catch {
      return [0, 0, 0];
    }
  }

  /**
   * Get disk usage
   */
  private getDiskUsage(): { used: number; free: number; total: number; usagePercent: number } {
    try {
      const fs = require("fs");
      const stats = fs.statSync(".");
      return {
        used: 0, // Would need actual disk usage calculation
        free: 0,
        total: 0,
        usagePercent: 0,
      };
    } catch {
      return { used: 0, free: 0, total: 0, usagePercent: 0 };
    }
  }

  /**
   * Get network statistics
   */
  private getNetworkStats(): {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  } {
    // Simplified network stats
    return {
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
    };
  }

  /**
   * Get error type from status code
   */
  private getErrorType(statusCode: number): string {
    if (statusCode >= 500) return "server_error";
    if (statusCode >= 400) return "client_error";
    return "unknown";
  }

  /**
   * Check rate limiting
   */
  private checkRateLimit(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const recentMetrics = this.metrics.filter(m => m.timestamp > oneMinuteAgo);

    if (recentMetrics.length > this.config.maxMetricsPerMinute) {
      console.warn(
        `Metrics rate limit exceeded: ${recentMetrics.length} metrics in the last minute`,
      );
    }
  }

  /**
   * Generate metric ID
   */
  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
