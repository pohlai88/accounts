/**
 * Enhanced Document Workflow Engine - ERPNext Level
 * Advanced document lifecycle with approval workflows, linking, and automation
 */
// @ts-nocheck


import { supabase } from "./supabase";
import { DocumentWorkflowEngine, DocumentStatus, SubmissionContext } from "./document-workflow";
import { ERPNextBudgetManagementService } from "./budget-management-enhanced";
import { AccountingDimensionsService } from "./accounting-dimensions-service";
import { PeriodClosingService } from "./period-closing-service";

// Enhanced workflow interfaces
export interface WorkflowState {
  id: string;
  workflowName: string;
  stateName: string;
  docType: string;
  isOptional: boolean;
  allowEdit: boolean;
  nextStates: string[];
  requiredRoles: string[];
  conditions?: string;
}

export interface WorkflowAction {
  id: string;
  workflowStateId: string;
  actionName: string;
  nextState: string;
  allowedRoles: string[];
  condition?: string;
  actionType: "Approve" | "Reject" | "Send Back" | "Custom";
}

export interface DocumentApproval {
  id: string;
  documentType: string;
  documentId: string;
  companyId: string;
  currentState: string;
  approvalStatus: "Pending" | "Approved" | "Rejected" | "Cancelled";
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  comments?: string;
  approvalLevel: number;
  totalLevels: number;
}

export interface DocumentLink {
  id: string;
  parentDocType: string;
  parentDocId: string;
  childDocType: string;
  childDocId: string;
  linkType: "Reference" | "Dependency" | "Auto-Create";
  createdAt: string;
}

export interface AutomationRule {
  id: string;
  ruleName: string;
  documentType: string;
  eventType: "Before Save" | "After Save" | "On Submit" | "On Cancel" | "On Update";
  condition: string;
  action: string;
  isActive: boolean;
  companyId: string;
}

export interface DocumentSeries {
  id: string;
  seriesName: string;
  documentType: string;
  companyId: string;
  prefix: string;
  currentNumber: number;
  yearlyReset: boolean;
  isActive: boolean;
}

export interface EnhancedSubmissionResult {
  success: boolean;
  message: string;
  documentId?: string;
  workflowState?: string;
  approvalRequired?: boolean;
  nextApprovers?: string[];
  automationResults?: any[];
  linkedDocuments?: DocumentLink[];
  errors?: string[];
  warnings?: string[];
}

