// @ts-nocheck
// Advanced Security Middleware Integration
import { NextRequest, NextResponse } from "next/server";
import { AdvancedSecurityManager } from "@aibos/security";
import { AuditLogger } from "@aibos/security";
import { EncryptionManager } from "@aibos/security";
import { createAuditEvent } from "@aibos/security";
import { headerValue } from "@aibos/utils";

// Global security instances
let securityManager: AdvancedSecurityManager | null = null;
let auditLogger: AuditLogger | null = null;
let encryptionManager: EncryptionManager | null = null;

interface SecurityConfig {
  security?: Record<string, unknown>;
  audit?: Record<string, unknown>;
  encryption?: Record<string, unknown>;
}

export function createSecurityMiddleware(config?: SecurityConfig) {
  if (!securityManager) {
    securityManager = new AdvancedSecurityManager({
      enableRateLimiting: true,
      enableCSRFProtection: true,
      enableXSSProtection: true,
      enableContentSecurityPolicy: true,
      enableHSTS: true,
      enableCORS: true,
      maxRequestsPerMinute: 60,
      maxRequestsPerHour: 1000,
      maxRequestsPerDay: 10000,
      trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      ],
      allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "X-Request-Id",
        "X-Tenant-Id",
        "Idempotency-Key",
      ],
      securityHeaders: {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
        "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' wss: https:;",
      },
      ...config?.security,
    });
  }

  if (!auditLogger) {
    auditLogger = new AuditLogger({
      enableRealTime: true,
      enableBatchProcessing: true,
      batchSize: 100,
      batchInterval: 60000,
      retentionPeriod: 2555, // 7 years
      enableEncryption: true,
      enableCompression: false,
      maxEventSize: 1024 * 1024, // 1MB
      enableRiskScoring: true,
      enableComplianceMonitoring: true,
      ...config?.audit,
    });
  }

  if (!encryptionManager) {
    encryptionManager = new EncryptionManager({
      algorithm: "aes-256-gcm",
      iterations: 100000,
      saltLength: 32,
      ...config?.encryption,
    });
  }

  return { securityManager, auditLogger, encryptionManager };
}

export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: unknown,
) {
  const { securityManager, auditLogger, encryptionManager } = createSecurityMiddleware(config as SecurityConfig | undefined);

  return async (req: NextRequest): Promise<NextResponse> => {
    const startTime = Date.now();
    const requestId =
      req.headers.get("x-request-id") ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    try {
      // 1. Apply comprehensive security checks
      const securityResult = await securityManager!.applySecurity(req);
      if (securityResult) {
        // Security violation detected
        const auditEvent = createAuditEvent({
          action: "permission.denied",
          tenantId: "unknown",
          userId: "anonymous",
          resource: req.url,
          required: [securityResult.message || "Security check failed"],
        });
        // Convert AuditEvent to AuditLogEvent format
        const auditLogEvent = {
          tenantId: auditEvent.tenantId,
          userId: auditEvent.userId,
          action: auditEvent.action as string,
          resource: req.url,
          severity: "high" as const,
          category: "security" as const,
          outcome: "failure" as const,
          details: {
            reason: securityResult.message || "Security check failed",
            ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
            userAgent: req.headers.get("user-agent") || "unknown",
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
          metadata: {},
        };
        await auditLogger!.logEvent(auditLogEvent);

        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            requestId,
            error: {
              type: "about:blank",
              title: "Security violation detected",
              status: securityResult.status || 403,
              code: "SECURITY_VIOLATION",
              detail: securityResult.message || "Request blocked by security policy",
              instance: req.url,
            },
          },
          {
            status: securityResult.status || 403,
            headers: securityResult.headers || {},
          },
        );
      }

      // 2. Log request start
      const requestStartEvent = createAuditEvent({
        action: "api.request",
        tenantId: "unknown",
        userId: "anonymous",
        method: req.method,
        resource: req.url,
        statusCode: 200, // Will be updated after response
        duration: 0, // Will be updated after response
        ip,
        ua: userAgent,
      });
      // Convert AuditEvent to AuditLogEvent format
      const startAuditLogEvent = {
        tenantId: requestStartEvent.tenantId,
        userId: requestStartEvent.userId,
        action: requestStartEvent.action as string,
        resource: req.url,
        severity: "low" as const,
        category: "system" as const,
        outcome: "success" as const,
        details: {
          method: req.method,
          statusCode: 200,
          duration: 0,
          ipAddress: ip,
          userAgent: userAgent,
        },
        ipAddress: ip,
        userAgent: userAgent,
        metadata: {},
      };
      await auditLogger!.logEvent(startAuditLogEvent);

      // 3. Execute the handler
      const response = await handler(req);

      // 4. Log request completion
      const duration = Date.now() - startTime;
      const requestCompleteEvent = createAuditEvent({
        action: "api.request",
        tenantId: "unknown",
        userId: "anonymous",
        method: req.method,
        resource: req.url,
        statusCode: response.status,
        duration,
        ip,
        ua: userAgent,
        severity: response.status >= 400 ? "medium" : "low",
      });
      // Convert AuditEvent to AuditLogEvent format
      const completeAuditLogEvent = {
        tenantId: requestCompleteEvent.tenantId,
        userId: requestCompleteEvent.userId,
        action: requestCompleteEvent.action as string,
        resource: req.url,
        severity: response.status >= 400 ? "medium" : "low",
        category: "system",
        outcome: response.status >= 400 ? "failure" : "success",
        details: {
          method: req.method,
          statusCode: response.status,
          duration,
          ipAddress: ip,
          userAgent: userAgent,
        },
        ipAddress: ip,
        userAgent: userAgent,
        metadata: {},
      };
      await auditLogger!.logEvent(completeAuditLogEvent as any);

      // 5. Security headers are handled by Next.js configuration
      // Note: addSecurityHeaders is not compatible with NextResponse

      return response;
    } catch (error: unknown) {
      // 6. Log security error
      const securityErrorEvent = createAuditEvent({
        action: "permission.denied",
        tenantId: "unknown",
        userId: "anonymous",
        resource: req.url,
        required: [error instanceof Error ? error.message : "Unknown error"],
        severity: "high",
        category: "security",
      });
      // Convert AuditEvent to AuditLogEvent format
      const auditLogEvent = {
        tenantId: securityErrorEvent.tenantId,
        userId: securityErrorEvent.userId,
        action: securityErrorEvent.action as string,
        resource: req.url,
        severity: "high" as const,
        category: "security" as const,
        outcome: "failure" as const,
        details: {
          reason: error instanceof Error ? error.message : "Unknown error",
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
          userAgent: req.headers.get("user-agent") || "unknown",
        },
        ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
        userAgent: req.headers.get("user-agent") || "unknown",
        metadata: {},
      };
      await auditLogger!.logEvent(auditLogEvent);

      return NextResponse.json(
        {
          success: false,
          timestamp: new Date().toISOString(),
          requestId,
          error: {
            type: "about:blank",
            title: "Security middleware error",
            status: 500,
            code: "SECURITY_ERROR",
            detail: "An error occurred in the security middleware",
            instance: req.url,
          },
        },
        { status: 500 },
      );
    }
  };
}

