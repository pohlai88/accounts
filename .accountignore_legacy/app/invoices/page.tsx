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
    FileText,
    TrendingUp,
    DollarSign,
    Calendar,
    Building2
} from 'lucide-react'
import { TransactionService, Invoice, InvoiceType } from '@/lib/transaction-service'
import { SalesInvoiceForm } from '@/components/transactions/sales-invoice-form'
import { PurchaseInvoiceForm } from '@/components/transactions/purchase-invoice-form'
import ERPNextEnhancedSalesInvoiceForm from '@/components/transactions/ERPNextEnhancedSalesInvoiceForm'
import { format } from 'date-fns'

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [invoiceType, setInvoiceType] = useState<InvoiceType>('Sales')
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
    const [showInvoiceDialog, setShowInvoiceDialog] = useState(false)
    const [filters, setFilters] = useState({
        invoice_type: 'All' as 'All' | InvoiceType,
        status: 'All' as 'All' | 'Draft' | 'Submitted' | 'Paid' | 'Overdue' | 'Cancelled',
        search: ''
    })

    const companyId = 'default-company' // In a real app, this would come from context

    useEffect(() => {
        loadInvoices()
    }, [companyId, filters])

    const loadInvoices = async () => {
        setLoading(true)
        try {
            const result = await TransactionService.getInvoices({
                company_id: companyId,
                invoice_type: filters.invoice_type === 'All' ? undefined : filters.invoice_type,
                status: filters.status === 'All' ? undefined : filters.status,
                limit: 50
            })

            if (result.success && result.invoices) {
                let filteredInvoices = result.invoices

                if (filters.search) {
                    filteredInvoices = filteredInvoices.filter(invoice =>
                        invoice.invoice_no.toLowerCase().includes(filters.search.toLowerCase()) ||
                        invoice.customer_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
                        invoice.supplier_name?.toLowerCase().includes(filters.search.toLowerCase())
                    )
                }

                setInvoices(filteredInvoices)
            }
        } catch (error) {
            console.error('Error loading invoices:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateInvoice = (invoice: Invoice) => {
        setInvoices(prev => [invoice, ...prev])
        setShowCreateDialog(false)
    }

    const handleViewInvoice = (invoice: Invoice) => {
        setSelectedInvoice(invoice)
        setShowInvoiceDialog(true)
    }

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            Draft: { variant: 'secondary' as const, label: 'Draft' },
            Submitted: { variant: 'default' as const, label: 'Submitted' },
            Paid: { variant: 'default' as const, label: 'Paid' },
            Overdue: { variant: 'destructive' as const, label: 'Overdue' },
            Cancelled: { variant: 'outline' as const, label: 'Cancelled' }
        }

        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const getInvoiceTypeIcon = (type: InvoiceType) => {
        return type === 'Sales' ? <TrendingUp className="h-4 w-4" /> : <Building2 className="h-4 w-4" />
    }

    const getTotalInvoices = () => invoices.length
    const getTotalAmount = () => invoices.reduce((sum, invoice) => sum + invoice.grand_total, 0)
    const getPaidInvoices = () => invoices.filter(invoice => invoice.is_paid).length
    const getOverdueInvoices = () => invoices.filter(invoice => invoice.status === 'Overdue').length

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Invoices</h1>
                    <p className="text-muted-foreground">
                        Manage your sales and purchase invoices
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button
                        onClick={() => {
                            setInvoiceType('Sales')
                            setShowCreateDialog(true)
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Enhanced Sales Invoice
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setInvoiceType('Purchase')
                            setShowCreateDialog(true)
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Purchase Invoice
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Total Invoices</p>
                                <p className="text-2xl font-bold">{getTotalInvoices()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Total Amount</p>
                                <p className="text-2xl font-bold">${getTotalAmount().toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Paid Invoices</p>
                                <p className="text-2xl font-bold">{getPaidInvoices()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">Overdue</p>
                                <p className="text-2xl font-bold text-red-500">{getOverdueInvoices()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search invoices..."
                                    className="pl-10"
                                    value={filters.search}
                                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="invoice_type">Invoice Type</Label>
                            <Select
                                value={filters.invoice_type}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, invoice_type: value as any }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Types</SelectItem>
                                    <SelectItem value="Sales">Sales</SelectItem>
                                    <SelectItem value="Purchase">Purchase</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as any }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="All">All Status</SelectItem>
                                    <SelectItem value="Draft">Draft</SelectItem>
                                    <SelectItem value="Submitted">Submitted</SelectItem>
                                    <SelectItem value="Paid">Paid</SelectItem>
                                    <SelectItem value="Overdue">Overdue</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button variant="outline" className="w-full">
                                <Filter className="h-4 w-4 mr-2" />
                                More Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Invoices</CardTitle>
                    <CardDescription>
                        {invoices.length} invoices found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-muted-foreground">Loading invoices...</div>
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No invoices found</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Get started by creating your first invoice
                            </p>
                            <Button onClick={() => setShowCreateDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Invoice
                            </Button>
                        </div>
                    ) : (
                        <div className="border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Invoice No</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Party</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((invoice) => (
                                        <TableRow key={invoice.id}>
                                            <TableCell className="font-medium">
                                                {invoice.invoice_no}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    {getInvoiceTypeIcon(invoice.invoice_type)}
                                                    <span>{invoice.invoice_type}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {invoice.customer_name || invoice.supplier_name}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(invoice.invoice_date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-right">
                                                    <div className="font-medium">
                                                        {invoice.currency} {invoice.grand_total.toFixed(2)}
                                                    </div>
                                                    {invoice.outstanding_amount > 0 && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Outstanding: {invoice.currency} {invoice.outstanding_amount.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(invoice.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleViewInvoice(invoice)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Download className="h-4 w-4" />
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

            {/* Create Invoice Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Create {invoiceType} Invoice
                        </DialogTitle>
                        <DialogDescription>
                            Fill in the details to create a new {invoiceType.toLowerCase()} invoice
                        </DialogDescription>
                    </DialogHeader>
                    {invoiceType === 'Sales' ? (
                        <ERPNextEnhancedSalesInvoiceForm
                            companyId={companyId}
                            onSave={(data) => {
                                // Convert form data to Invoice format for compatibility
                                const invoice: Invoice = {
                                    id: Date.now().toString(),
                                    invoice_no: `INV-${Date.now()}`,
                                    invoice_type: 'Sales',
                                    invoice_date: data.posting_date,
                                    due_date: data.due_date,
                                    customer_id: data.customer_id,
                                    customer_name: 'Customer Name', // Would be fetched from customer service
                                    currency: data.currency,
                                    exchange_rate: data.exchange_rate,
                                    net_total: data.items.reduce((sum, item) => sum + (item.qty * item.rate), 0),
                                    tax_total: data.items.reduce((sum, item) => sum + (item.qty * item.rate * (item.tax_rate / 100)), 0),
                                    grand_total: data.items.reduce((sum, item) => sum + (item.qty * item.rate * (1 + item.tax_rate / 100)), 0),
                                    outstanding_amount: data.items.reduce((sum, item) => sum + (item.qty * item.rate * (1 + item.tax_rate / 100)), 0),
                                    status: 'Draft',
                                    is_paid: false,
                                    items: data.items.map(item => ({
                                        item_name: item.item_name,
                                        qty: item.qty,
                                        rate: item.rate,
                                        amount: item.qty * item.rate,
                                        tax_amount: item.qty * item.rate * (item.tax_rate / 100)
                                    })),
                                    company_id: companyId,
                                    created_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString()
                                }
                                handleCreateInvoice(invoice)
                            }}
                            onCancel={() => setShowCreateDialog(false)}
                        />
                    ) : (
                        <PurchaseInvoiceForm
                            companyId={companyId}
                            onSave={handleCreateInvoice}
                            onCancel={() => setShowCreateDialog(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* View Invoice Dialog */}
            <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Invoice Details - {selectedInvoice?.invoice_no}
                        </DialogTitle>
                        <DialogDescription>
                            View and manage invoice details
                        </DialogDescription>
                    </DialogHeader>
                    {selectedInvoice && (
                        <div className="space-y-6">
                            {/* Invoice Header */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-medium mb-2">Invoice Information</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Invoice No:</span> {selectedInvoice.invoice_no}</p>
                                        <p><span className="font-medium">Type:</span> {selectedInvoice.invoice_type}</p>
                                        <p><span className="font-medium">Date:</span> {format(new Date(selectedInvoice.invoice_date), 'MMM dd, yyyy')}</p>
                                        <p><span className="font-medium">Due Date:</span> {format(new Date(selectedInvoice.due_date), 'MMM dd, yyyy')}</p>
                                        <p><span className="font-medium">Status:</span> {getStatusBadge(selectedInvoice.status)}</p>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-medium mb-2">Party Information</h3>
                                    <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Party:</span> {selectedInvoice.customer_name || selectedInvoice.supplier_name}</p>
                                        <p><span className="font-medium">Currency:</span> {selectedInvoice.currency}</p>
                                        <p><span className="font-medium">Exchange Rate:</span> {selectedInvoice.exchange_rate}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Invoice Items */}
                            <div>
                                <h3 className="font-medium mb-2">Invoice Items</h3>
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Item Name</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>Rate</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Tax</TableHead>
                                                <TableHead>Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedInvoice.items.map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{item.item_name}</TableCell>
                                                    <TableCell>{item.qty}</TableCell>
                                                    <TableCell>{item.rate.toFixed(2)}</TableCell>
                                                    <TableCell>{item.amount.toFixed(2)}</TableCell>
                                                    <TableCell>{item.tax_amount.toFixed(2)}</TableCell>
                                                    <TableCell>{(item.amount + item.tax_amount).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Invoice Totals */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Net Total</span>
                                            <span className="text-lg font-bold">{selectedInvoice.currency} {selectedInvoice.net_total.toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Tax Total</span>
                                            <span className="text-lg font-bold">{selectedInvoice.currency} {selectedInvoice.tax_total.toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Grand Total</span>
                                            <span className="text-lg font-bold text-primary">{selectedInvoice.currency} {selectedInvoice.grand_total.toFixed(2)}</span>
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
