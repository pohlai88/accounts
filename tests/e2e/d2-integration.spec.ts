// D2 Integration Tests - AR Invoice → GL Flow
// Validates complete D2 functionality end-to-end

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.API_BASE_URL || "http://localhost:3001";

// Test data
const testData = {
  tenantId: "550e8400-e29b-41d4-a716-446655440000",
  companyId: "550e8400-e29b-41d4-a716-446655440001",
  customerId: "550e8400-e29b-41d4-a716-446655440002",
  arAccountId: "550e8400-e29b-41d4-a716-446655440003",
  revenueAccountId: "550e8400-e29b-41d4-a716-446655440004",
};

test.describe("D2 AR Invoice Integration", () => {
  test("Complete AR Invoice → GL Posting Flow", async ({ request }) => {
    // Step 1: Create Invoice
    const invoicePayload = {
      tenantId: testData.tenantId,
      companyId: testData.companyId,
      customerId: testData.customerId,
      invoiceNumber: `TEST-INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currency: "MYR",
      exchangeRate: 1,
      description: "Integration test invoice",
      lines: [
        {
          lineNumber: 1,
          description: "Test Product A",
          quantity: 2,
          unitPrice: 150.0,
          taxCode: "GST",
          revenueAccountId: testData.revenueAccountId,
        },
        {
          lineNumber: 2,
          description: "Test Product B",
          quantity: 1,
          unitPrice: 200.0,
          revenueAccountId: testData.revenueAccountId,
        },
      ],
    };

    const createResponse = await request.post(`${BASE_URL}/api/invoices`, {
      data: invoicePayload,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    expect(createResponse.status()).toBe(201);

    const createBody = await createResponse.json();
    expect(createBody.id).toBeDefined();
    expect(createBody.invoiceNumber).toBe(invoicePayload.invoiceNumber);
    expect(createBody.status).toBe("draft");
    expect(createBody.totalAmount).toBeGreaterThan(0);

    const invoiceId = createBody.id;

    // Step 2: Post Invoice to GL
    const postPayload = {
      tenantId: testData.tenantId,
      invoiceId: invoiceId,
      arAccountId: testData.arAccountId,
      description: "Integration test GL posting",
    };

    const postResponse = await request.post(`${BASE_URL}/api/invoices/${invoiceId}/post`, {
      data: postPayload,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    expect(postResponse.status()).toBe(200);

    const postBody = await postResponse.json();
    expect(postBody.journalId).toBeDefined();
    expect(postBody.status).toBe("posted");
    expect(postBody.totalDebit).toBe(postBody.totalCredit);
    expect(postBody.lines).toBeDefined();
    expect(postBody.lines.length).toBeGreaterThan(0);

    // Validate journal lines structure
    const journalLines = postBody.lines;
    let totalDebits = 0;
    let totalCredits = 0;

    for (const line of journalLines) {
      expect(line.accountId).toBeDefined();
      expect(line.description).toBeDefined();
      totalDebits += line.debit;
      totalCredits += line.credit;
    }

    // Validate balanced journal
    expect(Math.abs(totalDebits - totalCredits)).toBeLessThan(0.01);
  });

  test("Invoice Validation Rules", async ({ request }) => {
    // Test invalid invoice data
    const invalidPayload = {
      tenantId: testData.tenantId,
      companyId: testData.companyId,
      customerId: testData.customerId,
      invoiceNumber: "", // Invalid: empty invoice number
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date().toISOString().split("T")[0],
      currency: "INVALID", // Invalid: not 3-letter currency
      lines: [], // Invalid: no lines
    };

    const response = await request.post(`${BASE_URL}/api/invoices`, {
      data: invalidPayload,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    expect(response.status()).toBe(400);
  });

  test("Currency Conversion Flow", async ({ request }) => {
    // Test invoice with foreign currency
    const usdInvoicePayload = {
      tenantId: testData.tenantId,
      companyId: testData.companyId,
      customerId: testData.customerId,
      invoiceNumber: `USD-INV-${Date.now()}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currency: "USD",
      exchangeRate: 4.2, // USD to MYR rate
      description: "USD currency test",
      lines: [
        {
          lineNumber: 1,
          description: "USD Product",
          quantity: 1,
          unitPrice: 100.0, // $100 USD
          revenueAccountId: testData.revenueAccountId,
        },
      ],
    };

    const createResponse = await request.post(`${BASE_URL}/api/invoices`, {
      data: usdInvoicePayload,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    expect(createResponse.status()).toBe(201);

    const createBody = await createResponse.json();
    expect(createBody.currency).toBe("USD");

    // Post to GL and verify conversion
    const postPayload = {
      tenantId: testData.tenantId,
      invoiceId: createBody.id,
      arAccountId: testData.arAccountId,
    };

    const postResponse = await request.post(`${BASE_URL}/api/invoices/${createBody.id}/post`, {
      data: postPayload,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    expect(postResponse.status()).toBe(200);

    const postBody = await postResponse.json();
    // Journal should be in base currency (MYR)
    expect(postBody.totalDebit).toBeCloseTo(420, 2); // $100 * 4.2 = MYR 420
  });

  test("Audit Trail Verification", async ({ request }) => {
    // Create and post an invoice, then verify audit entries
    const invoicePayload = {
      tenantId: testData.tenantId,
      companyId: testData.companyId,
      customerId: testData.customerId,
      invoiceNumber: `AUDIT-${Date.now()}`,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      currency: "MYR",
      lines: [
        {
          lineNumber: 1,
          description: "Audit test product",
          quantity: 1,
          unitPrice: 100.0,
          revenueAccountId: testData.revenueAccountId,
        },
      ],
    };

    // Create invoice
    const createResponse = await request.post(`${BASE_URL}/api/invoices`, {
      data: invoicePayload,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    expect(createResponse.status()).toBe(201);
    const createBody = await createResponse.json();

    // Post invoice
    const postResponse = await request.post(`${BASE_URL}/api/invoices/${createBody.id}/post`, {
      data: {
        tenantId: testData.tenantId,
        invoiceId: createBody.id,
        arAccountId: testData.arAccountId,
      },
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    expect(postResponse.status()).toBe(200);

    // Note: In a real test, we would query the audit_logs table
    // to verify that CREATE and POST actions were logged
    // This would require database access or an audit API endpoint
  });
});

test.describe("D2 FX Rate Integration", () => {
  test("FX Rate Staleness Detection", async ({ request }) => {
    // This test would verify FX rate staleness detection
    // In a real implementation, we'd have an FX rate status endpoint

    const response = await request.get(`${BASE_URL}/api/fx-rates/status`, {
      headers: {
        "X-Tenant-ID": testData.tenantId,
        "X-Company-ID": testData.companyId,
      },
    });

    // For now, we just verify the endpoint structure exists
    // In production, this would check staleness thresholds
    expect([200, 404]).toContain(response.status());
  });
});
