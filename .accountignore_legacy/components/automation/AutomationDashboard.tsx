/**
 * Automation Dashboard - AI-Powered Business Intelligence
 * Complete automation management with AI insights and workflow optimization
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Bot,
  Zap,
  Brain,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Target,
  Activity,
  BarChart3,
  Settings,
  Play,
  Pause,
  Edit,
  Eye,
  Plus,
  Lightbulb,
  Shield,
  Workflow,
  Database,
  PieChart,
  LineChart,
  Users,
  FileText,
  DollarSign,
  Timer,
  Star,
  Filter,
  Search,
} from "lucide-react";
import {
  AutomationService,
  AutomationRule,
  AIModel,
  SmartRecommendation,
  AnomalyDetection,
  WorkflowAutomation,
  DataQualityInsight,
  AutomationAnalytics,
  AutomationCategory,
  RecommendationType,
  Priority,
  RecommendationStatus,
  AnomalyType,
  AnomalySeverity,
} from "@/lib/automation-service";

export default function AutomationDashboard() {
  const [analytics, setAnalytics] = useState<AutomationAnalytics | null>(null);
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [aiModels, setAIModels] = useState<AIModel[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowAutomation[]>([]);
  const [qualityInsights, setQualityInsights] = useState<DataQualityInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<AutomationCategory | "All">("All");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "All">("All");

  const companyId = "current-company-id"; // Get from context/props

  useEffect(() => {
    loadDashboardData();
  }, [companyId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        analyticsResult,
        rulesResult,
        modelsResult,
        recommendationsResult,
        anomaliesResult,
        workflowsResult,
        qualityResult,
      ] = await Promise.all([
        AutomationService.getAutomationAnalytics(companyId),
        AutomationService.getAutomationRules(companyId, {
          category: selectedCategory === "All" ? undefined : selectedCategory,
        }),
        AutomationService.getAIModels(companyId),
        AutomationService.getSmartRecommendations(companyId, {
          priority: selectedPriority === "All" ? undefined : selectedPriority,
          active_only: true,
        }),
        AutomationService.getAnomalyDetections(companyId),
        AutomationService.getWorkflowAutomations(companyId),
        AutomationService.getDataQualityInsights(companyId),
      ]);

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }

      if (rulesResult.success && rulesResult.data) {
        setAutomationRules(rulesResult.data);
      }

      if (modelsResult.success && modelsResult.data) {
        setAIModels(modelsResult.data);
      }

      if (recommendationsResult.success && recommendationsResult.data) {
        setRecommendations(recommendationsResult.data);
      }

      if (anomaliesResult.success && anomaliesResult.data) {
        setAnomalies(anomaliesResult.data);
      }

      if (workflowsResult.success && workflowsResult.data) {
        setWorkflows(workflowsResult.data);
      }

      if (qualityResult.success && qualityResult.data) {
        setQualityInsights(qualityResult.data);
      }
    } catch (error) {
      console.error("Error loading automation dashboard:", error);
    } finally {
      setLoading(false);
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

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Success":
      case "Active":
      case "Trained":
      case "Completed":
        return "default";
      case "Running":
      case "Training":
      case "In Progress":
        return "outline";
      case "Failed":
      case "Critical":
      case "High":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case "Critical":
        return "text-red-600";
      case "High":
        return "text-orange-600";
      case "Medium":
        return "text-yellow-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const handleExecuteRule = async (ruleId: string) => {
    const result = await AutomationService.executeAutomationRule(ruleId);
    if (result.success) {
      loadDashboardData(); // Refresh data
    }
  };

  const handleUpdateRecommendationStatus = async (
    recommendationId: string,
    status: RecommendationStatus,
    notes?: string,
  ) => {
    const result = await AutomationService.updateRecommendationStatus(
      recommendationId,
      status,
      "current-user-id",
      notes,
    );
    if (result.success) {
      loadDashboardData(); // Refresh data
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading automation intelligence...</p>
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
            <Bot className="w-6 h-6" />
            Advanced Automation
          </h2>
          <p className="text-muted-foreground">
            AI-powered business intelligence and workflow automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Rule
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
              <Zap className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.active_rules}</div>
              <p className="text-xs text-muted-foreground">{analytics.total_rules} total rules</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {analytics.success_rate.toFixed(1)}%
              </div>
              <Progress value={analytics.success_rate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Saved</CardTitle>
              <Timer className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.time_saved_hours.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.cost_savings)}
              </div>
              <p className="text-xs text-muted-foreground">Estimated savings</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="rules" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="rules">Rules</TabsTrigger>
          <TabsTrigger value="ai">AI Models</TabsTrigger>
          <TabsTrigger value="recommendations">Insights</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
        </TabsList>

        {/* Automation Rules */}
        <TabsContent value="rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Automation Rules ({automationRules.length})
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedCategory}
                    onChange={e =>
                      setSelectedCategory(e.target.value as AutomationCategory | "All")
                    }
                    className="px-3 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="All">All Categories</option>
                    <option value="Accounting">Accounting</option>
                    <option value="Invoicing">Invoicing</option>
                    <option value="Payments">Payments</option>
                    <option value="Expenses">Expenses</option>
                    <option value="Inventory">Inventory</option>
                    <option value="Reporting">Reporting</option>
                    <option value="Compliance">Compliance</option>
                    <option value="Alerts">Alerts</option>
                  </select>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Rule
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Rule Name</th>
                      <th className="text-left p-3 font-medium">Category</th>
                      <th className="text-left p-3 font-medium">Trigger</th>
                      <th className="text-left p-3 font-medium">Executions</th>
                      <th className="text-left p-3 font-medium">Success Rate</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {automationRules.map(rule => (
                      <tr key={rule.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{rule.rule_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {rule.rule_description}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{rule.rule_category}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary">{rule.trigger_type}</Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div className="font-medium">{rule.execution_count}</div>
                            <div className="text-muted-foreground">
                              Avg: {formatTime(rule.average_execution_time_ms)}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div
                              className={`font-medium ${
                                rule.success_count / Math.max(rule.execution_count, 1) > 0.9
                                  ? "text-green-600"
                                  : "text-orange-600"
                              }`}
                            >
                              {rule.execution_count > 0
                                ? `${((rule.success_count / rule.execution_count) * 100).toFixed(1)}%`
                                : "N/A"}
                            </div>
                            <div className="text-muted-foreground">
                              {rule.success_count}/{rule.execution_count}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={rule.is_active ? "default" : "secondary"}>
                              {rule.is_active ? (rule.is_paused ? "Paused" : "Active") : "Inactive"}
                            </Badge>
                            {rule.is_active && (
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExecuteRule(rule.id)}
                              disabled={!rule.is_active}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <BarChart3 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {automationRules.length === 0 && (
                <div className="text-center py-8">
                  <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No automation rules yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first automation rule to streamline business processes
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Rule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Models */}
        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Models ({aiModels.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Model
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiModels.map(model => (
                  <div
                    key={model.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{model.model_name}</h4>
                      <Badge variant={getStatusBadgeVariant(model.training_status)}>
                        {model.training_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{model.model_category}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Accuracy:</span>
                        <span className="font-medium">
                          {model.accuracy_score
                            ? `${(model.accuracy_score * 100).toFixed(1)}%`
                            : "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Predictions:</span>
                        <span className="font-medium">{model.prediction_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Time:</span>
                        <span className="font-medium">
                          {formatTime(model.average_prediction_time_ms)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <Badge variant={model.is_active ? "default" : "secondary"}>
                        {model.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {aiModels.length === 0 && (
                  <div className="col-span-full text-center py-8">
                    <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No AI models yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create AI models to enable intelligent predictions and categorization
                    </p>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Model
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Recommendations */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Smart Recommendations ({recommendations.length})
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedPriority}
                    onChange={e => setSelectedPriority(e.target.value as Priority | "All")}
                    className="px-3 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="All">All Priorities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Brain className="w-4 h-4" />
                    Generate Insights
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map(recommendation => (
                  <div key={recommendation.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{recommendation.title}</h4>
                          <Badge
                            variant={getStatusBadgeVariant(recommendation.priority)}
                            className={getPriorityColor(recommendation.priority)}
                          >
                            {recommendation.priority}
                          </Badge>
                          <Badge variant="outline">{recommendation.recommendation_type}</Badge>
                          {recommendation.automation_available && (
                            <Badge variant="secondary" className="gap-1">
                              <Bot className="w-3 h-3" />
                              Auto
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {recommendation.description}
                        </p>
                        {recommendation.estimated_impact &&
                          Object.keys(recommendation.estimated_impact).length > 0 && (
                            <div className="text-xs text-muted-foreground mb-3">
                              <strong>Estimated Impact:</strong>{" "}
                              {JSON.stringify(recommendation.estimated_impact)}
                            </div>
                          )}
                        {recommendation.suggested_actions.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium">Suggested Actions:</p>
                            {recommendation.suggested_actions.slice(0, 2).map((action, index) => (
                              <div
                                key={index}
                                className="text-xs text-muted-foreground flex items-center gap-1"
                              >
                                <CheckCircle className="w-3 h-3" />
                                {typeof action === "string"
                                  ? action
                                  : action.action || action.description || "Action"}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Badge variant={getStatusBadgeVariant(recommendation.status)}>
                          {recommendation.status}
                        </Badge>
                        <div className="flex gap-1">
                          {recommendation.status === "New" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleUpdateRecommendationStatus(recommendation.id, "Implemented")
                                }
                              >
                                Implement
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  handleUpdateRecommendationStatus(
                                    recommendation.id,
                                    "Dismissed",
                                    "Not relevant",
                                  )
                                }
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                          {recommendation.status === "Viewed" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleUpdateRecommendationStatus(recommendation.id, "In Progress")
                              }
                            >
                              Start Work
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                    {recommendation.confidence_level > 0 && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>AI Confidence</span>
                          <span>{(recommendation.confidence_level * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={recommendation.confidence_level * 100} className="h-1" />
                      </div>
                    )}
                  </div>
                ))}

                {recommendations.length === 0 && (
                  <div className="text-center py-8">
                    <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No recommendations available</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      AI-powered insights and recommendations will appear here
                    </p>
                    <Button className="gap-2">
                      <Brain className="w-4 h-4" />
                      Generate Insights
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anomaly Detection */}
        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Anomaly Detection ({anomalies.length})
                </span>
                <Button size="sm" variant="outline" className="gap-2">
                  <Shield className="w-4 h-4" />
                  Run Scan
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Anomaly</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Severity</th>
                      <th className="text-left p-3 font-medium">Score</th>
                      <th className="text-left p-3 font-medium">Detected</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalies.map(anomaly => (
                      <tr key={anomaly.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">{anomaly.anomaly_description}</div>
                            <div className="text-xs text-muted-foreground">
                              {anomaly.entity_type}: {anomaly.entity_id.substring(0, 8)}...
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {anomaly.anomaly_type}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              anomaly.severity === "Critical"
                                ? "destructive"
                                : anomaly.severity === "High"
                                  ? "destructive"
                                  : anomaly.severity === "Medium"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            {anomaly.severity}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            <div
                              className={`font-medium ${
                                anomaly.anomaly_score > 0.8
                                  ? "text-red-600"
                                  : anomaly.anomaly_score > 0.6
                                    ? "text-orange-600"
                                    : anomaly.anomaly_score > 0.4
                                      ? "text-yellow-600"
                                      : "text-green-600"
                              }`}
                            >
                              {(anomaly.anomaly_score * 100).toFixed(0)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Confidence: {(anomaly.confidence_score * 100).toFixed(0)}%
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-muted-foreground">
                            {new Date(anomaly.detected_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(anomaly.status)}>
                            {anomaly.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {anomaly.status === "Open" && (
                              <Button size="sm" variant="outline" className="text-xs">
                                Investigate
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {anomalies.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No anomalies detected</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your data looks healthy! Anomalies will appear here when detected.
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Shield className="w-4 h-4" />
                    Run Full Scan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Workflow className="w-5 h-5" />
                  Workflow Automation ({workflows.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Workflow
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workflows.length === 0 ? (
                <div className="text-center py-8">
                  <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No workflows yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create automated workflows to streamline business processes
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Workflow
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Workflow className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Workflow management coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Advanced workflow automation features will be available here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Quality */}
        <TabsContent value="quality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Quality Insights ({qualityInsights.length})
                </span>
                <Button size="sm" variant="outline" className="gap-2">
                  <Activity className="w-4 h-4" />
                  Run Check
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {qualityInsights.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No quality insights yet</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Run data quality checks to identify improvement opportunities
                  </p>
                  <Button className="gap-2">
                    <Activity className="w-4 h-4" />
                    Run Quality Check
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">Data quality insights coming soon</p>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive data quality analysis and recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
