/**
 * @aibos/api-gateway - API Gateway Package Exports
 *
 * Centralized API routing with authentication, rate limiting, and monitoring
 */

export * from "./gateway";
export * from "./rate-limit";
export * from "./logging";
export * from "./response";
export * from "./middleware";
export * from "./handler";

// Re-export commonly used types and functions
export { APIGateway, defaultGatewayConfig, type GatewayConfig, type GatewayStats } from "./gateway";

export {
  RateLimitService,
  TenantRateLimitService,
  UserRateLimitService,
  RATE_LIMIT_CONFIGS,
  type RateLimitConfig,
  type RateLimitStats,
} from "./rate-limit";

export { RequestLoggingService, type LogEntry, type LogStats } from "./logging";

export {
  cors,
  createCorsMiddleware,
  defaultCorsConfig,
  errorHandler,
  createErrorMiddleware,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  security,
  createSecurityMiddleware,
  validateRequest,
  defaultSecurityConfig,
} from "./middleware";

export {
  type ApiResponse,
  ok,
  created,
  accepted,
  noContent,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  methodNotAllowed,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalServerError,
  badGateway,
  serviceUnavailable,
  gatewayTimeout,
  // Convenience aliases
  badReq,
  serverErr,
} from "./response";
