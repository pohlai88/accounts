/**
 * Consolidated Reporting Dashboard - Multi-Entity Financial Consolidation
 * Advanced Multi-Entity Financial Consolidation & Reporting Interface
 *
 * Features:
 * - Multi-entity consolidation group management
 * - Real-time consolidation processing with progress tracking
 * - Consolidated financial statement generation and analysis
 * - Intercompany elimination tracking and management
 * - Multi-currency consolidation with translation impact analysis
 * - Hierarchical entity management with ownership tracking
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
import {
  Building2,
  Users,
  Calculator,
  FileText,
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
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Layers,
  ArrowRightLeft,
  Globe,
  Zap,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import {
  ConsolidatedReportingService,
  ConsolidationDashboard,
  ConsolidationRun,
  ConsolidationAnalysis,
  ConsolidationEntity,
  ConsolidatedTrialBalance,
  StatementType,
  RunStatus,
  EliminationType,
} from "@/lib/consolidated-reporting-service";

interface ConsolidatedReportingDashboardProps {
  consolidationGroupId: string;
}

export default function ConsolidatedReportingDashboard({
  consolidationGroupId,
}: ConsolidatedReportingDashboardProps) {
  const [dashboardData, setDashboardData] = useState<ConsolidationDashboard | null>(null);
  const [consolidationAnalysis, setConsolidationAnalysis] = useState<ConsolidationAnalysis | null>(
    null,
  );
  const [trialBalance, setTrialBalance] = useState<ConsolidatedTrialBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().split("T")[0]);
  const [selectedAccountType, setSelectedAccountType] = useState<string>("all");
  const [showNewRunDialog, setShowNewRunDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [consolidationGroupId, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      if (!loading) setProcessing(true);

      const result = await ConsolidatedReportingService.getConsolidationDashboard(
        consolidationGroupId,
        selectedPeriod,
      );

      if (result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.error("Error loading consolidation dashboard:", result.error);
      }

      // Load trial balance
      const tbResult = await ConsolidatedReportingService.getConsolidatedTrialBalance(
        consolidationGroupId,
        selectedPeriod,
        selectedAccountType === "all" ? undefined : selectedAccountType,
      );

      if (tbResult.success && tbResult.data) {
        setTrialBalance(tbResult.data);
      }
    } catch (error) {
      console.error("Error loading consolidation dashboard:", error);
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const createNewRun = async () => {
    try {
      setProcessing(true);

      const result = await ConsolidatedReportingService.createConsolidationRun(
        consolidationGroupId,
        selectedPeriod,
        `Consolidation - ${new Date().toLocaleDateString()}`,
      );

      if (result.success && result.data) {
        // Start processing the consolidation
        await processConsolidation(result.data.id);
      }

      setShowNewRunDialog(false);
    } catch (error) {
      console.error("Error creating consolidation run:", error);
    } finally {
      setProcessing(false);
    }
  };

  const processConsolidation = async (runId: string) => {
    try {
      setProcessing(true);

      const result = await ConsolidatedReportingService.processConsolidation(runId);

      if (result.success) {
        // Reload dashboard data to reflect the new consolidation
        await loadDashboardData();
      }
    } catch (error) {
      console.error("Error processing consolidation:", error);
    } finally {
      setProcessing(false);
    }
  };

  const loadConsolidationAnalysis = async () => {
    try {
      const result = await ConsolidatedReportingService.getConsolidationAnalysis(
        consolidationGroupId,
        selectedPeriod,
      );

      if (result.success && result.data) {
        setConsolidationAnalysis(result.data);
        setShowAnalysisDialog(true);
      }
    } catch (error) {
      console.error("Error loading consolidation analysis:", error);
    }
  };

  const getRunStatusColor = (status: RunStatus) => {
    switch (status) {
      case "Completed":
        return "text-green-600 bg-green-50";
      case "Running":
        return "text-blue-600 bg-blue-50";
      case "Failed":
        return "text-red-600 bg-red-50";
      case "Pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getEliminationTypeIcon = (type: EliminationType) => {
    switch (type) {
      case "Intercompany Sales":
        return <ArrowRightLeft className="w-4 h-4 text-blue-600" />;
      case "Intercompany Receivables":
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case "Intercompany Payables":
        return <Minus className="w-4 h-4 text-red-600" />;
      case "Investment Elimination":
        return <Building2 className="w-4 h-4 text-purple-600" />;
      default:
        return <Calculator className="w-4 h-4 text-gray-600" />;
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
          <p className="text-muted-foreground">Loading consolidation dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load consolidation dashboard</p>
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
            <Building2 className="w-6 h-6" />
            Consolidated Reporting
          </h2>
          <p className="text-muted-foreground">
            {dashboardData.consolidation_group.group_name} - Multi-entity financial consolidation
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={new Date().toISOString().split("T")[0]}>Current Month</SelectItem>
              <SelectItem
                value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              >
                Last Month
              </SelectItem>
              <SelectItem
                value={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
              >
                Last Quarter
              </SelectItem>
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
          <Dialog open={showNewRunDialog} onOpenChange={setShowNewRunDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={processing}>
                <Play className="w-4 h-4" />
                Run Consolidation
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Consolidation Process</DialogTitle>
                <DialogDescription>
                  This will process the consolidation for {selectedPeriod} including intercompany
                  eliminations and currency translation.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowNewRunDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewRun} disabled={processing} className="gap-2">
                  {processing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Consolidation
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entities</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {dashboardData.consolidation_summary.total_entities}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Active consolidation entities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Building2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(dashboardData.consolidation_summary.total_assets)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Consolidated assets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eliminations</CardTitle>
            <ArrowRightLeft className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(dashboardData.consolidation_summary.eliminations_total)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Intercompany eliminations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Quality</CardTitle>
            <Target className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatPercentage(dashboardData.consolidation_summary.data_completeness * 100)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Data completeness score</p>
          </CardContent>
        </Card>
      </div>

      {/* Latest Run Status */}
      {dashboardData.latest_run && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Latest Consolidation Run
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-lg">{dashboardData.latest_run.run_name}</div>
                <div className="text-sm text-muted-foreground">
                  Started:{" "}
                  {dashboardData.latest_run.started_at
                    ? new Date(dashboardData.latest_run.started_at).toLocaleString()
                    : "Not started"}
                </div>
              </div>
              <Badge
                className={getRunStatusColor(dashboardData.latest_run.run_status)}
                variant="outline"
              >
                {dashboardData.latest_run.run_status}
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{formatPercentage(dashboardData.latest_run.progress_percentage)}</span>
                </div>
                <Progress value={dashboardData.latest_run.progress_percentage} className="h-2" />
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Entities</div>
                  <div className="font-medium">{dashboardData.latest_run.entities_processed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Accounts</div>
                  <div className="font-medium">{dashboardData.latest_run.accounts_processed}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Eliminations</div>
                  <div className="font-medium">{dashboardData.latest_run.eliminations_created}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Amount</div>
                  <div className="font-medium">
                    {formatCurrency(dashboardData.latest_run.total_amount_consolidated)}
                  </div>
                </div>
              </div>

              {dashboardData.latest_run.current_step_description && (
                <div className="text-sm text-muted-foreground">
                  Current Step: {dashboardData.latest_run.current_step_description}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Issues */}
      {dashboardData.validation_issues.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-amber-800 dark:text-amber-200">
                  {dashboardData.validation_issues.length} Validation Issue
                  {dashboardData.validation_issues.length > 1 ? "s" : ""}
                </strong>
                <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {dashboardData.validation_issues[0].description}
                  {dashboardData.validation_issues.length > 1 &&
                    ` and ${dashboardData.validation_issues.length - 1} more`}
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
          <TabsTrigger value="entities">Entities</TabsTrigger>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="eliminations">Eliminations</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Consolidation Ratio</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatPercentage(dashboardData.key_metrics.consolidation_ratio)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Intercompany Eliminations</span>
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(dashboardData.key_metrics.intercompany_eliminations)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Currency Impact</span>
                    <span className="text-lg font-bold text-amber-600">
                      {formatCurrency(dashboardData.key_metrics.currency_impact)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Processing Efficiency</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={dashboardData.key_metrics.processing_efficiency}
                        className="w-20 h-2"
                      />
                      <span className="text-sm font-medium">
                        {formatPercentage(dashboardData.key_metrics.processing_efficiency)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Assets</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(dashboardData.consolidation_summary.total_assets)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Liabilities</span>
                    <span className="text-lg font-bold text-red-600">
                      {formatCurrency(dashboardData.consolidation_summary.total_liabilities)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Equity</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(dashboardData.consolidation_summary.total_equity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Minority Interest</span>
                    <span className="text-lg font-bold text-purple-600">
                      {formatCurrency(dashboardData.consolidation_summary.minority_interest)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Financial Statements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Financial Statements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.financial_statements.slice(0, 5).map((statement, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-sm">{statement.statement_type}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(statement.reporting_period).toLocaleDateString()} -{" "}
                        {statement.statement_version}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statement.published ? "default" : "secondary"}>
                        {statement.review_status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {dashboardData.financial_statements.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No financial statements generated</p>
                    <p className="text-sm">Run consolidation to generate statements</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entities Tab */}
        <TabsContent value="entities" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Consolidation Entities</h3>
              <p className="text-sm text-muted-foreground">
                Entities included in the consolidation group
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Entity
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {dashboardData.entities.map((entity, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">
                        {(entity as any).company?.name || "Unknown Company"}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        {entity.control_type}
                      </Badge>
                    </div>
                    <Button size="sm" variant="ghost">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ownership:</span>
                      <span className="font-medium">
                        {formatPercentage(entity.ownership_percentage)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span className="font-medium">{entity.consolidation_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Currency:</span>
                      <span className="font-medium">{entity.functional_currency}</span>
                    </div>
                    {entity.acquisition_date && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Acquired:</span>
                        <span className="font-medium">
                          {new Date(entity.acquisition_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>Active</span>
                      <span>•</span>
                      <span>Translation: {entity.translation_method}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Trial Balance Tab */}
        <TabsContent value="trial-balance" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Consolidated Trial Balance</h3>
              <p className="text-sm text-muted-foreground">
                Consolidated account balances with elimination details
              </p>
            </div>
            <div className="flex gap-2">
              <Select value={selectedAccountType} onValueChange={setSelectedAccountType}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Account Types</SelectItem>
                  <SelectItem value="Asset">Assets</SelectItem>
                  <SelectItem value="Liability">Liabilities</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expenses</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadDashboardData} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-7 gap-4 p-3 bg-muted text-sm font-medium">
                  <div>Account</div>
                  <div className="text-right">Pre-Elim Debit</div>
                  <div className="text-right">Pre-Elim Credit</div>
                  <div className="text-right">Eliminations</div>
                  <div className="text-right">Post-Elim Balance</div>
                  <div className="text-right">Contributing Entities</div>
                  <div className="text-center">Actions</div>
                </div>

                {trialBalance.slice(0, 20).map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-7 gap-4 p-3 border-t text-sm hover:bg-muted/50"
                  >
                    <div>
                      <div className="font-medium">{item.account_name}</div>
                      <div className="text-xs text-muted-foreground">{item.account_code}</div>
                    </div>
                    <div className="text-right">
                      {item.pre_elimination_debit > 0
                        ? formatCurrency(item.pre_elimination_debit)
                        : "-"}
                    </div>
                    <div className="text-right">
                      {item.pre_elimination_credit > 0
                        ? formatCurrency(item.pre_elimination_credit)
                        : "-"}
                    </div>
                    <div className="text-right">
                      {item.elimination_debit + item.elimination_credit > 0
                        ? formatCurrency(item.elimination_debit + item.elimination_credit)
                        : "-"}
                    </div>
                    <div
                      className={`text-right font-medium ${
                        item.consolidated_balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(Math.abs(item.consolidated_balance))}
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {item.contributing_entities.length} entities
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}

                {trialBalance.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calculator className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No consolidated trial balance data</p>
                    <p className="text-sm">Run consolidation to generate trial balance</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Eliminations Tab */}
        <TabsContent value="eliminations" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Intercompany Eliminations</h3>
            <p className="text-sm text-muted-foreground">
              Elimination entries for intercompany transactions
            </p>
          </div>

          <div className="space-y-4">
            {dashboardData.recent_eliminations.map((elimination, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getEliminationTypeIcon(elimination.elimination_type)}
                        <span className="font-medium text-sm">{elimination.elimination_type}</span>
                        <Badge variant={elimination.is_automatic ? "default" : "secondary"}>
                          {elimination.is_automatic ? "Auto" : "Manual"}
                        </Badge>
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">
                        {elimination.description}
                      </p>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Amount: </span>
                          <span className="font-medium">
                            {formatCurrency(elimination.elimination_amount)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Period: </span>
                          <span className="font-medium">
                            {new Date(elimination.consolidation_period).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Entities: </span>
                          <span className="font-medium">{elimination.source_entities.length}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Badge
                        className={`${
                          elimination.approval_status === "Approved"
                            ? "bg-green-50 text-green-600"
                            : elimination.approval_status === "Pending"
                              ? "bg-yellow-50 text-yellow-600"
                              : "bg-gray-50 text-gray-600"
                        }`}
                        variant="outline"
                      >
                        {elimination.approval_status}
                      </Badge>
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {dashboardData.recent_eliminations.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ArrowRightLeft className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">No Elimination Entries</h3>
                  <p className="text-sm text-muted-foreground">
                    Elimination entries will appear here after running consolidation
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Statements Tab */}
        <TabsContent value="statements" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Consolidated Financial Statements</h3>
              <p className="text-sm text-muted-foreground">
                Generated consolidated financial reports
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Generate Statements
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {["Balance Sheet", "Income Statement", "Cash Flow Statement"].map(statementType => {
              const statement = dashboardData.financial_statements.find(
                s => s.statement_type === statementType,
              );

              return (
                <Card
                  key={statementType}
                  className={statement ? "border-green-200" : "border-dashed"}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-sm mb-1">{statementType}</h4>
                        {statement ? (
                          <div>
                            <Badge variant="default" className="text-xs mb-2">
                              {statement.statement_version}
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              {new Date(statement.reporting_period).toLocaleDateString()}
                            </div>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Not Generated
                          </Badge>
                        )}
                      </div>
                      <Button size="sm" variant={statement ? "default" : "outline"}>
                        {statement ? <Eye className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                      </Button>
                    </div>

                    {statement && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Framework:</span>
                          <span className="font-medium">{statement.reporting_framework}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entities:</span>
                          <span className="font-medium">{statement.total_entities}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge
                            variant={statement.published ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {statement.review_status}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Consolidation Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Advanced consolidation analytics and insights
              </p>
            </div>
            <Button onClick={loadConsolidationAnalysis} className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Generate Analysis
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consolidation Quality Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {Math.round(dashboardData.consolidation_summary.data_completeness * 100)}
                  </div>
                  <div className="text-sm text-muted-foreground mb-4">out of 100</div>
                  <Progress
                    value={dashboardData.consolidation_summary.data_completeness * 100}
                    className="mb-4"
                  />
                  <Badge
                    variant={
                      dashboardData.consolidation_summary.data_completeness >= 0.95
                        ? "default"
                        : dashboardData.consolidation_summary.data_completeness >= 0.85
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {dashboardData.consolidation_summary.data_completeness >= 0.95
                      ? "Excellent"
                      : dashboardData.consolidation_summary.data_completeness >= 0.85
                        ? "Good"
                        : "Needs Improvement"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Processing Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Processing Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efficiency Score</span>
                    <span className="font-bold text-green-600">
                      {formatPercentage(dashboardData.key_metrics.processing_efficiency)}
                    </span>
                  </div>
                  <Progress
                    value={dashboardData.key_metrics.processing_efficiency}
                    className="h-2"
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Last Run Time</div>
                      <div className="font-medium">
                        {dashboardData.latest_run?.processing_duration_seconds
                          ? `${dashboardData.latest_run.processing_duration_seconds}s`
                          : "N/A"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Error Rate</div>
                      <div className="font-medium">
                        {dashboardData.latest_run?.error_count
                          ? `${dashboardData.latest_run.error_count} errors`
                          : "0 errors"}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Placeholder for detailed analysis charts */}
          <Card>
            <CardHeader>
              <CardTitle>Consolidation Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4" />
                  <p className="text-lg font-medium">Consolidation Analytics</p>
                  <p className="text-sm">Period-over-period consolidation analysis and trends</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Analysis Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Consolidation Analysis</DialogTitle>
            <DialogDescription>
              Detailed consolidation analysis with period comparison and insights
            </DialogDescription>
          </DialogHeader>

          {consolidationAnalysis && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Entity Contribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {consolidationAnalysis.entity_contribution
                        .slice(0, 5)
                        .map((entity, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{entity.entity_name}</span>
                            <span className="font-medium">
                              {formatPercentage(entity.percentage_of_consolidated)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Elimination Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(consolidationAnalysis.elimination_impact.by_type).map(
                        ([type, amount]) => (
                          <div key={type} className="flex justify-between text-sm">
                            <span>{type}</span>
                            <span className="font-medium">{formatCurrency(amount as number)}</span>
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
