"use client";

import React, { useState, useEffect, useRef } from "react";
import { cn } from "@aibos/ui/utils";
import { Button } from "@aibos/ui/Button";
import { Input } from "@aibos/ui/Input";
import { Label } from "@aibos/ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Badge } from "@aibos/ui/Badge";
import { Alert, AlertDescription } from "@aibos/ui/Alert";
import {
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Eye,
  EyeOff,
  DollarSign,
  Calendar,
  Building2,
  Target,
  Zap,
  Lock,
  Unlock,
} from "lucide-react";

// Types
interface BankTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  account: string;
  accountId: string;
  reference?: string;
  isMatched: boolean;
  matchId?: string;
  confidence?: number;
}

interface AccountingEntry {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "debit" | "credit";
  account: string;
  accountId: string;
  reference?: string;
  isMatched: boolean;
  matchId?: string;
  source: "invoice" | "bill" | "journal" | "manual";
}

interface Match {
  id: string;
  bankTransactionId: string;
  accountingEntryId: string;
  confidence: number;
  isAutoMatch: boolean;
  createdAt: string;
  status: "pending" | "confirmed" | "rejected";
}

interface ReconciliationCanvasProps {
  onMatchCreated?: (match: Match) => void;
  onMatchConfirmed?: (matchId: string) => void;
  onMatchRejected?: (matchId: string) => void;
  onReconciliationComplete?: (results: any) => void;
  className?: string;
}

// Mock data
const mockBankTransactions: BankTransaction[] = [
  {
    id: "bt_001",
    date: "2024-01-15",
    description: "OFFICE RENT - JANUARY",
    amount: 2500.0,
    type: "debit",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "BT-2024-001",
    isMatched: false,
  },
  {
    id: "bt_002",
    date: "2024-01-14",
    description: "AMAZON WEB SERVICES",
    amount: 89.5,
    type: "debit",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "BT-2024-002",
    isMatched: true,
    matchId: "match_001",
  },
  {
    id: "bt_003",
    date: "2024-01-13",
    description: "CLIENT PAYMENT - ACME CORP",
    amount: 5000.0,
    type: "credit",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "BT-2024-003",
    isMatched: false,
  },
  {
    id: "bt_004",
    date: "2024-01-12",
    description: "STARBUCKS COFFEE",
    amount: 12.5,
    type: "debit",
    account: "Business Credit Card",
    accountId: "acc_003",
    reference: "BT-2024-004",
    isMatched: false,
  },
  {
    id: "bt_005",
    date: "2024-01-11",
    description: "PAYROLL - JANUARY 2024",
    amount: 8500.0,
    type: "debit",
    account: "Business Checking",
    accountId: "acc_001",
    reference: "BT-2024-005",
    isMatched: true,
    matchId: "match_002",
  },
];

const mockAccountingEntries: AccountingEntry[] = [
  {
    id: "ae_001",
    date: "2024-01-15",
    description: "Office Rent Payment",
    amount: 2500.0,
    type: "debit",
    account: "Rent Expense",
    accountId: "exp_001",
    reference: "INV-2024-001",
    isMatched: false,
    source: "bill",
  },
  {
    id: "ae_002",
    date: "2024-01-14",
    description: "AWS Hosting Fee",
    amount: 89.5,
    type: "debit",
    account: "Technology Expense",
    accountId: "exp_002",
    reference: "INV-2024-002",
    isMatched: true,
    matchId: "match_001",
    source: "bill",
  },
  {
    id: "ae_003",
    date: "2024-01-13",
    description: "Payment from Acme Corp",
    amount: 5000.0,
    type: "credit",
    account: "Accounts Receivable",
    accountId: "ar_001",
    reference: "INV-2024-003",
    isMatched: false,
    source: "invoice",
  },
  {
    id: "ae_004",
    date: "2024-01-12",
    description: "Business Meal - Client Meeting",
    amount: 12.5,
    type: "debit",
    account: "Meals & Entertainment",
    accountId: "exp_003",
    reference: "EXP-2024-001",
    isMatched: false,
    source: "manual",
  },
  {
    id: "ae_005",
    date: "2024-01-11",
    description: "Employee Payroll",
    amount: 8500.0,
    type: "debit",
    account: "Payroll Expense",
    accountId: "exp_004",
    reference: "PAY-2024-001",
    isMatched: true,
    matchId: "match_002",
    source: "journal",
  },
];

const mockMatches: Match[] = [
  {
    id: "match_001",
    bankTransactionId: "bt_002",
    accountingEntryId: "ae_002",
    confidence: 0.95,
    isAutoMatch: true,
    createdAt: "2024-01-14T10:30:00Z",
    status: "confirmed",
  },
  {
    id: "match_002",
    bankTransactionId: "bt_005",
    accountingEntryId: "ae_005",
    confidence: 0.98,
    isAutoMatch: true,
    createdAt: "2024-01-11T14:15:00Z",
    status: "confirmed",
  },
];

