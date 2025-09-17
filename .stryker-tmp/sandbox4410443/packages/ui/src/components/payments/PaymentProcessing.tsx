// @ts-nocheck
// Payment Processing UI Component
// DoD: Payment processing interface with payment methods, allocation, and batch processing
// SSOT: Use new payment API endpoints
// Tech Stack: React + Zustand + API client
// Industry Reference: Xero, QuickBooks, Odoo

import React, { useState, useEffect } from 'react';
import { usePayments, useBankAccounts, useCustomers, useVendors } from '../../store/index.js';

// Types
interface Payment {
    id: string;
    paymentNumber: string;
    amount: number;
    currency: string;
    paymentMethod: 'CASH' | 'CHECK' | 'WIRE_TRANSFER' | 'CREDIT_CARD' | 'ACH' | 'OTHER';
    status: 'PENDING' | 'PROCESSED' | 'FAILED' | 'CANCELLED';
    paymentDate: string;
    reference?: string;
    description?: string;
    supplier?: {
        id: string;
        name: string;
        supplier_number: string;
    };
    customer?: {
        id: string;
        name: string;
        customer_number: string;
    };
    bankAccount?: {
        id: string;
        account_name: string;
        bank_name: string;
        account_number: string;
    };
    allocations?: PaymentAllocation[];
}

interface PaymentAllocation {
    id: string;
    invoiceId?: string;
    billId?: string;
    amount: number;
    description?: string;
}

interface PaymentFormData {
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentDate: string;
    reference: string;
    description: string;
    supplierId?: string;
    customerId?: string;
    bankAccountId: string;
    allocations: PaymentAllocation[];
}

// Payment Method Icons
const PAYMENT_METHOD_ICONS = {
    CASH: '💵',
    CHECK: '📝',
    WIRE_TRANSFER: '🏦',
    CREDIT_CARD: '💳',
    ACH: '🏧',
    OTHER: '💰',
};

// Status Colors
const STATUS_COLORS = {
    PENDING: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    PROCESSED: 'bg-green-50 border-green-200 text-green-800',
    FAILED: 'bg-red-50 border-red-200 text-red-800',
    CANCELLED: 'bg-gray-50 border-gray-200 text-gray-800',
};

