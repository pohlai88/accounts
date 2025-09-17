// @ts-nocheck
import { z } from "zod";
import { CurrencyCodeSchema, AccountTypeSchema } from "./core";

// ===== ENTERPRISE-GRADE REPORT CONTRACTS =====
// Single Source of Truth for all UI shapes - ERPNext-level sophistication

// --- Shared validators (prevent silent drift/invalids) ---
const ISO_DATE = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const ISO_DATETIME = z.string().datetime();
const NonNeg = () => z.number().min(0).finite();
const Finite = () => z.number().finite();
const Percent = () => z.number().finite().min(-100).max(100);
const near = (a: number, b: number) => Math.abs(a - b) < 0.01;

// Period definitions with ERPNext-style fiscal year support
export const ReportPeriodSchema = z
  .object({
    from: ISO_DATE,
    to: ISO_DATE,
    currency: CurrencyCodeSchema,
    fiscal_year: z.string().optional(),
    company_id: z.string().uuid(),
  })
  .strict();

export const AsOfPeriodSchema = z
  .object({
    as_of: ISO_DATE,
    currency: CurrencyCodeSchema,
    fiscal_year: z.string().optional(),
    company_id: z.string().uuid(),
  })
  .strict();

// Enhanced row schemas with ERPNext-level detail
export const AccountRowSchema = z
  .object({
    account_id: z.string().uuid(),
    account_code: z.string(),
    account_name: z.string(),
    account_type: AccountTypeSchema,
    parent_account_id: z.string().uuid().optional(),
    is_group: z.boolean(),
    indent: z.number().int().min(0),
    lft: z.number().int().positive().optional(), // Nested set left
    rgt: z.number().int().positive().optional(), // Nested set right
  })
  .strict();

// Trial Balance with opening/closing balances (ERPNext style)
export const TrialBalanceRowSchema = z
  .object({
    account_id: z.string().uuid(),
    account_code: z.string(),
    account_name: z.string(),
    account_type: AccountTypeSchema,
    parent_account_id: z.string().uuid().optional(),
    is_group: z.boolean(),
    indent: z.number().int().min(0),
    // ERPNext-style balance tracking
    opening_debit: NonNeg(),
    opening_credit: NonNeg(),
    debit: NonNeg(),
    credit: NonNeg(),
    closing_debit: NonNeg(),
    closing_credit: NonNeg(),
    // Net balances for display
    net_opening: Finite(),
    net_closing: Finite(),
    net_movement: Finite(),
  })
  .strict();

export const TrialBalanceSchema = z
  .object({
    period: AsOfPeriodSchema,
    accounts: z.array(TrialBalanceRowSchema),
    totals: z
      .object({
        opening_debit: NonNeg(),
        opening_credit: NonNeg(),
        debit: NonNeg(),
        credit: NonNeg(),
        closing_debit: NonNeg(),
        closing_credit: NonNeg(),
        is_balanced: z.boolean(),
      })
      .strict(),
    metadata: z
      .object({
        generated_at: ISO_DATETIME,
        includes_opening_balances: z.boolean(),
        period_closed: z.boolean(),
        base_currency: CurrencyCodeSchema,
        presentation_currency: CurrencyCodeSchema,
      })
      .strict(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Verify each row: opening + movement = closing (net)
    data.accounts.forEach((row, i) => {
      const expectedClosing = row.net_opening + row.net_movement;
      if (!near(row.net_closing, expectedClosing)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["accounts", i, "net_closing"],
          message: `Row ${i}: opening(${row.net_opening}) + movement(${row.net_movement}) ≠ closing(${row.net_closing})`,
        });
      }
    });

    // Verify totals match sum of accounts
    const sumOpeningDebit = data.accounts.reduce((sum, row) => sum + row.opening_debit, 0);
    const sumOpeningCredit = data.accounts.reduce((sum, row) => sum + row.opening_credit, 0);
    const sumDebit = data.accounts.reduce((sum, row) => sum + row.debit, 0);
    const sumCredit = data.accounts.reduce((sum, row) => sum + row.credit, 0);
    const sumClosingDebit = data.accounts.reduce((sum, row) => sum + row.closing_debit, 0);
    const sumClosingCredit = data.accounts.reduce((sum, row) => sum + row.closing_credit, 0);

    if (!near(data.totals.opening_debit, sumOpeningDebit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "opening_debit"],
        message: `totals.opening_debit(${data.totals.opening_debit}) ≠ sum(${sumOpeningDebit})`,
      });
    }
    if (!near(data.totals.opening_credit, sumOpeningCredit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "opening_credit"],
        message: `totals.opening_credit(${data.totals.opening_credit}) ≠ sum(${sumOpeningCredit})`,
      });
    }
    if (!near(data.totals.debit, sumDebit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "debit"],
        message: `totals.debit(${data.totals.debit}) ≠ sum(${sumDebit})`,
      });
    }
    if (!near(data.totals.credit, sumCredit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "credit"],
        message: `totals.credit(${data.totals.credit}) ≠ sum(${sumCredit})`,
      });
    }
    if (!near(data.totals.closing_debit, sumClosingDebit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "closing_debit"],
        message: `totals.closing_debit(${data.totals.closing_debit}) ≠ sum(${sumClosingDebit})`,
      });
    }
    if (!near(data.totals.closing_credit, sumClosingCredit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "closing_credit"],
        message: `totals.closing_credit(${data.totals.closing_credit}) ≠ sum(${sumClosingCredit})`,
      });
    }

    // Verify is_balanced flag truthfulness
    const isActuallyBalanced = near(data.totals.closing_debit, data.totals.closing_credit);
    if (data.totals.is_balanced !== isActuallyBalanced) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "is_balanced"],
        message: `is_balanced(${data.totals.is_balanced}) but debit(${data.totals.closing_debit}) ${isActuallyBalanced ? "=" : "≠"} credit(${data.totals.closing_credit})`,
      });
    }
  });

