/**
 * Payment Workflows and Bank Reconciliation Service
 * Advanced payment processing with bank integration and reconciliation
 * Based on ERPNext, Xero, QuickBooks, and Oracle best practices
 */
// @ts-nocheck


import { supabase } from "./supabase";

export interface BankAccount {
  id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  routing_number?: string;
  swift_code?: string;
  iban?: string;
  account_type: "Checking" | "Savings" | "Money Market" | "Certificate of Deposit" | "Other";
  currency: string;
  company_id: string;
  is_active: boolean;
  is_primary: boolean;
  allow_payments: boolean;
  allow_receipts: boolean;
  bank_code?: string;
  integration_type: "Manual" | "OFX" | "CSV" | "API" | "Plaid" | "Yodlee";
  integration_settings: Record<string, any>;
  current_balance: number;
  last_reconciled_balance: number;
  last_reconciled_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description?: string;
  payment_type:
    | "Cash"
    | "Check"
    | "Credit Card"
    | "Bank Transfer"
    | "Wire Transfer"
    | "ACH"
    | "PayPal"
    | "Stripe"
    | "Other";
  company_id: string;
  is_active: boolean;
  requires_reference: boolean;
  requires_approval: boolean;
  approval_threshold: number;
  integration_type: "Manual" | "API" | "Gateway";
  integration_settings: Record<string, any>;
  default_account_id?: string;
  default_bank_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface BankStatement {
  id: string;
  bank_account_id: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  total_debits: number;
  total_credits: number;
  transaction_count: number;
  statement_reference?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  status: "Draft" | "Imported" | "Reconciled" | "Closed";
  is_reconciled: boolean;
  reconciled_at?: string;
  reconciled_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BankStatementTransaction {
  id: string;
  bank_statement_id: string;
  bank_account_id: string;
  transaction_date: string;
  value_date?: string;
  description: string;
  reference?: string;
  check_number?: string;
  debit_amount: number;
  credit_amount: number;
  balance_after?: number;
  transaction_type: "Deposit" | "Withdrawal" | "Transfer" | "Fee" | "Interest" | "Other";
  category?: string;
  subcategory?: string;
  is_matched: boolean;
  matched_transaction_id?: string;
  matched_transaction_type?: string;
  matching_confidence: number;
  status: "Unmatched" | "Matched" | "Reconciled" | "Disputed";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWorkflow {
  id: string;
  name: string;
  description?: string;
  workflow_type: "Payment" | "Receipt" | "Transfer" | "Reconciliation";
  company_id: string;
  is_active: boolean;
  auto_approve: boolean;
  require_approval: boolean;
  approval_threshold: number;
  max_approval_amount?: number;
  send_notifications: boolean;
  notify_on_approval: boolean;
  notify_on_rejection: boolean;
  notify_on_completion: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaymentWorkflowState {
  id: string;
  workflow_id: string;
  state_name: string;
  state_type:
    | "Draft"
    | "Submitted"
    | "Approved"
    | "Rejected"
    | "Processing"
    | "Completed"
    | "Failed"
    | "Cancelled";
  display_order: number;
  is_initial: boolean;
  is_final: boolean;
  allow_edit: boolean;
  allow_delete: boolean;
  require_approval: boolean;
  send_email: boolean;
  email_template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWorkflowTransition {
  id: string;
  workflow_id: string;
  from_state_id: string;
  to_state_id: string;
  transition_name: string;
  is_automatic: boolean;
  require_approval: boolean;
  approval_role?: string;
  conditions: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentApproval {
  id: string;
  payment_id: string;
  workflow_id: string;
  state_id: string;
  approver_id?: string;
  approver_name: string;
  approver_role?: string;
  approval_status: "Pending" | "Approved" | "Rejected";
  approval_notes?: string;
  requested_at: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface BankReconciliation {
  id: string;
  bank_account_id: string;
  bank_statement_id: string;
  company_id: string;
  reconciliation_date: string;
  period_start: string;
  period_end: string;
  bank_balance: number;
  book_balance: number;
  reconciled_balance: number;
  difference: number;
  status: "Draft" | "In Progress" | "Completed" | "Disputed";
  is_completed: boolean;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  dispute_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface BankReconciliationItem {
  id: string;
  reconciliation_id: string;
  item_type: "Bank Transaction" | "Book Transaction" | "Adjustment";
  item_id?: string;
  item_reference?: string;
  amount: number;
  is_debit: boolean;
  matched_item_id?: string;
  is_matched: boolean;
  matching_notes?: string;
  status: "Unmatched" | "Matched" | "Reconciled" | "Disputed";
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountInput {
  account_name: string;
  bank_name: string;
  account_number: string;
  routing_number?: string;
  swift_code?: string;
  iban?: string;
  account_type: "Checking" | "Savings" | "Money Market" | "Certificate of Deposit" | "Other";
  currency?: string;
  company_id: string;
  is_primary?: boolean;
  allow_payments?: boolean;
  allow_receipts?: boolean;
  bank_code?: string;
  integration_type?: "Manual" | "OFX" | "CSV" | "API" | "Plaid" | "Yodlee";
  integration_settings?: Record<string, any>;
}

export interface CreatePaymentMethodInput {
  name: string;
  description?: string;
  payment_type:
    | "Cash"
    | "Check"
    | "Credit Card"
    | "Bank Transfer"
    | "Wire Transfer"
    | "ACH"
    | "PayPal"
    | "Stripe"
    | "Other";
  company_id: string;
  requires_reference?: boolean;
  requires_approval?: boolean;
  approval_threshold?: number;
  integration_type?: "Manual" | "API" | "Gateway";
  integration_settings?: Record<string, any>;
  default_account_id?: string;
  default_bank_account_id?: string;
}

export interface CreateBankStatementInput {
  bank_account_id: string;
  statement_date: string;
  opening_balance: number;
  closing_balance: number;
  statement_reference?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
}

export interface CreateBankReconciliationInput {
  bank_account_id: string;
  bank_statement_id: string;
  company_id: string;
  reconciliation_date: string;
  period_start: string;
  period_end: string;
  bank_balance: number;
  book_balance: number;
  notes?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Payment Workflows and Bank Reconciliation Service
 */
export class PaymentWorkflowsService {
  /**
   * Create bank account
   */
  static async createBankAccount(input: CreateBankAccountInput): Promise<ApiResponse<BankAccount>> {
    try {
      const { data: bankAccount, error } = await supabase
        .from("bank_accounts")
        .insert([
          {
            account_name: input.account_name.trim(),
            bank_name: input.bank_name.trim(),
            account_number: input.account_number.trim(),
            routing_number: input.routing_number,
            swift_code: input.swift_code,
            iban: input.iban,
            account_type: input.account_type,
            currency: input.currency || "USD",
            company_id: input.company_id,
            is_primary: input.is_primary || false,
            allow_payments: input.allow_payments !== false,
            allow_receipts: input.allow_receipts !== false,
            bank_code: input.bank_code,
            integration_type: input.integration_type || "Manual",
            integration_settings: input.integration_settings || {},
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: bankAccount, message: "Bank account created successfully" };
    } catch (error) {
      console.error("Error creating bank account:", error);
      return { success: false, error: "Failed to create bank account" };
    }
  }

  /**
   * Get bank accounts
   */
  static async getBankAccounts(companyId: string): Promise<ApiResponse<BankAccount[]>> {
    try {
      const { data: bankAccounts, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("account_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: bankAccounts };
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      return { success: false, error: "Failed to fetch bank accounts" };
    }
  }

  /**
   * Create payment method
   */
  static async createPaymentMethod(
    input: CreatePaymentMethodInput,
  ): Promise<ApiResponse<PaymentMethod>> {
    try {
      const { data: paymentMethod, error } = await supabase
        .from("payment_methods")
        .insert([
          {
            name: input.name.trim(),
            description: input.description,
            payment_type: input.payment_type,
            company_id: input.company_id,
            requires_reference: input.requires_reference || false,
            requires_approval: input.requires_approval || false,
            approval_threshold: input.approval_threshold || 0,
            integration_type: input.integration_type || "Manual",
            integration_settings: input.integration_settings || {},
            default_account_id: input.default_account_id,
            default_bank_account_id: input.default_bank_account_id,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paymentMethod, message: "Payment method created successfully" };
    } catch (error) {
      console.error("Error creating payment method:", error);
      return { success: false, error: "Failed to create payment method" };
    }
  }

  /**
   * Get payment methods
   */
  static async getPaymentMethods(companyId: string): Promise<ApiResponse<PaymentMethod[]>> {
    try {
      const { data: paymentMethods, error } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: paymentMethods };
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      return { success: false, error: "Failed to fetch payment methods" };
    }
  }

  /**
   * Create bank statement
   */
  static async createBankStatement(
    input: CreateBankStatementInput,
  ): Promise<ApiResponse<BankStatement>> {
    try {
      const { data: bankStatement, error } = await supabase
        .from("bank_statements")
        .insert([
          {
            bank_account_id: input.bank_account_id,
            statement_date: input.statement_date,
            opening_balance: input.opening_balance,
            closing_balance: input.closing_balance,
            statement_reference: input.statement_reference,
            file_path: input.file_path,
            file_name: input.file_name,
            file_size: input.file_size,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: bankStatement, message: "Bank statement created successfully" };
    } catch (error) {
      console.error("Error creating bank statement:", error);
      return { success: false, error: "Failed to create bank statement" };
    }
  }

  /**
   * Get bank statements
   */
  static async getBankStatements(
    bankAccountId?: string,
    companyId?: string,
  ): Promise<ApiResponse<BankStatement[]>> {
    try {
      let query = supabase.from("bank_statements").select("*");

      if (bankAccountId) {
        query = query.eq("bank_account_id", bankAccountId);
      }

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      const { data: bankStatements, error } = await query.order("statement_date", {
        ascending: false,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: bankStatements };
    } catch (error) {
      console.error("Error fetching bank statements:", error);
      return { success: false, error: "Failed to fetch bank statements" };
    }
  }

  /**
   * Import bank statement transactions
   */
  static async importBankStatementTransactions(
    bankStatementId: string,
    transactions: Array<{
      transaction_date: string;
      value_date?: string;
      description: string;
      reference?: string;
      check_number?: string;
      debit_amount?: number;
      credit_amount?: number;
      balance_after?: number;
      transaction_type?: "Deposit" | "Withdrawal" | "Transfer" | "Fee" | "Interest" | "Other";
      category?: string;
      subcategory?: string;
    }>,
  ): Promise<ApiResponse<BankStatementTransaction[]>> {
    try {
      // Get bank account ID from statement
      const { data: statement, error: statementError } = await supabase
        .from("bank_statements")
        .select("bank_account_id")
        .eq("id", bankStatementId)
        .single();

      if (statementError || !statement) {
        return { success: false, error: "Bank statement not found" };
      }

      // Prepare transactions for insertion
      const transactionsToInsert = transactions.map(tx => ({
        bank_statement_id: bankStatementId,
        bank_account_id: statement.bank_account_id,
        transaction_date: tx.transaction_date,
        value_date: tx.value_date,
        description: tx.description,
        reference: tx.reference,
        check_number: tx.check_number,
        debit_amount: tx.debit_amount || 0,
        credit_amount: tx.credit_amount || 0,
        balance_after: tx.balance_after,
        transaction_type: tx.transaction_type || "Other",
        category: tx.category,
        subcategory: tx.subcategory,
      }));

      const { data: importedTransactions, error } = await supabase
        .from("bank_statement_transactions")
        .insert(transactionsToInsert)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update statement with transaction count and totals
      const totalDebits = transactions.reduce((sum, tx) => sum + (tx.debit_amount || 0), 0);
      const totalCredits = transactions.reduce((sum, tx) => sum + (tx.credit_amount || 0), 0);

      await supabase
        .from("bank_statements")
        .update({
          total_debits: totalDebits,
          total_credits: totalCredits,
          transaction_count: transactions.length,
          status: "Imported",
        })
        .eq("id", bankStatementId);

      return {
        success: true,
        data: importedTransactions,
        message: `${transactions.length} transactions imported successfully`,
      };
    } catch (error) {
      console.error("Error importing bank statement transactions:", error);
      return { success: false, error: "Failed to import transactions" };
    }
  }

  /**
   * Get bank statement transactions
   */
  static async getBankStatementTransactions(
    bankStatementId: string,
    status?: string,
  ): Promise<ApiResponse<BankStatementTransaction[]>> {
    try {
      let query = supabase
        .from("bank_statement_transactions")
        .select("*")
        .eq("bank_statement_id", bankStatementId);

      if (status) {
        query = query.eq("status", status);
      }

      const { data: transactions, error } = await query.order("transaction_date", {
        ascending: false,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transactions };
    } catch (error) {
      console.error("Error fetching bank statement transactions:", error);
      return { success: false, error: "Failed to fetch transactions" };
    }
  }

  /**
   * Match bank transactions automatically
   */
  static async matchBankTransactions(
    bankStatementId: string,
    confidenceThreshold: number = 0.8,
  ): Promise<ApiResponse<number>> {
    try {
      const { data: matchedCount, error } = await supabase.rpc("match_bank_transactions", {
        p_bank_statement_id: bankStatementId,
        p_confidence_threshold: confidenceThreshold,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: matchedCount,
        message: `${matchedCount} transactions matched successfully`,
      };
    } catch (error) {
      console.error("Error matching bank transactions:", error);
      return { success: false, error: "Failed to match transactions" };
    }
  }

  /**
   * Create bank reconciliation
   */
  static async createBankReconciliation(
    input: CreateBankReconciliationInput,
  ): Promise<ApiResponse<BankReconciliation>> {
    try {
      const difference = input.bank_balance - input.book_balance;

      const { data: reconciliation, error } = await supabase
        .from("bank_reconciliations")
        .insert([
          {
            bank_account_id: input.bank_account_id,
            bank_statement_id: input.bank_statement_id,
            company_id: input.company_id,
            reconciliation_date: input.reconciliation_date,
            period_start: input.period_start,
            period_end: input.period_end,
            bank_balance: input.bank_balance,
            book_balance: input.book_balance,
            reconciled_balance: input.bank_balance,
            difference: difference,
            notes: input.notes,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: reconciliation,
        message: "Bank reconciliation created successfully",
      };
    } catch (error) {
      console.error("Error creating bank reconciliation:", error);
      return { success: false, error: "Failed to create bank reconciliation" };
    }
  }

  /**
   * Get bank reconciliations
   */
  static async getBankReconciliations(
    bankAccountId?: string,
    companyId?: string,
    status?: string,
  ): Promise<ApiResponse<BankReconciliation[]>> {
    try {
      let query = supabase.from("bank_reconciliations").select("*");

      if (bankAccountId) {
        query = query.eq("bank_account_id", bankAccountId);
      }

      if (companyId) {
        query = query.eq("company_id", companyId);
      }

      if (status) {
        query = query.eq("status", status);
      }

      const { data: reconciliations, error } = await query.order("reconciliation_date", {
        ascending: false,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: reconciliations };
    } catch (error) {
      console.error("Error fetching bank reconciliations:", error);
      return { success: false, error: "Failed to fetch bank reconciliations" };
    }
  }

  /**
   * Get payment workflow states
   */
  static async getPaymentWorkflowStates(paymentId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data: states, error } = await supabase.rpc("get_payment_workflow_states", {
        p_payment_id: paymentId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: states };
    } catch (error) {
      console.error("Error fetching payment workflow states:", error);
      return { success: false, error: "Failed to fetch payment workflow states" };
    }
  }

  /**
   * Transition payment state
   */
  static async transitionPaymentState(
    paymentId: string,
    toStateId: string,
    approverId?: string,
    approverName?: string,
    approvalNotes?: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { data: success, error } = await supabase.rpc("transition_payment_state", {
        p_payment_id: paymentId,
        p_to_state_id: toStateId,
        p_approver_id: approverId,
        p_approver_name: approverName,
        p_approval_notes: approvalNotes,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: success,
        message: success ? "Payment state transitioned successfully" : "Invalid transition",
      };
    } catch (error) {
      console.error("Error transitioning payment state:", error);
      return { success: false, error: "Failed to transition payment state" };
    }
  }

  /**
   * Get payment workflows
   */
  static async getPaymentWorkflows(
    companyId: string,
    workflowType?: string,
  ): Promise<ApiResponse<PaymentWorkflow[]>> {
    try {
      let query = supabase
        .from("payment_workflows")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (workflowType) {
        query = query.eq("workflow_type", workflowType);
      }

      const { data: workflows, error } = await query.order("name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: workflows };
    } catch (error) {
      console.error("Error fetching payment workflows:", error);
      return { success: false, error: "Failed to fetch payment workflows" };
    }
  }

  /**
   * Get reconciliation statistics
   */
  static async getReconciliationStats(companyId: string): Promise<
    ApiResponse<{
      total_reconciliations: number;
      completed_reconciliations: number;
      pending_reconciliations: number;
      total_difference: number;
      average_difference: number;
    }>
  > {
    try {
      const { data: reconciliations, error } = await supabase
        .from("bank_reconciliations")
        .select("status, difference")
        .eq("company_id", companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      const stats = {
        total_reconciliations: reconciliations.length,
        completed_reconciliations: reconciliations.filter(r => r.status === "Completed").length,
        pending_reconciliations: reconciliations.filter(
          r => r.status === "Draft" || r.status === "In Progress",
        ).length,
        total_difference: reconciliations.reduce((sum, r) => sum + Math.abs(r.difference), 0),
        average_difference:
          reconciliations.length > 0
            ? reconciliations.reduce((sum, r) => sum + Math.abs(r.difference), 0) /
              reconciliations.length
            : 0,
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error fetching reconciliation stats:", error);
      return { success: false, error: "Failed to fetch reconciliation statistics" };
    }
  }

  /**
   * Export bank statement to CSV
   */
  static async exportBankStatementToCSV(bankStatementId: string): Promise<ApiResponse<string>> {
    try {
      const { data: transactions, error } = await supabase
        .from("bank_statement_transactions")
        .select("*")
        .eq("bank_statement_id", bankStatementId)
        .order("transaction_date");

      if (error) {
        return { success: false, error: error.message };
      }

      // Generate CSV content
      const headers = [
        "Date",
        "Description",
        "Reference",
        "Check Number",
        "Debit Amount",
        "Credit Amount",
        "Balance After",
        "Type",
        "Category",
        "Status",
      ];

      const csvRows = [
        headers.join(","),
        ...transactions.map(tx =>
          [
            tx.transaction_date,
            `"${tx.description}"`,
            tx.reference || "",
            tx.check_number || "",
            tx.debit_amount,
            tx.credit_amount,
            tx.balance_after || "",
            tx.transaction_type,
            tx.category || "",
            tx.status,
          ].join(","),
        ),
      ];

      const csvContent = csvRows.join("\n");

      return { success: true, data: csvContent, message: "CSV export generated successfully" };
    } catch (error) {
      console.error("Error exporting bank statement to CSV:", error);
      return { success: false, error: "Failed to export bank statement" };
    }
  }
}
