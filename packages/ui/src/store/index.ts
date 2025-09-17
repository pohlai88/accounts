// Global State Management with Zustand
// DoD: Global state management for API data
// SSOT: Use existing types from @aibos/contracts
// Tech Stack: Zustand + TypeScript

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { TCreateInvoiceRes, TListInvoicesRes } from "@aibos/contracts";

// Type definitions
type AnyObject = Record<string, any>;

// Invoice Store Interface
interface InvoiceStore {
    invoices: TCreateInvoiceRes[];
    customers: AnyObject[];
    vendors: AnyObject[];
    bills: AnyObject[];
    payments: AnyObject[];
    bankAccounts: AnyObject[];
    accounts: AnyObject[];
    periods: AnyObject[];
    dashboardData: AnyObject;
    loading: boolean;
    error: string | null;

    // Invoice actions
    fetchInvoices: () => Promise<void>;
    createInvoice: (invoice: AnyObject) => Promise<void>;
    updateInvoice: (id: string, updates: AnyObject) => Promise<void>;
    deleteInvoice: (id: string) => Promise<void>;

    // Customer actions
    fetchCustomers: () => Promise<void>;
    createCustomer: (customer: AnyObject) => Promise<void>;
    updateCustomer: (id: string, updates: AnyObject) => Promise<void>;

    // Vendor actions
    fetchVendors: () => Promise<void>;
    createVendor: (vendor: AnyObject) => Promise<void>;
    updateVendor: (id: string, updates: AnyObject) => Promise<void>;

    // Bill actions
    fetchBills: () => Promise<void>;
    createBill: (bill: AnyObject) => Promise<void>;
    updateBill: (id: string, updates: AnyObject) => Promise<void>;

    // Payment actions
    fetchPayments: () => Promise<void>;
    createPayment: (payment: AnyObject) => Promise<void>;
    updatePayment: (id: string, updates: AnyObject) => Promise<void>;

    // Bank Account actions
    fetchBankAccounts: () => Promise<void>;
    createBankAccount: (bankAccount: AnyObject) => Promise<void>;
    updateBankAccount: (id: string, updates: AnyObject) => Promise<void>;

    // Account actions
    fetchAccounts: () => Promise<void>;
    createAccount: (account: AnyObject) => Promise<void>;
    updateAccount: (id: string, updates: AnyObject) => Promise<void>;
    deleteAccount: (id: string) => Promise<void>;

    // Period actions
    fetchPeriods: () => Promise<void>;
    closePeriod: (periodId: string, data: AnyObject) => Promise<void>;
    openPeriod: (periodId: string, data: AnyObject) => Promise<void>;
    lockPeriod: (periodId: string, data: AnyObject) => Promise<void>;

    // Dashboard actions
    fetchDashboardData: () => Promise<void>;
    refreshKPIs: () => Promise<void>;

    // Utility actions
    setLoading: (loading: boolean) => void;
    setError: (error: string | null) => void;
    clearError: () => void;
}

