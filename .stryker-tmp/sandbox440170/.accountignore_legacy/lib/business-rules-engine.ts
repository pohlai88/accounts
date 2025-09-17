/**
 * Business Rules Engine - ERPNext Style
 * Implements comprehensive business validation and authorization rules
 * Integrates with all existing services for complete business logic
 */
// @ts-nocheck


import { supabase } from "./supabase";
import { DocumentWorkflowEngine } from "./document-workflow";
import { MasterDataService } from "./master-data-service";
import { OutstandingManagementService } from "./outstanding-management";

export interface BusinessRule {
  id: string;
  rule_name: string;
  rule_type: "Validation" | "Authorization" | "Calculation" | "Notification";
  document_type: string;
  condition: string;
  action: string;
  error_message?: string;
  is_active: boolean;
  priority: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  required_role?: string;
  approval_required: boolean;
  approver_roles?: string[];
}

export class BusinessRulesEngine {
  /**
   * Validate Sales Invoice Business Rules - ERPNext Style
   */
  static async validateSalesInvoice(
    invoiceData: any,
    companyId: string,
    userId: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    try {
      // 1. Basic Field Validation
      if (!invoiceData.customer_id && !invoiceData.customer_name) {
        errors.push("Customer is required");
      }

      if (!invoiceData.invoice_date) {
        errors.push("Invoice date is required");
      }

      if (!invoiceData.due_date) {
        errors.push("Due date is required");
      }

      if (!invoiceData.items || invoiceData.items.length === 0) {
        errors.push("At least one item is required");
      }

      if (invoiceData.grand_total <= 0) {
        errors.push("Invoice amount must be greater than zero");
      }

      // 2. Date Validation
      const invoiceDate = new Date(invoiceData.invoice_date);
      const dueDate = new Date(invoiceData.due_date);
      const today = new Date();

      if (invoiceDate > today) {
        warnings.push("Invoice date is in the future");
      }

      if (dueDate < invoiceDate) {
        errors.push("Due date cannot be before invoice date");
      }

      // 3. Customer Validation (if customer exists)
      if (invoiceData.customer_id) {
        const customerValidation = await MasterDataService.validateCustomerForTransaction(
          invoiceData.customer_id,
          companyId,
          invoiceData.grand_total,
        );

        errors.push(...customerValidation.errors);
        warnings.push(...customerValidation.warnings);
      }

      // 4. Item Validation
      for (const item of invoiceData.items || []) {
        if (!item.item_name) {
          errors.push(`Item name is required for row ${item.idx || "unknown"}`);
        }

        if (item.qty <= 0) {
          errors.push(`Quantity must be greater than zero for item ${item.item_name}`);
        }

        if (item.rate < 0) {
          errors.push(`Rate cannot be negative for item ${item.item_name}`);
        }
      }

      // 5. Duplicate Invoice Number Check
      if (invoiceData.invoice_no) {
        const { data: duplicates } = await supabase
          .from("invoices")
          .select("id")
          .eq("invoice_no", invoiceData.invoice_no)
          .eq("company_id", companyId)
          .neq("id", invoiceData.id || "new");

        if (duplicates && duplicates.length > 0) {
          errors.push(`Invoice number ${invoiceData.invoice_no} already exists`);
        }
      }

      // 6. Credit Limit Check (Enhanced)
      if (invoiceData.customer_id) {
        const creditCheck = await MasterDataService.checkCustomerCreditLimit(
          invoiceData.customer_id,
          companyId,
          invoiceData.grand_total,
        );

        if (!creditCheck.within_limit) {
          const message = `Credit limit exceeded. Available credit: ${creditCheck.available_credit}`;

          // Check if this is a hard limit or soft limit
          const { data: creditSettings } = await supabase
            .from("company_settings")
            .select("credit_limit_enforcement")
            .eq("company_id", companyId)
            .single();

          if (creditSettings?.credit_limit_enforcement === "strict") {
            errors.push(message);
          } else {
            warnings.push(message + " (Override available with proper authorization)");
          }
        }
      }

      // 7. Fiscal Year Validation
      const fiscalYearCheck = await this.validateFiscalYear(invoiceDate, companyId);
      if (!fiscalYearCheck.valid) {
        errors.push(fiscalYearCheck.message);
      }

      // 8. Account Configuration Check
      const accountCheck = await this.validateAccountConfiguration(invoiceData, companyId);
      errors.push(...accountCheck.errors);
      warnings.push(...accountCheck.warnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        info,
      };
    } catch (error) {
      errors.push(
        "Validation error: " + (error instanceof Error ? error.message : "Unknown error"),
      );
      return { valid: false, errors, warnings, info };
    }
  }

