/**
 * Transaction Service
 * Comprehensive transaction management based on ERPNext best practices
 */

import { supabase } from "./supabase";
import { AccountingEngine } from "./accounting-engine";

export type InvoiceType = "Sales" | "Purchase";
export type PaymentType = "Received" | "Paid";
export type PartyType = "Customer" | "Supplier" | "Employee" | "Other";
export type TransactionStatus = "Draft" | "Submitted" | "Paid" | "Overdue" | "Cancelled";

export interface Invoice {
  id: string;
  invoice_no: string;
  invoice_type: InvoiceType;
  customer_id?: string;
  supplier_id?: string;
  customer_name?: string;
  supplier_name?: string;
  invoice_date: string;
  due_date: string;
  posting_date: string;
  currency: string;
  exchange_rate: number;
  net_total: number;
  tax_total: number;
  grand_total: number;
  paid_amount: number;
  outstanding_amount: number;
  status: TransactionStatus;
  is_paid: boolean;
  is_return: boolean;
  company_id: string;
  cost_center_id?: string;
  project_id?: string;
  terms_and_conditions?: string;
  remarks?: string;
  reference_no?: string;
  reference_date?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  items: InvoiceItem[];
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  item_code?: string;
  item_name: string;
  description?: string;
  item_group?: string;
  qty: number;
  rate: number;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  income_account_id?: string;
  expense_account_id?: string;
  cost_center_id?: string;
  warehouse?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  payment_no: string;
  payment_type: PaymentType;
  party_type: PartyType;
  party_id?: string;
  party_name: string;
  payment_date: string;
  posting_date: string;
  currency: string;
  exchange_rate: number;
  paid_amount: number;
  received_amount: number;
  total_allocated_amount: number;
  unallocated_amount: number;
  mode_of_payment: string;
  reference_no?: string;
  reference_date?: string;
  status: TransactionStatus;
  company_id: string;
  cost_center_id?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  allocations: PaymentAllocation[];
}

export interface PaymentAllocation {
  id: string;
  payment_id: string;
  invoice_id: string;
  allocated_amount: number;
  discount_amount: number;
  discount_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  journal_no: string;
  posting_date: string;
  reference_date?: string;
  reference_no?: string;
  total_debit: number;
  total_credit: number;
  difference: number;
  status: TransactionStatus;
  company_id: string;
  cost_center_id?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  accounts: JournalEntryAccount[];
}

