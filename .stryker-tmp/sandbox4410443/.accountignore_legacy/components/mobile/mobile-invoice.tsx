// @ts-nocheck
// =====================================================
// Phase 9: Mobile Invoice Component
// Touch-optimized invoice creation and management
// =====================================================

"use client";

import React, { useState, useEffect } from "react";
import {
  MobileLayout,
  MobileCard,
  MobileButton,
  MobileInput,
  MobileSwipeableCard,
} from "./mobile-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Minus,
  Trash2,
  Save,
  Send,
  Download,
  Edit,
  Eye,
  Calendar,
  User,
  DollarSign,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  date: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
}

interface MobileInvoiceProps {
  invoiceId?: string;
  companyId: string;
  userId: string;
}

export function MobileInvoice({ invoiceId, companyId, userId }: MobileInvoiceProps) {
  const [invoice, setInvoice] = useState<Invoice>({
    id: invoiceId || "new",
    invoiceNumber: "INV-001",
    customerName: "",
    customerEmail: "",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    status: "draft",
    items: [{ id: "1", description: "", quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0,
    notes: "",
  });

  const [isEditing, setIsEditing] = useState(!invoiceId);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load invoice data if editing existing invoice
  useEffect(() => {
    if (invoiceId && invoiceId !== "new") {
      // Load invoice data from API
      loadInvoice(invoiceId);
    }
  }, [invoiceId]);

  const loadInvoice = async (id: string) => {
    // Mock data - in real app, this would come from Supabase
    const mockInvoice: Invoice = {
      id: id,
      invoiceNumber: "INV-001",
      customerName: "ABC Corporation",
      customerEmail: "billing@abccorp.com",
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "sent",
      items: [
        { id: "1", description: "Web Development Services", quantity: 40, rate: 75, amount: 3000 },
        { id: "2", description: "UI/UX Design", quantity: 20, rate: 50, amount: 1000 },
      ],
      subtotal: 4000,
      tax: 400,
      total: 4400,
      notes: "Thank you for your business!",
    };

    setInvoice(mockInvoice);
  };

  const updateInvoice = (updates: Partial<Invoice>) => {
    setInvoice(prev => ({ ...prev, ...updates }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };

    setInvoice(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const updateItem = (itemId: string, updates: Partial<InvoiceItem>) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.map(item => (item.id === itemId ? { ...item, ...updates } : item)),
    }));
  };

  const removeItem = (itemId: string) => {
    setInvoice(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

  const calculateAmounts = () => {
    const subtotal = invoice.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    updateInvoice({ subtotal, tax, total });
  };

  // Recalculate amounts when items change
  useEffect(() => {
    calculateAmounts();
  }, [invoice.items]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "secondary";
      case "sent":
        return "default";
      case "paid":
        return "default";
      case "overdue":
        return "destructive";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "draft":
        return <Edit className="h-3 w-3" />;
      case "sent":
        return <Send className="h-3 w-3" />;
      case "paid":
        return <CheckCircle className="h-3 w-3" />;
      case "overdue":
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Save invoice to API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call

      if (invoiceId === "new") {
        // Create new invoice
        console.log("Creating new invoice:", invoice);
      } else {
        // Update existing invoice
        console.log("Updating invoice:", invoice);
      }

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save invoice:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSend = async () => {
    try {
      // Send invoice via email
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
      updateInvoice({ status: "sent" });
    } catch (error) {
      console.error("Failed to send invoice:", error);
    }
  };

  return (
    <MobileLayout
      title={isEditing ? "Edit Invoice" : "Invoice Details"}
      showBackButton={true}
      showAddButton={isEditing}
      onAddClick={addItem}
    >
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          You're offline. Changes will sync when online.
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Invoice Header */}
        <MobileCard>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Invoice #{invoice.invoiceNumber}</h2>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant={getStatusColor(invoice.status)} className="text-xs">
                  {getStatusIcon(invoice.status)}
                  <span className="ml-1 capitalize">{invoice.status}</span>
                </Badge>
              </div>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Invoice Actions */}
          {!isEditing && (
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </MobileCard>

        {/* Customer Information */}
        <MobileCard>
          <h3 className="font-semibold mb-3 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Customer Information
          </h3>

          <div className="space-y-3">
            <MobileInput
              label="Customer Name"
              value={invoice.customerName}
              onChange={e => updateInvoice({ customerName: e.target.value })}
              disabled={!isEditing}
            />
            <MobileInput
              label="Email"
              type="email"
              value={invoice.customerEmail}
              onChange={e => updateInvoice({ customerEmail: e.target.value })}
              disabled={!isEditing}
            />
          </div>
        </MobileCard>

        {/* Invoice Details */}
        <MobileCard>
          <h3 className="font-semibold mb-3 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Invoice Details
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-sm text-muted-foreground">Invoice Date</Label>
              <Input
                type="date"
                value={invoice.date}
                onChange={e => updateInvoice({ date: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Due Date</Label>
              <Input
                type="date"
                value={invoice.dueDate}
                onChange={e => updateInvoice({ dueDate: e.target.value })}
                disabled={!isEditing}
                className="mt-1"
              />
            </div>
          </div>
        </MobileCard>

        {/* Invoice Items */}
        <MobileCard>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Items
            </h3>
            {isEditing && (
              <Button size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {invoice.items.map((item, index) => (
              <MobileSwipeableCard
                key={item.id}
                onSwipeLeft={isEditing ? () => removeItem(item.id) : undefined}
                onSwipeRight={isEditing ? () => removeItem(item.id) : undefined}
              >
                <div className="border border-border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Item {index + 1}</span>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="p-1 h-6 w-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-2">
                    <MobileInput
                      label="Description"
                      value={item.description}
                      onChange={e => updateItem(item.id, { description: e.target.value })}
                      disabled={!isEditing}
                    />

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-sm text-muted-foreground">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e => {
                            const quantity = parseFloat(e.target.value) || 0;
                            const amount = quantity * item.rate;
                            updateItem(item.id, { quantity, amount });
                          }}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Rate</Label>
                        <Input
                          type="number"
                          value={item.rate}
                          onChange={e => {
                            const rate = parseFloat(e.target.value) || 0;
                            const amount = item.quantity * rate;
                            updateItem(item.id, { rate, amount });
                          }}
                          disabled={!isEditing}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Amount</Label>
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={e => {
                          const amount = parseFloat(e.target.value) || 0;
                          const rate = item.quantity > 0 ? amount / item.quantity : 0;
                          updateItem(item.id, { amount, rate });
                        }}
                        disabled={!isEditing}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </MobileSwipeableCard>
            ))}
          </div>
        </MobileCard>

        {/* Invoice Totals */}
        <MobileCard>
          <h3 className="font-semibold mb-3 flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Totals
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (10%)</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
          </div>
        </MobileCard>

        {/* Notes */}
        <MobileCard>
          <h3 className="font-semibold mb-3">Notes</h3>
          <textarea
            value={invoice.notes}
            onChange={e => updateInvoice({ notes: e.target.value })}
            disabled={!isEditing}
            placeholder="Add any additional notes..."
            className="w-full p-3 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
            rows={3}
          />
        </MobileCard>

        {/* Action Buttons */}
        {isEditing && (
          <div className="space-y-3">
            <MobileButton onClick={handleSave} disabled={isSaving} className="h-12">
              {isSaving ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Invoice
                </>
              )}
            </MobileButton>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setIsEditing(false)} className="h-12">
                Cancel
              </Button>
              <Button onClick={handleSend} className="h-12">
                <Send className="h-4 w-4 mr-2" />
                Save & Send
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
