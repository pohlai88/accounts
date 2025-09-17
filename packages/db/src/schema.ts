import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  boolean,
  jsonb,
  index,
} from "drizzle-orm/pg-core";

// Core tenant structure
export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    featureFlags: jsonb("feature_flags").notNull().default({
      attachments: true,
      reports: true,
      ar: true,
      ap: false,
      je: false,
      regulated_mode: false,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    featureFlagsIdx: index("tenants_feature_flags_gin").on(table.featureFlags),
  }),
);

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    name: text("name").notNull(),
    code: text("code").notNull(),
    baseCurrency: text("base_currency").notNull().default("MYR"),
    fiscalYearEnd: text("fiscal_year_end").notNull().default("12-31"),
    policySettings: jsonb("policy_settings").notNull().default({
      approval_threshold_rm: 50000,
      export_requires_reason: false,
      mfa_required_for_admin: true,
      session_timeout_minutes: 480,
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("companies_tenant_company_idx").on(table.tenantId, table.code),
    policySettingsIdx: index("companies_policy_settings_gin").on(table.policySettings),
  }),
);

// Company Settings for Default Accounts
export const companySettings = pgTable(
  "company_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    // Default GL Accounts
    defaultArAccountId: uuid("default_ar_account_id")
      .references(() => chartOfAccounts.id),
    defaultApAccountId: uuid("default_ap_account_id")
      .references(() => chartOfAccounts.id),
    defaultBankAccountId: uuid("default_bank_account_id")
      .references(() => chartOfAccounts.id),
    defaultCashAccountId: uuid("default_cash_account_id")
      .references(() => chartOfAccounts.id),
    // Tax Settings
    defaultTaxAccountId: uuid("default_tax_account_id")
      .references(() => chartOfAccounts.id),
    // Other Settings
    autoPostInvoices: boolean("auto_post_invoices").notNull().default(false),
    requireApprovalForPosting: boolean("require_approval_for_posting").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("company_settings_tenant_company_idx").on(table.tenantId, table.companyId),
    arAccountIdx: index("company_settings_ar_account_idx").on(table.defaultArAccountId),
  }),
);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id").references(() => companies.id),
    role: text("role").notNull(),
    permissions: jsonb("permissions"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    userTenantIdx: index("memberships_user_tenant_idx").on(table.userId, table.tenantId),
    permissionsIdx: index("memberships_permissions_gin").on(table.permissions),
  }),
);

// Currency and FX
export const currencies = pgTable("currencies", {
  code: text("code").primaryKey(), // MYR, USD, SGD, etc.
  name: text("name").notNull(),
  symbol: text("symbol").notNull(),
  decimalPlaces: numeric("decimal_places").notNull().default("2"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const fxRates = pgTable(
  "fx_rates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromCurrency: text("from_currency")
      .notNull()
      .references(() => currencies.code),
    toCurrency: text("to_currency")
      .notNull()
      .references(() => currencies.code),
    rate: numeric("rate", { precision: 18, scale: 8 }).notNull(),
    source: text("source").notNull(), // "primary", "fallback"
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    currencyDateIdx: index("fx_rates_currency_date_idx").on(
      table.fromCurrency,
      table.toCurrency,
      table.validFrom,
    ),
  }),
);

// Chart of Accounts
export const chartOfAccounts = pgTable(
  "chart_of_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    code: text("code").notNull(),
    name: text("name").notNull(),
    accountType: text("account_type").notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    parentId: uuid("parent_id"),
    level: numeric("level").notNull().default("0"),
    isActive: boolean("is_active").notNull().default(true),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyCodeIdx: index("coa_tenant_company_code_idx").on(
      table.tenantId,
      table.companyId,
      table.code,
    ),
  }),
);

// Add self-reference after table definition
export const chartOfAccountsRelations = {
  parent: chartOfAccounts.parentId,
};

