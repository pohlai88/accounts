// Frontend Component Tests for Dashboard
// Tests dashboard rendering, data display, and user interactions

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dashboard } from '@aibos/ui/components/dashboard/Dashboard';
import { useDashboard } from '@aibos/ui/store';

// Mock the store hooks
vi.mock('@aibos/ui/store', () => ({
    useDashboard: vi.fn(),
}));

// Mock Chart.js
vi.mock('chart.js', () => ({
    Chart: vi.fn(),
    registerables: [],
}));

describe('Dashboard', () => {
    const mockDashboardData = {
        summary: {
            totalRevenue: 50000,
            totalExpenses: 30000,
            netIncome: 20000,
            totalInvoices: 150,
            totalBills: 75,
            totalPayments: 200,
        },
        charts: {
            revenueByMonth: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Revenue',
                        data: [8000, 9000, 10000, 11000, 12000, 13000],
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                    },
                ],
            },
            expensesByCategory: {
                labels: ['Office Supplies', 'Rent', 'Utilities', 'Marketing'],
                datasets: [
                    {
                        label: 'Expenses',
                        data: [5000, 10000, 3000, 7000],
                        backgroundColor: [
                            'rgba(255, 99, 132, 0.2)',
                            'rgba(54, 162, 235, 0.2)',
                            'rgba(255, 205, 86, 0.2)',
                            'rgba(75, 192, 192, 0.2)',
                        ],
                    },
                ],
            },
        },
        recentTransactions: [
            {
                id: '1',
                type: 'invoice',
                description: 'Invoice #INV-001',
                amount: 1000,
                date: '2024-01-15',
                status: 'paid',
            },
            {
                id: '2',
                type: 'bill',
                description: 'Office Supplies',
                amount: -500,
                date: '2024-01-14',
                status: 'paid',
            },
        ],
        alerts: [
            {
                id: '1',
                type: 'warning',
                message: '3 invoices are overdue',
                action: 'View Overdue Invoices',
            },
            {
                id: '2',
                type: 'info',
                message: 'Monthly report is ready',
                action: 'View Report',
            },
        ],
    };

    const mockProps = {
        onRefresh: vi.fn(),
        onViewDetails: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock store hook
        (useDashboard as any).mockReturnValue({
            dashboardData: mockDashboardData,
            loading: false,
            error: null,
            refreshKPIs: vi.fn(),
        });
    });

    describe('Rendering', () => {
        it('should render dashboard title', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        });

        it('should render summary cards', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/total revenue/i)).toBeInTheDocument();
            expect(screen.getByText(/total expenses/i)).toBeInTheDocument();
            expect(screen.getByText(/net income/i)).toBeInTheDocument();
            expect(screen.getByText(/total invoices/i)).toBeInTheDocument();
            expect(screen.getByText(/total bills/i)).toBeInTheDocument();
            expect(screen.getByText(/total payments/i)).toBeInTheDocument();
        });

        it('should render summary values correctly', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText('$50,000')).toBeInTheDocument();
            expect(screen.getByText('$30,000')).toBeInTheDocument();
            expect(screen.getByText('$20,000')).toBeInTheDocument();
            expect(screen.getByText('150')).toBeInTheDocument();
            expect(screen.getByText('75')).toBeInTheDocument();
            expect(screen.getByText('200')).toBeInTheDocument();
        });

        it('should render charts section', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/revenue by month/i)).toBeInTheDocument();
            expect(screen.getByText(/expenses by category/i)).toBeInTheDocument();
        });

        it('should render recent transactions', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/recent transactions/i)).toBeInTheDocument();
            expect(screen.getByText(/invoice #inv-001/i)).toBeInTheDocument();
            expect(screen.getByText(/office supplies/i)).toBeInTheDocument();
        });

        it('should render alerts', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/alerts/i)).toBeInTheDocument();
            expect(screen.getByText(/3 invoices are overdue/i)).toBeInTheDocument();
            expect(screen.getByText(/monthly report is ready/i)).toBeInTheDocument();
        });
    });

    describe('User Interactions', () => {
        it('should call onRefresh when refresh button is clicked', () => {
            render(<Dashboard {...mockProps} />);

            const refreshButton = screen.getByRole('button', { name: /refresh/i });
            fireEvent.click(refreshButton);

            expect(mockProps.onRefresh).toHaveBeenCalled();
        });

        it('should call onViewDetails when view details button is clicked', () => {
            render(<Dashboard {...mockProps} />);

            const viewDetailsButton = screen.getByRole('button', { name: /view details/i });
            fireEvent.click(viewDetailsButton);

            expect(mockProps.onViewDetails).toHaveBeenCalled();
        });

        it('should handle alert actions', () => {
            render(<Dashboard {...mockProps} />);

            const alertAction = screen.getByText(/view overdue invoices/i);
            fireEvent.click(alertAction);

            expect(mockProps.onViewDetails).toHaveBeenCalledWith('overdue-invoices');
        });

        it('should handle transaction clicks', () => {
            render(<Dashboard {...mockProps} />);

            const transaction = screen.getByText(/invoice #inv-001/i);
            fireEvent.click(transaction);

            expect(mockProps.onViewDetails).toHaveBeenCalledWith('invoice-1');
        });
    });

    describe('Loading States', () => {
        it('should show loading spinner when loading', () => {
            (useDashboard as any).mockReturnValue({
                dashboardData: null,
                loading: true,
                error: null,
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/loading/i)).toBeInTheDocument();
        });

        it('should show loading state for individual cards', () => {
            (useDashboard as any).mockReturnValue({
                dashboardData: { ...mockDashboardData, summary: null },
                loading: false,
                error: null,
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/loading summary/i)).toBeInTheDocument();
        });
    });

    describe('Error Handling', () => {
        it('should display error message when data fetch fails', () => {
            (useDashboard as any).mockReturnValue({
                dashboardData: null,
                loading: false,
                error: 'Failed to load dashboard data',
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/failed to load dashboard data/i)).toBeInTheDocument();
        });

        it('should show retry button when error occurs', () => {
            (useDashboard as any).mockReturnValue({
                dashboardData: null,
                loading: false,
                error: 'Failed to load dashboard data',
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            expect(retryButton).toBeInTheDocument();
        });

        it('should call refreshKPIs when retry button is clicked', () => {
            const mockRefreshKPIs = vi.fn();
            (useDashboard as any).mockReturnValue({
                dashboardData: null,
                loading: false,
                error: 'Failed to load dashboard data',
                refreshKPIs: mockRefreshKPIs,
            });

            render(<Dashboard {...mockProps} />);

            const retryButton = screen.getByRole('button', { name: /retry/i });
            fireEvent.click(retryButton);

            expect(mockRefreshKPIs).toHaveBeenCalled();
        });
    });

    describe('Data Formatting', () => {
        it('should format currency values correctly', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText('$50,000')).toBeInTheDocument();
            expect(screen.getByText('$30,000')).toBeInTheDocument();
            expect(screen.getByText('$20,000')).toBeInTheDocument();
        });

        it('should format transaction amounts correctly', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText('+$1,000')).toBeInTheDocument();
            expect(screen.getByText('-$500')).toBeInTheDocument();
        });

        it('should format dates correctly', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
            expect(screen.getByText(/jan 14, 2024/i)).toBeInTheDocument();
        });
    });

    describe('Responsive Design', () => {
        it('should render mobile layout on small screens', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 375,
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        });

        it('should render desktop layout on large screens', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 1920,
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper heading structure', () => {
            render(<Dashboard {...mockProps} />);

            const mainHeading = screen.getByRole('heading', { level: 1 });
            expect(mainHeading).toBeInTheDocument();
            expect(mainHeading).toHaveTextContent(/dashboard/i);
        });

        it('should have proper button labels', () => {
            render(<Dashboard {...mockProps} />);

            expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /view details/i })).toBeInTheDocument();
        });

        it('should have proper table structure for transactions', () => {
            render(<Dashboard {...mockProps} />);

            const table = screen.getByRole('table');
            expect(table).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty dashboard data', () => {
            (useDashboard as any).mockReturnValue({
                dashboardData: {
                    summary: null,
                    charts: null,
                    recentTransactions: [],
                    alerts: [],
                },
                loading: false,
                error: null,
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/no data available/i)).toBeInTheDocument();
        });

        it('should handle missing chart data', () => {
            (useDashboard as any).mockReturnValue({
                dashboardData: {
                    ...mockDashboardData,
                    charts: null,
                },
                loading: false,
                error: null,
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText(/charts not available/i)).toBeInTheDocument();
        });

        it('should handle very large numbers', () => {
            const largeData = {
                ...mockDashboardData,
                summary: {
                    ...mockDashboardData.summary,
                    totalRevenue: 999999999.99,
                },
            };

            (useDashboard as any).mockReturnValue({
                dashboardData: largeData,
                loading: false,
                error: null,
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText('$999,999,999.99')).toBeInTheDocument();
        });

        it('should handle negative net income', () => {
            const negativeData = {
                ...mockDashboardData,
                summary: {
                    ...mockDashboardData.summary,
                    netIncome: -5000,
                },
            };

            (useDashboard as any).mockReturnValue({
                dashboardData: negativeData,
                loading: false,
                error: null,
                refreshKPIs: vi.fn(),
            });

            render(<Dashboard {...mockProps} />);

            expect(screen.getByText('-$5,000')).toBeInTheDocument();
        });
    });
});
