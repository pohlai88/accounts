/**
 * Treasury Optimization Dashboard - Advanced Cash Management & Working Capital Analysis
 * Strategic Treasury Management, Liquidity Optimization & Investment Analysis Interface
 *
 * Features:
 * - Working capital components analysis with real-time efficiency tracking
 * - Advanced cash optimization strategies with automated execution
 * - Comprehensive liquidity position monitoring and risk assessment
 * - AI-powered investment opportunity analysis and recommendations
 * - Treasury performance analytics with industry benchmarking
 * - Strategic working capital optimization recommendations
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Banknote,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Settings,
  Play,
  Pause,
  Eye,
  Edit,
  Plus,
  Minus,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Layers,
  Database,
  Zap,
  Lightbulb,
  Award,
  Gauge,
  Shield,
  Users,
  FileText,
  Filter,
  Search,
  Calendar,
  MoreHorizontal,
  Wallet,
  CreditCard,
  PiggyBank,
  Building2,
  Calculator,
  Globe,
  Lock,
  Unlock,
  ArrowUpDown,
  ArrowRightLeft,
  CircleDollarSign,
  Coins,
  HandCoins,
  TrendingUpDown,
  Percent,
  Timer,
  ChartArea,
  ChartLine,
  ChartPie,
  FlaskConical,
  Microscope,
  Crosshair,
  Radar,
  Network,
  Bot,
  Sparkles,
  BrainCircuit,
} from "lucide-react";
import {
  TreasuryOptimizationService,
  TreasuryOptimizationDashboard,
  TreasuryOptimizationAnalysis,
  WorkingCapitalComponent,
  CashOptimizationStrategy,
  LiquidityPosition,
  InvestmentOpportunity,
  CashOptimizationExecution,
  WorkingCapitalRecommendation,
  TreasuryPerformanceAnalytics,
} from "@/lib/treasury-optimization-service";

interface TreasuryOptimizationDashboardProps {
  companyId?: string;
}

export default function TreasuryOptimizationDashboard({
  companyId,
}: TreasuryOptimizationDashboardProps) {
  const [dashboardData, setDashboardData] = useState<TreasuryOptimizationDashboard | null>(null);
  const [analysisData, setAnalysisData] = useState<TreasuryOptimizationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("30d");
  const [showNewStrategyDialog, setShowNewStrategyDialog] = useState(false);
  const [showRecommendationsDialog, setShowRecommendationsDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [companyId, selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      if (!loading) setProcessing(true);

      const result = await TreasuryOptimizationService.getTreasuryOptimizationDashboard();

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.error("Error loading treasury optimization dashboard:", result.error);
      }
    } catch (error) {
      console.error("Error loading treasury optimization dashboard:", error);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const generateRecommendations = async () => {
    try {
      setProcessing(true);

      const result = await TreasuryOptimizationService.generateWorkingCapitalRecommendations();

      if (result.success && result.data) {
        // Reload dashboard to reflect new recommendations
        await loadDashboardData();
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
    } finally {
      setProcessing(false);
    }
  };

  const loadAnalysisData = async () => {
    try {
      const result = await TreasuryOptimizationService.getTreasuryOptimizationAnalysis();

      if (result.success && result.data) {
        setAnalysisData(result.data);
        setShowAnalysisDialog(true);
      }
    } catch (error) {
      console.error("Error loading treasury optimization analysis:", error);
    }
  };

  const getComponentCategoryColor = (category: string) => {
    switch (category) {
      case "Current Assets":
        return "text-green-600 bg-green-50 border-green-200";
      case "Current Liabilities":
        return "text-red-600 bg-red-50 border-red-200";
      case "Inventory":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "Receivables":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "Payables":
        return "text-orange-600 bg-orange-50 border-orange-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStrategyStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50";
      case "suspended":
        return "text-yellow-600 bg-yellow-50";
      case "inactive":
        return "text-gray-600 bg-gray-50";
      case "under_review":
        return "text-blue-600 bg-blue-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskToleranceIcon = (tolerance: string) => {
    switch (tolerance) {
      case "Conservative":
        return <Shield className="w-4 h-4 text-green-600" />;
      case "Moderate":
        return <Target className="w-4 h-4 text-yellow-600" />;
      case "Aggressive":
        return <TrendingUp className="w-4 h-4 text-red-600" />;
      default:
        return <Gauge className="w-4 h-4 text-gray-600" />;
    }
  };

  const getInvestmentTypeIcon = (type: string) => {
    switch (type) {
      case "Money Market":
        return <PiggyBank className="w-4 h-4 text-blue-600" />;
      case "Treasury Bills":
        return <Building2 className="w-4 h-4 text-green-600" />;
      case "CDs":
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      case "Commercial Paper":
        return <FileText className="w-4 h-4 text-orange-600" />;
      case "Corporate Bonds":
        return <Award className="w-4 h-4 text-pink-600" />;
      default:
        return <Coins className="w-4 h-4 text-gray-600" />;
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "Critical":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "High":
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case "Medium":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Low":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Timer className="w-4 h-4 text-gray-600" />;
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("en-US").format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading treasury optimization dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load treasury optimization dashboard</p>
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
            <Banknote className="w-6 h-6" />
            Treasury Optimization
          </h2>
          <p className="text-muted-foreground">
            Advanced cash management, working capital analysis, and strategic treasury optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={processing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${processing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button onClick={generateRecommendations} disabled={processing} className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Optimize
          </Button>
        </div>
      </div>

      {/* Risk Alerts Banner */}
      {(dashboardData.risk_alerts.high_risk_positions > 0 ||
        dashboardData.risk_alerts.liquidity_warnings > 0) && (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-red-800 dark:text-red-200">
                  Treasury Risk Alert: {dashboardData.risk_alerts.high_risk_positions} high-risk
                  positions, {dashboardData.risk_alerts.liquidity_warnings} liquidity warnings
                </strong>
                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Immediate attention required for cash management optimization
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2 border-red-300">
                <Eye className="w-4 h-4" />
                Review Risks
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Working Capital</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(dashboardData.working_capital_summary.total_working_capital)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Ratio:{" "}
              {formatPercentage(dashboardData.working_capital_summary.working_capital_ratio * 100)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
            <Wallet className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData.liquidity_summary.total_available_cash)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatNumber(dashboardData.liquidity_summary.days_cash_on_hand)} days on hand
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns Generated</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(dashboardData.optimization_summary.total_returns_generated)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.optimization_summary.active_strategies} active strategies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investment Opportunities</CardTitle>
            <Award className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {dashboardData.investment_summary.available_opportunities}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.investment_summary.recommended_investments} recommended
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Working Capital Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Working Capital Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Key Metrics</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cash Conversion Cycle</span>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">
                      {dashboardData.working_capital_summary.cash_conversion_cycle.toFixed(1)} days
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Liquidity Score</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={dashboardData.working_capital_summary.liquidity_score}
                      className="w-16 h-2"
                    />
                    <span className="font-medium text-xs w-8">
                      {dashboardData.working_capital_summary.liquidity_score.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Optimization Opportunities</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {dashboardData.working_capital_summary.optimization_opportunities}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Cash Flow Forecast
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">7-Day Net Flow</span>
                  <span
                    className={`font-medium ${
                      dashboardData.liquidity_summary.cash_flow_forecast_7d >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(dashboardData.liquidity_summary.cash_flow_forecast_7d)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Credit Utilization</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={dashboardData.liquidity_summary.credit_utilization * 100}
                      className="w-16 h-2"
                    />
                    <span className="text-xs w-10">
                      {formatPercentage(dashboardData.liquidity_summary.credit_utilization * 100)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Liquidity Risk</span>
                  <Badge
                    variant={
                      dashboardData.liquidity_summary.liquidity_risk_score > 50
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {dashboardData.liquidity_summary.liquidity_risk_score.toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Optimization Performance
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Strategy Performance</span>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={dashboardData.optimization_summary.average_strategy_performance}
                      className="w-16 h-2"
                    />
                    <span className="text-xs w-8">
                      {dashboardData.optimization_summary.average_strategy_performance.toFixed(0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Total Optimized</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(dashboardData.optimization_summary.total_optimized_amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Execution Mode</span>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {dashboardData.optimization_summary.automated_executions} Auto
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {dashboardData.optimization_summary.manual_executions} Manual
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="working-capital">Working Capital</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cash Flow Analysis Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartLine className="w-5 h-5" />
                  Cash Flow Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ChartArea className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Cash Flow Trends</p>
                    <p className="text-sm">Historical and forecasted cash flow analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Working Capital Composition */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartPie className="w-5 h-5" />
                  Working Capital Composition
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.working_capital_components.slice(0, 5).map((component, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getComponentCategoryColor(component.component_category)}
                          variant="outline"
                        >
                          {component.component_category}
                        </Badge>
                        <span className="text-sm font-medium">{component.component_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={component.efficiency_score || 0} className="w-16 h-2" />
                        <span className="text-sm font-medium w-16 text-right">
                          {formatCurrency(component.current_balance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recent Optimization Executions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recent_executions.slice(0, 5).map((execution, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{execution.execution_type}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(execution.execution_date)} • {execution.execution_method}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(execution.principal_amount)}
                        </div>
                        {execution.interest_rate_achieved && (
                          <div className="text-xs text-green-600">
                            {formatPercentage(execution.interest_rate_achieved * 100)} APY
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {dashboardData.recent_executions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent executions</p>
                      <p className="text-sm">Optimization strategies will appear here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Urgent Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.urgent_recommendations.slice(0, 5).map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getUrgencyIcon(recommendation.urgency_level)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {recommendation.recommendation_title}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {recommendation.recommendation_type} • Priority:{" "}
                          {recommendation.priority_score}
                        </div>
                        {recommendation.estimated_impact_amount && (
                          <div className="text-xs text-green-600 mt-1">
                            Impact: {formatCurrency(recommendation.estimated_impact_amount)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            recommendation.urgency_level === "Critical"
                              ? "border-red-200 text-red-600"
                              : recommendation.urgency_level === "High"
                                ? "border-orange-200 text-orange-600"
                                : recommendation.urgency_level === "Medium"
                                  ? "border-yellow-200 text-yellow-600"
                                  : "border-green-200 text-green-600"
                          }`}
                        >
                          {recommendation.urgency_level}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {dashboardData.urgent_recommendations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-600" />
                      <p>No urgent recommendations</p>
                      <p className="text-sm">All operations are optimized</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Working Capital Tab */}
        <TabsContent value="working-capital" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Working Capital Components</h3>
              <p className="text-sm text-muted-foreground">
                Monitor and optimize working capital efficiency across all components
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter components" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Components</SelectItem>
                  <SelectItem value="current_assets">Current Assets</SelectItem>
                  <SelectItem value="current_liabilities">Current Liabilities</SelectItem>
                  <SelectItem value="inventory">Inventory</SelectItem>
                  <SelectItem value="receivables">Receivables</SelectItem>
                  <SelectItem value="payables">Payables</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Component
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardData.working_capital_components.map((component, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{component.component_name}</h4>
                      <Badge
                        className={getComponentCategoryColor(component.component_category)}
                        variant="outline"
                      >
                        {component.component_category}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Current Balance</span>
                      <span className="font-medium">
                        {formatCurrency(component.current_balance)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Efficiency Score</span>
                      <div className="flex items-center gap-2">
                        <Progress value={component.efficiency_score || 0} className="w-16 h-2" />
                        <span className="text-sm font-medium">
                          {component.efficiency_score?.toFixed(1) || "N/A"}%
                        </span>
                      </div>
                    </div>

                    {component.current_days_outstanding && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Days Outstanding</span>
                        <span className="font-medium">
                          {component.current_days_outstanding} days
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Priority</span>
                      <Badge
                        variant={
                          component.optimization_priority === "High" ? "destructive" : "secondary"
                        }
                      >
                        {component.optimization_priority}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {component.auto_optimization_enabled ? (
                        <>
                          <Zap className="w-3 h-3 text-blue-600" />
                          <span>Auto-optimize</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-gray-600" />
                          <span>Manual</span>
                        </>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Zap className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Cash Optimization Strategies</h3>
              <p className="text-sm text-muted-foreground">
                Manage and execute cash optimization strategies
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Strategy
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardData.optimization_strategies.map((strategy, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getRiskToleranceIcon(strategy.risk_tolerance)}
                        <h4 className="font-medium text-sm">{strategy.strategy_name}</h4>
                      </div>
                      <Badge
                        className={getStrategyStatusColor(strategy.strategy_status)}
                        variant="outline"
                      >
                        {strategy.strategy_status}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Type:</span>
                      <span className="text-sm font-medium">{strategy.strategy_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk Tolerance:</span>
                      <span className="text-sm font-medium">{strategy.risk_tolerance}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Target Balance:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(strategy.target_cash_balance)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total Optimized:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(strategy.total_optimized_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Performance:</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={strategy.current_performance_score || 0}
                          className="w-12 h-2"
                        />
                        <span className="text-sm font-medium">
                          {strategy.current_performance_score?.toFixed(0) || "N/A"}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <div className="flex items-center gap-1 text-xs">
                      {strategy.auto_execution_enabled ? (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          <Zap className="w-3 h-3 mr-1" />
                          Auto
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 border-gray-200">
                          <Lock className="w-3 h-3 mr-1" />
                          Manual
                        </Badge>
                      )}
                      <span className="text-muted-foreground">
                        {strategy.number_of_executions} executions
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Liquidity Tab */}
        <TabsContent value="liquidity" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Liquidity Management</h3>
              <p className="text-sm text-muted-foreground">
                Monitor cash positions and liquidity risk across all accounts
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </Button>
              <Button className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Update Positions
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-8 gap-4 p-3 bg-muted text-sm font-medium">
                  <div>Account</div>
                  <div>Type</div>
                  <div className="text-right">Available Balance</div>
                  <div className="text-right">Days Cash</div>
                  <div className="text-right">Risk Score</div>
                  <div className="text-right">Optimization</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                {dashboardData.current_liquidity_positions.slice(0, 10).map((position, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-8 gap-4 p-3 border-t text-sm hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{position.account_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(position.position_date)}
                      </div>
                    </div>
                    <div>
                      <Badge variant="outline">{position.account_type}</Badge>
                    </div>
                    <div className="text-right font-medium">
                      {formatCurrency(position.available_balance)}
                    </div>
                    <div className="text-right">
                      {position.days_cash_on_hand
                        ? `${position.days_cash_on_hand.toFixed(1)} days`
                        : "N/A"}
                    </div>
                    <div className="text-right">
                      {position.liquidity_risk_score ? (
                        <Badge
                          variant={position.liquidity_risk_score > 50 ? "destructive" : "secondary"}
                        >
                          {position.liquidity_risk_score.toFixed(0)}%
                        </Badge>
                      ) : (
                        "N/A"
                      )}
                    </div>
                    <div className="text-right">
                      {position.optimization_opportunity
                        ? formatCurrency(position.optimization_opportunity)
                        : "-"}
                    </div>
                    <div>
                      <Badge
                        className={
                          position.validation_status === "validated"
                            ? "text-green-600 bg-green-50"
                            : position.validation_status === "flagged"
                              ? "text-red-600 bg-red-50"
                              : "text-yellow-600 bg-yellow-50"
                        }
                        variant="outline"
                      >
                        {position.validation_status}
                      </Badge>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <ArrowUpDown className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {dashboardData.current_liquidity_positions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No liquidity positions available</p>
                    <p className="text-sm">Connect bank accounts to track liquidity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Investment Opportunities</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered investment analysis and recommendations
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button className="gap-2">
                <Sparkles className="w-4 h-4" />
                AI Analysis
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardData.investment_opportunities.map((opportunity, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getInvestmentTypeIcon(opportunity.investment_type)}
                        <h4 className="font-medium text-sm">{opportunity.opportunity_name}</h4>
                      </div>
                      <Badge variant="outline">{opportunity.investment_type}</Badge>
                    </div>
                    <div className="text-right">
                      {opportunity.ai_recommendation_score && (
                        <Badge
                          className="bg-blue-50 text-blue-600 border-blue-200"
                          variant="outline"
                        >
                          AI: {opportunity.ai_recommendation_score.toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Interest Rate:</span>
                      <span className="text-sm font-medium text-green-600">
                        {formatPercentage(opportunity.interest_rate * 100)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Term:</span>
                      <span className="text-sm font-medium">
                        {opportunity.investment_term_days} days
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Min Investment:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(opportunity.minimum_investment)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk Category:</span>
                      <Badge
                        variant={
                          opportunity.risk_category === "Very Low"
                            ? "default"
                            : opportunity.risk_category === "Low"
                              ? "secondary"
                              : opportunity.risk_category === "Medium"
                                ? "outline"
                                : "destructive"
                        }
                      >
                        {opportunity.risk_category}
                      </Badge>
                    </div>
                    {opportunity.credit_rating && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Credit Rating:</span>
                        <span className="text-sm font-medium">{opportunity.credit_rating}</span>
                      </div>
                    )}
                    {opportunity.liquidity_score && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Liquidity:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={opportunity.liquidity_score} className="w-12 h-2" />
                          <span className="text-sm font-medium">
                            {opportunity.liquidity_score.toFixed(0)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        {opportunity.fdic_insured && (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <Shield className="w-3 h-3 mr-1" />
                            FDIC
                          </Badge>
                        )}
                        {opportunity.regulatory_compliant && (
                          <Badge variant="outline" className="text-blue-600 border-blue-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Compliant
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Zap className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <HandCoins className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Treasury Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Advanced analytics and performance insights
              </p>
            </div>
            <Button onClick={loadAnalysisData} className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Generate Analysis
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Working Capital Efficiency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <ChartArea className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Efficiency Analysis</p>
                    <p className="text-sm">Working capital component efficiency trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <TrendingUpDown className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Performance Metrics</p>
                    <p className="text-sm">Strategy performance and ROI analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
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
                ].map((rec, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={rec.priority === "High" ? "destructive" : "secondary"}>
                            {rec.priority} Priority
                          </Badge>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                        <h4 className="font-medium">{rec.recommendation}</h4>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Impact: </span>
                        <span>{rec.impact}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Effort: </span>
                        <span>{rec.effort}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Treasury Optimization Analysis Report</DialogTitle>
            <DialogDescription>
              Comprehensive analysis of working capital, optimization strategies, and performance
              metrics
            </DialogDescription>
          </DialogHeader>

          {analysisData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Working Capital Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.working_capital_analysis.by_component.map((comp, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{comp.component}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={comp.efficiency_score} className="w-16 h-2" />
                            <span className="text-sm font-medium w-16 text-right">
                              {formatCurrency(comp.optimization_potential)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Optimization Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.optimization_performance.by_strategy_type.map(
                        (strategy, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <span>{strategy.strategy_type}</span>
                            <div className="flex gap-4">
                              <span>{strategy.execution_count} executions</span>
                              <span className="text-green-600">
                                {formatPercentage(strategy.avg_return * 100)} return
                              </span>
                              <span className="text-blue-600">
                                {formatPercentage(strategy.success_rate)} success
                              </span>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
