/**
 * Treasury Management Dashboard - Advanced Cash Flow & Working Capital Analysis
 * CFO-Level Strategic Financial Management Interface
 *
 * Features:
 * - Real-time cash position monitoring
 * - Multi-scenario cash flow forecasting
 * - Working capital optimization analysis
 * - Liquidity risk alerts and monitoring
 * - Treasury KPI tracking with trends
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
  Clock,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  CheckCircle,
  XCircle,
  Calendar,
  Droplets,
  Building,
  CreditCard,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Download,
  Settings,
  Bell,
  Eye,
  Filter,
  Plus,
} from "lucide-react";
import {
  TreasuryManagementService,
  TreasuryDashboard as TreasuryDashboardData,
  CashFlowScenarioAnalysis,
  ScenarioType,
  SeverityLevel,
} from "@/lib/treasury-management-service";

interface TreasuryDashboardProps {
  companyId: string;
}

export default function TreasuryDashboard({ companyId }: TreasuryDashboardProps) {
  const [dashboardData, setDashboardData] = useState<TreasuryDashboardData | null>(null);
  const [scenarioAnalysis, setScenarioAnalysis] = useState<CashFlowScenarioAnalysis[]>([]);
  const [workingCapitalAnalysis, setWorkingCapitalAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("30");
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>("Base");

  useEffect(() => {
    loadDashboardData();
  }, [companyId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [dashboardResult, scenarioResult, wcAnalysisResult] = await Promise.all([
        TreasuryManagementService.getTreasuryDashboard(companyId),
        TreasuryManagementService.analyzeCashFlowScenarios(companyId, 12),
        TreasuryManagementService.getWorkingCapitalAnalysis(companyId),
      ]);

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardData(dashboardResult.data);
      }

      if (scenarioResult.success && scenarioResult.data) {
        setScenarioAnalysis(scenarioResult.data);
      }

      if (wcAnalysisResult.success && wcAnalysisResult.data) {
        setWorkingCapitalAnalysis(wcAnalysisResult.data);
      }
    } catch (error) {
      console.error("Error loading treasury dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);

    // Update cash position and KPIs first
    await Promise.all([
      TreasuryManagementService.updateCashPositionSnapshot(companyId),
      TreasuryManagementService.updateTreasuryKPIs(companyId),
    ]);

    // Then reload dashboard data
    await loadDashboardData();
    setRefreshing(false);
  };

  const getSeverityColor = (severity: SeverityLevel) => {
    switch (severity) {
      case "Critical":
        return "text-red-600 bg-red-50";
      case "High":
        return "text-orange-600 bg-orange-50";
      case "Medium":
        return "text-yellow-600 bg-yellow-50";
      case "Low":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
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
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading treasury dashboard...</p>
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
            <Building className="w-6 h-6" />
            Treasury Management
          </h2>
          <p className="text-muted-foreground">
            Strategic cash flow forecasting and working capital optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 Days</SelectItem>
              <SelectItem value="90">90 Days</SelectItem>
              <SelectItem value="180">6 Months</SelectItem>
              <SelectItem value="365">12 Months</SelectItem>
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

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                dashboardData?.current_cash_position?.total_cash_and_equivalents || 0,
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span>+12.5% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Working Capital</CardTitle>
            <CreditCard className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData?.current_cash_position?.net_working_capital || 0)}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 text-red-600" />
              <span>-3.2% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Conversion Cycle</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {Math.round(dashboardData?.current_cash_position?.cash_conversion_cycle || 0)} days
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Target className="w-3 h-3" />
              <span>Target: 30 days</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Liquidity Risk</CardTitle>
            <Droplets className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Badge
                className={getSeverityColor(
                  dashboardData?.risk_indicators?.liquidity_risk || "Medium",
                )}
                variant="outline"
              >
                {dashboardData?.risk_indicators?.liquidity_risk || "Medium"}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Current ratio:{" "}
              {dashboardData?.current_cash_position?.current_ratio?.toFixed(2) || "N/A"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {dashboardData?.liquidity_alerts && dashboardData.liquidity_alerts.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-amber-800 dark:text-amber-200">
                  {dashboardData.liquidity_alerts.length} Active Treasury Alert
                  {dashboardData.liquidity_alerts.length > 1 ? "s" : ""}
                </strong>
                <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {dashboardData.liquidity_alerts[0].alert_name}
                  {dashboardData.liquidity_alerts.length > 1 &&
                    ` and ${dashboardData.liquidity_alerts.length - 1} more`}
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
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          <TabsTrigger value="working-capital">Working Capital</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Cash Flow Forecast - Next {selectedTimeframe} Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Forecasted Net Flow</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(
                        selectedTimeframe === "30"
                          ? dashboardData?.cash_flow_forecast_30_days || 0
                          : dashboardData?.cash_flow_forecast_90_days || 0,
                      )}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Confidence Level</span>
                      <span>{formatPercentage(dashboardData?.forecast_accuracy || 75)}</span>
                    </div>
                    <Progress value={dashboardData?.forecast_accuracy || 75} className="h-2" />
                  </div>
                  {/* Placeholder for actual chart */}
                  <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                      <p>Cash Flow Chart</p>
                      <p className="text-xs">Coming soon</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Cash Inflows/Outflows */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Cash Flow Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-green-600">
                      Top Inflows (Last 30 Days)
                    </h4>
                    <div className="space-y-2">
                      {dashboardData?.top_cash_inflows.slice(0, 3).map((inflow, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                            <span className="text-sm">{inflow.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatCurrency(inflow.amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatPercentage(inflow.percentage)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2 text-red-600">
                      Top Outflows (Last 30 Days)
                    </h4>
                    <div className="space-y-2">
                      {dashboardData?.top_cash_outflows.slice(0, 3).map((outflow, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                            <span className="text-sm">{outflow.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatCurrency(outflow.amount)}
                            </div>
                            <div className="text-xs text-muted-foreforeground">
                              {formatPercentage(outflow.percentage)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Working Capital Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Working Capital Trend (Last 12 Months)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Placeholder for working capital trend chart */}
              <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p>Working Capital Trend Chart</p>
                  <p className="text-xs">
                    Showing trend over {dashboardData?.working_capital_trend.length || 0} data
                    points
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Forecasting Tab */}
        <TabsContent value="forecasting" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cash Flow Scenario Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Analyze different scenarios to understand potential cash flow outcomes
              </p>
            </div>
            <Select
              value={selectedScenario}
              onValueChange={value => setSelectedScenario(value as ScenarioType)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Best Case">Best Case</SelectItem>
                <SelectItem value="Base">Base Case</SelectItem>
                <SelectItem value="Worst Case">Worst Case</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scenarioAnalysis.map(analysis => (
              <Card
                key={analysis.scenario_type}
                className={
                  analysis.scenario_type === selectedScenario ? "ring-2 ring-blue-500" : ""
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{analysis.scenario_type}</span>
                    <Badge
                      variant={
                        analysis.scenario_type === "Best Case"
                          ? "default"
                          : analysis.scenario_type === "Base"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {analysis.cash_shortfall_risk > 0.1
                        ? "High Risk"
                        : analysis.cash_shortfall_risk > 0.05
                          ? "Medium Risk"
                          : "Low Risk"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">30 Days</div>
                      <div
                        className={
                          analysis.net_cash_flow_30_days >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatCurrency(analysis.net_cash_flow_30_days)}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">90 Days</div>
                      <div
                        className={
                          analysis.net_cash_flow_90_days >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatCurrency(analysis.net_cash_flow_90_days)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium mb-1">Cash Balance Range</div>
                    <div className="text-xs text-muted-foreground">
                      Min: {formatCurrency(analysis.minimum_cash_balance)} | Max:{" "}
                      {formatCurrency(analysis.maximum_cash_balance)}
                    </div>
                  </div>

                  {analysis.recommended_actions.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Recommendations</div>
                      <ul className="text-xs space-y-1 text-muted-foreground">
                        {analysis.recommended_actions.slice(0, 2).map((action, index) => (
                          <li key={index} className="flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Forecast Chart */}
          <Card>
            <CardHeader>
              <CardTitle>12-Month Cash Flow Forecast - {selectedScenario}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Detailed Forecast Chart</p>
                  <p className="text-sm">
                    Monthly breakdown for {selectedScenario.toLowerCase()} scenario
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Working Capital Tab */}
        <TabsContent value="working-capital" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Working Capital Optimization</h3>
            <p className="text-sm text-muted-foreground">
              Analyze and optimize your working capital efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Efficiency Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Efficiency Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {Math.round(workingCapitalAnalysis?.efficiency_score || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">out of 100</div>
                  <Progress
                    value={workingCapitalAnalysis?.efficiency_score || 0}
                    className="mb-4"
                  />
                  <Badge
                    variant={
                      (workingCapitalAnalysis?.efficiency_score || 0) >= 80
                        ? "default"
                        : (workingCapitalAnalysis?.efficiency_score || 0) >= 60
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {(workingCapitalAnalysis?.efficiency_score || 0) >= 80
                      ? "Excellent"
                      : (workingCapitalAnalysis?.efficiency_score || 0) >= 60
                        ? "Good"
                        : "Needs Improvement"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Current vs Target */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Working Capital
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium">Current</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(workingCapitalAnalysis?.current_working_capital || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Target</div>
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(workingCapitalAnalysis?.target_working_capital || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Potential Savings</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {formatCurrency(
                        (workingCapitalAnalysis?.current_working_capital || 0) -
                          (workingCapitalAnalysis?.target_working_capital || 0),
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Key Ratios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">DSO</span>
                    <span className="font-medium">
                      {Math.round(
                        dashboardData?.current_cash_position?.days_sales_outstanding || 0,
                      )}{" "}
                      days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">DIO</span>
                    <span className="font-medium">
                      {Math.round(
                        dashboardData?.current_cash_position?.days_inventory_outstanding || 0,
                      )}{" "}
                      days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">DPO</span>
                    <span className="font-medium">
                      {Math.round(
                        dashboardData?.current_cash_position?.days_payable_outstanding || 0,
                      )}{" "}
                      days
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm font-medium">CCC</span>
                    <span className="font-bold">
                      {Math.round(dashboardData?.current_cash_position?.cash_conversion_cycle || 0)}{" "}
                      days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle>Optimization Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workingCapitalAnalysis?.optimization_opportunities?.map(
                  (opportunity: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{opportunity.area}</h4>
                        <Badge
                          variant={opportunity.priority === "High" ? "destructive" : "secondary"}
                        >
                          {opportunity.priority} Priority
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Current: </span>
                          <span className="font-medium">{opportunity.current_days} days</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target: </span>
                          <span className="font-medium">{opportunity.target_days} days</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Savings: </span>
                          <span className="font-medium text-green-600">
                            {formatCurrency(opportunity.potential_savings)}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <strong>Recommendations:</strong>
                        <ul className="mt-1 space-y-1">
                          {opportunity.recommendations
                            .slice(0, 2)
                            .map((rec: string, recIndex: number) => (
                              <li key={recIndex} className="flex items-start gap-2">
                                <span className="text-blue-600 mt-0.5">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Treasury Alerts</h3>
              <p className="text-sm text-muted-foreground">
                Monitor and manage liquidity and risk alerts
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Alert
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Active Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Active Alerts ({dashboardData?.liquidity_alerts.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData?.liquidity_alerts.map((alert, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{alert.alert_name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{alert.alert_type}</p>
                        </div>
                        <Badge className={getSeverityColor(alert.severity_level)} variant="outline">
                          {alert.severity_level}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>Triggers: {alert.trigger_count}</span>
                        <span>Frequency: {alert.check_frequency}</span>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No active alerts</p>
                      <p className="text-sm">Your treasury metrics are within normal ranges</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Risk Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Risk Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Liquidity Risk</span>
                    <Badge
                      className={getSeverityColor(
                        dashboardData?.risk_indicators?.liquidity_risk || "Medium",
                      )}
                      variant="outline"
                    >
                      {dashboardData?.risk_indicators?.liquidity_risk || "Medium"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Concentration Risk</span>
                    <Badge
                      className={getSeverityColor(
                        dashboardData?.risk_indicators?.concentration_risk || "Low",
                      )}
                      variant="outline"
                    >
                      {dashboardData?.risk_indicators?.concentration_risk || "Low"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Forecast Risk</span>
                    <Badge
                      className={getSeverityColor(
                        dashboardData?.risk_indicators?.forecast_risk || "Medium",
                      )}
                      variant="outline"
                    >
                      {dashboardData?.risk_indicators?.forecast_risk || "Medium"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Advanced Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Deep insights and predictive analytics for treasury management
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Forecast Accuracy Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Forecast Accuracy Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2" />
                    <p>Forecast Accuracy Chart</p>
                    <p className="text-xs">
                      Current accuracy: {formatPercentage(dashboardData?.forecast_accuracy || 75)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seasonal Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Seasonal Cash Flow Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    <p>Seasonal Analysis Chart</p>
                    <p className="text-xs">Identifying monthly and quarterly patterns</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Treasury Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(
                      (dashboardData?.current_cash_position?.current_ratio || 0) * 100,
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Ratio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatPercentage(
                      (dashboardData?.current_cash_position?.quick_ratio || 0) * 100,
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">Quick Ratio</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(dashboardData?.current_cash_position?.cash_conversion_cycle || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">CCC (Days)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatPercentage(dashboardData?.forecast_accuracy || 75)}
                  </div>
                  <div className="text-sm text-muted-foreground">Forecast Accuracy</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
