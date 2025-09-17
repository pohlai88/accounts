// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  ArrowUpDown,
  Calculator,
  Settings,
} from "lucide-react";
import {
  CurrencyManagementService,
  Currency,
  CurrencyCode,
  ExchangeRate,
  CurrencyConversion,
} from "@/lib/currency-management";
import { ExchangeRateManager } from "./exchange-rate-manager";

interface MultiCurrencyProps {
  companyId: string;
}

export function MultiCurrency({ companyId }: MultiCurrencyProps) {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [baseCurrency, setBaseCurrency] = useState<Currency | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddRateDialog, setShowAddRateDialog] = useState(false);

  useEffect(() => {
    loadCurrencies();
    loadBaseCurrency();
  }, [companyId]);

  const loadCurrencies = async () => {
    try {
      const result = await CurrencyManagementService.getCurrencies();
      if (result.success && result.currencies) {
        setCurrencies(result.currencies);
      }
    } catch (error) {
      console.error("Error loading currencies:", error);
    }
  };

  const loadBaseCurrency = async () => {
    try {
      const result = await CurrencyManagementService.getBaseCurrency(companyId);
      if (result.success && result.currency) {
        setBaseCurrency(result.currency);
      }
    } catch (error) {
      console.error("Error loading base currency:", error);
    }
  };

  const handleAddExchangeRate = async (rateData: {
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    rate: number;
    date: string;
  }) => {
    try {
      const result = await CurrencyManagementService.updateExchangeRate(
        rateData.fromCurrency,
        rateData.toCurrency,
        rateData.rate,
        rateData.date,
      );

      if (result.success) {
        setShowAddRateDialog(false);
        // Reload rates or update state
      }
    } catch (error) {
      console.error("Error adding exchange rate:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Multi-Currency</h2>
          <p className="text-muted-foreground">
            Manage currencies and exchange rates for international business
          </p>
        </div>
        <Dialog open={showAddRateDialog} onOpenChange={setShowAddRateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Exchange Rate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <AddExchangeRateForm
              onSuccess={handleAddExchangeRate}
              onCancel={() => setShowAddRateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="currencies" className="space-y-4">
        <TabsList>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="rates">Exchange Rates</TabsTrigger>
          <TabsTrigger value="converter">Currency Converter</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="manager">Rate Manager</TabsTrigger>
        </TabsList>

        <TabsContent value="currencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Available Currencies
              </CardTitle>
              <CardDescription>Manage currencies for your business operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currencies.map(currency => (
                  <div key={currency.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{currency.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {currency.code} • {currency.symbol}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {currency.is_base_currency && <Badge variant="default">Base</Badge>}
                        <Badge variant={currency.is_active ? "default" : "secondary"}>
                          {currency.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      {currency.decimal_places} decimal places
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUpDown className="h-5 w-5 mr-2" />
                Exchange Rates
              </CardTitle>
              <CardDescription>Current exchange rates and historical data</CardDescription>
            </CardHeader>
            <CardContent>
              <ExchangeRatesTable currencies={currencies} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="converter" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Currency Converter
              </CardTitle>
              <CardDescription>Convert amounts between different currencies</CardDescription>
            </CardHeader>
            <CardContent>
              <CurrencyConverter currencies={currencies} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Currency Performance
              </CardTitle>
              <CardDescription>Track currency performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <CurrencyPerformance baseCurrency={baseCurrency} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manager" className="space-y-4">
          <ExchangeRateManager companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AddExchangeRateFormProps {
  onSuccess: (rateData: {
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    rate: number;
    date: string;
  }) => void;
  onCancel: () => void;
}

function AddExchangeRateForm({ onSuccess, onCancel }: AddExchangeRateFormProps) {
  const [formData, setFormData] = useState({
    fromCurrency: "USD" as CurrencyCode,
    toCurrency: "EUR" as CurrencyCode,
    rate: 0,
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fromCurrency">From Currency</Label>
          <Select
            value={formData.fromCurrency}
            onValueChange={(value: CurrencyCode) =>
              setFormData({ ...formData, fromCurrency: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="toCurrency">To Currency</Label>
          <Select
            value={formData.toCurrency}
            onValueChange={(value: CurrencyCode) => setFormData({ ...formData, toCurrency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="EUR">EUR - Euro</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
              <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="rate">Exchange Rate</Label>
        <Input
          id="rate"
          type="number"
          step="0.000001"
          value={formData.rate}
          onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
          placeholder="Enter exchange rate"
          required
        />
      </div>

      <div>
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={formData.date}
          onChange={e => setFormData({ ...formData, date: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Add Rate</Button>
      </div>
    </form>
  );
}

interface ExchangeRatesTableProps {
  currencies: Currency[];
}

function ExchangeRatesTable({ currencies }: ExchangeRatesTableProps) {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    try {
      // Load recent exchange rates
      setLoading(false);
    } catch (error) {
      console.error("Error loading rates:", error);
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Loading exchange rates...</div>
      ) : (
        <div className="space-y-2">
          {rates.length > 0 ? (
            rates.map(rate => (
              <div
                key={rate.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{rate.from_currency}</span>
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{rate.to_currency}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{rate.rate.toFixed(6)}</span>
                  <p className="text-sm text-muted-foreground">{rate.date}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No exchange rates found</p>
              <p className="text-sm">Add exchange rates to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface CurrencyConverterProps {
  currencies: Currency[];
}

function CurrencyConverter({ currencies }: CurrencyConverterProps) {
  const [formData, setFormData] = useState({
    amount: 0,
    fromCurrency: "USD" as CurrencyCode,
    toCurrency: "EUR" as CurrencyCode,
  });
  const [conversion, setConversion] = useState<CurrencyConversion | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConvert = async () => {
    if (formData.amount <= 0) return;

    setLoading(true);
    try {
      const result = await CurrencyManagementService.convertCurrency(
        formData.amount,
        formData.fromCurrency,
        formData.toCurrency,
      );

      if (result.success && result.conversion) {
        setConversion(result.conversion);
      }
    } catch (error) {
      console.error("Error converting currency:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            value={formData.amount}
            onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            placeholder="Enter amount"
          />
        </div>
        <div>
          <Label htmlFor="fromCurrency">From</Label>
          <Select
            value={formData.fromCurrency}
            onValueChange={(value: CurrencyCode) =>
              setFormData({ ...formData, fromCurrency: value })
            }
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
        <div>
          <Label htmlFor="toCurrency">To</Label>
          <Select
            value={formData.toCurrency}
            onValueChange={(value: CurrencyCode) => setFormData({ ...formData, toCurrency: value })}
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

      <Button onClick={handleConvert} disabled={loading || formData.amount <= 0}>
        {loading ? "Converting..." : "Convert"}
      </Button>

      {conversion && (
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold">
              {conversion.amount.toLocaleString()} {conversion.from_currency}
            </p>
            <p className="text-muted-foreground">=</p>
            <p className="text-3xl font-bold text-primary">
              {conversion.converted_amount.toLocaleString()} {conversion.to_currency}
            </p>
            <p className="text-sm text-muted-foreground mt-2">Rate: {conversion.rate.toFixed(6)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

interface CurrencyPerformanceProps {
  baseCurrency: Currency | null;
}

function CurrencyPerformance({ baseCurrency }: CurrencyPerformanceProps) {
  const [performance, setPerformance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, [baseCurrency]);

  const loadPerformance = async () => {
    if (!baseCurrency) return;

    try {
      const result = await CurrencyManagementService.getCurrencyPerformance(
        baseCurrency.code,
        "30d",
      );

      if (result.success && result.performance) {
        setPerformance(result.performance);
      }
    } catch (error) {
      console.error("Error loading performance:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!baseCurrency) {
    return <div className="text-center py-8 text-muted-foreground">No base currency set</div>;
  }

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">Loading performance data...</div>
      ) : (
        <div className="space-y-2">
          {performance.map(item => (
            <div
              key={item.currency}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="font-medium">{item.currency}</span>
                <span className="text-sm text-muted-foreground">
                  Rate: {item.current_rate.toFixed(6)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {item.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                {item.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                {item.trend === "stable" && <Minus className="h-4 w-4 text-gray-500" />}
                <span
                  className={`font-bold ${
                    item.change_percent > 0
                      ? "text-green-600"
                      : item.change_percent < 0
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {item.change_percent > 0 ? "+" : ""}
                  {item.change_percent.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
