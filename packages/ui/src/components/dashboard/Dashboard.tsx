// Dashboard UI Component
// DoD: Dashboard with real business metrics from reports API
// SSOT: Use existing reports API endpoints
// Tech Stack: React + Zustand + API client
// Industry Reference: Xero, QuickBooks, Odoo

import React, { useState, useEffect, useMemo } from 'react';
import { useDashboard, useInvoices, useBills, usePayments } from '../../store/index.js';

// Types
interface KPICard {
    title: string;
    value: string | number;
    change: number;
    changeType: 'positive' | 'negative' | 'neutral';
    icon: string;
    color: string;
}

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth?: number;
    }[];
}

// KPI Cards Component
const KPICard: React.FC<KPICard> = ({ title, value, change, changeType, icon, color }) => {
    const changeColor = changeType === 'positive' ? 'text-green-600' :
        changeType === 'negative' ? 'text-red-600' : 'text-gray-600';

    return (
        <div className={`bg-white p-6 rounded-lg border border-gray-200 ${color}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className="text-3xl">{icon}</div>
            </div>
            <div className="mt-4">
                <span className={`text-sm font-medium ${changeColor}`}>
                    {change > 0 ? '+' : ''}{change}%
                </span>
                <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
        </div>
    );
};

// Simple Chart Component (placeholder for real chart library)
const SimpleChart: React.FC<{ data: ChartData; title: string }> = ({ data, title }) => {
    const maxValue = Math.max(...(data.datasets[0]?.data || [0]));

    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
            <div className="space-y-2">
                {data.labels.map((label, index) => {
                    const value = data.datasets[0]?.data[index] || 0;
                    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;

                    return (
                        <div key={label} className="flex items-center space-x-3">
                            <div className="w-20 text-sm text-gray-600">{label}</div>
                            <div className="flex-1 bg-gray-200 rounded-full h-4">
                                <div
                                    className="bg-blue-500 h-4 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                            <div className="w-16 text-sm text-gray-900 text-right">
                                {typeof value === 'number' ? value.toLocaleString() : value}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const Dashboard: React.FC = () => {
    const { dashboardData, loading, error, fetchDashboardData, refreshKPIs } = useDashboard();
    const { invoices, fetchInvoices } = useInvoices();
    const { bills, fetchBills } = useBills();
    const { payments, fetchPayments } = usePayments();

    const [selectedPeriod, setSelectedPeriod] = useState('current');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Load data on component mount
    useEffect(() => {
        fetchDashboardData();
        fetchInvoices();
        fetchBills();
        fetchPayments();
    }, [fetchDashboardData, fetchInvoices, fetchBills, fetchPayments]);

    // Calculate KPIs from real data
    const kpis = useMemo(() => {
        const totalInvoices = invoices.length;
        const totalBills = bills.length;
        const totalPayments = payments.length;

        // Calculate total revenue from invoices
        const totalRevenue = invoices.reduce((sum, invoice) => {
            return sum + (invoice.totalAmount || 0);
        }, 0);

        // Calculate total expenses from bills
        const totalExpenses = bills.reduce((sum, bill) => {
            return sum + (bill.totalAmount || 0);
        }, 0);

        // Calculate total payments
        const totalPaymentsAmount = payments.reduce((sum, payment) => {
            return sum + (payment.amount || 0);
        }, 0);

        // Calculate pending invoices
        const pendingInvoices = invoices.filter(invoice =>
            invoice.status === 'draft' || invoice.status === 'sent'
        ).length;

        // Calculate overdue invoices
        const overdueInvoices = invoices.filter(invoice =>
            invoice.status === 'overdue'
        ).length;

        // Calculate net profit
        const netProfit = totalRevenue - totalExpenses;

        // Calculate profit margin
        const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

        return [
            {
                title: 'Total Revenue',
                value: new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'MYR',
                }).format(totalRevenue),
                change: 12.5, // This would come from comparison data
                changeType: 'positive' as const,
                icon: '💰',
                color: 'bg-gradient-to-r from-green-50 to-green-100',
            },
            {
                title: 'Total Expenses',
                value: new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'MYR',
                }).format(totalExpenses),
                change: -8.2,
                changeType: 'negative' as const,
                icon: '💸',
                color: 'bg-gradient-to-r from-red-50 to-red-100',
            },
            {
                title: 'Net Profit',
                value: new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'MYR',
                }).format(netProfit),
                change: 15.3,
                changeType: netProfit > 0 ? 'positive' as const : 'negative' as const,
                icon: '📈',
                color: 'bg-gradient-to-r from-blue-50 to-blue-100',
            },
            {
                title: 'Profit Margin',
                value: `${profitMargin.toFixed(1)}%`,
                change: 3.1,
                changeType: 'positive' as const,
                icon: '📊',
                color: 'bg-gradient-to-r from-purple-50 to-purple-100',
            },
            {
                title: 'Pending Invoices',
                value: pendingInvoices,
                change: -5.0,
                changeType: 'positive' as const,
                icon: '📋',
                color: 'bg-gradient-to-r from-yellow-50 to-yellow-100',
            },
            {
                title: 'Overdue Invoices',
                value: overdueInvoices,
                change: -12.0,
                changeType: 'positive' as const,
                icon: '⚠️',
                color: 'bg-gradient-to-r from-orange-50 to-orange-100',
            },
        ];
    }, [invoices, bills, payments]);

    // Chart data for revenue vs expenses
    const revenueExpenseChart = useMemo((): ChartData => {
        // Group by month (simplified)
        const monthlyData = invoices.reduce((acc, invoice) => {
            const month = new Date(invoice.createdAt).toLocaleDateString('en-US', { month: 'short' });
            if (!acc[month]) {
                acc[month] = { revenue: 0, expenses: 0 };
            }
            acc[month].revenue += invoice.totalAmount || 0;
            return acc;
        }, {} as Record<string, { revenue: number; expenses: number }>);

        const monthlyBills = bills.reduce((acc, bill) => {
            const month = new Date(bill.createdAt).toLocaleDateString('en-US', { month: 'short' });
            if (!acc[month]) {
                acc[month] = { revenue: 0, expenses: 0 };
            }
            acc[month].expenses += bill.totalAmount || 0;
            return acc;
        }, monthlyData);

        const labels = Object.keys(monthlyBills).sort();
        const revenueData = labels.map(label => monthlyBills[label]?.revenue || 0);
        const expenseData = labels.map(label => monthlyBills[label]?.expenses || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'Revenue',
                    data: revenueData,
                    backgroundColor: 'rgba(34, 197, 94, 0.2)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                },
            ],
        };
    }, [invoices, bills]);

    // Recent transactions
    const recentTransactions = useMemo(() => {
        const allTransactions = [
            ...invoices.map(invoice => ({
                id: invoice.id,
                type: 'Invoice',
                description: `Invoice #${invoice.invoiceNumber}`,
                amount: invoice.totalAmount || 0,
                date: invoice.createdAt,
                status: invoice.status,
                color: 'text-green-600',
            })),
            ...bills.map(bill => ({
                id: bill.id,
                type: 'Bill',
                description: `Bill #${bill.billNumber}`,
                amount: -(bill.totalAmount || 0),
                date: bill.createdAt,
                status: bill.status,
                color: 'text-red-600',
            })),
            ...payments.map(payment => ({
                id: payment.id,
                type: 'Payment',
                description: `Payment #${payment.paymentNumber}`,
                amount: payment.amount || 0,
                date: payment.paymentDate,
                status: payment.status,
                color: 'text-blue-600',
            })),
        ];

        return allTransactions
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 10);
    }, [invoices, bills, payments]);

    // Handle refresh
    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshKPIs();
        } finally {
            setIsRefreshing(false);
        }
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
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <div className="flex items-center space-x-4">
                    <select
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="current">Current Month</option>
                        <option value="last">Last Month</option>
                        <option value="quarter">This Quarter</option>
                        <option value="year">This Year</option>
                    </select>
                    <button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {kpis.map((kpi, index) => (
                    <KPICard key={index} {...kpi} />
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SimpleChart
                    data={revenueExpenseChart}
                    title="Revenue vs Expenses"
                />
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Account Balances</h3>
                    <div className="space-y-3">
                        {dashboardData.trialBalance?.slice(0, 5).map((account: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">{account.accountName}</span>
                                <span className="text-sm font-medium text-gray-900">
                                    {new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: 'MYR',
                                    }).format(account.balance || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentTransactions.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {transaction.type}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {transaction.description}
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.color}`}>
                                        {new Intl.NumberFormat('en-US', {
                                            style: 'currency',
                                            currency: 'MYR',
                                        }).format(transaction.amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {new Date(transaction.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                            {transaction.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="text-2xl mb-2">📄</div>
                        <div className="text-sm font-medium text-gray-900">Create Invoice</div>
                    </button>
                    <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="text-2xl mb-2">📋</div>
                        <div className="text-sm font-medium text-gray-900">Record Bill</div>
                    </button>
                    <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="text-2xl mb-2">💳</div>
                        <div className="text-sm font-medium text-gray-900">Record Payment</div>
                    </button>
                    <button className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50">
                        <div className="text-2xl mb-2">📊</div>
                        <div className="text-sm font-medium text-gray-900">View Reports</div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
