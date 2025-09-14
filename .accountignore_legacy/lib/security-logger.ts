/**
 * 🔍 Structured Security Event Logging
 *
 * Comprehensive security event logging with structured data,
 * multiple output targets, and intelligent alerting.
 */

import { SecurityConfig, type SecurityEvent } from "./security-config";

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4,
}

// Extended security event with severity
export interface EnhancedSecurityEvent extends SecurityEvent {
  severity: LogLevel;
  category: "authentication" | "authorization" | "rate_limit" | "csp" | "bot" | "csrf" | "general";
  source: "middleware" | "api" | "client" | "system";
  sessionId?: string;
  userId?: string;
  fingerprint?: string;
}

// Log output interface
export interface LogOutput {
  write(event: EnhancedSecurityEvent): Promise<void>;
}

// Console log output
class ConsoleLogOutput implements LogOutput {
  async write(event: EnhancedSecurityEvent): Promise<void> {
    const logMethod = this.getLogMethod(event.severity);
    const timestamp = new Date(event.timestamp).toISOString();

    logMethod(
      `[${timestamp}] [${LogLevel[event.severity]}] [${event.category}] ${event.eventType}`,
      {
        ip: event.ip,
        path: event.path,
        userAgent: event.userAgent,
        details: event.details,
      },
    );
  }

  private getLogMethod(severity: LogLevel) {
    switch (severity) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        return console.error;
      default:
        return console.log;
    }
  }
}

// Structured JSON log output (for production)
class StructuredLogOutput implements LogOutput {
  async write(event: EnhancedSecurityEvent): Promise<void> {
    const logEntry = {
      "@timestamp": event.timestamp,
      level: LogLevel[event.severity].toLowerCase(),
      message: `Security event: ${event.eventType}`,
      security: {
        event_type: event.eventType,
        category: event.category,
        source: event.source,
        severity: event.severity,
      },
      http: {
        method: event.method,
        path: event.path,
        user_agent: event.userAgent,
      },
      client: {
        ip: event.ip,
        fingerprint: event.fingerprint,
      },
      user: {
        id: event.userId,
        session_id: event.sessionId,
      },
      details: event.details,
      environment: process.env.NODE_ENV,
      service: "modern-accounting-saas",
      version: process.env.npm_package_version || "1.0.0",
    };

    // Output as JSON for log aggregation systems
    console.log(JSON.stringify(logEntry));
  }
}

// File log output (for local development)
class FileLogOutput implements LogOutput {
  private logFile: string;

  constructor(logFile: string = "security.log") {
    this.logFile = logFile;
  }

  async write(event: EnhancedSecurityEvent): Promise<void> {
    try {
      // Use console logging for Edge runtime compatibility
      const logEntry = `${event.timestamp} [${LogLevel[event.severity]}] ${event.eventType} - IP: ${event.ip}, Path: ${event.path}, Details: ${JSON.stringify(event.details)}`;

      // Log to console (works in all runtimes)
      console.log(`[SECURITY] ${logEntry}`);

      // In production, you would send this to an external logging service
      // like Supabase, DataDog, or CloudWatch instead of file system
    } catch (error) {
      console.error("Failed to write to log file:", error);
    }
  }
}

// Security logger class
class SecurityLogger {
  private outputs: LogOutput[] = [];
  private minLogLevel: LogLevel = LogLevel.INFO;

  constructor() {
    this.setupOutputs();
    this.setLogLevel();
  }

  private setupOutputs() {
    if (SecurityConfig.logging.enableConsoleLogging) {
      this.outputs.push(new ConsoleLogOutput());
    }

    if (SecurityConfig.logging.enableStructuredLogging) {
      this.outputs.push(new StructuredLogOutput());
    }

    // Add file logging in development
    if (SecurityConfig.isDev) {
      this.outputs.push(new FileLogOutput());
    }
  }

  private setLogLevel() {
    const level = SecurityConfig.logging.logLevel.toUpperCase();
    this.minLogLevel = LogLevel[level as keyof typeof LogLevel] || LogLevel.INFO;
  }

  /**
   * Log a security event
   */
  async logEvent(event: EnhancedSecurityEvent): Promise<void> {
    // Skip if below minimum log level
    if (event.severity < this.minLogLevel) {
      return;
    }

    // Write to all configured outputs
    const writePromises = this.outputs.map(output =>
      output.write(event).catch(error => console.error("Log output error:", error)),
    );

    await Promise.all(writePromises);

    // Handle critical events
    if (event.severity === LogLevel.CRITICAL) {
      await this.handleCriticalEvent(event);
    }
  }