export interface JournalEntryAccount {
  id: string;
  journal_entry_id: string;
  account_id: string;
  debit: number;
  credit: number;
  party_type?: PartyType;
  party_id?: string;
  party_name?: string;
  cost_center_id?: string;
  project_id?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceInput {
  invoice_type: InvoiceType;
  customer_id?: string;
  supplier_id?: string;
  customer_name?: string;
  supplier_name?: string;
  invoice_date: string;
  due_date: string;
  posting_date: string;
  currency: string;
  exchange_rate?: number;
  company_id: string;
  cost_center_id?: string;
  project_id?: string;
  terms_and_conditions?: string;
  remarks?: string;
  reference_no?: string;
  reference_date?: string;
  items: CreateInvoiceItemInput[];
}

export interface CreateInvoiceItemInput {
  item_code?: string;
  item_name: string;
  description?: string;
  item_group?: string;
  qty: number;
  rate: number;
  tax_rate?: number;
  income_account_id?: string;
  expense_account_id?: string;
  cost_center_id?: string;
  warehouse?: string;
  project_id?: string;
}

export interface CreatePaymentInput {
  payment_type: PaymentType;
  party_type: PartyType;
  party_id?: string;
  party_name: string;
  payment_date: string;
  posting_date: string;
  currency: string;
  exchange_rate?: number;
  paid_amount: number;
  received_amount: number;
  mode_of_payment: string;
  reference_no?: string;
  reference_date?: string;
  company_id: string;
  cost_center_id?: string;
  remarks?: string;
  allocations: CreatePaymentAllocationInput[];
}

export interface CreatePaymentAllocationInput {
  invoice_id: string;
  allocated_amount: number;
  discount_amount?: number;
  discount_account_id?: string;
}

export interface CreateJournalEntryInput {
  posting_date: string;
  reference_date?: string;
  reference_no?: string;
  company_id: string;
  cost_center_id?: string;
  remarks?: string;
  accounts: CreateJournalEntryAccountInput[];
}

export interface CreateJournalEntryAccountInput {
  account_id: string;
  debit: number;
  credit: number;
  party_type?: PartyType;
  party_id?: string;
  party_name?: string;
  cost_center_id?: string;
  project_id?: string;
  remarks?: string;
}

/**
 * Transaction Service
 */
export class TransactionService {
  /**
   * Create a new invoice
   */
  static async createInvoice(input: CreateInvoiceInput): Promise<{
    success: boolean;
    invoice?: Invoice;
    error?: string;
  }> {
    try {
      // Generate invoice number
      const { data: invoiceNo } = await supabase.rpc("generate_invoice_number", {
        company_id: input.company_id,
        invoice_type: input.invoice_type,
      });

      if (!invoiceNo) {
        return { success: false, error: "Failed to generate invoice number" };
      }

      // Calculate totals
      const netTotal = input.items.reduce((sum, item) => sum + item.qty * item.rate, 0);
      const taxTotal = input.items.reduce((sum, item) => {
        const itemAmount = item.qty * item.rate;
        const taxAmount = (itemAmount * (item.tax_rate || 0)) / 100;
        return sum + taxAmount;
      }, 0);
      const grandTotal = netTotal + taxTotal;

      // Create invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .insert({
          invoice_no: invoiceNo,
          invoice_type: input.invoice_type,
          customer_id: input.customer_id,
          supplier_id: input.supplier_id,
          customer_name: input.customer_name,
          supplier_name: input.supplier_name,
          invoice_date: input.invoice_date,
          due_date: input.due_date,
          posting_date: input.posting_date,
          currency: input.currency,
          exchange_rate: input.exchange_rate || 1.0,
          net_total: netTotal,
          tax_total: taxTotal,
          grand_total: grandTotal,
          paid_amount: 0,
          outstanding_amount: grandTotal,
          status: "Draft",
          is_paid: false,
          is_return: false,
          company_id: input.company_id,
          cost_center_id: input.cost_center_id,
          project_id: input.project_id,
          terms_and_conditions: input.terms_and_conditions,
          remarks: input.remarks,
          reference_no: input.reference_no,
          reference_date: input.reference_date,
        })
        .select()
        .single();

      if (invoiceError) {
        return { success: false, error: invoiceError.message };
      }

      // Create invoice items
      const items = input.items.map(item => ({
        invoice_id: invoice.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        item_group: item.item_group,
        qty: item.qty,
        rate: item.rate,
        amount: item.qty * item.rate,
        tax_rate: item.tax_rate || 0,
        tax_amount: (item.qty * item.rate * (item.tax_rate || 0)) / 100,
        income_account_id: item.income_account_id,
        expense_account_id: item.expense_account_id,
        cost_center_id: item.cost_center_id,
        warehouse: item.warehouse,
        project_id: item.project_id,
      }));

      const { error: itemsError } = await supabase.from("invoice_items").insert(items);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // Create GL entries
      const glEntries = AccountingEngine.createSalesInvoiceEntries(
        invoice.id,
        input.invoice_type,
        grandTotal.toString(),
        input.currency,
        input.exchange_rate || 1.0,
        input.company_id,
        input.cost_center_id,
      );

      const { error: glError } = await supabase.from("gl_entries").insert(glEntries);

      if (glError) {
        return { success: false, error: glError.message };
      }

