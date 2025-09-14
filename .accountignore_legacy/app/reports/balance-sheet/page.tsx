"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
  Building2,
  CreditCard,
  PiggyBank,
} from "lucide-react";
import { ReportCurrencyConversionService } from "@/lib/report-currency-conversion";
import { format } from "date-fns";

interface BalanceSheetData {
  assets: Array<{
    account_name: string;
    amount: number;
    original_amount: number;
    currency: string;
    percentage: number;
    category: string;
  }>;
  liabilities: Array<{
    account_name: string;
    amount: number;
    original_amount: number;
    currency: string;
    percentage: number;
    category: string;
  }>;
  equity: Array<{
    account_name: string;
    amount: number;
    original_amount: number;
    currency: string;
    percentage: number;
    category: string;
  }>;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  currency: string;
  asOfDate: string;
}

export default function BalanceSheetPage() {
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    asOfDate: format(new Date(), "yyyy-MM-dd"),
    currency: "USD",
    comparisonDate: "none" as "none" | "previous_month" | "previous_quarter" | "previous_year",
  });
  const [comparisonData, setComparisonData] = useState<BalanceSheetData | null>(null);

  const companyId = "default-company"; // In a real app, this would come from context

  useEffect(() => {
    loadBalanceSheetData();
  }, [filters]);

  const loadBalanceSheetData = async () => {
    setLoading(true);
    try {
      const result = await ReportCurrencyConversionService.getBalanceSheetWithConversion(
        companyId,
        filters.asOfDate,
        filters.currency,
      );

      if (result.success && result.balanceSheet) {
        setBalanceSheetData(result.balanceSheet as BalanceSheetData);
      }

      // Load comparison data if needed
      if (filters.comparisonDate !== "none") {
        await loadComparisonData();
      }
    } catch (error) {
      console.error("Error loading balance sheet data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async () => {
    try {
      let comparisonDate: string;

      if (filters.comparisonDate === "previous_month") {
        const currentDate = new Date(filters.asOfDate);
        comparisonDate = format(
          new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate()),
          "yyyy-MM-dd",
        );
      } else if (filters.comparisonDate === "previous_quarter") {
        const currentDate = new Date(filters.asOfDate);
        comparisonDate = format(
          new Date(currentDate.getFullYear(), currentDate.getMonth() - 3, currentDate.getDate()),
          "yyyy-MM-dd",
        );
      } else if (filters.comparisonDate === "previous_year") {
        const currentDate = new Date(filters.asOfDate);
        comparisonDate = format(
          new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate()),
          "yyyy-MM-dd",
        );
      } else {
        return;
      }

      const result = await ReportCurrencyConversionService.getBalanceSheetWithConversion(
        companyId,
        comparisonDate,
        filters.currency,
      );

      if (result.success && result.balanceSheet) {
        setComparisonData(result.balanceSheet as BalanceSheetData);
      }
    } catch (error) {
      console.error("Error loading comparison data:", error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <BarChart3 className="h-4 w-4 text-gray-500" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return "text-green-600";
    if (change < 0) return "text-red-600";
    return "text-gray-600";
  };

  const groupAccountsByCategory = (accounts: any[], category: string) => {
    return accounts.filter(account => account.category === category);
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log("Export to PDF functionality will be implemented");
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    console.log("Export to Excel functionality will be implemented");
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Balance Sheet</h1>
          <p className="text-muted-foreground">
            Assets, liabilities, and equity as of a specific date
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={exportToPDF}>
            <FileText className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Report Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="asOfDate">As of Date</Label>
              <Input
                id="asOfDate"
                type="date"
                value={filters.asOfDate}
                onChange={e => setFilters(prev => ({ ...prev, asOfDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={filters.currency}
                onValueChange={value => setFilters(prev => ({ ...prev, currency: value }))}
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
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="comparison">Comparison</Label>
              <Select
                value={filters.comparisonDate}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, comparisonDate: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Comparison</SelectItem>
                  <SelectItem value="previous_month">Previous Month</SelectItem>
                  <SelectItem value="previous_quarter">Previous Quarter</SelectItem>
                  <SelectItem value="previous_year">Previous Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadBalanceSheetData} disabled={loading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading balance sheet data...</span>
            </div>
          </CardContent>
        </Card>
      ) : balanceSheetData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Total Assets</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(balanceSheetData.totalAssets, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Total Liabilities</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(balanceSheetData.totalLiabilities, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <PiggyBank className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Total Equity</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(balanceSheetData.totalEquity, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assets Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <span>Assets</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Assets */}
                <div>
                  <h4 className="font-semibold text-lg mb-2">Current Assets</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                          {comparisonData && (
                            <>
                              <TableHead className="text-right">Previous</TableHead>
                              <TableHead className="text-right">Change</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupAccountsByCategory(balanceSheetData.assets, "Current Assets").map(
                          (item, index) => {
                            const comparisonItem = comparisonData?.assets.find(
                              c => c.account_name === item.account_name,
                            );
                            const change = comparisonItem
                              ? calculateChange(item.amount, comparisonItem.amount)
                              : 0;

                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.account_name}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.amount, filters.currency)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {item.percentage.toFixed(1)}%
                                </TableCell>
                                {comparisonData && (
                                  <>
                                    <TableCell className="text-right text-muted-foreground">
                                      {comparisonItem
                                        ? formatCurrency(comparisonItem.amount, filters.currency)
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end space-x-1">
                                        {getChangeIcon(change)}
                                        <span className={getChangeColor(change)}>
                                          {change > 0 ? "+" : ""}
                                          {change.toFixed(1)}%
                                        </span>
                                      </div>
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            );
                          },
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Fixed Assets */}
                <div>
                  <h4 className="font-semibold text-lg mb-2">Fixed Assets</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                          {comparisonData && (
                            <>
                              <TableHead className="text-right">Previous</TableHead>
                              <TableHead className="text-right">Change</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupAccountsByCategory(balanceSheetData.assets, "Fixed Assets").map(
                          (item, index) => {
                            const comparisonItem = comparisonData?.assets.find(
                              c => c.account_name === item.account_name,
                            );
                            const change = comparisonItem
                              ? calculateChange(item.amount, comparisonItem.amount)
                              : 0;

                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.account_name}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.amount, filters.currency)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">
                                  {item.percentage.toFixed(1)}%
                                </TableCell>
                                {comparisonData && (
                                  <>
                                    <TableCell className="text-right text-muted-foreground">
                                      {comparisonItem
                                        ? formatCurrency(comparisonItem.amount, filters.currency)
                                        : "-"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end space-x-1">
                                        {getChangeIcon(change)}
                                        <span className={getChangeColor(change)}>
                                          {change > 0 ? "+" : ""}
                                          {change.toFixed(1)}%
                                        </span>
                                      </div>
                                    </TableCell>
                                  </>
                                )}
                              </TableRow>
                            );
                          },
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Total Assets */}
                <div className="border-t-2 pt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Assets</span>
                    <div className="text-right">
                      <span>{formatCurrency(balanceSheetData.totalAssets, filters.currency)}</span>
                      {comparisonData && (
                        <div className="flex items-center justify-end space-x-1 mt-1 text-sm font-normal">
                          {getChangeIcon(
                            calculateChange(
                              balanceSheetData.totalAssets,
                              comparisonData.totalAssets,
                            ),
                          )}
                          <span
                            className={getChangeColor(
                              calculateChange(
                                balanceSheetData.totalAssets,
                                comparisonData.totalAssets,
                              ),
                            )}
                          >
                            {calculateChange(
                              balanceSheetData.totalAssets,
                              comparisonData.totalAssets,
                            ) > 0
                              ? "+"
                              : ""}
                            {calculateChange(
                              balanceSheetData.totalAssets,
                              comparisonData.totalAssets,
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liabilities Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5 text-red-500" />
                <span>Liabilities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current Liabilities */}
                <div>
                  <h4 className="font-semibold text-lg mb-2">Current Liabilities</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                          {comparisonData && (
                            <>
                              <TableHead className="text-right">Previous</TableHead>
                              <TableHead className="text-right">Change</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupAccountsByCategory(
                          balanceSheetData.liabilities,
                          "Current Liabilities",
                        ).map((item, index) => {
                          const comparisonItem = comparisonData?.liabilities.find(
                            c => c.account_name === item.account_name,
                          );
                          const change = comparisonItem
                            ? calculateChange(item.amount, comparisonItem.amount)
                            : 0;

                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.account_name}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.amount, filters.currency)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {item.percentage.toFixed(1)}%
                              </TableCell>
                              {comparisonData && (
                                <>
                                  <TableCell className="text-right text-muted-foreground">
                                    {comparisonItem
                                      ? formatCurrency(comparisonItem.amount, filters.currency)
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      {getChangeIcon(change)}
                                      <span className={getChangeColor(change)}>
                                        {change > 0 ? "+" : ""}
                                        {change.toFixed(1)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Long-term Liabilities */}
                <div>
                  <h4 className="font-semibold text-lg mb-2">Long-term Liabilities</h4>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                          {comparisonData && (
                            <>
                              <TableHead className="text-right">Previous</TableHead>
                              <TableHead className="text-right">Change</TableHead>
                            </>
                          )}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupAccountsByCategory(
                          balanceSheetData.liabilities,
                          "Long-term Liabilities",
                        ).map((item, index) => {
                          const comparisonItem = comparisonData?.liabilities.find(
                            c => c.account_name === item.account_name,
                          );
                          const change = comparisonItem
                            ? calculateChange(item.amount, comparisonItem.amount)
                            : 0;

                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.account_name}</TableCell>
                              <TableCell className="text-right font-medium">
                                {formatCurrency(item.amount, filters.currency)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {item.percentage.toFixed(1)}%
                              </TableCell>
                              {comparisonData && (
                                <>
                                  <TableCell className="text-right text-muted-foreground">
                                    {comparisonItem
                                      ? formatCurrency(comparisonItem.amount, filters.currency)
                                      : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                      {getChangeIcon(change)}
                                      <span className={getChangeColor(change)}>
                                        {change > 0 ? "+" : ""}
                                        {change.toFixed(1)}%
                                      </span>
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Total Liabilities */}
                <div className="border-t-2 pt-4">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total Liabilities</span>
                    <div className="text-right">
                      <span>
                        {formatCurrency(balanceSheetData.totalLiabilities, filters.currency)}
                      </span>
                      {comparisonData && (
                        <div className="flex items-center justify-end space-x-1 mt-1 text-sm font-normal">
                          {getChangeIcon(
                            calculateChange(
                              balanceSheetData.totalLiabilities,
                              comparisonData.totalLiabilities,
                            ),
                          )}
                          <span
                            className={getChangeColor(
                              calculateChange(
                                balanceSheetData.totalLiabilities,
                                comparisonData.totalLiabilities,
                              ),
                            )}
                          >
                            {calculateChange(
                              balanceSheetData.totalLiabilities,
                              comparisonData.totalLiabilities,
                            ) > 0
                              ? "+"
                              : ""}
                            {calculateChange(
                              balanceSheetData.totalLiabilities,
                              comparisonData.totalLiabilities,
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Equity Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PiggyBank className="h-5 w-5 text-green-500" />
                <span>Equity</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">% of Total</TableHead>
                      {comparisonData && (
                        <>
                          <TableHead className="text-right">Previous</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balanceSheetData.equity.map((item, index) => {
                      const comparisonItem = comparisonData?.equity.find(
                        c => c.account_name === item.account_name,
                      );
                      const change = comparisonItem
                        ? calculateChange(item.amount, comparisonItem.amount)
                        : 0;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.account_name}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(item.amount, filters.currency)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {item.percentage.toFixed(1)}%
                          </TableCell>
                          {comparisonData && (
                            <>
                              <TableCell className="text-right text-muted-foreground">
                                {comparisonItem
                                  ? formatCurrency(comparisonItem.amount, filters.currency)
                                  : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-1">
                                  {getChangeIcon(change)}
                                  <span className={getChangeColor(change)}>
                                    {change > 0 ? "+" : ""}
                                    {change.toFixed(1)}%
                                  </span>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      );
                    })}
                    <TableRow className="border-t-2 font-bold">
                      <TableCell>Total Equity</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(balanceSheetData.totalEquity, filters.currency)}
                      </TableCell>
                      <TableCell className="text-right">100.0%</TableCell>
                      {comparisonData && (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(comparisonData.totalEquity, filters.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {getChangeIcon(
                                calculateChange(
                                  balanceSheetData.totalEquity,
                                  comparisonData.totalEquity,
                                ),
                              )}
                              <span
                                className={getChangeColor(
                                  calculateChange(
                                    balanceSheetData.totalEquity,
                                    comparisonData.totalEquity,
                                  ),
                                )}
                              >
                                {calculateChange(
                                  balanceSheetData.totalEquity,
                                  comparisonData.totalEquity,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {calculateChange(
                                  balanceSheetData.totalEquity,
                                  comparisonData.totalEquity,
                                ).toFixed(1)}
                                %
                              </span>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Balance Verification */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Balance Sheet Verification</h3>
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Assets</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(balanceSheetData.totalAssets, filters.currency)}
                    </p>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">=</div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Liabilities + Equity</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(
                        balanceSheetData.totalLiabilities + balanceSheetData.totalEquity,
                        filters.currency,
                      )}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <Badge
                    variant={
                      Math.abs(
                        balanceSheetData.totalAssets -
                          (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity),
                      ) < 0.01
                        ? "default"
                        : "destructive"
                    }
                  >
                    {Math.abs(
                      balanceSheetData.totalAssets -
                        (balanceSheetData.totalLiabilities + balanceSheetData.totalEquity),
                    ) < 0.01
                      ? "Balanced"
                      : "Not Balanced"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                No balance sheet data found for the selected date
              </p>
              <Button onClick={loadBalanceSheetData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Load Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
