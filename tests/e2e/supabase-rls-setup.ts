// V1 E2E Supabase RLS Setup - Live Database Testing with Row Level Security
import { createClient } from "@supabase/supabase-js";
import { chromium, FullConfig } from "@playwright/test";

// Live Supabase configuration for E2E testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface TestUser {
  id: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "accountant" | "clerk" | "viewer";
  name: string;
}

interface TestContext {
  tenantId: string;
  companyId: string;
  users: TestUser[];
  accounts: Array<{ id: string; code: string; name: string; accountType: string }>;
}

/**
 * Enhanced E2E setup with live Supabase and RLS verification
 */
async function supabaseRLSSetup(config: FullConfig): Promise<TestContext> {
  console.log("🚀 Starting Supabase RLS E2E Setup...");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase credentials not configured for E2E testing");
  }

  // Create service client (bypasses RLS)
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Create anon client (enforces RLS)
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  try {
    // 1. Clean up any existing E2E test data
    await cleanupTestData(serviceClient);

    // 2. Create test tenant and company
    const { tenantId, companyId } = await createTestTenantAndCompany(serviceClient);

    // 3. Create test users with Supabase Auth
    const users = await createTestUsersWithAuth(serviceClient);

    // 4. Setup chart of accounts
    const accounts = await setupChartOfAccounts(serviceClient, tenantId, companyId);

    // 5. Verify RLS policies are working
    await verifyRLSPolicies(serviceClient, anonClient, tenantId, companyId, users);

    // 6. Create test data for E2E scenarios
    await createTestJournalData(serviceClient, tenantId, companyId, users[0].id, accounts);

    // 7. Setup authentication sessions for each user
    await setupAuthenticationSessions(users);

    console.log("✅ Supabase RLS E2E Setup completed successfully");

    return {
      tenantId,
      companyId,
      users,
      accounts,
    };
  } catch (error) {
    console.error("❌ Supabase RLS E2E Setup failed:", error);
    throw error;
  }
}

async function cleanupTestData(serviceClient: any) {
  console.log("🧹 Cleaning up existing E2E test data...");

  // Delete in correct order due to foreign key constraints
  const tables = [
    "gl_journal_lines",
    "gl_journal",
    "audit_logs",
    "idempotency_keys",
    "memberships",
    "chart_of_accounts",
    "companies",
    "tenants",
  ];

  for (const table of tables) {
    const { error } = await serviceClient.from(table).delete().like("tenant_id", "e2e-test-%");

    if (error && error.code !== "PGRST116") {
      // Ignore "no rows found" error
      console.warn(`Warning cleaning ${table}:`, error.message);
    }
  }

  // Also clean up auth users (E2E test users)
  const { data: authUsers } = await serviceClient.auth.admin.listUsers();
  const e2eUsers =
    authUsers?.users?.filter(user => user.email?.includes("@e2etest.aibos.com")) || [];

  for (const user of e2eUsers) {
    await serviceClient.auth.admin.deleteUser(user.id);
  }
}

async function createTestTenantAndCompany(serviceClient: any) {
  console.log("🏢 Creating test tenant and company with RLS...");

  const tenantId = `e2e-test-tenant-${Date.now()}`;
  const companyId = `e2e-test-company-${Date.now()}`;

  // Create tenant
  const { data: tenant, error: tenantError } = await serviceClient
    .from("tenants")
    .insert({
      id: tenantId,
      name: "E2E Test Tenant",
      settings: {
        timezone: "Asia/Kuala_Lumpur",
        currency: "MYR",
        fiscalYearEnd: "12-31",
      },
    })
    .select()
    .single();

  if (tenantError) {
    throw new Error(`Failed to create tenant: ${tenantError.message}`);
  }

  // Create company
  const { data: company, error: companyError } = await serviceClient
    .from("companies")
    .insert({
      id: companyId,
      tenantId,
      name: "E2E Test Company Sdn Bhd",
      code: "E2E-TEST",
      baseCurrency: "MYR",
      fiscalYearEnd: "12-31",
    })
    .select()
    .single();

  if (companyError) {
    throw new Error(`Failed to create company: ${companyError.message}`);
  }

  console.log(`✅ Created tenant: ${tenantId}, company: ${companyId}`);
  return { tenantId, companyId };
}