// Journals (Enhanced with V1 requirements)
export const journals = pgTable(
  "gl_journal",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    journalNumber: text("journal_number").notNull(),
    description: text("description"),
    journalDate: timestamp("journal_date", { withTimezone: true }).notNull(),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).default("1"),
    totalDebit: numeric("total_debit", { precision: 18, scale: 2 }).notNull().default("0"),
    totalCredit: numeric("total_credit", { precision: 18, scale: 2 }).notNull().default("0"),
    status: text("status").notNull().default("draft"), // draft, posted, reversed
    createdBy: uuid("created_by").references(() => users.id),
    postedBy: uuid("posted_by").references(() => users.id),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyDateIdx: index("journals_tenant_company_date_idx").on(
      table.tenantId,
      table.companyId,
      table.journalDate,
    ),
  }),
);

export const journalLines = pgTable(
  "gl_journal_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    journalId: uuid("journal_id")
      .notNull()
      .references(() => journals.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    debit: numeric("debit", { precision: 18, scale: 2 }).notNull().default("0"),
    credit: numeric("credit", { precision: 18, scale: 2 }).notNull().default("0"),
    description: text("description"),
    reference: text("reference"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    journalAccountIdx: index("journal_lines_journal_account_idx").on(
      table.journalId,
      table.accountId,
    ),
  }),
);

// Idempotency (V1 Critical Requirement)
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: text("key").primaryKey(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    requestHash: text("request_hash").notNull(),
    response: jsonb("response"),
    status: text("status").notNull().default("processing"), // processing, completed, failed
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  table => ({
    tenantKeyIdx: index("idempotency_tenant_key_idx").on(table.tenantId, table.key),
  }),
);

// AR (Accounts Receivable) - D2 Implementation
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    customerNumber: text("customer_number").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    billingAddress: jsonb("billing_address"), // {street, city, state, postal_code, country}
    shippingAddress: jsonb("shipping_address"),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    paymentTerms: text("payment_terms").notNull().default("NET_30"), // NET_30, NET_15, COD, etc.
    creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }).default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyNumberIdx: index("customers_tenant_company_number_idx").on(
      table.tenantId,
      table.companyId,
      table.customerNumber,
    ),
    tenantCompanyEmailIdx: index("customers_tenant_company_email_idx").on(
      table.tenantId,
      table.companyId,
      table.email,
    ),
  }),
);

export const invoices = pgTable(
  "ar_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id),
    invoiceNumber: text("invoice_number").notNull(),
    invoiceDate: timestamp("invoice_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
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
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyNumberIdx: index("invoices_tenant_company_number_idx").on(
      table.tenantId,
      table.companyId,
      table.invoiceNumber,
    ),
    tenantCompanyCustomerIdx: index("invoices_tenant_company_customer_idx").on(
      table.tenantId,
      table.companyId,
      table.customerId,
    ),
    tenantCompanyDateIdx: index("invoices_tenant_company_date_idx").on(
      table.tenantId,
      table.companyId,
      table.invoiceDate,
    ),
    statusIdx: index("invoices_status_idx").on(table.status),
    dueDateIdx: index("invoices_due_date_idx").on(table.dueDate),
  }),
);

export const invoiceLines = pgTable(
  "ar_invoice_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id),
    lineNumber: numeric("line_number").notNull(),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
    unitPrice: numeric("unit_price", { precision: 18, scale: 4 }).notNull(),
    lineAmount: numeric("line_amount", { precision: 18, scale: 2 }).notNull(),
    taxCode: text("tax_code"), // GST, SST, VAT, etc.
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0"), // 0.06 for 6% GST
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).notNull().default("0"),
    revenueAccountId: uuid("revenue_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    invoiceLineIdx: index("invoice_lines_invoice_line_idx").on(table.invoiceId, table.lineNumber),
  }),
);

