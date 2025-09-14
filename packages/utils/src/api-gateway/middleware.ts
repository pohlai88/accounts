// API Gateway Middleware
import { ApiRequest, GatewayResponse, Middleware } from "./types";

/**
 * Authentication Middleware
 * Validates JWT tokens and extracts user context
 */
export const authMiddleware: Middleware = {
  name: "auth",
  execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return {
          status: 401,
          headers: { "Content-Type": "application/json" },
          body: { error: "Missing or invalid authorization header" },
        };
      }

      // const token = authHeader.substring(7);

      // TODO: Implement JWT validation with Supabase
      // For now, we'll extract basic user info from token
      // In production, this should validate the JWT signature

      // Mock user extraction - replace with real JWT validation
      const mockUser = {
        id: "user-123",
        email: "user@example.com",
        tenantId: "tenant-123",
        role: "admin",
      };

      req.user = mockUser;
      return await next();
    } catch {
      return {
        status: 401,
        headers: { "Content-Type": "application/json" },
        body: { error: "Invalid token" },
      };
    }
  },
};

/**
 * Rate Limiting Middleware
 * Implements rate limiting per user/IP
 */
export const rateLimitMiddleware = (windowMs: number, max: number): Middleware => ({
  name: "rateLimit",
  execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
    // TODO: Implement Redis-based rate limiting
    // For now, we'll use in-memory storage (not production-ready)

    const key = req.user?.id || req.headers["x-forwarded-for"] || "anonymous";
    const now = Date.now();

    // Simple in-memory rate limiting (replace with Redis in production)
    if (!global.rateLimitStore) {
      global.rateLimitStore = new Map();
    }

    const userLimits = global.rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > userLimits.resetTime) {
      userLimits.count = 0;
      userLimits.resetTime = now + windowMs;
    }

    if (userLimits.count >= max) {
      return {
        status: 429,
        headers: { "Content-Type": "application/json" },
        body: { error: "Rate limit exceeded" },
      };
    }

    userLimits.count++;
    global.rateLimitStore.set(key, userLimits);

    return await next();
  },
});

/**
 * CORS Middleware
 * Handles Cross-Origin Resource Sharing
 */
export const corsMiddleware: Middleware = {
  name: "cors",
  execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
    const response = await next();

    // Add CORS headers
    response.headers["Access-Control-Allow-Origin"] = "*";
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
    response.headers["Access-Control-Max-Age"] = "86400";

    return response;
  },
};

/**
 * Logging Middleware
 * Logs requests and responses
 */
export const loggingMiddleware: Middleware = {
  name: "logging",
  execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
    const startTime = Date.now();

    console.log(`[API Gateway] ${req.method} ${req.path} - Start`);

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      console.log(`[API Gateway] ${req.method} ${req.path} - ${response.status} - ${duration}ms`);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[API Gateway] ${req.method} ${req.path} - Error - ${duration}ms`, error);
      throw error;
    }
  },
};

/**
 * Error Handling Middleware
 * Catches and formats errors
 */
export const errorHandlingMiddleware: Middleware = {
  name: "errorHandling",
  execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
    try {
      return await next();
    } catch (error) {
      console.error("[API Gateway] Unhandled error:", error);

      return {
        status: 500,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      };
    }
  },
};

/**
 * Request Validation Middleware
 * Validates request structure and required fields
 */
export const validationMiddleware = (_schema: unknown): Middleware => ({
  name: "validation",
  execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
    try {
      // TODO: Implement schema validation with Zod
      // For now, we'll do basic validation

      if (req.method === "POST" || req.method === "PUT") {
        if (!req.body) {
          return {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: { error: "Request body is required" },
          };
        }
      }

      return await next();
    } catch (error) {
      return {
        status: 400,
        headers: { "Content-Type": "application/json" },
        body: {
          error: "Validation failed",
          details: error instanceof Error ? error.message : "Unknown validation error",
        },
      };
    }
  },
});

// Global rate limit store (in-memory, not production-ready)
declare global {
  var rateLimitStore: Map<string, { count: number; resetTime: number }> | undefined;
}
