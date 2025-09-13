/**
 * Bank Dashboard - Complete Banking Integration & Reconciliation
 * Multi-bank connectivity with automated transaction matching and reconciliation
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
    Landmark,
    CreditCard,
    ArrowRightLeft,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    Plus,
    Settings,
    Eye,
    Download,
    Link,
    Activity,
    TrendingUp,
    DollarSign,
    Calendar,
    Search,
    Filter,
    FileText,
    Shield,
    Zap,
    Target,
    BarChart3,
    PieChart,
    Clock,
    Users,
    Edit,
    Trash2
} from 'lucide-react'
import {
    BankService,
    BankProvider,
    BankConnection,
    BankAccount,
    BankTransaction,
    ReconciliationSession,
    ReconciliationRule,
    BankAnalytics,
    ReconciliationSummary,
    ConnectionStatus,
    ReconciliationStatus,
    AccountType
} from '@/lib/bank-service'

export default function BankDashboard() {
    const [analytics, setAnalytics] = useState<BankAnalytics | null>(null)
    const [providers, setProviders] = useState<BankProvider[]>([])
    const [connections, setConnections] = useState<BankConnection[]>([])
    const [accounts, setAccounts] = useState<BankAccount[]>([])
    const [transactions, setTransactions] = useState<{ transactions: BankTransaction[]; total: number; page: number; limit: number } | null>(null)
    const [sessions, setSessions] = useState<ReconciliationSession[]>([])
    const [rules, setRules] = useState<ReconciliationRule[]>([])
    const [reconciliationSummary, setReconciliationSummary] = useState<ReconciliationSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [selectedConnection, setSelectedConnection] = useState<string | 'All'>('All')
    const [selectedAccount, setSelectedAccount] = useState<string | 'All'>('All')
    const [selectedStatus, setSelectedStatus] = useState<ReconciliationStatus | 'All'>('All')
    const [searchTerm, setSearchTerm] = useState('')

    const companyId = 'current-company-id' // Get from context/props

    useEffect(() => {
        loadDashboardData()
    }, [companyId])

    const loadDashboardData = async () => {
        try {
            setLoading(true)

            const [
                analyticsResult,
                providersResult,
                connectionsResult,
                accountsResult,
                transactionsResult,
                sessionsResult,
                rulesResult,
                summaryResult
            ] = await Promise.all([
                BankService.getBankAnalytics(companyId),
                BankService.getBankProviders(),
                BankService.getBankConnections(companyId),
                BankService.getBankAccounts(companyId),
                BankService.getBankTransactions(companyId, {
                    reconciliation_status: selectedStatus === 'All' ? undefined : selectedStatus,
                    search: searchTerm || undefined
                }, { page: 1, limit: 20 }),
                BankService.getReconciliationSessions(companyId),
                BankService.getReconciliationRules(companyId, { is_active: true }),
                BankService.getReconciliationSummary(companyId)
            ])

            if (analyticsResult.success && analyticsResult.data) {
                setAnalytics(analyticsResult.data)
            }

            if (providersResult.success && providersResult.data) {
                setProviders(providersResult.data)
            }

            if (connectionsResult.success && connectionsResult.data) {
                setConnections(connectionsResult.data)
            }

            if (accountsResult.success && accountsResult.data) {
                setAccounts(accountsResult.data)
            }

            if (transactionsResult.success && transactionsResult.data) {
                setTransactions(transactionsResult.data)
            }

            if (sessionsResult.success && sessionsResult.data) {
                setSessions(sessionsResult.data)
            }

            if (rulesResult.success && rulesResult.data) {
                setRules(rulesResult.data)
            }

            if (summaryResult.success && summaryResult.data) {
                setReconciliationSummary(summaryResult.data)
            }

        } catch (error) {
            console.error('Error loading bank dashboard:', error)
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

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'Active':
            case 'Matched':
            case 'Completed':
                return 'default'
            case 'Inactive':
            case 'Unmatched':
            case 'In Progress':
                return 'outline'
            case 'Error':
            case 'Expired':
            case 'Failed':
                return 'destructive'
            default:
                return 'secondary'
        }
    }

    const getAccountTypeIcon = (accountType: AccountType) => {
        switch (accountType) {
            case 'Checking':
            case 'Savings':
                return <Landmark className="w-4 h-4" />
            case 'Credit Card':
                return <CreditCard className="w-4 h-4" />
            default:
                return <DollarSign className="w-4 h-4" />
        }
    }

    const handleSyncTransactions = async (connectionId: string) => {
        const result = await BankService.syncBankTransactions(connectionId)
        if (result.success) {
            loadDashboardData() // Refresh data
        }
    }

    const handleAutoMatch = async () => {
        const result = await BankService.autoMatchTransactions(companyId)
        if (result.success) {
            loadDashboardData() // Refresh data
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading banking dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Landmark className="w-6 h-6" />
                        Bank Integration & Reconciliation
                    </h2>
                    <p className="text-muted-foreground">
                        Multi-bank connectivity with automated transaction matching
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2" onClick={handleAutoMatch}>
                        <Zap className="w-4 h-4" />
                        Auto Match
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Settings className="w-4 h-4" />
                        Settings
                    </Button>
                    <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Connect Bank
                    </Button>
                </div>
            </div>

            {/* Analytics Overview */}
            {analytics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Bank Connections</CardTitle>
                            <Link className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{analytics.active_connections}</div>
                            <p className="text-xs text-muted-foreground">
                                {analytics.total_connections} total connections
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Reconciliation Rate</CardTitle>
                            <Target className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {analytics.reconciliation_rate.toFixed(1)}%
                            </div>
                            <Progress value={analytics.reconciliation_rate} className="mt-2" />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Auto-Match Rate</CardTitle>
                            <Zap className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                {analytics.auto_match_rate.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Intelligent matching
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Sync Success</CardTitle>
                            <Activity className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {analytics.sync_success_rate.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Last 30 days
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="connections" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="connections">Connections</TabsTrigger>
                    <TabsTrigger value="accounts">Accounts</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="reconciliation">Reconciliation</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                {/* Bank Connections */}
                <TabsContent value="connections" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Connections */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Link className="w-5 h-5" />
                                        Bank Connections ({connections.length})
                                    </span>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Connection
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {connections.map((connection) => (
                                        <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center">
                                                    <Landmark className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">{connection.connection_name}</div>
                                                    <div className="text-sm text-muted-foreground">{connection.bank_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Last sync: {connection.last_sync_at ? new Date(connection.last_sync_at).toLocaleDateString() : 'Never'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getStatusBadgeVariant(connection.status)}>
                                                    {connection.status}
                                                </Badge>
                                                <div className="text-sm text-muted-foreground">
                                                    {connection.success_rate.toFixed(0)}% success
                                                </div>
                                                <Button size="sm" variant="ghost" onClick={() => handleSyncTransactions(connection.id)}>
                                                    <RefreshCw className="w-4 h-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost">
                                                    <Settings className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {connections.length === 0 && (
                                        <div className="text-center py-8">
                                            <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                            <p className="text-muted-foreground mb-2">No bank connections</p>
                                            <p className="text-sm text-muted-foreground mb-4">
                                                Connect your banks to start automated transaction imports
                                            </p>
                                            <Button className="gap-2">
                                                <Plus className="w-4 h-4" />
                                                Connect First Bank
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Available Providers */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5" />
                                    Available Providers ({providers.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {providers.slice(0, 6).map((provider) => (
                                        <div key={provider.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Shield className="w-4 h-4 text-gray-600" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{provider.provider_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {provider.provider_type}
                                                        {provider.supports_real_time && ' • Real-time'}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button size="sm" variant="outline">
                                                Connect
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Bank Accounts */}
                <TabsContent value="accounts" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <CreditCard className="w-5 h-5" />
                                    Bank Accounts ({accounts.length})
                                </span>
                                <Button size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Add Account
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-medium">Account</th>
                                            <th className="text-left p-3 font-medium">Type</th>
                                            <th className="text-left p-3 font-medium">Balance</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Last Updated</th>
                                            <th className="text-center p-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((account) => (
                                            <tr key={account.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        {getAccountTypeIcon(account.account_type)}
                                                        <div>
                                                            <div className="font-medium">{account.account_name}</div>
                                                            <div className="text-sm text-muted-foreground">{account.account_number_masked}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant="outline">
                                                        {account.account_type}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium">
                                                        {account.current_balance ? formatCurrency(account.current_balance) : 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {account.currency}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={getStatusBadgeVariant(account.status)}>
                                                            {account.status}
                                                        </Badge>
                                                        {account.sync_transactions && (
                                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm text-muted-foreground">
                                                        {account.balance_last_updated
                                                            ? new Date(account.balance_last_updated).toLocaleDateString()
                                                            : 'Never'
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="ghost">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost">
                                                            <Settings className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost">
                                                            <ArrowRightLeft className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {accounts.length === 0 && (
                                <div className="text-center py-8">
                                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">No bank accounts</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Add bank accounts to track balances and transactions
                                    </p>
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Add Account
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Transactions */}
                <TabsContent value="transactions" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <ArrowRightLeft className="w-5 h-5" />
                                    Bank Transactions ({transactions?.total || 0})
                                </span>
                                <div className="flex gap-2 items-center">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search transactions..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                        />
                                    </div>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value as ReconciliationStatus | 'All')}
                                        className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="All">All Status</option>
                                        <option value="Unmatched">Unmatched</option>
                                        <option value="Matched">Matched</option>
                                        <option value="Manual Review">Manual Review</option>
                                        <option value="Excluded">Excluded</option>
                                    </select>
                                    <Button size="sm" className="gap-2" onClick={handleAutoMatch}>
                                        <Zap className="w-4 h-4" />
                                        Auto Match
                                    </Button>
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-medium">Date</th>
                                            <th className="text-left p-3 font-medium">Description</th>
                                            <th className="text-left p-3 font-medium">Amount</th>
                                            <th className="text-left p-3 font-medium">Account</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-center p-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {transactions?.transactions.map((transaction) => (
                                            <tr key={transaction.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        {new Date(transaction.transaction_date).toLocaleDateString()}
                                                    </div>
                                                    {transaction.posted_date && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Posted: {new Date(transaction.posted_date).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-3">
                                                    <div>
                                                        <div className="font-medium text-sm">{transaction.description}</div>
                                                        {transaction.merchant_name && (
                                                            <div className="text-xs text-muted-foreground">{transaction.merchant_name}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {formatCurrency(Math.abs(transaction.amount))}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {transaction.transaction_type}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        {(transaction as any).account?.account_name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {(transaction as any).account?.account_number_masked}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={getStatusBadgeVariant(transaction.reconciliation_status)}>
                                                            {transaction.reconciliation_status}
                                                        </Badge>
                                                        {transaction.match_confidence && (
                                                            <div className="text-xs text-muted-foreground">
                                                                {(transaction.match_confidence * 100).toFixed(0)}%
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="ghost">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        {transaction.reconciliation_status === 'Unmatched' && (
                                                            <Button size="sm" variant="outline" className="text-xs">
                                                                Match
                                                            </Button>
                                                        )}
                                                        {transaction.reconciliation_status === 'Matched' && (
                                                            <Button size="sm" variant="ghost">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {!transactions || transactions.transactions.length === 0 ? (
                                <div className="text-center py-8">
                                    <ArrowRightLeft className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">No transactions found</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Sync your bank connections to import transactions
                                    </p>
                                    <Button className="gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        Sync Now
                                    </Button>
                                </div>
                            ) : null}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reconciliation */}
                <TabsContent value="reconciliation" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Reconciliation Summary */}
                        {reconciliationSummary && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Reconciliation Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Total Bank Transactions</span>
                                            <span className="font-medium">{reconciliationSummary.total_bank_transactions}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Matched</span>
                                            <span className="font-medium text-green-600">{reconciliationSummary.matched_count}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Unmatched</span>
                                            <span className="font-medium text-orange-600">{reconciliationSummary.unmatched_bank_count}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-muted-foreground">Manual Review</span>
                                            <span className="font-medium text-amber-600">{reconciliationSummary.manual_review_count}</span>
                                        </div>
                                        <div className="border-t pt-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">Reconciliation Rate</span>
                                                <span className="font-bold text-lg">{reconciliationSummary.reconciliation_rate.toFixed(1)}%</span>
                                            </div>
                                            <Progress value={reconciliationSummary.reconciliation_rate} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Reconciliation Rules */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                        <Settings className="w-5 h-5" />
                                        Reconciliation Rules ({rules.length})
                                    </span>
                                    <Button size="sm" className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        New Rule
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {rules.slice(0, 5).map((rule) => (
                                        <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <div className="font-medium text-sm">{rule.rule_name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Priority {rule.rule_priority} • {rule.matches_found} matches
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                                                    {rule.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                                <div className="text-xs text-muted-foreground">
                                                    {rule.accuracy_rate ? `${(rule.accuracy_rate * 100).toFixed(0)}%` : 'N/A'}
                                                </div>
                                                <Button size="sm" variant="ghost">
                                                    <Settings className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}

                                    {rules.length === 0 && (
                                        <div className="text-center py-6">
                                            <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                                            <p className="text-sm text-muted-foreground mb-2">No reconciliation rules</p>
                                            <Button size="sm" className="gap-2">
                                                <Plus className="w-3 h-3" />
                                                Create Rule
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Sessions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Recent Reconciliation Sessions
                                </span>
                                <Button size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    New Session
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-3 font-medium">Session</th>
                                            <th className="text-left p-3 font-medium">Period</th>
                                            <th className="text-left p-3 font-medium">Status</th>
                                            <th className="text-left p-3 font-medium">Matched</th>
                                            <th className="text-left p-3 font-medium">Duration</th>
                                            <th className="text-center p-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sessions.slice(0, 5).map((session) => (
                                            <tr key={session.id} className="border-b hover:bg-muted/50">
                                                <td className="p-3">
                                                    <div className="font-medium text-sm">{session.session_name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(session.started_at).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        {new Date(session.date_from).toLocaleDateString()} - {new Date(session.date_to).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <Badge variant={getStatusBadgeVariant(session.status)}>
                                                        {session.status}
                                                    </Badge>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        <span className="font-medium">{session.matched_transactions}</span> / {session.total_bank_transactions}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {session.total_bank_transactions > 0
                                                            ? `${((session.matched_transactions / session.total_bank_transactions) * 100).toFixed(1)}%`
                                                            : '0%'
                                                        }
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="text-sm">
                                                        {session.duration_minutes ? `${session.duration_minutes} min` : 'In progress'}
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="ghost">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost">
                                                            <FileText className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {sessions.length === 0 && (
                                <div className="text-center py-8">
                                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-2">No reconciliation sessions</p>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Create a reconciliation session to match transactions
                                    </p>
                                    <Button className="gap-2">
                                        <Plus className="w-4 h-4" />
                                        Start Reconciliation
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reports */}
                <TabsContent value="reports" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Bank Reconciliation Reports
                                </span>
                                <Button size="sm" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Generate Report
                                </Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground mb-2">No reconciliation reports yet</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Generate bank reconciliation reports for accounting compliance
                                </p>
                                <Button className="gap-2">
                                    <FileText className="w-4 h-4" />
                                    Generate First Report
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
