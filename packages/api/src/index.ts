/**
 * @aibos/api - API Server Package
 *
 * Production-ready API server with Express, security middleware, and API Gateway integration
 */

export { ApiServer, server } from "./server.js";
export { ApiClient, ApiError, createApiClient, apiClient } from "./client.js";

// HTTP Middlewares
export { createCors, corsMw } from "./http/middlewares/cors.js";
export { logging, createRequestLogger } from "./http/middlewares/logging.js";
export {
  wrapErrors,
  notFoundHandler,
  asyncHandler,
  AppError,
  createValidationError,
  createUnauthorizedError,
  createForbiddenError,
  createNotFoundError,
  createConflictError,
  createRateLimitError,
  createInternalError
} from "./http/middlewares/error.js";
export {
  security,
  validateContentType,
  validateRequestSize,
  sanitizeInput
} from "./http/middlewares/security.js";

// Response Helpers
export {
  createResponse,
  ok,
  created,
  accepted,
  noContent,
  paginated,
  notFound,
  badRequest,
  unauthorized,
  forbidden,
  conflict,
  unprocessableEntity,
  tooManyRequests,
  internalError,
  serviceUnavailable,
  successResponse,
  errorResponse,
  paginationMeta,
  type ApiResponse,
  type ApiErrorResponse,
  type PaginationMeta,
  type PaginatedResponse
} from "./http/response.js";

// Types
export type { ServerConfig } from "./server.js";
export type { ApiClientConfig, RequestOptions } from "./client.js";
