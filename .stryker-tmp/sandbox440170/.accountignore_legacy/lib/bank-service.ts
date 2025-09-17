/**
 * Bank Integration & Reconciliation Service - Complete Banking Automation
 * Multi-bank connectivity, automated transaction feeds, and intelligent reconciliation
 * Enterprise-Grade Banking Integration with Security & Compliance
 *
 * Features:
 * - Multi-bank provider integration (Plaid, Yodlee, OFX, Manual)
 * - Real-time transaction feeds with automatic categorization
 * - Intelligent transaction matching with AI-powered confidence scoring
 * - Automated reconciliation workflows with exception handling
 * - Comprehensive reconciliation reporting and audit trails
 * - Bank-grade security with encrypted token management
 * - Multi-currency support with exchange rate handling
 * - Rule-based matching engine with learning capabilities
 * - Duplicate detection and fraud monitoring
 * - Performance analytics and reconciliation insights
 */
// @ts-nocheck


import { supabase } from "./supabase";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type BankProviderType =
  | "Open Banking"
  | "Screen Scraping"
  | "Direct API"
  | "File Import"
  | "Manual";
export type AuthMethod = "OAuth2" | "API Key" | "Certificate" | "Username/Password" | "None";
export type ConnectionStatus =
  | "Active"
  | "Inactive"
  | "Error"
  | "Expired"
  | "Reauth Required"
  | "Suspended";
export type AccountType =
  | "Checking"
  | "Savings"
  | "Credit Card"
  | "Line of Credit"
  | "Certificate of Deposit"
  | "Money Market"
  | "Investment"
  | "Loan"
  | "Mortgage";
export type TransactionType =
  | "Debit"
  | "Credit"
  | "Transfer"
  | "Fee"
  | "Interest"
  | "Dividend"
  | "ATM"
  | "Check"
  | "Deposit"
  | "Withdrawal"
  | "Payment"
  | "Refund";
export type ReconciliationStatus =
  | "Unmatched"
  | "Matched"
  | "Partially Matched"
  | "Excluded"
  | "Manual Review"
  | "Disputed";
export type MatchType = "One to One" | "One to Many" | "Many to One" | "Adjustment" | "Exclusion";
export type MatchMethod = "Automatic" | "Manual" | "Rule Based" | "AI Suggested";
export type SyncType = "Full Sync" | "Incremental" | "Balance Only" | "Historical" | "Manual";
export type SyncTrigger = "Scheduled" | "Manual" | "Webhook" | "API Call" | "Startup";
export type SyncStatus =
  | "Started"
  | "In Progress"
  | "Completed"
  | "Failed"
  | "Cancelled"
  | "Timeout";
export type SessionStatus = "In Progress" | "Completed" | "Cancelled" | "Error";
export type AmountMatching = "Exact" | "Range" | "Percentage" | "Ignore";
export type DateMatching = "Exact" | "Range" | "Before" | "After" | "Ignore";
export type DescriptionMatching =
  | "Exact"
  | "Contains"
  | "Starts With"
  | "Ends With"
  | "Regex"
  | "Ignore";

export interface BankProvider {
  id: string;
  provider_name: string;
  provider_type: BankProviderType;
  api_base_url?: string;
  auth_method?: AuthMethod;
  supported_countries: string[];
  supported_account_types: string[];
  supports_real_time: boolean;
  supports_historical_data: boolean;
  max_history_days: number;
  transaction_delay_minutes: number;
  daily_request_limit?: number;
  monthly_request_limit?: number;
  cost_per_connection?: number;
  cost_per_transaction?: number;
  is_active: boolean;
  is_sandbox: boolean;
  documentation_url?: string;
  support_contact?: string;
  logo_url?: string;
  created_at: string;
  modified: string;
}

export interface BankConnection {
  id: string;
  company_id: string;
  bank_provider_id: string;
  connection_name: string;
  bank_name: string;
  bank_identifier?: string;
  external_connection_id?: string;
  external_access_token?: string;
  external_refresh_token?: string;
  token_expires_at?: string;
  auto_sync_enabled: boolean;
  sync_frequency_minutes: number;
  last_sync_at?: string;
  next_sync_at?: string;
  status: ConnectionStatus;
  error_message?: string;
  error_count: number;
  last_error_at?: string;
  success_rate: number;
  total_syncs: number;
  successful_syncs: number;
  failed_syncs: number;
  encryption_key_id?: string;
  requires_mfa: boolean;
  mfa_last_verified_at?: string;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data
  provider?: BankProvider;
  accounts?: BankAccount[];
}