// Profit & Loss with ERPNext-level categorization
export const PLRowSchema = z
  .object({
    account_id: z.string().uuid(),
    account_code: z.string(),
    account_name: z.string(),
    account_type: AccountTypeSchema,
    parent_account_id: z.string().uuid().optional(),
    is_group: z.boolean(),
    indent: z.number().int().min(0),
    amount: Finite(),
    percentage_of_revenue: Percent(),
    percentage_of_total: Percent(),
    // Comparative analysis
    previous_period_amount: Finite().optional(),
    variance: Finite().optional(),
    variance_percent: Percent().optional(),
  })
  .strict();

export const PLDataSchema = z
  .object({
    period: ReportPeriodSchema,
    // ERPNext-style categorization
    income: z
      .object({
        direct_income: z.array(PLRowSchema),
        indirect_income: z.array(PLRowSchema),
        total: Finite(),
      })
      .strict(),
    expenses: z
      .object({
        cost_of_goods_sold: z.array(PLRowSchema),
        direct_expenses: z.array(PLRowSchema),
        indirect_expenses: z.array(PLRowSchema),
        total: Finite(),
      })
      .strict(),
    // Key totals
    totals: z
      .object({
        total_income: Finite(),
        total_expenses: Finite(),
        gross_profit: Finite(),
        net_profit: Finite(),
        gross_profit_margin: Percent(),
        net_profit_margin: Percent(),
      })
      .strict(),
    // Comparative data
    comparative: z
      .object({
        previous_period: z
          .object({
            total_income: Finite(),
            total_expenses: Finite(),
            net_profit: Finite(),
          })
          .strict()
          .optional(),
        variance: z
          .object({
            income_variance: Finite(),
            expense_variance: Finite(),
            profit_variance: Finite(),
          })
          .strict()
          .optional(),
      })
      .strict(),
    metadata: z
      .object({
        generated_at: ISO_DATETIME,
        period_closed: z.boolean(),
        base_currency: CurrencyCodeSchema,
        presentation_currency: CurrencyCodeSchema,
        exchange_rate: z.number().positive().finite().optional(),
      })
      .strict(),
  })
  .strict();

// Balance Sheet with ERPNext-level detail
export const BSRowSchema = z
  .object({
    account_id: z.string().uuid(),
    account_code: z.string(),
    account_name: z.string(),
    account_type: AccountTypeSchema,
    parent_account_id: z.string().uuid().optional(),
    is_group: z.boolean(),
    indent: z.number().int().min(0),
    amount: Finite(),
    percentage_of_total: Percent(),
    // Comparative analysis
    previous_period_amount: Finite().optional(),
    variance: Finite().optional(),
    variance_percent: Percent().optional(),
  })
  .strict();

