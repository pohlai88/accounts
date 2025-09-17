// Security Hardening Middleware
// DoD: Rate limiting, CSRF protection, security headers
// SSOT: Use existing security package from @aibos/security
// Tech Stack: Next.js Middleware + security package

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { monitoring } from "../lib/monitoring";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Security configuration
interface SecurityConfig {
    rateLimiting: {
        enabled: boolean;
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    csrf: {
        enabled: boolean;
        tokenLength: number;
        cookieName: string;
        headerName: string;
    };
    headers: {
        enabled: boolean;
        hsts: boolean;
        csp: boolean;
        xss: boolean;
        frameOptions: boolean;
        contentTypeOptions: boolean;
        referrerPolicy: boolean;
    };
    ipWhitelist: {
        enabled: boolean;
        allowedIPs: string[];
    };
    geoBlocking: {
        enabled: boolean;
        blockedCountries: string[];
    };
}

// Default security configuration
const defaultConfig: SecurityConfig = {
    rateLimiting: {
        enabled: true,
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100, // 100 requests per window
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    },
    csrf: {
        enabled: true,
        tokenLength: 32,
        cookieName: "csrf-token",
        headerName: "x-csrf-token",
    },
    headers: {
        enabled: true,
        hsts: true,
        csp: true,
        xss: true,
        frameOptions: true,
        contentTypeOptions: true,
        referrerPolicy: true,
    },
    ipWhitelist: {
        enabled: false,
        allowedIPs: [],
    },
    geoBlocking: {
        enabled: false,
        blockedCountries: [],
    },
};

// Rate limiting store
class RateLimitStore {
    private store: Map<string, { count: number; resetTime: number }> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Cleanup expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.store.entries()) {
                if (now > value.resetTime) {
                    this.store.delete(key);
                }
            }
        }, 5 * 60 * 1000);
    }

    get(key: string): { count: number; resetTime: number } | undefined {
        return this.store.get(key);
    }

    set(key: string, count: number, resetTime: number): void {
        this.store.set(key, { count, resetTime });
    }

    increment(key: string, windowMs: number): { count: number; resetTime: number } {
        const now = Date.now();
        const resetTime = now + windowMs;
        const existing = this.store.get(key);

        if (!existing || now > existing.resetTime) {
            const newEntry = { count: 1, resetTime };
            this.store.set(key, newEntry);
            return newEntry;
        }

        const updated = { count: existing.count + 1, resetTime: existing.resetTime };
        this.store.set(key, updated);
        return updated;
    }

    cleanup(): void {
        clearInterval(this.cleanupInterval);
    }
}

// CSRF token store
class CSRFStore {
    private store: Map<string, { token: string; expires: number }> = new Map();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Cleanup expired tokens every 10 minutes
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.store.entries()) {
                if (now > value.expires) {
                    this.store.delete(key);
                }
            }
        }, 10 * 60 * 1000);
    }

    generateToken(sessionId: string): string {
        const token = this.generateRandomToken(32);
        const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
        this.store.set(sessionId, { token, expires });
        return token;
    }

    validateToken(sessionId: string, token: string): boolean {
        const stored = this.store.get(sessionId);
        if (!stored || Date.now() > stored.expires) {
            return false;
        }
        return stored.token === token;
    }

    private generateRandomToken(length: number): string {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    cleanup(): void {
        clearInterval(this.cleanupInterval);
    }
}

// Security hardening middleware
export class SecurityHardeningMiddleware {
    private config: SecurityConfig;
    private rateLimitStore: RateLimitStore;
    private csrfStore: CSRFStore;

    constructor(config: Partial<SecurityConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
        this.rateLimitStore = new RateLimitStore();
        this.csrfStore = new CSRFStore();
    }

