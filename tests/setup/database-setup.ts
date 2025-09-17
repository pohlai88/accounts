/**
 * Database Testing Setup
 *
 * Configures test database connections and utilities
 * for integration testing with Supabase and PostgreSQL.
 */

import { beforeAll, afterAll, beforeEach } from "vitest";
import { createClient } from "@supabase/supabase-js";

// Test database configuration
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL || "postgresql://test:test@localhost:5432/test";
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || "http://localhost:54321";
const TEST_SUPABASE_KEY = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || "test-service-key";

// Create test Supabase client
export const testSupabase = createClient(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);

// Test database utilities
export const dbTestUtils = {
  // Clean test data
  async cleanTestData() {
    try {
      // Clean up test data in reverse dependency order
      await testSupabase.from("journal_entries").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await testSupabase.from("invoices").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await testSupabase.from("bills").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await testSupabase.from("payments").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await testSupabase.from("accounts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await testSupabase.from("companies").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      await testSupabase.from("tenants").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    } catch (error) {
      console.warn("Failed to clean test data:", error);
    }
  },

  // Create test tenant
  async createTestTenant(overrides = {}) {
    const tenant = {
      id: "test-tenant-id",
      name: "Test Tenant",
      slug: "test-tenant",
      featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: true,
        je: true,
        regulated_mode: false,
      },
      ...overrides,
    };

    const { data, error } = await testSupabase
      .from("tenants")
      .insert(tenant)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create test company
  async createTestCompany(tenantId: string, overrides = {}) {
    const company = {
      id: "test-company-id",
      tenantId,
      name: "Test Company",
      code: "TEST",
      baseCurrency: "MYR",
      fiscalYearEnd: "12-31",
      policySettings: {
        approval_threshold_rm: 50000,
        export_requires_reason: false,
        mfa_required_for_admin: true,
        session_timeout_minutes: 480,
      },
      ...overrides,
    };

    const { data, error } = await testSupabase
      .from("companies")
      .insert(company)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create test account
  async createTestAccount(companyId: string, overrides = {}) {
    const account = {
      id: "test-account-id",
      companyId,
      code: "1000",
      name: "Test Cash Account",
      accountType: "ASSET",
      currency: "MYR",
      isActive: true,
      level: 1,
      ...overrides,
    };

    const { data, error } = await testSupabase
      .from("accounts")
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Create test invoice
  async createTestInvoice(companyId: string, overrides = {}) {
    const invoice = {
      id: "test-invoice-id",
      companyId,
      number: "INV-001",
      customerId: "test-customer-id",
      amount: 1000.00,
      currency: "MYR",
      status: "draft",
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    };

    const { data, error } = await testSupabase
      .from("invoices")
      .insert(invoice)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Setup and teardown hooks
beforeAll(async () => {
  console.log("🗄️ Setting up test database");
  await dbTestUtils.cleanTestData();
});

afterAll(async () => {
  console.log("🧹 Cleaning up test database");
  await dbTestUtils.cleanTestData();
});

beforeEach(async () => {
  // Clean test data before each test
  await dbTestUtils.cleanTestData();
});