// Tax Codes for AR/AP
export const taxCodes = pgTable(
  "tax_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    code: text("code").notNull(), // GST, SST, VAT, etc.
    name: text("name").notNull(),
    rate: numeric("rate", { precision: 5, scale: 4 }).notNull(), // 0.06 for 6%
    taxType: text("tax_type").notNull(), // INPUT, OUTPUT, EXEMPT
    taxAccountId: uuid("tax_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyCodeIdx: index("tax_codes_tenant_company_code_idx").on(
      table.tenantId,
      table.companyId,
      table.code,
    ),
  }),
);

// AP (Accounts Payable) - D3 Implementation
export const suppliers = pgTable(
  "suppliers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    supplierNumber: text("supplier_number").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    billingAddress: jsonb("billing_address"),
    shippingAddress: jsonb("shipping_address"),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    paymentTerms: text("payment_terms").notNull().default("NET_30"),
    creditLimit: numeric("credit_limit", { precision: 18, scale: 2 }).default("0"),
    taxId: text("tax_id"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyNumberIdx: index("suppliers_tenant_company_number_idx").on(
      table.tenantId,
      table.companyId,
      table.supplierNumber,
    ),
    tenantCompanyEmailIdx: index("suppliers_tenant_company_email_idx").on(
      table.tenantId,
      table.companyId,
      table.email,
    ),
  }),
);

export const bills = pgTable(
  "ap_bills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    supplierId: uuid("supplier_id")
      .notNull()
      .references(() => suppliers.id),
    billNumber: text("bill_number").notNull(),
    supplierInvoiceNumber: text("supplier_invoice_number"),
    billDate: timestamp("bill_date", { withTimezone: true }).notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).default("1"),
    subtotal: numeric("subtotal", { precision: 18, scale: 2 }).default("0").notNull(),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0").notNull(),
    totalAmount: numeric("total_amount", { precision: 18, scale: 2 }).default("0").notNull(),
    paidAmount: numeric("paid_amount", { precision: 18, scale: 2 }).default("0").notNull(),
    balanceAmount: numeric("balance_amount", { precision: 18, scale: 2 }).default("0").notNull(),
    status: text("status").default("draft").notNull(),
    description: text("description"),
    notes: text("notes"),
    journalId: uuid("journal_id").references(() => journals.id),
    createdBy: uuid("created_by").references(() => users.id),
    postedBy: uuid("posted_by").references(() => users.id),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyNumberIdx: index("bills_tenant_company_number_idx").on(
      table.tenantId,
      table.companyId,
      table.billNumber,
    ),
    tenantCompanySupplierIdx: index("bills_tenant_company_supplier_idx").on(
      table.tenantId,
      table.companyId,
      table.supplierId,
    ),
    tenantCompanyDateIdx: index("bills_tenant_company_date_idx").on(
      table.tenantId,
      table.companyId,
      table.billDate,
    ),
    statusIdx: index("bills_status_idx").on(table.status),
    dueDateIdx: index("bills_due_date_idx").on(table.dueDate),
  }),
);

export const billLines = pgTable(
  "ap_bill_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    billId: uuid("bill_id")
      .notNull()
      .references(() => bills.id),
    lineNumber: numeric("line_number").notNull(),
    description: text("description").notNull(),
    quantity: numeric("quantity", { precision: 18, scale: 4 }).default("1").notNull(),
    unitPrice: numeric("unit_price", { precision: 18, scale: 4 }).notNull(),
    lineAmount: numeric("line_amount", { precision: 18, scale: 2 }).notNull(),
    taxCode: text("tax_code"),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).default("0"),
    taxAmount: numeric("tax_amount", { precision: 18, scale: 2 }).default("0").notNull(),
    expenseAccountId: uuid("expense_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    billLineIdx: index("bill_lines_bill_line_idx").on(table.billId, table.lineNumber),
  }),
);

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    accountNumber: text("account_number").notNull(),
    accountName: text("account_name").notNull(),
    bankName: text("bank_name").notNull(),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    accountType: text("account_type").default("CHECKING").notNull(),
    glAccountId: uuid("gl_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("bank_accounts_tenant_company_idx").on(table.tenantId, table.companyId),
  }),
);

