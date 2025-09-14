// Advanced Security Middleware Integration
import { NextRequest, NextResponse } from "next/server";
import { AdvancedSecurityManager } from "@aibos/security";
import { AuditLogger } from "@aibos/security";
import { EncryptionManager } from "@aibos/security";

// Global security instances
let securityManager: AdvancedSecurityManager | null = null;
let auditLogger: AuditLogger | null = null;
let encryptionManager: EncryptionManager | null = null;

export function createSecurityMiddleware(config?: unknown) {
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
      keyDerivation: "pbkdf2",
      iterations: 100000,
      saltLength: 32,
      tagLength: 16,
      ...config?.encryption,
    });
  }

  return { securityManager, auditLogger, encryptionManager };
}

export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  config?: unknown,
) {
  const { securityManager, auditLogger, encryptionManager } = createSecurityMiddleware(config);

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
        await auditLogger!.logEvent({
          action: "security_violation",
          resource: req.url,
          userId: "anonymous",
          tenantId: "unknown",
          details: {
            ip,
            userAgent,
            reason: securityResult.reason || "Security check failed",
            headers: Object.fromEntries(req.headers.entries()),
          },
          severity: "high",
          category: "security",
        });

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
              detail: securityResult.reason || "Request blocked by security policy",
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
      await auditLogger!.logEvent({
        action: "request_start",
        resource: req.url,
        userId: "anonymous", // Will be updated after auth
        tenantId: "unknown", // Will be updated after auth
        details: {
          method: req.method,
          ip,
          userAgent,
          headers: Object.fromEntries(req.headers.entries()),
        },
        severity: "low",
        category: "system",
      });

      // 3. Execute the handler
      const response = await handler(req);

      // 4. Log request completion
      const duration = Date.now() - startTime;
      await auditLogger!.logEvent({
        action: "request_complete",
        resource: req.url,
        userId: "anonymous", // Would be extracted from response context
        tenantId: "unknown", // Would be extracted from response context
        details: {
          method: req.method,
          statusCode: response.status,
          duration,
          ip,
          userAgent,
        },
        severity: response.status >= 400 ? "medium" : "low",
        category: "system",
      });

      // 5. Add security headers to response
      const securityHeaders = securityManager!.getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;
    } catch (error: unknown) {
      // 6. Log security error
      await auditLogger!.logEvent({
        action: "security_error",
        resource: req.url,
        userId: "anonymous",
        tenantId: "unknown",
        details: {
          method: req.method,
          ip,
          userAgent,
          error: error.message,
          stack: error.stack,
        },
        severity: "high",
        category: "security",
      });

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
        options.windowMs || 60000, // 1 minute
        options.maxRequests || 100,
      );

      if (!rateLimitResult.allowed) {
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
              "X-RateLimit-Remaining": rateLimitResult.remaining?.toString() || "0",
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

    const health = await securityManager.getHealthStatus();
    return {
      status: health.isHealthy ? "healthy" : "unhealthy",
      message: health.message,
      timestamp: new Date().toISOString(),
      details: health,
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

    const stats = await securityManager.getSecurityStats();
    return {
      totalRequests: stats.totalRequests || 0,
      blockedRequests: stats.blockedRequests || 0,
      rateLimitHits: stats.rateLimitHits || 0,
      csrfViolations: stats.csrfViolations || 0,
      xssAttempts: stats.xssAttempts || 0,
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