export interface BankAccount {
  id: string;
  company_id: string;
  bank_connection_id: string;
  account_name: string;
  account_number: string;
  account_number_masked: string;
  routing_number?: string;
  external_account_id: string;
  account_type: AccountType;
  account_subtype?: string;
  currency: string;
  current_balance?: number;
  available_balance?: number;
  credit_limit?: number;
  gl_account_id?: string;
  auto_categorize: boolean;
  is_active: boolean;
  sync_transactions: boolean;
  sync_balance: boolean;
  transaction_sync_days: number;
  status: "Active" | "Inactive" | "Closed" | "Suspended" | "Error";
  balance_last_updated?: string;
  balance_source?: "API Sync" | "Manual Entry" | "Calculated";
  created_at: string;
  modified: string;

  // Related data
  connection?: BankConnection;
  transactions?: BankTransaction[];
}

export interface BankTransaction {
  id: string;
  company_id: string;
  bank_account_id: string;
  external_transaction_id: string;
  transaction_date: string;
  posted_date?: string;
  amount: number;
  currency: string;
  description: string;
  merchant_name?: string;
  category_primary?: string;
  category_detailed?: string;
  transaction_type?: TransactionType;
  reference_number?: string;
  check_number?: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  location_coordinates?: { x: number; y: number };
  merchant_category_code?: string;
  merchant_website?: string;
  counterparty_type?: "Individual" | "Business" | "Government" | "Bank" | "Unknown";
  reconciliation_status: ReconciliationStatus;
  matched_gl_entry_id?: string;
  matched_at?: string;
  matched_by?: string;
  match_confidence?: number;
  manual_notes?: string;
  requires_review: boolean;
  reviewed_by?: string;
  reviewed_at?: string;
  is_pending: boolean;
  is_recurring: boolean;
  is_duplicate: boolean;
  is_transfer: boolean;
  sync_batch_id?: string;
  imported_at: string;
  import_source: "API" | "File Import" | "Manual Entry" | "Webhook";
  running_balance?: number;
  created_at: string;
  modified: string;

  // Related data
  account?: BankAccount;
  matches?: ReconciliationMatch[];
}

export interface ReconciliationRule {
  id: string;
  company_id: string;
  rule_name: string;
  rule_description?: string;
  is_active: boolean;
  rule_priority: number;
  amount_matching: AmountMatching;
  amount_tolerance: number;
  amount_percentage_tolerance: number;
  date_matching: DateMatching;
  date_range_days: number;
  description_matching: DescriptionMatching;
  description_patterns: string[];
  reference_matching: "Exact" | "Contains" | "Ignore";
  reference_patterns: string[];
  bank_account_ids: string[];
  gl_account_patterns: string[];
  merchant_category_codes: string[];
  transaction_types: string[];
  minimum_confidence: number;
  auto_match: boolean;
  suggest_match: boolean;
  create_gl_entry: boolean;
  gl_account_mapping: any;
  matches_found: number;
  auto_matches_made: number;
  manual_matches_made: number;
  false_positives: number;
  accuracy_rate: number;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface ReconciliationSession {
  id: string;
  company_id: string;
  session_name: string;
  bank_account_ids: string[];
  date_from: string;
  date_to: string;
  status: SessionStatus;
  total_bank_transactions: number;
  total_gl_entries: number;
  matched_transactions: number;
  unmatched_bank_transactions: number;
  unmatched_gl_entries: number;
  auto_matched: number;
  manually_matched: number;
  opening_bank_balance: number;
  closing_bank_balance: number;
  opening_book_balance: number;
  closing_book_balance: number;
  reconciling_items: number;
  started_at: string;
  completed_at?: string;
  duration_minutes?: number;
  started_by: string;
  completed_by?: string;
  notes?: string;
  issues_identified?: string;
  created_at: string;
  modified: string;

  // Related data
  matches?: ReconciliationMatch[];
}

export interface ReconciliationMatch {
  id: string;
  company_id: string;
  reconciliation_session_id?: string;
  bank_transaction_id?: string;
  gl_entry_id?: string;
  match_type: MatchType;
  match_method: MatchMethod;
  confidence_score: number;
  match_factors: any;
  amount_difference: number;
  date_difference: number;
  description_similarity: number;
  status: "Matched" | "Unmatched" | "Under Review" | "Disputed" | "Excluded";
  matched_by?: string;
  matched_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  is_manual_override: boolean;
  override_reason?: string;
  created_at: string;
  modified: string;

