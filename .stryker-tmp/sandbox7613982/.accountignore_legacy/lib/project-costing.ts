/**
 * Project Costing Service
 * Handles project/job costing, time tracking, and profitability analysis
 */
// @ts-nocheck


import { supabase } from "./supabase";

export type ProjectType = "Fixed Price" | "Time & Materials" | "Cost Plus" | "Retainer";
export type ProjectStatus = "Planning" | "Active" | "On Hold" | "Completed" | "Cancelled";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type PhaseType = "Phase" | "Task" | "Milestone" | "Deliverable";
export type PhaseStatus = "Not Started" | "In Progress" | "Completed" | "On Hold" | "Cancelled";
export type ResourceType = "Employee" | "Contractor" | "Equipment" | "Material";
export type BillingType = "Time & Materials" | "Fixed Price" | "Milestone" | "Retainer";
export type BudgetType = "Labor" | "Materials" | "Expenses" | "Overhead" | "Total";
export type ExpenseCategory = "Travel" | "Meals" | "Equipment" | "Software" | "Other";

export interface Project {
  id: string;
  companyId: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  plannedEndDate?: string;
  budgetAmount: number;
  actualCost: number;
  billedAmount: number;
  profitMargin: number;
  customerId?: string;
  projectManagerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPhase {
  id: string;
  projectId: string;
  phaseCode: string;
  phaseName: string;
  description?: string;
  phaseType: PhaseType;
  status: PhaseStatus;
  priority: Priority;
  startDate?: string;
  endDate?: string;
  plannedHours: number;
  actualHours: number;
  plannedCost: number;
  actualCost: number;
  parentPhaseId?: string;
  assignedTo?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  companyId: string;
  projectId: string;
  phaseId?: string;
  userId: string;
  entryDate: string;
  startTime?: string;
  endTime?: string;
  hoursWorked: number;
  hourlyRate: number;
  totalCost: number;
  description?: string;
  billable: boolean;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectExpense {
  id: string;
  companyId: string;
  projectId: string;
  phaseId?: string;
  expenseDate: string;
  description: string;
  category?: ExpenseCategory;
  amount: number;
  currency: string;
  billable: boolean;
  receiptUrl?: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResource {
  id: string;
  projectId: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceName: string;
  hourlyRate: number;
  costPerUnit: number;
  unitOfMeasure: string;
  allocatedHours: number;
  actualHours: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectBudget {
  id: string;
  projectId: string;
  budgetType: BudgetType;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectProfitability {
  projectId: string;
  totalBudget: number;
  totalActualCost: number;
  totalBilled: number;
  grossProfit: number;
  profitMargin: number;
  completionPercentage: number;
}

export interface TimeSummary {
  userId: string;
  userName: string;
  totalHours: number;
  billableHours: number;
  totalCost: number;
}

export interface CreateProjectInput {
  companyId: string;
  projectCode: string;
  projectName: string;
  description?: string;
  projectType: ProjectType;
  priority?: Priority;
  startDate?: string;
  plannedEndDate?: string;
  budgetAmount?: number;
  customerId?: string;
  projectManagerId?: string;
}

export interface CreateTimeEntryInput {
  companyId: string;
  projectId: string;
  phaseId?: string;
  userId: string;
  entryDate: string;
  startTime?: string;
  endTime?: string;
  hoursWorked: number;
  hourlyRate: number;
  description?: string;
  billable?: boolean;
}

export interface CreateProjectExpenseInput {
  companyId: string;
  projectId: string;
  phaseId?: string;
  expenseDate: string;
  description: string;
  category?: ExpenseCategory;
  amount: number;
  currency?: string;
  billable?: boolean;
  receiptUrl?: string;
  createdBy?: string;
}

export class ProjectCostingService {
  /**
   * Create a new project
   */
  static async createProject(
    input: CreateProjectInput,
  ): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          company_id: input.companyId,
          project_code: input.projectCode,
          project_name: input.projectName,
          description: input.description,
          project_type: input.projectType,
          priority: input.priority || "Medium",
          start_date: input.startDate,
          planned_end_date: input.plannedEndDate,
          budget_amount: input.budgetAmount || 0,
          customer_id: input.customerId,
          project_manager_id: input.projectManagerId,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating project:", error);
        return { success: false, error: "Failed to create project" };
      }

      const project: Project = {
        id: data.id,
        companyId: data.company_id,
        projectCode: data.project_code,
        projectName: data.project_name,
        description: data.description,
        projectType: data.project_type,
        status: data.status,
        priority: data.priority,
        startDate: data.start_date,
        endDate: data.end_date,
        plannedEndDate: data.planned_end_date,
        budgetAmount: data.budget_amount,
        actualCost: data.actual_cost,
        billedAmount: data.billed_amount,
        profitMargin: data.profit_margin,
        customerId: data.customer_id,
        projectManagerId: data.project_manager_id,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, project };
    } catch (error) {
      console.error("Error creating project:", error);
      return { success: false, error: "Failed to create project" };
    }
  }

  /**
   * Get all projects for a company
   */
  static async getProjects(
    companyId: string,
  ): Promise<{ success: boolean; projects?: Project[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching projects:", error);
        return { success: false, error: "Failed to fetch projects" };
      }

      const projects: Project[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        projectCode: item.project_code,
        projectName: item.project_name,
        description: item.description,
        projectType: item.project_type,
        status: item.status,
        priority: item.priority,
        startDate: item.start_date,
        endDate: item.end_date,
        plannedEndDate: item.planned_end_date,
        budgetAmount: item.budget_amount,
        actualCost: item.actual_cost,
        billedAmount: item.billed_amount,
        profitMargin: item.profit_margin,
        customerId: item.customer_id,
        projectManagerId: item.project_manager_id,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, projects };
    } catch (error) {
      console.error("Error fetching projects:", error);
      return { success: false, error: "Failed to fetch projects" };
    }
  }

  /**
   * Create a time entry
   */
  static async createTimeEntry(
    input: CreateTimeEntryInput,
  ): Promise<{ success: boolean; timeEntry?: TimeEntry; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("time_entries")
        .insert({
          company_id: input.companyId,
          project_id: input.projectId,
          phase_id: input.phaseId,
          user_id: input.userId,
          entry_date: input.entryDate,
          start_time: input.startTime,
          end_time: input.endTime,
          hours_worked: input.hoursWorked,
          hourly_rate: input.hourlyRate,
          description: input.description,
          billable: input.billable ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating time entry:", error);
        return { success: false, error: "Failed to create time entry" };
      }

      const timeEntry: TimeEntry = {
        id: data.id,
        companyId: data.company_id,
        projectId: data.project_id,
        phaseId: data.phase_id,
        userId: data.user_id,
        entryDate: data.entry_date,
        startTime: data.start_time,
        endTime: data.end_time,
        hoursWorked: data.hours_worked,
        hourlyRate: data.hourly_rate,
        totalCost: data.total_cost,
        description: data.description,
        billable: data.billable,
        approved: data.approved,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, timeEntry };
    } catch (error) {
      console.error("Error creating time entry:", error);
      return { success: false, error: "Failed to create time entry" };
    }
  }

  /**
   * Get time entries for a project
   */
  static async getTimeEntries(
    projectId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ success: boolean; timeEntries?: TimeEntry[]; error?: string }> {
    try {
      let query = supabase
        .from("time_entries")
        .select("*")
        .eq("project_id", projectId)
        .order("entry_date", { ascending: false });

      if (startDate) {
        query = query.gte("entry_date", startDate);
      }
      if (endDate) {
        query = query.lte("entry_date", endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching time entries:", error);
        return { success: false, error: "Failed to fetch time entries" };
      }

      const timeEntries: TimeEntry[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        projectId: item.project_id,
        phaseId: item.phase_id,
        userId: item.user_id,
        entryDate: item.entry_date,
        startTime: item.start_time,
        endTime: item.end_time,
        hoursWorked: item.hours_worked,
        hourlyRate: item.hourly_rate,
        totalCost: item.total_cost,
        description: item.description,
        billable: item.billable,
        approved: item.approved,
        approvedBy: item.approved_by,
        approvedAt: item.approved_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, timeEntries };
    } catch (error) {
      console.error("Error fetching time entries:", error);
      return { success: false, error: "Failed to fetch time entries" };
    }
  }

  /**
   * Create a project expense
   */
  static async createProjectExpense(
    input: CreateProjectExpenseInput,
  ): Promise<{ success: boolean; expense?: ProjectExpense; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("project_expenses")
        .insert({
          company_id: input.companyId,
          project_id: input.projectId,
          phase_id: input.phaseId,
          expense_date: input.expenseDate,
          description: input.description,
          category: input.category,
          amount: input.amount,
          currency: input.currency || "USD",
          billable: input.billable ?? true,
          receipt_url: input.receiptUrl,
          created_by: input.createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating project expense:", error);
        return { success: false, error: "Failed to create project expense" };
      }

      const expense: ProjectExpense = {
        id: data.id,
        companyId: data.company_id,
        projectId: data.project_id,
        phaseId: data.phase_id,
        expenseDate: data.expense_date,
        description: data.description,
        category: data.category,
        amount: data.amount,
        currency: data.currency,
        billable: data.billable,
        receiptUrl: data.receipt_url,
        approved: data.approved,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, expense };
    } catch (error) {
      console.error("Error creating project expense:", error);
      return { success: false, error: "Failed to create project expense" };
    }
  }

  /**
   * Get project expenses
   */
  static async getProjectExpenses(
    projectId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ success: boolean; expenses?: ProjectExpense[]; error?: string }> {
    try {
      let query = supabase
        .from("project_expenses")
        .select("*")
        .eq("project_id", projectId)
        .order("expense_date", { ascending: false });

      if (startDate) {
        query = query.gte("expense_date", startDate);
      }
      if (endDate) {
        query = query.lte("expense_date", endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching project expenses:", error);
        return { success: false, error: "Failed to fetch project expenses" };
      }

      const expenses: ProjectExpense[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        projectId: item.project_id,
        phaseId: item.phase_id,
        expenseDate: item.expense_date,
        description: item.description,
        category: item.category,
        amount: item.amount,
        currency: item.currency,
        billable: item.billable,
        receiptUrl: item.receipt_url,
        approved: item.approved,
        approvedBy: item.approved_by,
        approvedAt: item.approved_at,
        createdBy: item.created_by,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, expenses };
    } catch (error) {
      console.error("Error fetching project expenses:", error);
      return { success: false, error: "Failed to fetch project expenses" };
    }
  }

  /**
   * Get project profitability
   */
  static async getProjectProfitability(
    projectId: string,
  ): Promise<{ success: boolean; profitability?: ProjectProfitability; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("calculate_project_profitability", {
        p_project_id: projectId,
      });

      if (error) {
        console.error("Error calculating project profitability:", error);
        return { success: false, error: "Failed to calculate project profitability" };
      }

      if (data && data.length > 0) {
        const result = data[0];
        const profitability: ProjectProfitability = {
          projectId: result.project_id,
          totalBudget: result.total_budget,
          totalActualCost: result.total_actual_cost,
          totalBilled: result.total_billed,
          grossProfit: result.gross_profit,
          profitMargin: result.profit_margin,
          completionPercentage: result.completion_percentage,
        };

        return { success: true, profitability };
      }

      return { success: false, error: "No profitability data found" };
    } catch (error) {
      console.error("Error calculating project profitability:", error);
      return { success: false, error: "Failed to calculate project profitability" };
    }
  }

  /**
   * Get project time summary
   */
  static async getProjectTimeSummary(
    projectId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ success: boolean; timeSummary?: TimeSummary[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_project_time_summary", {
        p_project_id: projectId,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });

      if (error) {
        console.error("Error fetching project time summary:", error);
        return { success: false, error: "Failed to fetch project time summary" };
      }

      const timeSummary: TimeSummary[] = data.map(item => ({
        userId: item.user_id,
        userName: item.user_name,
        totalHours: item.total_hours,
        billableHours: item.billable_hours,
        totalCost: item.total_cost,
      }));

      return { success: true, timeSummary };
    } catch (error) {
      console.error("Error fetching project time summary:", error);
      return { success: false, error: "Failed to fetch project time summary" };
    }
  }

