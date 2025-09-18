/**
 * @aibos/logger - TypeScript Definitions
 *
 * SSOT TypeScript types for all logging functionality
 * These are the ONLY types that should be used for logging
 */

/**
 * SSOT: Log levels
 * These are the ONLY log levels allowed
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * SSOT: Log metadata
 * This defines the structure for all log metadata
 */
export interface LogMetadata {
    [key: string]: any;
}

/**
 * SSOT: Error information
 * This defines how errors are structured in logs
 */
export interface LogError {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
    cause?: LogError;
}

/**
 * SSOT: Performance metrics
 * This defines how performance data is structured
 */
export interface PerformanceMetrics {
    operation: string;
    duration: number;
    startTime?: number;
    endTime?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
}

/**
 * SSOT: Business metrics
 * This defines how business metrics are structured
 */
export interface BusinessMetrics {
    event: string;
    value: number;
    unit: string;
    timestamp?: number;
    tags?: Record<string, string>;
}

/**
 * SSOT: Security events
 * This defines how security events are structured
 */
export interface SecurityEvent {
    event: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    source?: string;
    target?: string;
    details?: Record<string, any>;
}

/**
 * SSOT: Request context
 * This defines the structure for request context
 */
export interface RequestContext {
    reqId: string;
    tenantId?: string;
    userId?: string;
    route?: string;
    traceId?: string;
    spanId?: string;
    correlationId?: string;
    userAgent?: string;
    ip?: string;
    method?: string;
    statusCode?: number;
    duration?: number;
}

/**
 * SSOT: Logger interface
 * This defines the ONLY logger interface allowed
 */
export interface Logger {
    trace(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    error(message: string, error?: Error, metadata?: LogMetadata): void;
    fatal(message: string, error?: Error, metadata?: LogMetadata): void;

    // Specialized logging methods
    metric(event: string, value: number, unit: string, metadata?: LogMetadata): void;
    performance(operation: string, duration: number, metadata?: LogMetadata): void;
    security(event: string, metadata?: LogMetadata): void;
}

/**
 * SSOT: Logger configuration
 * This defines how loggers are configured
 */
export interface LoggerConfig {
    service: string;
    version?: string;
    environment?: string;
    logLevel?: LogLevel;
    enableRedaction?: boolean;
    enableSampling?: boolean;
    sampleRate?: number;
    enableConsole?: boolean;
    enableFile?: boolean;
    enableRemote?: boolean;
}

/**
 * SSOT: Log entry
 * This defines the structure of a log entry
 */
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    service: string;
    version: string;
    environment: string;
    metadata?: LogMetadata;
    error?: LogError;
    performance?: PerformanceMetrics;
    business?: BusinessMetrics;
    security?: SecurityEvent;
    context?: RequestContext;
}

/**
 * SSOT: Log transport
 * This defines how logs are transported
 */
export interface LogTransport {
    write(entry: LogEntry): void;
    flush?(): Promise<void>;
    close?(): Promise<void>;
}

/**
 * SSOT: Log formatter
 * This defines how logs are formatted
 */
export interface LogFormatter {
    format(entry: LogEntry): string;
}

/**
 * SSOT: Log filter
 * This defines how logs are filtered
 */
export interface LogFilter {
    shouldLog(entry: LogEntry): boolean;
}

/**
 * SSOT: Log aggregator
 * This defines how logs are aggregated
 */
export interface LogAggregator {
    aggregate(entries: LogEntry[]): LogEntry[];
}

/**
 * SSOT: Log query
 * This defines how logs are queried
 */
export interface LogQuery {
    level?: LogLevel | LogLevel[];
    service?: string | string[];
    environment?: string | string[];
    tenantId?: string | string[];
    userId?: string | string[];
    traceId?: string;
    correlationId?: string;
    startTime?: Date;
    endTime?: Date;
    limit?: number;
    offset?: number;
    search?: string;
}

/**
 * SSOT: Log search result
 * This defines the structure of search results
 */
export interface LogSearchResult {
    entries: LogEntry[];
    total: number;
    hasMore: boolean;
    nextOffset?: number;
}

/**
 * SSOT: Log analytics
 * This defines how log analytics are structured
 */
export interface LogAnalytics {
    totalLogs: number;
    logsByLevel: Record<LogLevel, number>;
    logsByService: Record<string, number>;
    logsByTenant: Record<string, number>;
    errorRate: number;
    averageLogSize: number;
    topErrors: Array<{
        error: string;
        count: number;
        lastOccurrence: Date;
    }>;
    performanceMetrics: Array<{
        operation: string;
        averageDuration: number;
        p95Duration: number;
        p99Duration: number;
        count: number;
    }>;
}

/**
 * SSOT: Log alert
 * This defines how log alerts are structured
 */
export interface LogAlert {
    id: string;
    name: string;
    description: string;
    query: LogQuery;
    threshold: number;
    operator: '>' | '<' | '=' | '>=' | '<=' | '!=' | 'contains' | 'not_contains';
    window: number; // in minutes
    cooldown: number; // in minutes
    enabled: boolean;
    channels: string[]; // email, slack, webhook, etc.
    lastTriggered?: Date;
    lastChecked?: Date;
}

/**
 * SSOT: Log retention policy
 * This defines how log retention is configured
 */
export interface LogRetentionPolicy {
    level: LogLevel;
    retentionDays: number;
    compressionEnabled: boolean;
    archiveEnabled: boolean;
}

/**
 * SSOT: Log sampling policy
 * This defines how log sampling is configured
 */
export interface LogSamplingPolicy {
    level: LogLevel;
    sampleRate: number; // 0.0 to 1.0
    burstLimit?: number;
    burstWindow?: number; // in seconds
}

/**
 * SSOT: Export all types
 */
export type {
    LogLevel,
    LogMetadata,
    LogError,
    PerformanceMetrics,
    BusinessMetrics,
    SecurityEvent,
    RequestContext,
    Logger,
    LoggerConfig,
    LogEntry,
    LogTransport,
    LogFormatter,
    LogFilter,
    LogAggregator,
    LogQuery,
    LogSearchResult,
    LogAnalytics,
    LogAlert,
    LogRetentionPolicy,
    LogSamplingPolicy,
};
