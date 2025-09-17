// Unit Tests for Invoice Posting Business Logic
// Tests critical accounting functions with comprehensive coverage

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateInvoicePosting } from '@aibos/accounting';
import { testConfig } from '../../config/test-config';
import {
    makeInvoiceInput,
    makeInvoiceWithTax,
    makeForeignCurrencyInvoice,
    makeAccount,
    makeAccountMap,
    MYR,
    USD
} from '../../factories';
import '../../matchers'; // Import custom matchers

describe('Invoice Posting Validation', () => {
    let mockUserId: string;
    let mockUserRole: string;
    let mockBaseCurrency: string;

    beforeEach(() => {
        mockUserId = testConfig.testData.userId;
        mockUserRole = 'admin'; // Use admin role for testing
        mockBaseCurrency = testConfig.testData.baseCurrency;

        // Reset mocks to default state (handled by global setup)
        vi.clearAllMocks();
    });

    describe('Input Validation', () => {
        it('should validate required fields', async () => {
            const invalidInput = {
                invoiceId: '',
                arAccountId: '',
                lines: [],
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
            };

            const result = await validateInvoicePosting(
                invalidInput as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.validated).toBe(false);
            expect(result.error).toContain('Missing required fields');
            expect(result.code).toBe('INVALID_AMOUNTS');
        });

        it('should validate positive amounts', async () => {
            const invalidInput = {
                invoiceId: 'test-invoice-001',
                arAccountId: 'test-ar-account',
                lines: [
                    {
                        id: 'line-1',
                        description: 'Test Product',
                        lineAmount: -100.00, // Negative amount should fail
                        taxAmount: 0,
                        revenueAccountId: 'test-revenue-account',
                    },
                ],
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
            };

            const result = await validateInvoicePosting(
                invalidInput as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result.validated).toBe(false);
            expect(result.error).toContain('Invoice revenue must be positive');
            expect(result.code).toBe('INVALID_AMOUNTS');
        });

        it('should validate total amount calculation', async () => {
            const input = makeInvoiceWithTax();

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.journalInput).toHaveJournalLines(3); // Revenue + Tax + AR
            expect(result.journalInput).toBeBalanced();
            expect(result.totalAmount).toBe(110); // 100 + 10 tax
        });
    });

    describe('Currency and FX Validation', () => {
        it('should handle base currency without FX rate', async () => {
            const input = makeInvoiceInput(); // No tax, base currency

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.totalAmount).toBe(100); // Just line amount, no tax
            expect(result.journalInput).toBeBalanced();
        });

        it('should require FX rate for foreign currency', async () => {
            const input = makeForeignCurrencyInvoice({
                exchangeRate: 0, // Invalid exchange rate
            });

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidationError('INVALID_CURRENCY');
            expect(result.error).toContain('Exchange rate required');
        });
    });

    describe('Journal Entry Generation', () => {
        it('should generate correct journal lines for simple invoice', async () => {
            const input = makeInvoiceInput(); // Simple invoice without tax

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.journalInput).toHaveJournalLines(2);
            expect(result.journalInput).toBeBalanced();

            // Check revenue line
            const revenueLine = result.journalInput.lines.find(line => line.accountId === 'test-revenue-account');
            expect(revenueLine).toBeDefined();
            expect(revenueLine?.credit).toBe(100.00);
            expect(revenueLine?.debit).toBe(0);

            // Check AR line
            const arLine = result.journalInput.lines.find(line => line.accountId === 'test-ar-account');
            expect(arLine).toBeDefined();
            expect(arLine?.debit).toBe(100.00);
            expect(arLine?.credit).toBe(0);
        });

        it('should generate correct journal lines with tax', async () => {
            const input = {
                invoiceId: 'test-invoice-001',
                arAccountId: 'test-ar-account',
                lines: [
                    {
                        id: 'line-1',
                        description: 'Test Product',
                        lineAmount: 100.00,
                        taxAmount: 0,
                        revenueAccountId: 'test-revenue-account',
                    },
                ],
                taxLines: [
                    {
                        id: 'tax-1',
                        taxCode: 'SST',
                        taxRate: 0.10,
                        taxAmount: 10.00,
                        taxAccountId: 'test-tax-account',
                    },
                ],
                currency: mockBaseCurrency,
                exchangeRate: 1.0,
            };

            const result = await validateInvoicePosting(
                input as any,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.journalInput).toHaveJournalLines(3);

            // Check tax line
            const taxLine = result.journalInput.lines.find(line => line.accountId === 'test-tax-account');
            expect(taxLine).toBeDefined();
            expect(taxLine?.credit).toBe(10.00);
            expect(taxLine?.debit).toBe(0);
        });

        it('should apply exchange rate correctly', async () => {
            const input = makeForeignCurrencyInvoice({
                exchangeRate: 4.50, // 1 USD = 4.50 MYR
            });

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.journalInput).toBeBalanced();

            // Check converted amounts
            const arLine = result.journalInput.lines.find(line => line.accountId === 'test-ar-account');
            expect(arLine?.debit).toBe(450.00); // 100 * 4.50
        });
    });

    describe('Business Rules Validation', () => {
        it('should validate account types', async () => {
            const input = makeInvoiceInput();

            // Mock missing account to trigger business rule validation
            const { getAccountsInfo } = await import('@aibos/db');
            vi.mocked(getAccountsInfo).mockResolvedValueOnce(new Map([
                // Missing the AR account to trigger validation error
                ['test-revenue-account', makeAccount({
                    id: 'test-revenue-account',
                    type: 'REVENUE',
                    currency: MYR
                })],
            ]));

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidationError();
            expect(result.error).toMatch(/account.*not.*found/i);
        });

        it('should validate balanced journal entries', async () => {
            const input = makeInvoiceWithTax();

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.journalInput).toHaveJournalLines(3);
            expect(result.journalInput).toBeBalanced();
        });
    });

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            const input = makeInvoiceInput();

            // Temporarily override the global mock for this test
            const { getAccountsInfo, getAllAccountsInfo } = await import('@aibos/db');
            vi.mocked(getAccountsInfo).mockRejectedValueOnce(new Error('Database connection failed'));
            vi.mocked(getAllAccountsInfo).mockRejectedValueOnce(new Error('Database connection failed'));

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidationError();
            expect(result.error).toContain('Database connection failed');
        });

        it('should handle invalid account IDs', async () => {
            const input = makeInvoiceInput({
                arAccountId: 'invalid-account-id',
            });

            // Mock missing account to trigger business rule validation
            const { getAccountsInfo } = await import('@aibos/db');
            vi.mocked(getAccountsInfo).mockResolvedValueOnce(new Map([
                // Missing the invalid-account-id, only have revenue account
                ['test-revenue-account', makeAccount({
                    id: 'test-revenue-account',
                    type: 'REVENUE',
                    currency: MYR
                })],
            ]));

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidationError();
            expect(result.error).toMatch(/account.*not.*found/i);
        });
    });

    describe('Performance Testing', () => {
        it('should complete validation within performance threshold', async () => {
            const input = makeInvoiceInput();
            const startTime = performance.now();

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            const duration = performance.now() - startTime;
            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result).toBeValidated();
        });

        it('should handle large invoice with many lines efficiently', async () => {
            const input = makeInvoiceInput({
                lines: Array.from({ length: 50 }, (_, i) => ({
                    lineNumber: i + 1,
                    description: `Test Product ${i}`,
                    quantity: 1,
                    unitPrice: 10.00,
                    lineAmount: 10.00,
                    revenueAccountId: 'test-revenue-account',
                })),
            });

            const startTime = performance.now();
            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result).toBeValidated();
            expect(result.journalInput).toHaveJournalLines(51); // 50 revenue lines + 1 AR line
            expect(result.journalInput).toBeBalanced();
        });
    });

    describe('Edge Cases', () => {
        it('should handle zero amount invoice', async () => {
            const input = makeInvoiceInput({
                lines: [{
                    lineNumber: 1,
                    description: 'Free Product',
                    quantity: 1,
                    unitPrice: 0.00,
                    lineAmount: 0.00,
                    revenueAccountId: 'test-revenue-account',
                }],
            });

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidationError('INVALID_AMOUNTS');
            expect(result.error).toContain('Invoice revenue must be positive');
        });

        it('should handle very small amounts', async () => {
            const input = makeInvoiceInput({
                lines: [{
                    lineNumber: 1,
                    description: 'Small Product',
                    quantity: 1,
                    unitPrice: 0.01,
                    lineAmount: 0.01,
                    revenueAccountId: 'test-revenue-account',
                }],
            });

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.totalAmount).toBeCloseTo(0.01, 2);
            expect(result.journalInput).toBeBalanced();
        });

        it('should handle very large amounts', async () => {
            const input = makeInvoiceInput({
                lines: [{
                    lineNumber: 1,
                    description: 'Large Product',
                    quantity: 1,
                    unitPrice: 999999999.99,
                    lineAmount: 999999999.99,
                    revenueAccountId: 'test-revenue-account',
                }],
            });

            const result = await validateInvoicePosting(
                input,
                mockUserId,
                mockUserRole,
                mockBaseCurrency
            );

            expect(result).toBeValidated();
            expect(result.totalAmount).toBeCloseTo(999999999.99, 2);
            expect(result.journalInput).toBeBalanced();
        });
    });
});
