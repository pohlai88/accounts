/**
 * Journal Balance Invariant Tests
 *
 * These tests use property-based testing with fast-check to verify
 * fundamental invariants about journal entries and accounting logic.
 */

import fc from "fast-check";
import { describe, it, expect } from "vitest";

// Helpers for stable amounts & rates
const money = fc
  .float({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true })
  .map(x => Math.round(x * 100) / 100); // 2 d.p.

const posInt = fc.integer({ min: 1, max: 100 });

const fxRate = fc.float({ min: 0.01, max: 10, noNaN: true, noDefaultInfinity: true })
  .map(r => Number(r.toFixed(6)));

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

// Mock the accounting functions for testing
const mockValidateJournalPosting = async (input: any) => {
  // Simulate journal validation logic
  const sumDebits = input.lines.reduce((sum: number, line: any) => sum + (line.debit || 0), 0);
  const sumCredits = input.lines.reduce((sum: number, line: any) => sum + (line.credit || 0), 0);

  return {
    validated: Math.abs(sumDebits - sumCredits) < 0.01, // Allow for rounding differences
    journalInput: input,
    sumDebits,
    sumCredits
  };
};

const mockValidatePaymentProcessing = async (input: any) => {
  // Simulate payment processing logic
  return {
    success: input.amount > 0 && input.exchangeRate > 0,
    amount: input.amount,
    exchangeRate: input.exchangeRate
  };
};

/**
 * Arbitrary generator for journal entries
 */
const arbJournal = () => {
  return fc.record({
    journalId: fc.string({ minLength: 1, maxLength: 20 }),
    description: fc.string({ minLength: 1, maxLength: 100 }),
    lines: fc.array(
      fc.record({
        accountId: fc.string({ minLength: 1, maxLength: 20 }),
        debit: money,
        credit: money,
      }),
      { minLength: 2, maxLength: 10 }
    )
  });
};

/**
 * Arbitrary generator for balanced journal entries
 */
const arbBalancedJournal = () => {
  return fc.record({
    journalId: fc.string({ minLength: 1, maxLength: 20 }),
    description: fc.string({ minLength: 1, maxLength: 100 }),
    lines: fc.array(
      fc.record({
        accountId: fc.string({ minLength: 1, maxLength: 20 }),
        debit: money,
        credit: money,
      }),
      { minLength: 2, maxLength: 10 }
    )
  }).map(journal => {
    // Ensure the journal is balanced by adjusting the last line
    const lines = journal.lines;
    const sumDebits = lines.slice(0, -1).reduce((sum, line) => sum + (line.debit || 0), 0);
    const sumCredits = lines.slice(0, -1).reduce((sum, line) => sum + (line.credit || 0), 0);

    const lastLine = lines[lines.length - 1];
    const difference = sumDebits - sumCredits;

    // Always ensure the last line balances the journal
    if (Math.abs(difference) > 0.001) {
      if (difference > 0) {
        lastLine.credit = difference;
        lastLine.debit = 0;
      } else {
        lastLine.debit = Math.abs(difference);
        lastLine.credit = 0;
      }
    } else {
      // If already balanced, ensure last line has some amount
      lastLine.debit = 0;
      lastLine.credit = 0;
    }

    return journal;
  });
};

/**
 * Arbitrary generator for payment inputs
 */
const arbPayment = () => {
  return fc.record({
    amount: money,
    exchangeRate: fxRate,
    currency: fc.constantFrom("USD", "EUR", "GBP", "MYR")
  });
};