export const bankTransactions = pgTable(
  "bank_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id),
    transactionDate: timestamp("transaction_date", { withTimezone: true }).notNull(),
    description: text("description").notNull(),
    reference: text("reference"),
    debitAmount: numeric("debit_amount", { precision: 18, scale: 2 }).default("0").notNull(),
    creditAmount: numeric("credit_amount", { precision: 18, scale: 2 }).default("0").notNull(),
    balance: numeric("balance", { precision: 18, scale: 2 }),
    transactionType: text("transaction_type"),
    isMatched: boolean("is_matched").notNull().default(false),
    matchedPaymentId: uuid("matched_payment_id"),
    importBatchId: text("import_batch_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    accountDateIdx: index("bank_transactions_account_date_idx").on(
      table.bankAccountId,
      table.transactionDate,
    ),
    matchedIdx: index("bank_transactions_matched_idx").on(table.isMatched),
  }),
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    paymentNumber: text("payment_number").notNull(),
    paymentDate: timestamp("payment_date", { withTimezone: true }).notNull(),
    paymentMethod: text("payment_method").notNull(),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id),
    supplierId: uuid("supplier_id").references(() => suppliers.id),
    customerId: uuid("customer_id").references(() => customers.id),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).default("1"),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    reference: text("reference"),
    description: text("description"),
    status: text("status").default("draft").notNull(),
    journalId: uuid("journal_id").references(() => journals.id),
    createdBy: uuid("created_by").references(() => users.id),
    postedBy: uuid("posted_by").references(() => users.id),
    postedAt: timestamp("posted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyNumberIdx: index("payments_tenant_company_number_idx").on(
      table.tenantId,
      table.companyId,
      table.paymentNumber,
    ),
    tenantCompanyDateIdx: index("payments_tenant_company_date_idx").on(
      table.tenantId,
      table.companyId,
      table.paymentDate,
    ),
    statusIdx: index("payments_status_idx").on(table.status),
  }),
);

export const paymentAllocations = pgTable(
  "payment_allocations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    billId: uuid("bill_id").references(() => bills.id),
    invoiceId: uuid("invoice_id").references(() => invoices.id),
    allocatedAmount: numeric("allocated_amount", { precision: 18, scale: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    paymentIdx: index("payment_allocations_payment_idx").on(table.paymentId),
  }),
);

// Financial Reporting & Period Management - D4 Implementation
export const fiscalCalendars = pgTable(
  "fiscal_calendars",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    calendarName: text("calendar_name").notNull(),
    fiscalYearStart: timestamp("fiscal_year_start", { withTimezone: false }).notNull(),
    fiscalYearEnd: timestamp("fiscal_year_end", { withTimezone: false }).notNull(),
    periodType: text("period_type").notNull().default("MONTHLY"),
    numberOfPeriods: numeric("number_of_periods").notNull().default("12"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("fiscal_calendars_tenant_company_idx").on(
      table.tenantId,
      table.companyId,
    ),
    fiscalYearIdx: index("fiscal_calendars_fiscal_year_idx").on(
      table.fiscalYearStart,
      table.fiscalYearEnd,
    ),
  }),
);

export const fiscalPeriods = pgTable(
  "fiscal_periods",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    fiscalCalendarId: uuid("fiscal_calendar_id")
      .notNull()
      .references(() => fiscalCalendars.id),
    periodNumber: numeric("period_number").notNull(),
    periodName: text("period_name").notNull(),
    startDate: timestamp("start_date", { withTimezone: false }).notNull(),
    endDate: timestamp("end_date", { withTimezone: false }).notNull(),
    fiscalYear: numeric("fiscal_year").notNull(),
    quarter: numeric("quarter"),
    status: text("status").notNull().default("OPEN"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedBy: uuid("closed_by").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("fiscal_periods_tenant_company_idx").on(
      table.tenantId,
      table.companyId,
    ),
    calendarPeriodIdx: index("fiscal_periods_calendar_period_idx").on(
      table.fiscalCalendarId,
      table.periodNumber,
    ),
    dateRangeIdx: index("fiscal_periods_date_range_idx").on(table.startDate, table.endDate),
    statusIdx: index("fiscal_periods_status_idx").on(table.status),
    fiscalYearIdx: index("fiscal_periods_fiscal_year_idx").on(table.fiscalYear),
  }),
);

