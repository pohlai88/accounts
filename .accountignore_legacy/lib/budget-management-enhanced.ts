/**
 * Enhanced Budget Management Service - ERPNext Level
 * Comprehensive budget planning, tracking, validation, and control
 */

import { supabase } from "./supabase";

// Enhanced interfaces matching ERPNext budget structure
export interface ERPNextBudget {
  id: string;
  budgetName: string;
  companyId: string;
  fiscalYear: string;
  budgetAgainst: "Cost Center" | "Project" | "Account";
  fromDate: string;
  toDate: string;
  budgetType: "Expense" | "Income" | "Capital";

  // Control settings
  applicableOnMaterialRequest: boolean;
  applicableOnPurchaseOrder: boolean;
  applicableOnBookingActualExpenses: boolean;

  // Action settings
  actionIfAnnualBudgetExceeded: "Stop" | "Warn" | "Ignore";
  actionIfAccumulatedMonthlyBudgetExceeded: "Stop" | "Warn" | "Ignore";
  actionIfMonthlyBudgetExceeded: "Stop" | "Warn" | "Ignore";

  docstatus: 0 | 1 | 2; // Draft, Submitted, Cancelled
  createdAt: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface BudgetAccount {
  id: string;
  parent: string; // Budget ID
  accountId: string;
  budgetAmount: number;

  // Monthly distribution
  january: number;
  february: number;
  march: number;
  april: number;
  may: number;
  june: number;
  july: number;
  august: number;
  september: number;
  october: number;
  november: number;
  december: number;
}

export interface BudgetDimension {
  id: string;
  parent: string; // Budget ID
  dimensionType: "Cost Center" | "Project";
  dimensionId: string;
  allocationPercentage: number;
}

export interface BudgetValidationResult {
  isValid: boolean;
  actionRequired: "None" | "Stop" | "Warn" | "Ignore";
  message: string;
  budgetAmount: number;
  actualAmount: number;
  availableBudget: number;
  exceedsAnnualBudget: boolean;
  exceedsMonthlyBudget: boolean;
  variancePercentage: number;
}

export interface BudgetVarianceReport {
  budgetId: string;
  budgetName: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  variancePercentage: number;
  status: "Over Budget" | "On Budget" | "Under Budget";
  fromDate: string;
  toDate: string;
}

export interface BudgetSummary {
  budgetName: string;
  budgetType: string;
  totalBudget: number;
  totalActual: number;
  totalVariance: number;
  variancePercentage: number;
  status: string;
}

export class ERPNextBudgetManagementService {
  /**
   * Create a new budget
   */
  static async createBudget(budgetData: Omit<ERPNextBudget, "id" | "createdAt">): Promise<{
    success: boolean;
    budgetId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("budgets")
        .insert({
          budget_name: budgetData.budgetName,
          company_id: budgetData.companyId,
          fiscal_year: budgetData.fiscalYear,
          budget_against: budgetData.budgetAgainst,
          from_date: budgetData.fromDate,
          to_date: budgetData.toDate,
          budget_type: budgetData.budgetType,
          applicable_on_material_request: budgetData.applicableOnMaterialRequest,
          applicable_on_purchase_order: budgetData.applicableOnPurchaseOrder,
          applicable_on_booking_actual_expenses: budgetData.applicableOnBookingActualExpenses,
          action_if_annual_budget_exceeded: budgetData.actionIfAnnualBudgetExceeded,
          action_if_accumulated_monthly_budget_exceeded:
            budgetData.actionIfAccumulatedMonthlyBudgetExceeded,
          action_if_monthly_budget_exceeded: budgetData.actionIfMonthlyBudgetExceeded,
          docstatus: budgetData.docstatus,
          created_by: budgetData.createdBy,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, budgetId: data.id };
    } catch (error) {
      return { success: false, error: `Failed to create budget: ${error}` };
    }
  }

