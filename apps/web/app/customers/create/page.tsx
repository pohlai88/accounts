"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Alert, Input, Label } from "@aibos/ui";
import { useCreateCustomer } from "@aibos/utils";
import type { TCustomerCreateRequest } from "@aibos/contracts";

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
  paymentTerms: "NET_15" | "NET_30" | "NET_45" | "NET_60" | "COD" | "PREPAID";
}

export default function CreateCustomerPage() {
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
  });

  // Create API request context
  const context = {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId: "default-tenant", // Should come from auth context
    companyId: "default-company", // Should come from auth context
    userId: "default-user", // Should come from auth context
    userRole: "user" as const,
  };

  const { mutate: createCustomer } = useCreateCustomer(context);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
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
      // Prepare data for API
      const customerData: TCustomerCreateRequest = {
        tenantId: context.tenantId,
        companyId: context.companyId,
        userId: context.userId,
        userRole: context.userRole,
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
      };

      await createCustomer(customerData);

      // Navigate back to customers list
      router.push("/customers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/customers");
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Create Customer</h1>
        </div>
        <p className="text-gray-600">
          Add a new customer to your database
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

        {/* Payment Terms */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Terms
            </h2>

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
              <p className="text-sm text-gray-500 mt-1">
                Default payment terms for invoices to this customer
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
            {isSubmitting ? "Creating..." : "Create Customer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
