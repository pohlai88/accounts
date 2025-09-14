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
  FileText,
  TrendingUp,
  DollarSign,
  Globe,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Table,
} from "lucide-react";
import {
  ReportCurrencyConversionService,
  ConvertedAmount,
  ReportCurrencySettings,
} from "@/lib/report-currency-conversion";
import { CurrencyCode } from "@/lib/currency-management";

interface CurrencyReportsProps {
  companyId: string;
}

export function CurrencyReports({ companyId }: CurrencyReportsProps) {
  const [settings, setSettings] = useState<ReportCurrencySettings>({
    baseCurrency: "USD",
    displayCurrency: "USD",
    showOriginalCurrency: true,
    showExchangeRates: true,
    conversionMethod: "latest",
  });
  const [loading, setLoading] = useState(false);
  const [trialBalance, setTrialBalance] = useState<any[]>([]);
  const [profitAndLoss, setProfitAndLoss] = useState<any>(null);
  const [balanceSheet, setBalanceSheet] = useState<any>(null);

  const loadTrialBalance = async () => {
    setLoading(true);
    try {
      const result = await ReportCurrencyConversionService.getTrialBalanceWithConversion(
        companyId,
        new Date().toISOString().split("T")[0],
        settings.displayCurrency,
      );

      if (result.success && result.trialBalance) {
        setTrialBalance(result.trialBalance);
      }
    } catch (error) {
      console.error("Error loading trial balance:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfitAndLoss = async () => {
    setLoading(true);
    try {
      const startDate = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];
      const endDate = new Date().toISOString().split("T")[0];

      const result = await ReportCurrencyConversionService.getProfitAndLossWithConversion(
        companyId,
        startDate,
        endDate,
        settings.displayCurrency,
      );

      if (result.success && result.profitAndLoss) {
        setProfitAndLoss(result.profitAndLoss);
      }
    } catch (error) {
      console.error("Error loading profit and loss:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBalanceSheet = async () => {
    setLoading(true);
    try {
      const result = await ReportCurrencyConversionService.getBalanceSheetWithConversion(
        companyId,
        new Date().toISOString().split("T")[0],
        settings.displayCurrency,
      );

      if (result.success && result.balanceSheet) {
        setBalanceSheet(result.balanceSheet);
      }
    } catch (error) {
      console.error("Error loading balance sheet:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrialBalance();
  }, [settings.displayCurrency]);

  const formatCurrency = (amount: number, currency: CurrencyCode) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Currency Reports</h2>
          <p className="text-muted-foreground">
            Financial reports with multi-currency support and conversion
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadTrialBalance} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Currency Settings
          </CardTitle>
          <CardDescription>Configure currency display and conversion settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="display_currency">Display Currency</Label>
              <Select
                value={settings.displayCurrency}
                onValueChange={(value: CurrencyCode) =>
                  setSettings({ ...settings, displayCurrency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD - US Dollar</SelectItem>
                  <SelectItem value="EUR">EUR - Euro</SelectItem>
                  <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                  <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                  <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="conversion_method">Conversion Method</Label>
              <Select
                value={settings.conversionMethod}
                onValueChange={(value: "historical" | "latest" | "average") =>
                  setSettings({ ...settings, conversionMethod: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest Rate</SelectItem>
                  <SelectItem value="historical">Historical Rate</SelectItem>
                  <SelectItem value="average">Average Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showOriginalCurrency}
                  onChange={e =>
                    setSettings({ ...settings, showOriginalCurrency: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Show Original Currency</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showExchangeRates}
                  onChange={e => setSettings({ ...settings, showExchangeRates: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Show Exchange Rates</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="trial-balance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>

        <TabsContent value="trial-balance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Table className="h-5 w-5 mr-2" />
                Trial Balance
              </CardTitle>
              <CardDescription>Chart of accounts with currency conversion</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading trial balance...</div>
              ) : trialBalance.length > 0 ? (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Account</th>
                          <th className="text-left p-2">Code</th>
                          <th className="text-right p-2">Debit</th>
                          <th className="text-right p-2">Credit</th>
                          {settings.showOriginalCurrency && (
                            <th className="text-center p-2">Original Currency</th>
                          )}
                          {settings.showExchangeRates && (
                            <th className="text-right p-2">Exchange Rate</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {trialBalance.map((account, index) => (
                          <tr
                            key={account.account_id}
                            className={index % 2 === 0 ? "bg-muted/50" : ""}
                          >
                            <td className="p-2 font-medium">{account.account_name}</td>
                            <td className="p-2 text-muted-foreground">{account.account_code}</td>
                            <td className="p-2 text-right">
                              {formatCurrency(account.converted_debit, settings.displayCurrency)}
                            </td>
                            <td className="p-2 text-right">
                              {formatCurrency(account.converted_credit, settings.displayCurrency)}
                            </td>
                            {settings.showOriginalCurrency && (
                              <td className="p-2 text-center">
                                <Badge variant="outline">{account.currency}</Badge>
                              </td>
                            )}
                            {settings.showExchangeRates && (
                              <td className="p-2 text-right text-sm text-muted-foreground">
                                {account.exchange_rate.toFixed(4)}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No trial balance data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profit-loss" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Profit & Loss Statement
              </CardTitle>
              <CardDescription>Revenue and expenses with currency conversion</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading profit & loss...</div>
              ) : profitAndLoss ? (
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Revenue</h3>
                    <div className="space-y-2">
                      {profitAndLoss.revenue.map((item: ConvertedAmount, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span>Revenue Item {index + 1}</span>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(item.convertedAmount, settings.displayCurrency)}
                            </div>
                            {settings.showOriginalCurrency && (
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(item.originalAmount, item.originalCurrency)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-2 border-t-2 font-bold">
                        <span>Total Revenue</span>
                        <span>
                          {formatCurrency(profitAndLoss.totalRevenue, settings.displayCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Expenses</h3>
                    <div className="space-y-2">
                      {profitAndLoss.expenses.map((item: ConvertedAmount, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span>Expense Item {index + 1}</span>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(item.convertedAmount, settings.displayCurrency)}
                            </div>
                            {settings.showOriginalCurrency && (
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(item.originalAmount, item.originalCurrency)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-2 border-t-2 font-bold">
                        <span>Total Expenses</span>
                        <span>
                          {formatCurrency(profitAndLoss.totalExpenses, settings.displayCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Net Income */}
                  <div className="flex justify-between items-center p-4 border-2 border-primary rounded-lg bg-primary/5">
                    <span className="text-lg font-bold">Net Income</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(profitAndLoss.netIncomeAmount, settings.displayCurrency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No profit & loss data available</p>
                  <Button onClick={loadProfitAndLoss} className="mt-4">
                    Load Profit & Loss
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Balance Sheet
              </CardTitle>
              <CardDescription>
                Assets, liabilities, and equity with currency conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading balance sheet...</div>
              ) : balanceSheet ? (
                <div className="space-y-6">
                  {/* Assets */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Assets</h3>
                    <div className="space-y-2">
                      {balanceSheet.assets.map((item: ConvertedAmount, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span>Asset {index + 1}</span>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(item.convertedAmount, settings.displayCurrency)}
                            </div>
                            {settings.showOriginalCurrency && (
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(item.originalAmount, item.originalCurrency)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-2 border-t-2 font-bold">
                        <span>Total Assets</span>
                        <span>
                          {formatCurrency(balanceSheet.totalAssets, settings.displayCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Liabilities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Liabilities</h3>
                    <div className="space-y-2">
                      {balanceSheet.liabilities.map((item: ConvertedAmount, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span>Liability {index + 1}</span>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(item.convertedAmount, settings.displayCurrency)}
                            </div>
                            {settings.showOriginalCurrency && (
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(item.originalAmount, item.originalCurrency)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-2 border-t-2 font-bold">
                        <span>Total Liabilities</span>
                        <span>
                          {formatCurrency(balanceSheet.totalLiabilities, settings.displayCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Equity */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Equity</h3>
                    <div className="space-y-2">
                      {balanceSheet.equity.map((item: ConvertedAmount, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span>Equity {index + 1}</span>
                          <div className="text-right">
                            <div className="font-medium">
                              {formatCurrency(item.convertedAmount, settings.displayCurrency)}
                            </div>
                            {settings.showOriginalCurrency && (
                              <div className="text-sm text-muted-foreground">
                                {formatCurrency(item.originalAmount, item.originalCurrency)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center p-2 border-t-2 font-bold">
                        <span>Total Equity</span>
                        <span>
                          {formatCurrency(balanceSheet.totalEquity, settings.displayCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Balance Check */}
                  <div className="flex justify-between items-center p-4 border-2 border-primary rounded-lg bg-primary/5">
                    <span className="text-lg font-bold">Total Liabilities + Equity</span>
                    <span className="text-lg font-bold">
                      {formatCurrency(
                        balanceSheet.totalLiabilities + balanceSheet.totalEquity,
                        settings.displayCurrency,
                      )}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No balance sheet data available</p>
                  <Button onClick={loadBalanceSheet} className="mt-4">
                    Load Balance Sheet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