export function ReconciliationCanvas({
  onMatchCreated,
  onMatchConfirmed,
  onMatchRejected,
  onReconciliationComplete,
  className,
}: ReconciliationCanvasProps) {
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(mockBankTransactions);
  const [accountingEntries, setAccountingEntries] =
    useState<AccountingEntry[]>(mockAccountingEntries);
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [draggedItem, setDraggedItem] = useState<{
    id: string;
    type: "bank" | "accounting";
  } | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAccount, setFilterAccount] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<"all" | "today" | "week" | "month">("all");
  const [showMatched, setShowMatched] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [autoMatchResults, setAutoMatchResults] = useState<any>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Filter transactions and entries
  const filteredBankTransactions = bankTransactions.filter(transaction => {
    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = filterAccount === "all" || transaction.accountId === filterAccount;
    const matchesDate =
      filterDateRange === "all" ||
      (filterDateRange === "today" && isToday(transaction.date)) ||
      (filterDateRange === "week" && isThisWeek(transaction.date)) ||
      (filterDateRange === "month" && isThisMonth(transaction.date));
    const matchesVisibility = showMatched || !transaction.isMatched;

    return matchesSearch && matchesAccount && matchesDate && matchesVisibility;
  });

  const filteredAccountingEntries = accountingEntries.filter(entry => {
    const matchesSearch =
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAccount = filterAccount === "all" || entry.accountId === filterAccount;
    const matchesDate =
      filterDateRange === "all" ||
      (filterDateRange === "today" && isToday(entry.date)) ||
      (filterDateRange === "week" && isThisWeek(entry.date)) ||
      (filterDateRange === "month" && isThisMonth(entry.date));
    const matchesVisibility = showMatched || !entry.isMatched;

    return matchesSearch && matchesAccount && matchesDate && matchesVisibility;
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

  const handleDragStart = (e: React.DragEvent, id: string, type: "bank" | "accounting") => {
    if (isLocked) return;
    setDraggedItem({ id, type });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: "bank" | "accounting") => {
    e.preventDefault();

    if (!draggedItem || isLocked) return;

    // Only allow matching between different types
    if (draggedItem.type === targetType) return;

    const sourceId = draggedItem.id;
    const targetTransaction =
      targetType === "bank"
        ? bankTransactions.find(t => t.id === targetId)
        : accountingEntries.find(e => e.id === targetId);

    const sourceTransaction =
      draggedItem.type === "bank"
        ? bankTransactions.find(t => t.id === sourceId)
        : accountingEntries.find(e => e.id === sourceId);

    if (!targetTransaction || !sourceTransaction) return;

    // Check if amounts match (within tolerance)
    const amountMatch = Math.abs(targetTransaction.amount - sourceTransaction.amount) < 0.01;
    if (!amountMatch) return;

    // Create match
    const newMatch: Match = {
      id: `match_${Date.now()}`,
      bankTransactionId: draggedItem.type === "bank" ? sourceId : targetId,
      accountingEntryId: draggedItem.type === "bank" ? targetId : sourceId,
      confidence: 1.0,
      isAutoMatch: false,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    setMatches(prev => [...prev, newMatch]);

    // Update transaction states
    setBankTransactions(prev =>
      prev.map(t =>
        t.id === newMatch.bankTransactionId ? { ...t, isMatched: true, matchId: newMatch.id } : t,
      ),
    );

    setAccountingEntries(prev =>
      prev.map(e =>
        e.id === newMatch.accountingEntryId ? { ...e, isMatched: true, matchId: newMatch.id } : e,
      ),
    );

    setDraggedItem(null);

    if (onMatchCreated) {
      onMatchCreated(newMatch);
    }
  };

  const handleAutoMatch = async () => {
    setIsLocked(true);

    // Simulate auto-matching process
    await new Promise(resolve => setTimeout(resolve, 2000));

    const autoMatches: Match[] = [];
    const unmatchedBank = bankTransactions.filter(t => !t.isMatched);
    const unmatchedAccounting = accountingEntries.filter(e => !e.isMatched);

    unmatchedBank.forEach(bankTxn => {
      const matchingEntry = unmatchedAccounting.find(
        accEntry =>
          Math.abs(bankTxn.amount - accEntry.amount) < 0.01 && bankTxn.date === accEntry.date,
      );

      if (matchingEntry) {
        const match: Match = {
          id: `match_${Date.now()}_${Math.random()}`,
          bankTransactionId: bankTxn.id,
          accountingEntryId: matchingEntry.id,
          confidence: 0.85,
          isAutoMatch: true,
          createdAt: new Date().toISOString(),
          status: "pending",
        };

        autoMatches.push(match);
      }
    });

    setMatches(prev => [...prev, ...autoMatches]);

    // Update transaction states
    autoMatches.forEach(match => {
      setBankTransactions(prev =>
        prev.map(t =>
          t.id === match.bankTransactionId ? { ...t, isMatched: true, matchId: match.id } : t,
        ),
      );

      setAccountingEntries(prev =>
        prev.map(e =>
          e.id === match.accountingEntryId ? { ...e, isMatched: true, matchId: match.id } : e,
        ),
      );
    });

    setAutoMatchResults({
      totalMatches: autoMatches.length,
      confidence:
        autoMatches.reduce((acc, match) => acc + match.confidence, 0) / autoMatches.length,
    });

    setIsLocked(false);
  };

  const handleConfirmMatch = (matchId: string) => {
    setMatches(prev =>
      prev.map(match => (match.id === matchId ? { ...match, status: "confirmed" } : match)),
    );

    if (onMatchConfirmed) {
      onMatchConfirmed(matchId);
    }
  };

  const handleRejectMatch = (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    setMatches(prev => prev.filter(m => m.id !== matchId));

    // Unmatch transactions
    setBankTransactions(prev =>
      prev.map(t =>
        t.id === match.bankTransactionId ? { ...t, isMatched: false, matchId: undefined } : t,
      ),
    );

    setAccountingEntries(prev =>
      prev.map(e =>
        e.id === match.accountingEntryId ? { ...e, isMatched: false, matchId: undefined } : e,
      ),
    );

    if (onMatchRejected) {
      onMatchRejected(matchId);
    }
  };

  const formatAmount = (amount: number, type: "debit" | "credit") => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(Math.abs(amount));

    return type === "credit" ? `+${formatted}` : `-${formatted}`;
  };

  const getMatchStatusColor = (status: Match["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-sys-green-100 text-sys-green-800 border-sys-green-200";
      case "pending":
        return "bg-sys-yellow-100 text-sys-yellow-800 border-sys-yellow-200";
      case "rejected":
        return "bg-sys-red-100 text-sys-red-800 border-sys-red-200";
      default:
        return "bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200";
    }
  };

  const getSourceIcon = (source: AccountingEntry["source"]) => {
    switch (source) {
      case "invoice":
        return <Building2 className="w-4 h-4" />;
      case "bill":
        return <Building2 className="w-4 h-4" />;
      case "journal":
        return <Building2 className="w-4 h-4" />;
      case "manual":
        return <Building2 className="w-4 h-4" />;
      default:
        return <Building2 className="w-4 h-4" />;
    }
  };

  const unmatchedBankCount = bankTransactions.filter(t => !t.isMatched).length;
  const unmatchedAccountingCount = accountingEntries.filter(e => !e.isMatched).length;
  const pendingMatchesCount = matches.filter(m => m.status === "pending").length;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sys-fg-default">Reconciliation Canvas</h2>
        <p className="text-sys-fg-muted">
          Match bank transactions with accounting entries using drag-and-drop or auto-matching.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-sys-blue-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{unmatchedBankCount}</p>
                <p className="text-sm text-sys-fg-muted">Unmatched Bank</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-sys-purple-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{unmatchedAccountingCount}</p>
                <p className="text-sm text-sys-fg-muted">Unmatched Entries</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-sys-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">{pendingMatchesCount}</p>
                <p className="text-sm text-sys-fg-muted">Pending Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-sys-green-600" />
              <div>
                <p className="text-2xl font-bold text-sys-fg-default">
                  {matches.filter(m => m.status === "confirmed").length}
                </p>
                <p className="text-sm text-sys-fg-muted">Confirmed Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                Reconciliation Controls
              </CardTitle>
              <CardDescription>
                {isLocked
                  ? "Auto-matching in progress..."
                  : "Use drag-and-drop to match transactions or run auto-matching."}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAutoMatch}
                disabled={isLocked}
                className="flex items-center gap-2"
              >
                {isLocked ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Auto-Matching...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Auto-Match
                  </>
                )}
              </Button>
              <Button variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
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
              value={filterAccount}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFilterAccount(e.target.value)
              }
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Accounts</option>
              <option value="acc_001">Business Checking</option>
              <option value="acc_003">Business Credit Card</option>
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
            <Button variant="outline" size="sm" onClick={() => setShowMatched(!showMatched)}>
              {showMatched ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showMatched ? "Hide Matched" : "Show Matched"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Match Results */}
      {autoMatchResults && (
        <Alert className="border-sys-green-200">
          <CheckCircle className="w-4 h-4 text-sys-green-500" />
          <AlertDescription>
            Auto-matching completed: {autoMatchResults.totalMatches} matches found with{" "}
            {Math.round(autoMatchResults.confidence * 100)}% average confidence.
          </AlertDescription>
        </Alert>
      )}

      {/* Reconciliation Canvas */}
      <div ref={canvasRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-sys-blue-600" />
              Bank Transactions
            </CardTitle>
            <CardDescription>
              Drag transactions to the right to match with accounting entries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredBankTransactions.map(transaction => (
                <Card
                  key={transaction.id}
                  className={cn(
                    "p-4 cursor-move transition-all",
                    draggedItem?.id === transaction.id && "opacity-50",
                    hoveredItem === transaction.id && "ring-2 ring-sys-brand-500",
                    transaction.isMatched && "bg-sys-green-50 border-sys-green-200",
                    isLocked && "cursor-not-allowed opacity-50",
                  )}
                  draggable={!isLocked && !transaction.isMatched}
                  onDragStart={e => handleDragStart(e, transaction.id, "bank")}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, transaction.id, "bank")}
                  onMouseEnter={() => setHoveredItem(transaction.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <DollarSign className="w-4 h-4 text-sys-fg-muted" />
                      <div>
                        <p className="font-medium text-sys-fg-default">{transaction.description}</p>
                        <p className="text-sm text-sys-fg-muted">
                          {transaction.date} • {transaction.account}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-medium",
                          transaction.type === "credit" ? "text-sys-green-600" : "text-sys-red-600",
                        )}
                      >
                        {formatAmount(transaction.amount, transaction.type)}
                      </p>
                      {transaction.isMatched && (
                        <Badge className="bg-sys-green-100 text-sys-green-800 border-sys-green-200 text-xs">
                          Matched
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredBankTransactions.length === 0 && (
                <div className="text-center py-8 text-sys-fg-muted">
                  <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No bank transactions found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Accounting Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-sys-purple-600" />
              Accounting Entries
            </CardTitle>
            <CardDescription>Drop bank transactions here to create matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredAccountingEntries.map(entry => (
                <Card
                  key={entry.id}
                  className={cn(
                    "p-4 transition-all",
                    hoveredItem === entry.id && "ring-2 ring-sys-brand-500",
                    entry.isMatched && "bg-sys-green-50 border-sys-green-200",
                  )}
                  onDragOver={handleDragOver}
                  onDrop={e => handleDrop(e, entry.id, "accounting")}
                  onMouseEnter={() => setHoveredItem(entry.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getSourceIcon(entry.source)}
                      <div>
                        <p className="font-medium text-sys-fg-default">{entry.description}</p>
                        <p className="text-sm text-sys-fg-muted">
                          {entry.date} • {entry.account}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          "font-medium",
                          entry.type === "credit" ? "text-sys-green-600" : "text-sys-red-600",
                        )}
                      >
                        {formatAmount(entry.amount, entry.type)}
                      </p>
                      {entry.isMatched && (
                        <Badge className="bg-sys-green-100 text-sys-green-800 border-sys-green-200 text-xs">
                          Matched
                        </Badge>
                      )}
                    </div>
                  </div>
                </Card>
              ))}

              {filteredAccountingEntries.length === 0 && (
                <div className="text-center py-8 text-sys-fg-muted">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No accounting entries found.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Matches */}
      {matches.filter(m => m.status === "pending").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-sys-yellow-600" />
              Pending Matches
            </CardTitle>
            <CardDescription>Review and confirm auto-generated matches.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {matches
                .filter(m => m.status === "pending")
                .map(match => {
                  const bankTxn = bankTransactions.find(t => t.id === match.bankTransactionId);
                  const accEntry = accountingEntries.find(e => e.id === match.accountingEntryId);

                  if (!bankTxn || !accEntry) return null;

                  return (
                    <Card key={match.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-sys-fg-muted" />
                            <div>
                              <p className="font-medium text-sys-fg-default">
                                {bankTxn.description}
                              </p>
                              <p className="text-sm text-sys-fg-muted">{bankTxn.date}</p>
                            </div>
                          </div>

                          <ArrowRight className="w-4 h-4 text-sys-fg-muted" />

                          <div className="flex items-center gap-2">
                            {getSourceIcon(accEntry.source)}
                            <div>
                              <p className="font-medium text-sys-fg-default">
                                {accEntry.description}
                              </p>
                              <p className="text-sm text-sys-fg-muted">{accEntry.date}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium text-sys-fg-default">
                              {formatAmount(bankTxn.amount, bankTxn.type)}
                            </p>
                            <Badge className={cn("text-xs", getMatchStatusColor(match.status))}>
                              {Math.round(match.confidence * 100)}% confidence
                            </Badge>
                          </div>

                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleConfirmMatch(match.id)}>
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Confirm
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectMatch(match.id)}
                            >
                              <AlertCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
