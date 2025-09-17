// Integration Tests for Invoice API Endpoints
// Tests complete invoice workflow from creation to payment

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { testConfig, createTestInvoice, createTestCustomer, createTestPayment } from '../../config/test-config';
import { ApiClient } from '@aibos/ui/lib/api-client';

describe('Invoice API Integration', () => {
    let apiClient: ApiClient;
    let testCustomer: any;
    let testInvoice: any;
    let testPayment: any;

    beforeAll(async () => {
        apiClient = new ApiClient();
        // Setup test data
        testCustomer = await createTestCustomer();
    });

    afterAll(async () => {
        // Cleanup test data
        if (testCustomer?.id) {
            await apiClient.deleteCustomer(testCustomer.id);
        }
    });

    beforeEach(async () => {
        // Create fresh test invoice for each test
        testInvoice = await createTestInvoice(testCustomer.id);
    });

    afterEach(async () => {
        // Cleanup test invoice
        if (testInvoice?.id) {
            await apiClient.deleteInvoice(testInvoice.id);
        }
    });

    describe('Invoice CRUD Operations', () => {
        it('should create invoice successfully', async () => {
            const invoiceData = {
                customerId: testCustomer.id,
                amount: 1000.00,
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Test invoice',
                lineItems: [
                    {
                        description: 'Test item',
                        quantity: 1,
                        unitPrice: 1000.00,
                        total: 1000.00,
                    },
                ],
            };

            const result = await apiClient.createInvoice(invoiceData);

            expect(result.success).toBe(true);
            expect(result.invoice).toBeDefined();
            expect(result.invoice.customerId).toBe(testCustomer.id);
            expect(result.invoice.amount).toBe(1000.00);
            expect(result.invoice.status).toBe('draft');
        });

        it('should get invoice by ID', async () => {
            const result = await apiClient.getInvoice(testInvoice.id);

            expect(result.success).toBe(true);
            expect(result.invoice).toBeDefined();
            expect(result.invoice.id).toBe(testInvoice.id);
            expect(result.invoice.customerId).toBe(testCustomer.id);
        });

        it('should get all invoices', async () => {
            const result = await apiClient.getInvoices();

            expect(result.success).toBe(true);
            expect(result.invoices).toBeDefined();
            expect(Array.isArray(result.invoices)).toBe(true);
            expect(result.invoices.length).toBeGreaterThan(0);
        });

        it('should update invoice successfully', async () => {
            const updateData = {
                amount: 1200.00,
                description: 'Updated test invoice',
            };

            const result = await apiClient.updateInvoice(testInvoice.id, updateData);

            expect(result.success).toBe(true);
            expect(result.invoice).toBeDefined();
            expect(result.invoice.amount).toBe(1200.00);
            expect(result.invoice.description).toBe('Updated test invoice');
        });

        it('should delete invoice successfully', async () => {
            const result = await apiClient.deleteInvoice(testInvoice.id);

            expect(result.success).toBe(true);

            // Verify invoice is deleted
            const getResult = await apiClient.getInvoice(testInvoice.id);
            expect(getResult.success).toBe(false);
        });
    });

    describe('Invoice Status Management', () => {
        it('should send invoice', async () => {
            const result = await apiClient.sendInvoice(testInvoice.id);

            expect(result.success).toBe(true);
            expect(result.invoice.status).toBe('sent');
        });

        it('should mark invoice as paid', async () => {
            // First send the invoice
            await apiClient.sendInvoice(testInvoice.id);

            // Then mark as paid
            const result = await apiClient.markInvoicePaid(testInvoice.id);

            expect(result.success).toBe(true);
            expect(result.invoice.status).toBe('paid');
        });

        it('should cancel invoice', async () => {
            const result = await apiClient.cancelInvoice(testInvoice.id);

            expect(result.success).toBe(true);
            expect(result.invoice.status).toBe('cancelled');
        });
    });

    describe('Invoice Payment Processing', () => {
        it('should process payment for invoice', async () => {
            // First send the invoice
            await apiClient.sendInvoice(testInvoice.id);

            // Create payment
            const paymentData = {
                invoiceId: testInvoice.id,
                amount: testInvoice.amount,
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const paymentResult = await apiClient.createPayment(paymentData);
            expect(paymentResult.success).toBe(true);

            // Verify invoice is marked as paid
            const invoiceResult = await apiClient.getInvoice(testInvoice.id);
            expect(invoiceResult.invoice.status).toBe('paid');
        });

        it('should handle partial payment', async () => {
            // First send the invoice
            await apiClient.sendInvoice(testInvoice.id);

            // Create partial payment
            const paymentData = {
                invoiceId: testInvoice.id,
                amount: testInvoice.amount / 2, // Half payment
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const paymentResult = await apiClient.createPayment(paymentData);
            expect(paymentResult.success).toBe(true);

            // Verify invoice is still sent (not fully paid)
            const invoiceResult = await apiClient.getInvoice(testInvoice.id);
            expect(invoiceResult.invoice.status).toBe('sent');
        });

        it('should handle overpayment', async () => {
            // First send the invoice
            await apiClient.sendInvoice(testInvoice.id);

            // Create overpayment
            const paymentData = {
                invoiceId: testInvoice.id,
                amount: testInvoice.amount * 1.5, // 150% payment
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const paymentResult = await apiClient.createPayment(paymentData);
            expect(paymentResult.success).toBe(true);

            // Verify invoice is marked as paid
            const invoiceResult = await apiClient.getInvoice(testInvoice.id);
            expect(invoiceResult.invoice.status).toBe('paid');
        });
    });

    describe('Invoice Reporting', () => {
        it('should get invoice summary', async () => {
            const result = await apiClient.getInvoiceSummary();

            expect(result.success).toBe(true);
            expect(result.summary).toBeDefined();
            expect(result.summary.totalInvoices).toBeGreaterThan(0);
            expect(result.summary.totalAmount).toBeGreaterThan(0);
        });

        it('should get overdue invoices', async () => {
            // Create an overdue invoice
            const overdueInvoice = await apiClient.createInvoice({
                customerId: testCustomer.id,
                amount: 500.00,
                currency: 'USD',
                dueDate: '2023-01-01', // Past due date
                description: 'Overdue invoice',
                lineItems: [
                    {
                        description: 'Overdue item',
                        quantity: 1,
                        unitPrice: 500.00,
                        total: 500.00,
                    },
                ],
            });

            const result = await apiClient.getOverdueInvoices();

            expect(result.success).toBe(true);
            expect(result.invoices).toBeDefined();
            expect(Array.isArray(result.invoices)).toBe(true);
            expect(result.invoices.length).toBeGreaterThan(0);

            // Cleanup
            await apiClient.deleteInvoice(overdueInvoice.invoice.id);
        });

        it('should get invoice analytics', async () => {
            const result = await apiClient.getInvoiceAnalytics();

            expect(result.success).toBe(true);
            expect(result.analytics).toBeDefined();
            expect(result.analytics.totalRevenue).toBeGreaterThan(0);
            expect(result.analytics.averageInvoiceValue).toBeGreaterThan(0);
        });
    });

    describe('Invoice Validation', () => {
        it('should validate required fields', async () => {
            const invalidData = {
                customerId: '',
                amount: 0,
                currency: '',
            };

            const result = await apiClient.createInvoice(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Missing required fields');
        });

        it('should validate customer exists', async () => {
            const invalidData = {
                customerId: 'invalid-customer-id',
                amount: 1000.00,
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Test invoice',
            };

            const result = await apiClient.createInvoice(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Customer not found');
        });

        it('should validate amount is positive', async () => {
            const invalidData = {
                customerId: testCustomer.id,
                amount: -1000.00, // Negative amount
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Test invoice',
            };

            const result = await apiClient.createInvoice(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Amount must be positive');
        });

        it('should validate currency format', async () => {
            const invalidData = {
                customerId: testCustomer.id,
                amount: 1000.00,
                currency: 'INVALID', // Invalid currency
                dueDate: '2024-02-01',
                description: 'Test invoice',
            };

            const result = await apiClient.createInvoice(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid currency');
        });
    });

    describe('Invoice Workflow', () => {
        it('should complete full invoice workflow', async () => {
            // 1. Create invoice
            const createResult = await apiClient.createInvoice({
                customerId: testCustomer.id,
                amount: 1000.00,
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Full workflow test invoice',
                lineItems: [
                    {
                        description: 'Test item',
                        quantity: 1,
                        unitPrice: 1000.00,
                        total: 1000.00,
                    },
                ],
            });

            expect(createResult.success).toBe(true);
            const invoiceId = createResult.invoice.id;

            // 2. Send invoice
            const sendResult = await apiClient.sendInvoice(invoiceId);
            expect(sendResult.success).toBe(true);
            expect(sendResult.invoice.status).toBe('sent');

            // 3. Process payment
            const paymentResult = await apiClient.createPayment({
                invoiceId: invoiceId,
                amount: 1000.00,
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            });
            expect(paymentResult.success).toBe(true);

            // 4. Verify invoice is paid
            const finalResult = await apiClient.getInvoice(invoiceId);
            expect(finalResult.success).toBe(true);
            expect(finalResult.invoice.status).toBe('paid');

            // 5. Cleanup
            await apiClient.deleteInvoice(invoiceId);
        });

        it('should handle invoice with multiple line items', async () => {
            const invoiceData = {
                customerId: testCustomer.id,
                amount: 1500.00,
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Multi-item invoice',
                lineItems: [
                    {
                        description: 'Item 1',
                        quantity: 2,
                        unitPrice: 500.00,
                        total: 1000.00,
                    },
                    {
                        description: 'Item 2',
                        quantity: 1,
                        unitPrice: 500.00,
                        total: 500.00,
                    },
                ],
            };

            const result = await apiClient.createInvoice(invoiceData);

            expect(result.success).toBe(true);
            expect(result.invoice.lineItems).toHaveLength(2);
            expect(result.invoice.amount).toBe(1500.00);

            // Cleanup
            await apiClient.deleteInvoice(result.invoice.id);
        });
    });

    describe('Performance Testing', () => {
        it('should create invoice within performance threshold', async () => {
            const invoiceData = {
                customerId: testCustomer.id,
                amount: 1000.00,
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Performance test invoice',
            };

            const startTime = performance.now();
            const result = await apiClient.createInvoice(invoiceData);
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result.success).toBe(true);

            // Cleanup
            await apiClient.deleteInvoice(result.invoice.id);
        });

        it('should handle bulk invoice operations efficiently', async () => {
            const invoiceCount = 10;
            const invoices = [];

            const startTime = performance.now();

            // Create multiple invoices
            for (let i = 0; i < invoiceCount; i++) {
                const invoiceData = {
                    customerId: testCustomer.id,
                    amount: 1000.00 + i,
                    currency: 'USD',
                    dueDate: '2024-02-01',
                    description: `Bulk test invoice ${i}`,
                };

                const result = await apiClient.createInvoice(invoiceData);
                expect(result.success).toBe(true);
                invoices.push(result.invoice);
            }

            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95 * invoiceCount);
            expect(invoices).toHaveLength(invoiceCount);

            // Cleanup
            for (const invoice of invoices) {
                await apiClient.deleteInvoice(invoice.id);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // Mock network error
            const originalFetch = global.fetch;
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await apiClient.createInvoice({
                customerId: testCustomer.id,
                amount: 1000.00,
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Network error test',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Network error');

            // Restore original fetch
            global.fetch = originalFetch;
        });

        it('should handle server errors gracefully', async () => {
            // Mock server error
            const originalFetch = global.fetch;
            global.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
                json: vi.fn().mockResolvedValue({ error: 'Server error' }),
            });

            const result = await apiClient.createInvoice({
                customerId: testCustomer.id,
                amount: 1000.00,
                currency: 'USD',
                dueDate: '2024-02-01',
                description: 'Server error test',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Server error');

            // Restore original fetch
            global.fetch = originalFetch;
        });
    });
});
