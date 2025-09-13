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
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  User,
  CreditCard,
  Banknote
} from 'lucide-react'
import { TransactionService, Payment, PaymentType } from '@/lib/transaction-service'
import { PaymentEntryForm } from '@/components/transactions/payment-entry-form'
import { format } from 'date-fns'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [filters, setFilters] = useState({
    payment_type: 'All' as 'All' | PaymentType,
    status: 'All' as 'All' | 'Draft' | 'Submitted' | 'Cancelled',
    search: ''
  })

  const companyId = 'default-company' // In a real app, this would come from context

  useEffect(() => {
    loadPayments()
  }, [companyId, filters])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const result = await TransactionService.getPayments({
        company_id: companyId,
        payment_type: filters.payment_type === 'All' ? undefined : filters.payment_type,
        status: filters.status === 'All' ? undefined : filters.status,
        limit: 50
      })

      if (result.success && result.payments) {
        let filteredPayments = result.payments

        if (filters.search) {
          filteredPayments = filteredPayments.filter(payment =>
            payment.payment_no.toLowerCase().includes(filters.search.toLowerCase()) ||
            payment.party_name.toLowerCase().includes(filters.search.toLowerCase()) ||
            payment.mode_of_payment.toLowerCase().includes(filters.search.toLowerCase())
          )
        }

        setPayments(filteredPayments)
      }
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePayment = (payment: Payment) => {
    setPayments(prev => [payment, ...prev])
    setShowCreateDialog(false)
  }

  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowPaymentDialog(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: 'secondary' as const, label: 'Draft' },
      Submitted: { variant: 'default' as const, label: 'Submitted' },
      Cancelled: { variant: 'outline' as const, label: 'Cancelled' }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPaymentTypeIcon = (type: PaymentType) => {
    return type === 'Received' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />
  }

  const getModeOfPaymentIcon = (mode: string) => {
    switch (mode.toLowerCase()) {
      case 'cash':
        return <Banknote className="h-4 w-4" />
      case 'bank transfer':
      case 'credit card':
      case 'debit card':
      case 'online payment':
        return <CreditCard className="h-4 w-4" />
      default:
        return <DollarSign className="h-4 w-4" />
    }
  }

  const getTotalPayments = () => payments.length
  const getTotalAmount = () => payments.reduce((sum, payment) => sum + payment.paid_amount + payment.received_amount, 0)
  const getReceivedAmount = () => payments.reduce((sum, payment) => sum + payment.received_amount, 0)
  const getPaidAmount = () => payments.reduce((sum, payment) => sum + payment.paid_amount, 0)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Manage your payment entries and allocations
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Payments</p>
                <p className="text-2xl font-bold">{getTotalPayments()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Received</p>
                <p className="text-2xl font-bold text-green-600">${getReceivedAmount().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Paid</p>
                <p className="text-2xl font-bold text-red-600">${getPaidAmount().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Net Amount</p>
                <p className="text-2xl font-bold">${getTotalAmount().toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search payments..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment_type">Payment Type</Label>
              <Select
                value={filters.payment_type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, payment_type: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Types</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
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
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            {payments.length} payments found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading payments...</div>
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No payments found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first payment entry
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Payment
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment No</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.payment_no}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getPaymentTypeIcon(payment.payment_type)}
                          <span>{payment.payment_type}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{payment.party_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getModeOfPaymentIcon(payment.mode_of_payment)}
                          <span>{payment.mode_of_payment}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <div className="font-medium">
                            {payment.currency} {(payment.paid_amount + payment.received_amount).toFixed(2)}
                          </div>
                          {payment.total_allocated_amount > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Allocated: {payment.currency} {payment.total_allocated_amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(payment.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPayment(payment)}
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

      {/* Create Payment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Create Payment Entry
            </DialogTitle>
            <DialogDescription>
              Record a payment received or made
            </DialogDescription>
          </DialogHeader>
          <PaymentEntryForm
            companyId={companyId}
            onSave={handleCreatePayment}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Payment Details - {selectedPayment?.payment_no}
            </DialogTitle>
            <DialogDescription>
              View and manage payment details
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Payment Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Payment No:</span> {selectedPayment.payment_no}</p>
                    <p><span className="font-medium">Type:</span> {selectedPayment.payment_type}</p>
                    <p><span className="font-medium">Date:</span> {format(new Date(selectedPayment.payment_date), 'MMM dd, yyyy')}</p>
                    <p><span className="font-medium">Mode:</span> {selectedPayment.mode_of_payment}</p>
                    <p><span className="font-medium">Status:</span> {getStatusBadge(selectedPayment.status)}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Party Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Party:</span> {selectedPayment.party_name}</p>
                    <p><span className="font-medium">Type:</span> {selectedPayment.party_type}</p>
                    <p><span className="font-medium">Currency:</span> {selectedPayment.currency}</p>
                    <p><span className="font-medium">Exchange Rate:</span> {selectedPayment.exchange_rate}</p>
                  </div>
                </div>
              </div>

              {/* Payment Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Paid Amount</span>
                      <span className="text-lg font-bold text-red-600">
                        {selectedPayment.currency} {selectedPayment.paid_amount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Received Amount</span>
                      <span className="text-lg font-bold text-green-600">
                        {selectedPayment.currency} {selectedPayment.received_amount.toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Amount</span>
                      <span className="text-lg font-bold text-primary">
                        {selectedPayment.currency} {(selectedPayment.paid_amount + selectedPayment.received_amount).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Allocations */}
              {selectedPayment.allocations && selectedPayment.allocations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Payment Allocations</h3>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Allocated Amount</TableHead>
                          <TableHead>Discount Amount</TableHead>
                          <TableHead>Net Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPayment.allocations.map((allocation, index) => (
                          <TableRow key={index}>
                            <TableCell>{allocation.invoice_id}</TableCell>
                            <TableCell>{selectedPayment.currency} {allocation.allocated_amount.toFixed(2)}</TableCell>
                            <TableCell>{selectedPayment.currency} {allocation.discount_amount.toFixed(2)}</TableCell>
                            <TableCell>{selectedPayment.currency} {(allocation.allocated_amount - allocation.discount_amount).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              {selectedPayment.remarks && (
                <div>
                  <h3 className="font-medium mb-2">Remarks</h3>
                  <p className="text-sm text-muted-foreground">{selectedPayment.remarks}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
