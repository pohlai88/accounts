"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardContent, Badge, Alert, Input } from "@aibos/ui";
import { useCustomers } from "@aibos/utils";
import type { TCustomerListRequest } from "@aibos/contracts";

interface Customer {
  id: string;
  customerNumber?: string;
  name: string;
  email?: string;
  phone?: string;
  status: "active" | "inactive";
  createdAt: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
}

export default function CustomersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);

  // Create API request context
  const context = {
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    tenantId: "default-tenant", // Should come from auth context
    companyId: "default-company", // Should come from auth context
    userId: "default-user", // Should come from auth context
    userRole: "user" as const,
  };

  // Prepare filters for API request
  const filters: Partial<TCustomerListRequest> = {
    page: currentPage,
    limit: 20,
    ...(searchTerm && { search: searchTerm }),
    ...(statusFilter && { status: statusFilter }),
  };

  const {
    data: customersData,
    isLoading,
    error,
    refetch
  } = useCustomers(context, filters);

  const customers = (customersData?.customers || []) as Customer[];
  const totalCustomers = customers.length;

  const handleCreateCustomer = () => {
    router.push("/customers/create");
  };

  const handleViewCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}`);
  };

  const handleEditCustomer = (customerId: string) => {
    router.push(`/customers/${customerId}/edit`);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleStatusFilter = (status: "active" | "inactive" | "all") => {
    setStatusFilter(status === "all" ? undefined : status);
    setCurrentPage(1); // Reset to first page when filtering
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" title="Error Loading Customers">
          {error.message || "Failed to load customers"}
        </Alert>
        <div className="mt-4 flex gap-2">
          <Button onClick={() => refetch()}>Retry</Button>
          <Button variant="secondary" onClick={() => router.push("/")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="text-gray-600 mt-1">
              Manage your customer database and relationships
            </p>
          </div>
          <Button onClick={handleCreateCustomer}>
            + Add Customer
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <label htmlFor="customer-search" className="sr-only">
                  Search customers
                </label>
                <Input
                  id="customer-search"
                  type="search"
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full"
                  aria-label="Search customers by name or email"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">Status:</span>
              <div className="flex space-x-1">
                <Button
                  variant={statusFilter === undefined ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "active" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("active")}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === "inactive" ? "primary" : "outline"}
                  size="sm"
                  onClick={() => handleStatusFilter("inactive")}
                >
                  Inactive
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                    <div className="w-20 h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? "No customers match your search criteria. Try adjusting your search or filters."
                : "Get started by adding your first customer."}
            </p>
            <Button onClick={handleCreateCustomer}>
              + Add Your First Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Customer Info */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {customer.name}
                        </h3>
                        <Badge
                          variant={customer.status === "active" ? "success" : "secondary"}
                        >
                          {customer.status}
                        </Badge>
                        {customer.customerNumber && (
                          <span className="text-sm text-gray-500">
                            #{customer.customerNumber}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {customer.email && (
                          <div className="flex items-center space-x-1">
                            <span>📧 {customer.email}</span>
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center space-x-1">
                            <span>📞 {customer.phone}</span>
                          </div>
                        )}
                        {customer.address?.city && customer.address?.state && (
                          <div className="flex items-center space-x-1">
                            <span>📍 {customer.address.city}, {customer.address.state}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-gray-500 mt-2">
                        Created {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewCustomer(customer.id)}
                    >
                      👁️ View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditCustomer(customer.id)}
                    >
                      ✏️ Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results Summary */}
      {!isLoading && customers.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Showing {customers.length} customer{customers.length !== 1 ? "s" : ""}
          {totalCustomers > customers.length && ` of ${totalCustomers} total`}
        </div>
      )}
    </div>
  );
}
