import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card';
import { Button } from '../../Button';
import { Badge } from '../../Badge';
import { Alert } from '../../Alert';
import { cn } from '../../utils';
import {
    AlertTriangle,
    Bell,
    CheckCircle,
    Clock,
    Database,
    Eye,
    Globe,
    Mail,
    MessageSquare,
    Monitor,
    RefreshCw,
    Settings,
    Shield,
    Slack,
    Smartphone,
    Webhook,
    Zap,
    Activity,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';

interface AlertRule {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
    threshold: number;
    severity: 'critical' | 'warning' | 'info';
    status: 'active' | 'inactive' | 'testing';
    lastTriggered?: Date;
    triggerCount: number;
    channels: string[];
}

interface Alert {
    id: string;
    ruleId: string;
    title: string;
    message: string;
    severity: 'critical' | 'warning' | 'info';
    status: 'open' | 'acknowledged' | 'resolved';
    createdAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    acknowledgedBy?: string;
    resolvedBy?: string;
}

interface NotificationChannel {
    id: string;
    name: string;
    type: 'email' | 'slack' | 'webhook' | 'sms' | 'push';
    status: 'active' | 'inactive' | 'error';
    lastTested: Date;
    configuration: Record<string, any>;
}

interface MonitoringMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
    threshold: {
        warning: number;
        critical: number;
    };
}

interface MonitoringAlertingProps {
    alertRules: AlertRule[];
    alerts: Alert[];
    notificationChannels: NotificationChannel[];
    metrics: MonitoringMetric[];
    onCreateAlertRule: () => void;
    onUpdateAlertRule: (ruleId: string) => void;
    onDeleteAlertRule: (ruleId: string) => void;
    onAcknowledgeAlert: (alertId: string) => void;
    onResolveAlert: (alertId: string) => void;
    onTestChannel: (channelId: string) => void;
    onUpdateChannel: (channelId: string) => void;
}

