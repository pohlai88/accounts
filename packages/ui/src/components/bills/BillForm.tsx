import React, { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Calendar,
  User,
  DollarSign,
  FileText,
  Upload,
  Paperclip,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";
import { useVendors } from "../../store/index.js";

export interface BillItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  account?: string;
}

export interface BillAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedAt: string;
  ocrData?: {
    vendor: string;
    amount: number;
    date: string;
    invoiceNumber: string;
    confidence: number;
  };
}

export interface BillFormData {
  vendorId: string;
  vendorName: string;
  billNumber: string;
  billDate: string;
  dueDate: string;
  items: BillItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  attachments: BillAttachment[];
  notes: string;
  status: "draft" | "pending_approval" | "approved" | "paid" | "rejected";
  approvalRequired: boolean;
  approvalThreshold: number;
}

export interface BillFormProps {
  className?: string;
  initialData?: Partial<BillFormData>;
  onSave?: (data: BillFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const BillForm: React.FC<BillFormProps> = ({
  className,
  initialData,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  // Use Zustand store for vendor data
  const { vendors, loading: vendorsLoading, fetchVendors } = useVendors();

  const [formData, setFormData] = useState<BillFormData>({
    vendorId: "",
    vendorName: "",
    billNumber: "",
    billDate: new Date().toISOString().split("T")[0]!,
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
    attachments: [],
    notes: "",
    status: "draft",
    approvalRequired: false,
    approvalThreshold: 1000,
  });

  // Load vendors on component mount
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

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
      approvalRequired: total >= prev.approvalThreshold,
    }));
  }, [formData.items, formData.taxRate, formData.approvalThreshold]);

  const handleItemChange = (itemId: string, field: keyof BillItem, value: string | number) => {
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
    const newItem: BillItem = {
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
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }));
  };

  const handleAttachmentUpload = (files: FileList) => {
    const newAttachments: BillAttachment[] = Array.from(files).map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
      uploadedAt: new Date().toISOString(),
    }));

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments],
    }));
  };

  const removeAttachment = (attachmentId: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(att => att.id !== attachmentId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) {
      onSave(formData);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-6 bg-sys-fill-low rounded w-48"></div>
            <div className="h-8 bg-sys-fill-low rounded w-full"></div>
            <div className="h-4 bg-sys-fill-low rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sys-status-info/10 rounded-lg">
            <FileText className="h-6 w-6 text-sys-status-info" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-sys-text-primary">Create Bill</h1>
            <p className="text-sm text-sys-text-tertiary">
              Enter bill details and attach supporting documents
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-outline"
            aria-label="Cancel bill creation"
          >
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" aria-label="Save bill">
            Save Bill
          </button>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <User className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
          <h2 className="text-lg font-medium text-sys-text-primary">Vendor Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="vendor-search"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Vendor
            </label>
            <div className="relative">
              <select
                id="vendor-select"
                value={formData.vendorId}
                onChange={e => {
                  const selectedVendor = vendors.find(v => v.id === e.target.value);
                  setFormData(prev => ({
                    ...prev,
                    vendorId: e.target.value,
                    vendorName: selectedVendor?.name || ""
                  }));
                }}
                className="input w-full pl-10"
                aria-label="Select vendor"
                aria-describedby="vendor-help"
                disabled={vendorsLoading}
              >
                <option value="">Select a vendor...</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
              <User
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                aria-hidden="true"
              />
            </div>
            <div id="vendor-help" className="sr-only">
              Type to search for existing vendors or enter a new vendor name
            </div>
          </div>

          <div>
            <label
              htmlFor="bill-number"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Bill Number
            </label>
            <input
              id="bill-number"
              type="text"
              placeholder="BILL-2024-001"
              value={formData.billNumber}
              onChange={e => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
              className="input w-full"
              aria-label="Bill number"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label
              htmlFor="bill-date"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Bill Date
            </label>
            <div className="relative">
              <input
                id="bill-date"
                type="date"
                value={formData.billDate}
                onChange={e => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                className="input w-full pl-10"
                aria-label="Bill date"
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
                aria-label="Bill due date"
              />
              <Calendar
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bill Items */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
            <h2 className="text-lg font-medium text-sys-text-primary">Bill Items</h2>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="btn btn-outline btn-sm"
            aria-label="Add new bill item"
          >
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Add Item
          </button>
        </div>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-5">
                <label
                  htmlFor={`item-description-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Description
                </label>
                <input
                  id={`item-description-${item.id}`}
                  type="text"
                  placeholder="Item description"
                  value={item.description}
                  onChange={e => handleItemChange(item.id, "description", e.target.value)}
                  className="input w-full"
                  aria-label={`Item ${index + 1} description`}
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor={`item-quantity-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Qty
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
              <div className="col-span-2">
                <label
                  htmlFor={`item-price-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Unit Price
                </label>
                <input
                  id={`item-price-${item.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={e =>
                    handleItemChange(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                  }
                  className="input w-full"
                  aria-label={`Item ${index + 1} unit price`}
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor={`item-total-${item.id}`}
                  className="block text-sm font-medium text-sys-text-primary mb-2"
                >
                  Total
                </label>
                <input
                  id={`item-total-${item.id}`}
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.total}
                  readOnly
                  className="input w-full bg-sys-fill-low"
                  aria-label={`Item ${index + 1} total`}
                />
              </div>
              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="btn btn-outline btn-sm w-full"
                  aria-label={`Remove item ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Paperclip className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
          <h2 className="text-lg font-medium text-sys-text-primary">Attachments</h2>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-sys-border-subtle rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 text-sys-text-tertiary mx-auto mb-2" aria-hidden="true" />
            <p className="text-sm text-sys-text-secondary mb-2">
              Drop files here or click to upload
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => e.target.files && handleAttachmentUpload(e.target.files)}
              className="hidden"
              id="attachment-upload"
              aria-label="Upload bill attachments"
            />
            <label htmlFor="attachment-upload" className="btn btn-outline btn-sm cursor-pointer">
              Choose Files
            </label>
          </div>

          {formData.attachments.length > 0 && (
            <div className="space-y-2">
              {formData.attachments.map(attachment => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-sys-fill-low rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-sys-text-primary">{attachment.name}</p>
                      <p className="text-xs text-sys-text-tertiary">
                        {(attachment.size / 1024).toFixed(1)} KB •{" "}
                        {new Date(attachment.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttachment(attachment.id)}
                    className="btn btn-outline btn-sm"
                    aria-label={`Remove attachment ${attachment.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Totals */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
          <h2 className="text-lg font-medium text-sys-text-primary">Bill Summary</h2>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-sys-text-secondary">Subtotal</span>
            <span className="text-sm font-medium text-sys-text-primary">
              ${formData.subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-sys-text-secondary">Tax ({formData.taxRate * 100}%)</span>
            <span className="text-sm font-medium text-sys-text-primary">
              ${formData.taxAmount.toFixed(2)}
            </span>
          </div>
          <div className="border-t border-sys-border-hairline pt-3">
            <div className="flex justify-between">
              <span className="text-lg font-semibold text-sys-text-primary">Total</span>
              <span className="text-lg font-semibold text-sys-text-primary">
                ${formData.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {formData.approvalRequired && (
          <div className="mt-4 p-3 bg-sys-status-warning/10 border border-sys-status-warning/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-sys-status-warning rounded-full" aria-hidden="true"></div>
              <span className="text-sm font-medium text-sys-status-warning">
                Approval required (amount ≥ ${formData.approvalThreshold})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <label htmlFor="notes" className="block text-sm font-medium text-sys-text-primary mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          rows={4}
          placeholder="Add any additional notes or comments..."
          value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="input w-full resize-none"
          aria-label="Bill notes"
        />
      </div>
    </form>
  );
};
