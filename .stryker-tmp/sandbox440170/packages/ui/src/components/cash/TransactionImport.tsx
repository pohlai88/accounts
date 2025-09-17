// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@aibos/ui/utils";
import { Button } from "@aibos/ui/Button";
import { Input } from "@aibos/ui/Input";
import { Label } from "@aibos/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Badge } from "@aibos/ui/Badge";
import { Alert, AlertDescription } from "@aibos/ui/Alert";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Filter,
  Search,
  Calendar,
  DollarSign,
  Tag,
  Building2,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";

// Types
interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  category?: string;
  subcategory?: string;
  account: string;
  accountId: string;
  reference?: string;
  isMatched: boolean;
  isCategorized: boolean;
  confidence: number; // 0-1 for auto-categorization confidence
  source: "bank" | "manual" | "csv";
  tags: string[];
  notes?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: number;
  duplicates: number;
  newTransactions: Transaction[];
  errorMessages: string[];
}

interface TransactionImportProps {
  onTransactionsImported?: (transactions: Transaction[]) => void;
  onTransactionUpdated?: (transaction: Transaction) => void;
  onTransactionDeleted?: (transactionId: string) => void;
  className?: string;
}

// Mock data
const mockTransactions: Transaction[] = [
  {
    id: "txn_001",
    date: "2024-01-15",
    description: "OFFICE RENT - JANUARY",
    amount: 2500.0,
    type: "debit",
    category: "Rent",
    subcategory: "Office Rent",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "TXN-2024-001",
    isMatched: false,
    isCategorized: true,
    confidence: 0.95,
    source: "bank",
    tags: ["recurring", "rent"],
    notes: "Monthly office rent payment",
  },
  {
    id: "txn_002",
    date: "2024-01-14",
    description: "AMAZON WEB SERVICES",
    amount: 89.5,
    type: "debit",
    category: "Technology",
    subcategory: "Cloud Services",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "TXN-2024-002",
    isMatched: true,
    isCategorized: true,
    confidence: 0.87,
    source: "bank",
    tags: ["technology", "recurring"],
    notes: "AWS monthly hosting fee",
  },
  {
    id: "txn_003",
    date: "2024-01-13",
    description: "CLIENT PAYMENT - ACME CORP",
    amount: 5000.0,
    type: "credit",
    category: "Revenue",
    subcategory: "Client Payments",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "TXN-2024-003",
    isMatched: false,
    isCategorized: true,
    confidence: 0.92,
    source: "bank",
    tags: ["revenue", "client"],
    notes: "Payment from Acme Corp for Q1 services",
  },
  {
    id: "txn_004",
    date: "2024-01-12",
    description: "STARBUCKS COFFEE",
    amount: 12.5,
    type: "debit",
    category: "Meals & Entertainment",
    subcategory: "Business Meals",
    account: "Business Credit Card",
    accountId: "acc_003",
    reference: "TXN-2024-004",
    isMatched: false,
    isCategorized: false,
    confidence: 0.45,
    source: "bank",
    tags: ["meals"],
    notes: "Client meeting coffee",
  },
  {
    id: "txn_005",
    date: "2024-01-11",
    description: "PAYROLL - JANUARY 2024",
    amount: 8500.0,
    type: "debit",
    category: "Payroll",
    subcategory: "Employee Salaries",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "TXN-2024-005",
    isMatched: true,
    isCategorized: true,
    confidence: 0.98,
    source: "bank",
    tags: ["payroll", "recurring"],
    notes: "Monthly payroll processing",
  },
];

const mockCategories = [
  "Revenue",
  "Rent",
  "Technology",
  "Payroll",
  "Meals & Entertainment",
  "Travel",
  "Office Supplies",
  "Marketing",
  "Legal",
  "Insurance",
];