// Create Invoice Store
export const useInvoiceStore = create<InvoiceStore>()(
    devtools(
        (set, get) => ({
            // Initial state
            invoices: [],
            customers: [],
            vendors: [],
            bills: [],
            payments: [],
            bankAccounts: [],
            accounts: [],
            periods: [],
            dashboardData: {},
            loading: false,
            error: null,

            // Invoice actions
            fetchInvoices: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/invoices");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ invoices: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch invoices",
                        loading: false
                    });
                }
            },

            createInvoice: async (invoice) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/invoices", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(invoice),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        invoices: [data.data, ...state.invoices],
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to create invoice",
                        loading: false
                    });
                }
            },

            updateInvoice: async (id, updates) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/invoices/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        invoices: state.invoices.map(invoice =>
                            invoice.id === id ? { ...invoice, ...data.data } : invoice
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to update invoice",
                        loading: false
                    });
                }
            },

            deleteInvoice: async (id) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/invoices/${id}`, {
                        method: "DELETE",
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    set((state) => ({
                        invoices: state.invoices.filter(invoice => invoice.id !== id),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to delete invoice",
                        loading: false
                    });
                }
            },

            // Customer actions
            fetchCustomers: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/customers");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ customers: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch customers",
                        loading: false
                    });
                }
            },

            createCustomer: async (customer) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/customers", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(customer),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        customers: [data.data, ...state.customers],
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to create customer",
                        loading: false
                    });
                }
            },

            updateCustomer: async (id, updates) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/customers/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        customers: state.customers.map(customer =>
                            customer.id === id ? { ...customer, ...data.data } : customer
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to update customer",
                        loading: false
                    });
                }
            },

            // Vendor actions
            fetchVendors: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/vendors");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ vendors: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch vendors",
                        loading: false
                    });
                }
            },

            createVendor: async (vendor) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/vendors", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(vendor),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        vendors: [data.data, ...state.vendors],
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to create vendor",
                        loading: false
                    });
                }
            },

            updateVendor: async (id, updates) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/vendors/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        vendors: state.vendors.map(vendor =>
                            vendor.id === id ? { ...vendor, ...data.data } : vendor
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to update vendor",
                        loading: false
                    });
                }
            },

            // Bill actions
            fetchBills: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/bills");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ bills: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch bills",
                        loading: false
                    });
                }
            },

            createBill: async (bill) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/bills", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(bill),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        bills: [data.data, ...state.bills],
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to create bill",
                        loading: false
                    });
                }
            },

            updateBill: async (id, updates) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/bills/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        bills: state.bills.map(bill =>
                            bill.id === id ? { ...bill, ...data.data } : bill
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to update bill",
                        loading: false
                    });
                }
            },

            // Payment actions
            fetchPayments: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/payments");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ payments: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch payments",
                        loading: false
                    });
                }
            },

            createPayment: async (payment) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/payments", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payment),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        payments: [data.data, ...state.payments],
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to create payment",
                        loading: false
                    });
                }
            },

            updatePayment: async (id, updates) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/payments/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        payments: state.payments.map(payment =>
                            payment.id === id ? { ...payment, ...data.data } : payment
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to update payment",
                        loading: false
                    });
                }
            },

            // Bank Account actions
            fetchBankAccounts: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/bank-accounts");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ bankAccounts: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch bank accounts",
                        loading: false
                    });
                }
            },

            createBankAccount: async (bankAccount) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/bank-accounts", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(bankAccount),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        bankAccounts: [data.data, ...state.bankAccounts],
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to create bank account",
                        loading: false
                    });
                }
            },

            updateBankAccount: async (id, updates) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/bank-accounts/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        bankAccounts: state.bankAccounts.map(account =>
                            account.id === id ? { ...account, ...data.data } : account
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to update bank account",
                        loading: false
                    });
                }
            },

            // Account actions
            fetchAccounts: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/accounts");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ accounts: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch accounts",
                        loading: false
                    });
                }
            },

            createAccount: async (account) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/accounts", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(account),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        accounts: [data.data, ...state.accounts],
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to create account",
                        loading: false
                    });
                }
            },

            updateAccount: async (id, updates) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/accounts/${id}`, {
                        method: "PUT",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(updates),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const data = await response.json();
                    set((state) => ({
                        accounts: state.accounts.map(account =>
                            account.id === id ? { ...account, ...data.data } : account
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to update account",
                        loading: false
                    });
                }
            },

            deleteAccount: async (id) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch(`/api/accounts/${id}`, {
                        method: "DELETE",
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    set((state) => ({
                        accounts: state.accounts.filter(account => account.id !== id),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to delete account",
                        loading: false
                    });
                }
            },

            // Period actions
            fetchPeriods: async () => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/periods");
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    const data = await response.json();
                    set({ periods: data.data || [], loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch periods",
                        loading: false
                    });
                }
            },

            closePeriod: async (periodId, data) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/periods", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ action: "close", periodId, ...data }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const result = await response.json();
                    set((state) => ({
                        periods: state.periods.map(period =>
                            period.id === periodId ? { ...period, ...result.data } : period
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to close period",
                        loading: false
                    });
                }
            },

            openPeriod: async (periodId, data) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/periods", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ action: "open", periodId, ...data }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const result = await response.json();
                    set((state) => ({
                        periods: state.periods.map(period =>
                            period.id === periodId ? { ...period, ...result.data } : period
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to open period",
                        loading: false
                    });
                }
            },

            lockPeriod: async (periodId, data) => {
                set({ loading: true, error: null });
                try {
                    const response = await fetch("/api/periods", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ action: "lock", periodId, ...data }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.message || `HTTP ${response.status}`);
                    }

                    const result = await response.json();
                    set((state) => ({
                        periods: state.periods.map(period =>
                            period.id === periodId ? { ...period, ...result.data } : period
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to lock period",
                        loading: false
                    });
                }
            },

            // Dashboard actions
            fetchDashboardData: async () => {
                set({ loading: true, error: null });
                try {
                    // Fetch multiple reports in parallel
                    const [trialBalance, balanceSheet, cashFlow] = await Promise.all([
                        fetch("/api/reports/trial-balance").then(res => res.json()),
                        fetch("/api/reports/balance-sheet").then(res => res.json()),
                        fetch("/api/reports/cash-flow").then(res => res.json())
                    ]);

                    const dashboardData = {
                        trialBalance: trialBalance.data || [],
                        balanceSheet: balanceSheet.data || {},
                        cashFlow: cashFlow.data || {},
                        lastUpdated: new Date().toISOString()
                    };

                    set({ dashboardData, loading: false });
                } catch (error) {
                    set({
                        error: error instanceof Error ? error.message : "Failed to fetch dashboard data",
                        loading: false
                    });
                }
            },

            refreshKPIs: async () => {
                await get().fetchDashboardData();
            },

            // Utility actions
            setLoading: (loading) => set({ loading }),
            setError: (error) => set({ error }),
            clearError: () => set({ error: null }),
        }),
        {
            name: "invoice-store", // unique name for devtools
        }
    )
);

