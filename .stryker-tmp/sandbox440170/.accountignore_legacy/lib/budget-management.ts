/**
 * Budget Management Service
 * Handles budget creation, tracking, and variance analysis
 */
// @ts-nocheck


import { supabase } from "./supabase";

export type PeriodType = "Monthly" | "Quarterly" | "Yearly" | "Custom";
export type CategoryType = "Revenue" | "Expense" | "Asset" | "Liability" | "Equity";
export type BudgetType = "Master" | "Department" | "Project" | "Cash Flow";
export type BudgetStatus = "Draft" | "Approved" | "Active" | "Closed";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type ScenarioType = "Optimistic" | "Realistic" | "Pessimistic" | "Custom";
export type ForecastMethod = "Historical" | "Trend" | "Seasonal" | "Manual";

export interface BudgetPeriod {
  id: string;
  companyId: string;
  periodName: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetCategory {
  id: string;
  companyId: string;
  categoryName: string;
  categoryType: CategoryType;
  parentCategoryId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  companyId: string;
  budgetName: string;
  budgetPeriodId: string;
  budgetType: BudgetType;
  departmentId?: string;
  projectId?: string;
  status: BudgetStatus;
  totalBudgetAmount: number;
  totalActualAmount: number;
  totalVarianceAmount: number;
  totalVariancePercentage: number;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  budgetId: string;
  accountId: string;
  budgetCategoryId?: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetVariance {
  budgetId: string;
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number;
}

export interface BudgetVsActualReport {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAmount: number;
  variancePercentage: number;
  categoryName: string;
}

export interface BudgetScenario {
  id: string;
  companyId: string;
  scenarioName: string;
  scenarioType: ScenarioType;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetForecast {
  id: string;
  budgetId: string;
  forecastPeriodStart: string;
  forecastPeriodEnd: string;
  forecastAmount: number;
  confidenceLevel: number;
  forecastMethod: ForecastMethod;
  createdBy?: string;
  createdAt: string;
}

export interface CreateBudgetPeriodInput {
  companyId: string;
  periodName: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
}

export interface CreateBudgetInput {
  companyId: string;
  budgetName: string;
  budgetPeriodId: string;
  budgetType: BudgetType;
  departmentId?: string;
  projectId?: string;
  createdBy?: string;
}

export interface CreateBudgetItemInput {
  budgetId: string;
  accountId: string;
  budgetCategoryId?: string;
  budgetAmount: number;
  notes?: string;
}

export class BudgetManagementService {
  /**
   * Create a budget period
   */
  static async createBudgetPeriod(
    input: CreateBudgetPeriodInput,
  ): Promise<{ success: boolean; period?: BudgetPeriod; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("budget_periods")
        .insert({
          company_id: input.companyId,
          period_name: input.periodName,
          period_type: input.periodType,
          start_date: input.startDate,
          end_date: input.endDate,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating budget period:", error);
        return { success: false, error: "Failed to create budget period" };
      }

      const period: BudgetPeriod = {
        id: data.id,
        companyId: data.company_id,
        periodName: data.period_name,
        periodType: data.period_type,
        startDate: data.start_date,
        endDate: data.end_date,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, period };
    } catch (error) {
      console.error("Error creating budget period:", error);
      return { success: false, error: "Failed to create budget period" };
    }
  }

  /**
   * Get budget periods
   */
  static async getBudgetPeriods(
    companyId: string,
  ): Promise<{ success: boolean; periods?: BudgetPeriod[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("budget_periods")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("start_date", { ascending: false });

      if (error) {
        console.error("Error fetching budget periods:", error);
        return { success: false, error: "Failed to fetch budget periods" };
      }

      const periods: BudgetPeriod[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        periodName: item.period_name,
        periodType: item.period_type,
        startDate: item.start_date,
        endDate: item.end_date,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, periods };
    } catch (error) {
      console.error("Error fetching budget periods:", error);
      return { success: false, error: "Failed to fetch budget periods" };
    }
  }

  /**
   * Create a budget
   */
  static async createBudget(
    input: CreateBudgetInput,
  ): Promise<{ success: boolean; budget?: Budget; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          company_id: input.companyId,
          budget_name: input.budgetName,
          budget_period_id: input.budgetPeriodId,
          budget_type: input.budgetType,
          department_id: input.departmentId,
          project_id: input.projectId,
          created_by: input.createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating budget:", error);
        return { success: false, error: "Failed to create budget" };
      }

      const budget: Budget = {
        id: data.id,
        companyId: data.company_id,
        budgetName: data.budget_name,
        budgetPeriodId: data.budget_period_id,
        budgetType: data.budget_type,
        departmentId: data.department_id,
        projectId: data.project_id,
        status: data.status,
        totalBudgetAmount: data.total_budget_amount,
        totalActualAmount: data.total_actual_amount,
        totalVarianceAmount: data.total_variance_amount,
        totalVariancePercentage: data.total_variance_percentage,
        createdBy: data.created_by,
        approvedBy: data.approved_by,
        approvedAt: data.approved_at,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, budget };
    } catch (error) {
      console.error("Error creating budget:", error);
      return { success: false, error: "Failed to create budget" };
    }
  }

  /**
   * Get budgets for a company
   */
  static async getBudgets(
    companyId: string,
  ): Promise<{ success: boolean; budgets?: Budget[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching budgets:", error);
        return { success: false, error: "Failed to fetch budgets" };
      }

      const budgets: Budget[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        budgetName: item.budget_name,
        budgetPeriodId: item.budget_period_id,
        budgetType: item.budget_type,
        departmentId: item.department_id,
        projectId: item.project_id,
        status: item.status,
        totalBudgetAmount: item.total_budget_amount,
        totalActualAmount: item.total_actual_amount,
        totalVarianceAmount: item.total_variance_amount,
        totalVariancePercentage: item.total_variance_percentage,
        createdBy: item.created_by,
        approvedBy: item.approved_by,
        approvedAt: item.approved_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, budgets };
    } catch (error) {
      console.error("Error fetching budgets:", error);
      return { success: false, error: "Failed to fetch budgets" };
    }
  }

