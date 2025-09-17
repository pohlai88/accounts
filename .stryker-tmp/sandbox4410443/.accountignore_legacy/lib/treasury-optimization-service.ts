/**
 * Treasury Optimization Service - Advanced Cash Management & Working Capital Analysis
 * Strategic Treasury Management, Liquidity Optimization & Investment Analysis
 *
 * Features:
 * - Working capital components analysis and optimization
 * - Advanced cash optimization strategies with automated execution
 * - Real-time liquidity position monitoring and risk assessment
 * - Investment opportunity analysis with AI-powered recommendations
 * - Treasury performance analytics and benchmarking
 * - Working capital optimization recommendations engine
 */
// @ts-nocheck


import { createClient } from "@/lib/supabase-client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface WorkingCapitalComponent {
  id: string;
  component_name: string;
  component_code: string;
  component_description?: string;
  component_category:
    | "Current Assets"
    | "Current Liabilities"
    | "Inventory"
    | "Receivables"
    | "Payables";
  liquidity_classification: "Highly Liquid" | "Moderately Liquid" | "Less Liquid" | "Illiquid";
  impact_on_cash_cycle: "Positive" | "Negative" | "Neutral";
  optimization_priority: "High" | "Medium" | "Low";
  target_days_outstanding?: number;
  minimum_balance_required?: number;
  maximum_balance_threshold?: number;
  cost_of_capital_rate?: number;
  opportunity_cost_rate?: number;
  auto_optimization_enabled: boolean;
  optimization_frequency: "daily" | "weekly" | "monthly";
  alert_threshold_percentage: number;
  current_balance: number;
  current_days_outstanding?: number;
  efficiency_score?: number;
  last_optimization_date?: string;
  last_balance_update?: string;
  component_status: "active" | "inactive" | "under_review";
  review_frequency: "daily" | "weekly" | "monthly" | "quarterly";
  last_reviewed_date?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CashOptimizationStrategy {
  id: string;
  strategy_name: string;
  strategy_code: string;
  strategy_description: string;
  strategy_type:
    | "Cash Concentration"
    | "Investment"
    | "Debt Management"
    | "Working Capital"
    | "Hedging";
  target_cash_balance: number;
  minimum_cash_buffer: number;
  maximum_cash_threshold?: number;
  optimization_objective: "Maximize Return" | "Minimize Risk" | "Balanced" | "Liquidity Focus";
  risk_tolerance: "Conservative" | "Moderate" | "Aggressive";
  expected_return_rate?: number;
  maximum_acceptable_risk?: number;
  liquidity_requirement_days: number;
  investment_horizon_days: number;
  maximum_single_investment?: number;
  diversification_requirements?: any;
  regulatory_constraints?: any;
  auto_execution_enabled: boolean;
  execution_threshold?: number;
  approval_required_above?: number;
  execution_time_preference?: string;
  total_optimized_amount: number;
  total_return_generated: number;
  number_of_executions: number;
  average_return_rate?: number;
  success_rate?: number;
  current_performance_score?: number;
  benchmark_comparison?: number;
  risk_adjusted_return?: number;
  maximum_drawdown?: number;
  strategy_status: "active" | "inactive" | "suspended" | "under_review";
  activation_date?: string;
  deactivation_date?: string;
  last_execution_date?: string;
  next_review_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LiquidityPosition {
  id: string;
  position_date: string;
  position_time: string;
  account_id?: string;
  account_name: string;
  account_type: "Operating" | "Savings" | "Investment" | "Credit Line";
  opening_balance: number;
  closing_balance: number;
  available_balance: number;
  committed_balance: number;
  days_cash_on_hand?: number;
  liquidity_ratio?: number;
  cash_conversion_cycle_days?: number;
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  forecasted_inflows_7d?: number;
  forecasted_outflows_7d?: number;
  forecasted_inflows_30d?: number;
  forecasted_outflows_30d?: number;
  liquidity_risk_score?: number;
  optimization_opportunity?: number;
  recommended_action?: string;
  market_conditions?: string;
  regulatory_capital_ratio?: number;
  credit_utilization_ratio?: number;
  data_completeness_score: number;
  data_source: string;
  last_validated_at?: string;
  validation_status: "pending" | "validated" | "flagged";
  created_at: string;
  updated_at: string;
}

export interface InvestmentOpportunity {
  id: string;
  opportunity_name: string;
  opportunity_code: string;
  investment_type:
    | "Money Market"
    | "Treasury Bills"
    | "CDs"
    | "Commercial Paper"
    | "Corporate Bonds";
  provider_name?: string;
  minimum_investment: number;
  maximum_investment?: number;
  investment_term_days: number;
  interest_rate: number;
  compounding_frequency: "daily" | "monthly" | "quarterly" | "annual";
  credit_rating?: string;
  risk_category: "Very Low" | "Low" | "Medium" | "High";
  default_probability?: number;
  liquidity_score?: number;
  expected_return_amount?: number;
  yield_to_maturity?: number;
  duration?: number;
  convexity?: number;
  current_market_price?: number;
  bid_ask_spread?: number;
  market_depth?: number;
  price_volatility?: number;
  available_from_date: string;
  available_until_date?: string;
  early_redemption_allowed: boolean;
  early_redemption_penalty?: number;
  regulatory_compliant: boolean;
  fdic_insured: boolean;
  tax_implications?: string;
  regulatory_capital_treatment?: string;
  historical_performance?: any;
  peer_comparison_rank?: number;
  performance_vs_benchmark?: number;
  ai_recommendation_score?: number;
  recommendation_reasons?: string[];
  risk_adjusted_score?: number;
  opportunity_status: "available" | "invested" | "matured" | "withdrawn" | "expired";
  last_updated_price?: string;
  last_analysis_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CashOptimizationExecution {
  id: string;
  execution_date: string;
  execution_time: string;
  strategy_id: string;
  execution_type: "Investment" | "Divestment" | "Transfer" | "Hedging";
  principal_amount: number;
  source_account?: string;
  destination_account?: string;
  investment_opportunity_id?: string;
  execution_method: "Automatic" | "Manual" | "Semi-automatic";
  trigger_condition?: string;
  approval_level?: string;
  approved_by?: string;
  interest_rate_achieved?: number;
  fees_paid: number;
  expected_return?: number;
  maturity_date?: string;
  actual_return?: number;
  return_vs_expectation?: number;
  opportunity_cost?: number;
  risk_adjusted_return?: number;
  market_interest_rates?: any;
  economic_indicators?: any;
  volatility_index?: number;
  execution_speed_seconds?: number;
  price_improvement?: number;
  market_impact?: number;
  execution_quality_score?: number;
  risk_metrics_at_execution?: any;
  hedge_ratio?: number;
  value_at_risk?: number;
  execution_status: "pending" | "executed" | "settled" | "failed" | "cancelled";
  settlement_date?: string;
  confirmation_number?: string;
  external_transaction_id?: string;
  compliance_checked: boolean;
  compliance_notes?: string;
  audit_trail?: any;
  created_at: string;
  updated_at: string;
  strategy?: CashOptimizationStrategy;
  investment_opportunity?: InvestmentOpportunity;
}

export interface WorkingCapitalRecommendation {
  id: string;
  recommendation_title: string;
  recommendation_code: string;
  recommendation_type:
    | "Receivables Optimization"
    | "Inventory Optimization"
    | "Payables Optimization"
    | "Cash Management";
  component_id?: string;
  impact_category: "Cash Flow" | "Working Capital" | "Cost Reduction" | "Risk Mitigation";
  estimated_impact_amount?: number;
  impact_timeframe: "Immediate" | "Short-term" | "Medium-term" | "Long-term";
  current_situation_analysis: string;
  recommended_actions: string[];
  implementation_steps: string[];
  success_metrics: string[];
  investment_required?: number;
  payback_period_months?: number;
  net_present_value?: number;
  internal_rate_of_return?: number;
  risk_assessment?: string;
  priority_score: number;
  urgency_level: "Low" | "Medium" | "High" | "Critical";
  strategic_importance: "Low" | "Medium" | "High" | "Strategic";
  resource_requirements?: string;
  implementation_complexity: "Low" | "Medium" | "High";
  estimated_implementation_time?: number;
  dependencies?: string[];
  primary_stakeholder?: string;
  affected_departments?: string[];
  approval_required_from?: string;
  business_sponsor?: string;
  recommendation_status: "draft" | "review" | "approved" | "rejected" | "implemented" | "monitored";
  created_date: string;
  review_date?: string;
  approval_date?: string;
  implementation_start_date?: string;
  implementation_completion_date?: string;
  actual_impact_amount?: number;
  actual_implementation_time?: number;
  implementation_success_rating?: number;
  lessons_learned?: string;
  ai_confidence_score?: number;
  data_quality_score?: number;
  similar_recommendations_count?: number;
  monitoring_required: boolean;
  monitoring_frequency?: string;
  next_review_date?: string;
  follow_up_recommendations?: string[];
  created_at: string;
  updated_at: string;
  component?: WorkingCapitalComponent;
}

export interface TreasuryPerformanceAnalytics {
  id: string;
  analysis_date: string;
  period_start_date: string;
  period_end_date: string;
  analysis_type: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annual";
  average_cash_balance: number;
  peak_cash_balance: number;
  minimum_cash_balance: number;
  cash_balance_volatility?: number;
  working_capital_amount: number;
  working_capital_ratio: number;
  quick_ratio?: number;
  current_ratio?: number;
  cash_conversion_cycle_days?: number;
  days_sales_outstanding?: number;
  days_inventory_outstanding?: number;
  days_payable_outstanding?: number;
  total_investments_made: number;
  total_investment_returns: number;
  weighted_average_return_rate?: number;
  investment_efficiency_ratio?: number;
  liquidity_coverage_ratio?: number;
  net_stable_funding_ratio?: number;
  cash_to_total_assets_ratio?: number;
  debt_to_cash_ratio?: number;
  treasury_cost_per_dollar?: number;
  processing_efficiency_score?: number;
  automation_rate?: number;
  error_rate?: number;
  concentration_risk_score?: number;
  credit_risk_exposure?: number;
  interest_rate_sensitivity?: number;
  foreign_exchange_exposure?: number;
  industry_benchmark_working_capital?: number;
  peer_comparison_ranking?: number;
  performance_vs_benchmark?: number;
  total_optimization_savings?: number;
  number_of_optimizations: number;
  optimization_success_rate?: number;
  forecasted_cash_position_30d?: number;
  forecasted_working_capital_change?: number;
  cash_flow_predictability_score?: number;
  policy_compliance_score?: number;
  regulatory_compliance_rating?: string;
  control_effectiveness_rating?: string;
  data_completeness_percentage: number;
  data_accuracy_score: number;
  analysis_confidence_level: number;
  market_conditions_impact?: number;
  economic_cycle_adjustment?: number;
  seasonal_adjustment_factor?: number;
  created_at: string;
  updated_at: string;
}

// Dashboard Summary Types
export interface TreasuryOptimizationDashboard {
  working_capital_components: WorkingCapitalComponent[];
  optimization_strategies: CashOptimizationStrategy[];
  current_liquidity_positions: LiquidityPosition[];
  investment_opportunities: InvestmentOpportunity[];
  working_capital_summary: {
    total_working_capital: number;
    working_capital_ratio: number;
    cash_conversion_cycle: number;
    optimization_opportunities: number;
    total_cash_balance: number;
    liquidity_score: number;
  };
  optimization_summary: {
    active_strategies: number;
    total_optimized_amount: number;
    total_returns_generated: number;
    average_strategy_performance: number;
    automated_executions: number;
    manual_executions: number;
  };
  liquidity_summary: {
    total_available_cash: number;
    committed_cash: number;
    days_cash_on_hand: number;
    liquidity_risk_score: number;
    credit_utilization: number;
    cash_flow_forecast_7d: number;
  };
  investment_summary: {
    available_opportunities: number;
    total_potential_return: number;
    average_risk_score: number;
    recommended_investments: number;
    matured_investments: number;
    active_investments: number;
  };
  recent_executions: CashOptimizationExecution[];
  urgent_recommendations: WorkingCapitalRecommendation[];
  performance_trends: TreasuryPerformanceAnalytics[];
  risk_alerts: {
    high_risk_positions: number;
    liquidity_warnings: number;
    concentration_risks: number;
    compliance_issues: number;
  };
}

export interface TreasuryOptimizationAnalysis {
  working_capital_analysis: {
    by_component: {
      component: string;
      balance: number;
      efficiency_score: number;
      optimization_potential: number;
    }[];
    by_category: {
      category: string;
      total_balance: number;
      avg_efficiency: number;
      priority_count: number;
    }[];
    cycle_analysis: {
      metric: string;
      current_days: number;
      target_days: number;
      improvement_potential: number;
    }[];
    trend_analysis: {
      period: string;
      working_capital: number;
      efficiency_score: number;
      optimization_savings: number;
    }[];
  };
  optimization_performance: {
    by_strategy_type: {
      strategy_type: string;
      execution_count: number;
      avg_return: number;
      success_rate: number;
    }[];
    by_risk_tolerance: {
      risk_level: string;
      allocation: number;
      returns: number;
      risk_adjusted_return: number;
    }[];
    by_time_horizon: {
      horizon: string;
      investment_count: number;
      avg_return: number;
      liquidity_impact: number;
    }[];
    execution_quality: {
      metric: string;
      average_score: number;
      best_practice_gap: number;
      improvement_area: string;
    }[];
  };
  liquidity_analysis: {
    position_trends: {
      date: string;
      total_liquidity: number;
      risk_score: number;
      optimization_opportunity: number;
    }[];
    account_performance: {
      account_type: string;
      avg_balance: number;
      utilization_rate: number;
      efficiency_score: number;
    }[];
    cash_flow_patterns: {
      period: string;
      inflows: number;
      outflows: number;
      net_flow: number;
      predictability: number;
    }[];
    risk_assessment: {
      risk_factor: string;
      exposure_amount: number;
      risk_level: string;
      mitigation_status: string;
    }[];
  };
  investment_analysis: {
    opportunity_performance: {
      investment_type: string;
      avg_return: number;
      risk_score: number;
      liquidity_score: number;
    }[];
    provider_analysis: {
      provider: string;
      opportunity_count: number;
      avg_rating: number;
      performance_score: number;
    }[];
    market_trends: {
      period: string;
      avg_rates: number;
      volatility: number;
      opportunity_count: number;
    }[];
    ai_recommendation_accuracy: {
      recommendation_score_range: string;
      count: number;
      actual_performance: number;
    }[];
  };
  recommendations: {
    priority: "High" | "Medium" | "Low";
    category: string;
    recommendation: string;
    impact: string;
    effort: string;
  }[];
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ============================================================================
// TREASURY OPTIMIZATION SERVICE CLASS
// ============================================================================

export class TreasuryOptimizationService {
  private static supabase = createClient();

  // ============================================================================
  // WORKING CAPITAL COMPONENT MANAGEMENT
  // ============================================================================

  static async createWorkingCapitalComponent(
    component: Omit<WorkingCapitalComponent, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResponse<WorkingCapitalComponent>> {
    try {
      const { data, error } = await this.supabase
        .from("working_capital_components")
        .insert(component)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Working capital component created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getWorkingCapitalComponents(filters?: {
    component_category?: string;
    optimization_priority?: string;
    component_status?: string;
  }): Promise<ServiceResponse<WorkingCapitalComponent[]>> {
    try {
      let query = this.supabase
        .from("working_capital_components")
        .select("*")
        .order("component_name");

      if (filters?.component_category) {
        query = query.eq("component_category", filters.component_category);
      }
      if (filters?.optimization_priority) {
        query = query.eq("optimization_priority", filters.optimization_priority);
      }
      if (filters?.component_status) {
        query = query.eq("component_status", filters.component_status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async updateComponentBalance(
    componentId: string,
    newBalance: number,
    daysOutstanding?: number,
  ): Promise<ServiceResponse<WorkingCapitalComponent>> {
    try {
      const updateData: any = {
        current_balance: newBalance,
        last_balance_update: new Date().toISOString(),
      };

      if (daysOutstanding !== undefined) {
        updateData.current_days_outstanding = daysOutstanding;
      }

      // Calculate efficiency score based on target vs actual
      const { data: component } = await this.supabase
        .from("working_capital_components")
        .select("*")
        .eq("id", componentId)
        .single();

      if (component) {
        let efficiencyScore = 100;

        // Calculate efficiency based on balance target
        if (component.minimum_balance_required && component.maximum_balance_threshold) {
          const optimalBalance =
            (component.minimum_balance_required + component.maximum_balance_threshold) / 2;
          const deviation = Math.abs(newBalance - optimalBalance) / optimalBalance;
          efficiencyScore = Math.max(0, 100 - deviation * 100);
        }

        // Adjust for days outstanding if applicable
        if (daysOutstanding && component.target_days_outstanding) {
          const daysEfficiency = Math.max(
            0,
            100 - Math.abs(daysOutstanding - component.target_days_outstanding) * 2,
          );
          efficiencyScore = (efficiencyScore + daysEfficiency) / 2;
        }

        updateData.efficiency_score = efficiencyScore;
      }

      const { data, error } = await this.supabase
        .from("working_capital_components")
        .update(updateData)
        .eq("id", componentId)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Component balance updated successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // CASH OPTIMIZATION STRATEGIES
  // ============================================================================

  static async createCashOptimizationStrategy(
    strategy: Omit<
      CashOptimizationStrategy,
      | "id"
      | "created_at"
      | "updated_at"
      | "total_optimized_amount"
      | "total_return_generated"
      | "number_of_executions"
    >,
  ): Promise<ServiceResponse<CashOptimizationStrategy>> {
    try {
      const strategyData = {
        ...strategy,
        total_optimized_amount: 0,
        total_return_generated: 0,
        number_of_executions: 0,
      };

      const { data, error } = await this.supabase
        .from("cash_optimization_strategies")
        .insert(strategyData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Cash optimization strategy created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getCashOptimizationStrategies(filters?: {
    strategy_type?: string;
    strategy_status?: string;
    risk_tolerance?: string;
  }): Promise<ServiceResponse<CashOptimizationStrategy[]>> {
    try {
      let query = this.supabase
        .from("cash_optimization_strategies")
        .select("*")
        .order("strategy_name");

      if (filters?.strategy_type) {
        query = query.eq("strategy_type", filters.strategy_type);
      }
      if (filters?.strategy_status) {
        query = query.eq("strategy_status", filters.strategy_status);
      }
      if (filters?.risk_tolerance) {
        query = query.eq("risk_tolerance", filters.risk_tolerance);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async executeOptimizationStrategy(
    strategyId: string,
    executionAmount: number,
    investmentOpportunityId?: string,
  ): Promise<ServiceResponse<CashOptimizationExecution>> {
    try {
      // Get strategy details
      const { data: strategy, error: strategyError } = await this.supabase
        .from("cash_optimization_strategies")
        .select("*")
        .eq("id", strategyId)
        .single();

      if (strategyError) throw strategyError;

      // Create execution record
      const executionData: Omit<
        CashOptimizationExecution,
        "id" | "created_at" | "updated_at" | "strategy" | "investment_opportunity"
      > = {
        execution_date: new Date().toISOString().split("T")[0],
        execution_time: new Date().toTimeString().split(" ")[0],
        strategy_id: strategyId,
        execution_type: "Investment",
        principal_amount: executionAmount,
        investment_opportunity_id: investmentOpportunityId,
        execution_method: strategy.auto_execution_enabled ? "Automatic" : "Manual",
        trigger_condition: `Amount ${executionAmount} exceeded threshold`,
        approval_level:
          executionAmount > (strategy.approval_required_above || Infinity)
            ? "Treasury Manager"
            : "System",
        fees_paid: 0,
        execution_status: "executed",
        compliance_checked: true,
      };

      const { data: execution, error: executionError } = await this.supabase
        .from("cash_optimization_executions")
        .insert(executionData)
        .select(
          `
          *,
          strategy:strategy_id(*),
          investment_opportunity:investment_opportunity_id(*)
        `,
        )
        .single();

      if (executionError) throw executionError;

      // Update strategy performance
      await this.supabase
        .from("cash_optimization_strategies")
        .update({
          total_optimized_amount: strategy.total_optimized_amount + executionAmount,
          number_of_executions: strategy.number_of_executions + 1,
          last_execution_date: new Date().toISOString(),
        })
        .eq("id", strategyId);

      return { success: true, data: execution, message: "Strategy executed successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // LIQUIDITY POSITION MANAGEMENT
  // ============================================================================

  static async recordLiquidityPosition(
    position: Omit<LiquidityPosition, "id" | "created_at" | "updated_at" | "net_cash_flow">,
  ): Promise<ServiceResponse<LiquidityPosition>> {
    try {
      const { data, error } = await this.supabase
        .from("liquidity_positions")
        .insert(position)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Liquidity position recorded successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getLiquidityPositions(filters?: {
    position_date_from?: string;
    position_date_to?: string;
    account_type?: string;
    validation_status?: string;
  }): Promise<ServiceResponse<LiquidityPosition[]>> {
    try {
      let query = this.supabase
        .from("liquidity_positions")
        .select("*")
        .order("position_date", { ascending: false });

      if (filters?.position_date_from) {
        query = query.gte("position_date", filters.position_date_from);
      }
      if (filters?.position_date_to) {
        query = query.lte("position_date", filters.position_date_to);
      }
      if (filters?.account_type) {
        query = query.eq("account_type", filters.account_type);
      }
      if (filters?.validation_status) {
        query = query.eq("validation_status", filters.validation_status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async calculateLiquidityMetrics(positionDate?: string): Promise<
    ServiceResponse<{
      total_liquidity: number;
      weighted_risk_score: number;
      optimization_opportunities: number;
      cash_flow_forecast: { inflows_7d: number; outflows_7d: number; net_7d: number };
    }>
  > {
    try {
      const targetDate = positionDate || new Date().toISOString().split("T")[0];

      // Get positions for the target date
      const { data: positions, error } = await this.supabase
        .from("liquidity_positions")
        .select("*")
        .eq("position_date", targetDate);

      if (error) throw error;

      if (!positions || positions.length === 0) {
        return {
          success: true,
          data: {
            total_liquidity: 0,
            weighted_risk_score: 0,
            optimization_opportunities: 0,
            cash_flow_forecast: { inflows_7d: 0, outflows_7d: 0, net_7d: 0 },
          },
        };
      }

      // Calculate metrics
      const totalLiquidity = positions.reduce((sum, p) => sum + p.available_balance, 0);
      const weightedRiskScore = positions.reduce(
        (sum, p) => sum + (p.liquidity_risk_score || 0) * (p.available_balance / totalLiquidity),
        0,
      );
      const optimizationOpportunities = positions.reduce(
        (sum, p) => sum + (p.optimization_opportunity || 0),
        0,
      );

      const cashFlowForecast = {
        inflows_7d: positions.reduce((sum, p) => sum + (p.forecasted_inflows_7d || 0), 0),
        outflows_7d: positions.reduce((sum, p) => sum + (p.forecasted_outflows_7d || 0), 0),
        net_7d: 0,
      };
      cashFlowForecast.net_7d = cashFlowForecast.inflows_7d - cashFlowForecast.outflows_7d;

      return {
        success: true,
        data: {
          total_liquidity: totalLiquidity,
          weighted_risk_score: weightedRiskScore,
          optimization_opportunities: optimizationOpportunities,
          cash_flow_forecast: cashFlowForecast,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // INVESTMENT OPPORTUNITY MANAGEMENT
  // ============================================================================

  static async createInvestmentOpportunity(
    opportunity: Omit<InvestmentOpportunity, "id" | "created_at" | "updated_at">,
  ): Promise<ServiceResponse<InvestmentOpportunity>> {
    try {
      // Calculate AI recommendation score based on risk/return profile
      let aiScore = 50; // Base score

      // Adjust based on risk category
      const riskAdjustments = {
        "Very Low": 10,
        Low: 5,
        Medium: 0,
        High: -10,
      };
      aiScore += riskAdjustments[opportunity.risk_category] || 0;

      // Adjust based on liquidity
      if (opportunity.liquidity_score && opportunity.liquidity_score > 80) aiScore += 10;
      if (opportunity.liquidity_score && opportunity.liquidity_score < 40) aiScore -= 10;

      // Adjust based on credit rating
      if (opportunity.credit_rating) {
        if (["AAA", "AA+", "AA"].includes(opportunity.credit_rating)) aiScore += 15;
        else if (["AA-", "A+", "A"].includes(opportunity.credit_rating)) aiScore += 10;
        else if (["A-", "BBB+", "BBB"].includes(opportunity.credit_rating)) aiScore += 5;
        else aiScore -= 5;
      }

      // Adjust based on FDIC insurance
      if (opportunity.fdic_insured) aiScore += 5;

      const opportunityData = {
        ...opportunity,
        ai_recommendation_score: Math.max(0, Math.min(100, aiScore)),
        recommendation_reasons: [
          "Risk-adjusted return analysis",
          "Liquidity requirements match",
          "Credit quality assessment",
          "Market conditions favorable",
        ],
      };

      const { data, error } = await this.supabase
        .from("investment_opportunities")
        .insert(opportunityData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Investment opportunity created successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getInvestmentOpportunities(filters?: {
    investment_type?: string;
    risk_category?: string;
    opportunity_status?: string;
    min_return_rate?: number;
    max_investment_term?: number;
  }): Promise<ServiceResponse<InvestmentOpportunity[]>> {
    try {
      let query = this.supabase
        .from("investment_opportunities")
        .select("*")
        .order("ai_recommendation_score", { ascending: false });

      if (filters?.investment_type) {
        query = query.eq("investment_type", filters.investment_type);
      }
      if (filters?.risk_category) {
        query = query.eq("risk_category", filters.risk_category);
      }
      if (filters?.opportunity_status) {
        query = query.eq("opportunity_status", filters.opportunity_status);
      }
      if (filters?.min_return_rate) {
        query = query.gte("interest_rate", filters.min_return_rate);
      }
      if (filters?.max_investment_term) {
        query = query.lte("investment_term_days", filters.max_investment_term);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // WORKING CAPITAL RECOMMENDATIONS
  // ============================================================================

  static async generateWorkingCapitalRecommendations(): Promise<
    ServiceResponse<WorkingCapitalRecommendation[]>
  > {
    try {
      // Get current working capital components
      const componentsResult = await this.getWorkingCapitalComponents({
        component_status: "active",
      });
      if (!componentsResult.success || !componentsResult.data) {
        throw new Error("Failed to fetch working capital components");
      }

      const components = componentsResult.data;
      const recommendations: Omit<
        WorkingCapitalRecommendation,
        "id" | "created_at" | "updated_at" | "component"
      >[] = [];

      // Analyze each component for optimization opportunities
      for (const component of components) {
        const efficiency = component.efficiency_score || 0;

        if (efficiency < 70 && component.optimization_priority === "High") {
          // Generate high-priority recommendation
          const recommendation: Omit<
            WorkingCapitalRecommendation,
            "id" | "created_at" | "updated_at" | "component"
          > = {
            recommendation_title: `Optimize ${component.component_name} Performance`,
            recommendation_code: `WC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            recommendation_type: this.getRecommendationType(component.component_category),
            component_id: component.id,
            impact_category: "Working Capital",
            estimated_impact_amount: component.current_balance * 0.15, // Assume 15% improvement potential
            impact_timeframe: "Short-term",
            current_situation_analysis: `${component.component_name} is operating at ${efficiency.toFixed(1)}% efficiency, below the target threshold of 80%. This presents significant optimization opportunities.`,
            recommended_actions: [
              `Review and optimize ${component.component_name} processes`,
              "Implement automated monitoring and alerts",
              "Establish performance benchmarks and targets",
              "Regular review and adjustment of parameters",
            ],
            implementation_steps: [
              "Conduct detailed analysis of current processes",
              "Identify automation opportunities",
              "Implement process improvements",
              "Monitor and measure results",
            ],
            success_metrics: [
              "Efficiency score improvement to >80%",
              "Reduction in cycle time",
              "Cost savings achievement",
              "Risk mitigation effectiveness",
            ],
            investment_required: 50000, // Mock investment requirement
            payback_period_months: 6,
            priority_score: 90,
            urgency_level: "High",
            strategic_importance: "High",
            implementation_complexity: "Medium",
            estimated_implementation_time: 90,
            recommendation_status: "draft",
            created_date: new Date().toISOString().split("T")[0],
            monitoring_required: true,
            monitoring_frequency: "monthly",
            ai_confidence_score: 85,
            data_quality_score: 90,
          };

          recommendations.push(recommendation);
        }
      }

      // Insert recommendations into database
      const insertedRecommendations: WorkingCapitalRecommendation[] = [];
      for (const rec of recommendations) {
        const { data, error } = await this.supabase
          .from("working_capital_recommendations")
          .insert(rec)
          .select(
            `
            *,
            component:component_id(*)
          `,
          )
          .single();

        if (!error && data) {
          insertedRecommendations.push(data);
        }
      }

      return {
        success: true,
        data: insertedRecommendations,
        message: `Generated ${insertedRecommendations.length} working capital recommendations`,
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static getRecommendationType(
    category: string,
  ): WorkingCapitalRecommendation["recommendation_type"] {
    switch (category) {
      case "Receivables":
        return "Receivables Optimization";
      case "Inventory":
        return "Inventory Optimization";
      case "Payables":
        return "Payables Optimization";
      default:
        return "Cash Management";
    }
  }

  static async getWorkingCapitalRecommendations(filters?: {
    recommendation_type?: string;
    recommendation_status?: string;
    urgency_level?: string;
    priority_min?: number;
  }): Promise<ServiceResponse<WorkingCapitalRecommendation[]>> {
    try {
      let query = this.supabase
        .from("working_capital_recommendations")
        .select(
          `
          *,
          component:component_id(*)
        `,
        )
        .order("priority_score", { ascending: false });

      if (filters?.recommendation_type) {
        query = query.eq("recommendation_type", filters.recommendation_type);
      }
      if (filters?.recommendation_status) {
        query = query.eq("recommendation_status", filters.recommendation_status);
      }
      if (filters?.urgency_level) {
        query = query.eq("urgency_level", filters.urgency_level);
      }
      if (filters?.priority_min) {
        query = query.gte("priority_score", filters.priority_min);
      }

      const { data, error } = await query;

      if (error) throw error;

      return { success: true, data: data || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // ============================================================================
  // TREASURY PERFORMANCE ANALYTICS
  // ============================================================================

  static async calculateTreasuryPerformance(
    periodStart: string,
    periodEnd: string,
    analysisType: TreasuryPerformanceAnalytics["analysis_type"] = "Monthly",
  ): Promise<ServiceResponse<TreasuryPerformanceAnalytics>> {
    try {
      // Get liquidity positions for the period
      const positionsResult = await this.getLiquidityPositions({
        position_date_from: periodStart,
        position_date_to: periodEnd,
      });

      if (!positionsResult.success || !positionsResult.data) {
        throw new Error("Failed to fetch liquidity positions");
      }

      const positions = positionsResult.data;

      // Calculate basic metrics
      const avgCashBalance = positions.length
        ? positions.reduce((sum, p) => sum + p.closing_balance, 0) / positions.length
        : 0;
      const peakCashBalance = positions.length
        ? Math.max(...positions.map(p => p.closing_balance))
        : 0;
      const minCashBalance = positions.length
        ? Math.min(...positions.map(p => p.closing_balance))
        : 0;

      // Get working capital components
      const componentsResult = await this.getWorkingCapitalComponents({
        component_status: "active",
      });
      const components = componentsResult.data || [];

      const totalWorkingCapital = components.reduce((sum, c) => sum + c.current_balance, 0);
      const avgEfficiency = components.length
        ? components.reduce((sum, c) => sum + (c.efficiency_score || 0), 0) / components.length
        : 0;

      // Get optimization executions
      const { data: executions } = await this.supabase
        .from("cash_optimization_executions")
        .select("*")
        .gte("execution_date", periodStart)
        .lte("execution_date", periodEnd)
        .eq("execution_status", "executed");

      const totalInvestments = executions?.reduce((sum, e) => sum + e.principal_amount, 0) || 0;
      const totalReturns =
        executions?.reduce((sum, e) => sum + (e.actual_return || e.expected_return || 0), 0) || 0;

      const performanceData: Omit<
        TreasuryPerformanceAnalytics,
        "id" | "created_at" | "updated_at"
      > = {
        analysis_date: new Date().toISOString().split("T")[0],
        period_start_date: periodStart,
        period_end_date: periodEnd,
        analysis_type: analysisType,
        average_cash_balance: avgCashBalance,
        peak_cash_balance: peakCashBalance,
        minimum_cash_balance: minCashBalance,
        cash_balance_volatility: this.calculateVolatility(positions.map(p => p.closing_balance)),
        working_capital_amount: totalWorkingCapital,
        working_capital_ratio: totalWorkingCapital > 0 ? avgCashBalance / totalWorkingCapital : 0,
        cash_conversion_cycle_days: this.calculateAverageCashCycle(positions),
        total_investments_made: totalInvestments,
        total_investment_returns: totalReturns,
        weighted_average_return_rate: totalInvestments > 0 ? totalReturns / totalInvestments : 0,
        processing_efficiency_score: avgEfficiency,
        number_of_optimizations: executions?.length || 0,
        optimization_success_rate: executions?.length
          ? (executions.filter(e => (e.actual_return || e.expected_return || 0) > 0).length /
              executions.length) *
            100
          : 0,
        data_completeness_percentage: 95.0, // Mock value
        data_accuracy_score: 98.0, // Mock value
        analysis_confidence_level: 90.0,
      };

      const { data, error } = await this.supabase
        .from("treasury_performance_analytics")
        .insert(performanceData)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data, message: "Treasury performance calculated successfully" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private static calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private static calculateAverageCashCycle(positions: LiquidityPosition[]): number {
    const validCycles = positions
      .filter(p => p.cash_conversion_cycle_days)
      .map(p => p.cash_conversion_cycle_days!);
    return validCycles.length ? validCycles.reduce((sum, c) => sum + c, 0) / validCycles.length : 0;
  }

  // ============================================================================
  // DASHBOARD AND ANALYTICS
  // ============================================================================

  static async getTreasuryOptimizationDashboard(): Promise<
    ServiceResponse<TreasuryOptimizationDashboard>
  > {
    try {
      // Get working capital components
      const componentsResult = await this.getWorkingCapitalComponents({
        component_status: "active",
      });
      const components = componentsResult.data || [];

      // Get optimization strategies
      const strategiesResult = await this.getCashOptimizationStrategies({
        strategy_status: "active",
      });
      const strategies = strategiesResult.data || [];

      // Get current liquidity positions
      const positionsResult = await this.getLiquidityPositions({
        position_date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
      });
      const positions = positionsResult.data || [];

      // Get investment opportunities
      const opportunitiesResult = await this.getInvestmentOpportunities({
        opportunity_status: "available",
      });
      const opportunities = opportunitiesResult.data || [];

      // Calculate summaries
      const workingCapitalSummary = {
        total_working_capital: components.reduce((sum, c) => sum + c.current_balance, 0),
        working_capital_ratio: components.length
          ? components.reduce((sum, c) => sum + (c.efficiency_score || 0), 0) /
            components.length /
            100
          : 0,
        cash_conversion_cycle: this.calculateAverageCashCycle(positions),
        optimization_opportunities: components.filter(c => (c.efficiency_score || 0) < 80).length,
        total_cash_balance: positions.reduce((sum, p) => sum + p.closing_balance, 0),
        liquidity_score: positions.length
          ? positions.reduce((sum, p) => sum + (100 - (p.liquidity_risk_score || 0)), 0) /
            positions.length
          : 0,
      };

      const optimizationSummary = {
        active_strategies: strategies.length,
        total_optimized_amount: strategies.reduce((sum, s) => sum + s.total_optimized_amount, 0),
        total_returns_generated: strategies.reduce((sum, s) => sum + s.total_return_generated, 0),
        average_strategy_performance: strategies.length
          ? strategies.reduce((sum, s) => sum + (s.current_performance_score || 0), 0) /
            strategies.length
          : 0,
        automated_executions: strategies.filter(s => s.auto_execution_enabled).length,
        manual_executions: strategies.filter(s => !s.auto_execution_enabled).length,
      };

      const liquiditySummary = {
        total_available_cash: positions.reduce((sum, p) => sum + p.available_balance, 0),
        committed_cash: positions.reduce((sum, p) => sum + p.committed_balance, 0),
        days_cash_on_hand: positions.length
          ? positions.reduce((sum, p) => sum + (p.days_cash_on_hand || 0), 0) / positions.length
          : 0,
        liquidity_risk_score: positions.length
          ? positions.reduce((sum, p) => sum + (p.liquidity_risk_score || 0), 0) / positions.length
          : 0,
        credit_utilization: positions.length
          ? positions.reduce((sum, p) => sum + (p.credit_utilization_ratio || 0), 0) /
            positions.length
          : 0,
        cash_flow_forecast_7d: positions.reduce(
          (sum, p) => sum + (p.forecasted_inflows_7d || 0) - (p.forecasted_outflows_7d || 0),
          0,
        ),
      };

      const investmentSummary = {
        available_opportunities: opportunities.filter(o => o.opportunity_status === "available")
          .length,
        total_potential_return: opportunities.reduce(
          (sum, o) => sum + (o.expected_return_amount || 0),
          0,
        ),
        average_risk_score: opportunities.length
          ? opportunities.reduce((sum, o) => {
              const riskScore =
                { "Very Low": 20, Low: 40, Medium: 60, High: 80 }[o.risk_category] || 50;
              return sum + riskScore;
            }, 0) / opportunities.length
          : 0,
        recommended_investments: opportunities.filter(o => (o.ai_recommendation_score || 0) > 70)
          .length,
        matured_investments: opportunities.filter(o => o.opportunity_status === "matured").length,
        active_investments: opportunities.filter(o => o.opportunity_status === "invested").length,
      };

      // Get recent executions
      const { data: recentExecutions } = await this.supabase
        .from("cash_optimization_executions")
        .select(
          `
          *,
          strategy:strategy_id(*),
          investment_opportunity:investment_opportunity_id(*)
        `,
        )
        .order("execution_date", { ascending: false })
        .limit(10);

      // Get urgent recommendations
      const urgentRecsResult = await this.getWorkingCapitalRecommendations({
        urgency_level: "High",
        recommendation_status: "draft",
      });
      const urgentRecommendations = urgentRecsResult.data?.slice(0, 5) || [];

      const dashboardData: TreasuryOptimizationDashboard = {
        working_capital_components: components,
        optimization_strategies: strategies,
        current_liquidity_positions: positions.slice(0, 10),
        investment_opportunities: opportunities.slice(0, 10),
        working_capital_summary: workingCapitalSummary,
        optimization_summary: optimizationSummary,
        liquidity_summary: liquiditySummary,
        investment_summary: investmentSummary,
        recent_executions: recentExecutions || [],
        urgent_recommendations: urgentRecommendations,
        performance_trends: [], // Would be populated from analytics table
        risk_alerts: {
          high_risk_positions: positions.filter(p => (p.liquidity_risk_score || 0) > 70).length,
          liquidity_warnings: positions.filter(p => (p.days_cash_on_hand || 0) < 30).length,
          concentration_risks: 0, // Mock value
          compliance_issues: 0, // Mock value
        },
      };

      return { success: true, data: dashboardData };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static async getTreasuryOptimizationAnalysis(
    period_start?: string,
    period_end?: string,
  ): Promise<ServiceResponse<TreasuryOptimizationAnalysis>> {
    try {
      const startDate =
        period_start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const endDate = period_end || new Date().toISOString().split("T")[0];

      // This would typically involve complex aggregation queries
      // For demo purposes, providing mock analysis data
      const analysis: TreasuryOptimizationAnalysis = {
        working_capital_analysis: {
          by_component: [
            {
              component: "Accounts Receivable",
              balance: 2500000,
              efficiency_score: 87.5,
              optimization_potential: 375000,
            },
            {
              component: "Inventory",
              balance: 1800000,
              efficiency_score: 72.3,
              optimization_potential: 450000,
            },
            {
              component: "Accounts Payable",
              balance: -1200000,
              efficiency_score: 91.2,
              optimization_potential: 120000,
            },
            {
              component: "Cash & Equivalents",
              balance: 800000,
              efficiency_score: 95.8,
              optimization_potential: 50000,
            },
          ],
          by_category: [
            {
              category: "Current Assets",
              total_balance: 5100000,
              avg_efficiency: 83.9,
              priority_count: 8,
            },
            {
              category: "Current Liabilities",
              total_balance: -1200000,
              avg_efficiency: 91.2,
              priority_count: 3,
            },
            {
              category: "Inventory",
              total_balance: 1800000,
              avg_efficiency: 72.3,
              priority_count: 5,
            },
          ],
          cycle_analysis: [
            {
              metric: "Days Sales Outstanding",
              current_days: 45.2,
              target_days: 35.0,
              improvement_potential: 10.2,
            },
            {
              metric: "Days Inventory Outstanding",
              current_days: 32.8,
              target_days: 28.0,
              improvement_potential: 4.8,
            },
            {
              metric: "Days Payable Outstanding",
              current_days: 28.5,
              target_days: 35.0,
              improvement_potential: -6.5,
            },
          ],
          trend_analysis: [
            {
              period: "Current Quarter",
              working_capital: 3900000,
              efficiency_score: 84.2,
              optimization_savings: 285000,
            },
            {
              period: "Previous Quarter",
              working_capital: 3750000,
              efficiency_score: 81.7,
              optimization_savings: 320000,
            },
            {
              period: "Year Ago",
              working_capital: 3600000,
              efficiency_score: 78.9,
              optimization_savings: 380000,
            },
          ],
        },
        optimization_performance: {
          by_strategy_type: [
            {
              strategy_type: "Cash Concentration",
              execution_count: 24,
              avg_return: 0.045,
              success_rate: 95.8,
            },
            {
              strategy_type: "Investment",
              execution_count: 18,
              avg_return: 0.038,
              success_rate: 88.9,
            },
            {
              strategy_type: "Working Capital",
              execution_count: 12,
              avg_return: 0.025,
              success_rate: 91.7,
            },
          ],
          by_risk_tolerance: [
            {
              risk_level: "Conservative",
              allocation: 2500000,
              returns: 112500,
              risk_adjusted_return: 0.042,
            },
            {
              risk_level: "Moderate",
              allocation: 1800000,
              returns: 97200,
              risk_adjusted_return: 0.048,
            },
            {
              risk_level: "Aggressive",
              allocation: 700000,
              returns: 45500,
              risk_adjusted_return: 0.058,
            },
          ],
          by_time_horizon: [
            {
              horizon: "Short-term (<30 days)",
              investment_count: 28,
              avg_return: 0.032,
              liquidity_impact: 0.15,
            },
            {
              horizon: "Medium-term (30-90 days)",
              investment_count: 15,
              avg_return: 0.041,
              liquidity_impact: 0.35,
            },
            {
              horizon: "Long-term (>90 days)",
              investment_count: 8,
              avg_return: 0.058,
              liquidity_impact: 0.75,
            },
          ],
          execution_quality: [
            {
              metric: "Speed",
              average_score: 92.5,
              best_practice_gap: 7.5,
              improvement_area: "Automation",
            },
            {
              metric: "Cost",
              average_score: 88.3,
              best_practice_gap: 11.7,
              improvement_area: "Fee Negotiation",
            },
            {
              metric: "Accuracy",
              average_score: 96.8,
              best_practice_gap: 3.2,
              improvement_area: "Data Quality",
            },
          ],
        },
        liquidity_analysis: {
          position_trends: [
            {
              date: "2024-09-09",
              total_liquidity: 4200000,
              risk_score: 23.5,
              optimization_opportunity: 315000,
            },
            {
              date: "2024-09-02",
              total_liquidity: 3950000,
              risk_score: 28.1,
              optimization_opportunity: 380000,
            },
            {
              date: "2024-08-26",
              total_liquidity: 3800000,
              risk_score: 31.7,
              optimization_opportunity: 420000,
            },
          ],
          account_performance: [
            {
              account_type: "Operating",
              avg_balance: 2100000,
              utilization_rate: 0.78,
              efficiency_score: 87.2,
            },
            {
              account_type: "Savings",
              avg_balance: 1500000,
              utilization_rate: 0.45,
              efficiency_score: 92.8,
            },
            {
              account_type: "Investment",
              avg_balance: 600000,
              utilization_rate: 0.89,
              efficiency_score: 85.5,
            },
          ],
          cash_flow_patterns: [
            {
              period: "Week 1",
              inflows: 850000,
              outflows: 720000,
              net_flow: 130000,
              predictability: 89.2,
            },
            {
              period: "Week 2",
              inflows: 920000,
              outflows: 780000,
              net_flow: 140000,
              predictability: 91.7,
            },
            {
              period: "Week 3",
              inflows: 760000,
              outflows: 690000,
              net_flow: 70000,
              predictability: 85.3,
            },
          ],
          risk_assessment: [
            {
              risk_factor: "Concentration Risk",
              exposure_amount: 1200000,
              risk_level: "Medium",
              mitigation_status: "In Progress",
            },
            {
              risk_factor: "Interest Rate Risk",
              exposure_amount: 800000,
              risk_level: "Low",
              mitigation_status: "Hedged",
            },
            {
              risk_factor: "Credit Risk",
              exposure_amount: 450000,
              risk_level: "Low",
              mitigation_status: "Monitored",
            },
          ],
        },
        investment_analysis: {
          opportunity_performance: [
            {
              investment_type: "Money Market",
              avg_return: 0.045,
              risk_score: 15.2,
              liquidity_score: 95.8,
            },
            {
              investment_type: "Treasury Bills",
              avg_return: 0.042,
              risk_score: 8.7,
              liquidity_score: 98.2,
            },
            { investment_type: "CDs", avg_return: 0.048, risk_score: 12.5, liquidity_score: 72.3 },
            {
              investment_type: "Corporate Bonds",
              avg_return: 0.062,
              risk_score: 28.9,
              liquidity_score: 68.7,
            },
          ],
          provider_analysis: [
            {
              provider: "Bank of America",
              opportunity_count: 8,
              avg_rating: 4.2,
              performance_score: 87.5,
            },
            {
              provider: "JPMorgan Chase",
              opportunity_count: 6,
              avg_rating: 4.5,
              performance_score: 91.3,
            },
            {
              provider: "Wells Fargo",
              opportunity_count: 5,
              avg_rating: 3.8,
              performance_score: 83.7,
            },
          ],
          market_trends: [
            {
              period: "Current Month",
              avg_rates: 0.0425,
              volatility: 0.015,
              opportunity_count: 23,
            },
            {
              period: "Previous Month",
              avg_rates: 0.0398,
              volatility: 0.018,
              opportunity_count: 19,
            },
            {
              period: "Two Months Ago",
              avg_rates: 0.0385,
              volatility: 0.022,
              opportunity_count: 17,
            },
          ],
          ai_recommendation_accuracy: [
            { recommendation_score_range: "80-100", count: 12, actual_performance: 0.94 },
            { recommendation_score_range: "60-79", count: 18, actual_performance: 0.87 },
            { recommendation_score_range: "40-59", count: 8, actual_performance: 0.72 },
          ],
        },
        recommendations: [
          {
            priority: "High",
            category: "Cash Optimization",
            recommendation:
              "Implement automated daily cash concentration across all operating accounts",
            impact: "Increase investment returns by $180K annually",
            effort: "Medium - 4-6 weeks implementation",
          },
          {
            priority: "High",
            category: "Working Capital",
            recommendation:
              "Optimize accounts receivable collection processes to reduce DSO by 8 days",
            impact: "Free up $650K in working capital",
            effort: "Medium - 6-8 weeks implementation",
          },
          {
            priority: "Medium",
            category: "Investment Strategy",
            recommendation:
              "Diversify short-term investment portfolio across additional asset classes",
            impact: "Improve risk-adjusted returns by 15%",
            effort: "Low - 2-3 weeks analysis and setup",
          },
          {
            priority: "Medium",
            category: "Liquidity Management",
            recommendation: "Establish dynamic credit facilities to optimize cash buffers",
            impact: "Reduce idle cash by $400K while maintaining liquidity",
            effort: "High - 8-12 weeks negotiation and setup",
          },
        ],
      };

      return { success: true, data: analysis };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
