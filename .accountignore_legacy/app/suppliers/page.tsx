'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
    Building2,
    TrendingUp,
    DollarSign,
    Calendar,
    Users,
    CreditCard,
    Phone,
    Mail,
    MapPin,
    Tag,
    Star,
    AlertCircle,
    CheckCircle,
    Clock,
    Target,
    Zap,
    Sparkles,
    MoreHorizontal,
    ArrowUpDown,
    FilterX,
    RefreshCw,
    BarChart3,
    PieChart,
    Activity
} from 'lucide-react'
import { SupplierService, Supplier, SupplierFilters, SupplierStats } from '@/lib/supplier-service'
import { format } from 'date-fns'

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(false)
    const [showSupplierDialog, setShowSupplierDialog] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<string>('all')
    const [sortBy, setSortBy] = useState<string>('supplier_name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [showFilters, setShowFilters] = useState(false)
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
    const [stats, setStats] = useState<SupplierStats | null>(null)

    const companyId = 'default-company' // In a real app, this would come from context

    // Load suppliers on component mount
    useEffect(() => {
        loadSuppliers()
        loadStats()
    }, [companyId])

    // Filter and sort suppliers
    useEffect(() => {
        let filtered = [...suppliers]

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(supplier =>
                supplier.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.supplier_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        }

        // Apply type filter
        if (filterType !== 'all') {
            filtered = filtered.filter(supplier => supplier.supplier_type === filterType)
        }

        // Apply sorting
        filtered.sort((a, b) => {
            const aValue = a[sortBy as keyof Supplier]
            const bValue = b[sortBy as keyof Supplier]

            if (typeof aValue === 'string' && typeof bValue === 'string') {
                return sortOrder === 'asc'
                    ? aValue.localeCompare(bValue)
                    : bValue.localeCompare(aValue)
            }

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
            }

            return 0
        })

        setFilteredSuppliers(filtered)
    }, [suppliers, searchTerm, filterType, sortBy, sortOrder])

    const loadSuppliers = async () => {
        setLoading(true)
        try {
            const result = await SupplierService.getSuppliers({
                company_id: companyId,
                search: searchTerm || undefined,
                supplier_type: filterType !== 'all' ? filterType : undefined
            })

            if (result.success && result.data) {
                setSuppliers(result.data)
            }
        } catch (error) {
            console.error('Error loading suppliers:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const result = await SupplierService.getSupplierStats(companyId)
            if (result.success && result.data) {
                setStats(result.data)
            }
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

    const handleCreateSupplier = (supplier: Supplier) => {
        setSuppliers(prev => [supplier, ...prev])
        setShowSupplierDialog(false)
        loadStats()
    }

    const handleUpdateSupplier = (updatedSupplier: Supplier) => {
        setSuppliers(prev => prev.map(s => s.id === updatedSupplier.id ? updatedSupplier : s))
        setShowSupplierDialog(false)
        setEditingSupplier(null)
        loadStats()
    }

    const handleDeleteSupplier = async (id: string) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            const result = await SupplierService.deleteSupplier(id)
            if (result.success) {
                setSuppliers(prev => prev.filter(s => s.id !== id))
                loadStats()
            }
        }
    }

    const getSupplierTypeIcon = (type: string) => {
        switch (type) {
            case 'Individual':
                return <Users className="h-4 w-4" />
            case 'Company':
                return <Building2 className="h-4 w-4" />
            case 'Government':
                return <Target className="h-4 w-4" />
            default:
                return <Building2 className="h-4 w-4" />
        }
    }

    const getSupplierTypeBadge = (type: string) => {
        const typeConfig = {
            Individual: { variant: 'secondary' as const, label: 'Individual' },
            Company: { variant: 'default' as const, label: 'Company' },
            Government: { variant: 'outline' as const, label: 'Government' }
        }

        const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.Company
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                <Clock className="h-3 w-3 mr-1" />
                Inactive
            </Badge>
        )
    }

    const getTotalStats = () => {
        const totalSuppliers = suppliers.length
        const activeSuppliers = suppliers.filter(s => s.is_active).length
        const totalOutstanding = suppliers.reduce((sum, s) => sum + s.outstanding_amount, 0)
        const totalInvoiced = suppliers.reduce((sum, s) => sum + s.total_invoiced, 0)

        return { totalSuppliers, activeSuppliers, totalOutstanding, totalInvoiced }
    }

    const stats = getTotalStats()

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center space-x-3">
                        <Building2 className="h-8 w-8 text-primary" />
                        <span>Supplier Management</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your supplier database and track relationships
                    </p>
                </div>

                <div className="flex items-center space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={loadSuppliers}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => {
                            setEditingSupplier(null)
                            setShowSupplierDialog(true)
                        }}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Supplier
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Total Suppliers</p>
                                <p className="text-2xl font-bold">{stats.totalSuppliers}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Active Suppliers</p>
                                <p className="text-2xl font-bold">{stats.activeSuppliers}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Total Outstanding</p>
                                <p className="text-2xl font-bold">${stats.totalOutstanding.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Total Invoiced</p>
                                <p className="text-2xl font-bold">${stats.totalInvoiced.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            {showFilters && (
                <Card>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="search"
                                        placeholder="Search suppliers..."
                                        className="pl-10"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="type">Supplier Type</Label>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="Individual">Individual</SelectItem>
                                        <SelectItem value="Company">Company</SelectItem>
                                        <SelectItem value="Government">Government</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="sort">Sort By</Label>
                                <Select value={sortBy} onValueChange={setSortBy}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="supplier_name">Name</SelectItem>
                                        <SelectItem value="supplier_code">Code</SelectItem>
                                        <SelectItem value="outstanding_amount">Outstanding</SelectItem>
                                        <SelectItem value="total_invoiced">Total Invoiced</SelectItem>
                                        <SelectItem value="created_at">Created Date</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    className="w-full"
                                >
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Suppliers Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Suppliers</CardTitle>
                    <CardDescription>
                        {filteredSuppliers.length} suppliers found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">Loading suppliers...</div>
                        </div>
                    ) : filteredSuppliers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No suppliers found</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Get started by adding your first supplier
                            </p>
                            <Button onClick={() => setShowSupplierDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Supplier
                            </Button>
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Outstanding</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSuppliers.map((supplier) => (
                                        <TableRow key={supplier.id}>
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        {getSupplierTypeIcon(supplier.supplier_type)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{supplier.supplier_name}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {supplier.supplier_code}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getSupplierTypeBadge(supplier.supplier_type)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="space-y-1">
                                                    {supplier.contact_person && (
                                                        <div className="flex items-center space-x-1 text-sm">
                                                            <Users className="h-3 w-3" />
                                                            <span>{supplier.contact_person}</span>
                                                        </div>
                                                    )}
                                                    {supplier.email && (
                                                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                            <Mail className="h-3 w-3" />
                                                            <span>{supplier.email}</span>
                                                        </div>
                                                    )}
                                                    {supplier.phone && (
                                                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                            <Phone className="h-3 w-3" />
                                                            <span>{supplier.phone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        {supplier.currency} {supplier.outstanding_amount.toFixed(2)}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Credit: {supplier.currency} {supplier.credit_limit.toFixed(2)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(supplier.is_active)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setEditingSupplier(supplier)
                                                            setShowSupplierDialog(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteSupplier(supplier.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create/Edit Supplier Dialog */}
            <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingSupplier
                                ? 'Update supplier information'
                                : 'Enter supplier details to add them to your database'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    {/* Supplier Form would go here */}
                    <div className="space-y-4">
                        <div className="text-center py-8">
                            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">Supplier Form</h3>
                            <p className="text-muted-foreground">
                                The supplier form component will be implemented here
                            </p>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
