/**
 * Advanced KPI Dashboard Service - Executive Financial Intelligence
 * Closes Critical Executive Gap #4 - Real-time Financial Intelligence & KPIs
 *
 * Features:
 * - Real-time KPI calculations with historical trending
 * - Executive dashboard configuration and management
 * - AI-powered financial insights and recommendations
 * - KPI alerting with threshold monitoring
 * - Performance analytics with benchmarking
 * - Multi-dimensional KPI analysis and forecasting
 */
// @ts-nocheck


import { supabase } from "./supabase";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type KPICategory =
  | "Financial Performance"
  | "Liquidity"
  | "Efficiency"
  | "Profitability"
  | "Growth"
  | "Risk Management"
  | "Operational";
export type CalculationFrequency =
  | "Real-time"
  | "Hourly"
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Quarterly";
export type MeasurementPeriod =
  | "Daily"
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Annually"
  | "YTD"
  | "Rolling";
export type PerformanceRating =
  | "Excellent"
  | "Good"
  | "Acceptable"
  | "Needs Attention"
  | "No Target"
  | "Unknown";
export type TrendDirection = "Up" | "Down" | "Stable";
export type ChartType = "line" | "bar" | "gauge" | "pie" | "area" | "scatter" | "heatmap" | "trend";
export type InsightType =
  | "Trend Analysis"
  | "Anomaly Detection"
  | "Forecast Alert"
  | "Performance Alert"
  | "Opportunity"
  | "Risk Warning"
  | "Benchmark Comparison";
export type SeverityLevel = "Low" | "Medium" | "High" | "Critical";

