// Integration Tests for Bill API Endpoints
// Tests complete bill workflow from creation to payment

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { testConfig, createTestBill, createTestVendor, createTestPayment } from '../../config/test-config';
import { ApiClient } from '@aibos/ui/lib/api-client';

describe('Bill API Integration', () => {
    let apiClient: ApiClient;
    let testVendor: any;
    let testBill: any;
    let testPayment: any;

    beforeAll(async () => {
        apiClient = new ApiClient();
        // Setup test data
        testVendor = await createTestVendor();
    });

    afterAll(async () => {
        // Cleanup test data
        if (testVendor?.id) {
            await apiClient.deleteVendor(testVendor.id);
        }
    });

    beforeEach(async () => {
        // Create fresh test bill for each test
        testBill = await createTestBill(testVendor.id);
    });

    afterEach(async () => {
        // Cleanup test bill
        if (testBill?.id) {
            await apiClient.deleteBill(testBill.id);
        }
    });

    describe('Bill CRUD Operations', () => {
        it('should create bill successfully', async () => {
            const billData = {
                vendorId: testVendor.id,
                amount: 2000.00,
                currency: 'USD',
                dueDate: '2024-02-15',
                description: 'Test bill',
                lineItems: [
                    {
                        description: 'Test service',
                        quantity: 1,
                        unitPrice: 2000.00,
                        total: 2000.00,
                    },
                ],
            };

            const result = await apiClient.createBill(billData);

            expect(result.success).toBe(true);
            expect(result.bill).toBeDefined();
            expect(result.bill.vendorId).toBe(testVendor.id);
            expect(result.bill.amount).toBe(2000.00);
            expect(result.bill.status).toBe('draft');
        });

        it('should get bill by ID', async () => {
            const result = await apiClient.getBill(testBill.id);

            expect(result.success).toBe(true);
            expect(result.bill).toBeDefined();
            expect(result.bill.id).toBe(testBill.id);
            expect(result.bill.vendorId).toBe(testVendor.id);
        });

        it('should get all bills', async () => {
            const result = await apiClient.getBills();

            expect(result.success).toBe(true);
            expect(result.bills).toBeDefined();
            expect(Array.isArray(result.bills)).toBe(true);
            expect(result.bills.length).toBeGreaterThan(0);
        });

        it('should update bill successfully', async () => {
            const updateData = {
                amount: 2500.00,
                description: 'Updated test bill',
            };

            const result = await apiClient.updateBill(testBill.id, updateData);

            expect(result.success).toBe(true);
            expect(result.bill).toBeDefined();
            expect(result.bill.amount).toBe(2500.00);
            expect(result.bill.description).toBe('Updated test bill');
        });

        it('should delete bill successfully', async () => {
            const result = await apiClient.deleteBill(testBill.id);

            expect(result.success).toBe(true);

            // Verify bill is deleted
            const getResult = await apiClient.getBill(testBill.id);
            expect(getResult.success).toBe(false);
        });
    });

    describe('Bill Status Management', () => {
        it('should approve bill', async () => {
            const result = await apiClient.approveBill(testBill.id);

            expect(result.success).toBe(true);
            expect(result.bill.status).toBe('approved');
        });

        it('should reject bill', async () => {
            const result = await apiClient.rejectBill(testBill.id, 'Invalid data');

            expect(result.success).toBe(true);
            expect(result.bill.status).toBe('rejected');
        });

        it('should mark bill as paid', async () => {
            // First approve the bill
            await apiClient.approveBill(testBill.id);

            // Then mark as paid
            const result = await apiClient.markBillPaid(testBill.id);

            expect(result.success).toBe(true);
            expect(result.bill.status).toBe('paid');
        });

        it('should cancel bill', async () => {
            const result = await apiClient.cancelBill(testBill.id);

            expect(result.success).toBe(true);
            expect(result.bill.status).toBe('cancelled');
        });
    });

    describe('Bill Payment Processing', () => {
        it('should process payment for bill', async () => {
            // First approve the bill
            await apiClient.approveBill(testBill.id);

            // Create payment
            const paymentData = {
                billId: testBill.id,
                amount: testBill.amount,
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const paymentResult = await apiClient.createPayment(paymentData);
            expect(paymentResult.success).toBe(true);

            // Verify bill is marked as paid
            const billResult = await apiClient.getBill(testBill.id);
            expect(billResult.bill.status).toBe('paid');
        });

        it('should handle partial payment', async () => {
            // First approve the bill
            await apiClient.approveBill(testBill.id);

            // Create partial payment
            const paymentData = {
                billId: testBill.id,
                amount: testBill.amount / 2, // Half payment
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const paymentResult = await apiClient.createPayment(paymentData);
            expect(paymentResult.success).toBe(true);

            // Verify bill is still approved (not fully paid)
            const billResult = await apiClient.getBill(testBill.id);
            expect(billResult.bill.status).toBe('approved');
        });

        it('should handle overpayment', async () => {
            // First approve the bill
            await apiClient.approveBill(testBill.id);

            // Create overpayment
            const paymentData = {
                billId: testBill.id,
                amount: testBill.amount * 1.5, // 150% payment
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const paymentResult = await apiClient.createPayment(paymentData);
            expect(paymentResult.success).toBe(true);

            // Verify bill is marked as paid
            const billResult = await apiClient.getBill(testBill.id);
            expect(billResult.bill.status).toBe('paid');
        });
    });

    describe('Bill Reporting', () => {
        it('should get bill summary', async () => {
            const result = await apiClient.getBillSummary();

            expect(result.success).toBe(true);
            expect(result.summary).toBeDefined();
            expect(result.summary.totalBills).toBeGreaterThan(0);
            expect(result.summary.totalAmount).toBeGreaterThan(0);
        });

        it('should get overdue bills', async () => {
            // Create an overdue bill
            const overdueBill = await apiClient.createBill({
                vendorId: testVendor.id,
                amount: 1000.00,
                currency: 'USD',
                dueDate: '2023-01-01', // Past due date
                description: 'Overdue bill',
                lineItems: [
                    {
                        description: 'Overdue service',
                        quantity: 1,
                        unitPrice: 1000.00,
                        total: 1000.00,
                    },
                ],
            });

            const result = await apiClient.getOverdueBills();

            expect(result.success).toBe(true);
            expect(result.bills).toBeDefined();
            expect(Array.isArray(result.bills)).toBe(true);
            expect(result.bills.length).toBeGreaterThan(0);

            // Cleanup
            await apiClient.deleteBill(overdueBill.bill.id);
        });

        it('should get bill analytics', async () => {
            const result = await apiClient.getBillAnalytics();

            expect(result.success).toBe(true);
            expect(result.analytics).toBeDefined();
            expect(result.analytics.totalExpenses).toBeGreaterThan(0);
            expect(result.analytics.averageBillValue).toBeGreaterThan(0);
        });
    });

    describe('Bill Validation', () => {
        it('should validate required fields', async () => {
            const invalidData = {
                vendorId: '',
                amount: 0,
                currency: '',
            };

            const result = await apiClient.createBill(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Missing required fields');
        });

        it('should validate vendor exists', async () => {
            const invalidData = {
                vendorId: 'invalid-vendor-id',
                amount: 2000.00,
                currency: 'USD',
                dueDate: '2024-02-15',
                description: 'Test bill',
            };

            const result = await apiClient.createBill(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Vendor not found');
        });

        it('should validate amount is positive', async () => {
            const invalidData = {
                vendorId: testVendor.id,
                amount: -2000.00, // Negative amount
                currency: 'USD',
                dueDate: '2024-02-15',
                description: 'Test bill',
            };

            const result = await apiClient.createBill(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Amount must be positive');
        });

        it('should validate currency format', async () => {
            const invalidData = {
                vendorId: testVendor.id,
                amount: 2000.00,
                currency: 'INVALID', // Invalid currency
                dueDate: '2024-02-15',
                description: 'Test bill',
            };

            const result = await apiClient.createBill(invalidData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid currency');
        });
    });

    describe('Bill Workflow', () => {
        it('should complete full bill workflow', async () => {
            // 1. Create bill
            const createResult = await apiClient.createBill({
                vendorId: testVendor.id,
                amount: 2000.00,
                currency: 'USD',
                dueDate: '2024-02-15',
                description: 'Full workflow test bill',
                lineItems: [
                    {
                        description: 'Test service',
                        quantity: 1,
                        unitPrice: 2000.00,
                        total: 2000.00,
                    },
                ],
            });

            expect(createResult.success).toBe(true);
            const billId = createResult.bill.id;

            // 2. Approve bill
            const approveResult = await apiClient.approveBill(billId);
            expect(approveResult.success).toBe(true);
            expect(approveResult.bill.status).toBe('approved');

            // 3. Process payment
            const paymentResult = await apiClient.createPayment({
                billId: billId,
                amount: 2000.00,
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            });
            expect(paymentResult.success).toBe(true);

            // 4. Verify bill is paid
            const finalResult = await apiClient.getBill(billId);
            expect(finalResult.success).toBe(true);
            expect(finalResult.bill.status).toBe('paid');

            // 5. Cleanup
            await apiClient.deleteBill(billId);
        });

        it('should handle bill with multiple line items', async () => {
            const billData = {
                vendorId: testVendor.id,
                amount: 3000.00,
                currency: 'USD',
                dueDate: '2024-02-15',
                description: 'Multi-item bill',
                lineItems: [
                    {
                        description: 'Service 1',
                        quantity: 2,
                        unitPrice: 1000.00,
                        total: 2000.00,
                    },
                    {
                        description: 'Service 2',
                        quantity: 1,
                        unitPrice: 1000.00,
                        total: 1000.00,
                    },
                ],
            };

            const result = await apiClient.createBill(billData);

            expect(result.success).toBe(true);
            expect(result.bill.lineItems).toHaveLength(2);
            expect(result.bill.amount).toBe(3000.00);

            // Cleanup
            await apiClient.deleteBill(result.bill.id);
        });
    });

    describe('Bill Approval Workflow', () => {
        it('should handle bill approval with comments', async () => {
            const result = await apiClient.approveBill(testBill.id, 'Approved for payment');

            expect(result.success).toBe(true);
            expect(result.bill.status).toBe('approved');
            expect(result.bill.approvalComments).toBe('Approved for payment');
        });

        it('should handle bill rejection with reason', async () => {
            const result = await apiClient.rejectBill(testBill.id, 'Insufficient documentation');

            expect(result.success).toBe(true);
            expect(result.bill.status).toBe('rejected');
            expect(result.bill.rejectionReason).toBe('Insufficient documentation');
        });

        it('should prevent payment of unapproved bill', async () => {
            const paymentData = {
                billId: testBill.id,
                amount: testBill.amount,
                paymentMethod: 'CASH',
                paymentDate: new Date().toISOString(),
            };

            const result = await apiClient.createPayment(paymentData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Bill must be approved before payment');
        });
    });

    describe('Performance Testing', () => {
        it('should create bill within performance threshold', async () => {
            const billData = {
                vendorId: testVendor.id,
                amount: 2000.00,
                currency: 'USD',
                dueDate: '2024-02-15',
                description: 'Performance test bill',
            };

            const startTime = performance.now();
            const result = await apiClient.createBill(billData);
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result.success).toBe(true);

            // Cleanup
            await apiClient.deleteBill(result.bill.id);
        });

        it('should handle bulk bill operations efficiently', async () => {
            const billCount = 10;
            const bills = [];

            const startTime = performance.now();

            // Create multiple bills
            for (let i = 0; i < billCount; i++) {
                const billData = {
                    vendorId: testVendor.id,
                    amount: 2000.00 + i,
                    currency: 'USD',
                    dueDate: '2024-02-15',
                    description: `Bulk test bill ${i}`,
                };

                const result = await apiClient.createBill(billData);
                expect(result.success).toBe(true);
                bills.push(result.bill);
            }

            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95 * billCount);
            expect(bills).toHaveLength(billCount);

            // Cleanup
            for (const bill of bills) {
                await apiClient.deleteBill(bill.id);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors gracefully', async () => {
            // Mock network error
            const originalFetch = global.fetch;
            global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await apiClient.createBill({
                vendorId: testVendor.id,
                amount: 2000.00,
                currency: 'USD',
                dueDate: '2024-02-15',
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

            const result = await apiClient.createBill({
                vendorId: testVendor.id,
                amount: 2000.00,
                currency: 'USD',
                dueDate: '2024-02-15',
                description: 'Server error test',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Server error');

            // Restore original fetch
            global.fetch = originalFetch;
        });
    });
});
