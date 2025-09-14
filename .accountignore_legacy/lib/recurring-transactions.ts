/**
 * Recurring Transactions Service
 * Handles automated recurring transactions like monthly rent, subscriptions, etc.
 */

import { supabase } from "./supabase";

export type RecurringFrequency = "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Yearly" | "Custom";
export type TransactionType =
  | "Sales Invoice"
  | "Purchase Invoice"
  | "Payment Entry"
  | "Journal Entry";
export type ExecutionStatus = "Pending" | "Executed" | "Failed" | "Skipped";

export interface RecurringTemplate {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  transactionType: TransactionType;
  frequency: RecurringFrequency;
  customInterval?: number;
  startDate: string;
  endDate?: string;
  nextExecutionDate: string;
  isActive: boolean;
  templateData: any; // JSONB data for the transaction template
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringExecution {
  id: string;
  templateId: string;
  executionDate: string;
  status: ExecutionStatus;
  generatedTransactionId?: string;
  errorMessage?: string;
  executedAt?: string;
  createdAt: string;
}

export interface RecurringRule {
  id: string;
  templateId: string;
  ruleType: "Amount" | "Date" | "Condition";
  ruleCondition: any; // JSONB data for rule logic
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTemplateInput {
  companyId: string;
  name: string;
  description?: string;
  transactionType: TransactionType;
  frequency: RecurringFrequency;
  customInterval?: number;
  startDate: string;
  endDate?: string;
  templateData: any;
  createdBy?: string;
}

export interface UpdateRecurringTemplateInput {
  name?: string;
  description?: string;
  frequency?: RecurringFrequency;
  customInterval?: number;
  endDate?: string;
  isActive?: boolean;
  templateData?: any;
}

export class RecurringTransactionsService {
  /**
   * Create a new recurring template
   */
  static async createTemplate(
    input: CreateRecurringTemplateInput,
  ): Promise<{ success: boolean; template?: RecurringTemplate; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("recurring_templates")
        .insert({
          company_id: input.companyId,
          name: input.name,
          description: input.description,
          transaction_type: input.transactionType,
          frequency: input.frequency,
          custom_interval: input.customInterval,
          start_date: input.startDate,
          end_date: input.endDate,
          next_execution_date: input.startDate,
          template_data: input.templateData,
          created_by: input.createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating recurring template:", error);
        return { success: false, error: "Failed to create recurring template" };
      }

      const template: RecurringTemplate = {
        id: data.id,
        companyId: data.company_id,
        name: data.name,
        description: data.description,
        transactionType: data.transaction_type,
        frequency: data.frequency,
        customInterval: data.custom_interval,
        startDate: data.start_date,
        endDate: data.end_date,
        nextExecutionDate: data.next_execution_date,
        isActive: data.is_active,
        templateData: data.template_data,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, template };
    } catch (error) {
      console.error("Error creating recurring template:", error);
      return { success: false, error: "Failed to create recurring template" };
    }
  }

  /**
   * Get all recurring templates for a company
   */
  static async getTemplates(
    companyId: string,
  ): Promise<{ success: boolean; templates?: RecurringTemplate[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("recurring_templates")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching recurring templates:", error);
        return { success: false, error: "Failed to fetch recurring templates" };
      }

      const templates: RecurringTemplate[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        name: item.name,
        description: item.description,
        transactionType: item.transaction_type,
        frequency: item.frequency,
        customInterval: item.custom_interval,
        startDate: item.start_date,
        endDate: item.end_date,
        nextExecutionDate: item.next_execution_date,
        isActive: item.is_active,
        templateData: item.template_data,
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, templates };
    } catch (error) {
      console.error("Error fetching recurring templates:", error);
      return { success: false, error: "Failed to fetch recurring templates" };
    }
  }

  /**
   * Update a recurring template
   */
  static async updateTemplate(
    templateId: string,
    input: UpdateRecurringTemplateInput,
  ): Promise<{ success: boolean; template?: RecurringTemplate; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("recurring_templates")
        .update({
          name: input.name,
          description: input.description,
          frequency: input.frequency,
          custom_interval: input.customInterval,
          end_date: input.endDate,
          is_active: input.isActive,
          template_data: input.templateData,
        })
        .eq("id", templateId)
        .select()
        .single();

      if (error) {
        console.error("Error updating recurring template:", error);
        return { success: false, error: "Failed to update recurring template" };
      }

      const template: RecurringTemplate = {
        id: data.id,
        companyId: data.company_id,
        name: data.name,
        description: data.description,
        transactionType: data.transaction_type,
        frequency: data.frequency,
        customInterval: data.custom_interval,
        startDate: data.start_date,
        endDate: data.end_date,
        nextExecutionDate: data.next_execution_date,
        isActive: data.is_active,
        templateData: data.template_data,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, template };
    } catch (error) {
      console.error("Error updating recurring template:", error);
      return { success: false, error: "Failed to update recurring template" };
    }
  }

  /**
   * Delete a recurring template
   */
  static async deleteTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("recurring_templates").delete().eq("id", templateId);

      if (error) {
        console.error("Error deleting recurring template:", error);
        return { success: false, error: "Failed to delete recurring template" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error deleting recurring template:", error);
      return { success: false, error: "Failed to delete recurring template" };
    }
  }

