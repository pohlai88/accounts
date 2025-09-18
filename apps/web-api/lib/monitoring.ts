// Comprehensive Monitoring System
// DoD: Complete monitoring setup with Axiom + custom monitoring
// SSOT: Use existing monitoring package from @aibos/monitoring
// Tech Stack: Axiom + custom monitoring

import { MetricsCollector, TracingManager, Logger } from "@aibos/monitoring";
import { getCacheService } from "@aibos/cache";
import { EventEmitter } from "events";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client for monitoring data storage
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Monitoring configuration
interface MonitoringConfig {
    axiom: {
        dataset: string;
        token: string;
        orgId: string;
    };
    metrics: {
        sampleRate: number;
        retentionPeriod: number;
        enableRealTime: boolean;
    };
    tracing: {
        sampleRate: number;
        maxTracesPerSecond: number;
        retentionPeriod: number;
    };
    logging: {
        level: string;
        enableConsole: boolean;
        enableFile: boolean;
        enableStructuredLogging: boolean;
    };
    alerts: {
        enableSlack: boolean;
        enableEmail: boolean;
        enableWebhook: boolean;
    };
}

// Default configuration
const defaultConfig: MonitoringConfig = {
    axiom: {
        dataset: process.env.AXIOM_DATASET || "ai-bos-monitoring",
        token: process.env.AXIOM_TOKEN || "",
        orgId: process.env.AXIOM_ORG_ID || "",
    },
    metrics: {
        sampleRate: 0.1, // 10% sampling
        retentionPeriod: 30, // 30 days
        enableRealTime: true,
    },
    tracing: {
        sampleRate: 0.05, // 5% sampling
        maxTracesPerSecond: 1000,
        retentionPeriod: 7, // 7 days
    },
    logging: {
        level: process.env.LOG_LEVEL || "info",
        enableConsole: true,
        enableFile: true,
        enableStructuredLogging: true,
    },
    alerts: {
        enableSlack: !!process.env.SLACK_WEBHOOK_URL,
        enableEmail: !!process.env.ALERT_EMAIL,
        enableWebhook: !!process.env.ALERT_WEBHOOK_URL,
    },
};

// Metric types
export interface MetricData {
    name: string;
    value: number;
    unit: string;
    tags: Record<string, string>;
    timestamp: Date;
    tenantId?: string;
    userId?: string;
}

export interface TraceData {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    tags: Record<string, string>;
    logs: Array<{
        timestamp: Date;
        level: string;
        message: string;
        fields: Record<string, any>;
    }>;
    tenantId?: string;
    userId?: string;
}

export interface LogData {
    level: string;
    message: string;
    timestamp: Date;
    context?: Record<string, any>;
    error?: Error;
    tenantId?: string;
    userId?: string;
    requestId?: string;
}

// Alert types
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: "gt" | "lt" | "eq" | "gte" | "lte";
    threshold: number;
    duration: number; // seconds
    severity: "low" | "medium" | "high" | "critical";
    enabled: boolean;
    channels: string[];
    tenantId?: string;
}

export interface Alert {
    id: string;
    ruleId: string;
    metric: string;
    value: number;
    threshold: number;
    severity: string;
    status: "firing" | "resolved";
    triggeredAt: Date;
    resolvedAt?: Date;
    tenantId?: string;
    message: string;
}

// Comprehensive Monitoring System
export class ComprehensiveMonitoringSystem extends EventEmitter {
    private config: MonitoringConfig;
    private metricsCollector: MetricsCollector | null = null;
    private tracingManager: TracingManager | null = null;
    private logger: Logger | null = null;
    private isInitialized = false;
    private alertRules: Map<string, AlertRule> = new Map();
    private activeAlerts: Map<string, Alert> = new Map();
    private metricsBuffer: MetricData[] = [];
    private tracesBuffer: TraceData[] = [];
    private logsBuffer: LogData[] = [];
    private bufferSize = 1000;
    private flushInterval = 30000; // 30 seconds
    private flushTimer: NodeJS.Timeout | null = null;

