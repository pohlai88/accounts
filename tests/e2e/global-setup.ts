// V1 E2E Global Setup - Database seeding and authentication
import { chromium, FullConfig } from "@playwright/test";
import { createServiceClient } from "../../packages/utils/src/supabase/server";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting V1 E2E Global Setup...");

  // Create a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // 1. Setup test database with clean state
    await setupTestDatabase();

    // 2. Create test tenant and company
    const { tenantId, companyId } = await createTestTenant();

    // 3. Create test users with different roles
    await createTestUsers(tenantId, companyId);

    // 4. Setup chart of accounts
    await setupChartOfAccounts(tenantId, companyId);

    // 5. Create test data for E2E scenarios
    await createTestData(tenantId, companyId);

    // 6. Authenticate and store session
    await authenticateTestUser(page);

    console.log("✅ V1 E2E Global Setup completed successfully");

    // Store test context for tests
    process.env.TEST_TENANT_ID = tenantId;
    process.env.TEST_COMPANY_ID = companyId;
  } catch (error) {
    console.error("❌ V1 E2E Global Setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function setupTestDatabase() {
  console.log("📊 Setting up test database...");

  const supabase = createServiceClient();

  // Clean up any existing test data
  await supabase.from("journal_lines").delete().like("journal_id", "test-%");
  await supabase.from("journals").delete().like("id", "test-%");
  await supabase.from("chart_of_accounts").delete().like("tenant_id", "test-%");
  await supabase.from("memberships").delete().like("tenant_id", "test-%");
  await supabase.from("users").delete().like("id", "test-%");
  await supabase.from("companies").delete().like("tenant_id", "test-%");
  await supabase.from("tenants").delete().like("id", "test-%");
}

async function createTestTenant() {
  console.log("🏢 Creating test tenant and company...");

  const supabase = createServiceClient();

  // Create test tenant
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      id: "test-tenant-e2e",
      name: "E2E Test Tenant",
      settings: { timezone: "Asia/Kuala_Lumpur" },
    })
    .select()
    .single();

  if (tenantError) throw tenantError;

  // Create test company
  const { data: company, error: companyError } = await supabase
    .from("companies")
    .insert({
      id: "test-company-e2e",
      tenant_id: tenant.id,
      name: "E2E Test Company",
      currency: "MYR",
      settings: {
        fiscal_year_end: "12-31",
        accounting_method: "accrual",
      },
    })
    .select()
    .single();

  if (companyError) throw companyError;

  return { tenantId: tenant.id, companyId: company.id };
}

async function createTestUsers(tenantId: string, companyId: string) {
  console.log("👥 Creating test users...");

  const supabase = createServiceClient();

  const testUsers = [
    {
      id: "test-admin-e2e",
      email: "admin@e2etest.com",
      role: "admin",
      name: "Test Admin",
    },
    {
      id: "test-accountant-e2e",
      email: "accountant@e2etest.com",
      role: "accountant",
      name: "Test Accountant",
    },
    {
      id: "test-viewer-e2e",
      email: "viewer@e2etest.com",
      role: "viewer",
      name: "Test Viewer",
    },
  ];

  for (const user of testUsers) {
    // Create user
    await supabase.from("users").insert(user);

    // Create membership
    await supabase.from("memberships").insert({
      tenant_id: tenantId,
      company_id: companyId,
      user_id: user.id,
      role: user.role,
      status: "active",
    });
  }
}

async function setupChartOfAccounts(tenantId: string, companyId: string) {
  console.log("📋 Setting up chart of accounts...");

  const supabase = createServiceClient();

  const accounts = [
    // Assets
    { code: "1000", name: "Cash", type: "asset", parent_id: null },
    { code: "1100", name: "Accounts Receivable", type: "asset", parent_id: null },
    { code: "1200", name: "Inventory", type: "asset", parent_id: null },

    // Liabilities
    { code: "2000", name: "Accounts Payable", type: "liability", parent_id: null },
    { code: "2100", name: "Accrued Expenses", type: "liability", parent_id: null },

    // Equity
    { code: "3000", name: "Owner Equity", type: "equity", parent_id: null },
    { code: "3100", name: "Retained Earnings", type: "equity", parent_id: null },

    // Revenue
    { code: "4000", name: "Sales Revenue", type: "revenue", parent_id: null },
    { code: "4100", name: "Service Revenue", type: "revenue", parent_id: null },

    // Expenses
    { code: "5000", name: "Cost of Goods Sold", type: "expense", parent_id: null },
    { code: "5100", name: "Operating Expenses", type: "expense", parent_id: null },
  ];

  for (const account of accounts) {
    await supabase.from("chart_of_accounts").insert({
      id: `test-account-${account.code}`,
      tenant_id: tenantId,
      company_id: companyId,
      ...account,
      is_active: true,
      created_by: "test-admin-e2e",
    });
  }
}

async function createTestData(tenantId: string, companyId: string) {
  console.log("📝 Creating test data...");

  const supabase = createServiceClient();

  // Create a sample journal entry for testing
  const { data: journal } = await supabase
    .from("journals")
    .insert({
      id: "test-journal-e2e-001",
      tenant_id: tenantId,
      company_id: companyId,
      journal_number: "JE-E2E-001",
      description: "E2E Test Journal Entry",
      reference: "E2E-TEST",
      journal_date: new Date().toISOString().split("T")[0],
      currency: "MYR",
      status: "draft",
      created_by: "test-accountant-e2e",
    })
    .select()
    .single();

  if (journal) {
    // Create journal lines
    await supabase.from("journal_lines").insert([
      {
        id: "test-line-e2e-001",
        journal_id: journal.id,
        account_id: "test-account-1000",
        description: "Debit Cash",
        debit: "1000.00",
        credit: "0.00",
        line_order: 1,
      },
      {
        id: "test-line-e2e-002",
        journal_id: journal.id,
        account_id: "test-account-4000",
        description: "Credit Sales",
        debit: "0.00",
        credit: "1000.00",
        line_order: 2,
      },
    ]);
  }
}

async function authenticateTestUser(page: any) {
  console.log("🔐 Authenticating test user...");

  // Navigate to login page and authenticate
  await page.goto("/login");

  // Fill in test credentials
  await page.fill('[data-testid="email"]', "accountant@e2etest.com");
  await page.fill('[data-testid="password"]', "test-password");
  await page.click('[data-testid="login-button"]');

  // Wait for successful login
  await page.waitForURL("/dashboard");

  // Store authentication state
  await page.context().storageState({ path: "./tests/e2e/auth-state.json" });
}

export default globalSetup;
