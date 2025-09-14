import { z } from "zod";

// ---------- Shared validators & helpers ----------
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const ISO_DATETIME = z.string().datetime();
const NonNeg = () => z.number().min(0).finite();
const Finite = () => z.number().finite();
const EPS = 0.005;
const near = (a: number, b: number, eps = EPS) => Math.abs(a - b) <= eps;

// Core accounting types based on industry standards
export const CurrencyCodeSchema = z.enum([
  "USD",
  "EUR",
  "GBP",
  "MYR",
  "JPY",
  "CAD",
  "AUD",
  "SGD",
  "CNY",
  "INR",
]);

// ERPNext-level account types for specialized business logic
export const AccountTypeSchema = z.enum([
  // Basic types
  "Asset",
  "Liability",
  "Equity",
  "Income",
  "Expense",
  // ERPNext specialized types
  "Bank",
  "Cash",
  "Receivable",
  "Payable",
  "Current Asset",
  "Fixed Asset",
  "Current Liability",
  "Direct Income",
  "Indirect Income",
  "Direct Expense",
  "Indirect Expense",
  "Cost of Goods Sold",
  "Stock",
  "Tax",
  "Round Off",
  "Accumulated Depreciation",
  "Depreciation",
  "Temporary",
]);

// ERPNext-level voucher types
export const VoucherTypeSchema = z.enum([
  "Sales Invoice",
  "Purchase Invoice",
  "Payment Entry",
  "Journal Entry",
  "Period Closing Voucher",
  "Opening Entry",
  "Bank Reconciliation",
  "Asset Depreciation",
  "Deferred Revenue",
  "Deferred Expense",
  "Exchange Rate Revaluation",
  "Stock Entry",
  "Landed Cost Voucher",
]);

// ERPNext-level GL Entry schema with comprehensive fields
export const GLEntrySchema = z
  .object({
    // Core identification
    id: z.string().uuid(),
    account_id: z.string().uuid(),
    company_id: z.string().uuid(),

    // Amounts (base currency)
    debit: NonNeg(),
    credit: NonNeg(),

    // Multi-currency support (3-tier system)
    account_currency: CurrencyCodeSchema,
    debit_in_account_currency: NonNeg(),
    credit_in_account_currency: NonNeg(),
    transaction_currency: CurrencyCodeSchema.optional(),
    debit_in_transaction_currency: NonNeg().optional(),
    credit_in_transaction_currency: NonNeg().optional(),
    // Semantics: transaction_exchange_rate converts transaction_currency -> account_currency
    transaction_exchange_rate: z.number().positive().finite().optional(),

    // Transaction details
    posting_date: ISO_DATE,
    voucher_type: VoucherTypeSchema,
    voucher_no: z.string().min(1),
    voucher_detail_no: z.string().optional(),

    // Against voucher tracking (ERPNext feature)
    against_voucher: z.string().optional(),
    against_voucher_type: VoucherTypeSchema.optional(),

    // Party information
    party_type: z.enum(["Customer", "Supplier", "Employee", "Other"]).optional(),
    party: z.string().optional(),

    // Dimensions (ERPNext accounting dimensions)
    cost_center: z.string().optional(),
    project: z.string().optional(),

    // Additional fields
    remarks: z.string().optional(),
    due_date: ISO_DATE.optional(),
    is_opening: z.boolean().default(false),
    is_advance: z.boolean().default(false),
    is_cancelled: z.boolean().default(false),

    // Finance book (multiple accounting standards)
    finance_book: z.string().optional(),

    // Fiscal year
    fiscal_year: z.string().optional(),

    // Audit trail
    created_at: ISO_DATETIME,
    created_by: z.string().uuid().optional(),
    modified_at: ISO_DATETIME.optional(),
    modified_by: z.string().uuid().optional(),
  })
  .strict()
  .superRefine((e, ctx) => {
    // XOR rule: one side positive, the other zero
    const hasDebit = e.debit > 0;
    const hasCredit = e.credit > 0;
    if ((hasDebit && hasCredit) || (!hasDebit && !hasCredit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["debit"],
        message: "Each GL entry must have debit XOR credit",
      });
    }
    // transaction fields must be complete and reconcile when provided
    const txAmt = (e.debit_in_transaction_currency ?? 0) + (e.credit_in_transaction_currency ?? 0);
    if (txAmt > 0) {
      if (!e.transaction_currency) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transaction_currency"],
          message: "transaction_currency required when transaction amounts are present",
        });
      }
      if (!e.transaction_exchange_rate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["transaction_exchange_rate"],
          message: "transaction_exchange_rate required when transaction amounts are present",
        });
      }
      // Reconcile: txn * rate ~= account-currency amount (per side if present)
      if (e.debit_in_transaction_currency != null) {
        const expected = e.debit_in_transaction_currency * (e.transaction_exchange_rate ?? 1);
        if (!near(expected, e.debit_in_account_currency)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["debit_in_account_currency"],
            message:
              "debit_in_account_currency must equal debit_in_transaction_currency * transaction_exchange_rate (±ε)",
          });
        }
      }
      if (e.credit_in_transaction_currency != null) {
        const expected = e.credit_in_transaction_currency * (e.transaction_exchange_rate ?? 1);
        if (!near(expected, e.credit_in_account_currency)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["credit_in_account_currency"],
            message:
              "credit_in_account_currency must equal credit_in_transaction_currency * transaction_exchange_rate (±ε)",
          });
        }
      }
    }
    // If against_voucher_type is provided, id must be provided
    if (e.against_voucher_type && !e.against_voucher) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["against_voucher"],
        message: "against_voucher is required when against_voucher_type is provided",
      });
    }
    // due_date >= posting_date
    if (e.due_date && e.due_date < e.posting_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["due_date"],
        message: "due_date cannot be before posting_date",
      });
    }
  });

