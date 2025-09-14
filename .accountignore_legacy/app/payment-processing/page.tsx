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
  Template,
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
  Wallet,
  HandCoins,
  Receipt as ReceiptIcon,
  QrCode,
  Smartphone,
  Laptop,
  Monitor,
} from "lucide-react";
import {
  PaymentWorkflowsService,
  BankAccount,
  PaymentMethod,
} from "@/lib/payment-workflows-service";
import { format } from "date-fns";

export default function PaymentProcessingPage() {
  const [activeTab, setActiveTab] = useState("payments");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Data states
  const [payments, setPayments] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
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
        case "payments":
          await loadPayments();
          break;
        case "methods":
          await loadPaymentMethods();
          break;
        case "accounts":
          await loadBankAccounts();
          break;
        case "workflows":
          await loadPaymentWorkflows();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayments = async () => {
    // Mock data - in real app, this would come from API
    const mockPayments = [
      {
        id: "1",
        payment_no: "PAY-000001",
        payment_type: "Received",
        party_name: "ABC Corporation",
        amount: 1500.0,
        currency: "USD",
        payment_date: "2024-01-15",
        payment_method: "Bank Transfer",
        bank_account: "Main Checking",
        status: "Completed",
        reference: "INV-001",
        created_at: "2024-01-15T10:00:00Z",
        workflow_states: [],
      },
      {
        id: "2",
        payment_no: "PAY-000002",
        payment_type: "Paid",
        party_name: "XYZ Supplier",
        amount: 750.0,
        currency: "USD",
        payment_date: "2024-01-16",
        payment_method: "Check",
        bank_account: "Main Checking",
        status: "Pending",
        reference: "PO-002",
        created_at: "2024-01-16T10:00:00Z",
        workflow_states: [],
      },
    ];
    setPayments(mockPayments);
  };

  const loadBankAccounts = async () => {
    const result = await PaymentWorkflowsService.getBankAccounts(companyId);
    if (result.success && result.data) {
      setBankAccounts(result.data);
    }
  };

  const loadPaymentMethods = async () => {
    const result = await PaymentWorkflowsService.getPaymentMethods(companyId);
    if (result.success && result.data) {
      setPaymentMethods(result.data);
    }
  };

  const loadPaymentWorkflows = async () => {
    // Mock data for payment workflows
    setPayments([]);
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

  const handleViewPayment = async (payment: any) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, label: "Draft", color: "bg-gray-100 text-gray-800" },
      Pending: {
        variant: "default" as const,
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
      },
      Processing: {
        variant: "default" as const,
        label: "Processing",
        color: "bg-blue-100 text-blue-800",
      },
      Completed: {
        variant: "default" as const,
        label: "Completed",
        color: "bg-green-100 text-green-800",
      },
      Failed: {
        variant: "destructive" as const,
        label: "Failed",
        color: "bg-red-100 text-red-800",
      },
      Cancelled: {
        variant: "outline" as const,
        label: "Cancelled",
        color: "bg-gray-100 text-gray-800",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case "Received":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case "Paid":
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      case "Transfer":
        return <ArrowRight className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Cash":
        return <HandCoins className="h-4 w-4 text-green-500" />;
      case "Check":
        return <ReceiptIcon className="h-4 w-4 text-blue-500" />;
      case "Credit Card":
        return <CreditCardIcon className="h-4 w-4 text-purple-500" />;
      case "Bank Transfer":
        return <Banknote className="h-4 w-4 text-blue-500" />;
      case "Wire Transfer":
        return <ArrowRight className="h-4 w-4 text-orange-500" />;
      case "ACH":
        return <Activity className="h-4 w-4 text-indigo-500" />;
      case "PayPal":
        return <Wallet className="h-4 w-4 text-yellow-500" />;
      case "Stripe":
        return <CreditCardIcon className="h-4 w-4 text-indigo-500" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTotalStats = () => {
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const completedPayments = payments.filter(p => p.status === "Completed").length;
    const pendingPayments = payments.filter(p => p.status === "Pending").length;

    return { totalPayments, totalAmount, completedPayments, pendingPayments };
  };

  const stats = getTotalStats();

  const renderPayments = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Processing</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadPayments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Payments</p>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Amount</p>
                <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
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
                <p className="text-2xl font-bold">{stats.completedPayments}</p>
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
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search payments..."
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
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Processing">Processing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Received">Received</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="method">Method</Label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name}
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

      {/* Payments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading payments...</div>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8">
          <ReceiptIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No payments found</h3>
          <p className="text-muted-foreground mb-4">Create your first payment</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Party</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map(payment => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getPaymentTypeIcon(payment.payment_type)}
                      </div>
                      <div>
                        <div className="font-medium">{payment.payment_no}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(payment.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        payment.payment_type === "Received"
                          ? "text-green-600 border-green-200"
                          : payment.payment_type === "Paid"
                            ? "text-red-600 border-red-200"
                            : "text-blue-600 border-blue-200"
                      }
                    >
                      {payment.payment_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.party_name}</div>
                      <div className="text-sm text-muted-foreground">{payment.reference}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">
                        {payment.currency} {payment.amount.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getPaymentMethodIcon(payment.payment_method)}
                      <span className="text-sm">{payment.payment_method}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(payment.payment_date), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(payment.status)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPayment(payment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(payment)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Send className="h-4 w-4" />
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

  const renderPaymentMethods = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Methods</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Method
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
            Add Method
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paymentMethods.map(method => (
            <Card key={method.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    {getPaymentMethodIcon(method.payment_type)}
                    <span>{method.name}</span>
                  </CardTitle>
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

  const renderBankAccounts = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Bank Accounts</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
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
            Add Account
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

  const renderPaymentWorkflows = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Payment Workflows</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </div>

      <div className="text-center py-8">
        <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Payment Workflows</h3>
        <p className="text-muted-foreground mb-4">Configure automated payment workflows</p>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <ReceiptIcon className="h-8 w-8 text-primary" />
            <span>Payment Processing</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced payment processing with workflows and automation
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
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="accounts">Bank Accounts</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="payments" className="space-y-4">
          {renderPayments()}
        </TabsContent>

        <TabsContent value="methods" className="space-y-4">
          {renderPaymentMethods()}
        </TabsContent>

        <TabsContent value="accounts" className="space-y-4">
          {renderBankAccounts()}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {renderPaymentWorkflows()}
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
              <ReceiptIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Form Component</h3>
              <p className="text-muted-foreground">
                The form component for {activeTab} will be implemented here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Details Dialog */}
      <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payment Details - {selectedPayment?.payment_no}</DialogTitle>
            <DialogDescription>
              View and manage payment details with workflow states
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-6">
              {/* Payment Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Payment No:</span>
                      <span className="font-medium">{selectedPayment.payment_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="font-medium">{selectedPayment.payment_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Party:</span>
                      <span className="font-medium">{selectedPayment.party_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">
                        {selectedPayment.currency} {selectedPayment.amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{format(new Date(selectedPayment.payment_date), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{getStatusBadge(selectedPayment.status)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Method:</span>
                      <span className="font-medium">{selectedPayment.payment_method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bank Account:</span>
                      <span className="font-medium">{selectedPayment.bank_account}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Reference:</span>
                      <span className="font-medium">{selectedPayment.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>
                        {format(new Date(selectedPayment.created_at), "MMM dd, yyyy HH:mm")}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Workflow States */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workflow States</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    {selectedPayment.workflow_states?.map((state: any, index: number) => (
                      <div key={state.id} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          {getPaymentTypeIcon(state.state_type)}
                          <span className="text-sm">{state.state_name}</span>
                        </div>
                        {index < (selectedPayment.workflow_states?.length || 0) - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
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
