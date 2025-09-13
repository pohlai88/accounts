'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
    Plus,
    RefreshCw,
    Calculator,
    FileText,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Search,
    Edit,
    Trash2,
    Settings,
    DollarSign,
    Calendar,
    Target,
    BarChart3,
    Receipt
} from 'lucide-react'
import {
    TaxCalculationService,
    TaxCategory,
    TaxRate,
    TaxGroup,
    TaxCalculation,
    TaxCalculationDetail,
    TaxReturn,
    TaxSummary,
    CreateTaxCategoryInput,
    CreateTaxRateInput,
    CreateTaxGroupInput,
    CalculateTaxInput
} from '@/lib/tax-calculation'
import { format } from 'date-fns'

interface TaxCalculationProps {
    companyId: string
}

export function TaxCalculation({ companyId }: TaxCalculationProps) {
    const [taxCategories, setTaxCategories] = useState<TaxCategory[]>([])
    const [taxRates, setTaxRates] = useState<TaxRate[]>([])
    const [taxGroups, setTaxGroups] = useState<TaxGroup[]>([])
    const [taxCalculations, setTaxCalculations] = useState<TaxCalculation[]>([])
    const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([])
    const [taxSummary, setTaxSummary] = useState<TaxSummary[]>([])
    const [selectedCalculation, setSelectedCalculation] = useState<TaxCalculation | null>(null)
    const [calculationDetails, setCalculationDetails] = useState<TaxCalculationDetail[]>([])
    const [loading, setLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateCategoryDialog, setShowCreateCategoryDialog] = useState(false)
    const [showCreateRateDialog, setShowCreateRateDialog] = useState(false)
    const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false)
    const [showCalculateDialog, setShowCalculateDialog] = useState(false)

    // Form states
    const [categoryForm, setCategoryForm] = useState<CreateTaxCategoryInput>({
        companyId,
        categoryName: '',
        categoryCode: '',
        description: ''
    })

    const [rateForm, setRateForm] = useState<CreateTaxRateInput>({
        companyId,
        taxCategoryId: '',
        rateName: '',
        rateCode: '',
        taxType: 'Sales Tax',
        ratePercentage: 0,
        effectiveFrom: format(new Date(), 'yyyy-MM-dd')
    })

    const [groupForm, setGroupForm] = useState<CreateTaxGroupInput>({
        companyId,
        groupName: '',
        groupCode: '',
        description: '',
        taxRateIds: []
    })

    const [calculateForm, setCalculateForm] = useState<CalculateTaxInput>({
        companyId,
        transactionId: '',
        transactionType: 'Sales Invoice',
        baseAmount: 0
    })

    useEffect(() => {
        loadData()
    }, [companyId])

    useEffect(() => {
        if (selectedCalculation) {
            loadCalculationDetails(selectedCalculation.id)
        }
    }, [selectedCalculation])

    const loadData = async () => {
        setLoading(true)
        try {
            await Promise.all([
                loadTaxCategories(),
                loadTaxRates(),
                loadTaxGroups(),
                loadTaxCalculations(),
                loadTaxReturns(),
                loadTaxSummary()
            ])
        } finally {
            setLoading(false)
        }
    }

    const loadTaxCategories = async () => {
        try {
            const result = await TaxCalculationService.getTaxCategories(companyId)
            if (result.success && result.categories) {
                setTaxCategories(result.categories)
            }
        } catch (error) {
            console.error('Error loading tax categories:', error)
        }
    }

    const loadTaxRates = async () => {
        try {
            const result = await TaxCalculationService.getTaxRates(companyId)
            if (result.success && result.rates) {
                setTaxRates(result.rates)
            }
        } catch (error) {
            console.error('Error loading tax rates:', error)
        }
    }

    const loadTaxGroups = async () => {
        try {
            const result = await TaxCalculationService.getTaxGroups(companyId)
            if (result.success && result.groups) {
                setTaxGroups(result.groups)
            }
        } catch (error) {
            console.error('Error loading tax groups:', error)
        }
    }

    const loadTaxCalculations = async () => {
        try {
            // This would typically load recent calculations
            // For now, we'll show empty state
            setTaxCalculations([])
        } catch (error) {
            console.error('Error loading tax calculations:', error)
        }
    }

    const loadTaxReturns = async () => {
        try {
            const result = await TaxCalculationService.getTaxReturns(companyId)
            if (result.success && result.returns) {
                setTaxReturns(result.returns)
            }
        } catch (error) {
            console.error('Error loading tax returns:', error)
        }
    }

    const loadTaxSummary = async () => {
        try {
            const startDate = format(new Date(new Date().getFullYear(), 0, 1), 'yyyy-MM-dd')
            const endDate = format(new Date(), 'yyyy-MM-dd')

            const result = await TaxCalculationService.getTaxSummary(companyId, startDate, endDate)
            if (result.success && result.summary) {
                setTaxSummary(result.summary)
            }
        } catch (error) {
            console.error('Error loading tax summary:', error)
        }
    }

    const loadCalculationDetails = async (calculationId: string) => {
        try {
            const result = await TaxCalculationService.getTaxCalculationDetails(calculationId)
            if (result.success && result.details) {
                setCalculationDetails(result.details)
            }
        } catch (error) {
            console.error('Error loading calculation details:', error)
        }
    }

    const handleCreateCategory = async () => {
        try {
            const result = await TaxCalculationService.createTaxCategory(categoryForm)
            if (result.success) {
                setShowCreateCategoryDialog(false)
                setCategoryForm({
                    companyId,
                    categoryName: '',
                    categoryCode: '',
                    description: ''
                })
                loadTaxCategories()
            }
        } catch (error) {
            console.error('Error creating tax category:', error)
        }
    }

    const handleCreateRate = async () => {
        try {
            const result = await TaxCalculationService.createTaxRate(rateForm)
            if (result.success) {
                setShowCreateRateDialog(false)
                setRateForm({
                    companyId,
                    taxCategoryId: '',
                    rateName: '',
                    rateCode: '',
                    taxType: 'Sales Tax',
                    ratePercentage: 0,
                    effectiveFrom: format(new Date(), 'yyyy-MM-dd')
                })
                loadTaxRates()
            }
        } catch (error) {
            console.error('Error creating tax rate:', error)
        }
    }

    const handleCreateGroup = async () => {
        try {
            const result = await TaxCalculationService.createTaxGroup(groupForm)
            if (result.success) {
                setShowCreateGroupDialog(false)
                setGroupForm({
                    companyId,
                    groupName: '',
                    groupCode: '',
                    description: '',
                    taxRateIds: []
                })
                loadTaxGroups()
            }
        } catch (error) {
            console.error('Error creating tax group:', error)
        }
    }

    const handleCalculateTax = async () => {
        try {
            const result = await TaxCalculationService.calculateTax(calculateForm)
            if (result.success) {
                setShowCalculateDialog(false)
                setCalculateForm({
                    companyId,
                    transactionId: '',
                    transactionType: 'Sales Invoice',
                    baseAmount: 0
                })
                loadTaxCalculations()
            }
        } catch (error) {
            console.error('Error calculating tax:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Draft': return 'text-yellow-600 bg-yellow-50'
            case 'Ready': return 'text-blue-600 bg-blue-50'
            case 'Filed': return 'text-green-600 bg-green-50'
            case 'Accepted': return 'text-green-600 bg-green-50'
            case 'Rejected': return 'text-red-600 bg-red-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const getTaxTypeColor = (type: string) => {
        switch (type) {
            case 'Sales Tax': return 'text-blue-600 bg-blue-50'
            case 'VAT': return 'text-green-600 bg-green-50'
            case 'GST': return 'text-purple-600 bg-purple-50'
            case 'Income Tax': return 'text-orange-600 bg-orange-50'
            case 'Withholding Tax': return 'text-red-600 bg-red-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Tax Calculation Engine</h2>
                    <p className="text-muted-foreground">
                        Manage tax rates, calculations, and compliance
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={loadData} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Calculator className="h-4 w-4 mr-2" />
                                Calculate Tax
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Calculate Tax</DialogTitle>
                                <DialogDescription>
                                    Calculate tax for a transaction
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="transactionId">Transaction ID</Label>
                                        <Input
                                            id="transactionId"
                                            value={calculateForm.transactionId}
                                            onChange={(e) => setCalculateForm(prev => ({ ...prev, transactionId: e.target.value }))}
                                            placeholder="e.g., INV-001"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="transactionType">Transaction Type</Label>
                                        <Select
                                            value={calculateForm.transactionType}
                                            onValueChange={(value) => setCalculateForm(prev => ({ ...prev, transactionType: value as any }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Sales Invoice">Sales Invoice</SelectItem>
                                                <SelectItem value="Purchase Invoice">Purchase Invoice</SelectItem>
                                                <SelectItem value="Payment">Payment</SelectItem>
                                                <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="baseAmount">Base Amount</Label>
                                    <Input
                                        id="baseAmount"
                                        type="number"
                                        step="0.01"
                                        value={calculateForm.baseAmount}
                                        onChange={(e) => setCalculateForm(prev => ({ ...prev, baseAmount: parseFloat(e.target.value) }))}
                                    />
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setShowCalculateDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCalculateTax}>
                                        Calculate
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Tax Summary */}
            {taxSummary.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Tax Summary (YTD)</CardTitle>
                        <CardDescription>
                            Tax collected and payable for the current year
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(taxSummary.reduce((sum, item) => sum + item.totalTaxableAmount, 0))}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Taxable</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(taxSummary.reduce((sum, item) => sum + item.totalTaxAmount, 0))}
                                </div>
                                <div className="text-sm text-muted-foreground">Total Tax</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">
                                    {taxSummary.reduce((sum, item) => sum + item.transactionCount, 0)}
                                </div>
                                <div className="text-sm text-muted-foreground">Transactions</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Content */}
            <Tabs defaultValue="rates" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="rates">Tax Rates</TabsTrigger>
                    <TabsTrigger value="groups">Tax Groups</TabsTrigger>
                    <TabsTrigger value="calculations">Calculations</TabsTrigger>
                    <TabsTrigger value="returns">Tax Returns</TabsTrigger>
                </TabsList>

                {/* Tax Rates Tab */}
                <TabsContent value="rates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Tax Rates</CardTitle>
                                    <CardDescription>
                                        Manage tax rates and categories
                                    </CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Dialog open={showCreateCategoryDialog} onOpenChange={setShowCreateCategoryDialog}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline">
                                                <Plus className="h-4 w-4 mr-2" />
                                                New Category
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create Tax Category</DialogTitle>
                                                <DialogDescription>
                                                    Add a new tax category
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="categoryName">Category Name</Label>
                                                    <Input
                                                        id="categoryName"
                                                        value={categoryForm.categoryName}
                                                        onChange={(e) => setCategoryForm(prev => ({ ...prev, categoryName: e.target.value }))}
                                                        placeholder="e.g., Sales Tax"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="categoryCode">Category Code</Label>
                                                    <Input
                                                        id="categoryCode"
                                                        value={categoryForm.categoryCode}
                                                        onChange={(e) => setCategoryForm(prev => ({ ...prev, categoryCode: e.target.value }))}
                                                        placeholder="e.g., ST"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="description">Description</Label>
                                                    <Input
                                                        id="description"
                                                        value={categoryForm.description}
                                                        onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                                                        placeholder="Optional description"
                                                    />
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="outline" onClick={() => setShowCreateCategoryDialog(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={handleCreateCategory}>
                                                        Create Category
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog open={showCreateRateDialog} onOpenChange={setShowCreateRateDialog}>
                                        <DialogTrigger asChild>
                                            <Button>
                                                <Plus className="h-4 w-4 mr-2" />
                                                New Rate
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Create Tax Rate</DialogTitle>
                                                <DialogDescription>
                                                    Add a new tax rate
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="rateName">Rate Name</Label>
                                                    <Input
                                                        id="rateName"
                                                        value={rateForm.rateName}
                                                        onChange={(e) => setRateForm(prev => ({ ...prev, rateName: e.target.value }))}
                                                        placeholder="e.g., Standard Rate"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="rateCode">Rate Code</Label>
                                                        <Input
                                                            id="rateCode"
                                                            value={rateForm.rateCode}
                                                            onChange={(e) => setRateForm(prev => ({ ...prev, rateCode: e.target.value }))}
                                                            placeholder="e.g., STD"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="taxType">Tax Type</Label>
                                                        <Select
                                                            value={rateForm.taxType}
                                                            onValueChange={(value) => setRateForm(prev => ({ ...prev, taxType: value as any }))}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="Sales Tax">Sales Tax</SelectItem>
                                                                <SelectItem value="VAT">VAT</SelectItem>
                                                                <SelectItem value="GST">GST</SelectItem>
                                                                <SelectItem value="Income Tax">Income Tax</SelectItem>
                                                                <SelectItem value="Withholding Tax">Withholding Tax</SelectItem>
                                                                <SelectItem value="Custom">Custom</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Label htmlFor="taxCategory">Tax Category</Label>
                                                    <Select
                                                        value={rateForm.taxCategoryId}
                                                        onValueChange={(value) => setRateForm(prev => ({ ...prev, taxCategoryId: value }))}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select category" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {taxCategories.map((category) => (
                                                                <SelectItem key={category.id} value={category.id}>
                                                                    {category.categoryName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <Label htmlFor="ratePercentage">Rate Percentage</Label>
                                                        <Input
                                                            id="ratePercentage"
                                                            type="number"
                                                            step="0.0001"
                                                            value={rateForm.ratePercentage}
                                                            onChange={(e) => setRateForm(prev => ({ ...prev, ratePercentage: parseFloat(e.target.value) }))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="effectiveFrom">Effective From</Label>
                                                        <Input
                                                            id="effectiveFrom"
                                                            type="date"
                                                            value={rateForm.effectiveFrom}
                                                            onChange={(e) => setRateForm(prev => ({ ...prev, effectiveFrom: e.target.value }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex justify-end space-x-2">
                                                    <Button variant="outline" onClick={() => setShowCreateRateDialog(false)}>
                                                        Cancel
                                                    </Button>
                                                    <Button onClick={handleCreateRate}>
                                                        Create Rate
                                                    </Button>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {taxRates.length > 0 ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Rate Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Rate</TableHead>
                                                <TableHead>Effective From</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {taxRates.map((rate) => (
                                                <TableRow key={rate.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">{rate.rateName}</div>
                                                            <div className="text-sm text-muted-foreground">{rate.rateCode}</div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getTaxTypeColor(rate.taxType)}>
                                                            {rate.taxType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {rate.ratePercentage.toFixed(4)}%
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(rate.effectiveFrom), 'MMM dd, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={rate.isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'}>
                                                            {rate.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Tax Rates</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create tax rates to start calculating taxes
                                    </p>
                                    <Button onClick={() => setShowCreateRateDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Tax Rate
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tax Groups Tab */}
                <TabsContent value="groups" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Tax Groups</CardTitle>
                                    <CardDescription>
                                        Group multiple tax rates together
                                    </CardDescription>
                                </div>
                                <Dialog open={showCreateGroupDialog} onOpenChange={setShowCreateGroupDialog}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="h-4 w-4 mr-2" />
                                            New Group
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Create Tax Group</DialogTitle>
                                            <DialogDescription>
                                                Create a group of tax rates
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="groupName">Group Name</Label>
                                                <Input
                                                    id="groupName"
                                                    value={groupForm.groupName}
                                                    onChange={(e) => setGroupForm(prev => ({ ...prev, groupName: e.target.value }))}
                                                    placeholder="e.g., Standard Tax Group"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="groupCode">Group Code</Label>
                                                <Input
                                                    id="groupCode"
                                                    value={groupForm.groupCode}
                                                    onChange={(e) => setGroupForm(prev => ({ ...prev, groupCode: e.target.value }))}
                                                    placeholder="e.g., STD_GROUP"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="groupDescription">Description</Label>
                                                <Input
                                                    id="groupDescription"
                                                    value={groupForm.description}
                                                    onChange={(e) => setGroupForm(prev => ({ ...prev, description: e.target.value }))}
                                                    placeholder="Optional description"
                                                />
                                            </div>
                                            <div className="flex justify-end space-x-2">
                                                <Button variant="outline" onClick={() => setShowCreateGroupDialog(false)}>
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleCreateGroup}>
                                                    Create Group
                                                </Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {taxGroups.length > 0 ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Group Name</TableHead>
                                                <TableHead>Code</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {taxGroups.map((group) => (
                                                <TableRow key={group.id}>
                                                    <TableCell className="font-medium">{group.groupName}</TableCell>
                                                    <TableCell>{group.groupCode}</TableCell>
                                                    <TableCell>{group.description || '-'}</TableCell>
                                                    <TableCell>
                                                        <Badge className={group.isActive ? 'text-green-600 bg-green-50' : 'text-gray-600 bg-gray-50'}>
                                                            {group.isActive ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Tax Groups</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Create tax groups to combine multiple rates
                                    </p>
                                    <Button onClick={() => setShowCreateGroupDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Create Tax Group
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Calculations Tab */}
                <TabsContent value="calculations" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tax Calculations</CardTitle>
                            <CardDescription>
                                View and manage tax calculations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">No Calculations</h3>
                                <p className="text-muted-foreground">
                                    Tax calculations will appear here when you calculate taxes for transactions
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tax Returns Tab */}
                <TabsContent value="returns" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tax Returns</CardTitle>
                            <CardDescription>
                                Manage tax returns and filings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {taxReturns.length > 0 ? (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Return Name</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Period</TableHead>
                                                <TableHead>Due Date</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {taxReturns.map((returnItem) => (
                                                <TableRow key={returnItem.id}>
                                                    <TableCell className="font-medium">{returnItem.returnName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{returnItem.returnType}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(returnItem.taxPeriodStart), 'MMM dd')} - {format(new Date(returnItem.taxPeriodEnd), 'MMM dd, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(returnItem.dueDate), 'MMM dd, yyyy')}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge className={getStatusColor(returnItem.filingStatus)}>
                                                            {returnItem.filingStatus}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end space-x-1">
                                                            <Button variant="ghost" size="sm">
                                                                <FileText className="h-4 w-4" />
                                                            </Button>
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No Tax Returns</h3>
                                    <p className="text-muted-foreground">
                                        Tax returns will be generated automatically based on your transactions
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
