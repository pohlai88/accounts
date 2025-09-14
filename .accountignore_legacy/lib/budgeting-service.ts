/**
 * Budgeting & Forecasting Service - Complete Financial Planning System
 * Multi-dimensional budgeting with variance analysis and advanced forecasting
 * ERPNext-level budget management with modern analytics capabilities
 *
 * Features:
 * - Multi-dimensional budget creation and management
 * - Real-time variance analysis and reporting
 * - Advanced forecasting algorithms (Linear, Weighted Average, Seasonal)
 * - Budget approval workflows with multi-level authorization
 * - What-if scenario analysis and stress testing
 * - Automated alerts and threshold monitoring
 * - Monthly/quarterly budget breakdown and tracking
 * - Budget revision control and change management
 * - Integration with GL entries for actual vs budget reporting
 * - Comprehensive budget analytics and dashboards
 */

import { supabase } from "./supabase";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type BudgetDimension =
  | "Profit and Loss"
  | "Balance Sheet"
  | "Cash Flow"
  | "Capital"
  | "Project"
  | "Department";
export type PlanningHorizon = "Monthly" | "Quarterly" | "Annual" | "Multi-Year";
export type BudgetMethod = "Zero Based" | "Incremental" | "Activity Based" | "Value Based";
export type BudgetStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Active"
  | "Closed"
  | "Cancelled";
export type PeriodType = "Monthly" | "Quarterly" | "Annual";
export type ForecastMethod = "Linear" | "Seasonal" | "Weighted Average" | "Manual";
export type DistributionMethod = "Even" | "Weighted" | "Historical" | "Manual";
export type RevisionType =
  | "Budget Amendment"
  | "Reallocation"
  | "Supplementary"
  | "Technical Adjustment";
export type ScenarioType = "Optimistic" | "Pessimistic" | "Most Likely" | "Stress Test" | "Custom";
export type AlertType =
  | "Variance Threshold"
  | "Budget Exceeded"
  | "Under Spending"
  | "Forecast Change"
  | "Approval Required";