  /**
   * Get templates ready for execution
   */
  static async getTemplatesReadyForExecution(
    executionDate?: string,
  ): Promise<{ success: boolean; templates?: RecurringTemplate[]; error?: string }> {
    try {
      const date = executionDate || new Date().toISOString().split("T")[0];

      const { data, error } = await supabase.rpc("get_templates_ready_for_execution", {
        execution_date: date,
      });

      if (error) {
        console.error("Error fetching templates ready for execution:", error);
        return { success: false, error: "Failed to fetch templates ready for execution" };
      }

      const templates: RecurringTemplate[] = data.map(item => ({
        id: item.template_id,
        companyId: item.company_id,
        name: item.name,
        transactionType: item.transaction_type,
        templateData: item.template_data,
        // Add other required fields with defaults
        description: "",
        frequency: "Monthly" as RecurringFrequency,
        startDate: "",
        nextExecutionDate: "",
        isActive: true,
        createdAt: "",
        updatedAt: "",
      }));

      return { success: true, templates };
    } catch (error) {
      console.error("Error fetching templates ready for execution:", error);
      return { success: false, error: "Failed to fetch templates ready for execution" };
    }
  }

  /**
   * Execute a recurring template
   */
  static async executeTemplate(
    templateId: string,
    executionDate?: string,
  ): Promise<{ success: boolean; executionId?: string; transactionId?: string; error?: string }> {
    try {
      const date = executionDate || new Date().toISOString().split("T")[0];

      // First, create an execution record
      const { data: executionData, error: executionError } = await supabase
        .from("recurring_executions")
        .insert({
          template_id: templateId,
          execution_date: date,
          status: "Pending",
        })
        .select()
        .single();

      if (executionError) {
        console.error("Error creating execution record:", executionError);
        return { success: false, error: "Failed to create execution record" };
      }

      // Get the template data
      const { data: templateData, error: templateError } = await supabase
        .from("recurring_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) {
        console.error("Error fetching template data:", templateError);
        return { success: false, error: "Failed to fetch template data" };
      }

      // TODO: Implement actual transaction creation based on template data
      // This would involve calling the appropriate transaction service
      // For now, we'll simulate a successful execution

      // Update execution status to executed
      const { error: updateError } = await supabase
        .from("recurring_executions")
        .update({
          status: "Executed",
          executed_at: new Date().toISOString(),
        })
        .eq("id", executionData.id);

      if (updateError) {
        console.error("Error updating execution status:", updateError);
        return { success: false, error: "Failed to update execution status" };
      }

      // Update next execution date
      const { error: nextDateError } = await supabase.rpc("update_next_execution_date", {
        template_id: templateId,
        execution_date: date,
      });

      if (nextDateError) {
        console.error("Error updating next execution date:", nextDateError);
        // Don't fail the execution for this error
      }

      return {
        success: true,
        executionId: executionData.id,
        transactionId: "mock-transaction-id", // TODO: Return actual transaction ID
      };
    } catch (error) {
      console.error("Error executing recurring template:", error);
      return { success: false, error: "Failed to execute recurring template" };
    }
  }

  /**
   * Get execution history for a template
   */
  static async getExecutionHistory(
    templateId: string,
  ): Promise<{ success: boolean; executions?: RecurringExecution[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("recurring_executions")
        .select("*")
        .eq("template_id", templateId)
        .order("execution_date", { ascending: false });

      if (error) {
        console.error("Error fetching execution history:", error);
        return { success: false, error: "Failed to fetch execution history" };
      }

      const executions: RecurringExecution[] = data.map(item => ({
        id: item.id,
        templateId: item.template_id,
        executionDate: item.execution_date,
        status: item.status,
        generatedTransactionId: item.generated_transaction_id,
        errorMessage: item.error_message,
        executedAt: item.executed_at,
        createdAt: item.created_at,
      }));

      return { success: true, executions };
    } catch (error) {
      console.error("Error fetching execution history:", error);
      return { success: false, error: "Failed to fetch execution history" };
    }
  }

  /**
   * Pause a recurring template
   */
  static async pauseTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("recurring_templates")
        .update({ is_active: false })
        .eq("id", templateId);

      if (error) {
        console.error("Error pausing recurring template:", error);
        return { success: false, error: "Failed to pause recurring template" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error pausing recurring template:", error);
      return { success: false, error: "Failed to pause recurring template" };
    }
  }

  /**
   * Resume a recurring template
   */
  static async resumeTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("recurring_templates")
        .update({ is_active: true })
        .eq("id", templateId);

      if (error) {
        console.error("Error resuming recurring template:", error);
        return { success: false, error: "Failed to resume recurring template" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error resuming recurring template:", error);
      return { success: false, error: "Failed to resume recurring template" };
    }
  }

  /**
   * Get upcoming executions for a company
   */
  static async getUpcomingExecutions(
    companyId: string,
    days: number = 30,
  ): Promise<{ success: boolean; executions?: any[]; error?: string }> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const { data, error } = await supabase
        .from("recurring_templates")
        .select(
          `
          id,
          name,
          transaction_type,
          next_execution_date,
          frequency,
          is_active
        `,
        )
        .eq("company_id", companyId)
        .eq("is_active", true)
        .lte("next_execution_date", endDate.toISOString().split("T")[0])
        .order("next_execution_date", { ascending: true });

      if (error) {
        console.error("Error fetching upcoming executions:", error);
        return { success: false, error: "Failed to fetch upcoming executions" };
      }

      return { success: true, executions: data };
    } catch (error) {
      console.error("Error fetching upcoming executions:", error);
      return { success: false, error: "Failed to fetch upcoming executions" };
    }
  }
}
