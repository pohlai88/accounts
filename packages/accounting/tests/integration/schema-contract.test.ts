/**
 * Schema Contract Sentinel Test
 *
 * This test ensures the database schema contract is maintained and prevents
 * regressions by failing loudly if critical tables or columns are missing.
 *
 * Runs in CI and must pass for any deployment.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { config } from "dotenv";

// Load test environment variables
config({ path: ".env.test", override: true });

describe("Schema Contract Sentinel", () => {
    let db: Pool;

    beforeAll(async () => {
        // Environment gate - fail fast if required vars missing
        const requiredVars = [
            "NEXT_PUBLIC_SUPABASE_URL",
            "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY",
            "SUPABASE_DB_URL"
        ];

        const missingVars = requiredVars.filter(v => !process.env[v]);
        if (missingVars.length > 0) {
            throw new Error(`Missing required environment variables: ${missingVars.join(", ")}`);
        }

        db = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
    });

    afterAll(async () => {
        if (db) {
            await db.end();
        }
    });

    describe("Critical Tables", () => {
        it("should have chart_of_accounts as canonical accounts table", async () => {
            const { rows } = await db.query(`
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('chart_of_accounts', 'accounts')
        ORDER BY table_name
      `);

            const tableNames = rows.map(r => r.table_name);

            // chart_of_accounts must exist as a table
            expect(tableNames).toContain('chart_of_accounts');

            // If accounts exists, it should be a view (compatibility shim)
            const accountsRow = rows.find(r => r.table_name === 'accounts');
            if (accountsRow) {
                expect(accountsRow.table_type).toBe('VIEW');
            }
        });

        it("should have all required core tables", async () => {
            const { rows } = await db.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN ('tenants', 'companies', 'customers', 'suppliers', 'chart_of_accounts')
        ORDER BY table_name
      `);

            const tableNames = rows.map(r => r.table_name);
            const requiredTables = ['tenants', 'companies', 'customers', 'suppliers', 'chart_of_accounts'];

            requiredTables.forEach(table => {
                expect(tableNames).toContain(table);
            });
        });
    });

    describe("Chart of Accounts Contract", () => {
        it("should have chart_of_accounts with required columns", async () => {
            const { rows } = await db.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'chart_of_accounts'
        ORDER BY ordinal_position
      `);

            const columns = rows.map(r => r.column_name);
            const requiredColumns = [
                'id', 'tenant_id', 'company_id', 'code', 'name',
                'account_type', 'parent_id', 'level', 'is_active', 'currency'
            ];

            requiredColumns.forEach(column => {
                expect(columns).toContain(column);
            });

            // Verify critical column types
            const idCol = rows.find(r => r.column_name === 'id');
            expect(idCol?.data_type).toBe('uuid');

            const accountTypeCol = rows.find(r => r.column_name === 'account_type');
            expect(accountTypeCol?.data_type).toBe('text');
            expect(accountTypeCol?.is_nullable).toBe('NO');
        });

        it("should have proper indexes on chart_of_accounts", async () => {
            const { rows } = await db.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'chart_of_accounts'
      `);

            const indexNames = rows.map(r => r.indexname);

            // Should have primary key index
            expect(indexNames.some(name => name.includes('pkey'))).toBe(true);

            // Should have tenant/company indexes for performance
            expect(indexNames.some(name => name.includes('tenant'))).toBe(true);
            expect(indexNames.some(name => name.includes('company'))).toBe(true);
        });
    });

    describe("Compatibility Shim", () => {
        it("should have accounts view that maps to chart_of_accounts", async () => {
            const { rows } = await db.query(`
        SELECT table_name, table_type
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'accounts'
      `);

            if (rows.length > 0) {
                expect(rows[0].table_type).toBe('VIEW');

                // Verify the view definition includes the mapping
                const { rows: viewDef } = await db.query(`
          SELECT definition
          FROM pg_views
          WHERE schemaname = 'public'
          AND viewname = 'accounts'
        `);

                expect(viewDef[0].definition).toContain('chart_of_accounts');
                expect(viewDef[0].definition).toContain('account_type as type');
            }
        });
    });

    describe("Data Integrity", () => {
        it("should have valid account types in chart_of_accounts", async () => {
            const { rows } = await db.query(`
        SELECT DISTINCT account_type
        FROM public.chart_of_accounts
        WHERE account_type IS NOT NULL
      `);

            const accountTypes = rows.map(r => r.account_type);
            const validTypes = [
                'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE',
                'Asset', 'Liability', 'Equity', 'Revenue', 'Expense'
            ];

            // All account types should be valid (supporting both formats)
            accountTypes.forEach(type => {
                expect(validTypes).toContain(type);
            });

            // Should have at least some account types
            expect(accountTypes.length).toBeGreaterThan(0);
        });

        it("should have proper tenant/company relationships", async () => {
            const { rows } = await db.query(`
        SELECT COUNT(*) as count
        FROM public.chart_of_accounts coa
        LEFT JOIN public.tenants t ON coa.tenant_id = t.id
        LEFT JOIN public.companies c ON coa.company_id = c.id
        WHERE t.id IS NULL OR c.id IS NULL
      `);

            expect(parseInt(rows[0].count)).toBe(0);
        });
    });
});
