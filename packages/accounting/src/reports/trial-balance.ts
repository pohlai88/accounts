// D4 Trial Balance Report Engine - Foundation for All Financial Reports
// V1 Requirement: TB/BS/P&L/CF from GL only
// No relative imports to patch in this file.
export interface TrialBalanceInput {
  tenantId: string;
  companyId: string;
  asOfDate: Date;
  includePeriodActivity?: boolean;
  includeZeroBalances?: boolean;
  accountFilter?: {
    accountTypes?: string[];
    accountIds?: string[];
    accountNumberRange?: { from: string; to: string };
  };
  currency?: string; // Base currency for multi-currency consolidation
}

export interface TrialBalanceAccount {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  accountCategory: string;
  parentAccountId?: string;
  level: number;
  isHeader: boolean;
  openingBalance: number;
  periodDebits: number;
  periodCredits: number;
  closingBalance: number;
  normalBalance: "DEBIT" | "CREDIT";
  currency: string;
}

export interface TrialBalanceResult {
  success: true;
  asOfDate: Date;
  generatedAt: Date;
  currency: string;
  accounts: TrialBalanceAccount[];
  totals: {
    totalDebits: number;
    totalCredits: number;
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
  };
  isBalanced: boolean;
  metadata: {
    totalAccounts: number;
    accountsWithActivity: number;
    oldestTransaction?: Date;
    newestTransaction?: Date;
    generationTime: number;
  };
}