async function createTestUsersWithAuth(serviceClient: any): Promise<TestUser[]> {
  console.log("👥 Creating test users with Supabase Auth...");

  const testUsers: Omit<TestUser, "id">[] = [
    {
      email: "admin@e2etest.aibos.com",
      password: "E2ETest123!",
      role: "admin",
      name: "E2E Test Admin",
    },
    {
      email: "manager@e2etest.aibos.com",
      password: "E2ETest123!",
      role: "manager",
      name: "E2E Test Manager",
    },
    {
      email: "accountant@e2etest.aibos.com",
      password: "E2ETest123!",
      role: "accountant",
      name: "E2E Test Accountant",
    },
    {
      email: "clerk@e2etest.aibos.com",
      password: "E2ETest123!",
      role: "clerk",
      name: "E2E Test Clerk",
    },
    {
      email: "viewer@e2etest.aibos.com",
      password: "E2ETest123!",
      role: "viewer",
      name: "E2E Test Viewer",
    },
  ];

  const createdUsers: TestUser[] = [];

  for (const userData of testUsers) {
    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await serviceClient.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        name: userData.name,
        role: userData.role,
      },
    });

    if (authError) {
      throw new Error(`Failed to create auth user ${userData.email}: ${authError.message}`);
    }

    // Create user profile
    const { error: profileError } = await serviceClient.from("users").insert({
      id: authUser.user.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
    });

    if (profileError) {
      throw new Error(`Failed to create user profile ${userData.email}: ${profileError.message}`);
    }

    createdUsers.push({
      id: authUser.user.id,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      name: userData.name,
    });
  }

  console.log(`✅ Created ${createdUsers.length} test users with auth`);
  return createdUsers;
}

