/**
 * Budget Dashboard - Complete Financial Planning & Forecasting
 * Multi-dimensional budgeting with variance analysis and advanced forecasting
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
    Calculator,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    DollarSign,
    BarChart3,
    PieChart,
    Calendar,
    Target,
    Activity,
    Settings,
    Plus,
    Eye,
    Edit,
    FileText,
    Zap,
    Users
} from 'lucide-react'
import {
    BudgetingService,
    Budget,
    BudgetType,
    BudgetTemplate,
    BudgetAlert,
    BudgetStatus,
    AlertLevel
} from '@/lib/budgeting-service'

interface BudgetAnalytics {
    total_budget_amount: number
    total_actual_amount: number
    total_variance_amount: number
    overall_variance_percentage: number
    budget_utilization_rate: number
    forecast_accuracy: number
    budget_by_department: { department: string; budgeted: number; actual: number; variance: number }[]
    budget_by_account_type: { account_type: string; budgeted: number; actual: number; variance: number }[]
    monthly_trend: { month: string; budgeted: number; actual: number; variance: number }[]
    top_variances: { account: string; variance_amount: number; variance_percentage: number }[]
    budget_alerts_summary: { level: AlertLevel; count: number }[]
}

export default function BudgetDashboard() {
    const [budgets, setBudgets] = useState<Budget[]>([])
    const [budgetTypes, setBudgetTypes] = useState<BudgetType[]>([])
    const [budgetTemplates, setBudgetTemplates] = useState<BudgetTemplate[]>([])
    const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([])
    const [analytics, setAnalytics] = useState<BudgetAnalytics | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedFiscalYear, setSelectedFiscalYear] = useState(new Date().getFullYear())
    const [selectedStatus, setSelectedStatus] = useState<BudgetStatus | 'All'>('All')

    const companyId = 'current-company-id' // Get from context/props

    useEffect(() => {
        loadDashboardData()
    }, [companyId, selectedFiscalYear, selectedStatus])

    const loadDashboardData = async () => {
        try {
            setLoading(true)

            const [
                budgetsResult,
                budgetTypesResult,
                budgetTemplatesResult,
                budgetAlertsResult,
                analyticsResult
            ] = await Promise.all([
                BudgetingService.getBudgets(companyId, {
                    fiscal_year: selectedFiscalYear,
                    status: selectedStatus === 'All' ? undefined : selectedStatus
                }),
                BudgetingService.getBudgetTypes(companyId),
                BudgetingService.getBudgetTemplates(companyId),
                BudgetingService.getBudgetAlerts(companyId, { is_resolved: false }),
                BudgetingService.getBudgetAnalytics(companyId, { fiscal_year: selectedFiscalYear })
            ])

            if (budgetsResult.success && budgetsResult.data) {
                setBudgets(budgetsResult.data)
            }

            if (budgetTypesResult.success && budgetTypesResult.data) {
                setBudgetTypes(budgetTypesResult.data)
            }

            if (budgetTemplatesResult.success && budgetTemplatesResult.data) {
                setBudgetTemplates(budgetTemplatesResult.data)
            }

            if (budgetAlertsResult.success && budgetAlertsResult.data) {
                setBudgetAlerts(budgetAlertsResult.data)
            }

            if (analyticsResult.success && analyticsResult.data) {
                setAnalytics(analyticsResult.data)
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error)
        } finally {
            setLoading(false)
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

    const formatPercentage = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
    }

    const getStatusBadgeVariant = (status: BudgetStatus) => {
        switch (status) {
            case 'Draft':
                return 'secondary'
            case 'Submitted':
            case 'Under Review':
                return 'outline'
            case 'Approved':
            case 'Active':
                return 'default'
            case 'Closed':
                return 'secondary'
            case 'Cancelled':
                return 'destructive'
            default:
                return 'secondary'
        }
    }

    const getVarianceColor = (variance: number) => {
        if (variance > 0) return 'text-red-600' // Unfavorable (over budget)
        if (variance < 0) return 'text-green-600' // Favorable (under budget)
        return 'text-gray-600' // On budget
    }

    const getAlertBadgeVariant = (level: AlertLevel) => {
        switch (level) {
            case 'Info':
                return 'outline'
            case 'Warning':
                return 'secondary'
            case 'Critical':
                return 'destructive'
            default:
                return 'secondary'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading budget dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Budgeting & Forecasting</h2>
                    <p className="text-muted-foreground">
                        Financial planning with variance analysis and forecasting
                    </p>
                </div>
                <div className="flex gap-2 items-center">
                    <select
                        value={selectedFiscalYear}
                        onChange={(e) => setSelectedFiscalYear(parseInt(e.target.value))}
                        className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i - 2).map(year => (
                            <option key={year} value={year}>FY {year}</option>
                        ))}
                    </select>
                    <Button variant="outline" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </Button>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Budget
                    </Button>
                </div>
            </div>

            {/* Analytics Cards */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(analytics.total_budget_amount)}</div>
                            <p className="text-xs text-muted-foreground">
                                Budgeted for FY {selectedFiscalYear}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Budget Utilization</CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {analytics.budget_utilization_rate.toFixed(1)}%
                            </div>
                            <Progress value={analytics.budget_utilization_rate} className="mt-2" />
                            <p className="text-xs text-muted-foreground mt-2">
                                {formatCurrency(analytics.total_actual_amount)} spent
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Budget Variance</CardTitle>
                            <TrendingUp className={`h-4 w-4 ${getVarianceColor(analytics.overall_variance_percentage)}`} />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${getVarianceColor(analytics.overall_variance_percentage)}`}>
                                {formatPercentage(analytics.overall_variance_percentage)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(Math.abs(analytics.total_variance_amount))} {analytics.total_variance_amount >= 0 ? 'over' : 'under'} budget
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                            <Zap className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {analytics.forecast_accuracy.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Historical forecast precision
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Alerts Banner */}
            {budgetAlerts.length > 0 && (
                <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="w-5 h-5" />
                            Budget Alerts ({budgetAlerts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {budgetAlerts.slice(0, 3).map((alert) => (
                                <div key={alert.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border">
                                    <div className="flex-1">
                                        <div className="font-medium text-sm">{alert.alert_message}</div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {new Date(alert.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <Badge variant={getAlertBadgeVariant(alert.alert_level)}>
                                        {alert.alert_level}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                        {budgetAlerts.length > 3 && (
                            <div className="mt-3 text-center">
                                <Button variant="outline" size="sm">
                                    View All {budgetAlerts.length} Alerts
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="budgets" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="budgets">Budgets</TabsTrigger>
                    <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
                    <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
                    <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                {/* Budgets */}
                <TabsContent value="budgets" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Calculator className="w-5 h-5" />
                                    Budgets ({budgets.length})
                                </span>
                                <div className="flex gap-2">
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value as BudgetStatus | 'All')}
                                        className="px-3 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Draft">Draft</option>
                                        <option value="Submitted">Submitted</option>
                                        <option value="Under Review">Under Review</option>
                                        <option value="Approved">Approved</option>
                                        <option value="Active">Active</option>
                                        <option value="Closed">Closed</option>
                                    </select>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        New Budget
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-medium">Budget</th>
                                            <th className="text-left p-3 font-medium">Type</th>
                                            <th className="text-left p-3 font-medium">Period</th>
                                            <th className="text-left p-3 font-medium">Budgeted</th>
                                            <th className="text-left p-3 font-medium">Actual</th>
                                            <th className="text-left p-3 font-medium">Variance</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-center p-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {budgets.map((budget) => (
                                            <tr key={budget.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">
                                                    <div>
                                                        <div className="font-medium">{budget.budget_name}</div>
                                                        <div className="text-sm text-muted-foreground">{budget.budget_code}</div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">{(budget as any).budget_type?.type_name}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        {new Date(budget.start_date).toLocaleDateString()} - {new Date(budget.end_date).toLocaleDateString()}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">FY {budget.fiscal_year}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium">{formatCurrency(budget.total_budgeted_amount)}</div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium">{formatCurrency(budget.total_actual_amount)}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {budget.total_budgeted_amount > 0
                                                            ? `${((budget.total_actual_amount / budget.total_budgeted_amount) * 100).toFixed(1)}% utilized`
                                                            : 'No budget'
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className={`font-medium ${getVarianceColor(budget.variance_percentage)}`}>
                                                        {formatPercentage(budget.variance_percentage)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {formatCurrency(Math.abs(budget.total_variance_amount))}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant={getStatusBadgeVariant(budget.status)}>
                                                        {budget.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="ghost">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {budget.status === 'Draft' && (
                                                            <Button size="sm" variant="ghost">
                                                                <Edit className="w-4 h-4" />
                                                            </Button>
                                                        )}
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

                            {budgets.length === 0 && (
                                <div className="text-center py-8">
                                    <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">No budgets found</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Create your first budget to start financial planning
                                    </p>
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Create Budget
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Variance Analysis */}
                <TabsContent value="variance" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Top Variances
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">Variance analysis coming soon</p>
                                    <p className="text-sm text-muted-foreground">
                                        Detailed variance breakdowns will be available here
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <PieChart className="w-5 h-5" />
                                    Budget vs Actual by Category
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-8">
                                    <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">Category analysis coming soon</p>
                                    <p className="text-sm text-muted-foreground">
                                        Budget vs actual by account category visualization
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Forecasting */}
                <TabsContent value="forecasting" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                Budget Forecasting
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-2">Forecasting engine coming soon</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Advanced forecasting with multiple algorithms (Linear, Seasonal, Weighted Average)
                                </p>
                                <Button className="gap-2">
                                    <Zap className="w-4 h-4" />
                                    Generate Forecast
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Scenarios */}
                <TabsContent value="scenarios" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Target className="w-5 h-5" />
                                    Budget Scenarios
                                </span>
                                <Button size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Scenario
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold text-green-700 mb-2">Optimistic</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Best-case scenario with 20% revenue increase
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Projected Revenue:</span>
                                            <span className="font-medium">$1.2M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Projected Profit:</span>
                                            <span className="font-medium text-green-600">$240K</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold text-blue-700 mb-2">Most Likely</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Expected scenario based on current trends
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Projected Revenue:</span>
                                            <span className="font-medium">$1.0M</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Projected Profit:</span>
                                            <span className="font-medium text-blue-600">$200K</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h4 className="font-semibold text-red-700 mb-2">Pessimistic</h4>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Conservative scenario with 15% revenue decrease
                                    </p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Projected Revenue:</span>
                                            <span className="font-medium">$850K</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Projected Profit:</span>
                                            <span className="font-medium text-red-600">$150K</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Templates */}
                <TabsContent value="templates" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Budget Templates ({budgetTemplates.length})
                                </span>
                                <Button size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Template
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {budgetTemplates.map((template) => (
                                    <div key={template.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <h4 className="font-semibold">{template.template_name}</h4>
                                            <Badge variant="outline">{template.budget_frequency}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            {template.description || 'No description available'}
                                        </p>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                Type: {(template as any).budget_type?.type_name}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button size="sm" variant="ghost">
                                                    <Eye className="w-3 h-3" />
                                                </Button>
                                                <Button size="sm" variant="ghost">
                                                    <Edit className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {budgetTemplates.length === 0 && (
                                    <div className="col-span-full text-center py-8">
                                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground mb-2">No budget templates</p>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Create reusable templates to streamline budget creation
                                        </p>
                                        <Button className="gap-2">
                                            <Plus className="w-4 h-4" />
                                            Create Template
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
