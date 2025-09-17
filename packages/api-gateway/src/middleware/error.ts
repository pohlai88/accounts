/**
 * @aibos/api-gateway - Error Handling Middleware
 *
 * Centralized error handling with logging and standardized responses
 */

import { Request, Response, NextFunction } from "express";
import { serverErr, badRequest } from "../response";

export interface ErrorDetails {
    requestId?: string;
    timestamp: string;
    path: string;
    method: string;
    userAgent?: string;
    ip?: string;
    tenantId?: string;
    userId?: string;
}

export function createErrorMiddleware(options: {
    logErrors?: boolean;
    includeStack?: boolean;
} = {}) {
    const { logErrors = true, includeStack = false } = options;

    return (error: Error, req: Request, res: Response, _next: NextFunction) => {
        const requestId = req.headers["x-request-id"] as string;
        const timestamp = new Date().toISOString();

        // Log error details
        if (logErrors) {
            console.error("API Gateway Error:", {
                message: error.message,
                stack: includeStack ? error.stack : undefined,
                requestId,
                path: req.path,
                method: req.method,
                timestamp,
                tenantId: req.headers["x-tenant-id"],
                userId: req.headers["x-user-id"],
            });
        }

        // Determine error type and status code
        let statusCode = 500;
        let errorCode = "INTERNAL_ERROR";
        let message = "An unexpected error occurred";

        if (error.name === "ValidationError") {
            statusCode = 400;
            errorCode = "VALIDATION_ERROR";
            message = error.message;
        } else if (error.name === "UnauthorizedError") {
            statusCode = 401;
            errorCode = "UNAUTHORIZED";
            message = "Authentication required";
        } else if (error.name === "ForbiddenError") {
            statusCode = 403;
            errorCode = "FORBIDDEN";
            message = "Access denied";
        } else if (error.name === "NotFoundError") {
            statusCode = 404;
            errorCode = "NOT_FOUND";
            message = "Resource not found";
        } else if (error.name === "ConflictError") {
            statusCode = 409;
            errorCode = "CONFLICT";
            message = error.message;
        } else if (error.name === "RateLimitError") {
            statusCode = 429;
            errorCode = "TOO_MANY_REQUESTS";
            message = "Rate limit exceeded";
        }

        // Create error details
        const errorDetails: ErrorDetails = {
            requestId,
            timestamp,
            path: req.path,
            method: req.method,
            userAgent: req.headers["user-agent"],
            ip: req.ip || req.connection.remoteAddress,
            tenantId: req.headers["x-tenant-id"] as string,
            userId: req.headers["x-user-id"] as string,
        };

        // Send standardized error response
        if (statusCode === 400) {
            res.status(statusCode).json(badRequest(errorCode, message, errorDetails));
        } else {
            res.status(statusCode).json(serverErr(errorCode, message, errorDetails));
        }
    };
}

// Convenience function for common error handling
export const errorHandler = createErrorMiddleware;

// Custom error classes
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ValidationError";
    }
}

export class UnauthorizedError extends Error {
    constructor(message: string = "Authentication required") {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends Error {
    constructor(message: string = "Access denied") {
        super(message);
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends Error {
    constructor(message: string = "Resource not found") {
        super(message);
        this.name = "NotFoundError";
    }
}

export class ConflictError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ConflictError";
    }
}

export class RateLimitError extends Error {
    constructor(message: string = "Rate limit exceeded") {
        super(message);
        this.name = "RateLimitError";
    }
}
