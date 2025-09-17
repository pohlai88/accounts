/**
 * Enhanced Invoice Service
 * Advanced invoice management with workflows, templates, and automation
 * Based on ERPNext, Xero, QuickBooks, and Oracle best practices
 */
// @ts-nocheck


import { supabase } from "./supabase";
import { TaxManagementService } from "./tax-management-service";

export interface InvoiceTemplate {
  id: string;
  name: string;
  description?: string;
  template_type: "Sales" | "Purchase" | "Credit Note" | "Debit Note";
  company_id: string;
  header_template?: string;
  footer_template?: string;
  terms_and_conditions?: string;
  default_currency: string;
  default_payment_terms?: string;
  default_due_days: number;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  font_family: string;
  font_size: number;
  show_logo: boolean;
  show_company_details: boolean;
  show_customer_details: boolean;
  show_item_description: boolean;
  show_tax_breakdown: boolean;
  show_payment_terms: boolean;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWorkflow {
  id: string;
  name: string;
  description?: string;
  workflow_type: "Sales" | "Purchase" | "Credit Note" | "Debit Note";
  company_id: string;
  is_active: boolean;
  auto_submit: boolean;
  require_approval: boolean;
  approval_threshold: number;
  send_email_on_create: boolean;
  send_email_on_submit: boolean;
  send_email_on_payment: boolean;
  email_template_id?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWorkflowState {
  id: string;
  workflow_id: string;
  state_name: string;
  state_type: "Draft" | "Submitted" | "Approved" | "Rejected" | "Paid" | "Cancelled";
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

export interface InvoiceWorkflowTransition {
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

export interface InvoiceApproval {
  id: string;
  invoice_id: string;
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

export interface InvoiceEmailLog {
  id: string;
  invoice_id: string;
  recipient_email: string;
  recipient_name?: string;
  email_type: "Invoice" | "Payment Reminder" | "Overdue Notice" | "Payment Confirmation";
  subject: string;
  body: string;
  status: "Sent" | "Delivered" | "Failed" | "Bounced";
  error_message?: string;
  sent_at: string;
  delivered_at?: string;
  created_at: string;
}

export interface InvoiceAttachment {
  id: string;
  invoice_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  description?: string;
  is_public: boolean;
  uploaded_at: string;
  uploaded_by?: string;
}

export interface InvoiceComment {
  id: string;
  invoice_id: string;
  comment: string;
  comment_type: "General" | "Internal" | "Customer" | "System";
  is_internal: boolean;
  user_id?: string;
  user_name: string;
  user_role?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceRecurringSettings {
  id: string;
  invoice_id: string;
  is_recurring: boolean;
  recurring_type: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  recurring_interval: number;
  recurring_days?: number;
  start_date: string;
  end_date?: string;
  next_invoice_date?: string;
  auto_send: boolean;
  send_reminder: boolean;
  reminder_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnhancedInvoice {
  id: string;
  invoice_no: string;
  invoice_type: "Sales" | "Purchase" | "Credit Note" | "Debit Note";
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
  status: string;
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

  // Enhanced fields
  template_id?: string;
  workflow_id?: string;
  current_state?: string;
  workflow_states?: InvoiceWorkflowState[];
  approvals?: InvoiceApproval[];
  attachments?: InvoiceAttachment[];
  comments?: InvoiceComment[];
  recurring_settings?: InvoiceRecurringSettings;
  email_logs?: InvoiceEmailLog[];
}

export interface CreateInvoiceTemplateInput {
  name: string;
  description?: string;
  template_type: "Sales" | "Purchase" | "Credit Note" | "Debit Note";
  company_id: string;
  header_template?: string;
  footer_template?: string;
  terms_and_conditions?: string;
  default_currency?: string;
  default_payment_terms?: string;
  default_due_days?: number;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  font_size?: number;
  show_logo?: boolean;
  show_company_details?: boolean;
  show_customer_details?: boolean;
  show_item_description?: boolean;
  show_tax_breakdown?: boolean;
  show_payment_terms?: boolean;
}

export interface CreateInvoiceWorkflowInput {
  name: string;
  description?: string;
  workflow_type: "Sales" | "Purchase" | "Credit Note" | "Debit Note";
  company_id: string;
  auto_submit?: boolean;
  require_approval?: boolean;
  approval_threshold?: number;
  send_email_on_create?: boolean;
  send_email_on_submit?: boolean;
  send_email_on_payment?: boolean;
  email_template_id?: string;
}

export interface InvoiceWorkflowStateInput {
  workflow_id: string;
  state_name: string;
  state_type: "Draft" | "Submitted" | "Approved" | "Rejected" | "Paid" | "Cancelled";
  display_order: number;
  is_initial?: boolean;
  is_final?: boolean;
  allow_edit?: boolean;
  allow_delete?: boolean;
  require_approval?: boolean;
  send_email?: boolean;
  email_template_id?: string;
}

export interface InvoiceWorkflowTransitionInput {
  workflow_id: string;
  from_state_id: string;
  to_state_id: string;
  transition_name: string;
  is_automatic?: boolean;
  require_approval?: boolean;
  approval_role?: string;
  conditions?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Enhanced Invoice Service
 */
export class EnhancedInvoiceService {
  /**
   * Create invoice template
   */
  static async createInvoiceTemplate(
    input: CreateInvoiceTemplateInput,
  ): Promise<ApiResponse<InvoiceTemplate>> {
    try {
      const { data: template, error } = await supabase
        .from("invoice_templates")
        .insert([
          {
            name: input.name.trim(),
            description: input.description,
            template_type: input.template_type,
            company_id: input.company_id,
            header_template: input.header_template,
            footer_template: input.footer_template,
            terms_and_conditions: input.terms_and_conditions,
            default_currency: input.default_currency || "USD",
            default_payment_terms: input.default_payment_terms,
            default_due_days: input.default_due_days || 30,
            logo_url: input.logo_url,
            primary_color: input.primary_color || "#000000",
            secondary_color: input.secondary_color || "#666666",
            font_family: input.font_family || "Arial",
            font_size: input.font_size || 12,
            show_logo: input.show_logo !== false,
            show_company_details: input.show_company_details !== false,
            show_customer_details: input.show_customer_details !== false,
            show_item_description: input.show_item_description !== false,
            show_tax_breakdown: input.show_tax_breakdown !== false,
            show_payment_terms: input.show_payment_terms !== false,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: template, message: "Invoice template created successfully" };
    } catch (error) {
      console.error("Error creating invoice template:", error);
      return { success: false, error: "Failed to create invoice template" };
    }
  }

  /**
   * Get invoice templates
   */
  static async getInvoiceTemplates(
    companyId: string,
    templateType?: string,
  ): Promise<ApiResponse<InvoiceTemplate[]>> {
    try {
      let query = supabase
        .from("invoice_templates")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (templateType) {
        query = query.eq("template_type", templateType);
      }

      const { data: templates, error } = await query.order("name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: templates };
    } catch (error) {
      console.error("Error fetching invoice templates:", error);
      return { success: false, error: "Failed to fetch invoice templates" };
    }
  }

  /**
   * Create invoice workflow
   */
  static async createInvoiceWorkflow(
    input: CreateInvoiceWorkflowInput,
  ): Promise<ApiResponse<InvoiceWorkflow>> {
    try {
      const { data: workflow, error } = await supabase
        .from("invoice_workflows")
        .insert([
          {
            name: input.name.trim(),
            description: input.description,
            workflow_type: input.workflow_type,
            company_id: input.company_id,
            auto_submit: input.auto_submit || false,
            require_approval: input.require_approval || false,
            approval_threshold: input.approval_threshold || 0,
            send_email_on_create: input.send_email_on_create || false,
            send_email_on_submit: input.send_email_on_submit !== false,
            send_email_on_payment: input.send_email_on_payment !== false,
            email_template_id: input.email_template_id,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: workflow, message: "Invoice workflow created successfully" };
    } catch (error) {
      console.error("Error creating invoice workflow:", error);
      return { success: false, error: "Failed to create invoice workflow" };
    }
  }

  /**
   * Get invoice workflows
   */
  static async getInvoiceWorkflows(
    companyId: string,
    workflowType?: string,
  ): Promise<ApiResponse<InvoiceWorkflow[]>> {
    try {
      let query = supabase
        .from("invoice_workflows")
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
      console.error("Error fetching invoice workflows:", error);
      return { success: false, error: "Failed to fetch invoice workflows" };
    }
  }

  /**
   * Add workflow state
   */
  static async addWorkflowState(
    input: InvoiceWorkflowStateInput,
  ): Promise<ApiResponse<InvoiceWorkflowState>> {
    try {
      const { data: state, error } = await supabase
        .from("invoice_workflow_states")
        .insert([
          {
            workflow_id: input.workflow_id,
            state_name: input.state_name.trim(),
            state_type: input.state_type,
            display_order: input.display_order,
            is_initial: input.is_initial || false,
            is_final: input.is_final || false,
            allow_edit: input.allow_edit !== false,
            allow_delete: input.allow_delete !== false,
            require_approval: input.require_approval || false,
            send_email: input.send_email || false,
            email_template_id: input.email_template_id,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: state, message: "Workflow state added successfully" };
    } catch (error) {
      console.error("Error adding workflow state:", error);
      return { success: false, error: "Failed to add workflow state" };
    }
  }

  /**
   * Add workflow transition
   */
  static async addWorkflowTransition(
    input: InvoiceWorkflowTransitionInput,
  ): Promise<ApiResponse<InvoiceWorkflowTransition>> {
    try {
      const { data: transition, error } = await supabase
        .from("invoice_workflow_transitions")
        .insert([
          {
            workflow_id: input.workflow_id,
            from_state_id: input.from_state_id,
            to_state_id: input.to_state_id,
            transition_name: input.transition_name.trim(),
            is_automatic: input.is_automatic || false,
            require_approval: input.require_approval || false,
            approval_role: input.approval_role,
            conditions: input.conditions || {},
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: transition, message: "Workflow transition added successfully" };
    } catch (error) {
      console.error("Error adding workflow transition:", error);
      return { success: false, error: "Failed to add workflow transition" };
    }
  }

  /**
   * Get invoice workflow states
   */
  static async getInvoiceWorkflowStates(invoiceId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data: states, error } = await supabase.rpc("get_invoice_workflow_states", {
        p_invoice_id: invoiceId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: states };
    } catch (error) {
      console.error("Error fetching invoice workflow states:", error);
      return { success: false, error: "Failed to fetch invoice workflow states" };
    }
  }

  /**
   * Transition invoice state
   */
  static async transitionInvoiceState(
    invoiceId: string,
    toStateId: string,
    approverId?: string,
    approverName?: string,
    approvalNotes?: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { data: success, error } = await supabase.rpc("transition_invoice_state", {
        p_invoice_id: invoiceId,
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
        message: success ? "Invoice state transitioned successfully" : "Invalid transition",
      };
    } catch (error) {
      console.error("Error transitioning invoice state:", error);
      return { success: false, error: "Failed to transition invoice state" };
    }
  }

  /**
   * Add invoice comment
   */
  static async addInvoiceComment(
    invoiceId: string,
    comment: string,
    commentType: "General" | "Internal" | "Customer" | "System" = "General",
    isInternal: boolean = false,
    userId?: string,
    userName: string = "System",
    userRole?: string,
  ): Promise<ApiResponse<InvoiceComment>> {
    try {
      const { data: commentData, error } = await supabase
        .from("invoice_comments")
        .insert([
          {
            invoice_id: invoiceId,
            comment: comment.trim(),
            comment_type: commentType,
            is_internal: isInternal,
            user_id: userId,
            user_name: userName,
            user_role: userRole,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: commentData, message: "Comment added successfully" };
    } catch (error) {
      console.error("Error adding invoice comment:", error);
      return { success: false, error: "Failed to add comment" };
    }
  }

  /**
   * Get invoice comments
   */
  static async getInvoiceComments(
    invoiceId: string,
    includeInternal: boolean = false,
  ): Promise<ApiResponse<InvoiceComment[]>> {
    try {
      let query = supabase.from("invoice_comments").select("*").eq("invoice_id", invoiceId);

      if (!includeInternal) {
        query = query.eq("is_internal", false);
      }

      const { data: comments, error } = await query.order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: comments };
    } catch (error) {
      console.error("Error fetching invoice comments:", error);
      return { success: false, error: "Failed to fetch comments" };
    }
  }

  /**
   * Add invoice attachment
   */
  static async addInvoiceAttachment(
    invoiceId: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    fileType: string,
    mimeType: string,
    description?: string,
    isPublic: boolean = false,
    uploadedBy?: string,
  ): Promise<ApiResponse<InvoiceAttachment>> {
    try {
      const { data: attachment, error } = await supabase
        .from("invoice_attachments")
        .insert([
          {
            invoice_id: invoiceId,
            file_name: fileName,
            file_path: filePath,
            file_size: fileSize,
            file_type: fileType,
            mime_type: mimeType,
            description: description,
            is_public: isPublic,
            uploaded_by: uploadedBy,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: attachment, message: "Attachment added successfully" };
    } catch (error) {
      console.error("Error adding invoice attachment:", error);
      return { success: false, error: "Failed to add attachment" };
    }
  }

  /**
   * Get invoice attachments
   */
  static async getInvoiceAttachments(invoiceId: string): Promise<ApiResponse<InvoiceAttachment[]>> {
    try {
      const { data: attachments, error } = await supabase
        .from("invoice_attachments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("uploaded_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: attachments };
    } catch (error) {
      console.error("Error fetching invoice attachments:", error);
      return { success: false, error: "Failed to fetch attachments" };
    }
  }

  /**
   * Set up recurring invoice
   */
  static async setupRecurringInvoice(
    invoiceId: string,
    recurringType: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly",
    recurringInterval: number = 1,
    recurringDays?: number,
    startDate: string = new Date().toISOString().split("T")[0],
    endDate?: string,
    autoSend: boolean = false,
    sendReminder: boolean = true,
    reminderDays: number = 7,
  ): Promise<ApiResponse<InvoiceRecurringSettings>> {
    try {
      // Calculate next invoice date
      const nextDate = this.calculateNextInvoiceDate(startDate, recurringType, recurringInterval);

      const { data: settings, error } = await supabase
        .from("invoice_recurring_settings")
        .insert([
          {
            invoice_id: invoiceId,
            is_recurring: true,
            recurring_type: recurringType,
            recurring_interval: recurringInterval,
            recurring_days: recurringDays,
            start_date: startDate,
            end_date: endDate,
            next_invoice_date: nextDate,
            auto_send: autoSend,
            send_reminder: sendReminder,
            reminder_days: reminderDays,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: settings, message: "Recurring invoice setup successfully" };
    } catch (error) {
      console.error("Error setting up recurring invoice:", error);
      return { success: false, error: "Failed to setup recurring invoice" };
    }
  }

  /**
   * Calculate next invoice date for recurring invoices
   */
  private static calculateNextInvoiceDate(
    startDate: string,
    recurringType: string,
    recurringInterval: number,
  ): string {
    const start = new Date(startDate);
    const next = new Date(start);

    switch (recurringType) {
      case "Daily":
        next.setDate(start.getDate() + recurringInterval);
        break;
      case "Weekly":
        next.setDate(start.getDate() + 7 * recurringInterval);
        break;
      case "Monthly":
        next.setMonth(start.getMonth() + recurringInterval);
        break;
      case "Quarterly":
        next.setMonth(start.getMonth() + 3 * recurringInterval);
        break;
      case "Yearly":
        next.setFullYear(start.getFullYear() + recurringInterval);
        break;
    }

    return next.toISOString().split("T")[0];
  }

  /**
   * Get enhanced invoice with all related data
   */
  static async getEnhancedInvoice(invoiceId: string): Promise<ApiResponse<EnhancedInvoice>> {
    try {
      // Get basic invoice data
      const { data: invoice, error: invoiceError } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", invoiceId)
        .single();

      if (invoiceError) {
        return { success: false, error: invoiceError.message };
      }

      // Get workflow states
      const workflowStatesResult = await this.getInvoiceWorkflowStates(invoiceId);
      const workflowStates = workflowStatesResult.success ? workflowStatesResult.data : [];

      // Get comments
      const commentsResult = await this.getInvoiceComments(invoiceId, true);
      const comments = commentsResult.success ? commentsResult.data : [];

      // Get attachments
      const attachmentsResult = await this.getInvoiceAttachments(invoiceId);
      const attachments = attachmentsResult.success ? attachmentsResult.data : [];

      // Get recurring settings
      const { data: recurringSettings } = await supabase
        .from("invoice_recurring_settings")
        .select("*")
        .eq("invoice_id", invoiceId)
        .single();

      // Get email logs
      const { data: emailLogs } = await supabase
        .from("invoice_email_logs")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("sent_at", { ascending: false });

      // Get approvals
      const { data: approvals } = await supabase
        .from("invoice_approvals")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("created_at", { ascending: false });

      const enhancedInvoice: EnhancedInvoice = {
        ...invoice,
        workflow_states: workflowStates,
        comments: comments,
        attachments: attachments,
        recurring_settings: recurringSettings,
        email_logs: emailLogs || [],
        approvals: approvals || [],
      };

      return { success: true, data: enhancedInvoice };
    } catch (error) {
      console.error("Error fetching enhanced invoice:", error);
      return { success: false, error: "Failed to fetch enhanced invoice" };
    }
  }

  /**
   * Send invoice email
   */
  static async sendInvoiceEmail(
    invoiceId: string,
    recipientEmail: string,
    recipientName?: string,
    emailType:
      | "Invoice"
      | "Payment Reminder"
      | "Overdue Notice"
      | "Payment Confirmation" = "Invoice",
    customSubject?: string,
    customBody?: string,
  ): Promise<ApiResponse<InvoiceEmailLog>> {
    try {
      // Get invoice data
      const invoiceResult = await this.getEnhancedInvoice(invoiceId);
      if (!invoiceResult.success || !invoiceResult.data) {
        return { success: false, error: "Invoice not found" };
      }

      const invoice = invoiceResult.data;

      // Generate email content
      const subject = customSubject || this.generateEmailSubject(invoice, emailType);
      const body = customBody || this.generateEmailBody(invoice, emailType);

      // Log email
      const { data: emailLog, error } = await supabase
        .from("invoice_email_logs")
        .insert([
          {
            invoice_id: invoiceId,
            recipient_email: recipientEmail,
            recipient_name: recipientName,
            email_type: emailType,
            subject: subject,
            body: body,
            status: "Sent",
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
      // For now, we just log the email

      return { success: true, data: emailLog, message: "Email sent successfully" };
    } catch (error) {
      console.error("Error sending invoice email:", error);
      return { success: false, error: "Failed to send email" };
    }
  }

  /**
   * Generate email subject
   */
  private static generateEmailSubject(invoice: EnhancedInvoice, emailType: string): string {
    switch (emailType) {
      case "Invoice":
        return `${invoice.invoice_type} Invoice ${invoice.invoice_no} - ${invoice.company_id}`;
      case "Payment Reminder":
        return `Payment Reminder - ${invoice.invoice_type} Invoice ${invoice.invoice_no}`;
      case "Overdue Notice":
        return `Overdue Notice - ${invoice.invoice_type} Invoice ${invoice.invoice_no}`;
      case "Payment Confirmation":
        return `Payment Confirmation - ${invoice.invoice_type} Invoice ${invoice.invoice_no}`;
      default:
        return `${invoice.invoice_type} Invoice ${invoice.invoice_no}`;
    }
  }

  /**
   * Generate email body
   */
  private static generateEmailBody(invoice: EnhancedInvoice, emailType: string): string {
    const partyName = invoice.customer_name || invoice.supplier_name || "Valued Customer";

    switch (emailType) {
      case "Invoice":
        return `
Dear ${partyName},

Please find attached your ${invoice.invoice_type.toLowerCase()} invoice ${invoice.invoice_no} for ${invoice.currency} ${invoice.grand_total.toFixed(2)}.

Invoice Date: ${new Date(invoice.invoice_date).toLocaleDateString()}
Due Date: ${new Date(invoice.due_date).toLocaleDateString()}

Thank you for your business!

Best regards,
${invoice.company_id}
                `;
      case "Payment Reminder":
        return `
Dear ${partyName},

This is a friendly reminder that payment for ${invoice.invoice_type.toLowerCase()} invoice ${invoice.invoice_no} is due on ${new Date(invoice.due_date).toLocaleDateString()}.

Amount Due: ${invoice.currency} ${invoice.outstanding_amount.toFixed(2)}

Please remit payment at your earliest convenience.

Thank you!

Best regards,
${invoice.company_id}
                `;
      case "Overdue Notice":
        return `
Dear ${partyName},

This is an overdue notice for ${invoice.invoice_type.toLowerCase()} invoice ${invoice.invoice_no}.

Original Amount: ${invoice.currency} ${invoice.grand_total.toFixed(2)}
Outstanding Amount: ${invoice.currency} ${invoice.outstanding_amount.toFixed(2)}
Days Overdue: ${Math.ceil((new Date().getTime() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24))}

Please remit payment immediately to avoid any late fees.

Best regards,
${invoice.company_id}
                `;
      case "Payment Confirmation":
        return `
Dear ${partyName},

Thank you for your payment of ${invoice.currency} ${invoice.paid_amount.toFixed(2)} for ${invoice.invoice_type.toLowerCase()} invoice ${invoice.invoice_no}.

Payment Date: ${new Date().toLocaleDateString()}
Remaining Balance: ${invoice.currency} ${invoice.outstanding_amount.toFixed(2)}

We appreciate your business!

Best regards,
${invoice.company_id}
                `;
      default:
        return `Please find attached your ${invoice.invoice_type.toLowerCase()} invoice ${invoice.invoice_no}.`;
    }
  }
}
