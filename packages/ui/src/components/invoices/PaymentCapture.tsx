import React, { useState, useEffect } from 'react';
import {
    CreditCard,
    DollarSign,
    Calendar,
    CheckCircle,
    AlertCircle,
    Receipt,
    Banknote,
    Smartphone,
    Mail,
    MessageSquare
} from 'lucide-react';
import { cn } from '@aibos/ui/utils';

export interface Payment {
    id: string;
    invoiceId: string;
    amount: number;
    method: 'credit_card' | 'bank_transfer' | 'cash' | 'check' | 'digital_wallet';
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    reference?: string;
    notes?: string;
    processedAt?: string;
    createdAt: string;
}

export interface PaymentCaptureProps {
    className?: string;
    invoiceId: string;
    invoiceAmount: number;
    onPaymentCapture?: (payment: Payment) => void;
    onPaymentUpdate?: (paymentId: string, updates: Partial<Payment>) => void;
    isLoading?: boolean;
}

const paymentMethods = {
    credit_card: {
        label: 'Credit Card',
        icon: CreditCard,
        color: 'text-sys-status-info bg-sys-status-info/10',
        description: 'Process payment via credit card'
    },
    bank_transfer: {
        label: 'Bank Transfer',
        icon: Banknote,
        color: 'text-sys-status-success bg-sys-status-success/10',
        description: 'Bank wire or ACH transfer'
    },
    cash: {
        label: 'Cash',
        icon: DollarSign,
        color: 'text-sys-status-warning bg-sys-status-warning/10',
        description: 'Cash payment received'
    },
    check: {
        label: 'Check',
        icon: Receipt,
        color: 'text-sys-text-tertiary bg-sys-fill-low',
        description: 'Check payment received'
    },
    digital_wallet: {
        label: 'Digital Wallet',
        icon: Smartphone,
        color: 'text-brand-primary bg-brand-primary/10',
        description: 'PayPal, Apple Pay, Google Pay, etc.'
    }
};

const paymentStatuses = {
    pending: {
        label: 'Pending',
        icon: AlertCircle,
        color: 'text-sys-status-warning bg-sys-status-warning/10'
    },
    completed: {
        label: 'Completed',
        icon: CheckCircle,
        color: 'text-sys-status-success bg-sys-status-success/10'
    },
    failed: {
        label: 'Failed',
        icon: AlertCircle,
        color: 'text-sys-status-error bg-sys-status-error/10'
    },
    refunded: {
        label: 'Refunded',
        icon: AlertCircle,
        color: 'text-sys-text-tertiary bg-sys-fill-low'
    }
};

