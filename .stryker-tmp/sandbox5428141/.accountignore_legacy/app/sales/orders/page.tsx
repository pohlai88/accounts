/**
 * Sales Orders Management Page
 * Dedicated page for sales order management
 */
// @ts-nocheck


"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SalesOrderForm } from "@/components/sales/SalesOrderForm";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

export default function OrdersPage() {
  const [isCreating, setIsCreating] = useState(false);
  const companyId = "default-company-id"; // In real app, get from user context

  if (isCreating) {
    return (
      <div className="container mx-auto py-6">
        <div className="mb-6">
          <Button variant="outline" onClick={() => setIsCreating(false)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>

        <SalesOrderForm
          companyId={companyId}
          onSuccess={() => setIsCreating(false)}
          onCancel={() => setIsCreating(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Sales Orders</h1>
          <p className="text-muted-foreground">
            Manage your sales orders and track delivery & billing status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/sales">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Sales
            </Button>
          </Link>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-muted-foreground">
          Sales order list and management features will be displayed here. Click "New Order" to
          create your first sales order.
        </p>
      </div>
    </div>
  );
}
