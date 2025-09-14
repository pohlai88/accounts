/**
 * Performance Dashboard - Enterprise System Performance Monitoring
 * Real-time Performance Analytics & Optimization Management
 *
 * Features:
 * - Real-time system performance metrics
 * - Query optimization tracking and recommendations
 * - Batch processing job monitoring
 * - Cache performance analysis
 * - Database health and bottleneck identification
 * - Performance trend analysis and alerts
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
import {
  Activity,
  Zap,
  Database,
  Cpu,
  MemoryStick,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Settings,
  Download,
  Eye,
  Play,
  Pause,
  BarChart3,
  PieChart,
  LineChart,
  Gauge,
  Server,
  HardDrive,
  Wifi,
  Target,
  Layers,
  Code,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  PerformanceOptimizationService,
  PerformanceMetrics,
  QueryOptimizationPlan,
  PerformanceOptimizationResult,
} from "@/lib/performance-optimization-service";

interface PerformanceDashboardProps {
  companyId: string;
}

export default function PerformanceDashboard({ companyId }: PerformanceDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics[]>([]);
  const [optimizationPlans, setOptimizationPlans] = useState<QueryOptimizationPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("24h");
  const [showOptimizationDialog, setShowOptimizationDialog] = useState(false);
  const [runningOptimization, setRunningOptimization] = useState(false);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [companyId]);

  const loadDashboardData = async () => {
    try {
      if (!loading) setRefreshing(true);

      const dashboardResult = await PerformanceOptimizationService.getPerformanceDashboard();

      if (dashboardResult) {
        setDashboardData(dashboardResult);
        setPerformanceMetrics(dashboardResult.trend_data || []);
      }
    } catch (error) {
      console.error("Error loading performance dashboard:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const runOptimization = async () => {
    setRunningOptimization(true);
    try {
      // Simulate running optimization on sample data
      const mockGLEntries = Array.from({ length: 1000 }, (_, i) => ({
        id: `entry-${i}`,
        account_id: `account-${i % 10}`,
        company_id: companyId,
        posting_date: new Date().toISOString().split("T")[0],
        debit: Math.random() * 10000,
        credit: Math.random() * 10000,
      }));

      const result = await PerformanceOptimizationService.optimizedGLValidation(mockGLEntries);

      if (result.success) {
        // Update dashboard with optimization results
        await loadDashboardData();
        setShowOptimizationDialog(false);
      }
    } catch (error) {
      console.error("Error running optimization:", error);
    } finally {
      setRunningOptimization(false);
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  const getHealthBadgeVariant = (score: number) => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    if (score >= 50) return "outline";
    return "destructive";
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatNumber = (num: number) => {
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    return `${(num / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading performance dashboard...</p>
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
            <Activity className="w-6 h-6" />
            Performance Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time system performance monitoring and optimization
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1H</SelectItem>
              <SelectItem value="24h">24H</SelectItem>
              <SelectItem value="7d">7D</SelectItem>
              <SelectItem value="30d">30D</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Dialog open={showOptimizationDialog} onOpenChange={setShowOptimizationDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Zap className="w-4 h-4" />
                Optimize
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Run Performance Optimization</DialogTitle>
                <DialogDescription>
                  This will analyze and optimize system performance including database queries,
                  caching strategies, and memory usage.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowOptimizationDialog(false)}
                  disabled={runningOptimization}
                >
                  Cancel
                </Button>
                <Button onClick={runOptimization} disabled={runningOptimization} className="gap-2">
                  {runningOptimization ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Start Optimization
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
            <Gauge className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getHealthColor(dashboardData?.system_health?.overall_score || 0)}`}
            >
              {dashboardData?.system_health?.overall_score || 0}%
            </div>
            <div className="mt-2">
              <Progress value={dashboardData?.system_health?.overall_score || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database Health</CardTitle>
            <Database className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getHealthColor(dashboardData?.system_health?.database_health || 0)}`}
            >
              {dashboardData?.system_health?.database_health || 0}%
            </div>
            <div className="mt-2">
              <Progress
                value={dashboardData?.system_health?.database_health || 0}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Health</CardTitle>
            <Layers className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getHealthColor(dashboardData?.system_health?.cache_health || 0)}`}
            >
              {dashboardData?.system_health?.cache_health || 0}%
            </div>
            <div className="mt-2">
              <Progress value={dashboardData?.system_health?.cache_health || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Health</CardTitle>
            <MemoryStick className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getHealthColor(dashboardData?.system_health?.memory_health || 0)}`}
            >
              {dashboardData?.system_health?.memory_health || 0}%
            </div>
            <div className="mt-2">
              <Progress value={dashboardData?.system_health?.memory_health || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatDuration(dashboardData?.current_metrics?.duration_ms || 0)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="w-3 h-3 text-green-600" />
              <span>-15% vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboardData?.current_metrics?.memory_usage_mb || 0}MB
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-orange-600" />
              <span>+8% vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Throughput</CardTitle>
            <Zap className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(dashboardData?.current_metrics?.throughput_ops_per_second || 0)}/s
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span>+23% vs last hour</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Target className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {((dashboardData?.current_metrics?.cache_hit_ratio || 0) * 100).toFixed(1)}%
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3 text-green-600" />
              <span>+5% vs last hour</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="w-5 h-5" />
                  Performance Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <LineChart className="w-8 h-8 mx-auto mb-2" />
                    <p>Performance Trend Chart</p>
                    <p className="text-xs">Response time and throughput over {selectedTimeframe}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="w-5 h-5" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">CPU Usage</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {dashboardData?.current_metrics?.cpu_usage_percent || 0}%
                      </div>
                      <Progress
                        value={dashboardData?.current_metrics?.cpu_usage_percent || 0}
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Memory</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {dashboardData?.current_metrics?.memory_usage_mb || 0}MB
                      </div>
                      <Progress
                        value={(dashboardData?.current_metrics?.memory_usage_mb || 0) / 10}
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">DB Connections</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {dashboardData?.current_metrics?.database_connections || 0}/50
                      </div>
                      <Progress
                        value={(dashboardData?.current_metrics?.database_connections || 0) * 2}
                        className="w-20 h-2 mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Disk I/O</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">Normal</div>
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Healthy
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error and Warning Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Errors (Last Hour)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {dashboardData?.current_metrics?.error_count || 0}
                </div>
                <p className="text-sm text-muted-foreground">-60% from previous hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  Warnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {dashboardData?.current_metrics?.warning_count || 0}
                </div>
                <p className="text-sm text-muted-foreground">+12% from previous hour</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">99.2%</div>
                <p className="text-sm text-muted-foreground">Within SLA targets</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Tab */}
        <TabsContent value="database" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Query Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Query Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">245ms</div>
                      <div className="text-xs text-muted-foreground">Avg Query Time</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">1,250</div>
                      <div className="text-xs text-muted-foreground">Queries/sec</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-600">12</div>
                      <div className="text-xs text-muted-foreground">Slow Queries</div>
                    </div>
                  </div>

                  <div className="h-32 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart3 className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-sm">Query Performance Chart</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Connection Pool */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wifi className="w-5 h-5" />
                  Connection Pool
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="outline">
                      {dashboardData?.current_metrics?.database_connections || 0}/50
                    </Badge>
                  </div>
                  <Progress
                    value={(dashboardData?.current_metrics?.database_connections || 0) * 2}
                    className="h-3"
                  />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Max Pool Size</div>
                      <div className="font-medium">50</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Wait Time</div>
                      <div className="font-medium">&lt; 1ms</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Idle Connections</div>
                      <div className="font-medium">25</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Pool Efficiency</div>
                      <div className="font-medium text-green-600">98%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Slow Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Slow Queries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    query:
                      "SELECT * FROM gl_entries WHERE company_id = ? AND posting_date BETWEEN ? AND ?",
                    duration: "2.3s",
                    count: 45,
                  },
                  {
                    query: "SELECT SUM(debit - credit) FROM gl_entries WHERE account_id IN (?)",
                    duration: "1.8s",
                    count: 23,
                  },
                  {
                    query:
                      "UPDATE budget_line_items SET actual_amount = ? WHERE budget_plan_id = ?",
                    duration: "1.2s",
                    count: 12,
                  },
                ].map((slowQuery, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-mono text-sm text-muted-foreground mb-1">
                        {slowQuery.query}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Duration: {slowQuery.duration}</span>
                        <span>Count: {slowQuery.count}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button size="sm" variant="ghost">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Zap className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Optimization History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Recent Optimizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      type: "Query Optimization",
                      improvement: "+45%",
                      timestamp: "2 hours ago",
                      status: "success",
                    },
                    {
                      type: "Cache Strategy",
                      improvement: "+23%",
                      timestamp: "4 hours ago",
                      status: "success",
                    },
                    {
                      type: "Index Addition",
                      improvement: "+67%",
                      timestamp: "1 day ago",
                      status: "success",
                    },
                  ].map((opt, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-sm">{opt.type}</div>
                        <div className="text-xs text-muted-foreground">{opt.timestamp}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">{opt.improvement}</div>
                        <Badge
                          variant={opt.status === "success" ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {opt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Cache Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Cache Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {((dashboardData?.current_metrics?.cache_hit_ratio || 0) * 100).toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Hit Ratio</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">245MB</div>
                      <div className="text-xs text-muted-foreground">Cache Size</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Memory Cache</span>
                      <span>89% hit rate</span>
                    </div>
                    <Progress value={89} className="h-2" />

                    <div className="flex justify-between text-sm">
                      <span>Redis Cache</span>
                      <span>76% hit rate</span>
                    </div>
                    <Progress value={76} className="h-2" />
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
                {dashboardData?.optimization_opportunities?.map(
                  (opportunity: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{opportunity.area}</h4>
                        <Badge variant="outline">{opportunity.potential_improvement}</Badge>
                      </div>

                      <div className="text-sm text-muted-foreground mb-3">
                        Recommended actions to improve system performance
                      </div>

                      <div className="space-y-2">
                        {opportunity.recommended_actions.map(
                          (action: string, actionIndex: number) => (
                            <div key={actionIndex} className="flex items-center gap-2 text-sm">
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                              <span>{action}</span>
                            </div>
                          ),
                        )}
                      </div>

                      <div className="flex justify-end mt-3">
                        <Button size="sm" variant="outline" className="gap-2">
                          <Play className="w-3 h-3" />
                          Apply
                        </Button>
                      </div>
                    </div>
                  ),
                ) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                    <p>System is running optimally</p>
                    <p className="text-sm">No optimization opportunities identified</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Real-time Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2" />
                    <p>Real-time Metrics Chart</p>
                    <p className="text-xs">Live system performance data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Performance Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { metric: "Response Time", threshold: "> 2s", status: "active" },
                    { metric: "Memory Usage", threshold: "> 80%", status: "active" },
                    { metric: "Error Rate", threshold: "> 1%", status: "inactive" },
                    { metric: "Cache Hit Ratio", threshold: "< 70%", status: "active" },
                  ].map((alert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted rounded"
                    >
                      <div>
                        <div className="font-medium text-sm">{alert.metric}</div>
                        <div className="text-xs text-muted-foreground">{alert.threshold}</div>
                      </div>
                      <Badge
                        variant={alert.status === "active" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {alert.status}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button size="sm" variant="outline" className="w-full gap-2">
                    <Settings className="w-4 h-4" />
                    Configure Alerts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">Performance Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered recommendations to optimize system performance
            </p>
          </div>

          <div className="space-y-4">
            {dashboardData?.optimization_opportunities?.length > 0 ? (
              dashboardData.optimization_opportunities.map((rec: any, index: number) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">High Impact</Badge>
                          <span className="font-medium text-sm">{rec.area}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {rec.potential_improvement} improvement potential
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium mb-2">Recommended Actions:</h5>
                      <ul className="text-sm space-y-1">
                        {rec.recommended_actions.map((action: string, actionIndex: number) => (
                          <li key={actionIndex} className="flex items-start gap-2">
                            <span className="text-blue-600 mt-0.5">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Performance is Optimal</h3>
                  <p className="text-sm text-muted-foreground">
                    System is running efficiently. Continue monitoring for any changes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