export interface TrialBalanceError {
  success: false;
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

/**
 * Generate Trial Balance from GL journal lines
 * V1 Requirement: All reports must derive from GL only
 */
export async function generateTrialBalance(
  input: TrialBalanceInput,
  dbClient: { query: (sql: string, params?: unknown[]) => Promise<unknown> }, // Database client (Supabase/Drizzle)
): Promise<TrialBalanceResult | TrialBalanceError> {
  const startTime = Date.now();

  try {
    // 1. Validate input parameters
    const validation = validateTrialBalanceInput(input);
    if (!validation.valid) {
      return {
        success: false,
        error: `Input validation failed: ${validation.errors.join(", ")}`,
        code: "INVALID_INPUT",
        details: { errors: validation.errors },
      };
    }

    // 2. Get chart of accounts with hierarchy
    const chartOfAccounts = await getChartOfAccountsHierarchy(
      input.tenantId,
      input.companyId,
      dbClient,
      input.accountFilter,
    );

    if (chartOfAccounts.length === 0) {
      return {
        success: false,
        error: "No accounts found for the specified criteria",
        code: "NO_ACCOUNTS_FOUND",
      };
    }

    // 3. Calculate account balances from GL journal lines
    const accountBalances = await calculateAccountBalances(
      input.tenantId,
      input.companyId,
      input.asOfDate,
      chartOfAccounts,
      dbClient,
      input.includePeriodActivity,
    );

    // 4. Build trial balance accounts with hierarchy
    const trialBalanceAccounts = buildTrialBalanceAccounts(
      chartOfAccounts,
      accountBalances,
      input.includeZeroBalances,
    );

    // 5. Calculate totals and validate balance
    const totals = calculateTrialBalanceTotals(trialBalanceAccounts);
    const isBalanced = Math.abs(totals.totalDebits - totals.totalCredits) < 0.01;

    // 6. Generate metadata
    const metadata = {
      totalAccounts: trialBalanceAccounts.length,
      accountsWithActivity: trialBalanceAccounts.filter(
        a => a.periodDebits > 0 || a.periodCredits > 0 || a.closingBalance !== 0,
      ).length,
      oldestTransaction: accountBalances.oldestTransaction,
      newestTransaction: accountBalances.newestTransaction,
      generationTime: Date.now() - startTime,
    };

    return {
      success: true,
      asOfDate: input.asOfDate,
      generatedAt: new Date(),
      currency: input.currency || "MYR",
      accounts: trialBalanceAccounts,
      totals,
      isBalanced,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "TRIAL_BALANCE_ERROR",
      details: error as Record<string, unknown>,
    };
  }
}

/**
 * Get chart of accounts with hierarchy information
 */
async function getChartOfAccountsHierarchy(
  tenantId: string,
  companyId: string,
  dbClient: unknown,
  accountFilter?: TrialBalanceInput["accountFilter"],
): Promise<
  Array<{
    id: string;
    accountNumber: string;
    accountName: string;
    accountType: string;
    accountCategory: string;
    parentAccountId?: string;
    level: number;
    isHeader: boolean;
    normalBalance: "DEBIT" | "CREDIT";
    isActive: boolean;
  }>
> {
  // Build SQL query with filters
  let query = `
    SELECT
      id,
      account_number,
      account_name,
      account_type,
      account_category,
      parent_account_id,
      level,
      is_header,
      normal_balance,
      is_active
    FROM chart_of_accounts
    WHERE tenant_id = $1
      AND company_id = $2
      AND is_active = true
  `;

  const params = [tenantId, companyId];
  let paramIndex = 3;

  // Apply account type filter
  if (accountFilter?.accountTypes?.length) {
    const typeParams = accountFilter.accountTypes.map((_, i) => `$${paramIndex + i}`).join(",");
    query += ` AND account_type IN (${typeParams})`;
    params.push(...accountFilter.accountTypes);
    paramIndex += accountFilter.accountTypes.length;
  }

  // Apply account ID filter
  if (accountFilter?.accountIds?.length) {
    const idParams = accountFilter.accountIds.map((_, i) => `$${paramIndex + i}`).join(",");
    query += ` AND id IN (${idParams})`;
    params.push(...accountFilter.accountIds);
    paramIndex += accountFilter.accountIds.length;
  }

  // Apply account number range filter
  if (accountFilter?.accountNumberRange) {
    query += ` AND account_number BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
    params.push(accountFilter.accountNumberRange.from);
    params.push(accountFilter.accountNumberRange.to);
    paramIndex += 2;
  }

  query += ` ORDER BY account_number`;

  const { data, error } = await (
    dbClient as {
      query: (sql: string, params?: unknown[]) => Promise<{ data: unknown; error: unknown }>;
    }
  ).query(query, params);

  if (error) {
    throw new Error(`Failed to fetch chart of accounts: ${(error as { message: string }).message}`);
  }

  return (
    (data as Array<{
      id: string;
      accountNumber: string;
      accountName: string;
      accountType: string;
      accountCategory: string;
      parentAccountId?: string;
      level: number;
      isHeader: boolean;
      normalBalance: "DEBIT" | "CREDIT";
      isActive: boolean;
    }>) || []
  );
}

/**
 * Calculate account balances from GL journal lines
 */
async function calculateAccountBalances(
  tenantId: string,
  companyId: string,
  asOfDate: Date,
  accounts: unknown[],
  dbClient: unknown,
  includePeriodActivity: boolean = false,
): Promise<{
  balances: Map<
    string,
    {
      openingBalance: number;
      periodDebits: number;
      periodCredits: number;
      closingBalance: number;
    }
  >;
  oldestTransaction?: Date;
  newestTransaction?: Date;
}> {
  const accountIds = accounts.map(a => (a as { id: string }).id);

  // Get fiscal year start for opening balance calculation
  const fiscalYearStart = await getFiscalYearStart(tenantId, companyId, asOfDate, dbClient);

  // Query GL journal lines for balance calculations
  const query = `
    SELECT
      jl.account_id,
      j.journal_date,
      SUM(CASE WHEN j.journal_date < $3 THEN jl.debit_amount ELSE 0 END) as opening_debits,
      SUM(CASE WHEN j.journal_date < $3 THEN jl.credit_amount ELSE 0 END) as opening_credits,
      SUM(CASE WHEN j.journal_date >= $3 AND j.journal_date <= $4 THEN jl.debit_amount ELSE 0 END) as period_debits,
      SUM(CASE WHEN j.journal_date >= $3 AND j.journal_date <= $4 THEN jl.credit_amount ELSE 0 END) as period_credits,
      MIN(j.journal_date) as oldest_transaction,
      MAX(j.journal_date) as newest_transaction
    FROM gl_journal_lines jl
    JOIN gl_journal j ON jl.journal_id = j.id
    WHERE j.tenant_id = $1
      AND j.company_id = $2
      AND j.status = 'posted'
      AND j.journal_date <= $4
      AND jl.account_id = ANY($5)
    GROUP BY jl.account_id
  `;

  const { data, error } = await (
    dbClient as {
      rpc: (name: string, params: unknown) => Promise<{ data: unknown; error: unknown }>;
    }
  ).rpc("execute_sql", {
    query,
    params: [tenantId, companyId, fiscalYearStart, asOfDate, accountIds],
  });

  if (error) {
    throw new Error(
      `Failed to calculate account balances: ${(error as { message: string }).message}`,
    );
  }

  const balances = new Map();
  let oldestTransaction: Date | undefined;
  let newestTransaction: Date | undefined;

  // Process results and calculate balances
  for (const row of (data as unknown[]) || []) {
    const rowData = row as {
      account_id: string;
      opening_debits: string;
      opening_credits: string;
      period_debits: string;
      period_credits: string;
      journal_date: string;
      oldest_transaction?: string;
      newest_transaction?: string;
    };
    const account = accounts.find(a => (a as { id: string }).id === rowData.account_id);
    if (!account) { continue; }

    const accountData = account as {
      normal_balance: string;
      account_type: string;
      account_name: string;
    };
    const openingDebits = parseFloat(rowData.opening_debits || "0");
    const openingCredits = parseFloat(rowData.opening_credits || "0");
    const periodDebits = parseFloat(rowData.period_debits || "0");
    const periodCredits = parseFloat(rowData.period_credits || "0");

    // Calculate opening balance based on normal balance
    const openingBalance =
      accountData.normal_balance === "DEBIT"
        ? openingDebits - openingCredits
        : openingCredits - openingDebits;

    // Calculate closing balance
    const totalDebits = openingDebits + periodDebits;
    const totalCredits = openingCredits + periodCredits;
    const closingBalance =
      accountData.normal_balance === "DEBIT"
        ? totalDebits - totalCredits
        : totalCredits - totalDebits;

    balances.set(rowData.account_id, {
      openingBalance,
      periodDebits: includePeriodActivity ? periodDebits : 0,
      periodCredits: includePeriodActivity ? periodCredits : 0,
      closingBalance,
    });

    // Track transaction date range
    if (rowData.oldest_transaction) {
      const oldest = new Date(rowData.oldest_transaction);
      if (!oldestTransaction || oldest < oldestTransaction) {
        oldestTransaction = oldest;
      }
    }

    if (rowData.newest_transaction) {
      const newest = new Date(rowData.newest_transaction);
      if (!newestTransaction || newest > newestTransaction) {
        newestTransaction = newest;
      }
    }
  }

  // Add zero balances for accounts with no transactions
  for (const account of accounts) {
    const accountData = account as { id: string };
    if (!balances.has(accountData.id)) {
      balances.set(accountData.id, {
        openingBalance: 0,
        periodDebits: 0,
        periodCredits: 0,
        closingBalance: 0,
      });
    }
  }

  return { balances, oldestTransaction, newestTransaction };
}

/**
 * Build trial balance accounts with calculated balances
 */
function buildTrialBalanceAccounts(
  chartOfAccounts: unknown[],
  accountBalances: { balances: Map<string, unknown> },
  includeZeroBalances: boolean = false,
): TrialBalanceAccount[] {
  const trialBalanceAccounts: TrialBalanceAccount[] = [];

  for (const account of chartOfAccounts) {
    const accountData = account as {
      id: string;
      account_name: string;
      account_type: string;
      normal_balance: string;
      accountNumber?: string;
      accountName?: string;
      accountType?: string;
      accountCategory?: string;
      parentAccountId?: string;
      level?: number;
      isHeader?: boolean;
    };
    const balance = accountBalances.balances.get(accountData.id) || {
      openingBalance: 0,
      periodDebits: 0,
      periodCredits: 0,
      closingBalance: 0,
    };
    const balanceData = balance as {
      openingBalance: number;
      periodDebits: number;
      periodCredits: number;
      closingBalance: number;
    };

    // Skip zero balance accounts if not requested
    if (
      !includeZeroBalances &&
      balanceData.openingBalance === 0 &&
      balanceData.periodDebits === 0 &&
      balanceData.periodCredits === 0 &&
      balanceData.closingBalance === 0
    ) {
      continue;
    }

    trialBalanceAccounts.push({
      accountId: accountData.id,
      accountNumber: accountData.accountNumber || accountData.id,
      accountName: accountData.accountName || accountData.account_name,
      accountType: accountData.accountType || accountData.account_type,
      accountCategory: accountData.accountCategory || "",
      parentAccountId: accountData.parentAccountId,
      level: accountData.level || 0,
      isHeader: accountData.isHeader || false,
      openingBalance: balanceData.openingBalance,
      periodDebits: balanceData.periodDebits,
      periodCredits: balanceData.periodCredits,
      closingBalance: balanceData.closingBalance,
      normalBalance: accountData.normal_balance as "DEBIT" | "CREDIT",
      currency: "MYR", // TODO: Multi-currency support
    });
  }

  return trialBalanceAccounts;
}

/**
 * Calculate trial balance totals
 */
function calculateTrialBalanceTotals(
  accounts: TrialBalanceAccount[],
): TrialBalanceResult["totals"] {
  let totalDebits = 0;
  let totalCredits = 0;
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const account of accounts) {
    // Add to debit/credit totals based on closing balance
    if (account.closingBalance > 0) {
      if (account.normalBalance === "DEBIT") {
        totalDebits += account.closingBalance;
      } else {
        totalCredits += account.closingBalance;
      }
    } else if (account.closingBalance < 0) {
      // Negative balance - reverse the normal side
      if (account.normalBalance === "DEBIT") {
        totalCredits += Math.abs(account.closingBalance);
      } else {
        totalDebits += Math.abs(account.closingBalance);
      }
    }

    // Categorize by account type
    // const absBalance = Math.abs(account.closingBalance); // TODO: Use for balance validation

    switch (account.accountType.toUpperCase()) {
      case "ASSET":
        totalAssets +=
          account.normalBalance === "DEBIT" ? account.closingBalance : -account.closingBalance;
        break;
      case "LIABILITY":
        totalLiabilities +=
          account.normalBalance === "CREDIT" ? account.closingBalance : -account.closingBalance;
        break;
      case "EQUITY":
        totalEquity +=
          account.normalBalance === "CREDIT" ? account.closingBalance : -account.closingBalance;
        break;
      case "REVENUE":
        totalRevenue +=
          account.normalBalance === "CREDIT" ? account.closingBalance : -account.closingBalance;
        break;
      case "EXPENSE":
        totalExpenses +=
          account.normalBalance === "DEBIT" ? account.closingBalance : -account.closingBalance;
        break;
    }
  }

  const netIncome = totalRevenue - totalExpenses;

  return {
    totalDebits: Math.round(totalDebits * 100) / 100,
    totalCredits: Math.round(totalCredits * 100) / 100,
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netIncome: Math.round(netIncome * 100) / 100,
  };
}

/**
 * Get fiscal year start date for opening balance calculation
 */
async function getFiscalYearStart(
  tenantId: string,
  companyId: string,
  asOfDate: Date,
  dbClient: unknown,
): Promise<Date> {
  const query = `
    SELECT fc.fiscal_year_start
    FROM fiscal_calendars fc
    WHERE fc.tenant_id = $1
      AND fc.company_id = $2
      AND fc.is_active = true
      AND $3 BETWEEN fc.fiscal_year_start AND fc.fiscal_year_end
    ORDER BY fc.fiscal_year_start DESC
    LIMIT 1
  `;

  const { data, error } = await (
    dbClient as {
      query: (sql: string, params?: unknown[]) => Promise<{ data: unknown; error: unknown }>;
    }
  ).query(query, [tenantId, companyId, asOfDate]);

  if (error || !data || (data as unknown[]).length === 0) {
    // Default to January 1st of the same year
    const year = asOfDate.getFullYear();
    return new Date(year, 0, 1);
  }

  return new Date(((data as unknown[])[0] as { fiscal_year_start: string }).fiscal_year_start);
}

/**
 * Validate trial balance input parameters
 */
function validateTrialBalanceInput(input: TrialBalanceInput): {
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

  if (!input.asOfDate) {
    errors.push("As of date is required");
  } else if (input.asOfDate > new Date()) {
    errors.push("As of date cannot be in the future");
  }

  if (input.accountFilter?.accountNumberRange) {
    const { from, to } = input.accountFilter.accountNumberRange;
    if (!from || !to) {
      errors.push("Account number range requires both from and to values");
    } else if (from > to) {
      errors.push("Account number range from must be less than or equal to to");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Export trial balance to various formats
 */
export function exportTrialBalance(
  trialBalance: TrialBalanceResult,
  format: "CSV" | "XLSX" | "PDF",
): string | Buffer {
  switch (format) {
    case "CSV":
      return exportTrialBalanceToCSV(trialBalance);
    case "XLSX":
      return exportTrialBalanceToXLSX(trialBalance);
    case "PDF":
      return exportTrialBalanceToPDF(trialBalance);
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
}

/**
 * Export trial balance to CSV format
 */
function exportTrialBalanceToCSV(trialBalance: TrialBalanceResult): string {
  const headers = [
    "Account Number",
    "Account Name",
    "Account Type",
    "Opening Balance",
    "Period Debits",
    "Period Credits",
    "Closing Balance",
  ];

  const rows = trialBalance.accounts.map(account => [
    account.accountNumber,
    account.accountName,
    account.accountType,
    account.openingBalance.toFixed(2),
    account.periodDebits.toFixed(2),
    account.periodCredits.toFixed(2),
    account.closingBalance.toFixed(2),
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(","))
    .join("\n");

  return csvContent;
}

/**
 * Export trial balance to XLSX format (placeholder)
 */
function exportTrialBalanceToXLSX(_trialBalance: TrialBalanceResult): Buffer {
  // TODO: Implement XLSX export using a library like xlsx or exceljs
  throw new Error("XLSX export not yet implemented");
}

/**
 * Export trial balance to PDF format (placeholder)
 */
function exportTrialBalanceToPDF(_trialBalance: TrialBalanceResult): Buffer {
  // TODO: Implement PDF export using the Puppeteer pool
  throw new Error("PDF export not yet implemented");
}
