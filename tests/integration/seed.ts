/**
 * Deterministic Seed Module for Integration Tests
 *
 * Provides a minimal, complete dataset for integration tests that is:
 * - Deterministic (same data every time)
 * - Fast (minimal dataset)
 * - Complete (all required relationships)
 * - Parallel-safe (ephemeral schemas)
 */

import type { Pool, PoolClient } from "pg";

type SeedCtx = { schema: string; conn: Pool };

function q(schema: string, name: string) {
    // Qualify identifiers safely. Assumes sanitized schema.
    return `"${schema}"."${name}"`;
}

async function tx<T>(conn: Pool, run: (c: PoolClient) => Promise<T>) {
    const client = await conn.connect();
    try {
        await client.query("BEGIN");
        const res = await run(client);
        await client.query("COMMIT");
        return res;
    } catch (e) {
        await client.query("ROLLBACK");
        throw e;
    } finally {
        client.release();
    }
}

export interface SeededData {
    accounts: {
        bank: string;
        ar: string;
        ap: string;
        tax: string;
        rev: string;
        fee: string;
    };
    tenantId: string;
    companyId: string;
    customerId: string;
    supplierId: string;
}

export async function seedCore(ctx: SeedCtx): Promise<SeededData> {
    const { schema, conn } = ctx;

    await tx(conn, async (c) => {
        // Minimal Chart of Accounts — deterministic IDs
        await c.query(`
      create table if not exists ${q(schema, "chart_of_accounts")}(
        id text primary key,
        tenant_id text not null,
        company_id text not null,
        code text not null,
        name text not null,
        account_type text not null,
        parent_id text,
        level integer not null default 1,
        is_active boolean not null default true,
        currency text not null,
        created_at timestamp with time zone default now(),
        updated_at timestamp with time zone default now()
      );
    `);

        const coa = [
            { id: "acct_bank_1000", code: "1000", name: "Bank Account", type: "ASSET", currency: "MYR" },
            { id: "acct_ar_1100", code: "1100", name: "Accounts Receivable", type: "ASSET", currency: "MYR" },
            { id: "acct_ap_2100", code: "2100", name: "Accounts Payable", type: "LIABILITY", currency: "MYR" },
            { id: "acct_tax_2105", code: "2105", name: "SST Payable", type: "LIABILITY", currency: "MYR" },
            { id: "acct_rev_4000", code: "4000", name: "Sales Revenue", type: "REVENUE", currency: "MYR" },
            { id: "acct_exp_6000", code: "6000", name: "Bank Fees", type: "EXPENSE", currency: "MYR" },
      { id: "acct_adv_1105", code: "1105", name: "Advance Payments", type: "ASSET", currency: "MYR" },
      { id: "acct_cust_adv_2300", code: "2300", name: "Customer Advances", type: "LIABILITY", currency: "MYR" },
      { id: "acct_vend_prepay_1200", code: "1200", name: "Vendor Prepayments", type: "ASSET", currency: "MYR" },
      { id: "acct_fx_gain_7100", code: "7100", name: "FX Gain", type: "REVENUE", currency: "MYR" },
      { id: "acct_fx_loss_8100", code: "8100", name: "FX Loss", type: "EXPENSE", currency: "MYR" },
    ];

        await c.query(
            `insert into ${q(schema, "chart_of_accounts")}(id, tenant_id, company_id, code, name, account_type, currency, level)
       values ${coa.map((_, i) => `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}, $${i * 8 + 8})`).join(",")}
       on conflict (id) do nothing`,
            coa.flatMap(a => [a.id, "t1", "c1", a.code, a.name, a.type, a.currency, 1])
        );

        // Tenants, companies, parties (keep tiny but complete)
        await c.query(`
      create table if not exists ${q(schema, "tenants")}(
        id text primary key,
        name text not null,
        created_at timestamp with time zone default now()
      )
    `);

        await c.query(`
      create table if not exists ${q(schema, "companies")}(
        id text primary key,
        tenant_id text not null,
        name text not null,
        created_at timestamp with time zone default now()
      )
    `);

        await c.query(`
      create table if not exists ${q(schema, "customers")}(
        id text primary key,
        tenant_id text not null,
        name text not null,
        currency text not null,
        email text,
        created_at timestamp with time zone default now()
      )
    `);

        await c.query(`
      create table if not exists ${q(schema, "suppliers")}(
        id text primary key,
        tenant_id text not null,
        name text not null,
        currency text not null,
        email text,
        created_at timestamp with time zone default now()
      )
    `);

        // Bank accounts for payment processing
        await c.query(`
      create table if not exists ${q(schema, "bank_accounts")}(
        id text primary key,
        tenant_id text not null,
        company_id text not null,
        account_number text not null,
        account_name text not null,
        currency text not null,
        is_active boolean not null default true,
        created_at timestamp with time zone default now()
      )
    `);

        // Insert base data
        await c.query(
            `insert into ${q(schema, "tenants")} (id, name)
       values ('t1', 'Test Tenant') on conflict (id) do nothing`
        );

        await c.query(
            `insert into ${q(schema, "companies")} (id, tenant_id, name)
       values ('c1', 't1', 'TestCo') on conflict (id) do nothing`
        );

        await c.query(
            `insert into ${q(schema, "customers")} (id, tenant_id, name, currency, email)
       values ('cust_1', 't1', 'Acme Corp', 'MYR', 'acme@example.com') on conflict (id) do nothing`
        );

        await c.query(
            `insert into ${q(schema, "suppliers")} (id, tenant_id, name, currency, email)
       values ('supp_1', 't1', 'Vendor Inc', 'MYR', 'vendor@example.com') on conflict (id) do nothing`
        );

        await c.query(
            `insert into ${q(schema, "bank_accounts")} (id, tenant_id, company_id, account_number, account_name, currency)
       values ('bank_1000', 't1', 'c1', '1234567890', 'Test Bank Account', 'MYR') on conflict (id) do nothing`
        );
    });

  return {
    accounts: {
      bank: "00000000-0000-0000-0000-000000000001", // Bank Account (1000)
      ar: "00000000-0000-0000-0000-000000000002",   // Accounts Receivable (1100)
      ap: "00000000-0000-0000-0000-000000000003",   // Accounts Payable (2100)
      tax: "00000000-0000-0000-0000-000000000004",  // Tax Payable (2105)
      rev: "00000000-0000-0000-0000-000000000005",  // Sales Revenue (4000)
      fee: "00000000-0000-0000-0000-000000000006",  // Bank Fees (6000)
      advCustomer: "00000000-0000-0000-0000-000000000007", // Customer Advances (2300)
      prepayVendor: "00000000-0000-0000-0000-000000000008", // Vendor Prepayments (1200)
      fxGain: "00000000-0000-0000-0000-000000000009",      // FX Gain (7100)
      fxLoss: "00000000-0000-0000-0000-000000000010",      // FX Loss (8100)
    },
    tenantId: "00000000-0000-0000-0000-000000000011",
    companyId: "00000000-0000-0000-0000-000000000012",
    customerId: "00000000-0000-0000-0000-000000000013",
    supplierId: "00000000-0000-0000-0000-000000000014",
  };
}

