/**
 * Predictive Analytics Dashboard - AI-Powered Financial Forecasting & Machine Learning
 * Advanced Financial Modeling, Predictive Analytics & Automated Insights Interface
 *
 * Features:
 * - AI-powered financial forecasting with multiple algorithms
 * - Real-time model performance monitoring and optimization
 * - Automated predictive insights generation and recommendations
 * - Feature engineering and ML model management
 * - A/B testing and experimentation framework
 * - Executive-level predictive analytics reporting
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Zap,
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
  Cpu,
  Lightbulb,
  TestTube,
  Award,
  Gauge,
  Microscope,
  Rocket,
  Shield,
  Users,
  FileText,
  Filter,
  Search,
  Calendar,
  MoreHorizontal,
  Sparkles,
  BrainCircuit,
  Bot,
  ChartBar,
  FlaskConical,
  GitBranch,
  Radar,
  Workflow,
  Wrench,
  Crosshair,
  Beaker,
  Network,
  Atom,
} from "lucide-react";
import {
  PredictiveAnalyticsService,
  PredictiveAnalyticsDashboard,
  PredictiveAnalyticsAnalysis,
  ForecastingModel,
  PredictionJob,
  PredictionResult,
  PredictiveInsight,
  ModelPerformanceMetric,
  MLFeature,
} from "@/lib/predictive-analytics-service";

interface PredictiveAnalyticsDashboardProps {
  companyId?: string;
}

export default function PredictiveAnalyticsDashboard({
  companyId,
}: PredictiveAnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<PredictiveAnalyticsDashboard | null>(null);
  const [analysisData, setAnalysisData] = useState<PredictiveAnalyticsAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>("30d");
  const [showNewModelDialog, setShowNewModelDialog] = useState(false);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [companyId, selectedTimeframe]);

  const loadDashboardData = async () => {
    try {
      if (!loading) setProcessing(true);

      const result = await PredictiveAnalyticsService.getPredictiveAnalyticsDashboard();

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.error("Error loading predictive analytics dashboard:", result.error);
      }
    } catch (error) {
      console.error("Error loading predictive analytics dashboard:", error);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const generateInsights = async () => {
    try {
      setProcessing(true);

      const result = await PredictiveAnalyticsService.generatePredictiveInsights();

      if (result.success && result.data) {
        // Reload dashboard to reflect new insights
        await loadDashboardData();
      }
    } catch (error) {
      console.error("Error generating insights:", error);
    } finally {
      setProcessing(false);
    }
  };

  const loadAnalysisData = async () => {
    try {
      const result = await PredictiveAnalyticsService.getPredictiveAnalyticsAnalysis();

      if (result.success && result.data) {
        setAnalysisData(result.data);
        setShowAnalysisDialog(true);
      }
    } catch (error) {
      console.error("Error loading predictive analytics analysis:", error);
    }
  };

  const getModelStatusColor = (status: string) => {
    switch (status) {
      case "production":
        return "text-green-600 bg-green-50 border-green-200";
      case "staging":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "testing":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "development":
        return "text-purple-600 bg-purple-50 border-purple-200";
      case "deprecated":
        return "text-gray-600 bg-gray-50 border-gray-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "running":
        return "text-blue-600 bg-blue-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "cancelled":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getInsightPriorityIcon = (priority: string) => {
    switch (priority) {
      case "Urgent":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case "High":
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case "Medium":
        return <Target className="w-4 h-4 text-yellow-600" />;
      case "Low":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case "Neural Network":
        return <BrainCircuit className="w-4 h-4 text-purple-600" />;
      case "Random Forest":
        return <Network className="w-4 h-4 text-green-600" />;
      case "XGBoost":
        return <Rocket className="w-4 h-4 text-blue-600" />;
      case "ARIMA":
        return <LineChart className="w-4 h-4 text-orange-600" />;
      case "Prophet":
        return <Sparkles className="w-4 h-4 text-pink-600" />;
      default:
        return <Bot className="w-4 h-4 text-gray-600" />;
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
    return `${(value * 100).toFixed(1)}%`;
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
          <p className="text-muted-foreground">Loading predictive analytics dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load predictive analytics dashboard</p>
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
            <Brain className="w-6 h-6" />
            Predictive Analytics
          </h2>
          <p className="text-muted-foreground">
            AI-powered financial forecasting and intelligent business insights
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
          <Button onClick={generateInsights} disabled={processing} className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* High Priority Insights Banner */}
      {dashboardData.insight_summary.high_priority_insights > 0 && (
        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <Lightbulb className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-orange-800 dark:text-orange-200">
                  {dashboardData.insight_summary.high_priority_insights} High Priority Insight
                  {dashboardData.insight_summary.high_priority_insights > 1 ? "s" : ""}
                </strong>
                <div className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                  AI-generated recommendations requiring immediate attention
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-2 border-orange-300">
                <Eye className="w-4 h-4" />
                View Insights
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Production Models</CardTitle>
            <Rocket className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.model_summary.production_models}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              of {dashboardData.model_summary.total_models} total models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(dashboardData.model_summary.avg_accuracy)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">across all models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Insights</CardTitle>
            <Lightbulb className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {dashboardData.insight_summary.active_insights}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {dashboardData.insight_summary.high_priority_insights} high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Business Value</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(dashboardData.performance_summary.business_value_generated)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">generated this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="w-5 h-5" />
            Prediction Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Today's Predictions
              </div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Total Generated</span>
                    <span>{dashboardData.prediction_summary.total_predictions_today}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>High Confidence</span>
                    <span>{dashboardData.prediction_summary.high_confidence_predictions}</span>
                  </div>
                  <Progress value={65} className="h-2 bg-green-100" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>In Progress</span>
                    <span>{dashboardData.prediction_summary.predictions_in_progress}</span>
                  </div>
                  <Progress value={15} className="h-2 bg-blue-100" />
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Quality Metrics</div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Avg Accuracy
                  </span>
                  <span className="font-medium">
                    {formatPercentage(dashboardData.prediction_summary.avg_prediction_accuracy)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    Outliers Detected
                  </span>
                  <span className="font-medium">
                    {dashboardData.prediction_summary.outlier_predictions}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-600" />
                    Failed Jobs
                  </span>
                  <span className="font-medium">
                    {dashboardData.prediction_summary.failed_predictions}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Performance Trends
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Accuracy Trend</span>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">
                      +{dashboardData.performance_summary.prediction_accuracy_trend}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Models Degrading</span>
                  <Badge variant="outline" className="text-orange-600 border-orange-200">
                    {dashboardData.performance_summary.models_degrading}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cost Savings</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(dashboardData.performance_summary.cost_savings_achieved)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Model Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Models by Algorithm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.model_summary.models_by_type).map(
                    ([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getAlgorithmIcon(type)}
                          <span className="text-sm">{type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(count / dashboardData.model_summary.total_models) * 100}
                            className="w-16 h-2"
                          />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Domain Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="w-5 h-5" />
                  Models by Domain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(dashboardData.model_summary.models_by_domain).map(
                    ([domain, count]) => (
                      <div key={domain} className="flex items-center justify-between">
                        <span className="text-sm">{domain}</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={(count / dashboardData.model_summary.total_models) * 100}
                            className="w-16 h-2"
                          />
                          <span className="text-sm font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ),
                  )}
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
                  Recent Predictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recent_predictions.slice(0, 5).map((prediction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {prediction.model?.model_name || "Unknown Model"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(prediction.prediction_date)} • Confidence:{" "}
                          {formatPercentage(prediction.confidence_score || 0)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(prediction.predicted_value)}
                        </div>
                        {prediction.risk_level && (
                          <Badge variant="outline" className="text-xs">
                            {prediction.risk_level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {dashboardData.recent_predictions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent predictions</p>
                      <p className="text-sm">Run prediction jobs to see results</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Recent Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.recent_insights.slice(0, 5).map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      {getInsightPriorityIcon(insight.action_priority)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{insight.insight_title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {insight.insight_type} • {formatDate(insight.analysis_date)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {insight.insight_description}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            insight.action_priority === "Urgent"
                              ? "border-red-200 text-red-600"
                              : insight.action_priority === "High"
                                ? "border-orange-200 text-orange-600"
                                : insight.action_priority === "Medium"
                                  ? "border-yellow-200 text-yellow-600"
                                  : "border-green-200 text-green-600"
                          }`}
                        >
                          {insight.action_priority}
                        </Badge>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {dashboardData.recent_insights.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent insights</p>
                      <p className="text-sm">Generate insights to see AI recommendations</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Forecasting Models</h3>
              <p className="text-sm text-muted-foreground">
                Manage and monitor AI forecasting models
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="development">Development</SelectItem>
                  <SelectItem value="neural_network">Neural Networks</SelectItem>
                </SelectContent>
              </Select>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Model
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardData.forecasting_models.slice(0, 9).map((model, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getAlgorithmIcon(model.algorithm_type)}
                        <h4 className="font-medium text-sm truncate">{model.model_name}</h4>
                      </div>
                      <Badge
                        className={getModelStatusColor(model.deployment_status)}
                        variant="outline"
                      >
                        {model.deployment_status}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Algorithm:</span>
                      <span className="font-medium">{model.algorithm_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Domain:</span>
                      <span className="font-medium">{model.forecasting_domain}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Accuracy:</span>
                      <span className="font-medium">
                        {model.accuracy_score ? formatPercentage(model.accuracy_score) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span className="font-medium">{model.model_version}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
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
                    {model.deployment_status === "production" && (
                      <div className="flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        <span>Live</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Prediction Results</h3>
              <p className="text-sm text-muted-foreground">
                View and analyze prediction results and accuracy
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button className="gap-2">
                <Play className="w-4 h-4" />
                Run Prediction
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 gap-4 p-3 bg-muted text-sm font-medium">
                  <div>Model</div>
                  <div>Prediction Date</div>
                  <div className="text-right">Predicted Value</div>
                  <div className="text-right">Confidence</div>
                  <div>Risk Level</div>
                  <div>Status</div>
                  <div>Actions</div>
                </div>

                {dashboardData.recent_predictions.slice(0, 10).map((prediction, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-7 gap-4 p-3 border-t text-sm hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{prediction.model?.model_name || "Unknown"}</div>
                      <div className="text-xs text-muted-foreground">
                        {prediction.model?.algorithm_type}
                      </div>
                    </div>
                    <div>{formatDate(prediction.prediction_date)}</div>
                    <div className="text-right font-medium">
                      {formatCurrency(prediction.predicted_value)}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Progress
                          value={(prediction.confidence_score || 0) * 100}
                          className="w-12 h-2"
                        />
                        <span className="text-xs w-10">
                          {formatPercentage(prediction.confidence_score || 0)}
                        </span>
                      </div>
                    </div>
                    <div>
                      {prediction.risk_level && (
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            prediction.risk_level === "Critical"
                              ? "border-red-200 text-red-600"
                              : prediction.risk_level === "High"
                                ? "border-orange-200 text-orange-600"
                                : prediction.risk_level === "Medium"
                                  ? "border-yellow-200 text-yellow-600"
                                  : "border-green-200 text-green-600"
                          }`}
                        >
                          {prediction.risk_level}
                        </Badge>
                      )}
                    </div>
                    <div>
                      {prediction.outlier_flag ? (
                        <Badge variant="outline" className="text-xs border-red-200 text-red-600">
                          Outlier
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-xs border-green-200 text-green-600"
                        >
                          Normal
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {dashboardData.recent_predictions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Cpu className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No predictions available</p>
                    <p className="text-sm">Run prediction jobs to generate forecasts</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Predictive Insights</h3>
              <p className="text-sm text-muted-foreground">
                AI-generated insights and recommendations
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
              <Button onClick={generateInsights} disabled={processing} className="gap-2">
                <Sparkles className="w-4 h-4" />
                Generate Insights
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Active Insights</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {dashboardData.insight_summary.active_insights}
                    </div>
                  </div>
                  <Lightbulb className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">High Priority</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {dashboardData.insight_summary.high_priority_insights}
                    </div>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Acted Upon</div>
                    <div className="text-2xl font-bold text-green-600">
                      {dashboardData.insight_summary.insights_acted_upon}
                    </div>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Avg Confidence</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {dashboardData.insight_summary.avg_insight_confidence.toFixed(1)}%
                    </div>
                  </div>
                  <Target className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {dashboardData.recent_insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getInsightPriorityIcon(insight.action_priority)}
                        <Badge variant="outline" className="text-xs">
                          {insight.insight_type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {insight.insight_category}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(insight.analysis_date)}
                        </span>
                      </div>

                      <h4 className="font-medium text-lg mb-2">{insight.insight_title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {insight.insight_description}
                      </p>

                      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-muted-foreground">Confidence: </span>
                          <span className="font-medium">
                            {insight.confidence_level.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Impact: </span>
                          <span className="font-medium">{insight.impact_magnitude}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeline: </span>
                          <span className="font-medium">{insight.impact_time_horizon}</span>
                        </div>
                      </div>

                      {insight.key_findings && insight.key_findings.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Key Findings:
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {insight.key_findings.slice(0, 3).map((finding, idx) => (
                              <li key={idx}>{finding}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {insight.recommended_actions && insight.recommended_actions.length > 0 && (
                        <div className="mb-4">
                          <div className="text-sm font-medium text-muted-foreground mb-2">
                            Recommended Actions:
                          </div>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {insight.recommended_actions.slice(0, 2).map((action, idx) => (
                              <li key={idx}>{action}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Badge
                        className={`${
                          insight.action_priority === "Urgent"
                            ? "bg-red-50 text-red-600 border-red-200"
                            : insight.action_priority === "High"
                              ? "bg-orange-50 text-orange-600 border-orange-200"
                              : insight.action_priority === "Medium"
                                ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                                : "bg-green-50 text-green-600 border-green-200"
                        }`}
                        variant="outline"
                      >
                        {insight.action_priority}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {dashboardData.recent_insights.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Insights Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate AI-powered insights from your prediction data
                  </p>
                  <Button onClick={generateInsights} disabled={processing} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    Generate Insights
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Features Tab */}
        <TabsContent value="features" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">ML Feature Store</h3>
              <p className="text-sm text-muted-foreground">
                Manage and monitor machine learning features
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Search className="w-4 h-4" />
                Search
              </Button>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Feature
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { category: "Financial", count: 45, quality: 0.92 },
                    { category: "Temporal", count: 23, quality: 0.88 },
                    { category: "Behavioral", count: 18, quality: 0.85 },
                    { category: "External", count: 12, quality: 0.79 },
                    { category: "Derived", count: 34, quality: 0.91 },
                  ].map((cat, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">{cat.category}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={cat.quality * 100} className="w-16 h-2" />
                        <span className="text-sm font-medium w-8">{cat.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Completeness</span>
                    <div className="flex items-center gap-2">
                      <Progress value={94} className="w-16 h-2" />
                      <span className="text-sm font-medium">94%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Consistency</span>
                    <div className="flex items-center gap-2">
                      <Progress value={89} className="w-16 h-2" />
                      <span className="text-sm font-medium">89%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Validity</span>
                    <div className="flex items-center gap-2">
                      <Progress value={92} className="w-16 h-2" />
                      <span className="text-sm font-medium">92%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Overall Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={91} className="w-16 h-2" />
                      <span className="text-sm font-bold text-green-600">91%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Feature Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Revenue Growth Rate", usage: 156, importance: 0.89 },
                    { name: "Seasonal Index", usage: 134, importance: 0.76 },
                    { name: "Customer Churn Rate", usage: 98, importance: 0.68 },
                    { name: "Cash Flow Ratio", usage: 87, importance: 0.62 },
                  ].map((feature, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium truncate">{feature.name}</span>
                        <span>{feature.usage}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={feature.importance * 100} className="flex-1 h-1" />
                        <span className="text-xs text-muted-foreground w-12">
                          {formatPercentage(feature.importance)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feature List */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Inventory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Feature Store</p>
                <p className="text-sm">Centralized repository for ML features and metadata</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Advanced Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Deep dive analysis and performance insights
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
                <CardTitle>Model Performance by Algorithm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Performance Analysis</p>
                    <p className="text-sm">Algorithm comparison and accuracy trends</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prediction Accuracy Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="w-12 h-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Accuracy Trends</p>
                    <p className="text-sm">Historical prediction accuracy analysis</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    priority: "High",
                    category: "Model Optimization",
                    recommendation: "Implement ensemble methods for critical financial forecasts",
                    impact: "Improve prediction accuracy by 12-15%",
                    effort: "Medium - 6-8 weeks development",
                  },
                  {
                    priority: "High",
                    category: "Data Quality",
                    recommendation:
                      "Enhance feature engineering pipeline with automated quality checks",
                    impact: "Reduce model drift by 25% and improve reliability",
                    effort: "Low - 3-4 weeks implementation",
                  },
                  {
                    priority: "Medium",
                    category: "Business Integration",
                    recommendation: "Develop automated insight-to-action workflows",
                    impact: "Reduce response time to insights by 60%",
                    effort: "High - 3-4 months development",
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
            <DialogTitle>Predictive Analytics Analysis Report</DialogTitle>
            <DialogDescription>
              Comprehensive analysis of model performance, predictions, and insights
            </DialogDescription>
          </DialogHeader>

          {analysisData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Model Performance by Algorithm</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.model_performance.by_algorithm.map((alg, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getAlgorithmIcon(alg.algorithm)}
                            <span className="text-sm">{alg.algorithm}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={alg.avg_accuracy * 100} className="w-16 h-2" />
                            <span className="text-sm font-medium w-12">
                              {formatPercentage(alg.avg_accuracy)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Prediction Patterns</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analysisData.prediction_patterns.by_confidence.map((pattern, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span>{pattern.confidence_range}</span>
                          <div className="flex gap-4">
                            <span>{pattern.count} predictions</span>
                            <span className="text-green-600">
                              {formatPercentage(pattern.avg_accuracy)} accurate
                            </span>
                          </div>
                        </div>
                      ))}
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
