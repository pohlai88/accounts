// D4 Financial Reports Performance Tests - V1 Compliance
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");

// Test configuration
export const options = {
  stages: [
    { duration: "2m", target: 10 }, // Ramp up to 10 users
    { duration: "5m", target: 10 }, // Stay at 10 users
    { duration: "2m", target: 20 }, // Ramp up to 20 users
    { duration: "5m", target: 20 }, // Stay at 20 users
    { duration: "2m", target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests must complete below 2s
    http_req_failed: ["rate<0.1"], // Error rate must be below 10%
    errors: ["rate<0.1"], // Custom error rate below 10%
  },
};

// Test data
const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const API_KEY = __ENV.API_KEY || "test-api-key";

const testTenant = "550e8400-e29b-41d4-a716-446655440000";
const testCompany = "550e8400-e29b-41d4-a716-446655440001";

// Generate unique idempotency keys
function generateIdempotencyKey() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function () {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
    "Idempotency-Key": generateIdempotencyKey(),
  };

  // Test 1: Trial Balance Report Generation
  const trialBalanceParams = new URLSearchParams({
    tenantId: testTenant,
    companyId: testCompany,
    asOfDate: "2024-12-31T23:59:59.000Z",
    includePeriodActivity: "true",
    includeZeroBalances: "false",
    currency: "MYR",
  });

  const trialBalanceResponse = http.get(
    `${BASE_URL}/api/reports/trial-balance?${trialBalanceParams}`,
    { headers },
  );

  const trialBalanceSuccess = check(trialBalanceResponse, {
    "Trial Balance: status is 200": r => r.status === 200,
    "Trial Balance: response time < 2s": r => r.timings.duration < 2000,
    "Trial Balance: has success field": r => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty("success");
      } catch (e) {
        return false;
      }
    },
    "Trial Balance: is balanced": r => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.isBalanced === true;
      } catch (e) {
        return false;
      }
    },
  });

  if (!trialBalanceSuccess) {
    errorRate.add(1);
  }

  sleep(1);

  // Test 2: Balance Sheet Report Generation
  const balanceSheetParams = new URLSearchParams({
    tenantId: testTenant,
    companyId: testCompany,
    asOfDate: "2024-12-31T23:59:59.000Z",
    includeZeroBalances: "false",
    currency: "MYR",
    reportFormat: "STANDARD",
  });

  const balanceSheetResponse = http.get(
    `${BASE_URL}/api/reports/balance-sheet?${balanceSheetParams}`,
    { headers: { ...headers, "Idempotency-Key": generateIdempotencyKey() } },
  );

  const balanceSheetSuccess = check(balanceSheetResponse, {
    "Balance Sheet: status is 200": r => r.status === 200,
    "Balance Sheet: response time < 2s": r => r.timings.duration < 2000,
    "Balance Sheet: has success field": r => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty("success");
      } catch (e) {
        return false;
      }
    },
    "Balance Sheet: is balanced": r => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.data && body.data.isBalanced === true;
      } catch (e) {
        return false;
      }
    },
  });

  if (!balanceSheetSuccess) {
    errorRate.add(1);
  }

  sleep(1);

  // Test 3: Cash Flow Report Generation
  const cashFlowParams = new URLSearchParams({
    tenantId: testTenant,
    companyId: testCompany,
    startDate: "2024-01-01T00:00:00.000Z",
    endDate: "2024-12-31T23:59:59.000Z",
    currency: "MYR",
    method: "INDIRECT",
  });

  const cashFlowResponse = http.get(`${BASE_URL}/api/reports/cash-flow?${cashFlowParams}`, {
    headers: { ...headers, "Idempotency-Key": generateIdempotencyKey() },
  });

  const cashFlowSuccess = check(cashFlowResponse, {
    "Cash Flow: status is 200": r => r.status === 200,
    "Cash Flow: response time < 3s": r => r.timings.duration < 3000,
    "Cash Flow: has success field": r => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty("success");
      } catch (e) {
        return false;
      }
    },
    "Cash Flow: has activities": r => {
      try {
        const body = JSON.parse(r.body);
        return (
          body.success &&
          body.data &&
          body.data.operatingActivities &&
          body.data.investingActivities &&
          body.data.financingActivities
        );
      } catch (e) {
        return false;
      }
    },
  });

  if (!cashFlowSuccess) {
    errorRate.add(1);
  }

  sleep(1);

  // Test 4: Period Management Operations
  const periodResponse = http.get(
    `${BASE_URL}/api/periods?tenantId=${testTenant}&companyId=${testCompany}`,
    { headers: { ...headers, "Idempotency-Key": generateIdempotencyKey() } },
  );

  const periodSuccess = check(periodResponse, {
    "Periods: status is 200": r => r.status === 200,
    "Periods: response time < 1s": r => r.timings.duration < 1000,
    "Periods: has periods array": r => {
      try {
        const body = JSON.parse(r.body);
        return body.success && Array.isArray(body.data.periods);
      } catch (e) {
        return false;
      }
    },
  });

  if (!periodSuccess) {
    errorRate.add(1);
  }

  sleep(2);

  // Test 5: Idempotency Test (repeat same request)
  const idempotencyKey = generateIdempotencyKey();

  // First request
  const firstRequest = http.get(`${BASE_URL}/api/reports/trial-balance?${trialBalanceParams}`, {
    headers: { ...headers, "Idempotency-Key": idempotencyKey },
  });

  sleep(0.5);

  // Second request with same idempotency key
  const secondRequest = http.get(`${BASE_URL}/api/reports/trial-balance?${trialBalanceParams}`, {
    headers: { ...headers, "Idempotency-Key": idempotencyKey },
  });

  const idempotencySuccess = check(secondRequest, {
    "Idempotency: second request faster": r => r.timings.duration < firstRequest.timings.duration,
    "Idempotency: same response": r => {
      try {
        const first = JSON.parse(firstRequest.body);
        const second = JSON.parse(r.body);
        return JSON.stringify(first) === JSON.stringify(second);
      } catch (e) {
        return false;
      }
    },
  });

  if (!idempotencySuccess) {
    errorRate.add(1);
  }
}

// Setup function
export function setup() {
  console.log("Starting D4 Financial Reports Performance Tests");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Test Tenant: ${testTenant}`);
  console.log(`Test Company: ${testCompany}`);
}

// Teardown function
export function teardown(data) {
  console.log("D4 Performance Tests Completed");
}