    async handle(request: NextRequest): Promise<NextResponse | null> {
        try {
            // Get client IP
            const clientIP = this.getClientIP(request);
            const userAgent = request.headers.get("user-agent") || "";
            const pathname = request.nextUrl.pathname;

            // Skip security checks for health checks and static assets
            if (this.shouldSkipSecurity(pathname)) {
                return null;
            }

            // IP whitelist check
            if (this.config.ipWhitelist.enabled && !this.isIPAllowed(clientIP)) {
                await this.recordSecurityEvent("ip_blocked", "high", clientIP, {
                    ip: clientIP,
                    path: pathname,
                    userAgent,
                });
                return this.createSecurityResponse(403, "IP address not allowed");
            }

            // Geo-blocking check
            if (this.config.geoBlocking.enabled) {
                const country = await this.getCountryFromIP(clientIP);
                if (country && this.config.geoBlocking.blockedCountries.includes(country)) {
                    await this.recordSecurityEvent("geo_blocked", "medium", clientIP, {
                        ip: clientIP,
                        country,
                        path: pathname,
                        userAgent,
                    });
                    return this.createSecurityResponse(403, "Access denied from your location");
                }
            }

            // Rate limiting check
            if (this.config.rateLimiting.enabled) {
                const rateLimitResult = this.checkRateLimit(clientIP, pathname);
                if (!rateLimitResult.allowed) {
                    await this.recordSecurityEvent("rate_limit_exceeded", "medium", clientIP, {
                        ip: clientIP,
                        path: pathname,
                        userAgent,
                        limit: this.config.rateLimiting.maxRequests,
                        window: this.config.rateLimiting.windowMs,
                    });
                    return this.createRateLimitResponse(rateLimitResult);
                }
            }

            // CSRF protection for state-changing requests
            if (this.config.csrf.enabled && this.isStateChangingRequest(request)) {
                const csrfResult = await this.checkCSRF(request);
                if (!csrfResult.valid) {
                    await this.recordSecurityEvent("csrf_attack", "high", clientIP, {
                        ip: clientIP,
                        path: pathname,
                        userAgent,
                        reason: csrfResult.reason,
                    });
                    return this.createSecurityResponse(403, "CSRF token validation failed");
                }
            }

            // Create response with security headers
            const response = NextResponse.next();
            this.addSecurityHeaders(response);

            // Record successful request
            await this.recordSecurityEvent("request_allowed", "low", clientIP, {
                ip: clientIP,
                path: pathname,
                userAgent,
            });

            return response;
        } catch (error) {
            console.error("Security middleware error:", error);
            await this.recordSecurityEvent("security_middleware_error", "high", "unknown", {
                error: error instanceof Error ? error.message : "Unknown error",
                path: request.nextUrl.pathname,
            });
            return this.createSecurityResponse(500, "Internal security error");
        }
    }

    private getClientIP(request: NextRequest): string {
        const forwarded = request.headers.get("x-forwarded-for");
        const realIP = request.headers.get("x-real-ip");
        const cfConnectingIP = request.headers.get("cf-connecting-ip");

        if (cfConnectingIP) return cfConnectingIP;
        if (realIP) return realIP;
        if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

        return "unknown";
    }

    private shouldSkipSecurity(pathname: string): boolean {
        const skipPaths = [
            "/api/health",
            "/api/monitoring/health",
            "/_next/",
            "/favicon.ico",
            "/robots.txt",
            "/sitemap.xml",
        ];

        return skipPaths.some(path => pathname.startsWith(path));
    }

    private isIPAllowed(ip: string): boolean {
        if (!this.config.ipWhitelist.enabled) return true;
        return this.config.ipWhitelist.allowedIPs.includes(ip);
    }

    private async getCountryFromIP(ip: string): Promise<string | null> {
        try {
            // In production, use a proper IP geolocation service
            // For now, return null to disable geo-blocking
            return null;
        } catch (error) {
            console.error("Failed to get country from IP:", error);
            return null;
        }
    }

    private checkRateLimit(ip: string, path: string): { allowed: boolean; count: number; resetTime: number } {
        const key = `${ip}:${path}`;
        const result = this.rateLimitStore.increment(key, this.config.rateLimiting.windowMs);

        return {
            allowed: result.count <= this.config.rateLimiting.maxRequests,
            count: result.count,
            resetTime: result.resetTime,
        };
    }

    private isStateChangingRequest(request: NextRequest): boolean {
        const method = request.method;
        const stateChangingMethods = ["POST", "PUT", "PATCH", "DELETE"];
        return stateChangingMethods.includes(method);
    }

