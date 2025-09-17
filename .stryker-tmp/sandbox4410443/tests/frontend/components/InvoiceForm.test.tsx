// @ts-nocheck
// Frontend Component Tests for InvoiceForm
// Tests form validation, user interactions, and data handling

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InvoiceForm } from '@aibos/ui/components/invoices/InvoiceForm';
import { useInvoices, useCustomers } from '@aibos/ui/store';

// Mock the store hooks
vi.mock('@aibos/ui/store', () => ({
    useInvoices: vi.fn(),
    useCustomers: vi.fn(),
}));

// Mock the API client
vi.mock('@aibos/ui/lib/api-client', () => ({
    ApiClient: vi.fn().mockImplementation(() => ({
        createInvoice: vi.fn(),
        updateInvoice: vi.fn(),
    })),
}));

describe('InvoiceForm', () => {
    const mockCustomers = [
        { id: '1', name: 'Test Customer 1', email: 'customer1@test.com' },
        { id: '2', name: 'Test Customer 2', email: 'customer2@test.com' },
    ];

    const mockInvoice = {
        id: '1',
        customerId: '1',
        amount: 1000.00,
        currency: 'USD',
        dueDate: '2024-02-01',
        description: 'Test Invoice',
        status: 'draft',
        lineItems: [
            {
                id: '1',
                description: 'Test Item',
                quantity: 1,
                unitPrice: 1000.00,
                total: 1000.00,
            },
        ],
    };

    const mockProps = {
        invoice: mockInvoice,
        onSave: vi.fn(),
        onCancel: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock store hooks
        (useInvoices as any).mockReturnValue({
            createInvoice: vi.fn(),
            updateInvoice: vi.fn(),
            loading: false,
            error: null,
        });

        (useCustomers as any).mockReturnValue({
            customers: mockCustomers,
            loading: false,
            error: null,
        });
    });

    describe('Rendering', () => {
        it('should render form fields correctly', () => {
            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        });

        it('should render line items section', () => {
            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByText(/line items/i)).toBeInTheDocument();
            expect(screen.getByText(/test item/i)).toBeInTheDocument();
            expect(screen.getByDisplayValue('1')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1000.00')).toBeInTheDocument();
        });

        it('should render action buttons', () => {
            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
        });

        it('should render add line item button', () => {
            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByRole('button', { name: /add line item/i })).toBeInTheDocument();
        });
    });

    describe('Form Validation', () => {
        it('should show validation errors for required fields', async () => {
            render(<InvoiceForm {...mockProps} />);

            // Clear required fields
            fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '' } });
            fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '' } });

            // Submit form
            fireEvent.click(screen.getByRole('button', { name: /save/i }));

            await waitFor(() => {
                expect(screen.getByText(/amount is required/i)).toBeInTheDocument();
                expect(screen.getByText(/due date is required/i)).toBeInTheDocument();
            });
        });

        it('should validate amount is positive', async () => {
            render(<InvoiceForm {...mockProps} />);

            fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: '-100' } });
            fireEvent.click(screen.getByRole('button', { name: /save/i }));

            await waitFor(() => {
                expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
            });
        });

        it('should validate due date is in the future', async () => {
            render(<InvoiceForm {...mockProps} />);

            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);
            const pastDateString = pastDate.toISOString().split('T')[0];

            fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: pastDateString } });
            fireEvent.click(screen.getByRole('button', { name: /save/i }));

            await waitFor(() => {
                expect(screen.getByText(/due date must be in the future/i)).toBeInTheDocument();
            });
        });

        it('should validate line items', async () => {
            render(<InvoiceForm {...mockProps} />);

            // Clear line item description
            fireEvent.change(screen.getByLabelText(/line item description/i), { target: { value: '' } });
            fireEvent.click(screen.getByRole('button', { name: /save/i }));

            await waitFor(() => {
                expect(screen.getByText(/line item description is required/i)).toBeInTheDocument();
            });
        });
    });

    describe('User Interactions', () => {
        it('should update form fields when user types', () => {
            render(<InvoiceForm {...mockProps} />);

            const amountInput = screen.getByLabelText(/amount/i);
            fireEvent.change(amountInput, { target: { value: '1500' } });

            expect(amountInput).toHaveValue(1500);
        });

        it('should update customer selection', () => {
            render(<InvoiceForm {...mockProps} />);

            const customerSelect = screen.getByLabelText(/customer/i);
            fireEvent.change(customerSelect, { target: { value: '2' } });

            expect(customerSelect).toHaveValue('2');
        });

        it('should add new line item', () => {
            render(<InvoiceForm {...mockProps} />);

            fireEvent.click(screen.getByRole('button', { name: /add line item/i }));

            expect(screen.getAllByLabelText(/line item description/i)).toHaveLength(2);
        });

        it('should remove line item', () => {
            render(<InvoiceForm {...mockProps} />);

            const removeButton = screen.getByRole('button', { name: /remove line item/i });
            fireEvent.click(removeButton);

            expect(screen.queryByText(/test item/i)).not.toBeInTheDocument();
        });

        it('should update line item fields', () => {
            render(<InvoiceForm {...mockProps} />);

            const quantityInput = screen.getByLabelText(/quantity/i);
            fireEvent.change(quantityInput, { target: { value: '2' } });

            expect(quantityInput).toHaveValue(2);
        });
    });

    describe('Form Submission', () => {
        it('should call onSave with form data when valid', async () => {
            const mockOnSave = vi.fn();
            render(<InvoiceForm {...mockProps} onSave={mockOnSave} />);

            fireEvent.click(screen.getByRole('button', { name: /save/i }));

            await waitFor(() => {
                expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
                    customerId: '1',
                    amount: 1000.00,
                    currency: 'USD',
                    dueDate: '2024-02-01',
                    description: 'Test Invoice',
                }));
            });
        });

        it('should call onCancel when cancel button is clicked', () => {
            const mockOnCancel = vi.fn();
            render(<InvoiceForm {...mockProps} onCancel={mockOnCancel} />);

            fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

            expect(mockOnCancel).toHaveBeenCalled();
        });

        it('should show loading state during submission', async () => {
            const mockOnSave = vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
            render(<InvoiceForm {...mockProps} onSave={mockOnSave} />);

            fireEvent.click(screen.getByRole('button', { name: /save/i }));

            expect(screen.getByText(/saving/i)).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText(/saving/i)).not.toBeInTheDocument();
            });
        });
    });

    describe('Error Handling', () => {
        it('should display error message when save fails', async () => {
            const mockOnSave = vi.fn().mockRejectedValue(new Error('Save failed'));
            render(<InvoiceForm {...mockProps} onSave={mockOnSave} />);

            fireEvent.click(screen.getByRole('button', { name: /save/i }));

            await waitFor(() => {
                expect(screen.getByText(/save failed/i)).toBeInTheDocument();
            });
        });

        it('should display store error when present', () => {
            (useInvoices as any).mockReturnValue({
                createInvoice: vi.fn(),
                updateInvoice: vi.fn(),
                loading: false,
                error: 'Store error',
            });

            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByText(/store error/i)).toBeInTheDocument();
        });
    });

    describe('Accessibility', () => {
        it('should have proper form labels', () => {
            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByLabelText(/customer/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
        });

        it('should have proper button labels', () => {
            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /add line item/i })).toBeInTheDocument();
        });

        it('should have proper form structure', () => {
            render(<InvoiceForm {...mockProps} />);

            const form = screen.getByRole('form');
            expect(form).toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('should handle empty line items', () => {
            const emptyInvoice = { ...mockInvoice, lineItems: [] };
            render(<InvoiceForm {...mockProps} invoice={emptyInvoice} />);

            expect(screen.getByText(/no line items/i)).toBeInTheDocument();
        });

        it('should handle missing customer data', () => {
            (useCustomers as any).mockReturnValue({
                customers: [],
                loading: false,
                error: null,
            });

            render(<InvoiceForm {...mockProps} />);

            expect(screen.getByText(/no customers available/i)).toBeInTheDocument();
        });

        it('should handle very large amounts', () => {
            render(<InvoiceForm {...mockProps} />);

            const amountInput = screen.getByLabelText(/amount/i);
            fireEvent.change(amountInput, { target: { value: '999999999.99' } });

            expect(amountInput).toHaveValue(999999999.99);
        });

        it('should handle special characters in description', () => {
            render(<InvoiceForm {...mockProps} />);

            const descriptionInput = screen.getByLabelText(/description/i);
            fireEvent.change(descriptionInput, { target: { value: 'Test & Co. (Ltd.) - Special!@#$%' } });

            expect(descriptionInput).toHaveValue('Test & Co. (Ltd.) - Special!@#$%');
        });
    });
});
