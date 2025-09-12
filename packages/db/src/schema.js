import { pgTable, uuid, text, timestamp, numeric, boolean, jsonb, index } from "drizzle-orm/pg-core";
// Core tenant structure
export const tenants = pgTable("tenants", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
export const companies = pgTable("companies", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    name: text("name").notNull(),
    code: text("code").notNull(),
    baseCurrency: text("base_currency").notNull().default("MYR"),
    fiscalYearEnd: text("fiscal_year_end").notNull().default("12-31"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantCompanyIdx: index("companies_tenant_company_idx").on(table.tenantId, table.code)
}));
export const users = pgTable("users", {
    id: uuid("id").primaryKey(),
    email: text("email").notNull().unique(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
export const memberships = pgTable("memberships", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    companyId: uuid("company_id").references(() => companies.id),
    role: text("role").notNull(),
    permissions: jsonb("permissions"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    userTenantIdx: index("memberships_user_tenant_idx").on(table.userId, table.tenantId)
}));
// Currency and FX
export const currencies = pgTable("currencies", {
    code: text("code").primaryKey(), // MYR, USD, SGD, etc.
    name: text("name").notNull(),
    symbol: text("symbol").notNull(),
    decimalPlaces: numeric("decimal_places").notNull().default("2"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});
export const fxRates = pgTable("fx_rates", {
    id: uuid("id").primaryKey().defaultRandom(),
    fromCurrency: text("from_currency").notNull().references(() => currencies.code),
    toCurrency: text("to_currency").notNull().references(() => currencies.code),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    source: text("source").notNull(), // "primary", "fallback"
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    currencyDateIdx: index("fx_rates_currency_date_idx").on(table.fromCurrency, table.toCurrency, table.validFrom)
}));
// Chart of Accounts
export const chartOfAccounts = pgTable("chart_of_accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    accountType: text("account_type").notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    parentId: uuid("parent_id"),
    level: numeric("level").notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    currency: text("currency").notNull().references(() => currencies.code),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantCompanyCodeIdx: index("coa_tenant_company_code_idx").on(table.tenantId, table.companyId, table.code)
}));
// Add self-reference after table definition
export const chartOfAccountsRelations = {
    parent: chartOfAccounts.parentId
};
// Journals (Enhanced with V1 requirements)
export const journals = pgTable("gl_journal", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    journalNumber: text("journal_number").notNull(),
    description: text("description"),
    journalDate: timestamp("journal_date", { withTimezone: true }).notNull(),
    currency: text("currency").notNull().references(() => currencies.code),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).default("1"),
    totalDebit: numeric("total_debit", { precision: 18, scale: 2 }).notNull().default("0"),
    totalCredit: numeric("total_credit", { precision: 18, scale: 2 }).notNull().default("0"),
    status: text("status").notNull().default("draft"), // draft, posted, reversed
    createdBy: uuid("created_by").references(() => users.id),
    postedBy: uuid("posted_by").references(() => users.id),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantCompanyDateIdx: index("journals_tenant_company_date_idx").on(table.tenantId, table.companyId, table.journalDate)
}));
export const journalLines = pgTable("gl_journal_lines", {
    id: uuid("id").primaryKey().defaultRandom(),
    journalId: uuid("journal_id").notNull().references(() => journals.id),
    accountId: uuid("account_id").notNull().references(() => chartOfAccounts.id),
    debit: numeric("debit", { precision: 18, scale: 2 }).notNull().default("0"),
    credit: numeric("credit", { precision: 18, scale: 2 }).notNull().default("0"),
    description: text("description"),
    reference: text("reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    journalAccountIdx: index("journal_lines_journal_account_idx").on(table.journalId, table.accountId)
}));
// Idempotency (V1 Critical Requirement)
export const idempotencyKeys = pgTable("idempotency_keys", {
    key: text("key").primaryKey(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    requestHash: text("request_hash").notNull(),
    response: jsonb("response"),
    status: text("status").notNull().default("processing"), // processing, completed, failed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull()
}, (table) => ({
    tenantKeyIdx: index("idempotency_tenant_key_idx").on(table.tenantId, table.key)
}));
// AR (Accounts Receivable) - D2 Implementation
export const customers = pgTable("customers", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    customerNumber: text("customer_number").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    billingAddress: jsonb("billing_address"), // {street, city, state, postal_code, country}
    shippingAddress: jsonb("shipping_address"),
    currency: text("currency").notNull().references(() => currencies.code),
    paymentTerms: text("payment_terms").notNull().default("NET_30"), // NET_30, NET_15, COD, etc.
    creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }).default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantCompanyNumberIdx: index("customers_tenant_company_number_idx").on(table.tenantId, table.companyId, table.customerNumber),
    tenantCompanyEmailIdx: index("customers_tenant_company_email_idx").on(table.tenantId, table.companyId, table.email)
}));
export const invoices = pgTable("ar_invoices", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    customerId: uuid("customer_id").notNull().references(() => customers.id),
    invoiceNumber: text("invoice_number").notNull(),
    invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    currency: text("currency").notNull().references(() => currencies.code),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).default("1"),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).notNull().default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    balanceAmount: numeric("balance_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
    description: text("description"),
    notes: text("notes"),
    journalId: uuid("journal_id").references(() => journals.id), // GL posting reference
    createdBy: uuid("created_by").references(() => users.id),
    postedBy: uuid("posted_by").references(() => users.id),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantCompanyNumberIdx: index("invoices_tenant_company_number_idx").on(table.tenantId, table.companyId, table.invoiceNumber),
    tenantCompanyCustomerIdx: index("invoices_tenant_company_customer_idx").on(table.tenantId, table.companyId, table.customerId),
    tenantCompanyDateIdx: index("invoices_tenant_company_date_idx").on(table.tenantId, table.companyId, table.invoiceDate),
    statusIdx: index("invoices_status_idx").on(table.status),
    dueDateIdx: index("invoices_due_date_idx").on(table.dueDate)
}));
export const invoiceLines = pgTable("ar_invoice_lines", {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id").notNull().references(() => invoices.id),
    lineNumber: numeric("line_number").notNull(),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 4 }).notNull(),
    lineAmount: numeric("line_amount", { precision: 18, scale: 2 }).notNull(),
    taxCode: text("tax_code"), // GST, SST, VAT, etc.
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0"), // 0.06 for 6% GST
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    revenueAccountId: uuid("revenue_account_id").notNull().references(() => chartOfAccounts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    invoiceLineIdx: index("invoice_lines_invoice_line_idx").on(table.invoiceId, table.lineNumber)
}));
// Tax Codes for AR/AP
export const taxCodes = pgTable("tax_codes", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    code: text("code").notNull(), // GST, SST, VAT, etc.
    name: text("name").notNull(),
    rate: numeric("rate", { precision: 5, scale: 4 }).notNull(), // 0.06 for 6%
    taxType: text("tax_type").notNull(), // INPUT, OUTPUT, EXEMPT
    taxAccountId: uuid("tax_account_id").notNull().references(() => chartOfAccounts.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantCompanyCodeIdx: index("tax_codes_tenant_company_code_idx").on(table.tenantId, table.companyId, table.code)
}));
// Audit Logs (V1 Compliance Requirement)
export const auditLogs = pgTable("audit_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id),
    companyId: uuid("company_id").references(() => companies.id),
    userId: uuid("user_id").references(() => users.id),
    action: text("action").notNull(), // CREATE, UPDATE, DELETE, POST, REVERSE
    entityType: text("entity_type").notNull(), // JOURNAL, INVOICE, PAYMENT, etc.
    entityId: uuid("entity_id").notNull(),
    oldValues: jsonb("old_values"),
    newValues: jsonb("new_values"),
    metadata: jsonb("metadata"),
    requestId: text("request_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
}, (table) => ({
    tenantEntityIdx: index("audit_logs_tenant_entity_idx").on(table.tenantId, table.entityType, table.entityId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt)
}));
//# sourceMappingURL=schema.js.map