/**
 * @aibos/api-gateway - Middleware Exports
 *
 * Centralized middleware exports for API Gateway
 */

export * from "./cors";
export * from "./error";
export * from "./security";

// Re-export commonly used middleware
export { createCorsMiddleware, cors, defaultCorsConfig } from "./cors";
export { createErrorMiddleware, errorHandler, ValidationError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, RateLimitError } from "./error";
export { createSecurityMiddleware, security, validateRequest, defaultSecurityConfig } from "./security";
