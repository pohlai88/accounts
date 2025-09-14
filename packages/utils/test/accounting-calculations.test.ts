/**
 * @aibos/utils - Accounting Calculations Test Suite
 *
 * Example test suite demonstrating specialized testing for SaaS accounting applications
 * using the custom financial testing utilities
 */

import { describe, it, expect, beforeEach } from "vitest";
import { FinancialTestUtils } from "./financial-testing-utils";
import { ReportTestUtils, ReportTestData } from "./accounting-report-testing";

// Mock accounting service for demonstration
class MockAccountingService {
  calculateTax(taxableAmount: number, taxRate: number): number {
    return Math.round(taxableAmount * (taxRate / 100) * 100) / 100;
  }

  calculateDepreciation(
    assetCost: number,
    salvageValue: number,
    usefulLife: number,
    method: string,
  ): number {
    switch (method) {
      case "straight-line":
        return Math.round(((assetCost - salvageValue) / usefulLife) * 100) / 100;
      case "declining-balance": {
        const rate = 2 / usefulLife;
        return Math.round(assetCost * rate * 100) / 100;
      }
      default:
        return 0;
    }
  }

  createJournalEntry(entries: Array<{ account: string; debit: number; credit: number }>): {
    success: boolean;
    error?: string;
  } {
    const totalDebits = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredits = entries.reduce((sum, entry) => sum + entry.credit, 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      return { success: false, error: "Journal entry is not balanced" };
    }

    return { success: true };
  }

  generateProfitAndLoss(data: {
    revenue: number;
    costOfGoodsSold: number;
    operatingExpenses: number;
  }): {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
  } {
    const grossProfit = data.revenue - data.costOfGoodsSold;
    const operatingIncome = grossProfit - data.operatingExpenses;

    return {
      revenue: data.revenue,
      costOfGoodsSold: data.costOfGoodsSold,
      grossProfit,
      operatingExpenses: data.operatingExpenses,
      operatingIncome,
    };
  }
}

