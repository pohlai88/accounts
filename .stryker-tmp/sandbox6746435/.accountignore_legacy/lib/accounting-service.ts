// @ts-nocheck
import { supabase } from "./supabase";
import { AccountingEngine } from "./accounting-engine";
import type {
  Account,
  GLEntry,
  Company,
  CreateAccountInput,
  CreateGLEntryInput,
  AccountHierarchy,
  TrialBalanceRow,
  AccountBalance,
  ApiResponse,
  ValidationResult,
  ValidationError,
} from "./supabase";

/**
 * Accounting Service Layer
 * Implements business logic and data access patterns
 * Follows repository pattern with validation
 */

export class AccountingService {
  /**
   * Company Management
   */
  static async createCompany(data: {
    name: string;
    default_currency?: string;
    fiscal_year_start?: string;
    country?: string;
  }): Promise<ApiResponse<Company>> {
    try {
      // Validation
      const validation = this.validateCompanyData(data);
      if (!validation.valid) {
        return { error: validation.errors.map(e => e.message).join(", ") };
      }

      // Create company
      const { data: company, error } = await supabase
        .from("companies")
        .insert([
          {
            name: data.name.trim(),
            default_currency: data.default_currency || "USD",
            fiscal_year_start: data.fiscal_year_start || "2024-01-01",
            country: data.country,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Create default chart of accounts
      await supabase.rpc("create_default_accounts", { p_company_id: company.id });

      return { data: company, message: "Company created successfully" };
    } catch (error) {
      console.error("Error creating company:", error);
      return { error: "Failed to create company" };
    }
  }

  /**
   * Account Management
   */
  static async createAccount(data: CreateAccountInput): Promise<ApiResponse<Account>> {
    try {
      // Validation
      const validation = this.validateAccountData(data);
      if (!validation.valid) {
        return { error: validation.errors.map(e => e.message).join(", ") };
      }

      // Check for duplicate account code
      if (data.account_code) {
        const { data: existing } = await supabase
          .from("accounts")
          .select("id")
          .eq("company_id", data.company_id)
          .eq("account_code", data.account_code)
          .single();

        if (existing) {
          return { error: "Account code already exists" };
        }
      }

      // Create account
      const { data: account, error } = await supabase
        .from("accounts")
        .insert([
          {
            name: data.name.trim(),
            account_type: data.account_type,
            parent_id: data.parent_id,
            account_code: data.account_code,
            currency: data.currency || "USD",
            company_id: data.company_id,
            is_group: data.is_group || false,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { data: account, message: "Account created successfully" };
    } catch (error) {
      console.error("Error creating account:", error);
      return { error: "Failed to create account" };
    }
  }

  static async getAccountHierarchy(companyId: string): Promise<ApiResponse<AccountHierarchy[]>> {
    try {
      const { data: accounts, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("account_code", { ascending: true });

      if (error) throw error;

      // Build hierarchy
      const hierarchy = this.buildAccountHierarchy(accounts || []);

      // Add balances
      const hierarchyWithBalances = await this.addBalancesToHierarchy(hierarchy);

      return { data: hierarchyWithBalances };
    } catch (error) {
      console.error("Error fetching account hierarchy:", error);
      return { error: "Failed to fetch accounts" };
    }
  }

  static async updateAccount(
    id: string,
    data: Partial<CreateAccountInput>,
  ): Promise<ApiResponse<Account>> {
    try {
      const { data: account, error } = await supabase
        .from("accounts")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return { data: account, message: "Account updated successfully" };
    } catch (error) {
      console.error("Error updating account:", error);
      return { error: "Failed to update account" };
    }
  }

  static async deleteAccount(id: string): Promise<ApiResponse<void>> {
    try {
      // Check if account has GL entries
      const { data: glEntries } = await supabase
        .from("gl_entries")
        .select("id")
        .eq("account_id", id)
        .limit(1);

      if (glEntries && glEntries.length > 0) {
        return { error: "Cannot delete account with existing transactions" };
      }

      // Check if account has child accounts
      const { data: children } = await supabase
        .from("accounts")
        .select("id")
        .eq("parent_id", id)
        .limit(1);

      if (children && children.length > 0) {
        return { error: "Cannot delete account with child accounts" };
      }

      // Soft delete by marking inactive
      const { error } = await supabase
        .from("accounts")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      return { message: "Account deleted successfully" };
    } catch (error) {
      console.error("Error deleting account:", error);
      return { error: "Failed to delete account" };
    }
  }

  /**
   * GL Entry Management
   */
  static async createGLEntries(entries: CreateGLEntryInput[]): Promise<ApiResponse<GLEntry[]>> {
    try {
      // Validation
      const validation = this.validateGLEntries(entries);
      if (!validation.valid) {
        return { error: validation.errors.map(e => e.message).join(", ") };
      }

      // Validate double-entry balance
      try {
        AccountingEngine.validateTransaction(entries);
      } catch (error) {
        return { error: (error as Error).message };
      }

      // Create entries
      const { data: glEntries, error } = await supabase.from("gl_entries").insert(entries).select();

      if (error) throw error;

      return { data: glEntries || [], message: "GL entries created successfully" };
    } catch (error) {
      console.error("Error creating GL entries:", error);
      return { error: "Failed to create GL entries" };
    }
  }

  static async getGLEntries(
    companyId: string,
    filters?: {
      accountId?: string;
      voucherType?: string;
      voucherNo?: string;
      fromDate?: string;
      toDate?: string;
    },
  ): Promise<ApiResponse<GLEntry[]>> {
    try {
      let query = supabase
        .from("gl_entries")
        .select(
          `
          *,
          accounts!inner(name, account_type, account_code)
        `,
        )
        .eq("company_id", companyId);

      if (filters?.accountId) {
        query = query.eq("account_id", filters.accountId);
      }
      if (filters?.voucherType) {
        query = query.eq("voucher_type", filters.voucherType);
      }
      if (filters?.voucherNo) {
        query = query.eq("voucher_no", filters.voucherNo);
      }
      if (filters?.fromDate) {
        query = query.gte("posting_date", filters.fromDate);
      }
      if (filters?.toDate) {
        query = query.lte("posting_date", filters.toDate);
      }

      const { data, error } = await query.order("posting_date", { ascending: false });

      if (error) throw error;

      return { data: data || [] };
    } catch (error) {
      console.error("Error fetching GL entries:", error);
      return { error: "Failed to fetch GL entries" };
    }
  }

  /**
   * Financial Reports
   */
  static async getTrialBalance(
    companyId: string,
    asOfDate?: string,
  ): Promise<ApiResponse<TrialBalanceRow[]>> {
    try {
      const { data, error } = await supabase.rpc("get_trial_balance", {
        p_company_id: companyId,
        p_as_of_date: asOfDate || new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      return { data: data || [] };
    } catch (error) {
      console.error("Error generating trial balance:", error);
      return { error: "Failed to generate trial balance" };
    }
  }

  static async getAccountBalance(
    accountId: string,
    asOfDate?: string,
  ): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase.rpc("get_account_balance", {
        p_account_id: accountId,
        p_as_of_date: asOfDate || new Date().toISOString().split("T")[0],
      });

      if (error) throw error;

      return { data: data || 0 };
    } catch (error) {
      console.error("Error getting account balance:", error);
      return { error: "Failed to get account balance" };
    }
  }

  /**
   * Validation Methods
   */
  private static validateCompanyData(data: any): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: "name", message: "Company name is required" });
    }

    if (data.name && data.name.trim().length > 255) {
      errors.push({ field: "name", message: "Company name must be less than 255 characters" });
    }

    if (data.default_currency && data.default_currency.length !== 3) {
      errors.push({ field: "default_currency", message: "Currency must be 3 characters" });
    }

    return { valid: errors.length === 0, errors };
  }

  private static validateAccountData(data: CreateAccountInput): ValidationResult {
    const errors: ValidationError[] = [];

    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: "name", message: "Account name is required" });
    }

    if (!data.account_type) {
      errors.push({ field: "account_type", message: "Account type is required" });
    }

    if (!data.company_id) {
      errors.push({ field: "company_id", message: "Company ID is required" });
    }

    if (data.account_code && data.account_code.length > 50) {
      errors.push({
        field: "account_code",
        message: "Account code must be less than 50 characters",
      });
    }

    return { valid: errors.length === 0, errors };
  }

