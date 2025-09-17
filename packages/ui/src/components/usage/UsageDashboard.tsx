"use client";

import React, { useState, useEffect } from "react";
import {
    ChartBarIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ArrowTrendingUpIcon,
    ArrowTrendingDownIcon,
    CalendarIcon,
    FunnelIcon,
    MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../Card.js";
import { Button } from "../../Button.js";
import { Input } from "../../Input.js";
import { Label } from "../../Label.js";
import { Alert } from "../../Alert.js";
import { Badge } from "../../Badge.js";
import { cn } from "../../utils.js";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UsageMetric {
    id: string;
    tenantId: string;
    metricType: string;
    metricValue: number;
    metricUnit: string;
    recordedAt: string;
    metadata?: Record<string, any>;
}

export interface UsageLimit {
    id: string;
    tenantId: string;
    metricType: string;
    limitValue: number;
    limitUnit: string;
    isHardLimit: boolean;
    period: string;
}

export interface UsageSummary {
    totalMetrics: number;
    uniqueMetricTypes: number;
    totalUsage: number;
    averageUsage: number;
    peakUsage: number;
    metricTypeBreakdown: Record<string, any>;
    limitUtilization: Record<string, any>;
}

export interface TimeSeriesData {
    [metricType: string]: Array<{
        timeKey: string;
        value: number;
        count: number;
        unit: string;
    }>;
}

export interface UsageDashboardProps {
    tenantId: string;
    onMetricClick?: (metric: UsageMetric) => void;
    onLimitExceeded?: (limit: UsageLimit) => void;
    className?: string;
}

// ============================================================================
// CONSTANTS & CONFIGURATION
// ============================================================================

const METRIC_TYPES = [
    { key: "api_calls", label: "API Calls", unit: "calls", icon: "🔌" },
    { key: "storage_gb", label: "Storage", unit: "GB", icon: "💾" },
    { key: "users", label: "Users", unit: "users", icon: "👥" },
    { key: "invoices", label: "Invoices", unit: "invoices", icon: "📄" },
    { key: "reports", label: "Reports", unit: "reports", icon: "📊" },
    { key: "exports", label: "Exports", unit: "exports", icon: "📤" },
];

const PERIODS = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
    { value: "1y", label: "Last year" },
];

const GRANULARITIES = [
    { value: "hour", label: "Hourly" },
    { value: "day", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "month", label: "Monthly" },
];

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface UsageSummaryCardProps {
    summary: UsageSummary;
    period: string;
}

