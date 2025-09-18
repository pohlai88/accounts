"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Badge, Alert } from "@aibos/ui";
import { useCustomer } from "@aibos/utils";

interface CustomerDetailPageProps {
  params: {
    id: string;
  };
}

interface Customer {
  id: string;
  customerNumber?: string;
  name: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  currency?: string;
  paymentTerms?: string;
  notes?: string;
  creditLimit?: number;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const router = useRouter();

  // Create API request context
  const context = {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId: "default-tenant", // Should come from auth context
    companyId: "default-company", // Should come from auth context
    userId: "default-user", // Should come from auth context
    userRole: "user" as const,
  };

  const {
    data: customerData,
    isLoading,
    error,
    refetch
  } = useCustomer(context, params.id);

  const customer = customerData as Customer | null;

  const handleEdit = () => {
    router.push(`/customers/${params.id}/edit`);
  };

  const handleBack = () => {
    router.push("/customers");
  };

  const formatPaymentTerms = (terms: string) => {
    switch (terms) {
      case "NET_15": return "Net 15 days";
      case "NET_30": return "Net 30 days";
      case "NET_45": return "Net 45 days";
      case "NET_60": return "Net 60 days";
      case "COD": return "Cash on Delivery";
      case "PREPAID": return "Prepaid";
      default: return terms;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error Loading Customer">
          {error.message || "Failed to load customer details"}
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="secondary" onClick={handleBack}>
            Back to Customers
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
          <div className="space-y-4">
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Customer Not Found">
          The customer you are looking for does not exist or has been deleted.
        </Alert>
        <div className="mt-4">
          <Button onClick={handleBack}>Back to Customers</Button>
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
            onClick={handleBack}
            className="p-2 hover:bg-gray-100"
          >
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Customer Details</h1>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl text-gray-600">{customer.name}</h2>
            <Badge variant={customer.status === "active" ? "success" : "secondary"}>
              {customer.status}
            </Badge>
            {customer.customerNumber && (
              <span className="text-gray-500">#{customer.customerNumber}</span>
            )}
          </div>
          <Button onClick={handleEdit}>
            ✏️ Edit Customer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Customer Name
                </label>
                <p className="text-gray-900 font-medium">{customer.name}</p>
              </div>

              {customer.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Email Address
                  </label>
                  <p className="text-gray-900">
                    <a
                      href={`mailto:${customer.email}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {customer.email}
                    </a>
                  </p>
                </div>
              )}

              {customer.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Phone Number
                  </label>
                  <p className="text-gray-900">
                    <a
                      href={`tel:${customer.phone}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {customer.phone}
                    </a>
                  </p>
                </div>
              )}

              {customer.currency && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Currency
                  </label>
                  <p className="text-gray-900">{customer.currency}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Customer Since
                </label>
                <p className="text-gray-900">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Billing Address
            </h3>

            {customer.billingAddress && (
              customer.billingAddress.street ||
              customer.billingAddress.city ||
              customer.billingAddress.state ||
              customer.billingAddress.postalCode ||
              customer.billingAddress.country
            ) ? (
              <div className="space-y-2">
                {customer.billingAddress.street && (
                  <p className="text-gray-900">{customer.billingAddress.street}</p>
                )}
                <div className="flex items-center space-x-2">
                  {customer.billingAddress.city && (
                    <span className="text-gray-900">{customer.billingAddress.city}</span>
                  )}
                  {customer.billingAddress.state && (
                    <>
                      {customer.billingAddress.city && <span className="text-gray-400">,</span>}
                      <span className="text-gray-900">{customer.billingAddress.state}</span>
                    </>
                  )}
                  {customer.billingAddress.postalCode && (
                    <span className="text-gray-900">{customer.billingAddress.postalCode}</span>
                  )}
                </div>
                {customer.billingAddress.country && (
                  <p className="text-gray-900">{customer.billingAddress.country}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">No billing address provided</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Terms & Credit */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Terms & Credit
            </h3>

            <div className="space-y-4">
              {customer.paymentTerms && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Payment Terms
                  </label>
                  <p className="text-gray-900">{formatPaymentTerms(customer.paymentTerms)}</p>
                </div>
              )}

              {customer.creditLimit !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Credit Limit
                  </label>
                  <p className="text-gray-900">
                    {customer.currency || "MYR"} {customer.creditLimit.toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Notes
            </h3>

            {customer.notes ? (
              <p className="text-gray-900 whitespace-pre-wrap">{customer.notes}</p>
            ) : (
              <p className="text-gray-500 italic">No notes available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/invoices/create?customerId=${customer.id}`)}
              >
                📄 Create Invoice
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/invoices?customerId=${customer.id}`)}
              >
                📋 View Invoices
              </Button>
              <Button
                variant="outline"
                onClick={handleEdit}
              >
                ✏️ Edit Customer
              </Button>
              {customer.email && (
                <Button
                  variant="outline"
                  onClick={() => window.open(`mailto:${customer.email}`, "_blank")}
                >
                  📧 Send Email
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