    constructor(config: Partial<MonitoringConfig> = {}) {
        super();
        this.config = { ...defaultConfig, ...config };
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Initialize cache service
            const cache = getCacheService();

            // Initialize Metrics Collector
            this.metricsCollector = new MetricsCollector(cache);

            // Initialize Tracing Manager
            this.tracingManager = new TracingManager({
                sampleRate: this.config.tracing.sampleRate,
                maxTracesPerSecond: this.config.tracing.maxTracesPerSecond,
                retentionPeriod: this.config.tracing.retentionPeriod,
                enableB3Headers: true,
                enableW3CTraceContext: true,
            });

            // Initialize Logger
            this.logger = new Logger({
                level: this.config.logging.level as "error" | "debug" | "info" | "warn" | "fatal",
                enableConsole: this.config.logging.enableConsole,
                enableFile: this.config.logging.enableFile,
                enableStructuredLogging: this.config.logging.enableStructuredLogging,
                enableCorrelation: true,
                enableSampling: true,
                sampleRate: 0.1,
                logDirectory: "./logs",
                maxFileSize: 10 * 1024 * 1024, // 10MB
                maxFiles: 5,
                enableRotation: true,
                enableCompression: true,
            });

            // Set up monitoring handlers
            this.setupMonitoringHandlers();

            // Start buffer flushing
            this.startBufferFlushing();

            // Load alert rules
            await this.loadAlertRules();

            this.isInitialized = true;
            this.logger?.info("Comprehensive monitoring system initialized", {
                config: {
                    metrics: this.config.metrics,
                    tracing: this.config.tracing,
                    logging: this.config.logging,
                },
            });

            
        } catch (error) {
            console.error("Failed to initialize comprehensive monitoring system:", error);
            throw error;
        }
    }

    private setupMonitoringHandlers(): void {
        if (!this.metricsCollector || !this.tracingManager || !this.logger) {
            return;
        }

        // Set up error handling
        process.on("uncaughtException", (error) => {
            this.logger!.error("Uncaught Exception", error);
            this.recordMetric("system.errors.uncaught_exception", 1, "count", {
                error: error.message,
                stack: error.stack || "No stack trace available",
            });
        });

        process.on("unhandledRejection", (reason, promise) => {
            this.logger!.error("Unhandled Rejection", new Error(String(reason)));
            this.recordMetric("system.errors.unhandled_rejection", 1, "count", {
                reason: String(reason),
            });
        });

        // Set up performance monitoring
        this.setupPerformanceMonitoring();

        // Set up health checks
        this.setupHealthChecks();
    }

    private setupPerformanceMonitoring(): void {
        // Monitor memory usage
        setInterval(() => {
            const memUsage = process.memoryUsage();
            this.recordMetric("system.memory.rss", memUsage.rss, "bytes");
            this.recordMetric("system.memory.heap_used", memUsage.heapUsed, "bytes");
            this.recordMetric("system.memory.heap_total", memUsage.heapTotal, "bytes");
            this.recordMetric("system.memory.external", memUsage.external, "bytes");
        }, 30000); // Every 30 seconds

        // Monitor CPU usage
        setInterval(() => {
            const cpuUsage = process.cpuUsage();
            this.recordMetric("system.cpu.user", cpuUsage.user, "microseconds");
            this.recordMetric("system.cpu.system", cpuUsage.system, "microseconds");
        }, 30000); // Every 30 seconds

        // Monitor event loop lag
        setInterval(() => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
                this.recordMetric("system.event_loop.lag", lag, "milliseconds");
            });
        }, 10000); // Every 10 seconds

        // Monitor garbage collection
        if ((process as any).gc) {
            const gcStats = (process as any).gc();
            if (gcStats) {
                setInterval(() => {
                    const stats = (process as any).gc();
                    if (stats) {
                        this.recordMetric("system.gc.heap_used", stats.heapUsed, "bytes");
                        this.recordMetric("system.gc.heap_total", stats.heapTotal, "bytes");
                    }
                }, 60000); // Every minute
            }
        }
    }

    private setupHealthChecks(): void {
        // Database health check
        setInterval(async () => {
            try {
                const start = Date.now();
                await supabase.from("tenants").select("id").limit(1);
                const duration = Date.now() - start;
                this.recordMetric("health.database.response_time", duration, "milliseconds");
                this.recordMetric("health.database.status", 1, "status");
            } catch (error) {
                this.recordMetric("health.database.status", 0, "status");
                this.logger?.error("Database health check failed", error instanceof Error ? error : new Error(String(error)));
            }
        }, 60000); // Every minute

        // Cache health check
        setInterval(async () => {
            try {
                const cache = getCacheService();
                const start = Date.now();
                await cache.set("health_check", "ok", { ttl: 10 });
                await cache.get("health_check");
                const duration = Date.now() - start;
                this.recordMetric("health.cache.response_time", duration, "milliseconds");
                this.recordMetric("health.cache.status", 1, "status");
            } catch (error) {
                this.recordMetric("health.cache.status", 0, "status");
                this.logger?.error("Cache health check failed", error instanceof Error ? error : new Error(String(error)));
            }
        }, 60000); // Every minute
    }

    private startBufferFlushing(): void {
        this.flushTimer = setInterval(() => {
            this.flushBuffers();
        }, this.flushInterval);
    }

    private async flushBuffers(): Promise<void> {
        if (this.metricsBuffer.length > 0) {
            await this.flushMetrics();
        }
        if (this.tracesBuffer.length > 0) {
            await this.flushTraces();
        }
        if (this.logsBuffer.length > 0) {
            await this.flushLogs();
        }
    }

    private async flushMetrics(): Promise<void> {
        if (this.metricsBuffer.length === 0) return;

        const metrics = [...this.metricsBuffer];
        this.metricsBuffer = [];

        try {
            // Send to Axiom
            if (this.config.axiom.token) {
                await this.sendToAxiom("metrics", metrics);
            }

            // Store in database
            await this.storeMetricsInDatabase(metrics);

            // Check alert rules
            await this.checkAlertRules(metrics);
        } catch (error) {
            this.logger?.error("Failed to flush metrics", error instanceof Error ? error : new Error(String(error)));
            // Re-add metrics to buffer on failure
            this.metricsBuffer.unshift(...metrics);
        }
    }

    private async flushTraces(): Promise<void> {
        if (this.tracesBuffer.length === 0) return;

        const traces = [...this.tracesBuffer];
        this.tracesBuffer = [];

        try {
            // Send to Axiom
            if (this.config.axiom.token) {
                await this.sendToAxiom("traces", traces);
            }

            // Store in database
            await this.storeTracesInDatabase(traces);
        } catch (error) {
            this.logger?.error("Failed to flush traces", error instanceof Error ? error : new Error(String(error)));
            // Re-add traces to buffer on failure
            this.tracesBuffer.unshift(...traces);
        }
    }

    private async flushLogs(): Promise<void> {
        if (this.logsBuffer.length === 0) return;

        const logs = [...this.logsBuffer];
        this.logsBuffer = [];

        try {
            // Send to Axiom
            if (this.config.axiom.token) {
                await this.sendToAxiom("logs", logs);
            }

            // Store in database
            await this.storeLogsInDatabase(logs);
        } catch (error) {
            this.logger?.error("Failed to flush logs", error instanceof Error ? error : new Error(String(error)));
            // Re-add logs to buffer on failure
            this.logsBuffer.unshift(...logs);
        }
    }

    private async sendToAxiom(type: string, data: any[]): Promise<void> {
        if (!this.config.axiom.token) return;

        try {
            const response = await fetch(`https://api.axiom.co/v1/datasets/${this.config.axiom.dataset}/ingest`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.config.axiom.token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error(`Axiom API error: ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            this.logger?.error(`Failed to send ${type} to Axiom`, error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    private async storeMetricsInDatabase(metrics: MetricData[]): Promise<void> {
        try {
            const { error } = await supabase
                .from("monitoring_metrics")
                .insert(metrics.map(metric => ({
                    name: metric.name,
                    value: metric.value,
                    unit: metric.unit,
                    tags: metric.tags,
                    timestamp: metric.timestamp.toISOString(),
                    tenant_id: metric.tenantId,
                    user_id: metric.userId,
                })));

            if (error) {
                throw error;
            }
        } catch (error) {
            this.logger?.error("Failed to store metrics in database", error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    private async storeTracesInDatabase(traces: TraceData[]): Promise<void> {
        try {
            const { error } = await supabase
                .from("monitoring_traces")
                .insert(traces.map(trace => ({
                    trace_id: trace.traceId,
                    span_id: trace.spanId,
                    parent_span_id: trace.parentSpanId,
                    operation_name: trace.operationName,
                    start_time: trace.startTime.toISOString(),
                    end_time: trace.endTime.toISOString(),
                    duration: trace.duration,
                    tags: trace.tags,
                    logs: trace.logs,
                    tenant_id: trace.tenantId,
                    user_id: trace.userId,
                })));

            if (error) {
                throw error;
            }
        } catch (error) {
            this.logger?.error("Failed to store traces in database", error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    private async storeLogsInDatabase(logs: LogData[]): Promise<void> {
        try {
            const { error } = await supabase
                .from("monitoring_logs")
                .insert(logs.map(log => ({
                    level: log.level,
                    message: log.message,
                    timestamp: log.timestamp.toISOString(),
                    context: log.context,
                    error: log.error ? {
                        message: log.error.message,
                        stack: log.error.stack,
                        name: log.error.name,
                    } : null,
                    tenant_id: log.tenantId,
                    user_id: log.userId,
                    request_id: log.requestId,
                })));

            if (error) {
                throw error;
            }
        } catch (error) {
            this.logger?.error("Failed to store logs in database", error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    // Public API methods
    recordMetric(
        name: string,
        value: number,
        unit: string,
        tags: Record<string, string> = {},
        tenantId?: string,
        userId?: string,
    ): void {
        if (!this.isInitialized) return;

        const metric: MetricData = {
            name,
            value,
            unit,
            tags,
            timestamp: new Date(),
            tenantId,
            userId,
        };

        this.metricsBuffer.push(metric);

        // Flush immediately if buffer is full
        if (this.metricsBuffer.length >= this.bufferSize) {
            this.flushMetrics();
        }
    }

    recordTrace(trace: TraceData): void {
        if (!this.isInitialized) return;

        this.tracesBuffer.push(trace);

        // Flush immediately if buffer is full
        if (this.tracesBuffer.length >= this.bufferSize) {
            this.flushTraces();
        }
    }

    recordLog(log: LogData): void {
        if (!this.isInitialized) return;

        this.logsBuffer.push(log);

        // Flush immediately if buffer is full
        if (this.logsBuffer.length >= this.bufferSize) {
            this.flushLogs();
        }
    }

    // API Request Monitoring
    recordAPIRequest(
        endpoint: string,
        method: string,
        statusCode: number,
        duration: number,
        tenantId: string,
        userId?: string,
    ): void {
        this.recordMetric("api.requests.total", 1, "count", {
            endpoint,
            method,
            status: statusCode.toString(),
        }, tenantId, userId);

        this.recordMetric("api.requests.duration", duration, "milliseconds", {
            endpoint,
            method,
            status: statusCode.toString(),
        }, tenantId, userId);

        if (statusCode >= 400) {
            this.recordMetric("api.errors.total", 1, "count", {
                endpoint,
                method,
                status: statusCode.toString(),
            }, tenantId, userId);
        }
    }

    // Database Monitoring
    recordDatabaseOperation(
        operation: string,
        table: string,
        duration: number,
        tenantId: string,
        success: boolean,
    ): void {
        this.recordMetric("database.operations.total", 1, "count", {
            operation,
            table,
            success: success.toString(),
        }, tenantId);

        this.recordMetric("database.operations.duration", duration, "milliseconds", {
            operation,
            table,
            success: success.toString(),
        }, tenantId);

        if (!success) {
            this.recordMetric("database.errors.total", 1, "count", {
                operation,
                table,
            }, tenantId);
        }
    }

    // Cache Monitoring
    recordCacheOperation(
        operation: "hit" | "miss" | "set" | "delete",
        key: string,
        tenantId: string,
        duration?: number,
    ): void {
        this.recordMetric("cache.operations.total", 1, "count", {
            operation,
        }, tenantId);

        if (duration !== undefined) {
            this.recordMetric("cache.operations.duration", duration, "milliseconds", {
                operation,
            }, tenantId);
        }

        if (operation === "hit") {
            this.recordMetric("cache.hits.total", 1, "count", {}, tenantId);
        } else if (operation === "miss") {
            this.recordMetric("cache.misses.total", 1, "count", {}, tenantId);
        }
    }

    // Security Events Monitoring
    recordSecurityEvent(
        eventType: string,
        severity: "low" | "medium" | "high" | "critical",
        tenantId: string,
        userId?: string,
        details?: Record<string, any>,
    ): void {
        this.recordMetric("security.events.total", 1, "count", {
            event_type: eventType,
            severity,
        }, tenantId, userId);

        this.logger?.warn("Security event detected", {
            eventType,
            severity,
            tenantId,
            userId,
            details,
        });

        // Trigger alert for critical security events
        if (severity === "critical") {
            this.triggerAlert("security.critical_event", {
                eventType,
                severity,
                tenantId,
                userId,
                details,
            });
        }
    }

    // Business Metrics
    recordBusinessMetric(
        metricName: string,
        value: number,
        unit: string,
        tenantId: string,
        tags: Record<string, string> = {},
    ): void {
        this.recordMetric(`business.${metricName}`, value, unit, tags, tenantId);
    }

    // Alert Management
    async loadAlertRules(): Promise<void> {
        try {
            const { data: rules, error } = await supabase
                .from("monitoring_alert_rules")
                .select("*")
                .eq("enabled", true);

            if (error) {
                throw error;
            }

            this.alertRules.clear();
            rules?.forEach(rule => {
                this.alertRules.set(rule.id, rule);
            });

            this.logger?.info(`Loaded ${rules?.length || 0} alert rules`);
        } catch (error) {
            this.logger?.error("Failed to load alert rules", error instanceof Error ? error : new Error(String(error)));
        }
    }

    async checkAlertRules(metrics: MetricData[]): Promise<void> {
        for (const metric of metrics) {
            for (const [ruleId, rule] of this.alertRules) {
                if (rule.metric === metric.name && this.evaluateCondition(metric.value, rule.condition, rule.threshold)) {
                    await this.triggerAlert(ruleId, {
                        metric: metric.name,
                        value: metric.value,
                        threshold: rule.threshold,
                        severity: rule.severity,
                        tenantId: metric.tenantId,
                    });
                }
            }
        }
    }

    private evaluateCondition(value: number, condition: string, threshold: number): boolean {
        switch (condition) {
            case "gt": return value > threshold;
            case "lt": return value < threshold;
            case "eq": return value === threshold;
            case "gte": return value >= threshold;
            case "lte": return value <= threshold;
            default: return false;
        }
    }

    async triggerAlert(ruleId: string, data: any): Promise<void> {
        const alertId = `${ruleId}_${Date.now()}`;
        const rule = this.alertRules.get(ruleId);

        if (!rule) return;

        const alert: Alert = {
            id: alertId,
            ruleId,
            metric: data.metric,
            value: data.value,
            threshold: data.threshold,
            severity: rule.severity,
            status: "firing",
            triggeredAt: new Date(),
            tenantId: data.tenantId,
            message: `${rule.name}: ${data.metric} is ${data.value} (threshold: ${data.threshold})`,
        };

        this.activeAlerts.set(alertId, alert);

        // Send alert notifications
        await this.sendAlertNotifications(alert, rule);

        this.logger?.warn("Alert triggered", {
            alertId,
            ruleId,
            metric: data.metric,
            value: data.value,
            threshold: data.threshold,
            severity: rule.severity,
        });
    }

    private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
        const message = `🚨 Alert: ${rule.name}\n${alert.message}\nSeverity: ${alert.severity}\nTime: ${alert.triggeredAt.toISOString()}`;

        // Send to Slack
        if (this.config.alerts.enableSlack && rule.channels.includes("slack")) {
            await this.sendSlackAlert(message, alert);
        }

        // Send to Email
        if (this.config.alerts.enableEmail && rule.channels.includes("email")) {
            await this.sendEmailAlert(message, alert);
        }

        // Send to Webhook
        if (this.config.alerts.enableWebhook && rule.channels.includes("webhook")) {
            await this.sendWebhookAlert(message, alert);
        }
    }

    private async sendSlackAlert(message: string, alert: Alert): Promise<void> {
        try {
            const webhookUrl = process.env.SLACK_WEBHOOK_URL;
            if (!webhookUrl) return;

            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: message,
                    attachments: [{
                        color: alert.severity === "critical" ? "danger" : "warning",
                        fields: [{
                            title: "Alert Details",
                            value: `Metric: ${alert.metric}\nValue: ${alert.value}\nThreshold: ${alert.threshold}`,
                            short: false,
                        }],
                    }],
                }),
            });
        } catch (error) {
            this.logger?.error("Failed to send Slack alert", error instanceof Error ? error : new Error(String(error)));
        }
    }

    private async sendEmailAlert(message: string, alert: Alert): Promise<void> {
        // Implementation would depend on email service (SendGrid, SES, etc.)
        this.logger?.info("Email alert would be sent", { message, alert });
    }

    private async sendWebhookAlert(message: string, alert: Alert): Promise<void> {
        try {
            const webhookUrl = process.env.ALERT_WEBHOOK_URL;
            if (!webhookUrl) return;

            await fetch(webhookUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    alert,
                    timestamp: new Date().toISOString(),
                }),
            });
        } catch (error) {
            this.logger?.error("Failed to send webhook alert", error instanceof Error ? error : new Error(String(error)));
        }
    }

    // Health Check
    getHealthStatus(): any {
        if (!this.isInitialized) {
            return {
                status: "unhealthy",
                message: "Monitoring system not initialized",
                components: {
                    metrics: "not_initialized",
                    tracing: "not_initialized",
                    logging: "not_initialized",
                },
            };
        }

        const metricsHealth = this.metricsCollector ? { status: "healthy" } : { status: "unknown" };
        const tracingHealth = this.tracingManager ? { status: "healthy" } : { status: "unknown" };
        const loggingHealth = this.logger ? { status: "healthy" } : { status: "unknown" };

        const overallStatus = [metricsHealth.status, tracingHealth.status, loggingHealth.status].every(
            status => status === "healthy",
        )
            ? "healthy"
            : "degraded";

        return {
            status: overallStatus,
            message: "Monitoring system operational",
            components: {
                metrics: metricsHealth.status,
                tracing: tracingHealth.status,
                logging: loggingHealth.status,
            },
            buffers: {
                metrics: this.metricsBuffer.length,
                traces: this.tracesBuffer.length,
                logs: this.logsBuffer.length,
            },
            alerts: {
                active: this.activeAlerts.size,
                rules: this.alertRules.size,
            },
        };
    }

    // Cleanup
    async shutdown(): Promise<void> {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        // Flush remaining buffers
        await this.flushBuffers();

        this.isInitialized = false;
        this.logger?.info("Monitoring system shutdown complete");
    }
}

// Export singleton instance
export const monitoring = new ComprehensiveMonitoringSystem();
