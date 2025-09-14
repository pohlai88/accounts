import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Banknote,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Send,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface PaymentMethod {
  id: string;
  type: "bank_transfer" | "credit_card" | "ach" | "check" | "wire";
  name: string;
  last4?: string;
  bankName?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface PaymentSchedule {
  id: string;
  billId: string;
  amount: number;
  scheduledDate: string;
  status: "scheduled" | "processing" | "completed" | "failed" | "cancelled";
  paymentMethod: PaymentMethod;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
}

export interface PaymentProcessorProps {
  className?: string;
  billId: string;
  billNumber: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  onPaymentProcessed?: (paymentId: string) => void;
  onPaymentScheduled?: (schedule: PaymentSchedule) => void;
  isLoading?: boolean;
}

export const PaymentProcessor: React.FC<PaymentProcessorProps> = ({
  className,
  billId,
  billNumber,
  vendorName,
  amount,
  dueDate,
  onPaymentProcessed,
  onPaymentScheduled,
  isLoading = false,
}) => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(amount);
  const [scheduledDate, setScheduledDate] = useState(dueDate);
  const [isScheduled, setIsScheduled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");

  // Mock payment methods
  const paymentMethods: PaymentMethod[] = [
    {
      id: "1",
      type: "bank_transfer",
      name: "Business Checking",
      last4: "1234",
      bankName: "Chase Bank",
      isDefault: true,
      isActive: true,
    },
    {
      id: "2",
      type: "credit_card",
      name: "Business Credit Card",
      last4: "5678",
      bankName: "American Express",
      isDefault: false,
      isActive: true,
    },
    {
      id: "3",
      type: "ach",
      name: "ACH Transfer",
      last4: "9012",
      bankName: "Wells Fargo",
      isDefault: false,
      isActive: true,
    },
  ];

  useEffect(() => {
    // Set default payment method
    const defaultMethod = paymentMethods.find(method => method.isDefault);
    if (defaultMethod) {
      setSelectedPaymentMethod(defaultMethod);
    }
  }, []);

  const getPaymentMethodIcon = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "bank_transfer":
      case "ach":
        return <Banknote className="h-5 w-5" aria-hidden="true" />;
      case "credit_card":
        return <CreditCard className="h-5 w-5" aria-hidden="true" />;
      case "check":
        return <Banknote className="h-5 w-5" aria-hidden="true" />;
      case "wire":
        return <Send className="h-5 w-5" aria-hidden="true" />;
    }
  };

  const getPaymentMethodColor = (type: PaymentMethod["type"]) => {
    switch (type) {
      case "bank_transfer":
      case "ach":
        return "text-sys-status-info bg-sys-status-info/10";
      case "credit_card":
        return "text-sys-status-success bg-sys-status-success/10";
      case "check":
        return "text-sys-status-warning bg-sys-status-warning/10";
      case "wire":
        return "text-sys-status-error bg-sys-status-error/10";
    }
  };

  const handleProcessPayment = async () => {
    if (!selectedPaymentMethod) return;

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const paymentId = `pay_${Date.now()}`;

    if (onPaymentProcessed) {
      onPaymentProcessed(paymentId);
    }

    setIsProcessing(false);
  };

  const handleSchedulePayment = async () => {
    if (!selectedPaymentMethod) return;

    const schedule: PaymentSchedule = {
      id: `sched_${Date.now()}`,
      billId,
      amount: paymentAmount,
      scheduledDate,
      status: "scheduled",
      paymentMethod: selectedPaymentMethod,
      createdAt: new Date().toISOString(),
    };

    if (onPaymentScheduled) {
      onPaymentScheduled(schedule);
    }
  };

  const isOverdue = new Date(dueDate) < new Date();
  const canPayNow = selectedPaymentMethod && paymentAmount > 0;
  const canSchedule = selectedPaymentMethod && paymentAmount > 0 && scheduledDate;

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
          <div className="space-y-4">
            <div className="h-4 bg-sys-fill-low rounded w-32"></div>
            <div className="h-8 bg-sys-fill-low rounded w-full"></div>
            <div className="h-4 bg-sys-fill-low rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-sys-status-success/10 rounded-lg">
          <DollarSign className="h-6 w-6 text-sys-status-success" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-sys-text-primary">Payment Processing</h2>
          <p className="text-sm text-sys-text-tertiary">Process payment for {billNumber}</p>
        </div>
      </div>

      {/* Bill Summary */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h3 className="text-lg font-medium text-sys-text-primary mb-4">Bill Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-xs text-sys-text-tertiary mb-1">Vendor</p>
            <p className="text-sm font-medium text-sys-text-primary">{vendorName}</p>
          </div>
          <div>
            <p className="text-xs text-sys-text-tertiary mb-1">Amount</p>
            <p className="text-sm font-medium text-sys-text-primary">${amount.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-sys-text-tertiary mb-1">Due Date</p>
            <p
              className={cn(
                "text-sm font-medium",
                isOverdue ? "text-sys-status-error" : "text-sys-text-primary",
              )}
            >
              {new Date(dueDate).toLocaleDateString()}
              {isOverdue && " (Overdue)"}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h3 className="text-lg font-medium text-sys-text-primary mb-4">Payment Method</h3>
        <div className="space-y-3">
          {paymentMethods.map(method => (
            <div
              key={method.id}
              className={cn(
                "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-colors",
                selectedPaymentMethod?.id === method.id
                  ? "border-sys-status-info bg-sys-status-info/5"
                  : "border-sys-border-hairline hover:border-sys-border-subtle",
              )}
              onClick={() => setSelectedPaymentMethod(method)}
            >
              <div className="flex items-center space-x-3">
                <div className={cn("p-2 rounded-lg", getPaymentMethodColor(method.type))}>
                  {getPaymentMethodIcon(method.type)}
                </div>
                <div>
                  <p className="text-sm font-medium text-sys-text-primary">{method.name}</p>
                  <p className="text-xs text-sys-text-tertiary">
                    {method.bankName} •••• {method.last4}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {method.isDefault && (
                  <span className="px-2 py-1 bg-sys-status-info/10 text-sys-status-info text-xs rounded-full">
                    Default
                  </span>
                )}
                <div
                  className={cn(
                    "w-4 h-4 rounded-full border-2",
                    selectedPaymentMethod?.id === method.id
                      ? "border-sys-status-info bg-sys-status-info"
                      : "border-sys-border-subtle",
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Amount */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h3 className="text-lg font-medium text-sys-text-primary mb-4">Payment Amount</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="payment-amount"
              className="block text-sm font-medium text-sys-text-primary mb-2"
            >
              Amount to Pay
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-sys-text-tertiary" aria-hidden="true" />
              </div>
              <input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                max={amount}
                value={paymentAmount}
                onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                className="input w-full pl-10"
                aria-label="Payment amount"
              />
            </div>
            <p className="text-xs text-sys-text-tertiary mt-1">Maximum: ${amount.toFixed(2)}</p>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setPaymentAmount(amount)}
              className="btn btn-outline btn-sm"
              aria-label="Set payment amount to full bill amount"
            >
              Full Amount
            </button>
            <button
              onClick={() => setPaymentAmount(amount / 2)}
              className="btn btn-outline btn-sm"
              aria-label="Set payment amount to half of bill amount"
            >
              Half Amount
            </button>
          </div>
        </div>
      </div>

      {/* Payment Options */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h3 className="text-lg font-medium text-sys-text-primary mb-4">Payment Options</h3>

        <div className="space-y-4">
          {/* Pay Now */}
          <div className="border border-sys-border-hairline rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sys-status-success/10 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-sys-status-success" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-sys-text-primary">Pay Now</h4>
                  <p className="text-xs text-sys-text-tertiary">Process payment immediately</p>
                </div>
              </div>
              <button
                onClick={handleProcessPayment}
                disabled={!canPayNow || isProcessing}
                className="btn btn-primary"
                aria-label="Process payment now"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    Processing...
                  </>
                ) : (
                  "Pay Now"
                )}
              </button>
            </div>
          </div>

          {/* Schedule Payment */}
          <div className="border border-sys-border-hairline rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-sys-status-info/10 rounded-lg">
                  <Calendar className="h-5 w-5 text-sys-status-info" aria-hidden="true" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-sys-text-primary">Schedule Payment</h4>
                  <p className="text-xs text-sys-text-tertiary">Set payment for a future date</p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduled(!isScheduled)}
                className="btn btn-outline"
                aria-label="Toggle payment scheduling"
              >
                {isScheduled ? "Cancel" : "Schedule"}
              </button>
            </div>

            {isScheduled && (
              <div className="space-y-4 pt-4 border-t border-sys-border-hairline">
                <div>
                  <label
                    htmlFor="scheduled-date"
                    className="block text-sm font-medium text-sys-text-primary mb-2"
                  >
                    Scheduled Date
                  </label>
                  <div className="relative">
                    <input
                      id="scheduled-date"
                      type="date"
                      value={scheduledDate}
                      onChange={e => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="input w-full pl-10"
                      aria-label="Scheduled payment date"
                    />
                    <Calendar
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="payment-notes"
                    className="block text-sm font-medium text-sys-text-primary mb-2"
                  >
                    Payment Notes (Optional)
                  </label>
                  <textarea
                    id="payment-notes"
                    value={paymentNotes}
                    onChange={e => setPaymentNotes(e.target.value)}
                    placeholder="Add any notes about this payment..."
                    rows={3}
                    className="input w-full resize-none"
                    aria-label="Payment notes"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSchedulePayment}
                    disabled={!canSchedule}
                    className="btn btn-primary"
                    aria-label="Schedule payment"
                  >
                    <Calendar className="h-4 w-4 mr-2" aria-hidden="true" />
                    Schedule Payment
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Summary */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
        <h3 className="text-lg font-medium text-sys-text-primary mb-4">Payment Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-sys-text-secondary">Bill Amount</span>
            <span className="text-sm font-medium text-sys-text-primary">${amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-sys-text-secondary">Payment Amount</span>
            <span className="text-sm font-medium text-sys-text-primary">
              ${paymentAmount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-sys-text-secondary">Payment Method</span>
            <span className="text-sm font-medium text-sys-text-primary">
              {selectedPaymentMethod?.name || "Not selected"}
            </span>
          </div>
          <div className="border-t border-sys-border-hairline pt-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-sys-text-primary">Remaining Balance</span>
              <span className="text-sm font-medium text-sys-text-primary">
                ${(amount - paymentAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-sys-status-info/10 border border-sys-status-info/20 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-4 w-4 text-sys-status-info" aria-hidden="true" />
          <span className="text-sm text-sys-status-info">
            All payments are processed securely using bank-grade encryption
          </span>
        </div>
      </div>
    </div>
  );
};