  private static validateGLEntries(entries: CreateGLEntryInput[]): ValidationResult {
    const errors: ValidationError[] = [];

    if (!entries || entries.length === 0) {
      errors.push({ field: "entries", message: "At least one GL entry is required" });
      return { valid: false, errors };
    }

    entries.forEach((entry, index) => {
      if (!entry.account_id) {
        errors.push({ field: `entries[${index}].account_id`, message: "Account ID is required" });
      }
      if (!entry.voucher_no || entry.voucher_no.trim().length === 0) {
        errors.push({
          field: `entries[${index}].voucher_no`,
          message: "Voucher number is required",
        });
      }
      if (!entry.posting_date) {
        errors.push({
          field: `entries[${index}].posting_date`,
          message: "Posting date is required",
        });
      }
      if (entry.debit < 0 || entry.credit < 0) {
        errors.push({ field: `entries[${index}]`, message: "Amounts cannot be negative" });
      }
      if (entry.debit === 0 && entry.credit === 0) {
        errors.push({
          field: `entries[${index}]`,
          message: "Either debit or credit must be greater than zero",
        });
      }
      if (entry.debit > 0 && entry.credit > 0) {
        errors.push({
          field: `entries[${index}]`,
          message: "Entry cannot have both debit and credit amounts",
        });
      }
    });

    return { valid: errors.length === 0, errors };
  }

  /**
   * Helper Methods
   */
  private static buildAccountHierarchy(accounts: Account[]): AccountHierarchy[] {
    const accountMap = new Map<string, AccountHierarchy>();
    const rootAccounts: AccountHierarchy[] = [];

    // Create map with level 0
    accounts.forEach(account => {
      accountMap.set(account.id, { ...account, children: [], level: 0 });
    });

    // Build hierarchy
    accounts.forEach(account => {
      const hierarchyAccount = accountMap.get(account.id)!;

      if (account.parent_id) {
        const parent = accountMap.get(account.parent_id);
        if (parent) {
          parent.children!.push(hierarchyAccount);
          hierarchyAccount.level = parent.level + 1;
        }
      } else {
        rootAccounts.push(hierarchyAccount);
      }
    });

    return rootAccounts;
  }

  private static async addBalancesToHierarchy(
    hierarchy: AccountHierarchy[],
  ): Promise<AccountHierarchy[]> {
    // For now, return hierarchy without balances
    // In Phase 6, we'll add actual balance calculations
    return hierarchy;
  }
}
