/**
 * @aibos/contracts - API Types (SSOT)
 *
 * Single source of truth for API contracts following RFC 7807 Problem Details
 * and the integration strategy requirements
 */

export type SortOrder = "asc" | "desc";

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: SortOrder;
}

export interface FilterParams {
  search?: string;
  status?: string;
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
}

/**
 * RFC 7807 Problem Details (+ app-specific fields).
 * Do not leak stack traces to clients.
 */
export interface Problem {
  type: string; // URI reference identifying the problem type
  title: string; // short, human-readable summary
  status: number; // HTTP status code
  detail?: string; // human-readable explanation
  instance?: string; // request path
  code?: string; // app/domain-specific error code
  errors?: Record<string, string[]>; // field-level validation errors
}

export interface Meta {
  total?: number;
  page?: number;
  limit?: number;
}

export interface EnvelopeBase {
  timestamp: string; // ISO 8601
  requestId: string; // correlation id propagated across services
  traceId?: string; // optional OpenTelemetry trace id
}

export interface ApiSuccess<T> extends EnvelopeBase {
  success: true;
  data: T;
  meta?: Meta;
}

export interface ApiFailure extends EnvelopeBase {
  success: false;
  error: Problem;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

// Type guard for safe consumption
export const isSuccess = <T>(r: ApiResponse<T>): r is ApiSuccess<T> => r.success === true;