// ERPNext-level Account schema with nested set and advanced features
export const AccountSchema = z
  .object({
    // Core identification
    id: z.string().uuid(),
    name: z.string().min(1),
    account_name: z.string().min(1), // ERPNext uses separate account_name
    account_number: z.string().optional(),
    account_code: z.string().optional(),

    // Hierarchy (nested set model for efficient queries)
    parent_account: z.string().uuid().optional(),
    lft: z.number().int().positive().optional(), // Left boundary
    rgt: z.number().int().positive().optional(), // Right boundary

    // Account classification
    account_type: AccountTypeSchema,
    root_type: z.enum(["Asset", "Liability", "Equity", "Income", "Expense"]),
    report_type: z.enum(["Balance Sheet", "Profit and Loss"]),

    // Currency and company
    account_currency: CurrencyCodeSchema,
    company_id: z.string().uuid(),

    // Account properties
    is_group: z.boolean(),
    is_active: z.boolean().default(true),
    disabled: z.boolean().default(false),

    // ERPNext advanced features
    freeze_account: z.boolean().default(false),
    balance_must_be: z.enum(["Debit", "Credit", ""]).optional(),
    include_in_gross: z.boolean().default(false),
    tax_rate: z.number().min(0).max(100).finite().optional(),

    // Audit trail
    created_at: ISO_DATETIME,
    updated_at: ISO_DATETIME,
  })
  .strict()
  .superRefine((a, ctx) => {
    if (a.lft != null && a.rgt != null && !(a.lft < a.rgt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rgt"],
        message: "rgt must be greater than lft",
      });
    }
  });

