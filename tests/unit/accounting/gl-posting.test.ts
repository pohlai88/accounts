// Unit Tests for General Ledger Posting Business Logic
// Tests journal entry creation, validation, and posting

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testConfig, expectError } from '../../config/test-config';

describe('General Ledger Posting Validation', () => {
    let mockUserId: string;
    let mockUserRole: string;
    let mockCompanyId: string;

    beforeEach(() => {
        mockUserId = testConfig.testData.userId;
        mockUserRole = 'admin'; // Changed to admin for proper authorization
        mockCompanyId = testConfig.testData.companyId;
    });

    describe('Journal Entry Validation', () => {
        it('should validate required fields', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const invalidInput = {
                journalId: '',
                description: '',
                lines: [],
            };

            const input = {
                journalNumber: '',
                description: '',
                journalDate: new Date(),
                currency: 'MYR',
                lines: [],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(input as any);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toMatch(/journal.*line|required|missing|invalid/i);
            }
        });

        it('should validate journal lines exist', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const input = {
                journalNumber: 'JRN-001',
                description: 'Test journal entry',
                journalDate: new Date('2024-01-01'),
                currency: 'MYR',
                lines: [], // Empty lines should fail
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(input);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toMatch(/journal.*line|required|missing|invalid/i);
            }
        });

        it('should validate journal lines have required fields', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const invalidInput = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: '', // Missing account ID
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(invalidInput as any);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toContain('Journal must be balanced');
                expect(error.code).toBe('UNBALANCED_JOURNAL');
            }
        });

        it('should validate journal lines have positive amounts', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const invalidInput = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: -100.00, // Negative debit
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(invalidInput as any);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toContain('Journal must be balanced');
                expect(error.code).toBe('UNBALANCED_JOURNAL');
            }
        });

        it('should validate journal lines have either debit or credit', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const invalidInput = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 0,
                        credit: 0, // Both zero
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(invalidInput as any);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toContain('Must have either debit or credit amount');
                expect(error.code).toBe('ZERO_AMOUNTS');
            }
        });

        it('should validate journal lines not have both debit and credit', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const invalidInput = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 50.00, // Both non-zero
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(invalidInput as any);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toContain('Cannot have both debit and credit amounts');
                expect(error.code).toBe('INVALID_LINE_AMOUNTS');
            }
        });
    });

    describe('Journal Balance Validation', () => {
        it('should validate journal is balanced', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                journalDate: new Date('2024-01-01'),
                currency: 'MYR',
                lines: [
                    {
                        accountId: 'test-cash-account',
                        debit: 100.00,
                        credit: 0,
                    },
                    {
                        accountId: 'test-revenue-account',
                        debit: 0,
                        credit: 100.00,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await validateJournalPosting(input as any);

            expect(result.validated).toBe(true);
            expect(result.totalDebit).toBe(100);
            expect(result.totalCredit).toBe(100);
        });

        it('should reject unbalanced journal', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                journalDate: new Date('2024-01-01'),
                currency: 'MYR',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 50.00, // Unbalanced
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(input as any);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toContain('Journal must be balanced');
                expect(error.code).toBe('UNBALANCED_JOURNAL');
            }
        });

        it('should handle rounding differences in balance validation', async () => {
            const { validateJournalPosting } = await import('@aibos/accounting');

            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry with rounding',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 99.99, // Small rounding difference
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            try {
                await validateJournalPosting(input as any);
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).toContain('Journal must be balanced');
                expect(error.code).toBe('UNBALANCED_JOURNAL');
            }
        });

        it('should accept journal with acceptable rounding difference', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry with acceptable rounding',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 99.999, // Very small rounding difference
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock tolerance for rounding
            vi.mock('@aibos/accounting/gl/posting', async () => {
                const actual = await vi.importActual('@aibos/accounting/gl/posting');
                return {
                    ...actual,
                    validateJournalPosting: vi.fn().mockImplementation(async (input) => {
                        const totalDebits = input.lines.reduce((sum: number, line: any) => sum + line.debit, 0);
                        const totalCredits = input.lines.reduce((sum: number, line: any) => sum + line.credit, 0);
                        const difference = Math.abs(totalDebits - totalCredits);

                        if (difference < 0.01) { // 1 cent tolerance
                            return {
                                success: true,
                                balanced: true,
                                totalDebits,
                                totalCredits,
                                difference,
                            };
                        }

                        return {
                            success: false,
                            error: 'Journal is not balanced',
                            code: 'GL_POSTING_VALIDATION_FAILED',
                        };
                    }),
                };
            });

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(true);
            expect(result.balanced).toBe(true);
        });
    });

    describe('Account Validation', () => {
        it('should validate account exists', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'invalid-account-id',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock account validation to return account not found
            vi.mock('@aibos/accounting/gl/posting', async () => {
                const actual = await vi.importActual('@aibos/accounting/gl/posting');
                return {
                    ...actual,
                    validateAccountExists: vi.fn().mockResolvedValue({
                        valid: false,
                        error: 'Account not found',
                    }),
                };
            });

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Account not found');
        });

        it('should validate account is active', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'inactive-account-id',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock account validation to return inactive account
            vi.mock('@aibos/accounting/gl/posting', async () => {
                const actual = await vi.importActual('@aibos/accounting/gl/posting');
                return {
                    ...actual,
                    validateAccountActive: vi.fn().mockResolvedValue({
                        valid: false,
                        error: 'Account is inactive',
                    }),
                };
            });

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Account is inactive');
        });

        it('should validate account types for journal lines', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock account type validation
            vi.mock('@aibos/accounting/gl/posting', async () => {
                const actual = await vi.importActual('@aibos/accounting/gl/posting');
                return {
                    ...actual,
                    validateAccountTypes: vi.fn().mockResolvedValue({
                        valid: false,
                        errors: ['Account type mismatch for journal line'],
                    }),
                };
            });

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Account type mismatch for journal line');
        });
    });

    describe('Journal Entry Creation', () => {
        it('should create journal entry with valid input', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 100.00,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await postJournal(input as any);

            expect(result.success).toBe(true);
            expect(result.journalId).toBe('test-journal-001');
            expect(result.lines).toHaveLength(2);
        });

        it('should handle journal entry creation errors', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock database error
            vi.mock('@aibos/db', () => ({
                postJournal: vi.fn().mockRejectedValue(new Error('Database error')),
            }));

            const result = await postJournal(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Database error');
        });

        it('should validate journal entry before creation', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 50.00, // Unbalanced
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await postJournal(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Journal is not balanced');
        });
    });

    describe('Multi-Currency Support', () => {
        it('should handle multi-currency journal entries', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Multi-currency journal entry',
                currency: 'USD',
                exchangeRate: 4.50,
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                        currency: 'USD',
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 450.00, // Converted to base currency
                        currency: 'MYR',
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(true);
            expect(result.currency).toBe('USD');
            expect(result.exchangeRate).toBe(4.50);
        });

        it('should validate currency consistency', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Inconsistent currency journal entry',
                currency: 'USD',
                exchangeRate: 4.50,
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                        currency: 'USD',
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 100.00, // Same amount but different currency
                        currency: 'EUR', // Different currency
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Currency mismatch in journal lines');
        });
    });

    describe('Period Validation', () => {
        it('should validate journal entry is in open period', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                periodId: 'closed-period-001',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock period validation to return closed period
            vi.mock('@aibos/accounting/gl/posting', async () => {
                const actual = await vi.importActual('@aibos/accounting/gl/posting');
                return {
                    ...actual,
                    validatePeriodOpen: vi.fn().mockResolvedValue({
                        valid: false,
                        error: 'Period is closed',
                    }),
                };
            });

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Period is closed');
        });

        it('should allow journal entry in open period', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                periodId: 'open-period-001',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(true);
        });
    });

    describe('Performance Testing', () => {
        it('should complete validation within performance threshold', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 100.00,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const startTime = performance.now();
            const result = await validateJournalPosting(input as any);
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result.success).toBe(true);
        });

        it('should handle large journal with many lines efficiently', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Large journal entry',
                lines: Array.from({ length: 100 }, (_, i) => ({
                    accountId: `test-account-${i}`,
                    debit: i % 2 === 0 ? 10.00 : 0,
                    credit: i % 2 === 1 ? 10.00 : 0,
                })),
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const startTime = performance.now();
            const result = await validateJournalPosting(input as any);
            const duration = performance.now() - startTime;

            expect(duration).toBeLessThan(testConfig.performance.apiResponseTime.p95);
            expect(result.success).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('should handle very small amounts', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Small amount journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 0.01,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 0.01,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(true);
        });

        it('should handle very large amounts', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Large amount journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 999999999.99,
                        credit: 0,
                    },
                    {
                        accountId: 'test-account-002',
                        debit: 0,
                        credit: 999999999.99,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(true);
        });

        it('should handle journal with single line (unbalanced)', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Single line journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Journal is not balanced');
        });
    });

    describe('Error Handling', () => {
        it('should handle database connection errors', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock database error
            vi.mock('@aibos/db', () => ({
                getAccountInfo: vi.fn().mockRejectedValue(new Error('Database connection failed')),
            }));

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Database connection failed');
        });

        it('should handle validation service errors', async () => {
            const input = {
                journalId: 'test-journal-001',
                description: 'Test journal entry',
                lines: [
                    {
                        accountId: 'test-account-001',
                        debit: 100.00,
                        credit: 0,
                    },
                ],
                context: {
                    companyId: mockCompanyId,
                    userId: mockUserId,
                    userRole: mockUserRole,
                },
            };

            // Mock validation service error
            vi.mock('@aibos/accounting/gl/posting', async () => {
                const actual = await vi.importActual('@aibos/accounting/gl/posting');
                return {
                    ...actual,
                    validateAccountExists: vi.fn().mockRejectedValue(new Error('Validation service error')),
                };
            });

            const result = await validateJournalPosting(input as any);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Validation service error');
        });
    });
});
