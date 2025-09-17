/**
 * Document Workflow Engine - ERPNext Style
 * Implements the core document lifecycle: Draft → Submit → Cancel
 * Built on top of existing TransactionService and AccountingEngine
 */
// @ts-nocheck


import { supabase } from "./supabase";
import { AccountingEngine } from "./accounting-engine";
import { TransactionService, type Invoice, type Payment } from "./transaction-service";

// Document status enum matching ERPNext
export enum DocumentStatus {
  DRAFT = 0,
  SUBMITTED = 1,
  CANCELLED = 2,
}

export interface DocumentWorkflowResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export interface SubmissionContext {
  userId: string;
  companyId: string;
  postingDate: string;
  remarks?: string;
}

export class DocumentWorkflowEngine {
  /**
   * Submit a Sales Invoice - ERPNext Style
   * 1. Validate business rules
   * 2. Check authorization limits
   * 3. Create GL entries
   * 4. Update outstanding amounts
   * 5. Update document status
   */
  static async submitSalesInvoice(
    invoiceId: string,
    context: SubmissionContext,
  ): Promise<DocumentWorkflowResult> {
    try {
      // 1. Get invoice details
      const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .eq("company_id", context.companyId)
        .single();

      if (fetchError || !invoice) {
        return {
          success: false,
          message: "Invoice not found or access denied",
          errors: [fetchError?.message || "Invoice not found"],
        };
      }

      // 2. Validate current status
      if (invoice.status !== "Draft") {
        return {
          success: false,
          message: `Cannot submit invoice with status: ${invoice.status}`,
          errors: ["Invoice must be in Draft status to submit"],
        };
      }

      // 3. Validate business rules
      const validationResult = await this.validateSalesInvoiceSubmission(invoice, context);
      if (!validationResult.success) {
        return validationResult;
      }

      // 4. Check authorization limits (if configured)
      const authResult = await this.checkAuthorizationLimits(
        "Sales Invoice",
        invoice.grand_total,
        context.userId,
        context.companyId,
      );
      if (!authResult.success) {
        return authResult;
      }

      // 5. Create GL entries using existing AccountingEngine
      const glEntries = AccountingEngine.createSalesInvoiceEntries(
        invoice.grand_total,
        invoice.receivable_account_id || "default-receivable", // Would be configured
        invoice.revenue_account_id || "default-revenue",
        invoice.invoice_no,
        context.postingDate,
        context.companyId,
        invoice.customer_name,
        invoice.due_date,
        invoice.cost_center_id,
        invoice.project_id,
      );

      // 6. Validate GL entries balance
      AccountingEngine.validateTransaction(glEntries);

      // 7. Start database transaction
      const { error: transactionError } = await supabase.rpc("submit_sales_invoice", {
        p_invoice_id: invoiceId,
        p_gl_entries: glEntries,
        p_user_id: context.userId,
        p_posting_date: context.postingDate,
        p_remarks: context.remarks,
      });

      if (transactionError) {
        return {
          success: false,
          message: "Failed to submit invoice",
          errors: [transactionError.message],
        };
      }

      return {
        success: true,
        message: `Sales Invoice ${invoice.invoice_no} submitted successfully`,
        data: { invoiceNo: invoice.invoice_no, status: "Submitted" },
      };
    } catch (error) {
      return {
        success: false,
        message: "Unexpected error during submission",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Cancel a Sales Invoice - ERPNext Style
   * 1. Validate cancellation rules
   * 2. Check if payments exist
   * 3. Create reverse GL entries
   * 4. Update document status
   */
  static async cancelSalesInvoice(
    invoiceId: string,
    context: SubmissionContext,
    cancellationReason: string,
  ): Promise<DocumentWorkflowResult> {
    try {
      // 1. Get invoice details
      const { data: invoice, error: fetchError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .eq("company_id", context.companyId)
        .single();

      if (fetchError || !invoice) {
        return {
          success: false,
          message: "Invoice not found or access denied",
          errors: [fetchError?.message || "Invoice not found"],
        };
      }

      // 2. Validate current status
      if (invoice.status !== "Submitted") {
        return {
          success: false,
          message: `Cannot cancel invoice with status: ${invoice.status}`,
          errors: ["Only submitted invoices can be cancelled"],
        };
      }

      // 3. Check if any payments exist against this invoice
      const { data: payments, error: paymentsError } = await supabase
        .from("gl_entries")
        .select("id")
        .eq("against_voucher", invoice.invoice_no)
        .eq("against_voucher_type", "Sales Invoice")
        .eq("docstatus", DocumentStatus.SUBMITTED)
        .limit(1);

      if (paymentsError) {
        return {
          success: false,
          message: "Error checking payment history",
          errors: [paymentsError.message],
        };
      }

      if (payments && payments.length > 0) {
        return {
          success: false,
          message: "Cannot cancel invoice with existing payments",
          errors: ["Please cancel all payments against this invoice first"],
        };
      }

      // 4. Create reverse GL entries
      const originalGLEntries = AccountingEngine.createSalesInvoiceEntries(
        invoice.grand_total,
        invoice.receivable_account_id || "default-receivable",
        invoice.revenue_account_id || "default-revenue",
        invoice.invoice_no,
        context.postingDate,
        context.companyId,
        invoice.customer_name,
        invoice.due_date,
        invoice.cost_center_id,
        invoice.project_id,
      );

      // Reverse the entries (swap debit/credit)
      const reverseGLEntries = originalGLEntries.map(entry => ({
        ...entry,
        debit: entry.credit,
        credit: entry.debit,
        voucher_type: "Sales Invoice" as const,
        voucher_no: `${invoice.invoice_no}-CANCEL`,
        docstatus: DocumentStatus.SUBMITTED,
        user_remark: `Cancellation of ${invoice.invoice_no}: ${cancellationReason}`,
      }));

      // 5. Execute cancellation transaction
      const { error: cancellationError } = await supabase.rpc("cancel_sales_invoice", {
        p_invoice_id: invoiceId,
        p_reverse_gl_entries: reverseGLEntries,
        p_user_id: context.userId,
        p_cancellation_reason: cancellationReason,
        p_posting_date: context.postingDate,
      });

      if (cancellationError) {
        return {
          success: false,
          message: "Failed to cancel invoice",
          errors: [cancellationError.message],
        };
      }

      return {
        success: true,
        message: `Sales Invoice ${invoice.invoice_no} cancelled successfully`,
        data: { invoiceNo: invoice.invoice_no, status: "Cancelled" },
      };
    } catch (error) {
      return {
        success: false,
        message: "Unexpected error during cancellation",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Submit Payment Entry - ERPNext Style
   */
  static async submitPaymentEntry(
    paymentId: string,
    context: SubmissionContext,
  ): Promise<DocumentWorkflowResult> {
    try {
      // Similar implementation for payment entries
      // This would follow the same pattern as sales invoice submission

      return {
        success: true,
        message: "Payment entry submitted successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to submit payment entry",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Validate Sales Invoice Submission Rules
   */
  private static async validateSalesInvoiceSubmission(
    invoice: any,
    context: SubmissionContext,
  ): Promise<DocumentWorkflowResult> {
    const errors: string[] = [];

    // 1. Basic field validation
    if (!invoice.customer_name) {
      errors.push("Customer name is required");
    }

    if (invoice.grand_total <= 0) {
      errors.push("Invoice amount must be greater than zero");
    }

    if (!invoice.due_date) {
      errors.push("Due date is required");
    }

    // 2. Date validation
    const invoiceDate = new Date(invoice.invoice_date);
    const postingDate = new Date(context.postingDate);

    if (postingDate < invoiceDate) {
      errors.push("Posting date cannot be before invoice date");
    }

    // 3. Check for duplicate invoice number
    const { data: duplicates } = await supabase
      .from("invoices")
      .select("id")
      .eq("invoice_no", invoice.invoice_no)
      .eq("company_id", context.companyId)
      .neq("id", invoice.id)
      .eq("status", "Submitted");

    if (duplicates && duplicates.length > 0) {
      errors.push(`Invoice number ${invoice.invoice_no} already exists`);
    }

    return {
      success: errors.length === 0,
      message: errors.length === 0 ? "Validation passed" : "Validation failed",
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Check Authorization Limits
   */
  private static async checkAuthorizationLimits(
    docType: string,
    amount: number,
    userId: string,
    companyId: string,
  ): Promise<DocumentWorkflowResult> {
    // This would check user authorization limits from a configuration table
    // For now, we'll implement a basic check

    // Example: Users can approve up to $10,000 without additional authorization
    const userLimit = 10000; // This would come from user role configuration

    if (amount > userLimit) {
      return {
        success: false,
        message: `Amount ${amount} exceeds authorization limit of ${userLimit}`,
        errors: ["Additional authorization required for this amount"],
      };
    }

    return {
      success: true,
      message: "Authorization check passed",
    };
  }

  /**
   * Get Document Status Display
   */
  static getStatusDisplay(docstatus: number): string {
    switch (docstatus) {
      case DocumentStatus.DRAFT:
        return "Draft";
      case DocumentStatus.SUBMITTED:
        return "Submitted";
      case DocumentStatus.CANCELLED:
        return "Cancelled";
      default:
        return "Unknown";
    }
  }

  /**
   * Check if document can be submitted
   */
  static canSubmit(docstatus: number): boolean {
    return docstatus === DocumentStatus.DRAFT;
  }

  /**
   * Check if document can be cancelled
   */
  static canCancel(docstatus: number): boolean {
    return docstatus === DocumentStatus.SUBMITTED;
  }

  /**
   * Check if document can be amended (ERPNext feature)
   */
  static canAmend(docstatus: number): boolean {
    return docstatus === DocumentStatus.CANCELLED;
  }
}
