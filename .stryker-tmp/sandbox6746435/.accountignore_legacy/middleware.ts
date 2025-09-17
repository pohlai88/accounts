/**
 * 🔒 Production-Ready Security Middleware
 *
 * Enterprise-grade security middleware with comprehensive protection:
 * - Redis-based persistent rate limiting
 * - Enhanced CSP with nonce and reporting
 * - Real CSRF protection with origin validation
 * - Bot detection and specialized handling
 * - Structured security event logging
 * - Configurable security headers
 * - Comprehensive error handling
 */
// @ts-nocheck


import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SecurityConfig, SecurityHelpers } from "@/lib/security-config";
import { checkRateLimit, createRedisClient } from "@/lib/rate-limit";
import { getSecurityLogger } from "@/lib/security-logger";

// Initialize Redis client (lazy loading)
let redisClient: any = null;
let redisInitialized = false;

async function getRedisClient() {
  if (!redisInitialized) {
    redisInitialized = true;
    if (SecurityConfig.features.enableRedisRateLimit) {
      redisClient = await createRedisClient();
    }
  }
  return redisClient;
}

// Security logger instance
const securityLogger = getSecurityLogger();

/**
 * Enhanced client IP extraction with validation
 */
function getClientIP(req: NextRequest): string {
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    "unknown";

  // Validate IP format
  if (ip !== "unknown" && !SecurityHelpers.isValidIP(ip)) {
    return "unknown";
  }

  return ip;
}

/**
 * Enhanced CSRF validation with origin checking
 */
function isValidCSRF(req: NextRequest): boolean {
  // Skip CSRF for exempt paths
  if (SecurityHelpers.shouldSkipCSRF(req.nextUrl.pathname)) {
    return true;
  }

  // Only check CSRF for mutating requests
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
    return true;
  }

  // Double-submit cookie validation
  const token = req.headers.get("x-csrf-token");
  const cookie = req.cookies.get("csrf-token")?.value;

  if (!token || !cookie || token !== cookie) {
    return false;
  }

  // Additional origin/referrer validation if enabled
  if (SecurityConfig.features.enableOriginValidation) {
    const origin = req.headers.get("origin");
    const referrer = req.headers.get("referer");
    const host = req.headers.get("host");

    // Validate origin if present
    if (origin) {
      const allowedOrigins = [
        `https://${host}`,
        `http://${host}`, // Allow HTTP in development
      ];

      if (!allowedOrigins.includes(origin) && !SecurityHelpers.isAllowedOrigin(origin)) {
        return false;
      }
    }

    // Validate referrer if present
    if (referrer && host) {
      const allowedReferrers = [
        `https://${host}/`,
        `http://${host}/`, // Allow HTTP in development
      ];

      if (!allowedReferrers.some(allowed => referrer.startsWith(allowed))) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Build CSP header string
 */
function buildCSPHeader(nonce: string): string {
  const cspConfig = SecurityConfig.csp(nonce, SecurityConfig.isProd);
  return SecurityHelpers.buildCSP(cspConfig);
}

/**
 * Apply security headers to response
 */
function applySecurityHeaders(res: NextResponse, nonce: string): void {
  // Content Security Policy
  const csp = buildCSPHeader(nonce);
  res.headers.set("Content-Security-Policy", csp);

  // Other security headers
  const headers = SecurityConfig.headers(SecurityConfig.isProd);
  Object.entries(headers).forEach(([name, value]) => {
    res.headers.set(name, value);
  });

  // Report-To header for CSP reporting (if enabled)
  if (SecurityConfig.isProd && SecurityConfig.features.enableCspReporting) {
    res.headers.set(
      "Report-To",
      JSON.stringify({
        group: "csp-endpoint",
        max_age: 10886400,
        endpoints: [{ url: "/api/csp-violation" }],
      }),
    );
  }
}

/**
 * Handle rate limiting
 */
async function handleRateLimit(req: NextRequest): Promise<NextResponse | null> {
  try {
    const redis = await getRedisClient();
    const rateLimitResult = await checkRateLimit(req, redis);

    if (!rateLimitResult.success) {
      // Log rate limit violation
      await securityLogger.logRateLimit(
        getClientIP(req),
        req.nextUrl.pathname,
        req.method,
        req.headers.get("user-agent") || "unknown",
        {
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining,
          reset: rateLimitResult.reset,
          retryAfter: rateLimitResult.retryAfter,
        },
      );

      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "Too many requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimitResult.retryAfter || 60),
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": String(rateLimitResult.reset),
          },
        },
      );
    }

    return null;
  } catch (error) {
    console.error("Rate limiting error:", error);
    // Don't block requests if rate limiting fails
    return null;
  }
}

