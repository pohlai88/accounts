/**
 * @aibos/utils - Accounting Report Testing Utilities
 *
 * Specialized testing utilities for accounting reports, financial statements,
 * and business intelligence features in SaaS accounting applications
 */

import { expect } from "vitest";
import { FinancialTestUtils } from "./financial-testing-utils";

// Report testing utilities
export class ReportTestUtils {
  /**
   * Test that a P&L statement is mathematically correct
   */
  static expectValidProfitAndLoss(data: {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    otherIncome: number;
    otherExpenses: number;
    netIncome: number;
  }): void {
    // Test gross profit calculation
    const expectedGrossProfit = data.revenue - data.costOfGoodsSold;
    FinancialTestUtils.expectFinancialPrecision(data.grossProfit, expectedGrossProfit);

    // Test operating income calculation
    const expectedOperatingIncome = data.grossProfit - data.operatingExpenses;
    FinancialTestUtils.expectFinancialPrecision(data.operatingIncome, expectedOperatingIncome);

    // Test net income calculation
    const expectedNetIncome = data.operatingIncome + data.otherIncome - data.otherExpenses;
    FinancialTestUtils.expectFinancialPrecision(data.netIncome, expectedNetIncome);
  }

  /**
   * Test that a balance sheet is mathematically correct
   */
  static expectValidBalanceSheet(data: {
    assets: { current: number; fixed: number; total: number };
    liabilities: { current: number; longTerm: number; total: number };
    equity: { retainedEarnings: number; commonStock: number; total: number };
  }): void {
    // Test asset totals
    const expectedAssetTotal = data.assets.current + data.assets.fixed;
    FinancialTestUtils.expectFinancialPrecision(data.assets.total, expectedAssetTotal);

    // Test liability totals
    const expectedLiabilityTotal = data.liabilities.current + data.liabilities.longTerm;
    FinancialTestUtils.expectFinancialPrecision(data.liabilities.total, expectedLiabilityTotal);

    // Test equity totals
    const expectedEquityTotal = data.equity.retainedEarnings + data.equity.commonStock;
    FinancialTestUtils.expectFinancialPrecision(data.equity.total, expectedEquityTotal);

    // Test balance sheet equation (Assets = Liabilities + Equity)
    const totalLiabilitiesAndEquity = data.liabilities.total + data.equity.total;
    FinancialTestUtils.expectFinancialPrecision(data.assets.total, totalLiabilitiesAndEquity);
  }

  /**
   * Test that a cash flow statement is mathematically correct
   */
  static expectValidCashFlowStatement(data: {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  }): void {
    // Test net cash flow calculation
    const expectedNetCashFlow =
      data.operatingCashFlow + data.investingCashFlow + data.financingCashFlow;
    FinancialTestUtils.expectFinancialPrecision(data.netCashFlow, expectedNetCashFlow);

    // Test ending cash calculation
    const expectedEndingCash = data.beginningCash + data.netCashFlow;
    FinancialTestUtils.expectFinancialPrecision(data.endingCash, expectedEndingCash);
  }

  /**
   * Test that a trial balance is balanced
   */
  static expectValidTrialBalance(
    accounts: Array<{
      accountName: string;
      debit: number;
      credit: number;
    }>,
  ): void {
    const debits = accounts.map(acc => acc.debit);
    const credits = accounts.map(acc => acc.credit);
    FinancialTestUtils.expectBalancedJournal(debits, credits);
  }

  /**
   * Test that aging reports are mathematically correct
   */
  static expectValidAgingReport(data: {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
  }): void {
    const expectedTotal = data.current + data.days30 + data.days60 + data.days90 + data.over90;
    FinancialTestUtils.expectFinancialPrecision(data.total, expectedTotal);
  }

  /**
   * Test that tax calculations are correct
   */
  static expectValidTaxCalculation(data: {
    taxableIncome: number;
    taxRate: number;
    calculatedTax: number;
    deductions: number;
    credits: number;
    finalTax: number;
  }): void {
    // Test basic tax calculation
    const expectedCalculatedTax = data.taxableIncome * (data.taxRate / 100);
    FinancialTestUtils.expectFinancialPrecision(data.calculatedTax, expectedCalculatedTax);

    // Test final tax after deductions and credits
    const expectedFinalTax = Math.max(0, data.calculatedTax - data.deductions - data.credits);
    FinancialTestUtils.expectFinancialPrecision(data.finalTax, expectedFinalTax);
  }

  /**
   * Test that depreciation schedules are correct
   */
  static expectValidDepreciationSchedule(
    schedule: Array<{
      year: number;
      beginningValue: number;
      depreciation: number;
      endingValue: number;
    }>,
  ): void {
    for (let i = 0; i < schedule.length; i++) {
      const entry = schedule[i];
      const expectedEndingValue = entry.beginningValue - entry.depreciation;
      FinancialTestUtils.expectFinancialPrecision(entry.endingValue, expectedEndingValue);

      // Test that ending value of one year equals beginning value of next year
      if (i < schedule.length - 1) {
        FinancialTestUtils.expectFinancialPrecision(
          entry.endingValue,
          schedule[i + 1].beginningValue,
        );
      }
    }
  }

  /**
   * Test that budget vs actual reports are mathematically correct
   */
  static expectValidBudgetVsActual(data: {
    budget: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }): void {
    const expectedVariance = data.actual - data.budget;
    FinancialTestUtils.expectFinancialPrecision(data.variance, expectedVariance);

    const expectedVariancePercentage =
      data.budget !== 0 ? (expectedVariance / data.budget) * 100 : 0;
    FinancialTestUtils.expectFinancialPrecision(
      data.variancePercentage,
      expectedVariancePercentage,
    );
  }

