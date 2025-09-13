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
import {
    Plus,
    Trash2,
    Save,
    X,
    FileText,
    Building2,
    Calendar,
    DollarSign
} from 'lucide-react'
import { TransactionService, CreateInvoiceInput, CreateInvoiceItemInput } from '@/lib/transaction-service'
import { AccountingService } from '@/lib/accounting-service'
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

const purchaseInvoiceSchema = z.object({
    supplier_id: z.string().optional(),
    supplier_name: z.string().min(1, 'Supplier name is required'),
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

type PurchaseInvoiceFormData = z.infer<typeof purchaseInvoiceSchema>

interface PurchaseInvoiceFormProps {
    companyId: string
    onSave: (invoice: any) => void
    onCancel: () => void
    initialData?: Partial<PurchaseInvoiceFormData>
}

export function PurchaseInvoiceForm({
    companyId,
    onSave,
    onCancel,
    initialData
}: PurchaseInvoiceFormProps) {
    const [accounts, setAccounts] = useState<any[]>([])
    const [suppliers, setSuppliers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<PurchaseInvoiceFormData>({
        resolver: zodResolver(purchaseInvoiceSchema),
        defaultValues: {
            supplier_name: '',
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
            }]
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'items'
    })

    const watchedItems = watch('items')
    const watchedCurrency = watch('currency')
    const watchedExchangeRate = watch('exchange_rate')

    // Calculate totals
    const netTotal = watchedItems.reduce((sum, item) => sum + (item.qty * item.rate), 0)
    const taxTotal = watchedItems.reduce((sum, item) => {
        const itemAmount = item.qty * item.rate
        const taxAmount = itemAmount * (item.tax_rate || 0) / 100
        return sum + taxAmount
    }, 0)
    const grandTotal = netTotal + taxTotal

    useEffect(() => {
        loadAccounts()
        loadSuppliers()
    }, [companyId])

    const loadAccounts = async () => {
        try {
            const result = await AccountingService.getAccounts(companyId)
            if (result.success && result.accounts) {
                setAccounts(result.accounts)
            }
        } catch (error) {
            console.error('Error loading accounts:', error)
        }
    }

    const loadSuppliers = async () => {
        try {
            // In a real app, this would come from a suppliers API
            setSuppliers([
                { id: '1', name: 'ABC Suppliers', email: 'contact@abcsuppliers.com' },
                { id: '2', name: 'XYZ Wholesale', email: 'info@xyzwholesale.com' },
                { id: '3', name: 'DEF Distributors', email: 'hello@defdistributors.com' }
            ])
        } catch (error) {
            console.error('Error loading suppliers:', error)
        }
    }

    const onSubmit = async (data: PurchaseInvoiceFormData) => {
        setLoading(true)
        try {
            const invoiceData: CreateInvoiceInput = {
                invoice_type: 'Purchase',
                supplier_id: data.supplier_id,
                supplier_name: data.supplier_name,
                invoice_date: data.invoice_date,
                due_date: data.due_date,
                posting_date: data.posting_date,
                currency: data.currency,
                exchange_rate: data.exchange_rate,
                company_id: companyId,
                cost_center_id: data.cost_center_id,
                project_id: data.project_id,
                terms_and_conditions: data.terms_and_conditions,
                remarks: data.remarks,
                reference_no: data.reference_no,
                reference_date: data.reference_date,
                items: data.items.map(item => ({
                    item_code: item.item_code,
                    item_name: item.item_name,
                    description: item.description,
                    item_group: item.item_group,
                    qty: item.qty,
                    rate: item.rate,
                    tax_rate: item.tax_rate,
                    income_account_id: item.income_account_id,
                    expense_account_id: item.expense_account_id,
                    cost_center_id: item.cost_center_id,
                    warehouse: item.warehouse,
                    project_id: item.project_id
                }))
            }

            const result = await TransactionService.createInvoice(invoiceData)
            if (result.success && result.invoice) {
                onSave(result.invoice)
            } else {
                console.error('Error creating invoice:', result.error)
            }
        } catch (error) {
            console.error('Error submitting form:', error)
        } finally {
            setLoading(false)
        }
    }

    const addItem = () => {
        append({
            item_name: '',
            qty: 1,
            rate: 0,
            tax_rate: 0
        })
    }

    const removeItem = (index: number) => {
        remove(index)
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <FileText className="h-5 w-5" />
                        <span>Purchase Invoice</span>
                    </CardTitle>
                    <CardDescription>
                        Create a new purchase invoice from your supplier
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Header Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="supplier_name">Supplier Name *</Label>
                                <Input
                                    id="supplier_name"
                                    {...register('supplier_name')}
                                    placeholder="Enter supplier name"
                                />
                                {errors.supplier_name && (
                                    <p className="text-sm text-red-500 mt-1">{errors.supplier_name.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="invoice_date">Invoice Date *</Label>
                                <Input
                                    id="invoice_date"
                                    type="date"
                                    {...register('invoice_date')}
                                />
                                {errors.invoice_date && (
                                    <p className="text-sm text-red-500 mt-1">{errors.invoice_date.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="due_date">Due Date *</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    {...register('due_date')}
                                />
                                {errors.due_date && (
                                    <p className="text-sm text-red-500 mt-1">{errors.due_date.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="posting_date">Posting Date *</Label>
                                <Input
                                    id="posting_date"
                                    type="date"
                                    {...register('posting_date')}
                                />
                                {errors.posting_date && (
                                    <p className="text-sm text-red-500 mt-1">{errors.posting_date.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Currency and Exchange Rate */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="currency">Currency *</Label>
                                <Select
                                    value={watchedCurrency}
                                    onValueChange={(value) => setValue('currency', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                                        <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                                        <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.currency && (
                                    <p className="text-sm text-red-500 mt-1">{errors.currency.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="exchange_rate">Exchange Rate</Label>
                                <Input
                                    id="exchange_rate"
                                    type="number"
                                    step="0.000001"
                                    {...register('exchange_rate', { valueAsNumber: true })}
                                />
                                {errors.exchange_rate && (
                                    <p className="text-sm text-red-500 mt-1">{errors.exchange_rate.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Invoice Items</h3>
                                <Button type="button" onClick={addItem} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Item
                                </Button>
                            </div>

                            <div className="border rounded-lg">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Rate</TableHead>
                                            <TableHead>Tax %</TableHead>
                                            <TableHead>Amount</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => {
                                            const item = watchedItems[index]
                                            const amount = item.qty * item.rate
                                            const taxAmount = amount * (item.tax_rate || 0) / 100
                                            const totalAmount = amount + taxAmount

                                            return (
                                                <TableRow key={field.id}>
                                                    <TableCell>
                                                        <Input
                                                            {...register(`items.${index}.item_name`)}
                                                            placeholder="Item name"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            {...register(`items.${index}.description`)}
                                                            placeholder="Description"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.001"
                                                            {...register(`items.${index}.qty`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            {...register(`items.${index}.rate`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            {...register(`items.${index}.tax_rate`, { valueAsNumber: true })}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-right">
                                                            <div className="font-medium">{totalAmount.toFixed(2)}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {amount.toFixed(2)} + {taxAmount.toFixed(2)} tax
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeItem(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </div>

                            {errors.items && (
                                <p className="text-sm text-red-500">{errors.items.message}</p>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Net Total</span>
                                        <span className="text-lg font-bold">{netTotal.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Tax Total</span>
                                        <span className="text-lg font-bold">{taxTotal.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Grand Total</span>
                                        <span className="text-lg font-bold text-primary">{grandTotal.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Additional Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                                <Textarea
                                    id="terms_and_conditions"
                                    {...register('terms_and_conditions')}
                                    placeholder="Enter terms and conditions"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="remarks">Remarks</Label>
                                <Textarea
                                    id="remarks"
                                    {...register('remarks')}
                                    placeholder="Enter any additional remarks"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Reference Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="reference_no">Reference No</Label>
                                <Input
                                    id="reference_no"
                                    {...register('reference_no')}
                                    placeholder="Enter reference number"
                                />
                            </div>

                            <div>
                                <Label htmlFor="reference_date">Reference Date</Label>
                                <Input
                                    id="reference_date"
                                    type="date"
                                    {...register('reference_date')}
                                />
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || loading}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSubmitting || loading ? 'Saving...' : 'Save Invoice'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
