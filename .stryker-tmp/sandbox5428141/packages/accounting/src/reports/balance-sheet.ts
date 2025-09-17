// @ts-nocheck
// D4 Balance Sheet Report Engine - Financial Position Statement
// V1 Requirement: BS from GL only with proper classification

import {
  generateTrialBalance,
  type TrialBalanceAccount,
  type TrialBalanceResult,
} from "./trial-balance.js";

export interface BalanceSheetInput {
  tenantId: string;
  companyId: string;
  asOfDate: Date;
  comparativePeriod?: Date; // For comparative balance sheet
  includeZeroBalances?: boolean;
  currency?: string;
  reportFormat?: "STANDARD" | "COMPARATIVE" | "CONSOLIDATED";
}

export interface BalanceSheetSection {
  sectionName: string;
  sectionType: "ASSET" | "LIABILITY" | "EQUITY";
  accounts: BalanceSheetAccount[];
  subtotal: number;
  comparativeSubtotal?: number;
}

export interface BalanceSheetAccount {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  accountCategory: string;
  level: number;
  isHeader: boolean;
  currentBalance: number;
  comparativeBalance?: number;
  variance?: number;
  variancePercent?: number;
  parentAccountId?: string;
}

export interface BalanceSheetResult {
  success: true;
  asOfDate: Date;
  comparativeDate?: Date;
  generatedAt: Date;
  currency: string;
  reportFormat: string;

  // Main sections
  assets: BalanceSheetSection[];
  liabilities: BalanceSheetSection[];
  equity: BalanceSheetSection[];

  // Totals
  totals: {
    totalAssets: number;
    totalCurrentAssets: number;
    totalNonCurrentAssets: number;
    totalLiabilities: number;
    totalCurrentLiabilities: number;
    totalNonCurrentLiabilities: number;
    totalEquity: number;
    retainedEarnings: number;

    // Comparative totals (if applicable)
    comparativeTotalAssets?: number;
    comparativeTotalLiabilities?: number;
    comparativeTotalEquity?: number;
  };

  // Validation
  isBalanced: boolean;
  balanceCheck: {
    assetsEqualsLiabilitiesPlusEquity: boolean;
    difference: number;
  };

  metadata: {
    totalAccounts: number;
    accountsWithBalances: number;
    generationTime: number;
    basedOnTrialBalance: boolean;
  };
}

export interface BalanceSheetError {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Generate Balance Sheet from Trial Balance data
 * V1 Requirement: All reports derive from GL journal lines
 */
export async function generateBalanceSheet(
  input: BalanceSheetInput,
  dbClient: { query: (sql: string, params?: unknown[]) => Promise<unknown> },
): Promise<BalanceSheetResult | BalanceSheetError> {
  const startTime = Date.now();

  try {
    // 1. Validate input parameters
    const validation = validateBalanceSheetInput(input);
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
        asOfDate: input.asOfDate,
        includeZeroBalances: input.includeZeroBalances || false,
        currency: input.currency,
      },
      dbClient,
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
          asOfDate: input.comparativePeriod,
          includeZeroBalances: input.includeZeroBalances || false,
          currency: input.currency,
        },
        dbClient,
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

    // 4. Calculate retained earnings from P&L accounts
    const retainedEarnings = calculateRetainedEarnings(currentTrialBalance.accounts);

    // 5. Classify accounts into balance sheet sections
    const { assets, liabilities, equity } = classifyBalanceSheetAccounts(
      currentTrialBalance.accounts,
      comparativeTrialBalance?.accounts,
      retainedEarnings,
    );

    // 6. Calculate totals
    const totals = calculateBalanceSheetTotals(
      assets,
      liabilities,
      equity,
      comparativeTrialBalance?.accounts,
    );

    // 7. Validate balance sheet equation
    const balanceCheck = validateBalanceSheetEquation(totals);

    // 8. Generate metadata
    const metadata = {
      totalAccounts: currentTrialBalance.accounts.length,
      accountsWithBalances: currentTrialBalance.accounts.filter(a => a.closingBalance !== 0).length,
      generationTime: Date.now() - startTime,
      basedOnTrialBalance: true,
    };

    return {
      success: true,
      asOfDate: input.asOfDate,
      comparativeDate: input.comparativePeriod,
      generatedAt: new Date(),
      currency: input.currency || "MYR",
      reportFormat: input.reportFormat || "STANDARD",
      assets,
      liabilities,
      equity,
      totals,
      isBalanced: balanceCheck.assetsEqualsLiabilitiesPlusEquity,
      balanceCheck,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      code: "BALANCE_SHEET_ERROR",
      details: error,
    };
  }
}

