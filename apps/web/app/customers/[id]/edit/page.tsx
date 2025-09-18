"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Alert, Input, Label } from "@aibos/ui";
import { useCustomer } from "@aibos/utils";

interface CustomerEditPageProps {
  params: {
    id: string;
  };
}

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  currency: string;
  paymentTerms: string;
  notes: string;
  creditLimit: number;
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

export default function EditCustomerPage({ params }: CustomerEditPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    billingAddress: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Malaysia",
    },
    currency: "MYR",
    paymentTerms: "NET_30",
    notes: "",
    creditLimit: 0,
  });

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
    error: fetchError,
    refetch
  } = useCustomer(context, params.id);

  const customer = customerData as Customer | null;

  // Populate form with customer data
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        billingAddress: {
          street: customer.billingAddress?.street || "",
          city: customer.billingAddress?.city || "",
          state: customer.billingAddress?.state || "",
          postalCode: customer.billingAddress?.postalCode || "",
          country: customer.billingAddress?.country || "Malaysia",
        },
        currency: customer.currency || "MYR",
        paymentTerms: customer.paymentTerms || "NET_30",
        notes: customer.notes || "",
        creditLimit: customer.creditLimit || 0,
      });
    }
  }, [customer]);

  const handleInputChange = (field: keyof CustomerFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddressChange = (field: keyof CustomerFormData["billingAddress"], value: string) => {
    setFormData(prev => ({
      ...prev,
      billingAddress: {
        ...prev.billingAddress,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // In a real implementation, this would use an updateCustomer hook/mutation
      const response = await fetch(`/api/customers/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          billingAddress: {
            street: formData.billingAddress.street || undefined,
            city: formData.billingAddress.city || undefined,
            state: formData.billingAddress.state || undefined,
            postalCode: formData.billingAddress.postalCode || undefined,
            country: formData.billingAddress.country || undefined,
          },
          currency: formData.currency,
          paymentTerms: formData.paymentTerms,
          notes: formData.notes || undefined,
          creditLimit: formData.creditLimit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as { error?: string };
        throw new Error(errorData.error || "Failed to update customer");
      }

      // Navigate back to customer detail
      router.push(`/customers/${params.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/customers/${params.id}`);
  };

  if (fetchError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error Loading Customer">
          {fetchError.message || "Failed to load customer details"}
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="secondary" onClick={() => router.push("/customers")}>
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
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Customer Not Found">
          The customer you are trying to edit does not exist or has been deleted.
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/customers")}>Back to Customers</Button>
        </div>
      </div>
    );
  }

  const isFormValid = formData.name.trim().length > 0;

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
            ← Back
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
        </div>
        <p className="text-gray-600">
          Update customer information and settings
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

      {/* Customer Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customer-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Customer Name *
                </Label>
                <Input
                  id="customer-name"
                  type="text"
                  placeholder="Enter customer name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="w-full"
                  required
                  aria-label="Customer name"
                />
              </div>

              <div>
                <Label htmlFor="customer-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </Label>
                <Input
                  id="customer-email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="w-full"
                  aria-label="Email address"
                />
              </div>

              <div>
                <Label htmlFor="customer-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </Label>
                <Input
                  id="customer-phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="w-full"
                  aria-label="Phone number"
                />
              </div>

              <div>
                <Label htmlFor="customer-currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </Label>
                <select
                  id="customer-currency"
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Currency"
                >
                  <option value="MYR">MYR - Malaysian Ringgit</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Address */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Billing Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="address-street" className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address
                </Label>
                <Input
                  id="address-street"
                  type="text"
                  placeholder="Enter street address"
                  value={formData.billingAddress.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                  className="w-full"
                  aria-label="Street address"
                />
              </div>

              <div>
                <Label htmlFor="address-city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </Label>
                <Input
                  id="address-city"
                  type="text"
                  placeholder="Enter city"
                  value={formData.billingAddress.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  className="w-full"
                  aria-label="City"
                />
              </div>

              <div>
                <Label htmlFor="address-state" className="block text-sm font-medium text-gray-700 mb-2">
                  State/Province
                </Label>
                <Input
                  id="address-state"
                  type="text"
                  placeholder="Enter state or province"
                  value={formData.billingAddress.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                  className="w-full"
                  aria-label="State or province"
                />
              </div>

              <div>
                <Label htmlFor="address-postal" className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </Label>
                <Input
                  id="address-postal"
                  type="text"
                  placeholder="Enter postal code"
                  value={formData.billingAddress.postalCode}
                  onChange={(e) => handleAddressChange("postalCode", e.target.value)}
                  className="w-full"
                  aria-label="Postal code"
                />
              </div>

              <div>
                <Label htmlFor="address-country" className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </Label>
                <select
                  id="address-country"
                  value={formData.billingAddress.country}
                  onChange={(e) => handleAddressChange("country", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Country"
                >
                  <option value="Malaysia">Malaysia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Terms & Credit */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Terms & Credit
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="payment-terms" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Payment Terms
                </Label>
                <select
                  id="payment-terms"
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Payment terms"
                >
                  <option value="NET_15">Net 15 days</option>
                  <option value="NET_30">Net 30 days</option>
                  <option value="NET_45">Net 45 days</option>
                  <option value="NET_60">Net 60 days</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="PREPAID">Prepaid</option>
                </select>
              </div>

              <div>
                <Label htmlFor="credit-limit" className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Limit ({formData.currency})
                </Label>
                <Input
                  id="credit-limit"
                  type="number"
                  placeholder="0.00"
                  value={formData.creditLimit}
                  onChange={(e) => handleInputChange("creditLimit", parseFloat(e.target.value) || 0)}
                  className="w-full"
                  min="0"
                  step="0.01"
                  aria-label="Credit limit"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Notes
            </h2>

            <div>
              <Label htmlFor="customer-notes" className="block text-sm font-medium text-gray-700 mb-2">
                Internal Notes
              </Label>
              <textarea
                id="customer-notes"
                placeholder="Enter any internal notes about this customer..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                aria-label="Customer notes"
              />
              <p className="text-sm text-gray-500 mt-1">
                These notes are for internal use only and will not be visible to the customer.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={!isFormValid || isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Customer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
