/**
 * Enhanced Sales Invoice Form with Workflow Integration
 * Connects existing form to DocumentWorkflowEngine with Submit/Cancel functionality
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog'
import {
    Plus,
    Trash2,
    Save,
    Send,
    X,
    Calculator,
    FileText,
    DollarSign,
    Calendar,
    User,
    Building2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2
} from 'lucide-react'
import { TransactionService, CreateInvoiceInput, CreateInvoiceItemInput } from '@/lib/transaction-service'
import { DocumentWorkflowEngine, DocumentStatus } from '@/lib/document-workflow'
import { BusinessRulesEngine } from '@/lib/business-rules-engine'
import { MasterDataService } from '@/lib/master-data-service'
import { useAuth, useCompany } from '@/hooks/useAuth'
import { format } from 'date-fns'

// Form validation schema
const invoiceItemSchema = z.object({
    item_code: z.string().optional(),
    item_name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    item_group: z.string().optional(),
    qty: z.number().min(0.001, 'Quantity must be greater than 0'),
    rate: z.number().min(0, 'Rate must be greater than or equal to 0'),
    tax_rate: z.number().min(0).max(100).default(0),
    income_account_id: z.string().optional(),
    expense_account_id: z.string().optional(),
    cost_center_id: z.string().optional(),
    warehouse: z.string().optional(),
    project_id: z.string().optional()
})

const salesInvoiceSchema = z.object({
    customer_id: z.string().optional(),
    customer_name: z.string().min(1, 'Customer name is required'),
    invoice_date: z.string().min(1, 'Invoice date is required'),
    due_date: z.string().min(1, 'Due date is required'),
    posting_date: z.string().min(1, 'Posting date is required'),
    currency: z.string().min(1, 'Currency is required'),
    exchange_rate: z.number().min(0.000001, 'Exchange rate must be greater than 0').default(1),
    cost_center_id: z.string().optional(),
    project_id: z.string().optional(),
    terms_and_conditions: z.string().optional(),
    remarks: z.string().optional(),
    reference_no: z.string().optional(),
    reference_date: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required')
})

type SalesInvoiceFormData = z.infer<typeof salesInvoiceSchema>

interface EnhancedSalesInvoiceFormProps {
    invoiceId?: string
    onSave: (invoice: any) => void
    onCancel: () => void
    onSubmit?: (invoice: any) => void
    onCancelInvoice?: (invoice: any) => void
    initialData?: Partial<SalesInvoiceFormData>
    mode?: 'create' | 'edit' | 'view'
}

export function EnhancedSalesInvoiceForm({
    invoiceId,
    onSave,
    onCancel,
    onSubmit,
    onCancelInvoice,
    initialData,
    mode = 'create'
}: EnhancedSalesInvoiceFormProps) {
    const { user } = useAuth()
    const { currentCompany } = useCompany()

    // State management
    const [accounts, setAccounts] = useState<any[]>([])
    const [customers, setCustomers] = useState<any[]>([])
    const [invoice, setInvoice] = useState<any>(null)
    const [invoiceStatus, setInvoiceStatus] = useState<'Draft' | 'Submitted' | 'Cancelled'>('Draft')
    const [loading, setLoading] = useState(false)
    const [validationResult, setValidationResult] = useState<any>(null)
    const [showSubmitDialog, setShowSubmitDialog] = useState(false)
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [cancellationReason, setCancellationReason] = useState('')

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<SalesInvoiceFormData>({
        resolver: zodResolver(salesInvoiceSchema),
        defaultValues: {
            invoice_date: format(new Date(), 'yyyy-MM-dd'),
            due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
            posting_date: format(new Date(), 'yyyy-MM-dd'),
            currency: 'USD',
            exchange_rate: 1,
            items: [{
                item_name: '',
                qty: 1,
                rate: 0,
                tax_rate: 0
            }],
            ...initialData
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items'
    })

    const watchedItems = watch('items')

    // Load initial data
    useEffect(() => {
        loadFormData()
        if (invoiceId) {
            loadInvoiceData()
        }
    }, [invoiceId, currentCompany])

    const loadFormData = async () => {
        if (!currentCompany) return

        try {
            // Load customers
            const { data: customersData } = await MasterDataService.searchCustomers(currentCompany.id)
            setCustomers(customersData)

            // Load accounts (simplified for demo)
            // In production, you'd load from AccountingService
            setAccounts([
                { id: '1', name: 'Sales Revenue', account_type: 'Income' },
                { id: '2', name: 'Service Revenue', account_type: 'Income' },
                { id: '3', name: 'Consulting Revenue', account_type: 'Income' }
            ])
        } catch (error) {
            console.error('Error loading form data:', error)
        }
    }

    const loadInvoiceData = async () => {
        if (!invoiceId || !currentCompany) return

        try {
            // Load invoice data from TransactionService
            // This is a placeholder - implement actual loading
            const invoiceData = {
                id: invoiceId,
                status: 'Draft', // This would come from the database
                // ... other invoice fields
            }

            setInvoice(invoiceData)
            setInvoiceStatus(invoiceData.status)
        } catch (error) {
            console.error('Error loading invoice:', error)
        }
    }

    // Calculate totals
    const calculateTotals = () => {
        const items = watchedItems || []
        const netTotal = items.reduce((sum, item) => {
            const amount = (item.qty || 0) * (item.rate || 0)
            return sum + amount
        }, 0)

        const taxTotal = items.reduce((sum, item) => {
            const amount = (item.qty || 0) * (item.rate || 0)
            const tax = amount * ((item.tax_rate || 0) / 100)
            return sum + tax
        }, 0)

        const grandTotal = netTotal + taxTotal

        return { netTotal, taxTotal, grandTotal }
    }

    const { netTotal, taxTotal, grandTotal } = calculateTotals()

    // Form submission handlers
    const onSaveAsDraft = async (data: SalesInvoiceFormData) => {
        if (!currentCompany || !user) return

        try {
            setLoading(true)

            const invoiceInput: CreateInvoiceInput = {
                invoice_type: 'Sales',
                customer_name: data.customer_name,
                customer_id: data.customer_id,
                invoice_date: data.invoice_date,
                due_date: data.due_date,
                posting_date: data.posting_date,
                currency: data.currency,
                exchange_rate: data.exchange_rate,
                net_total: netTotal,
                tax_total: taxTotal,
                grand_total: grandTotal,
                status: 'Draft',
                company_id: currentCompany.id,
                cost_center_id: data.cost_center_id,
                project_id: data.project_id,
                terms_and_conditions: data.terms_and_conditions,
                remarks: data.remarks,
                reference_no: data.reference_no,
                reference_date: data.reference_date,
                items: data.items.map(item => ({
                    item_name: item.item_name,
                    item_code: item.item_code,
                    description: item.description,
                    qty: item.qty,
                    rate: item.rate,
                    amount: item.qty * item.rate,
                    tax_rate: item.tax_rate,
                    tax_amount: (item.qty * item.rate) * (item.tax_rate / 100),
                    income_account_id: item.income_account_id,
                    cost_center_id: item.cost_center_id,
                    project_id: item.project_id
                }))
            }

            const result = await TransactionService.createInvoice(invoiceInput)
            setInvoice(result)
            onSave(result)
        } catch (error) {
            console.error('Error saving invoice:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmitInvoice = async () => {
        if (!invoice || !user || !currentCompany) return

        try {
            setLoading(true)

            // Validate business rules first
            const validation = await BusinessRulesEngine.validateSalesInvoice(
                invoice,
                currentCompany.id,
                user.id
            )

            setValidationResult(validation)

            if (!validation.valid) {
                setShowSubmitDialog(false)
                return
            }

            // Submit the invoice
            const result = await DocumentWorkflowEngine.submitSalesInvoice(
                invoice.id,
                {
                    userId: user.id,
                    companyId: currentCompany.id,
                    postingDate: format(new Date(), 'yyyy-MM-dd'),
                    remarks: 'Invoice submitted via web interface'
                }
            )

            if (result.success) {
                setInvoiceStatus('Submitted')
                setShowSubmitDialog(false)
                if (onSubmit) onSubmit(invoice)
            } else {
                console.error('Submission failed:', result.errors)
            }
        } catch (error) {
            console.error('Error submitting invoice:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCancelInvoice = async () => {
        if (!invoice || !user || !currentCompany || !cancellationReason.trim()) return

        try {
            setLoading(true)

            const result = await DocumentWorkflowEngine.cancelSalesInvoice(
                invoice.id,
                {
                    userId: user.id,
                    companyId: currentCompany.id,
                    postingDate: format(new Date(), 'yyyy-MM-dd')
                },
                cancellationReason
            )

            if (result.success) {
                setInvoiceStatus('Cancelled')
                setShowCancelDialog(false)
                if (onCancelInvoice) onCancelInvoice(invoice)
            } else {
                console.error('Cancellation failed:', result.errors)
            }
        } catch (error) {
            console.error('Error cancelling invoice:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = () => {
        switch (invoiceStatus) {
            case 'Draft':
                return <Badge variant="secondary">Draft</Badge>
            case 'Submitted':
                return <Badge variant="default">Submitted</Badge>
            case 'Cancelled':
                return <Badge variant="destructive">Cancelled</Badge>
            default:
                return <Badge variant="secondary">Unknown</Badge>
        }
    }

    const canEdit = invoiceStatus === 'Draft' && mode !== 'view'
    const canSubmit = invoiceStatus === 'Draft' && invoice && mode !== 'view'
    const canCancel = invoiceStatus === 'Submitted' && invoice && mode !== 'view'

    return (
        <div className="space-y-6">
            {/* Header with Status */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Sales Invoice
                                {invoice && <span className="text-muted-foreground">#{invoice.invoice_no}</span>}
                            </CardTitle>
                            <CardDescription>
                                Create and manage sales invoices with ERPNext-level workflow
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            {getStatusBadge()}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Validation Results */}
            {validationResult && !validationResult.valid && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <p className="font-medium">Validation Errors:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {validationResult.errors.map((error: string, index: number) => (
                                    <li key={index} className="text-sm">{error}</li>
                                ))}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {validationResult && validationResult.warnings && validationResult.warnings.length > 0 && (
                <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        <div className="space-y-1">
                            <p className="font-medium">Warnings:</p>
                            <ul className="list-disc list-inside space-y-1">
                                {validationResult.warnings.map((warning: string, index: number) => (
                                    <li key={index} className="text-sm">{warning}</li>
                                ))}
                            </ul>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Form */}
            <form onSubmit={handleSubmit(onSaveAsDraft)} className="space-y-6">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="customer_name">Customer Name *</Label>
                            <Select
                                onValueChange={(value) => {
                                    const customer = customers.find(c => c.customer_name === value)
                                    setValue('customer_name', value)
                                    if (customer) {
                                        setValue('customer_id', customer.id)
                                    }
                                }}
                                disabled={!canEdit}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.customer_name}>
                                            {customer.customer_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.customer_name && (
                                <p className="text-sm text-destructive">{errors.customer_name.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Details */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Invoice Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoice_date">Invoice Date *</Label>
                            <Input
                                id="invoice_date"
                                type="date"
                                {...register('invoice_date')}
                                disabled={!canEdit}
                            />
                            {errors.invoice_date && (
                                <p className="text-sm text-destructive">{errors.invoice_date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="due_date">Due Date *</Label>
                            <Input
                                id="due_date"
                                type="date"
                                {...register('due_date')}
                                disabled={!canEdit}
                            />
                            {errors.due_date && (
                                <p className="text-sm text-destructive">{errors.due_date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="posting_date">Posting Date *</Label>
                            <Input
                                id="posting_date"
                                type="date"
                                {...register('posting_date')}
                                disabled={!canEdit}
                            />
                            {errors.posting_date && (
                                <p className="text-sm text-destructive">{errors.posting_date.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Items Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Invoice Items
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Item Name</TableHead>
                                    <TableHead>Qty</TableHead>
                                    <TableHead>Rate</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Tax %</TableHead>
                                    <TableHead>Tax Amount</TableHead>
                                    <TableHead>Total</TableHead>
                                    {canEdit && <TableHead>Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fields.map((field, index) => {
                                    const item = watchedItems[index] || {}
                                    const amount = (item.qty || 0) * (item.rate || 0)
                                    const taxAmount = amount * ((item.tax_rate || 0) / 100)
                                    const total = amount + taxAmount

                                    return (
                                        <TableRow key={field.id}>
                                            <TableCell>
                                                <Input
                                                    {...register(`items.${index}.item_name`)}
                                                    placeholder="Item name"
                                                    disabled={!canEdit}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.qty`, { valueAsNumber: true })}
                                                    disabled={!canEdit}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.rate`, { valueAsNumber: true })}
                                                    disabled={!canEdit}
                                                />
                                            </TableCell>
                                            <TableCell>{amount.toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    {...register(`items.${index}.tax_rate`, { valueAsNumber: true })}
                                                    disabled={!canEdit}
                                                />
                                            </TableCell>
                                            <TableCell>{taxAmount.toFixed(2)}</TableCell>
                                            <TableCell className="font-medium">{total.toFixed(2)}</TableCell>
                                            {canEdit && (
                                                <TableCell>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => remove(index)}
                                                        disabled={fields.length === 1}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>

                        {canEdit && (
                            <div className="mt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => append({
                                        item_name: '',
                                        qty: 1,
                                        rate: 0,
                                        tax_rate: 0
                                    })}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>
                        )}

                        {/* Totals */}
                        <div className="mt-6 space-y-2 text-right">
                            <div className="flex justify-end">
                                <div className="w-64 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Net Total:</span>
                                        <span>{netTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tax Total:</span>
                                        <span>{taxTotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                                        <span>Grand Total:</span>
                                        <span>{grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Additional Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="terms_and_conditions">Terms and Conditions</Label>
                            <Textarea
                                id="terms_and_conditions"
                                {...register('terms_and_conditions')}
                                placeholder="Enter terms and conditions"
                                disabled={!canEdit}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea
                                id="remarks"
                                {...register('remarks')}
                                placeholder="Enter remarks"
                                disabled={!canEdit}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onCancel}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>

                            <div className="flex gap-2">
                                {canEdit && (
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={isSubmitting || loading}
                                    >
                                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        <Save className="h-4 w-4 mr-2" />
                                        Save as Draft
                                    </Button>
                                )}

                                {canSubmit && (
                                    <Button
                                        type="button"
                                        onClick={() => setShowSubmitDialog(true)}
                                        disabled={loading}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Submit Invoice
                                    </Button>
                                )}

                                {canCancel && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => setShowCancelDialog(true)}
                                        disabled={loading}
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel Invoice
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Submit Confirmation Dialog */}
            <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Invoice</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to submit this invoice? Once submitted, it cannot be edited and will create GL entries.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmitInvoice} disabled={loading}>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Invoice</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for cancelling this invoice. This action will create reverse GL entries.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="cancellation_reason">Cancellation Reason *</Label>
                            <Textarea
                                id="cancellation_reason"
                                value={cancellationReason}
                                onChange={(e) => setCancellationReason(e.target.value)}
                                placeholder="Enter reason for cancellation"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleCancelInvoice}
                            disabled={loading || !cancellationReason.trim()}
                        >
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel Invoice
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
