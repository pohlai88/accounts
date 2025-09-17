// Custom matchers for accounting-specific assertions
import { expect } from 'vitest';

// Extend expect with accounting-specific matchers
expect.extend({
    // Check if journal entries are balanced (debits = credits)
    toBeBalanced(journal: { lines: { debit: number; credit: number }[] }) {
        const totalDebit = journal.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredit = journal.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        const difference = Math.abs(totalDebit - totalCredit);

        return {
            pass: difference < 0.01, // Allow for floating point precision
            message: () =>
                difference < 0.01
                    ? 'Journal is balanced'
                    : `Journal is unbalanced: DR ${totalDebit.toFixed(2)} ≠ CR ${totalCredit.toFixed(2)} (diff: ${difference.toFixed(2)})`
        };
    },

    // Check if all accounts have the same currency
    toAllBeCurrency(accounts: any[], currency: string) {
        const mismatched = accounts.filter(acc => acc.currency !== currency);

        return {
            pass: mismatched.length === 0,
            message: () =>
                mismatched.length === 0
                    ? `All accounts are in ${currency}`
                    : `Currency mismatch: ${mismatched.map(acc => `${acc.id}(${acc.currency})`).join(', ')} should be ${currency}`
        };
    },

    // Check if journal has correct number of lines
    toHaveJournalLines(journal: { lines: any[] }, expectedCount: number) {
        const actualCount = journal.lines.length;

        return {
            pass: actualCount === expectedCount,
            message: () =>
                actualCount === expectedCount
                    ? `Journal has ${expectedCount} lines`
                    : `Expected ${expectedCount} journal lines, got ${actualCount}`
        };
    },

    // Check if result has proper validation structure
    toBeValidated(result: any) {
        return {
            pass: result.validated === true,
            message: () =>
                result.validated === true
                    ? 'Validation passed'
                    : `Validation failed: ${result.error || 'Unknown error'}`
        };
    },

    // Check if result has proper error structure
    toBeValidationError(result: any, expectedCode?: string) {
        const hasError = result.validated === false && result.error;
        const codeMatches = !expectedCode || result.code === expectedCode;

        return {
            pass: hasError && codeMatches,
            message: () => {
                if (!hasError) return 'Expected validation error, but validation passed';
                if (!codeMatches) return `Expected error code '${expectedCode}', got '${result.code}'`;
                return 'Validation error as expected';
            }
        };
    }
});

// Type declarations for TypeScript
declare module 'vitest' {
    interface Assertion<T = any> {
        toBeBalanced(): T;
        toAllBeCurrency(currency: string): T;
        toHaveJournalLines(expectedCount: number): T;
        toBeValidated(): T;
        toBeValidationError(expectedCode?: string): T;
    }
}
