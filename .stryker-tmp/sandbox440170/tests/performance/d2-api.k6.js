// @ts-nocheck
// D2 Performance Tests - AR Invoice & FX APIs
// Validates V1 requirement: API P95 ≤ 500ms, Error rate ≤ 1%

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
export const errorRate = new Rate("errors");
export const invoiceCreateTrend = new Trend("invoice_create_duration");
export const invoicePostTrend = new Trend("invoice_post_duration");

// Test configuration
export const options = {
  stages: [
    { duration: "30s", target: 5 }, // Ramp up
    { duration: "1m", target: 10 }, // Stay at 10 users
    { duration: "30s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"], // V1 requirement: P95 ≤ 500ms
    errors: ["rate<0.01"], // V1 requirement: Error rate ≤ 1%
    invoice_create_duration: ["p(95)<500"],
    invoice_post_duration: ["p(95)<500"],
  },
};

// Test data
const BASE_URL = __ENV.API_BASE_URL || "http://localhost:3001";
const API_KEY = __ENV.API_KEY || "test-key";

// Mock tenant/company context
const testContext = {
  tenantId: "550e8400-e29b-41d4-a716-446655440000",
  companyId: "550e8400-e29b-41d4-a716-446655440001",
  customerId: "550e8400-e29b-41d4-a716-446655440002",
  arAccountId: "550e8400-e29b-41d4-a716-446655440003",
  revenueAccountId: "550e8400-e29b-41d4-a716-446655440004",
};

// Request headers
const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${API_KEY}`,
  "X-Tenant-ID": testContext.tenantId,
  "X-Company-ID": testContext.companyId,
};

export default function () {
  // Test 1: Create Invoice (D2 Core Feature)
  const invoicePayload = {
    tenantId: testContext.tenantId,
    companyId: testContext.companyId,
    customerId: testContext.customerId,
    invoiceNumber: `INV-${Date.now()}-${__VU}`,
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    currency: "MYR",
    exchangeRate: 1,
    description: "Performance test invoice",
    lines: [
      {
        lineNumber: 1,
        description: "Test product",
        quantity: 2,
        unitPrice: 100.0,
        taxCode: "GST",
        revenueAccountId: testContext.revenueAccountId,
      },
    ],
  };

  // Create invoice
  const createStart = Date.now();
  const createResponse = http.post(`${BASE_URL}/api/invoices`, JSON.stringify(invoicePayload), {
    headers,
  });

  const createDuration = Date.now() - createStart;
  invoiceCreateTrend.add(createDuration);

  const createSuccess = check(createResponse, {
    "invoice create status is 201": r => r.status === 201,
    "invoice create response time < 500ms": r => r.timings.duration < 500,
    "invoice create has id": r => {
      try {
        const body = JSON.parse(r.body);
        return body.id !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!createSuccess) {
    errorRate.add(1);
    console.error(`Invoice create failed: ${createResponse.status} - ${createResponse.body}`);
    return;
  }

  // Extract invoice ID for posting
  let invoiceId;
  try {
    const createBody = JSON.parse(createResponse.body);
    invoiceId = createBody.id;
  } catch (e) {
    errorRate.add(1);
    console.error("Failed to parse create response:", e);
    return;
  }

  sleep(0.1); // Brief pause between operations

  // Test 2: Post Invoice to GL (D2 Core Feature)
  const postPayload = {
    tenantId: testContext.tenantId,
    invoiceId: invoiceId,
    arAccountId: testContext.arAccountId,
    description: "Performance test posting",
  };

  const postStart = Date.now();
  const postResponse = http.post(
    `${BASE_URL}/api/invoices/${invoiceId}/post`,
    JSON.stringify(postPayload),
    { headers },
  );

  const postDuration = Date.now() - postStart;
  invoicePostTrend.add(postDuration);

  const postSuccess = check(postResponse, {
    "invoice post status is 200": r => r.status === 200,
    "invoice post response time < 500ms": r => r.timings.duration < 500,
    "invoice post has journal id": r => {
      try {
        const body = JSON.parse(r.body);
        return body.journalId !== undefined;
      } catch {
        return false;
      }
    },
  });

  if (!postSuccess) {
    errorRate.add(1);
    console.error(`Invoice post failed: ${postResponse.status} - ${postResponse.body}`);
  }

  sleep(0.2); // Brief pause between iterations
}

// Setup function (runs once per VU)
export function setup() {
  console.log("Starting D2 Performance Tests...");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Target: P95 < 500ms, Error rate < 1%`);

  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/health`, { headers });
  if (healthCheck.status !== 200) {
    console.warn(`API health check failed: ${healthCheck.status}`);
  }

  return { baseUrl: BASE_URL };
}

// Teardown function (runs once after all VUs finish)
export function teardown(data) {
  console.log("D2 Performance Tests completed");
  console.log(`Base URL tested: ${data.baseUrl}`);
}
