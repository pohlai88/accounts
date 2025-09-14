// Database Contract Tests for V1 Compliance
// Validates database schema matches business logic expectations

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  tenants,
  companies,
  users,
  chartOfAccounts,
  glJournal,
  glJournalLines,
  arInvoices,
  arInvoiceLines,
  customers,
  taxCodes,
} from "@aibos/db/schema";
import { eq, and } from "drizzle-orm";

// Test database connection
let db: ReturnType<typeof drizzle>;
let sql: ReturnType<typeof postgres>;

describe("Database Contract Tests", () => {
  beforeAll(async () => {
    // Setup test database connection
    const connectionString =
      process.env.TEST_DATABASE_URL || "postgresql://postgres:postgres@localhost:54322/postgres";
    sql = postgres(connectionString);
    db = drizzle(sql);
  });

  afterAll(async () => {
    // Cleanup database connection
    await sql.end();
  });

  describe("Schema Validation", () => {
    it("should have all required core tables", async () => {
      // Test that all core tables exist and are accessible
      const tables = [
        "tenants",
        "companies",
        "users",
        "memberships",
        "chart_of_accounts",
        "gl_journal",
        "gl_journal_lines",
        "currencies",
        "fx_rates",
        "customers",
        "ar_invoices",
        "ar_invoice_lines",
        "tax_codes",
        "idempotency_keys",
        "audit_logs",
      ];

      for (const table of tables) {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        `;
        expect(result[0].exists).toBe(true);
      }
    });

    it("should have proper foreign key constraints", async () => {
      // Test foreign key relationships
      const foreignKeys = await sql`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public';
      `;

      // Verify critical foreign keys exist
      const fkMap = new Map(
        foreignKeys.map(fk => [
          `${fk.table_name}.${fk.column_name}`,
          `${fk.foreign_table_name}.${fk.foreign_column_name}`,
        ]),
      );

      expect(fkMap.get("companies.tenant_id")).toBe("tenants.id");
      expect(fkMap.get("users.tenant_id")).toBe("tenants.id");
      expect(fkMap.get("chart_of_accounts.company_id")).toBe("companies.id");
      expect(fkMap.get("gl_journal.company_id")).toBe("companies.id");
      expect(fkMap.get("gl_journal_lines.journal_id")).toBe("gl_journal.id");
      expect(fkMap.get("ar_invoices.customer_id")).toBe("customers.id");
      expect(fkMap.get("ar_invoice_lines.invoice_id")).toBe("ar_invoices.id");
    });

    it("should have proper indexes for performance", async () => {
      // Test that critical indexes exist
      const indexes = await sql`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname;
      `;

      const indexNames = indexes.map(idx => idx.indexname);

      // Verify critical indexes exist
      expect(indexNames.some(name => name.includes("tenant_id"))).toBe(true);
      expect(indexNames.some(name => name.includes("company_id"))).toBe(true);
      expect(indexNames.some(name => name.includes("journal_id"))).toBe(true);
      expect(indexNames.some(name => name.includes("invoice_id"))).toBe(true);
    });
  });

  describe("RLS Policy Validation", () => {
    it("should have RLS enabled on all multi-tenant tables", async () => {
      const rlsTables = await sql`
        SELECT 
          schemaname,
          tablename,
          rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (
          'tenants', 'companies', 'users', 'memberships',
          'chart_of_accounts', 'gl_journal', 'gl_journal_lines',
          'customers', 'ar_invoices', 'ar_invoice_lines',
          'idempotency_keys', 'audit_logs'
        );
      `;

      // All multi-tenant tables should have RLS enabled
      rlsTables.forEach(table => {
        expect(table.rowsecurity).toBe(true);
      });
    });

    it("should have proper RLS policies defined", async () => {
      const policies = await sql`
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public';
      `;

      // Verify critical policies exist
      const policyMap = new Map(policies.map(p => [`${p.tablename}.${p.policyname}`, p]));

      expect(policyMap.has("tenants.tenant_own_data")).toBe(true);
      expect(policyMap.has("companies.company_tenant_scope")).toBe(true);
      expect(policyMap.has("chart_of_accounts.coa_tenant_company_scope")).toBe(true);
      expect(policyMap.has("gl_journal.journal_tenant_company_scope")).toBe(true);
    });
  });

  describe("Data Integrity Constraints", () => {
    it("should enforce journal balance constraints", async () => {
      // Test that journal balance triggers work
      const triggers = await sql`
        SELECT 
          trigger_name,
          event_manipulation,
          event_object_table,
          action_statement
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND event_object_table = 'gl_journal_lines';
      `;

      const balanceTrigger = triggers.find(
        t => t.trigger_name.includes("balance") || t.action_statement.includes("balance"),
      );

      expect(balanceTrigger).toBeDefined();
    });

    it("should enforce unique constraints", async () => {
      const constraints = await sql`
        SELECT 
          tc.table_name,
          tc.constraint_name,
          tc.constraint_type,
          kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.constraint_type = 'UNIQUE'
        AND tc.table_schema = 'public';
      `;

      const uniqueConstraints = constraints.map(c => `${c.table_name}.${c.column_name}`);

      // Verify critical unique constraints
      expect(uniqueConstraints.some(c => c.includes("invoice_number"))).toBe(true);
      expect(uniqueConstraints.some(c => c.includes("account_code"))).toBe(true);
    });

    it("should enforce check constraints", async () => {
      const checkConstraints = await sql`
        SELECT 
          tc.table_name,
          tc.constraint_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.constraint_type = 'CHECK'
        AND tc.table_schema = 'public';
      `;

      // Should have check constraints for data validation
      expect(checkConstraints.length).toBeGreaterThan(0);
    });
  });

  describe("Data Type Validation", () => {
    it("should use consistent UUID types for IDs", async () => {
      const columns = await sql`
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND column_name LIKE '%_id'
        OR column_name = 'id';
      `;

      // All ID columns should be UUID type
      columns.forEach(col => {
        expect(col.data_type).toBe("uuid");
      });
    });

    it("should use consistent timestamp types", async () => {
      const timestampColumns = await sql`
        SELECT 
          table_name,
          column_name,
          data_type,
          datetime_precision
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND (column_name LIKE '%_at' OR column_name LIKE '%_date')
        AND data_type LIKE 'timestamp%';
      `;

      // All timestamp columns should have consistent precision
      timestampColumns.forEach(col => {
        expect(["timestamp without time zone", "timestamp with time zone"]).toContain(
          col.data_type,
        );
      });
    });

    it("should use consistent numeric types for amounts", async () => {
      const amountColumns = await sql`
        SELECT 
          table_name,
          column_name,
          data_type,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND (column_name LIKE '%_amount' OR column_name LIKE '%total%' OR column_name = 'balance');
      `;

      // All amount columns should use numeric type with consistent precision
      amountColumns.forEach(col => {
        expect(col.data_type).toBe("numeric");
        expect(col.numeric_precision).toBeGreaterThanOrEqual(10);
        expect(col.numeric_scale).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe("Audit Trail Validation", () => {
    it("should have audit log table with proper structure", async () => {
      const auditColumns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
        ORDER BY ordinal_position;
      `;

      const columnNames = auditColumns.map(c => c.column_name);

      // Verify audit log has required columns
      expect(columnNames).toContain("id");
      expect(columnNames).toContain("tenant_id");
      expect(columnNames).toContain("company_id");
      expect(columnNames).toContain("user_id");
      expect(columnNames).toContain("operation");
      expect(columnNames).toContain("entity_type");
      expect(columnNames).toContain("entity_id");
      expect(columnNames).toContain("old_values");
      expect(columnNames).toContain("new_values");
      expect(columnNames).toContain("timestamp");
    });

    it("should have proper audit triggers on critical tables", async () => {
      const auditTriggers = await sql`
        SELECT 
          trigger_name,
          event_object_table,
          action_timing,
          event_manipulation
        FROM information_schema.triggers
        WHERE trigger_schema = 'public'
        AND (trigger_name LIKE '%audit%' OR action_statement LIKE '%audit%');
      `;

      // Should have audit triggers on critical tables
      const tablesWithAudit = auditTriggers.map(t => t.event_object_table);
      expect(tablesWithAudit).toContain("gl_journal");
      expect(tablesWithAudit).toContain("ar_invoices");
    });
  });

  describe("Performance Validation", () => {
    it("should have efficient query plans for common operations", async () => {
      // Test query plan for tenant-scoped queries
      const plan = await sql`
        EXPLAIN (FORMAT JSON)
        SELECT * FROM companies 
        WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
      `;

      const queryPlan = plan[0]["QUERY PLAN"][0];

      // Should use index scan, not sequential scan
      expect(queryPlan.Plan.Node_Type).not.toBe("Seq Scan");
    });

    it("should have proper statistics for query optimization", async () => {
      const stats = await sql`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins,
          n_tup_upd,
          n_tup_del,
          last_analyze
        FROM pg_stat_user_tables
        WHERE schemaname = 'public';
      `;

      // Tables should have statistics collected
      expect(stats.length).toBeGreaterThan(0);
    });
  });
});
