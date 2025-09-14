import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../Card";
import { Button } from "../../Button";
import { Badge } from "../../Badge";
import { Alert } from "../../Alert";
import { cn } from "../../utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  HardDrive,
  MemoryStick,
  Monitor,
  RefreshCw,
  Server,
  TrendingUp,
  Zap,
} from "lucide-react";

interface PerformanceMetrics {
  responseTime: number;
  bundleSize: number;
  memoryUsage: number;
  cpuUsage: number;
  databaseQueries: number;
  cacheHitRate: number;
  errorRate: number;
  uptime: number;
  activeUsers: number;
  throughput: number;
}

interface PerformanceAlert {
  id: string;
  type: "warning" | "error" | "info";
  message: string;
  timestamp: Date;
  resolved: boolean;
}

interface PerformanceMonitorProps {
  metrics: PerformanceMetrics;
  alerts: PerformanceAlert[];
  onRefresh: () => void;
  onResolveAlert: (alertId: string) => void;
  onOptimize: (optimizationType: string) => void;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  metrics,
  alerts,
  onRefresh,
  onResolveAlert,
  onOptimize,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<"1h" | "24h" | "7d" | "30d">("24h");

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  }, [onRefresh]);

  const getPerformanceStatus = (metric: keyof PerformanceMetrics, value: number) => {
    const thresholds = {
      responseTime: { good: 200, warning: 350, critical: 500 },
      bundleSize: { good: 500, warning: 716, critical: 1000 },
      memoryUsage: { good: 70, warning: 85, critical: 95 },
      cpuUsage: { good: 60, warning: 80, critical: 90 },
      databaseQueries: { good: 50, warning: 100, critical: 200 },
      cacheHitRate: { good: 90, warning: 80, critical: 70 },
      errorRate: { good: 0.1, warning: 1, critical: 5 },
      uptime: { good: 99.9, warning: 99.5, critical: 99 },
      activeUsers: { good: 1000, warning: 5000, critical: 10000 },
      throughput: { good: 1000, warning: 500, critical: 100 },
    };

    const threshold = thresholds[metric];
    if (value <= threshold.good) return "good";
    if (value <= threshold.warning) return "warning";
    return "critical";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "warning":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "critical":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "good":
        return CheckCircle;
      case "warning":
        return AlertTriangle;
      case "critical":
        return AlertTriangle;
      default:
        return Monitor;
    }
  };

  const formatMetric = (metric: keyof PerformanceMetrics, value: number) => {
    switch (metric) {
      case "responseTime":
        return `${value}ms`;
      case "bundleSize":
        return `${(value / 1024).toFixed(1)}KB`;
      case "memoryUsage":
        return `${value}%`;
      case "cpuUsage":
        return `${value}%`;
      case "databaseQueries":
        return value.toLocaleString();
      case "cacheHitRate":
        return `${value}%`;
      case "errorRate":
        return `${value}%`;
      case "uptime":
        return `${value}%`;
      case "activeUsers":
        return value.toLocaleString();
      case "throughput":
        return `${value} req/s`;
      default:
        return value.toString();
    }
  };

  const criticalAlerts = alerts.filter(alert => !alert.resolved && alert.type === "error");
  const warningAlerts = alerts.filter(alert => !alert.resolved && alert.type === "warning");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Performance Monitor</h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Real-time performance metrics and system health monitoring
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeRange}
            onChange={e => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
            aria-label="Select time range"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {(criticalAlerts.length > 0 || warningAlerts.length > 0) && (
        <div className="space-y-3">
          {criticalAlerts.map(alert => (
            <Alert key={alert.id} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h4 className="font-medium">Critical Alert</h4>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolveAlert(alert.id)}
                  className="ml-4"
                >
                  Resolve
                </Button>
              </div>
            </Alert>
          ))}
          {warningAlerts.map(alert => (
            <Alert key={alert.id} variant="default">
              <AlertTriangle className="h-4 w-4" />
              <div className="flex items-center justify-between w-full">
                <div>
                  <h4 className="font-medium">Warning</h4>
                  <p className="text-sm">{alert.message}</p>
                  <p className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                    {alert.timestamp.toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onResolveAlert(alert.id)}
                  className="ml-4"
                >
                  Resolve
                </Button>
              </div>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([key, value]) => {
          const status = getPerformanceStatus(key as keyof PerformanceMetrics, value);
          const StatusIcon = getStatusIcon(status);
          const statusColor = getStatusColor(status);

          return (
            <Card key={key} className="p-4">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={cn(
                      "flex items-center space-x-2 px-2 py-1 rounded-full text-xs font-medium",
                      statusColor,
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-[var(--sys-text-primary)] mb-1">
                  {formatMetric(key as keyof PerformanceMetrics, value)}
                </div>
                <div className="text-xs text-[var(--sys-text-tertiary)]">
                  {status === "good" && "All systems optimal"}
                  {status === "warning" && "Performance degraded"}
                  {status === "critical" && "Immediate attention required"}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance Optimization</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Bundle Optimization</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => onOptimize("bundle-split")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  Code Splitting
                </Button>
                <Button
                  onClick={() => onOptimize("tree-shake")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Tree Shaking
                </Button>
                <Button
                  onClick={() => onOptimize("compress")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Compression
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Caching</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => onOptimize("cache-ttl")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  TTL Optimization
                </Button>
                <Button
                  onClick={() => onOptimize("cache-invalidate")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Cache Invalidation
                </Button>
                <Button
                  onClick={() => onOptimize("cache-warm")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Cache Warming
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Database</h4>
              <div className="space-y-2">
                <Button
                  onClick={() => onOptimize("query-optimize")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Query Optimization
                </Button>
                <Button
                  onClick={() => onOptimize("index-optimize")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Server className="h-4 w-4 mr-2" />
                  Index Optimization
                </Button>
                <Button
                  onClick={() => onOptimize("connection-pool")}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Connection Pool
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MemoryStick className="h-5 w-5" />
              <span>Memory Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--sys-text-secondary)]">Used</span>
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  {metrics.memoryUsage}%
                </span>
              </div>
              <div className="w-full bg-[var(--sys-fill-low)] rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    metrics.memoryUsage > 85
                      ? "bg-[var(--sys-status-error)]"
                      : metrics.memoryUsage > 70
                        ? "bg-[var(--sys-status-warning)]"
                        : "bg-[var(--sys-status-success)]",
                  )}
                  style={{ width: `${Math.min(metrics.memoryUsage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">
                {metrics.memoryUsage > 85
                  ? "High memory usage detected"
                  : metrics.memoryUsage > 70
                    ? "Memory usage is elevated"
                    : "Memory usage is normal"}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>System Load</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--sys-text-secondary)]">CPU Usage</span>
                <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                  {metrics.cpuUsage}%
                </span>
              </div>
              <div className="w-full bg-[var(--sys-fill-low)] rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    metrics.cpuUsage > 80
                      ? "bg-[var(--sys-status-error)]"
                      : metrics.cpuUsage > 60
                        ? "bg-[var(--sys-status-warning)]"
                        : "bg-[var(--sys-status-success)]",
                  )}
                  style={{ width: `${Math.min(metrics.cpuUsage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">
                {metrics.cpuUsage > 80
                  ? "High CPU usage detected"
                  : metrics.cpuUsage > 60
                    ? "CPU usage is elevated"
                    : "CPU usage is normal"}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
