// Integration Tests for Payment API Endpoints
// Tests complete payment workflow from creation to allocation

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { testConfig, createTestPayment, createTestInvoice, createTestBill } from '../../config/test-config';
import { ApiClient } from '@aibos/ui/lib/api-client';

describe('Payment API Integration', () => {
    let apiClient: ApiClient;
    let testInvoice: any;
    let testBill: any;
    let testPayment: any;

    beforeAll(async () => {
        apiClient = new ApiClient();
        // Setup test data
        const testCustomer = await apiClient.createCustomer({
            name: 'Test Customer',
            email: 'customer@test.com',
            phone: '+1234567890',
        });
        const testVendor = await apiClient.createVendor({
            name: 'Test Vendor',
            email: 'vendor@test.com',
            phone: '+1234567890',
        });

        testInvoice = await apiClient.createInvoice({
            customerId: testCustomer.customer.id,
            amount: 1000.00,
            currency: 'USD',
            dueDate: '2024-02-01',
            description: 'Test invoice for payment',
        });

        testBill = await apiClient.createBill({
            vendorId: testVendor.vendor.id,
            amount: 500.00,
            currency: 'USD',
            dueDate: '2024-02-15',
            description: 'Test bill for payment',
        });
    });

    afterAll(async () => {
        // Cleanup test data
        if (testInvoice?.invoice?.id) {
            await apiClient.deleteInvoice(testInvoice.invoice.id);
        }
        if (testBill?.bill?.id) {
            await apiClient.deleteBill(testBill.bill.id);
        }
    });

    beforeEach(async () => {
        // Create fresh test payment for each test
        testPayment = await createTestPayment();
    });

    afterEach(async () => {
        // Cleanup test payment
        if (testPayment?.id) {
            await apiClient.deletePayment(testPayment.id);
        }
    });

    describe('Payment CRUD Operations', () => {
        it('should create payment successfully', async () => {
            const paymentData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Test payment',
                allocations: [
                    {
                        type: 'INVOICE',
                        entityId: testInvoice.invoice.id,
                        amount: 1000.00,
                    },
                ],
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment).toBeDefined();
            expect(result.payment.amount).toBe(1000.00);
            expect(result.payment.paymentMethod).toBe('CASH');
            expect(result.payment.status).toBe('completed');
        });

        it('should get payment by ID', async () => {
            const result = await apiClient.getPayment(testPayment.id);

            expect(result.success).toBe(true);
            expect(result.payment).toBeDefined();
            expect(result.payment.id).toBe(testPayment.id);
        });

        it('should get all payments', async () => {
            const result = await apiClient.getPayments();

            expect(result.success).toBe(true);
            expect(result.payments).toBeDefined();
            expect(Array.isArray(result.payments)).toBe(true);
            expect(result.payments.length).toBeGreaterThan(0);
        });

        it('should update payment successfully', async () => {
            const updateData = {
                amount: 1200.00,
                description: 'Updated test payment',
            };

            const result = await apiClient.updatePayment(testPayment.id, updateData);

            expect(result.success).toBe(true);
            expect(result.payment).toBeDefined();
            expect(result.payment.amount).toBe(1200.00);
            expect(result.payment.description).toBe('Updated test payment');
        });

        it('should delete payment successfully', async () => {
            const result = await apiClient.deletePayment(testPayment.id);

            expect(result.success).toBe(true);

            // Verify payment is deleted
            const getResult = await apiClient.getPayment(testPayment.id);
            expect(getResult.success).toBe(false);
        });
    });

    describe('Payment Allocation', () => {
        it('should allocate payment to invoice', async () => {
            const paymentData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Invoice payment',
                allocations: [
                    {
                        type: 'INVOICE',
                        entityId: testInvoice.invoice.id,
                        amount: 1000.00,
                    },
                ],
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.allocations).toHaveLength(1);
            expect(result.payment.allocations[0].type).toBe('INVOICE');
            expect(result.payment.allocations[0].entityId).toBe(testInvoice.invoice.id);
            expect(result.payment.allocations[0].amount).toBe(1000.00);

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });

        it('should allocate payment to bill', async () => {
            const paymentData = {
                amount: 500.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Bill payment',
                allocations: [
                    {
                        type: 'BILL',
                        entityId: testBill.bill.id,
                        amount: 500.00,
                    },
                ],
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.allocations).toHaveLength(1);
            expect(result.payment.allocations[0].type).toBe('BILL');
            expect(result.payment.allocations[0].entityId).toBe(testBill.bill.id);
            expect(result.payment.allocations[0].amount).toBe(500.00);

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });

        it('should allocate payment to multiple entities', async () => {
            const paymentData = {
                amount: 1500.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Multi-entity payment',
                allocations: [
                    {
                        type: 'INVOICE',
                        entityId: testInvoice.invoice.id,
                        amount: 1000.00,
                    },
                    {
                        type: 'BILL',
                        entityId: testBill.bill.id,
                        amount: 500.00,
                    },
                ],
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.allocations).toHaveLength(2);
            expect(result.payment.allocations[0].type).toBe('INVOICE');
            expect(result.payment.allocations[1].type).toBe('BILL');

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });

        it('should handle partial allocation', async () => {
            const paymentData = {
                amount: 1500.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Partial allocation payment',
                allocations: [
                    {
                        type: 'INVOICE',
                        entityId: testInvoice.invoice.id,
                        amount: 500.00, // Partial payment
                    },
                ],
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.allocations).toHaveLength(1);
            expect(result.payment.allocations[0].amount).toBe(500.00);

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });
    });

    describe('Payment Status Management', () => {
        it('should mark payment as completed', async () => {
            const result = await apiClient.markPaymentCompleted(testPayment.id);

            expect(result.success).toBe(true);
            expect(result.payment.status).toBe('completed');
        });

        it('should mark payment as failed', async () => {
            const result = await apiClient.markPaymentFailed(testPayment.id, 'Insufficient funds');

            expect(result.success).toBe(true);
            expect(result.payment.status).toBe('failed');
            expect(result.payment.failureReason).toBe('Insufficient funds');
        });

        it('should mark payment as pending', async () => {
            const result = await apiClient.markPaymentPending(testPayment.id);

            expect(result.success).toBe(true);
            expect(result.payment.status).toBe('pending');
        });

        it('should cancel payment', async () => {
            const result = await apiClient.cancelPayment(testPayment.id);

            expect(result.success).toBe(true);
            expect(result.payment.status).toBe('cancelled');
        });
    });

    describe('Payment Reporting', () => {
        it('should get payment summary', async () => {
            const result = await apiClient.getPaymentSummary();

            expect(result.success).toBe(true);
            expect(result.summary).toBeDefined();
            expect(result.summary.totalPayments).toBeGreaterThan(0);
            expect(result.summary.totalAmount).toBeGreaterThan(0);
        });

        it('should get payments by date range', async () => {
            const result = await apiClient.getPaymentsByDateRange({
                startDate: '2024-01-01',
                endDate: '2024-12-31',
            });

            expect(result.success).toBe(true);
            expect(result.payments).toBeDefined();
            expect(Array.isArray(result.payments)).toBe(true);
        });

        it('should get payment analytics', async () => {
            const result = await apiClient.getPaymentAnalytics();

            expect(result.success).toBe(true);
            expect(result.analytics).toBeDefined();
            expect(result.analytics.totalProcessed).toBeGreaterThan(0);
            expect(result.analytics.averagePaymentValue).toBeGreaterThan(0);
        });
    });

    describe('Payment Validation', () => {
        it('should validate required fields', async () => {
            const invalidData = {
                amount: 0,
                currency: '',
                paymentMethod: '',
            };

            const result = await apiClient.createPayment(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Missing required fields');
        });

        it('should validate amount is positive', async () => {
            const invalidData = {
                amount: -1000.00, // Negative amount
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const result = await apiClient.createPayment(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Amount must be positive');
        });

        it('should validate payment method', async () => {
            const invalidData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'INVALID_METHOD',
                paymentDate: new Date().toISOString(),
            };

            const result = await apiClient.createPayment(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid payment method');
        });

        it('should validate allocation total matches payment amount', async () => {
            const invalidData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                allocations: [
                    {
                        type: 'INVOICE',
                        entityId: testInvoice.invoice.id,
                        amount: 500.00, // Doesn't match payment amount
                    },
                ],
            };

            const result = await apiClient.createPayment(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Allocation total must equal payment amount');
        });
    });

    describe('Payment Workflow', () => {
        it('should complete full payment workflow', async () => {
            // 1. Create payment
            const createResult = await apiClient.createPayment({
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Full workflow test payment',
                allocations: [
                    {
                        type: 'INVOICE',
                        entityId: testInvoice.invoice.id,
                        amount: 1000.00,
                    },
                ],
            });

            expect(createResult.success).toBe(true);
            const paymentId = createResult.payment.id;

            // 2. Verify payment is completed
            const verifyResult = await apiClient.getPayment(paymentId);
            expect(verifyResult.success).toBe(true);
            expect(verifyResult.payment.status).toBe('completed');

            // 3. Verify invoice is marked as paid
            const invoiceResult = await apiClient.getInvoice(testInvoice.invoice.id);
            expect(invoiceResult.invoice.status).toBe('paid');

            // 4. Cleanup
            await apiClient.deletePayment(paymentId);
        });

        it('should handle payment with multiple allocations', async () => {
            const paymentData = {
                amount: 1500.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Multi-allocation payment',
                allocations: [
                    {
                        type: 'INVOICE',
                        entityId: testInvoice.invoice.id,
                        amount: 1000.00,
                    },
                    {
                        type: 'BILL',
                        entityId: testBill.bill.id,
                        amount: 500.00,
                    },
                ],
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.allocations).toHaveLength(2);

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });
    });

    describe('Payment Methods', () => {
        it('should handle CASH payment', async () => {
            const paymentData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Cash payment',
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.paymentMethod).toBe('CASH');

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });

        it('should handle CARD payment', async () => {
            const paymentData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CARD',
                paymentDate: new Date().toISOString(),
                description: 'Card payment',
                cardDetails: {
                    last4: '1234',
                    brand: 'Visa',
                },
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.paymentMethod).toBe('CARD');

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });

        it('should handle BANK_TRANSFER payment', async () => {
            const paymentData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'BANK_TRANSFER',
                paymentDate: new Date().toISOString(),
                description: 'Bank transfer payment',
                bankDetails: {
                    accountNumber: '1234567890',
                    routingNumber: '123456789',
                },
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(true);
            expect(result.payment.paymentMethod).toBe('BANK_TRANSFER');

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });
    });

    describe('Performance Testing', () => {
        it('should create payment within performance threshold', async () => {
            const paymentData = {
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Performance test payment',
            };

            const startTime = performance.now();
            const result = await apiClient.createPayment(paymentData);
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result.success).toBe(true);

            // Cleanup
            await apiClient.deletePayment(result.payment.id);
        });

        it('should handle bulk payment operations efficiently', async () => {
            const paymentCount = 10;
            const payments = [];

            const startTime = performance.now();

            // Create multiple payments
            for (let i = 0; i < paymentCount; i++) {
                const paymentData = {
                    amount: 1000.00 + i,
                    currency: 'USD',
                    paymentMethod: 'CASH',
                    paymentDate: new Date().toISOString(),
                    description: `Bulk test payment ${i}`,
                };

                const result = await apiClient.createPayment(paymentData);
                expect(result.success).toBe(true);
                payments.push(result.payment);
            }

            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95 * paymentCount);
            expect(payments).toHaveLength(paymentCount);

            // Cleanup
            for (const payment of payments) {
                await apiClient.deletePayment(payment.id);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // Mock network error
            const originalFetch = global.fetch;
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await apiClient.createPayment({
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
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

            const result = await apiClient.createPayment({
                amount: 1000.00,
                currency: 'USD',
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
                description: 'Server error test',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Server error');

            // Restore original fetch
            global.fetch = originalFetch;
        });
    });
});
