/**
 * Scenario-Specific Builders for Integration Tests
 *
 * Provides focused data builders for specific test scenarios.
 * Each builder creates only the minimum data needed for that test case.
 */

import type { PoolClient } from "pg";

function q(schema: string, name: string) {
  return `"${schema}"."${name}"`;
}

/**
 * Add a bank account for payment processing
 */
export async function addBankAccount(
  c: PoolClient,
  schema: string,
  id = "00000000-0000-0000-0000-000000000001",
  currency = "MYR",
  accountNumber = "1234567890",
  accountName = "Test Bank Account"
) {
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

  await c.query(
    `insert into ${q(schema, "bank_accounts")}(id, tenant_id, company_id, account_number, account_name, currency)
     values ($1, $2, $3, $4, $5, $6) on conflict (id) do nothing`,
    [id, "t1", "c1", accountNumber, accountName, currency]
  );

  return id;
}

/**
 * Add FX rate for foreign currency conversions
 */
export async function addFxRate(
  c: PoolClient,
  schema: string,
  base = "MYR",
  foreign = "USD",
  rate = 4.2
) {
  await c.query(`
    create table if not exists ${q(schema, "fx_rates")}(
      base_currency text not null,
      foreign_currency text not null,
      rate numeric not null,
      effective_date date not null default current_date,
      created_at timestamp with time zone default now(),
      primary key(base_currency, foreign_currency, effective_date)
    )
  `);

  await c.query(
    `insert into ${q(schema, "fx_rates")}(base_currency, foreign_currency, rate)
     values ($1, $2, $3)
     on conflict (base_currency, foreign_currency, effective_date)
     do update set rate = excluded.rate`,
    [base, foreign, rate]
  );

  return { base, foreign, rate };
}

/**
 * Build an open invoice for payment allocation
 */