describe("Accounting Calculations", () => {
  let accountingService: MockAccountingService;

  beforeEach(() => {
    accountingService = new MockAccountingService();
  });

  describe("Tax Calculations", () => {
    it("should calculate sales tax correctly", () => {
      const taxableAmount = 1000;
      const taxRate = 8.25;
      const expectedTax = 82.5;

      FinancialTestUtils.expectCorrectTaxCalculation(taxableAmount, taxRate, expectedTax);
      FinancialTestUtils.expectFinancialPrecision(
        accountingService.calculateTax(taxableAmount, taxRate),
        expectedTax,
      );
    });

    it("should handle zero tax rate", () => {
      const taxableAmount = 1000;
      const taxRate = 0;
      const expectedTax = 0;

      FinancialTestUtils.expectFinancialPrecision(
        accountingService.calculateTax(taxableAmount, taxRate),
        expectedTax,
      );
    });

    it("should handle high tax rates", () => {
      const taxableAmount = 1000;
      const taxRate = 25.75;
      const expectedTax = 257.5;

      FinancialTestUtils.expectCorrectTaxCalculation(taxableAmount, taxRate, expectedTax);
    });
  });

  describe("Depreciation Calculations", () => {
    it("should calculate straight-line depreciation correctly", () => {
      const assetCost = 10000;
      const salvageValue = 1000;
      const usefulLife = 5;
      const method = "straight-line";

      const calculatedDepreciation = accountingService.calculateDepreciation(
        assetCost,
        salvageValue,
        usefulLife,
        method,
      );
      const expectedDepreciation = 1800;

      FinancialTestUtils.expectCorrectDepreciation(
        assetCost,
        salvageValue,
        usefulLife,
        expectedDepreciation,
        "straight-line",
      );
      FinancialTestUtils.expectFinancialPrecision(calculatedDepreciation, expectedDepreciation);
    });

    it("should calculate declining balance depreciation correctly", () => {
      const assetCost = 10000;
      const salvageValue = 1000;
      const usefulLife = 5;
      const method = "declining-balance";

      const calculatedDepreciation = accountingService.calculateDepreciation(
        assetCost,
        salvageValue,
        usefulLife,
        method,
      );
      const expectedDepreciation = 4000; // 2/5 * 10000

      FinancialTestUtils.expectCorrectDepreciation(
        assetCost,
        salvageValue,
        usefulLife,
        expectedDepreciation,
        "declining-balance",
      );
      FinancialTestUtils.expectFinancialPrecision(calculatedDepreciation, expectedDepreciation);
    });
  });

  describe("Journal Entry Validation", () => {
    it("should accept balanced journal entries", () => {
      const entries = [
        { account: "Cash", debit: 1000, credit: 0 },
        { account: "Revenue", debit: 0, credit: 1000 },
      ];

      const result = accountingService.createJournalEntry(entries);
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject unbalanced journal entries", () => {
      const entries = [
        { account: "Cash", debit: 1000, credit: 0 },
        { account: "Revenue", debit: 0, credit: 900 }, // Missing 100
      ];

      const result = accountingService.createJournalEntry(entries);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Journal entry is not balanced");
    });

    it("should handle complex journal entries", () => {
      const entries = [
        { account: "Cash", debit: 1000, credit: 0 },
        { account: "Accounts Receivable", debit: 500, credit: 0 },
        { account: "Revenue", debit: 0, credit: 1000 },
        { account: "Sales Tax Payable", debit: 0, credit: 500 },
      ];

      const result = accountingService.createJournalEntry(entries);
      expect(result.success).toBe(true);
    });
  });

  describe("Profit & Loss Statement", () => {
    it("should generate valid P&L data", () => {
      const inputData = {
        revenue: 100000,
        costOfGoodsSold: 60000,
        operatingExpenses: 25000,
      };

      const pAndL = accountingService.generateProfitAndLoss(inputData);

      // Test individual calculations
      expect(pAndL.revenue).toBe(inputData.revenue);
      expect(pAndL.costOfGoodsSold).toBe(inputData.costOfGoodsSold);
      expect(pAndL.operatingExpenses).toBe(inputData.operatingExpenses);

      // Test gross profit calculation
      const expectedGrossProfit = inputData.revenue - inputData.costOfGoodsSold;
      FinancialTestUtils.expectFinancialPrecision(pAndL.grossProfit, expectedGrossProfit);

      // Test operating income calculation
      const expectedOperatingIncome = expectedGrossProfit - inputData.operatingExpenses;
      FinancialTestUtils.expectFinancialPrecision(pAndL.operatingIncome, expectedOperatingIncome);
    });

    it("should handle zero revenue", () => {
      const inputData = {
        revenue: 0,
        costOfGoodsSold: 0,
        operatingExpenses: 1000,
      };

      const pAndL = accountingService.generateProfitAndLoss(inputData);

      expect(pAndL.grossProfit).toBe(0);
      expect(pAndL.operatingIncome).toBe(-1000);
    });
  });

  describe("Financial Report Validation", () => {
    it("should validate generated P&L data", () => {
      const data = ReportTestData.generateProfitAndLossData();
      ReportTestUtils.expectValidProfitAndLoss(data);
    });

    it("should validate generated balance sheet data", () => {
      const data = ReportTestData.generateBalanceSheetData();
      ReportTestUtils.expectValidBalanceSheet(data);
    });

    it("should validate generated cash flow data", () => {
      const data = ReportTestData.generateCashFlowData();
      ReportTestUtils.expectValidCashFlowStatement(data);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle very small amounts", () => {
      const taxableAmount = 0.01;
      const taxRate = 8.25;
      const expectedTax = 0.0; // Rounded down

      FinancialTestUtils.expectFinancialPrecision(
        accountingService.calculateTax(taxableAmount, taxRate),
        expectedTax,
      );
    });

    it("should handle very large amounts", () => {
      const taxableAmount = 1000000;
      const taxRate = 8.25;
      const expectedTax = 82500.0;

      FinancialTestUtils.expectCorrectTaxCalculation(taxableAmount, taxRate, expectedTax);
    });

    it("should handle negative amounts", () => {
      const taxableAmount = -1000;
      const taxRate = 8.25;
      const expectedTax = -82.5;

      FinancialTestUtils.expectCorrectTaxCalculation(taxableAmount, taxRate, expectedTax);
    });
  });

  describe("Performance Testing", () => {
    it("should calculate tax for large dataset efficiently", () => {
      const startTime = performance.now();

      // Calculate tax for 1000 items
      for (let i = 0; i < 1000; i++) {
        const amount = Math.random() * 10000;
        const rate = Math.random() * 20;
        accountingService.calculateTax(amount, rate);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});

// Example of how to use custom test matchers
describe("Custom Test Matchers", () => {
  it("should use custom matchers for financial testing", () => {
    const journalEntry = {
      debits: [1000, 500],
      credits: [800, 700],
    };

    // This would work if we extended expect with custom matchers
    // expect(journalEntry).toBeBalanced();

    // For now, we use the utility function
    FinancialTestUtils.expectBalancedJournal(journalEntry.debits, journalEntry.credits);
  });
});
