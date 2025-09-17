/**
 * @aibos/utils - Financial Testing Utilities
 *
 * Specialized testing utilities for SaaS accounting applications
 * Handles decimal precision, financial calculations, and accounting-specific validations
 */
// @ts-nocheck


import { expect } from "vitest";

// Financial calculation precision utilities
export class FinancialTestUtils {
  /**
   * Test decimal precision for financial calculations
   * Ensures calculations maintain proper precision for accounting
   */
  static expectFinancialPrecision(actual: number, expected: number, precision: number = 2): void {
    const roundedActual = Math.round(actual * Math.pow(10, precision)) / Math.pow(10, precision);
    const roundedExpected =
      Math.round(expected * Math.pow(10, precision)) / Math.pow(10, precision);
    expect(roundedActual).toBe(roundedExpected);
  }

  /**
   * Test that a calculation result is within acceptable accounting tolerance
   */
  static expectWithinTolerance(actual: number, expected: number, tolerance: number = 0.01): void {
    const difference = Math.abs(actual - expected);
    expect(difference).toBeLessThanOrEqual(tolerance);
  }

  /**
   * Test that debits equal credits (double-entry bookkeeping)
   */
  static expectBalancedJournal(debits: number[], credits: number[]): void {
    const totalDebits = debits.reduce((sum, amount) => sum + amount, 0);
    const totalCredits = credits.reduce((sum, amount) => sum + amount, 0);
    this.expectFinancialPrecision(totalDebits, totalCredits);
  }

  /**
   * Test that a balance sheet balances (Assets = Liabilities + Equity)
   */
  static expectBalancedBalanceSheet(assets: number, liabilities: number, equity: number): void {
    const totalLiabilitiesAndEquity = liabilities + equity;
    this.expectFinancialPrecision(assets, totalLiabilitiesAndEquity);
  }

  /**
   * Test that a trial balance is balanced
   */
  static expectBalancedTrialBalance(accounts: Array<{ debit: number; credit: number }>): void {
    const totalDebits = accounts.reduce((sum, account) => sum + account.debit, 0);
    const totalCredits = accounts.reduce((sum, account) => sum + account.credit, 0);
    this.expectFinancialPrecision(totalDebits, totalCredits);
  }

  /**
   * Test that a calculation result is positive (for amounts that should be positive)
   */
  static expectPositiveAmount(amount: number, _fieldName: string = "amount"): void {
    expect(amount).toBeGreaterThan(0);
  }

  /**
   * Test that a calculation result is non-negative (for amounts that can be zero)
   */
  static expectNonNegativeAmount(amount: number, _fieldName: string = "amount"): void {
    expect(amount).toBeGreaterThanOrEqual(0);
  }

  /**
   * Test that a percentage is within valid range (0-100)
   */
  static expectValidPercentage(percentage: number, _fieldName: string = "percentage"): void {
    expect(percentage).toBeGreaterThanOrEqual(0);
    expect(percentage).toBeLessThanOrEqual(100);
  }

  /**
   * Test that a tax calculation is correct
   */
  static expectCorrectTaxCalculation(
    taxableAmount: number,
    taxRate: number,
    expectedTax: number,
    precision: number = 2,
  ): void {
    const calculatedTax = taxableAmount * (taxRate / 100);
    this.expectFinancialPrecision(calculatedTax, expectedTax, precision);
  }

  /**
   * Test that a depreciation calculation is correct
   */
  static expectCorrectDepreciation(
    assetCost: number,
    salvageValue: number,
    usefulLife: number,
    expectedDepreciation: number,
    method: "straight-line" | "declining-balance" | "sum-of-years",
  ): void {
    let calculatedDepreciation: number;

    switch (method) {
      case "straight-line":
        calculatedDepreciation = (assetCost - salvageValue) / usefulLife;
        break;
      case "declining-balance": {
        // Simplified declining balance (2x straight-line rate)
        const rate = 2 / usefulLife;
        calculatedDepreciation = assetCost * rate;
        break;
      }
      case "sum-of-years": {
        const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
        calculatedDepreciation = ((assetCost - salvageValue) * usefulLife) / sumOfYears;
        break;
      }
      default:
        throw new Error(`Unknown depreciation method: ${method}`);
    }

    this.expectFinancialPrecision(calculatedDepreciation, expectedDepreciation);
  }

  /**
   * Test that a compound interest calculation is correct
   */
  static expectCorrectCompoundInterest(
    principal: number,
    rate: number,
    time: number,
    expectedAmount: number,
    precision: number = 2,
  ): void {
    const calculatedAmount = principal * Math.pow(1 + rate / 100, time);
    this.expectFinancialPrecision(calculatedAmount, expectedAmount, precision);
  }