export const BSDataSchema = z
  .object({
    period: AsOfPeriodSchema,
    assets: z
      .object({
        current_assets: z.array(BSRowSchema),
        non_current_assets: z.array(BSRowSchema),
        fixed_assets: z.array(BSRowSchema),
        total: Finite(),
      })
      .strict(),
    liabilities: z
      .object({
        current_liabilities: z.array(BSRowSchema),
        non_current_liabilities: z.array(BSRowSchema),
        total: Finite(),
      })
      .strict(),
    equity: z
      .object({
        share_capital: z.array(BSRowSchema),
        retained_earnings: z.array(BSRowSchema),
        other_equity: z.array(BSRowSchema),
        total: Finite(),
      })
      .strict(),
    totals: z
      .object({
        total_assets: Finite(),
        total_liabilities: Finite(),
        total_equity: Finite(),
        total_liabilities_and_equity: Finite(),
        is_balanced: z.boolean(),
      })
      .strict(),
    // Financial ratios
    ratios: z
      .object({
        current_ratio: Finite().optional(),
        quick_ratio: Finite().optional(),
        debt_to_equity: Finite().optional(),
        debt_to_assets: Finite().optional(),
      })
      .strict(),
    metadata: z
      .object({
        generated_at: ISO_DATETIME,
        period_closed: z.boolean(),
        base_currency: CurrencyCodeSchema,
        presentation_currency: CurrencyCodeSchema,
        exchange_rate: z.number().positive().finite().optional(),
      })
      .strict(),
  })
  .strict();

// Cash Flow with indirect method (ERPNext style)
export const CashFlowLineSchema = z
  .object({
    account_id: z.string().uuid().optional(),
    description: z.string(),
    amount: Finite(),
    is_subtotal: z.boolean().default(false),
    indent: z.number().int().min(0).default(0),
  })
  .strict();

export const CashFlowSectionSchema = z
  .object({
    title: z.string(),
    lines: z.array(CashFlowLineSchema),
    subtotal: Finite(),
  })
  .strict();

export const CashFlowDataSchema = z
  .object({
    period: ReportPeriodSchema,
    // Indirect method sections
    operating_activities: CashFlowSectionSchema,
    investing_activities: CashFlowSectionSchema,
    financing_activities: CashFlowSectionSchema,
    // Cash reconciliation
    cash_reconciliation: z
      .object({
        beginning_cash: Finite(),
        net_change_in_cash: Finite(),
        ending_cash: Finite(),
        // Verification against balance sheet
        ending_cash_per_balance_sheet: Finite(),
        difference: Finite(),
      })
      .strict(),
    totals: z
      .object({
        net_cash_from_operating: Finite(),
        net_cash_from_investing: Finite(),
        net_cash_from_financing: Finite(),
        net_change_in_cash: Finite(),
      })
      .strict(),
    metadata: z
      .object({
        generated_at: ISO_DATETIME,
        method: z.literal("indirect"),
        period_closed: z.boolean(),
        base_currency: CurrencyCodeSchema,
        presentation_currency: CurrencyCodeSchema,
      })
      .strict(),
  })
  .strict();

// Aging Reports (ERPNext-style)
export const AgingRowSchema = z
  .object({
    party_id: z.string().uuid(),
    party_name: z.string(),
    party_type: z.enum(["Customer", "Supplier"]),
    total_outstanding: Finite(),
    // Age buckets
    current: NonNeg(), // 0-30 days
    days_30_60: NonNeg(),
    days_60_90: NonNeg(),
    days_90_120: NonNeg(),
    over_120_days: NonNeg(),
    // Additional details
    credit_limit: NonNeg().optional(),
    credit_utilized: NonNeg().optional(),
    oldest_invoice_date: ISO_DATE.optional(),
  })
  .strict();

export const AgingReportSchema = z
  .object({
    period: AsOfPeriodSchema,
    party_type: z.enum(["Customer", "Supplier"]),
    parties: z.array(AgingRowSchema),
    totals: z
      .object({
        total_outstanding: NonNeg(),
        current: NonNeg(),
        days_30_60: NonNeg(),
        days_60_90: NonNeg(),
        days_90_120: NonNeg(),
        over_120_days: NonNeg(),
      })
      .strict(),
    metadata: z
      .object({
        generated_at: ISO_DATETIME,
        base_currency: CurrencyCodeSchema,
        presentation_currency: CurrencyCodeSchema,
      })
      .strict(),
  })
  .strict();

