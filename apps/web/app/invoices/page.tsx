"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  InvoiceList,
  Button,
  Card,
  Alert
} from "@aibos/ui";
import { useInvoices } from "@aibos/utils";

interface Invoice {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  createdAt: string;
  updatedAt: string;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [currentPage] = useState(1); // Future: implement pagination
  const [filters] = useState<{
    status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
    customerId?: string;
    fromDate?: string;
    toDate?: string;
  }>({});

  // Create API request context with proper structure
  const context = {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId: "default-tenant", // Should come from auth context
    companyId: "default-company", // Should come from auth context
    userId: "default-user", // Should come from auth context
    userRole: "user" as const,
  };

  const {
    data: invoicesData,
    isLoading,
    error,
    refetch
  } = useInvoices(context, {
    page: currentPage,
    limit: 20,
    ...filters,
  });

  // Transform API data to match InvoiceList component interface
  const transformedInvoices: Invoice[] = React.useMemo(() => {
    if (!invoicesData?.invoices) { return []; }

    return (invoicesData.invoices as unknown[]).map((invoiceData) => {
      const invoice = invoiceData as {
        id: string;
        invoiceNumber?: string;
        number?: string;
        customerName?: string;
        customer?: { name?: string; email?: string };
        invoiceDate?: string;
        issueDate?: string;
        dueDate: string;
        totalAmount?: number;
        amount?: number;
        status: "draft" | "sent" | "paid" | "overdue";
        createdAt: string;
        updatedAt?: string;
      };

      return {
        id: invoice.id,
        number: invoice.invoiceNumber || invoice.number || `INV-${invoice.id.slice(-8)}`,
        customerName: invoice.customerName || invoice.customer?.name || "Unknown Customer",
        customerEmail: invoice.customer?.email || "",
        issueDate: invoice.invoiceDate || invoice.issueDate || invoice.createdAt,
        dueDate: invoice.dueDate,
        amount: invoice.totalAmount || invoice.amount || 0,
        status: invoice.status,
        createdAt: invoice.createdAt,
        updatedAt: invoice.updatedAt || invoice.createdAt,
      };
    });
  }, [invoicesData]);

  const handleCreateInvoice = () => {
    router.push("/invoices/create");
  };

  const handleViewInvoice = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}`);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    router.push(`/invoices/${invoice.id}/edit`);
  };

  // Error boundary
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert
          variant="destructive"
          title="Error Loading Invoices"
        >
          {error.message || "Failed to load invoices. Please try again."}
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="secondary" onClick={() => router.push("/")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">
            Manage your customer invoices and track payments
          </p>
        </div>
        <Button
          onClick={handleCreateInvoice}
          className="flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Invoice
        </Button>
      </div>

      {/* Invoice List */}
      <Card className="p-0">
        <InvoiceList
          invoices={transformedInvoices}
          onInvoiceSelect={handleViewInvoice}
          onInvoiceEdit={handleEditInvoice}
          onInvoiceSend={(invoice) => {
            // Future implementation for sending invoices
            void invoice; // Prevent console.log violation
          }}
          onInvoiceDownload={(invoice) => {
            // Future implementation for downloading invoices
            void invoice; // Prevent console.log violation
          }}
          isLoading={isLoading}
        />
      </Card>

      {/* Pagination would be handled by InvoiceList component internally */}
      {/* or we can add pagination controls here if needed */}
    </div>
  );
}
