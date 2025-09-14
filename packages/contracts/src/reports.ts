import { z } from "zod";

// D4 Reporting Contracts - V1 Compliant Implementation

// Common report filters
export const ReportFilterSchema = z.object({
  accountTypes: z.array(z.string()).optional(),
  accountIds: z.array(z.string().uuid()).optional(),
  accountNumberRange: z
    .object({
      from: z.string(),
      to: z.string(),
    })
    .optional(),
  includeInactive: z.boolean().default(false),
  includeZeroBalances: z.boolean().default(false),
});

// Trial Balance Report
export const TrialBalanceReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  asOfDate: z.string().datetime(),
  includePeriodActivity: z.boolean().optional().default(false),
  includeZeroBalances: z.boolean().optional().default(false),
  currency: z.string().length(3).optional().default("MYR"),
  accountFilter: ReportFilterSchema.optional(),
});

export const TrialBalanceAccountSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  balance: z.number(),
  debitBalance: z.number(),
  creditBalance: z.number(),
  isActive: z.boolean(),
  parentId: z.string().uuid().optional(),
  level: z.number().int().min(0).optional(),
});

export const TrialBalanceRes = z.object({
  success: z.boolean(),
  asOfDate: z.string().datetime(),
  currency: z.string(),
  accounts: z.array(TrialBalanceAccountSchema),
  totalDebits: z.number(),
  totalCredits: z.number(),
  isBalanced: z.boolean(),
  generatedAt: z.string().datetime(),
  metadata: z
    .object({
      accountCount: z.number(),
      activeAccountCount: z.number(),
      zeroBalanceCount: z.number(),
      generationTimeMs: z.number().optional(),
    })
    .optional(),
});

// Balance Sheet Report
export const BalanceSheetReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  asOfDate: z.string().datetime(),
  comparativeDate: z.string().datetime().optional(),
  currency: z.string().length(3).optional().default("MYR"),
  includeZeroBalances: z.boolean().optional().default(false),
  consolidateSubsidiaries: z.boolean().optional().default(false),
});

export const BalanceSheetLineSchema = z.object({
  accountId: z.string().uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  accountType: z.enum(["asset", "liability", "equity"]),
  currentAmount: z.number(),
  comparativeAmount: z.number().optional(),
  variance: z.number().optional(),
  variancePercent: z.number().optional(),
  level: z.number().int().min(0),
  isHeader: z.boolean().default(false),
  isTotal: z.boolean().default(false),
});

export const BalanceSheetRes = z.object({
  success: z.boolean(),
  asOfDate: z.string().datetime(),
  comparativeDate: z.string().datetime().optional(),
  currency: z.string(),
  assets: z.object({
    currentAssets: z.array(BalanceSheetLineSchema),
    nonCurrentAssets: z.array(BalanceSheetLineSchema),
    totalAssets: z.number(),
  }),
  liabilities: z.object({
    currentLiabilities: z.array(BalanceSheetLineSchema),
    nonCurrentLiabilities: z.array(BalanceSheetLineSchema),
    totalLiabilities: z.number(),
  }),
  equity: z.object({
    equityAccounts: z.array(BalanceSheetLineSchema),
    totalEquity: z.number(),
  }),
  totalLiabilitiesAndEquity: z.number(),
  isBalanced: z.boolean(),
  generatedAt: z.string().datetime(),
});

// Profit & Loss Report
export const ProfitLossReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  comparativeFromDate: z.string().datetime().optional(),
  comparativeToDate: z.string().datetime().optional(),
  currency: z.string().length(3).optional().default("MYR"),
  includeZeroBalances: z.boolean().optional().default(false),
  groupByMonth: z.boolean().optional().default(false),
});

export const ProfitLossLineSchema = z.object({
  accountId: z.string().uuid(),
  accountCode: z.string(),
  accountName: z.string(),
  accountType: z.enum(["revenue", "expense"]),
  currentAmount: z.number(),
  comparativeAmount: z.number().optional(),
  variance: z.number().optional(),
  variancePercent: z.number().optional(),
  level: z.number().int().min(0),
  isHeader: z.boolean().default(false),
  isTotal: z.boolean().default(false),
});

