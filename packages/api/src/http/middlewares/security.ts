/**
 * Security Middleware
 *
 * Security-focused middleware including rate limiting, security headers, and input validation
 */

import { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { AppError } from "./error.js";

export interface SecurityConfig {
    enableHelmet: boolean;
    enableRateLimit: boolean;
    rateLimitConfig: {
        windowMs: number;
        max: number;
        message: string;
        standardHeaders: boolean;
        legacyHeaders: boolean;
    };
    enableCSP: boolean;
    enableHSTS: boolean;
    trustedProxies: string[];
}

const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    enableHelmet: true,
    enableRateLimit: true,
    rateLimitConfig: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100, // limit each IP to 100 requests per windowMs
        message: "Too many requests from this IP, please try again later",
        standardHeaders: true,
        legacyHeaders: false,
    },
    enableCSP: true,
    enableHSTS: process.env.NODE_ENV === "production",
    trustedProxies: ["127.0.0.1", "::1"],
};

export function security(config: Partial<SecurityConfig> = {}) {
    const securityConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };
    const middlewares = [];

    // Helmet for security headers
    if (securityConfig.enableHelmet) {
        const helmetConfig: any = {
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
                    frameAncestors: ["'none'"],
                },
            } : false,
            hsts: securityConfig.enableHSTS ? {
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: true,
            } : false,
            frameguard: { action: 'deny' },
            crossOriginEmbedderPolicy: false, // Disable for API compatibility
        };

        middlewares.push(helmet(helmetConfig));
    }

    // Rate limiting
    if (securityConfig.enableRateLimit) {
        const rateLimitMiddleware = rateLimit({
            ...securityConfig.rateLimitConfig,
            handler: (req: Request, res: Response) => {
                const error = new AppError(
                    securityConfig.rateLimitConfig.message,
                    429,
                    "RATE_LIMIT_EXCEEDED"
                );
                res.status(429).json({
                    success: false,
                    error: {
                        message: error.message,
                        code: error.code,
                        requestId: (req as any).requestId,
                        timestamp: new Date().toISOString(),
                    },
                });
            },
            skip: (req: Request) => {
                // Skip rate limiting for health checks
                return req.path === "/health" || req.path === "/api/health";
            },
        });

        middlewares.push(rateLimitMiddleware);
    }

    return middlewares;
}

export function validateContentType(expectedTypes: string[] = ["application/json"]) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method === "GET" || req.method === "DELETE" || req.method === "OPTIONS") {
            return next();
        }

        const contentType = req.get("Content-Type");
        if (!contentType) {
            return next(new AppError(
                "Content-Type header is required",
                400,
                "MISSING_CONTENT_TYPE"
            ));
        }

        const isValidType = expectedTypes.some(type =>
            contentType.toLowerCase().includes(type.toLowerCase())
        );

        if (!isValidType) {
            return next(new AppError(
                `Content-Type must be one of: ${expectedTypes.join(", ")}`,
                400,
                "INVALID_CONTENT_TYPE"
            ));
        }

        next();
    };
}

export function validateRequestSize(maxSize: number = 10 * 1024 * 1024) { // 10MB default
    return (req: Request, res: Response, next: NextFunction) => {
        const contentLength = parseInt(req.get("Content-Length") || "0");

        if (contentLength > maxSize) {
            return next(new AppError(
                `Request body too large. Maximum size: ${maxSize} bytes`,
                413,
                "REQUEST_TOO_LARGE"
            ));
        }

        next();
    };
}

export function sanitizeInput() {
    return (req: Request, res: Response, next: NextFunction) => {
        // Basic input sanitization
        const sanitizeObject = (obj: any): any => {
            if (typeof obj === "string") {
                // Remove potentially dangerous characters
                return obj
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                    .replace(/javascript:/gi, "")
                    .replace(/on\w+\s*=/gi, "")
                    .trim();
            }

            if (Array.isArray(obj)) {
                return obj.map(sanitizeObject);
            }

            if (obj && typeof obj === "object") {
                const sanitized: any = {};
                for (const [key, value] of Object.entries(obj)) {
                    sanitized[key] = sanitizeObject(value);
                }
                return sanitized;
            }

            return obj;
        };

        if (req.body) {
            req.body = sanitizeObject(req.body);
        }

        if (req.query) {
            req.query = sanitizeObject(req.query);
        }

        next();
    };
}