  /**
   * Handle critical security events
   */
  private async handleCriticalEvent(event: EnhancedSecurityEvent): Promise<void> {
    console.error("🚨 CRITICAL SECURITY EVENT:", {
      type: event.eventType,
      ip: event.ip,
      path: event.path,
      timestamp: event.timestamp,
      details: event.details,
    });

    // In production, you might want to:
    // 1. Send immediate alerts (email, Slack, PagerDuty)
    // 2. Trigger automated responses (IP blocking, rate limiting)
    // 3. Create incident tickets
    // 4. Send to SIEM systems

    if (SecurityConfig.isProd) {
      // Example integrations:
      // await this.sendSlackAlert(event)
      // await this.createIncident(event)
      // await this.notifySecurityTeam(event)
    }
  }

  /**
   * Create a rate limit event
   */
  async logRateLimit(
    ip: string,
    path: string,
    method: string,
    userAgent: string,
    details: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      timestamp: new Date().toISOString(),
      ip,
      method,
      path,
      userAgent,
      eventType: "rate_limit",
      details,
      severity: LogLevel.WARN,
      category: "rate_limit",
      source: "middleware",
    });
  }

  /**
   * Create a CSRF violation event
   */
  async logCSRFViolation(
    ip: string,
    path: string,
    method: string,
    userAgent: string,
    details: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      timestamp: new Date().toISOString(),
      ip,
      method,
      path,
      userAgent,
      eventType: "csrf_failure",
      details,
      severity: LogLevel.ERROR,
      category: "csrf",
      source: "middleware",
    });
  }

  /**
   * Create a bot detection event
   */
  async logBotDetection(
    ip: string,
    path: string,
    method: string,
    userAgent: string,
    details: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      timestamp: new Date().toISOString(),
      ip,
      method,
      path,
      userAgent,
      eventType: "bot_detected",
      details,
      severity: LogLevel.INFO,
      category: "bot",
      source: "middleware",
    });
  }

  /**
   * Create an invalid origin event
   */
  async logInvalidOrigin(
    ip: string,
    path: string,
    method: string,
    userAgent: string,
    details: Record<string, any>,
  ): Promise<void> {
    await this.logEvent({
      timestamp: new Date().toISOString(),
      ip,
      method,
      path,
      userAgent,
      eventType: "invalid_origin",
      details,
      severity: LogLevel.WARN,
      category: "authorization",
      source: "middleware",
    });
  }

  /**
   * Create a CSP violation event
   */
  async logCSPViolation(
    ip: string,
    path: string,
    method: string,
    userAgent: string,
    details: Record<string, any>,
  ): Promise<void> {
    const severity = this.isCSPViolationCritical(details) ? LogLevel.CRITICAL : LogLevel.WARN;

    await this.logEvent({
      timestamp: new Date().toISOString(),
      ip,
      method,
      path,
      userAgent,
      eventType: "csp_violation",
      details,
      severity,
      category: "csp",
      source: "client",
    });
  }

  /**
   * Check if CSP violation is critical
   */
  private isCSPViolationCritical(details: Record<string, any>): boolean {
    const violatedDirective = details.violatedDirective || "";
    const blockedUri = details.blockedUri || "";

    // Critical patterns that indicate potential attacks
    const criticalPatterns = [
      /script-src.*eval/,
      /script-src.*data:/,
      /script-src.*javascript:/,
      /base-uri/,
      /form-action/,
    ];

    return criticalPatterns.some(
      pattern => pattern.test(violatedDirective) || pattern.test(blockedUri),
    );
  }
}

// Singleton logger instance
let loggerInstance: SecurityLogger | null = null;

/**
 * Get or create security logger instance
 */
export function getSecurityLogger(): SecurityLogger {
  if (!loggerInstance) {
    loggerInstance = new SecurityLogger();
  }
  return loggerInstance;
}

/**
 * Convenience function to log security events
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
  const logger = getSecurityLogger();

  // Enhance the event with default values
  const enhancedEvent: EnhancedSecurityEvent = {
    ...event,
    severity: LogLevel.INFO,
    category: "general",
    source: "system",
  };

  // Set appropriate severity and category based on event type
  switch (event.eventType) {
    case "rate_limit":
      enhancedEvent.severity = LogLevel.WARN;
      enhancedEvent.category = "rate_limit";
      break;
    case "csrf_failure":
      enhancedEvent.severity = LogLevel.ERROR;
      enhancedEvent.category = "csrf";
      break;
    case "bot_detected":
      enhancedEvent.severity = LogLevel.INFO;
      enhancedEvent.category = "bot";
      break;
    case "csp_violation":
      enhancedEvent.severity = LogLevel.WARN;
      enhancedEvent.category = "csp";
      enhancedEvent.source = "client";
      break;
    case "invalid_origin":
      enhancedEvent.severity = LogLevel.WARN;
      enhancedEvent.category = "authorization";
      break;
  }

  await logger.logEvent(enhancedEvent);
}

// Types and enums are already exported above
