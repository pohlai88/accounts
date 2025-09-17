/**
 * @aibos/ui - Billing API Hook
 *
 * Provides typed API calls for billing and subscription endpoints
 */

import { useApiCall } from "./useApiClient.js";
import { apiClient } from "../lib/api-client.js";

// Billing API Types
export interface Subscription {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    nextBillingDate: string;
    autoRenew: boolean;
    billingAddress: any;
    trialEndsAt: string;
    createdAt: string;
    updatedAt: string;
    plan: {
        id: string;
        name: string;
        description: string;
        planType: string;
        price: number;
        currency: string;
        billingCycle: string;
        features: string[];
        limits: Record<string, any>;
    };
}

export interface Invoice {
    id: string;
    number: string;
    amount: number;
    currency: string;
    status: string;
    dueDate: string;
    createdAt: string;
    downloadUrl?: string;
}

export interface BillingInfo {
    subscription: Subscription;
    invoices: Invoice[];
}

export interface UpdateBillingRequest {
    billingAddress?: any;
    paymentMethod?: any;
    autoRenew?: boolean;
}

/**
 * Hook for billing API calls
 */
export function useBillingApi() {
    const api = useApiCall();

    return {
        /**
         * Get billing information
         */
        getBillingInfo: async (tenantId: string): Promise<BillingInfo> => {
            return api.get<BillingInfo>(`/billing?tenantId=${tenantId}`);
        },

        /**
         * Update billing information
         */
        updateBillingInfo: async (tenantId: string, data: UpdateBillingRequest): Promise<BillingInfo> => {
            return api.put<BillingInfo>(`/billing?tenantId=${tenantId}`, data);
        },

        /**
         * Download invoice
         */
        downloadInvoice: async (invoiceId: string): Promise<Blob> => {
            // Use the API client to get the current auth token
            const authToken = apiClient["authToken"];
            const response = await fetch(`/api/billing/invoices/${invoiceId}/download`, {
                headers: {
                    Authorization: `Bearer ${authToken}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to download invoice");
            }

            return response.blob();
        },

        /**
         * Process billing webhook
         */
        processWebhook: async (webhookData: any): Promise<void> => {
            return api.post("/billing/webhooks", webhookData);
        },
    };
}