  /**
   * Get project budgets
   */
  static async getProjectBudgets(
    projectId: string,
  ): Promise<{ success: boolean; budgets?: ProjectBudget[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("project_budgets")
        .select("*")
        .eq("project_id", projectId)
        .order("budget_type", { ascending: true });

      if (error) {
        console.error("Error fetching project budgets:", error);
        return { success: false, error: "Failed to fetch project budgets" };
      }

      const budgets: ProjectBudget[] = data.map(item => ({
        id: item.id,
        projectId: item.project_id,
        budgetType: item.budget_type,
        budgetAmount: item.budget_amount,
        actualAmount: item.actual_amount,
        varianceAmount: item.variance_amount,
        variancePercentage: item.variance_percentage,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, budgets };
    } catch (error) {
      console.error("Error fetching project budgets:", error);
      return { success: false, error: "Failed to fetch project budgets" };
    }
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(
    projectId: string,
    status: ProjectStatus,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("projects").update({ status }).eq("id", projectId);

      if (error) {
        console.error("Error updating project status:", error);
        return { success: false, error: "Failed to update project status" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating project status:", error);
      return { success: false, error: "Failed to update project status" };
    }
  }

  /**
   * Approve time entry
   */
  static async approveTimeEntry(
    timeEntryId: string,
    approvedBy: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("time_entries")
        .update({
          approved: true,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq("id", timeEntryId);

      if (error) {
        console.error("Error approving time entry:", error);
        return { success: false, error: "Failed to approve time entry" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error approving time entry:", error);
      return { success: false, error: "Failed to approve time entry" };
    }
  }

  /**
   * Approve project expense
   */
  static async approveProjectExpense(
    expenseId: string,
    approvedBy: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("project_expenses")
        .update({
          approved: true,
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq("id", expenseId);

      if (error) {
        console.error("Error approving project expense:", error);
        return { success: false, error: "Failed to approve project expense" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error approving project expense:", error);
      return { success: false, error: "Failed to approve project expense" };
    }
  }
}
