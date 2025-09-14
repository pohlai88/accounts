/**
 * @aibos/utils - Server-Side API Client (SSOT Compliant)
 * 
 * Server-side data fetching functions for API routes
 * Does not use React hooks and can be used in server components
 */

import { ApiRequestContext, apiClient, isSuccess } from './api-client';

// ============================================================================
// SERVER-SIDE DATA FETCHING FUNCTIONS
// ============================================================================

export async function fetchInvoices(
    context: ApiRequestContext,
    filters: {
        page?: number;
        limit?: number;
        status?: string;
        customerId?: string;
        fromDate?: string;
        toDate?: string;
    } = {}
) {
    try {
        const response = await apiClient.get('/api/invoices', {
            query: {
                page: filters.page || 1,
                limit: filters.limit || 20,
                ...(filters.status && { status: filters.status }),
                ...(filters.customerId && { customerId: filters.customerId }),
                ...(filters.fromDate && { fromDate: filters.fromDate }),
                ...(filters.toDate && { toDate: filters.toDate })
            },
            context
        });

        if (isSuccess(response)) {
            return { success: true, data: response.data, error: null };
        } else {
            return { success: false, data: null, error: response.error.title };
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch invoices'
        };
    }
}

export async function fetchInvoice(
    context: ApiRequestContext,
    id: string
) {
    try {
        const response = await apiClient.get(`/api/invoices/${id}`, {
            context
        });

        if (isSuccess(response)) {
            return { success: true, data: response.data, error: null };
        } else {
            return { success: false, data: null, error: response.error.title };
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch invoice'
        };
    }
}

export async function fetchCustomers(
    context: ApiRequestContext,
    filters: {
        page?: number;
        limit?: number;
        search?: string;
        status?: string;
    } = {}
) {
    try {
        const response = await apiClient.get('/api/customers', {
            query: {
                page: filters.page || 1,
                limit: filters.limit || 20,
                ...(filters.search && { search: filters.search }),
                ...(filters.status && { status: filters.status })
            },
            context
        });

        if (isSuccess(response)) {
            return { success: true, data: response.data, error: null };
        } else {
            return { success: false, data: null, error: response.error.title };
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch customers'
        };
    }
}

export async function fetchJournals(
    context: ApiRequestContext,
    filters: {
        page?: number;
        limit?: number;
        fromDate?: string;
        toDate?: string;
        status?: string;
    } = {}
) {
    try {
        const response = await apiClient.get('/api/journals', {
            query: {
                page: filters.page || 1,
                limit: filters.limit || 20,
                ...(filters.fromDate && { fromDate: filters.fromDate }),
                ...(filters.toDate && { toDate: filters.toDate }),
                ...(filters.status && { status: filters.status })
            },
            context
        });

        if (isSuccess(response)) {
            return { success: true, data: response.data, error: null };
        } else {
            return { success: false, data: null, error: response.error.title };
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch journals'
        };
    }
}

export async function fetchChartOfAccounts(
    context: ApiRequestContext,
    filters: {
        accountType?: string;
        isActive?: boolean;
        includeInactive?: boolean;
    } = {}
) {
    try {
        const response = await apiClient.get('/api/accounts', {
            query: {
                ...(filters.accountType && { accountType: filters.accountType }),
                ...(filters.isActive !== undefined && { isActive: filters.isActive }),
                ...(filters.includeInactive && { includeInactive: filters.includeInactive })
            },
            context
        });

        if (isSuccess(response)) {
            return { success: true, data: response.data, error: null };
        } else {
            return { success: false, data: null, error: response.error.title };
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch accounts'
        };
    }
}

export async function fetchTrialBalance(
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
    }
) {
    try {
        const response = await apiClient.get('/api/reports/trial-balance', {
            query: {
                tenantId: params.tenantId,
                companyId: params.companyId,
                asOfDate: params.asOfDate || params.toDate,
                includePeriodActivity: params.includePeriodActivity || false,
                includeZeroBalances: params.includeZeroBalances || false,
                currency: params.currency || 'MYR'
            },
            context
        });

        if (isSuccess(response)) {
            return { success: true, data: response.data, error: null };
        } else {
            return { success: false, data: null, error: response.error.title };
        }
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : 'Failed to fetch trial balance'
        };
    }
}