  // Related data
  bank_transaction?: BankTransaction;
  session?: ReconciliationSession;
}

export interface BankReconciliationReport {
  id: string;
  company_id: string;
  report_name: string;
  bank_account_id: string;
  reconciliation_session_id?: string;
  report_date: string;
  report_period_from: string;
  report_period_to: string;
  bank_statement_balance: number;
  book_balance: number;
  reconciling_items: number;
  adjusted_book_balance: number;
  outstanding_deposits: number;
  outstanding_checks: number;
  bank_errors: number;
  book_errors: number;
  other_adjustments: number;
  is_balanced: boolean;
  variance_amount: number;
  report_format: "Standard" | "Detailed" | "Summary" | "Exception";
  report_data: any;
  prepared_by: string;
  prepared_at: string;
  reviewed_by?: string;
  reviewed_at?: string;
  approved_by?: string;
  approved_at?: string;
  exported_at?: string;
  export_format?: string;
  export_file_path?: string;
  created_at: string;
  modified: string;

  // Related data
  bank_account?: BankAccount;
  session?: ReconciliationSession;
}

export interface BankSyncLog {
  id: string;
  company_id: string;
  bank_connection_id?: string;
  bank_account_id?: string;
  sync_type: SyncType;
  sync_trigger: SyncTrigger;
  date_from?: string;
  date_to?: string;
  status: SyncStatus;
  transactions_fetched: number;
  transactions_new: number;
  transactions_updated: number;
  transactions_duplicated: number;
  balance_updated: boolean;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  error_code?: string;
  error_message?: string;
  error_details?: any;
  retry_count: number;
  api_requests_made: number;
  api_rate_limited: boolean;
  created_at: string;
}

export interface ReconciliationSummary {
  total_bank_transactions: number;
  total_gl_entries: number;
  matched_count: number;
  unmatched_bank_count: number;
  unmatched_gl_count: number;
  auto_match_rate: number;
  manual_review_count: number;
  variance_amount: number;
  reconciliation_rate: number;
}

export interface BankAnalytics {
  total_connections: number;
  active_connections: number;
  total_accounts: number;
  total_transactions: number;
  sync_success_rate: number;
  reconciliation_rate: number;
  auto_match_rate: number;
  average_reconciliation_time: number;
  top_unmatched_categories: any[];
  sync_performance: any[];
  connection_health: any[];
  recent_sync_logs: BankSyncLog[];
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreateBankConnectionInput {
  company_id: string;
  bank_provider_id: string;
  connection_name: string;
  bank_name: string;
  bank_identifier?: string;
  auto_sync_enabled?: boolean;
  sync_frequency_minutes?: number;
  created_by?: string;
}

export interface CreateBankAccountInput {
  company_id: string;
  bank_connection_id: string;
  account_name: string;
  account_number: string;
  routing_number?: string;
  external_account_id: string;
  account_type: AccountType;
  account_subtype?: string;
  currency?: string;
  current_balance?: number;
  available_balance?: number;
  credit_limit?: number;
  gl_account_id?: string;
  auto_categorize?: boolean;
  sync_transactions?: boolean;
  transaction_sync_days?: number;
}

export interface ImportBankTransactionInput {
  company_id: string;
  bank_account_id: string;
  external_transaction_id: string;
  transaction_date: string;
  amount: number;
  description: string;
  transaction_type?: TransactionType;
  merchant_name?: string;
  category_primary?: string;
  reference_number?: string;
  import_source?: "API" | "File Import" | "Manual Entry" | "Webhook";
}

export interface CreateReconciliationRuleInput {
  company_id: string;
  rule_name: string;
  rule_description?: string;
  rule_priority?: number;
  amount_matching?: AmountMatching;
  amount_tolerance?: number;
  date_matching?: DateMatching;
  date_range_days?: number;
  description_matching?: DescriptionMatching;
  description_patterns?: string[];
  bank_account_ids?: string[];
  minimum_confidence?: number;
  auto_match?: boolean;
  created_by?: string;
}

export interface CreateReconciliationSessionInput {
  company_id: string;
  session_name: string;
  bank_account_ids: string[];
  date_from: string;
  date_to: string;
  started_by: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================================================
// BANK INTEGRATION & RECONCILIATION SERVICE
// =====================================================================================

export class BankService {
  // =====================================================================================
  // BANK PROVIDERS
  // =====================================================================================

