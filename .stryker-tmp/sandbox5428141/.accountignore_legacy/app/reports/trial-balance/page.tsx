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
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import { ReportCurrencyConversionService } from "@/lib/report-currency-conversion";
import { format } from "date-fns";

interface TrialBalanceRow {
  account_name: string;
  account_code: string;
  account_type: string;
  debit_balance: number;
  credit_balance: number;
  original_debit: number;
  original_credit: number;
  currency: string;
  parent_account?: string;
}

interface TrialBalanceData {
  accounts: TrialBalanceRow[];
  total_debits: number;
  total_credits: number;
  is_balanced: boolean;
  currency: string;
  as_of_date: string;
}

export default function TrialBalancePage() {
  const [trialBalanceData, setTrialBalanceData] = useState<TrialBalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    asOfDate: format(new Date(), "yyyy-MM-dd"),
    currency: "USD",
    accountType: "all" as "all" | "Asset" | "Liability" | "Equity" | "Income" | "Expense",
    searchTerm: "",
  });
  const [sortBy, setSortBy] = useState<
    "account_name" | "account_code" | "account_type" | "debit_balance" | "credit_balance"
  >("account_name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const companyId = "default-company"; // In a real app, this would come from context

  useEffect(() => {
    loadTrialBalanceData();
  }, [filters]);

  const loadTrialBalanceData = async () => {
    setLoading(true);
    try {
      const result = await ReportCurrencyConversionService.getTrialBalanceWithConversion(
        companyId,
        filters.asOfDate,
        filters.currency as any,
      );

      if (result.success && result.trialBalance) {
        setTrialBalanceData(result.trialBalance as any);
      }
    } catch (error) {
      console.error("Error loading trial balance data:", error);
    } finally {
      setLoading(false);
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

  const getAccountTypeColor = (accountType: string) => {
    const typeConfig = {
      Asset: "text-primary bg-primary/10 border-primary/20",
      Liability: "text-destructive bg-destructive/10 border-destructive/20",
      Equity: "text-primary bg-primary/10 border-primary/20",
      Income: "text-primary bg-primary/10 border-primary/20",
      Expense: "text-muted-foreground bg-muted border-border",
    };

    return (
      typeConfig[accountType as keyof typeof typeConfig] ||
      "text-muted-foreground bg-muted border-border"
    );
  };

  const filteredAndSortedAccounts = () => {
    if (!trialBalanceData) return [];

    let filtered = trialBalanceData.accounts;

    // Filter by account type
    if (filters.accountType !== "all") {
      filtered = filtered.filter(account => account.account_type === filters.accountType);
    }

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(
        account =>
          account.account_name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          account.account_code.toLowerCase().includes(filters.searchTerm.toLowerCase()),
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === "debit_balance" || sortBy === "credit_balance") {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export
    console.log("Export to PDF functionality will be implemented");
  };

  const exportToExcel = () => {
    // TODO: Implement Excel export
    console.log("Export to Excel functionality will be implemented");
  };

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trial Balance</h1>
          <p className="text-muted-foreground">All accounts with their debit and credit balances</p>
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
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={filters.accountType}
                onValueChange={value =>
                  setFilters(prev => ({ ...prev, accountType: value as any }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Asset">Asset</SelectItem>
                  <SelectItem value="Liability">Liability</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="searchTerm">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="searchTerm"
                  placeholder="Search accounts..."
                  value={filters.searchTerm}
                  onChange={e => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button onClick={loadTrialBalanceData} disabled={loading} className="w-full">
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Status */}
      {trialBalanceData && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {trialBalanceData.is_balanced ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">
                  {trialBalanceData.is_balanced
                    ? "Trial Balance is Balanced"
                    : "Trial Balance is NOT Balanced"}
                </span>
              </div>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Debits</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(trialBalanceData.total_debits, filters.currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Total Credits</p>
                  <p className="text-lg font-bold">
                    {formatCurrency(trialBalanceData.total_credits, filters.currency)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Difference</p>
                  <p
                    className={`text-lg font-bold ${Math.abs(trialBalanceData.total_debits - trialBalanceData.total_credits) < 0.01 ? "text-primary" : "text-destructive"}`}
                  >
                    {formatCurrency(
                      trialBalanceData.total_debits - trialBalanceData.total_credits,
                      filters.currency,
                    )}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Content */}
      {loading ? (
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin mr-2" />
              <span>Loading trial balance data...</span>
            </div>
          </CardContent>
        </Card>
      ) : trialBalanceData ? (
        <Card>
          <CardHeader>
            <CardTitle>Trial Balance Details</CardTitle>
            <CardDescription>
              As of {format(new Date(trialBalanceData.as_of_date), "MMMM dd, yyyy")} •{" "}
              {filteredAndSortedAccounts().length} accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("account_code")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Account Code</span>
                        {sortBy === "account_code" &&
                          (sortOrder === "asc" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("account_name")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Account Name</span>
                        {sortBy === "account_name" &&
                          (sortOrder === "asc" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("account_type")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Type</span>
                        {sortBy === "account_type" &&
                          (sortOrder === "asc" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("debit_balance")}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Debit Balance</span>
                        {sortBy === "debit_balance" &&
                          (sortOrder === "asc" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("credit_balance")}
                    >
                      <div className="flex items-center justify-end space-x-1">
                        <span>Credit Balance</span>
                        {sortBy === "credit_balance" &&
                          (sortOrder === "asc" ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          ))}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedAccounts().map((account, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm">{account.account_code}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <span>{account.account_name}</span>
                          {account.parent_account && (
                            <Badge variant="outline" className="text-xs">
                              {account.parent_account}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getAccountTypeColor(account.account_type)}>
                          {account.account_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {account.debit_balance > 0
                          ? formatCurrency(account.debit_balance, filters.currency)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {account.credit_balance > 0
                          ? formatCurrency(account.credit_balance, filters.currency)
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Totals Row */}
                  <TableRow className="border-t-2 font-bold bg-muted/50">
                    <TableCell colSpan={3} className="text-right">
                      <span className="text-lg">TOTALS</span>
                    </TableCell>
                    <TableCell className="text-right text-lg">
                      {formatCurrency(trialBalanceData.total_debits, filters.currency)}
                    </TableCell>
                    <TableCell className="text-right text-lg">
                      {formatCurrency(trialBalanceData.total_credits, filters.currency)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Data Available</h3>
              <p className="text-muted-foreground mb-4">
                No trial balance data found for the selected date
              </p>
              <Button onClick={loadTrialBalanceData}>
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
