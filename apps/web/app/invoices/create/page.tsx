"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceForm, Alert, Button } from "@aibos/ui";
import { useInvoices } from "@aibos/utils";
import type { TInvoiceCreateRequest } from "@aibos/contracts";

export default function CreateInvoicePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create API request context
  const context = {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId: "default-tenant", // Should come from auth context
    companyId: "default-company", // Should come from auth context
    userId: "default-user", // Should come from auth context
    userRole: "user" as const,
  };

  const { refetch: refetchInvoices } = useInvoices(context, { page: 1, limit: 1 }, { enabled: false });

  const handleSubmit = async (formData: {
    customerId: string;
    customerName: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    items: Array<{
      id: string;
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes: string;
    status: "draft" | "sent" | "paid" | "overdue";
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Transform form data to API format
      const createData: TInvoiceCreateRequest = {
        tenantId: context.tenantId,
        companyId: context.companyId,
        userRole: context.userRole,
        customerId: formData.customerId,
        invoiceNumber: formData.invoiceNumber,
        invoiceDate: formData.issueDate,
        dueDate: formData.dueDate,
        currency: "MYR", // Default currency
        description: `Invoice for ${formData.customerName}`,
        notes: formData.notes,
        lines: formData.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxCode: "GST", // Default tax code
          revenueAccountId: "default-revenue-account", // Should come from account selection
        })),
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: { title?: string } };
        throw new Error(errorData.error?.title || "Failed to create invoice");
      }

      const result = await response.json() as { id: string };

      // Refresh invoice list
      await refetchInvoices();

      // Navigate to the new invoice
      router.push(`/invoices/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/invoices");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
        </div>
        <p className="text-gray-600">
          Create a new invoice for your customer
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6">
          <Alert variant="destructive" title="Error">
            {error}
          </Alert>
        </div>
      )}

      {/* Invoice Form */}
      <div className="max-w-4xl">
        <InvoiceForm
          onSave={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
