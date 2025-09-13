/**
 * Continuous Monitoring Dashboard - Advanced Financial Controls & Risk Monitoring
 * Comprehensive Internal Controls, Automated Testing & Risk Assessment Interface
 * 
 * Features:
 * - Real-time control effectiveness monitoring with automated testing
 * - Intelligent monitoring rules engine with smart alerting
 * - Key Risk Indicators (KRI) tracking with predictive analytics
 * - Control testing execution and exception management
 * - Comprehensive risk assessment and trend analysis
 * - Executive-level reporting and compliance dashboards
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Shield,
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
    Activity,
    Target,
    Layers,
    Zap,
    Filter,
    MoreHorizontal,
    Bell,
    BellOff,
    Users,
    FileText,
    BarChart3,
    PieChart,
    LineChart,
    Search,
    Calendar,
    MapPin,
    AlertCircle,
    XCircle,
    UserCheck,
    ClipboardCheck,
    Gauge,
    TrendingDown as Risk,
    Award,
    Briefcase,
    Building,
    Database,
    Lock,
    Unlock,
    Ban,
    CheckSquare,
    AlertOctagon
} from 'lucide-react'
import {
    ContinuousMonitoringService,
    MonitoringDashboard,
    MonitoringAnalysis,
    InternalControl,
    ControlTestExecution,
    MonitoringAlert,
    ControlEffectivenessMetric,
    KeyRiskIndicator,
    KRIMeasurement,
    ControlTestException
} from '@/lib/continuous-monitoring-service'

interface ContinuousMonitoringDashboardProps {
    companyId?: string
}

export default function ContinuousMonitoringDashboard({ companyId }: ContinuousMonitoringDashboardProps) {
    const [dashboardData, setDashboardData] = useState<MonitoringDashboard | null>(null)
    const [analysisData, setAnalysisData] = useState<MonitoringAnalysis | null>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)
    const [selectedFilter, setSelectedFilter] = useState<string>('all')
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('30d')
    const [showNewRuleDialog, setShowNewRuleDialog] = useState(false)
    const [showNewTestDialog, setShowNewTestDialog] = useState(false)
    const [showAnalysisDialog, setShowAnalysisDialog] = useState(false)

    useEffect(() => {
        loadDashboardData()
        const interval = setInterval(loadDashboardData, 30000) // Refresh every 30 seconds
        return () => clearInterval(interval)
    }, [companyId, selectedTimeframe])

    const loadDashboardData = async () => {
        try {
            if (!loading) setProcessing(true)

            const result = await ContinuousMonitoringService.getMonitoringDashboard()

            if (result.success && result.data) {
                setDashboardData(result.data)
            } else {
                console.error('Error loading monitoring dashboard:', result.error)
            }

        } catch (error) {
            console.error('Error loading monitoring dashboard:', error)
        } finally {
            setLoading(false)
            setProcessing(false)
        }
    }

    const executeMonitoringRules = async () => {
        try {
            setProcessing(true)

            const result = await ContinuousMonitoringService.executeMonitoringRules()

            if (result.success && result.data) {
                // Reload dashboard to reflect new alerts
                await loadDashboardData()
            }

        } catch (error) {
            console.error('Error executing monitoring rules:', error)
        } finally {
            setProcessing(false)
        }
    }

    const loadAnalysisData = async () => {
        try {
            const result = await ContinuousMonitoringService.getMonitoringAnalysis()

            if (result.success && result.data) {
                setAnalysisData(result.data)
                setShowAnalysisDialog(true)
            }

        } catch (error) {
            console.error('Error loading monitoring analysis:', error)
        }
    }

    const getAlertSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200'
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Effective': return 'text-green-600 bg-green-50'
            case 'Ineffective': return 'text-red-600 bg-red-50'
            case 'Needs Improvement': return 'text-yellow-600 bg-yellow-50'
            case 'completed': return 'text-green-600 bg-green-50'
            case 'in_progress': return 'text-blue-600 bg-blue-50'
            case 'resolved': return 'text-green-600 bg-green-50'
            case 'new': return 'text-red-600 bg-red-50'
            case 'acknowledged': return 'text-yellow-600 bg-yellow-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const getRiskLevelIcon = (level: string) => {
        switch (level) {
            case 'Critical': return <AlertOctagon className="w-4 h-4 text-red-600" />
            case 'High': return <AlertTriangle className="w-4 h-4 text-orange-600" />
            case 'Medium': return <AlertCircle className="w-4 h-4 text-yellow-600" />
            case 'Low': return <CheckCircle className="w-4 h-4 text-green-600" />
            default: return <Shield className="w-4 h-4 text-gray-600" />
        }
    }

    const getKRIStatusIcon = (color: string) => {
        switch (color) {
            case 'Red': return <XCircle className="w-4 h-4 text-red-600" />
            case 'Yellow': return <AlertTriangle className="w-4 h-4 text-yellow-600" />
            case 'Green': return <CheckCircle className="w-4 h-4 text-green-600" />
            default: return <Clock className="w-4 h-4 text-gray-600" />
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatPercentage = (value: number) => {
        return `${value.toFixed(1)}%`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString()
    }

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading monitoring dashboard...</p>
                </div>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-600 mx-auto mb-4" />
                    <p className="text-muted-foreground">Failed to load monitoring dashboard</p>
                    <Button onClick={loadDashboardData} className="mt-4">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="w-6 h-6" />
                        Continuous Monitoring
                    </h2>
                    <p className="text-muted-foreground">
                        Advanced financial controls monitoring and risk assessment dashboard
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
                        <RefreshCw className={`w-4 h-4 ${processing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        Export
                    </Button>
                    <Button
                        onClick={executeMonitoringRules}
                        disabled={processing}
                        className="gap-2"
                    >
                        <Play className="w-4 h-4" />
                        Run Rules
                    </Button>
                </div>
            </div>

            {/* Critical Alerts Banner */}
            {dashboardData.monitoring_summary.critical_alerts > 0 && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription>
                        <div className="flex items-center justify-between">
                            <div>
                                <strong className="text-red-800 dark:text-red-200">
                                    {dashboardData.monitoring_summary.critical_alerts} Critical Alert{dashboardData.monitoring_summary.critical_alerts > 1 ? 's' : ''}
                                </strong>
                                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    Immediate attention required for critical control deficiencies
                                </div>
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 border-red-300">
                                <Eye className="w-4 h-4" />
                                View Alerts
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Controls</CardTitle>
                        <Shield className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {dashboardData.control_summary.active_controls}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dashboardData.control_summary.sox_controls} SOX relevant
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Effectiveness Rate</CardTitle>
                        <Target className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {formatPercentage(dashboardData.testing_summary.overall_effectiveness_rate)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dashboardData.testing_summary.total_tests_completed} tests completed
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                        <Bell className="h-4 w-4 text-amber-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-600">
                            {dashboardData.monitoring_summary.alerts_today}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dashboardData.monitoring_summary.critical_alerts} critical
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Risk Indicators</CardTitle>
                        <Gauge className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                            {dashboardData.kri_summary.total_kris}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {dashboardData.kri_summary.red_status_count} above threshold
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Control Testing Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ClipboardCheck className="w-5 h-5" />
                        Control Testing Status
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">Testing Progress</div>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Completed Tests</span>
                                        <span>{dashboardData.testing_summary.total_tests_completed}</span>
                                    </div>
                                    <Progress value={75} className="h-2" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>In Progress</span>
                                        <span>{dashboardData.testing_summary.tests_in_progress}</span>
                                    </div>
                                    <Progress value={15} className="h-2 bg-blue-100" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Requiring Testing</span>
                                        <span>{dashboardData.control_summary.controls_requiring_testing}</span>
                                    </div>
                                    <Progress value={10} className="h-2 bg-amber-100" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">Test Results</div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Effective Controls
                                    </span>
                                    <span className="font-medium">
                                        {Math.round(dashboardData.testing_summary.overall_effectiveness_rate)}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        Significant Deficiencies
                                    </span>
                                    <span className="font-medium">
                                        {dashboardData.testing_summary.significant_deficiencies}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm flex items-center gap-2">
                                        <XCircle className="w-4 h-4 text-red-600" />
                                        Material Weaknesses
                                    </span>
                                    <span className="font-medium">
                                        {dashboardData.testing_summary.material_weaknesses}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-2">Exception Management</div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Open Exceptions</span>
                                    <Badge variant="outline" className="text-red-600 border-red-200">
                                        {dashboardData.testing_summary.exceptions_open}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">High Risk Controls</span>
                                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                                        {dashboardData.control_summary.high_risk_controls}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Automated Controls</span>
                                    <Badge variant="outline" className="text-blue-600 border-blue-200">
                                        {dashboardData.control_summary.automated_controls}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="controls">Controls</TabsTrigger>
                    <TabsTrigger value="alerts">Alerts</TabsTrigger>
                    <TabsTrigger value="testing">Testing</TabsTrigger>
                    <TabsTrigger value="kris">Risk Indicators</TabsTrigger>
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Control Effectiveness Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Control Effectiveness Trends
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <LineChart className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-lg font-medium">Effectiveness Trends</p>
                                        <p className="text-sm">Historical control effectiveness analysis</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Risk Heat Map */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5" />
                                    Risk Heat Map
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { area: 'Financial Reporting', risk: 'Low', color: 'bg-green-100 border-green-300' },
                                        { area: 'Revenue', risk: 'Medium', color: 'bg-yellow-100 border-yellow-300' },
                                        { area: 'Procurement', risk: 'Medium', color: 'bg-yellow-100 border-yellow-300' },
                                        { area: 'Payroll', risk: 'Low', color: 'bg-green-100 border-green-300' },
                                        { area: 'IT Security', risk: 'High', color: 'bg-red-100 border-red-300' },
                                        { area: 'Data Privacy', risk: 'Medium', color: 'bg-yellow-100 border-yellow-300' },
                                        { area: 'Compliance', risk: 'Low', color: 'bg-green-100 border-green-300' },
                                        { area: 'Treasury', risk: 'Medium', color: 'bg-yellow-100 border-yellow-300' }
                                    ].map((item, index) => (
                                        <div key={index} className={`p-2 border rounded-lg text-center ${item.color}`}>
                                            <div className="text-xs font-medium truncate">{item.area}</div>
                                            <div className="text-xs text-muted-foreground">{item.risk}</div>
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
                                    <Bell className="w-5 h-5" />
                                    Recent Alerts
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {dashboardData.recent_alerts.slice(0, 5).map((alert, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{alert.alert_title}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDateTime(alert.alert_timestamp)}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getAlertSeverityColor(alert.alert_severity)} variant="outline">
                                                    {alert.alert_severity}
                                                </Badge>
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {dashboardData.recent_alerts.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No recent alerts</p>
                                            <p className="text-sm">All monitoring rules are operating normally</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Recent Exceptions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {dashboardData.recent_exceptions.slice(0, 5).map((exception, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex-1">
                                                <div className="font-medium text-sm">{exception.exception_type}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {formatDate(exception.exception_date)} • {exception.severity_level} severity
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={getStatusColor(exception.exception_status)} variant="outline">
                                                    {exception.exception_status}
                                                </Badge>
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {dashboardData.recent_exceptions.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-600" />
                                            <p>No recent exceptions</p>
                                            <p className="text-sm">All control tests are passing</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Controls Tab */}
                <TabsContent value="controls" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Internal Controls</h3>
                            <p className="text-sm text-muted-foreground">
                                Manage and monitor internal controls across all frameworks
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                                <SelectTrigger className="w-40">
                                    <SelectValue placeholder="Filter controls" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Controls</SelectItem>
                                    <SelectItem value="sox">SOX Controls</SelectItem>
                                    <SelectItem value="high_risk">High Risk</SelectItem>
                                    <SelectItem value="automated">Automated</SelectItem>
                                    <SelectItem value="requires_testing">Requires Testing</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add Control
                            </Button>
                        </div>
                    </div>

                    <Card>
                        <CardContent className="p-0">
                            <div className="border rounded-lg overflow-hidden">
                                <div className="grid grid-cols-8 gap-4 p-3 bg-muted text-sm font-medium">
                                    <div>Control ID</div>
                                    <div>Name</div>
                                    <div>Framework</div>
                                    <div>Process Area</div>
                                    <div>Risk Level</div>
                                    <div>Type</div>
                                    <div>Status</div>
                                    <div>Actions</div>
                                </div>

                                {/* Mock control data for demo */}
                                {[
                                    { id: 'FRC-001', name: 'Journal Entry Controls', framework: 'SOX', area: 'Financial Reporting', risk: 'High', type: 'Manual', status: 'Effective' },
                                    { id: 'REV-005', name: 'Revenue Recognition', framework: 'COSO', area: 'Revenue', risk: 'Critical', type: 'Automated', status: 'Effective' },
                                    { id: 'PRO-012', name: 'Purchase Authorization', framework: 'Custom', area: 'Procurement', risk: 'Medium', type: 'Manual', status: 'Needs Improvement' },
                                    { id: 'PAY-008', name: 'Payroll Processing', framework: 'SOX', area: 'Payroll', risk: 'High', type: 'Semi-automated', status: 'Effective' },
                                    { id: 'ITS-003', name: 'Access Controls', framework: 'COBIT', area: 'IT Security', risk: 'Critical', type: 'Automated', status: 'Ineffective' }
                                ].map((control, index) => (
                                    <div key={index} className="grid grid-cols-8 gap-4 p-3 border-t text-sm hover:bg-muted/50">
                                        <div className="font-medium">{control.id}</div>
                                        <div>{control.name}</div>
                                        <div>
                                            <Badge variant="outline">{control.framework}</Badge>
                                        </div>
                                        <div>{control.area}</div>
                                        <div className="flex items-center gap-1">
                                            {getRiskLevelIcon(control.risk)}
                                            <span>{control.risk}</span>
                                        </div>
                                        <div>{control.type}</div>
                                        <div>
                                            <Badge className={getStatusColor(control.status)} variant="outline">
                                                {control.status}
                                            </Badge>
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
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Monitoring Alerts</h3>
                            <p className="text-sm text-muted-foreground">
                                Real-time alerts from monitoring rules engine
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Filter className="w-4 h-4" />
                                Filter
                            </Button>
                            <Button className="gap-2">
                                <Settings className="w-4 h-4" />
                                Manage Rules
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Critical</div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {dashboardData.monitoring_summary.critical_alerts}
                                        </div>
                                    </div>
                                    <AlertOctagon className="w-8 h-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Today</div>
                                        <div className="text-2xl font-bold text-amber-600">
                                            {dashboardData.monitoring_summary.alerts_today}
                                        </div>
                                    </div>
                                    <Bell className="w-8 h-8 text-amber-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Resolved</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {dashboardData.monitoring_summary.alerts_resolved}
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
                                        <div className="text-sm text-muted-foreground">Accuracy</div>
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatPercentage(dashboardData.monitoring_summary.detection_accuracy)}
                                        </div>
                                    </div>
                                    <Target className="w-8 h-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        {dashboardData.recent_alerts.map((alert, index) => (
                            <Card key={index}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={getAlertSeverityColor(alert.alert_severity)} variant="outline">
                                                    {alert.alert_severity}
                                                </Badge>
                                                <Badge variant="secondary">
                                                    {alert.alert_category}
                                                </Badge>
                                                <span className="text-sm text-muted-foreground">
                                                    {formatDateTime(alert.alert_timestamp)}
                                                </span>
                                            </div>

                                            <h4 className="font-medium text-lg mb-2">{alert.alert_title}</h4>
                                            <p className="text-sm text-muted-foreground mb-3">{alert.alert_description}</p>

                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                {alert.trigger_value && (
                                                    <div>
                                                        <span className="text-muted-foreground">Trigger Value: </span>
                                                        <span className="font-medium">{alert.trigger_value.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {alert.threshold_value && (
                                                    <div>
                                                        <span className="text-muted-foreground">Threshold: </span>
                                                        <span className="font-medium">{alert.threshold_value.toLocaleString()}</span>
                                                    </div>
                                                )}
                                                {alert.variance_percentage && (
                                                    <div>
                                                        <span className="text-muted-foreground">Variance: </span>
                                                        <span className="font-medium">{formatPercentage(alert.variance_percentage)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 ml-4">
                                            <Badge className={getStatusColor(alert.alert_status)} variant="outline">
                                                {alert.alert_status}
                                            </Badge>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost">
                                                <UserCheck className="w-4 h-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {dashboardData.recent_alerts.length === 0 && (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                                    <h3 className="font-medium mb-2">No Active Alerts</h3>
                                    <p className="text-sm text-muted-foreground">
                                        All monitoring rules are within normal thresholds
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Testing Tab */}
                <TabsContent value="testing" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Control Testing</h3>
                            <p className="text-sm text-muted-foreground">
                                Execute and manage control testing procedures
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <Calendar className="w-4 h-4" />
                                Testing Plan
                            </Button>
                            <Button className="gap-2">
                                <Play className="w-4 h-4" />
                                Execute Test
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Testing Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Tests Completed</span>
                                        <span className="font-bold text-green-600">
                                            {dashboardData.testing_summary.total_tests_completed}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">In Progress</span>
                                        <span className="font-bold text-blue-600">
                                            {dashboardData.testing_summary.tests_in_progress}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Effectiveness Rate</span>
                                        <span className="font-bold text-green-600">
                                            {formatPercentage(dashboardData.testing_summary.overall_effectiveness_rate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Material Weaknesses</span>
                                        <span className="font-bold text-red-600">
                                            {dashboardData.testing_summary.material_weaknesses}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Exception Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Open Exceptions</span>
                                        <Badge variant="outline" className="text-red-600 border-red-200">
                                            {dashboardData.testing_summary.exceptions_open}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">High Priority</span>
                                        <Badge variant="outline" className="text-orange-600 border-orange-200">
                                            {Math.floor(dashboardData.testing_summary.exceptions_open * 0.3)}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">Awaiting Review</span>
                                        <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                                            {Math.floor(dashboardData.testing_summary.exceptions_open * 0.4)}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm">In Remediation</span>
                                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                                            {Math.floor(dashboardData.testing_summary.exceptions_open * 0.3)}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Next Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Clock className="w-4 h-4 text-amber-600" />
                                        <span>5 controls require testing</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                                        <span>3 exceptions need review</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <UserCheck className="w-4 h-4 text-blue-600" />
                                        <span>2 tests pending approval</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <FileText className="w-4 h-4 text-green-600" />
                                        <span>1 report ready for review</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Testing History */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Testing Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {/* Mock testing data */}
                                {[
                                    { control: 'FRC-001', test: 'Journal Entry Controls', date: '2024-09-08', result: 'Effective', tester: 'John Smith' },
                                    { control: 'REV-005', test: 'Revenue Recognition', date: '2024-09-07', result: 'Effective', tester: 'Sarah Johnson' },
                                    { control: 'PRO-012', test: 'Purchase Authorization', date: '2024-09-06', result: 'Needs Improvement', tester: 'Mike Davis' },
                                    { control: 'PAY-008', test: 'Payroll Processing', date: '2024-09-05', result: 'Effective', tester: 'Lisa Chen' }
                                ].map((test, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div>
                                            <div className="font-medium text-sm">{test.test}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {test.control} • {test.date} • Tester: {test.tester}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={getStatusColor(test.result)} variant="outline">
                                                {test.result}
                                            </Badge>
                                            <Button size="sm" variant="ghost">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* KRIs Tab */}
                <TabsContent value="kris" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Key Risk Indicators</h3>
                            <p className="text-sm text-muted-foreground">
                                Monitor and track key risk indicators across all domains
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="gap-2">
                                <TrendingUp className="w-4 h-4" />
                                Trends
                            </Button>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" />
                                Add KRI
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Total KRIs</div>
                                        <div className="text-2xl font-bold">
                                            {dashboardData.kri_summary.total_kris}
                                        </div>
                                    </div>
                                    <Gauge className="w-8 h-8 text-blue-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Above Threshold</div>
                                        <div className="text-2xl font-bold text-red-600">
                                            {dashboardData.kri_summary.red_status_count}
                                        </div>
                                    </div>
                                    <XCircle className="w-8 h-8 text-red-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Warning Level</div>
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {dashboardData.kri_summary.yellow_status_count}
                                        </div>
                                    </div>
                                    <AlertTriangle className="w-8 h-8 text-yellow-600" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-muted-foreground">Within Target</div>
                                        <div className="text-2xl font-bold text-green-600">
                                            {dashboardData.kri_summary.green_status_count}
                                        </div>
                                    </div>
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* KRI Cards */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {dashboardData.top_kris.map((kri, index) => (
                            <Card key={index}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h4 className="font-medium">Days Sales Outstanding</h4>
                                            <p className="text-sm text-muted-foreground">Financial risk indicator</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getKRIStatusIcon(kri.status_color)}
                                            <Badge className={`${kri.status_color === 'Red' ? 'bg-red-50 text-red-600 border-red-200' :
                                                    kri.status_color === 'Yellow' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' :
                                                        'bg-green-50 text-green-600 border-green-200'
                                                }`} variant="outline">
                                                {kri.status_color}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Current Value</span>
                                            <span className="text-xl font-bold">{kri.measured_value.toFixed(1)}</span>
                                        </div>
                                        {kri.target_value && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Target</span>
                                                <span className="font-medium">{kri.target_value.toFixed(1)}</span>
                                            </div>
                                        )}
                                        {kri.variance_percentage && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Variance</span>
                                                <span className={`font-medium flex items-center gap-1 ${kri.variance_percentage > 0 ? 'text-red-600' : 'text-green-600'
                                                    }`}>
                                                    {kri.variance_percentage > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {Math.abs(kri.variance_percentage).toFixed(1)}%
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Risk Level</span>
                                            <Badge variant="outline" className={
                                                kri.risk_level === 'Critical' ? 'text-red-600 border-red-200' :
                                                    kri.risk_level === 'High' ? 'text-orange-600 border-orange-200' :
                                                        kri.risk_level === 'Medium' ? 'text-yellow-600 border-yellow-200' :
                                                            'text-green-600 border-green-200'
                                            }>
                                                {kri.risk_level}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Last Measured</span>
                                            <span className="text-sm">{formatDate(kri.measurement_date)}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t flex justify-between items-center">
                                        <Button size="sm" variant="ghost" className="gap-2">
                                            <TrendingUp className="w-3 h-3" />
                                            View Trends
                                        </Button>
                                        <Button size="sm" variant="ghost" className="gap-2">
                                            <Settings className="w-3 h-3" />
                                            Configure
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Analysis Tab */}
                <TabsContent value="analysis" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Performance Analysis</h3>
                            <p className="text-sm text-muted-foreground">
                                Advanced analytics and insights on control effectiveness
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
                                <CardTitle>Control Effectiveness by Framework</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <PieChart className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-lg font-medium">Framework Analysis</p>
                                        <p className="text-sm">Control effectiveness by framework type</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Risk Trend Analysis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                                    <div className="text-center text-muted-foreground">
                                        <LineChart className="w-12 h-12 mx-auto mb-4" />
                                        <p className="text-lg font-medium">Risk Trends</p>
                                        <p className="text-sm">Historical risk and control trends</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recommendations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    {
                                        priority: 'High',
                                        category: 'Control Enhancement',
                                        recommendation: 'Implement automated controls for high-volume transactions',
                                        impact: 'Reduce manual errors by 60% and improve efficiency',
                                        effort: 'Medium - 3-4 months implementation'
                                    },
                                    {
                                        priority: 'Medium',
                                        category: 'Risk Monitoring',
                                        recommendation: 'Enhance monitoring frequency for critical controls',
                                        impact: 'Earlier detection of control deficiencies',
                                        effort: 'Low - 2-3 weeks setup'
                                    },
                                    {
                                        priority: 'Medium',
                                        category: 'Testing Optimization',
                                        recommendation: 'Increase sample sizes for statistical significance',
                                        impact: 'Improved control testing reliability',
                                        effort: 'Low - Additional testing effort required'
                                    }
                                ].map((rec, index) => (
                                    <div key={index} className="p-4 border rounded-lg">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant={rec.priority === 'High' ? 'destructive' : 'secondary'}>
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
                        <DialogTitle>
                            Monitoring Analysis Report
                        </DialogTitle>
                        <DialogDescription>
                            Comprehensive analysis of control effectiveness and risk trends
                        </DialogDescription>
                    </DialogHeader>

                    {analysisData && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Control Performance by Framework</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {analysisData.control_performance.by_framework.map((framework, index) => (
                                                <div key={index} className="flex justify-between items-center">
                                                    <span className="text-sm">{framework.framework_name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={framework.effectiveness_rate} className="w-16 h-2" />
                                                        <span className="text-sm font-medium w-12">
                                                            {formatPercentage(framework.effectiveness_rate)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Alert Patterns</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {analysisData.alert_patterns.by_severity.map((pattern, index) => (
                                                <div key={index} className="flex justify-between items-center text-sm">
                                                    <span>{pattern.severity}</span>
                                                    <div className="flex gap-4">
                                                        <span>{pattern.count} alerts</span>
                                                        <span className="text-green-600">{formatPercentage(pattern.resolution_rate)} resolved</span>
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
    )
}