export class EnhancedDocumentWorkflowEngine extends DocumentWorkflowEngine {
  /**
   * Enhanced document submission with workflow, approval, and automation
   */
  static async submitDocumentEnhanced(
    documentType: string,
    documentId: string,
    context: SubmissionContext & {
      skipApproval?: boolean;
      bypassWorkflow?: boolean;
      automationContext?: Record<string, any>;
    },
  ): Promise<EnhancedSubmissionResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];
      const automationResults: any[] = [];
      const linkedDocuments: DocumentLink[] = [];

      // 1. Run pre-submission validations
      const preValidation = await this.runPreSubmissionValidations(
        documentType,
        documentId,
        context,
      );

      if (!preValidation.isValid) {
        return {
          success: false,
          message: "Pre-submission validation failed",
          errors: preValidation.errors,
          warnings: preValidation.warnings,
        };
      }

      // 2. Check workflow requirements
      let workflowState: string | undefined;
      let approvalRequired = false;
      let nextApprovers: string[] = [];

      if (!context.bypassWorkflow) {
        const workflowCheck = await this.checkWorkflowRequirements(
          documentType,
          documentId,
          context,
        );

        workflowState = workflowCheck.currentState;
        approvalRequired = workflowCheck.approvalRequired;
        nextApprovers = workflowCheck.nextApprovers;

        if (workflowCheck.blocked) {
          return {
            success: false,
            message: workflowCheck.blockReason || "Workflow requirements not met",
            workflowState,
            approvalRequired,
            nextApprovers,
          };
        }
      }

      // 3. Run automation rules (Before Submit)
      const beforeSubmitAutomation = await this.runAutomationRules(
        documentType,
        documentId,
        "Before Save",
        context.automationContext,
      );
      automationResults.push(...beforeSubmitAutomation);

      // 4. Perform core submission logic
      let coreSubmissionResult;
      switch (documentType) {
        case "Sales Invoice":
          coreSubmissionResult = await this.submitSalesInvoice(documentId, context);
          break;
        case "Purchase Invoice":
          coreSubmissionResult = await this.submitPurchaseInvoice(documentId, context);
          break;
        case "Payment Entry":
          coreSubmissionResult = await this.submitPaymentEntry(documentId, context);
          break;
        case "Journal Entry":
          coreSubmissionResult = await this.submitJournalEntry(documentId, context);
          break;
        default:
          coreSubmissionResult = await this.submitGenericDocument(
            documentType,
            documentId,
            context,
          );
      }

      if (!coreSubmissionResult.success) {
        return {
          success: false,
          message: coreSubmissionResult.message,
          errors: coreSubmissionResult.errors,
        };
      }

      // 5. Create document links
      const documentLinks = await this.createDocumentLinks(documentType, documentId, context);
      linkedDocuments.push(...documentLinks);

      // 6. Run automation rules (After Submit)
      const afterSubmitAutomation = await this.runAutomationRules(
        documentType,
        documentId,
        "On Submit",
        context.automationContext,
      );
      automationResults.push(...afterSubmitAutomation);

      // 7. Handle approval workflow
      if (approvalRequired && !context.skipApproval) {
        await this.createApprovalRequest(
          documentType,
          documentId,
          context.companyId,
          context.userId,
          nextApprovers,
        );
      }

      // 8. Update document status
      await this.updateDocumentStatus(documentType, documentId, {
        docstatus: approvalRequired ? 0 : 1, // Keep draft if approval required
        workflowState,
        submittedBy: context.userId,
        submittedAt: new Date().toISOString(),
      });

      return {
        success: true,
        message: approvalRequired
          ? "Document submitted for approval"
          : "Document submitted successfully",
        documentId,
        workflowState,
        approvalRequired,
        nextApprovers,
        automationResults,
        linkedDocuments,
        warnings,
      };
    } catch (error) {
      return {
        success: false,
        message: `Enhanced submission failed: ${error}`,
        errors: [`System error: ${error}`],
      };
    }
  }

  /**
   * Approve document
   */
  static async approveDocument(
    documentType: string,
    documentId: string,
    approverId: string,
    comments?: string,
  ): Promise<EnhancedSubmissionResult> {
    try {
      // Get current approval request
      const { data: approval, error } = await supabase
        .from("document_approvals")
        .select("*")
        .eq("document_type", documentType)
        .eq("document_id", documentId)
        .eq("approval_status", "Pending")
        .single();

      if (error || !approval) {
        return {
          success: false,
          message: "No pending approval found",
        };
      }

      // Check if user is authorized to approve
      const canApprove = await this.checkApprovalAuthorization(approval.id, approverId);

      if (!canApprove) {
        return {
          success: false,
          message: "User not authorized to approve this document",
        };
      }

      // Update approval status
      const { error: updateError } = await supabase
        .from("document_approvals")
        .update({
          approval_status: "Approved",
          approved_by: approverId,
          approved_at: new Date().toISOString(),
          comments,
        })
        .eq("id", approval.id);

      if (updateError) {
        return {
          success: false,
          message: updateError.message,
        };
      }

      // Check if this was the final approval
      const isFinalApproval = approval.approval_level >= approval.total_levels;

      if (isFinalApproval) {
        // Submit the document
        await this.updateDocumentStatus(documentType, documentId, {
          docstatus: 1,
          approvedBy: approverId,
          approvedAt: new Date().toISOString(),
        });

        // Run post-approval automation
        await this.runAutomationRules(documentType, documentId, "On Submit", {
          approvedBy: approverId,
        });
      }

      return {
        success: true,
        message: isFinalApproval
          ? "Document approved and submitted"
          : "Document approved, pending further approvals",
      };
    } catch (error) {
      return {
        success: false,
        message: `Approval failed: ${error}`,
      };
    }
  }

  /**
   * Reject document
   */
  static async rejectDocument(
    documentType: string,
    documentId: string,
    rejectorId: string,
    comments: string,
  ): Promise<EnhancedSubmissionResult> {
    try {
      // Get current approval request
      const { data: approval, error } = await supabase
        .from("document_approvals")
        .select("*")
        .eq("document_type", documentType)
        .eq("document_id", documentId)
        .eq("approval_status", "Pending")
        .single();

      if (error || !approval) {
        return {
          success: false,
          message: "No pending approval found",
        };
      }

      // Update approval status
      const { error: updateError } = await supabase
        .from("document_approvals")
        .update({
          approval_status: "Rejected",
          rejected_by: rejectorId,
          rejected_at: new Date().toISOString(),
          comments,
        })
        .eq("id", approval.id);

      if (updateError) {
        return {
          success: false,
          message: updateError.message,
        };
      }

      // Update document status back to draft
      await this.updateDocumentStatus(documentType, documentId, {
        docstatus: 0,
        workflowState: "Rejected",
      });

      return {
        success: true,
        message: "Document rejected and sent back to draft",
      };
    } catch (error) {
      return {
        success: false,
        message: `Rejection failed: ${error}`,
      };
    }
  }

  /**
   * Create document series number
   */
  static async createDocumentNumber(
    documentType: string,
    companyId: string,
    seriesPrefix?: string,
  ): Promise<{ success: boolean; documentNumber?: string; error?: string }> {
    try {
      // Get or create document series
      let { data: series, error: seriesError } = await supabase
        .from("document_series")
        .select("*")
        .eq("document_type", documentType)
        .eq("company_id", companyId)
        .eq("is_active", true)
        .single();

      if (seriesError && seriesError.code !== "PGRST116") {
        return { success: false, error: seriesError.message };
      }

      if (!series) {
        // Create default series
        const defaultPrefix = seriesPrefix || documentType.substring(0, 3).toUpperCase();
        const { data: newSeries, error: createError } = await supabase
          .from("document_series")
          .insert({
            series_name: `${documentType} Series`,
            document_type: documentType,
            company_id: companyId,
            prefix: defaultPrefix,
            current_number: 0,
            yearly_reset: true,
            is_active: true,
          })
          .select("*")
          .single();

        if (createError) {
          return { success: false, error: createError.message };
        }

        series = newSeries;
      }

      // Generate next number
      const currentYear = new Date().getFullYear();
      const nextNumber = series.current_number + 1;
      const documentNumber = `${series.prefix}-${currentYear}-${nextNumber.toString().padStart(5, "0")}`;

      // Update series
      const { error: updateError } = await supabase
        .from("document_series")
        .update({ current_number: nextNumber })
        .eq("id", series.id);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true, documentNumber };
    } catch (error) {
      return { success: false, error: `Failed to create document number: ${error}` };
    }
  }

  /**
   * Private helper methods
   */
  private static async runPreSubmissionValidations(
    documentType: string,
    documentId: string,
    context: SubmissionContext,
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Validate against closed periods
      const { data: document } = await supabase
        .from(this.getTableName(documentType))
        .select("posting_date")
        .eq("id", documentId)
        .single();

      if (document) {
        const periodValidation = await PeriodClosingService.validatePostingDateAgainstClosedPeriods(
          context.companyId,
          document.posting_date,
          documentType,
        );

        if (!periodValidation.isValid) {
          errors.push(periodValidation.message);
        }
      }

      // 2. Validate budget (for expense documents)
      if (documentType === "Purchase Invoice") {
        // Budget validation would go here
      }

      // 3. Validate accounting dimensions
      if (document) {
        const dimensionValidation = await AccountingDimensionsService.validateDimensions(
          context.companyId,
          documentType,
          document,
        );

        if (!dimensionValidation.isValid) {
          errors.push(...dimensionValidation.errors);
        }
        warnings.push(...dimensionValidation.warnings);
      }

      return { isValid: errors.length === 0, errors, warnings };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Pre-submission validation error: ${error}`],
        warnings: [],
      };
    }
  }

  private static async checkWorkflowRequirements(
    documentType: string,
    documentId: string,
    context: SubmissionContext,
  ): Promise<{
    currentState?: string;
    approvalRequired: boolean;
    nextApprovers: string[];
    blocked: boolean;
    blockReason?: string;
  }> {
    // Simplified workflow check - in full implementation would check workflow states
    return {
      approvalRequired: false,
      nextApprovers: [],
      blocked: false,
    };
  }

  private static async runAutomationRules(
    documentType: string,
    documentId: string,
    eventType: string,
    context?: Record<string, any>,
  ): Promise<any[]> {
    // Automation rules execution - placeholder
    return [];
  }

  private static async createDocumentLinks(
    documentType: string,
    documentId: string,
    context: SubmissionContext,
  ): Promise<DocumentLink[]> {
    // Document linking logic - placeholder
    return [];
  }

  private static async createApprovalRequest(
    documentType: string,
    documentId: string,
    companyId: string,
    requestedBy: string,
    approvers: string[],
  ): Promise<void> {
    // Create approval request
    await supabase.from("document_approvals").insert({
      document_type: documentType,
      document_id: documentId,
      company_id: companyId,
      current_state: "Pending Approval",
      approval_status: "Pending",
      requested_by: requestedBy,
      requested_at: new Date().toISOString(),
      approval_level: 1,
      total_levels: approvers.length,
    });
  }

  private static async updateDocumentStatus(
    documentType: string,
    documentId: string,
    updates: Record<string, any>,
  ): Promise<void> {
    const tableName = this.getTableName(documentType);
    await supabase.from(tableName).update(updates).eq("id", documentId);
  }

  private static async checkApprovalAuthorization(
    approvalId: string,
    userId: string,
  ): Promise<boolean> {
    // Check if user can approve - simplified
    return true;
  }

  private static getTableName(documentType: string): string {
    const tableMap: Record<string, string> = {
      "Sales Invoice": "invoices",
      "Purchase Invoice": "purchase_invoices",
      "Payment Entry": "payments",
      "Journal Entry": "journal_entries",
    };
    return tableMap[documentType] || "documents";
  }

  private static async submitGenericDocument(
    documentType: string,
    documentId: string,
    context: SubmissionContext,
  ): Promise<{ success: boolean; message: string; errors?: string[] }> {
    // Generic document submission
    return { success: true, message: "Document submitted successfully" };
  }
}

export default EnhancedDocumentWorkflowEngine;
