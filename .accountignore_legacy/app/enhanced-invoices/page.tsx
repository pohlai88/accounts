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
} from "lucide-react";
import {
  EnhancedInvoiceService,
  EnhancedInvoice,
  InvoiceTemplate,
  InvoiceWorkflow,
  InvoiceWorkflowState,
  InvoiceComment,
  InvoiceAttachment,
} from "@/lib/enhanced-invoice-service";
import { format } from "date-fns";

export default function EnhancedInvoicesPage() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Data states
  const [invoices, setInvoices] = useState<EnhancedInvoice[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [workflows, setWorkflows] = useState<InvoiceWorkflow[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<EnhancedInvoice | null>(null);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
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
        case "invoices":
          await loadInvoices();
          break;
        case "templates":
          await loadTemplates();
          break;
        case "workflows":
          await loadWorkflows();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async () => {
    // Mock data - in real app, this would come from API
    const mockInvoices: EnhancedInvoice[] = [
      {
        id: "1",
        invoice_no: "SI-000001",
        invoice_type: "Sales",
        customer_name: "ABC Corporation",
        invoice_date: "2024-01-15",
        due_date: "2024-02-14",
        posting_date: "2024-01-15",
        currency: "USD",
        exchange_rate: 1.0,
        net_total: 1000.0,
        tax_total: 100.0,
        grand_total: 1100.0,
        paid_amount: 0.0,
        outstanding_amount: 1100.0,
        status: "Draft",
        is_paid: false,
        is_return: false,
        company_id: companyId,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z",
        workflow_states: [],
        comments: [],
        attachments: [],
        email_logs: [],
      },
      {
        id: "2",
        invoice_no: "SI-000002",
        invoice_type: "Sales",
        customer_name: "XYZ Limited",
        invoice_date: "2024-01-16",
        due_date: "2024-02-15",
        posting_date: "2024-01-16",
        currency: "USD",
        exchange_rate: 1.0,
        net_total: 2500.0,
        tax_total: 250.0,
        grand_total: 2750.0,
        paid_amount: 2750.0,
        outstanding_amount: 0.0,
        status: "Paid",
        is_paid: true,
        is_return: false,
        company_id: companyId,
        created_at: "2024-01-16T10:00:00Z",
        updated_at: "2024-01-16T10:00:00Z",
        workflow_states: [],
        comments: [],
        attachments: [],
        email_logs: [],
      },
    ];
    setInvoices(mockInvoices);
  };

  const loadTemplates = async () => {
    const result = await EnhancedInvoiceService.getInvoiceTemplates(companyId);
    if (result.success && result.data) {
      setTemplates(result.data);
    }
  };

  const loadWorkflows = async () => {
    const result = await EnhancedInvoiceService.getInvoiceWorkflows(companyId);
    if (result.success && result.data) {
      setWorkflows(result.data);
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

  const handleViewInvoice = async (invoice: EnhancedInvoice) => {
    setSelectedInvoice(invoice);
    setShowInvoiceDetails(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, label: "Draft", color: "bg-gray-100 text-gray-800" },
      Submitted: {
        variant: "default" as const,
        label: "Submitted",
        color: "bg-blue-100 text-blue-800",
      },
      Approved: {
        variant: "default" as const,
        label: "Approved",
        color: "bg-green-100 text-green-800",
      },
      Paid: { variant: "default" as const, label: "Paid", color: "bg-green-100 text-green-800" },
      Overdue: {
        variant: "destructive" as const,
        label: "Overdue",
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

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      Sales: { variant: "default" as const, label: "Sales", color: "bg-blue-100 text-blue-800" },
      Purchase: {
        variant: "secondary" as const,
        label: "Purchase",
        color: "bg-green-100 text-green-800",
      },
      "Credit Note": {
        variant: "outline" as const,
        label: "Credit Note",
        color: "bg-purple-100 text-purple-800",
      },
      "Debit Note": {
        variant: "outline" as const,
        label: "Debit Note",
        color: "bg-orange-100 text-orange-800",
      },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.Sales;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getWorkflowStatusIcon = (status: string) => {
    switch (status) {
      case "Draft":
        return <Edit className="h-4 w-4 text-gray-500" />;
      case "Submitted":
        return <Send className="h-4 w-4 text-blue-500" />;
      case "Approved":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Paid":
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case "Overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderInvoices = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Enhanced Invoices</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={loadInvoices}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
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
                  placeholder="Search invoices..."
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
                  <SelectItem value="Submitted">Submitted</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
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
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Purchase">Purchase</SelectItem>
                  <SelectItem value="Credit Note">Credit Note</SelectItem>
                  <SelectItem value="Debit Note">Debit Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="invoice_date">Invoice Date</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="grand_total">Amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading invoices...</div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No invoices found</h3>
          <p className="text-muted-foreground mb-4">Create your first enhanced invoice</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer/Supplier</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map(invoice => (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">{getWorkflowStatusIcon(invoice.status)}</div>
                      <div>
                        <div className="font-medium">{invoice.invoice_no}</div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(invoice.created_at), "MMM dd, yyyy")}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(invoice.invoice_type)}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {invoice.customer_name || invoice.supplier_name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {invoice.currency} {invoice.grand_total.toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>Invoice: {format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</div>
                      <div className="text-muted-foreground">
                        Due: {format(new Date(invoice.due_date), "MMM dd, yyyy")}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">
                        {invoice.currency} {invoice.grand_total.toFixed(2)}
                      </div>
                      {invoice.outstanding_amount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Outstanding: {invoice.currency} {invoice.outstanding_amount.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Workflow className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {invoice.workflow_states?.length || 0} states
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEdit(invoice)}>
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

  const renderTemplates = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Invoice Templates</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8">
          <Template className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">Create your first invoice template</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex space-x-2">
                    {template.is_default && <Badge variant="default">Default</Badge>}
                    {getStatusBadge(template.is_active ? "Active" : "Inactive")}
                  </div>
                </div>
                <CardDescription>{template.description}</CardDescription>
                <Badge variant="outline" className="w-fit">
                  {template.template_type}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Currency:</span>
                    <span>{template.default_currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Due Days:</span>
                    <span>{template.default_due_days}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Font:</span>
                    <span>
                      {template.font_family} {template.font_size}px
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id, "template")}
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

  const renderWorkflows = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Invoice Workflows</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Workflow
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading workflows...</div>
        </div>
      ) : workflows.length === 0 ? (
        <div className="text-center py-8">
          <Workflow className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No workflows found</h3>
          <p className="text-muted-foreground mb-4">Create your first invoice workflow</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Workflow
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map(workflow => (
            <Card key={workflow.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{workflow.name}</CardTitle>
                  {getStatusBadge(workflow.is_active ? "Active" : "Inactive")}
                </div>
                <CardDescription>{workflow.description}</CardDescription>
                <Badge variant="outline" className="w-fit">
                  {workflow.workflow_type}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Auto Submit:</span>
                    <span>{workflow.auto_submit ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Require Approval:</span>
                    <span>{workflow.require_approval ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Approval Threshold:</span>
                    <span>${workflow.approval_threshold.toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(workflow)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(workflow.id, "workflow")}
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
            <FileText className="h-8 w-8 text-primary" />
            <span>Enhanced Invoices</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced invoice management with workflows, templates, and automation
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          {renderInvoices()}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {renderTemplates()}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {renderWorkflows()}
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
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Form Component</h3>
              <p className="text-muted-foreground">
                The form component for {activeTab} will be implemented here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoice Details Dialog */}
      <Dialog open={showInvoiceDetails} onOpenChange={setShowInvoiceDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details - {selectedInvoice?.invoice_no}</DialogTitle>
            <DialogDescription>
              View and manage invoice details with workflow states
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Invoice Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Invoice No:</span>
                      <span className="font-medium">{selectedInvoice.invoice_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span>{getTypeBadge(selectedInvoice.invoice_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>{format(new Date(selectedInvoice.invoice_date), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>{format(new Date(selectedInvoice.due_date), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{getStatusBadge(selectedInvoice.status)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Financial Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Net Total:</span>
                      <span className="font-medium">
                        {selectedInvoice.currency} {selectedInvoice.net_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Total:</span>
                      <span className="font-medium">
                        {selectedInvoice.currency} {selectedInvoice.tax_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grand Total:</span>
                      <span className="font-medium text-primary">
                        {selectedInvoice.currency} {selectedInvoice.grand_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="font-medium">
                        {selectedInvoice.currency} {selectedInvoice.paid_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding:</span>
                      <span className="font-medium">
                        {selectedInvoice.currency} {selectedInvoice.outstanding_amount.toFixed(2)}
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
                    {selectedInvoice.workflow_states?.map((state, index) => (
                      <div key={state.id} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          {getWorkflowStatusIcon(state.state_type)}
                          <span className="text-sm">{state.state_name}</span>
                        </div>
                        {index < (selectedInvoice.workflow_states?.length || 0) - 1 && (
                          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedInvoice.comments?.map(comment => (
                      <div key={comment.id} className="border-l-4 border-primary pl-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm">{comment.comment}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {comment.user_name} •{" "}
                              {format(new Date(comment.created_at), "MMM dd, yyyy HH:mm")}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {comment.comment_type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attachments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedInvoice.attachments?.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center space-x-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{attachment.file_name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(attachment.file_size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
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
