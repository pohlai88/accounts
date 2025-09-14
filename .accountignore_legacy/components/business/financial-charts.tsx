/**
 * Financial Charts - P&L and Balance Sheet Visualizations
 * Professional financial statement charts with interactive features
 */

"use client";

import * as React from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  FileText,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  LineChart,
  Settings,
  Info,
  AlertTriangle,
} from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface FinancialData {
  account_code: string;
  account_name: string;
  account_type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
  balance: number;
  previous_balance?: number;
  percentage_change?: number;
  is_group: boolean;
  parent_account?: string;
  level: number;
}

export interface PeriodComparison {
  current_period: {
    from: Date;
    to: Date;
    label: string;
  };
  previous_period: {
    from: Date;
    to: Date;
    label: string;
  };
}

export interface FinancialChartsProps {
  data: FinancialData[];
  loading?: boolean;
  error?: string;
  companyId?: string;
  currency?: string;

  // Period selection
  period?: PeriodComparison;
  onPeriodChange?: (period: PeriodComparison) => void;

  // Features
  showComparison?: boolean;
  showPercentages?: boolean;
  enableDrillDown?: boolean;

  className?: string;
}

export function FinancialCharts({
  data,
  loading = false,
  error,
  companyId,
  currency = "MYR",
  period,
  onPeriodChange,
  showComparison = true,
  showPercentages = true,
  enableDrillDown = true,
  className,
}: FinancialChartsProps) {
  const [activeTab, setActiveTab] = React.useState("profit-loss");
  const [chartType, setChartType] = React.useState<"bar" | "pie" | "line">("bar");
  const [showDetails, setShowDetails] = React.useState(false);
  const [selectedAccounts, setSelectedAccounts] = React.useState<Set<string>>(new Set());

  // Process data for different financial statements
  const processedData = React.useMemo(() => {
    const assets = data.filter(item => item.account_type === "Asset");
    const liabilities = data.filter(item => item.account_type === "Liability");
    const equity = data.filter(item => item.account_type === "Equity");
    const income = data.filter(item => item.account_type === "Income");
    const expenses = data.filter(item => item.account_type === "Expense");

    // Calculate totals
    const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);
    const totalEquity = equity.reduce((sum, item) => sum + item.balance, 0);
    const totalIncome = income.reduce((sum, item) => sum + item.balance, 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + item.balance, 0);
    const netProfit = totalIncome - totalExpenses;

    return {
      balanceSheet: {
        assets: { items: assets, total: totalAssets },
        liabilities: { items: liabilities, total: totalLiabilities },
        equity: { items: equity, total: totalEquity },
      },
      profitLoss: {
        income: { items: income, total: totalIncome },
        expenses: { items: expenses, total: totalExpenses },
        netProfit,
      },
      totals: {
        totalAssets,
        totalLiabilities,
        totalEquity,
        totalIncome,
        totalExpenses,
        netProfit,
      },
    };
  }, [data]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const getPercentageChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const getTrendIcon = (change?: number) => {
    if (!change) return null;
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span>Loading financial data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center space-y-2">
              <AlertTriangle className="h-8 w-8 text-red-500 mx-auto" />
              <p className="text-red-500 font-medium">Error loading financial data</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Financial Reports</h2>
          <p className="text-muted-foreground">
            {period
              ? `${format(period.current_period.from, "MMM dd")} - ${format(period.current_period.to, "MMM dd, yyyy")}`
              : "Current Period"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Period selector */}
          {onPeriodChange && (
            <Select
              value={period?.current_period.label || "current-month"}
              onValueChange={value => {
                const now = new Date();
                let newPeriod: PeriodComparison;

                switch (value) {
                  case "current-month":
                    newPeriod = {
                      current_period: {
                        from: startOfMonth(now),
                        to: endOfMonth(now),
                        label: "Current Month",
                      },
                      previous_period: {
                        from: startOfMonth(subMonths(now, 1)),
                        to: endOfMonth(subMonths(now, 1)),
                        label: "Previous Month",
                      },
                    };
                    break;
                  case "last-month":
                    const lastMonth = subMonths(now, 1);
                    newPeriod = {
                      current_period: {
                        from: startOfMonth(lastMonth),
                        to: endOfMonth(lastMonth),
                        label: "Last Month",
                      },
                      previous_period: {
                        from: startOfMonth(subMonths(lastMonth, 1)),
                        to: endOfMonth(subMonths(lastMonth, 1)),
                        label: "Previous Month",
                      },
                    };
                    break;
                  default:
                    return;
                }

                onPeriodChange(newPeriod);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Current Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="current-quarter">Current Quarter</SelectItem>
                <SelectItem value="current-year">Current Year</SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Chart type selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {chartType === "bar" && <BarChart3 className="h-4 w-4 mr-2" />}
                {chartType === "pie" && <PieChart className="h-4 w-4 mr-2" />}
                {chartType === "line" && <LineChart className="h-4 w-4 mr-2" />}
                Chart
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setChartType("bar")}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Bar Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType("pie")}>
                <PieChart className="h-4 w-4 mr-2" />
                Pie Chart
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setChartType("line")}>
                <LineChart className="h-4 w-4 mr-2" />
                Line Chart
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export button */}
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Assets</p>
                <p className="text-2xl font-bold">
                  {formatAmount(processedData.totals.totalAssets)}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">
                  {formatAmount(processedData.totals.totalIncome)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">
                  {formatAmount(processedData.totals.totalExpenses)}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Profit</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    processedData.totals.netProfit >= 0 ? "text-green-600" : "text-red-600",
                  )}
                >
                  {formatAmount(processedData.totals.netProfit)}
                </p>
              </div>
              <DollarSign
                className={cn(
                  "h-8 w-8",
                  processedData.totals.netProfit >= 0 ? "text-green-500" : "text-red-500",
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Statement Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="profit-loss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          <TabsTrigger value="cash-flow">Cash Flow</TabsTrigger>
        </TabsList>

        {/* Profit & Loss Statement */}
        <TabsContent value="profit-loss">
          <ProfitLossChart
            data={processedData.profitLoss}
            chartType={chartType}
            showComparison={showComparison}
            showPercentages={showPercentages}
            currency={currency}
            formatAmount={formatAmount}
          />
        </TabsContent>

        {/* Balance Sheet */}
        <TabsContent value="balance-sheet">
          <BalanceSheetChart
            data={processedData.balanceSheet}
            chartType={chartType}
            showComparison={showComparison}
            showPercentages={showPercentages}
            currency={currency}
            formatAmount={formatAmount}
          />
        </TabsContent>

        {/* Cash Flow (placeholder) */}
        <TabsContent value="cash-flow">
          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Cash Flow Statement coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Profit & Loss Chart Component
interface ProfitLossChartProps {
  data: {
    income: { items: FinancialData[]; total: number };
    expenses: { items: FinancialData[]; total: number };
    netProfit: number;
  };
  chartType: "bar" | "pie" | "line";
  showComparison: boolean;
  showPercentages: boolean;
  currency: string;
  formatAmount: (amount: number) => string;
}

function ProfitLossChart({
  data,
  chartType,
  showComparison,
  showPercentages,
  currency,
  formatAmount,
}: ProfitLossChartProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Income */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span>Income</span>
            </span>
            <Badge variant="outline" className="text-green-600">
              {formatAmount(data.income.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.income.items
              .filter(item => !item.is_group && item.balance > 0)
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 10)
              .map((item, index) => (
                <div key={item.account_code} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.account_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.account_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatAmount(item.balance)}</p>
                    {showPercentages && (
                      <p className="text-xs text-muted-foreground">
                        {((item.balance / data.income.total) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Expenses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <TrendingDown className="h-5 w-5 text-red-500" />
              <span>Expenses</span>
            </span>
            <Badge variant="outline" className="text-red-600">
              {formatAmount(data.expenses.total)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.expenses.items
              .filter(item => !item.is_group && item.balance > 0)
              .sort((a, b) => b.balance - a.balance)
              .slice(0, 10)
              .map((item, index) => (
                <div key={item.account_code} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.account_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.account_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatAmount(item.balance)}</p>
                    {showPercentages && (
                      <p className="text-xs text-muted-foreground">
                        {((item.balance / data.expenses.total) * 100).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Net Profit Summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Net Profit Summary</span>
            <Badge variant={data.netProfit >= 0 ? "default" : "destructive"}>
              {formatAmount(data.netProfit)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <span className="font-medium">Total Income</span>
              <span className="font-bold text-green-600">{formatAmount(data.income.total)}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <span className="font-medium">Total Expenses</span>
              <span className="font-bold text-red-600">{formatAmount(data.expenses.total)}</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-lg font-bold",
                data.netProfit >= 0
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
                  : "bg-red-50 dark:bg-red-900/20 text-red-600",
              )}
            >
              <span>Net Profit</span>
              <span>{formatAmount(data.netProfit)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Balance Sheet Chart Component
interface BalanceSheetChartProps {
  data: {
    assets: { items: FinancialData[]; total: number };
    liabilities: { items: FinancialData[]; total: number };
    equity: { items: FinancialData[]; total: number };
  };
  chartType: "bar" | "pie" | "line";
  showComparison: boolean;
  showPercentages: boolean;
  currency: string;
  formatAmount: (amount: number) => string;
}

function BalanceSheetChart({
  data,
  chartType,
  showComparison,
  showPercentages,
  currency,
  formatAmount,
}: BalanceSheetChartProps) {
  const totalLiabilitiesAndEquity = data.liabilities.total + data.equity.total;
  const isBalanced = Math.abs(data.assets.total - totalLiabilitiesAndEquity) < 1;

  return (
    <div className="space-y-6">
      {/* Balance Check */}
      <Card
        className={cn(
          "border-2",
          isBalanced
            ? "border-green-200 bg-green-50 dark:bg-green-900/20"
            : "border-red-200 bg-red-50 dark:bg-red-900/20",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isBalanced ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {isBalanced ? "Balance Sheet is Balanced" : "Balance Sheet is Unbalanced"}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Assets vs Liabilities + Equity</p>
              <p className="font-mono">
                {formatAmount(data.assets.total)} vs {formatAmount(totalLiabilitiesAndEquity)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Sheet Components */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <span>Assets</span>
              </span>
              <Badge variant="outline" className="text-blue-600">
                {formatAmount(data.assets.total)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.assets.items
                .filter(item => !item.is_group && item.balance !== 0)
                .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                .slice(0, 8)
                .map(item => (
                  <div key={item.account_code} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.account_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.account_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatAmount(item.balance)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Liabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <span>Liabilities</span>
              </span>
              <Badge variant="outline" className="text-red-600">
                {formatAmount(data.liabilities.total)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.liabilities.items
                .filter(item => !item.is_group && item.balance !== 0)
                .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                .slice(0, 8)
                .map(item => (
                  <div key={item.account_code} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.account_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.account_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatAmount(item.balance)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Equity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-purple-500" />
                <span>Equity</span>
              </span>
              <Badge variant="outline" className="text-purple-600">
                {formatAmount(data.equity.total)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.equity.items
                .filter(item => !item.is_group && item.balance !== 0)
                .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance))
                .slice(0, 8)
                .map(item => (
                  <div key={item.account_code} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.account_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.account_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatAmount(item.balance)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
