/**
 * Treasury Management Service - Advanced Cash Flow Forecasting & Working Capital Analysis
 * Closes Critical CFO Gap #1 - Strategic Financial Management
 *
 * Features:
 * - Real-time cash position monitoring
 * - Predictive cash flow forecasting with multiple scenarios
 * - Working capital analysis and optimization
 * - Liquidity risk management with automated alerts
 * - Treasury KPI dashboard with trend analysis
 * - Cash conversion cycle optimization
 */
// @ts-nocheck


import { supabase } from "./supabase";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type CashFlowType = "Operating" | "Investing" | "Financing";
export type ScenarioType = "Best Case" | "Base" | "Worst Case" | "Monte Carlo" | "Sensitivity";
export type ForecastRuleType =
  | "Fixed Amount"
  | "Percentage of Revenue"
  | "Historical Average"
  | "Seasonal Pattern"
  | "Linear Regression"
  | "Custom Formula";
export type AlertType =
  | "Cash Balance"
  | "Working Capital"
  | "DSO Threshold"
  | "Liquidity Risk"
  | "Covenant Breach"
  | "Forecast Variance"
  | "Custom KPI";
export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

export interface CashFlowCategory {
  id: string;
  company_id: string;
  category_name: string;
  category_type: CashFlowType;
  is_inflow: boolean;
  is_recurring: boolean;
  seasonality_pattern: Record<string, number>;
  growth_rate: number;
  volatility_factor: number;
  default_account_id?: string;
  account_mapping: string[];
  is_active: boolean;
  created_at: string;
  modified: string;
}

export interface CashFlowForecastRule {
  id: string;
  company_id: string;
  rule_name: string;
  rule_type: ForecastRuleType;
  category_id: string;
  forecast_period: string;
  rule_parameters: Record<string, any>;
  accuracy_score?: number;
  last_accuracy_update?: string;
  min_amount?: number;
  max_amount?: number;
  is_active: boolean;
  effective_from: string;
  effective_to?: string;
  created_at: string;
  created_by?: string;
}

export interface CashPositionSnapshot {
  id: string;
  company_id: string;
  snapshot_date: string;
  snapshot_type: string;
  total_cash_and_equivalents: number;
  bank_balances: number;
  petty_cash: number;
  short_term_investments: number;
  accounts_receivable: number;
  inventory_value: number;
  prepaid_expenses: number;
  accounts_payable: number;
  accrued_liabilities: number;
  short_term_debt: number;
  gross_working_capital: number;
  net_working_capital: number;
  current_ratio?: number;
  quick_ratio?: number;
  days_sales_outstanding?: number;
  days_inventory_outstanding?: number;
  days_payable_outstanding?: number;
  cash_conversion_cycle?: number;
  confidence_level: number;
  created_at: string;
}

export interface CashFlowActual {
  id: string;
  company_id: string;
  flow_date: string;
  category_id: string;
  description: string;
  amount: number;
  currency: string;
  exchange_rate: number;
  amount_in_company_currency: number;
  source_document_type?: string;
  source_document_id?: string;
  gl_entry_id?: string;
  account_id?: string;
  is_recurring: boolean;
  recurrence_pattern?: string;
  tags: string[];
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  created_at: string;
  created_by?: string;
}

export interface CashFlowForecast {
  id: string;
  company_id: string;
  forecast_date: string;
  forecast_period_start: string;
  forecast_period_end: string;
  category_id: string;
  forecasted_amount: number;
  currency: string;
  confidence_level: number;
  scenario_type: ScenarioType;
  probability: number;
  forecast_rule_id?: string;
  forecast_method: string;
  method_parameters: Record<string, any>;
  actual_amount?: number;
  variance_amount?: number;
  variance_percentage?: number;
  model_accuracy?: number;
  model_version: string;
  is_active: boolean;
  superseded_by?: string;
  created_at: string;
  created_by?: string;
}

