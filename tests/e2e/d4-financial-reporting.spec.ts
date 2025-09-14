// D4 Financial Reporting E2E Tests - V1 Compliance
import { test, expect } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "test-api-key";

// Test data
const testTenant = "550e8400-e29b-41d4-a716-446655440000";
const testCompany = "550e8400-e29b-41d4-a716-446655440001";

test.describe("D4 Financial Reporting - V1 Compliance", () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication headers
    await page.setExtraHTTPHeaders({
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    });
  });

  test("Trial Balance Report Generation - Complete Workflow", async ({ request }) => {
    const idempotencyKey = uuidv4();

    // Test GET request with query parameters
    const response = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
        includePeriodActivity: "true",
        includeZeroBalances: "false",
        currency: "MYR",
      },
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    // Validate response structure
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
    expect(data).toHaveProperty("data");
    expect(data.data).toHaveProperty("accounts");
    expect(data.data).toHaveProperty("totals");
    expect(data.data).toHaveProperty("isBalanced");
    expect(data.data).toHaveProperty("asOfDate");
    expect(data.data).toHaveProperty("generatedAt");
    expect(data.data).toHaveProperty("currency", "MYR");

    // Validate trial balance is balanced
    expect(data.data.isBalanced).toBe(true);
    expect(data.data.totals.totalDebits).toEqual(data.data.totals.totalCredits);

    // Validate accounts structure
    expect(Array.isArray(data.data.accounts)).toBe(true);
    if (data.data.accounts.length > 0) {
      const account = data.data.accounts[0];
      expect(account).toHaveProperty("accountId");
      expect(account).toHaveProperty("accountNumber");
      expect(account).toHaveProperty("accountName");
      expect(account).toHaveProperty("accountType");
      expect(account).toHaveProperty("normalBalance");
      expect(["DEBIT", "CREDIT"]).toContain(account.normalBalance);
    }

    // Test idempotency - repeat same request
    const idempotentResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
        includePeriodActivity: "true",
        includeZeroBalances: "false",
        currency: "MYR",
      },
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    expect(idempotentResponse.status()).toBe(200);
    const idempotentData = await idempotentResponse.json();
    expect(JSON.stringify(idempotentData)).toBe(JSON.stringify(data));
  });

  test("Balance Sheet Report Generation - Comparative Analysis", async ({ request }) => {
    const idempotencyKey = uuidv4();

    // Test comparative balance sheet
    const response = await request.get(`${BASE_URL}/api/reports/balance-sheet`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
        comparativePeriod: "2023-12-31T23:59:59.000Z",
        includeZeroBalances: "false",
        currency: "MYR",
        reportFormat: "COMPARATIVE",
      },
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
    expect(data.data).toHaveProperty("assets");
    expect(data.data).toHaveProperty("liabilities");
    expect(data.data).toHaveProperty("equity");
    expect(data.data).toHaveProperty("totals");
    expect(data.data).toHaveProperty("isBalanced", true);

    // Validate balance sheet equation: Assets = Liabilities + Equity
    const { totalAssets, totalLiabilities, totalEquity } = data.data.totals;
    expect(Math.abs(totalAssets - (totalLiabilities + totalEquity))).toBeLessThan(0.01);

    // Validate comparative data if present
    if (data.data.comparativeAsOfDate) {
      expect(data.data).toHaveProperty("comparativeAssets");
      expect(data.data).toHaveProperty("comparativeLiabilities");
      expect(data.data).toHaveProperty("comparativeEquity");
    }
  });

  test("Cash Flow Statement - IAS 7 Compliance", async ({ request }) => {
    const idempotencyKey = uuidv4();

    const response = await request.get(`${BASE_URL}/api/reports/cash-flow`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        startDate: "2024-01-01T00:00:00.000Z",
        endDate: "2024-12-31T23:59:59.000Z",
        currency: "MYR",
        method: "INDIRECT",
      },
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
    expect(data.data).toHaveProperty("operatingActivities");
    expect(data.data).toHaveProperty("investingActivities");
    expect(data.data).toHaveProperty("financingActivities");
    expect(data.data).toHaveProperty("reconciliation");
    expect(data.data).toHaveProperty("summary");

    // Validate IAS 7 structure
    const { operatingActivities, investingActivities, financingActivities } = data.data;

    // Operating activities should have net income and adjustments
    expect(operatingActivities).toHaveProperty("netIncome");
    expect(operatingActivities).toHaveProperty("adjustments");
    expect(operatingActivities).toHaveProperty("workingCapitalChanges");
    expect(operatingActivities).toHaveProperty("netCashFromOperating");

    // Investing activities
    expect(investingActivities).toHaveProperty("activities");
    expect(investingActivities).toHaveProperty("netCashFromInvesting");

    // Financing activities
    expect(financingActivities).toHaveProperty("activities");
    expect(financingActivities).toHaveProperty("netCashFromFinancing");

    // Cash flow reconciliation
    expect(data.data.reconciliation).toHaveProperty("beginningCash");
    expect(data.data.reconciliation).toHaveProperty("endingCash");
    expect(data.data.reconciliation).toHaveProperty("netChange");

    // Validate cash flow equation
    const netOperating = operatingActivities.netCashFromOperating;
    const netInvesting = investingActivities.netCashFromInvesting;
    const netFinancing = financingActivities.netCashFromFinancing;
    const calculatedNetChange = netOperating + netInvesting + netFinancing;

    expect(Math.abs(calculatedNetChange - data.data.reconciliation.netChange)).toBeLessThan(0.01);
  });

  test("Period Management - Fiscal Calendar Operations", async ({ request }) => {
    const idempotencyKey = uuidv4();

    // Get fiscal periods
    const periodsResponse = await request.get(`${BASE_URL}/api/periods`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
      },
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    });

    expect(periodsResponse.status()).toBe(200);

    const periodsData = await periodsResponse.json();
    expect(periodsData).toHaveProperty("success", true);
    expect(periodsData.data).toHaveProperty("periods");
    expect(periodsData.data).toHaveProperty("currentPeriod");
    expect(Array.isArray(periodsData.data.periods)).toBe(true);

    // Validate period structure
    if (periodsData.data.periods.length > 0) {
      const period = periodsData.data.periods[0];
      expect(period).toHaveProperty("id");
      expect(period).toHaveProperty("periodName");
      expect(period).toHaveProperty("startDate");
      expect(period).toHaveProperty("endDate");
      expect(period).toHaveProperty("status");
      expect(["OPEN", "CLOSED", "LOCKED"]).toContain(period.status);
    }
  });

  test("Error Handling and Validation", async ({ request }) => {
    // Test invalid tenant ID
    const invalidTenantResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: "invalid-uuid",
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
      },
    });

    expect(invalidTenantResponse.status()).toBe(400);
    const invalidTenantData = await invalidTenantResponse.json();
    expect(invalidTenantData).toHaveProperty("success", false);
    expect(invalidTenantData).toHaveProperty("code", "VALIDATION_ERROR");

    // Test missing required parameters
    const missingParamsResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        // Missing companyId and asOfDate
      },
    });

    expect(missingParamsResponse.status()).toBe(400);
    const missingParamsData = await missingParamsResponse.json();
    expect(missingParamsData).toHaveProperty("success", false);
    expect(missingParamsData).toHaveProperty("code", "VALIDATION_ERROR");

    // Test invalid date format
    const invalidDateResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "invalid-date",
      },
    });

    expect(invalidDateResponse.status()).toBe(400);
    const invalidDateData = await invalidDateResponse.json();
    expect(invalidDateData).toHaveProperty("success", false);
  });

  test("Security and Authorization", async ({ request }) => {
    // Test without authorization header
    const unauthorizedResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
      },
      headers: {}, // No authorization
    });

    expect([401, 403]).toContain(unauthorizedResponse.status());

    // Test with invalid API key
    const invalidKeyResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
      },
      headers: {
        Authorization: "Bearer invalid-key",
      },
    });

    expect([401, 403]).toContain(invalidKeyResponse.status());
  });

  test("Performance Requirements - Response Times", async ({ request }) => {
    const startTime = Date.now();

    const response = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
        includePeriodActivity: "true",
        currency: "MYR",
      },
      headers: {
        "Idempotency-Key": uuidv4(),
      },
    });

    const responseTime = Date.now() - startTime;

    expect(response.status()).toBe(200);
    expect(responseTime).toBeLessThan(2000); // V1 requirement: < 2s response time

    const data = await response.json();
    expect(data).toHaveProperty("success", true);
  });

  test("Multi-Currency Support", async ({ request }) => {
    // Test USD currency
    const usdResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
        currency: "USD",
      },
      headers: {
        "Idempotency-Key": uuidv4(),
      },
    });

    expect(usdResponse.status()).toBe(200);
    const usdData = await usdResponse.json();
    expect(usdData.data.currency).toBe("USD");

    // Test SGD currency
    const sgdResponse = await request.get(`${BASE_URL}/api/reports/trial-balance`, {
      params: {
        tenantId: testTenant,
        companyId: testCompany,
        asOfDate: "2024-12-31T23:59:59.000Z",
        currency: "SGD",
      },
      headers: {
        "Idempotency-Key": uuidv4(),
      },
    });

    expect(sgdResponse.status()).toBe(200);
    const sgdData = await sgdResponse.json();
    expect(sgdData.data.currency).toBe("SGD");
  });
});