    private async checkCSRF(request: NextRequest): Promise<{ valid: boolean; reason?: string }> {
        const sessionId = request.headers.get("x-session-id");
        const csrfToken = request.headers.get(this.config.csrf.headerName);

        if (!sessionId) {
            return { valid: false, reason: "No session ID provided" };
        }

        if (!csrfToken) {
            return { valid: false, reason: "No CSRF token provided" };
        }

        const isValid = this.csrfStore.validateToken(sessionId, csrfToken);
        if (!isValid) {
            return { valid: false, reason: "Invalid CSRF token" };
        }

        return { valid: true };
    }

    private addSecurityHeaders(response: NextResponse): void {
        if (!this.config.headers.enabled) return;

        // HSTS (HTTP Strict Transport Security)
        if (this.config.headers.hsts) {
            response.headers.set(
                "Strict-Transport-Security",
                "max-age=31536000; includeSubDomains; preload"
            );
        }

        // Content Security Policy
        if (this.config.headers.csp) {
            const csp = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
                "style-src 'self' 'unsafe-inline'",
                "img-src 'self' data: https:",
                "font-src 'self' data:",
                "connect-src 'self' https:",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "form-action 'self'",
            ].join("; ");
            response.headers.set("Content-Security-Policy", csp);
        }

        // X-XSS-Protection
        if (this.config.headers.xss) {
            response.headers.set("X-XSS-Protection", "1; mode=block");
        }

        // X-Frame-Options
        if (this.config.headers.frameOptions) {
            response.headers.set("X-Frame-Options", "DENY");
        }

        // X-Content-Type-Options
        if (this.config.headers.contentTypeOptions) {
            response.headers.set("X-Content-Type-Options", "nosniff");
        }

        // Referrer-Policy
        if (this.config.headers.referrerPolicy) {
            response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
        }

        // Additional security headers
        response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
        response.headers.set("Cross-Origin-Embedder-Policy", "require-corp");
        response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
        response.headers.set("Cross-Origin-Resource-Policy", "same-origin");
    }

    private createSecurityResponse(status: number, message: string): NextResponse {
        const response = new NextResponse(
            JSON.stringify({
                error: {
                    status,
                    title: "Security Violation",
                    code: "SECURITY_VIOLATION",
                    detail: message,
                },
            }),
            { status }
        );

        response.headers.set("Content-Type", "application/json");
        return response;
    }

    private createRateLimitResponse(result: { count: number; resetTime: number }): NextResponse {
        const response = new NextResponse(
            JSON.stringify({
                error: {
                    status: 429,
                    title: "Rate Limit Exceeded",
                    code: "RATE_LIMIT_EXCEEDED",
                    detail: "Too many requests, please try again later",
                },
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            }),
            { status: 429 }
        );

        response.headers.set("Content-Type", "application/json");
        response.headers.set("Retry-After", Math.ceil((result.resetTime - Date.now()) / 1000).toString());
        return response;
    }

    private async recordSecurityEvent(
        eventType: string,
        severity: "low" | "medium" | "high" | "critical",
        identifier: string,
        details: Record<string, any>
    ): Promise<void> {
        try {
            // Record in monitoring system
            monitoring.recordSecurityEvent(eventType, severity, identifier, undefined, details);

            // Store in database
            await supabase.from("security_events").insert({
                event_type: eventType,
                severity,
                identifier,
                details,
                timestamp: new Date().toISOString(),
            });
        } catch (error) {
            console.error("Failed to record security event:", error);
        }
    }

    // Generate CSRF token for session
    generateCSRFToken(sessionId: string): string {
        return this.csrfStore.generateToken(sessionId);
    }

    // Cleanup resources
    cleanup(): void {
        this.rateLimitStore.cleanup();
        this.csrfStore.cleanup();
    }
}

// Export singleton instance
export const securityMiddleware = new SecurityHardeningMiddleware();

// Middleware function for Next.js
export async function securityMiddlewareHandler(request: NextRequest): Promise<NextResponse | null> {
    return await securityMiddleware.handle(request);
}