// Rate limiting middleware
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: NextRequest) => string;
  } = {},
) {
  const { securityManager } = createSecurityMiddleware();

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
      const tenantId = req.headers.get("x-tenant-id") || "unknown";
      const key = options.keyGenerator ? options.keyGenerator(req) : `${ip}:${tenantId}`;

      const rateLimitResult = await securityManager!.checkRateLimit(
        key,
        req.url,
      );

      if (rateLimitResult.blocked) {
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            requestId:
              req.headers.get("x-request-id") ||
              `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            error: {
              type: "about:blank",
              title: "Rate limit exceeded",
              status: 429,
              code: "RATE_LIMIT_EXCEEDED",
              detail: `Too many requests. Limit: ${options.maxRequests} per ${options.windowMs}ms`,
              instance: req.url,
            },
          },
          {
            status: 429,
            headers: {
              "Retry-After": Math.ceil(rateLimitResult.resetTime / 1000).toString(),
              "X-RateLimit-Limit": options.maxRequests?.toString() || "100",
              "X-RateLimit-Remaining": Math.max(0, (options.maxRequests || 100) - rateLimitResult.requests).toString(),
              "X-RateLimit-Reset": rateLimitResult.resetTime?.toString() || Date.now().toString(),
            },
          },
        );
      }

      return handler(req);
    } catch (error: unknown) {
      console.error("Rate limiting error:", error);
      return handler(req); // Fail open
    }
  };
}

// CSRF protection middleware
export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    tokenHeader?: string;
    cookieName?: string;
  } = {},
) {
  const { securityManager } = createSecurityMiddleware();

  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
        return handler(req);
      }

      const tokenHeader = options.tokenHeader || "x-csrf-token";
      const cookieName = options.cookieName || "csrf-token";

      const csrfToken = req.headers.get(tokenHeader);
      const cookieToken = req.cookies.get(cookieName)?.value;

      if (!csrfToken || !cookieToken || csrfToken !== cookieToken) {
        return NextResponse.json(
          {
            success: false,
            timestamp: new Date().toISOString(),
            requestId:
              req.headers.get("x-request-id") ||
              `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            error: {
              type: "about:blank",
              title: "CSRF token validation failed",
              status: 403,
              code: "CSRF_TOKEN_INVALID",
              detail: "Invalid or missing CSRF token",
              instance: req.url,
            },
          },
          { status: 403 },
        );
      }

      return handler(req);
    } catch (error: unknown) {
      console.error("CSRF protection error:", error);
      return handler(req); // Fail open
    }
  };
}

// Security health and stats functions
export async function getSecurityHealth() {
  try {
    if (!securityManager) {
      return {
        status: "unhealthy",
        message: "Security manager not initialized",
        timestamp: new Date().toISOString(),
      };
    }

    const stats = securityManager.getSecurityStats();
    return {
      status: "healthy",
      message: "Security manager operational",
      timestamp: new Date().toISOString(),
      details: stats,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      message: "Security health check failed",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

export async function getSecurityStats() {
  try {
    if (!securityManager) {
      return {
        totalRequests: 0,
        blockedRequests: 0,
        rateLimitHits: 0,
        csrfViolations: 0,
        xssAttempts: 0,
        timestamp: new Date().toISOString(),
      };
    }

    const stats = securityManager.getSecurityStats();
    return {
      totalEvents: stats.totalEvents || 0,
      eventsByType: stats.eventsByType || {},
      eventsBySeverity: stats.eventsBySeverity || {},
      topAttackingIPs: stats.topAttackingIPs || [],
      recentEvents: stats.recentEvents || [],
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      totalRequests: 0,
      blockedRequests: 0,
      rateLimitHits: 0,
      csrfViolations: 0,
      xssAttempts: 0,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export security utilities
export { securityManager, auditLogger, encryptionManager };