  /**
   * Add budget item
   */
  static async addBudgetItem(
    input: CreateBudgetItemInput,
  ): Promise<{ success: boolean; budgetItem?: BudgetItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("budget_items")
        .insert({
          budget_id: input.budgetId,
          account_id: input.accountId,
          budget_category_id: input.budgetCategoryId,
          budget_amount: input.budgetAmount,
          notes: input.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("Error adding budget item:", error);
        return { success: false, error: "Failed to add budget item" };
      }

      const budgetItem: BudgetItem = {
        id: data.id,
        budgetId: data.budget_id,
        accountId: data.account_id,
        budgetCategoryId: data.budget_category_id,
        budgetAmount: data.budget_amount,
        actualAmount: data.actual_amount,
        varianceAmount: data.variance_amount,
        variancePercentage: data.variance_percentage,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, budgetItem };
    } catch (error) {
      console.error("Error adding budget item:", error);
      return { success: false, error: "Failed to add budget item" };
    }
  }

  /**
   * Get budget items
   */
  static async getBudgetItems(
    budgetId: string,
  ): Promise<{ success: boolean; budgetItems?: BudgetItem[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", budgetId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching budget items:", error);
        return { success: false, error: "Failed to fetch budget items" };
      }

      const budgetItems: BudgetItem[] = data.map(item => ({
        id: item.id,
        budgetId: item.budget_id,
        accountId: item.account_id,
        budgetCategoryId: item.budget_category_id,
        budgetAmount: item.budget_amount,
        actualAmount: item.actual_amount,
        varianceAmount: item.variance_amount,
        variancePercentage: item.variance_percentage,
        notes: item.notes,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, budgetItems };
    } catch (error) {
      console.error("Error fetching budget items:", error);
      return { success: false, error: "Failed to fetch budget items" };
    }
  }

