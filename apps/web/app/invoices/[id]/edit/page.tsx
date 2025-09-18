"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { InvoiceForm, Alert, Button } from "@aibos/ui";
import { useInvoice } from "@aibos/utils";
import type { TInvoiceCreateRequest } from "@aibos/contracts";

interface InvoiceEditPageProps {
  params: {
    id: string;
  };
}

export default function InvoiceEditPage({ params }: InvoiceEditPageProps) {
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

  const {
    data: invoiceData,
    isLoading,
    error: fetchError,
    refetch
  } = useInvoice(context, params.id);

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
      const updateData: Partial<TInvoiceCreateRequest> = {
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

      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: { title?: string } };
        throw new Error(errorData.error?.title || "Failed to update invoice");
      }

      // Navigate back to invoice detail
      router.push(`/invoices/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/invoices/${params.id}`);
  };

  // Transform invoice data for form
  const getInitialFormData = () => {
    if (!invoiceData) { return undefined; }

    const apiInvoice = invoiceData as {
      id: string;
      invoiceNumber?: string;
      number?: string;
      customerId?: string;
      customerName?: string;
      invoiceDate?: string;
      issueDate?: string;
      dueDate: string;
      currency?: string;
      subtotal?: number;
      taxAmount?: number;
      totalAmount?: number;
      amount?: number;
      status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
      notes?: string;
      lines?: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        lineAmount: number;
        taxAmount: number;
      }>;
    };

    return {
      customerId: apiInvoice.customerId || "",
      customerName: apiInvoice.customerName || "",
      invoiceNumber: apiInvoice.invoiceNumber || apiInvoice.number || "",
      issueDate: apiInvoice.invoiceDate || apiInvoice.issueDate || new Date().toISOString().split("T")[0] || "",
      dueDate: apiInvoice.dueDate?.split("T")[0] || "",
      items: (apiInvoice.lines || []).map((line, index) => ({
        id: line.id || `item-${index}`,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        total: line.lineAmount,
      })),
      subtotal: apiInvoice.subtotal || 0,
      taxRate: 6, // Default GST rate
      taxAmount: apiInvoice.taxAmount || 0,
      total: apiInvoice.totalAmount || apiInvoice.amount || 0,
      notes: apiInvoice.notes || "",
      status: (apiInvoice.status as "draft" | "sent" | "paid" | "overdue") || "draft",
    };
  };

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error Loading Invoice">
          {fetchError.message}
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="secondary" onClick={() => router.push("/invoices")}>
            Back to Invoices
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Edit Invoice</h1>
        </div>
        <p className="text-gray-600">
          Update invoice details and information
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
          initialData={getInitialFormData()}
          onSave={handleSubmit}
          onCancel={handleCancel}
          isLoading={isSubmitting}
        />
      </div>
    </div>
  );
}
