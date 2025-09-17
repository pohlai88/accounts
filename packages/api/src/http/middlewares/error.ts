/**
 * Error Handling Middleware
 *
 * Centralized error handling with proper HTTP status codes and logging
 */

import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
    statusCode?: number;
    code?: string;
    details?: any;
    isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly details?: any;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = 500,
        code: string = "INTERNAL_ERROR",
        details?: any,
        isOperational: boolean = true
    ) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.isOperational = isOperational;

        Error.captureStackTrace(this, this.constructor);
    }
}

export interface ErrorResponse {
    success: false;
    error: {
        message: string;
        code: string;
        details?: any;
        requestId?: string;
        timestamp: string;
    };
}

export function wrapErrors() {
    return (error: ApiError, req: Request, res: Response, next: NextFunction) => {
        // Log error details
        console.error("API Error:", {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            stack: error.stack,
            requestId: (req as any).requestId,
            url: req.url,
            method: req.method,
            body: req.body,
        });

        // Determine status code
        const statusCode = error.statusCode || 500;
        const code = error.code || "INTERNAL_ERROR";
        const message = error.isOperational ? error.message : "Internal Server Error";

        // Create error response
        const errorResponse: ErrorResponse = {
            success: false,
            error: {
                message,
                code,
                details: error.details,
                requestId: (req as any).requestId,
                timestamp: new Date().toISOString(),
            },
        };

        // Send error response
        res.status(statusCode).json(errorResponse);
    };
}

export function notFoundHandler() {
    return (req: Request, res: Response, next: NextFunction) => {
        const error = new AppError(
            `Route ${req.method} ${req.originalUrl} not found`,
            404,
            "ROUTE_NOT_FOUND"
        );
        next(error);
    };
}

export function asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

// Common error creators
export function createValidationError(message: string, details?: any) {
    return new AppError(message, 400, "VALIDATION_ERROR", details);
}

export function createUnauthorizedError(message: string = "Unauthorized") {
    return new AppError(message, 401, "UNAUTHORIZED");
}

export function createForbiddenError(message: string = "Forbidden") {
    return new AppError(message, 403, "FORBIDDEN");
}

export function createNotFoundError(message: string = "Resource not found") {
    return new AppError(message, 404, "NOT_FOUND");
}

export function createConflictError(message: string, details?: any) {
    return new AppError(message, 409, "CONFLICT", details);
}

export function createRateLimitError(message: string = "Too many requests") {
    return new AppError(message, 429, "RATE_LIMIT_EXCEEDED");
}

export function createInternalError(message: string = "Internal server error", details?: any) {
    return new AppError(message, 500, "INTERNAL_ERROR", details, false);
}
