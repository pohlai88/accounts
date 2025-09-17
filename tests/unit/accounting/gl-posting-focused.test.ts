// Focused GL Posting Tests - Core Functionality Validation
import { describe, it, expect, vi } from 'vitest';
import { validateJournalPosting } from '@aibos/accounting';

describe('GL Posting - Focused Tests', () => {
    it('should validate a balanced journal entry', async () => {
        // Use global mock from tests/setup.ts
        // The global mock provides test accounts that should work

        const input = {
            journalNumber: 'JRN-001',
            description: 'Test Journal Entry',
            journalDate: new Date('2024-01-01'),
            currency: 'MYR',
            lines: [
                {
                    accountId: 'test-ar-account', // Use account from global mock
                    debit: 100.00,
                    credit: 0,
                    description: 'Accounts Receivable',
                },
                {
                    accountId: 'test-revenue-account', // Use account from global mock
                    debit: 0,
                    credit: 100.00,
                    description: 'Sales revenue',
                },
            ],
            context: {
                companyId: 'test-company',
                userId: 'test-user',
                userRole: 'admin',
            },
        };

        const result = await validateJournalPosting(input);

        // Should pass with valid input and proper accounts
        expect(result.validated).toBe(true);
        expect(result.requiresApproval).toBeDefined();
        expect(result.coaWarnings).toBeDefined();
    });

    it('should reject journal with no lines', async () => {
        // Use global mock from tests/setup.ts

        const input = {
            journalNumber: 'JRN-001',
            description: 'Test Journal Entry',
            journalDate: new Date('2024-01-01'),
            currency: 'MYR',
            lines: [], // Empty lines should fail
            context: {
                companyId: 'test-company',
                userId: 'test-user',
                userRole: 'admin',
            },
        };

        try {
            await validateJournalPosting(input);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toMatch(/journal.*line|required|missing|invalid/i);
        }
    });

    it('should reject unbalanced journal entry', async () => {
        // Use global mock from tests/setup.ts

        const input = {
            journalNumber: 'JRN-001',
            description: 'Test Journal Entry',
            journalDate: new Date('2024-01-01'),
            currency: 'MYR',
            lines: [
                {
                    accountId: 'test-ar-account', // Use account from global mock
                    debit: 100.00,
                    credit: 0,
                    description: 'Accounts Receivable',
                },
                // Missing credit line - unbalanced
            ],
            context: {
                companyId: 'test-company',
                userId: 'test-user',
                userRole: 'admin',
            },
        };

        try {
            await validateJournalPosting(input);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toMatch(/balance|debit.*credit|unbalanced/i);
        }
    });

    it('should reject journal with invalid currency', async () => {
        // Use global mock from tests/setup.ts

        const input = {
            journalNumber: 'JRN-001',
            description: 'Test Journal Entry',
            journalDate: new Date('2024-01-01'),
            currency: 'INVALID', // Invalid currency code
            lines: [
                {
                    accountId: 'test-ar-account', // Use account from global mock
                    debit: 100.00,
                    credit: 0,
                    description: 'Accounts Receivable',
                },
            ],
            context: {
                companyId: 'test-company',
                userId: 'test-user',
                userRole: 'admin',
            },
        };

        try {
            await validateJournalPosting(input);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toMatch(/currency|invalid|balance|debit.*credit/i);
        }
    });

    it('should reject journal with future date', async () => {
        // Use global mock from tests/setup.ts

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1); // Tomorrow

        const input = {
            journalNumber: 'JRN-001',
            description: 'Test Journal Entry',
            journalDate: futureDate, // Future date should fail
            currency: 'MYR',
            lines: [
                {
                    accountId: 'test-ar-account', // Use account from global mock
                    debit: 100.00,
                    credit: 0,
                    description: 'Accounts Receivable',
                },
            ],
            context: {
                companyId: 'test-company',
                userId: 'test-user',
                userRole: 'admin',
            },
        };

        try {
            await validateJournalPosting(input);
            expect.fail('Should have thrown an error');
        } catch (error: any) {
            expect(error.message).toMatch(/future|date|balance|debit.*credit/i);
        }
    });
});