// ERPNext-level Company schema with fiscal year and multi-currency support
export const CompanySchema = z
  .object({
    // Core identification
    id: z.string().uuid(),
    name: z.string().min(1),
    abbr: z.string().min(1).max(10), // Company abbreviation for account naming

    // Currency settings
    default_currency: CurrencyCodeSchema,

    // Fiscal year settings
    fiscal_year_start: ISO_DATE,
    fiscal_year_end: ISO_DATE,

    // Location
    country: z.string().optional(),
    timezone: z.string().optional(),

    // Accounting settings
    enable_perpetual_inventory: z.boolean().default(false),
    default_finance_book: z.string().optional(),

    // Chart of Accounts
    chart_of_accounts: z.string().optional(),
    existing_company: z.string().optional(), // For copying COA

    // Contact information
    email: z.string().email().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),

    // Address
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postal_code: z.string().optional(),

    // Tax information
    tax_id: z.string().optional(),
    registration_details: z.string().optional(),

    // Audit trail
    created_at: ISO_DATETIME,
    updated_at: ISO_DATETIME,
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.fiscal_year_start > c.fiscal_year_end) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fiscal_year_end"],
        message: "fiscal_year_end must be on/after fiscal_year_start",
      });
    }
  });

// Additional ERPNext-inspired schemas
export const FiscalYearSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1), // e.g., "2024-2025"
    year_start_date: ISO_DATE,
    year_end_date: ISO_DATE,
    is_short_year: z.boolean().default(false),
    disabled: z.boolean().default(false),
    created_at: ISO_DATETIME,
    updated_at: ISO_DATETIME,
  })
  .strict()
  .superRefine((f, ctx) => {
    if (f.year_start_date > f.year_end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["year_end_date"],
        message: "year_end_date must be on/after year_start_date",
      });
    }
  });

export const CostCenterSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    cost_center_name: z.string().min(1),
    cost_center_number: z.string().optional(),
    parent_cost_center: z.string().uuid().optional(),
    company_id: z.string().uuid(),
    is_group: z.boolean(),
    disabled: z.boolean().default(false),
    lft: z.number().int().positive().optional(),
    rgt: z.number().int().positive().optional(),
    created_at: ISO_DATETIME,
    updated_at: ISO_DATETIME,
  })
  .strict()
  .superRefine((c, ctx) => {
    if (c.lft != null && c.rgt != null && !(c.lft < c.rgt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rgt"],
        message: "rgt must be greater than lft",
      });
    }
  });

export const ProjectSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    project_name: z.string().min(1),
    company_id: z.string().uuid(),
    customer: z.string().optional(),
    project_type: z.string().optional(),
    status: z.enum(["Open", "Completed", "Cancelled"]).default("Open"),
    expected_start_date: ISO_DATE.optional(),
    expected_end_date: ISO_DATE.optional(),
    actual_start_date: ISO_DATE.optional(),
    actual_end_date: ISO_DATE.optional(),
    estimated_costing: Finite().optional(),
    total_costing_amount: Finite().optional(),
    total_billed_amount: Finite().optional(),
    created_at: ISO_DATETIME,
    updated_at: ISO_DATETIME,
  })
  .strict()
  .superRefine((p, ctx) => {
    if (
      p.expected_start_date &&
      p.expected_end_date &&
      p.expected_start_date > p.expected_end_date
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expected_end_date"],
        message: "expected_end_date must be on/after expected_start_date",
      });
    }
    if (p.actual_start_date && p.actual_end_date && p.actual_start_date > p.actual_end_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["actual_end_date"],
        message: "actual_end_date must be on/after actual_start_date",
      });
    }
  });

// Export all types - SINGLE SOURCE OF TRUTH
export type CurrencyCode = z.infer<typeof CurrencyCodeSchema>;
export type AccountType = z.infer<typeof AccountTypeSchema>;
export type VoucherType = z.infer<typeof VoucherTypeSchema>;
export type GLEntry = z.infer<typeof GLEntrySchema>;
export type Account = z.infer<typeof AccountSchema>;
export type Company = z.infer<typeof CompanySchema>;
export type FiscalYear = z.infer<typeof FiscalYearSchema>;
export type CostCenter = z.infer<typeof CostCenterSchema>;
export type Project = z.infer<typeof ProjectSchema>;

// Schemas are already exported above with their declarations
