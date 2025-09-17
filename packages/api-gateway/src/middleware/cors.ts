/**
 * @aibos/api-gateway - CORS Middleware
 *
 * Enhanced CORS middleware with security headers and origin validation
 */

import { Request, Response, NextFunction } from "express";

export interface CorsConfig {
    origins: string[];
    credentials: boolean;
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders: string[];
    maxAge: number;
}

export const defaultCorsConfig: CorsConfig = {
    origins: process.env.CORS_ORIGINS?.split(",") || ["http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Tenant-ID",
        "X-User-ID",
        "X-Request-ID",
        "X-API-Key",
    ],
    exposedHeaders: ["X-Request-ID", "X-Rate-Limit-Remaining"],
    maxAge: 86400, // 24 hours
};

export function createCorsMiddleware(config: Partial<CorsConfig> = {}) {
    const corsConfig = { ...defaultCorsConfig, ...config };

    return (req: Request, res: Response, next: NextFunction) => {
        const origin = req.headers.origin as string;

        // Check if origin is allowed
        const isAllowedOrigin = corsConfig.origins.includes("*") ||
            corsConfig.origins.includes(origin);

        if (isAllowedOrigin) {
            res.setHeader("Access-Control-Allow-Origin", origin || "*");
        } else {
            res.setHeader("Access-Control-Allow-Origin", corsConfig.origins[0] || "*");
        }

        // Set CORS headers
        res.setHeader("Access-Control-Allow-Credentials", corsConfig.credentials.toString());
        res.setHeader("Access-Control-Allow-Methods", corsConfig.methods.join(", "));
        res.setHeader("Access-Control-Allow-Headers", corsConfig.allowedHeaders.join(", "));
        res.setHeader("Access-Control-Expose-Headers", corsConfig.exposedHeaders.join(", "));
        res.setHeader("Access-Control-Max-Age", corsConfig.maxAge.toString());
        res.setHeader("Vary", "Origin");

        // Handle preflight requests
        if (req.method === "OPTIONS") {
            res.status(204).end();
            return;
        }

        next();
    };
}

// Convenience function for common CORS setup
export const cors = createCorsMiddleware;