export const periodLocks = pgTable(
  "period_locks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    fiscalPeriodId: uuid("fiscal_period_id")
      .notNull()
      .references(() => fiscalPeriods.id),
    lockType: text("lock_type").notNull(),
    lockedAt: timestamp("locked_at", { withTimezone: true }).defaultNow(),
    lockedBy: uuid("locked_by")
      .notNull()
      .references(() => users.id),
    unlockRequestedAt: timestamp("unlock_requested_at", { withTimezone: true }),
    unlockRequestedBy: uuid("unlock_requested_by").references(() => users.id),
    unlockApprovedAt: timestamp("unlock_approved_at", { withTimezone: true }),
    unlockApprovedBy: uuid("unlock_approved_by").references(() => users.id),
    reason: text("reason"),
    isActive: boolean("is_active").notNull().default(true),
  },
  table => ({
    tenantCompanyIdx: index("period_locks_tenant_company_idx").on(table.tenantId, table.companyId),
    periodTypeIdx: index("period_locks_period_type_idx").on(table.fiscalPeriodId, table.lockType),
    activeIdx: index("period_locks_active_idx").on(table.isActive),
  }),
);

export const reversingEntries = pgTable(
  "reversing_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    originalJournalId: uuid("original_journal_id")
      .notNull()
      .references(() => journals.id),
    reversingJournalId: uuid("reversing_journal_id").references(() => journals.id),
    reversalDate: timestamp("reversal_date", { withTimezone: false }).notNull(),
    reversalReason: text("reversal_reason").notNull(),
    status: text("status").notNull().default("PENDING"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  table => ({
    tenantCompanyIdx: index("reversing_entries_tenant_company_idx").on(
      table.tenantId,
      table.companyId,
    ),
    originalJournalIdx: index("reversing_entries_original_journal_idx").on(table.originalJournalId),
    reversalDateIdx: index("reversing_entries_reversal_date_idx").on(table.reversalDate),
    statusIdx: index("reversing_entries_status_idx").on(table.status),
  }),
);

export const reportCache = pgTable(
  "report_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    reportType: text("report_type").notNull(),
    reportParameters: jsonb("report_parameters").notNull(),
    reportData: jsonb("report_data").notNull(),
    generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    cacheKey: text("cache_key").notNull(),
  },
  table => ({
    tenantCompanyIdx: index("report_cache_tenant_company_idx").on(table.tenantId, table.companyId),
    typeKeyIdx: index("report_cache_type_key_idx").on(table.reportType, table.cacheKey),
    expiresIdx: index("report_cache_expires_idx").on(table.expiresAt),
  }),
);

export const reportDefinitions = pgTable(
  "report_definitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    reportName: text("report_name").notNull(),
    reportType: text("report_type").notNull(),
    reportConfig: jsonb("report_config").notNull(),
    isDefault: boolean("is_default").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("report_definitions_tenant_company_idx").on(
      table.tenantId,
      table.companyId,
    ),
    typeIdx: index("report_definitions_type_idx").on(table.reportType),
    activeIdx: index("report_definitions_active_idx").on(table.isActive),
  }),
);

// Audit Logs (V1 Compliance Requirement)
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantEntityIdx: index("audit_logs_tenant_entity_idx").on(
      table.tenantId,
      table.entityType,
      table.entityId,
    ),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
  }),
);