/**
 * Handle CSRF validation
 */
async function handleCSRF(req: NextRequest): Promise<NextResponse | null> {
  if (!isValidCSRF(req)) {
    // Log CSRF violation
    await securityLogger.logCSRFViolation(
      getClientIP(req),
      req.nextUrl.pathname,
      req.method,
      req.headers.get("user-agent") || "unknown",
      {
        hasToken: !!req.headers.get("x-csrf-token"),
        hasCookie: !!req.cookies.get("csrf-token"),
        origin: req.headers.get("origin"),
        referrer: req.headers.get("referer"),
      },
    );

    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  return null;
}

/**
 * Handle bot detection
 */
async function handleBotDetection(req: NextRequest): Promise<void> {
  const userAgent = req.headers.get("user-agent") || "unknown";

  if (SecurityHelpers.isLikelyBot(userAgent)) {
    // Log bot detection
    await securityLogger.logBotDetection(
      getClientIP(req),
      req.nextUrl.pathname,
      req.method,
      userAgent,
      {
        userAgent,
        detectionReason: "user_agent_pattern",
      },
    );
  }
}

/**
 * Main middleware function
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  try {
    // Generate per-request nonce
    const nonce = SecurityHelpers.generateNonce();

    // Clone request headers and inject nonce for server components
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set("x-nonce", nonce);

    // Create response
    const res = NextResponse.next({ request: { headers: reqHeaders } });

    // API route protection
    if (pathname.startsWith("/api/")) {
      // Rate limiting
      const rateLimitResponse = await handleRateLimit(req);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // CSRF protection
      const csrfResponse = await handleCSRF(req);
      if (csrfResponse) {
        return csrfResponse;
      }

      // Bot detection (logging only, don't block)
      await handleBotDetection(req);
    }

    // Apply security headers (skip for static assets)
    if (!SecurityHelpers.shouldSkipHeaders(pathname)) {
      applySecurityHeaders(res, nonce);
    }

    // Issue CSRF cookie for auth endpoints
    if (pathname.startsWith("/api/auth/")) {
      res.cookies.set("csrf-token", nonce, {
        path: "/",
        httpOnly: true,
        sameSite: "strict",
        secure: SecurityConfig.isProd,
        maxAge: 60 * 60, // 1 hour
      });
    }

    // Development logging
    if (SecurityConfig.isDev) {
      console.log(`[Security] ${req.method} ${pathname} from ${getClientIP(req)}`);
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);

    // Don't let middleware errors break the application
    // Return a minimal response with basic security headers
    const fallbackRes = NextResponse.next();

    if (SecurityConfig.isProd) {
      // Still set basic security headers in production
      fallbackRes.headers.set("X-Content-Type-Options", "nosniff");
      fallbackRes.headers.set("X-Frame-Options", "DENY");
      fallbackRes.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    }

    return fallbackRes;
  }
}

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap file)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};

// ---------- Backward Compatibility Utilities ----------

/**
 * Validate CSRF token (backward compatibility)
 */
export function validateCSRFToken(request: NextRequest): boolean {
  return isValidCSRF(request);
}

/**
 * Generate CSRF token (backward compatibility)
 */
export function generateCSRFToken(): string {
  return SecurityHelpers.generateNonce();
}

/**
 * Sanitize input (enhanced version)
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .replace(/data:/gi, "") // Remove data: protocol
    .replace(/vbscript:/gi, "") // Remove vbscript: protocol
    .trim();
}

/**
 * Validate origin (enhanced version)
 */
export function validateOrigin(request: NextRequest, allowedOrigins?: string[]): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  const origins = allowedOrigins || SecurityConfig.allowedOrigins;
  return SecurityHelpers.isAllowedOrigin(origin) || origins.includes(origin);
}

/**
 * Get client IP (enhanced version)
 */
export function clientIP(request: NextRequest): string {
  return getClientIP(request);
}

/**
 * Check if request is rate limited (enhanced version)
 */
export async function rateLimited(request: NextRequest): Promise<boolean> {
  try {
    const redis = await getRedisClient();
    const result = await checkRateLimit(request, redis);
    return !result.success;
  } catch (error) {
    console.error("Rate limit check error:", error);
    return false; // Don't block on errors
  }
}

// Export security utilities for backward compatibility
export const SecurityUtils = {
  validateCSRFToken,
  generateCSRFToken,
  sanitizeInput,
  validateOrigin,
  clientIP,
  rateLimited,
  // New utilities
  getClientIP,
  isValidCSRF,
  buildCSPHeader,
};
