/**
 * Advanced KPI Dashboard - Executive Financial Intelligence
 * Real-time Executive Dashboard with Comprehensive KPI Analytics
 *
 * Features:
 * - Real-time KPI monitoring with performance ratings
 * - Interactive trend analysis and forecasting
 * - AI-powered financial insights and recommendations
 * - Executive summary with strategic recommendations
 * - Performance benchmarking and industry comparison
 * - Customizable dashboard layouts and widgets
 */
// @ts-nocheck


"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Target,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Settings,
  Download,
  RefreshCw,
  Bell,
  Zap,
  LineChart,
  Gauge,
  Award,
  Users,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Brain,
  Star,
  Calendar,
  Filter,
  Plus,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import {
  AdvancedKPIService,
  ExecutiveDashboardData,
  KPIAnalysisResult,
  PerformanceRating,
  TrendDirection,
  SeverityLevel,
  KPICategory,
} from "@/lib/advanced-kpi-service";

interface AdvancedKPIDashboardProps {
  companyId: string;
  dashboardId?: string;
}

export default function AdvancedKPIDashboard({
  companyId,
  dashboardId,
}: AdvancedKPIDashboardProps) {
  const [dashboardData, setDashboardData] = useState<ExecutiveDashboardData | null>(null);
  const [kpiAnalysis, setKPIAnalysis] = useState<KPIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("monthly");
  const [selectedCategory, setSelectedCategory] = useState<KPICategory | "all">("all");
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [selectedKPIId, setSelectedKPIId] = useState<string>("");

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [companyId, dashboardId]);

  const loadDashboardData = async () => {
    try {
      if (!loading) setRefreshing(true);

      const result = await AdvancedKPIService.getExecutiveDashboard(companyId, dashboardId);

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.error("Error loading KPI dashboard:", result.error);
      }
    } catch (error) {
      console.error("Error loading KPI dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateKPIs = async () => {
    setRefreshing(true);

    const result = await AdvancedKPIService.updateAllKPIs(companyId);

    if (result.success) {
      await loadDashboardData();
    }

    setRefreshing(false);
  };

  const showKPIAnalysis = async (kpiId: string) => {
    setSelectedKPIId(kpiId);
    setShowAnalysisDialog(true);

    const result = await AdvancedKPIService.getKPIAnalysis(kpiId, selectedTimeframe as any);
    if (result.success && result.data) {
      setKPIAnalysis(result.data);
    }
  };

  const getPerformanceColor = (rating: PerformanceRating) => {
    switch (rating) {
      case "Excellent":
        return "text-green-600 bg-green-50";
      case "Good":
        return "text-blue-600 bg-blue-50";
      case "Acceptable":
        return "text-yellow-600 bg-yellow-50";
      case "Needs Attention":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getTrendIcon = (direction: TrendDirection, size: string = "w-4 h-4") => {
    switch (direction) {
      case "Up":
        return <TrendingUp className={`${size} text-green-600`} />;
      case "Down":
        return <TrendingDown className={`${size} text-red-600`} />;
      default:
        return <Activity className={`${size} text-gray-600`} />;
    }
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "High":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "Medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "Low":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
  };

  const formatNumber = (num: number, decimals: number = 1) => {
    if (Math.abs(num) < 1000) return num.toFixed(decimals);
    if (Math.abs(num) < 1000000) return `${(num / 1000).toFixed(decimals)}K`;
    if (Math.abs(num) < 1000000000) return `${(num / 1000000).toFixed(decimals)}M`;
    return `${(num / 1000000000).toFixed(decimals)}B`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading executive dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load executive dashboard</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Gauge className="w-6 h-6" />
            Executive Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time financial performance and strategic insights
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={updateKPIs} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Update KPIs
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Settings className="w-4 h-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Health</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.performance_overview.financial_health_score}%
            </div>
            <div className="mt-2">
              <Progress
                value={dashboardData.performance_overview.financial_health_score}
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Overall financial performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Operational Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData.performance_overview.operational_efficiency_score}%
            </div>
            <div className="mt-2">
              <Progress
                value={dashboardData.performance_overview.operational_efficiency_score}
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Process efficiency metrics</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Momentum</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {dashboardData.performance_overview.growth_momentum_score}%
            </div>
            <div className="mt-2">
              <Progress
                value={dashboardData.performance_overview.growth_momentum_score}
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Growth trajectory indicators</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {dashboardData.performance_overview.risk_assessment_score}%
            </div>
            <div className="mt-2">
              <Progress
                value={dashboardData.performance_overview.risk_assessment_score}
                className="h-2"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Risk mitigation effectiveness</p>
          </CardContent>
        </Card>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {dashboardData.kpi_summary.total_kpis}
                </div>
                <div className="text-sm text-muted-foreground">Total KPIs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {dashboardData.kpi_summary.excellent_performance}
                </div>
                <div className="text-sm text-muted-foreground">Excellent Performance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {dashboardData.kpi_summary.needs_attention}
                </div>
                <div className="text-sm text-muted-foreground">Need Attention</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {dashboardData.kpi_summary.trending_up}
                </div>
                <div className="text-xs text-muted-foreground">Trending Up</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 mb-1">
                  {dashboardData.kpi_summary.trending_down}
                </div>
                <div className="text-xs text-muted-foreground">Trending Down</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {dashboardData.active_alerts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <Bell className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-amber-800 dark:text-amber-200">
                  {dashboardData.active_alerts.length} Active KPI Alert
                  {dashboardData.active_alerts.length > 1 ? "s" : ""}
                </strong>
                <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {dashboardData.active_alerts[0].alert_name}
                  {dashboardData.active_alerts.length > 1 &&
                    ` and ${dashboardData.active_alerts.length - 1} more`}
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="w-4 h-4" />
                View All
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="featured">Featured KPIs</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="summary">Executive Summary</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Featured KPIs Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboardData.featured_kpis.slice(0, 4).map((featuredKPI, index) => (
              <Card
                key={index}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => showKPIAnalysis(featuredKPI.kpi.id)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{featuredKPI.kpi.kpi_name}</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(featuredKPI.current_value?.trend_direction || "Stable")}
                      <Badge
                        className={getPerformanceColor(featuredKPI.performance_rating)}
                        variant="outline"
                      >
                        {featuredKPI.performance_rating}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="text-3xl font-bold text-blue-600">
                        {featuredKPI.kpi.unit_of_measurement === "currency"
                          ? formatCurrency(featuredKPI.current_value?.kpi_value || 0)
                          : formatNumber(featuredKPI.current_value?.kpi_value || 0)}
                      </div>
                      {featuredKPI.current_value?.variance_percentage && (
                        <div
                          className={`text-sm ${featuredKPI.current_value.variance_percentage >= 0 ? "text-green-600" : "text-red-600"}`}
                        >
                          {formatPercentage(featuredKPI.current_value.variance_percentage)} vs
                          target
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Target</div>
                      <div className="font-medium">
                        {featuredKPI.kpi.unit_of_measurement === "currency"
                          ? formatCurrency(featuredKPI.kpi.target_value || 0)
                          : formatNumber(featuredKPI.kpi.target_value || 0)}
                      </div>
                    </div>
                  </div>

                  <div className="h-16 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-3">
                    <div className="text-center text-muted-foreground">
                      <LineChart className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">Trend Chart</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Category: {featuredKPI.kpi.kpi_category}</span>
                    <Button variant="ghost" size="sm" className="h-6 px-2">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recent Performance Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Multi-KPI Trend Analysis</p>
                  <p className="text-sm">Performance trends across all key metrics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Featured KPIs Tab */}
        <TabsContent value="featured" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Featured KPIs</h3>
              <p className="text-sm text-muted-foreground">
                Key performance indicators for executive monitoring
              </p>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={value => setSelectedCategory(value as any)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Financial Performance">Financial Performance</SelectItem>
                <SelectItem value="Liquidity">Liquidity</SelectItem>
                <SelectItem value="Efficiency">Efficiency</SelectItem>
                <SelectItem value="Profitability">Profitability</SelectItem>
                <SelectItem value="Growth">Growth</SelectItem>
                <SelectItem value="Risk Management">Risk Management</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {dashboardData.featured_kpis.map((featuredKPI, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{featuredKPI.kpi.kpi_name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {featuredKPI.kpi.kpi_category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(
                        featuredKPI.current_value?.trend_direction || "Stable",
                        "w-3 h-3",
                      )}
                      <Badge
                        className={getPerformanceColor(featuredKPI.performance_rating)}
                        variant="outline"
                      >
                        {featuredKPI.performance_rating}
                      </Badge>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {featuredKPI.kpi.unit_of_measurement === "currency"
                        ? formatCurrency(featuredKPI.current_value?.kpi_value || 0)
                        : formatNumber(featuredKPI.current_value?.kpi_value || 0)}
                    </div>
                    {featuredKPI.current_value?.variance_percentage && (
                      <div
                        className={`text-sm ${featuredKPI.current_value.variance_percentage >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(featuredKPI.current_value.variance_percentage)} vs target
                      </div>
                    )}
                  </div>

                  <div className="h-12 bg-gray-50 dark:bg-gray-800 rounded mb-4 flex items-center justify-center">
                    <div className="text-xs text-muted-foreground">Mini Trend</div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Updated:{" "}
                      {new Date(featuredKPI.current_value?.created_at || "").toLocaleDateString()}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showKPIAnalysis(featuredKPI.kpi.id)}
                      className="h-7 px-2"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Brain className="w-5 h-5" />
                Financial Insights
              </h3>
              <p className="text-sm text-muted-foreground">
                AI-powered insights and recommendations
              </p>
            </div>
            <Badge variant="outline" className="gap-1">
              <Zap className="w-3 h-3" />
              AI-Powered
            </Badge>
          </div>

          <div className="space-y-4">
            {dashboardData.financial_insights.map((insight, index) => (
              <Card key={index} className={`border ${getSeverityColor(insight.severity)}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(insight.severity)} variant="outline">
                          {insight.severity}
                        </Badge>
                        <Badge variant="secondary">{insight.insight_type}</Badge>
                        <Badge variant="outline">{insight.insight_category}</Badge>
                      </div>

                      <h4 className="font-medium text-base mb-2">{insight.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

                      {insight.current_value && insight.expected_value && (
                        <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground">Current</div>
                            <div className="font-medium">{formatNumber(insight.current_value)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Expected</div>
                            <div className="font-medium">
                              {formatNumber(insight.expected_value)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Variance</div>
                            <div
                              className={`font-medium ${(insight.variance_percentage || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {formatPercentage(insight.variance_percentage || 0)}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-xs text-muted-foreground">
                        Confidence: {((insight.confidence_score || 0) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>

                  {insight.recommended_actions.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2 flex items-center gap-1">
                        <Lightbulb className="w-4 h-4" />
                        Recommended Actions:
                      </h5>
                      <ul className="text-sm space-y-1">
                        {insight.recommended_actions.slice(0, 3).map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <div>
                              <span>{action.action}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {action.priority}
                              </Badge>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {dashboardData.financial_insights.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">All Systems Performing Well</h3>
                  <p className="text-sm text-muted-foreground">
                    No critical insights identified. All KPIs are performing within expected ranges.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Benchmarks Tab */}
        <TabsContent value="benchmarks" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="w-5 h-5" />
              Industry Benchmarks
            </h3>
            <p className="text-sm text-muted-foreground">
              Compare your performance against industry standards
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Industry Ranking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {dashboardData.benchmark_comparison.industry_ranking}
                </div>
                <p className="text-sm text-muted-foreground">
                  Based on overall performance metrics
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Peer Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.benchmark_comparison.peer_comparison
                    .slice(0, 3)
                    .map((comparison, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-sm">{comparison.kpi}</div>
                          <div className="text-xs text-muted-foreground">
                            {comparison.percentile_ranking}th percentile
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatNumber(comparison.company_value)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            vs {formatNumber(comparison.industry_average)} avg
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center">Performance Score</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {Math.round(
                    (dashboardData.performance_overview.financial_health_score +
                      dashboardData.performance_overview.operational_efficiency_score) /
                      2,
                  )}
                  %
                </div>
                <p className="text-sm text-muted-foreground">Overall performance score</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Benchmark Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.benchmark_comparison.peer_comparison.map((comparison, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{comparison.kpi}</h4>
                      <Badge
                        variant={
                          comparison.percentile_ranking >= 75
                            ? "default"
                            : comparison.percentile_ranking >= 50
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {comparison.percentile_ranking}th percentile
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Your Performance: </span>
                        <span className="font-medium">
                          {formatNumber(comparison.company_value)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Industry Average: </span>
                        <span className="font-medium">
                          {formatNumber(comparison.industry_average)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <Progress
                        value={Math.min(
                          100,
                          (comparison.company_value / comparison.industry_average) * 50,
                        )}
                        className="h-2"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5" />
                KPI Alerts
              </h3>
              <p className="text-sm text-muted-foreground">Performance alerts and notifications</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Alert
            </Button>
          </div>

          <div className="space-y-4">
            {dashboardData.active_alerts.map((alert, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(alert.severity)} variant="outline">
                          {alert.severity}
                        </Badge>
                        <Badge variant="secondary">{alert.alert_type}</Badge>
                      </div>

                      <h4 className="font-medium text-sm mb-1">{alert.alert_name}</h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        Checks every {alert.check_frequency.toLowerCase()}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Triggered: {alert.trigger_count} times</span>
                        {alert.last_triggered_at && (
                          <span>
                            Last: {new Date(alert.last_triggered_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {dashboardData.active_alerts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Active Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    All KPIs are performing within acceptable thresholds
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Executive Summary Tab */}
        <TabsContent value="summary" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Executive Summary
            </h3>
            <p className="text-sm text-muted-foreground">
              High-level performance summary for executive reporting
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-green-600">Strengths</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-green-600">
                    {dashboardData.kpi_summary.excellent_performance}
                  </div>
                  <div className="text-sm text-muted-foreground">KPIs performing excellently</div>
                </div>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Strong financial health</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Efficient operations</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                    <span>Positive growth trajectory</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center text-amber-600">Opportunities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-amber-600">
                    {dashboardData.kpi_summary.needs_attention}
                  </div>
                  <div className="text-sm text-muted-foreground">KPIs needing attention</div>
                </div>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Cost optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Process efficiency</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    <span>Risk management</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-center text-blue-600">Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {dashboardData.financial_insights.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recommended actions</div>
                </div>
                <ul className="text-sm space-y-1">
                  <li className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-blue-600" />
                    <span>Strategic initiatives</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-3 h-3 text-blue-600" />
                    <span>Performance improvement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Brain className="w-3 h-3 text-blue-600" />
                    <span>AI-driven insights</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Executive Report */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Executive Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Financial Performance</h4>
                  <p className="text-muted-foreground">
                    Overall financial health score of{" "}
                    {dashboardData.performance_overview.financial_health_score}% indicates strong
                    performance across key financial metrics. Revenue targets are being met with
                    healthy profit margins maintained.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Operational Efficiency</h4>
                  <p className="text-muted-foreground">
                    Operational efficiency score of{" "}
                    {dashboardData.performance_overview.operational_efficiency_score}% demonstrates
                    effective process management. Continue focus on automation and workflow
                    optimization initiatives.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Strategic Recommendations</h4>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>
                        Maintain current growth trajectory while monitoring market conditions
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Address identified performance gaps in underperforming KPIs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Implement recommended process improvements for efficiency gains</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* KPI Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>KPI Analysis: {kpiAnalysis?.kpi.kpi_name}</DialogTitle>
            <DialogDescription>
              Detailed performance analysis with forecasting and recommendations
            </DialogDescription>
          </DialogHeader>

          {kpiAnalysis && (
            <div className="space-y-6">
              {/* Current Performance Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Current Value</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {kpiAnalysis.kpi.unit_of_measurement === "currency"
                      ? formatCurrency(kpiAnalysis.current_performance.value)
                      : formatNumber(kpiAnalysis.current_performance.value)}
                  </div>
                  <Badge
                    className={getPerformanceColor(kpiAnalysis.current_performance.rating)}
                    variant="outline"
                  >
                    {kpiAnalysis.current_performance.rating}
                  </Badge>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">
                    Variance from Target
                  </div>
                  <div
                    className={`text-2xl font-bold ${
                      kpiAnalysis.current_performance.variance_percentage >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatPercentage(kpiAnalysis.current_performance.variance_percentage)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(Math.abs(kpiAnalysis.current_performance.variance_from_target))}{" "}
                    from target
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Growth Rate</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(kpiAnalysis.trend_analysis.monthly_growth_rate)}
                  </div>
                  <div className="text-sm text-muted-foreground">Monthly</div>
                </div>
              </div>

              {/* Trend Analysis */}
              <div>
                <h4 className="font-medium mb-3">Trend Analysis</h4>
                <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="w-8 h-8 mx-auto mb-2" />
                    <p>Historical Trend Chart</p>
                    <p className="text-xs">
                      Showing {kpiAnalysis.historical_data.length} data points
                    </p>
                  </div>
                </div>
              </div>

              {/* Forecast */}
              {kpiAnalysis.forecast.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">6-Month Forecast</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {kpiAnalysis.forecast.slice(0, 3).map((forecast, index) => (
                      <div key={index} className="text-center p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium">{forecast.period}</div>
                        <div className="text-lg font-bold text-blue-600">
                          {formatNumber(forecast.predicted_value)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(forecast.confidence_score * 100).toFixed(0)}% confidence
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {kpiAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Recommendations</h4>
                  <div className="space-y-3">
                    {kpiAnalysis.recommendations.map((rec, index) => (
                      <div key={index} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between mb-2">
                          <h5 className="font-medium text-sm">{rec.category}</h5>
                          <Badge variant="outline">{rec.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.action}</p>
                        <div className="text-xs text-muted-foreground">
                          Expected Impact: {rec.impact} | Timeline: {rec.timeline}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