export interface TreasuryAlert {
  id: string;
  company_id: string;
  alert_name: string;
  alert_type: AlertType;
  alert_condition: Record<string, any>;
  severity_level: SeverityLevel;
  notification_channels: string[];
  recipients: string[];
  check_frequency: string;
  cooldown_period_hours: number;
  last_triggered_at?: string;
  trigger_count: number;
  last_resolved_at?: string;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export interface TreasuryKPI {
  id: string;
  company_id: string;
  kpi_date: string;
  kpi_period: string;
  total_cash_balance: number;
  available_cash: number;
  cash_burn_rate: number;
  runway_months?: number;
  net_working_capital: number;
  working_capital_ratio?: number;
  days_sales_outstanding?: number;
  days_inventory_outstanding?: number;
  days_payable_outstanding?: number;
  cash_conversion_cycle?: number;
  current_ratio?: number;
  quick_ratio?: number;
  operating_cash_ratio?: number;
  operating_cash_flow: number;
  free_cash_flow: number;
  cash_flow_margin?: number;
  cash_return_on_assets?: number;
  forecast_accuracy_percentage?: number;
  forecast_bias_percentage?: number;
  concentration_risk_score?: number;
  counterparty_risk_score?: number;
  liquidity_risk_score?: number;
  cash_management_efficiency?: number;
  treasury_cost_ratio?: number;
  industry_percentile?: number;
  peer_comparison_score?: number;
  calculation_timestamp: string;
  data_completeness: number;
  calculation_method: string;
  created_at: string;
}

export interface TreasuryDashboard {
  current_cash_position: CashPositionSnapshot;
  treasury_kpis: TreasuryKPI;
  cash_flow_forecast_30_days: number;
  cash_flow_forecast_90_days: number;
  working_capital_trend: Array<{ date: string; value: number }>;
  liquidity_alerts: TreasuryAlert[];
  top_cash_inflows: Array<{ category: string; amount: number; percentage: number }>;
  top_cash_outflows: Array<{ category: string; amount: number; percentage: number }>;
  forecast_accuracy: number;
  risk_indicators: {
    liquidity_risk: SeverityLevel;
    concentration_risk: SeverityLevel;
    forecast_risk: SeverityLevel;
  };
}

export interface CashFlowScenarioAnalysis {
  scenario_type: ScenarioType;
  net_cash_flow_30_days: number;
  net_cash_flow_90_days: number;
  net_cash_flow_12_months: number;
  minimum_cash_balance: number;
  maximum_cash_balance: number;
  cash_shortfall_risk: number;
  recommended_actions: string[];
}

// =====================================================================================
// MAIN SERVICE CLASS
// =====================================================================================

export class TreasuryManagementService {
  /**
   * Get comprehensive treasury dashboard for CFO-level insights
   */
  static async getTreasuryDashboard(companyId: string): Promise<{
    success: boolean;
    data?: TreasuryDashboard;
    error?: string;
  }> {
    try {
      // Get current cash position
      const { data: cashPosition, error: cashError } = await supabase
        .from("cash_position_snapshots")
        .select("*")
        .eq("company_id", companyId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single();

      if (cashError && cashError.code !== "PGRST116") {
        throw new Error(`Failed to fetch cash position: ${cashError.message}`);
      }

      // Get latest treasury KPIs
      const { data: treasuryKPIs, error: kpiError } = await supabase
        .from("treasury_kpis")
        .select("*")
        .eq("company_id", companyId)
        .order("kpi_date", { ascending: false })
        .limit(1)
        .single();

      if (kpiError && kpiError.code !== "PGRST116") {
        throw new Error(`Failed to fetch treasury KPIs: ${kpiError.message}`);
      }

      // Get cash flow forecasts
      const { data: forecasts, error: forecastError } = await supabase.rpc(
        "generate_cash_flow_forecast",
        {
          p_company_id: companyId,
          p_forecast_months: 3,
          p_scenario_type: "Base",
        },
      );

      if (forecastError) {
        console.error("Forecast generation error:", forecastError);
      }

      // Calculate 30-day and 90-day forecast totals
      const forecast30Days =
        forecasts?.reduce((sum: number, f: any) => {
          const forecastDate = new Date(f.forecast_date);
          const today = new Date();
          const diffDays = (forecastDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays <= 30 ? sum + (f.forecasted_amount || 0) : sum;
        }, 0) || 0;

      const forecast90Days =
        forecasts?.reduce((sum: number, f: any) => sum + (f.forecasted_amount || 0), 0) || 0;

      // Get working capital trend (last 12 months)
      const { data: workingCapitalTrend, error: trendError } = await supabase
        .from("treasury_kpis")
        .select("kpi_date, net_working_capital")
        .eq("company_id", companyId)
        .gte(
          "kpi_date",
          new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        )
        .order("kpi_date", { ascending: true });

      if (trendError) {
        console.error("Working capital trend error:", trendError);
      }

      // Get active liquidity alerts
      const { data: alerts, error: alertError } = await supabase
        .from("treasury_alerts")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("severity_level", { ascending: false });

      if (alertError) {
        console.error("Treasury alerts error:", alertError);
      }

      // Get top cash flows (last 30 days)
      const { data: cashFlows, error: flowError } = await supabase
        .from("cash_flow_actual")
        .select(
          `
                    *,
                    category:cash_flow_categories(category_name, category_type, is_inflow)
                `,
        )
        .eq("company_id", companyId)
        .gte(
          "flow_date",
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        )
        .order("amount_in_company_currency", { ascending: false });

      if (flowError) {
        console.error("Cash flows error:", flowError);
      }

      // Process cash flows by category
      const inflowsByCategory = new Map<string, number>();
      const outflowsByCategory = new Map<string, number>();
      let totalInflows = 0;
      let totalOutflows = 0;

      cashFlows?.forEach((flow: any) => {
        const amount = Math.abs(flow.amount_in_company_currency);
        const categoryName = flow.category?.category_name || "Uncategorized";
        const isInflow = flow.category?.is_inflow || flow.amount_in_company_currency > 0;

        if (isInflow) {
          inflowsByCategory.set(categoryName, (inflowsByCategory.get(categoryName) || 0) + amount);
          totalInflows += amount;
        } else {
          outflowsByCategory.set(
            categoryName,
            (outflowsByCategory.get(categoryName) || 0) + amount,
          );
          totalOutflows += amount;
        }
      });

      // Convert to arrays with percentages
      const topInflows = Array.from(inflowsByCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalInflows > 0 ? (amount / totalInflows) * 100 : 0,
        }));

      const topOutflows = Array.from(outflowsByCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalOutflows > 0 ? (amount / totalOutflows) * 100 : 0,
        }));

