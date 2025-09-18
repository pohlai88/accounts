import { EventEmitter } from "events";
import { createWriteStream, WriteStream } from "fs";
import { join } from "path";

export interface LogConfig {
  level: "debug" | "info" | "warn" | "error" | "fatal";
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  logDirectory: string;
  maxFileSize: number; // bytes
  maxFiles: number;
  enableRotation: boolean;
  enableCompression: boolean;
  enableStructuredLogging: boolean;
  enableCorrelation: boolean;
  enableSampling: boolean;
  sampleRate: number; // 0.0 to 1.0
  remoteEndpoint?: string;
  remoteApiKey?: string;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  version: string;
  environment: string;
  traceId?: string;
  spanId?: string;
  tenantId?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  tags: Record<string, string>;
  metadata: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack: string;
    code?: string;
  };
  performance?: {
    duration: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface LogQuery {
  level?: string;
  service?: string;
  tenantId?: string;
  userId?: string;
  traceId?: string;
  startTime?: string;
  endTime?: string;
  message?: string;
  tags?: Record<string, string>;
  limit?: number;
  offset?: number;
}

export class Logger extends EventEmitter {
  private config: LogConfig;
  private logStreams: Map<string, WriteStream> = new Map();
  private logBuffer: LogEntry[] = [];
  private bufferSize: number = 100;
  private flushInterval: number = 5000; // 5 seconds

  constructor(config: Partial<LogConfig> = {}) {
    super();

    this.config = {
      level: "info",
      enableConsole: true,
      enableFile: true,
      enableRemote: false,
      logDirectory: "./logs",
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      enableRotation: true,
      enableCompression: false,
      enableStructuredLogging: true,
      enableCorrelation: true,
      enableSampling: false,
      sampleRate: 0.1,
      ...config,
    };

    this.startFlushInterval();
  }

  /**
   * Log a debug message
   */
  debug(
    message: string,
    metadata: Record<string, any> = {},
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      tags?: Record<string, string>;
    } = {},
  ): void {
    this.log("debug", message, metadata, context);
  }

  /**
   * Log an info message
   */
  info(
    message: string,
    metadata: Record<string, any> = {},
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      tags?: Record<string, string>;
    } = {},
  ): void {
    this.log("info", message, metadata, context);
  }

  /**
   * Log a warning message
   */
  warn(
    message: string,
    metadata: Record<string, any> = {},
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      tags?: Record<string, string>;
    } = {},
  ): void {
    this.log("warn", message, metadata, context);
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    error?: Error,
    metadata: Record<string, any> = {},
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      tags?: Record<string, string>;
    } = {},
  ): void {
    const errorData = error
      ? {
        name: error.name,
        message: error.message,
        stack: error.stack || "",
        code: (error as Error & { code?: string }).code,
      }
      : undefined;

    this.log("error", message, metadata, { ...context, error: errorData });
  }

  /**
   * Log a fatal message
   */
  fatal(
    message: string,
    error?: Error,
    metadata: Record<string, any> = {},
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      tags?: Record<string, string>;
    } = {},
  ): void {
    const errorData = error
      ? {
        name: error.name,
        message: error.message,
        stack: error.stack || "",
        code: (error as Error & { code?: string }).code,
      }
      : undefined;

    this.log("fatal", message, metadata, { ...context, error: errorData });
  }

  /**
   * Log API request
   */
  logApiRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      userAgent?: string;
      ipAddress?: string;
    } = {},
  ): void {
    const level = statusCode >= 400 ? "warn" : "info";
    const message = `${method} ${url} ${statusCode} ${duration}ms`;

    this.log(
      level,
      message,
      {
        method,
        url,
        statusCode,
        duration,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
      },
      context,
    );
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      query?: string;
      rowsAffected?: number;
    } = {},
  ): void {
    const level = duration > 1000 ? "warn" : "info";
    const message = `Database ${operation} on ${table} took ${duration}ms`;

    this.log(
      level,
      message,
      {
        operation,
        table,
        duration,
        query: context.query,
        rowsAffected: context.rowsAffected,
      },
      context,
    );
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    eventType: string,
    severity: "low" | "medium" | "high" | "critical",
    message: string,
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      ipAddress?: string;
      userAgent?: string;
      details?: Record<string, any>;
    } = {},
  ): void {
    const level =
      severity === "critical"
        ? "fatal"
        : severity === "high"
          ? "error"
          : severity === "medium"
            ? "warn"
            : "info";

    this.log(
      level,
      message,
      {
        eventType,
        severity,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        details: context.details,
      },
      context,
    );
  }

  /**
   * Log performance metrics
   */
  logPerformance(
    operation: string,
    duration: number,
    metadata: Record<string, any> = {},
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
    } = {},
  ): void {
    const level = duration > 5000 ? "warn" : "info";
    const message = `Performance: ${operation} took ${duration}ms`;

    this.log(
      level,
      message,
      {
        operation,
        duration,
        ...metadata,
      },
      context,
    );
  }

  /**
   * Query logs
   */
  queryLogs(query: LogQuery): LogEntry[] {
    // In a real implementation, this would query a log storage system
    // For now, we'll return a mock response
    return this.logBuffer
      .filter(entry => {
        if (query.level && entry.level !== query.level) { return false; }
        if (query.service && entry.service !== query.service) { return false; }
        if (query.tenantId && entry.tenantId !== query.tenantId) { return false; }
        if (query.userId && entry.userId !== query.userId) { return false; }
        if (query.traceId && entry.traceId !== query.traceId) { return false; }
        if (query.message && !entry.message.includes(query.message)) { return false; }

        if (query.startTime && entry.timestamp < query.startTime) { return false; }
        if (query.endTime && entry.timestamp > query.endTime) { return false; }

        if (query.tags) {
          for (const [key, value] of Object.entries(query.tags)) {
            if (entry.tags[key] !== value) { return false; }
          }
        }

        return true;
      })
      .slice(query.offset || 0, (query.offset || 0) + (query.limit || 100));
  }

  /**
   * Get log statistics
   */
  getLogStats(): {
    totalLogs: number;
    logsByLevel: Record<string, number>;
    logsByService: Record<string, number>;
    logsByTenant: Record<string, number>;
    errorRate: number;
    averageLogSize: number;
  } {
    const logsByLevel: Record<string, number> = {};
    const logsByService: Record<string, number> = {};
    const logsByTenant: Record<string, number> = {};
    let totalSize = 0;

    for (const entry of this.logBuffer) {
      logsByLevel[entry.level] = (logsByLevel[entry.level] || 0) + 1;
      logsByService[entry.service] = (logsByService[entry.service] || 0) + 1;
      if (entry.tenantId) {
        logsByTenant[entry.tenantId] = (logsByTenant[entry.tenantId] || 0) + 1;
      }
      totalSize += JSON.stringify(entry).length;
    }

    const errorLogs = logsByLevel.error || 0;
    const fatalLogs = logsByLevel.fatal || 0;
    const totalLogs = this.logBuffer.length;
    const errorRate = totalLogs > 0 ? (errorLogs + fatalLogs) / totalLogs : 0;

    return {
      totalLogs,
      logsByLevel,
      logsByService,
      logsByTenant,
      errorRate,
      averageLogSize: totalLogs > 0 ? totalSize / totalLogs : 0,
    };
  }

  /**
   * Core logging method
   */
  private log(
    level: string,
    message: string,
    metadata: Record<string, any> = {},
    context: {
      traceId?: string;
      spanId?: string;
      tenantId?: string;
      userId?: string;
      requestId?: string;
      correlationId?: string;
      tags?: Record<string, string>;
      error?: Error;
    } = {},
  ): void {
    // Check log level
    if (!this.shouldLog(level)) { return; }

    // Check sampling
    if (this.config.enableSampling && Math.random() > this.config.sampleRate) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.getServiceName(),
      version: this.getServiceVersion(),
      environment: this.getEnvironment(),
      traceId: context.traceId,
      spanId: context.spanId,
      tenantId: context.tenantId,
      userId: context.userId,
      requestId: context.requestId,
      correlationId: context.correlationId,
      tags: context.tags || {},
      metadata,
      error: context.error ? {
        name: context.error.name,
        message: context.error.message,
        stack: context.error.stack || '',
        code: (context.error as Error & { code?: string }).code,
      } : undefined,
      performance: this.getPerformanceMetrics(),
    };

    // Add to buffer
    this.logBuffer.push(entry);

    // Emit event
    this.emit("log", entry);

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // File output
    if (this.config.enableFile) {
      this.logToFile(entry);
    }

    // Remote output
    if (this.config.enableRemote) {
      this.logToRemote(entry);
    }

    // Maintain buffer size
    if (this.logBuffer.length > this.bufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.bufferSize);
    }
  }

  /**
   * Check if should log at this level
   */
  private shouldLog(level: string): boolean {
    const levels = ["debug", "info", "warn", "error", "fatal"];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Log to console
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase().padEnd(5);
    const service = entry.service;
    const message = entry.message;

    let logMessage = `[${timestamp}] ${level} ${service}: ${message}`;

    if (entry.traceId) {
      logMessage += ` [trace:${entry.traceId}]`;
    }

    if (entry.tenantId) {
      logMessage += ` [tenant:${entry.tenantId}]`;
    }

    if (entry.error) {
      logMessage += `\nError: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        logMessage += `\n${entry.error.stack}`;
      }
    }

    // Use appropriate console method
    switch (entry.level) {
      case "debug":
        console.debug(logMessage);
        break;
      case "info":
        // Log info message to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
          // eslint-disable-next-line no-console
          console.info(logMessage);
        }
        break;
      case "warn":
        // Log warning message to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
          // eslint-disable-next-line no-console
          console.warn(logMessage);
        }
        break;
      case "error":
      case "fatal":
        // Log error message to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
          // eslint-disable-next-line no-console
          console.error(logMessage);
        }
        break;
      default:
        // Log debug message to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
          // eslint-disable-next-line no-console
          
        }
    }
  }

  /**
   * Log to file
   */
  private logToFile(entry: LogEntry): void {
    try {
      const filename = `${entry.level}.log`;
      const filepath = join(this.config.logDirectory, filename);

      let stream = this.logStreams.get(filepath);
      if (!stream) {
        stream = createWriteStream(filepath, { flags: "a" });
        this.logStreams.set(filepath, stream);
      }

      const logLine = JSON.stringify(entry) + "\n";
      stream.write(logLine);
    } catch (error) {
      // Log file write error to monitoring service
      if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
        console.error("Failed to write to log file:", error);
      }
    }
  }

  /**
   * Log to remote service
   */
  private logToRemote(entry: LogEntry): void {
    if (!this.config.remoteEndpoint || !this.config.remoteApiKey) {
      return;
    }

    // In a real implementation, this would send to a remote logging service
    // For now, we'll just emit an event
    this.emit("remoteLog", entry);
  }

  /**
   * Get performance metrics
   */
  private getPerformanceMetrics(): { duration: number; memoryUsage: number; cpuUsage: number } {
    const memUsage = process.memoryUsage();
    return {
      duration: 0, // Would be calculated based on operation
      memoryUsage: memUsage.heapUsed,
      cpuUsage: 0, // Would be calculated based on CPU usage
    };
  }

  /**
   * Get service name
   */
  private getServiceName(): string {
    return process.env.SERVICE_NAME || "aibos-accounts";
  }

  /**
   * Get service version
   */
  private getServiceVersion(): string {
    return process.env.SERVICE_VERSION || "1.0.0";
  }

  /**
   * Get environment
   */
  private getEnvironment(): string {
    return process.env.NODE_ENV || "development";
  }

  /**
   * Start flush interval
   */
  private startFlushInterval(): void {
    setInterval(() => {
      this.flushLogs();
    }, this.flushInterval);
  }

  /**
   * Flush logs to storage
   */
  private flushLogs(): void {
    // In a real implementation, this would flush logs to persistent storage
    // For now, we'll just emit an event
    this.emit("logsFlushed", this.logBuffer.length);
  }

  /**
   * Close all streams
   */
  close(): void {
    for (const stream of this.logStreams.values()) {
      stream.end();
    }
    this.logStreams.clear();
  }
}
