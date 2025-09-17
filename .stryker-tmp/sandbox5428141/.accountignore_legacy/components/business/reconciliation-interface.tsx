/**
 * Bank Reconciliation Interface
 * Advanced transaction matching with AI-powered suggestions and automation
 */
// @ts-nocheck


"use client";

import * as React from "react";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  DollarSign,
  Calendar,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Eye,
  EyeOff,
  ArrowRightLeft,
  Plus,
  Minus,
  Target,
  Sparkles,
  Download,
  Upload,
  Settings,
  Info,
  Check,
  X,
  Link,
  Unlink,
} from "lucide-react";
import { format, parseISO, isWithinInterval, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { DateRangePicker } from "@/components/ui/date-picker";
import { AmountInput } from "@/components/ui/amount-input";
import { DataGrid, type DataGridColumn } from "@/components/ui/data-grid";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BankTransaction {
  id: string;
  date: Date;
  description: string;
  reference?: string;
  amount: number;
  balance?: number;
  type: "debit" | "credit";

  // Matching info
  is_matched: boolean;
  matched_entry_id?: string;
  match_confidence?: number;
  suggested_matches?: GLEntry[];

  // Import info
  import_id?: string;
  source: "manual" | "csv" | "api" | "bank_feed";
}

export interface GLEntry {
  id: string;
  posting_date: Date;
  account_code: string;
  account_name: string;
  voucher_type: string;
  voucher_number: string;
  description: string;
  debit: number;
  credit: number;
  balance?: number;

  // Matching info
  is_matched: boolean;
  matched_bank_transaction_id?: string;
  match_confidence?: number;
}

export interface ReconciliationSession {
  id: string;
  bank_account_id: string;
  bank_account_name: string;
  statement_date: Date;
  opening_balance: number;
  closing_balance: number;
  statement_balance: number;

  // Reconciliation status
  status: "draft" | "in_progress" | "completed" | "submitted";
  matched_count: number;
  unmatched_bank_count: number;
  unmatched_gl_count: number;
  difference: number;

  // Metadata
  created_by: string;
  created_at: Date;
  completed_at?: Date;
}

export interface ReconciliationInterfaceProps {
  session?: ReconciliationSession;
  bankTransactions: BankTransaction[];
  glEntries: GLEntry[];

  // Events
  onMatch?: (bankTransactionId: string, glEntryId: string) => Promise<void>;
  onUnmatch?: (bankTransactionId: string, glEntryId?: string) => Promise<void>;
  onCreateEntry?: (bankTransaction: BankTransaction) => Promise<void>;
  onComplete?: (session: ReconciliationSession) => Promise<void>;

  // Configuration
  bankAccountId: string;
  currency?: string;
  autoMatchEnabled?: boolean;

  className?: string;
}

export function ReconciliationInterface({
  session,
  bankTransactions,
  glEntries,
  onMatch,
  onUnmatch,
  onCreateEntry,
  onComplete,
  bankAccountId,
  currency = "MYR",
  autoMatchEnabled = true,
  className,
}: ReconciliationInterfaceProps) {
  const [activeTab, setActiveTab] = React.useState("matching");
  const [selectedBankTransactions, setSelectedBankTransactions] = React.useState<Set<string>>(
    new Set(),
  );
  const [selectedGLEntries, setSelectedGLEntries] = React.useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [showMatchedOnly, setShowMatchedOnly] = React.useState(false);
  const [showUnmatchedOnly, setShowUnmatchedOnly] = React.useState(false);
  const [autoMatching, setAutoMatching] = React.useState(false);

  // Filter transactions and entries
  const filteredBankTransactions = React.useMemo(() => {
    return bankTransactions.filter(transaction => {
      // Date filter
      if (!isWithinInterval(transaction.date, dateRange)) return false;

      // Search filter
      if (
        searchQuery &&
        !transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !transaction.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      // Status filter
      if (showMatchedOnly && !transaction.is_matched) return false;
      if (showUnmatchedOnly && transaction.is_matched) return false;

      return true;
    });
  }, [bankTransactions, dateRange, searchQuery, showMatchedOnly, showUnmatchedOnly]);

  const filteredGLEntries = React.useMemo(() => {
    return glEntries.filter(entry => {
      // Date filter
      if (!isWithinInterval(entry.posting_date, dateRange)) return false;

      // Search filter
      if (
        searchQuery &&
        !entry.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !entry.voucher_number.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !entry.account_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;

      // Status filter
      if (showMatchedOnly && !entry.is_matched) return false;
      if (showUnmatchedOnly && entry.is_matched) return false;

      return true;
    });
  }, [glEntries, dateRange, searchQuery, showMatchedOnly, showUnmatchedOnly]);

  // Calculate reconciliation statistics
  const stats = React.useMemo(() => {
    const matchedBankTransactions = bankTransactions.filter(t => t.is_matched);
    const unmatchedBankTransactions = bankTransactions.filter(t => !t.is_matched);
    const matchedGLEntries = glEntries.filter(e => e.is_matched);
    const unmatchedGLEntries = glEntries.filter(e => !e.is_matched);

    const totalBankAmount = bankTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const matchedBankAmount = matchedBankTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0,
    );
    const matchPercentage = totalBankAmount > 0 ? (matchedBankAmount / totalBankAmount) * 100 : 0;

    return {
      totalBankTransactions: bankTransactions.length,
      matchedBankTransactions: matchedBankTransactions.length,
      unmatchedBankTransactions: unmatchedBankTransactions.length,
      totalGLEntries: glEntries.length,
      matchedGLEntries: matchedGLEntries.length,
      unmatchedGLEntries: unmatchedGLEntries.length,
      matchPercentage,
      totalBankAmount,
      matchedBankAmount,
    };
  }, [bankTransactions, glEntries]);

  // Auto-matching logic
  const performAutoMatch = async () => {
    if (!autoMatchEnabled) return;

    setAutoMatching(true);
    try {
      const unmatchedBankTransactions = bankTransactions.filter(t => !t.is_matched);
      const unmatchedGLEntries = glEntries.filter(e => !e.is_matched);

      for (const bankTransaction of unmatchedBankTransactions) {
        // Find potential matches based on amount and date proximity
        const potentialMatches = unmatchedGLEntries.filter(entry => {
          const amountMatch =
            Math.abs(Math.abs(bankTransaction.amount) - Math.abs(entry.debit || entry.credit)) <
            0.01;
          const dateMatch =
            Math.abs(bankTransaction.date.getTime() - entry.posting_date.getTime()) <
            7 * 24 * 60 * 60 * 1000; // 7 days
          return amountMatch && dateMatch;
        });

        if (potentialMatches.length === 1) {
          // Exact match found
          await onMatch?.(bankTransaction.id, potentialMatches[0].id);
        }
      }
    } catch (error) {
      console.error("Auto-matching failed:", error);
    } finally {
      setAutoMatching(false);
    }
  };

  // Manual matching
  const handleManualMatch = async () => {
    if (selectedBankTransactions.size !== 1 || selectedGLEntries.size !== 1) return;

    const bankTransactionId = Array.from(selectedBankTransactions)[0];
    const glEntryId = Array.from(selectedGLEntries)[0];

    await onMatch?.(bankTransactionId, glEntryId);

    // Clear selections
    setSelectedBankTransactions(new Set());
    setSelectedGLEntries(new Set());
  };

  // Bank transactions columns
  const bankTransactionColumns: DataGridColumn<BankTransaction>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedBankTransactions.has(row.original.id)}
          onCheckedChange={checked => {
            const newSelected = new Set(selectedBankTransactions);
            if (checked) {
              newSelected.add(row.original.id);
            } else {
              newSelected.delete(row.original.id);
            }
            setSelectedBankTransactions(newSelected);
          }}
        />
      ),
      size: 50,
    },
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(row.original.date, "dd MMM yyyy"),
      size: 100,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.description}</p>
          {row.original.reference && (
            <p className="text-xs text-muted-foreground">{row.original.reference}</p>
          )}
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="text-right">
          <span
            className={cn(
              "font-mono",
              row.original.type === "debit" ? "text-red-600" : "text-green-600",
            )}
          >
            {row.original.type === "debit" ? "-" : "+"}
            {currency} {Math.abs(row.original.amount).toLocaleString()}
          </span>
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "is_matched",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {row.original.is_matched ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="default">Matched</Badge>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline">Unmatched</Badge>
            </>
          )}
        </div>
      ),
      size: 120,
    },
  ];

  // GL entries columns
  const glEntryColumns: DataGridColumn<GLEntry>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={value => table.toggleAllPageRowsSelected(!!value)}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedGLEntries.has(row.original.id)}
          onCheckedChange={checked => {
            const newSelected = new Set(selectedGLEntries);
            if (checked) {
              newSelected.add(row.original.id);
            } else {
              newSelected.delete(row.original.id);
            }
            setSelectedGLEntries(newSelected);
          }}
        />
      ),
      size: 50,
    },
    {
      accessorKey: "posting_date",
      header: "Date",
      cell: ({ row }) => format(row.original.posting_date, "dd MMM yyyy"),
      size: 100,
    },
    {
      accessorKey: "voucher_number",
      header: "Voucher",
      cell: ({ row }) => (
        <div>
          <p className="font-medium font-mono">{row.original.voucher_number}</p>
          <p className="text-xs text-muted-foreground">{row.original.voucher_type}</p>
        </div>
      ),
      size: 120,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.description}</p>
          <p className="text-xs text-muted-foreground">{row.original.account_name}</p>
        </div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.original.debit || row.original.credit;
        const isDebit = row.original.debit > 0;
        return (
          <div className="text-right">
            <span className={cn("font-mono", isDebit ? "text-red-600" : "text-green-600")}>
              {isDebit ? "-" : "+"}
              {currency} {amount.toLocaleString()}
            </span>
          </div>
        );
      },
      size: 120,
    },
    {
      accessorKey: "is_matched",
      header: "Status",
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          {row.original.is_matched ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <Badge variant="default">Matched</Badge>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-yellow-500" />
              <Badge variant="outline">Unmatched</Badge>
            </>
          )}
        </div>
      ),
      size: 120,
    },
  ];

  const formatAmount = (amount: number) => {
    return `${currency} ${Math.abs(amount).toLocaleString()}`;
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank Reconciliation</h2>
          <p className="text-muted-foreground">
            {session?.bank_account_name || "Bank Account"} - {format(new Date(), "MMM yyyy")}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="outline">{stats.matchPercentage.toFixed(1)}% Matched</Badge>
          {session && (
            <Badge variant={session.status === "completed" ? "default" : "secondary"}>
              {session.status}
            </Badge>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Bank Transactions</p>
                <p className="text-2xl font-bold">{stats.totalBankTransactions}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.matchedBankTransactions} matched, {stats.unmatchedBankTransactions}{" "}
                  unmatched
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">GL Entries</p>
                <p className="text-2xl font-bold">{stats.totalGLEntries}</p>
                <p className="text-xs text-muted-foreground">
                  {stats.matchedGLEntries} matched, {stats.unmatchedGLEntries} unmatched
                </p>
              </div>
              <ArrowRightLeft className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Match Rate</p>
                <p className="text-2xl font-bold">{stats.matchPercentage.toFixed(1)}%</p>
                <Progress value={stats.matchPercentage} className="mt-2" />
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Matched Amount</p>
                <p className="text-2xl font-bold">{formatAmount(stats.matchedBankAmount)}</p>
                <p className="text-xs text-muted-foreground">
                  of {formatAmount(stats.totalBankAmount)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 w-64"
            />
          </div>

          {/* Date Range */}
          <DateRangePicker
            value={dateRange}
            onChange={range => setDateRange(range)}
            placeholder="Select date range"
          />

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Button
              variant={showMatchedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowMatchedOnly(!showMatchedOnly);
                setShowUnmatchedOnly(false);
              }}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Matched
            </Button>
            <Button
              variant={showUnmatchedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setShowUnmatchedOnly(!showUnmatchedOnly);
                setShowMatchedOnly(false);
              }}
            >
              <Clock className="h-4 w-4 mr-1" />
              Unmatched
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Auto Match */}
          <Button variant="outline" onClick={performAutoMatch} disabled={autoMatching}>
            {autoMatching ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Auto Match
          </Button>

          {/* Manual Match */}
          <Button
            onClick={handleManualMatch}
            disabled={selectedBankTransactions.size !== 1 || selectedGLEntries.size !== 1}
          >
            <Link className="h-4 w-4 mr-2" />
            Match Selected
          </Button>
        </div>
      </div>

      {/* Matching Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bank Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Bank Transactions</span>
              <Badge variant="outline">{selectedBankTransactions.size} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid
              data={filteredBankTransactions}
              columns={bankTransactionColumns}
              pageSize={10}
              enableSorting={true}
              enableFiltering={false}
              showPagination={true}
              compactMode={true}
            />
          </CardContent>
        </Card>

        {/* GL Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>GL Entries</span>
              <Badge variant="outline">{selectedGLEntries.size} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataGrid
              data={filteredGLEntries}
              columns={glEntryColumns}
              pageSize={10}
              enableSorting={true}
              enableFiltering={false}
              showPagination={true}
              compactMode={true}
            />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center space-x-2">
          {stats.unmatchedBankTransactions > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {stats.unmatchedBankTransactions} bank transactions remain unmatched
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>

          {onComplete && session && (
            <Button
              onClick={() => onComplete(session)}
              disabled={stats.unmatchedBankTransactions > 0}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete Reconciliation
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