export const PaymentCapture: React.FC<PaymentCaptureProps> = ({
    className,
    invoiceId,
    invoiceAmount,
    onPaymentCapture,
    onPaymentUpdate,
    isLoading = false
}) => {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [showCaptureForm, setShowCaptureForm] = useState(false);
    const [newPayment, setNewPayment] = useState<Partial<Payment>>({
        amount: invoiceAmount,
        method: 'credit_card',
        status: 'pending',
        reference: '',
        notes: ''
    });

    // Mock payments data
    const mockPayments: Payment[] = [
        {
            id: '1',
            invoiceId: invoiceId,
            amount: 1250.00,
            method: 'credit_card',
            status: 'completed',
            reference: 'TXN-123456789',
            notes: 'Payment processed successfully',
            processedAt: '2024-01-15T14:30:00Z',
            createdAt: '2024-01-15T14:30:00Z'
        },
        {
            id: '2',
            invoiceId: invoiceId,
            amount: 1250.00,
            method: 'bank_transfer',
            status: 'pending',
            reference: 'ACH-987654321',
            notes: 'Bank transfer initiated',
            createdAt: '2024-01-16T09:15:00Z'
        }
    ];

    useEffect(() => {
        setPayments(mockPayments);
    }, [invoiceId]);

    const totalPaid = payments
        .filter(p => p.status === 'completed')
        .reduce((sum, payment) => sum + payment.amount, 0);

    const remainingAmount = invoiceAmount - totalPaid;
    const isFullyPaid = remainingAmount <= 0;

    const handlePaymentCapture = () => {
        if (newPayment.amount && newPayment.method) {
            const payment: Payment = {
                id: Date.now().toString(),
                invoiceId,
                amount: newPayment.amount,
                method: newPayment.method,
                status: newPayment.status || 'pending',
                reference: newPayment.reference,
                notes: newPayment.notes,
                createdAt: new Date().toISOString()
            };

            setPayments(prev => [payment, ...prev]);
            onPaymentCapture?.(payment);
            setShowCaptureForm(false);
            setNewPayment({
                amount: remainingAmount > 0 ? remainingAmount : invoiceAmount,
                method: 'credit_card',
                status: 'pending',
                reference: '',
                notes: ''
            });
        }
    };

    const handlePaymentUpdate = (paymentId: string, updates: Partial<Payment>) => {
        setPayments(prev =>
            prev.map(payment =>
                payment.id === paymentId
                    ? { ...payment, ...updates }
                    : payment
            )
        );
        onPaymentUpdate?.(paymentId, updates);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
                    <div className="space-y-4">
                        <div className="h-4 bg-sys-fill-low rounded w-32"></div>
                        <div className="h-8 bg-sys-fill-low rounded w-48"></div>
                        <div className="h-4 bg-sys-fill-low rounded w-24"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Payment Summary */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-sys-text-primary">Payment Summary</h2>
                    {isFullyPaid && (
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-sys-status-success" aria-hidden="true" />
                            <span className="text-sm font-medium text-sys-status-success">Fully Paid</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <div className="text-sm text-sys-text-secondary mb-1">Invoice Amount</div>
                        <div className="text-2xl font-semibold text-sys-text-primary">
                            {formatCurrency(invoiceAmount)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-sys-text-secondary mb-1">Amount Paid</div>
                        <div className="text-2xl font-semibold text-sys-status-success">
                            {formatCurrency(totalPaid)}
                        </div>
                    </div>
                    <div>
                        <div className="text-sm text-sys-text-secondary mb-1">Remaining</div>
                        <div className={cn(
                            "text-2xl font-semibold",
                            remainingAmount > 0 ? "text-sys-status-warning" : "text-sys-status-success"
                        )}>
                            {formatCurrency(remainingAmount)}
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-6">
                    <div className="flex justify-between text-sm text-sys-text-secondary mb-2">
                        <span>Payment Progress</span>
                        <span>{Math.round((totalPaid / invoiceAmount) * 100)}%</span>
                    </div>
                    <div className="w-full bg-sys-fill-low rounded-full h-2">
                        <div
                            className="bg-sys-status-success h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((totalPaid / invoiceAmount) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Payment Actions */}
            {remainingAmount > 0 && (
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-sys-text-primary">Capture Payment</h3>
                        <button
                            onClick={() => setShowCaptureForm(!showCaptureForm)}
                            className="btn btn-primary"
                            aria-label="Add new payment"
                        >
                            {showCaptureForm ? 'Cancel' : 'Add Payment'}
                        </button>
                    </div>

                    {showCaptureForm && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="payment-amount" className="block text-sm font-medium text-sys-text-primary mb-2">
                                        Payment Amount
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="payment-amount"
                                            type="number"
                                            min="0"
                                            max={remainingAmount}
                                            step="0.01"
                                            value={newPayment.amount || ''}
                                            onChange={(e) => setNewPayment(prev => ({
                                                ...prev,
                                                amount: parseFloat(e.target.value) || 0
                                            }))}
                                            className="input w-full pl-8"
                                            aria-label="Payment amount"
                                        />
                                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="payment-method" className="block text-sm font-medium text-sys-text-primary mb-2">
                                        Payment Method
                                    </label>
                                    <select
                                        id="payment-method"
                                        value={newPayment.method || 'credit_card'}
                                        onChange={(e) => setNewPayment(prev => ({
                                            ...prev,
                                            method: e.target.value as Payment['method']
                                        }))}
                                        className="input w-full"
                                        aria-label="Payment method"
                                    >
                                        {Object.entries(paymentMethods).map(([value, config]) => (
                                            <option key={value} value={value}>
                                                {config.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="payment-reference" className="block text-sm font-medium text-sys-text-primary mb-2">
                                    Reference Number
                                </label>
                                <input
                                    id="payment-reference"
                                    type="text"
                                    placeholder="Transaction ID, check number, etc."
                                    value={newPayment.reference || ''}
                                    onChange={(e) => setNewPayment(prev => ({
                                        ...prev,
                                        reference: e.target.value
                                    }))}
                                    className="input w-full"
                                    aria-label="Payment reference number"
                                />
                            </div>

                            <div>
                                <label htmlFor="payment-notes" className="block text-sm font-medium text-sys-text-primary mb-2">
                                    Notes
                                </label>
                                <textarea
                                    id="payment-notes"
                                    placeholder="Additional payment details..."
                                    value={newPayment.notes || ''}
                                    onChange={(e) => setNewPayment(prev => ({
                                        ...prev,
                                        notes: e.target.value
                                    }))}
                                    rows={3}
                                    className="input w-full resize-none"
                                    aria-label="Payment notes"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3">
                                <button
                                    onClick={() => setShowCaptureForm(false)}
                                    className="btn btn-ghost"
                                    aria-label="Cancel payment capture"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePaymentCapture}
                                    disabled={!newPayment.amount || newPayment.amount <= 0}
                                    className="btn btn-primary"
                                    aria-label="Capture payment"
                                >
                                    Capture Payment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Payment History */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                <h3 className="text-lg font-medium text-sys-text-primary mb-4">Payment History</h3>

                {payments.length === 0 ? (
                    <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-sys-text-tertiary mx-auto mb-4" aria-hidden="true" />
                        <h4 className="text-lg font-medium text-sys-text-primary mb-2">No payments yet</h4>
                        <p className="text-sys-text-secondary">
                            Capture payments as they are received from customers
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payments.map((payment) => {
                            const method = paymentMethods[payment.method];
                            const status = paymentStatuses[payment.status];
                            const MethodIcon = method.icon;
                            const StatusIcon = status.icon;

                            return (
                                <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-4 border border-sys-border-hairline rounded-lg"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className={cn(
                                                'h-10 w-10 rounded-lg flex items-center justify-center',
                                                method.color
                                            )}>
                                                <MethodIcon className="h-5 w-5" aria-hidden="true" />
                                            </div>
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className="font-medium text-sys-text-primary">
                                                    {method.label}
                                                </span>
                                                <span className={cn(
                                                    'px-2 py-1 text-xs font-medium rounded-md flex items-center space-x-1',
                                                    status.color
                                                )}>
                                                    <StatusIcon className="h-3 w-3" aria-hidden="true" />
                                                    <span>{status.label}</span>
                                                </span>
                                            </div>

                                            <div className="text-sm text-sys-text-secondary">
                                                {payment.reference && (
                                                    <span>Ref: {payment.reference}</span>
                                                )}
                                                {payment.processedAt && (
                                                    <span className="ml-2">
                                                        Processed: {formatDate(payment.processedAt)}
                                                    </span>
                                                )}
                                            </div>

                                            {payment.notes && (
                                                <div className="text-sm text-sys-text-tertiary mt-1">
                                                    {payment.notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-lg font-semibold text-sys-text-primary">
                                            {formatCurrency(payment.amount)}
                                        </div>
                                        <div className="text-sm text-sys-text-secondary">
                                            {formatDate(payment.createdAt)}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