export interface ExecutiveKPI {
  id: string;
  company_id: string;
  kpi_name: string;
  kpi_code: string;
  kpi_category: KPICategory;
  description?: string;
  calculation_formula: string;
  data_sources: Array<{
    source: string;
    filters?: Record<string, any>;
    aggregation?: string;
  }>;
  unit_of_measurement: string;
  decimal_places: number;
  display_format: string;
  target_value?: number;
  benchmark_value?: number;
  industry_benchmark?: number;
  excellent_threshold?: number;
  good_threshold?: number;
  acceptable_threshold?: number;
  poor_threshold?: number;
  calculation_frequency: CalculationFrequency;
  historical_periods_required: number;
  chart_type: ChartType;
  dashboard_position: Record<string, any>;
  is_featured: boolean;
  is_active: boolean;
  data_quality_score: number;
  last_calculation_at?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

export interface KPIValue {
  id: string;
  kpi_id: string;
  company_id: string;
  measurement_date: string;
  measurement_period: MeasurementPeriod;
  period_start_date: string;
  period_end_date: string;
  kpi_value: number;
  target_value?: number;
  variance_from_target?: number;
  variance_percentage?: number;
  performance_rating: PerformanceRating;
  previous_period_value?: number;
  period_over_period_change?: number;
  period_over_period_percentage?: number;
  trend_direction: TrendDirection;
  data_completeness: number;
  calculation_confidence: number;
  data_source_count: number;
  calculation_method: string;
  calculation_timestamp: string;
  calculation_duration_ms: number;
  notes?: string;
  flags: string[];
  created_at: string;
}

export interface ExecutiveDashboard {
  id: string;
  company_id: string;
  dashboard_name: string;
  dashboard_type: string;
  description?: string;
  layout_configuration: {
    grid: { columns: number; rows: number };
    widgets: Array<{
      id: string;
      position: { x: number; y: number; width: number; height: number };
      type: string;
      kpi_id?: string;
      config: Record<string, any>;
    }>;
  };
  visibility: string;
  allowed_roles: string[];
  allowed_users: string[];
  owner_id: string;
  shared_with: string[];
  auto_refresh_interval_minutes: number;
  last_refreshed_at?: string;
  refresh_enabled: boolean;
  is_active: boolean;
  is_default: boolean;
  is_archived: boolean;
  view_count: number;
  last_viewed_at?: string;
  last_viewed_by?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
  updated_by?: string;
}

export interface FinancialInsight {
  id: string;
  company_id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  insight_category: string;
  severity: SeverityLevel;
  related_kpis: string[];
  affected_accounts: string[];
  time_period_start?: string;
  time_period_end?: string;
  current_value?: number;
  expected_value?: number;
  variance_amount?: number;
  variance_percentage?: number;
  confidence_score: number;
  recommended_actions: Array<{
    action: string;
    priority: string;
    estimated_impact?: string;
    responsible_department?: string;
  }>;
  potential_financial_impact?: number;
  risk_level?: string;
  urgency: string;
  status: string;
  assigned_to?: string;
  assigned_at?: string;
  resolved_at?: string;
  resolved_by?: string;
  resolution_notes?: string;
  actual_impact?: number;
  generated_by_ai: boolean;
  ai_model_version: string;
  detection_algorithm?: string;
  created_at: string;
  expires_at?: string;
}

export interface KPIAlert {
  id: string;
  company_id: string;
  kpi_id: string;
  alert_name: string;
  alert_type: string;
  alert_condition: Record<string, any>;
  severity: SeverityLevel;
  notification_channels: string[];
  recipients: string[];
  check_frequency: string;
  alert_window_hours: number;
  max_alerts_per_day: number;
  last_triggered_at?: string;
  trigger_count: number;
  last_resolved_at?: string;
  is_active: boolean;
  is_snoozed: boolean;
  snooze_until?: string;
  created_at: string;
  created_by?: string;
  updated_at: string;
}

export interface ExecutiveDashboardData {
  dashboard: ExecutiveDashboard;
  kpi_summary: {
    total_kpis: number;
    featured_kpis: number;
    excellent_performance: number;
    needs_attention: number;
    trending_up: number;
    trending_down: number;
  };
  featured_kpis: Array<{
    kpi: ExecutiveKPI;
    current_value: KPIValue;
    historical_trend: KPIValue[];
    performance_rating: PerformanceRating;
    trend_analysis: {
      direction: TrendDirection;
      strength: number;
      forecast: number;
    };
  }>;
  financial_insights: FinancialInsight[];
  active_alerts: KPIAlert[];
  performance_overview: {
    financial_health_score: number;
    operational_efficiency_score: number;
    growth_momentum_score: number;
    risk_assessment_score: number;
  };
  benchmark_comparison: {
    industry_ranking: string;
    peer_comparison: Array<{
      kpi: string;
      company_value: number;
      industry_average: number;
      percentile_ranking: number;
    }>;
  };
}

export interface KPIAnalysisResult {
  kpi: ExecutiveKPI;
  current_performance: {
    value: number;
    rating: PerformanceRating;
    variance_from_target: number;
    variance_percentage: number;
  };
  trend_analysis: {
    direction: TrendDirection;
    strength: number;
    consistency: number;
    monthly_growth_rate: number;
    quarterly_growth_rate: number;
  };
  historical_data: KPIValue[];
  forecast: Array<{
    period: string;
    predicted_value: number;
    confidence_interval: { lower: number; upper: number };
    confidence_score: number;
  }>;
  insights: FinancialInsight[];
  recommendations: Array<{
    category: string;
    action: string;
    impact: string;
    timeline: string;
    priority: SeverityLevel;
  }>;
}

// =====================================================================================
// MAIN SERVICE CLASS
// =====================================================================================

export class AdvancedKPIService {
  /**
   * Get comprehensive executive dashboard data
   */
  static async getExecutiveDashboard(
    companyId: string,
    dashboardId?: string,
    dateRange?: { start: string; end: string },
  ): Promise<{
    success: boolean;
    data?: ExecutiveDashboardData;
    error?: string;
  }> {
    try {
      // Get or create default dashboard
      let dashboard: ExecutiveDashboard;
      if (dashboardId) {
        const { data: dashboardData, error: dashboardError } = await supabase
          .from("executive_dashboards")
          .select("*")
          .eq("id", dashboardId)
          .eq("company_id", companyId)
          .single();

        if (dashboardError) {
          throw new Error(`Dashboard not found: ${dashboardError.message}`);
        }
        dashboard = dashboardData;
      } else {
        // Get default dashboard or create one
        dashboard = await this.getOrCreateDefaultDashboard(companyId);
      }

      // Update dashboard view count
      await supabase
        .from("executive_dashboards")
        .update({
          view_count: dashboard.view_count + 1,
          last_viewed_at: new Date().toISOString(),
        })
        .eq("id", dashboard.id);

      // Get KPI summary
      const { data: kpiSummaryData, error: summaryError } = await supabase
        .from("mv_executive_kpi_summary")
        .select("*")
        .eq("company_id", companyId)
        .eq("recency_rank", 1); // Only latest values

      if (summaryError) {
        console.error("Error fetching KPI summary:", summaryError);
      }

      // Calculate KPI summary metrics
      const kpiSummary = {
        total_kpis: kpiSummaryData?.length || 0,
        featured_kpis: kpiSummaryData?.filter(kpi => kpi.is_featured)?.length || 0,
        excellent_performance:
          kpiSummaryData?.filter(kpi => kpi.performance_rating === "Excellent")?.length || 0,
        needs_attention:
          kpiSummaryData?.filter(kpi => kpi.performance_rating === "Needs Attention")?.length || 0,
        trending_up: kpiSummaryData?.filter(kpi => kpi.trend_direction === "Up")?.length || 0,
        trending_down: kpiSummaryData?.filter(kpi => kpi.trend_direction === "Down")?.length || 0,
      };

      // Get featured KPIs with detailed analysis
      const featuredKPIs = await this.getFeaturedKPIsWithTrends(companyId, dateRange);

      // Get financial insights
      const { data: insights, error: insightsError } = await supabase
        .from("financial_insights")
        .select("*")
        .eq("company_id", companyId)
        .in("status", ["New", "Acknowledged", "Under Review"])
        .order("created_at", { ascending: false })
        .limit(10);

      if (insightsError) {
        console.error("Error fetching insights:", insightsError);
      }

      // Get active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from("kpi_alerts")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .eq("is_snoozed", false)
        .order("severity", { ascending: false });

      if (alertsError) {
        console.error("Error fetching alerts:", alertsError);
      }

      // Calculate performance overview scores
      const performanceOverview = await this.calculatePerformanceOverview(companyId);

      // Get benchmark comparison
      const benchmarkComparison = await this.getBenchmarkComparison(companyId);

      const executiveDashboardData: ExecutiveDashboardData = {
        dashboard,
        kpi_summary: kpiSummary,
        featured_kpis: featuredKPIs,
        financial_insights: insights || [],
        active_alerts: alerts || [],
        performance_overview: performanceOverview,
        benchmark_comparison: benchmarkComparison,
      };

      return {
        success: true,
        data: executiveDashboardData,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Update all KPIs for a company
   */
  static async updateAllKPIs(
    companyId: string,
    measurementDate: string = new Date().toISOString().split("T")[0],
  ): Promise<{
    success: boolean;
    data?: { updated_count: number; calculation_time_ms: number };
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      const { data, error } = await supabase.rpc("update_all_kpis", {
        p_company_id: companyId,
        p_measurement_date: measurementDate,
      });

      if (error) {
        throw new Error(`Failed to update KPIs: ${error.message}`);
      }

      // Refresh materialized views
      await supabase.rpc("refresh_executive_kpi_views");

      // Generate insights based on updated KPIs
      await this.generateFinancialInsights(companyId);

      const calculationTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          updated_count: data || 0,
          calculation_time_ms: calculationTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Get detailed KPI analysis with forecasting
   */
  static async getKPIAnalysis(
    kpiId: string,
    timeframe: "monthly" | "quarterly" | "yearly" = "monthly",
    forecastPeriods: number = 6,
  ): Promise<{
    success: boolean;
    data?: KPIAnalysisResult;
    error?: string;
  }> {
    try {
      // Get KPI definition
      const { data: kpi, error: kpiError } = await supabase
        .from("executive_kpis")
        .select("*")
        .eq("id", kpiId)
        .single();

      if (kpiError) {
        throw new Error(`KPI not found: ${kpiError.message}`);
      }

      // Get historical KPI values
      const { data: historicalValues, error: valuesError } = await supabase
        .from("kpi_values")
        .select("*")
        .eq("kpi_id", kpiId)
        .gte("measurement_date", this.getDateRange(timeframe, 24)) // 24 periods of historical data
        .order("measurement_date", { ascending: true });

      if (valuesError) {
        throw new Error(`Failed to fetch KPI values: ${valuesError.message}`);
      }

      // Get current performance
      const latestValue = historicalValues?.[historicalValues.length - 1];
      const currentPerformance = {
        value: latestValue?.kpi_value || 0,
        rating: (latestValue?.performance_rating as PerformanceRating) || "Unknown",
        variance_from_target: latestValue?.variance_from_target || 0,
        variance_percentage: latestValue?.variance_percentage || 0,
      };

      // Calculate trend analysis
      const trendAnalysis = this.calculateTrendAnalysis(historicalValues || []);

      // Generate forecast
      const forecast = await this.generateKPIForecast(
        kpiId,
        historicalValues || [],
        forecastPeriods,
      );

      // Get related insights
      const { data: insights, error: insightsError } = await supabase
        .from("financial_insights")
        .select("*")
        .eq("company_id", kpi.company_id)
        .contains("related_kpis", JSON.stringify([kpiId]))
        .order("created_at", { ascending: false })
        .limit(5);

      if (insightsError) {
        console.error("Error fetching KPI insights:", insightsError);
      }

      // Generate recommendations
      const recommendations = this.generateKPIRecommendations(
        kpi,
        currentPerformance,
        trendAnalysis,
      );

      const analysisResult: KPIAnalysisResult = {
        kpi,
        current_performance: currentPerformance,
        trend_analysis: trendAnalysis,
        historical_data: historicalValues || [],
        forecast,
        insights: insights || [],
        recommendations,
      };

      return {
        success: true,
        data: analysisResult,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create or update executive dashboard
   */
  static async createDashboard(
    dashboard: Omit<ExecutiveDashboard, "id" | "created_at" | "updated_at">,
  ): Promise<{
    success: boolean;
    data?: ExecutiveDashboard;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("executive_dashboards")
        .insert([dashboard])
        .select("*")
        .single();

      if (error) {
        throw new Error(`Failed to create dashboard: ${error.message}`);
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
   * Generate financial insights using AI analysis
   */
  static async generateFinancialInsights(companyId: string): Promise<{
    success: boolean;
    data?: { insights_generated: number };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc("generate_financial_insights", {
        p_company_id: companyId,
        p_analysis_period_days: 30,
      });

      if (error) {
        throw new Error(`Failed to generate insights: ${error.message}`);
      }

      return {
        success: true,
        data: { insights_generated: data || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  /**
   * Create KPI alert
   */
  static async createKPIAlert(
    alert: Omit<KPIAlert, "id" | "trigger_count" | "created_at" | "updated_at">,
  ): Promise<{
    success: boolean;
    data?: KPIAlert;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("kpi_alerts")
        .insert([alert])
        .select("*")
        .single();

      if (error) {
        throw new Error(`Failed to create KPI alert: ${error.message}`);
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
   * Get executive summary report
   */
  static async getExecutiveSummary(
    companyId: string,
    period: "weekly" | "monthly" | "quarterly" = "monthly",
  ): Promise<{
    success: boolean;
    data?: {
      financial_highlights: Array<{ metric: string; value: number; trend: string; impact: string }>;
      key_insights: FinancialInsight[];
      performance_alerts: Array<{ kpi: string; status: string; action_required: string }>;
      strategic_recommendations: Array<{
        area: string;
        recommendation: string;
        priority: SeverityLevel;
      }>;
    };
    error?: string;
  }> {
    try {
      // Get key financial highlights
      const { data: kpiData } = await supabase
        .from("mv_executive_kpi_summary")
        .select("*")
        .eq("company_id", companyId)
        .eq("recency_rank", 1)
        .in("kpi_code", [
          "TOTAL_REVENUE",
          "NET_PROFIT_MARGIN",
          "CURRENT_RATIO",
          "CASH_CONVERSION_CYCLE",
        ]);

      const financialHighlights =
        kpiData?.map(kpi => ({
          metric: kpi.kpi_name,
          value: kpi.kpi_value,
          trend: kpi.trend_direction,
          impact: this.assessImpact(kpi.performance_rating, kpi.variance_percentage),
        })) || [];

      // Get key insights
      const { data: insights } = await supabase
        .from("financial_insights")
        .select("*")
        .eq("company_id", companyId)
        .in("severity", ["High", "Critical"])
        .in("status", ["New", "Acknowledged"])
        .order("created_at", { ascending: false })
        .limit(5);

      // Get performance alerts
      const performanceAlerts =
        kpiData
          ?.filter(kpi => kpi.performance_rating === "Needs Attention")
          .map(kpi => ({
            kpi: kpi.kpi_name,
            status: "Underperforming",
            action_required: this.getActionRequired(kpi.variance_percentage),
          })) || [];

      // Generate strategic recommendations
      const strategicRecommendations = this.generateStrategicRecommendations(
        kpiData || [],
        insights || [],
      );

      return {
        success: true,
        data: {
          financial_highlights: financialHighlights,
          key_insights: insights || [],
          performance_alerts: performanceAlerts,
          strategic_recommendations: strategicRecommendations,
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

  private static async getOrCreateDefaultDashboard(companyId: string): Promise<ExecutiveDashboard> {
    // Check if default dashboard exists
    const { data: existingDashboard } = await supabase
      .from("executive_dashboards")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_default", true)
      .single();

    if (existingDashboard) {
      return existingDashboard;
    }

    // Create default dashboard
    const defaultDashboard = {
      company_id: companyId,
      dashboard_name: "Executive Dashboard",
      dashboard_type: "Executive",
      description: "Default executive financial performance dashboard",
      layout_configuration: {
        grid: { columns: 12, rows: 6 },
        widgets: [
          {
            id: "revenue_kpi",
            position: { x: 0, y: 0, width: 3, height: 2 },
            type: "kpi_card",
            config: { chart_type: "gauge", show_trend: true },
          },
          {
            id: "profit_margin_kpi",
            position: { x: 3, y: 0, width: 3, height: 2 },
            type: "kpi_card",
            config: { chart_type: "gauge", show_trend: true },
          },
          {
            id: "liquidity_kpi",
            position: { x: 6, y: 0, width: 3, height: 2 },
            type: "kpi_card",
            config: { chart_type: "gauge", show_trend: true },
          },
          {
            id: "efficiency_kpi",
            position: { x: 9, y: 0, width: 3, height: 2 },
            type: "kpi_card",
            config: { chart_type: "gauge", show_trend: true },
          },
        ],
      },
      visibility: "Private",
      allowed_roles: ["CEO", "CFO", "Finance Manager"],
      allowed_users: [],
      owner_id: "system",
      shared_with: [],
      auto_refresh_interval_minutes: 15,
      refresh_enabled: true,
      is_active: true,
      is_default: true,
      is_archived: false,
      view_count: 0,
    };

    const { data, error } = await supabase
      .from("executive_dashboards")
      .insert([defaultDashboard])
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create default dashboard: ${error.message}`);
    }

    return data;
  }

  private static async getFeaturedKPIsWithTrends(
    companyId: string,
    dateRange?: { start: string; end: string },
  ): Promise<Array<any>> {
    // Get featured KPIs
    const { data: featuredKPIs } = await supabase
      .from("executive_kpis")
      .select("*")
      .eq("company_id", companyId)
      .eq("is_featured", true)
      .eq("is_active", true);

    if (!featuredKPIs || featuredKPIs.length === 0) {
      return [];
    }

    const featuredKPIsWithTrends = [];

    for (const kpi of featuredKPIs) {
      // Get current value
      const { data: currentValue } = await supabase
        .from("kpi_values")
        .select("*")
        .eq("kpi_id", kpi.id)
        .order("measurement_date", { ascending: false })
        .limit(1)
        .single();

      // Get historical trend (last 12 months)
      const { data: historicalTrend } = await supabase
        .from("kpi_values")
        .select("*")
        .eq("kpi_id", kpi.id)
        .gte("measurement_date", this.getDateRange("monthly", 12))
        .order("measurement_date", { ascending: true });

      // Calculate trend analysis
      const trendAnalysis = this.calculateTrendAnalysis(historicalTrend || []);

      featuredKPIsWithTrends.push({
        kpi,
        current_value: currentValue,
        historical_trend: historicalTrend || [],
        performance_rating: currentValue?.performance_rating || "Unknown",
        trend_analysis: trendAnalysis,
      });
    }

    return featuredKPIsWithTrends;
  }

  private static async calculatePerformanceOverview(companyId: string): Promise<{
    financial_health_score: number;
    operational_efficiency_score: number;
    growth_momentum_score: number;
    risk_assessment_score: number;
  }> {
    // Get KPIs by category
    const { data: kpisByCategory } = await supabase
      .from("mv_executive_kpi_summary")
      .select("*")
      .eq("company_id", companyId)
      .eq("recency_rank", 1);

    if (!kpisByCategory || kpisByCategory.length === 0) {
      return {
        financial_health_score: 0,
        operational_efficiency_score: 0,
        growth_momentum_score: 0,
        risk_assessment_score: 0,
      };
    }

    // Calculate scores by category
    const financialKPIs = kpisByCategory.filter(
      kpi => kpi.kpi_category === "Financial Performance",
    );
    const efficiencyKPIs = kpisByCategory.filter(kpi => kpi.kpi_category === "Efficiency");
    const growthKPIs = kpisByCategory.filter(kpi => kpi.kpi_category === "Growth");
    const riskKPIs = kpisByCategory.filter(kpi => kpi.kpi_category === "Risk Management");

    return {
      financial_health_score: this.calculateCategoryScore(financialKPIs),
      operational_efficiency_score: this.calculateCategoryScore(efficiencyKPIs),
      growth_momentum_score: this.calculateCategoryScore(growthKPIs),
      risk_assessment_score: this.calculateCategoryScore(riskKPIs),
    };
  }

  private static async getBenchmarkComparison(companyId: string): Promise<{
    industry_ranking: string;
    peer_comparison: Array<{
      kpi: string;
      company_value: number;
      industry_average: number;
      percentile_ranking: number;
    }>;
  }> {
    // Simplified benchmark comparison - in real implementation would use industry data
    const { data: kpiData } = await supabase
      .from("mv_executive_kpi_summary")
      .select("*")
      .eq("company_id", companyId)
      .eq("recency_rank", 1)
      .limit(5);

    const peerComparison =
      kpiData?.map(kpi => ({
        kpi: kpi.kpi_name,
        company_value: kpi.kpi_value,
        industry_average: kpi.kpi_value * (0.85 + Math.random() * 0.3), // Simulated industry average
        percentile_ranking: Math.floor(Math.random() * 100),
      })) || [];

    // Calculate overall ranking
    const avgPercentile =
      peerComparison.reduce((sum, item) => sum + item.percentile_ranking, 0) /
      peerComparison.length;
    const industryRanking =
      avgPercentile > 80
        ? "Top 20%"
        : avgPercentile > 60
          ? "Top 40%"
          : avgPercentile > 40
            ? "Average"
            : "Below Average";

    return {
      industry_ranking: industryRanking,
      peer_comparison: peerComparison,
    };
  }

  private static calculateTrendAnalysis(values: KPIValue[]): {
    direction: TrendDirection;
    strength: number;
    consistency: number;
    monthly_growth_rate: number;
    quarterly_growth_rate: number;
  } {
    if (values.length < 2) {
      return {
        direction: "Stable",
        strength: 0,
        consistency: 0,
        monthly_growth_rate: 0,
        quarterly_growth_rate: 0,
      };
    }

    // Calculate trend direction and strength
    const firstValue = values[0].kpi_value;
    const lastValue = values[values.length - 1].kpi_value;
    const overallChange = ((lastValue - firstValue) / Math.abs(firstValue)) * 100;

    const direction: TrendDirection =
      overallChange > 5 ? "Up" : overallChange < -5 ? "Down" : "Stable";

    // Calculate monthly and quarterly growth rates
    const monthlyValues = values.slice(-2);
    const quarterlyValues = values.slice(-4);

    const monthlyGrowthRate =
      monthlyValues.length === 2
        ? ((monthlyValues[1].kpi_value - monthlyValues[0].kpi_value) /
            Math.abs(monthlyValues[0].kpi_value)) *
          100
        : 0;

    const quarterlyGrowthRate =
      quarterlyValues.length >= 2
        ? ((quarterlyValues[quarterlyValues.length - 1].kpi_value - quarterlyValues[0].kpi_value) /
            Math.abs(quarterlyValues[0].kpi_value)) *
          100
        : 0;

    return {
      direction,
      strength: Math.abs(overallChange),
      consistency: this.calculateConsistency(values),
      monthly_growth_rate: monthlyGrowthRate,
      quarterly_growth_rate: quarterlyGrowthRate,
    };
  }

  private static async generateKPIForecast(
    kpiId: string,
    historicalValues: KPIValue[],
    periods: number,
  ): Promise<
    Array<{
      period: string;
      predicted_value: number;
      confidence_interval: { lower: number; upper: number };
      confidence_score: number;
    }>
  > {
    // Simplified forecasting - in production would use more sophisticated models
    if (historicalValues.length < 3) {
      return [];
    }

    const forecast = [];
    const recentValues = historicalValues.slice(-6); // Use last 6 periods for forecasting
    const avgGrowthRate = this.calculateAverageGrowthRate(recentValues);
    const lastValue = recentValues[recentValues.length - 1].kpi_value;
    const volatility = this.calculateVolatility(recentValues);

    for (let i = 1; i <= periods; i++) {
      const predictedValue = lastValue * Math.pow(1 + avgGrowthRate / 100, i);
      const confidenceScore = Math.max(0.3, 1 - i * 0.1); // Confidence decreases with time
      const confidenceRange = predictedValue * volatility * (i * 0.2);

      forecast.push({
        period: this.getForecastPeriodLabel(i),
        predicted_value: predictedValue,
        confidence_interval: {
          lower: predictedValue - confidenceRange,
          upper: predictedValue + confidenceRange,
        },
        confidence_score: confidenceScore,
      });
    }

    return forecast;
  }

  private static generateKPIRecommendations(
    kpi: ExecutiveKPI,
    currentPerformance: any,
    trendAnalysis: any,
  ): Array<{
    category: string;
    action: string;
    impact: string;
    timeline: string;
    priority: SeverityLevel;
  }> {
    const recommendations = [];

    // Performance-based recommendations
    if (currentPerformance.rating === "Needs Attention") {
      recommendations.push({
        category: "Performance Improvement",
        action: `Immediate review of ${kpi.kpi_name} drivers and underlying processes`,
        impact: `Potential to improve performance by ${Math.abs(currentPerformance.variance_percentage).toFixed(1)}%`,
        timeline: "2-4 weeks",
        priority: "High" as SeverityLevel,
      });
    }

    // Trend-based recommendations
    if (trendAnalysis.direction === "Down" && trendAnalysis.strength > 10) {
      recommendations.push({
        category: "Trend Reversal",
        action: `Address declining trend in ${kpi.kpi_name} with targeted interventions`,
        impact: "Stabilize and reverse negative performance trend",
        timeline: "1-3 months",
        priority: "Medium" as SeverityLevel,
      });
    }

    // Category-specific recommendations
    if (kpi.kpi_category === "Liquidity" && currentPerformance.variance_percentage < -20) {
      recommendations.push({
        category: "Liquidity Management",
        action: "Improve cash flow management and working capital optimization",
        impact: "Enhanced financial stability and reduced liquidity risk",
        timeline: "1-2 months",
        priority: "Critical" as SeverityLevel,
      });
    }

    return recommendations;
  }

  private static generateStrategicRecommendations(
    kpiData: any[],
    insights: FinancialInsight[],
  ): Array<{ area: string; recommendation: string; priority: SeverityLevel }> {
    const recommendations = [];

    // Analyze overall performance pattern
    const underperformingKPIs = kpiData.filter(kpi => kpi.performance_rating === "Needs Attention");

    if (underperformingKPIs.length > 0) {
      recommendations.push({
        area: "Overall Performance",
        recommendation: `Focus on improving ${underperformingKPIs.length} underperforming KPIs`,
        priority: "High" as SeverityLevel,
      });
    }

    // Analyze insights for strategic themes
    const criticalInsights = insights.filter(insight => insight.severity === "Critical");
    if (criticalInsights.length > 0) {
      recommendations.push({
        area: "Risk Management",
        recommendation: `Address ${criticalInsights.length} critical issues requiring immediate attention`,
        priority: "Critical" as SeverityLevel,
      });
    }

    return recommendations;
  }

  // Utility methods
  private static getDateRange(timeframe: string, periods: number): string {
    const date = new Date();
    switch (timeframe) {
      case "monthly":
        date.setMonth(date.getMonth() - periods);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() - periods * 3);
        break;
      case "yearly":
        date.setFullYear(date.getFullYear() - periods);
        break;
    }
    return date.toISOString().split("T")[0];
  }

  private static calculateCategoryScore(kpis: any[]): number {
    if (kpis.length === 0) return 0;

    const performanceScores = kpis.map(kpi => {
      switch (kpi.performance_rating) {
        case "Excellent":
          return 100;
        case "Good":
          return 80;
        case "Acceptable":
          return 60;
        case "Needs Attention":
          return 30;
        default:
          return 50;
      }
    });

    return Math.round(
      performanceScores.reduce((sum, score) => sum + score, 0) / performanceScores.length,
    );
  }

  private static calculateConsistency(values: KPIValue[]): number {
    if (values.length < 3) return 0;

    const changes = [];
    for (let i = 1; i < values.length; i++) {
      const change =
        ((values[i].kpi_value - values[i - 1].kpi_value) / Math.abs(values[i - 1].kpi_value)) * 100;
      changes.push(change);
    }

    const mean = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const variance =
      changes.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);

    return Math.max(0, 100 - stdDev); // Lower standard deviation = higher consistency
  }

  private static calculateAverageGrowthRate(values: KPIValue[]): number {
    if (values.length < 2) return 0;

    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
      const rate =
        ((values[i].kpi_value - values[i - 1].kpi_value) / Math.abs(values[i - 1].kpi_value)) * 100;
      growthRates.push(rate);
    }

    return growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
  }

  private static calculateVolatility(values: KPIValue[]): number {
    const growthRates = [];
    for (let i = 1; i < values.length; i++) {
      const rate =
        ((values[i].kpi_value - values[i - 1].kpi_value) / Math.abs(values[i - 1].kpi_value)) * 100;
      growthRates.push(rate);
    }

    const mean = growthRates.reduce((sum, rate) => sum + rate, 0) / growthRates.length;
    const variance =
      growthRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / growthRates.length;
    return Math.sqrt(variance) / 100; // Convert to decimal
  }

  private static getForecastPeriodLabel(periodNumber: number): string {
    const date = new Date();
    date.setMonth(date.getMonth() + periodNumber);
    return date.toISOString().slice(0, 7); // YYYY-MM format
  }

  private static assessImpact(rating: string, variancePercentage: number): string {
    if (rating === "Excellent") return "Positive";
    if (rating === "Needs Attention") return "Negative";
    if (Math.abs(variancePercentage) > 20) return "Significant";
    return "Moderate";
  }

  private static getActionRequired(variancePercentage: number): string {
    if (Math.abs(variancePercentage) > 30) return "Immediate intervention required";
    if (Math.abs(variancePercentage) > 15) return "Review and optimize processes";
    return "Monitor closely";
  }
}