export const PaymentProcessing: React.FC = () => {
    const { payments, loading, error, fetchPayments, createPayment, updatePayment } = usePayments();
    const { bankAccounts, fetchBankAccounts } = useBankAccounts();
    const { customers, fetchCustomers } = useCustomers();
    const { vendors, fetchVendors } = useVendors();

    const [showForm, setShowForm] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
    const [formData, setFormData] = useState({
        amount: 0,
        currency: 'MYR',
        paymentMethod: 'CASH' as const,
        paymentDate: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        bankAccountId: '',
        allocations: [] as any[],
    });
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [filterMethod, setFilterMethod] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Load data on component mount
    useEffect(() => {
        fetchPayments();
        fetchBankAccounts();
        fetchCustomers();
        fetchVendors();
    }, [fetchPayments, fetchBankAccounts, fetchCustomers, fetchVendors]);

    // Filter payments
    const filteredPayments = payments.filter(payment => {
        const statusMatch = filterStatus === 'ALL' || payment.status === filterStatus;
        const methodMatch = filterMethod === 'ALL' || payment.paymentMethod === filterMethod;
        const searchMatch = !searchTerm ||
            payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.description?.toLowerCase().includes(searchTerm.toLowerCase());

        return statusMatch && methodMatch && searchMatch;
    });

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                amount: parseFloat(formData.amount.toString()),
                paymentDate: new Date(formData.paymentDate || new Date()).toISOString(),
                // tenantId, companyId, userId would come from context
                tenantId: 'YOUR_TENANT_ID',
                companyId: 'YOUR_COMPANY_ID',
                userId: 'YOUR_USER_ID',
            } as any;

            if (editingPayment) {
                await updatePayment(editingPayment.id, payload);
                setEditingPayment(null);
            } else {
                await createPayment(payload);
            }
            setShowForm(false);
            resetForm();
        } catch (error) {
            console.error('Error saving payment:', error);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            amount: 0,
            currency: 'MYR',
            paymentMethod: 'CASH',
            paymentDate: new Date().toISOString().split('T')[0],
            reference: '',
            description: '',
            bankAccountId: '',
            allocations: [],
        });
    };

    // Handle edit payment
    const handleEdit = (payment: any) => {
        setEditingPayment(payment);
        setFormData({
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            paymentDate: payment.paymentDate.split('T')[0],
            reference: payment.reference ?? '',
            description: payment.description ?? '',
            bankAccountId: payment.bankAccount?.id ?? '',
            allocations: payment.allocations || [],
        });
        setShowForm(true);
    };

    // Add allocation
    const addAllocation = () => {
        setFormData({
            ...formData,
            allocations: [...formData.allocations, { id: Date.now().toString(), amount: 0, description: '' }]
        });
    };

    // Remove allocation
    const removeAllocation = (id: string) => {
        setFormData({
            ...formData,
            allocations: formData.allocations.filter(allocation => allocation.id !== id)
        });
    };

    // Update allocation
    const updateAllocation = (id: string, field: keyof PaymentAllocation, value: any) => {
        setFormData({
            ...formData,
            allocations: formData.allocations.map(allocation =>
                allocation.id === id ? { ...allocation, [field]: value } : allocation
            )
        });
    };

    // Format currency
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-800">Error: {error}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Payment Processing</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                    + Record Payment
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search payments..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSED">Processed</option>
                            <option value="FAILED">Failed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                        <select
                            value={filterMethod}
                            onChange={(e) => setFilterMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="ALL">All Methods</option>
                            <option value="CASH">Cash</option>
                            <option value="CHECK">Check</option>
                            <option value="WIRE_TRANSFER">Wire Transfer</option>
                            <option value="CREDIT_CARD">Credit Card</option>
                            <option value="ACH">ACH</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setFilterStatus('ALL');
                                setFilterMethod('ALL');
                                setSearchTerm('');
                            }}
                            className="w-full px-3 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {filteredPayments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No payments found. {searchTerm && 'Try adjusting your search criteria.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Payment
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Method
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Counterparty
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">
                                                    {payment.paymentNumber}
                                                </div>
                                                {payment.reference && (
                                                    <div className="text-sm text-gray-500">
                                                        Ref: {payment.reference}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatCurrency(payment.amount, payment.currency)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="text-lg mr-2">{PAYMENT_METHOD_ICONS[payment.paymentMethod as keyof typeof PAYMENT_METHOD_ICONS]}</span>
                                                <span className="text-sm text-gray-900">
                                                    {payment.paymentMethod.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[payment.status as keyof typeof STATUS_COLORS]}`}>
                                                {payment.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(payment.paymentDate)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {payment.supplier?.name || payment.customer?.name || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleEdit(payment)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingPayment ? 'Edit Payment' : 'Record New Payment'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Amount</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                                    <select
                                        value={formData.currency}
                                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="MYR">MYR</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="SGD">SGD</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                                    <select
                                        value={formData.paymentMethod}
                                        onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="CHECK">Check</option>
                                        <option value="WIRE_TRANSFER">Wire Transfer</option>
                                        <option value="CREDIT_CARD">Credit Card</option>
                                        <option value="ACH">ACH</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                                    <input
                                        type="date"
                                        value={formData.paymentDate}
                                        onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Reference</label>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Bank Account</label>
                                    <select
                                        value={formData.bankAccountId}
                                        onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select Bank Account</option>
                                        {bankAccounts.map(account => (
                                            <option key={account.id} value={account.id}>
                                                {account.account_name} - {account.bank_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                />
                            </div>

                            {/* Allocations */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Payment Allocations</label>
                                    <button
                                        type="button"
                                        onClick={addAllocation}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        + Add Allocation
                                    </button>
                                </div>
                                {formData.allocations.map((allocation, index) => (
                                    <div key={allocation.id} className="flex space-x-2 mb-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="Amount"
                                            value={allocation.amount}
                                            onChange={(e) => updateAllocation(allocation.id, 'amount', parseFloat(e.target.value) || 0)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={allocation.description}
                                            onChange={(e) => updateAllocation(allocation.id, 'description', e.target.value)}
                                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeAllocation(allocation.id)}
                                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForm(false);
                                        setEditingPayment(null);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {editingPayment ? 'Update' : 'Record'} Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentProcessing;
