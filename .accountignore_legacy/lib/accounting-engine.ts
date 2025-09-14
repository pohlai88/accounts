import { GLEntry } from "./supabase";

/**
 * Core Accounting Engine - Extracted concepts from ERPNext
 * Implements double-entry bookkeeping principles
 */

export class AccountingEngine {
  /**
   * Validates that a transaction balances (debit = credit)
   * This is the fundamental rule of double-entry accounting
   */
  static validateTransaction(entries: Omit<GLEntry, "id" | "created_at">[]): void {
    const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);
    const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

    const difference = Math.abs(totalDebit - totalCredit);

    // Allow for small rounding differences (0.01)
    if (difference > 0.01) {
      throw new Error(`Transaction must balance: Debit (${totalDebit}) ≠ Credit (${totalCredit})`);
    }
  }

  /**
   * Creates GL entries for a sales invoice
   * Debit: Accounts Receivable, Credit: Revenue
   */
  static createSalesInvoiceEntries(
    invoiceAmount: number,
    receivableAccount: string,
    revenueAccount: string,
    voucherNo: string,
    postingDate: string,
    companyId: string,
    customerName?: string,
    dueDate?: string,
    costCenterId?: string,
    projectId?: string,
  ): Omit<GLEntry, "id" | "created_at">[] {
    return [
      {
        account_id: receivableAccount,
        debit: invoiceAmount,
        credit: 0,
        posting_date: postingDate,
        voucher_type: "Sales Invoice",
        voucher_no: voucherNo,
        company_id: companyId,
        // Enhanced ERPNext fields
        party_type: "Customer",
        party: customerName,
        due_date: dueDate,
        against_account: revenueAccount,
        docstatus: 1, // Submitted
        finance_book: "Default",
        cost_center_id: costCenterId,
        project_id: projectId,
        is_opening: false,
        is_advance: false,
        is_cancelled: false,
      },
      {
        account_id: revenueAccount,
        debit: 0,
        credit: invoiceAmount,
        posting_date: postingDate,
        voucher_type: "Sales Invoice",
        voucher_no: voucherNo,
        company_id: companyId,
        // Enhanced ERPNext fields
        party_type: "Customer",
        party: customerName,
        against_account: receivableAccount,
        docstatus: 1, // Submitted
        finance_book: "Default",
        cost_center_id: costCenterId,
        project_id: projectId,
        is_opening: false,
        is_advance: false,
        is_cancelled: false,
      },
    ];
  }

  /**
   * Creates GL entries for a payment received
   * Debit: Bank/Cash, Credit: Accounts Receivable
   */
  static createPaymentReceivedEntries(
    paymentAmount: number,
    bankAccount: string,
    receivableAccount: string,
    voucherNo: string,
    postingDate: string,
    companyId: string,
    customerName?: string,
    againstInvoice?: string,
    costCenterId?: string,
    projectId?: string,
  ): Omit<GLEntry, "id" | "created_at">[] {
    return [
      {
        account_id: bankAccount,
        debit: paymentAmount,
        credit: 0,
        posting_date: postingDate,
        voucher_type: "Payment Entry",
        voucher_no: voucherNo,
        company_id: companyId,
        // Enhanced ERPNext fields
        party_type: "Customer",
        party: customerName,
        against_account: receivableAccount,
        against_voucher: againstInvoice,
        against_voucher_type: againstInvoice ? "Sales Invoice" : undefined,
        docstatus: 1, // Submitted
        finance_book: "Default",
        cost_center_id: costCenterId,
        project_id: projectId,
        is_opening: false,
        is_advance: !againstInvoice, // If no invoice, it's an advance
        is_cancelled: false,
      },
      {
        account_id: receivableAccount,
        debit: 0,
        credit: paymentAmount,
        posting_date: postingDate,
        voucher_type: "Payment Entry",
        voucher_no: voucherNo,
        company_id: companyId,
        // Enhanced ERPNext fields
        party_type: "Customer",
        party: customerName,
        against_account: bankAccount,
        against_voucher: againstInvoice,
        against_voucher_type: againstInvoice ? "Sales Invoice" : undefined,
        docstatus: 1, // Submitted
        finance_book: "Default",
        cost_center_id: costCenterId,
        project_id: projectId,
        is_opening: false,
        is_advance: !againstInvoice, // If no invoice, it's an advance
        is_cancelled: false,
      },
    ];
  }

  /**
   * Calculates account balance based on account type
   * Assets/Expenses: Debit increases balance
   * Liabilities/Equity/Income: Credit increases balance
   */
  static calculateAccountBalance(
    entries: GLEntry[],
    accountType: "Asset" | "Liability" | "Equity" | "Income" | "Expense",
  ): number {
    const balance = entries.reduce((sum, entry) => sum + (entry.debit - entry.credit), 0);

    // For Assets and Expenses, positive balance means debit balance
    // For Liabilities, Equity, and Income, we flip the sign
    return ["Asset", "Expense"].includes(accountType) ? balance : -balance;
  }

  /**
   * Generates next voucher number
   */
  static generateVoucherNo(voucherType: string, companyCode: string): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

    const prefix =
      voucherType === "Sales Invoice"
        ? "SI"
        : voucherType === "Purchase Invoice"
          ? "PI"
          : voucherType === "Payment Entry"
            ? "PE"
            : "JE";

    return `${prefix}-${companyCode}-${year}${month}-${random}`;
  }
}
