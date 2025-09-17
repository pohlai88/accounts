/**
 * @aibos/api-gateway - Standardized API Response System
 *
 * Provides consistent response formatting across all API endpoints
 */

export type ApiResponse<T = unknown> = {
  success: boolean;
  status: number;
  message?: string;
  data?: T;
  error?: { code: string; message: string; details?: unknown };
};

function build<T>(status: number, body: Partial<ApiResponse<T>> = {}): ApiResponse<T> {
  return { success: status < 400, status, ...body };
}

/**
 * Success responses
 */
export const ok = <T>(data: T, message = "OK") => build<T>(200, { data, message });

export const created = <T>(data: T, message = "Created") => build<T>(201, { data, message });

export const accepted = <T>(data: T, message = "Accepted") => build<T>(202, { data, message });

export const noContent = (message = "No Content") => build(204, { message });

/**
 * Client error responses
 */
export const badRequest = (code = "BAD_REQUEST", message = "Bad request", details?: unknown) =>
  build(400, { error: { code, message, details } });

export const unauthorized = (code = "UNAUTHORIZED", message = "Unauthorized") =>
  build(401, { error: { code, message } });

export const forbidden = (code = "FORBIDDEN", message = "Forbidden") =>
  build(403, { error: { code, message } });

export const notFound = (code = "NOT_FOUND", message = "Not found") =>
  build(404, { error: { code, message } });

export const methodNotAllowed = (code = "METHOD_NOT_ALLOWED", message = "Method not allowed") =>
  build(405, { error: { code, message } });

export const conflict = (code = "CONFLICT", message = "Conflict", details?: unknown) =>
  build(409, { error: { code, message, details } });

export const unprocessableEntity = (code = "UNPROCESSABLE_ENTITY", message = "Unprocessable entity", details?: unknown) =>
  build(422, { error: { code, message, details } });

export const tooManyRequests = (code = "TOO_MANY_REQUESTS", message = "Too many requests") =>
  build(429, { error: { code, message } });

/**
 * Server error responses
 */
export const internalServerError = (
  code = "INTERNAL_ERROR",
  message = "Internal server error",
  details?: unknown,
) => build(500, { error: { code, message, details } });

export const badGateway = (code = "BAD_GATEWAY", message = "Bad gateway") =>
  build(502, { error: { code, message } });

export const serviceUnavailable = (code = "SERVICE_UNAVAILABLE", message = "Service unavailable") =>
  build(503, { error: { code, message } });

export const gatewayTimeout = (code = "GATEWAY_TIMEOUT", message = "Gateway timeout") =>
  build(504, { error: { code, message } });

/**
 * Convenience aliases for common responses
 */
export const badReq = badRequest;
export const serverErr = internalServerError;