  /**
   * Check Authorization for Document Submission
   */
  static async checkSubmissionAuthorization(
    documentType: string,
    amount: number,
    userId: string,
    companyId: string,
  ): Promise<AuthorizationResult> {
    try {
      // Get user role and authorization limits
      const { data: userAuth } = await supabase
        .from("user_authorization_limits")
        .select("*")
        .eq("user_id", userId)
        .eq("company_id", companyId)
        .eq("document_type", documentType)
        .single();

      if (!userAuth) {
        // Check default authorization limits
        const { data: defaultAuth } = await supabase
          .from("default_authorization_limits")
          .select("*")
          .eq("company_id", companyId)
          .eq("document_type", documentType)
          .single();

        if (!defaultAuth || amount > defaultAuth.amount_limit) {
          return {
            authorized: false,
            reason: `Amount ${amount} exceeds authorization limit`,
            approval_required: true,
            approver_roles: ["Manager", "Director"],
          };
        }
      } else if (amount > userAuth.amount_limit) {
        return {
          authorized: false,
          reason: `Amount ${amount} exceeds your authorization limit of ${userAuth.amount_limit}`,
          approval_required: true,
          approver_roles: userAuth.escalation_roles || ["Manager"],
        };
      }

      return {
        authorized: true,
        approval_required: false,
      };
    } catch (error) {
      return {
        authorized: false,
        reason:
          "Error checking authorization: " +
          (error instanceof Error ? error.message : "Unknown error"),
        approval_required: true,
      };
    }
  }

