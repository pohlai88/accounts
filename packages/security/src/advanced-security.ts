// Note: NextRequest and NextResponse are only available in Next.js context
// This will be handled by the middleware wrapper
import { createHash, randomBytes } from "crypto";
import { EventEmitter } from "events";

export interface SecurityConfig {
  enableRateLimiting: boolean;
  enableCSRFProtection: boolean;
  enableXSSProtection: boolean;
  enableContentSecurityPolicy: boolean;
  enableHSTS: boolean;
  enableCORS: boolean;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  trustedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  securityHeaders: Record<string, string>;
}

export interface SecurityEvent {
  type: "rate_limit" | "csrf_attack" | "xss_attempt" | "suspicious_activity" | "security_violation";
  severity: "low" | "medium" | "high" | "critical";
  ip: string;
  userAgent: string;
  tenantId?: string;
  userId?: string;
  details: Record<string, any>;
  timestamp: number;
  requestId: string;
}

export interface RateLimitInfo {
  ip: string;
  requests: number;
  windowStart: number;
  blocked: boolean;
  resetTime: number;
}

export class AdvancedSecurityManager extends EventEmitter {
  private config: SecurityConfig;
  private rateLimitStore = new Map<string, RateLimitInfo>();
  private csrfTokens = new Map<string, { token: string; expires: number }>();
  private securityEvents: SecurityEvent[] = [];
  private maxSecurityEvents = 1000;