// Export individual hooks for better performance
export const useInvoices = () => useInvoiceStore((state) => ({
    invoices: state.invoices,
    loading: state.loading,
    error: state.error,
    fetchInvoices: state.fetchInvoices,
    createInvoice: state.createInvoice,
    updateInvoice: state.updateInvoice,
    deleteInvoice: state.deleteInvoice,
}));

export const useCustomers = () => useInvoiceStore((state) => ({
    customers: state.customers,
    loading: state.loading,
    error: state.error,
    fetchCustomers: state.fetchCustomers,
    createCustomer: state.createCustomer,
    updateCustomer: state.updateCustomer,
}));

export const useVendors = () => useInvoiceStore((state) => ({
    vendors: state.vendors,
    loading: state.loading,
    error: state.error,
    fetchVendors: state.fetchVendors,
    createVendor: state.createVendor,
    updateVendor: state.updateVendor,
}));

export const useBills = () => useInvoiceStore((state) => ({
    bills: state.bills,
    loading: state.loading,
    error: state.error,
    fetchBills: state.fetchBills,
    createBill: state.createBill,
    updateBill: state.updateBill,
}));

export const usePayments = () => useInvoiceStore((state) => ({
    payments: state.payments,
    loading: state.loading,
    error: state.error,
    fetchPayments: state.fetchPayments,
    createPayment: state.createPayment,
    updatePayment: state.updatePayment,
}));

export const useBankAccounts = () => useInvoiceStore((state) => ({
    bankAccounts: state.bankAccounts,
    loading: state.loading,
    error: state.error,
    fetchBankAccounts: state.fetchBankAccounts,
    createBankAccount: state.createBankAccount,
    updateBankAccount: state.updateBankAccount,
}));

export const useAccounts = () => useInvoiceStore((state) => ({
    accounts: state.accounts,
    loading: state.loading,
    error: state.error,
    fetchAccounts: state.fetchAccounts,
    createAccount: state.createAccount,
    updateAccount: state.updateAccount,
    deleteAccount: state.deleteAccount,
}));

export const usePeriods = () => useInvoiceStore((state) => ({
    periods: state.periods,
    loading: state.loading,
    error: state.error,
    fetchPeriods: state.fetchPeriods,
    closePeriod: state.closePeriod,
    openPeriod: state.openPeriod,
    lockPeriod: state.lockPeriod,
}));

export const useDashboard = () => useInvoiceStore((state) => ({
    dashboardData: state.dashboardData,
    loading: state.loading,
    error: state.error,
    fetchDashboardData: state.fetchDashboardData,
    refreshKPIs: state.refreshKPIs,
}));