  /**
   * Calculate Invoice Status Based on Outstanding Amount
   */
  static calculateInvoiceStatus(
    grandTotal: number,
    outstandingAmount: number,
    dueDate: string,
    docstatus: number,
  ): string {
    if (docstatus === 0) return "Draft";
    if (docstatus === 2) return "Cancelled";

    const outstanding = outstandingAmount || 0;
    const today = new Date();
    const due = new Date(dueDate);

    if (outstanding <= 0.01) {
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
   * Validate Fiscal Year
   */
  private static async validateFiscalYear(
    transactionDate: Date,
    companyId: string,
  ): Promise<{ valid: boolean; message: string }> {
    const { data: company } = await supabase
      .from("companies")
      .select("fiscal_year_start")
      .eq("id", companyId)
      .single();

    if (!company) {
      return { valid: false, message: "Company not found" };
    }

    const fiscalYearStart = new Date(company.fiscal_year_start);
    const fiscalYearEnd = new Date(fiscalYearStart);
    fiscalYearEnd.setFullYear(fiscalYearEnd.getFullYear() + 1);

    if (transactionDate < fiscalYearStart || transactionDate >= fiscalYearEnd) {
      return {
        valid: false,
        message: `Transaction date must be within fiscal year (${fiscalYearStart.toDateString()} to ${fiscalYearEnd.toDateString()})`,
      };
    }

    return { valid: true, message: "Fiscal year validation passed" };
  }

  /**
   * Validate Account Configuration
   */
  private static async validateAccountConfiguration(
    invoiceData: any,
    companyId: string,
  ): Promise<{ errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if required accounts are configured
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, name, account_type")
      .eq("company_id", companyId)
      .in("account_type", ["Asset", "Income"]);

    const receivableAccounts =
      accounts?.filter(
        acc => acc.account_type === "Asset" && acc.name.toLowerCase().includes("receivable"),
      ) || [];

    const incomeAccounts = accounts?.filter(acc => acc.account_type === "Income") || [];

    if (receivableAccounts.length === 0) {
      errors.push("No receivable account found. Please configure accounts receivable.");
    }

    if (incomeAccounts.length === 0) {
      warnings.push("No income accounts found. Please configure income accounts.");
    }

    return { errors, warnings };
  }

  /**
   * Apply Business Rules for Payment Entry
   */
  static async validatePaymentEntry(
    paymentData: any,
    companyId: string,
    userId: string,
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const info: string[] = [];

    try {
      // 1. Basic validation
      if (!paymentData.party_name && !paymentData.party_id) {
        errors.push("Customer/Supplier is required");
      }

      if (paymentData.paid_amount <= 0) {
        errors.push("Payment amount must be greater than zero");
      }

      if (!paymentData.mode_of_payment) {
        errors.push("Mode of payment is required");
      }

      // 2. Check if invoices exist for allocation
      if (paymentData.allocations && paymentData.allocations.length > 0) {
        for (const allocation of paymentData.allocations) {
          const { data: invoice } = await supabase
            .from("invoices")
            .select("id, invoice_no, outstanding_amount")
            .eq("id", allocation.invoice_id)
            .eq("company_id", companyId)
            .single();

          if (!invoice) {
            errors.push(`Invoice ${allocation.invoice_id} not found`);
            continue;
          }

          if (allocation.allocated_amount > invoice.outstanding_amount) {
            errors.push(
              `Allocated amount ${allocation.allocated_amount} exceeds outstanding amount ${invoice.outstanding_amount} for invoice ${invoice.invoice_no}`,
            );
          }
        }
      }

      // 3. Check total allocation
      const totalAllocated =
        paymentData.allocations?.reduce(
          (sum: number, alloc: any) => sum + alloc.allocated_amount,
          0,
        ) || 0;

      if (totalAllocated > paymentData.paid_amount) {
        errors.push("Total allocated amount cannot exceed payment amount");
      }

      if (totalAllocated < paymentData.paid_amount) {
        info.push(
          `Unallocated amount: ${paymentData.paid_amount - totalAllocated} will be treated as advance payment`,
        );
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        info,
      };
    } catch (error) {
      errors.push(
        "Payment validation error: " + (error instanceof Error ? error.message : "Unknown error"),
      );
      return { valid: false, errors, warnings, info };
    }
  }

  /**
   * Check if document can be modified
   */
  static canModifyDocument(docstatus: number, userId: string, createdBy?: string): boolean {
    // Only draft documents can be modified
    if (docstatus !== 0) return false;

    // Additional checks can be added here (e.g., user permissions, time limits)
    return true;
  }

  /**
   * Get next document number
   */
  static async getNextDocumentNumber(
    docType: string,
    companyId: string,
    prefix?: string,
  ): Promise<string> {
    const { data, error } = await supabase.rpc("get_next_document_number", {
      p_doc_type: docType,
      p_company_id: companyId,
      p_prefix: prefix,
    });

    if (error) {
      console.error("Error getting next document number:", error);
      // Fallback to timestamp-based number
      const timestamp = Date.now();
      return `${prefix || docType.toUpperCase()}-${timestamp}`;
    }

    return data || `${prefix || docType.toUpperCase()}-000001`;
  }

  /**
   * Comprehensive pre-submission validation
   */
  static async preSubmissionValidation(
    documentType: string,
    documentData: any,
    companyId: string,
    userId: string,
  ): Promise<{
    canSubmit: boolean;
    validationResult: ValidationResult;
    authorizationResult: AuthorizationResult;
  }> {
    let validationResult: ValidationResult;
    let authorizationResult: AuthorizationResult;

    // Run document-specific validation
    switch (documentType) {
      case "Sales Invoice":
        validationResult = await this.validateSalesInvoice(documentData, companyId, userId);
        break;
      case "Payment Entry":
        validationResult = await this.validatePaymentEntry(documentData, companyId, userId);
        break;
      default:
        validationResult = { valid: true, errors: [], warnings: [], info: [] };
    }

    // Check authorization
    authorizationResult = await this.checkSubmissionAuthorization(
      documentType,
      documentData.grand_total || documentData.paid_amount || 0,
      userId,
      companyId,
    );

    return {
      canSubmit: validationResult.valid && authorizationResult.authorized,
      validationResult,
      authorizationResult,
    };
  }
}
