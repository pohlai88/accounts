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
    Globe,
    RefreshCw,
    Download,
    Upload,
    Settings,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    CheckCircle
} from 'lucide-react'
import {
    ExchangeRateAPIService,
    ExchangeRateResponse,
    BulkExchangeRateResponse
} from '@/lib/exchange-rate-api'
import { CurrencyCode } from '@/lib/currency-management'

interface ExchangeRateManagerProps {
    companyId: string
}

export function ExchangeRateManager({ companyId }: ExchangeRateManagerProps) {
    const [loading, setLoading] = useState(false)
    const [rates, setRates] = useState<ExchangeRateResponse[]>([])
    const [bulkRates, setBulkRates] = useState<BulkExchangeRateResponse | null>(null)
    const [apiStatus, setApiStatus] = useState<any>(null)
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD')
    const [updateStatus, setUpdateStatus] = useState<{
        success: boolean
        updated: number
        errors: any[]
    } | null>(null)

    useEffect(() => {
        loadApiStatus()
    }, [])

    const loadApiStatus = async () => {
        try {
            const status = ExchangeRateAPIService.getAPIStatus()
            setApiStatus(status)
        } catch (error) {
            console.error('Error loading API status:', error)
        }
    }

    const updateAllRates = async () => {
        setLoading(true)
        setUpdateStatus(null)

        try {
            const result = await ExchangeRateAPIService.updateAllExchangeRates()
            setUpdateStatus(result)

            if (result.success) {
                // Reload rates after successful update
                await loadRates()
            }
        } catch (error) {
            console.error('Error updating rates:', error)
            setUpdateStatus({
                success: false,
                updated: 0,
                errors: [{ provider: 'all', error: 'Failed to update rates', timestamp: Date.now() }]
            })
        } finally {
            setLoading(false)
        }
    }

    const loadRates = async () => {
        setLoading(true)
        try {
            const currencies: CurrencyCode[] = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'MYR']
            const rates: ExchangeRateResponse[] = []

            for (const currency of currencies) {
                const result = await ExchangeRateAPIService.getExchangeRate(currency, 'USD')
                if (result.success && result.rate) {
                    rates.push(result.rate)
                }
            }

            setRates(rates)
        } catch (error) {
            console.error('Error loading rates:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadBulkRates = async () => {
        setLoading(true)
        try {
            const currencies: CurrencyCode[] = ['EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL', 'MYR']
            const result = await ExchangeRateAPIService.getBulkExchangeRates(selectedCurrency, currencies)

            if (result.success && result.rates) {
                setBulkRates(result.rates)
            }
        } catch (error) {
            console.error('Error loading bulk rates:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount: number, currency: CurrencyCode) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        }).format(amount)
    }

    const getRateChangeIcon = (rate: number) => {
        if (rate > 1) return <TrendingUp className="h-4 w-4 text-green-500" />
        if (rate < 1) return <TrendingDown className="h-4 w-4 text-red-500" />
        return <TrendingUp className="h-4 w-4 text-gray-500" />
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Exchange Rate Manager</h2>
                    <p className="text-muted-foreground">
                        Manage real-time exchange rates and API integrations
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={loadRates} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Rates
                    </Button>
                    <Button onClick={updateAllRates} disabled={loading}>
                        <Download className="h-4 w-4 mr-2" />
                        Update All Rates
                    </Button>
                </div>
            </div>

            {/* API Status */}
            {apiStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Settings className="h-5 w-5 mr-2" />
                            API Status
                        </CardTitle>
                        <CardDescription>
                            Exchange rate API providers and their status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {apiStatus.providers.map((provider: any) => (
                                <div key={provider.name} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-medium">{provider.name}</h3>
                                        <Badge variant={provider.isActive ? 'default' : 'secondary'}>
                                            {provider.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        <p>Priority: {provider.priority}</p>
                                        <p>Rate Limit: {provider.rateLimit.requestsPerMinute}/min</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                            <p className="text-sm">
                                <strong>Total Providers:</strong> {apiStatus.totalProviders} |
                                <strong> Active:</strong> {apiStatus.activeProviders}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Update Status */}
            {updateStatus && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            {updateStatus.success ? (
                                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                            )}
                            Update Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <p className="text-sm">
                                <strong>Status:</strong> {updateStatus.success ? 'Success' : 'Failed'}
                            </p>
                            <p className="text-sm">
                                <strong>Rates Updated:</strong> {updateStatus.updated}
                            </p>
                            {updateStatus.errors.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-red-600">Errors:</p>
                                    <ul className="text-sm text-red-600 list-disc list-inside">
                                        {updateStatus.errors.map((error, index) => (
                                            <li key={index}>{error.provider}: {error.error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="individual" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="individual">Individual Rates</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Rates</TabsTrigger>
                    <TabsTrigger value="settings">API Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="individual" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Globe className="h-5 w-5 mr-2" />
                                Individual Exchange Rates
                            </CardTitle>
                            <CardDescription>
                                Real-time exchange rates from USD to other currencies
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">Loading exchange rates...</div>
                            ) : rates.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {rates.map((rate) => (
                                            <div key={`${rate.from}-${rate.to}`} className="p-4 border rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium">{rate.from}</span>
                                                        <span className="text-muted-foreground">→</span>
                                                        <span className="font-medium">{rate.to}</span>
                                                    </div>
                                                    {getRateChangeIcon(rate.rate)}
                                                </div>
                                                <div className="text-2xl font-bold mb-1">
                                                    {rate.rate.toFixed(4)}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    <p>Provider: {rate.provider}</p>
                                                    <p>Date: {rate.date}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No exchange rates available</p>
                                    <Button onClick={loadRates} className="mt-4">
                                        Load Rates
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2" />
                                Bulk Exchange Rates
                            </CardTitle>
                            <CardDescription>
                                Exchange rates for a specific base currency
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <div>
                                        <Label htmlFor="base_currency">Base Currency</Label>
                                        <Select
                                            value={selectedCurrency}
                                            onValueChange={(value: CurrencyCode) => setSelectedCurrency(value)}
                                        >
                                            <SelectTrigger className="w-32">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="USD">USD</SelectItem>
                                                <SelectItem value="EUR">EUR</SelectItem>
                                                <SelectItem value="GBP">GBP</SelectItem>
                                                <SelectItem value="MYR">MYR</SelectItem>
                                                <SelectItem value="JPY">JPY</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={loadBulkRates} disabled={loading}>
                                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                        Load Bulk Rates
                                    </Button>
                                </div>

                                {bulkRates && (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-muted rounded-lg">
                                            <p className="text-sm font-medium">
                                                Base Currency: {bulkRates.base} |
                                                Date: {bulkRates.date} |
                                                Provider: {bulkRates.provider}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {Object.entries(bulkRates.rates).map(([currency, rate]) => (
                                                <div key={currency} className="p-4 border rounded-lg">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium">{currency}</span>
                                                        {getRateChangeIcon(rate)}
                                                    </div>
                                                    <div className="text-2xl font-bold">
                                                        {rate.toFixed(4)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Settings className="h-5 w-5 mr-2" />
                                API Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure exchange rate API providers and settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-medium mb-2">Provider Configuration</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Configure API keys and settings for exchange rate providers.
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">ExchangeRate-API (Free)</span>
                                            <Badge variant="default">Active</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Fixer.io (API Key Required)</span>
                                            <Badge variant="secondary">Inactive</Badge>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">CurrencyLayer (API Key Required)</span>
                                            <Badge variant="secondary">Inactive</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-medium mb-2">Rate Update Settings</h3>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Auto-update rates</span>
                                            <input type="checkbox" className="rounded" defaultChecked />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm">Update frequency</span>
                                            <Select defaultValue="hourly">
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="hourly">Hourly</SelectItem>
                                                    <SelectItem value="daily">Daily</SelectItem>
                                                    <SelectItem value="weekly">Weekly</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 border rounded-lg">
                                    <h3 className="font-medium mb-2">Fallback Settings</h3>
                                    <p className="text-sm text-muted-foreground">
                                        When primary providers fail, the system will use cached rates or
                                        fallback to USD intermediate conversion.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
