// D4 Profit & Loss Report Engine - Income Statement
// V1 Requirement: P&L from GL only with proper revenue/expense classification

import { generateTrialBalance } from "./trial-balance.js";
import type { TrialBalanceAccount, TrialBalanceResult } from "./trial-balance.js";

export interface ProfitLossInput {
  tenantId: string;
  companyId: string;
  startDate: Date;
  endDate: Date;
  comparativePeriod?: {
    startDate: Date;
    endDate: Date;
  };
  includeZeroBalances?: boolean;
  currency?: string;
  reportFormat?: "STANDARD" | "COMPARATIVE" | "MULTI_PERIOD" | "DEPARTMENTAL";
  departmentFilter?: string[];
  costCenterFilter?: string[];
}

export interface ProfitLossSection {
  sectionName: string;
  sectionType: "REVENUE" | "COST_OF_SALES" | "OPERATING_EXPENSE" | "OTHER_INCOME" | "OTHER_EXPENSE";
  accounts: ProfitLossAccount[];
  subtotal: number;
  comparativeSubtotal?: number;
  variance?: number;
  variancePercent?: number;
}

export interface ProfitLossAccount {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  accountCategory: string;
  level: number;
  isHeader: boolean;
  currentPeriodAmount: number;
  comparativePeriodAmount?: number;
  variance?: number;
  variancePercent?: number;
  parentAccountId?: string;
  department?: string;
  costCenter?: string;
}

export interface ProfitLossResult {
  success: true;
  startDate: Date;
  endDate: Date;
  comparativeStartDate?: Date;
  comparativeEndDate?: Date;
  generatedAt: Date;
  currency: string;
  reportFormat: string;

  // Main sections
  revenue: ProfitLossSection[];
  costOfSales: ProfitLossSection[];
  operatingExpenses: ProfitLossSection[];
  otherIncome: ProfitLossSection[];
  otherExpenses: ProfitLossSection[];

  // Key metrics
  metrics: {
    totalRevenue: number;
    totalCostOfSales: number;
    grossProfit: number;
    grossProfitMargin: number;
    totalOperatingExpenses: number;
    operatingIncome: number;
    operatingMargin: number;
    totalOtherIncome: number;
    totalOtherExpenses: number;
    netIncomeBeforeTax: number;
    netIncomeAfterTax: number;
    netProfitMargin: number;

    // Comparative metrics (if applicable)
    comparativeTotalRevenue?: number;
    comparativeGrossProfit?: number;
    comparativeOperatingIncome?: number;
    comparativeNetIncome?: number;

    // Variances
    revenueVariance?: number;
    grossProfitVariance?: number;
    operatingIncomeVariance?: number;
    netIncomeVariance?: number;
  };

  metadata: {
    totalAccounts: number;
    accountsWithActivity: number;
    periodDays: number;
    generationTime: number;
    basedOnTrialBalance: boolean;
  };
}

