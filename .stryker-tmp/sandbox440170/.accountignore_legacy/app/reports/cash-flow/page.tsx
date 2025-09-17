// @ts-nocheck
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
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft,
} from "lucide-react";
import { ReportCurrencyConversionService } from "@/lib/report-currency-conversion";
import { format } from "date-fns";

interface CashFlowData {
  operatingActivities: Array<{
    description: string;
    amount: number;
    original_amount: number;
    currency: string;
    category: string;
  }>;
  investingActivities: Array<{
    description: string;
    amount: number;
    original_amount: number;
    currency: string;
    category: string;
  }>;
  financingActivities: Array<{
    description: string;
    amount: number;
    original_amount: number;
    currency: string;
    category: string;
  }>;
  netOperatingCashFlow: number;
  netInvestingCashFlow: number;
  netFinancingCashFlow: number;
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
  currency: string;
  period: {
    from: string;
    to: string;
  };
}

export default function CashFlowPage() {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    fromDate: format(new Date(new Date().getFullYear(), 0, 1), "yyyy-MM-dd"), // Start of year
    toDate: format(new Date(), "yyyy-MM-dd"), // Today
    currency: "USD",
    comparisonPeriod: "none" as "none" | "previous" | "previous_year",
  });
  const [comparisonData, setComparisonData] = useState<CashFlowData | null>(null);

  const companyId = "default-company"; // In a real app, this would come from context

  useEffect(() => {
    loadCashFlowData();
  }, [filters]);

  const loadCashFlowData = async () => {
    setLoading(true);
    try {
      // For now, we'll create mock data since we don't have a cash flow service yet
      // In a real implementation, this would call a cash flow service
      const mockCashFlowData: CashFlowData = {
        operatingActivities: [
          {
            description: "Net Income",
            amount: 50000,
            original_amount: 50000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Depreciation",
            amount: 10000,
            original_amount: 10000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Accounts Receivable Change",
            amount: -5000,
            original_amount: -5000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Inventory Change",
            amount: -8000,
            original_amount: -8000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Accounts Payable Change",
            amount: 3000,
            original_amount: 3000,
            currency: filters.currency,
            category: "Operating",
          },
        ],
        investingActivities: [
          {
            description: "Equipment Purchase",
            amount: -15000,
            original_amount: -15000,
            currency: filters.currency,
            category: "Investing",
          },
          {
            description: "Property Purchase",
            amount: -25000,
            original_amount: -25000,
            currency: filters.currency,
            category: "Investing",
          },
          {
            description: "Investment Sale",
            amount: 5000,
            original_amount: 5000,
            currency: filters.currency,
            category: "Investing",
          },
        ],
        financingActivities: [
          {
            description: "Loan Proceeds",
            amount: 20000,
            original_amount: 20000,
            currency: filters.currency,
            category: "Financing",
          },
          {
            description: "Loan Repayment",
            amount: -8000,
            original_amount: -8000,
            currency: filters.currency,
            category: "Financing",
          },
          {
            description: "Dividends Paid",
            amount: -10000,
            original_amount: -10000,
            currency: filters.currency,
            category: "Financing",
          },
        ],
        netOperatingCashFlow: 50000,
        netInvestingCashFlow: -35000,
        netFinancingCashFlow: 2000,
        netCashFlow: 17000,
        beginningCash: 50000,
        endingCash: 67000,
        currency: filters.currency,
        period: {
          from: filters.fromDate,
          to: filters.toDate,
        },
      };

      setCashFlowData(mockCashFlowData);

      // Load comparison data if needed
      if (filters.comparisonPeriod !== "none") {
        await loadComparisonData();
      }
    } catch (error) {
      console.error("Error loading cash flow data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadComparisonData = async () => {
    try {
      // Mock comparison data
      const mockComparisonData: CashFlowData = {
        operatingActivities: [
          {
            description: "Net Income",
            amount: 45000,
            original_amount: 45000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Depreciation",
            amount: 8000,
            original_amount: 8000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Accounts Receivable Change",
            amount: -3000,
            original_amount: -3000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Inventory Change",
            amount: -6000,
            original_amount: -6000,
            currency: filters.currency,
            category: "Operating",
          },
          {
            description: "Accounts Payable Change",
            amount: 2000,
            original_amount: 2000,
            currency: filters.currency,
            category: "Operating",
          },
        ],
        investingActivities: [
          {
            description: "Equipment Purchase",
            amount: -10000,
            original_amount: -10000,
            currency: filters.currency,
            category: "Investing",
          },
          {
            description: "Property Purchase",
            amount: -20000,
            original_amount: -20000,
            currency: filters.currency,
            category: "Investing",
          },
          {
            description: "Investment Sale",
            amount: 3000,
            original_amount: 3000,
            currency: filters.currency,
            category: "Investing",
          },
        ],
        financingActivities: [
          {
            description: "Loan Proceeds",
            amount: 15000,
            original_amount: 15000,
            currency: filters.currency,
            category: "Financing",
          },
          {
            description: "Loan Repayment",
            amount: -5000,
            original_amount: -5000,
            currency: filters.currency,
            category: "Financing",
          },
          {
            description: "Dividends Paid",
            amount: -8000,
            original_amount: -8000,
            currency: filters.currency,
            category: "Financing",
          },
        ],
        netOperatingCashFlow: 46000,
        netInvestingCashFlow: -27000,
        netFinancingCashFlow: 2000,
        netCashFlow: 21000,
        beginningCash: 30000,
        endingCash: 51000,
        currency: filters.currency,
        period: {
          from: filters.fromDate,
          to: filters.toDate,
        },
      };

      setComparisonData(mockComparisonData);
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

  const getAmountColor = (amount: number) => {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
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
          <h1 className="text-3xl font-bold">Cash Flow Statement</h1>
          <p className="text-muted-foreground">
            Cash inflows and outflows from operating, investing, and financing activities
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
              <Button onClick={loadCashFlowData} disabled={loading} className="w-full">
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
              <span>Loading cash flow data...</span>
            </div>
          </CardContent>
        </Card>
      ) : cashFlowData ? (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">Operating Cash Flow</p>
                    <p
                      className={`text-2xl font-bold ${getAmountColor(cashFlowData.netOperatingCashFlow)}`}
                    >
                      {formatCurrency(cashFlowData.netOperatingCashFlow, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ArrowDownLeft className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">Investing Cash Flow</p>
                    <p
                      className={`text-2xl font-bold ${getAmountColor(cashFlowData.netInvestingCashFlow)}`}
                    >
                      {formatCurrency(cashFlowData.netInvestingCashFlow, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <ArrowRightLeft className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">Financing Cash Flow</p>
                    <p
                      className={`text-2xl font-bold ${getAmountColor(cashFlowData.netFinancingCashFlow)}`}
                    >
                      {formatCurrency(cashFlowData.netFinancingCashFlow, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">Net Cash Flow</p>
                    <p className={`text-2xl font-bold ${getAmountColor(cashFlowData.netCashFlow)}`}>
                      {formatCurrency(cashFlowData.netCashFlow, filters.currency)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operating Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowUpRight className="h-5 w-5 text-green-500" />
                <span>Operating Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {comparisonData && (
                        <>
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowData.operatingActivities.map((item, index) => {
                      const comparisonItem = comparisonData?.operatingActivities.find(
                        c => c.description === item.description,
                      );
                      const change = comparisonItem
                        ? calculateChange(item.amount, comparisonItem.amount)
                        : 0;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${getAmountColor(item.amount)}`}
                          >
                            {formatCurrency(item.amount, filters.currency)}
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
                      <TableCell>Net Cash from Operating Activities</TableCell>
                      <TableCell
                        className={`text-right ${getAmountColor(cashFlowData.netOperatingCashFlow)}`}
                      >
                        {formatCurrency(cashFlowData.netOperatingCashFlow, filters.currency)}
                      </TableCell>
                      {comparisonData && (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(comparisonData.netOperatingCashFlow, filters.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {getChangeIcon(
                                calculateChange(
                                  cashFlowData.netOperatingCashFlow,
                                  comparisonData.netOperatingCashFlow,
                                ),
                              )}
                              <span
                                className={getChangeColor(
                                  calculateChange(
                                    cashFlowData.netOperatingCashFlow,
                                    comparisonData.netOperatingCashFlow,
                                  ),
                                )}
                              >
                                {calculateChange(
                                  cashFlowData.netOperatingCashFlow,
                                  comparisonData.netOperatingCashFlow,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {calculateChange(
                                  cashFlowData.netOperatingCashFlow,
                                  comparisonData.netOperatingCashFlow,
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

          {/* Investing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowDownLeft className="h-5 w-5 text-blue-500" />
                <span>Investing Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {comparisonData && (
                        <>
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowData.investingActivities.map((item, index) => {
                      const comparisonItem = comparisonData?.investingActivities.find(
                        c => c.description === item.description,
                      );
                      const change = comparisonItem
                        ? calculateChange(item.amount, comparisonItem.amount)
                        : 0;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${getAmountColor(item.amount)}`}
                          >
                            {formatCurrency(item.amount, filters.currency)}
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
                      <TableCell>Net Cash from Investing Activities</TableCell>
                      <TableCell
                        className={`text-right ${getAmountColor(cashFlowData.netInvestingCashFlow)}`}
                      >
                        {formatCurrency(cashFlowData.netInvestingCashFlow, filters.currency)}
                      </TableCell>
                      {comparisonData && (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(comparisonData.netInvestingCashFlow, filters.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {getChangeIcon(
                                calculateChange(
                                  cashFlowData.netInvestingCashFlow,
                                  comparisonData.netInvestingCashFlow,
                                ),
                              )}
                              <span
                                className={getChangeColor(
                                  calculateChange(
                                    cashFlowData.netInvestingCashFlow,
                                    comparisonData.netInvestingCashFlow,
                                  ),
                                )}
                              >
                                {calculateChange(
                                  cashFlowData.netInvestingCashFlow,
                                  comparisonData.netInvestingCashFlow,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {calculateChange(
                                  cashFlowData.netInvestingCashFlow,
                                  comparisonData.netInvestingCashFlow,
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

          {/* Financing Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5 text-purple-500" />
                <span>Financing Activities</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      {comparisonData && (
                        <>
                          <TableHead className="text-right">Previous Period</TableHead>
                          <TableHead className="text-right">Change</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cashFlowData.financingActivities.map((item, index) => {
                      const comparisonItem = comparisonData?.financingActivities.find(
                        c => c.description === item.description,
                      );
                      const change = comparisonItem
                        ? calculateChange(item.amount, comparisonItem.amount)
                        : 0;

                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.description}</TableCell>
                          <TableCell
                            className={`text-right font-medium ${getAmountColor(item.amount)}`}
                          >
                            {formatCurrency(item.amount, filters.currency)}
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
                      <TableCell>Net Cash from Financing Activities</TableCell>
                      <TableCell
                        className={`text-right ${getAmountColor(cashFlowData.netFinancingCashFlow)}`}
                      >
                        {formatCurrency(cashFlowData.netFinancingCashFlow, filters.currency)}
                      </TableCell>
                      {comparisonData && (
                        <>
                          <TableCell className="text-right">
                            {formatCurrency(comparisonData.netFinancingCashFlow, filters.currency)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {getChangeIcon(
                                calculateChange(
                                  cashFlowData.netFinancingCashFlow,
                                  comparisonData.netFinancingCashFlow,
                                ),
                              )}
                              <span
                                className={getChangeColor(
                                  calculateChange(
                                    cashFlowData.netFinancingCashFlow,
                                    comparisonData.netFinancingCashFlow,
                                  ),
                                )}
                              >
                                {calculateChange(
                                  cashFlowData.netFinancingCashFlow,
                                  comparisonData.netFinancingCashFlow,
                                ) > 0
                                  ? "+"
                                  : ""}
                                {calculateChange(
                                  cashFlowData.netFinancingCashFlow,
                                  comparisonData.netFinancingCashFlow,
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

          {/* Cash Summary */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Cash Flow Summary</h3>
                  <p className="text-muted-foreground">
                    Period: {format(new Date(cashFlowData.period.from), "MMM dd, yyyy")} -{" "}
                    {format(new Date(cashFlowData.period.to), "MMM dd, yyyy")}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Beginning Cash</span>
                    <span className="font-medium">
                      {formatCurrency(cashFlowData.beginningCash, filters.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Net Cash from Operating Activities</span>
                    <span
                      className={`font-medium ${getAmountColor(cashFlowData.netOperatingCashFlow)}`}
                    >
                      {formatCurrency(cashFlowData.netOperatingCashFlow, filters.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Net Cash from Investing Activities</span>
                    <span
                      className={`font-medium ${getAmountColor(cashFlowData.netInvestingCashFlow)}`}
                    >
                      {formatCurrency(cashFlowData.netInvestingCashFlow, filters.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span>Net Cash from Financing Activities</span>
                    <span
                      className={`font-medium ${getAmountColor(cashFlowData.netFinancingCashFlow)}`}
                    >
                      {formatCurrency(cashFlowData.netFinancingCashFlow, filters.currency)}
                    </span>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Net Change in Cash</span>
                      <span className={getAmountColor(cashFlowData.netCashFlow)}>
                        {formatCurrency(cashFlowData.netCashFlow, filters.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center font-bold text-xl">
                      <span>Ending Cash</span>
                      <span className={getAmountColor(cashFlowData.endingCash)}>
                        {formatCurrency(cashFlowData.endingCash, filters.currency)}
                      </span>
                    </div>
                  </div>
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
                No cash flow data found for the selected period
              </p>
              <Button onClick={loadCashFlowData}>
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
