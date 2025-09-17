// @ts-nocheck
// V1 E2E Global Teardown - Clean up Supabase test data
import { createClient } from "@supabase/supabase-js";

async function globalTeardown() {
  console.log("🧹 Starting V1 E2E Global Teardown...");

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.log("⚠️ Supabase credentials not configured, skipping teardown");
    return;
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Clean up E2E test data in correct order (foreign key constraints)
    console.log("🗑️ Cleaning up E2E test data...");

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
      } else {
        console.log(`✅ Cleaned ${table}`);
      }
    }

    // Clean up auth users
    console.log("👥 Cleaning up E2E test users...");
    const { data: authUsers } = await serviceClient.auth.admin.listUsers();
    const e2eUsers =
      authUsers?.users?.filter(user => user.email?.includes("@e2etest.aibos.com")) || [];

    for (const user of e2eUsers) {
      const { error } = await serviceClient.auth.admin.deleteUser(user.id);
      if (error) {
        console.warn(`Warning deleting user ${user.email}:`, error.message);
      } else {
        console.log(`✅ Deleted user ${user.email}`);
      }
    }

    // Clean up auth state files
    console.log("🔐 Cleaning up auth state files...");
    const fs = require("fs");
    const path = require("path");

    const authFiles = [
      "./tests/e2e/auth-state.json",
      "./tests/e2e/auth-state-admin.json",
      "./tests/e2e/auth-state-manager.json",
      "./tests/e2e/auth-state-accountant.json",
      "./tests/e2e/auth-state-clerk.json",
      "./tests/e2e/auth-state-viewer.json",
    ];

    for (const file of authFiles) {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`✅ Deleted ${file}`);
        }
      } catch (error) {
        console.warn(`Warning deleting ${file}:`, error);
      }
    }

    console.log("✅ V1 E2E Global Teardown completed successfully");
  } catch (error) {
    console.error("❌ V1 E2E Global Teardown failed:", error);
    // Don't throw error to avoid failing the test run
  }
}

export default globalTeardown;
