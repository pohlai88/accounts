// Unit Tests for Payment Processing Business Logic
// Tests payment allocation and journal entry generation

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validatePaymentProcessing } from '@aibos/accounting';
import { createTestPayment, testConfig, expectError } from '../../config/test-config';

describe('Payment Processing Validation', () => {
    let mockUserId: string;
    let mockUserRole: string;
    let mockBaseCurrency: string;

    beforeEach(() => {
        mockUserId = testConfig.testData.userId;
        mockUserRole = 'admin'; // Changed to admin for proper authorization
        mockBaseCurrency = testConfig.testData.baseCurrency;
    });

    describe('Input Validation', () => {
        it('should validate required fields', async () => {
            const invalidInput = {
                paymentId: '',
                amount: 0,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                allocations: [],
            };

            const result = await validatePaymentProcessing(
                invalidInput as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toMatch(/payment.*amount.*positive|invalid.*payment.*method|payment.*must.*have.*allocation/i);
            expect(result.code).toBeDefined();
        });

        it('should validate positive amount', async () => {
            const invalidInput = {
                paymentId: 'test-payment-001',
                amount: -100.00, // Negative amount should fail
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                invalidInput as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Payment amount must be positive');
            expect(result.code).toBe('PAYMENT_VALIDATION_FAILED');
        });

        it('should validate allocation total matches payment amount', async () => {
            const invalidInput = {
                paymentId: 'test-payment-001',
                paymentNumber: 'PAY-001',
                paymentMethod: 'BANK_TRANSFER',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'bank-1000',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 50.00, // Doesn't match payment amount
                        allocatedAmount: 50.00,
                        arAccountId: 'test-ar-account',
                        customerId: 'cust-1',
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                invalidInput as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Total allocated amount');
            expect(result.code).toBe('PAYMENT_VALIDATION_FAILED');
        });
    });

    describe('Currency and FX Validation', () => {
        it('should handle base currency without FX rate', async () => {
            const { validatePaymentProcessing } = await import('@aibos/accounting');

            const input = {
                paymentId: 'test-payment-001',
                paymentNumber: 'PAY-001',
                paymentDate: '2024-01-01',
                paymentMethod: 'BANK_TRANSFER',
                bankAccountId: 'bank-1000',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        documentId: 'test-invoice-001',
                        documentNumber: 'INV-001',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                        allocatedAmount: 100.00,
                        customerId: 'cust-1',
                        arAccountId: 'test-ar-account',
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.exchangeRate).toBe(1.0);
        });

        it('should require FX rate for foreign currency', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: 'USD',
                exchangeRate: 0, // Invalid exchange rate
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('FX rate required');
        });
    });

    describe('Journal Entry Generation', () => {
        it('should generate correct journal lines for invoice payment', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.journalLines).toHaveLength(2);

            // Check bank account line (debit)
            const bankLine = result.journalLines.find((line: any) => line.accountId === 'test-bank-account');
            expect(bankLine).toBeDefined();
            expect(bankLine.debit).toBe(100.00);
            expect(bankLine.credit).toBe(0);

            // Check AR line (credit)
            const arLine = result.journalLines.find((line: any) => line.accountId === 'test-ar-account');
            expect(arLine).toBeDefined();
            expect(arLine.credit).toBe(100.00);
            expect(arLine.debit).toBe(0);
        });

        it('should generate correct journal lines for bill payment', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 50.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'BILL',
                        entityId: 'test-bill-001',
                        amount: 50.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.journalLines).toHaveLength(2);

            // Check AP line (debit)
            const apLine = result.journalLines.find((line: any) => line.accountId === 'test-ap-account');
            expect(apLine).toBeDefined();
            expect(apLine.debit).toBe(50.00);
            expect(apLine.credit).toBe(0);

            // Check bank account line (credit)
            const bankLine = result.journalLines.find((line: any) => line.accountId === 'test-bank-account');
            expect(bankLine).toBeDefined();
            expect(bankLine.credit).toBe(50.00);
            expect(bankLine.debit).toBe(0);
        });

        it('should handle mixed allocations correctly', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 150.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                    {
                        id: 'alloc-2',
                        type: 'BILL',
                        entityId: 'test-bill-001',
                        amount: 50.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.journalLines).toHaveLength(3);

            // Check bank account line (debit)
            const bankLine = result.journalLines.find((line: any) => line.accountId === 'test-bank-account');
            expect(bankLine.debit).toBe(150.00);

            // Check AR line (credit)
            const arLine = result.journalLines.find((line: any) => line.accountId === 'test-ar-account');
            expect(arLine.credit).toBe(100.00);

            // Check AP line (debit)
            const apLine = result.journalLines.find((line: any) => line.accountId === 'test-ap-account');
            expect(apLine.debit).toBe(50.00);
        });

        it('should apply exchange rate correctly', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: 'USD',
                exchangeRate: 4.50, // 1 USD = 4.50 MYR
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.exchangeRate).toBe(4.50);

            // Check converted amounts
            const bankLine = result.journalLines.find((line: any) => line.accountId === 'test-bank-account');
            expect(bankLine.debit).toBe(450.00); // 100 * 4.50
        });
    });

    describe('Allocation Validation', () => {
        it('should validate allocation types', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVALID_TYPE', // Invalid type
                        entityId: 'test-entity-001',
                        amount: 100.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid allocation type');
        });

        it('should validate allocation amounts are positive', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: -50.00, // Negative amount
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Allocation amount must be positive');
        });

        it('should validate entity IDs are provided', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: '', // Empty entity ID
                        amount: 100.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Entity ID is required');
        });
    });

    describe('Business Rules Validation', () => {
        it('should validate account types', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                ],
            };

            // Mock account validation to return invalid account type
            vi.mock('@aibos/accounting/ap/payment-processing', async () => {
                const actual = await vi.importActual('@aibos/accounting/ap/payment-processing');
                return {
                    ...actual,
                    validateAccountTypes: vi.fn().mockResolvedValue({
                        valid: false,
                        errors: ['Bank account must be ASSET type'],
                    }),
                };
            });

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Bank account must be ASSET type');
        });

        it('should validate balanced journal entries', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);

            // Verify journal is balanced
            const totalDebits = result.journalLines.reduce((sum: number, line: any) => sum + line.debit, 0);
            const totalCredits = result.journalLines.reduce((sum: number, line: any) => sum + line.credit, 0);
            expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
        });
    });

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            const input = createTestPayment();

            // Mock database error
            vi.mock('@aibos/db', () => ({
                getAccountInfo: vi.fn().mockRejectedValue(new Error('Database connection failed')),
            }));

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Database connection failed');
        });

        it('should handle invalid account IDs', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 100.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'invalid-account-id',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                ],
            };

            // Mock account validation to return account not found
            vi.mock('@aibos/accounting/ap/payment-processing', async () => {
                const actual = await vi.importActual('@aibos/accounting/ap/payment-processing');
                return {
                    ...actual,
                    validateAccountExists: vi.fn().mockResolvedValue({
                        valid: false,
                        error: 'Account not found',
                    }),
                };
            });

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Account not found');
        });
    });

    describe('Performance Testing', () => {
        it('should complete validation within performance threshold', async () => {
            const input = createTestPayment();
            const startTime = performance.now();

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result.success).toBe(true);
        });

        it('should handle large payment with many allocations efficiently', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 1000.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: Array.from({ length: 100 }, (_, i) => ({
                    id: `alloc-${i}`,
                    type: i % 2 === 0 ? 'INVOICE' : 'BILL',
                    entityId: `test-entity-${i}`,
                    amount: 10.00,
                })),
            };

            const startTime = performance.now();
            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result.success).toBe(true);
            expect(result.journalLines.length).toBeGreaterThan(100);
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero amount payment', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 0.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 0.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(false);
            expect(result.error).toContain('Payment amount must be positive');
        });

        it('should handle very small amounts', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 0.01,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 0.01,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.journalLines).toHaveLength(2);
        });

        it('should handle very large amounts', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 999999999.99,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 999999999.99,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.journalLines).toHaveLength(2);
        });
    });

    describe('Partial Payment Handling', () => {
        it('should handle partial payment allocation', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 50.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 50.00, // Partial payment of 100.00 invoice
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.journalLines).toHaveLength(2);
        });

        it('should handle overpayment allocation', async () => {
            const input = {
                paymentId: 'test-payment-001',
                amount: 150.00,
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
                bankAccountId: 'test-bank-account',
                allocations: [
                    {
                        id: 'alloc-1',
                        type: 'INVOICE',
                        entityId: 'test-invoice-001',
                        amount: 100.00,
                    },
                    {
                        id: 'alloc-2',
                        type: 'INVOICE',
                        entityId: 'test-invoice-002',
                        amount: 50.00,
                    },
                ],
            };

            const result = await validatePaymentProcessing(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.success).toBe(true);
            expect(result.journalLines).toHaveLength(3);
        });
    });
});
