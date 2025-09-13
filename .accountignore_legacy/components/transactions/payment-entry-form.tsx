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
import {
    Plus,
    Trash2,
    Save,
    X,
    DollarSign,
    Calendar,
    User,
    Building2,
    CreditCard,
    Banknote
} from 'lucide-react'
import { TransactionService, CreatePaymentInput, CreatePaymentAllocationInput } from '@/lib/transaction-service'
import { AccountingService } from '@/lib/accounting-service'
import { format } from 'date-fns'

// Form validation schema
const paymentAllocationSchema = z.object({
    invoice_id: z.string().min(1, 'Invoice is required'),
    allocated_amount: z.number().min(0.01, 'Allocated amount must be greater than 0'),
    discount_amount: z.number().min(0).default(0),
    discount_account_id: z.string().optional()
})

const paymentEntrySchema = z.object({
    payment_type: z.enum(['Received', 'Paid']),
    party_type: z.enum(['Customer', 'Supplier', 'Employee', 'Other']),
    party_id: z.string().optional(),
    party_name: z.string().min(1, 'Party name is required'),
    payment_date: z.string().min(1, 'Payment date is required'),
    posting_date: z.string().min(1, 'Posting date is required'),
    currency: z.string().min(1, 'Currency is required'),
    exchange_rate: z.number().min(0.000001, 'Exchange rate must be greater than 0').default(1),
    paid_amount: z.number().min(0).default(0),
    received_amount: z.number().min(0).default(0),
    mode_of_payment: z.string().min(1, 'Mode of payment is required'),
    reference_no: z.string().optional(),
    reference_date: z.string().optional(),
    cost_center_id: z.string().optional(),
    remarks: z.string().optional(),
    allocations: z.array(paymentAllocationSchema).default([])
})

type PaymentEntryFormData = z.infer<typeof paymentEntrySchema>

interface PaymentEntryFormProps {
    companyId: string
    onSave: (payment: any) => void
    onCancel: () => void
    initialData?: Partial<PaymentEntryFormData>
}