/**
 * Calculate retained earnings from revenue and expense accounts
 */
function calculateRetainedEarnings(trialBalanceAccounts: TrialBalanceAccount[]): number {
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const account of trialBalanceAccounts) {
    switch (account.accountType.toUpperCase()) {
      case "REVENUE":
        // Revenue accounts have credit normal balance
        totalRevenue +=
          account.normalBalance === "CREDIT" ? account.closingBalance : -account.closingBalance;
        break;
      case "EXPENSE":
        // Expense accounts have debit normal balance
        totalExpenses +=
          account.normalBalance === "DEBIT" ? account.closingBalance : -account.closingBalance;
        break;
    }
  }

  return totalRevenue - totalExpenses; // Net income
}

/**
 * Classify trial balance accounts into balance sheet sections
 */
function classifyBalanceSheetAccounts(
  currentAccounts: TrialBalanceAccount[],
  comparativeAccounts?: TrialBalanceAccount[],
  retainedEarnings?: number,
): {
  assets: BalanceSheetSection[];
  liabilities: BalanceSheetSection[];
  equity: BalanceSheetSection[];
} {
  // Create comparative lookup map
  const comparativeMap = new Map<string, TrialBalanceAccount>();
  if (comparativeAccounts) {
    for (const account of comparativeAccounts) {
      comparativeMap.set(account.accountId, account);
    }
  }

  // Filter balance sheet accounts (exclude P&L accounts)
  const balanceSheetAccounts = currentAccounts.filter(account =>
    ["ASSET", "LIABILITY", "EQUITY"].includes(account.accountType.toUpperCase()),
  );

  // Group accounts by type and category
  const assetAccounts = balanceSheetAccounts.filter(a => a.accountType.toUpperCase() === "ASSET");
  const liabilityAccounts = balanceSheetAccounts.filter(
    a => a.accountType.toUpperCase() === "LIABILITY",
  );
  const equityAccounts = balanceSheetAccounts.filter(a => a.accountType.toUpperCase() === "EQUITY");

  // Build balance sheet accounts with comparative data
  const buildBalanceSheetAccounts = (accounts: TrialBalanceAccount[]): BalanceSheetAccount[] => {
    return accounts.map(account => {
      const comparativeAccount = comparativeMap.get(account.accountId);
      const comparativeBalance = comparativeAccount?.closingBalance || 0;
      const variance = account.closingBalance - comparativeBalance;
      const variancePercent =
        comparativeBalance !== 0 ? (variance / Math.abs(comparativeBalance)) * 100 : 0;

      return {
        accountId: account.accountId,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        accountCategory: account.accountCategory,
        level: account.level,
        isHeader: account.isHeader,
        currentBalance: account.closingBalance,
        comparativeBalance: comparativeAccounts ? comparativeBalance : undefined,
        variance: comparativeAccounts ? variance : undefined,
        variancePercent: comparativeAccounts ? variancePercent : undefined,
        parentAccountId: account.parentAccountId,
      };
    });
  };

  // Create asset sections
  const assets = createAssetSections(buildBalanceSheetAccounts(assetAccounts));

  // Create liability sections
  const liabilities = createLiabilitySection(buildBalanceSheetAccounts(liabilityAccounts));

  // Create equity sections (including retained earnings)
  const equity = createEquitySection(
    buildBalanceSheetAccounts(equityAccounts),
    retainedEarnings || 0,
    comparativeAccounts ? calculateRetainedEarnings(comparativeAccounts) : undefined,
  );

  return { assets, liabilities, equity };
}

/**
 * Create asset sections (Current Assets, Non-Current Assets)
 */
function createAssetSections(assetAccounts: BalanceSheetAccount[]): BalanceSheetSection[] {
  // Classify assets as current or non-current based on account category
  const currentAssets = assetAccounts.filter(account => isCurrentAsset(account.accountCategory));

  const nonCurrentAssets = assetAccounts.filter(
    account => !isCurrentAsset(account.accountCategory),
  );

  const sections: BalanceSheetSection[] = [];

  if (currentAssets.length > 0) {
    sections.push({
      sectionName: "Current Assets",
      sectionType: "ASSET",
      accounts: currentAssets.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
      subtotal: currentAssets.reduce((sum, acc) => sum + acc.currentBalance, 0),
      comparativeSubtotal: currentAssets.reduce(
        (sum, acc) => sum + (acc.comparativeBalance || 0),
        0,
      ),
    });
  }

  if (nonCurrentAssets.length > 0) {
    sections.push({
      sectionName: "Non-Current Assets",
      sectionType: "ASSET",
      accounts: nonCurrentAssets.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
      subtotal: nonCurrentAssets.reduce((sum, acc) => sum + acc.currentBalance, 0),
      comparativeSubtotal: nonCurrentAssets.reduce(
        (sum, acc) => sum + (acc.comparativeBalance || 0),
        0,
      ),
    });
  }

  return sections;
}