      // Calculate risk indicators
      const liquidityRisk = this.calculateLiquidityRisk(cashPosition, treasuryKPIs);
      const concentrationRisk = this.calculateConcentrationRisk(cashPosition);
      const forecastRisk = this.calculateForecastRisk(forecasts || []);

      const dashboard: TreasuryDashboard = {
        current_cash_position: cashPosition || ({} as CashPositionSnapshot),
        treasury_kpis: treasuryKPIs || ({} as TreasuryKPI),
        cash_flow_forecast_30_days: forecast30Days,
        cash_flow_forecast_90_days: forecast90Days,
        working_capital_trend:
          workingCapitalTrend?.map((item: any) => ({
            date: item.kpi_date,
            value: item.net_working_capital,
          })) || [],
        liquidity_alerts: alerts || [],
        top_cash_inflows: topInflows,
        top_cash_outflows: topOutflows,
        forecast_accuracy: treasuryKPIs?.forecast_accuracy_percentage || 0,
        risk_indicators: {
          liquidity_risk: liquidityRisk,
          concentration_risk: concentrationRisk,
          forecast_risk: forecastRisk,
        },
      };

      return {
        success: true,
        data: dashboard,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Generate cash flow forecast with multiple scenarios
   */
  static async generateCashFlowForecast(
    companyId: string,
    forecastMonths: number = 12,
    scenarios: ScenarioType[] = ["Base", "Best Case", "Worst Case"],
  ): Promise<{
    success: boolean;
    data?: Record<ScenarioType, CashFlowForecast[]>;
    error?: string;
  }> {
    try {
      const scenarioResults: Record<string, CashFlowForecast[]> = {};

      for (const scenario of scenarios) {
        const { data, error } = await supabase.rpc("generate_cash_flow_forecast", {
          p_company_id: companyId,
          p_forecast_months: forecastMonths,
          p_scenario_type: scenario,
        });

        if (error) {
          throw new Error(`Failed to generate ${scenario} scenario: ${error.message}`);
        }

        scenarioResults[scenario] = data || [];
      }

      return {
        success: true,
        data: scenarioResults as Record<ScenarioType, CashFlowForecast[]>,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Analyze cash flow scenarios with risk assessment
   */
  static async analyzeCashFlowScenarios(
    companyId: string,
    forecastMonths: number = 12,
  ): Promise<{
    success: boolean;
    data?: CashFlowScenarioAnalysis[];
    error?: string;
  }> {
    try {
      const scenarios: ScenarioType[] = ["Best Case", "Base", "Worst Case"];
      const analyses: CashFlowScenarioAnalysis[] = [];

      // Get current cash position
      const { data: cashPosition } = await supabase
        .from("cash_position_snapshots")
        .select("total_cash_and_equivalents")
        .eq("company_id", companyId)
        .order("snapshot_date", { ascending: false })
        .limit(1)
        .single();

      const currentCash = cashPosition?.total_cash_and_equivalents || 0;

      for (const scenario of scenarios) {
        const { data: forecasts, error } = await supabase
          .from("cash_flow_forecasts")
          .select("*")
          .eq("company_id", companyId)
          .eq("scenario_type", scenario)
          .eq("is_active", true)
          .order("forecast_period_start", { ascending: true });

        if (error) {
          console.error(`Error fetching ${scenario} forecasts:`, error);
          continue;
        }

        if (!forecasts || forecasts.length === 0) continue;

        // Calculate cumulative cash flows
        let cumulativeCash = currentCash;
        let minBalance = currentCash;
        let maxBalance = currentCash;

        const forecast30Days = forecasts
          .filter(
            f =>
              new Date(f.forecast_period_start) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          )
          .reduce((sum, f) => sum + f.forecasted_amount, 0);

        const forecast90Days = forecasts
          .filter(
            f =>
              new Date(f.forecast_period_start) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          )
          .reduce((sum, f) => sum + f.forecasted_amount, 0);

        const forecast12Months = forecasts.reduce((sum, f) => sum + f.forecasted_amount, 0);

        // Calculate running balance for min/max
        forecasts.forEach(forecast => {
          cumulativeCash += forecast.forecasted_amount;
          minBalance = Math.min(minBalance, cumulativeCash);
          maxBalance = Math.max(maxBalance, cumulativeCash);
        });

        // Generate recommendations based on scenario
        const recommendations = this.generateScenarioRecommendations(
          scenario,
          minBalance,
          forecast30Days,
          forecast90Days,
        );

        analyses.push({
          scenario_type: scenario,
          net_cash_flow_30_days: forecast30Days,
          net_cash_flow_90_days: forecast90Days,
          net_cash_flow_12_months: forecast12Months,
          minimum_cash_balance: minBalance,
          maximum_cash_balance: maxBalance,
          cash_shortfall_risk: minBalance < 0 ? Math.abs(minBalance) / currentCash : 0,
          recommended_actions: recommendations,
        });
      }

      return {
        success: true,
        data: analyses,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update cash position snapshot
   */
  static async updateCashPositionSnapshot(
    companyId: string,
    snapshotDate: string = new Date().toISOString().split("T")[0],
    snapshotType: string = "Daily",
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("calculate_cash_position_snapshot", {
        p_company_id: companyId,
        p_snapshot_date: snapshotDate,
        p_snapshot_type: snapshotType,
      });

      if (error) {
        throw new Error(`Failed to update cash position snapshot: ${error.message}`);
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update treasury KPIs
   */
  static async updateTreasuryKPIs(
    companyId: string,
    kpiDate: string = new Date().toISOString().split("T")[0],
  ): Promise<{
    success: boolean;
    data?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("update_treasury_kpis", {
        p_company_id: companyId,
        p_kpi_date: kpiDate,
      });

      if (error) {
        throw new Error(`Failed to update treasury KPIs: ${error.message}`);
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create or update treasury alert
   */
  static async createTreasuryAlert(
    alert: Omit<TreasuryAlert, "id" | "trigger_count" | "created_at">,
  ): Promise<{
    success: boolean;
    data?: TreasuryAlert;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("treasury_alerts")
        .insert([alert])
        .select("*")
        .single();

      if (error) {
        throw new Error(`Failed to create treasury alert: ${error.message}`);
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get working capital analysis
   */
  static async getWorkingCapitalAnalysis(companyId: string): Promise<{
    success: boolean;
    data?: {
      current_working_capital: number;
      target_working_capital: number;
      optimization_opportunities: Array<{
        area: string;
        current_days: number;
        target_days: number;
        potential_savings: number;
        priority: string;
        recommendations: string[];
      }>;
      efficiency_score: number;
    };
    error?: string;
  }> {
    try {
      // Get latest treasury KPIs
      const { data: kpis, error: kpiError } = await supabase
        .from("treasury_kpis")
        .select("*")
        .eq("company_id", companyId)
        .order("kpi_date", { ascending: false })
        .limit(1)
        .single();

      if (kpiError) {
        throw new Error(`Failed to fetch treasury KPIs: ${kpiError.message}`);
      }

      // Calculate optimization opportunities
      const opportunities = [];

      // DSO optimization
      if (kpis.days_sales_outstanding > 30) {
        opportunities.push({
          area: "Days Sales Outstanding (DSO)",
          current_days: kpis.days_sales_outstanding,
          target_days: 30,
          potential_savings: this.calculateDSOSavings(
            kpis.days_sales_outstanding,
            30,
            kpis.total_cash_balance,
          ),
          priority: kpis.days_sales_outstanding > 60 ? "High" : "Medium",
          recommendations: [
            "Implement automated payment reminders",
            "Offer early payment discounts",
            "Tighten credit policies",
            "Improve invoice accuracy and delivery speed",
          ],
        });
      }

      // DIO optimization
      if (kpis.days_inventory_outstanding > 60) {
        opportunities.push({
          area: "Days Inventory Outstanding (DIO)",
          current_days: kpis.days_inventory_outstanding,
          target_days: 60,
          potential_savings: this.calculateDIOSavings(
            kpis.days_inventory_outstanding,
            60,
            kpis.net_working_capital,
          ),
          priority: kpis.days_inventory_outstanding > 90 ? "High" : "Medium",
          recommendations: [
            "Implement just-in-time inventory management",
            "Improve demand forecasting",
            "Negotiate vendor-managed inventory",
            "Optimize product mix and eliminate slow-moving items",
          ],
        });
      }

      // DPO optimization
      if (kpis.days_payable_outstanding < 45) {
        opportunities.push({
          area: "Days Payable Outstanding (DPO)",
          current_days: kpis.days_payable_outstanding,
          target_days: 45,
          potential_savings: this.calculateDPOSavings(
            kpis.days_payable_outstanding,
            45,
            kpis.net_working_capital,
          ),
          priority: "Medium",
          recommendations: [
            "Negotiate extended payment terms with suppliers",
            "Take advantage of supplier financing programs",
            "Optimize payment timing without damaging relationships",
            "Centralize procurement for better negotiating power",
          ],
        });
      }

      // Calculate efficiency score (0-100)
      const idealCCC = 30; // Ideal cash conversion cycle
      const efficiencyScore = Math.max(
        0,
        Math.min(100, 100 - (Math.abs(kpis.cash_conversion_cycle - idealCCC) / idealCCC) * 100),
      );

      return {
        success: true,
        data: {
          current_working_capital: kpis.net_working_capital,
          target_working_capital: kpis.net_working_capital * 0.85, // 15% reduction target
          optimization_opportunities: opportunities,
          efficiency_score: efficiencyScore,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // =====================================================================================
  // PRIVATE HELPER METHODS
  // =====================================================================================

  private static calculateLiquidityRisk(
    cashPosition: CashPositionSnapshot | null,
    kpis: TreasuryKPI | null,
  ): SeverityLevel {
    if (!cashPosition || !kpis) return "Medium";

    const currentRatio = cashPosition.current_ratio || 0;
    const quickRatio = cashPosition.quick_ratio || 0;
    const runwayMonths = kpis.runway_months || 0;

    if (currentRatio < 1.0 || quickRatio < 0.5 || runwayMonths < 3) return "Critical";
    if (currentRatio < 1.2 || quickRatio < 0.8 || runwayMonths < 6) return "High";
    if (currentRatio < 1.5 || quickRatio < 1.0 || runwayMonths < 12) return "Medium";
    return "Low";
  }

  private static calculateConcentrationRisk(
    cashPosition: CashPositionSnapshot | null,
  ): SeverityLevel {
    if (!cashPosition) return "Medium";

    // Simplified concentration risk based on single bank balance percentage
    const concentrationPercentage =
      cashPosition.total_cash_and_equivalents > 0
        ? cashPosition.bank_balances / cashPosition.total_cash_and_equivalents
        : 0;

    if (concentrationPercentage > 0.9) return "High";
    if (concentrationPercentage > 0.7) return "Medium";
    return "Low";
  }

  private static calculateForecastRisk(forecasts: any[]): SeverityLevel {
    if (forecasts.length === 0) return "High";

    const avgConfidence =
      forecasts.reduce((sum, f) => sum + (f.confidence_level || 0), 0) / forecasts.length;

    if (avgConfidence < 0.5) return "High";
    if (avgConfidence < 0.7) return "Medium";
    return "Low";
  }

  private static generateScenarioRecommendations(
    scenario: ScenarioType,
    minBalance: number,
    forecast30Days: number,
    forecast90Days: number,
  ): string[] {
    const recommendations: string[] = [];

    if (scenario === "Worst Case") {
      if (minBalance < 0) {
        recommendations.push("Establish credit line to cover potential cash shortfalls");
        recommendations.push("Accelerate collections and delay non-critical payments");
      }
      if (forecast30Days < 0) {
        recommendations.push("Implement cash conservation measures immediately");
        recommendations.push("Review and potentially delay capital expenditures");
      }
    } else if (scenario === "Best Case") {
      if (forecast30Days > 100000) {
        recommendations.push("Consider short-term investment opportunities for excess cash");
        recommendations.push("Evaluate accelerated growth investments");
      }
    } else {
      // Base case
      if (forecast90Days < 0) {
        recommendations.push("Monitor cash flow closely and prepare contingency plans");
        recommendations.push("Review pricing and cost structure optimization opportunities");
      }
    }

    return recommendations;
  }

  private static calculateDSOSavings(
    currentDSO: number,
    targetDSO: number,
    totalCash: number,
  ): number {
    const improvement = currentDSO - targetDSO;
    const dailySales = totalCash / 365; // Simplified calculation
    return improvement * dailySales;
  }

  private static calculateDIOSavings(
    currentDIO: number,
    targetDIO: number,
    workingCapital: number,
  ): number {
    const improvement = currentDIO - targetDIO;
    const dailyCOGS = workingCapital / 365; // Simplified calculation
    return improvement * dailyCOGS;
  }

  private static calculateDPOSavings(
    currentDPO: number,
    targetDPO: number,
    workingCapital: number,
  ): number {
    const improvement = targetDPO - currentDPO;
    const dailyPurchases = workingCapital / 365; // Simplified calculation
    return improvement * dailyPurchases;
  }
}
