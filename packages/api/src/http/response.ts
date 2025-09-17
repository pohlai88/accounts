/**
 * Standardized Response Helpers
 *
 * Consistent API response format following RESTful conventions
 */

export interface ApiResponse<T = any> {
  success: true;
  data: T;
  message?: string;
  meta?: {
    requestId?: string;
    timestamp: string;
    version?: string;
    pagination?: PaginationMeta;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: any;
    requestId?: string;
    timestamp: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    requestId?: string;
    timestamp: string;
    version?: string;
    pagination: PaginationMeta;
  };
}

export function createResponse<T>(
  data: T,
  message?: string,
  requestId?: string,
  meta?: Partial<ApiResponse<T>["meta"]>
): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "1.0.0",
      ...meta,
    },
  };
}

export function ok<T>(data: T, message?: string, requestId?: string): ApiResponse<T> {
  return createResponse(data, message, requestId);
}

export function created<T>(data: T, message: string = "Resource created successfully", requestId?: string): ApiResponse<T> {
  return createResponse(data, message, requestId);
}

export function accepted<T>(data: T, message: string = "Request accepted", requestId?: string): ApiResponse<T> {
  return createResponse(data, message, requestId);
}

export function noContent(requestId?: string): ApiResponse<null> {
  return createResponse(null, "No content", requestId);
}

export function paginated<T>(
  data: T[],
  pagination: PaginationMeta,
  message?: string,
  requestId?: string
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    message,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || "1.0.0",
      pagination,
    },
  };
}

export function notFound(message: string = "Resource not found", requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "NOT_FOUND",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function badRequest(message: string = "Bad request", details?: any, requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "BAD_REQUEST",
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function unauthorized(message: string = "Unauthorized", requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "UNAUTHORIZED",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function forbidden(message: string = "Forbidden", requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "FORBIDDEN",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function conflict(message: string = "Conflict", details?: any, requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "CONFLICT",
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function unprocessableEntity(message: string = "Unprocessable entity", details?: any, requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "UNPROCESSABLE_ENTITY",
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function tooManyRequests(message: string = "Too many requests", requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "TOO_MANY_REQUESTS",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function internalError(message: string = "Internal server error", requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "INTERNAL_ERROR",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function serviceUnavailable(message: string = "Service unavailable", requestId?: string): ApiErrorResponse {
  return {
    success: false,
    error: {
      message,
      code: "SERVICE_UNAVAILABLE",
      requestId,
      timestamp: new Date().toISOString(),
    },
  };
}

// Utility functions for common response patterns
export function successResponse<T>(data: T, statusCode: number = 200, message?: string, requestId?: string) {
  return {
    statusCode,
    body: ok(data, message, requestId),
  };
}

export function errorResponse(error: ApiErrorResponse, statusCode: number = 400) {
  return {
    statusCode,
    body: error,
  };
}

export function paginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