  /**
   * Add budget account line items
   */
  static async addBudgetAccounts(
    budgetId: string,
    accounts: Omit<BudgetAccount, "id" | "parent">[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const budgetAccounts = accounts.map(account => ({
        parent: budgetId,
        account_id: account.accountId,
        budget_amount: account.budgetAmount,
        january: account.january,
        february: account.february,
        march: account.march,
        april: account.april,
        may: account.may,
        june: account.june,
        july: account.july,
        august: account.august,
        september: account.september,
        october: account.october,
        november: account.november,
        december: account.december,
      }));

      const { error } = await supabase.from("budget_accounts").insert(budgetAccounts);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to add budget accounts: ${error}` };
    }
  }

  /**
   * Add budget dimensions (cost centers/projects)
   */
  static async addBudgetDimensions(
    budgetId: string,
    dimensions: Omit<BudgetDimension, "id" | "parent">[],
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const budgetDimensions = dimensions.map(dimension => ({
        parent: budgetId,
        dimension_type: dimension.dimensionType,
        dimension_id: dimension.dimensionId,
        allocation_percentage: dimension.allocationPercentage,
      }));

      const { error } = await supabase.from("budget_dimensions").insert(budgetDimensions);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to add budget dimensions: ${error}` };
    }
  }

  /**
   * Submit budget (change status from Draft to Submitted)
   */
  static async submitBudget(
    budgetId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Validate budget before submission
      const validation = await this.validateBudgetForSubmission(budgetId);
      if (!validation.isValid) {
        return { success: false, error: validation.errors.join(", ") };
      }

      const { error } = await supabase
        .from("budgets")
        .update({
          docstatus: 1,
          modified_at: new Date().toISOString(),
          modified_by: userId,
        })
        .eq("id", budgetId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to submit budget: ${error}` };
    }
  }

  /**
   * Cancel budget
   */
  static async cancelBudget(
    budgetId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const { error } = await supabase
        .from("budgets")
        .update({
          docstatus: 2,
          modified_at: new Date().toISOString(),
          modified_by: userId,
        })
        .eq("id", budgetId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to cancel budget: ${error}` };
    }
  }

  /**
   * Validate expense against budget
   */
  static async validateExpenseAgainstBudget(
    accountId: string,
    costCenterId: string | null,
    projectId: string | null,
    companyId: string,
    postingDate: string,
    expenseAmount: number,
  ): Promise<BudgetValidationResult> {
    try {
      const { data, error } = await supabase.rpc("validate_expense_against_budget", {
        p_account_id: accountId,
        p_cost_center_id: costCenterId,
        p_project_id: projectId,
        p_company_id: companyId,
        p_posting_date: postingDate,
        p_expense_amount: expenseAmount,
      });

      if (error) {
        return {
          isValid: false,
          actionRequired: "Stop",
          message: `Budget validation error: ${error.message}`,
          budgetAmount: 0,
          actualAmount: 0,
          availableBudget: 0,
          exceedsAnnualBudget: false,
          exceedsMonthlyBudget: false,
          variancePercentage: 0,
        };
      }

      const result = data[0];
      return {
        isValid: result.is_valid,
        actionRequired: result.action_required,
        message: result.message,
        budgetAmount: result.budget_amount,
        actualAmount: result.actual_amount,
        availableBudget: result.available_budget,
        exceedsAnnualBudget: result.actual_amount + expenseAmount > result.budget_amount,
        exceedsMonthlyBudget: false, // Would need additional logic
        variancePercentage:
          result.budget_amount > 0
            ? ((result.actual_amount + expenseAmount - result.budget_amount) /
                result.budget_amount) *
              100
            : 0,
      };
    } catch (error) {
      return {
        isValid: false,
        actionRequired: "Stop",
        message: `Budget validation failed: ${error}`,
        budgetAmount: 0,
        actualAmount: 0,
        availableBudget: 0,
        exceedsAnnualBudget: false,
        exceedsMonthlyBudget: false,
        variancePercentage: 0,
      };
    }
  }

  /**
   * Get budget variance report
   */
  static async getBudgetVarianceReport(
    companyId: string,
    fiscalYear?: string,
    budgetId?: string,
  ): Promise<{ success: boolean; data?: BudgetVarianceReport[]; error?: string }> {
    try {
      let query = supabase.from("v_budget_variance").select("*").eq("company_id", companyId);

      if (fiscalYear) {
        query = query.eq("fiscal_year", fiscalYear);
      }

      if (budgetId) {
        query = query.eq("budget_id", budgetId);
      }

      const { data, error } = await query.order("budget_name", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      const report: BudgetVarianceReport[] = data.map(item => ({
        budgetId: item.budget_id,
        budgetName: item.budget_name,
        accountId: item.account_id,
        accountName: item.account_name,
        accountCode: item.account_code,
        budgetAmount: item.budget_amount,
        actualAmount: item.actual_amount,
        variance: item.variance,
        variancePercentage: item.variance_percentage,
        status: item.status,
        fromDate: item.from_date,
        toDate: item.to_date,
      }));

      return { success: true, data: report };
    } catch (error) {
      return { success: false, error: `Failed to get budget variance report: ${error}` };
    }
  }

  /**
   * Get budget summary
   */
  static async getBudgetSummary(
    companyId: string,
    fiscalYear?: string,
  ): Promise<{ success: boolean; data?: BudgetSummary[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_budget_summary", {
        p_company_id: companyId,
        p_fiscal_year: fiscalYear,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: `Failed to get budget summary: ${error}` };
    }
  }

  /**
   * Get budgets for a company
   */
  static async getBudgets(
    companyId: string,
    fiscalYear?: string,
    docstatus?: number,
  ): Promise<{ success: boolean; data?: ERPNextBudget[]; error?: string }> {
    try {
      let query = supabase.from("budgets").select("*").eq("company_id", companyId);

      if (fiscalYear) {
        query = query.eq("fiscal_year", fiscalYear);
      }

      if (docstatus !== undefined) {
        query = query.eq("docstatus", docstatus);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const budgets: ERPNextBudget[] = data.map(item => ({
        id: item.id,
        budgetName: item.budget_name,
        companyId: item.company_id,
        fiscalYear: item.fiscal_year,
        budgetAgainst: item.budget_against,
        fromDate: item.from_date,
        toDate: item.to_date,
        budgetType: item.budget_type,
        applicableOnMaterialRequest: item.applicable_on_material_request,
        applicableOnPurchaseOrder: item.applicable_on_purchase_order,
        applicableOnBookingActualExpenses: item.applicable_on_booking_actual_expenses,
        actionIfAnnualBudgetExceeded: item.action_if_annual_budget_exceeded,
        actionIfAccumulatedMonthlyBudgetExceeded:
          item.action_if_accumulated_monthly_budget_exceeded,
        actionIfMonthlyBudgetExceeded: item.action_if_monthly_budget_exceeded,
        docstatus: item.docstatus,
        createdAt: item.created_at,
        createdBy: item.created_by,
        modifiedAt: item.modified_at,
        modifiedBy: item.modified_by,
      }));

      return { success: true, data: budgets };
    } catch (error) {
      return { success: false, error: `Failed to get budgets: ${error}` };
    }
  }

  /**
   * Get budget details with accounts and dimensions
   */
  static async getBudgetDetails(budgetId: string): Promise<{
    success: boolean;
    budget?: ERPNextBudget;
    accounts?: BudgetAccount[];
    dimensions?: BudgetDimension[];
    error?: string;
  }> {
    try {
      // Get budget
      const { data: budgetData, error: budgetError } = await supabase
        .from("budgets")
        .select("*")
        .eq("id", budgetId)
        .single();

      if (budgetError) {
        return { success: false, error: budgetError.message };
      }

      // Get budget accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("budget_accounts")
        .select("*")
        .eq("parent", budgetId);

      if (accountsError) {
        return { success: false, error: accountsError.message };
      }

      // Get budget dimensions
      const { data: dimensionsData, error: dimensionsError } = await supabase
        .from("budget_dimensions")
        .select("*")
        .eq("parent", budgetId);

      if (dimensionsError) {
        return { success: false, error: dimensionsError.message };
      }

      const budget: ERPNextBudget = {
        id: budgetData.id,
        budgetName: budgetData.budget_name,
        companyId: budgetData.company_id,
        fiscalYear: budgetData.fiscal_year,
        budgetAgainst: budgetData.budget_against,
        fromDate: budgetData.from_date,
        toDate: budgetData.to_date,
        budgetType: budgetData.budget_type,
        applicableOnMaterialRequest: budgetData.applicable_on_material_request,
        applicableOnPurchaseOrder: budgetData.applicable_on_purchase_order,
        applicableOnBookingActualExpenses: budgetData.applicable_on_booking_actual_expenses,
        actionIfAnnualBudgetExceeded: budgetData.action_if_annual_budget_exceeded,
        actionIfAccumulatedMonthlyBudgetExceeded:
          budgetData.action_if_accumulated_monthly_budget_exceeded,
        actionIfMonthlyBudgetExceeded: budgetData.action_if_monthly_budget_exceeded,
        docstatus: budgetData.docstatus,
        createdAt: budgetData.created_at,
        createdBy: budgetData.created_by,
        modifiedAt: budgetData.modified_at,
        modifiedBy: budgetData.modified_by,
      };

      const accounts: BudgetAccount[] = accountsData.map(item => ({
        id: item.id,
        parent: item.parent,
        accountId: item.account_id,
        budgetAmount: item.budget_amount,
        january: item.january,
        february: item.february,
        march: item.march,
        april: item.april,
        may: item.may,
        june: item.june,
        july: item.july,
        august: item.august,
        september: item.september,
        october: item.october,
        november: item.november,
        december: item.december,
      }));

      const dimensions: BudgetDimension[] = dimensionsData.map(item => ({
        id: item.id,
        parent: item.parent,
        dimensionType: item.dimension_type,
        dimensionId: item.dimension_id,
        allocationPercentage: item.allocation_percentage,
      }));

      return { success: true, budget, accounts, dimensions };
    } catch (error) {
      return { success: false, error: `Failed to get budget details: ${error}` };
    }
  }

  /**
   * Validate budget for submission
   */
  private static async validateBudgetForSubmission(budgetId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    try {
      // Check if budget has accounts
      const { data: accounts, error: accountsError } = await supabase
        .from("budget_accounts")
        .select("id")
        .eq("parent", budgetId);

      if (accountsError) {
        errors.push(`Error checking budget accounts: ${accountsError.message}`);
      } else if (!accounts || accounts.length === 0) {
        errors.push("Budget must have at least one account");
      }

      // Check if total budget amount is positive
      const { data: totalData, error: totalError } = await supabase
        .from("budget_accounts")
        .select("budget_amount")
        .eq("parent", budgetId);

      if (totalError) {
        errors.push(`Error calculating total budget: ${totalError.message}`);
      } else if (totalData) {
        const totalBudget = totalData.reduce((sum, item) => sum + item.budget_amount, 0);
        if (totalBudget <= 0) {
          errors.push("Total budget amount must be greater than zero");
        }
      }

      return { isValid: errors.length === 0, errors };
    } catch (error) {
      return { isValid: false, errors: [`Validation error: ${error}`] };
    }
  }

  /**
   * Update budget account
   */
  static async updateBudgetAccount(
    accountId: string,
    updates: Partial<Omit<BudgetAccount, "id" | "parent">>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};

      if (updates.budgetAmount !== undefined) updateData.budget_amount = updates.budgetAmount;
      if (updates.january !== undefined) updateData.january = updates.january;
      if (updates.february !== undefined) updateData.february = updates.february;
      if (updates.march !== undefined) updateData.march = updates.march;
      if (updates.april !== undefined) updateData.april = updates.april;
      if (updates.may !== undefined) updateData.may = updates.may;
      if (updates.june !== undefined) updateData.june = updates.june;
      if (updates.july !== undefined) updateData.july = updates.july;
      if (updates.august !== undefined) updateData.august = updates.august;
      if (updates.september !== undefined) updateData.september = updates.september;
      if (updates.october !== undefined) updateData.october = updates.october;
      if (updates.november !== undefined) updateData.november = updates.november;
      if (updates.december !== undefined) updateData.december = updates.december;

      const { error } = await supabase
        .from("budget_accounts")
        .update(updateData)
        .eq("id", accountId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to update budget account: ${error}` };
    }
  }

  /**
   * Delete budget account
   */
  static async deleteBudgetAccount(
    accountId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("budget_accounts").delete().eq("id", accountId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to delete budget account: ${error}` };
    }
  }
}

export default ERPNextBudgetManagementService;
