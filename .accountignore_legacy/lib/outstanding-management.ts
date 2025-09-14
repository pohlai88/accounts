/**
 * Outstanding Management System - ERPNext Style
 * Handles automatic payment allocation, outstanding calculations, and aging reports
 * Built on top of existing GL Entry system
 */

import { supabase } from "./supabase";
import { DocumentWorkflowEngine } from "./document-workflow";

export interface OutstandingInvoice {
  id: string;
  invoice_no: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  grand_total: number;
  outstanding_amount: number;
  days_overdue: number;
  aging_bucket: string;
  status: "Paid" | "Partly Paid" | "Overdue" | "Unpaid";
}

export interface PaymentAllocationEntry {
  invoice_id: string;
  invoice_no: string;
  allocated_amount: number;
  outstanding_before: number;
  outstanding_after: number;
}

export interface PaymentAllocationResult {
  success: boolean;
  message: string;
  allocations: PaymentAllocationEntry[];
  unallocated_amount: number;
  errors?: string[];
}

export class OutstandingManagementService {
  /**
   * Get outstanding invoices for a customer with aging analysis
   */
  static async getCustomerOutstandingInvoices(
    customerId: string,
    companyId: string,
  ): Promise<OutstandingInvoice[]> {
    const { data, error } = await supabase.rpc("get_customer_outstanding_invoices", {
      p_customer_id: customerId,
      p_company_id: companyId,
    });

    if (error) {
      console.error("Error fetching outstanding invoices:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate invoice status based on outstanding amount and due date
   */
  static calculateInvoiceStatus(
    grandTotal: number,
    outstandingAmount: number,
    dueDate: string,
  ): "Paid" | "Partly Paid" | "Overdue" | "Unpaid" {
    const outstanding = outstandingAmount || 0;
    const today = new Date();
    const due = new Date(dueDate);

    if (outstanding <= 0.01) {
      // Allow for small rounding differences
      return "Paid";
    }

    if (outstanding < grandTotal) {
      return "Partly Paid";
    }

    if (due < today) {
      return "Overdue";
    }

    return "Unpaid";
  }

  /**
   * Get aging bucket for outstanding amount
   */
  static getAgingBucket(daysOverdue: number): string {
    if (daysOverdue <= 0) return "Not Due";
    if (daysOverdue <= 30) return "1-30 Days";
    if (daysOverdue <= 60) return "31-60 Days";
    if (daysOverdue <= 90) return "61-90 Days";
    return "90+ Days";
  }

  /**
   * Allocate payment against outstanding invoices - ERPNext Style
   * Supports both automatic and manual allocation
   */
  static async allocatePayment(
    paymentAmount: number,
    customerId: string,
    companyId: string,
    paymentNo: string,
    paymentDate: string,
    manualAllocations?: { invoice_id: string; amount: number }[],
  ): Promise<PaymentAllocationResult> {
    try {
      // Get outstanding invoices
      const outstandingInvoices = await this.getCustomerOutstandingInvoices(customerId, companyId);

      if (outstandingInvoices.length === 0) {
        return {
          success: false,
          message: "No outstanding invoices found for allocation",
          allocations: [],
          unallocated_amount: paymentAmount,
          errors: ["No outstanding invoices available"],
        };
      }

      let remainingAmount = paymentAmount;
      const allocations: PaymentAllocationEntry[] = [];

      if (manualAllocations && manualAllocations.length > 0) {
        // Manual allocation - allocate as specified by user
        for (const allocation of manualAllocations) {
          const invoice = outstandingInvoices.find(inv => inv.id === allocation.invoice_id);
          if (!invoice) {
            continue;
          }

          const allocatedAmount = Math.min(
            allocation.amount,
            invoice.outstanding_amount,
            remainingAmount,
          );

          if (allocatedAmount > 0) {
            allocations.push({
              invoice_id: invoice.id,
              invoice_no: invoice.invoice_no,
              allocated_amount: allocatedAmount,
              outstanding_before: invoice.outstanding_amount,
              outstanding_after: invoice.outstanding_amount - allocatedAmount,
            });

            remainingAmount -= allocatedAmount;
          }
        }
      } else {
        // Automatic allocation - FIFO (First In, First Out) by due date
        const sortedInvoices = outstandingInvoices
          .filter(inv => inv.outstanding_amount > 0)
          .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

        for (const invoice of sortedInvoices) {
          if (remainingAmount <= 0) break;

          const allocatedAmount = Math.min(invoice.outstanding_amount, remainingAmount);

          allocations.push({
            invoice_id: invoice.id,
            invoice_no: invoice.invoice_no,
            allocated_amount: allocatedAmount,
            outstanding_before: invoice.outstanding_amount,
            outstanding_after: invoice.outstanding_amount - allocatedAmount,
          });

          remainingAmount -= allocatedAmount;
        }
      }

      // Execute the allocation in database
      if (allocations.length > 0) {
        const { error } = await supabase.rpc("process_payment_allocation", {
          p_payment_no: paymentNo,
          p_payment_date: paymentDate,
          p_customer_id: customerId,
          p_company_id: companyId,
          p_allocations: JSON.stringify(allocations),
          p_unallocated_amount: remainingAmount,
        });

        if (error) {
          return {
            success: false,
            message: "Failed to process payment allocation",
            allocations: [],
            unallocated_amount: paymentAmount,
            errors: [error.message],
          };
        }
      }

      return {
        success: true,
        message: `Payment allocated successfully. ${allocations.length} invoices updated.`,
        allocations,
        unallocated_amount: remainingAmount,
      };
    } catch (error) {
      return {
        success: false,
        message: "Unexpected error during payment allocation",
        allocations: [],
        unallocated_amount: paymentAmount,
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  /**
   * Generate aging report for all customers
   */
  static async generateAgingReport(companyId: string, asOfDate?: string): Promise<any[]> {
    const { data, error } = await supabase.rpc("generate_aging_report", {
      p_company_id: companyId,
      p_as_of_date: asOfDate || new Date().toISOString().split("T")[0],
    });

    if (error) {
      console.error("Error generating aging report:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Update all outstanding amounts for invoices
   * This should be called periodically or after payment entries
   */
  static async updateAllOutstandingAmounts(companyId: string): Promise<void> {
    const { error } = await supabase.rpc("update_all_outstanding_amounts", {
      p_company_id: companyId,
    });

    if (error) {
      console.error("Error updating outstanding amounts:", error);
      throw error;
    }
  }

  /**
   * Get payment allocation history for an invoice
   */
  static async getInvoicePaymentHistory(invoiceNo: string, companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("gl_entries")
      .select(
        `
                id,
                voucher_no,
                posting_date,
                credit as allocated_amount,
                party,
                remarks,
                created_at
            `,
      )
      .eq("against_voucher", invoiceNo)
      .eq("against_voucher_type", "Sales Invoice")
      .eq("company_id", companyId)
      .eq("docstatus", 1)
      .eq("is_cancelled", false)
      .order("posting_date", { ascending: true });

    if (error) {
      console.error("Error fetching payment history:", error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate customer credit utilization
   */
  static async getCustomerCreditUtilization(
    customerId: string,
    companyId: string,
  ): Promise<{
    credit_limit: number;
    outstanding_amount: number;
    available_credit: number;
    utilization_percentage: number;
  }> {
    const { data, error } = await supabase.rpc("get_customer_credit_utilization", {
      p_customer_id: customerId,
      p_company_id: companyId,
    });

    if (error) {
      console.error("Error calculating credit utilization:", error);
      return {
        credit_limit: 0,
        outstanding_amount: 0,
        available_credit: 0,
        utilization_percentage: 0,
      };
    }

    return (
      data || {
        credit_limit: 0,
        outstanding_amount: 0,
        available_credit: 0,
        utilization_percentage: 0,
      }
    );
  }

  /**
   * Check if customer has exceeded credit limit
   */
  static async checkCreditLimit(
    customerId: string,
    companyId: string,
    additionalAmount: number = 0,
  ): Promise<{
    within_limit: boolean;
    credit_limit: number;
    current_outstanding: number;
    projected_outstanding: number;
    available_credit: number;
  }> {
    const utilization = await this.getCustomerCreditUtilization(customerId, companyId);
    const projectedOutstanding = utilization.outstanding_amount + additionalAmount;

    return {
      within_limit: projectedOutstanding <= utilization.credit_limit,
      credit_limit: utilization.credit_limit,
      current_outstanding: utilization.outstanding_amount,
      projected_outstanding: projectedOutstanding,
      available_credit: Math.max(0, utilization.credit_limit - projectedOutstanding),
    };
  }
}
