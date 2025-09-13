import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card';
import { Button } from '../../Button';
import { Badge } from '../../Badge';
import { Alert } from '../../Alert';
import { Input } from '../../Input';
import { cn } from '../../utils';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    Download,
    Eye,
    Filter,
    TrendingUp,
    TrendingDown,
    Zap,
    Target,
    DollarSign,
    Users,
    Calendar,
    RefreshCw,
    AlertCircle,
    Shield,
    Database,
    Settings
} from 'lucide-react';

interface RuleExecution {
    id: string;
    ruleId: string;
    ruleName: string;
    executedAt: Date;
    success: boolean;
    executionTime: number;
    cost: number;
    triggeredBy: string;
    conditions: number;
    actions: number;
    error?: string;
}

interface RuleMetrics {
    ruleId: string;
    ruleName: string;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    totalCost: number;
    costPerExecution: number;
    lastExecuted: Date;
    firstExecuted: Date;
    executionsToday: number;
    executionsThisWeek: number;
    executionsThisMonth: number;
    peakExecutionTime: string;
    mostCommonTrigger: string;
    errorRate: number;
    retryCount: number;
}

interface PerformanceAlert {
    id: string;
    ruleId: string;
    ruleName: string;
    type: 'error_rate' | 'execution_time' | 'cost' | 'success_rate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    currentValue: number;
    triggeredAt: Date;
    resolved: boolean;
}

interface RuleAnalyticsProps {
    metrics: RuleMetrics[];
    executions: RuleExecution[];
    alerts: PerformanceAlert[];
    onRefreshMetrics: () => void;
    onExportMetrics: (metrics: RuleMetrics[]) => void;
    onExportExecutions: (executions: RuleExecution[]) => void;
    onViewRuleDetails: (ruleId: string) => void;
    onResolveAlert: (alertId: string) => void;
    onSetAlertThreshold: (ruleId: string, type: string, threshold: number) => void;
}