export interface ProfitLossError {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Generate Profit & Loss statement from Trial Balance data
 * V1 Requirement: All reports derive from GL journal lines
 */
export async function generateProfitLoss(
  input: ProfitLossInput,
  dbClient: unknown,
): Promise<ProfitLossResult | ProfitLossError> {
  const startTime = Date.now();

  try {
    // 1. Validate input parameters
    const validation = validateProfitLossInput(input);
    if (!validation.valid) {
      return {
        success: false,
        error: `Input validation failed: ${validation.errors.join(", ")}`,
        code: "INVALID_INPUT",
        details: validation.errors,
      };
    }

    // 2. Generate current period trial balance
    const currentTrialBalance = await generateTrialBalance(
      {
        tenantId: input.tenantId,
        companyId: input.companyId,
        asOfDate: input.endDate,
        includePeriodActivity: true,
        includeZeroBalances: input.includeZeroBalances || false,
        currency: input.currency,
      },
      dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
    );

    if (!currentTrialBalance.success) {
      return {
        success: false,
        error: `Failed to generate trial balance: ${currentTrialBalance.error}`,
        code: "TRIAL_BALANCE_ERROR",
        details: currentTrialBalance,
      };
    }

    // 3. Generate comparative period trial balance (if requested)
    let comparativeTrialBalance: TrialBalanceResult | null = null;
    if (input.comparativePeriod) {
      const comparativeResult = await generateTrialBalance(
        {
          tenantId: input.tenantId,
          companyId: input.companyId,
          asOfDate: input.comparativePeriod.endDate,
          includePeriodActivity: true,
          includeZeroBalances: input.includeZeroBalances || false,
          currency: input.currency,
        },
        dbClient as { query: (sql: string, params?: unknown[]) => Promise<unknown> },
      );

      if (!comparativeResult.success) {
        return {
          success: false,
          error: `Failed to generate comparative trial balance: ${comparativeResult.error}`,
          code: "COMPARATIVE_TRIAL_BALANCE_ERROR",
          details: comparativeResult,
        };
      }

      comparativeTrialBalance = comparativeResult;
    }

    // 4. Get period-specific activity for P&L accounts
    const periodActivity = await getPeriodActivity(
      input.tenantId,
      input.companyId,
      input.startDate,
      input.endDate,
      dbClient,
      input.comparativePeriod,
    );

    // 5. Classify accounts into P&L sections
    const { revenue, costOfSales, operatingExpenses, otherIncome, otherExpenses } =
      classifyProfitLossAccounts(
        currentTrialBalance.accounts,
        periodActivity.current,
        comparativeTrialBalance?.accounts,
        periodActivity.comparative,
      );

    // 6. Calculate key metrics
    const metrics = calculateProfitLossMetrics(
      revenue,
      costOfSales,
      operatingExpenses,
      otherIncome,
      otherExpenses,
    );

    // 7. Generate metadata
    const periodDays = Math.ceil(
      (input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const metadata = {
      totalAccounts: currentTrialBalance.accounts.filter(a =>
        ["REVENUE", "EXPENSE"].includes(a.accountType.toUpperCase()),
      ).length,
      accountsWithActivity: periodActivity.current.size,
      periodDays,
      generationTime: Date.now() - startTime,
      basedOnTrialBalance: true,
    };

    return {
      success: true,
      startDate: input.startDate,
      endDate: input.endDate,
      comparativeStartDate: input.comparativePeriod?.startDate,
      comparativeEndDate: input.comparativePeriod?.endDate,
      generatedAt: new Date(),
      currency: input.currency || "MYR",
      reportFormat: input.reportFormat || "STANDARD",
      revenue,
      costOfSales,
      operatingExpenses,
      otherIncome,
      otherExpenses,
      metrics,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "PROFIT_LOSS_ERROR",
      details: error,
    };
  }
}

/**
 * Get period-specific activity for P&L accounts from GL journal lines
 */
async function getPeriodActivity(
  tenantId: string,
  companyId: string,
  startDate: Date,
  endDate: Date,
  dbClient: unknown,
  comparativePeriod?: { startDate: Date; endDate: Date },
): Promise<{
  current: Map<string, { debits: number; credits: number; netActivity: number }>;
  comparative?: Map<string, { debits: number; credits: number; netActivity: number }>;
}> {
  // Query for current period activity
  const currentQuery = `
    SELECT
      jl.account_id,
      coa.account_type,
      coa.normal_balance,
      SUM(jl.debit_amount) as total_debits,
      SUM(jl.credit_amount) as total_credits
    FROM gl_journal_lines jl
    JOIN gl_journal j ON jl.journal_id = j.id
    JOIN chart_of_accounts coa ON jl.account_id = coa.id
    WHERE j.tenant_id = $1
      AND j.company_id = $2
      AND j.status = 'posted'
      AND j.journal_date >= $3
      AND j.journal_date <= $4
      AND coa.account_type IN ('REVENUE', 'EXPENSE')
    GROUP BY jl.account_id, coa.account_type, coa.normal_balance
  `;

  const { data: currentData, error: currentError } = await (
    dbClient as {
      rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
    }
  ).rpc("execute_sql", {
    query: currentQuery,
    params: [tenantId, companyId, startDate, endDate],
  });

  if (currentError) {
    throw new Error(
      `Failed to fetch current period activity: ${(currentError as { message: string }).message}`,
    );
  }

  const currentActivity = new Map<
    string,
    { debits: number; credits: number; netActivity: number }
  >();
  for (const row of (currentData as unknown[]) || []) {
    const rowData = row as {
      total_debits: string;
      total_credits: string;
      normal_balance: string;
      account_id: string;
    };
    const debits = parseFloat(rowData.total_debits || "0");
    const credits = parseFloat(rowData.total_credits || "0");

    // Calculate net activity based on normal balance
    const netActivity = rowData.normal_balance === "DEBIT" ? debits - credits : credits - debits;

    currentActivity.set(rowData.account_id, {
      debits,
      credits,
      netActivity,
    });
  }

  // Query for comparative period activity (if requested)
  let comparativeActivity:
    | Map<string, { debits: number; credits: number; netActivity: number }>
    | undefined = undefined;
  if (comparativePeriod) {
    const comparativeQuery = `
      SELECT
        jl.account_id,
        coa.account_type,
        coa.normal_balance,
        SUM(jl.debit_amount) as total_debits,
        SUM(jl.credit_amount) as total_credits
      FROM gl_journal_lines jl
      JOIN gl_journal j ON jl.journal_id = j.id
      JOIN chart_of_accounts coa ON jl.account_id = coa.id
      WHERE j.tenant_id = $1
        AND j.company_id = $2
        AND j.status = 'posted'
        AND j.journal_date >= $3
        AND j.journal_date <= $4
        AND coa.account_type IN ('REVENUE', 'EXPENSE')
      GROUP BY jl.account_id, coa.account_type, coa.normal_balance
    `;

    const { data: comparativeData, error: comparativeError } = await (
      dbClient as {
        rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
      }
    ).rpc("execute_sql", {
      query: comparativeQuery,
      params: [tenantId, companyId, comparativePeriod.startDate, comparativePeriod.endDate],
    });

    if (comparativeError) {
      throw new Error(
        `Failed to fetch comparative period activity: ${(comparativeError as { message: string }).message}`,
      );
    }

    comparativeActivity = new Map();
    for (const row of (comparativeData as unknown[]) || []) {
      const rowData = row as {
        total_debits: string;
        total_credits: string;
        normal_balance: string;
        account_id: string;
      };
      const debits = parseFloat(rowData.total_debits || "0");
      const credits = parseFloat(rowData.total_credits || "0");

      const netActivity = rowData.normal_balance === "DEBIT" ? debits - credits : credits - debits;

      comparativeActivity.set(rowData.account_id, {
        debits,
        credits,
        netActivity,
      });
    }
  }

  return {
    current: currentActivity,
    comparative: comparativeActivity,
  };
}

/**
 * Classify trial balance accounts into P&L sections
 */
function classifyProfitLossAccounts(
  trialBalanceAccounts: TrialBalanceAccount[],
  currentActivity: Map<string, { debits: number; credits: number; netActivity: number }>,
  comparativeAccounts?: TrialBalanceAccount[],
  comparativeActivity?: Map<string, { debits: number; credits: number; netActivity: number }>,
): {
  revenue: ProfitLossSection[];
  costOfSales: ProfitLossSection[];
  operatingExpenses: ProfitLossSection[];
  otherIncome: ProfitLossSection[];
  otherExpenses: ProfitLossSection[];
} {
  // Create comparative lookup map
  const comparativeMap = new Map<string, TrialBalanceAccount>();
  if (comparativeAccounts) {
    for (const account of comparativeAccounts) {
      comparativeMap.set(account.accountId, account);
    }
  }

  // Filter P&L accounts only
  const plAccounts = trialBalanceAccounts.filter(account =>
    ["REVENUE", "EXPENSE"].includes(account.accountType.toUpperCase()),
  );

  // Build P&L accounts with period activity
  const buildPLAccounts = (accounts: TrialBalanceAccount[]): ProfitLossAccount[] => {
    return accounts.map(account => {
      const activity = currentActivity.get(account.accountId);
      const comparativeAccountActivity = comparativeActivity?.get(account.accountId);

      const currentAmount = activity?.netActivity || 0;
      const comparativeAmount = comparativeAccountActivity?.netActivity || 0;
      const variance = currentAmount - comparativeAmount;
      const variancePercent =
        comparativeAmount !== 0 ? (variance / Math.abs(comparativeAmount)) * 100 : 0;

      return {
        accountId: account.accountId,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        accountCategory: account.accountCategory,
        level: account.level,
        isHeader: account.isHeader,
        currentPeriodAmount: currentAmount,
        comparativePeriodAmount: comparativeActivity ? comparativeAmount : undefined,
        variance: comparativeActivity ? variance : undefined,
        variancePercent: comparativeActivity ? variancePercent : undefined,
        parentAccountId: account.parentAccountId,
      };
    });
  };

  // Classify accounts by category
  const revenueAccounts = plAccounts.filter(a => a.accountType.toUpperCase() === "REVENUE");

  const expenseAccounts = plAccounts.filter(a => a.accountType.toUpperCase() === "EXPENSE");

  // Create sections
  const revenue = createRevenueSection(buildPLAccounts(revenueAccounts));
  const costOfSales = createCostOfSalesSection(buildPLAccounts(expenseAccounts));
  const operatingExpenses = createOperatingExpensesSection(buildPLAccounts(expenseAccounts));
  const otherIncome = createOtherIncomeSection(buildPLAccounts(revenueAccounts));
  const otherExpenses = createOtherExpensesSection(buildPLAccounts(expenseAccounts));

  return {
    revenue,
    costOfSales,
    operatingExpenses,
    otherIncome,
    otherExpenses,
  };
}

/**
 * Create revenue section
 */
function createRevenueSection(revenueAccounts: ProfitLossAccount[]): ProfitLossSection[] {
  const operatingRevenue = revenueAccounts.filter(account =>
    isOperatingRevenue(account.accountCategory),
  );

  if (operatingRevenue.length === 0) {return [];}

  return [
    {
      sectionName: "Revenue",
      sectionType: "REVENUE",
      accounts: operatingRevenue.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
      subtotal: operatingRevenue.reduce((sum, acc) => sum + acc.currentPeriodAmount, 0),
      comparativeSubtotal: operatingRevenue.reduce(
        (sum, acc) => sum + (acc.comparativePeriodAmount || 0),
        0,
      ),
      variance: operatingRevenue.reduce((sum, acc) => sum + (acc.variance || 0), 0),
      variancePercent: calculateSectionVariancePercent(operatingRevenue),
    },
  ];
}

/**
 * Create cost of sales section
 */
function createCostOfSalesSection(expenseAccounts: ProfitLossAccount[]): ProfitLossSection[] {
  const costOfSalesAccounts = expenseAccounts.filter(account =>
    isCostOfSales(account.accountCategory),
  );

  if (costOfSalesAccounts.length === 0) {return [];}

  return [
    {
      sectionName: "Cost of Sales",
      sectionType: "COST_OF_SALES",
      accounts: costOfSalesAccounts.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
      subtotal: costOfSalesAccounts.reduce((sum, acc) => sum + acc.currentPeriodAmount, 0),
      comparativeSubtotal: costOfSalesAccounts.reduce(
        (sum, acc) => sum + (acc.comparativePeriodAmount || 0),
        0,
      ),
      variance: costOfSalesAccounts.reduce((sum, acc) => sum + (acc.variance || 0), 0),
      variancePercent: calculateSectionVariancePercent(costOfSalesAccounts),
    },
  ];
}

/**
 * Create operating expenses section
 */
function createOperatingExpensesSection(expenseAccounts: ProfitLossAccount[]): ProfitLossSection[] {
  const operatingExpenseAccounts = expenseAccounts.filter(account =>
    isOperatingExpense(account.accountCategory),
  );

  if (operatingExpenseAccounts.length === 0) {return [];}

  return [
    {
      sectionName: "Operating Expenses",
      sectionType: "OPERATING_EXPENSE",
      accounts: operatingExpenseAccounts.sort((a, b) =>
        a.accountNumber.localeCompare(b.accountNumber),
      ),
      subtotal: operatingExpenseAccounts.reduce((sum, acc) => sum + acc.currentPeriodAmount, 0),
      comparativeSubtotal: operatingExpenseAccounts.reduce(
        (sum, acc) => sum + (acc.comparativePeriodAmount || 0),
        0,
      ),
      variance: operatingExpenseAccounts.reduce((sum, acc) => sum + (acc.variance || 0), 0),
      variancePercent: calculateSectionVariancePercent(operatingExpenseAccounts),
    },
  ];
}

/**
 * Create other income section
 */
function createOtherIncomeSection(revenueAccounts: ProfitLossAccount[]): ProfitLossSection[] {
  const otherIncomeAccounts = revenueAccounts.filter(account =>
    isOtherIncome(account.accountCategory),
  );

  if (otherIncomeAccounts.length === 0) {return [];}

  return [
    {
      sectionName: "Other Income",
      sectionType: "OTHER_INCOME",
      accounts: otherIncomeAccounts.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
      subtotal: otherIncomeAccounts.reduce((sum, acc) => sum + acc.currentPeriodAmount, 0),
      comparativeSubtotal: otherIncomeAccounts.reduce(
        (sum, acc) => sum + (acc.comparativePeriodAmount || 0),
        0,
      ),
      variance: otherIncomeAccounts.reduce((sum, acc) => sum + (acc.variance || 0), 0),
      variancePercent: calculateSectionVariancePercent(otherIncomeAccounts),
    },
  ];
}

/**
 * Create other expenses section
 */
function createOtherExpensesSection(expenseAccounts: ProfitLossAccount[]): ProfitLossSection[] {
  const otherExpenseAccounts = expenseAccounts.filter(account =>
    isOtherExpense(account.accountCategory),
  );

  if (otherExpenseAccounts.length === 0) {return [];}

  return [
    {
      sectionName: "Other Expenses",
      sectionType: "OTHER_EXPENSE",
      accounts: otherExpenseAccounts.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
      subtotal: otherExpenseAccounts.reduce((sum, acc) => sum + acc.currentPeriodAmount, 0),
      comparativeSubtotal: otherExpenseAccounts.reduce(
        (sum, acc) => sum + (acc.comparativePeriodAmount || 0),
        0,
      ),
      variance: otherExpenseAccounts.reduce((sum, acc) => sum + (acc.variance || 0), 0),
      variancePercent: calculateSectionVariancePercent(otherExpenseAccounts),
    },
  ];
}

/**
 * Calculate P&L key metrics
 */
function calculateProfitLossMetrics(
  revenue: ProfitLossSection[],
  costOfSales: ProfitLossSection[],
  operatingExpenses: ProfitLossSection[],
  otherIncome: ProfitLossSection[],
  otherExpenses: ProfitLossSection[],
): ProfitLossResult["metrics"] {
  const totalRevenue = revenue.reduce((sum, section) => sum + section.subtotal, 0);
  const totalCostOfSales = costOfSales.reduce((sum, section) => sum + section.subtotal, 0);
  const totalOperatingExpenses = operatingExpenses.reduce(
    (sum, section) => sum + section.subtotal,
    0,
  );
  const totalOtherIncome = otherIncome.reduce((sum, section) => sum + section.subtotal, 0);
  const totalOtherExpenses = otherExpenses.reduce((sum, section) => sum + section.subtotal, 0);

  const grossProfit = totalRevenue - totalCostOfSales;
  const operatingIncome = grossProfit - totalOperatingExpenses;
  const netIncomeBeforeTax = operatingIncome + totalOtherIncome - totalOtherExpenses;
  const netIncomeAfterTax = netIncomeBeforeTax; // TODO: Add tax calculation

  // Calculate margins
  const grossProfitMargin = totalRevenue !== 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const operatingMargin = totalRevenue !== 0 ? (operatingIncome / totalRevenue) * 100 : 0;
  const netProfitMargin = totalRevenue !== 0 ? (netIncomeAfterTax / totalRevenue) * 100 : 0;

  // Comparative metrics
  const comparativeTotalRevenue = revenue.reduce(
    (sum, section) => sum + (section.comparativeSubtotal || 0),
    0,
  );
  const comparativeCostOfSales = costOfSales.reduce(
    (sum, section) => sum + (section.comparativeSubtotal || 0),
    0,
  );
  const comparativeOperatingExpenses = operatingExpenses.reduce(
    (sum, section) => sum + (section.comparativeSubtotal || 0),
    0,
  );
  const comparativeOtherIncome = otherIncome.reduce(
    (sum, section) => sum + (section.comparativeSubtotal || 0),
    0,
  );
  const comparativeOtherExpenses = otherExpenses.reduce(
    (sum, section) => sum + (section.comparativeSubtotal || 0),
    0,
  );

  const comparativeGrossProfit = comparativeTotalRevenue - comparativeCostOfSales;
  const comparativeOperatingIncome = comparativeGrossProfit - comparativeOperatingExpenses;
  const comparativeNetIncome =
    comparativeOperatingIncome + comparativeOtherIncome - comparativeOtherExpenses;

  // Variances
  const revenueVariance = totalRevenue - comparativeTotalRevenue;
  const grossProfitVariance = grossProfit - comparativeGrossProfit;
  const operatingIncomeVariance = operatingIncome - comparativeOperatingIncome;
  const netIncomeVariance = netIncomeAfterTax - comparativeNetIncome;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCostOfSales: Math.round(totalCostOfSales * 100) / 100,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossProfitMargin: Math.round(grossProfitMargin * 100) / 100,
    totalOperatingExpenses: Math.round(totalOperatingExpenses * 100) / 100,
    operatingIncome: Math.round(operatingIncome * 100) / 100,
    operatingMargin: Math.round(operatingMargin * 100) / 100,
    totalOtherIncome: Math.round(totalOtherIncome * 100) / 100,
    totalOtherExpenses: Math.round(totalOtherExpenses * 100) / 100,
    netIncomeBeforeTax: Math.round(netIncomeBeforeTax * 100) / 100,
    netIncomeAfterTax: Math.round(netIncomeAfterTax * 100) / 100,
    netProfitMargin: Math.round(netProfitMargin * 100) / 100,

    comparativeTotalRevenue: comparativeTotalRevenue || undefined,
    comparativeGrossProfit: comparativeGrossProfit || undefined,
    comparativeOperatingIncome: comparativeOperatingIncome || undefined,
    comparativeNetIncome: comparativeNetIncome || undefined,

    revenueVariance: revenueVariance || undefined,
    grossProfitVariance: grossProfitVariance || undefined,
    operatingIncomeVariance: operatingIncomeVariance || undefined,
    netIncomeVariance: netIncomeVariance || undefined,
  };
}

/**
 * Account classification helper functions
 */
function isOperatingRevenue(accountCategory: string): boolean {
  const operatingRevenueCategories = [
    "SALES_REVENUE",
    "SERVICE_REVENUE",
    "PRODUCT_REVENUE",
    "SUBSCRIPTION_REVENUE",
    "OTHER_OPERATING_REVENUE",
  ];
  return operatingRevenueCategories.includes(accountCategory.toUpperCase());
}

function isCostOfSales(accountCategory: string): boolean {
  const costOfSalesCategories = [
    "COST_OF_GOODS_SOLD",
    "COST_OF_SERVICES",
    "DIRECT_MATERIALS",
    "DIRECT_LABOR",
    "MANUFACTURING_OVERHEAD",
  ];
  return costOfSalesCategories.includes(accountCategory.toUpperCase());
}

function isOperatingExpense(accountCategory: string): boolean {
  const operatingExpenseCategories = [
    "SELLING_EXPENSES",
    "ADMINISTRATIVE_EXPENSES",
    "GENERAL_EXPENSES",
    "MARKETING_EXPENSES",
    "RESEARCH_DEVELOPMENT",
    "DEPRECIATION_AMORTIZATION",
  ];
  return operatingExpenseCategories.includes(accountCategory.toUpperCase());
}

function isOtherIncome(accountCategory: string): boolean {
  const otherIncomeCategories = [
    "INTEREST_INCOME",
    "INVESTMENT_INCOME",
    "GAIN_ON_SALE",
    "FOREIGN_EXCHANGE_GAIN",
    "OTHER_NON_OPERATING_INCOME",
  ];
  return otherIncomeCategories.includes(accountCategory.toUpperCase());
}

function isOtherExpense(accountCategory: string): boolean {
  const otherExpenseCategories = [
    "INTEREST_EXPENSE",
    "LOSS_ON_SALE",
    "FOREIGN_EXCHANGE_LOSS",
    "OTHER_NON_OPERATING_EXPENSE",
  ];
  return otherExpenseCategories.includes(accountCategory.toUpperCase());
}

/**
 * Calculate section variance percentage
 */
function calculateSectionVariancePercent(accounts: ProfitLossAccount[]): number {
  const currentTotal = accounts.reduce((sum, acc) => sum + acc.currentPeriodAmount, 0);
  const comparativeTotal = accounts.reduce(
    (sum, acc) => sum + (acc.comparativePeriodAmount || 0),
    0,
  );

  if (comparativeTotal === 0) {return 0;}
  return ((currentTotal - comparativeTotal) / Math.abs(comparativeTotal)) * 100;
}

/**
 * Validate profit & loss input parameters
 */
function validateProfitLossInput(input: ProfitLossInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.tenantId) {
    errors.push("Tenant ID is required");
  }

  if (!input.companyId) {
    errors.push("Company ID is required");
  }

  if (!input.startDate) {
    errors.push("Start date is required");
  }

  if (!input.endDate) {
    errors.push("End date is required");
  }

  if (input.startDate && input.endDate && input.startDate >= input.endDate) {
    errors.push("Start date must be before end date");
  }

  if (input.endDate && input.endDate > new Date()) {
    errors.push("End date cannot be in the future");
  }

  if (input.comparativePeriod) {
    if (!input.comparativePeriod.startDate || !input.comparativePeriod.endDate) {
      errors.push("Comparative period requires both start and end dates");
    }

    if (input.comparativePeriod.startDate >= input.comparativePeriod.endDate) {
      errors.push("Comparative period start date must be before end date");
    }
  }

  if (
    input.reportFormat &&
    !["STANDARD", "COMPARATIVE", "MULTI_PERIOD", "DEPARTMENTAL"].includes(input.reportFormat)
  ) {
    errors.push("Invalid report format");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