/**
 * Create liability section (Current Liabilities, Non-Current Liabilities)
 */
function createLiabilitySection(liabilityAccounts: BalanceSheetAccount[]): BalanceSheetSection[] {
  // Classify liabilities as current or non-current
  const currentLiabilities = liabilityAccounts.filter(account =>
    isCurrentLiability(account.accountCategory),
  );

  const nonCurrentLiabilities = liabilityAccounts.filter(
    account => !isCurrentLiability(account.accountCategory),
  );

  const sections: BalanceSheetSection[] = [];

  if (currentLiabilities.length > 0) {
    sections.push({
      sectionName: "Current Liabilities",
      sectionType: "LIABILITY",
      accounts: currentLiabilities.sort((a, b) => a.accountNumber.localeCompare(b.accountNumber)),
      subtotal: currentLiabilities.reduce((sum, acc) => sum + acc.currentBalance, 0),
      comparativeSubtotal: currentLiabilities.reduce(
        (sum, acc) => sum + (acc.comparativeBalance || 0),
        0,
      ),
    });
  }

  if (nonCurrentLiabilities.length > 0) {
    sections.push({
      sectionName: "Non-Current Liabilities",
      sectionType: "LIABILITY",
      accounts: nonCurrentLiabilities.sort((a, b) =>
        a.accountNumber.localeCompare(b.accountNumber),
      ),
      subtotal: nonCurrentLiabilities.reduce((sum, acc) => sum + acc.currentBalance, 0),
      comparativeSubtotal: nonCurrentLiabilities.reduce(
        (sum, acc) => sum + (acc.comparativeBalance || 0),
        0,
      ),
    });
  }

  return sections;
}

/**
 * Create equity section including retained earnings
 */
function createEquitySection(
  equityAccounts: BalanceSheetAccount[],
  retainedEarnings: number,
  comparativeRetainedEarnings?: number,
): BalanceSheetSection[] {
  // Add retained earnings as a virtual account
  const retainedEarningsAccount: BalanceSheetAccount = {
    accountId: "retained-earnings",
    accountNumber: "9999",
    accountName: "Retained Earnings",
    accountType: "EQUITY",
    accountCategory: "RETAINED_EARNINGS",
    level: 0,
    isHeader: false,
    currentBalance: retainedEarnings,
    comparativeBalance: comparativeRetainedEarnings,
    variance: comparativeRetainedEarnings
      ? retainedEarnings - comparativeRetainedEarnings
      : undefined,
    variancePercent:
      comparativeRetainedEarnings && comparativeRetainedEarnings !== 0
        ? ((retainedEarnings - comparativeRetainedEarnings) /
            Math.abs(comparativeRetainedEarnings)) *
          100
        : undefined,
  };

  const allEquityAccounts = [...equityAccounts, retainedEarningsAccount].sort((a, b) =>
    a.accountNumber.localeCompare(b.accountNumber),
  );

  return [
    {
      sectionName: "Equity",
      sectionType: "EQUITY",
      accounts: allEquityAccounts,
      subtotal: allEquityAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
      comparativeSubtotal: allEquityAccounts.reduce(
        (sum, acc) => sum + (acc.comparativeBalance || 0),
        0,
      ),
    },
  ];
}

/**
 * Calculate balance sheet totals
 */
