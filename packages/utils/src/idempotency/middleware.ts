// Idempotency Middleware for API Gateway
import { ApiRequest, GatewayResponse, Middleware } from "@aibos/utils/api-gateway/types.js";
import { IdempotencyManager } from "./manager.js";

export function createIdempotencyMiddleware(idempotencyManager: IdempotencyManager): Middleware {
  return {
    name: "idempotency",
    execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
      // Only apply idempotency to mutation requests
      if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return await next();
      }

      // Extract idempotency key from headers
      const idempotencyKey = req.headers["idempotency-key"] || req.headers["Idempotency-Key"];

      if (!idempotencyKey) {
        // No idempotency key provided, continue without idempotency
        return await next();
      }

      // Extract user context
      const userId = req.user?.id || "anonymous";
      const tenantId = req.user?.tenantId || "default";
      const operation = `${req.method}:${req.path}`;

      // Prepare request data for hashing
      const requestData = {
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.body,
        headers: {
          "content-type": req.headers["content-type"],
          authorization: req.headers["authorization"],
        },
      };

      try {
        // Execute with idempotency
        const result = await idempotencyManager.execute(
          idempotencyKey,
          userId,
          tenantId,
          operation,
          requestData,
          async () => {
            // Execute the actual request
            const response = await next();
            return response;
          },
          {
            ttl: getIdempotencyTTL(req.path),
            maxRetries: 3,
            retryAfter: 60,
          },
        );

        // Handle different result statuses
        if (result.status === "completed") {
          // Return the cached response
          const response = result.response as GatewayResponse;
          response.headers["X-Idempotency-Key"] = idempotencyKey;
          response.headers["X-Idempotency-Status"] = "completed";
          return response;
        }

        if (result.status === "failed") {
          return {
            status: 500,
            headers: { "Content-Type": "application/json" },
            body: {
              error: "Operation failed",
              message: result.error,
              idempotencyKey,
            },
          };
        }

        if (result.status === "pending") {
          return {
            status: 409,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": result.retryAfter?.toString() || "60",
            },
            body: {
              error: "Operation in progress",
              message: "Please retry after the specified time",
              idempotencyKey,
              retryAfter: result.retryAfter,
            },
          };
        }

        // Fallback to normal execution
        return await next();
      } catch (error) {
        // Log idempotency middleware error to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
          // eslint-disable-next-line no-console
          console.error("Idempotency middleware error:", error);
        }

        // If idempotency fails, continue without it
        return await next();
      }
    },
  };
}

/**
 * Get idempotency TTL based on path
 */
function getIdempotencyTTL(path: string): number {
  // Different TTL for different operations
  if (path.startsWith("/api/invoices") || path.startsWith("/api/payments")) {
    return 3600; // 1 hour for financial operations
  }

  if (path.startsWith("/api/customers") || path.startsWith("/api/accounts")) {
    return 1800; // 30 minutes for master data
  }

  if (path.startsWith("/api/journals")) {
    return 7200; // 2 hours for journal entries
  }

  // Default TTL
  return 900; // 15 minutes
}

/**
 * Idempotency key validation middleware
 */
export function createIdempotencyValidationMiddleware(): Middleware {
  return {
    name: "idempotencyValidation",
    execute: async (req: ApiRequest, next: () => Promise<GatewayResponse>) => {
      // Only validate mutation requests
      if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        return await next();
      }

      const idempotencyKey = req.headers["idempotency-key"] || req.headers["Idempotency-Key"];

      if (idempotencyKey) {
        // Validate idempotency key format
        if (!isValidIdempotencyKey(idempotencyKey)) {
          return {
            status: 400,
            headers: { "Content-Type": "application/json" },
            body: {
              error: "Invalid idempotency key",
              message: "Idempotency key must be a valid UUID or hex string",
            },
          };
        }
      }

      return await next();
    },
  };
}

/**
 * Validate idempotency key format
 */
function isValidIdempotencyKey(key: string): boolean {
  // Allow UUIDs and hex strings
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const hexRegex = /^[0-9a-f]{32,64}$/i;

  return uuidRegex.test(key) || hexRegex.test(key);
}
