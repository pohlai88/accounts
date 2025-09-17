/**
 * @aibos/utils - API Client (SSOT Compliant)
 *
 * Follows the integration strategy and uses contracts as single source of truth
 * Implements RFC 7807 Problem Details and proper error handling
 */
// @ts-nocheck


// Define types locally to avoid dependency issues
export interface Problem {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  code?: string;
  errors?: Record<string, string[]>;
}

export interface EnvelopeBase {
  timestamp: string;
  requestId: string;
  traceId?: string;
}

export interface ApiSuccess<T> extends EnvelopeBase {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export interface ApiFailure extends EnvelopeBase {
  success: false;
  error: Problem;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export const isSuccess = <T>(r: ApiResponse<T>): r is ApiSuccess<T> => r.success === true;

// API Client Configuration following SSOT principles
export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

// Request Context for audit and tracing (following existing patterns)
export interface ApiRequestContext {
  tenantId: string;
  companyId: string;
  userId: string;
  userRole: string;
  requestId: string;
}

// API Client Class following the integration strategy
export class ApiClient {
  private config: ApiClientConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: ApiClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };

    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
    };
  }

  /**
   * Make a type-safe API request with automatic error handling
   * Follows RFC 7807 Problem Details specification
   */
  async request<T>(
    endpoint: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      body?: unknown;
      query?: Record<string, string | number | boolean>;
      headers?: Record<string, string>;
      context?: ApiRequestContext;
    } = {},
  ): Promise<ApiResponse<T>> {
    const { method = "GET", body, query, headers = {}, context } = options;

    try {
      // Build URL with query parameters
      const url = new globalThis.URL(endpoint, this.config.baseUrl);
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
          }
        });
      }

      // Prepare headers following SSOT patterns
      const requestHeaders = {
        ...this.defaultHeaders,
        ...headers,
        ...(context && {
          "X-Tenant-Id": context.tenantId,
          "X-Company-Id": context.companyId,
          "X-User-Id": context.userId,
          "X-User-Role": context.userRole,
          "X-Request-Id": context.requestId,
        }),
      };

      // Make request with timeout
      const controller = new globalThis.AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await globalThis.fetch(url.toString(), {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Parse response following RFC 7807
      const responseData = await response.json();

      if (!response.ok) {
        return this.createErrorResponse(responseData, response.status, context);
      }

      return this.createSuccessResponse(responseData as T, context);
    } catch (error) {
      return this.handleRequestError(error, context);
    }
  }

  /**
   * Create success response following SSOT patterns
   */
  private createSuccessResponse<T>(data: T, context?: ApiRequestContext): ApiSuccess<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || this.generateRequestId(),
      traceId: this.generateTraceId(),
    };
  }

  /**
   * Create error response following RFC 7807 Problem Details
   */
  private createErrorResponse(
    errorData: unknown,
    status: number,
    context?: ApiRequestContext,
  ): ApiFailure {
    const errorObj = errorData as Record<string, unknown>;
    const problem: Problem = {
      type: (errorObj?.type as string) || "about:blank",
      title: (errorObj?.title as string) || "Request Failed",
      status,
      detail: errorObj?.detail as string,
      instance: errorObj?.instance as string,
      code: errorObj?.code as string,
      errors: errorObj?.errors as Record<string, string[]>,
    };

    return {
      success: false,
      error: problem,
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || this.generateRequestId(),
      traceId: this.generateTraceId(),
    };
  }

  /**
   * Handle request errors following SSOT error handling patterns
   */
  private handleRequestError(error: unknown, context?: ApiRequestContext): ApiFailure {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: {
          type: "timeout",
          title: "Request Timeout",
          status: 408,
          detail: "The request took too long to complete",
        },
        timestamp: new Date().toISOString(),
        requestId: context?.requestId || this.generateRequestId(),
        traceId: this.generateTraceId(),
      };
    }

    return {
      success: false,
      error: {
        type: "network",
        title: "Network Error",
        status: 0,
        detail: error instanceof Error ? error.message : "Unknown network error",
      },
      timestamp: new Date().toISOString(),
      requestId: context?.requestId || this.generateRequestId(),
      traceId: this.generateTraceId(),
    };
  }

  /**
   * Generate request ID following SSOT patterns
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID for OpenTelemetry integration
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // HTTP method helpers following SSOT patterns
  async get<T>(
    endpoint: string,
    options?: Omit<Parameters<typeof this.request>[1], "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<Parameters<typeof this.request>[1], "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<Parameters<typeof this.request>[1], "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: Omit<Parameters<typeof this.request>[1], "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  async delete<T>(
    endpoint: string,
    options?: Omit<Parameters<typeof this.request>[1], "method" | "body">,
  ) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

// Default API client instance following SSOT configuration
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  apiKey: process.env.NEXT_PUBLIC_API_KEY,
});

// Utility function to create request context following SSOT patterns
export function createApiRequestContext(
  tenantId: string,
  companyId: string,
  userId: string,
  userRole: string,
  requestId?: string,
): ApiRequestContext {
  return {
    tenantId,
    companyId,
    userId,
    userRole,
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

// Error handling utilities following SSOT patterns
export class ApiError extends Error {
  constructor(
    public problem: Problem,
    public requestId: string,
  ) {
    super(problem.title);
    this.name = "ApiError";
  }

  get statusCode() {
    return this.problem.status;
  }

  get errorCode() {
    return this.problem.code;
  }

  get validationErrors() {
    return this.problem.errors;
  }
}

// Helper to throw API errors following SSOT patterns
export function throwApiError(response: ApiFailure) {
  throw new ApiError(response.error, response.requestId);
}

// Helper to handle API responses following SSOT patterns
export function handleApiResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data;
  } else {
    throwApiError(response);
    // This line will never be reached due to throwApiError throwing
    return undefined as never;
  }
}
