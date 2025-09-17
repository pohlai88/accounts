/**
 * Integration Test Setup
 *
 * Environment loading and Supabase test schema strategy for integration tests.
 * This setup ensures reliable environment variable loading and database isolation.
 */

// Import deterministic environment setup
import "../setup/env";

import { createClient } from "@supabase/supabase-js";

// Hard safety checks for required environment variables
const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
  "DATABASE_URL",
  "SUPABASE_DB_URL"
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.warn(`[integration] Missing environment variables: ${missingVars.join(", ")}`);
  console.warn(`[integration] Integration tests may be skipped or fail gracefully`);
}

// Supabase client for integration tests
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
);

/**
 * Create a temporary test schema for isolated database testing
 * This ensures tests don't interfere with each other or production data
 */
export async function withTestSchema<T>(
  fn: (schema: string, supa: typeof supabase) => Promise<T>
): Promise<T> {
  const suffix = Math.random().toString(36).slice(2, 8);
  const schema = `test_${suffix}`;

  try {
    // Create test schema
    await supabase.rpc("exec_sql", {
      sql: `CREATE SCHEMA IF NOT EXISTS ${schema}; SET search_path TO ${schema}, public;`
    });

    // Run test function with isolated schema
    return await fn(schema, supabase);
  } finally {
    // Clean up test schema
    try {
      await supabase.rpc("exec_sql", {
        sql: `DROP SCHEMA IF EXISTS ${schema} CASCADE;`
      });
    } catch (error) {
      console.warn(`[integration] Failed to clean up schema ${schema}:`, error);
    }
  }
}

/**
 * Setup test data in the isolated schema
 */
export async function setupTestData(schema: string, supa: typeof supabase) {
  // Set search path to test schema
  await supa.rpc("exec_sql", {
    sql: `SET search_path TO ${schema}, public;`
  });

  // Create test tables and data
  await supa.rpc("exec_sql", {
    sql: `
      -- Create test companies
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MYR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create test customers
      CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id),
        name TEXT NOT NULL,
        email TEXT,
        currency TEXT NOT NULL DEFAULT 'MYR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create test accounts
      CREATE TABLE IF NOT EXISTS accounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID REFERENCES companies(id),
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        account_type TEXT NOT NULL,
        currency TEXT NOT NULL DEFAULT 'MYR',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Insert test data
      INSERT INTO companies (id, name, currency) VALUES
        ('00000000-0000-0000-0000-000000000001', 'Test Company', 'MYR');

      INSERT INTO customers (id, company_id, name, email, currency) VALUES
        ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Test Customer', 'test@example.com', 'MYR');

      INSERT INTO accounts (id, company_id, code, name, account_type, currency) VALUES
        ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '1100', 'Accounts Receivable', 'ASSET', 'MYR'),
        ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '4000', 'Sales Revenue', 'REVENUE', 'MYR'),
        ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '1000', 'Cash', 'ASSET', 'MYR');
    `
  });
}

/**
 * Clean up test data from the isolated schema
 */
export async function cleanupTestData(schema: string, supa: typeof supabase) {
  try {
    await supa.rpc("exec_sql", {
      sql: `SET search_path TO ${schema}, public;`
    });

    await supa.rpc("exec_sql", {
      sql: `
        DROP TABLE IF EXISTS accounts CASCADE;
        DROP TABLE IF EXISTS customers CASCADE;
        DROP TABLE IF EXISTS companies CASCADE;
      `
    });
  } catch (error) {
    console.warn(`[integration] Failed to clean up test data in schema ${schema}:`, error);
  }
}

/**
 * Test environment validation
 */
export function validateTestEnvironment(): boolean {
  const hasRequiredVars = requiredEnvVars.every(varName => !!process.env[varName]);

  if (!hasRequiredVars) {
    console.warn(`[integration] Test environment validation failed. Missing required variables.`);
    return false;
  }

  console.log(`[integration] Test environment validated successfully`);
  return true;
}

/**
 * Skip test if environment is not properly configured
 */
export function skipIfNoEnvironment() {
  if (!validateTestEnvironment()) {
    console.warn(`[integration] Skipping test due to missing environment variables`);
    return true;
  }
  return false;
}