  constructor(config: Partial<SecurityConfig> = {}) {
    super();

    this.config = {
      enableRateLimiting: true,
      enableCSRFProtection: true,
      enableXSSProtection: true,
      enableContentSecurityPolicy: true,
      enableHSTS: true,
      enableCORS: true,
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      maxRequestsPerDay: 10000,
      trustedOrigins: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
      allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-Id",
        "X-Tenant-Id",
      ],
      securityHeaders: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
      },
      ...config,
    };

    this.startCleanupProcess();
  }

  /**
   * Apply comprehensive security middleware
   */
  async applySecurity(req: any): Promise<any | null> {
    const requestId = req.headers.get("x-request-id") || this.generateRequestId();
    const ip = this.getClientIP(req);
    const userAgent = req.headers.get("user-agent") || "";

    try {
      // 1. Rate limiting
      if (this.config.enableRateLimiting) {
        const rateLimitResult = await this.checkRateLimit(ip, req.url);
        if (rateLimitResult.blocked) {
          this.recordSecurityEvent({
            type: "rate_limit",
            severity: "medium",
            ip,
            userAgent,
            details: { url: req.url, limit: rateLimitResult.requests },
            timestamp: Date.now(),
            requestId,
          });

          return this.createSecurityResponse(429, "Rate limit exceeded", {
            "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
            "X-RateLimit-Limit": this.config.maxRequestsPerMinute.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          });
        }
      }

      // 2. CSRF protection
      if (this.config.enableCSRFProtection && this.isStateChangingMethod(req.method)) {
        const csrfResult = await this.validateCSRFToken(req);
        if (!csrfResult.valid) {
          this.recordSecurityEvent({
            type: "csrf_attack",
            severity: "high",
            ip,
            userAgent,
            details: { method: req.method, url: req.url, reason: csrfResult.reason },
            timestamp: Date.now(),
            requestId,
          });

          return this.createSecurityResponse(403, "CSRF token validation failed");
        }
      }

      // 3. XSS protection
      if (this.config.enableXSSProtection) {
        const xssResult = this.detectXSSAttempt(req);
        if (xssResult.detected) {
          this.recordSecurityEvent({
            type: "xss_attempt",
            severity: "high",
            ip,
            userAgent,
            details: { url: req.url, payload: xssResult.payload },
            timestamp: Date.now(),
            requestId,
          });

          return this.createSecurityResponse(400, "Suspicious request detected");
        }
      }

      // 4. Suspicious activity detection
      const suspiciousResult = this.detectSuspiciousActivity(req, ip);
      if (suspiciousResult.detected) {
        this.recordSecurityEvent({
          type: "suspicious_activity",
          severity: suspiciousResult.severity,
          ip,
          userAgent,
          details: { url: req.url, reason: suspiciousResult.reason },
          timestamp: Date.now(),
          requestId,
        });

        if (suspiciousResult.severity === "critical") {
          return this.createSecurityResponse(403, "Suspicious activity detected");
        }
      }

      return null; // No security violations detected
    } catch (error) {
      console.error("Security middleware error:", error);
      return this.createSecurityResponse(500, "Security check failed");
    }
  }

  /**
   * Add security headers to response
   */
  addSecurityHeaders(response: any): any {
    // Add configured security headers
    Object.entries(this.config.securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add CSP header
    if (this.config.enableContentSecurityPolicy) {
      const csp = this.generateCSP();
      response.headers.set("Content-Security-Policy", csp);
    }

    // Add HSTS header
    if (this.config.enableHSTS) {
      response.headers.set(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
    }

    // Add CORS headers
    if (this.config.enableCORS) {
      response.headers.set("Access-Control-Allow-Origin", this.getAllowedOrigin());
      response.headers.set("Access-Control-Allow-Methods", this.config.allowedMethods.join(", "));
      response.headers.set("Access-Control-Allow-Headers", this.config.allowedHeaders.join(", "));
      response.headers.set("Access-Control-Max-Age", "86400");
    }

    return response;
  }

  /**
   * Generate CSRF token
   */
  generateCSRFToken(sessionId: string): string {
    const token = randomBytes(32).toString("hex");
    const expires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    this.csrfTokens.set(sessionId, { token, expires });
    return token;
  }

  /**
   * Validate CSRF token
   */
  async validateCSRFToken(req: any): Promise<{ valid: boolean; reason?: string }> {
    const sessionId = req.headers.get("x-session-id");
    if (!sessionId) {
      return { valid: false, reason: "Missing session ID" };
    }

    const token = req.headers.get("x-csrf-token");
    if (!token) {
      return { valid: false, reason: "Missing CSRF token" };
    }

    const storedToken = this.csrfTokens.get(sessionId);
    if (!storedToken) {
      return { valid: false, reason: "Invalid session" };
    }

    if (storedToken.expires < Date.now()) {
      this.csrfTokens.delete(sessionId);
      return { valid: false, reason: "Token expired" };
    }

    if (storedToken.token !== token) {
      return { valid: false, reason: "Token mismatch" };
    }

    return { valid: true };
  }

  /**
   * Check rate limit for IP
   */
  async checkRateLimit(ip: string, url: string): Promise<RateLimitInfo> {
    const now = Date.now();
    const minuteWindow = Math.floor(now / 60000);
    const hourWindow = Math.floor(now / 3600000);
    const dayWindow = Math.floor(now / 86400000);

    const key = `${ip}:${minuteWindow}`;
    const current = this.rateLimitStore.get(key) || {
      ip,
      requests: 0,
      windowStart: minuteWindow * 60000,
      blocked: false,
      resetTime: (minuteWindow + 1) * 60000,
    };

    current.requests++;
    current.blocked = current.requests > this.config.maxRequestsPerMinute;

    this.rateLimitStore.set(key, current);

    // Check hourly and daily limits
    if (!current.blocked) {
      const hourlyKey = `${ip}:${hourWindow}`;
      const dailyKey = `${ip}:${dayWindow}`;

      const hourly = this.rateLimitStore.get(hourlyKey) || {
        ip,
        requests: 0,
        windowStart: hourWindow * 3600000,
        blocked: false,
        resetTime: (hourWindow + 1) * 3600000,
      };
      const daily = this.rateLimitStore.get(dailyKey) || {
        ip,
        requests: 0,
        windowStart: dayWindow * 86400000,
        blocked: false,
        resetTime: (dayWindow + 1) * 86400000,
      };

      hourly.requests++;
      daily.requests++;

      if (
        hourly.requests > this.config.maxRequestsPerHour ||
        daily.requests > this.config.maxRequestsPerDay
      ) {
        current.blocked = true;
      }

      this.rateLimitStore.set(hourlyKey, hourly);
      this.rateLimitStore.set(dailyKey, daily);
    }

    return current;
  }

  /**
   * Detect XSS attempts
   */
  detectXSSAttempt(req: any): { detected: boolean; payload?: string } {
    const url = req.url;
    const searchParams = new URL(url).searchParams;

    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /<link[^>]*>.*?<\/link>/gi,
      /<meta[^>]*>.*?<\/meta>/gi,
    ];

    for (const [key, value] of searchParams) {
      for (const pattern of xssPatterns) {
        if (pattern.test(value)) {
          return { detected: true, payload: value };
        }
      }
    }

    return { detected: false };
  }

  /**
   * Detect suspicious activity
   */
  detectSuspiciousActivity(
    req: any,
    ip: string,
  ): { detected: boolean; severity: "low" | "medium" | "high" | "critical"; reason?: string } {
    const url = req.url;
    const userAgent = req.headers.get("user-agent") || "";

    // Check for common attack patterns
    const attackPatterns = [
      { pattern: /\.\.\//g, severity: "high" as const, reason: "Path traversal attempt" },
      {
        pattern: /union\s+select/gi,
        severity: "critical" as const,
        reason: "SQL injection attempt",
      },
      { pattern: /<script/gi, severity: "high" as const, reason: "Script injection attempt" },
      { pattern: /eval\s*\(/gi, severity: "critical" as const, reason: "Code injection attempt" },
      { pattern: /base64/gi, severity: "medium" as const, reason: "Base64 encoding detected" },
      { pattern: /admin/gi, severity: "low" as const, reason: "Admin access attempt" },
    ];

    for (const { pattern, severity, reason } of attackPatterns) {
      if (pattern.test(url) || pattern.test(userAgent)) {
        return { detected: true, severity, reason };
      }
    }

    // Check for unusual request patterns
    const recentEvents = this.securityEvents.filter(
      e => e.ip === ip && Date.now() - e.timestamp < 300000, // Last 5 minutes
    );

    if (recentEvents.length > 10) {
      return { detected: true, severity: "medium", reason: "High request frequency" };
    }

    return { detected: false, severity: "low" };
  }

  /**
   * Generate Content Security Policy
   */
  private generateCSP(): string {
    const directives = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' wss: https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];

    return directives.join("; ");
  }

  /**
   * Get allowed origin for CORS
   */
  private getAllowedOrigin(): string {
    // In production, this should be dynamically determined
    return this.config.trustedOrigins[0] || "*";
  }

  /**
   * Check if method is state-changing
   */
  private isStateChangingMethod(method: string): boolean {
    return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: any): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      return forwarded.split(",")[0].trim();
    }

    const realIP = req.headers.get("x-real-ip");
    if (realIP) {
      return realIP;
    }

    return "unknown";
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create security response
   */
  private createSecurityResponse(
    status: number,
    message: string,
    headers: Record<string, string> = {},
  ): any {
    const response = {
      status,
      body: {
        success: false,
        error: {
          type: "about:blank",
          title: "Security Violation",
          status,
          detail: message,
          instance: "security-middleware",
        },
      },
    };

    // Headers will be handled by the middleware wrapper
    return response;
  }

  /**
   * Record security event
   */
  private recordSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);

    // Keep only recent events
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents = this.securityEvents.slice(-this.maxSecurityEvents);
    }

    this.emit("securityEvent", event);
  }

  /**
   * Get security statistics
   */
  getSecurityStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    topAttackingIPs: Array<{ ip: string; count: number }>;
    recentEvents: SecurityEvent[];
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    const ipCounts: Record<string, number> = {};

    for (const event of this.securityEvents) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
    }

    const topAttackingIPs = Object.entries(ipCounts)
      .map(([ip, count]) => ({ ip, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentEvents = this.securityEvents.sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);

    return {
      totalEvents: this.securityEvents.length,
      eventsByType,
      eventsBySeverity,
      topAttackingIPs,
      recentEvents,
    };
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    setInterval(() => {
      const now = Date.now();

      // Clean up expired CSRF tokens
      for (const [sessionId, token] of this.csrfTokens) {
        if (token.expires < now) {
          this.csrfTokens.delete(sessionId);
        }
      }

      // Clean up old rate limit data
      const cutoff = now - 24 * 60 * 60 * 1000; // 24 hours ago
      for (const [key, data] of this.rateLimitStore) {
        if (data.windowStart < cutoff) {
          this.rateLimitStore.delete(key);
        }
      }

      // Clean up old security events
      this.securityEvents = this.securityEvents.filter(e => e.timestamp > cutoff);
    }, 300000); // Every 5 minutes
  }
}
