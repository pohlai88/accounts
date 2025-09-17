// Centralized API Client with Error Handling
// DoD: Centralized API client with error handling
// SSOT: Use existing API contracts from @aibos/contracts
// Tech Stack: Fetch API + Zod validation

import { z } from "zod";
import { TCreateInvoiceReq, TCreateInvoiceRes } from "@aibos/contracts";

// Custom API Error Class
export class ApiError extends Error {
    constructor(
        public status: number,
        public message: string,
        public details?: any,
    ) {
        super(message);
        this.name = "ApiError";
    }
}

// API Response Schema
const ApiResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    message: z.string().optional(),
});

type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

// API Client Configuration
interface ApiClientConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
    retryDelay: number;
}

// Default Configuration
const defaultConfig: ApiClientConfig = {
    baseUrl: "/api",
    timeout: 30000, // 30 seconds
    retries: 3,
    retryDelay: 1000, // 1 second
};

// API Client Class
export class ApiClient {
    private config: ApiClientConfig;
    private abortController: AbortController | null = null;

    constructor(config: Partial<ApiClientConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    // Generic request method
    async request<T>(
        endpoint: string,
        options: RequestInit = {},
        schema?: z.ZodSchema<T>,
    ): Promise<T> {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Create abort controller for timeout
        this.abortController = new AbortController();
        const timeoutId = setTimeout(() => this.abortController?.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                headers: {
                    "Content-Type": "application/json",
                    ...options.headers,
                },
                signal: this.abortController.signal,
                ...options,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new ApiError(
                    response.status,
                    errorData.message || errorData.error || `HTTP ${response.status}`,
                    errorData,
                );
            }

            const data = await response.json();

            // Validate response structure
            const validatedResponse = ApiResponseSchema.parse(data);

            if (!validatedResponse.success) {
                throw new ApiError(
                    response.status,
                    validatedResponse.error || "API request failed",
                    validatedResponse,
                );
            }

            // Validate data with schema if provided
            if (schema) {
                return schema.parse(validatedResponse.data);
            }

            return validatedResponse.data;
        } catch (error) {
            clearTimeout(timeoutId);

            if (error instanceof ApiError) {
                throw error;
            }

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new ApiError(408, "Request timeout");
                }
                throw new ApiError(0, error.message);
            }

            throw new ApiError(0, "Unknown error occurred");
        }
    }

    // Retry wrapper for failed requests
    async requestWithRetry<T>(
        endpoint: string,
        options: RequestInit = {},
        schema?: z.ZodSchema<T>,
    ): Promise<T> {
        let lastError: ApiError;

        for (let attempt = 0; attempt <= this.config.retries; attempt++) {
            try {
                return await this.request(endpoint, options, schema);
            } catch (error) {
                lastError = error as ApiError;

                // Don't retry on client errors (4xx) except 408 (timeout)
                if (lastError.status >= 400 && lastError.status < 500 && lastError.status !== 408) {
                    throw lastError;
                }

                // Don't retry on last attempt
                if (attempt === this.config.retries) {
                    throw lastError;
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (attempt + 1)));
            }
        }

        throw lastError!;
    }

    // Invoice API methods
    async getInvoices(params?: { page?: number; limit?: number; status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);

        const endpoint = `/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.requestWithRetry<TCreateInvoiceRes[]>(endpoint);
    }

    async getInvoice(id: string) {
        return this.requestWithRetry<TCreateInvoiceRes>(`/invoices/${id}`);
    }

    async createInvoice(data: TCreateInvoiceReq) {
        return this.requestWithRetry<TCreateInvoiceRes>("/invoices", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateInvoice(id: string, data: Partial<TCreateInvoiceReq>) {
        return this.requestWithRetry<TCreateInvoiceRes>(`/invoices/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteInvoice(id: string) {
        return this.requestWithRetry<void>(`/invoices/${id}`, {
            method: "DELETE",
        });
    }

    // Customer API methods
    async getCustomers(params?: { page?: number; limit?: number; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const endpoint = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getCustomer(id: string) {
        return this.requestWithRetry<any>(`/customers/${id}`);
    }

    async createCustomer(data: any) {
        return this.requestWithRetry<any>("/customers", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateCustomer(id: string, data: any) {
        return this.requestWithRetry<any>(`/customers/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteCustomer(id: string) {
        return this.requestWithRetry<void>(`/customers/${id}`, {
            method: "DELETE",
        });
    }

    // Vendor API methods
    async getVendors(params?: { page?: number; limit?: number; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const endpoint = `/vendors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getVendor(id: string) {
        return this.requestWithRetry<any>(`/vendors/${id}`);
    }

    async createVendor(data: any) {
        return this.requestWithRetry<any>("/vendors", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateVendor(id: string, data: any) {
        return this.requestWithRetry<any>(`/vendors/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteVendor(id: string) {
        return this.requestWithRetry<void>(`/vendors/${id}`, {
            method: "DELETE",
        });
    }

    // Bill API methods
    async getBills(params?: { page?: number; limit?: number; status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);

        const endpoint = `/bills${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getBill(id: string) {
        return this.requestWithRetry<any>(`/bills/${id}`);
    }

    async createBill(data: any) {
        return this.requestWithRetry<any>("/bills", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateBill(id: string, data: any) {
        return this.requestWithRetry<any>(`/bills/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteBill(id: string) {
        return this.requestWithRetry<void>(`/bills/${id}`, {
            method: "DELETE",
        });
    }

    // Payment API methods
    async getPayments(params?: { page?: number; limit?: number; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const endpoint = `/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getPayment(id: string) {
        return this.requestWithRetry<any>(`/payments/${id}`);
    }

    async createPayment(data: any) {
        return this.requestWithRetry<any>("/payments", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updatePayment(id: string, data: any) {
        return this.requestWithRetry<any>(`/payments/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deletePayment(id: string) {
        return this.requestWithRetry<void>(`/payments/${id}`, {
            method: "DELETE",
        });
    }

    // Bank Account API methods
    async getBankAccounts(params?: { page?: number; limit?: number; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const endpoint = `/bank-accounts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
        return this.requestWithRetry<any[]>(endpoint);
    }

    async getBankAccount(id: string) {
        return this.requestWithRetry<any>(`/bank-accounts/${id}`);
    }

    async createBankAccount(data: any) {
        return this.requestWithRetry<any>("/bank-accounts", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    async updateBankAccount(id: string, data: any) {
        return this.requestWithRetry<any>(`/bank-accounts/${id}`, {
            method: "PUT",
            body: JSON.stringify(data),
        });
    }

    async deleteBankAccount(id: string) {
        return this.requestWithRetry<void>(`/bank-accounts/${id}`, {
            method: "DELETE",
        });
    }

    // Company Settings API methods
    async getCompanySettings() {
        return this.requestWithRetry<any>("/company-settings");
    }

    async updateCompanySettings(data: any) {
        return this.requestWithRetry<any>("/company-settings", {
            method: "POST",
            body: JSON.stringify(data),
        });
    }

    // Health check
    async healthCheck() {
        return this.requestWithRetry<any>("/health");
    }

    // Cancel ongoing requests
    cancel() {
        if (this.abortController) {
            this.abortController.abort();
        }
    }
}

// Create default API client instance
export const apiClient = new ApiClient();

// ApiError is already exported as a class above
