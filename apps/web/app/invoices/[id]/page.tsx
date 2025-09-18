"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Alert, Badge } from "@aibos/ui";
import { useInvoice } from "@aibos/utils";

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  invoiceDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  notes?: string;
  lines: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineAmount: number;
    taxAmount: number;
  }>;
}

interface InvoiceDetailPageProps {
  params: {
    id: string;
  };
}

export default function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    isLoading: hookLoading,
    error: hookError,
    refetch
  } = useInvoice(context, params.id);

  useEffect(() => {
    if (hookLoading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
      if (hookError) {
        setError(hookError.message);
      } else if (invoiceData) {
        // Transform API data to component format
        const apiInvoice = invoiceData as {
          id: string;
          invoiceNumber?: string;
          number?: string;
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

        const transformedInvoice: Invoice = {
          id: apiInvoice.id,
          invoiceNumber: apiInvoice.invoiceNumber || apiInvoice.number || `INV-${apiInvoice.id.slice(-8)}`,
          customerName: apiInvoice.customerName || "Unknown Customer",
          invoiceDate: apiInvoice.invoiceDate || apiInvoice.issueDate || new Date().toISOString(),
          dueDate: apiInvoice.dueDate,
          currency: apiInvoice.currency || "MYR",
          subtotal: apiInvoice.subtotal || 0,
          taxAmount: apiInvoice.taxAmount || 0,
          totalAmount: apiInvoice.totalAmount || apiInvoice.amount || 0,
          status: apiInvoice.status,
          notes: apiInvoice.notes,
          lines: apiInvoice.lines || [],
        };
        setInvoice(transformedInvoice);
      }
    }
  }, [invoiceData, hookLoading, hookError]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const formatCurrency = (amount: number, currency: string = "MYR") => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleEdit = () => {
    router.push(`/invoices/${params.id}/edit`);
  };

  const handleBack = () => {
    router.push("/invoices");
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error Loading Invoice">
          {error}
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="secondary" onClick={handleBack}>
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

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Invoice Not Found">
          The requested invoice could not be found.
        </Alert>
        <div className="mt-4">
          <Button onClick={handleBack}>Back to Invoices</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack} className="p-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-gray-600">
              View invoice details and information
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(invoice.status)}>
            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
          </Badge>
          <Button onClick={handleEdit}>Edit Invoice</Button>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Invoice Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Header */}
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Bill To:</h3>
                <p className="text-gray-700 font-medium">{invoice.customerName}</p>
              </div>
              <div className="text-right">
                <div className="mb-2">
                  <span className="text-gray-600">Invoice Date: </span>
                  <span className="font-medium">{formatDate(invoice.invoiceDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Due Date: </span>
                  <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Line Items */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-gray-600">Description</th>
                    <th className="text-right py-2 text-gray-600">Qty</th>
                    <th className="text-right py-2 text-gray-600">Unit Price</th>
                    <th className="text-right py-2 text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.lines.map((line) => (
                    <tr key={line.id} className="border-b border-gray-100">
                      <td className="py-3 text-gray-900">{line.description}</td>
                      <td className="py-3 text-right text-gray-700">{line.quantity}</td>
                      <td className="py-3 text-right text-gray-700">
                        {formatCurrency(line.unitPrice, invoice.currency)}
                      </td>
                      <td className="py-3 text-right font-medium text-gray-900">
                        {formatCurrency(line.lineAmount, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card className="p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700">{invoice.notes}</p>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Totals */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">
                  {formatCurrency(invoice.taxAmount, invoice.currency)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Total:</span>
                  <span className="font-bold text-lg">
                    {formatCurrency(invoice.totalAmount, invoice.currency)}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Actions</h3>
            <div className="space-y-3">
              <Button className="w-full" variant="primary">
                Send Invoice
              </Button>
              <Button className="w-full" variant="secondary">
                Download PDF
              </Button>
              <Button className="w-full" variant="ghost">
                Record Payment
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
