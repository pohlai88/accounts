'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Minus,
    Plus,
    Settings,
    RefreshCw,
    Download,
    Bookmark,
    Share,
    Edit,
    Trash2,
    Eye,
    Calendar,
    Target,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Activity,
    DollarSign,
    Users,
    ShoppingCart,
    Building2,
    PieChart,
    LineChart,
    BarChart,
    Gauge
} from 'lucide-react'
import {
    AdvancedReportingEngine,
    Dashboard,
    DashboardWidget,
    KPIType,
    TrendAnalysis,
    CustomReport,
    ScheduledReport
} from '@/lib/advanced-reporting'

interface AdvancedDashboardProps {
    companyId: string
}

export function AdvancedDashboard({ companyId }: AdvancedDashboardProps) {
    const [dashboards, setDashboards] = useState<Dashboard[]>([])
    const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(null)
    const [dashboardData, setDashboardData] = useState<Record<string, any>>({})
    const [loading, setLoading] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [showWidgetDialog, setShowWidgetDialog] = useState(false)
    const [selectedWidget, setSelectedWidget] = useState<DashboardWidget | null>(null)

    useEffect(() => {
        loadDashboards()
    }, [companyId])

    const loadDashboards = async () => {
        try {
            // Mock data for now - in real app, this would come from the API
            const mockDashboards: Dashboard[] = [
                {
                    id: '1',
                    name: 'Executive Dashboard',
                    description: 'High-level KPIs and metrics for executives',
                    companyId,
                    widgets: [
                        {
                            id: 'revenue-kpi',
                            type: 'kpi',
                            title: 'Total Revenue',
                            config: {
                                dataSource: 'calculated',
                                kpiType: 'revenue_growth',
                                timeRange: {
                                    start: '2024-01-01',
                                    end: '2024-12-31',
                                    period: 'monthly'
                                }
                            },
                            position: { x: 0, y: 0, w: 3, h: 2 }
                        },
                        {
                            id: 'profit-margin-kpi',
                            type: 'kpi',
                            title: 'Profit Margin',
                            config: {
                                dataSource: 'calculated',
                                kpiType: 'profit_margin',
                                timeRange: {
                                    start: '2024-01-01',
                                    end: '2024-12-31',
                                    period: 'monthly'
                                }
                            },
                            position: { x: 3, y: 0, w: 3, h: 2 }
                        },
                        {
                            id: 'revenue-trend',
                            type: 'chart',
                            title: 'Revenue Trend',
                            config: {
                                dataSource: 'analysis',
                                chartType: 'line',
                                timeRange: {
                                    start: '2024-01-01',
                                    end: '2024-12-31',
                                    period: 'monthly'
                                }
                            },
                            position: { x: 0, y: 2, w: 6, h: 4 }
                        }
                    ],
                    layout: {
                        columns: 12,
                        rows: 8,
                        gap: 16,
                        responsive: true
                    },
                    isPublic: true,
                    createdBy: 'current-user',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ]

            setDashboards(mockDashboards)
            if (mockDashboards.length > 0) {
                setCurrentDashboard(mockDashboards[0])
                loadDashboardData(mockDashboards[0].id)
            }
        } catch (error) {
            console.error('Error loading dashboards:', error)
        }
    }

    const loadDashboardData = async (dashboardId: string) => {
        setLoading(true)
        try {
            const result = await AdvancedReportingEngine.getDashboard(dashboardId, companyId)
            if (result.success && result.data) {
                setDashboardData(result.data)
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
        }
    }

    const refreshDashboard = async () => {
        if (currentDashboard) {
            await loadDashboardData(currentDashboard.id)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatPercentage = (percentage: number) => {
        return `${percentage.toFixed(1)}%`
    }

    const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-green-500" />
            case 'down':
                return <TrendingDown className="h-4 w-4 text-red-500" />
            default:
                return <Minus className="h-4 w-4 text-gray-500" />
        }
    }

    const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
        switch (trend) {
            case 'up':
                return 'text-green-600'
            case 'down':
                return 'text-red-600'
            default:
                return 'text-gray-600'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Advanced Dashboard</h2>
                    <p className="text-muted-foreground">
                        Real-time analytics and KPI monitoring
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={refreshDashboard} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>

                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                New Dashboard
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <CreateDashboardForm
                                companyId={companyId}
                                onSuccess={() => {
                                    setShowCreateDialog(false)
                                    loadDashboards()
                                }}
                                onCancel={() => setShowCreateDialog(false)}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <Tabs defaultValue="dashboard" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
                    <TabsTrigger value="reports">Custom Reports</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    {currentDashboard ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold">{currentDashboard.name}</h3>
                                    <p className="text-sm text-muted-foreground">{currentDashboard.description}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Share className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                        <Bookmark className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                {currentDashboard.widgets.map(widget => (
                                    <div
                                        key={widget.id}
                                        className="col-span-12 md:col-span-6 lg:col-span-4"
                                        style={{
                                            gridColumn: `span ${widget.position.w}`,
                                            gridRow: `span ${widget.position.h}`
                                        }}
                                    >
                                        <DashboardWidget
                                            widget={widget}
                                            data={dashboardData[widget.id]}
                                            onEdit={() => {
                                                setSelectedWidget(widget)
                                                setShowWidgetDialog(true)
                                            }}
                                            formatCurrency={formatCurrency}
                                            formatPercentage={formatPercentage}
                                            getTrendIcon={getTrendIcon}
                                            getTrendColor={getTrendColor}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground">No dashboard selected</p>
                            <p className="text-sm text-muted-foreground">Create a new dashboard to get started</p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                    <TrendAnalysisView companyId={companyId} />
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    <CustomReportsView companyId={companyId} />
                </TabsContent>

                <TabsContent value="scheduled" className="space-y-4">
                    <ScheduledReportsView companyId={companyId} />
                </TabsContent>
            </Tabs>
        </div>
    )
}

interface DashboardWidgetProps {
    widget: DashboardWidget
    data: any
    onEdit: () => void
    formatCurrency: (amount: number) => string
    formatPercentage: (percentage: number) => string
    getTrendIcon: (trend: 'up' | 'down' | 'stable') => React.ReactNode
    getTrendColor: (trend: 'up' | 'down' | 'stable') => string
}

function DashboardWidget({
    widget,
    data,
    onEdit,
    formatCurrency,
    formatPercentage,
    getTrendIcon,
    getTrendColor
}: DashboardWidgetProps) {
    const renderWidget = () => {
        switch (widget.type) {
            case 'kpi':
                return <KPIWidget widget={widget} data={data} formatCurrency={formatCurrency} formatPercentage={formatPercentage} getTrendIcon={getTrendIcon} getTrendColor={getTrendColor} />
            case 'chart':
                return <ChartWidget widget={widget} data={data} formatCurrency={formatCurrency} />
            case 'gauge':
                return <GaugeWidget widget={widget} data={data} formatPercentage={formatPercentage} />
            case 'table':
                return <TableWidget widget={widget} data={data} formatCurrency={formatCurrency} />
            default:
                return <div className="text-center py-8 text-muted-foreground">Unknown widget type</div>
        }
    }

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onEdit}>
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {renderWidget()}
            </CardContent>
        </Card>
    )
}

interface KPIWidgetProps {
    widget: DashboardWidget
    data: any
    formatCurrency: (amount: number) => string
    formatPercentage: (percentage: number) => string
    getTrendIcon: (trend: 'up' | 'down' | 'stable') => React.ReactNode
    getTrendColor: (trend: 'up' | 'down' | 'stable') => string
}

function KPIWidget({ widget, data, formatCurrency, formatPercentage, getTrendIcon, getTrendColor }: KPIWidgetProps) {
    const kpiData = data || {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable' as const,
        benchmark: 0
    }

    const getKPIIcon = (kpiType?: KPIType) => {
        switch (kpiType) {
            case 'revenue_growth':
                return <DollarSign className="h-8 w-8 text-blue-500" />
            case 'profit_margin':
                return <Target className="h-8 w-8 text-green-500" />
            case 'current_ratio':
                return <Activity className="h-8 w-8 text-purple-500" />
            case 'quick_ratio':
                return <Activity className="h-8 w-8 text-orange-500" />
            case 'debt_ratio':
                return <AlertTriangle className="h-8 w-8 text-red-500" />
            case 'roi':
            case 'roa':
            case 'roe':
                return <TrendingUp className="h-8 w-8 text-indigo-500" />
            default:
                return <BarChart3 className="h-8 w-8 text-gray-500" />
        }
    }

    const getKPIValue = (kpiType?: KPIType, value: number) => {
        switch (kpiType) {
            case 'revenue_growth':
            case 'profit_margin':
            case 'roi':
            case 'roa':
            case 'roe':
                return formatPercentage(value)
            case 'current_ratio':
            case 'quick_ratio':
            case 'debt_ratio':
                return value.toFixed(2)
            default:
                return formatCurrency(value)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                {getKPIIcon(widget.config.kpiType)}
                <div className="text-right">
                    <div className="text-2xl font-bold">
                        {getKPIValue(widget.config.kpiType, kpiData.value)}
                    </div>
                    <div className="flex items-center space-x-1 text-sm">
                        {getTrendIcon(kpiData.trend)}
                        <span className={getTrendColor(kpiData.trend)}>
                            {formatPercentage(Math.abs(kpiData.changePercent))}
                        </span>
                    </div>
                </div>
            </div>

            {kpiData.benchmark && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Benchmark</span>
                        <span className="font-medium">{getKPIValue(widget.config.kpiType, kpiData.benchmark)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${Math.min((kpiData.value / kpiData.benchmark) * 100, 100)}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

interface ChartWidgetProps {
    widget: DashboardWidget
    data: any
    formatCurrency: (amount: number) => string
}

function ChartWidget({ widget, data, formatCurrency }: ChartWidgetProps) {
    // Mock chart data
    const chartData = data || [
        { month: 'Jan', value: 10000 },
        { month: 'Feb', value: 12000 },
        { month: 'Mar', value: 15000 },
        { month: 'Apr', value: 18000 },
        { month: 'May', value: 16000 },
        { month: 'Jun', value: 20000 }
    ]

    const maxValue = Math.max(...chartData.map(d => d.value))

    return (
        <div className="space-y-4">
            <div className="h-32 flex items-end space-x-2">
                {chartData.map((item, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                        <div
                            className="w-full bg-blue-500 rounded-t"
                            style={{ height: `${(item.value / maxValue) * 100}%` }}
                        />
                        <span className="text-xs text-muted-foreground">{item.month}</span>
                    </div>
                ))}
            </div>
            <div className="text-center text-sm text-muted-foreground">
                {widget.config.chartType?.toUpperCase()} Chart
            </div>
        </div>
    )
}

interface GaugeWidgetProps {
    widget: DashboardWidget
    data: any
    formatPercentage: (percentage: number) => string
}

function GaugeWidget({ widget, data, formatPercentage }: GaugeWidgetProps) {
    const value = data?.value || 0
    const maxValue = 100
    const percentage = (value / maxValue) * 100

    return (
        <div className="space-y-4">
            <div className="relative w-24 h-24 mx-auto">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-gray-200"
                    />
                    <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - percentage / 100)}`}
                        className="text-blue-500"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{formatPercentage(percentage)}</span>
                </div>
            </div>
            <div className="text-center text-sm text-muted-foreground">
                {widget.title}
            </div>
        </div>
    )
}

interface TableWidgetProps {
    widget: DashboardWidget
    data: any
    formatCurrency: (amount: number) => string
}

function TableWidget({ widget, data, formatCurrency }: TableWidgetProps) {
    const tableData = data || [
        { name: 'Revenue', value: 100000 },
        { name: 'Expenses', value: 75000 },
        { name: 'Profit', value: 25000 }
    ]

    return (
        <div className="space-y-2">
            {tableData.map((row: any, index: number) => (
                <div key={index} className="flex items-center justify-between py-1">
                    <span className="text-sm text-muted-foreground">{row.name}</span>
                    <span className="text-sm font-medium">{formatCurrency(row.value)}</span>
                </div>
            ))}
        </div>
    )
}

// Placeholder components for other tabs
function TrendAnalysisView({ companyId }: { companyId: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Analyze trends and patterns in your data</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    Trend analysis features coming soon...
                </div>
            </CardContent>
        </Card>
    )
}

function CustomReportsView({ companyId }: { companyId: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Custom Reports</CardTitle>
                <CardDescription>Create and manage custom reports</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    Custom reports features coming soon...
                </div>
            </CardContent>
        </Card>
    )
}

function ScheduledReportsView({ companyId }: { companyId: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Scheduled Reports</CardTitle>
                <CardDescription>Automate report generation and delivery</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                    Scheduled reports features coming soon...
                </div>
            </CardContent>
        </Card>
    )
}

interface CreateDashboardFormProps {
    companyId: string
    onSuccess: () => void
    onCancel: () => void
}

function CreateDashboardForm({ companyId, onSuccess, onCancel }: CreateDashboardFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        isPublic: false
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const result = await AdvancedReportingEngine.createDashboard({
                ...formData,
                companyId,
                widgets: [],
                layout: {
                    columns: 12,
                    rows: 8,
                    gap: 16,
                    responsive: true
                },
                createdBy: 'current-user-id'
            })

            if (result.success) {
                onSuccess()
            }
        } catch (error) {
            console.error('Error creating dashboard:', error)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Dashboard Name</Label>
                <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter dashboard name"
                    required
                />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter description"
                />
            </div>

            <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Create Dashboard</Button>
            </div>
        </form>
    )
}
