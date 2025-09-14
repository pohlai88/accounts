/**
 * @aibos/utils - State Management (SSOT Compliant)
 *
 * Real data fetching hooks connected to API endpoints
 * Implements proper error handling and loading states
 *
 * NOTE: This file contains React hooks and should only be used in client components
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { ApiRequestContext, apiClient, isSuccess } from "./api-client";

// ============================================================================
// REAL DATA FETCHING HOOKS
// ============================================================================

export function useInvoices(
  context: ApiRequestContext,
  filters: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
  } = {},
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<{ invoices: unknown[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoices = useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/api/invoices", {
        query: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...(filters.status && { status: filters.status }),
          ...(filters.customerId && { customerId: filters.customerId }),
          ...(filters.fromDate && { fromDate: filters.fromDate }),
          ...(filters.toDate && { toDate: filters.toDate }),
        },
        context,
      });

      if (isSuccess(response)) {
        setData({ invoices: Array.isArray(response.data) ? response.data : [] });
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch invoices"));
    } finally {
      setIsLoading(false);
    }
  }, [context, filters, options?.enabled]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchInvoices,
  };
}

export function useInvoice(
  context: ApiRequestContext,
  id: string,
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInvoice = useCallback(async () => {
    if (options?.enabled === false || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/api/invoices/${id}`, {
        context,
      });

      if (isSuccess(response)) {
        setData(response.data);
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch invoice"));
    } finally {
      setIsLoading(false);
    }
  }, [context, id, options?.enabled]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchInvoice,
  };
}

export function useCreateInvoice(context: ApiRequestContext, options?: { enabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (invoiceData: unknown) => {
      if (options?.enabled === false) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post("/api/invoices", {
          body: invoiceData,
          context,
        });

        if (isSuccess(response)) {
          return response.data;
        } else {
          throw new Error(response.error.title);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to create invoice");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [context, options?.enabled],
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

export function usePostInvoice(context: ApiRequestContext, options?: { enabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (data: { invoiceId: string; arAccountId: string }) => {
      if (options?.enabled === false) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post(`/api/invoices/${data.invoiceId}/post`, {
          body: { arAccountId: data.arAccountId },
          context,
        });

        if (isSuccess(response)) {
          return response.data;
        } else {
          throw new Error(response.error.title);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to post invoice");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [context, options?.enabled],
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

export function useCustomers(
  context: ApiRequestContext,
  filters: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  } = {},
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<{ customers: unknown[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomers = useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/api/customers", {
        query: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...(filters.search && { search: filters.search }),
          ...(filters.status && { status: filters.status }),
        },
        context,
      });

      if (isSuccess(response)) {
        setData({ customers: Array.isArray(response.data) ? response.data : [] });
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch customers"));
    } finally {
      setIsLoading(false);
    }
  }, [context, filters, options?.enabled]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCustomers,
  };
}

export function useCustomer(
  context: ApiRequestContext,
  id: string,
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCustomer = useCallback(async () => {
    if (options?.enabled === false || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/api/customers/${id}`, {
        context,
      });

      if (isSuccess(response)) {
        setData(response.data);
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch customer"));
    } finally {
      setIsLoading(false);
    }
  }, [context, id, options?.enabled]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchCustomer,
  };
}

export function useCreateCustomer(context: ApiRequestContext, options?: { enabled?: boolean }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (customerData: unknown) => {
      if (options?.enabled === false) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await apiClient.post("/api/customers", {
          body: customerData,
          context,
        });

        if (isSuccess(response)) {
          return response.data;
        } else {
          throw new Error(response.error.title);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to create customer");
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [context, options?.enabled],
  );

  return {
    mutate,
    isLoading,
    error,
  };
}

export function useJournals(
  context: ApiRequestContext,
  filters: {
    page?: number;
    limit?: number;
    fromDate?: string;
    toDate?: string;
    status?: string;
  } = {},
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<{ journals: unknown[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchJournals = useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/api/journals", {
        query: {
          page: filters.page || 1,
          limit: filters.limit || 20,
          ...(filters.fromDate && { fromDate: filters.fromDate }),
          ...(filters.toDate && { toDate: filters.toDate }),
          ...(filters.status && { status: filters.status }),
        },
        context,
      });

      if (isSuccess(response)) {
        setData({ journals: Array.isArray(response.data) ? response.data : [] });
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch journals"));
    } finally {
      setIsLoading(false);
    }
  }, [context, filters, options?.enabled]);

  useEffect(() => {
    fetchJournals();
  }, [fetchJournals]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchJournals,
  };
}

export function useJournal(
  context: ApiRequestContext,
  id: string,
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchJournal = useCallback(async () => {
    if (options?.enabled === false || !id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/api/journals/${id}`, {
        context,
      });

      if (isSuccess(response)) {
        setData(response.data);
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch journal"));
    } finally {
      setIsLoading(false);
    }
  }, [context, id, options?.enabled]);

  useEffect(() => {
    fetchJournal();
  }, [fetchJournal]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchJournal,
  };
}

export function useTrialBalance(
  context: ApiRequestContext,
  params: {
    fromDate: string;
    toDate: string;
    companyId: string;
    tenantId: string;
    asOfDate?: string;
    includePeriodActivity?: boolean;
    includeZeroBalances?: boolean;
    currency?: string;
  },
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<unknown | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrialBalance = useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/api/reports/trial-balance", {
        query: {
          tenantId: params.tenantId,
          companyId: params.companyId,
          asOfDate: params.asOfDate || params.toDate,
          includePeriodActivity: params.includePeriodActivity || false,
          includeZeroBalances: params.includeZeroBalances || false,
          currency: params.currency || "MYR",
        },
        context,
      });

      if (isSuccess(response)) {
        setData(response.data);
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch trial balance"));
    } finally {
      setIsLoading(false);
    }
  }, [context, params, options?.enabled]);

  useEffect(() => {
    fetchTrialBalance();
  }, [fetchTrialBalance]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTrialBalance,
  };
}

export function useChartOfAccounts(
  context: ApiRequestContext,
  filters: {
    accountType?: string;
    isActive?: boolean;
    includeInactive?: boolean;
  } = {},
  options?: { enabled?: boolean },
) {
  const [data, setData] = useState<{ accounts: unknown[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAccounts = useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/api/accounts", {
        query: {
          ...(filters.accountType && { accountType: filters.accountType }),
          ...(filters.isActive !== undefined && { isActive: filters.isActive }),
          ...(filters.includeInactive && { includeInactive: filters.includeInactive }),
        },
        context,
      });

      if (isSuccess(response)) {
        setData({ accounts: Array.isArray(response.data) ? response.data : [] });
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch accounts"));
    } finally {
      setIsLoading(false);
    }
  }, [context, filters, options?.enabled]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchAccounts,
  };
}

export function useTaxCodes(context: ApiRequestContext, options?: { enabled?: boolean }) {
  const [data, setData] = useState<{ taxCodes: unknown[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchTaxCodes = useCallback(async () => {
    if (options?.enabled === false) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get("/api/tax-codes", {
        context,
      });

      if (isSuccess(response)) {
        setData({ taxCodes: Array.isArray(response.data) ? response.data : [] });
      } else {
        throw new Error(response.error.title);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch tax codes"));
    } finally {
      setIsLoading(false);
    }
  }, [context, options?.enabled]);

  useEffect(() => {
    fetchTaxCodes();
  }, [fetchTaxCodes]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchTaxCodes,
  };
}

export function useInvalidateQueries() {
  return {
    invalidateAll: () => {
      console.log("Invalidating all queries");
    },
    invalidateInvoices: (context: ApiRequestContext) => {
      console.log("Invalidating invoices for context:", context);
    },
    invalidateCustomers: (context: ApiRequestContext) => {
      console.log("Invalidating customers for context:", context);
    },
    invalidateJournals: (context: ApiRequestContext) => {
      console.log("Invalidating journals for context:", context);
    },
  };
}