export function TransactionImport({
  onTransactionsImported,
  onTransactionUpdated,
  onTransactionDeleted,
  className,
}: TransactionImportProps) {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "matched" | "unmatched" | "uncategorized"
  >("all");
  const [filterDateRange, setFilterDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());

  // Filter transactions based on search and filters
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "all" || transaction.category === filterCategory;

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "matched" && transaction.isMatched) ||
      (filterStatus === "unmatched" && !transaction.isMatched) ||
      (filterStatus === "uncategorized" && !transaction.isCategorized);

    const matchesDateRange =
      filterDateRange === "all" ||
      (filterDateRange === "today" && isToday(transaction.date)) ||
      (filterDateRange === "week" && isThisWeek(transaction.date)) ||
      (filterDateRange === "month" && isThisMonth(transaction.date));

    return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
  });

  const isToday = (date: string) => {
    const today = new Date().toISOString().split("T")[0];
    return date === today;
  };

  const isThisWeek = (date: string) => {
    const transactionDate = new Date(date);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return transactionDate >= weekAgo && transactionDate <= today;
  };

  const isThisMonth = (date: string) => {
    const transactionDate = new Date(date);
    const today = new Date();
    return (
      transactionDate.getMonth() === today.getMonth() &&
      transactionDate.getFullYear() === today.getFullYear()
    );
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);

    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock import result
    const mockResult: ImportResult = {
      success: true,
      imported: 15,
      errors: 2,
      duplicates: 3,
      newTransactions: [
        {
          id: `txn_${Date.now()}`,
          date: "2024-01-16",
          description: "NEW TRANSACTION FROM CSV",
          amount: 150.0,
          type: "debit",
          category: undefined,
          subcategory: undefined,
          account: "Business Checking",
          accountId: "acc_001",
          reference: `TXN-${Date.now()}`,
          isMatched: false,
          isCategorized: false,
          confidence: 0.0,
          source: "csv",
          tags: [],
          notes: "Imported from CSV file",
        },
      ],
      errorMessages: ["Invalid date format on line 5", "Missing amount on line 12"],
    };

    setImportResult(mockResult);
    setTransactions(prev => [...prev, ...mockResult.newTransactions]);
    setIsImporting(false);

    if (onTransactionsImported) {
      onTransactionsImported(mockResult.newTransactions);
    }
  };

  const handleSyncBank = async () => {
    setIsImporting(true);

    // Simulate bank sync
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock new transactions from bank
    const newBankTransactions: Transaction[] = [
      {
        id: `txn_${Date.now()}`,
        date: "2024-01-16",
        description: "BANK SYNC TRANSACTION",
        amount: 75.0,
        type: "debit",
        category: "Office Supplies",
        subcategory: "Stationery",
        account: "Business Checking",
        accountId: "acc_001",
        reference: `TXN-${Date.now()}`,
        isMatched: false,
        isCategorized: true,
        confidence: 0.78,
        source: "bank",
        tags: ["office"],
        notes: "Auto-synced from bank",
      },
    ];

    setTransactions(prev => [...prev, ...newBankTransactions]);
    setIsImporting(false);

    if (onTransactionsImported) {
      onTransactionsImported(newBankTransactions);
    }
  };

  const handleCategorize = (transactionId: string, category: string) => {
    setTransactions(prev =>
      prev.map(transaction =>
        transaction.id === transactionId
          ? { ...transaction, category, isCategorized: true, confidence: 1.0 }
          : transaction,
      ),
    );

    const updatedTransaction = transactions.find(t => t.id === transactionId);
    if (updatedTransaction && onTransactionUpdated) {
      onTransactionUpdated({
        ...updatedTransaction,
        category,
        isCategorized: true,
        confidence: 1.0,
      });
    }
  };

  const handleToggleSelection = (transactionId: string) => {
    setSelectedTransactions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const handleBulkCategorize = (category: string) => {
    setTransactions(prev =>
      prev.map(transaction =>
        selectedTransactions.has(transaction.id)
          ? { ...transaction, category, isCategorized: true, confidence: 1.0 }
          : transaction,
      ),
    );
    setSelectedTransactions(new Set());
  };

  const formatAmount = (amount: number, type: "debit" | "credit") => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));

    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-sys-green-600";
    if (confidence >= 0.6) return "text-sys-yellow-600";
    return "text-sys-red-600";
  };

  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.isMatched && transaction.isCategorized) {
      return (
        <Badge className="bg-sys-green-100 text-sys-green-800 border-sys-green-200">Complete</Badge>
      );
    }
    if (transaction.isMatched) {
      return (
        <Badge className="bg-sys-blue-100 text-sys-blue-800 border-sys-blue-200">Matched</Badge>
      );
    }
    if (transaction.isCategorized) {
      return (
        <Badge className="bg-sys-yellow-100 text-sys-yellow-800 border-sys-yellow-200">
          Categorized
        </Badge>
      );
    }
    return <Badge className="bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200">Pending</Badge>;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sys-fg-default">Transaction Import</h2>
        <p className="text-sys-fg-muted">
          Import and categorize transactions from bank feeds, CSV files, or manual entry.
        </p>
      </div>

      {/* Import Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-sys-brand-600" />
            Import Transactions
          </CardTitle>
          <CardDescription>
            Choose how you want to import transactions into your system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Bank Sync */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Building2 className="w-8 h-8 text-sys-brand-600" />
                  <div>
                    <h3 className="font-medium text-sys-fg-default">Bank Sync</h3>
                    <p className="text-sm text-sys-fg-muted">Real-time from connected accounts</p>
                  </div>
                </div>
                <Button onClick={handleSyncBank} disabled={isImporting} className="w-full">
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* CSV Upload */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-8 h-8 text-sys-brand-600" />
                  <div>
                    <h3 className="font-medium text-sys-fg-default">CSV Upload</h3>
                    <p className="text-sm text-sys-fg-muted">Import from bank statements</p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={isImporting}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Button disabled={isImporting} className="w-full">
                    {isImporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Choose File
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Manual Entry */}
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-8 h-8 text-sys-brand-600" />
                  <div>
                    <h3 className="font-medium text-sys-fg-default">Manual Entry</h3>
                    <p className="text-sm text-sys-fg-muted">Add transactions manually</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Import Results */}
      {importResult && (
        <Alert className={importResult.success ? "border-sys-green-200" : "border-sys-red-200"}>
          {importResult.success ? (
            <CheckCircle className="w-4 h-4 text-sys-green-500" />
          ) : (
            <AlertCircle className="w-4 h-4 text-sys-red-500" />
          )}
          <AlertDescription>
            <div className="space-y-2">
              <p>
                Import completed: {importResult.imported} transactions imported,
                {importResult.errors} errors, {importResult.duplicates} duplicates skipped.
              </p>
              {importResult.errorMessages.length > 0 && (
                <ul className="list-disc list-inside text-sm">
                  {importResult.errorMessages.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                {filteredTransactions.length} of {transactions.length} transactions
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowDetails(!showDetails)}>
                {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showDetails ? "Hide Details" : "Show Details"}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">
                Search transactions
              </Label>
              <Input
                id="search"
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilterCategory(e.target.value)
              }
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Categories</option>
              {mockCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilterStatus(e.target.value as any)
              }
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Status</option>
              <option value="matched">Matched</option>
              <option value="unmatched">Unmatched</option>
              <option value="uncategorized">Uncategorized</option>
            </select>
            <select
              value={filterDateRange}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilterDateRange(e.target.value as any)
              }
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedTransactions.size > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-sys-brand-50 border border-sys-brand-200 rounded-md">
              <span className="text-sm text-sys-fg-muted">
                {selectedTransactions.size} transactions selected
              </span>
              <div className="flex gap-2">
                <select
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    handleBulkCategorize(e.target.value)
                  }
                  className="px-3 py-1 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default text-sm"
                >
                  <option value="">Categorize as...</option>
                  {mockCategories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTransactions(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-2">
            {filteredTransactions.map(transaction => (
              <Card key={transaction.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.has(transaction.id)}
                      onChange={() => handleToggleSelection(transaction.id)}
                      className="rounded border-sys-border"
                    />
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-sys-fg-muted" />
                        <div>
                          <p className="font-medium text-sys-fg-default">
                            {transaction.description}
                          </p>
                          <p className="text-sm text-sys-fg-muted">
                            {transaction.date} • {transaction.account}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-medium",
                          transaction.type === "credit" ? "text-sys-green-600" : "text-sys-red-600",
                        )}
                      >
                        {formatAmount(transaction.amount, transaction.type)}
                      </p>
                      <div className="flex items-center gap-2">
                        {transaction.category && (
                          <Badge variant="outline" className="text-xs">
                            {transaction.category}
                          </Badge>
                        )}
                        {transaction.confidence > 0 && (
                          <span
                            className={cn("text-xs", getConfidenceColor(transaction.confidence))}
                          >
                            {Math.round(transaction.confidence * 100)}%
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(transaction)}
                      {!transaction.isCategorized && (
                        <select
                          value={transaction.category || ""}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                            handleCategorize(transaction.id, e.target.value)
                          }
                          className="px-2 py-1 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default text-sm"
                        >
                          <option value="">Categorize...</option>
                          {mockCategories.map(category => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-4 pt-4 border-t border-sys-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <Label className="text-sys-fg-muted">Reference</Label>
                        <p className="text-sys-fg-default">{transaction.reference}</p>
                      </div>
                      <div>
                        <Label className="text-sys-fg-muted">Source</Label>
                        <p className="text-sys-fg-default capitalize">{transaction.source}</p>
                      </div>
                      <div>
                        <Label className="text-sys-fg-muted">Tags</Label>
                        <div className="flex gap-1">
                          {transaction.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sys-fg-muted">Notes</Label>
                        <p className="text-sys-fg-default">{transaction.notes || "None"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="text-center py-8 text-sys-fg-muted">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No transactions found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