export const ProfitLossRes = z.object({
  success: z.boolean(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  comparativeFromDate: z.string().datetime().optional(),
  comparativeToDate: z.string().datetime().optional(),
  currency: z.string(),
  revenue: z.object({
    operatingRevenue: z.array(ProfitLossLineSchema),
    otherRevenue: z.array(ProfitLossLineSchema),
    totalRevenue: z.number(),
  }),
  expenses: z.object({
    costOfGoodsSold: z.array(ProfitLossLineSchema),
    operatingExpenses: z.array(ProfitLossLineSchema),
    otherExpenses: z.array(ProfitLossLineSchema),
    totalExpenses: z.number(),
  }),
  grossProfit: z.number(),
  operatingProfit: z.number(),
  netProfit: z.number(),
  generatedAt: z.string().datetime(),
});

// Cash Flow Report
export const CashFlowReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  method: z.enum(["direct", "indirect"]).default("indirect"),
  currency: z.string().length(3).optional().default("MYR"),
  includeNonCashItems: z.boolean().optional().default(true),
});

export const CashFlowLineSchema = z.object({
  description: z.string(),
  amount: z.number(),
  accountIds: z.array(z.string().uuid()).optional(),
  isSubtotal: z.boolean().default(false),
  level: z.number().int().min(0).default(0),
});

export const CashFlowRes = z.object({
  success: z.boolean(),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime(),
  method: z.enum(["direct", "indirect"]),
  currency: z.string(),
  operatingActivities: z.object({
    lines: z.array(CashFlowLineSchema),
    netCashFromOperating: z.number(),
  }),
  investingActivities: z.object({
    lines: z.array(CashFlowLineSchema),
    netCashFromInvesting: z.number(),
  }),
  financingActivities: z.object({
    lines: z.array(CashFlowLineSchema),
    netCashFromFinancing: z.number(),
  }),
  netCashFlow: z.number(),
  beginningCash: z.number(),
  endingCash: z.number(),
  generatedAt: z.string().datetime(),
});

// Report Export Request
export const ReportExportReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  reportType: z.enum(["trial-balance", "balance-sheet", "profit-loss", "cash-flow"]),
  format: z.enum(["csv", "xlsx", "pdf", "jsonl"]),
  reportData: z.record(z.string(), z.unknown()), // The actual report data to export
  filename: z.string().optional(),
  includeMetadata: z.boolean().default(true),
});

export const ReportExportRes = z.object({
  success: z.boolean(),
  downloadUrl: z.string().url(),
  filename: z.string(),
  fileSize: z.number(),
  format: z.string(),
  expiresAt: z.string().datetime(),
  generatedAt: z.string().datetime(),
});

// Report Cache Management
export const ReportCacheReq = z.object({
  tenantId: z.string().uuid(),
  companyId: z.string().uuid(),
  reportType: z.string(),
  cacheKey: z.string(),
  ttlSeconds: z.number().int().positive().default(3600),
});

export const ReportCacheRes = z.object({
  success: z.boolean(),
  cached: z.boolean(),
  cacheKey: z.string(),
  expiresAt: z.string().datetime().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

// Type exports
export type TTrialBalanceReq = z.infer<typeof TrialBalanceReq>;
export type TTrialBalanceRes = z.infer<typeof TrialBalanceRes>;
export type TBalanceSheetReq = z.infer<typeof BalanceSheetReq>;
export type TBalanceSheetRes = z.infer<typeof BalanceSheetRes>;
export type TProfitLossReq = z.infer<typeof ProfitLossReq>;
export type TProfitLossRes = z.infer<typeof ProfitLossRes>;
export type TCashFlowReq = z.infer<typeof CashFlowReq>;
export type TCashFlowRes = z.infer<typeof CashFlowRes>;
export type TReportExportReq = z.infer<typeof ReportExportReq>;
export type TReportExportRes = z.infer<typeof ReportExportRes>;
export type TReportCacheReq = z.infer<typeof ReportCacheReq>;
export type TReportCacheRes = z.infer<typeof ReportCacheRes>;