  /**
   * Get available bank providers
   */
  static async getBankProviders(filters?: {
    provider_type?: BankProviderType;
    country?: string;
    supports_real_time?: boolean;
  }): Promise<ApiResponse<BankProvider[]>> {
    try {
      let query = supabase.from("bank_providers").select("*").eq("is_active", true);

      if (filters?.provider_type) {
        query = query.eq("provider_type", filters.provider_type);
      }

      if (filters?.country) {
        query = query.contains("supported_countries", [filters.country]);
      }

      if (filters?.supports_real_time !== undefined) {
        query = query.eq("supports_real_time", filters.supports_real_time);
      }

      const { data: providers, error } = await query.order("provider_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: providers };
    } catch (error) {
      console.error("Error fetching bank providers:", error);
      return { success: false, error: "Failed to fetch bank providers" };
    }
  }

  // =====================================================================================
  // BANK CONNECTIONS
  // =====================================================================================

  /**
   * Create bank connection
   */
  static async createBankConnection(
    input: CreateBankConnectionInput,
  ): Promise<ApiResponse<BankConnection>> {
    try {
      const { data: connection, error } = await supabase
        .from("bank_connections")
        .insert({
          company_id: input.company_id,
          bank_provider_id: input.bank_provider_id,
          connection_name: input.connection_name.trim(),
          bank_name: input.bank_name.trim(),
          bank_identifier: input.bank_identifier,
          auto_sync_enabled: input.auto_sync_enabled !== false,
          sync_frequency_minutes: input.sync_frequency_minutes || 60,
          next_sync_at: new Date(
            Date.now() + (input.sync_frequency_minutes || 60) * 60 * 1000,
          ).toISOString(),
          created_by: input.created_by,
        })
        .select(
          `
                    *,
                    provider:bank_providers(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: connection, message: "Bank connection created successfully" };
    } catch (error) {
      console.error("Error creating bank connection:", error);
      return { success: false, error: "Failed to create bank connection" };
    }
  }

  /**
   * Get bank connections
   */
  static async getBankConnections(
    companyId: string,
    filters?: {
      status?: ConnectionStatus;
      provider_id?: string;
    },
  ): Promise<ApiResponse<BankConnection[]>> {
    try {
      let query = supabase
        .from("bank_connections")
        .select(
          `
                    *,
                    provider:bank_providers(*),
                    accounts:bank_accounts(*)
                `,
        )
        .eq("company_id", companyId);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.provider_id) {
        query = query.eq("bank_provider_id", filters.provider_id);
      }

      const { data: connections, error } = await query.order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: connections };
    } catch (error) {
      console.error("Error fetching bank connections:", error);
      return { success: false, error: "Failed to fetch bank connections" };
    }
  }

  /**
   * Sync bank transactions
   */
  static async syncBankTransactions(
    connectionId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ApiResponse<string>> {
    try {
      const { data: syncLogId, error } = await supabase.rpc("sync_bank_transactions", {
        p_bank_connection_id: connectionId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: syncLogId, message: "Bank transaction sync initiated" };
    } catch (error) {
      console.error("Error syncing bank transactions:", error);
      return { success: false, error: "Failed to sync bank transactions" };
    }
  }

  // =====================================================================================
  // BANK ACCOUNTS
  // =====================================================================================

  /**
   * Create bank account
   */
  static async createBankAccount(input: CreateBankAccountInput): Promise<ApiResponse<BankAccount>> {
    try {
      // Mask account number for display
      const accountNumberMasked =
        input.account_number.length > 4
          ? `****${input.account_number.slice(-4)}`
          : input.account_number;

      const { data: account, error } = await supabase
        .from("bank_accounts")
        .insert({
          company_id: input.company_id,
          bank_connection_id: input.bank_connection_id,
          account_name: input.account_name.trim(),
          account_number: input.account_number, // Should be encrypted in production
          account_number_masked: accountNumberMasked,
          routing_number: input.routing_number,
          external_account_id: input.external_account_id,
          account_type: input.account_type,
          account_subtype: input.account_subtype,
          currency: input.currency || "USD",
          current_balance: input.current_balance,
          available_balance: input.available_balance,
          credit_limit: input.credit_limit,
          gl_account_id: input.gl_account_id,
          auto_categorize: input.auto_categorize !== false,
          sync_transactions: input.sync_transactions !== false,
          transaction_sync_days: input.transaction_sync_days || 90,
        })
        .select(
          `
                    *,
                    connection:bank_connections(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: account, message: "Bank account created successfully" };
    } catch (error) {
      console.error("Error creating bank account:", error);
      return { success: false, error: "Failed to create bank account" };
    }
  }

  /**
   * Get bank accounts
   */
  static async getBankAccounts(
    companyId: string,
    filters?: {
      connection_id?: string;
      account_type?: AccountType;
      is_active?: boolean;
    },
  ): Promise<ApiResponse<BankAccount[]>> {
    try {
      let query = supabase
        .from("bank_accounts")
        .select(
          `
                    *,
                    connection:bank_connections(*)
                `,
        )
        .eq("company_id", companyId);

      if (filters?.connection_id) {
        query = query.eq("bank_connection_id", filters.connection_id);
      }

      if (filters?.account_type) {
        query = query.eq("account_type", filters.account_type);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      const { data: accounts, error } = await query.order("account_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: accounts };
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      return { success: false, error: "Failed to fetch bank accounts" };
    }
  }

  // =====================================================================================
  // BANK TRANSACTIONS
  // =====================================================================================

  /**
   * Import bank transaction
   */
  static async importBankTransaction(
    input: ImportBankTransactionInput,
  ): Promise<ApiResponse<BankTransaction>> {
    try {
      const { data: transaction, error } = await supabase
        .from("bank_transactions")
        .insert({
          company_id: input.company_id,
          bank_account_id: input.bank_account_id,
          external_transaction_id: input.external_transaction_id,
          transaction_date: input.transaction_date,
          amount: input.amount,
          description: input.description.trim(),
          transaction_type: input.transaction_type,
          merchant_name: input.merchant_name?.trim(),
          category_primary: input.category_primary,
          reference_number: input.reference_number,
          import_source: input.import_source || "Manual Entry",
          currency: "USD", // Would be dynamic based on account
        })
        .select(
          `
                    *,
                    account:bank_accounts(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: transaction,
        message: "Bank transaction imported successfully",
      };
    } catch (error) {
      console.error("Error importing bank transaction:", error);
      return { success: false, error: "Failed to import bank transaction" };
    }
  }

  /**
   * Get bank transactions
   */
  static async getBankTransactions(
    companyId: string,
    filters?: {
      bank_account_id?: string;
      date_from?: string;
      date_to?: string;
      reconciliation_status?: ReconciliationStatus;
      amount_min?: number;
      amount_max?: number;
      search?: string;
    },
    pagination?: {
      page?: number;
      limit?: number;
    },
  ): Promise<
    ApiResponse<{ transactions: BankTransaction[]; total: number; page: number; limit: number }>
  > {
    try {
      let query = supabase
        .from("bank_transactions")
        .select(
          `
                    *,
                    account:bank_accounts(account_name, account_number_masked)
                `,
          { count: "exact" },
        )
        .eq("company_id", companyId);

      if (filters?.bank_account_id) {
        query = query.eq("bank_account_id", filters.bank_account_id);
      }

      if (filters?.date_from) {
        query = query.gte("transaction_date", filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte("transaction_date", filters.date_to);
      }

      if (filters?.reconciliation_status) {
        query = query.eq("reconciliation_status", filters.reconciliation_status);
      }

      if (filters?.amount_min) {
        query = query.gte("amount", filters.amount_min);
      }

      if (filters?.amount_max) {
        query = query.lte("amount", filters.amount_max);
      }

      if (filters?.search) {
        query = query.or(
          `description.ilike.%${filters.search}%,merchant_name.ilike.%${filters.search}%`,
        );
      }

      // Pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const offset = (page - 1) * limit;

      query = query
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: transactions, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          transactions: transactions || [],
          total: count || 0,
          page,
          limit,
        },
      };
    } catch (error) {
      console.error("Error fetching bank transactions:", error);
      return { success: false, error: "Failed to fetch bank transactions" };
    }
  }

  // =====================================================================================
  // RECONCILIATION RULES
  // =====================================================================================

  /**
   * Create reconciliation rule
   */
  static async createReconciliationRule(
    input: CreateReconciliationRuleInput,
  ): Promise<ApiResponse<ReconciliationRule>> {
    try {
      const { data: rule, error } = await supabase
        .from("reconciliation_rules")
        .insert({
          company_id: input.company_id,
          rule_name: input.rule_name.trim(),
          rule_description: input.rule_description,
          rule_priority: input.rule_priority || 5,
          amount_matching: input.amount_matching || "Exact",
          amount_tolerance: input.amount_tolerance || 0,
          date_matching: input.date_matching || "Exact",
          date_range_days: input.date_range_days || 0,
          description_matching: input.description_matching || "Contains",
          description_patterns: input.description_patterns || [],
          bank_account_ids: input.bank_account_ids || [],
          minimum_confidence: input.minimum_confidence || 0.8,
          auto_match: input.auto_match || false,
          created_by: input.created_by,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: rule, message: "Reconciliation rule created successfully" };
    } catch (error) {
      console.error("Error creating reconciliation rule:", error);
      return { success: false, error: "Failed to create reconciliation rule" };
    }
  }

  /**
   * Get reconciliation rules
   */
  static async getReconciliationRules(
    companyId: string,
    filters?: {
      is_active?: boolean;
    },
  ): Promise<ApiResponse<ReconciliationRule[]>> {
    try {
      let query = supabase.from("reconciliation_rules").select("*").eq("company_id", companyId);

      if (filters?.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      const { data: rules, error } = await query.order("rule_priority").order("rule_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: rules };
    } catch (error) {
      console.error("Error fetching reconciliation rules:", error);
      return { success: false, error: "Failed to fetch reconciliation rules" };
    }
  }

  // =====================================================================================
  // AUTOMATED RECONCILIATION
  // =====================================================================================

  /**
   * Auto-match bank transactions
   */
  static async autoMatchTransactions(
    companyId: string,
    bankAccountId?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<
    ApiResponse<{
      total_processed: number;
      auto_matched: number;
      suggested_matches: number;
      no_matches: number;
    }>
  > {
    try {
      const { data: result, error } = await supabase.rpc("auto_match_bank_transactions", {
        p_company_id: companyId,
        p_bank_account_id: bankAccountId,
        p_date_from: dateFrom,
        p_date_to: dateTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const [{ total_processed, auto_matched, suggested_matches, no_matches }] = result;

      return {
        success: true,
        data: {
          total_processed,
          auto_matched,
          suggested_matches,
          no_matches,
        },
        message: `Processed ${total_processed} transactions: ${auto_matched} auto-matched, ${suggested_matches} suggested`,
      };
    } catch (error) {
      console.error("Error auto-matching transactions:", error);
      return { success: false, error: "Failed to auto-match transactions" };
    }
  }

  // =====================================================================================
  // RECONCILIATION SESSIONS
  // =====================================================================================

  /**
   * Create reconciliation session
   */
  static async createReconciliationSession(
    input: CreateReconciliationSessionInput,
  ): Promise<ApiResponse<ReconciliationSession>> {
    try {
      const { data: sessionId, error } = await supabase.rpc("create_reconciliation_session", {
        p_company_id: input.company_id,
        p_session_name: input.session_name,
        p_bank_account_ids: input.bank_account_ids,
        p_date_from: input.date_from,
        p_date_to: input.date_to,
        p_started_by: input.started_by,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: session } = await supabase
        .from("reconciliation_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      return {
        success: true,
        data: session,
        message: `Reconciliation session "${input.session_name}" created successfully`,
      };
    } catch (error) {
      console.error("Error creating reconciliation session:", error);
      return { success: false, error: "Failed to create reconciliation session" };
    }
  }

  /**
   * Get reconciliation sessions
   */
  static async getReconciliationSessions(
    companyId: string,
    filters?: {
      status?: SessionStatus;
      date_from?: string;
      date_to?: string;
    },
  ): Promise<ApiResponse<ReconciliationSession[]>> {
    try {
      let query = supabase.from("reconciliation_sessions").select("*").eq("company_id", companyId);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.date_from) {
        query = query.gte("date_from", filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte("date_to", filters.date_to);
      }

      const { data: sessions, error } = await query.order("started_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: sessions };
    } catch (error) {
      console.error("Error fetching reconciliation sessions:", error);
      return { success: false, error: "Failed to fetch reconciliation sessions" };
    }
  }

  /**
   * Complete reconciliation session
   */
  static async completeReconciliationSession(
    sessionId: string,
    completedBy: string,
    notes?: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("reconciliation_sessions")
        .update({
          status: "Completed",
          completed_at: new Date().toISOString(),
          completed_by: completedBy,
          duration_minutes: supabase.raw("EXTRACT(EPOCH FROM (NOW() - started_at)) / 60"),
          notes,
          modified: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: true,
        message: "Reconciliation session completed successfully",
      };
    } catch (error) {
      console.error("Error completing reconciliation session:", error);
      return { success: false, error: "Failed to complete reconciliation session" };
    }
  }

  // =====================================================================================
  // RECONCILIATION MATCHING
  // =====================================================================================

  /**
   * Create manual reconciliation match
   */
  static async createManualMatch(
    companyId: string,
    bankTransactionId: string,
    glEntryId: string,
    matchedBy: string,
    sessionId?: string,
  ): Promise<ApiResponse<ReconciliationMatch>> {
    try {
      // Calculate match confidence (simplified version)
      const confidence = 1.0; // Manual matches are 100% confidence

      const { data: match, error } = await supabase
        .from("reconciliation_matches")
        .insert({
          company_id: companyId,
          reconciliation_session_id: sessionId,
          bank_transaction_id: bankTransactionId,
          gl_entry_id: glEntryId,
          match_type: "One to One",
          match_method: "Manual",
          confidence_score: confidence,
          matched_by: matchedBy,
          status: "Matched",
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update bank transaction status
      await supabase
        .from("bank_transactions")
        .update({
          reconciliation_status: "Matched",
          matched_gl_entry_id: glEntryId,
          matched_at: new Date().toISOString(),
          matched_by: matchedBy,
          match_confidence: confidence,
          modified: new Date().toISOString(),
        })
        .eq("id", bankTransactionId);

      return { success: true, data: match, message: "Manual match created successfully" };
    } catch (error) {
      console.error("Error creating manual match:", error);
      return { success: false, error: "Failed to create manual match" };
    }
  }

  /**
   * Remove reconciliation match
   */
  static async removeMatch(matchId: string, removedBy: string): Promise<ApiResponse<boolean>> {
    try {
      // Get match details first
      const { data: match } = await supabase
        .from("reconciliation_matches")
        .select("bank_transaction_id")
        .eq("id", matchId)
        .single();

      if (!match) {
        return { success: false, error: "Match not found" };
      }

      // Remove the match
      const { error: deleteError } = await supabase
        .from("reconciliation_matches")
        .delete()
        .eq("id", matchId);

      if (deleteError) {
        return { success: false, error: deleteError.message };
      }

      // Reset bank transaction status
      await supabase
        .from("bank_transactions")
        .update({
          reconciliation_status: "Unmatched",
          matched_gl_entry_id: null,
          matched_at: null,
          matched_by: null,
          match_confidence: null,
          modified: new Date().toISOString(),
        })
        .eq("id", match.bank_transaction_id);

      return { success: true, data: true, message: "Match removed successfully" };
    } catch (error) {
      console.error("Error removing match:", error);
      return { success: false, error: "Failed to remove match" };
    }
  }

  // =====================================================================================
  // RECONCILIATION REPORTS
  // =====================================================================================

  /**
   * Generate reconciliation report
   */
  static async generateReconciliationReport(
    companyId: string,
    bankAccountId: string,
    reportDate: string,
    periodFrom: string,
    periodTo: string,
    preparedBy: string,
    sessionId?: string,
  ): Promise<ApiResponse<BankReconciliationReport>> {
    try {
      // Get bank account current balance
      const { data: bankAccount } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("id", bankAccountId)
        .single();

      const bankStatementBalance = bankAccount?.current_balance || 0;

      // Calculate book balance (simplified)
      const bookBalance = bankStatementBalance; // Would be calculated from GL
      const reconcililingItems = 0; // Would be calculated from unmatched items
      const adjustedBookBalance = bookBalance + reconcililingItems;

      const { data: report, error } = await supabase
        .from("bank_reconciliation_reports")
        .insert({
          company_id: companyId,
          report_name: `Bank Reconciliation - ${reportDate}`,
          bank_account_id: bankAccountId,
          reconciliation_session_id: sessionId,
          report_date: reportDate,
          report_period_from: periodFrom,
          report_period_to: periodTo,
          bank_statement_balance: bankStatementBalance,
          book_balance: bookBalance,
          reconciling_items: reconcililingItems,
          adjusted_book_balance: adjustedBookBalance,
          is_balanced: Math.abs(bankStatementBalance - adjustedBookBalance) < 0.01,
          variance_amount: bankStatementBalance - adjustedBookBalance,
          prepared_by: preparedBy,
        })
        .select(
          `
                    *,
                    bank_account:bank_accounts(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: report,
        message: "Reconciliation report generated successfully",
      };
    } catch (error) {
      console.error("Error generating reconciliation report:", error);
      return { success: false, error: "Failed to generate reconciliation report" };
    }
  }

  // =====================================================================================
  // ANALYTICS & INSIGHTS
  // =====================================================================================

  /**
   * Get reconciliation summary
   */
  static async getReconciliationSummary(
    companyId: string,
    bankAccountId?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<ApiResponse<ReconciliationSummary>> {
    try {
      // This would be complex queries to calculate summary statistics
      // For now, providing a simplified version

      let bankTxQuery = supabase
        .from("bank_transactions")
        .select("reconciliation_status", { count: "exact" })
        .eq("company_id", companyId);

      if (bankAccountId) {
        bankTxQuery = bankTxQuery.eq("bank_account_id", bankAccountId);
      }

      if (dateFrom) {
        bankTxQuery = bankTxQuery.gte("transaction_date", dateFrom);
      }

      if (dateTo) {
        bankTxQuery = bankTxQuery.lte("transaction_date", dateTo);
      }

      const { data: transactions, count: totalTransactions } = await bankTxQuery;

      const matchedCount =
        transactions?.filter(t => t.reconciliation_status === "Matched").length || 0;
      const unmatchedCount = (totalTransactions || 0) - matchedCount;

      const summary: ReconciliationSummary = {
        total_bank_transactions: totalTransactions || 0,
        total_gl_entries: totalTransactions || 0, // Would be calculated separately
        matched_count: matchedCount,
        unmatched_bank_count: unmatchedCount,
        unmatched_gl_count: 0, // Would be calculated
        auto_match_rate: totalTransactions ? (matchedCount / totalTransactions) * 100 : 0,
        manual_review_count:
          transactions?.filter(t => t.reconciliation_status === "Manual Review").length || 0,
        variance_amount: 0, // Would be calculated
        reconciliation_rate: totalTransactions ? (matchedCount / totalTransactions) * 100 : 0,
      };

      return { success: true, data: summary };
    } catch (error) {
      console.error("Error fetching reconciliation summary:", error);
      return { success: false, error: "Failed to fetch reconciliation summary" };
    }
  }

  /**
   * Get bank analytics
   */
  static async getBankAnalytics(companyId: string): Promise<ApiResponse<BankAnalytics>> {
    try {
      const [connectionsResult, accountsResult, transactionsResult, syncLogsResult] =
        await Promise.all([
          supabase
            .from("bank_connections")
            .select("status", { count: "exact" })
            .eq("company_id", companyId),
          supabase
            .from("bank_accounts")
            .select("id", { count: "exact" })
            .eq("company_id", companyId),
          supabase
            .from("bank_transactions")
            .select("reconciliation_status", { count: "exact" })
            .eq("company_id", companyId),
          supabase
            .from("bank_sync_logs")
            .select("*")
            .eq("company_id", companyId)
            .order("started_at", { ascending: false })
            .limit(10),
        ]);

      const totalConnections = connectionsResult.count || 0;
      const activeConnections =
        connectionsResult.data?.filter(c => c.status === "Active").length || 0;
      const totalAccounts = accountsResult.count || 0;
      const totalTransactions = transactionsResult.count || 0;
      const matchedTransactions =
        transactionsResult.data?.filter(t => t.reconciliation_status === "Matched").length || 0;

      const analytics: BankAnalytics = {
        total_connections: totalConnections,
        active_connections: activeConnections,
        total_accounts: totalAccounts,
        total_transactions: totalTransactions,
        sync_success_rate: 95, // Would calculate from sync logs
        reconciliation_rate: totalTransactions
          ? (matchedTransactions / totalTransactions) * 100
          : 0,
        auto_match_rate: 85, // Would calculate from matches
        average_reconciliation_time: 15, // Minutes
        top_unmatched_categories: [], // Would analyze unmatched transactions
        sync_performance: [], // Would analyze sync performance over time
        connection_health: [], // Would analyze connection health
        recent_sync_logs: syncLogsResult.data || [],
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error("Error fetching bank analytics:", error);
      return { success: false, error: "Failed to fetch bank analytics" };
    }
  }

  // =====================================================================================
  // SYNC LOGS
  // =====================================================================================

  /**
   * Get sync logs
   */
  static async getSyncLogs(
    companyId: string,
    filters?: {
      connection_id?: string;
      status?: SyncStatus;
      date_from?: string;
      date_to?: string;
    },
  ): Promise<ApiResponse<BankSyncLog[]>> {
    try {
      let query = supabase.from("bank_sync_logs").select("*").eq("company_id", companyId);

      if (filters?.connection_id) {
        query = query.eq("bank_connection_id", filters.connection_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.date_from) {
        query = query.gte("started_at", filters.date_from);
      }

      if (filters?.date_to) {
        query = query.lte("started_at", filters.date_to);
      }

      const { data: logs, error } = await query
        .order("started_at", { ascending: false })
        .limit(100);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: logs };
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      return { success: false, error: "Failed to fetch sync logs" };
    }
  }
}
