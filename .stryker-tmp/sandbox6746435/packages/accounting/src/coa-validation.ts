// @ts-nocheck
import { z } from "zod";
import { type AccountInfo } from "@aibos/db";

// Account Types as defined in the database schema
export const AccountTypeSchema = z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]);
export type AccountType = z.infer<typeof AccountTypeSchema>;

// COA validation error class
export class COAValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "COAValidationError";
  }
}

// Normal balance rules for each account type
const NORMAL_BALANCES: Record<string, "debit" | "credit"> = {
  ASSET: "debit",
  EXPENSE: "debit",
  LIABILITY: "credit",
  EQUITY: "credit",
  REVENUE: "credit",
};

/**
 * Validate that all accounts exist and are active
 */
export function validateAccountsExist(
  accountIds: string[],
  accounts: Map<string, AccountInfo>,
): void {
  const missingAccounts: string[] = [];
  const inactiveAccounts: AccountInfo[] = [];

  for (const accountId of accountIds) {
    const account = accounts.get(accountId);

    if (!account) {
      missingAccounts.push(accountId);
    } else if (!account.isActive) {
      inactiveAccounts.push(account);
    }
  }

  if (missingAccounts.length > 0) {
    throw new COAValidationError(
      `Account(s) not found: ${missingAccounts.join(", ")}`,
      "ACCOUNTS_NOT_FOUND",
      { missingAccountIds: missingAccounts },
    );
  }

  if (inactiveAccounts.length > 0) {
    throw new COAValidationError(
      `Inactive account(s) cannot be used: ${inactiveAccounts.map(a => `${a.code} - ${a.name}`).join(", ")}`,
      "INACTIVE_ACCOUNTS",
      { inactiveAccounts: inactiveAccounts.map(a => ({ id: a.id, code: a.code, name: a.name })) },
    );
  }
}

/**
 * Validate currency consistency across all accounts
 */
export function validateCurrencyConsistency(
  journalCurrency: string,
  accounts: Map<string, AccountInfo>,
  accountIds: string[],
): void {
  const currencyMismatches: Array<{
    accountId: string;
    accountCurrency: string;
    code: string;
    name: string;
  }> = [];

  for (const accountId of accountIds) {
    const account = accounts.get(accountId);
    if (account && account.currency !== journalCurrency) {
      currencyMismatches.push({
        accountId,
        accountCurrency: account.currency,
        code: account.code,
        name: account.name,
      });
    }
  }

  if (currencyMismatches.length > 0) {
    throw new COAValidationError(
      `Currency mismatch: Journal currency is ${journalCurrency}, but some accounts have different currencies`,
      "CURRENCY_MISMATCH",
      {
        journalCurrency,
        mismatches: currencyMismatches,
      },
    );
  }
}

/**
 * Validate normal balance rules (warning only, not blocking)
 * Assets and Expenses normally have debit balances
 * Liabilities, Equity, and Revenue normally have credit balances
 */
export function validateNormalBalances(
  lines: Array<{ accountId: string; debit: number; credit: number }>,
  accounts: Map<string, AccountInfo>,
): Array<{
  accountId: string;
  warning: string;
  accountType: string;
  amount: number;
  side: "debit" | "credit";
}> {
  const warnings: Array<{
    accountId: string;
    warning: string;
    accountType: string;
    amount: number;
    side: "debit" | "credit";
  }> = [];

  for (const line of lines) {
    const account = accounts.get(line.accountId);
    if (!account) {continue;} // Will be caught by validateAccountsExist

    const normalBalance = NORMAL_BALANCES[account.accountType];
    const isDebitEntry = line.debit > 0;
    const isCreditEntry = line.credit > 0;

    // Check if entry is against normal balance
    if (normalBalance === "debit" && isCreditEntry) {
      warnings.push({
        accountId: line.accountId,
        warning: `${account.accountType} account "${account.code} - ${account.name}" normally has debit balance, but credit entry of ${line.credit} was made`,
        accountType: account.accountType,
        amount: line.credit,
        side: "credit",
      });
    } else if (normalBalance === "credit" && isDebitEntry) {
      warnings.push({
        accountId: line.accountId,
        warning: `${account.accountType} account "${account.code} - ${account.name}" normally has credit balance, but debit entry of ${line.debit} was made`,
        accountType: account.accountType,
        amount: line.debit,
        side: "debit",
      });
    }
  }

  return warnings;
}

/**
 * Validate control account restrictions
 * Control accounts (level 0 or with children) should not allow direct posting
 */
export function validateControlAccounts(
  accountIds: string[],
  accounts: Map<string, AccountInfo>,
  allAccounts: AccountInfo[], // Needed to check for children
): void {
  const controlAccountViolations: Array<{
    accountId: string;
    code: string;
    name: string;
    reason: string;
  }> = [];

  for (const accountId of accountIds) {
    const account = accounts.get(accountId);
    if (!account) {continue;} // Will be caught by validateAccountsExist

    // Check if account is a control account (has children)
    const hasChildren = allAccounts.some(a => a.parentId === accountId);

    if (hasChildren) {
      controlAccountViolations.push({
        accountId,
        code: account.code,
        name: account.name,
        reason: "Control account with sub-accounts cannot be posted to directly",
      });
    }

    // Additional rule: Level 0 accounts are typically control accounts
    if (account.level === 0) {
      controlAccountViolations.push({
        accountId,
        code: account.code,
        name: account.name,
        reason: "Top-level control account (level 0) cannot be posted to directly",
      });
    }
  }

  if (controlAccountViolations.length > 0) {
    throw new COAValidationError(
      `Control account violations: ${controlAccountViolations.map(v => `${v.code} - ${v.reason}`).join("; ")}`,
      "CONTROL_ACCOUNT_VIOLATION",
      { violations: controlAccountViolations },
    );
  }
}

/**
 * Main COA validation function
 */
export interface COAValidationResult {
  valid: boolean;
  warnings: Array<{
    accountId: string;
    warning: string;
    accountType: string;
    amount: number;
    side: "debit" | "credit";
  }>;
  accountDetails: Map<string, AccountInfo>;
}

export async function validateCOAFlags(
  lines: Array<{ accountId: string; debit: number; credit: number }>,
  journalCurrency: string,
  accounts: Map<string, AccountInfo>,
  allAccounts: AccountInfo[],
): Promise<COAValidationResult> {
  const accountIds = lines.map(line => line.accountId);

  // 1. Validate accounts exist and are active
  validateAccountsExist(accountIds, accounts);

  // 2. Validate currency consistency
  validateCurrencyConsistency(journalCurrency, accounts, accountIds);

  // 3. Validate control account restrictions
  validateControlAccounts(accountIds, accounts, allAccounts);

  // 4. Check normal balance warnings (non-blocking)
  const warnings = validateNormalBalances(lines, accounts);

  return {
    valid: true,
    warnings,
    accountDetails: accounts,
  };
}