function UsageSummaryCard({ summary, period }: UsageSummaryCardProps) {
    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getUtilizationColor = (utilization: number) => {
        if (utilization >= 90) return "text-red-600";
        if (utilization >= 75) return "text-yellow-600";
        return "text-green-600";
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <ChartBarIcon className="w-8 h-8 text-blue-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Total Usage</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(summary.totalUsage)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <ClockIcon className="w-8 h-8 text-green-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Average Daily</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(summary.averageUsage || 0)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <ArrowTrendingUpIcon className="w-8 h-8 text-purple-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Peak Usage</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(summary.peakUsage)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center">
                        <CheckCircleIcon className="w-8 h-8 text-indigo-600" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-500">Health Score</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {summary.averageUsage || 0}/100
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

interface MetricTypeBreakdownProps {
    breakdown: Record<string, any>;
    onMetricClick?: (metricType: string) => void;
}

function MetricTypeBreakdown({ breakdown, onMetricClick }: MetricTypeBreakdownProps) {
    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const sortedMetrics = Object.entries(breakdown)
        .sort(([, a], [, b]) => (b as any).total - (a as any).total)
        .slice(0, 6);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage by Feature</CardTitle>
                <CardDescription>Breakdown of usage across different features</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sortedMetrics.map(([metricType, data]: [string, any]) => {
                        const metricInfo = METRIC_TYPES.find(m => m.key === metricType);
                        return (
                            <div
                                key={metricType}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                                onClick={() => onMetricClick?.(metricType)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="text-2xl">{metricInfo?.icon || "📊"}</div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {metricInfo?.label || metricType}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {data.count} records • {data.unit}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900">
                                        {formatNumber(data.total)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        Avg: {formatNumber(data.average)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

interface LimitUtilizationProps {
    utilization: Record<string, any>;
    onLimitClick?: (limit: any) => void;
}

function LimitUtilization({ utilization, onLimitClick }: LimitUtilizationProps) {
    const getUtilizationColor = (utilization: number) => {
        if (utilization >= 90) return "bg-red-500";
        if (utilization >= 75) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getUtilizationTextColor = (utilization: number) => {
        if (utilization >= 90) return "text-red-600";
        if (utilization >= 75) return "text-yellow-600";
        return "text-green-600";
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Usage Limits</CardTitle>
                <CardDescription>Current usage against your plan limits</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.entries(utilization).map(([metricType, data]: [string, any]) => {
                        const metricInfo = METRIC_TYPES.find(m => m.key === metricType);
                        const utilizationPercent = data.utilization || 0;

                        return (
                            <div
                                key={metricType}
                                className="space-y-2"
                                onClick={() => onLimitClick?.(data)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-lg">{metricInfo?.icon || "📊"}</span>
                                        <span className="font-medium text-gray-900">
                                            {metricInfo?.label || metricType}
                                        </span>
                                    </div>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        getUtilizationTextColor(utilizationPercent)
                                    )}>
                                        {utilizationPercent.toFixed(1)}%
                                    </span>
                                </div>

                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={cn(
                                            "h-2 rounded-full transition-all duration-300",
                                            getUtilizationColor(utilizationPercent)
                                        )}
                                        style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                                    />
                                </div>

                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>{data.usage} {data.unit}</span>
                                    <span>{data.limit} {data.unit}</span>
                                </div>

                                {data.isHardLimit && utilizationPercent >= 90 && (
                                    <Alert className="bg-red-50 border-red-200">
                                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                                        <div className="ml-3">
                                            <p className="text-sm text-red-800">
                                                Approaching hard limit. Usage may be restricted.
                                            </p>
                                        </div>
                                    </Alert>
                                )}
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

interface TimeSeriesChartProps {
    timeSeries: TimeSeriesData;
    selectedMetric?: string;
    onMetricSelect?: (metric: string) => void;
}

function TimeSeriesChart({ timeSeries, selectedMetric, onMetricSelect }: TimeSeriesChartProps) {
    const availableMetrics = Object.keys(timeSeries);
    const displayMetric = selectedMetric || availableMetrics[0];
    const data = timeSeries[displayMetric || 'usage'] || [];

    const formatDate = (timeKey: string) => {
        const date = new Date(timeKey);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const maxValue = Math.max(...data.map((d: any) => d.value), 1);

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Usage Over Time</CardTitle>
                        <CardDescription>Track usage patterns and trends</CardDescription>
                    </div>
                    <div className="flex space-x-2">
                        {availableMetrics.map(metric => (
                            <Button
                                key={metric}
                                variant={metric === displayMetric ? "primary" : "ghost"}
                                size="sm"
                                onClick={() => onMetricSelect?.(metric)}
                            >
                                {METRIC_TYPES.find(m => m.key === metric)?.icon || "📊"}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center space-x-2 mb-4">
                        <span className="text-sm font-medium text-gray-700">
                            {METRIC_TYPES.find(m => m.key === displayMetric)?.label || displayMetric}
                        </span>
                        <Badge variant="outline" className="text-xs">
                            {data.length} data points
                        </Badge>
                    </div>

                    <div className="h-64 flex items-end space-x-1">
                        {data.map((point: any, index: number) => {
                            const height = (point.value / maxValue) * 100;
                            return (
                                <div
                                    key={index}
                                    className="flex-1 bg-blue-500 rounded-t hover:bg-blue-600 transition-colors cursor-pointer"
                                    style={{ height: `${height}%` }}
                                    title={`${formatDate(point.timeKey)}: ${point.value} ${point.unit}`}
                                />
                            );
                        })}
                    </div>

                    <div className="flex justify-between text-xs text-gray-500">
                        <span>{data[0]?.timeKey && formatDate(data[0].timeKey)}</span>
                        <span>{data[data.length - 1]?.timeKey && formatDate(data[data.length - 1]?.timeKey || '')}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function UsageDashboard({
    tenantId,
    onMetricClick,
    onLimitExceeded,
    className
}: UsageDashboardProps) {
    const [metrics, setMetrics] = useState<UsageMetric[]>([]);
    const [summary, setSummary] = useState<UsageSummary | null>(null);
    const [timeSeries, setTimeSeries] = useState<TimeSeriesData>({});
    const [limits, setLimits] = useState<UsageLimit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [period, setPeriod] = useState("30d");
    const [granularity, setGranularity] = useState("day");
    const [metricType, setMetricType] = useState<string>("");
    const [selectedMetric, setSelectedMetric] = useState<string>("");

    // Fetch usage data
    const fetchUsageData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                tenantId,
                granularity,
                limit: "1000",
            });

            if (metricType) params.append("metricType", metricType);

            const response = await fetch(`/api/analytics?${params}`);
            if (!response.ok) {
                throw new Error("Failed to fetch usage data");
            }

            const data = await response.json();
            setMetrics(data.data.metrics || []);
            setSummary(data.data.summary);
            setTimeSeries(data.data.timeSeries || {});
            setLimits(data.data.limits || []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch usage data");
        } finally {
            setLoading(false);
        }
    };

    // Fetch dashboard data
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                tenantId,
                period,
            });

            const response = await fetch(`/api/analytics/dashboard?${params}`);
            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }

            const data = await response.json();
            setSummary(data.data.dashboard.summary);
            setTimeSeries(data.data.dashboard.charts.usageOverTime);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch dashboard data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsageData();
    }, [tenantId, period, granularity, metricType]);

    useEffect(() => {
        fetchDashboardData();
    }, [tenantId, period]);

    if (loading) {
        return (
            <div className={cn("space-y-6", className)}>
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cn("space-y-6", className)}>
                <Alert className="bg-red-50 border-red-200">
                    <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                    <div className="ml-3">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                </Alert>
            </div>
        );
    }

    if (!summary) {
        return (
            <div className={cn("space-y-6", className)}>
                <Card>
                    <CardContent className="p-8 text-center">
                        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900">No Usage Data</h3>
                        <p className="mt-2 text-gray-600">Usage data will appear here once you start using the platform.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Usage Dashboard</h2>
                    <p className="text-gray-600">Monitor your usage and stay within limits</p>
                </div>

                {/* Filters */}
                <div className="flex space-x-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="flex h-10 rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                    >
                        {PERIODS.map((p) => (
                            <option key={p.value} value={p.value}>
                                {p.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={granularity}
                        onChange={(e) => setGranularity(e.target.value)}
                        className="flex h-10 rounded-md border border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] px-3 py-2 text-sm text-[var(--sys-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sys-accent)]"
                    >
                        {GRANULARITIES.map((g) => (
                            <option key={g.value} value={g.value}>
                                {g.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <UsageSummaryCard summary={summary} period={period} />

            {/* Charts and Breakdowns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeSeriesChart
                    timeSeries={timeSeries}
                    selectedMetric={selectedMetric}
                    onMetricSelect={setSelectedMetric}
                />

                <MetricTypeBreakdown
                    breakdown={summary.metricTypeBreakdown}
                    onMetricClick={(metricType) => {
                        setMetricType(metricType);
                        const metric = metrics.find(m => m.metricType === metricType) || metrics[0];
                        if (metric) onMetricClick?.(metric);
                    }}
                />
            </div>

            {/* Usage Limits */}
            <LimitUtilization
                utilization={summary.limitUtilization}
                onLimitClick={(limit) => {
                    if (limit.utilization >= 90) {
                        onLimitExceeded?.(limit);
                    }
                }}
            />
        </div>
    );
}

export default UsageDashboard;