  /**
   * Get budget vs actual report
   */
  static async getBudgetVsActualReport(
    budgetId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{ success: boolean; report?: BudgetVsActualReport[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_budget_vs_actual_report", {
        p_budget_id: budgetId,
        p_start_date: startDate || null,
        p_end_date: endDate || null,
      });

      if (error) {
        console.error("Error fetching budget vs actual report:", error);
        return { success: false, error: "Failed to fetch budget vs actual report" };
      }

      const report: BudgetVsActualReport[] = data.map(item => ({
        accountId: item.account_id,
        accountCode: item.account_code,
        accountName: item.account_name,
        accountType: item.account_type,
        budgetAmount: item.budget_amount,
        actualAmount: item.actual_amount,
        varianceAmount: item.variance_amount,
        variancePercentage: item.variance_percentage,
        categoryName: item.category_name,
      }));

      return { success: true, report };
    } catch (error) {
      console.error("Error fetching budget vs actual report:", error);
      return { success: false, error: "Failed to fetch budget vs actual report" };
    }
  }

  /**
   * Update budget actuals
   */
  static async updateBudgetActuals(
    budgetId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc("update_budget_actuals", {
        p_budget_id: budgetId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error("Error updating budget actuals:", error);
        return { success: false, error: "Failed to update budget actuals" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating budget actuals:", error);
      return { success: false, error: "Failed to update budget actuals" };
    }
  }

  /**
   * Get budget variance
   */
  static async getBudgetVariance(
    budgetId: string,
  ): Promise<{ success: boolean; variance?: BudgetVariance; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("calculate_budget_variance", {
        p_budget_id: budgetId,
      });

      if (error) {
        console.error("Error calculating budget variance:", error);
        return { success: false, error: "Failed to calculate budget variance" };
      }

      if (data && data.length > 0) {
        const result = data[0];
        const variance: BudgetVariance = {
          budgetId: result.budget_id,
          totalBudget: result.total_budget,
          totalActual: result.total_actual,
          totalVariance: result.total_variance,
          variancePercentage: result.variance_percentage,
        };

        return { success: true, variance };
      }

      return { success: false, error: "No variance data found" };
    } catch (error) {
      console.error("Error calculating budget variance:", error);
      return { success: false, error: "Failed to calculate budget variance" };
    }
  }

  /**
   * Create budget from previous period
   */
  static async createBudgetFromPrevious(
    companyId: string,
    budgetName: string,
    budgetPeriodId: string,
    previousBudgetId: string,
    growthRate: number = 0,
  ): Promise<{ success: boolean; budgetId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("create_budget_from_previous", {
        p_company_id: companyId,
        p_budget_name: budgetName,
        p_budget_period_id: budgetPeriodId,
        p_previous_budget_id: previousBudgetId,
        p_growth_rate: growthRate,
      });

      if (error) {
        console.error("Error creating budget from previous:", error);
        return { success: false, error: "Failed to create budget from previous" };
      }

      return { success: true, budgetId: data };
    } catch (error) {
      console.error("Error creating budget from previous:", error);
      return { success: false, error: "Failed to create budget from previous" };
    }
  }

  /**
   * Update budget status
   */
  static async updateBudgetStatus(
    budgetId: string,
    status: BudgetStatus,
    approvedBy?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { status };

      if (status === "Approved" && approvedBy) {
        updateData.approved_by = approvedBy;
        updateData.approved_at = new Date().toISOString();
      }

      const { error } = await supabase.from("budgets").update(updateData).eq("id", budgetId);

      if (error) {
        console.error("Error updating budget status:", error);
        return { success: false, error: "Failed to update budget status" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating budget status:", error);
      return { success: false, error: "Failed to update budget status" };
    }
  }

  /**
   * Get budget categories
   */
  static async getBudgetCategories(
    companyId: string,
  ): Promise<{ success: boolean; categories?: BudgetCategory[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("budget_categories")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("category_name", { ascending: true });

      if (error) {
        console.error("Error fetching budget categories:", error);
        return { success: false, error: "Failed to fetch budget categories" };
      }

      const categories: BudgetCategory[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        categoryName: item.category_name,
        categoryType: item.category_type,
        parentCategoryId: item.parent_category_id,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, categories };
    } catch (error) {
      console.error("Error fetching budget categories:", error);
      return { success: false, error: "Failed to fetch budget categories" };
    }
  }
}