  /**
   * Test that inventory valuation is correct
   */
  static expectValidInventoryValuation(data: {
    beginningInventory: number;
    purchases: number;
    costOfGoodsSold: number;
    endingInventory: number;
  }): void {
    const expectedEndingInventory = data.beginningInventory + data.purchases - data.costOfGoodsSold;
    FinancialTestUtils.expectFinancialPrecision(data.endingInventory, expectedEndingInventory);
  }

  /**
   * Test that payroll calculations are correct
   */
  static expectValidPayrollCalculation(data: {
    grossPay: number;
    federalTax: number;
    stateTax: number;
    socialSecurity: number;
    medicare: number;
    otherDeductions: number;
    netPay: number;
  }): void {
    const totalDeductions =
      data.federalTax + data.stateTax + data.socialSecurity + data.medicare + data.otherDeductions;
    const expectedNetPay = data.grossPay - totalDeductions;
    FinancialTestUtils.expectFinancialPrecision(data.netPay, expectedNetPay);
  }

  /**
   * Test that financial ratios are calculated correctly
   */
  static expectValidFinancialRatios(data: {
    currentRatio: number;
    quickRatio: number;
    debtToEquity: number;
    grossProfitMargin: number;
    netProfitMargin: number;
    returnOnAssets: number;
    returnOnEquity: number;
  }): void {
    // Test that ratios are within reasonable ranges
    expect(data.currentRatio).toBeGreaterThan(0);
    expect(data.quickRatio).toBeGreaterThan(0);
    expect(data.debtToEquity).toBeGreaterThanOrEqual(0);
    expect(data.grossProfitMargin).toBeGreaterThanOrEqual(0);
    expect(data.grossProfitMargin).toBeLessThanOrEqual(100);
    expect(data.netProfitMargin).toBeGreaterThanOrEqual(0);
    expect(data.netProfitMargin).toBeLessThanOrEqual(100);
    expect(data.returnOnAssets).toBeGreaterThanOrEqual(0);
    expect(data.returnOnEquity).toBeGreaterThanOrEqual(0);
  }
}

// Report data generators
export class ReportTestData {
  /**
   * Generate test P&L data
   */
  static generateProfitAndLossData(): {
    revenue: number;
    costOfGoodsSold: number;
    grossProfit: number;
    operatingExpenses: number;
    operatingIncome: number;
    otherIncome: number;
    otherExpenses: number;
    netIncome: number;
  } {
    const revenue = Math.round(Math.random() * 200000 * 100) / 100;
    const costOfGoodsSold = Math.round(revenue * (0.6 + Math.random() * 0.2) * 100) / 100;
    const grossProfit = revenue - costOfGoodsSold;
    const operatingExpenses = Math.round(grossProfit * (0.3 + Math.random() * 0.2) * 100) / 100;
    const operatingIncome = grossProfit - operatingExpenses;
    const otherIncome = Math.round(Math.random() * 5000 * 100) / 100;
    const otherExpenses = Math.round(Math.random() * 3000 * 100) / 100;
    const netIncome = operatingIncome + otherIncome - otherExpenses;

    return {
      revenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      otherIncome,
      otherExpenses,
      netIncome,
    };
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

    // Calculate equity to balance the sheet
    const totalAssets = currentAssets + fixedAssets;
    const totalLiabilities = currentLiabilities + longTermLiabilities;
    const totalEquity = totalAssets - totalLiabilities;

    // Split equity between retained earnings and common stock
    const retainedEarnings = Math.round(totalEquity * (0.6 + Math.random() * 0.3) * 100) / 100;
    const commonStock = totalEquity - retainedEarnings;

    return {
      assets: {
        current: currentAssets,
        fixed: fixedAssets,
        total: totalAssets,
      },
      liabilities: {
        current: currentLiabilities,
        longTerm: longTermLiabilities,
        total: totalLiabilities,
      },
      equity: {
        retainedEarnings,
        commonStock,
        total: totalEquity,
      },
    };
  }

  /**
   * Generate test cash flow data
   */
  static generateCashFlowData(): {
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    netCashFlow: number;
    beginningCash: number;
    endingCash: number;
  } {
    const operatingCashFlow = Math.round(Math.random() * 50000 * 100) / 100;
    const investingCashFlow = Math.round((Math.random() - 0.5) * 20000 * 100) / 100;
    const financingCashFlow = Math.round((Math.random() - 0.5) * 15000 * 100) / 100;
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
    const beginningCash = Math.round(Math.random() * 10000 * 100) / 100;
    const endingCash = beginningCash + netCashFlow;

    return {
      operatingCashFlow,
      investingCashFlow,
      financingCashFlow,
      netCashFlow,
      beginningCash,
      endingCash,
    };
  }

  /**
   * Generate test aging report data
   */
  static generateAgingReportData(): {
    current: number;
    days30: number;
    days60: number;
    days90: number;
    over90: number;
    total: number;
  } {
    const current = Math.round(Math.random() * 10000 * 100) / 100;
    const days30 = Math.round(Math.random() * 5000 * 100) / 100;
    const days60 = Math.round(Math.random() * 3000 * 100) / 100;
    const days90 = Math.round(Math.random() * 2000 * 100) / 100;
    const over90 = Math.round(Math.random() * 1000 * 100) / 100;
    const total = current + days30 + days60 + days90 + over90;

    return {
      current,
      days30,
      days60,
      days90,
      over90,
      total,
    };
  }
}

// Export all utilities
export { ReportTestUtils as Report, ReportTestData as ReportData };
