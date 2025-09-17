/**
 * Enhanced Deterministic Seed System for Integration Tests
 *
 * Provides comprehensive, test-ready data that is:
 * - Deterministic (same data every time)
 * - Scalable (supports multiple scenarios)
 * - Complete (all required relationships)
 * - Parallel-safe (ephemeral schemas)
 * - Multi-currency ready
 * - Business rule compliant
 */

import type { Pool, PoolClient } from "pg";
import {
    ACCOUNT_HIERARCHY,
    ACCOUNT_IDS,
    CURRENCIES,
    TEST_SCENARIOS,
    type AccountDefinition,
    type Currency
} from "../../packages/accounting/src/metadata/enhanced-account-mapping";

type SeedCtx = { schema: string; conn: Pool };

function q(schema: string, name: string) {
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

// ============================================================================
// ENHANCED SEEDED DATA INTERFACE
// ============================================================================

export interface EnhancedSeededData {
    // Core entities
    tenantId: string;
    companyId: string;
    customerId: string;
    supplierId: string;

    // Account mappings (by category)
    accounts: {
        // Core accounts
        bank: string;
        ar: string;
        ap: string;
        tax: string;
        revenue: string;
        fees: string;

        // Advances and prepayments
        advCustomer: string;
        prepayVendor: string;

        // FX accounts
        fxGain: string;
        fxLoss: string;

        // Additional accounts
        inventory: string;
        fixedAssets: string;
        equity: string;
        retainedEarnings: string;
        cogs: string;
        officeExpenses: string;
        travelExpenses: string;
    };

    // Multi-currency support
    currencies: Currency[];
    baseCurrency: Currency;

    // Test scenarios
    scenarios: Record<string, any>;

    // Bank accounts (multi-currency)
    bankAccounts: Array<{
        id: string;
        currency: Currency;
        accountNumber: string;
        accountName: string;
    }>;
}

// ============================================================================
// DETERMINISTIC ID GENERATORS
// ============================================================================

const ID_PREFIXES = {
    TENANT: 't',
    COMPANY: 'c',
    CUSTOMER: 'cust',
    SUPPLIER: 'supp',
    BANK: 'bank',
    INVOICE: 'inv',
    BILL: 'bill',
    PAYMENT: 'pay'
} as const;

function generateDeterministicId(prefix: string, index: number = 1): string {
    return `${prefix}_${index.toString().padStart(3, '0')}`;
}

// ============================================================================
// CORE SEED FUNCTION
// ============================================================================

export async function seedEnhanced(ctx: SeedCtx): Promise<EnhancedSeededData> {
    const { schema, conn } = ctx;

    await tx(conn, async (c) => {
        // Create all required tables
        await createTables(c, schema);

        // Insert deterministic data
        await insertCoreData(c, schema);
        await insertAccountHierarchy(c, schema);
        await insertMultiCurrencyData(c, schema);
        await insertTestScenarios(c, schema);
    });

    return {
        tenantId: generateDeterministicId(ID_PREFIXES.TENANT),
        companyId: generateDeterministicId(ID_PREFIXES.COMPANY),
        customerId: generateDeterministicId(ID_PREFIXES.CUSTOMER),
        supplierId: generateDeterministicId(ID_PREFIXES.SUPPLIER),

        accounts: {
            bank: ACCOUNT_IDS.BANK,
            ar: ACCOUNT_IDS.AR,
            ap: ACCOUNT_IDS.AP,
            tax: ACCOUNT_IDS.TAX,
            revenue: ACCOUNT_IDS.REVENUE,
            fees: ACCOUNT_IDS.FEES,
            advCustomer: ACCOUNT_IDS.ADV_CUSTOMER,
            prepayVendor: ACCOUNT_IDS.PREPAY_VENDOR,
            fxGain: ACCOUNT_IDS.FX_GAIN,
            fxLoss: ACCOUNT_IDS.FX_LOSS,
            inventory: ACCOUNT_IDS.INVENTORY,
            fixedAssets: ACCOUNT_IDS.FIXED_ASSETS,
            equity: ACCOUNT_IDS.EQUITY,
            retainedEarnings: ACCOUNT_IDS.RETAINED_EARNINGS,
            cogs: ACCOUNT_IDS.COGS,
            officeExpenses: ACCOUNT_IDS.OFFICE_EXPENSES,
            travelExpenses: ACCOUNT_IDS.TRAVEL_EXPENSES
        },

        currencies: [CURRENCIES.MYR, CURRENCIES.USD, CURRENCIES.EUR, CURRENCIES.SGD],
        baseCurrency: CURRENCIES.MYR,

        scenarios: TEST_SCENARIOS,

        bankAccounts: [
            { id: 'bank_myr_001', currency: CURRENCIES.MYR, accountNumber: '1234567890', accountName: 'MYR Bank Account' },
            { id: 'bank_usd_001', currency: CURRENCIES.USD, accountNumber: '9876543210', accountName: 'USD Bank Account' },
            { id: 'bank_eur_001', currency: CURRENCIES.EUR, accountNumber: '5555444433', accountName: 'EUR Bank Account' },
            { id: 'bank_sgd_001', currency: CURRENCIES.SGD, accountNumber: '1111222233', accountName: 'SGD Bank Account' }
        ]
    };
}

// ============================================================================
// TABLE CREATION
// ============================================================================

async function createTables(c: PoolClient, schema: string) {
    // Chart of Accounts
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
      description text,
      tags text[],
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now(),
      unique(tenant_id, company_id, code)
    );
  `);

    // Tenants
    await c.query(`
    create table if not exists ${q(schema, "tenants")}(
      id text primary key,
      name text not null,
      currency text not null default 'MYR',
      timezone text not null default 'Asia/Kuala_Lumpur',
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
  `);

    // Companies
    await c.query(`
    create table if not exists ${q(schema, "companies")}(
      id text primary key,
      tenant_id text not null references ${q(schema, "tenants")}(id),
      name text not null,
      registration_number text,
      currency text not null default 'MYR',
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
  `);

    // Customers
    await c.query(`
    create table if not exists ${q(schema, "customers")}(
      id text primary key,
      tenant_id text not null references ${q(schema, "tenants")}(id),
      name text not null,
      currency text not null,
      email text,
      phone text,
      address text,
      credit_limit numeric default 0,
      is_active boolean not null default true,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
  `);

    // Suppliers
    await c.query(`
    create table if not exists ${q(schema, "suppliers")}(
      id text primary key,
      tenant_id text not null references ${q(schema, "tenants")}(id),
      name text not null,
      currency text not null,
      email text,
      phone text,
      address text,
      payment_terms integer default 30,
      is_active boolean not null default true,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
  `);

    // Bank Accounts
    await c.query(`
    create table if not exists ${q(schema, "bank_accounts")}(
      id text primary key,
      tenant_id text not null references ${q(schema, "tenants")}(id),
      company_id text not null references ${q(schema, "companies")}(id),
      account_number text not null,
      account_name text not null,
      bank_name text not null,
      currency text not null,
      is_active boolean not null default true,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now()
    );
  `);

    // Invoices
    await c.query(`
    create table if not exists ${q(schema, "invoices")}(
      id text primary key,
      tenant_id text not null references ${q(schema, "tenants")}(id),
      company_id text not null references ${q(schema, "companies")}(id),
      customer_id text not null references ${q(schema, "customers")}(id),
      invoice_number text not null,
      currency text not null,
      total_amount numeric not null,
      tax_amount numeric not null default 0,
      open_amount numeric not null,
      status text not null default 'DRAFT',
      due_date date,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now(),
      unique(tenant_id, company_id, invoice_number)
    );
  `);

    // Invoice Lines
    await c.query(`
    create table if not exists ${q(schema, "invoice_lines")}(
      id text primary key,
      invoice_id text not null references ${q(schema, "invoices")}(id),
      line_number integer not null,
      account_id text not null references ${q(schema, "chart_of_accounts")}(id),
      description text not null,
      quantity numeric not null default 1,
      unit_price numeric not null,
      tax_rate numeric not null default 0,
      line_amount numeric not null,
      created_at timestamp with time zone default now()
    );
  `);

    // Bills
    await c.query(`
    create table if not exists ${q(schema, "bills")}(
      id text primary key,
      tenant_id text not null references ${q(schema, "tenants")}(id),
      company_id text not null references ${q(schema, "companies")}(id),
      supplier_id text not null references ${q(schema, "suppliers")}(id),
      bill_number text not null,
      currency text not null,
      total_amount numeric not null,
      tax_amount numeric not null default 0,
      open_amount numeric not null,
      status text not null default 'DRAFT',
      due_date date,
      created_at timestamp with time zone default now(),
      updated_at timestamp with time zone default now(),
      unique(tenant_id, company_id, bill_number)
    );
  `);

    // Bill Lines
    await c.query(`
    create table if not exists ${q(schema, "bill_lines")}(
      id text primary key,
      bill_id text not null references ${q(schema, "bills")}(id),
      line_number integer not null,
      account_id text not null references ${q(schema, "chart_of_accounts")}(id),
      description text not null,
      quantity numeric not null default 1,
      unit_price numeric not null,
      tax_rate numeric not null default 0,
      line_amount numeric not null,
      created_at timestamp with time zone default now()
    );
  `);

    // FX Rates
    await c.query(`
    create table if not exists ${q(schema, "fx_rates")}(
      id text primary key,
      tenant_id text not null references ${q(schema, "tenants")}(id),
      from_currency text not null,
      to_currency text not null,
      rate numeric not null,
      effective_date date not null,
      created_at timestamp with time zone default now(),
      unique(tenant_id, from_currency, to_currency, effective_date)
    );
  `);
}

// ============================================================================
// DATA INSERTION
// ============================================================================

async function insertCoreData(c: PoolClient, schema: string) {
    // Insert tenant
    await c.query(`
    insert into ${q(schema, "tenants")} (id, name, currency, timezone)
    values ($1, $2, $3, $4)
    on conflict (id) do nothing
  `, [generateDeterministicId(ID_PREFIXES.TENANT), 'Test Tenant', CURRENCIES.MYR, 'Asia/Kuala_Lumpur']);

    // Insert company
    await c.query(`
    insert into ${q(schema, "companies")} (id, tenant_id, name, registration_number, currency)
    values ($1, $2, $3, $4, $5)
    on conflict (id) do nothing
  `, [generateDeterministicId(ID_PREFIXES.COMPANY), generateDeterministicId(ID_PREFIXES.TENANT), 'TestCo Sdn Bhd', '123456-A', CURRENCIES.MYR]);

    // Insert customers
    const customers = [
        { name: 'Acme Corp', currency: CURRENCIES.MYR, email: 'acme@example.com', credit_limit: 100000 },
        { name: 'Beta Ltd', currency: CURRENCIES.USD, email: 'beta@example.com', credit_limit: 50000 },
        { name: 'Gamma Inc', currency: CURRENCIES.EUR, email: 'gamma@example.com', credit_limit: 75000 }
    ];

    for (let i = 0; i < customers.length; i++) {
        const customer = customers[i];
        await c.query(`
      insert into ${q(schema, "customers")} (id, tenant_id, name, currency, email, credit_limit)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (id) do nothing
    `, [
            generateDeterministicId(ID_PREFIXES.CUSTOMER, i + 1),
            generateDeterministicId(ID_PREFIXES.TENANT),
            customer.name,
            customer.currency,
            customer.email,
            customer.credit_limit
        ]);
    }

    // Insert suppliers
    const suppliers = [
        { name: 'Vendor Inc', currency: CURRENCIES.MYR, email: 'vendor@example.com', payment_terms: 30 },
        { name: 'Supplier Co', currency: CURRENCIES.USD, email: 'supplier@example.com', payment_terms: 45 },
        { name: 'Provider Ltd', currency: CURRENCIES.EUR, email: 'provider@example.com', payment_terms: 60 }
    ];

    for (let i = 0; i < suppliers.length; i++) {
        const supplier = suppliers[i];
        await c.query(`
      insert into ${q(schema, "suppliers")} (id, tenant_id, name, currency, email, payment_terms)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (id) do nothing
    `, [
            generateDeterministicId(ID_PREFIXES.SUPPLIER, i + 1),
            generateDeterministicId(ID_PREFIXES.TENANT),
            supplier.name,
            supplier.currency,
            supplier.email,
            supplier.payment_terms
        ]);
    }
}

async function insertAccountHierarchy(c: PoolClient, schema: string) {
    const accounts = Object.values(ACCOUNT_HIERARCHY);

    for (const account of accounts) {
        await c.query(`
      insert into ${q(schema, "chart_of_accounts")} (
        id, tenant_id, company_id, code, name, account_type, parent_id, level,
        is_active, currency, description, tags
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      on conflict (id) do nothing
    `, [
            account.id,
            generateDeterministicId(ID_PREFIXES.TENANT),
            generateDeterministicId(ID_PREFIXES.COMPANY),
            account.code,
            account.name,
            account.type,
            account.parentId || null,
            account.level,
            account.isActive,
            account.currency,
            account.description || null,
            account.tags || null
        ]);
    }
}

async function insertMultiCurrencyData(c: PoolClient, schema: string) {
    // Insert bank accounts for different currencies
    const bankAccounts = [
        { id: 'bank_myr_001', currency: CURRENCIES.MYR, accountNumber: '1234567890', accountName: 'MYR Bank Account', bankName: 'Maybank' },
        { id: 'bank_usd_001', currency: CURRENCIES.USD, accountNumber: '9876543210', accountName: 'USD Bank Account', bankName: 'CitiBank' },
        { id: 'bank_eur_001', currency: CURRENCIES.EUR, accountNumber: '5555444433', accountName: 'EUR Bank Account', bankName: 'Deutsche Bank' },
        { id: 'bank_sgd_001', currency: CURRENCIES.SGD, accountNumber: '1111222233', accountName: 'SGD Bank Account', bankName: 'DBS' }
    ];

    for (const bank of bankAccounts) {
        await c.query(`
      insert into ${q(schema, "bank_accounts")} (id, tenant_id, company_id, account_number, account_name, bank_name, currency)
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (id) do nothing
    `, [
            bank.id,
            generateDeterministicId(ID_PREFIXES.TENANT),
            generateDeterministicId(ID_PREFIXES.COMPANY),
            bank.accountNumber,
            bank.accountName,
            bank.bankName,
            bank.currency
        ]);
    }

    // Insert FX rates
    const fxRates = [
        { from: CURRENCIES.USD, to: CURRENCIES.MYR, rate: 4.20 },
        { from: CURRENCIES.EUR, to: CURRENCIES.MYR, rate: 4.50 },
        { from: CURRENCIES.SGD, to: CURRENCIES.MYR, rate: 3.10 },
        { from: CURRENCIES.GBP, to: CURRENCIES.MYR, rate: 5.20 },
        { from: CURRENCIES.JPY, to: CURRENCIES.MYR, rate: 0.028 }
    ];

    for (const fx of fxRates) {
        await c.query(`
      insert into ${q(schema, "fx_rates")} (id, tenant_id, from_currency, to_currency, rate, effective_date)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (tenant_id, from_currency, to_currency, effective_date) do nothing
    `, [
            `fx_${fx.from}_${fx.to}_${new Date().toISOString().split('T')[0]}`,
            generateDeterministicId(ID_PREFIXES.TENANT),
            fx.from,
            fx.to,
            fx.rate,
            new Date().toISOString().split('T')[0]
        ]);
    }
}

async function insertTestScenarios(c: PoolClient, schema: string) {
    // Create a test scenarios table for reference
    await c.query(`
    create table if not exists ${q(schema, "test_scenarios")}(
      id text primary key,
      name text not null,
      description text,
      scenario_data jsonb not null,
      created_at timestamp with time zone default now()
    );
  `);

    // Insert test scenarios
    for (const [key, scenario] of Object.entries(TEST_SCENARIOS)) {
        await c.query(`
      insert into ${q(schema, "test_scenarios")} (id, name, description, scenario_data)
      values ($1, $2, $3, $4)
      on conflict (id) do nothing
    `, [
            key.toLowerCase(),
            scenario.name,
            scenario.description,
            JSON.stringify(scenario)
        ]);
    }
}

// ============================================================================
// SCENARIO BUILDERS
// ============================================================================

export interface InvoiceBuilderOptions {
    id?: string;
    customerId?: string;
    currency?: Currency;
    totalAmount?: number;
    taxRate?: number;
    status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'CANCELLED';
    dueDate?: Date;
    lines?: Array<{
        accountId: string;
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate?: number;
    }>;
}

export async function buildInvoice(
    c: PoolClient,
    schema: string,
    options: InvoiceBuilderOptions
): Promise<{ id: string; invoiceNumber: string; totalAmount: number; openAmount: number }> {
    const id = options.id || generateDeterministicId(ID_PREFIXES.INVOICE);
    const invoiceNumber = `INV-${id.split('_').pop()}`;
    const customerId = options.customerId || generateDeterministicId(ID_PREFIXES.CUSTOMER);
    const currency = options.currency || CURRENCIES.MYR;
    const totalAmount = options.totalAmount || 1000;
    const taxRate = options.taxRate || 0.1;
    const taxAmount = totalAmount * taxRate;
    const openAmount = totalAmount + taxAmount;
    const status = options.status || 'DRAFT';

    // Insert invoice
    await c.query(`
    insert into ${q(schema, "invoices")} (
      id, tenant_id, company_id, customer_id, invoice_number, currency,
      total_amount, tax_amount, open_amount, status, due_date
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    on conflict (id) do nothing
  `, [
        id,
        generateDeterministicId(ID_PREFIXES.TENANT),
        generateDeterministicId(ID_PREFIXES.COMPANY),
        customerId,
        invoiceNumber,
        currency,
        totalAmount,
        taxAmount,
        openAmount,
        status,
        options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    ]);

    // Insert invoice lines
    const lines = options.lines || [{
        accountId: ACCOUNT_IDS.REVENUE,
        description: 'Test Product/Service',
        quantity: 1,
        unitPrice: totalAmount,
        taxRate: taxRate
    }];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineAmount = line.quantity * line.unitPrice;

        await c.query(`
      insert into ${q(schema, "invoice_lines")} (
        id, invoice_id, line_number, account_id, description,
        quantity, unit_price, tax_rate, line_amount
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (id) do nothing
    `, [
            `${id}_line_${i + 1}`,
            id,
            i + 1,
            line.accountId,
            line.description,
            line.quantity,
            line.unitPrice,
            line.taxRate || 0,
            lineAmount
        ]);
    }

    return { id, invoiceNumber, totalAmount: openAmount, openAmount };
}

export interface BillBuilderOptions {
    id?: string;
    supplierId?: string;
    currency?: Currency;
    totalAmount?: number;
    taxRate?: number;
    status?: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'CANCELLED';
    dueDate?: Date;
    lines?: Array<{
        accountId: string;
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate?: number;
    }>;
}

export async function buildBill(
    c: PoolClient,
    schema: string,
    options: BillBuilderOptions
): Promise<{ id: string; billNumber: string; totalAmount: number; openAmount: number }> {
    const id = options.id || generateDeterministicId(ID_PREFIXES.BILL);
    const billNumber = `BILL-${id.split('_').pop()}`;
    const supplierId = options.supplierId || generateDeterministicId(ID_PREFIXES.SUPPLIER);
    const currency = options.currency || CURRENCIES.MYR;
    const totalAmount = options.totalAmount || 1000;
    const taxRate = options.taxRate || 0.1;
    const taxAmount = totalAmount * taxRate;
    const openAmount = totalAmount + taxAmount;
    const status = options.status || 'DRAFT';

    // Insert bill
    await c.query(`
    insert into ${q(schema, "bills")} (
      id, tenant_id, company_id, supplier_id, bill_number, currency,
      total_amount, tax_amount, open_amount, status, due_date
    )
    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    on conflict (id) do nothing
  `, [
        id,
        generateDeterministicId(ID_PREFIXES.TENANT),
        generateDeterministicId(ID_PREFIXES.COMPANY),
        supplierId,
        billNumber,
        currency,
        totalAmount,
        taxAmount,
        openAmount,
        status,
        options.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    ]);

    // Insert bill lines
    const lines = options.lines || [{
        accountId: ACCOUNT_IDS.COGS,
        description: 'Test Product/Service',
        quantity: 1,
        unitPrice: totalAmount,
        taxRate: taxRate
    }];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineAmount = line.quantity * line.unitPrice;

        await c.query(`
      insert into ${q(schema, "bill_lines")} (
        id, bill_id, line_number, account_id, description,
        quantity, unit_price, tax_rate, line_amount
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      on conflict (id) do nothing
    `, [
            `${id}_line_${i + 1}`,
            id,
            i + 1,
            line.accountId,
            line.description,
            line.quantity,
            line.unitPrice,
            line.taxRate || 0,
            lineAmount
        ]);
    }

    return { id, billNumber, totalAmount: openAmount, openAmount };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getBankAccountForCurrency(currency: Currency): string {
    const bankAccounts = {
        [CURRENCIES.MYR]: 'bank_myr_001',
        [CURRENCIES.USD]: 'bank_usd_001',
        [CURRENCIES.EUR]: 'bank_eur_001',
        [CURRENCIES.SGD]: 'bank_sgd_001'
    };
    return bankAccounts[currency] || 'bank_myr_001';
}

export function getCustomerForCurrency(currency: Currency): string {
    const customers = {
        [CURRENCIES.MYR]: generateDeterministicId(ID_PREFIXES.CUSTOMER, 1),
        [CURRENCIES.USD]: generateDeterministicId(ID_PREFIXES.CUSTOMER, 2),
        [CURRENCIES.EUR]: generateDeterministicId(ID_PREFIXES.CUSTOMER, 3)
    };
    return customers[currency] || generateDeterministicId(ID_PREFIXES.CUSTOMER, 1);
}

export function getSupplierForCurrency(currency: Currency): string {
    const suppliers = {
        [CURRENCIES.MYR]: generateDeterministicId(ID_PREFIXES.SUPPLIER, 1),
        [CURRENCIES.USD]: generateDeterministicId(ID_PREFIXES.SUPPLIER, 2),
        [CURRENCIES.EUR]: generateDeterministicId(ID_PREFIXES.SUPPLIER, 3)
    };
    return suppliers[currency] || generateDeterministicId(ID_PREFIXES.SUPPLIER, 1);
}

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================

export async function seedCore(ctx: SeedCtx): Promise<EnhancedSeededData> {
    return seedEnhanced(ctx);
}