export const MonitoringAlerting: React.FC<MonitoringAlertingProps> = ({
    alertRules,
    alerts,
    notificationChannels,
    metrics,
    onCreateAlertRule,
    onUpdateAlertRule,
    onDeleteAlertRule,
    onAcknowledgeAlert,
    onResolveAlert,
    onTestChannel,
    onUpdateChannel,
}) => {
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [selectedChannelType, setSelectedChannelType] = useState<string>('all');

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'warning': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'info': return 'text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'resolved': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'acknowledged': return 'text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10';
            case 'open': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getChannelStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10';
            case 'error': return 'text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10';
            case 'inactive': return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
            default: return 'text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return TrendingUp;
            case 'down': return TrendingDown;
            case 'stable': return Minus;
            default: return Minus;
        }
    };

    const getChannelIcon = (type: string) => {
        switch (type) {
            case 'email': return Mail;
            case 'slack': return Slack;
            case 'webhook': return Webhook;
            case 'sms': return Smartphone;
            case 'push': return Bell;
            default: return Bell;
        }
    };

    const filteredAlerts = alerts.filter(alert => {
        const severityMatch = selectedSeverity === 'all' || alert.severity === selectedSeverity;
        const statusMatch = selectedStatus === 'all' || alert.status === selectedStatus;
        return severityMatch && statusMatch;
    });

    const filteredChannels = selectedChannelType === 'all'
        ? notificationChannels
        : notificationChannels.filter(channel => channel.type === selectedChannelType);

    const openAlerts = alerts.filter(alert => alert.status === 'open');
    const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && alert.status === 'open');
    const activeRules = alertRules.filter(rule => rule.status === 'active');
    const activeChannels = notificationChannels.filter(channel => channel.status === 'active');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Monitoring & Alerting</h2>
                    <p className="text-[var(--sys-text-secondary)] mt-1">
                        Real-time monitoring, alerting, and notification management
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        onClick={onCreateAlertRule}
                        className="flex items-center space-x-2"
                    >
                        <Bell className="h-4 w-4" />
                        <span>Create Alert Rule</span>
                    </Button>
                </div>
            </div>

            {/* Critical Alerts */}
            {criticalAlerts.length > 0 && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <div>
                        <h4 className="font-medium">Critical Alerts Active</h4>
                        <p className="text-sm">
                            {criticalAlerts.length} critical alerts require immediate attention.
                        </p>
                    </div>
                </Alert>
            )}

            {/* Monitoring Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Open Alerts</div>
                            <Bell className="h-4 w-4 text-[var(--sys-status-error)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-status-error)]">
                            {openAlerts.length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            {criticalAlerts.length} critical
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Active Rules</div>
                            <Settings className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {activeRules.length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            {alertRules.length} total
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Channels</div>
                            <MessageSquare className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {activeChannels.length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            {notificationChannels.length} total
                        </div>
                    </CardContent>
                </Card>

                <Card className="p-4">
                    <CardContent className="p-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className="text-sm text-[var(--sys-text-secondary)]">Metrics</div>
                            <Activity className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                        </div>
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {metrics.length}
                        </div>
                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                            Monitored
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Key Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Activity className="h-5 w-5" />
                        <span>Key Metrics</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {metrics.map((metric) => {
                            const TrendIcon = getTrendIcon(metric.trend);
                            const isWarning = metric.value >= metric.threshold.warning;
                            const isCritical = metric.value >= metric.threshold.critical;

                            return (
                                <div key={metric.name} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-[var(--sys-text-primary)]">{metric.name}</h4>
                                        <TrendIcon className={cn(
                                            "h-4 w-4",
                                            metric.trend === 'up' && "text-[var(--sys-status-success)]",
                                            metric.trend === 'down' && "text-[var(--sys-status-error)]",
                                            metric.trend === 'stable' && "text-[var(--sys-text-tertiary)]"
                                        )} />
                                    </div>
                                    <div className="text-2xl font-bold text-[var(--sys-text-primary)] mb-1">
                                        {metric.value} {metric.unit}
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                        <span className={cn(
                                            isCritical ? "text-[var(--sys-status-error)]" :
                                                isWarning ? "text-[var(--sys-status-warning)]" :
                                                    "text-[var(--sys-text-tertiary)]"
                                        )}>
                                            {metric.change > 0 ? '+' : ''}{metric.change}% from last hour
                                        </span>
                                        <span className="text-[var(--sys-text-tertiary)]">
                                            {isCritical ? 'Critical' : isWarning ? 'Warning' : 'Normal'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Active Alerts */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Active Alerts</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Alert Filters */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedSeverity}
                                onChange={(e) => setSelectedSeverity(e.target.value)}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Filter by severity"
                            >
                                <option value="all">All Severities</option>
                                <option value="critical">Critical</option>
                                <option value="warning">Warning</option>
                                <option value="info">Info</option>
                            </select>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Filter by status"
                            >
                                <option value="all">All Statuses</option>
                                <option value="open">Open</option>
                                <option value="acknowledged">Acknowledged</option>
                                <option value="resolved">Resolved</option>
                            </select>
                        </div>

                        {/* Alerts List */}
                        <div className="space-y-3">
                            {filteredAlerts.map((alert) => (
                                <div key={alert.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getSeverityColor(alert.severity))}>
                                                    {alert.severity.toUpperCase()}
                                                </div>
                                                <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(alert.status))}>
                                                    {alert.status.toUpperCase()}
                                                </div>
                                            </div>
                                            <h4 className="font-medium text-[var(--sys-text-primary)] mb-1">
                                                {alert.title}
                                            </h4>
                                            <p className="text-sm text-[var(--sys-text-secondary)] mb-2">
                                                {alert.message}
                                            </p>
                                            <div className="text-xs text-[var(--sys-text-tertiary)]">
                                                Created: {alert.createdAt.toLocaleString()}
                                                {alert.acknowledgedAt && ` | Acknowledged: ${alert.acknowledgedAt.toLocaleString()}`}
                                                {alert.resolvedAt && ` | Resolved: ${alert.resolvedAt.toLocaleString()}`}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            {alert.status === 'open' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onAcknowledgeAlert(alert.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                            )}
                                            {alert.status === 'acknowledged' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => onResolveAlert(alert.id)}
                                                >
                                                    Resolve
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alert Rules */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Settings className="h-5 w-5" />
                        <span>Alert Rules</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {alertRules.map((rule) => (
                            <div key={rule.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getSeverityColor(rule.severity))}>
                                                {rule.severity.toUpperCase()}
                                            </div>
                                            <div className={cn("px-2 py-1 rounded-full text-xs font-medium", rule.status === 'active' ? "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10" : "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]")}>
                                                {rule.status.toUpperCase()}
                                            </div>
                                        </div>
                                        <h4 className="font-medium text-[var(--sys-text-primary)] mb-1">
                                            {rule.name}
                                        </h4>
                                        <p className="text-sm text-[var(--sys-text-secondary)] mb-2">
                                            {rule.description}
                                        </p>
                                        <div className="text-xs text-[var(--sys-text-tertiary)]">
                                            {rule.metric} {rule.condition.replace('_', ' ')} {rule.threshold} |
                                            Triggered {rule.triggerCount} times |
                                            Channels: {rule.channels.join(', ')}
                                            {rule.lastTriggered && ` | Last triggered: ${rule.lastTriggered.toLocaleString()}`}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => onUpdateAlertRule(rule.id)}
                                        >
                                            <Settings className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => onDeleteAlertRule(rule.id)}
                                            className="text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Notification Channels */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <MessageSquare className="h-5 w-5" />
                        <span>Notification Channels</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Channel Filter */}
                        <div className="flex items-center space-x-4">
                            <select
                                value={selectedChannelType}
                                onChange={(e) => setSelectedChannelType(e.target.value)}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Filter by channel type"
                            >
                                <option value="all">All Types</option>
                                <option value="email">Email</option>
                                <option value="slack">Slack</option>
                                <option value="webhook">Webhook</option>
                                <option value="sms">SMS</option>
                                <option value="push">Push</option>
                            </select>
                        </div>

                        {/* Channels List */}
                        <div className="space-y-3">
                            {filteredChannels.map((channel) => {
                                const ChannelIcon = getChannelIcon(channel.type);
                                return (
                                    <div key={channel.id} className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <ChannelIcon className="h-5 w-5" />
                                                <div>
                                                    <h4 className="font-medium text-[var(--sys-text-primary)]">{channel.name}</h4>
                                                    <p className="text-sm text-[var(--sys-text-secondary)]">
                                                        {channel.type.charAt(0).toUpperCase() + channel.type.slice(1)} channel |
                                                        Last tested: {channel.lastTested.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <div className={cn("px-2 py-1 rounded-full text-xs font-medium", getChannelStatusColor(channel.status))}>
                                                    {channel.status.toUpperCase()}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onTestChannel(channel.id)}
                                                >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Test
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onUpdateChannel(channel.id)}
                                                >
                                                    <Settings className="h-3 w-3 mr-1" />
                                                    Configure
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