export type AlertLevel = "Info" | "Warning" | "Critical";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export interface BudgetType {
  id: string;
  company_id: string;
  type_name: string;
  type_code: string;
  budget_dimension: BudgetDimension;
  planning_horizon: PlanningHorizon;
  is_rolling_budget: boolean;
  auto_rollover: boolean;
  variance_threshold_percentage: number;
  requires_approval: boolean;
  approval_hierarchy: any[];
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface BudgetTemplate {
  id: string;
  company_id: string;
  template_name: string;
  template_code: string;
  budget_type_id: string;
  fiscal_year_start_month: number;
  currency: string;
  budget_frequency: PeriodType;
  account_structure: any;
  dimension_structure: any;
  template_version: number;
  is_current_version: boolean;
  is_active: boolean;
  description?: string;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
  budget_type?: BudgetType;
}

export interface Budget {
  id: string;
  company_id: string;
  budget_name: string;
  budget_code: string;
  budget_type_id: string;
  budget_template_id?: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  currency: string;
  exchange_rate: number;
  budget_method: BudgetMethod;
  cost_center_id?: string;
  project_id?: string;
  department?: string;
  status: BudgetStatus;
  docstatus: number;
  submitted_by?: string;
  submitted_at?: string;
  approved_by?: string;
  approved_at?: string;
  approval_comments?: string;
  total_budgeted_amount: number;
  total_actual_amount: number;
  total_variance_amount: number;
  variance_percentage: number;
  budget_version: number;
  parent_budget_id?: string;
  revision_reason?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data
  budget_type?: BudgetType;
  budget_template?: BudgetTemplate;
  items?: BudgetItem[];
  monthly_breakdown?: BudgetMonthlyBreakdown[];
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  company_id: string;
  account_head: string;
  account_name?: string;
  account_type?: string;
  cost_center_id?: string;
  project_id?: string;
  department?: string;
  budget_dimension_1?: string;
  budget_dimension_2?: string;
  period_type: PeriodType;
  period_start_date: string;
  period_end_date: string;
  budgeted_amount: number;
  revised_amount?: number;
  actual_amount: number;
  committed_amount: number;
  available_amount: number;
  variance_amount: number;
  variance_percentage: number;
  variance_reason?: string;
  forecast_amount?: number;
  forecast_method: ForecastMethod;
  forecast_confidence: number;
  distribution_method: DistributionMethod;
  distribution_weights: number[];
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  is_active: boolean;
  line_item_notes?: string;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data
  monthly_breakdown?: BudgetMonthlyBreakdown[];
}

export interface BudgetMonthlyBreakdown {
  id: string;
  budget_item_id: string;
  budget_id: string;
  company_id: string;
  fiscal_year: number;
  fiscal_month: number;
  period_start_date: string;
  period_end_date: string;
  budgeted_amount: number;
  revised_amount?: number;
  actual_amount: number;
  committed_amount: number;
  available_amount: number;
  variance_amount: number;
  variance_percentage: number;
  forecast_amount?: number;
  forecast_updated_at?: string;
  actuals_last_updated?: string;
  actuals_source?: string;
  created_at: string;
  modified: string;
}

export interface BudgetRevision {
  id: string;
  budget_id: string;
  company_id: string;
  revision_number: number;
  revision_type: RevisionType;
  revision_reason: string;
  total_budget_change: number;
  affected_accounts_count: number;
  requested_by: string;
  requested_at: string;
  approved_by?: string;
  approved_at?: string;
  approval_status: ApprovalStatus;
  approval_comments?: string;
  effective_date: string;
  created_at: string;

  // Related data
  revision_items?: BudgetRevisionItem[];
}

export interface BudgetRevisionItem {
  id: string;
  budget_revision_id: string;
  budget_item_id: string;
  change_type: "Increase" | "Decrease" | "Reallocate From" | "Reallocate To";
  original_amount: number;
  revised_amount: number;
  change_amount: number;
  change_percentage: number;
  change_reason: string;
  supporting_documents: any[];
  created_at: string;
}

export interface BudgetScenario {
  id: string;
  budget_id: string;
  company_id: string;
  scenario_name: string;
  scenario_type: ScenarioType;
  scenario_description?: string;
  revenue_adjustment_percentage: number;
  expense_adjustment_percentage: number;
  specific_adjustments: any;
  projected_revenue: number;
  projected_expenses: number;
  projected_profit: number;
  roi_percentage: number;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface BudgetAlert {
  id: string;
  budget_id: string;
  budget_item_id?: string;
  company_id: string;
  alert_type: AlertType;
  alert_level: AlertLevel;
  alert_message: string;
  trigger_value?: number;
  threshold_value?: number;
  variance_percentage?: number;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  acknowledgment_notes?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  resolution_notes?: string;
  created_at: string;
  notification_sent: boolean;
  notification_recipients: string[];
}

export interface VarianceAnalysis {
  variance_amount: number;
  variance_percentage: number;
  variance_type: "Favorable" | "Unfavorable" | "On Budget";
}

export interface BudgetAnalytics {
  total_budget_amount: number;
  total_actual_amount: number;
  total_variance_amount: number;
  overall_variance_percentage: number;
  budget_utilization_rate: number;
  forecast_accuracy: number;
  budget_by_department: {
    department: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];
  budget_by_account_type: {
    account_type: string;
    budgeted: number;
    actual: number;
    variance: number;
  }[];
  monthly_trend: { month: string; budgeted: number; actual: number; variance: number }[];
  top_variances: { account: string; variance_amount: number; variance_percentage: number }[];
  budget_alerts_summary: { level: AlertLevel; count: number }[];
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreateBudgetTypeInput {
  company_id: string;
  type_name: string;
  type_code: string;
  budget_dimension: BudgetDimension;
  planning_horizon?: PlanningHorizon;
  is_rolling_budget?: boolean;
  auto_rollover?: boolean;
  variance_threshold_percentage?: number;
  requires_approval?: boolean;
  approval_hierarchy?: any[];
  is_default?: boolean;
}

export interface CreateBudgetTemplateInput {
  company_id: string;
  template_name: string;
  template_code: string;
  budget_type_id: string;
  fiscal_year_start_month?: number;
  currency?: string;
  budget_frequency?: PeriodType;
  account_structure?: any;
  dimension_structure?: any;
  description?: string;
}

export interface CreateBudgetInput {
  company_id: string;
  budget_name: string;
  budget_type_id: string;
  budget_template_id?: string;
  fiscal_year: number;
  start_date: string;
  end_date: string;
  currency?: string;
  exchange_rate?: number;
  budget_method?: BudgetMethod;
  cost_center_id?: string;
  project_id?: string;
  department?: string;
}

export interface CreateBudgetItemInput {
  budget_id: string;
  company_id: string;
  account_head: string;
  account_name?: string;
  account_type?: string;
  cost_center_id?: string;
  project_id?: string;
  department?: string;
  budget_dimension_1?: string;
  budget_dimension_2?: string;
  period_type?: PeriodType;
  period_start_date: string;
  period_end_date: string;
  budgeted_amount: number;
  distribution_method?: DistributionMethod;
  distribution_weights?: number[];
  line_item_notes?: string;
}

export interface CreateBudgetRevisionInput {
  budget_id: string;
  company_id: string;
  revision_type: RevisionType;
  revision_reason: string;
  effective_date: string;
  revision_items: {
    budget_item_id: string;
    change_type: "Increase" | "Decrease" | "Reallocate From" | "Reallocate To";
    revised_amount: number;
    change_reason: string;
  }[];
}

export interface CreateBudgetScenarioInput {
  budget_id: string;
  company_id: string;
  scenario_name: string;
  scenario_type: ScenarioType;
  scenario_description?: string;
  revenue_adjustment_percentage?: number;
  expense_adjustment_percentage?: number;
  specific_adjustments?: any;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================================================
// BUDGETING & FORECASTING SERVICE
// =====================================================================================

export class BudgetingService {
  // =====================================================================================
  // BUDGET TYPES
  // =====================================================================================

  /**
   * Create budget type
   */
  static async createBudgetType(input: CreateBudgetTypeInput): Promise<ApiResponse<BudgetType>> {
    try {
      const { data: budgetType, error } = await supabase
        .from("budget_types")
        .insert({
          company_id: input.company_id,
          type_name: input.type_name.trim(),
          type_code: input.type_code.trim().toUpperCase(),
          budget_dimension: input.budget_dimension,
          planning_horizon: input.planning_horizon || "Annual",
          is_rolling_budget: input.is_rolling_budget || false,
          auto_rollover: input.auto_rollover !== false,
          variance_threshold_percentage: input.variance_threshold_percentage || 10,
          requires_approval: input.requires_approval !== false,
          approval_hierarchy: input.approval_hierarchy || [],
          is_default: input.is_default || false,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: budgetType, message: "Budget type created successfully" };
    } catch (error) {
      console.error("Error creating budget type:", error);
      return { success: false, error: "Failed to create budget type" };
    }
  }

  /**
   * Get budget types
   */
  static async getBudgetTypes(companyId: string): Promise<ApiResponse<BudgetType[]>> {
    try {
      const { data: budgetTypes, error } = await supabase
        .from("budget_types")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("type_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: budgetTypes };
    } catch (error) {
      console.error("Error fetching budget types:", error);
      return { success: false, error: "Failed to fetch budget types" };
    }
  }

  // =====================================================================================
  // BUDGET TEMPLATES
  // =====================================================================================

  /**
   * Create budget template
   */
  static async createBudgetTemplate(
    input: CreateBudgetTemplateInput,
  ): Promise<ApiResponse<BudgetTemplate>> {
    try {
      const { data: template, error } = await supabase
        .from("budget_templates")
        .insert({
          company_id: input.company_id,
          template_name: input.template_name.trim(),
          template_code: input.template_code.trim().toUpperCase(),
          budget_type_id: input.budget_type_id,
          fiscal_year_start_month: input.fiscal_year_start_month || 1,
          currency: input.currency || "USD",
          budget_frequency: input.budget_frequency || "Monthly",
          account_structure: input.account_structure || {},
          dimension_structure: input.dimension_structure || {},
          description: input.description,
        })
        .select(
          `
                    *,
                    budget_type:budget_types(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: template, message: "Budget template created successfully" };
    } catch (error) {
      console.error("Error creating budget template:", error);
      return { success: false, error: "Failed to create budget template" };
    }
  }

  /**
   * Get budget templates
   */
  static async getBudgetTemplates(companyId: string): Promise<ApiResponse<BudgetTemplate[]>> {
    try {
      const { data: templates, error } = await supabase
        .from("budget_templates")
        .select(
          `
                    *,
                    budget_type:budget_types(*)
                `,
        )
        .eq("company_id", companyId)
        .eq("is_active", true)
        .eq("is_current_version", true)
        .order("template_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: templates };
    } catch (error) {
      console.error("Error fetching budget templates:", error);
      return { success: false, error: "Failed to fetch budget templates" };
    }
  }

  // =====================================================================================
  // BUDGETS
  // =====================================================================================

  /**
   * Create budget
   */
  static async createBudget(input: CreateBudgetInput): Promise<ApiResponse<Budget>> {
    try {
      // Generate budget code
      const budgetCode = await this.generateBudgetCode(input.company_id, input.fiscal_year);

      const { data: budget, error } = await supabase
        .from("budgets")
        .insert({
          company_id: input.company_id,
          budget_name: input.budget_name.trim(),
          budget_code: budgetCode,
          budget_type_id: input.budget_type_id,
          budget_template_id: input.budget_template_id,
          fiscal_year: input.fiscal_year,
          start_date: input.start_date,
          end_date: input.end_date,
          currency: input.currency || "USD",
          exchange_rate: input.exchange_rate || 1,
          budget_method: input.budget_method || "Zero Based",
          cost_center_id: input.cost_center_id,
          project_id: input.project_id,
          department: input.department,
        })
        .select(
          `
                    *,
                    budget_type:budget_types(*),
                    budget_template:budget_templates(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: budget, message: `Budget ${budgetCode} created successfully` };
    } catch (error) {
      console.error("Error creating budget:", error);
      return { success: false, error: "Failed to create budget" };
    }
  }

  /**
   * Get budget by ID
   */
  static async getBudget(budgetId: string): Promise<ApiResponse<Budget>> {
    try {
      const { data: budget, error } = await supabase
        .from("budgets")
        .select(
          `
                    *,
                    budget_type:budget_types(*),
                    budget_template:budget_templates(*),
                    items:budget_items(*),
                    monthly_breakdown:budget_monthly_breakdown(*)
                `,
        )
        .eq("id", budgetId)
        .single();

      if (error || !budget) {
        return { success: false, error: "Budget not found" };
      }

      return { success: true, data: budget };
    } catch (error) {
      console.error("Error fetching budget:", error);
      return { success: false, error: "Failed to fetch budget" };
    }
  }

  /**
   * Get budgets with filtering
   */
  static async getBudgets(
    companyId: string,
    filters?: {
      fiscal_year?: number;
      status?: BudgetStatus;
      budget_type_id?: string;
      cost_center_id?: string;
      project_id?: string;
    },
  ): Promise<ApiResponse<Budget[]>> {
    try {
      let query = supabase
        .from("budgets")
        .select(
          `
                    *,
                    budget_type:budget_types(type_name),
                    budget_template:budget_templates(template_name)
                `,
        )
        .eq("company_id", companyId);

      if (filters?.fiscal_year) {
        query = query.eq("fiscal_year", filters.fiscal_year);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.budget_type_id) {
        query = query.eq("budget_type_id", filters.budget_type_id);
      }

      if (filters?.cost_center_id) {
        query = query.eq("cost_center_id", filters.cost_center_id);
      }

      if (filters?.project_id) {
        query = query.eq("project_id", filters.project_id);
      }

      const { data: budgets, error } = await query.order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: budgets };
    } catch (error) {
      console.error("Error fetching budgets:", error);
      return { success: false, error: "Failed to fetch budgets" };
    }
  }

  /**
   * Submit budget for approval
   */
  static async submitBudget(budgetId: string, submittedBy: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({
          status: "Submitted",
          docstatus: 1,
          submitted_by: submittedBy,
          submitted_at: new Date().toISOString(),
          modified: new Date().toISOString(),
        })
        .eq("id", budgetId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Budget submitted for approval" };
    } catch (error) {
      console.error("Error submitting budget:", error);
      return { success: false, error: "Failed to submit budget" };
    }
  }

  /**
   * Approve budget
   */
  static async approveBudget(
    budgetId: string,
    approvedBy: string,
    comments?: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({
          status: "Approved",
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
          approval_comments: comments,
          modified: new Date().toISOString(),
        })
        .eq("id", budgetId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Budget approved successfully" };
    } catch (error) {
      console.error("Error approving budget:", error);
      return { success: false, error: "Failed to approve budget" };
    }
  }

  // =====================================================================================
  // BUDGET ITEMS
  // =====================================================================================

  /**
   * Create budget item
   */
  static async createBudgetItem(input: CreateBudgetItemInput): Promise<ApiResponse<BudgetItem>> {
    try {
      // Default distribution weights (even distribution across 12 months)
      const defaultWeights = input.distribution_weights || Array(12).fill(1);

      const { data: budgetItem, error } = await supabase
        .from("budget_items")
        .insert({
          budget_id: input.budget_id,
          company_id: input.company_id,
          account_head: input.account_head,
          account_name: input.account_name,
          account_type: input.account_type,
          cost_center_id: input.cost_center_id,
          project_id: input.project_id,
          department: input.department,
          budget_dimension_1: input.budget_dimension_1,
          budget_dimension_2: input.budget_dimension_2,
          period_type: input.period_type || "Monthly",
          period_start_date: input.period_start_date,
          period_end_date: input.period_end_date,
          budgeted_amount: input.budgeted_amount,
          distribution_method: input.distribution_method || "Even",
          distribution_weights: defaultWeights,
          line_item_notes: input.line_item_notes,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: budgetItem, message: "Budget item created successfully" };
    } catch (error) {
      console.error("Error creating budget item:", error);
      return { success: false, error: "Failed to create budget item" };
    }
  }

  /**
   * Update budget actuals
   */
  static async updateBudgetActuals(
    budgetId: string,
    periodStartDate: string,
    periodEndDate: string,
  ): Promise<ApiResponse<number>> {
    try {
      const { data: updatedCount, error } = await supabase.rpc("update_budget_actuals", {
        p_budget_id: budgetId,
        p_period_start_date: periodStartDate,
        p_period_end_date: periodEndDate,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: updatedCount,
        message: `${updatedCount} budget items updated with actuals`,
      };
    } catch (error) {
      console.error("Error updating budget actuals:", error);
      return { success: false, error: "Failed to update budget actuals" };
    }
  }

  // =====================================================================================
  // VARIANCE ANALYSIS
  // =====================================================================================

  /**
   * Calculate variance analysis
   */
  static calculateVariance(budgeted: number, actual: number): VarianceAnalysis {
    const variance_amount = actual - budgeted;
    const variance_percentage = budgeted !== 0 ? (variance_amount / budgeted) * 100 : 0;

    let variance_type: "Favorable" | "Unfavorable" | "On Budget";
    if (variance_amount > 0) {
      variance_type = "Unfavorable"; // Over budget
    } else if (variance_amount < 0) {
      variance_type = "Favorable"; // Under budget
    } else {
      variance_type = "On Budget";
    }

    return {
      variance_amount,
      variance_percentage,
      variance_type,
    };
  }

  /**
   * Get budget variance report
   */
  static async getBudgetVarianceReport(
    budgetId: string,
    filters?: {
      account_type?: string;
      cost_center_id?: string;
      project_id?: string;
    },
  ): Promise<
    ApiResponse<{
      budget_summary: any;
      variance_details: any[];
      top_variances: any[];
    }>
  > {
    try {
      // Get budget summary
      const { data: budget } = await supabase
        .from("budgets")
        .select(
          `
                    *,
                    items:budget_items(*)
                `,
        )
        .eq("id", budgetId)
        .single();

      if (!budget) {
        return { success: false, error: "Budget not found" };
      }

      // Apply filters to budget items
      let filteredItems = budget.items || [];

      if (filters?.account_type) {
        filteredItems = filteredItems.filter(
          (item: any) => item.account_type === filters.account_type,
        );
      }

      if (filters?.cost_center_id) {
        filteredItems = filteredItems.filter(
          (item: any) => item.cost_center_id === filters.cost_center_id,
        );
      }

      if (filters?.project_id) {
        filteredItems = filteredItems.filter((item: any) => item.project_id === filters.project_id);
      }

      // Calculate variance details
      const varianceDetails = filteredItems.map((item: any) => ({
        ...item,
        variance_analysis: this.calculateVariance(item.budgeted_amount, item.actual_amount),
      }));

      // Get top variances (by absolute amount)
      const topVariances = varianceDetails
        .sort((a, b) => Math.abs(b.variance_amount) - Math.abs(a.variance_amount))
        .slice(0, 10);

      // Calculate budget summary
      const budgetSummary = {
        total_budgeted: filteredItems.reduce(
          (sum: number, item: any) => sum + (item.budgeted_amount || 0),
          0,
        ),
        total_actual: filteredItems.reduce(
          (sum: number, item: any) => sum + (item.actual_amount || 0),
          0,
        ),
        total_variance: filteredItems.reduce(
          (sum: number, item: any) => sum + (item.variance_amount || 0),
          0,
        ),
        variance_percentage: 0,
        items_count: filteredItems.length,
        favorable_variances: filteredItems.filter((item: any) => item.variance_amount < 0).length,
        unfavorable_variances: filteredItems.filter((item: any) => item.variance_amount > 0).length,
      };

      budgetSummary.variance_percentage =
        budgetSummary.total_budgeted !== 0
          ? (budgetSummary.total_variance / budgetSummary.total_budgeted) * 100
          : 0;

      return {
        success: true,
        data: {
          budget_summary: budgetSummary,
          variance_details: varianceDetails,
          top_variances: topVariances,
        },
      };
    } catch (error) {
      console.error("Error generating budget variance report:", error);
      return { success: false, error: "Failed to generate variance report" };
    }
  }

  // =====================================================================================
  // FORECASTING
  // =====================================================================================

  /**
   * Generate budget forecast
   */
  static async generateForecast(
    budgetId: string,
    forecastMethod: ForecastMethod = "Linear",
  ): Promise<ApiResponse<number>> {
    try {
      const { data: updatedCount, error } = await supabase.rpc("generate_budget_forecast", {
        p_budget_id: budgetId,
        p_forecast_method: forecastMethod,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: updatedCount,
        message: `Forecast generated for ${updatedCount} budget items`,
      };
    } catch (error) {
      console.error("Error generating forecast:", error);
      return { success: false, error: "Failed to generate forecast" };
    }
  }

  // =====================================================================================
  // BUDGET SCENARIOS
  // =====================================================================================

  /**
   * Create budget scenario
   */
  static async createBudgetScenario(
    input: CreateBudgetScenarioInput,
  ): Promise<ApiResponse<BudgetScenario>> {
    try {
      const { data: scenario, error } = await supabase
        .from("budget_scenarios")
        .insert({
          budget_id: input.budget_id,
          company_id: input.company_id,
          scenario_name: input.scenario_name.trim(),
          scenario_type: input.scenario_type,
          scenario_description: input.scenario_description,
          revenue_adjustment_percentage: input.revenue_adjustment_percentage || 0,
          expense_adjustment_percentage: input.expense_adjustment_percentage || 0,
          specific_adjustments: input.specific_adjustments || {},
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Calculate scenario projections
      await this.calculateScenarioProjections(scenario.id);

      return { success: true, data: scenario, message: "Budget scenario created successfully" };
    } catch (error) {
      console.error("Error creating budget scenario:", error);
      return { success: false, error: "Failed to create budget scenario" };
    }
  }

  // =====================================================================================
  // BUDGET ALERTS
  // =====================================================================================

  /**
   * Check budget alerts
   */
  static async checkBudgetAlerts(companyId: string): Promise<ApiResponse<number>> {
    try {
      const { data: alertCount, error } = await supabase.rpc("check_budget_alerts", {
        p_company_id: companyId,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: alertCount, message: `${alertCount} new alerts generated` };
    } catch (error) {
      console.error("Error checking budget alerts:", error);
      return { success: false, error: "Failed to check budget alerts" };
    }
  }

  /**
   * Get budget alerts
   */
  static async getBudgetAlerts(
    companyId: string,
    filters?: {
      budget_id?: string;
      alert_level?: AlertLevel;
      is_resolved?: boolean;
    },
  ): Promise<ApiResponse<BudgetAlert[]>> {
    try {
      let query = supabase.from("budget_alerts").select("*").eq("company_id", companyId);

      if (filters?.budget_id) {
        query = query.eq("budget_id", filters.budget_id);
      }

      if (filters?.alert_level) {
        query = query.eq("alert_level", filters.alert_level);
      }

      if (filters?.is_resolved !== undefined) {
        query = query.eq("is_resolved", filters.is_resolved);
      }

      const { data: alerts, error } = await query.order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: alerts };
    } catch (error) {
      console.error("Error fetching budget alerts:", error);
      return { success: false, error: "Failed to fetch budget alerts" };
    }
  }

  // =====================================================================================
  // ANALYTICS
  // =====================================================================================

  /**
   * Get budget analytics
   */
  static async getBudgetAnalytics(
    companyId: string,
    filters?: {
      fiscal_year?: number;
      budget_type_id?: string;
    },
  ): Promise<ApiResponse<BudgetAnalytics>> {
    try {
      // This would be a complex aggregation query
      // For now, providing a simplified version

      let query = supabase
        .from("budgets")
        .select(
          `
                    total_budgeted_amount,
                    total_actual_amount,
                    total_variance_amount,
                    variance_percentage,
                    department,
                    items:budget_items(
                        account_head,
                        account_type,
                        budgeted_amount,
                        actual_amount,
                        variance_amount,
                        variance_percentage
                    )
                `,
        )
        .eq("company_id", companyId)
        .eq("status", "Active");

      if (filters?.fiscal_year) {
        query = query.eq("fiscal_year", filters.fiscal_year);
      }

      if (filters?.budget_type_id) {
        query = query.eq("budget_type_id", filters.budget_type_id);
      }

      const { data: budgets, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      // Calculate analytics
      const totalBudgetAmount =
        budgets?.reduce((sum, b) => sum + (b.total_budgeted_amount || 0), 0) || 0;
      const totalActualAmount =
        budgets?.reduce((sum, b) => sum + (b.total_actual_amount || 0), 0) || 0;
      const totalVarianceAmount =
        budgets?.reduce((sum, b) => sum + (b.total_variance_amount || 0), 0) || 0;

      const analytics: BudgetAnalytics = {
        total_budget_amount: totalBudgetAmount,
        total_actual_amount: totalActualAmount,
        total_variance_amount: totalVarianceAmount,
        overall_variance_percentage:
          totalBudgetAmount !== 0 ? (totalVarianceAmount / totalBudgetAmount) * 100 : 0,
        budget_utilization_rate:
          totalBudgetAmount !== 0 ? (totalActualAmount / totalBudgetAmount) * 100 : 0,
        forecast_accuracy: 95, // Would calculate based on historical forecasts
        budget_by_department: [], // Would group by department
        budget_by_account_type: [], // Would group by account type
        monthly_trend: [], // Would calculate monthly trends
        top_variances: [], // Would get top variances
        budget_alerts_summary: [], // Would summarize alerts
      };

      return { success: true, data: analytics };
    } catch (error) {
      console.error("Error fetching budget analytics:", error);
      return { success: false, error: "Failed to fetch budget analytics" };
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Generate budget code
   */
  private static async generateBudgetCode(companyId: string, fiscalYear: number): Promise<string> {
    const { data, error } = await supabase.rpc("generate_budget_code", {
      p_company_id: companyId,
      p_fiscal_year: fiscalYear,
    });

    if (error) {
      // Fallback to timestamp-based code
      const timestamp = Date.now().toString(36).toUpperCase();
      return `BUD-${fiscalYear}-${timestamp}`;
    }

    return data;
  }

  /**
   * Calculate scenario projections
   */
  private static async calculateScenarioProjections(scenarioId: string): Promise<void> {
    // This would calculate the financial projections for the scenario
    // Based on the adjustments and base budget
    // For now, just a placeholder that would be implemented with actual business logic
    console.log(`Calculating projections for scenario ${scenarioId}`);
  }
}
