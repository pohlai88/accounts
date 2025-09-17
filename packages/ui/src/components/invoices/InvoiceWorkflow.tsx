import React, { useState, useEffect } from "react";
import {
  FileText,
  Users,
  CreditCard,
  Send,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Eye,
  Download,
  Edit,
  Plus,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";
import { InvoiceForm, InvoiceFormData } from "./InvoiceForm.js";
import { InvoiceList, Invoice } from "./InvoiceList.js";
import { CustomerSelector, Customer } from "./CustomerSelector.js";
import { PaymentCapture, Payment } from "./PaymentCapture.js";
import { InvoiceSender } from "./InvoiceSender.js";
import { PaymentReminders, PaymentReminder } from "./PaymentReminders.js";
import { InvoiceStatusTimeline, TimelineEvent } from "./InvoiceStatusTimeline.js";
import { useInvoices, useCustomers } from "../../store/index.js";
import { apiClient } from "../../lib/api-client.js";

export interface InvoiceWorkflowProps {
  className?: string;
  initialInvoice?: Invoice | null;
  onInvoiceSave?: (invoice: InvoiceFormData) => void;
  onInvoiceUpdate?: (invoiceId: string, updates: Partial<InvoiceFormData>) => void;
  onInvoiceDelete?: (invoiceId: string) => void;
  isLoading?: boolean;
}

type WorkflowStep =
  | "list"
  | "create"
  | "edit"
  | "view"
  | "payments"
  | "send"
  | "reminders"
  | "timeline";

export const InvoiceWorkflow: React.FC<InvoiceWorkflowProps> = ({
  className,
  initialInvoice,
  onInvoiceSave,
  onInvoiceUpdate,
  onInvoiceDelete,
  isLoading = false,
}) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(initialInvoice || null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [reminders, setReminders] = useState<PaymentReminder[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Use Zustand store for real data
  const {
    invoices,
    loading: storeLoading,
    error: storeError,
    fetchInvoices,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  } = useInvoices();

  const {
    customers,
    fetchCustomers,
  } = useCustomers();

  // Transform store invoices to match InvoiceList Invoice type
  const transformedInvoices: Invoice[] = invoices.map(invoice => ({
    id: invoice.id,
    number: invoice.invoiceNumber,
    customerName: invoice.customerName || "Unknown Customer",
    customerEmail: "", // Will need to fetch from customer data
    issueDate: invoice.invoiceDate || invoice.createdAt,
    dueDate: invoice.dueDate,
    amount: invoice.totalAmount,
    status: invoice.status as "draft" | "sent" | "paid" | "overdue",
    createdAt: invoice.createdAt,
    updatedAt: invoice.createdAt, // Use createdAt as fallback
  }));

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        await Promise.all([
          fetchInvoices(),
          fetchCustomers(),
        ]);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to load data");
        }
      }
    };

    loadData();
  }, [fetchInvoices, fetchCustomers]);

  // Handle errors from store
  useEffect(() => {
    if (storeError) {
      setError(storeError);
    }
  }, [storeError]);

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentStep("view");
  };

  const handleInvoiceEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setCurrentStep("edit");
  };

  const handleInvoiceCreate = () => {
    setSelectedInvoice(null);
    setCurrentStep("create");
  };

  const handleInvoiceSave = async (invoiceData: InvoiceFormData) => {
    try {
      setError(null);
      await createInvoice(invoiceData);
      onInvoiceSave?.(invoiceData);
      setCurrentStep("list");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to save invoice");
      }
    }
  };

  const handleInvoiceUpdate = async (invoiceId: string, updates: Partial<InvoiceFormData>) => {
    try {
      setError(null);
      await updateInvoice(invoiceId, updates);
      onInvoiceUpdate?.(invoiceId, updates);
      setCurrentStep("list");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update invoice");
      }
    }
  };

  const handleInvoiceDelete = async (invoiceId: string) => {
    try {
      setError(null);
      await deleteInvoice(invoiceId);
      onInvoiceDelete?.(invoiceId);
      setCurrentStep("list");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to delete invoice");
      }
    }
  };

  const handlePaymentCapture = (payment: Payment) => {
    setPayments(prev => [payment, ...prev]);
  };

  const handleReminderSend = (reminder: PaymentReminder) => {
    setReminders(prev => [reminder, ...prev]);
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step) {
      case "list":
        return FileText;
      case "create":
        return Plus;
      case "edit":
        return Edit;
      case "view":
        return Eye;
      case "payments":
        return CreditCard;
      case "send":
        return Send;
      case "reminders":
        return MessageSquare;
      case "timeline":
        return Clock;
      default:
        return FileText;
    }
  };

  const getStepTitle = (step: WorkflowStep) => {
    switch (step) {
      case "list":
        return "Invoices";
      case "create":
        return "Create Invoice";
      case "edit":
        return "Edit Invoice";
      case "view":
        return "Invoice Details";
      case "payments":
        return "Payment Capture";
      case "send":
        return "Send Invoice";
      case "reminders":
        return "Payment Reminders";
      case "timeline":
        return "Invoice Timeline";
      default:
        return "Invoices";
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "list":
        return (
          <InvoiceList
            invoices={transformedInvoices}
            onInvoiceSelect={handleInvoiceSelect}
            onInvoiceEdit={handleInvoiceEdit}
            onInvoiceSend={invoice => {
              setSelectedInvoice(invoice);
              setCurrentStep("send");
            }}
            onInvoiceDownload={invoice => {
              console.log("Download invoice:", invoice);
            }}
            isLoading={isLoading || storeLoading}
          />
        );

      case "create":
        return (
          <InvoiceForm
            onSave={handleInvoiceSave}
            onCancel={() => setCurrentStep("list")}
            isLoading={isLoading}
          />
        );

      case "edit":
        return selectedInvoice ? (
          <InvoiceForm
            initialData={{
              customerName: selectedInvoice.customerName,
              invoiceNumber: selectedInvoice.number,
              issueDate: selectedInvoice.issueDate,
              dueDate: selectedInvoice.dueDate,
              total: selectedInvoice.amount,
              status: selectedInvoice.status,
            }}
            onSave={handleInvoiceSave}
            onCancel={() => setCurrentStep("view")}
            isLoading={isLoading}
          />
        ) : null;

      case "view":
        return selectedInvoice ? (
          <div className="space-y-6">
            {/* Invoice Summary */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-sys-text-primary">
                    {selectedInvoice.number}
                  </h2>
                  <p className="text-sys-text-secondary">
                    {selectedInvoice.customerName} • {selectedInvoice.customerEmail}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={cn(
                      "px-3 py-1 text-sm font-medium rounded-md",
                      selectedInvoice.status === "paid"
                        ? "text-sys-status-success bg-sys-status-success/10"
                        : selectedInvoice.status === "sent"
                          ? "text-sys-status-info bg-sys-status-info/10"
                          : selectedInvoice.status === "overdue"
                            ? "text-sys-status-error bg-sys-status-error/10"
                            : "text-sys-text-tertiary bg-sys-fill-low",
                    )}
                  >
                    {selectedInvoice.status.charAt(0).toUpperCase() +
                      selectedInvoice.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-sys-text-secondary mb-1">Amount</div>
                  <div className="text-2xl font-semibold text-sys-text-primary">
                    ${selectedInvoice.amount.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-sys-text-secondary mb-1">Issue Date</div>
                  <div className="text-lg font-medium text-sys-text-primary">
                    {new Date(selectedInvoice.issueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-sys-text-secondary mb-1">Due Date</div>
                  <div className="text-lg font-medium text-sys-text-primary">
                    {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-sys-text-secondary mb-1">Created</div>
                  <div className="text-lg font-medium text-sys-text-primary">
                    {new Date(selectedInvoice.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentStep("edit")}
                className="btn btn-secondary flex items-center space-x-2"
                aria-label="Edit invoice"
              >
                <Edit className="h-4 w-4" aria-hidden="true" />
                <span>Edit</span>
              </button>
              <button
                onClick={() => setCurrentStep("payments")}
                className="btn btn-secondary flex items-center space-x-2"
                aria-label="Capture payments"
              >
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span>Payments</span>
              </button>
              <button
                onClick={() => setCurrentStep("send")}
                className="btn btn-secondary flex items-center space-x-2"
                aria-label="Send invoice"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                <span>Send</span>
              </button>
              <button
                onClick={() => setCurrentStep("reminders")}
                className="btn btn-secondary flex items-center space-x-2"
                aria-label="Payment reminders"
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
                <span>Reminders</span>
              </button>
              <button
                onClick={() => setCurrentStep("timeline")}
                className="btn btn-secondary flex items-center space-x-2"
                aria-label="View timeline"
              >
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Timeline</span>
              </button>
            </div>
          </div>
        ) : null;

      case "payments":
        return selectedInvoice ? (
          <PaymentCapture
            invoiceId={selectedInvoice.id}
            invoiceAmount={selectedInvoice.amount}
            onPaymentCapture={handlePaymentCapture}
            isLoading={isLoading}
          />
        ) : null;

      case "send":
        return selectedInvoice ? (
          <InvoiceSender
            invoiceId={selectedInvoice.id}
            invoiceNumber={selectedInvoice.number}
            customerEmail={selectedInvoice.customerEmail}
            customerName={selectedInvoice.customerName}
            invoiceAmount={selectedInvoice.amount}
            dueDate={selectedInvoice.dueDate}
            onSend={(method, data) => {
              console.log("Send invoice:", method, data);
            }}
            isLoading={isLoading}
          />
        ) : null;

      case "reminders":
        return selectedInvoice ? (
          <PaymentReminders
            invoiceId={selectedInvoice.id}
            invoiceNumber={selectedInvoice.number}
            customerName={selectedInvoice.customerName}
            customerEmail={selectedInvoice.customerEmail}
            invoiceAmount={selectedInvoice.amount}
            dueDate={selectedInvoice.dueDate}
            onReminderSend={handleReminderSend}
            isLoading={isLoading}
          />
        ) : null;

      case "timeline":
        return selectedInvoice ? (
          <InvoiceStatusTimeline
            invoiceId={selectedInvoice.id}
            events={timelineEvents}
            onEventClick={event => {
              console.log("Timeline event clicked:", event);
            }}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Error Display */}
      {error && (
        <div className="bg-sys-status-error/10 border border-sys-status-error/20 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-sys-status-error" />
            <span className="text-sys-status-error font-medium">Error</span>
          </div>
          <p className="text-sys-status-error mt-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-sys-status-error hover:text-sys-status-error/80 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentStep("list")}
            className="btn btn-ghost flex items-center space-x-2"
            aria-label="Back to invoice list"
          >
            <FileText className="h-4 w-4" aria-hidden="true" />
            <span>Sell</span>
          </button>

          {currentStep !== "list" && (
            <>
              <span className="text-sys-text-tertiary">/</span>
              <div className="flex items-center space-x-2">
                {React.createElement(getStepIcon(currentStep), {
                  className: "h-4 w-4 text-sys-text-tertiary",
                  "aria-hidden": true,
                })}
                <span className="text-sys-text-primary font-medium">
                  {getStepTitle(currentStep)}
                </span>
              </div>
            </>
          )}
        </div>

        {currentStep === "list" && (
          <button
            onClick={handleInvoiceCreate}
            className="btn btn-primary flex items-center space-x-2"
            aria-label="Create new invoice"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>New Invoice</span>
          </button>
        )}
      </div>

      {/* Step Content */}
      {renderStepContent()}
    </div>
  );
};