export function PaymentEntryForm({
    companyId,
    onSave,
    onCancel,
    initialData
}: PaymentEntryFormProps) {
    const [accounts, setAccounts] = useState<any[]>([])
    const [invoices, setInvoices] = useState<any[]>([])
    const [parties, setParties] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    const {
        register,
        control,
        handleSubmit,
        watch,
        setValue,
        formState: { errors, isSubmitting }
    } = useForm<PaymentEntryFormData>({
        resolver: zodResolver(paymentEntrySchema),
        defaultValues: {
            payment_type: 'Received',
            party_type: 'Customer',
            party_name: '',
            payment_date: format(new Date(), 'yyyy-MM-dd'),
            posting_date: format(new Date(), 'yyyy-MM-dd'),
            currency: 'USD',
            exchange_rate: 1,
            paid_amount: 0,
            received_amount: 0,
            mode_of_payment: 'Cash',
            allocations: []
        }
    })

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'allocations'
    })

    const watchedPaymentType = watch('payment_type')
    const watchedPartyType = watch('party_type')
    const watchedPaidAmount = watch('paid_amount')
    const watchedReceivedAmount = watch('received_amount')
    const watchedAllocations = watch('allocations')

    // Calculate totals
    const totalAllocatedAmount = watchedAllocations.reduce((sum, alloc) => sum + alloc.allocated_amount, 0)
    const totalAmount = watchedPaidAmount + watchedReceivedAmount
    const unallocatedAmount = totalAmount - totalAllocatedAmount

    useEffect(() => {
        loadAccounts()
        loadInvoices()
        loadParties()
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

    const loadInvoices = async () => {
        try {
            // In a real app, this would come from an invoices API
            setInvoices([
                { id: '1', invoice_no: 'SI-000001', party_name: 'ABC Corp', outstanding_amount: 1000 },
                { id: '2', invoice_no: 'SI-000002', party_name: 'XYZ Ltd', outstanding_amount: 2500 },
                { id: '3', invoice_no: 'PI-000001', party_name: 'DEF Suppliers', outstanding_amount: 1500 }
            ])
        } catch (error) {
            console.error('Error loading invoices:', error)
        }
    }

    const loadParties = async () => {
        try {
            // In a real app, this would come from a parties API
            setParties([
                { id: '1', name: 'ABC Corp', type: 'Customer', email: 'contact@abccorp.com' },
                { id: '2', name: 'XYZ Ltd', type: 'Customer', email: 'info@xyzltd.com' },
                { id: '3', name: 'DEF Suppliers', type: 'Supplier', email: 'hello@defsuppliers.com' }
            ])
        } catch (error) {
            console.error('Error loading parties:', error)
        }
    }

    const onSubmit = async (data: PaymentEntryFormData) => {
        setLoading(true)
        try {
            const paymentData: CreatePaymentInput = {
                payment_type: data.payment_type,
                party_type: data.party_type,
                party_id: data.party_id,
                party_name: data.party_name,
                payment_date: data.payment_date,
                posting_date: data.posting_date,
                currency: data.currency,
                exchange_rate: data.exchange_rate,
                paid_amount: data.paid_amount,
                received_amount: data.received_amount,
                mode_of_payment: data.mode_of_payment,
                reference_no: data.reference_no,
                reference_date: data.reference_date,
                company_id: companyId,
                cost_center_id: data.cost_center_id,
                remarks: data.remarks,
                allocations: data.allocations.map(alloc => ({
                    invoice_id: alloc.invoice_id,
                    allocated_amount: alloc.allocated_amount,
                    discount_amount: alloc.discount_amount,
                    discount_account_id: alloc.discount_account_id
                }))
            }

            const result = await TransactionService.createPayment(paymentData)
            if (result.success && result.payment) {
                onSave(result.payment)
            } else {
                console.error('Error creating payment:', result.error)
            }
        } catch (error) {
            console.error('Error submitting form:', error)
        } finally {
            setLoading(false)
        }
    }

    const addAllocation = () => {
        append({
            invoice_id: '',
            allocated_amount: 0,
            discount_amount: 0
        })
    }

    const removeAllocation = (index: number) => {
        remove(index)
    }

    const getAvailableInvoices = () => {
        return invoices.filter(invoice =>
            invoice.party_name === watchedPartyType ||
            invoice.outstanding_amount > 0
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <DollarSign className="h-5 w-5" />
                        <span>Payment Entry</span>
                    </CardTitle>
                    <CardDescription>
                        Record a payment received or made
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Header Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="payment_type">Payment Type *</Label>
                                <Select
                                    value={watchedPaymentType}
                                    onValueChange={(value) => setValue('payment_type', value as 'Received' | 'Paid')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Received">
                                            <div className="flex items-center space-x-2">
                                                <Banknote className="h-4 w-4" />
                                                <span>Received</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Paid">
                                            <div className="flex items-center space-x-2">
                                                <CreditCard className="h-4 w-4" />
                                                <span>Paid</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.payment_type && (
                                    <p className="text-sm text-red-500 mt-1">{errors.payment_type.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="party_type">Party Type *</Label>
                                <Select
                                    value={watchedPartyType}
                                    onValueChange={(value) => setValue('party_type', value as any)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select party type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Customer">Customer</SelectItem>
                                        <SelectItem value="Supplier">Supplier</SelectItem>
                                        <SelectItem value="Employee">Employee</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.party_type && (
                                    <p className="text-sm text-red-500 mt-1">{errors.party_type.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="party_name">Party Name *</Label>
                                <Input
                                    id="party_name"
                                    {...register('party_name')}
                                    placeholder="Enter party name"
                                />
                                {errors.party_name && (
                                    <p className="text-sm text-red-500 mt-1">{errors.party_name.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="mode_of_payment">Mode of Payment *</Label>
                                <Select
                                    value={watch('mode_of_payment')}
                                    onValueChange={(value) => setValue('mode_of_payment', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="Cheque">Cheque</SelectItem>
                                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                                        <SelectItem value="Debit Card">Debit Card</SelectItem>
                                        <SelectItem value="Online Payment">Online Payment</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.mode_of_payment && (
                                    <p className="text-sm text-red-500 mt-1">{errors.mode_of_payment.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Date Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="payment_date">Payment Date *</Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    {...register('payment_date')}
                                />
                                {errors.payment_date && (
                                    <p className="text-sm text-red-500 mt-1">{errors.payment_date.message}</p>
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

                            <div>
                                <Label htmlFor="currency">Currency *</Label>
                                <Select
                                    value={watch('currency')}
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

                        {/* Amount Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="paid_amount">Paid Amount</Label>
                                <Input
                                    id="paid_amount"
                                    type="number"
                                    step="0.01"
                                    {...register('paid_amount', { valueAsNumber: true })}
                                    placeholder="0.00"
                                />
                                {errors.paid_amount && (
                                    <p className="text-sm text-red-500 mt-1">{errors.paid_amount.message}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="received_amount">Received Amount</Label>
                                <Input
                                    id="received_amount"
                                    type="number"
                                    step="0.01"
                                    {...register('received_amount', { valueAsNumber: true })}
                                    placeholder="0.00"
                                />
                                {errors.received_amount && (
                                    <p className="text-sm text-red-500 mt-1">{errors.received_amount.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Payment Allocations */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-medium">Payment Allocations</h3>
                                <Button type="button" onClick={addAllocation} size="sm">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Allocation
                                </Button>
                            </div>

                            {fields.length > 0 && (
                                <div className="border rounded-lg">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Invoice</TableHead>
                                                <TableHead>Outstanding Amount</TableHead>
                                                <TableHead>Allocated Amount</TableHead>
                                                <TableHead>Discount Amount</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {fields.map((field, index) => {
                                                const allocation = watchedAllocations[index]
                                                const invoice = invoices.find(inv => inv.id === allocation.invoice_id)

                                                return (
                                                    <TableRow key={field.id}>
                                                        <TableCell>
                                                            <Select
                                                                value={allocation.invoice_id}
                                                                onValueChange={(value) => setValue(`allocations.${index}.invoice_id`, value)}
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select invoice" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {getAvailableInvoices().map(invoice => (
                                                                        <SelectItem key={invoice.id} value={invoice.id}>
                                                                            {invoice.invoice_no} - {invoice.party_name} ({invoice.outstanding_amount})
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="font-medium">
                                                                {invoice ? invoice.outstanding_amount.toFixed(2) : '0.00'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                {...register(`allocations.${index}.allocated_amount`, { valueAsNumber: true })}
                                                                placeholder="0.00"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                {...register(`allocations.${index}.discount_amount`, { valueAsNumber: true })}
                                                                placeholder="0.00"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => removeAllocation(index)}
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
                            )}

                            {errors.allocations && (
                                <p className="text-sm text-red-500">{errors.allocations.message}</p>
                            )}
                        </div>

                        {/* Totals */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Total Amount</span>
                                        <span className="text-lg font-bold">{totalAmount.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Allocated Amount</span>
                                        <span className="text-lg font-bold">{totalAllocatedAmount.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Unallocated Amount</span>
                                        <span className={`text-lg font-bold ${unallocatedAmount < 0 ? 'text-red-500' : 'text-primary'}`}>
                                            {unallocatedAmount.toFixed(2)}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Additional Information */}
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

                        <div>
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea
                                id="remarks"
                                {...register('remarks')}
                                placeholder="Enter any additional remarks"
                                rows={3}
                            />
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-2">
                            <Button type="button" variant="outline" onClick={onCancel}>
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting || loading}>
                                <Save className="h-4 w-4 mr-2" />
                                {isSubmitting || loading ? 'Saving...' : 'Save Payment'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
