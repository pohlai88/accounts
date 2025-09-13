'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog'
import {
    Plus,
    Search,
    Filter,
    Download,
    Eye,
    Edit,
    Trash2,
    Send,
    FileText,
    TrendingUp,
    DollarSign,
    Calendar,
    Building2,
    CreditCard,
    AlertCircle,
    CheckCircle,
    Clock,
    Target,
    Zap,
    RefreshCw,
    BarChart3,
    PieChart,
    Activity,
    Settings,
    Receipt,
    Calculator,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Plus as PlusIcon,
    Equal,
    CheckSquare,
    TrendingDown,
    Percent
} from 'lucide-react'
import {
    AdvancedReportsService,
    ReportTemplate,
    FinancialRatios,
    AgedReceivables,
    AgedPayables
} from '@/lib/advanced-reports-service'
import { format } from 'date-fns'

export default function AdvancedReportsPage() {
    const [activeTab, setActiveTab] = useState('dashboard')
    const [loading, setLoading] = useState(false)
    const [showDialog, setShowDialog] = useState(false)

    // Data states
    const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([])
    const [financialRatios, setFinancialRatios] = useState<FinancialRatios[]>([])
    const [agedReceivables, setAgedReceivables] = useState<AgedReceivables[]>([])
    const [agedPayables, setAgedPayables] = useState<AgedPayables[]>([])
    const [dashboardData, setDashboardData] = useState<any>(null)

    // Filters
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<string>('all')
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    const companyId = 'default-company'

    useEffect(() => {
        loadData()
    }, [companyId, activeTab])

    const loadData = async () => {
        setLoading(true)
        try {
            switch (activeTab) {
                case 'dashboard':
                    await loadDashboardData()
                    break
                case 'templates':
                    await loadReportTemplates()
                    break
                case 'ratios':
                    await loadFinancialRatios()
                    break
                case 'aging':
                    await loadAgingReports()
                    break
            }
        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadDashboardData = async () => {
        const result = await AdvancedReportsService.getDashboardAnalytics(companyId)
        if (result.success && result.data) {
            setDashboardData(result.data)
        }
    }

    const loadReportTemplates = async () => {
        const result = await AdvancedReportsService.getReportTemplates(companyId)
        if (result.success && result.data) {
            setReportTemplates(result.data)
        }
    }

    const loadFinancialRatios = async () => {
        const result = await AdvancedReportsService.getFinancialRatios(companyId, dateRange.start, dateRange.end)
        if (result.success && result.data) {
            setFinancialRatios(result.data)
        }
    }

    const loadAgingReports = async () => {
        const [receivablesResult, payablesResult] = await Promise.all([
            AdvancedReportsService.getAgedReceivables(companyId),
            AdvancedReportsService.getAgedPayables(companyId)
        ])

        if (receivablesResult.success && receivablesResult.data) {
            setAgedReceivables(receivablesResult.data)
        }

        if (payablesResult.success && payablesResult.data) {
            setAgedPayables(payablesResult.data)
        }
    }

    const handleGenerateAging = async (type: 'receivables' | 'payables') => {
        setLoading(true)
        try {
            const asOfDate = new Date().toISOString().split('T')[0]

            if (type === 'receivables') {
                await AdvancedReportsService.generateAgedReceivables(companyId, asOfDate)
            } else {
                await AdvancedReportsService.generateAgedPayables(companyId, asOfDate)
            }

            await loadAgingReports()
        } catch (error) {
            console.error('Error generating aging report:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCalculateRatios = async () => {
        setLoading(true)
        try {
            await AdvancedReportsService.calculateFinancialRatios(companyId, dateRange.start, dateRange.end)
            await loadFinancialRatios()
        } catch (error) {
            console.error('Error calculating ratios:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            Excellent: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
            Good: { variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
            Normal: { variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
            Warning: { variant: 'default' as const, color: 'bg-yellow-100 text-yellow-800' },
            Critical: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Normal
        return <Badge variant={config.variant} className={config.color}>{status}</Badge>
    }

    const formatCurrency = (amount: number, currency: string = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        }).format(amount)
    }

    const formatPercentage = (value: number) => {
        return `${value.toFixed(2)}%`
    }

    const renderDashboard = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Financial Analytics Dashboard</h3>
                <Button onClick={loadDashboardData}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <div>
                                <p className="text-sm font-medium">Total Revenue</p>
                                <p className="text-2xl font-bold">{formatCurrency(dashboardData?.total_revenue || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingDown className="h-4 w-4 text-red-500" />
                            <div>
                                <p className="text-sm font-medium">Total Expenses</p>
                                <p className="text-2xl font-bold">{formatCurrency(dashboardData?.total_expenses || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-blue-500" />
                            <div>
                                <p className="text-sm font-medium">Net Profit</p>
                                <p className="text-2xl font-bold">{formatCurrency(dashboardData?.net_profit || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Percent className="h-4 w-4 text-purple-500" />
                            <div>
                                <p className="text-sm font-medium">Gross Margin</p>
                                <p className="text-2xl font-bold">{formatPercentage(dashboardData?.gross_profit_margin || 0)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Financial Ratios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Liquidity Ratios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Current Ratio:</span>
                            <span className="font-medium">{dashboardData?.current_ratio?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Quick Ratio:</span>
                            <span className="font-medium">{dashboardData?.quick_ratio?.toFixed(2) || '0.00'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Efficiency Ratios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Receivables Turnover:</span>
                            <span className="font-medium">{dashboardData?.receivables_turnover?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Payables Turnover:</span>
                            <span className="font-medium">{dashboardData?.payables_turnover?.toFixed(2) || '0.00'}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Profitability Ratios</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Return on Assets:</span>
                            <span className="font-medium">{formatPercentage(dashboardData?.return_on_assets || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Return on Equity:</span>
                            <span className="font-medium">{formatPercentage(dashboardData?.return_on_equity || 0)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )

    const renderReportTemplates = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Report Templates</h3>
                <Button onClick={() => setShowDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading templates...</div>
                </div>
            ) : reportTemplates.length === 0 ? (
                <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No templates found</h3>
                    <p className="text-muted-foreground mb-4">Create your first report template</p>
                    <Button onClick={() => setShowDialog(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Template
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reportTemplates.map((template) => (
                        <Card key={template.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{template.name}</CardTitle>
                                    {template.is_default && (
                                        <Badge variant="default">Default</Badge>
                                    )}
                                </div>
                                <CardDescription>{template.description}</CardDescription>
                                <Badge variant="outline" className="w-fit">
                                    {template.report_type}
                                </Badge>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>Category:</span>
                                        <span>{template.category}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Public:</span>
                                        <span>{template.is_public ? 'Yes' : 'No'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Status:</span>
                                        <span>{getStatusBadge(template.is_active ? 'Active' : 'Inactive')}</span>
                                    </div>
                                </div>
                                <div className="flex space-x-2 mt-4">
                                    <Button variant="outline" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    const renderFinancialRatios = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Financial Ratios Analysis</h3>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={handleCalculateRatios}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Ratios
                    </Button>
                </div>
            </div>

            {/* Date Range Filter */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                        <div className="flex items-end">
                            <Button onClick={loadFinancialRatios} className="w-full">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Update
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Ratios Display */}
            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading ratios...</div>
                </div>
            ) : financialRatios.length === 0 ? (
                <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No ratios calculated</h3>
                    <p className="text-muted-foreground mb-4">Calculate financial ratios for analysis</p>
                    <Button onClick={handleCalculateRatios}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Calculate Ratios
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {financialRatios.map((ratio) => (
                        <Card key={ratio.id}>
                            <CardHeader>
                                <CardTitle className="text-lg">
                                    {format(new Date(ratio.period_start), 'MMM yyyy')} - {format(new Date(ratio.period_end), 'MMM yyyy')}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Current Ratio:</span>
                                    <span className="font-medium">{ratio.current_ratio?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Quick Ratio:</span>
                                    <span className="font-medium">{ratio.quick_ratio?.toFixed(2) || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Gross Margin:</span>
                                    <span className="font-medium">{formatPercentage(ratio.gross_profit_margin || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Net Margin:</span>
                                    <span className="font-medium">{formatPercentage(ratio.net_profit_margin || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ROA:</span>
                                    <span className="font-medium">{formatPercentage(ratio.return_on_assets || 0)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>ROE:</span>
                                    <span className="font-medium">{formatPercentage(ratio.return_on_equity || 0)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )

    const renderAgingReports = () => (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Aging Reports</h3>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => handleGenerateAging('receivables')}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Generate Receivables
                    </Button>
                    <Button variant="outline" onClick={() => handleGenerateAging('payables')}>
                        <Calculator className="h-4 w-4 mr-2" />
                        Generate Payables
                    </Button>
                </div>
            </div>

            {/* Aged Receivables */}
            <Card>
                <CardHeader>
                    <CardTitle>Aged Receivables</CardTitle>
                    <CardDescription>Customer outstanding amounts by aging buckets</CardDescription>
                </CardHeader>
                <CardContent>
                    {agedReceivables.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No aged receivables data available</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Current</TableHead>
                                        <TableHead>1-30 Days</TableHead>
                                        <TableHead>31-60 Days</TableHead>
                                        <TableHead>61-90 Days</TableHead>
                                        <TableHead>91-120 Days</TableHead>
                                        <TableHead>Over 120</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agedReceivables.map((receivable) => (
                                        <TableRow key={receivable.id}>
                                            <TableCell className="font-medium">{receivable.customer_name}</TableCell>
                                            <TableCell>{formatCurrency(receivable.current_amount, receivable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(receivable.days_1_30, receivable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(receivable.days_31_60, receivable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(receivable.days_61_90, receivable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(receivable.days_91_120, receivable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(receivable.days_over_120, receivable.currency)}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(receivable.total_amount, receivable.currency)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Aged Payables */}
            <Card>
                <CardHeader>
                    <CardTitle>Aged Payables</CardTitle>
                    <CardDescription>Supplier outstanding amounts by aging buckets</CardDescription>
                </CardHeader>
                <CardContent>
                    {agedPayables.length === 0 ? (
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No aged payables data available</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Current</TableHead>
                                        <TableHead>1-30 Days</TableHead>
                                        <TableHead>31-60 Days</TableHead>
                                        <TableHead>61-90 Days</TableHead>
                                        <TableHead>91-120 Days</TableHead>
                                        <TableHead>Over 120</TableHead>
                                        <TableHead>Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {agedPayables.map((payable) => (
                                        <TableRow key={payable.id}>
                                            <TableCell className="font-medium">{payable.supplier_name}</TableCell>
                                            <TableCell>{formatCurrency(payable.current_amount, payable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(payable.days_1_30, payable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(payable.days_31_60, payable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(payable.days_61_90, payable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(payable.days_91_120, payable.currency)}</TableCell>
                                            <TableCell>{formatCurrency(payable.days_over_120, payable.currency)}</TableCell>
                                            <TableCell className="font-medium">{formatCurrency(payable.total_amount, payable.currency)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <BarChart3 className="h-8 w-8 text-primary" />
                        <span>Advanced Reports & Analytics</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Comprehensive financial reporting and business intelligence
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadData}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                    <TabsTrigger value="ratios">Financial Ratios</TabsTrigger>
                    <TabsTrigger value="aging">Aging Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    {renderDashboard()}
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    {renderReportTemplates()}
                </TabsContent>

                <TabsContent value="ratios" className="space-y-4">
                    {renderFinancialRatios()}
                </TabsContent>

                <TabsContent value="aging" className="space-y-4">
                    {renderAgingReports()}
                </TabsContent>
            </Tabs>

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Report Template</DialogTitle>
                        <DialogDescription>
                            Create a new report template for automated reporting
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Template Form</h3>
                            <p className="text-muted-foreground">
                                The template creation form will be implemented here
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