/**
 * Data builder pattern for special test cases
 */
export async function buildInvoice(
    c: PoolClient,
    schema: string,
    args: {
        id: string;
        companyId: string;
        customerId: string;
        currency: string;
        lines: Array<{
            accountId: string;
            unitPrice: number;
            taxRate?: number;
            description?: string;
        }>;
    }
) {
    await c.query(`
    create table if not exists "${schema}"."invoices" (
      id text primary key,
      company_id text,
      customer_id text,
      currency text,
      total_amount numeric,
      status text default 'DRAFT',
      created_at timestamp with time zone default now()
    )
  `);

    await c.query(`
    create table if not exists "${schema}"."invoice_lines" (
      invoice_id text,
      line_no int,
      account_id text,
      unit_price numeric,
      tax_rate numeric,
      description text,
      created_at timestamp with time zone default now()
    )
  `);

    const totalAmount = args.lines.reduce((sum, line) => sum + line.unitPrice, 0);

    await c.query(
        `insert into "${schema}"."invoices"(id, company_id, customer_id, currency, total_amount)
     values ($1, $2, $3, $4, $5)`,
        [args.id, args.companyId, args.customerId, args.currency, totalAmount]
    );

    for (let i = 0; i < args.lines.length; i++) {
        const L = args.lines[i];
        await c.query(
            `insert into "${schema}"."invoice_lines"(invoice_id, line_no, account_id, unit_price, tax_rate, description)
       values ($1, $2, $3, $4, $5, $6)`,
            [args.id, i + 1, L.accountId, L.unitPrice, L.taxRate ?? 0, L.description ?? `Line ${i + 1}`]
        );
    }
}

export async function buildBill(
    c: PoolClient,
    schema: string,
    args: {
        id: string;
        companyId: string;
        supplierId: string;
        currency: string;
        lines: Array<{
            accountId: string;
            unitPrice: number;
            taxRate?: number;
            description?: string;
        }>;
    }
) {
    await c.query(`
    create table if not exists "${schema}"."bills" (
      id text primary key,
      company_id text,
      supplier_id text,
      currency text,
      total_amount numeric,
      status text default 'DRAFT',
      created_at timestamp with time zone default now()
    )
  `);

    await c.query(`
    create table if not exists "${schema}"."bill_lines" (
      bill_id text,
      line_no int,
      account_id text,
      unit_price numeric,
      tax_rate numeric,
      description text,
      created_at timestamp with time zone default now()
    )
  `);

    const totalAmount = args.lines.reduce((sum, line) => sum + line.unitPrice, 0);

    await c.query(
        `insert into "${schema}"."bills"(id, company_id, supplier_id, currency, total_amount)
     values ($1, $2, $3, $4, $5)`,
        [args.id, args.companyId, args.supplierId, args.currency, totalAmount]
    );

    for (let i = 0; i < args.lines.length; i++) {
        const L = args.lines[i];
        await c.query(
            `insert into "${schema}"."bill_lines"(bill_id, line_no, account_id, unit_price, tax_rate, description)
       values ($1, $2, $3, $4, $5, $6)`,
            [args.id, i + 1, L.accountId, L.unitPrice, L.taxRate ?? 0, L.description ?? `Line ${i + 1}`]
        );
    }
}