// GL Entry and Transaction contracts
export const GLEntryRowSchema = z
  .object({
    id: z.string().uuid(),
    account_id: z.string().uuid(),
    account_code: z.string(),
    account_name: z.string(),
    debit: NonNeg(),
    credit: NonNeg(),
    posting_date: ISO_DATE,
    voucher_type: z.string().min(1),
    voucher_no: z.string(),
    party_type: z.string().optional(),
    party: z.string().optional(),
    against_voucher: z.string().optional(),
    against_voucher_type: z.string().optional(),
    cost_center: z.string().optional(),
    project: z.string().optional(),
    remarks: z.string().optional(),
    is_opening: z.boolean().default(false),
    fiscal_year: z.string().optional(),
    // Multi-currency fields
    account_currency: z.string().length(3),
    debit_in_account_currency: NonNeg(),
    credit_in_account_currency: NonNeg(),
    exchange_rate: z.number().positive().finite().default(1),
  })
  .strict();

export const GLEntryListSchema = z
  .object({
    entries: z.array(GLEntryRowSchema),
    totals: z
      .object({
        total_debit: NonNeg(),
        total_credit: NonNeg(),
        is_balanced: z.boolean(),
      })
      .strict(),
    filters: z
      .object({
        company_id: z.string().uuid(),
        from_date: ISO_DATE,
        to_date: ISO_DATE,
        account_id: z.string().uuid().optional(),
        voucher_type: z.string().optional(),
        party_type: z.string().optional(),
      })
      .strict(),
    metadata: z
      .object({
        total_count: NonNeg(),
        page: z.number().int().min(1),
        per_page: z.number().int().min(1),
        has_more: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Verify each entry has debit XOR credit (not both, not neither)
    data.entries.forEach((entry, i) => {
      const hasDebit = entry.debit > 0;
      const hasCredit = entry.credit > 0;
      if (hasDebit && hasCredit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entries", i],
          message: `Entry ${i}: cannot have both debit(${entry.debit}) and credit(${entry.credit})`,
        });
      }
      if (!hasDebit && !hasCredit) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["entries", i],
          message: `Entry ${i}: must have either debit or credit (both are zero)`,
        });
      }
    });

    // Verify totals match sum of entries
    const sumDebit = data.entries.reduce((sum, entry) => sum + entry.debit, 0);
    const sumCredit = data.entries.reduce((sum, entry) => sum + entry.credit, 0);

    if (!near(data.totals.total_debit, sumDebit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "total_debit"],
        message: `total_debit(${data.totals.total_debit}) ≠ sum(${sumDebit})`,
      });
    }
    if (!near(data.totals.total_credit, sumCredit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "total_credit"],
        message: `total_credit(${data.totals.total_credit}) ≠ sum(${sumCredit})`,
      });
    }

    // Verify is_balanced flag truthfulness
    const isActuallyBalanced = near(sumDebit, sumCredit);
    if (data.totals.is_balanced !== isActuallyBalanced) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["totals", "is_balanced"],
        message: `is_balanced(${data.totals.is_balanced}) but debit(${sumDebit}) ${isActuallyBalanced ? "=" : "≠"} credit(${sumCredit})`,
      });
    }
  });

// Export all types - SINGLE SOURCE OF TRUTH
export type ReportPeriod = z.infer<typeof ReportPeriodSchema>;
export type AsOfPeriod = z.infer<typeof AsOfPeriodSchema>;
export type AccountRow = z.infer<typeof AccountRowSchema>;
export type TrialBalanceRow = z.infer<typeof TrialBalanceRowSchema>;
export type TrialBalance = z.infer<typeof TrialBalanceSchema>;
export type PLRow = z.infer<typeof PLRowSchema>;
export type PLData = z.infer<typeof PLDataSchema>;
export type BSRow = z.infer<typeof BSRowSchema>;
export type BSData = z.infer<typeof BSDataSchema>;
export type CashFlowLine = z.infer<typeof CashFlowLineSchema>;
export type CashFlowSection = z.infer<typeof CashFlowSectionSchema>;
export type CashFlowData = z.infer<typeof CashFlowDataSchema>;
export type AgingRow = z.infer<typeof AgingRowSchema>;
export type AgingReport = z.infer<typeof AgingReportSchema>;
export type GLEntryRow = z.infer<typeof GLEntryRowSchema>;
export type GLEntryList = z.infer<typeof GLEntryListSchema>;

// Schemas are already exported above with their declarations
