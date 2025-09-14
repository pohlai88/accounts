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
} from "lucide-react";
import { ReportCurrencyConversionService } from "@/lib/report-currency-conversion";
import { format } from "date-fns";

interface ProfitLossData {
  revenue: Array<{
    account_name: string;
    amount: number;
    original_amount: number;
    currency: string;
    percentage: number;
  }>;
  expenses: Array<{
    account_name: string;
    amount: number;
    original_amount: number;
    currency: string;
    percentage: number;
  }>;
  totalRevenue: number;
  totalExpenses: number;
  grossProfit: number;
  netIncomeAmount: number;
  currency: string;
  period: {
    from: string;
    to: string;
  };
}

export default function ProfitLossPage() {
  const [profitLossData, setProfitLossData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"), // Start of year
    toDate: format(new Date(), "yyyy-MM-dd"), // Today
    currency: "USD",
    comparisonPeriod: "none" as "none" | "previous" | "previous_year",
  });
  const [comparisonData, setComparisonData] = useState<ProfitLossData | null>(null);

  const companyId = "default-company"; // In a real app, this would come from context

  useEffect(() => {
    loadProfitLossData();
  }, [filters]);

  const loadProfitLossData = async () => {
    setLoading(true);
    try {
      const result = await ReportCurrencyConversionService.getProfitAndLossWithConversion(
        companyId,
        filters.fromDate,
        filters.toDate,
        filters.currency,
      );

      if (result.success && result.profitAndLoss) {
        setProfitLossData(result.profitAndLoss as ProfitLossData);
      }

      // Load comparison data if needed
      if (filters.comparisonPeriod !== "none") {
        await loadComparisonData();
      }
    } catch (error) {
      console.error("Error loading profit & loss data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async () => {
    try {
      let fromDate: string;
      let toDate: string;

      if (filters.comparisonPeriod === "previous") {
        // Previous period (same length as current period)
        const currentFrom = new Date(filters.fromDate);
        const currentTo = new Date(filters.toDate);
        const periodLength = currentTo.getTime() - currentFrom.getTime();

        toDate = format(new Date(currentFrom.getTime() - 1), "yyyy-MM-dd");
        fromDate = format(new Date(currentFrom.getTime() - periodLength - 1), "yyyy-MM-dd");
      } else if (filters.comparisonPeriod === "previous_year") {
        // Same period previous year
        const currentFrom = new Date(filters.fromDate);
        const currentTo = new Date(filters.toDate);

        fromDate = format(
          new Date(currentFrom.getFullYear() - 1, currentFrom.getMonth(), currentFrom.getDate()),
          "yyyy-MM-dd",
        );
        toDate = format(
          new Date(currentTo.getFullYear() - 1, currentTo.getMonth(), currentTo.getDate()),
          "yyyy-MM-dd",
        );
      } else {
        return;
      }

      const result = await ReportCurrencyConversionService.getProfitAndLossWithConversion(
        companyId,
        fromDate,
        toDate,
        filters.currency,
      );

      if (result.success && result.profitAndLoss) {
        setComparisonData(result.profitAndLoss as ProfitLossData);
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
          <h1 className="text-3xl font-bold">Profit & Loss Statement</h1>
          <p className="text-muted-foreground">Revenue and expense analysis for your business</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={e => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={e => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
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
                value={filters.comparisonPeriod}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, comparisonPeriod: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Comparison</SelectItem>
                  <SelectItem value="previous">Previous Period</SelectItem>
                  <SelectItem value="previous_year">Previous Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={loadProfitLossData} disabled={loading} className="w-full">
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
              <span>Loading profit & loss data...</span>
            </div>
          </CardContent>
        </Card>
      ) : profitLossData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(profitLossData.totalRevenue, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-sm font-medium">Total Expenses</p>
                    <p className="text-2xl font-bold text-red-600">
                      {formatCurrency(profitLossData.totalExpenses, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Gross Profit</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(profitLossData.grossProfit, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Net Income</p>
                    <p
                      className={`text-2xl font-bold ${profitLossData.netIncomeAmount >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {formatCurrency(profitLossData.netIncomeAmount, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Revenue</span>
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
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitLossData.revenue.map((item, index) => {
                      const comparisonItem = comparisonData?.revenue.find(
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
                      <TableCell>Total Revenue</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(profitLossData.totalRevenue, filters.currency)}
                      </TableCell>
                      <TableCell className="text-right">100.0%</TableCell>
                      {comparisonData && (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(comparisonData.totalRevenue, filters.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {getChangeIcon(
                                calculateChange(
                                  profitLossData.totalRevenue,
                                  comparisonData.totalRevenue,
                                ),
                              )}
                              <span
                                className={getChangeColor(
                                  calculateChange(
                                    profitLossData.totalRevenue,
                                    comparisonData.totalRevenue,
                                  ),
                                )}
                              >
                                {calculateChange(
                                  profitLossData.totalRevenue,
                                  comparisonData.totalRevenue,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {calculateChange(
                                  profitLossData.totalRevenue,
                                  comparisonData.totalRevenue,
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

          {/* Expenses Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <span>Expenses</span>
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
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profitLossData.expenses.map((item, index) => {
                      const comparisonItem = comparisonData?.expenses.find(
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
                      <TableCell>Total Expenses</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(profitLossData.totalExpenses, filters.currency)}
                      </TableCell>
                      <TableCell className="text-right">100.0%</TableCell>
                      {comparisonData && (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(comparisonData.totalExpenses, filters.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {getChangeIcon(
                                calculateChange(
                                  profitLossData.totalExpenses,
                                  comparisonData.totalExpenses,
                                ),
                              )}
                              <span
                                className={getChangeColor(
                                  calculateChange(
                                    profitLossData.totalExpenses,
                                    comparisonData.totalExpenses,
                                  ),
                                )}
                              >
                                {calculateChange(
                                  profitLossData.totalExpenses,
                                  comparisonData.totalExpenses,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {calculateChange(
                                  profitLossData.totalExpenses,
                                  comparisonData.totalExpenses,
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

          {/* Net Income Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Net Income</h3>
                  <p className="text-muted-foreground">
                    Period: {format(new Date(profitLossData.period.from), "MMM dd, yyyy")} -{" "}
                    {format(new Date(profitLossData.period.to), "MMM dd, yyyy")}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={`text-3xl font-bold ${profitLossData.netIncomeAmount >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {formatCurrency(profitLossData.netIncomeAmount, filters.currency)}
                  </p>
                  {comparisonData && (
                    <div className="flex items-center justify-end space-x-1 mt-1">
                      {getChangeIcon(
                        calculateChange(
                          profitLossData.netIncomeAmount,
                          comparisonData.netIncomeAmount,
                        ),
                      )}
                      <span
                        className={getChangeColor(
                          calculateChange(
                            profitLossData.netIncomeAmount,
                            comparisonData.netIncomeAmount,
                          ),
                        )}
                      >
                        {calculateChange(
                          profitLossData.netIncomeAmount,
                          comparisonData.netIncomeAmount,
                        ) > 0
                          ? "+"
                          : ""}
                        {calculateChange(
                          profitLossData.netIncomeAmount,
                          comparisonData.netIncomeAmount,
                        ).toFixed(1)}
                        %
                      </span>
                    </div>
                  )}
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
                No profit & loss data found for the selected period
              </p>
              <Button onClick={loadProfitLossData}>
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