function calculateBalanceSheetTotals(
  assets: BalanceSheetSection[],
  liabilities: BalanceSheetSection[],
  equity: BalanceSheetSection[],
  comparativeAccounts?: TrialBalanceAccount[],
): BalanceSheetResult["totals"] {
  const totalAssets = assets.reduce((sum, section) => sum + section.subtotal, 0);
  const totalCurrentAssets = assets.find(s => s.sectionName === "Current Assets")?.subtotal || 0;
  const totalNonCurrentAssets =
    assets.find(s => s.sectionName === "Non-Current Assets")?.subtotal || 0;

  const totalLiabilities = liabilities.reduce((sum, section) => sum + section.subtotal, 0);
  const totalCurrentLiabilities =
    liabilities.find(s => s.sectionName === "Current Liabilities")?.subtotal || 0;
  const totalNonCurrentLiabilities =
    liabilities.find(s => s.sectionName === "Non-Current Liabilities")?.subtotal || 0;

  const totalEquity = equity.reduce((sum, section) => sum + section.subtotal, 0);
  const retainedEarnings =
    equity[0]?.accounts.find(a => a.accountId === "retained-earnings")?.currentBalance || 0;

  // Comparative totals
  let comparativeTotalAssets: number | undefined;
  let comparativeTotalLiabilities: number | undefined;
  let comparativeTotalEquity: number | undefined;

  if (comparativeAccounts) {
    comparativeTotalAssets = assets.reduce(
      (sum, section) => sum + (section.comparativeSubtotal || 0),
      0,
    );
    comparativeTotalLiabilities = liabilities.reduce(
      (sum, section) => sum + (section.comparativeSubtotal || 0),
      0,
    );
    comparativeTotalEquity = equity.reduce(
      (sum, section) => sum + (section.comparativeSubtotal || 0),
      0,
    );
  }

  return {
    totalAssets: Math.round(totalAssets * 100) / 100,
    totalCurrentAssets: Math.round(totalCurrentAssets * 100) / 100,
    totalNonCurrentAssets: Math.round(totalNonCurrentAssets * 100) / 100,
    totalLiabilities: Math.round(totalLiabilities * 100) / 100,
    totalCurrentLiabilities: Math.round(totalCurrentLiabilities * 100) / 100,
    totalNonCurrentLiabilities: Math.round(totalNonCurrentLiabilities * 100) / 100,
    totalEquity: Math.round(totalEquity * 100) / 100,
    retainedEarnings: Math.round(retainedEarnings * 100) / 100,
    comparativeTotalAssets: comparativeTotalAssets
      ? Math.round(comparativeTotalAssets * 100) / 100
      : undefined,
    comparativeTotalLiabilities: comparativeTotalLiabilities
      ? Math.round(comparativeTotalLiabilities * 100) / 100
      : undefined,
    comparativeTotalEquity: comparativeTotalEquity
      ? Math.round(comparativeTotalEquity * 100) / 100
      : undefined,
  };
}

/**
 * Validate balance sheet equation: Assets = Liabilities + Equity
 */
function validateBalanceSheetEquation(totals: BalanceSheetResult["totals"]): {
  assetsEqualsLiabilitiesPlusEquity: boolean;
  difference: number;
} {
  const liabilitiesPlusEquity = totals.totalLiabilities + totals.totalEquity;
  const difference = totals.totalAssets - liabilitiesPlusEquity;
  const tolerance = 0.01; // 1 cent tolerance for rounding

  return {
    assetsEqualsLiabilitiesPlusEquity: Math.abs(difference) <= tolerance,
    difference: Math.round(difference * 100) / 100,
  };
}

/**
 * Determine if an account category represents a current asset
 */
function isCurrentAsset(accountCategory: string): boolean {
  const currentAssetCategories = [
    "CASH",
    "CASH_EQUIVALENTS",
    "ACCOUNTS_RECEIVABLE",
    "INVENTORY",
    "PREPAID_EXPENSES",
    "SHORT_TERM_INVESTMENTS",
    "OTHER_CURRENT_ASSETS",
  ];

  return currentAssetCategories.includes(accountCategory.toUpperCase());
}

/**
 * Determine if an account category represents a current liability
 */
function isCurrentLiability(accountCategory: string): boolean {
  const currentLiabilityCategories = [
    "ACCOUNTS_PAYABLE",
    "ACCRUED_LIABILITIES",
    "SHORT_TERM_DEBT",
    "CURRENT_PORTION_LONG_TERM_DEBT",
    "DEFERRED_REVENUE",
    "OTHER_CURRENT_LIABILITIES",
  ];

  return currentLiabilityCategories.includes(accountCategory.toUpperCase());
}

/**
 * Validate balance sheet input parameters
 */
function validateBalanceSheetInput(input: BalanceSheetInput): {
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

  if (input.comparativePeriod) {
    if (input.comparativePeriod > input.asOfDate) {
      errors.push("Comparative period must be before the as of date");
    }
  }

  if (
    input.reportFormat &&
    !["STANDARD", "COMPARATIVE", "CONSOLIDATED"].includes(input.reportFormat)
  ) {
    errors.push("Invalid report format. Must be STANDARD, COMPARATIVE, or CONSOLIDATED");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
