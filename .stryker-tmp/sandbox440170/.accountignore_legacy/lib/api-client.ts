/**
 * API Client - Centralized HTTP Client for Frontend-Backend Communication
 * Type-safe API calls with error handling and loading states
 * Modern fetch wrapper with full TypeScript support
 */
// @ts-nocheck


import { toast } from "sonner";

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// Common types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  details?: any;
  meta?: {
    total?: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// HTTP client class
export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const defaultOptions: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      const data = await response.json();

      if (!response.ok) {
        return {
          error: data.error || `HTTP ${response.status}`,
          details: data.details,
        };
      }

      return data;
    } catch (error) {
      return {
        error: "Network error or server unavailable",
        details: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Generic CRUD operations
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T[]>> {
    const queryParams = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<T[]>(`${endpoint}${queryParams}`);
  }

  async getById<T>(endpoint: string, id: string): Promise<ApiResponse<T>> {
    return this.request<T>(`${endpoint}/${id}`);
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, id: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(`${endpoint}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string, id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${endpoint}/${id}`, {
      method: "DELETE",
    });
  }

  // Entity-specific methods

  // Customers
  async getCustomers(params?: PaginationParams & { customer_type?: string; disabled?: boolean }) {
    return this.get("/customers", params);
  }

  async getCustomer(id: string) {
    return this.getById("/customers", id);
  }

  async createCustomer(data: any) {
    return this.post("/customers", data);
  }

  async updateCustomer(id: string, data: any) {
    return this.put("/customers", id, data);
  }

  // Suppliers
  async getSuppliers(params?: PaginationParams & { supplier_type?: string; disabled?: boolean }) {
    return this.get("/suppliers", params);
  }

  async createSupplier(data: any) {
    return this.post("/suppliers", data);
  }

  // Items
  async getItems(
    params?: PaginationParams & {
      item_group?: string;
      is_purchase_item?: boolean;
      is_sales_item?: boolean;
      is_service_item?: boolean;
      is_stock_item?: boolean;
      disabled?: boolean;
    },
  ) {
    return this.get("/items", params);
  }

  async createItem(data: any) {
    return this.post("/items", data);
  }

  // Accounts
  async getAccounts(
    params?: PaginationParams & {
      account_type?: string;
      is_group?: boolean;
      parent_account?: string;
      company_id?: string;
      include_balances?: boolean;
    },
  ) {
    return this.get("/accounts", params);
  }

  async createAccount(data: any) {
    return this.post("/accounts", data);
  }

  // Sales Invoices
  async getSalesInvoices(
    params?: PaginationParams & {
      customer_id?: string;
      status?: string;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.get("/invoices", params);
  }

  async createSalesInvoice(data: any) {
    return this.post("/invoices", data);
  }

  // Purchase Invoices
  async getPurchaseInvoices(
    params?: PaginationParams & {
      supplier_id?: string;
      status?: string;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.get("/purchase-invoices", params);
  }

  async createPurchaseInvoice(data: any) {
    return this.post("/purchase-invoices", data);
  }

  // Quotations
  async getQuotations(
    params?: PaginationParams & {
      customer_id?: string;
      status?: string;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.get("/quotations", params);
  }

  async createQuotation(data: any) {
    return this.post("/quotations", data);
  }

  // Sales Orders
  async getSalesOrders(
    params?: PaginationParams & {
      customer_id?: string;
      status?: string;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.get("/sales-orders", params);
  }

  async createSalesOrder(data: any) {
    return this.post("/sales-orders", data);
  }

  // Payments
  async getPayments(
    params?: PaginationParams & {
      payment_type?: string;
      party_type?: string;
      party_id?: string;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.get("/payments", params);
  }

  async createPayment(data: any) {
    return this.post("/payments", data);
  }

  // Fixed Assets
  async getFixedAssets(
    params?: PaginationParams & {
      asset_category_id?: string;
      location?: string;
      department?: string;
      status?: string;
      custodian?: string;
      from_purchase_date?: string;
      to_purchase_date?: string;
      maintenance_required?: boolean;
      insurance_required?: boolean;
    },
  ) {
    return this.get("/fixed-assets", params);
  }

  async createFixedAsset(data: any) {
    return this.post("/fixed-assets", data);
  }

  // Expenses
  async getExpenses(
    params?: PaginationParams & {
      employee_id?: string;
      department?: string;
      project?: string;
      status?: string;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.get("/expenses", params);
  }

  async createExpense(data: any) {
    return this.post("/expenses", data);
  }

  // Budgets
  async getBudgets(
    params?: PaginationParams & {
      company_id?: string;
      fiscal_year?: string;
      budget_against?: string;
      cost_center_id?: string;
      project_id?: string;
      department?: string;
      budget_type?: string;
      status?: string;
    },
  ) {
    return this.get("/budgets", params);
  }

  async createBudget(data: any) {
    return this.post("/budgets", data);
  }

  // Treasury Management
  async getTreasuryForecasts(
    params?: PaginationParams & {
      company_id?: string;
      forecast_type?: string;
      from_date?: string;
      to_date?: string;
      currency?: string;
      category?: string;
      confidence_level?: string;
    },
  ) {
    return this.get("/treasury", params);
  }

  async createTreasuryForecast(data: any) {
    return this.post("/treasury", data);
  }

  // Banking & Reconciliation
  async getBankingData(
    params?: PaginationParams & {
      type?: "accounts" | "transactions" | "reconciliations";
      company_id?: string;
      bank_account_id?: string;
      from_date?: string;
      to_date?: string;
      is_reconciled?: boolean;
      transaction_type?: string;
    },
  ) {
    return this.get("/banking", params);
  }

  async createBankAccount(data: any) {
    return this.post("/banking", { type: "account", data });
  }

  async importBankTransactions(bank_account_id: string, transactions: any[]) {
    return this.post("/banking", { type: "transactions", bank_account_id, transactions });
  }

  async performBankReconciliation(data: any) {
    return this.post("/banking", { type: "reconciliation", data });
  }

  // Tax Management
  async getTaxData(
    params?: PaginationParams & {
      type?: "templates" | "calculations" | "returns";
      company_id?: string;
      tax_category?: string;
      tax_type?: string;
      is_default?: boolean;
      disabled?: boolean;
      from_date?: string;
      to_date?: string;
    },
  ) {
    return this.get("/tax", params);
  }

  async createTaxTemplate(data: any) {
    return this.post("/tax", { type: "template", data });
  }

  async calculateTaxes(data: any) {
    return this.post("/tax", { type: "calculate", data });
  }

  async generateTaxReturn(data: any) {
    return this.post("/tax", { type: "return", data });
  }

  // Reports
  async getTrialBalance(params?: { from_date?: string; to_date?: string; company_id?: string }) {
    return this.request("/reports/trial-balance", {
      method: "GET",
    });
  }

  // Analytics
  async recordPerformanceMetric(data: any) {
    return this.post("/analytics/performance", data);
  }
}

// Default client instance
export const apiClient = new ApiClient();

// Hook for API calls with loading states and error handling
export function useApiCall() {
  const handleApiCall = async <T>(
    apiCall: () => Promise<ApiResponse<T>>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      showSuccessToast?: boolean;
      showErrorToast?: boolean;
    } = {},
  ): Promise<{ data?: T; error?: string; success: boolean }> => {
    const {
      successMessage,
      errorMessage,
      showSuccessToast = false,
      showErrorToast = true,
    } = options;

    try {
      const response = await apiCall();

      if (response.error) {
        if (showErrorToast) {
          toast.error(errorMessage || response.error, {
            description: response.details,
          });
        }
        return { error: response.error, success: false };
      }

      if (showSuccessToast && (successMessage || response.message)) {
        toast.success(successMessage || response.message);
      }

      return { data: response.data, success: true };
    } catch (error) {
      const errorMsg = errorMessage || "An unexpected error occurred";
      if (showErrorToast) {
        toast.error(errorMsg);
      }
      return { error: errorMsg, success: false };
    }
  };

  return { handleApiCall };
}

// Utility functions for common API patterns
export const ApiUtils = {
  // Format error message from API response
  formatError: (response: ApiResponse<any>): string => {
    if (response.details && Array.isArray(response.details)) {
      return response.details.map((err: any) => err.message || err).join(", ");
    }
    return response.error || "Unknown error";
  },

  // Create query params from object
  createQueryParams: (params: Record<string, any>): string => {
    const filtered = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return new URLSearchParams(filtered).toString();
  },

  // Handle pagination
  getNextPage: (meta?: { offset: number; limit: number; has_more: boolean }) => {
    if (!meta || !meta.has_more) return null;
    return meta.offset + meta.limit;
  },

  getPrevPage: (meta?: { offset: number; limit: number }) => {
    if (!meta || meta.offset <= 0) return null;
    return Math.max(0, meta.offset - meta.limit);
  },
};

export default apiClient;
