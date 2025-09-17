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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Send,
  FileText,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Tag,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Sparkles,
  MoreHorizontal,
  ArrowUpDown,
  FilterX,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Receipt,
  Percent,
  Workflow,
  MessageSquare,
  Paperclip,
  Repeat,
  Mail as MailIcon,
  CheckCircle2,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  ArrowUp as DebitNoteIcon,
  Banknote,
  CreditCard as CreditCardIcon,
  Upload,
  FileSpreadsheet,
  Calculator,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus as PlusIcon,
  Equal,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import {
  PaymentWorkflowsService,
  BankAccount,
  BankStatement,
  BankStatementTransaction,
  BankReconciliation,
  PaymentMethod,
} from "@/lib/payment-workflows-service";
import { format } from "date-fns";

export default function BankReconciliationPage() {
  const [activeTab, setActiveTab] = useState("reconciliations");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Data states
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [bankStatements, setBankStatements] = useState<BankStatement[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [statementTransactions, setStatementTransactions] = useState<BankStatementTransaction[]>(
    [],
  );
  const [showStatementDetails, setShowStatementDetails] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterBankAccount, setFilterBankAccount] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const companyId = "default-company"; // In a real app, this would come from context

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [companyId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "reconciliations":
          await loadReconciliations();
          break;
        case "statements":
          await loadBankStatements();
          break;
        case "accounts":
          await loadBankAccounts();
          break;
        case "methods":
          await loadPaymentMethods();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBankAccounts = async () => {
    const result = await PaymentWorkflowsService.getBankAccounts(companyId);
    if (result.success && result.data) {
      setBankAccounts(result.data);
    }
  };

  const loadBankStatements = async () => {
    const result = await PaymentWorkflowsService.getBankStatements(undefined, companyId);
    if (result.success && result.data) {
      setBankStatements(result.data);
    }
  };

  const loadReconciliations = async () => {
    const result = await PaymentWorkflowsService.getBankReconciliations(undefined, companyId);
    if (result.success && result.data) {
      setReconciliations(result.data);
    }
  };

  const loadPaymentMethods = async () => {
    const result = await PaymentWorkflowsService.getPaymentMethods(companyId);
    if (result.success && result.data) {
      setPaymentMethods(result.data);
    }
  };

  const handleCreate = (item: any) => {
    setShowDialog(false);
    setEditingItem(null);
    loadData();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      // Implement delete logic based on type
      loadData();
    }
  };

  const handleViewStatement = async (statement: BankStatement) => {
    setSelectedStatement(statement);
    const result = await PaymentWorkflowsService.getBankStatementTransactions(statement.id);
    if (result.success && result.data) {
      setStatementTransactions(result.data);
    }
    setShowStatementDetails(true);
  };

  const handleMatchTransactions = async (statementId: string) => {
    const result = await PaymentWorkflowsService.matchBankTransactions(statementId, 0.8);
    if (result.success) {
      // Reload statement details
      if (selectedStatement) {
        handleViewStatement(selectedStatement);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, label: "Draft", color: "bg-gray-100 text-gray-800" },
      "In Progress": {
        variant: "default" as const,
        label: "In Progress",
        color: "bg-blue-100 text-blue-800",
      },
      Completed: {
        variant: "default" as const,
        label: "Completed",
        color: "bg-green-100 text-green-800",
      },
      Disputed: {
        variant: "destructive" as const,
        label: "Disputed",
        color: "bg-red-100 text-red-800",
      },
      Imported: {
        variant: "default" as const,
        label: "Imported",
        color: "bg-purple-100 text-purple-800",
      },
      Reconciled: {
        variant: "default" as const,
        label: "Reconciled",
        color: "bg-green-100 text-green-800",
      },
      Closed: { variant: "outline" as const, label: "Closed", color: "bg-gray-100 text-gray-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case "Deposit":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "Withdrawal":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case "Transfer":
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      case "Fee":
        return <Minus className="h-4 w-4 text-orange-500" />;
      case "Interest":
        return <PlusIcon className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getMatchingStatusIcon = (isMatched: boolean, confidence: number) => {
    if (isMatched) {
      if (confidence >= 0.9) {
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      } else if (confidence >= 0.7) {
        return <CheckCircle className="h-4 w-4 text-yellow-500" />;
      } else {
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      }
    }
    return <XCircle className="h-4 w-4 text-gray-400" />;
  };

  const getTotalStats = () => {
    const totalReconciliations = reconciliations.length;
    const completedReconciliations = reconciliations.filter(r => r.status === "Completed").length;
    const pendingReconciliations = reconciliations.filter(
      r => r.status === "Draft" || r.status === "In Progress",
    ).length;
    const totalDifference = reconciliations.reduce((sum, r) => sum + Math.abs(r.difference), 0);

    return {
      totalReconciliations,
      completedReconciliations,
      pendingReconciliations,
      totalDifference,
    };
  };

  const stats = getTotalStats();

  const renderReconciliations = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bank Reconciliations</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Reconciliation
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Reconciliations</p>
                <p className="text-2xl font-bold">{stats.totalReconciliations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{stats.completedReconciliations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingReconciliations}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Difference</p>
                <p className="text-2xl font-bold">${stats.totalDifference.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search reconciliations..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bank">Bank Account</Label>
              <Select value={filterBankAccount} onValueChange={setFilterBankAccount}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  {bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.account_name} - {account.bank_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="w-full"
              >
                <ArrowUpDown className="h-4 w-4 mr-2" />
                {sortOrder === "asc" ? "Ascending" : "Descending"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliations Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading reconciliations...</div>
        </div>
      ) : reconciliations.length === 0 ? (
        <div className="text-center py-8">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No reconciliations found</h3>
          <p className="text-muted-foreground mb-4">Create your first bank reconciliation</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Reconciliation
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reconciliation</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Bank Balance</TableHead>
                <TableHead>Book Balance</TableHead>
                <TableHead>Difference</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reconciliations.map(reconciliation => (
                <TableRow key={reconciliation.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {format(new Date(reconciliation.reconciliation_date), "MMM dd, yyyy")}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(reconciliation.period_start), "MMM dd")} -{" "}
                        {format(new Date(reconciliation.period_end), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {bankAccounts.find(ba => ba.id === reconciliation.bank_account_id)
                        ?.account_name || "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(reconciliation.period_start), "MMM dd")} -{" "}
                      {format(new Date(reconciliation.period_end), "MMM dd")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right font-medium">
                      ${reconciliation.bank_balance.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right font-medium">
                      ${reconciliation.book_balance.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div
                      className={`text-right font-medium ${reconciliation.difference === 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      ${reconciliation.difference.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(reconciliation.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(reconciliation)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(reconciliation)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderBankStatements = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bank Statements</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Import Statement
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading statements...</div>
        </div>
      ) : bankStatements.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No statements found</h3>
          <p className="text-muted-foreground mb-4">Import your first bank statement</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Import Statement
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Statement</TableHead>
                <TableHead>Bank Account</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead>Closing Balance</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bankStatements.map(statement => (
                <TableRow key={statement.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {statement.statement_reference || "Statement"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(statement.created_at), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {bankAccounts.find(ba => ba.id === statement.bank_account_id)?.account_name ||
                        "Unknown"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(statement.statement_date), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right font-medium">
                      ${statement.opening_balance.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right font-medium">
                      ${statement.closing_balance.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">{statement.transaction_count}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(statement.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewStatement(statement)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMatchTransactions(statement.id)}
                      >
                        <Calculator className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderBankAccounts = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bank Accounts</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading accounts...</div>
        </div>
      ) : bankAccounts.length === 0 ? (
        <div className="text-center py-8">
          <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No bank accounts found</h3>
          <p className="text-muted-foreground mb-4">Add your first bank account</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bank Account
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bankAccounts.map(account => (
            <Card key={account.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{account.account_name}</CardTitle>
                  <div className="flex space-x-2">
                    {account.is_primary && <Badge variant="default">Primary</Badge>}
                    {getStatusBadge(account.is_active ? "Active" : "Inactive")}
                  </div>
                </div>
                <CardDescription>{account.bank_name}</CardDescription>
                <Badge variant="outline" className="w-fit">
                  {account.account_type}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Account Number:</span>
                    <span className="font-mono">****{account.account_number.slice(-4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Currency:</span>
                    <span>{account.currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Balance:</span>
                    <span className="font-medium">${account.current_balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integration:</span>
                    <span>{account.integration_type}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(account)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(account.id, "account")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading methods...</div>
        </div>
      ) : paymentMethods.length === 0 ? (
        <div className="text-center py-8">
          <CreditCardIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No payment methods found</h3>
          <p className="text-muted-foreground mb-4">Add your first payment method</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map(method => (
            <Card key={method.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{method.name}</CardTitle>
                  {getStatusBadge(method.is_active ? "Active" : "Inactive")}
                </div>
                <CardDescription>{method.description}</CardDescription>
                <Badge variant="outline" className="w-fit">
                  {method.payment_type}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Requires Reference:</span>
                    <span>{method.requires_reference ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requires Approval:</span>
                    <span>{method.requires_approval ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approval Threshold:</span>
                    <span>${method.approval_threshold.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Integration:</span>
                    <span>{method.integration_type}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(method.id, "method")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Banknote className="h-8 w-8 text-primary" />
            <span>Bank Reconciliation</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced payment workflows and bank reconciliation system
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="reconciliations">Reconciliations</TabsTrigger>
          <TabsTrigger value="statements">Bank Statements</TabsTrigger>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliations" className="space-y-4">
          {renderReconciliations()}
        </TabsContent>

        <TabsContent value="statements" className="space-y-4">
          {renderBankStatements()}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {renderBankAccounts()}
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          {renderPaymentMethods()}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update item information" : "Enter item details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-8">
              <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Form Component</h3>
              <p className="text-muted-foreground">
                The form component for {activeTab} will be implemented here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Statement Details Dialog */}
      <Dialog open={showStatementDetails} onOpenChange={setShowStatementDetails}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Bank Statement Details - {selectedStatement?.statement_reference || "Statement"}
            </DialogTitle>
            <DialogDescription>View and manage bank statement transactions</DialogDescription>
          </DialogHeader>

          {selectedStatement && (
            <div className="space-y-6">
              {/* Statement Header */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statement Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Statement Date:</span>
                      <span>
                        {format(new Date(selectedStatement.statement_date), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Opening Balance:</span>
                      <span className="font-medium">
                        ${selectedStatement.opening_balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Closing Balance:</span>
                      <span className="font-medium">
                        ${selectedStatement.closing_balance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Transaction Count:</span>
                      <span className="font-medium">{selectedStatement.transaction_count}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Debits:</span>
                      <span className="font-medium text-red-600">
                        ${selectedStatement.total_debits.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Credits:</span>
                      <span className="font-medium text-green-600">
                        ${selectedStatement.total_credits.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Change:</span>
                      <span className="font-medium">
                        $
                        {(
                          selectedStatement.closing_balance - selectedStatement.opening_balance
                        ).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => handleMatchTransactions(selectedStatement.id)}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Auto Match
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Upload className="h-4 w-4 mr-2" />
                      Import More
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Transactions Table */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Match Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statementTransactions.map(transaction => (
                          <TableRow key={transaction.id}>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(transaction.transaction_date), "MMM dd, yyyy")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate">{transaction.description}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm text-muted-foreground">
                                {transaction.reference || "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getTransactionTypeIcon(transaction.transaction_type)}
                                <span className="text-sm">{transaction.transaction_type}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-right">
                                {transaction.debit_amount > 0 ? (
                                  <span className="text-red-600 font-medium">
                                    -${transaction.debit_amount.toFixed(2)}
                                  </span>
                                ) : (
                                  <span className="text-green-600 font-medium">
                                    +${transaction.credit_amount.toFixed(2)}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getMatchingStatusIcon(
                                  transaction.is_matched,
                                  transaction.matching_confidence,
                                )}
                                <span className="text-sm">
                                  {transaction.is_matched ? "Matched" : "Unmatched"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