export async function buildInvoiceOpen(
  c: PoolClient,
  schema: string,
  opts: {
    id?: string;
    companyId: string;
    customerId: string;
    currency: string;
    revAccountId: string;
    taxAccountId?: string;
    amount: number;
    taxRate?: number;
    description?: string;
  }
) {
  const id = opts.id ?? "inv-1";
  const taxAmount = opts.amount * (opts.taxRate ?? 0);
  const totalAmount = opts.amount + taxAmount;

  await c.query(`
    create table if not exists ${q(schema, "invoices")}(
      id text primary key,
      company_id text not null,
      customer_id text not null,
      currency text not null,
      total_amount numeric not null,
      open_amount numeric not null,
      status text not null default 'OPEN',
      created_at timestamp with time zone default now()
    )
  `);

  await c.query(`
    create table if not exists ${q(schema, "invoice_lines")}(
      invoice_id text not null,
      line_no int not null,
      account_id text not null,
      unit_price numeric not null,
      tax_rate numeric not null default 0,
      description text,
      created_at timestamp with time zone default now()
    )
  `);

  // Insert invoice header
  await c.query(
    `insert into ${q(schema, "invoices")}(id, company_id, customer_id, currency, total_amount, open_amount)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, opts.companyId, opts.customerId, opts.currency, totalAmount, totalAmount]
  );

  // Insert revenue line
  await c.query(
    `insert into ${q(schema, "invoice_lines")}(invoice_id, line_no, account_id, unit_price, tax_rate, description)
     values ($1, 1, $2, $3, $4, $5)`,
    [id, opts.revAccountId, opts.amount, opts.taxRate ?? 0, opts.description ?? "Revenue line"]
  );

  // Insert tax line if applicable
  if (opts.taxRate && opts.taxAccountId && taxAmount > 0) {
    await c.query(
      `insert into ${q(schema, "invoice_lines")}(invoice_id, line_no, account_id, unit_price, tax_rate, description)
       values ($1, 2, $2, $3, $4, $5)`,
      [id, opts.taxAccountId, taxAmount, opts.taxRate, "Tax line"]
    );
  }

  return { id, totalAmount, openAmount: totalAmount };
}

/**
 * Build an open bill for payment allocation
 */
export async function buildBillOpen(
  c: PoolClient,
  schema: string,
  opts: {
    id?: string;
    companyId: string;
    supplierId: string;
    currency: string;
    expAccountId: string;
    taxAccountId?: string;
    amount: number;
    taxRate?: number;
    description?: string;
  }
) {
  const id = opts.id ?? "bill-1";
  const taxAmount = opts.amount * (opts.taxRate ?? 0);
  const totalAmount = opts.amount + taxAmount;

  await c.query(`
    create table if not exists ${q(schema, "bills")}(
      id text primary key,
      company_id text not null,
      supplier_id text not null,
      currency text not null,
      total_amount numeric not null,
      open_amount numeric not null,
      status text not null default 'OPEN',
      created_at timestamp with time zone default now()
    )
  `);

  await c.query(`
    create table if not exists ${q(schema, "bill_lines")}(
      bill_id text not null,
      line_no int not null,
      account_id text not null,
      unit_price numeric not null,
      tax_rate numeric not null default 0,
      description text,
      created_at timestamp with time zone default now()
    )
  `);

  // Insert bill header
  await c.query(
    `insert into ${q(schema, "bills")}(id, company_id, supplier_id, currency, total_amount, open_amount)
     values ($1, $2, $3, $4, $5, $6)`,
    [id, opts.companyId, opts.supplierId, opts.currency, totalAmount, totalAmount]
  );

  // Insert expense line
  await c.query(
    `insert into ${q(schema, "bill_lines")}(bill_id, line_no, account_id, unit_price, tax_rate, description)
     values ($1, 1, $2, $3, $4, $5)`,
    [id, opts.expAccountId, opts.amount, opts.taxRate ?? 0, opts.description ?? "Expense line"]
  );

  // Insert tax line if applicable
  if (opts.taxRate && opts.taxAccountId && taxAmount > 0) {
    await c.query(
      `insert into ${q(schema, "bill_lines")}(bill_id, line_no, account_id, unit_price, tax_rate, description)
       values ($1, 2, $2, $3, $4, $5)`,
      [id, opts.taxAccountId, taxAmount, opts.taxRate, "Tax line"]
    );
  }

  return { id, totalAmount, openAmount: totalAmount };
}

/**
 * Create advance/prepayment account for overpayments
 */
export async function addAdvanceAccount(
  c: PoolClient,
  schema: string,
  opts: {
    id?: string;
    partyType: "CUSTOMER" | "SUPPLIER";
    partyId: string;
    currency: string;
    initialBalance?: number;
  }
) {
  const id = opts.id ?? `advance-${opts.partyType.toLowerCase()}-${opts.partyId}`;

  await c.query(`
    create table if not exists ${q(schema, "advance_accounts")}(
      id text primary key,
      tenant_id text not null,
      company_id text not null,
      party_type text not null,
      party_id text not null,
      currency text not null,
      balance_amount numeric not null default 0,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    )
  `);

  await c.query(
    `insert into ${q(schema, "advance_accounts")}(id, tenant_id, company_id, party_type, party_id, currency, balance_amount)
     values ($1, $2, $3, $4, $5, $6, $7) on conflict (id) do nothing`,
    [id, "t1", "c1", opts.partyType, opts.partyId, opts.currency, opts.initialBalance ?? 0]
  );

  return id;
}

/**
 * Add performance indices for fast lookups
 */
export async function addPerformanceIndices(c: PoolClient, schema: string) {
  // Invoice indices
  await c.query(`
    create index if not exists idx_invoices_customer_open
    on ${q(schema, "invoices")}(customer_id)
    where open_amount > 0
  `);

  await c.query(`
    create index if not exists idx_invoices_company_currency
    on ${q(schema, "invoices")}(company_id, currency)
  `);

  // Bill indices
  await c.query(`
    create index if not exists idx_bills_supplier_open
    on ${q(schema, "bills")}(supplier_id)
    where open_amount > 0
  `);

  // Bank account indices
  await c.query(`
    create index if not exists idx_bank_accounts_currency
    on ${q(schema, "bank_accounts")}(currency)
  `);

  // FX rate indices
  await c.query(`
    create index if not exists idx_fx_rates_lookup
    on ${q(schema, "fx_rates")}(base_currency, foreign_currency, effective_date)
  `);
}

/**
 * Transaction wrapper for builders
 */
export async function tx<T>(conn: any, run: (c: PoolClient) => Promise<T>) {
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