async function setupChartOfAccounts(serviceClient: any, tenantId: string, companyId: string) {
  console.log("📋 Setting up chart of accounts...");

  const accounts = [
    // Control Accounts (Level 0 - cannot post directly)
    { code: "1000", name: "Assets", accountType: "ASSET", level: 0, parentId: null },
    { code: "2000", name: "Liabilities", accountType: "LIABILITY", level: 0, parentId: null },
    { code: "3000", name: "Equity", accountType: "EQUITY", level: 0, parentId: null },
    { code: "4000", name: "Revenue", accountType: "REVENUE", level: 0, parentId: null },
    { code: "5000", name: "Expenses", accountType: "EXPENSE", level: 0, parentId: null },

    // Posting Accounts (Level 1 - can post directly)
    { code: "1001", name: "Cash at Bank", accountType: "ASSET", level: 1, parentId: "1000" },
    { code: "1002", name: "Accounts Receivable", accountType: "ASSET", level: 1, parentId: "1000" },
    { code: "1003", name: "Inventory", accountType: "ASSET", level: 1, parentId: "1000" },

    {
      code: "2001",
      name: "Accounts Payable",
      accountType: "LIABILITY",
      level: 1,
      parentId: "2000",
    },
    {
      code: "2002",
      name: "Accrued Expenses",
      accountType: "LIABILITY",
      level: 1,
      parentId: "2000",
    },

    { code: "3001", name: "Share Capital", accountType: "EQUITY", level: 1, parentId: "3000" },
    { code: "3002", name: "Retained Earnings", accountType: "EQUITY", level: 1, parentId: "3000" },

    { code: "4001", name: "Sales Revenue", accountType: "REVENUE", level: 1, parentId: "4000" },
    { code: "4002", name: "Service Revenue", accountType: "REVENUE", level: 1, parentId: "4000" },

    { code: "5001", name: "Cost of Sales", accountType: "EXPENSE", level: 1, parentId: "5000" },
    {
      code: "5002",
      name: "Operating Expenses",
      accountType: "EXPENSE",
      level: 1,
      parentId: "5000",
    },
  ];

  const createdAccounts = [];

  for (const account of accounts) {
    const accountId = `e2e-account-${account.code}`;

    const { data, error } = await serviceClient
      .from("chart_of_accounts")
      .insert({
        id: accountId,
        tenantId,
        companyId,
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        level: account.level,
        parentId: account.parentId ? `e2e-account-${account.parentId}` : null,
        isActive: true,
        currency: "MYR",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create account ${account.code}: ${error.message}`);
    }

    createdAccounts.push({
      id: accountId,
      code: account.code,
      name: account.name,
      accountType: account.accountType,
    });
  }

  console.log(`✅ Created ${createdAccounts.length} chart of accounts`);
  return createdAccounts;
}

async function verifyRLSPolicies(
  serviceClient: any,
  anonClient: any,
  tenantId: string,
  companyId: string,
  users: TestUser[],
) {
  console.log("🔒 Verifying RLS policies...");

  // Test 1: Anonymous user should not be able to access any data
  const { data: anonData, error: anonError } = await anonClient.from("tenants").select("*");

  if (anonData && anonData.length > 0) {
    throw new Error("RLS VIOLATION: Anonymous user can access tenant data");
  }

  // Test 2: Authenticated user should only see their tenant's data
  for (const user of users.slice(0, 2)) {
    // Test first 2 users
    // Sign in as the user
    const { data: authData, error: signInError } = await anonClient.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });

    if (signInError) {
      throw new Error(`Failed to sign in user ${user.email}: ${signInError.message}`);
    }

    // Create a client with the user's session
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: {
          Authorization: `Bearer ${authData.session.access_token}`,
        },
      },
    });

    // Test tenant access - should only see their tenant
    const { data: tenantData, error: tenantError } = await userClient.from("tenants").select("*");

    if (tenantError) {
      throw new Error(`RLS Error for user ${user.email}: ${tenantError.message}`);
    }

    if (!tenantData || tenantData.length === 0) {
      throw new Error(`RLS VIOLATION: User ${user.email} cannot access their tenant`);
    }

    if (tenantData.some(t => t.id !== tenantId)) {
      throw new Error(`RLS VIOLATION: User ${user.email} can access other tenants`);
    }

    // Test company access
    const { data: companyData, error: companyError } = await userClient
      .from("companies")
      .select("*");

    if (companyError) {
      throw new Error(`RLS Error for company access ${user.email}: ${companyError.message}`);
    }

    if (companyData && companyData.some(c => c.tenantId !== tenantId)) {
      throw new Error(`RLS VIOLATION: User ${user.email} can access other tenant's companies`);
    }

    // Sign out
    await userClient.auth.signOut();
  }

  console.log("✅ RLS policies verified successfully");
}

async function createTestJournalData(
  serviceClient: any,
  tenantId: string,
  companyId: string,
  userId: string,
  accounts: Array<{ id: string; code: string; name: string; accountType: string }>,
) {
  console.log("📝 Creating test journal data...");

  const cashAccount = accounts.find(a => a.code === "1001");
  const revenueAccount = accounts.find(a => a.code === "4001");

  if (!cashAccount || !revenueAccount) {
    throw new Error("Required accounts not found for test data");
  }

  // Create a sample journal for testing
  const journalId = `e2e-journal-${Date.now()}`;

  const { data: journal, error: journalError } = await serviceClient
    .from("gl_journal")
    .insert({
      id: journalId,
      tenantId,
      companyId,
      journalNumber: `JE-E2E-${Date.now()}`,
      description: "E2E Test Journal Entry",
      journalDate: new Date().toISOString().split("T")[0],
      currency: "MYR",
      status: "draft",
    })
    .select()
    .single();

  if (journalError) {
    throw new Error(`Failed to create test journal: ${journalError.message}`);
  }

  // Create journal lines
  const { error: linesError } = await serviceClient.from("gl_journal_lines").insert([
    {
      journalId: journal.id,
      accountId: cashAccount.id,
      description: "E2E Test - Cash Receipt",
      debit: 1000.0,
      credit: 0.0,
    },
    {
      journalId: journal.id,
      accountId: revenueAccount.id,
      description: "E2E Test - Sales Revenue",
      debit: 0.0,
      credit: 1000.0,
    },
  ]);

  if (linesError) {
    throw new Error(`Failed to create test journal lines: ${linesError.message}`);
  }

  console.log(`✅ Created test journal: ${journalId}`);
}

async function setupAuthenticationSessions(users: TestUser[]) {
  console.log("🔐 Setting up authentication sessions...");

  const browser = await chromium.launch();

  for (const user of users) {
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Navigate to login page
      await page.goto(`${process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"}/login`);

      // Login as the user
      await page.fill('[data-testid="email"]', user.email);
      await page.fill('[data-testid="password"]', user.password);
      await page.click('[data-testid="login-button"]');

      // Wait for successful login
      await page.waitForURL("/dashboard", { timeout: 10000 });

      // Store authentication state
      await context.storageState({
        path: `./tests/e2e/auth-state-${user.role}.json`,
      });

      console.log(`✅ Created auth session for ${user.role}`);
    } catch (error) {
      console.warn(`⚠️ Failed to create auth session for ${user.role}:`, error);
    } finally {
      await context.close();
    }
  }

  await browser.close();
}

export default supabaseRLSSetup;
export type { TestContext, TestUser };
