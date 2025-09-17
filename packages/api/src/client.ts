/**
 * API Client
 *
 * Type-safe HTTP client for API communication with built-in error handling and retries
 */

import { ApiResponse, ApiErrorResponse } from "./http/response.js";

export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  retryDelay: number;
  headers: Record<string, string>;
  credentials: RequestCredentials;
}

export interface RequestOptions {
  method: string;
  path: string;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
}

export class ApiClient {
  private config: ApiClientConfig;
  private abortController?: AbortController;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = {
      baseUrl: "http://localhost:3001",
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000, // 1 second
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "AI-BOS-API-Client/1.0.0",
      },
      credentials: "include",
      ...config,
    };
  }

  private async request<T>(
    options: RequestOptions,
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    const {
      method,
      path,
      body,
      headers = {},
      timeout = this.config.timeout,
      retries = this.config.retries,
    } = options;

    const url = `${this.config.baseUrl}${path}`;
    const requestHeaders = { ...this.config.headers, ...headers };

    // Create abort controller for timeout
    this.abortController = new AbortController();
    const timeoutId = setTimeout(() => this.abortController?.abort(), timeout);

    try {
      const init: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: this.config.credentials,
        signal: this.abortController.signal,
      };

      if (body && method !== "GET") {
        init.body = typeof body === "string" ? body : JSON.stringify(body);
      }

      const response = await fetch(url, init);
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        const errorResponse = data as ApiErrorResponse;
        throw new ApiError(
          errorResponse.error.message,
          response.status,
          errorResponse.error.code,
          errorResponse.error.details
        );
      }

      return data as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      // Handle network errors and retries
      if (attempt < retries && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelay * attempt);
        return this.request<T>(options, attempt + 1);
      }

      throw new ApiError(
        error instanceof Error ? error.message : "Unknown error occurred",
        0,
        "NETWORK_ERROR"
      );
    }
  }

  private isRetryableError(error: any): boolean {
    // Retry on network errors, timeouts, and 5xx status codes
    if (error.name === "AbortError") return true;
    if (error.name === "TypeError" && error.message.includes("fetch")) return true;
    if (error instanceof ApiError && error.statusCode >= 500) return true;
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // HTTP Methods
  async get<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "GET", path, headers });
  }

  async post<T>(path: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "POST", path, body, headers });
  }

  async put<T>(path: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "PUT", path, body, headers });
  }

  async patch<T>(path: string, body?: any, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "PATCH", path, body, headers });
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<ApiResponse<T>> {
    return this.request<T>({ method: "DELETE", path, headers });
  }

  // Convenience methods for common operations
  async healthCheck(): Promise<ApiResponse<{ service: string; status: string; timestamp: string }>> {
    return this.get("/api/health");
  }

  async testConnection(): Promise<ApiResponse<{ ping: string; received: any }>> {
    return this.post("/api/test", { ping: "pong" });
  }

  // Utility methods
  setHeader(key: string, value: string): void {
    this.config.headers[key] = value;
  }

  removeHeader(key: string): void {
    delete this.config.headers[key];
  }

  setAuthToken(token: string): void {
    this.setHeader("Authorization", `Bearer ${token}`);
  }

  setApiKey(key: string): void {
    this.setHeader("X-API-Key", key);
  }

  setRequestId(id: string): void {
    this.setHeader("X-Request-ID", id);
  }

  abort(): void {
    this.abortController?.abort();
  }

  // Configuration getters
  get baseUrl(): string {
    return this.config.baseUrl;
  }

  get timeout(): number {
    return this.config.timeout;
  }

  get retries(): number {
    return this.config.retries;
  }
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, statusCode: number, code: string, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

// Factory function for creating API clients
export function createApiClient(config?: Partial<ApiClientConfig>): ApiClient {
  return new ApiClient(config);
}

// Default client instance
export const apiClient = createApiClient();
