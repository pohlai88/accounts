// Simple GL Posting Test - Following Working Pattern
import { describe, it, expect, vi } from 'vitest';

describe('GL Posting - Simple', () => {
    it('should validate a valid journal entry', async () => {
        // Import SUT (global mocks are already set up)
        const { validateJournalPosting } = await import('@aibos/accounting');

        const input = {
            journalNumber: 'JRN-001',
            description: 'Test Journal Entry',
            journalDate: new Date('2024-01-01'),
            currency: 'MYR',
            lines: [
                {
                    accountId: 'test-cash-account',
                    debit: 100.00,
                    credit: 0,
                    description: 'Cash received',
                },
                {
                    accountId: 'test-revenue-account',
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
    });

    it('should reject journal with no lines', async () => {
        // Import SUT (global mocks are already set up)
        const { validateJournalPosting } = await import('@aibos/accounting');

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
});
