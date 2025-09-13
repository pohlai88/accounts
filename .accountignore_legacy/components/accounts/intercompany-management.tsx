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
  Building2, 
  Plus, 
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Settings,
  Eye,
  RotateCcw
} from 'lucide-react'
import { 
  IntercompanyManagementService,
  IntercompanyTransaction,
  IntercompanyBalance,
  IntercompanyTransactionType,
  IntercompanyStatus
} from '@/lib/intercompany-management'
import { CurrencyManagementService, Currency } from '@/lib/currency-management'

interface IntercompanyManagementProps {
  companyId: string
}

export function IntercompanyManagement({ companyId }: IntercompanyManagementProps) {
  const [transactions, setTransactions] = useState<IntercompanyTransaction[]>([])
  const [balances, setBalances] = useState<IntercompanyBalance[]>([])
  const [currencies, setCurrencies] = useState<Currency[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<IntercompanyStatus | 'All'>('All')

  useEffect(() => {
    loadData()
  }, [companyId])

  const loadData = async () => {
    try {
      const [transactionsResult, balancesResult, currenciesResult] = await Promise.all([
        IntercompanyManagementService.getIntercompanyTransactions(companyId),
        IntercompanyManagementService.getIntercompanyBalances(companyId),
        CurrencyManagementService.getCurrencies()
      ])

      if (transactionsResult.success && transactionsResult.transactions) {
        setTransactions(transactionsResult.transactions)
      }

      if (balancesResult.success && balancesResult.balances) {
        setBalances(balancesResult.balances)
      }

      if (currenciesResult.success && currenciesResult.currencies) {
        setCurrencies(currenciesResult.currencies)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTransaction = async (transactionData: Omit<IntercompanyTransaction, 'id' | 'transaction_no' | 'created_at' | 'updated_at'>) => {
    try {
      const result = await IntercompanyManagementService.createIntercompanyTransaction(transactionData)
      if (result.success) {
        setShowCreateDialog(false)
        loadData()
      }
    } catch (error) {
      console.error('Error creating transaction:', error)
    }
  }

  const handleApproveTransaction = async (transactionId: string) => {
    try {
      const result = await IntercompanyManagementService.approveIntercompanyTransaction(transactionId, 'current-user-id')
      if (result.success) {
        loadData()
      }
    } catch (error) {
      console.error('Error approving transaction:', error)
    }
  }

  const handleCancelTransaction = async (transactionId: string) => {
    try {
      const result = await IntercompanyManagementService.cancelIntercompanyTransaction(transactionId, 'Cancelled by user')
      if (result.success) {
        loadData()
      }
    } catch (error) {
      console.error('Error cancelling transaction:', error)
    }
  }

  const filteredTransactions = selectedStatus === 'All' 
    ? transactions 
    : transactions.filter(t => t.status === selectedStatus)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Intercompany Management</h2>
          <p className="text-muted-foreground">
            Manage transactions between companies in your group
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Transaction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateIntercompanyTransactionForm 
              companyId={companyId}
              currencies={currencies}
              onSuccess={handleCreateTransaction}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex items-center space-x-4">
            <Label htmlFor="status-filter">Filter by Status</Label>
            <Select value={selectedStatus} onValueChange={(value: IntercompanyStatus | 'All') => setSelectedStatus(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowRightLeft className="h-5 w-5 mr-2" />
                Intercompany Transactions
              </CardTitle>
              <CardDescription>
                Track and manage transactions between companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : filteredTransactions.length > 0 ? (
                <div className="space-y-4">
                  {filteredTransactions.map(transaction => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      onApprove={handleApproveTransaction}
                      onCancel={handleCancelTransaction}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ArrowRightLeft className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No intercompany transactions found</p>
                  <p className="text-sm">Create your first intercompany transaction</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Intercompany Balances
              </CardTitle>
              <CardDescription>
                Current balances with other companies
              </CardDescription>
            </CardHeader>
            <CardContent>
              {balances.length > 0 ? (
                <div className="space-y-4">
                  {balances.map(balance => (
                    <div key={balance.counterparty_company_id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{balance.counterparty_company_name}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Receivable: </span>
                              <span className="font-medium text-green-600">
                                ${balance.receivable_amount.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Payable: </span>
                              <span className="font-medium text-red-600">
                                ${balance.payable_amount.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            balance.net_amount > 0 ? 'text-green-600' : 
                            balance.net_amount < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {balance.net_amount > 0 ? '+' : ''}${balance.net_amount.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">Net Balance</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No intercompany balances found</p>
                  <p className="text-sm">Create transactions to see balances</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Intercompany Settings
              </CardTitle>
              <CardDescription>
                Configure intercompany accounts and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntercompanySettings companyId={companyId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TransactionCardProps {
  transaction: IntercompanyTransaction
  onApprove: (id: string) => void
  onCancel: (id: string) => void
}

function TransactionCard({ transaction, onApprove, onCancel }: TransactionCardProps) {
  const getStatusIcon = (status: IntercompanyStatus) => {
    switch (status) {
      case 'Draft': return <Clock className="h-4 w-4 text-gray-500" />
      case 'Submitted': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'Approved': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'Cancelled': return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: IntercompanyStatus) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Submitted': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Cancelled': return 'bg-red-100 text-red-800'
    }
  }

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(transaction.status)}
          <div>
            <p className="font-medium">{transaction.transaction_no}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.transaction_type} • {transaction.posting_date}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="font-bold">
              {transaction.amount.toLocaleString()} {transaction.currency}
            </p>
            <p className="text-sm text-muted-foreground">
              Base: ${transaction.base_amount.toLocaleString()}
            </p>
          </div>
          <Badge className={getStatusColor(transaction.status)}>
            {transaction.status}
          </Badge>
        </div>
      </div>
      
      {transaction.description && (
        <p className="mt-2 text-sm text-muted-foreground">{transaction.description}</p>
      )}

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
          {transaction.status === 'Submitted' && (
            <Button variant="outline" size="sm" onClick={() => onApprove(transaction.id)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}
          {(transaction.status === 'Draft' || transaction.status === 'Submitted') && (
            <Button variant="outline" size="sm" onClick={() => onCancel(transaction.id)}>
              <XCircle className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Created {new Date(transaction.created_at).toLocaleDateString()}
        </div>
      </div>
    </div>
  )
}

interface CreateIntercompanyTransactionFormProps {
  companyId: string
  currencies: Currency[]
  onSuccess: (transaction: Omit<IntercompanyTransaction, 'id' | 'transaction_no' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
}

function CreateIntercompanyTransactionForm({ 
  companyId, 
  currencies, 
  onSuccess, 
  onCancel 
}: CreateIntercompanyTransactionFormProps) {
  const [formData, setFormData] = useState({
    to_company_id: '',
    transaction_type: 'Transfer' as IntercompanyTransactionType,
    amount: 0,
    currency: 'USD' as any,
    description: '',
    posting_date: new Date().toISOString().split('T')[0],
    created_by: 'current-user-id'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSuccess({
      ...formData,
      from_company_id: companyId,
      status: 'Draft' as IntercompanyStatus
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="to_company_id">To Company</Label>
        <Select 
          value={formData.to_company_id} 
          onValueChange={(value) => setFormData({ ...formData, to_company_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select company" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="company-2">Company B</SelectItem>
            <SelectItem value="company-3">Company C</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="transaction_type">Transaction Type</Label>
        <Select 
          value={formData.transaction_type} 
          onValueChange={(value: IntercompanyTransactionType) => setFormData({ ...formData, transaction_type: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Transfer">Transfer</SelectItem>
            <SelectItem value="Invoice">Invoice</SelectItem>
            <SelectItem value="Payment">Payment</SelectItem>
            <SelectItem value="Expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            placeholder="Enter amount"
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select 
            value={formData.currency} 
            onValueChange={(value) => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map(currency => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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

      <div>
        <Label htmlFor="posting_date">Posting Date</Label>
        <Input
          id="posting_date"
          type="date"
          value={formData.posting_date}
          onChange={(e) => setFormData({ ...formData, posting_date: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Transaction</Button>
      </div>
    </form>
  )
}

interface IntercompanySettingsProps {
  companyId: string
}

function IntercompanySettings({ companyId }: IntercompanySettingsProps) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [isSetupComplete, setIsSetupComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [companyId])

  const loadSettings = async () => {
    try {
      const result = await IntercompanyManagementService.getIntercompanyAccountStatus(companyId)
      if (result.success) {
        setAccounts(result.accounts || [])
        setIsSetupComplete(result.isSetupComplete || false)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSetupAccounts = async () => {
    try {
      const result = await IntercompanyManagementService.setupIntercompanyAccounts(companyId)
      if (result.success) {
        loadSettings()
      }
    } catch (error) {
      console.error('Error setting up accounts:', error)
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Intercompany Accounts</h3>
          <p className="text-sm text-muted-foreground">
            {isSetupComplete ? 'Setup complete' : 'Setup required'}
          </p>
        </div>
        {!isSetupComplete && (
          <Button onClick={handleSetupAccounts}>
            <Settings className="h-4 w-4 mr-2" />
            Setup Accounts
          </Button>
        )}
      </div>

      {accounts.length > 0 && (
        <div className="space-y-2">
          {accounts.map(account => (
            <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">{account.account.name}</p>
                <p className="text-sm text-muted-foreground">
                  {account.account.account_code} • {account.account_type}
                </p>
              </div>
              <Badge variant={account.is_active ? "default" : "secondary"}>
                {account.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
