/**
 * GL Entry Validation Dashboard
 * Real-time monitoring and analytics for validation performance
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  validationTelemetry,
  ValidationMetrics,
  ValidationEvent,
  PerformanceAlert,
  ValidationTelemetryUtils,
} from "@/lib/monitoring/validation-telemetry";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  XCircle,
  Zap,
  Database,
  Users,
  FileText,
  BarChart3,
} from "lucide-react";

interface ValidationDashboardProps {
  companyId?: string;
  refreshInterval?: number;
}

export function ValidationDashboard({
  companyId,
  refreshInterval = 30000,
}: ValidationDashboardProps) {
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const [recentEvents, setRecentEvents] = useState<ValidationEvent[]>([]);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [healthStatus, setHealthStatus] = useState<ReturnType<
    typeof validationTelemetry.getHealthStatus
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  // Refresh data
  const refreshData = async () => {
    try {
      const [currentMetrics, events, currentAlerts, health] = await Promise.all([
        Promise.resolve(validationTelemetry.getMetrics(companyId)),
        Promise.resolve(validationTelemetry.getRecentEvents(50, companyId)),
        Promise.resolve(validationTelemetry.getAlerts()),
        Promise.resolve(validationTelemetry.getHealthStatus()),
      ]);

      setMetrics(currentMetrics);
      setRecentEvents(events);
      setAlerts(currentAlerts);
      setHealthStatus(health);
    } catch (error) {
      console.error("Failed to refresh validation dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Set up auto-refresh
  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [companyId, refreshInterval]);

  if (isLoading || !metrics || !healthStatus) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading validation dashboard...</span>
      </div>
    );
  }

  const performanceReport = ValidationTelemetryUtils.createPerformanceReport(metrics);
  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const highAlerts = alerts.filter(a => a.severity === "high");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Validation Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time GL Entry validation monitoring and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge
            variant={
              healthStatus.status === "healthy"
                ? "default"
                : healthStatus.status === "degraded"
                  ? "secondary"
                  : "destructive"
            }
          >
            {healthStatus.status.toUpperCase()}
          </Badge>
          <Button onClick={refreshData} size="sm">
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Validation Issues Detected</AlertTitle>
          <AlertDescription>
            {criticalAlerts.length} critical alert(s) require immediate attention.
            <Button
              variant="link"
              className="p-0 h-auto ml-2"
              onClick={() => setSelectedTab("alerts")}
            >
              View Details
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics.successRate * 100).toFixed(2)}%</div>
            <Progress value={metrics.successRate * 100} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Grade: {performanceReport.grade}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.averageProcessingTime.toFixed(0)}ms</div>
            <div className="text-xs text-muted-foreground mt-2">
              P95: {metrics.performancePercentiles.p95}ms
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Validations</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.validationCount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Recent period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle
              className={`h-4 w-4 ${alerts.length > 0 ? "text-red-600" : "text-gray-400"}`}
            />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <div className="text-xs text-muted-foreground mt-2">
              {criticalAlerts.length} critical, {highAlerts.length} high
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Error Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Overall validation system performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Performance Grade</span>
                    <Badge
                      variant={
                        performanceReport.grade === "A"
                          ? "default"
                          : performanceReport.grade === "B"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {performanceReport.grade}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Success Rate</span>
                    <span className="text-sm font-medium">
                      {(metrics.successRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Avg Processing Time</span>
                    <span className="text-sm font-medium">
                      {metrics.averageProcessingTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>

                {performanceReport.recommendations.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                    <ul className="text-xs space-y-1">
                      {performanceReport.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start">
                          <TrendingUp className="h-3 w-3 mt-0.5 mr-2 text-blue-500" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Errors */}
            <Card>
              <CardHeader>
                <CardTitle>Top Validation Errors</CardTitle>
                <CardDescription>Most frequent validation issues</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metrics.errorsByCode)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([code, count]) => (
                      <div key={code} className="flex justify-between items-center">
                        <span className="text-sm font-mono">{code}</span>
                        <Badge variant="destructive">{count}</Badge>
                      </div>
                    ))}
                  {Object.keys(metrics.errorsByCode).length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      No validation errors detected
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Validation Events</CardTitle>
              <CardDescription>Latest validation activities and outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentEvents.map(event => (
                  <div
                    key={event.eventId}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {event.eventType === "validation_success" ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : event.eventType === "validation_failure" ? (
                        <XCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      )}
                      <div>
                        <div className="font-medium text-sm">
                          {event.voucherType} {event.voucherNo}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{event.processingTimeMs}ms</div>
                      <div className="text-xs text-muted-foreground">
                        {event.errorCount} errors, {event.warningCount} warnings
                      </div>
                    </div>
                  </div>
                ))}
                {recentEvents.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Activity className="h-8 w-8 mx-auto mb-2" />
                    No recent validation events
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Alerts</CardTitle>
              <CardDescription>System alerts and performance warnings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {alerts.map(alert => (
                  <Alert
                    key={alert.alertId}
                    variant={alert.severity === "critical" ? "destructive" : "default"}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>{alert.type.replace("_", " ").toUpperCase()}</span>
                      <Badge
                        variant={
                          alert.severity === "critical"
                            ? "destructive"
                            : alert.severity === "high"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {alert.severity}
                      </Badge>
                    </AlertTitle>
                    <AlertDescription>
                      <div>{alert.message}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
                {alerts.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    No active alerts
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Processing Time Distribution</CardTitle>
                <CardDescription>Validation performance percentiles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">P50 (Median)</span>
                    <span className="font-medium">{metrics.performancePercentiles.p50}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">P95</span>
                    <span className="font-medium">{metrics.performancePercentiles.p95}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">P99</span>
                    <span className="font-medium">{metrics.performancePercentiles.p99}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Average</span>
                    <span className="font-medium">
                      {metrics.averageProcessingTime.toFixed(2)}ms
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Overall validation system status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Status</span>
                    <Badge
                      variant={
                        healthStatus.status === "healthy"
                          ? "default"
                          : healthStatus.status === "degraded"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {healthStatus.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Active Alerts</span>
                    <span className="font-medium">{healthStatus.alerts}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Last Event</span>
                    <span className="font-medium text-xs">
                      {healthStatus.lastEventTime
                        ? new Date(healthStatus.lastEventTime).toLocaleString()
                        : "None"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Breakdown</CardTitle>
                <CardDescription>Validation errors by type and frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metrics.errorsByCode)
                    .sort((a, b) => b[1] - a[1])
                    .map(([code, count]) => (
                      <div
                        key={code}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <span className="text-sm font-mono">{code}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{
                                width: `${(count / Math.max(...Object.values(metrics.errorsByCode))) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Warning Breakdown</CardTitle>
                <CardDescription>Validation warnings by type and frequency</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(metrics.warningsByCode)
                    .sort((a, b) => b[1] - a[1])
                    .map(([code, count]) => (
                      <div
                        key={code}
                        className="flex justify-between items-center p-2 border rounded"
                      >
                        <span className="text-sm font-mono">{code}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{count}</span>
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-yellow-500 h-2 rounded-full"
                              style={{
                                width: `${(count / Math.max(...Object.values(metrics.warningsByCode))) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