  /**
   * Test that a present value calculation is correct
   */
  static expectCorrectPresentValue(
    futureValue: number,
    rate: number,
    time: number,
    expectedPresentValue: number,
    precision: number = 2,
  ): void {
    const calculatedPresentValue = futureValue / Math.pow(1 + rate / 100, time);
    this.expectFinancialPrecision(calculatedPresentValue, expectedPresentValue, precision);
  }

  /**
   * Test that a loan payment calculation is correct
   */
  static expectCorrectLoanPayment(
    principal: number,
    rate: number,
    time: number,
    expectedPayment: number,
    precision: number = 2,
  ): void {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = time * 12;
    const calculatedPayment =
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    this.expectFinancialPrecision(calculatedPayment, expectedPayment, precision);
  }
}

// Accounting-specific test data generators
export class AccountingTestData {
  /**
   * Generate test journal entries
   */
  static generateJournalEntries(count: number = 5): Array<{
    account: string;
    debit: number;
    credit: number;
    description: string;
  }> {
    const accounts = ["Cash", "Accounts Receivable", "Inventory", "Accounts Payable", "Revenue"];
    const entries = [];

    for (let i = 0; i < count; i++) {
      const account = accounts[i % accounts.length];
      const amount = Math.round(Math.random() * 1000 * 100) / 100; // Random amount with 2 decimal places
      const isDebit = Math.random() > 0.5;

      entries.push({
        account,
        debit: isDebit ? amount : 0,
        credit: isDebit ? 0 : amount,
        description: `Test entry ${i + 1}`,
      });
    }

    return entries;
  }

  /**
   * Generate test balance sheet data
   */
  static generateBalanceSheetData(): {
    assets: { current: number; fixed: number; total: number };
    liabilities: { current: number; longTerm: number; total: number };
    equity: { retainedEarnings: number; commonStock: number; total: number };
  } {
    const currentAssets = Math.round(Math.random() * 50000 * 100) / 100;
    const fixedAssets = Math.round(Math.random() * 100000 * 100) / 100;
    const currentLiabilities = Math.round(Math.random() * 30000 * 100) / 100;
    const longTermLiabilities = Math.round(Math.random() * 50000 * 100) / 100;
    const retainedEarnings = Math.round(Math.random() * 40000 * 100) / 100;
    const commonStock = Math.round(Math.random() * 20000 * 100) / 100;

    return {
      assets: {
        current: currentAssets,
        fixed: fixedAssets,
        total: currentAssets + fixedAssets,
      },
      liabilities: {
        current: currentLiabilities,
        longTerm: longTermLiabilities,
        total: currentLiabilities + longTermLiabilities,
      },
      equity: {
        retainedEarnings,
        commonStock,
        total: retainedEarnings + commonStock,
      },
    };
  }

  /**
   * Generate test income statement data
   */
  static generateIncomeStatementData(): {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    netIncome: number;
  } {
    const revenue = Math.round(Math.random() * 200000 * 100) / 100;
    const costOfGoodsSold = Math.round(revenue * (0.6 + Math.random() * 0.2) * 100) / 100;
    const grossProfit = revenue - costOfGoodsSold;
    const operatingExpenses = Math.round(grossProfit * (0.3 + Math.random() * 0.2) * 100) / 100;
    const operatingIncome = grossProfit - operatingExpenses;
    const netIncome = operatingIncome; // Simplified (no taxes/interest)

    return {
      revenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      netIncome,
    };
  }
}

// Accounting-specific test matchers
export const accountingMatchers = {
  toBeBalanced: (received: { debits: number[]; credits: number[] }) => {
    const totalDebits = received.debits.reduce((sum, amount) => sum + amount, 0);
    const totalCredits = received.credits.reduce((sum, amount) => sum + amount, 0);
    const difference = Math.abs(totalDebits - totalCredits);

    return {
      message: () =>
        `Expected debits (${totalDebits}) to equal credits (${totalCredits}). Difference: ${difference}`,
      pass: difference < 0.01,
    };
  },

  toHaveFinancialPrecision: (received: number, expected: number, precision: number = 2) => {
    const roundedReceived =
      Math.round(received * Math.pow(10, precision)) / Math.pow(10, precision);
    const roundedExpected =
      Math.round(expected * Math.pow(10, precision)) / Math.pow(10, precision);

    return {
      message: () =>
        `Expected ${roundedReceived} to equal ${roundedExpected} with ${precision} decimal precision`,
      pass: roundedReceived === roundedExpected,
    };
  },

  toBePositiveAmount: (received: number) => {
    return {
      message: () => `Expected ${received} to be positive`,
      pass: received > 0,
    };
  },

  toBeValidPercentage: (received: number) => {
    return {
      message: () => `Expected ${received} to be a valid percentage (0-100)`,
      pass: received >= 0 && received <= 100,
    };
  },
};

// Export all utilities
export { FinancialTestUtils as Financial, AccountingTestData as TestData };
