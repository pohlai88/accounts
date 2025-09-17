/**
 * @aibos/ui - Centralized API Client
 *
 * Provides a robust, type-safe API client with:
 * - Automatic authentication token injection
 * - Request/response interceptors
 * - Retry logic for failed requests
 * - Consistent error handling
 * - Type-safe responses
 */

import { AuthUser } from "../AuthProvider.js";

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        type: string;
        title: string;
        status: number;
        code?: string;
        detail?: string;
        errors?: Record<string, string[]>;
    };
    timestamp: string;
    requestId: string;
}

// API Error Class
export class ApiError extends Error {
    public readonly status: number;
    public readonly code?: string;
    public readonly detail?: string;
    public readonly errors?: Record<string, string[]>;
    public readonly requestId: string;

    constructor(response: ApiResponse) {
        super(response.error?.title || "API Error");
        this.name = "ApiError";
        this.status = response.error?.status || 500;
        this.code = response.error?.code;
        this.detail = response.error?.detail;
        this.errors = response.error?.errors;
        this.requestId = response.requestId;
    }
}

// Request Configuration
export interface RequestConfig {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string>;
    body?: any;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
}

// API Client Configuration
export interface ApiClientConfig {
    baseUrl: string;
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    onAuthError?: () => void;
    onNetworkError?: (error: Error) => void;
}

// Request Interceptor
export type RequestInterceptor = (config: RequestConfig & { url: string }) => RequestConfig & { url: string };

// Response Interceptor
export type ResponseInterceptor = (response: Response) => Response | Promise<Response>;

/**
 * Centralized API Client
 */
export class ApiClient {
    private config: ApiClientConfig;
    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];
    private authToken: string | null = null;
    private refreshToken: string | null = null;
    private isRefreshing = false;
    private refreshPromise: Promise<void> | null = null;

    constructor(config: ApiClientConfig) {
        this.config = {
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
            ...config,
        };
    }

    /**
     * Set authentication tokens
     */
    setAuthTokens(accessToken: string | null, refreshToken: string | null) {
        this.authToken = accessToken;
        this.refreshToken = refreshToken;
    }

    /**
     * Add request interceptor
     */
    addRequestInterceptor(interceptor: RequestInterceptor) {
        this.requestInterceptors.push(interceptor);
    }

    /**
     * Add response interceptor
     */
    addResponseInterceptor(interceptor: ResponseInterceptor) {
        this.responseInterceptors.push(interceptor);
    }

    /**
     * Make authenticated request
     */
    async request<T = any>(endpoint: string, config: RequestConfig = {}): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Apply request interceptors
        let requestConfig = { ...config, url };
        for (const interceptor of this.requestInterceptors) {
            requestConfig = interceptor(requestConfig);
        }

        // Add authentication headers
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...requestConfig.headers,
        };

        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`;
        }

        // Add request ID for tracking
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        headers["X-Request-ID"] = requestId;

        // Prepare request
        const requestInit: RequestInit = {
            method: requestConfig.method || "GET",
            headers,
            signal: this.createAbortSignal(requestConfig.timeout),
        };

        if (requestConfig.body && requestConfig.method !== "GET") {
            requestInit.body = JSON.stringify(requestConfig.body);
        }

        // Execute request with retry logic
        return this.executeWithRetry(url, requestInit, requestConfig.retries || this.config.retries!);
    }

    /**
     * Execute request with retry logic
     */
    private async executeWithRetry<T>(
        url: string,
        requestInit: RequestInit,
        retries: number
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await fetch(url, requestInit);

                // Apply response interceptors
                let processedResponse = response;
                for (const interceptor of this.responseInterceptors) {
                    processedResponse = await interceptor(response);
                }

                const data: ApiResponse<T> = await processedResponse.json();

                if (!data.success) {
                    throw new ApiError(data);
                }

                return data.data as T;
            } catch (error) {
                lastError = error as Error;

                // Handle authentication errors
                if (error instanceof ApiError && error.status === 401) {
                    if (attempt === 0 && this.refreshToken) {
                        try {
                            await this.refreshAuthToken();
                            continue; // Retry with new token
                        } catch (refreshError) {
                            this.config.onAuthError?.();
                            throw refreshError;
                        }
                    } else {
                        this.config.onAuthError?.();
                        throw error;
                    }
                }

                // Handle network errors
                if (error instanceof TypeError && error.message.includes("fetch")) {
                    this.config.onNetworkError?.(error);

                    if (attempt < retries) {
                        await this.delay(this.config.retryDelay! * Math.pow(2, attempt));
                        continue;
                    }
                }

                // For other errors, don't retry
                throw error;
            }
        }

        throw lastError!;
    }

    /**
     * Refresh authentication token
     */
    private async refreshAuthToken(): Promise<void> {
        if (this.isRefreshing && this.refreshPromise) {
            return this.refreshPromise;
        }

        this.isRefreshing = true;
        this.refreshPromise = this.performTokenRefresh();

        try {
            await this.refreshPromise;
        } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
        }
    }

    /**
     * Perform token refresh
     */
    private async performTokenRefresh(): Promise<void> {
        if (!this.refreshToken) {
            throw new Error("No refresh token available");
        }

        try {
            const response = await fetch(`${this.config.baseUrl}/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    refreshToken: this.refreshToken,
                }),
            });

            const data: ApiResponse<{
                accessToken: string;
                refreshToken: string;
                expiresAt: string;
            }> = await response.json();

            if (!data.success) {
                throw new ApiError(data);
            }

            this.authToken = data.data!.accessToken;
            this.refreshToken = data.data!.refreshToken;
        } catch (error) {
            this.authToken = null;
            this.refreshToken = null;
            throw error;
        }
    }

    /**
     * Create abort signal for timeout
     */
    private createAbortSignal(timeout?: number): AbortSignal {
        const controller = new AbortController();
        const timeoutMs = timeout || this.config.timeout!;

        setTimeout(() => controller.abort(), timeoutMs);
        return controller.signal;
    }

    /**
     * Delay utility for retry logic
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Convenience methods
    async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, { ...config, method: "GET" });
    }

    async post<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, { ...config, method: "POST", body });
    }

    async put<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, { ...config, method: "PUT", body });
    }

    async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, { ...config, method: "DELETE" });
    }

    async patch<T>(endpoint: string, body?: any, config?: RequestConfig): Promise<T> {
        return this.request<T>(endpoint, { ...config, method: "PATCH", body });
    }
}

/**
 * Create API client instance
 */
export function createApiClient(config: ApiClientConfig): ApiClient {
    return new ApiClient(config);
}

/**
 * Default API client instance
 */
export const apiClient = createApiClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
});