// Approval Workflow Tables
export const approvalWorkflows = pgTable(
  "approval_workflows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    name: text("name").notNull(),
    description: text("description"),
    entityType: text("entity_type").notNull(), // "INVOICE", "BILL", "PAYMENT", "JOURNAL_ENTRY"
    conditions: jsonb("conditions").notNull().default({}), // Approval conditions (amount thresholds, etc.)
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("approval_workflows_tenant_company_idx").on(table.tenantId, table.companyId),
    entityTypeIdx: index("approval_workflows_entity_type_idx").on(table.entityType),
    activeIdx: index("approval_workflows_active_idx").on(table.isActive),
  }),
);

export const approvalWorkflowSteps = pgTable(
  "approval_workflow_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => approvalWorkflows.id, { onDelete: "cascade" }),
    stepOrder: numeric("step_order").notNull(),
    stepName: text("step_name").notNull(),
    approverType: text("approver_type").notNull(), // "USER", "ROLE", "MANAGER", "CUSTOM"
    approverId: uuid("approver_id"), // User ID or Role ID
    approverEmail: text("approver_email"), // For external approvers
    isRequired: boolean("is_required").notNull().default(true),
    timeoutHours: numeric("timeout_hours"), // Auto-approve after timeout
    conditions: jsonb("conditions").notNull().default({}), // Step-specific conditions
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    workflowIdx: index("approval_workflow_steps_workflow_idx").on(table.workflowId),
    stepOrderIdx: index("approval_workflow_steps_order_idx").on(table.workflowId, table.stepOrder),
    approverIdx: index("approval_workflow_steps_approver_idx").on(table.approverId),
  }),
);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    workflowId: uuid("workflow_id")
      .notNull()
      .references(() => approvalWorkflows.id),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // ID of the invoice, bill, etc.
    entityData: jsonb("entity_data").notNull(), // Snapshot of the entity data
    requestedBy: uuid("requested_by").notNull(), // User who requested approval
    status: text("status").notNull().default("PENDING"), // "PENDING", "APPROVED", "REJECTED", "CANCELLED", "EXPIRED"
    currentStepId: uuid("current_step_id")
      .references(() => approvalWorkflowSteps.id),
    priority: text("priority").notNull().default("NORMAL"), // "LOW", "NORMAL", "HIGH", "URGENT"
    dueDate: timestamp("due_date", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  table => ({
    tenantCompanyIdx: index("approval_requests_tenant_company_idx").on(table.tenantId, table.companyId),
    workflowIdx: index("approval_requests_workflow_idx").on(table.workflowId),
    entityIdx: index("approval_requests_entity_idx").on(table.entityType, table.entityId),
    statusIdx: index("approval_requests_status_idx").on(table.status),
    requestedByIdx: index("approval_requests_requested_by_idx").on(table.requestedBy),
    dueDateIdx: index("approval_requests_due_date_idx").on(table.dueDate),
    createdAtIdx: index("approval_requests_created_at_idx").on(table.createdAt),
  }),
);

export const approvalActions = pgTable(
  "approval_actions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => approvalRequests.id, { onDelete: "cascade" }),
    stepId: uuid("step_id")
      .notNull()
      .references(() => approvalWorkflowSteps.id),
    action: text("action").notNull(), // "APPROVE", "REJECT", "DELEGATE", "REQUEST_INFO"
    performedBy: uuid("performed_by").notNull(), // User who performed the action
    performedAt: timestamp("performed_at", { withTimezone: true }).defaultNow(),
    comments: text("comments"),
    metadata: jsonb("metadata").notNull().default({}),
  },
  table => ({
    requestIdx: index("approval_actions_request_idx").on(table.requestId),
    stepIdx: index("approval_actions_step_idx").on(table.stepId),
    performedByIdx: index("approval_actions_performed_by_idx").on(table.performedBy),
    performedAtIdx: index("approval_actions_performed_at_idx").on(table.performedAt),
  }),
);

