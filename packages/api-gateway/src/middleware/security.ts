/**
 * @aibos/api-gateway - Security Middleware
 *
 * Security headers and request validation middleware
 */

import { Request, Response, NextFunction } from "express";
import helmet from "helmet";

export interface SecurityConfig {
    enableHelmet: boolean;
    enableCSP: boolean;
    enableHSTS: boolean;
    enableXSSProtection: boolean;
    enableNoSniff: boolean;
    enableFrameOptions: boolean;
    maxRequestSize: number;
    allowedMethods: string[];
}

export const defaultSecurityConfig: SecurityConfig = {
    enableHelmet: true,
    enableCSP: true,
    enableHSTS: true,
    enableXSSProtection: true,
    enableNoSniff: true,
    enableFrameOptions: true,
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

export function createSecurityMiddleware(config: Partial<SecurityConfig> = {}) {
    const securityConfig = { ...defaultSecurityConfig, ...config };

    return (req: Request, res: Response, next: NextFunction) => {
        // Method validation
        if (!securityConfig.allowedMethods.includes(req.method)) {
            res.status(405).json({
                success: false,
                status: 405,
                error: {
                    code: "METHOD_NOT_ALLOWED",
                    message: `Method ${req.method} not allowed`,
                },
            });
            return;
        }

        // Request size validation
        const contentLength = parseInt(req.headers["content-length"] || "0");
        if (contentLength > securityConfig.maxRequestSize) {
            res.status(413).json({
                success: false,
                status: 413,
                error: {
                    code: "PAYLOAD_TOO_LARGE",
                    message: "Request payload too large",
                },
            });
            return;
        }

        // Security headers
        if (securityConfig.enableHelmet) {
            helmet({
                contentSecurityPolicy: securityConfig.enableCSP ? {
                    directives: {
                        defaultSrc: ["'self'"],
                        styleSrc: ["'self'", "'unsafe-inline'"],
                        scriptSrc: ["'self'"],
                        imgSrc: ["'self'", "data:", "https:"],
                        connectSrc: ["'self'"],
                        fontSrc: ["'self'"],
                        objectSrc: ["'none'"],
                        mediaSrc: ["'self'"],
                        frameSrc: ["'none'"],
                    },
                } : false,
                hsts: securityConfig.enableHSTS ? {
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true,
                } : false,
                xssFilter: securityConfig.enableXSSProtection,
                noSniff: securityConfig.enableNoSniff,
                frameguard: securityConfig.enableFrameOptions ? { action: "deny" } : false,
            })(req, res, next);
        } else {
            next();
        }
    };
}

// Convenience function for common security setup
export const security = createSecurityMiddleware;

// Request validation middleware
export function validateRequest(req: Request, res: Response, next: NextFunction) {
    // Validate required headers for API requests
    if (req.path.startsWith("/api/")) {
        const tenantId = req.headers["x-tenant-id"];
        const requestId = req.headers["x-request-id"];

        if (!tenantId) {
            res.status(400).json({
                success: false,
                status: 400,
                error: {
                    code: "MISSING_TENANT_ID",
                    message: "X-Tenant-ID header is required for API requests",
                },
            });
            return;
        }

        // Generate request ID if not provided
        if (!requestId) {
            req.headers["x-request-id"] = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        }
    }

    next();
}
