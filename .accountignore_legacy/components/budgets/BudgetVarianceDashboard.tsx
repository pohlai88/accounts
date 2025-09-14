/**
 * Budget Variance Analysis Dashboard - CFO Performance Management
 * Advanced Budget vs Actual Reporting with Drill-down Analysis
 *
 * Features:
 * - Real-time variance calculations and visualization
 * - Multi-dimensional variance analysis by account, department, project
 * - Interactive drill-down capabilities with root cause analysis
 * - Automated variance alerts and threshold management
 * - Collaborative variance explanation and action planning
 * - Trend analysis and predictive insights
 */

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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Edit,
  MessageSquare,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Calendar,
  Building2,
  Users,
  Layers,
  Zap,
} from "lucide-react";
import {
  BudgetVarianceService,
  BudgetVarianceDashboard as BudgetVarianceDashboardData,
  VarianceDrillDown,
  AnalysisLevel,
  AlertStatus,
  VarianceCategory,
  SeverityLevel,
} from "@/lib/budget-variance-service";

interface BudgetVarianceDashboardProps {
  budgetPlanId: string;
  companyId: string;
}

export default function BudgetVarianceDashboard({
  budgetPlanId,
  companyId,
}: BudgetVarianceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<BudgetVarianceDashboardData | null>(null);
  const [drillDownData, setDrillDownData] = useState<VarianceDrillDown | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedLevel, setSelectedLevel] = useState<AnalysisLevel>("Company");
  const [filterCriteria, setFilterCriteria] = useState({
    variance_threshold: "10",
    account_type: "all",
    show_only_significant: false,
  });

  useEffect(() => {
    loadDashboardData();
  }, [budgetPlanId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const result = await BudgetVarianceService.getBudgetVarianceDashboard(budgetPlanId);

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.error("Error loading budget variance dashboard:", result.error);
      }
    } catch (error) {
      console.error("Error loading budget variance dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);

    // Update budget actuals and recalculate variance analysis
    await Promise.all([
      BudgetVarianceService.updateBudgetActuals(budgetPlanId),
      BudgetVarianceService.calculateBudgetVarianceAnalysis(budgetPlanId),
    ]);

    // Reload dashboard data
    await loadDashboardData();
    setRefreshing(false);
  };

  const handleDrillDown = async (level: AnalysisLevel, dimensionId?: string) => {
    try {
      const result = await BudgetVarianceService.getVarianceDrillDown(
        budgetPlanId,
        level,
        dimensionId,
      );

      if (result.success && result.data) {
        setDrillDownData(result.data);
        setShowDrillDown(true);
      }
    } catch (error) {
      console.error("Error loading drill-down data:", error);
    }
  };

  const getSeverityColor = (severity: SeverityLevel | VarianceCategory) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50";
      case "High":
      case "Significant":
        return "text-orange-600 bg-orange-50";
      case "Medium":
      case "Acceptable":
        return "text-yellow-600 bg-yellow-50";
      case "Low":
      case "Minimal":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getVarianceIcon = (isPositive: boolean, isFavorable: boolean) => {
    if (isPositive) {
      return isFavorable ? (
        <ArrowUpRight className="w-4 h-4 text-green-600" />
      ) : (
        <ArrowUpRight className="w-4 h-4 text-red-600" />
      );
    } else {
      return isFavorable ? (
        <ArrowDownRight className="w-4 h-4 text-green-600" />
      ) : (
        <ArrowDownRight className="w-4 h-4 text-red-600" />
      );
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

  const getVarianceDescription = (variance: number, percentage: number, isFavorable: boolean) => {
    const absPercentage = Math.abs(percentage);
    const direction = variance > 0 ? "over" : "under";
    const favorability = isFavorable ? "favorable" : "unfavorable";

    return `${formatCurrency(Math.abs(variance))} ${direction} budget (${favorability})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading budget variance analysis...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load budget variance data</p>
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
            <Target className="w-6 h-6" />
            Budget Variance Analysis
          </h2>
          <p className="text-muted-foreground">
            {dashboardData.budget_plan.budget_name} - {dashboardData.budget_plan.budget_year}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshData} disabled={refreshing} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(dashboardData.summary.total_budget)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Approved budget amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actual Performance</CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData.summary.total_actual)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Actual amounts to date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Variance</CardTitle>
            {getVarianceIcon(
              dashboardData.summary.total_variance > 0,
              dashboardData.summary.total_budget > 0
                ? dashboardData.summary.total_variance >= 0
                : dashboardData.summary.total_variance <= 0,
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                dashboardData.summary.variance_percentage > 0
                  ? dashboardData.summary.total_budget > 0
                    ? "text-green-600"
                    : "text-red-600"
                  : dashboardData.summary.total_budget > 0
                    ? "text-red-600"
                    : "text-green-600"
              }`}
            >
              {formatCurrency(dashboardData.summary.total_variance)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {formatPercentage(dashboardData.summary.variance_percentage)} vs budget
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variance Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{dashboardData.alerts.length}</div>
            <p className="text-xs text-muted-foreground mt-2">Active variance alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {dashboardData.alerts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-amber-800 dark:text-amber-200">
                  {dashboardData.alerts.length} Active Budget Alert
                  {dashboardData.alerts.length > 1 ? "s" : ""}
                </strong>
                <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {dashboardData.alerts[0].alert_title}
                  {dashboardData.alerts.length > 1 &&
                    ` and ${dashboardData.alerts.length - 1} more`}
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Variance by Category */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Variance by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.variance_breakdown.by_category).map(
                    ([category, data]) => (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getSeverityColor(category as VarianceCategory)}
                            variant="outline"
                          >
                            {category}
                          </Badge>
                          <span className="text-sm">{data.count} items</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatCurrency(data.amount)}</div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Variance by Account Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Variance by Account Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.variance_breakdown.by_account_type).map(
                    ([accountType, data]) => (
                      <div key={accountType} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{accountType}</span>
                          <span
                            className={`text-sm font-medium ${
                              data.variance >= 0
                                ? data.budget > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                                : data.budget > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                            }`}
                          >
                            {formatCurrency(data.variance)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Budget: {formatCurrency(data.budget)} | Actual:{" "}
                          {formatCurrency(data.actual)}
                        </div>
                        <Progress
                          value={
                            data.budget !== 0
                              ? Math.min(Math.abs((data.actual / data.budget) * 100), 200)
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Variances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Positive Variances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Top Positive Variances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.top_variances.positive.slice(0, 5).map((variance, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => handleDrillDown("Account")}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{variance.account}</div>
                        <div className="text-xs text-green-600">
                          +{formatCurrency(variance.amount)} (
                          {formatPercentage(variance.percentage)})
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {variance.impact.toFixed(1)}% of total
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  ))}
                  {dashboardData.top_variances.positive.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No significant positive variances
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Negative Variances */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                  Top Negative Variances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.top_variances.negative.slice(0, 5).map((variance, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                      onClick={() => handleDrillDown("Account")}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{variance.account}</div>
                        <div className="text-xs text-red-600">
                          {formatCurrency(variance.amount)} ({formatPercentage(variance.percentage)}
                          )
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {variance.impact.toFixed(1)}% of total
                        </div>
                        <Eye className="w-4 h-4 text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  ))}
                  {dashboardData.top_variances.negative.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No significant negative variances
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Detailed Variance Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Drill-down analysis by dimension and account
              </p>
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedLevel}
                onValueChange={value => setSelectedLevel(value as AnalysisLevel)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Analysis Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company</SelectItem>
                  <SelectItem value="Department">Department</SelectItem>
                  <SelectItem value="Cost Center">Cost Center</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                  <SelectItem value="Account">Account</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => handleDrillDown(selectedLevel)} className="gap-2">
                <Search className="w-4 h-4" />
                Analyze
              </Button>
            </div>
          </div>

          {/* Analysis Results Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Variance Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                  <p>Detailed Analysis View</p>
                  <p className="text-xs">
                    Select analysis level and click Analyze to view detailed breakdown
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Budget Variance Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Monitor and manage budget variance alerts
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Alert
            </Button>
          </div>

          <div className="space-y-4">
            {dashboardData.alerts.map(alert => (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(alert.severity)} variant="outline">
                          {alert.severity}
                        </Badge>
                        <Badge variant="secondary">{alert.alert_type}</Badge>
                        <Badge
                          variant={
                            alert.alert_status === "Open"
                              ? "destructive"
                              : alert.alert_status === "Resolved"
                                ? "default"
                                : "secondary"
                          }
                        >
                          {alert.alert_status}
                        </Badge>
                      </div>

                      <h4 className="font-medium text-sm mb-1">{alert.alert_title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{alert.alert_message}</p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Triggered: {new Date(alert.created_at).toLocaleDateString()}</span>
                        <span>Value: {formatCurrency(alert.trigger_value)}</span>
                        <span>Threshold: {formatCurrency(alert.threshold_value)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {dashboardData.alerts.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Active Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    All budget variances are within acceptable thresholds
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Variance Trends Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Historical variance trends and forecast accuracy
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trend Indicator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Variance Trend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      dashboardData.trends.variance_trend === "Improving"
                        ? "text-green-600"
                        : dashboardData.trends.variance_trend === "Worsening"
                          ? "text-red-600"
                          : "text-yellow-600"
                    }`}
                  >
                    {dashboardData.trends.variance_trend}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Overall variance trend</p>
                </div>
              </CardContent>
            </Card>

            {/* Forecast Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Forecast Accuracy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(dashboardData.trends.forecast_accuracy * 100).toFixed(1)}%
                  </div>
                  <Progress value={dashboardData.trends.forecast_accuracy * 100} className="mt-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    Historical forecast precision
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Volatility Indicator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Variance Volatility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">Medium</div>
                  <p className="text-sm text-muted-foreground mt-2">Variance stability measure</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Variance Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p>Variance Trend Chart</p>
                  <p className="text-xs">Monthly variance progression over time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Action Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations to improve budget performance
            </p>
          </div>

          <div className="space-y-4">
            {dashboardData.recommendations.map((recommendation, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge
                          variant={
                            recommendation.priority === "Critical"
                              ? "destructive"
                              : recommendation.priority === "High"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {recommendation.priority} Priority
                        </Badge>
                        <span className="font-medium text-sm">{recommendation.area}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {recommendation.description}
                      </p>
                      <div className="text-sm font-medium text-green-600">
                        Potential Impact: {formatCurrency(recommendation.potential_impact)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium mb-2">Recommended Actions:</h5>
                    <ul className="text-sm space-y-1">
                      {recommendation.actions.map((action, actionIndex) => (
                        <li key={actionIndex} className="flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}

            {dashboardData.recommendations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Budget Performance is Good</h3>
                  <p className="text-sm text-muted-foreground">
                    No specific recommendations at this time. Continue monitoring for changes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Drill-down Dialog */}
      <Dialog open={showDrillDown} onOpenChange={setShowDrillDown}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Variance Drill-down: {drillDownData?.dimension_name}</DialogTitle>
            <DialogDescription>Detailed analysis with root cause identification</DialogDescription>
          </DialogHeader>

          {drillDownData && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">Budget</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(drillDownData.budget_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold">Actual</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(drillDownData.actual_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-lg font-semibold">Variance</div>
                  <div
                    className={`text-2xl font-bold ${
                      drillDownData.is_favorable ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(drillDownData.variance_amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatPercentage(drillDownData.variance_percentage)}
                  </div>
                </div>
              </div>

              {/* Contributing Factors */}
              {drillDownData.contributing_factors.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Contributing Factors</h4>
                  <div className="space-y-2">
                    {drillDownData.contributing_factors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <div>
                          <div className="font-medium text-sm">{factor.factor}</div>
                          <div className="text-xs text-muted-foreground">{factor.explanation}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm">
                            {formatCurrency(factor.impact_amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {factor.impact_percentage.toFixed(1)}% impact
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Child Items */}
              <div>
                <h4 className="font-medium mb-3">Detailed Breakdown</h4>
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 gap-4 p-3 bg-muted text-sm font-medium">
                    <div>Account</div>
                    <div className="text-right">Budget</div>
                    <div className="text-right">Actual</div>
                    <div className="text-right">Variance</div>
                    <div className="text-right">%</div>
                  </div>
                  {drillDownData.child_items.slice(0, 10).map((item, index) => (
                    <div key={index} className="grid grid-cols-5 gap-4 p-3 border-t text-sm">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-right">{formatCurrency(item.budget)}</div>
                      <div className="text-right">{formatCurrency(item.actual)}</div>
                      <div
                        className={`text-right ${item.variance >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatCurrency(item.variance)}
                      </div>
                      <div
                        className={`text-right ${item.variance_percentage >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {formatPercentage(item.variance_percentage)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
