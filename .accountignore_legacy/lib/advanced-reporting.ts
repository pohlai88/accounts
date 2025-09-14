/**
 * Advanced Reporting & Analytics Engine
 * Comprehensive reporting system with dashboards, KPIs, and trend analysis
 * Built on top of the flexible analysis framework
 */

import { supabase } from "./supabase";
import { FlexibleAnalysisEngine, AnalysisConfig, AnalysisResult } from "./flexible-analysis-engine";

export type ReportType =
  | "dashboard"
  | "financial_ratios"
  | "trend_analysis"
  | "custom_report"
  | "scheduled_report";

export type KPIType =
  | "revenue_growth"
  | "profit_margin"
  | "cash_flow"
  | "debt_ratio"
  | "current_ratio"
  | "quick_ratio"
  | "inventory_turnover"
  | "receivables_turnover"
  | "payables_turnover"
  | "roi"
  | "roa"
  | "roe";

export type TrendPeriod = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardWidget {
  id: string;
  type: "kpi" | "chart" | "table" | "gauge" | "trend" | "comparison";
  title: string;
  config: WidgetConfig;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval?: number; // in seconds
}

export interface WidgetConfig {
  dataSource: "analysis" | "direct_query" | "calculated";
  query?: string;
  analysisConfigId?: string;
  kpiType?: KPIType;
  chartType?: "line" | "bar" | "pie" | "area" | "scatter" | "heatmap";
  filters?: Record<string, any>;
  timeRange?: {
    start: string;
    end: string;
    period: TrendPeriod;
  };
  aggregation?: "sum" | "average" | "count" | "min" | "max";
  comparisonPeriod?: "previous" | "same_period_last_year" | "custom";
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface FinancialRatio {
  id: string;
  name: string;
  category: "liquidity" | "profitability" | "efficiency" | "leverage" | "market";
  formula: string;
  description: string;
  interpretation: string;
  benchmark?: number;
  isHigherBetter: boolean;
}

export interface TrendAnalysis {
  id: string;
  name: string;
  companyId: string;
  metric: string;
  period: TrendPeriod;
  dataPoints: TrendDataPoint[];
  forecast?: ForecastData;
  seasonality?: SeasonalityData;
  anomalies?: AnomalyData[];
  createdBy: string;
  createdAt: string;
}

export interface TrendDataPoint {
  date: string;
  value: number;
  change?: number;
  changePercent?: number;
}

export interface ForecastData {
  method: "linear" | "exponential" | "seasonal" | "arima";
  confidence: number;
  predictions: TrendDataPoint[];
  accuracy?: number;
}

export interface SeasonalityData {
  period: number;
  strength: number;
  pattern: number[];
}

export interface AnomalyData {
  date: string;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: "low" | "medium" | "high";
  description: string;
}

export interface CustomReport {
  id: string;
  name: string;
  description?: string;
  companyId: string;
  reportType: ReportType;
  config: ReportConfig;
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportConfig {
  dataSource: "gl_entries" | "invoices" | "payments" | "analysis";
  filters: Record<string, any>;
  grouping: string[];
  sorting: Array<{ field: string; direction: "asc" | "desc" }>;
  aggregations: Array<{ field: string; function: string }>;
  format: "table" | "chart" | "pivot";
  chartConfig?: {
    type: string;
    xAxis: string;
    yAxis: string[];
    colors?: string[];
  };
}

export interface ScheduledReport {
  id: string;
  name: string;
  reportId: string;
  schedule: {
    frequency: "daily" | "weekly" | "monthly" | "quarterly";
    dayOfWeek?: number; // 0-6 for weekly
    dayOfMonth?: number; // 1-31 for monthly
    time: string; // HH:MM format
    timezone: string;
  };
  recipients: string[];
  format: "pdf" | "excel" | "csv" | "email";
  isActive: boolean;
  lastRun?: string;
  nextRun?: string;
  createdBy: string;
  createdAt: string;
}

/**
 * Advanced Reporting Engine
 */
export class AdvancedReportingEngine {
  /**
   * Create dashboard
   */
  static async createDashboard(
    dashboard: Omit<Dashboard, "id" | "createdAt" | "updatedAt">,
  ): Promise<{
    success: boolean;
    dashboard?: Dashboard;
    error?: string;
  }> {
    try {
      const { data: newDashboard, error } = await supabase
        .from("dashboards")
        .insert([
          {
            ...dashboard,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, dashboard: newDashboard };
    } catch (error) {
      console.error("Error creating dashboard:", error);
      return { success: false, error: "Failed to create dashboard" };
    }
  }

  /**
   * Get dashboard with real-time data
   */
  static async getDashboard(
    dashboardId: string,
    companyId: string,
  ): Promise<{
    success: boolean;
    dashboard?: Dashboard;
    data?: Record<string, any>;
    error?: string;
  }> {
    try {
      // Get dashboard configuration
      const { data: dashboard, error: dashboardError } = await supabase
        .from("dashboards")
        .select("*")
        .eq("id", dashboardId)
        .eq("company_id", companyId)
        .single();

      if (dashboardError) throw dashboardError;
      if (!dashboard) {
        return { success: false, error: "Dashboard not found" };
      }

      // Get real-time data for all widgets
      const widgetData: Record<string, any> = {};

      for (const widget of dashboard.widgets) {
        const data = await this.getWidgetData(widget, companyId);
        widgetData[widget.id] = data;
      }

      return { success: true, dashboard, data: widgetData };
    } catch (error) {
      console.error("Error getting dashboard:", error);
      return { success: false, error: "Failed to get dashboard" };
    }
  }

  /**
   * Get widget data
   */
  private static async getWidgetData(widget: DashboardWidget, companyId: string): Promise<any> {
    try {
      switch (widget.config.dataSource) {
        case "analysis":
          if (widget.config.analysisConfigId) {
            const result = await FlexibleAnalysisEngine.executeAnalysis(
              widget.config.analysisConfigId,
              companyId,
            );
            return result.success ? result.result : null;
          }
          break;

        case "direct_query":
          if (widget.config.query) {
            const { data, error } = await supabase.rpc("execute_custom_query", {
              query_sql: widget.config.query,
              company_id: companyId,
            });
            return error ? null : data;
          }
          break;

        case "calculated":
          return await this.calculateKPI(widget.config.kpiType!, companyId);
      }

      return null;
    } catch (error) {
      console.error("Error getting widget data:", error);
      return null;
    }
  }

  /**
   * Calculate KPI
   */
  private static async calculateKPI(
    kpiType: KPIType,
    companyId: string,
  ): Promise<{
    value: number;
    change?: number;
    changePercent?: number;
    trend?: "up" | "down" | "stable";
    benchmark?: number;
  }> {
    try {
      const ratios = await this.getFinancialRatios();
      const ratio = ratios.find(r => r.id === kpiType);

      if (!ratio) {
        return { value: 0 };
      }

      // Calculate the ratio based on the formula
      const value = await this.evaluateFormula(ratio.formula, companyId);

      // Get previous period value for comparison
      const previousValue = await this.evaluateFormula(ratio.formula, companyId, {
        period: "previous",
      });

      const change = value - previousValue;
      const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;
      const trend = change > 0 ? "up" : change < 0 ? "down" : "stable";

      return {
        value,
        change,
        changePercent,
        trend,
        benchmark: ratio.benchmark,
      };
    } catch (error) {
      console.error("Error calculating KPI:", error);
      return { value: 0 };
    }
  }

  /**
   * Get financial ratios definitions
   */
  private static async getFinancialRatios(): Promise<FinancialRatio[]> {
    return [
      {
        id: "revenue_growth",
        name: "Revenue Growth",
        category: "profitability",
        formula: "(current_revenue - previous_revenue) / previous_revenue * 100",
        description: "Percentage change in revenue over time",
        interpretation: "Higher is better. Indicates business growth.",
        isHigherBetter: true,
      },
      {
        id: "profit_margin",
        name: "Profit Margin",
        category: "profitability",
        formula: "net_income / revenue * 100",
        description: "Percentage of revenue that becomes profit",
        interpretation: "Higher is better. Indicates operational efficiency.",
        benchmark: 10,
        isHigherBetter: true,
      },
      {
        id: "current_ratio",
        name: "Current Ratio",
        category: "liquidity",
        formula: "current_assets / current_liabilities",
        description: "Ability to pay short-term obligations",
        interpretation: "1.5-2.0 is ideal. Too high = inefficient, too low = risky.",
        benchmark: 2,
        isHigherBetter: true,
      },
      {
        id: "quick_ratio",
        name: "Quick Ratio",
        category: "liquidity",
        formula: "(current_assets - inventory) / current_liabilities",
        description: "Liquidity without relying on inventory",
        interpretation: "1.0+ is good. More conservative than current ratio.",
        benchmark: 1,
        isHigherBetter: true,
      },
      {
        id: "debt_ratio",
        name: "Debt Ratio",
        category: "leverage",
        formula: "total_debt / total_assets",
        description: "Percentage of assets financed by debt",
        interpretation: "Lower is better. Indicates financial stability.",
        isHigherBetter: false,
      },
      {
        id: "roi",
        name: "Return on Investment",
        category: "profitability",
        formula: "net_income / total_investment * 100",
        description: "Return generated on investment",
        interpretation: "Higher is better. Indicates investment efficiency.",
        isHigherBetter: true,
      },
      {
        id: "roa",
        name: "Return on Assets",
        category: "profitability",
        formula: "net_income / total_assets * 100",
        description: "How efficiently assets generate profit",
        interpretation: "Higher is better. Indicates asset utilization.",
        isHigherBetter: true,
      },
      {
        id: "roe",
        name: "Return on Equity",
        category: "profitability",
        formula: "net_income / total_equity * 100",
        description: "Return generated on shareholders' equity",
        interpretation: "Higher is better. Indicates shareholder value creation.",
        isHigherBetter: true,
      },
    ];
  }

  /**
   * Evaluate formula
   */
  private static async evaluateFormula(
    formula: string,
    companyId: string,
    options?: { period?: "current" | "previous" },
  ): Promise<number> {
    try {
      // This is a simplified formula evaluator
      // In a real implementation, you'd have a proper formula parser

      const period = options?.period || "current";
      const dateFilter =
        period === "previous"
          ? { start: "2023-01-01", end: "2023-12-31" }
          : { start: "2024-01-01", end: "2024-12-31" };

      // Parse formula and execute queries
      if (formula.includes("revenue")) {
        const { data } = await supabase
          .from("gl_entries")
          .select("credit")
          .eq("company_id", companyId)
          .eq("account_type", "Income")
          .gte("posting_date", dateFilter.start)
          .lte("posting_date", dateFilter.end);

        return data?.reduce((sum, row) => sum + (row.credit || 0), 0) || 0;
      }

      if (formula.includes("net_income")) {
        const revenue = await this.evaluateFormula("revenue", companyId, options);
        const expenses = await this.evaluateFormula("expenses", companyId, options);
        return revenue - expenses;
      }

      if (formula.includes("current_assets")) {
        const { data } = await supabase
          .from("gl_entries")
          .select("debit, credit")
          .eq("company_id", companyId)
          .eq("account_type", "Asset")
          .gte("posting_date", dateFilter.start)
          .lte("posting_date", dateFilter.end);

        return data?.reduce((sum, row) => sum + (row.debit || 0) - (row.credit || 0), 0) || 0;
      }

      if (formula.includes("current_liabilities")) {
        const { data } = await supabase
          .from("gl_entries")
          .select("debit, credit")
          .eq("company_id", companyId)
          .eq("account_type", "Liability")
          .gte("posting_date", dateFilter.start)
          .lte("posting_date", dateFilter.end);

        return data?.reduce((sum, row) => sum + (row.credit || 0) - (row.debit || 0), 0) || 0;
      }

      return 0;
    } catch (error) {
      console.error("Error evaluating formula:", error);
      return 0;
    }
  }

  /**
   * Create trend analysis
   */
  static async createTrendAnalysis(
    trendAnalysis: Omit<TrendAnalysis, "id" | "createdAt">,
  ): Promise<{
    success: boolean;
    trendAnalysis?: TrendAnalysis;
    error?: string;
  }> {
    try {
      // Generate trend data points
      const dataPoints = await this.generateTrendDataPoints(
        trendAnalysis.metric,
        trendAnalysis.period,
        trendAnalysis.companyId,
      );

      // Detect anomalies
      const anomalies = this.detectAnomalies(dataPoints);

      // Generate forecast
      const forecast = await this.generateForecast(dataPoints, trendAnalysis.period);

      // Detect seasonality
      const seasonality = this.detectSeasonality(dataPoints, trendAnalysis.period);

      const completeTrendAnalysis: TrendAnalysis = {
        ...trendAnalysis,
        id: crypto.randomUUID(),
        dataPoints,
        anomalies,
        forecast,
        seasonality,
        createdAt: new Date().toISOString(),
      };

      const { data: savedTrend, error } = await supabase
        .from("trend_analyses")
        .insert([completeTrendAnalysis])
        .select()
        .single();

      if (error) throw error;

      return { success: true, trendAnalysis: savedTrend };
    } catch (error) {
      console.error("Error creating trend analysis:", error);
      return { success: false, error: "Failed to create trend analysis" };
    }
  }

  /**
   * Generate trend data points
   */
  private static async generateTrendDataPoints(
    metric: string,
    period: TrendPeriod,
    companyId: string,
  ): Promise<TrendDataPoint[]> {
    try {
      const dataPoints: TrendDataPoint[] = [];
      const endDate = new Date();
      const startDate = new Date();

      // Calculate start date based on period
      switch (period) {
        case "daily":
          startDate.setDate(endDate.getDate() - 30);
          break;
        case "weekly":
          startDate.setDate(endDate.getDate() - 52 * 7);
          break;
        case "monthly":
          startDate.setMonth(endDate.getMonth() - 12);
          break;
        case "quarterly":
          startDate.setMonth(endDate.getMonth() - 12);
          break;
        case "yearly":
          startDate.setFullYear(endDate.getFullYear() - 5);
          break;
      }

      // Generate data points based on metric
      const value = await this.evaluateFormula(metric, companyId);

      // Create mock trend data (in real implementation, this would query actual data)
      const periods = this.generatePeriods(startDate, endDate, period);

      for (let i = 0; i < periods.length; i++) {
        const date = periods[i];
        const baseValue = value * (0.8 + Math.random() * 0.4); // Add some variation
        const previousValue = i > 0 ? dataPoints[i - 1].value : baseValue;
        const change = baseValue - previousValue;
        const changePercent = previousValue !== 0 ? (change / previousValue) * 100 : 0;

        dataPoints.push({
          date: date.toISOString().split("T")[0],
          value: baseValue,
          change,
          changePercent,
        });
      }

      return dataPoints;
    } catch (error) {
      console.error("Error generating trend data points:", error);
      return [];
    }
  }

  /**
   * Generate periods
   */
  private static generatePeriods(startDate: Date, endDate: Date, period: TrendPeriod): Date[] {
    const periods: Date[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      periods.push(new Date(current));

      switch (period) {
        case "daily":
          current.setDate(current.getDate() + 1);
          break;
        case "weekly":
          current.setDate(current.getDate() + 7);
          break;
        case "monthly":
          current.setMonth(current.getMonth() + 1);
          break;
        case "quarterly":
          current.setMonth(current.getMonth() + 3);
          break;
        case "yearly":
          current.setFullYear(current.getFullYear() + 1);
          break;
      }
    }

    return periods;
  }

  /**
   * Detect anomalies
   */
  private static detectAnomalies(dataPoints: TrendDataPoint[]): AnomalyData[] {
    const anomalies: AnomalyData[] = [];

    if (dataPoints.length < 3) return anomalies;

    // Calculate moving average and standard deviation
    const values = dataPoints.map(dp => dp.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Detect outliers (values more than 2 standard deviations from mean)
    for (let i = 0; i < dataPoints.length; i++) {
      const point = dataPoints[i];
      const deviation = Math.abs(point.value - mean);

      if (deviation > 2 * stdDev) {
        const severity =
          deviation > 3 * stdDev ? "high" : deviation > 2.5 * stdDev ? "medium" : "low";

        anomalies.push({
          date: point.date,
          value: point.value,
          expectedValue: mean,
          deviation,
          severity,
          description: `Value ${point.value.toFixed(2)} is ${deviation.toFixed(2)} away from expected ${mean.toFixed(2)}`,
        });
      }
    }

    return anomalies;
  }

  /**
   * Generate forecast
   */
  private static async generateForecast(
    dataPoints: TrendDataPoint[],
    period: TrendPeriod,
  ): Promise<ForecastData> {
    if (dataPoints.length < 2) {
      return {
        method: "linear",
        confidence: 0,
        predictions: [],
      };
    }

    // Simple linear regression for forecasting
    const n = dataPoints.length;
    const x = dataPoints.map((_, i) => i);
    const y = dataPoints.map(dp => dp.value);

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Generate predictions for next 6 periods
    const predictions: TrendDataPoint[] = [];
    const lastDate = new Date(dataPoints[dataPoints.length - 1].date);

    for (let i = 1; i <= 6; i++) {
      const predictedValue = slope * (n + i - 1) + intercept;
      const nextDate = new Date(lastDate);

      switch (period) {
        case "daily":
          nextDate.setDate(lastDate.getDate() + i);
          break;
        case "weekly":
          nextDate.setDate(lastDate.getDate() + i * 7);
          break;
        case "monthly":
          nextDate.setMonth(lastDate.getMonth() + i);
          break;
        case "quarterly":
          nextDate.setMonth(lastDate.getMonth() + i * 3);
          break;
        case "yearly":
          nextDate.setFullYear(lastDate.getFullYear() + i);
          break;
      }

      predictions.push({
        date: nextDate.toISOString().split("T")[0],
        value: predictedValue,
      });
    }

    return {
      method: "linear",
      confidence: 0.8, // Simplified confidence calculation
      predictions,
    };
  }

  /**
   * Detect seasonality
   */
  private static detectSeasonality(
    dataPoints: TrendDataPoint[],
    period: TrendPeriod,
  ): SeasonalityData | undefined {
    if (dataPoints.length < 12) return undefined;

    const values = dataPoints.map(dp => dp.value);
    const seasonalPeriod = this.getSeasonalPeriod(period);

    if (seasonalPeriod <= 1) return undefined;

    // Calculate seasonal pattern
    const pattern: number[] = [];
    for (let i = 0; i < seasonalPeriod; i++) {
      const seasonalValues = values.filter((_, index) => index % seasonalPeriod === i);
      const avg = seasonalValues.reduce((sum, val) => sum + val, 0) / seasonalValues.length;
      pattern.push(avg);
    }

    // Calculate seasonality strength
    const overallMean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const seasonalVariance =
      pattern.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) / pattern.length;
    const totalVariance =
      values.reduce((sum, val) => sum + Math.pow(val - overallMean, 2), 0) / values.length;
    const strength = totalVariance > 0 ? seasonalVariance / totalVariance : 0;

    return {
      period: seasonalPeriod,
      strength,
      pattern,
    };
  }

  /**
   * Get seasonal period
   */
  private static getSeasonalPeriod(period: TrendPeriod): number {
    switch (period) {
      case "daily":
        return 7; // Weekly pattern
      case "weekly":
        return 4; // Monthly pattern
      case "monthly":
        return 12; // Yearly pattern
      case "quarterly":
        return 4; // Yearly pattern
      case "yearly":
        return 1; // No seasonality
      default:
        return 1;
    }
  }

  /**
   * Create custom report
   */
  static async createCustomReport(
    report: Omit<CustomReport, "id" | "createdAt" | "updatedAt">,
  ): Promise<{
    success: boolean;
    report?: CustomReport;
    error?: string;
  }> {
    try {
      const { data: newReport, error } = await supabase
        .from("custom_reports")
        .insert([
          {
            ...report,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return { success: true, report: newReport };
    } catch (error) {
      console.error("Error creating custom report:", error);
      return { success: false, error: "Failed to create custom report" };
    }
  }

  /**
   * Execute custom report
   */
  static async executeCustomReport(
    reportId: string,
    companyId: string,
  ): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const { data: report, error: reportError } = await supabase
        .from("custom_reports")
        .select("*")
        .eq("id", reportId)
        .eq("company_id", companyId)
        .single();

      if (reportError) throw reportError;
      if (!report) {
        return { success: false, error: "Report not found" };
      }

      // Execute report based on configuration
      const data = await this.executeReportQuery(report.config, companyId);

      return { success: true, data };
    } catch (error) {
      console.error("Error executing custom report:", error);
      return { success: false, error: "Failed to execute custom report" };
    }
  }

  /**
   * Execute report query
   */
  private static async executeReportQuery(config: ReportConfig, companyId: string): Promise<any[]> {
    try {
      let query = supabase.from(config.dataSource).select("*").eq("company_id", companyId);

      // Apply filters
      for (const [key, value] of Object.entries(config.filters)) {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      }

      const { data, error } = await query;

      if (error) throw error;

      // Apply grouping, sorting, and aggregations
      return this.processReportData(data || [], config);
    } catch (error) {
      console.error("Error executing report query:", error);
      return [];
    }
  }

  /**
   * Process report data
   */
  private static processReportData(data: any[], config: ReportConfig): any[] {
    let processedData = [...data];

    // Apply grouping
    if (config.grouping.length > 0) {
      const grouped = new Map();

      for (const item of processedData) {
        const key = config.grouping.map(field => item[field]).join("|");

        if (!grouped.has(key)) {
          grouped.set(key, { ...item });
        } else {
          const existing = grouped.get(key);

          // Apply aggregations
          for (const agg of config.aggregations) {
            const field = agg.field;
            const func = agg.function;

            switch (func) {
              case "sum":
                existing[field] = (existing[field] || 0) + (item[field] || 0);
                break;
              case "count":
                existing[field] = (existing[field] || 0) + 1;
                break;
              case "average":
                existing[field] = ((existing[field] || 0) + (item[field] || 0)) / 2;
                break;
              case "min":
                existing[field] = Math.min(existing[field] || Infinity, item[field] || Infinity);
                break;
              case "max":
                existing[field] = Math.max(existing[field] || -Infinity, item[field] || -Infinity);
                break;
            }
          }
        }
      }

      processedData = Array.from(grouped.values());
    }

    // Apply sorting
    for (const sort of config.sorting) {
      processedData.sort((a, b) => {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        if (sort.direction === "asc") {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });
    }

    return processedData;
  }

  /**
   * Create scheduled report
   */
  static async createScheduledReport(
    scheduledReport: Omit<ScheduledReport, "id" | "createdAt">,
  ): Promise<{
    success: boolean;
    scheduledReport?: ScheduledReport;
    error?: string;
  }> {
    try {
      // Calculate next run time
      const nextRun = this.calculateNextRun(scheduledReport.schedule);

      const completeScheduledReport: ScheduledReport = {
        ...scheduledReport,
        id: crypto.randomUUID(),
        nextRun,
        createdAt: new Date().toISOString(),
      };

      const { data: newScheduledReport, error } = await supabase
        .from("scheduled_reports")
        .insert([completeScheduledReport])
        .select()
        .single();

      if (error) throw error;

      return { success: true, scheduledReport: newScheduledReport };
    } catch (error) {
      console.error("Error creating scheduled report:", error);
      return { success: false, error: "Failed to create scheduled report" };
    }
  }

  /**
   * Calculate next run time
   */
  private static calculateNextRun(schedule: ScheduledReport["schedule"]): string {
    const now = new Date();
    const nextRun = new Date(now);

    switch (schedule.frequency) {
      case "daily":
        nextRun.setHours(parseInt(schedule.time.split(":")[0]));
        nextRun.setMinutes(parseInt(schedule.time.split(":")[1]));
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case "weekly":
        const dayOfWeek = schedule.dayOfWeek || 0;
        const currentDay = now.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
        nextRun.setDate(now.getDate() + daysUntilTarget);
        nextRun.setHours(parseInt(schedule.time.split(":")[0]));
        nextRun.setMinutes(parseInt(schedule.time.split(":")[1]));
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;

      case "monthly":
        const dayOfMonth = schedule.dayOfMonth || 1;
        nextRun.setDate(dayOfMonth);
        nextRun.setHours(parseInt(schedule.time.split(":")[0]));
        nextRun.setMinutes(parseInt(schedule.time.split(":")[1]));
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;

      case "quarterly":
        const quarter = Math.floor(now.getMonth() / 3);
        const nextQuarter = (quarter + 1) % 4;
        nextRun.setMonth(nextQuarter * 3);
        nextRun.setDate(1);
        nextRun.setHours(parseInt(schedule.time.split(":")[0]));
        nextRun.setMinutes(parseInt(schedule.time.split(":")[1]));
        break;
    }

    return nextRun.toISOString();
  }
}