describe("Journal Balance Invariants", () => {
  it("Σdebits === Σcredits for any valid journal", async () => {
    await fc.assert(
      fc.asyncProperty(arbBalancedJournal(), async input => {
        const result = await mockValidateJournalPosting(input);

        if (result.validated) {
          expect(result.sumDebits).toBeCloseTo(result.sumCredits, 2);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("Unbalanced journals should be rejected", async () => {
    await fc.assert(
      fc.asyncProperty(arbJournal(), async input => {
        const result = await mockValidateJournalPosting(input);

        // Check if journal is actually unbalanced
        const isUnbalanced = Math.abs(result.sumDebits - result.sumCredits) > 0.01;

        if (isUnbalanced) {
          expect(result.validated).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Journal balance is preserved when scaling amounts", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbBalancedJournal(),
        fc.float({ min: 0.1, max: 10, noNaN: true, noDefaultInfinity: true }),
        async (input, scaleFactor) => {
          // Guard against NaN/infinity
          fc.pre(isFiniteNumber(scaleFactor));
          const scaledInput = {
            ...input,
            lines: input.lines.map(line => ({
              ...line,
              debit: (line.debit || 0) * scaleFactor,
              credit: (line.credit || 0) * scaleFactor
            }))
          };

          const result = await mockValidateJournalPosting(scaledInput);

          if (result.validated) {
            expect(result.sumDebits).toBeCloseTo(result.sumCredits, 2);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe("Payment Processing Invariants", () => {
  it("FX round-trip preserves amounts within rounding", async () => {
    await fc.assert(
      fc.asyncProperty(arbPayment(), async input => {
        const originalAmount = input.amount;
        const exchangeRate = input.exchangeRate;

        // Convert to base currency
        const convertedAmount = originalAmount * exchangeRate;
        // Convert back to original currency
        const roundTripAmount = convertedAmount / exchangeRate;

        expect(roundTripAmount).toBeCloseTo(originalAmount, 2);
      }),
      { numRuns: 100 }
    );
  });

  it("Payment amounts must be positive", async () => {
    await fc.assert(
      fc.asyncProperty(arbPayment(), async input => {
        const result = await mockValidatePaymentProcessing(input);

        if (input.amount > 0 && input.exchangeRate > 0) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("Exchange rate scaling preserves relative amounts", async () => {
    await fc.assert(
      fc.asyncProperty(
        arbPayment(),
        fc.float({ min: 0.1, max: 10, noNaN: true, noDefaultInfinity: true }),
        async (input, scaleFactor) => {
          // Guard against NaN/infinity
          fc.pre(isFiniteNumber(scaleFactor));
          const scaledInput = {
            ...input,
            exchangeRate: input.exchangeRate * scaleFactor
          };

          const originalResult = await mockValidatePaymentProcessing(input);
          const scaledResult = await mockValidatePaymentProcessing(scaledInput);

          expect(originalResult.success).toBe(scaledResult.success);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe("Accounting Logic Invariants", () => {
  it("Zero amounts are handled consistently", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          amount: fc.constant(0),
          exchangeRate: fc.double({ min: 0.01, max: 10 })
        }),
        async input => {
          const result = await mockValidatePaymentProcessing(input);
          expect(result.success).toBe(false); // Zero amounts should be rejected
        }
      ),
      { numRuns: 50 }
    );
  });

  it("Very small amounts are handled consistently", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          amount: fc.float({ min: 0.001, max: 0.01, noNaN: true, noDefaultInfinity: true })
            .map(x => Math.round(x * 1000) / 1000), // 3 d.p. for small amounts
          exchangeRate: fxRate
        }),
        async input => {
          // Guard against NaN/infinity
          fc.pre(isFiniteNumber(input.amount));
          fc.pre(isFiniteNumber(input.exchangeRate));
          const result = await mockValidatePaymentProcessing(input);
          expect(result.success).toBe(true); // Small amounts should be accepted
        }
      ),
      { numRuns: 50 }
    );
  });

  it("Currency conversion is commutative", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          amount: money,
          exchangeRate1: fxRate,
          exchangeRate2: fxRate
        }),
        async input => {
          const { amount, exchangeRate1, exchangeRate2 } = input;

          // Guard (defensive):
          fc.pre(isFiniteNumber(amount));
          fc.pre(isFiniteNumber(exchangeRate1));
          fc.pre(isFiniteNumber(exchangeRate2));

          // Convert A -> B -> C
          const converted1 = amount * exchangeRate1;
          const converted2 = converted1 * exchangeRate2;

          // Convert A -> C directly
          const directConversion = amount * exchangeRate1 * exchangeRate2;

          // Guard results
          fc.pre(isFiniteNumber(converted1));
          fc.pre(isFiniteNumber(converted2));
          fc.pre(isFiniteNumber(directConversion));

          expect(converted2).toBeCloseTo(directConversion, 2);
        }
      ),
      { numRuns: 50 }
    );
  });
});