export const approvalDelegations = pgTable(
  "approval_delegations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    delegatorId: uuid("delegator_id").notNull(), // User who is delegating
    delegateId: uuid("delegate_id").notNull(), // User who will receive the delegation
    entityTypes: jsonb("entity_types").notNull(), // Array of entity types this delegation applies to
    conditions: jsonb("conditions").notNull().default({}), // Conditions for when delegation applies
    isActive: boolean("is_active").notNull().default(true),
    validFrom: timestamp("valid_from", { withTimezone: true }).notNull(),
    validTo: timestamp("valid_to", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("approval_delegations_tenant_company_idx").on(table.tenantId, table.companyId),
    delegatorIdx: index("approval_delegations_delegator_idx").on(table.delegatorId),
    delegateIdx: index("approval_delegations_delegate_idx").on(table.delegateId),
    activeIdx: index("approval_delegations_active_idx").on(table.isActive),
    validFromIdx: index("approval_delegations_valid_from_idx").on(table.validFrom),
  }),
);

// Enhanced Payment Processing Tables

export const advanceAccounts = pgTable(
  "advance_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    accountId: uuid("account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    partyType: text("party_type")
      .notNull()
      .$type<"CUSTOMER" | "SUPPLIER">(),
    partyId: uuid("party_id").notNull(),
    currency: text("currency")
      .notNull()
      .references(() => currencies.code),
    balanceAmount: numeric("balance_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("advance_accounts_tenant_company_idx").on(
      table.tenantId,
      table.companyId,
    ),
    partyIdx: index("advance_accounts_party_idx").on(
      table.tenantId,
      table.companyId,
      table.partyType,
      table.partyId,
    ),
    uniquePartyCurrency: index("advance_accounts_unique_party_currency").on(
      table.tenantId,
      table.companyId,
      table.partyType,
      table.partyId,
      table.currency,
    ),
  }),
);

export const bankChargeConfigs = pgTable(
  "bank_charge_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    bankAccountId: uuid("bank_account_id")
      .notNull()
      .references(() => bankAccounts.id),
    chargeType: text("charge_type")
      .notNull()
      .$type<"FIXED" | "PERCENTAGE" | "TIERED">(),
    fixedAmount: numeric("fixed_amount", { precision: 18, scale: 2 }),
    percentageRate: numeric("percentage_rate", { precision: 5, scale: 4 }),
    minAmount: numeric("min_amount", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    maxAmount: numeric("max_amount", { precision: 18, scale: 2 }),
    expenseAccountId: uuid("expense_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("bank_charge_configs_tenant_company_idx").on(
      table.tenantId,
      table.companyId,
    ),
    bankAccountIdx: index("bank_charge_configs_bank_account_idx").on(
      table.tenantId,
      table.companyId,
      table.bankAccountId,
    ),
  }),
);

export const withholdingTaxConfigs = pgTable(
  "withholding_tax_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id),
    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id),
    taxCode: text("tax_code").notNull(),
    taxName: text("tax_name").notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 }).notNull(),
    payableAccountId: uuid("payable_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    expenseAccountId: uuid("expense_account_id")
      .notNull()
      .references(() => chartOfAccounts.id),
    applicableTo: text("applicable_to")
      .notNull()
      .$type<"SUPPLIERS" | "CUSTOMERS" | "BOTH">(),
    minThreshold: numeric("min_threshold", { precision: 18, scale: 2 })
      .notNull()
      .default("0"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  table => ({
    tenantCompanyIdx: index("withholding_tax_configs_tenant_company_idx").on(
      table.tenantId,
      table.companyId,
    ),
    taxCodeIdx: index("withholding_tax_configs_tax_code_idx").on(
      table.tenantId,
      table.companyId,
      table.taxCode,
    ),
  }),
);

// Re-export attachment schema for V1 compliance
export * from "./schema-attachments.js";

// Re-export user settings schema for multi-tenant support
export * from "./schema-user-settings.js";

// Re-export subscription and usage tracking schemas
export * from "./schema-subscriptions.js";
