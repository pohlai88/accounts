import React, { useState, useEffect } from "react";
import { Plus, Minus, Trash2, Calendar, User, DollarSign, FileText } from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceFormData {
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string;
  status: "draft" | "sent" | "paid" | "overdue";
}

export interface InvoiceFormProps {
  className?: string;
  initialData?: Partial<InvoiceFormData>;
  onSave?: (data: InvoiceFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  className,
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerId: "",
    customerName: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0]!,
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]!,
    items: [
      {
        id: "1",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    taxRate: 0.1, // 10% default tax rate
    taxAmount: 0,
    total: 0,
    notes: "",
    status: "draft",
  });

  // Initialize with provided data
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  // Calculate totals when items change
  useEffect(() => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = subtotal * formData.taxRate;
    const total = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      total,
    }));
  }, [formData.items, formData.taxRate]);

  const handleItemChange = (itemId: string, field: keyof InvoiceItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };
          if (field === "quantity" || field === "unitPrice") {
            updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
          }
          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (itemId: string) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
      }));
    }
  };

  const handleSave = () => {
    onSave?.(formData);
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className={cn("max-w-4xl mx-auto p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sys-text-primary">Create Invoice</h1>
          <p className="text-sys-text-secondary mt-1">Create a new invoice for your customer</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-sys-text-tertiary">Status:</span>
          <span className="px-2 py-1 text-xs font-medium bg-sys-status-info text-sys-text-primary rounded-md">
            Draft
          </span>
        </div>
      </div>

      {/* Customer Selection */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <User className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
          <h2 className="text-lg font-medium text-sys-text-primary">Customer Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="customer-search"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Customer
            </label>
            <div className="relative">
              <input
                id="customer-search"
                type="text"
                placeholder="Search or select customer..."
                value={formData.customerName}
                onChange={e => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className="input w-full pl-10"
                aria-label="Search and select customer"
                aria-describedby="customer-help"
              />
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                aria-hidden="true"
              />
            </div>
            <div id="customer-help" className="sr-only">
              Type to search for existing customers or enter a new customer name
            </div>
          </div>

          <div>
            <label
              htmlFor="invoice-number"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Invoice Number
            </label>
            <input
              id="invoice-number"
              type="text"
              placeholder="INV-2024-001"
              value={formData.invoiceNumber}
              onChange={e => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
              className="input w-full"
              aria-label="Invoice number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="issue-date"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Issue Date
            </label>
            <div className="relative">
              <input
                id="issue-date"
                type="date"
                value={formData.issueDate}
                onChange={e => setFormData(prev => ({ ...prev, issueDate: e.target.value }))}
                className="input w-full pl-10"
                aria-label="Invoice issue date"
              />
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                aria-hidden="true"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="due-date"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Due Date
            </label>
            <div className="relative">
              <input
                id="due-date"
                type="date"
                value={formData.dueDate}
                onChange={e => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                className="input w-full pl-10"
                aria-label="Invoice due date"
              />
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
            <h2 className="text-lg font-medium text-sys-text-primary">Invoice Items</h2>
          </div>
          <button
            onClick={addItem}
            className="btn btn-secondary flex items-center space-x-2"
            aria-label="Add new invoice item"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Add Item</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-12 md:col-span-5">
                <label
                  htmlFor={`item-description-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Description
                </label>
                <input
                  id={`item-description-${item.id}`}
                  type="text"
                  placeholder="Item or service description"
                  value={item.description}
                  onChange={e => handleItemChange(item.id, "description", e.target.value)}
                  className="input w-full"
                  aria-label={`Item ${index + 1} description`}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label
                  htmlFor={`item-quantity-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Quantity
                </label>
                <input
                  id={`item-quantity-${item.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={e =>
                    handleItemChange(item.id, "quantity", parseFloat(e.target.value) || 0)
                  }
                  className="input w-full"
                  aria-label={`Item ${index + 1} quantity`}
                />
              </div>

              <div className="col-span-6 md:col-span-2">
                <label
                  htmlFor={`item-price-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Unit Price
                </label>
                <div className="relative">
                  <input
                    id={`item-price-${item.id}`}
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e =>
                      handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                    }
                    className="input w-full pl-8"
                    aria-label={`Item ${index + 1} unit price`}
                  />
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="col-span-6 md:col-span-2">
                <label
                  htmlFor={`item-total-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Total
                </label>
                <div className="relative">
                  <input
                    id={`item-total-${item.id}`}
                    type="number"
                    value={item.total}
                    readOnly
                    className="input w-full pl-8 bg-sys-bg-subtle"
                    aria-label={`Item ${index + 1} total amount`}
                  />
                  <DollarSign
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                    aria-hidden="true"
                  />
                </div>
              </div>

              <div className="col-span-6 md:col-span-1">
                <button
                  onClick={() => removeItem(item.id)}
                  disabled={formData.items.length === 1}
                  className="btn btn-ghost text-sys-status-error hover:bg-sys-status-error/10 w-full"
                  aria-label={`Remove item ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Invoice Totals */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h2 className="text-lg font-medium text-sys-text-primary mb-4">Invoice Summary</h2>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sys-text-secondary">Subtotal:</span>
            <span className="font-medium text-sys-text-primary">
              ${formData.subtotal.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sys-text-secondary">Tax ({formData.taxRate * 100}%):</span>
              <input
                type="number"
                min="0"
                max="1"
                step="0.01"
                value={formData.taxRate}
                onChange={e =>
                  setFormData(prev => ({ ...prev, taxRate: parseFloat(e.target.value) || 0 }))
                }
                className="input w-20 h-8 text-sm"
                aria-label="Tax rate percentage"
              />
            </div>
            <span className="font-medium text-sys-text-primary">
              ${formData.taxAmount.toFixed(2)}
            </span>
          </div>

          <div className="border-t border-sys-border-hairline pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-sys-text-primary">Total:</span>
              <span className="text-lg font-semibold text-sys-text-primary">
                ${formData.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <label
          htmlFor="invoice-notes"
          className="block text-sm font-medium text-sys-text-primary mb-2"
        >
          Notes
        </label>
        <textarea
          id="invoice-notes"
          placeholder="Additional notes or terms..."
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={3}
          className="input w-full resize-none"
          aria-label="Invoice notes and terms"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-4">
        <button
          onClick={handleCancel}
          className="btn btn-ghost"
          disabled={isLoading}
          aria-label="Cancel invoice creation"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn btn-primary"
          disabled={isLoading || !formData.customerName || !formData.invoiceNumber}
          aria-label="Save invoice as draft"
        >
          {isLoading ? "Saving..." : "Save Draft"}
        </button>
      </div>
    </div>
  );
};