export const RuleAnalytics: React.FC<RuleAnalyticsProps> = ({
    metrics,
    executions,
    alerts,
    onRefreshMetrics,
    onExportMetrics,
    onExportExecutions,
    onViewRuleDetails,
    onResolveAlert,
    onSetAlertThreshold,
}) => {
    const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d' | '90d'>('24h');
    const [selectedRuleId, setSelectedRuleId] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'totalExecutions' | 'successRate' | 'totalCost' | 'averageExecutionTime'>('totalExecutions');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const filteredMetrics = useMemo(() => {
        let filtered = metrics;

        if (selectedRuleId !== 'all') {
            filtered = filtered.filter(m => m.ruleId === selectedRuleId);
        }

        return filtered.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
        });
    }, [metrics, selectedRuleId, sortBy, sortOrder]);

    const filteredExecutions = useMemo(() => {
        const now = new Date();
        const timeRanges = {
            '1h': 1 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
        };

        const cutoff = new Date(now.getTime() - timeRanges[selectedTimeRange]);
        return executions.filter(e => e.executedAt >= cutoff);
    }, [executions, selectedTimeRange]);

    const overallStats = useMemo(() => {
        const total = filteredExecutions.length;
        const successful = filteredExecutions.filter(e => e.success).length;
        const failed = total - successful;
        const totalCost = filteredExecutions.reduce((sum, e) => sum + e.cost, 0);
        const avgExecutionTime = total > 0
            ? filteredExecutions.reduce((sum, e) => sum + e.executionTime, 0) / total
            : 0;

        return {
            totalExecutions: total,
            successfulExecutions: successful,
            failedExecutions: failed,
            successRate: total > 0 ? (successful / total) * 100 : 0,
            totalCost,
            averageExecutionTime: avgExecutionTime,
            errorRate: total > 0 ? (failed / total) * 100 : 0
        };
    }, [filteredExecutions]);

    const activeAlerts = useMemo(() => {
        return alerts.filter(alert => !alert.resolved);
    }, [alerts]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'low': return 'text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10';
            case 'medium': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'high': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'critical': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/20';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const formatExecutionTime = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    const formatCost = (cost: number) => {
        return `$${cost.toFixed(4)}`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Rule Analytics</h2>
                    <p className="text-[var(--sys-text-secondary)] mt-1">
                        Monitor rule performance, costs, and execution metrics
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={onRefreshMetrics}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>Refresh</span>
                    </Button>
                    <Button
                        onClick={() => onExportMetrics(filteredMetrics)}
                        variant="outline"
                        className="flex items-center space-x-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export</span>
                    </Button>
                </div>
            </div>

            {/* Active Alerts */}
            {activeAlerts.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">Active Alerts</h3>
                    {activeAlerts.map((alert) => (
                        <Alert key={alert.id} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <AlertCircle className="h-5 w-5 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">{alert.ruleName}</h4>
                                        <p className="text-sm">{alert.message}</p>
                                        <div className="flex items-center space-x-4 mt-2 text-xs text-[var(--sys-text-tertiary)]">
                                            <span>Threshold: {alert.threshold}</span>
                                            <span>Current: {alert.currentValue}</span>
                                            <span>{alert.triggeredAt.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                                        {alert.severity}
                                    </Badge>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onResolveAlert(alert.id)}
                                    >
                                        Resolve
                                    </Button>
                                </div>
                            </div>
                        </Alert>
                    ))}
                </div>
            )}

            {/* Overall Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Activity className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Total Executions</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        {formatNumber(overallStats.totalExecutions)}
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                        Last {selectedTimeRange}
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        {overallStats.successRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                        {overallStats.successfulExecutions} successful
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Avg Time</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        {formatExecutionTime(overallStats.averageExecutionTime)}
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                        per execution
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Total Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        {formatCost(overallStats.totalCost)}
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)] mt-1">
                        Last {selectedTimeRange}
                    </div>
                </Card>
            </div>

            {/* Filters and Controls */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                            <span className="text-sm font-medium text-[var(--sys-text-primary)]">Filters:</span>
                        </div>

                        <select
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
                            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        >
                            <option value="1h">Last Hour</option>
                            <option value="24h">Last 24 Hours</option>
                            <option value="7d">Last 7 Days</option>
                            <option value="30d">Last 30 Days</option>
                            <option value="90d">Last 90 Days</option>
                        </select>

                        <select
                            value={selectedRuleId}
                            onChange={(e) => setSelectedRuleId(e.target.value)}
                            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        >
                            <option value="all">All Rules</option>
                            {metrics.map((metric) => (
                                <option key={metric.ruleId} value={metric.ruleId}>
                                    {metric.ruleName}
                                </option>
                            ))}
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        >
                            <option value="totalExecutions">Executions</option>
                            <option value="successRate">Success Rate</option>
                            <option value="totalCost">Cost</option>
                            <option value="averageExecutionTime">Execution Time</option>
                        </select>

                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        >
                            {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Rule Metrics Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <BarChart3 className="h-5 w-5" />
                        <span>Rule Performance ({filteredMetrics.length} rules)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-[var(--sys-border-hairline)]">
                                    <th className="text-left py-3 px-4 font-medium text-[var(--sys-text-primary)]">Rule Name</th>
                                    <th className="text-right py-3 px-4 font-medium text-[var(--sys-text-primary)]">Executions</th>
                                    <th className="text-right py-3 px-4 font-medium text-[var(--sys-text-primary)]">Success Rate</th>
                                    <th className="text-right py-3 px-4 font-medium text-[var(--sys-text-primary)]">Avg Time</th>
                                    <th className="text-right py-3 px-4 font-medium text-[var(--sys-text-primary)]">Total Cost</th>
                                    <th className="text-right py-3 px-4 font-medium text-[var(--sys-text-primary)]">Last Executed</th>
                                    <th className="text-center py-3 px-4 font-medium text-[var(--sys-text-primary)]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMetrics.map((metric) => (
                                    <tr key={metric.ruleId} className="border-b border-[var(--sys-border-hairline)] hover:bg-[var(--sys-fill-low)]">
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-medium text-[var(--sys-text-primary)]">{metric.ruleName}</div>
                                                <div className="text-sm text-[var(--sys-text-tertiary)]">ID: {metric.ruleId}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="font-medium text-[var(--sys-text-primary)]">
                                                {formatNumber(metric.totalExecutions)}
                                            </div>
                                            <div className="text-sm text-[var(--sys-text-tertiary)]">
                                                {metric.executionsToday} today
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <div className="font-medium text-[var(--sys-text-primary)]">
                                                    {metric.successRate.toFixed(1)}%
                                                </div>
                                                {metric.successRate >= 95 ? (
                                                    <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                                                ) : metric.successRate >= 80 ? (
                                                    <AlertTriangle className="h-4 w-4 text-[var(--sys-status-warning)]" />
                                                ) : (
                                                    <AlertCircle className="h-4 w-4 text-[var(--sys-status-error)]" />
                                                )}
                                            </div>
                                            <div className="text-sm text-[var(--sys-text-tertiary)]">
                                                {metric.successfulExecutions} successful
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="font-medium text-[var(--sys-text-primary)]">
                                                {formatExecutionTime(metric.averageExecutionTime)}
                                            </div>
                                            <div className="text-sm text-[var(--sys-text-tertiary)]">
                                                Peak: {metric.peakExecutionTime}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="font-medium text-[var(--sys-text-primary)]">
                                                {formatCost(metric.totalCost)}
                                            </div>
                                            <div className="text-sm text-[var(--sys-text-tertiary)]">
                                                {formatCost(metric.costPerExecution)} per run
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="text-sm text-[var(--sys-text-primary)]">
                                                {metric.lastExecuted.toLocaleString()}
                                            </div>
                                            <div className="text-xs text-[var(--sys-text-tertiary)]">
                                                {metric.mostCommonTrigger}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onViewRuleDetails(metric.ruleId)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onSetAlertThreshold(metric.ruleId, 'success_rate', 90)}
                                                >
                                                    <Settings className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Executions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>Recent Executions ({filteredExecutions.length})</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {filteredExecutions.slice(0, 10).map((execution) => (
                            <div
                                key={execution.id}
                                className="flex items-center justify-between p-3 border border-[var(--sys-border-hairline)] rounded-lg"
                            >
                                <div className="flex items-center space-x-3">
                                    {execution.success ? (
                                        <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 text-[var(--sys-status-error)]" />
                                    )}
                                    <div>
                                        <div className="font-medium text-[var(--sys-text-primary)]">
                                            {execution.ruleName}
                                        </div>
                                        <div className="text-sm text-[var(--sys-text-secondary)]">
                                            {execution.triggeredBy} • {execution.conditions} conditions • {execution.actions} actions
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-[var(--sys-text-tertiary)]">
                                    <span>{formatExecutionTime(execution.executionTime)}</span>
                                    <span>{formatCost(execution.cost)}</span>
                                    <span>{execution.executedAt.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredExecutions.length > 10 && (
                        <div className="mt-4 text-center">
                            <Button
                                variant="outline"
                                onClick={() => onExportExecutions(filteredExecutions)}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export All Executions
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