      // Fetch complete invoice with items
      const { data: completeInvoice, error: fetchError } = await supabase
        .from("invoices")
        .select(
          `
          *,
          items:invoice_items(*)
        `,
        )
        .eq("id", invoice.id)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      return { success: true, invoice: completeInvoice as Invoice };
    } catch (error) {
      console.error("Error creating invoice:", error);
      return { success: false, error: "Failed to create invoice" };
    }
  }

  /**
   * Get invoices with filters
   */
  static async getInvoices(filters: {
    company_id: string;
    invoice_type?: InvoiceType;
    status?: TransactionStatus;
    customer_id?: string;
    supplier_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    invoices?: Invoice[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from("invoices")
        .select(
          `
          *,
          items:invoice_items(*)
        `,
          { count: "exact" },
        )
        .eq("company_id", filters.company_id);

      if (filters.invoice_type) {
        query = query.eq("invoice_type", filters.invoice_type);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.customer_id) {
        query = query.eq("customer_id", filters.customer_id);
      }

      if (filters.supplier_id) {
        query = query.eq("supplier_id", filters.supplier_id);
      }

      if (filters.date_from) {
        query = query.gte("invoice_date", filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte("invoice_date", filters.date_to);
      }

      query = query.order("created_at", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: invoices, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, invoices: invoices as Invoice[], total: count || 0 };
    } catch (error) {
      console.error("Error fetching invoices:", error);
      return { success: false, error: "Failed to fetch invoices" };
    }
  }

  /**
   * Create a new payment
   */
  static async createPayment(input: CreatePaymentInput): Promise<{
    success: boolean;
    payment?: Payment;
    error?: string;
  }> {
    try {
      // Generate payment number
      const { data: paymentNo } = await supabase.rpc("generate_payment_number", {
        company_id: input.company_id,
        payment_type: input.payment_type,
      });

      if (!paymentNo) {
        return { success: false, error: "Failed to generate payment number" };
      }

      // Calculate total allocated amount
      const totalAllocatedAmount = input.allocations.reduce(
        (sum, alloc) => sum + alloc.allocated_amount,
        0,
      );
      const unallocatedAmount = input.paid_amount + input.received_amount - totalAllocatedAmount;

      // Create payment
      const { data: payment, error: paymentError } = await supabase
        .from("payments")
        .insert({
          payment_no: paymentNo,
          payment_type: input.payment_type,
          party_type: input.party_type,
          party_id: input.party_id,
          party_name: input.party_name,
          payment_date: input.payment_date,
          posting_date: input.posting_date,
          currency: input.currency,
          exchange_rate: input.exchange_rate || 1.0,
          paid_amount: input.paid_amount,
          received_amount: input.received_amount,
          total_allocated_amount: totalAllocatedAmount,
          unallocated_amount: unallocatedAmount,
          mode_of_payment: input.mode_of_payment,
          reference_no: input.reference_no,
          reference_date: input.reference_date,
          status: "Draft",
          company_id: input.company_id,
          cost_center_id: input.cost_center_id,
          remarks: input.remarks,
        })
        .select()
        .single();

      if (paymentError) {
        return { success: false, error: paymentError.message };
      }

      // Create payment allocations
      if (input.allocations.length > 0) {
        const allocations = input.allocations.map(alloc => ({
          payment_id: payment.id,
          invoice_id: alloc.invoice_id,
          allocated_amount: alloc.allocated_amount,
          discount_amount: alloc.discount_amount || 0,
          discount_account_id: alloc.discount_account_id,
        }));

        const { error: allocationsError } = await supabase
          .from("payment_allocations")
          .insert(allocations);

        if (allocationsError) {
          return { success: false, error: allocationsError.message };
        }
      }

      // Create GL entries
      const glEntries = AccountingEngine.createPaymentReceivedEntries(
        payment.id,
        input.payment_type,
        (input.paid_amount + input.received_amount).toString(),
        input.currency,
        input.exchange_rate || 1.0,
        input.company_id,
        input.cost_center_id,
      );

      const { error: glError } = await supabase.from("gl_entries").insert(glEntries);

      if (glError) {
        return { success: false, error: glError.message };
      }

      // Fetch complete payment with allocations
      const { data: completePayment, error: fetchError } = await supabase
        .from("payments")
        .select(
          `
          *,
          allocations:payment_allocations(*)
        `,
        )
        .eq("id", payment.id)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      return { success: true, payment: completePayment as Payment };
    } catch (error) {
      console.error("Error creating payment:", error);
      return { success: false, error: "Failed to create payment" };
    }
  }

  /**
   * Get payments with filters
   */
  static async getPayments(filters: {
    company_id: string;
    payment_type?: PaymentType;
    status?: TransactionStatus;
    party_id?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    payments?: Payment[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from("payments")
        .select(
          `
          *,
          allocations:payment_allocations(*)
        `,
          { count: "exact" },
        )
        .eq("company_id", filters.company_id);

      if (filters.payment_type) {
        query = query.eq("payment_type", filters.payment_type);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.party_id) {
        query = query.eq("party_id", filters.party_id);
      }

      if (filters.date_from) {
        query = query.gte("payment_date", filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte("payment_date", filters.date_to);
      }

      query = query.order("created_at", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: payments, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, payments: payments as Payment[], total: count || 0 };
    } catch (error) {
      console.error("Error fetching payments:", error);
      return { success: false, error: "Failed to fetch payments" };
    }
  }

  /**
   * Create a new journal entry
   */
  static async createJournalEntry(input: CreateJournalEntryInput): Promise<{
    success: boolean;
    journal_entry?: JournalEntry;
    error?: string;
  }> {
    try {
      // Generate journal number
      const { data: journalNo } = await supabase.rpc("generate_journal_number", {
        company_id: input.company_id,
      });

      if (!journalNo) {
        return { success: false, error: "Failed to generate journal number" };
      }

      // Calculate totals
      const totalDebit = input.accounts.reduce((sum, account) => sum + account.debit, 0);
      const totalCredit = input.accounts.reduce((sum, account) => sum + account.credit, 0);
      const difference = totalDebit - totalCredit;

      if (Math.abs(difference) > 0.01) {
        return { success: false, error: "Journal entry is not balanced" };
      }

      // Create journal entry
      const { data: journalEntry, error: journalError } = await supabase
        .from("journal_entries")
        .insert({
          journal_no: journalNo,
          posting_date: input.posting_date,
          reference_date: input.reference_date,
          reference_no: input.reference_no,
          total_debit: totalDebit,
          total_credit: totalCredit,
          difference: difference,
          status: "Draft",
          company_id: input.company_id,
          cost_center_id: input.cost_center_id,
          remarks: input.remarks,
        })
        .select()
        .single();

      if (journalError) {
        return { success: false, error: journalError.message };
      }

      // Create journal entry accounts
      const accounts = input.accounts.map(account => ({
        journal_entry_id: journalEntry.id,
        account_id: account.account_id,
        debit: account.debit,
        credit: account.credit,
        party_type: account.party_type,
        party_id: account.party_id,
        party_name: account.party_name,
        cost_center_id: account.cost_center_id,
        project_id: account.project_id,
        remarks: account.remarks,
      }));

      const { error: accountsError } = await supabase
        .from("journal_entry_accounts")
        .insert(accounts);

      if (accountsError) {
        return { success: false, error: accountsError.message };
      }

      // Create GL entries
      const glEntries = accounts.map(account => ({
        account_id: account.account_id,
        debit: account.debit,
        credit: account.credit,
        posting_date: input.posting_date,
        voucher_type: "Journal Entry",
        voucher_no: journalNo,
        party_type: account.party_type,
        party: account.party_name,
        company_id: input.company_id,
        currency: "USD", // Default currency
        exchange_rate: 1.0,
      }));

      const { error: glError } = await supabase.from("gl_entries").insert(glEntries);

      if (glError) {
        return { success: false, error: glError.message };
      }

      // Fetch complete journal entry with accounts
      const { data: completeJournalEntry, error: fetchError } = await supabase
        .from("journal_entries")
        .select(
          `
          *,
          accounts:journal_entry_accounts(*)
        `,
        )
        .eq("id", journalEntry.id)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      return { success: true, journal_entry: completeJournalEntry as JournalEntry };
    } catch (error) {
      console.error("Error creating journal entry:", error);
      return { success: false, error: "Failed to create journal entry" };
    }
  }

  /**
   * Get journal entries with filters
   */
  static async getJournalEntries(filters: {
    company_id: string;
    status?: TransactionStatus;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    success: boolean;
    journal_entries?: JournalEntry[];
    total?: number;
    error?: string;
  }> {
    try {
      let query = supabase
        .from("journal_entries")
        .select(
          `
          *,
          accounts:journal_entry_accounts(*)
        `,
          { count: "exact" },
        )
        .eq("company_id", filters.company_id);

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      if (filters.date_from) {
        query = query.gte("posting_date", filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte("posting_date", filters.date_to);
      }

      query = query.order("created_at", { ascending: false });

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
      }

      const { data: journalEntries, error, count } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        journal_entries: journalEntries as JournalEntry[],
        total: count || 0,
      };
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      return { success: false, error: "Failed to fetch journal entries" };
    }
  }

  /**
   * Submit a transaction (invoice, payment, or journal entry)
   */
  static async submitTransaction(
    type: "invoice" | "payment" | "journal_entry",
    id: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const tableName =
        type === "invoice" ? "invoices" : type === "payment" ? "payments" : "journal_entries";

      const { error } = await supabase
        .from(tableName)
        .update({
          status: "Submitted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error submitting transaction:", error);
      return { success: false, error: "Failed to submit transaction" };
    }
  }

  /**
   * Cancel a transaction
   */
  static async cancelTransaction(
    type: "invoice" | "payment" | "journal_entry",
    id: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const tableName =
        type === "invoice" ? "invoices" : type === "payment" ? "payments" : "journal_entries";

      const { error } = await supabase
        .from(tableName)
        .update({
          status: "Cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      return { success: false, error: "Failed to cancel transaction" };
    }
  }
}
