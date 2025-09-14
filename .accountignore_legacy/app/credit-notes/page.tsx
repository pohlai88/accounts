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
  RotateCcw as CreditNoteIcon,
} from "lucide-react";
import { EnhancedInvoiceService, EnhancedInvoice } from "@/lib/enhanced-invoice-service";
import { format } from "date-fns";

export default function CreditNotesPage() {
  const [creditNotes, setCreditNotes] = useState<EnhancedInvoice[]>([]);
  const [filteredCreditNotes, setFilteredCreditNotes] = useState<EnhancedInvoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false);
  const [editingCreditNote, setEditingCreditNote] = useState<EnhancedInvoice | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCreditNote, setSelectedCreditNote] = useState<EnhancedInvoice | null>(null);
  const [showCreditNoteDetails, setShowCreditNoteDetails] = useState(false);

  const companyId = "default-company"; // In a real app, this would come from context

  // Load credit notes on component mount
  useEffect(() => {
    loadCreditNotes();
  }, [companyId]);

  // Filter and sort credit notes
  useEffect(() => {
    let filtered = [...creditNotes];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        creditNote =>
          creditNote.invoice_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          creditNote.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          creditNote.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(creditNote => creditNote.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy as keyof EnhancedInvoice];
      const bValue = b[sortBy as keyof EnhancedInvoice];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    setFilteredCreditNotes(filtered);
  }, [creditNotes, searchTerm, filterStatus, sortBy, sortOrder]);

  const loadCreditNotes = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would come from API
      const mockCreditNotes: EnhancedInvoice[] = [
        {
          id: "1",
          invoice_no: "CN-000001",
          invoice_type: "Credit Note",
          customer_name: "ABC Corporation",
          invoice_date: "2024-01-15",
          due_date: "2024-02-14",
          posting_date: "2024-01-15",
          currency: "USD",
          exchange_rate: 1.0,
          net_total: -500.0,
          tax_total: -50.0,
          grand_total: -550.0,
          paid_amount: 0.0,
          outstanding_amount: -550.0,
          status: "Draft",
          is_paid: false,
          is_return: true,
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
          invoice_no: "CN-000002",
          invoice_type: "Credit Note",
          customer_name: "XYZ Limited",
          invoice_date: "2024-01-16",
          due_date: "2024-02-15",
          posting_date: "2024-01-16",
          currency: "USD",
          exchange_rate: 1.0,
          net_total: -1000.0,
          tax_total: -100.0,
          grand_total: -1100.0,
          paid_amount: -1100.0,
          outstanding_amount: 0.0,
          status: "Paid",
          is_paid: true,
          is_return: true,
          company_id: companyId,
          created_at: "2024-01-16T10:00:00Z",
          updated_at: "2024-01-16T10:00:00Z",
          workflow_states: [],
          comments: [],
          attachments: [],
          email_logs: [],
        },
      ];
      setCreditNotes(mockCreditNotes);
    } catch (error) {
      console.error("Error loading credit notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCreditNote = (creditNote: EnhancedInvoice) => {
    setCreditNotes(prev => [creditNote, ...prev]);
    setShowCreditNoteDialog(false);
  };

  const handleUpdateCreditNote = (updatedCreditNote: EnhancedInvoice) => {
    setCreditNotes(prev =>
      prev.map(cn => (cn.id === updatedCreditNote.id ? updatedCreditNote : cn)),
    );
    setShowCreditNoteDialog(false);
    setEditingCreditNote(null);
  };

  const handleDeleteCreditNote = async (id: string) => {
    if (confirm("Are you sure you want to delete this credit note?")) {
      setCreditNotes(prev => prev.filter(cn => cn.id !== id));
    }
  };

  const handleViewCreditNote = async (creditNote: EnhancedInvoice) => {
    setSelectedCreditNote(creditNote);
    setShowCreditNoteDetails(true);
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

  const getTotalStats = () => {
    const totalCreditNotes = creditNotes.length;
    const totalAmount = creditNotes.reduce((sum, cn) => sum + Math.abs(cn.grand_total), 0);
    const outstandingAmount = creditNotes.reduce(
      (sum, cn) => sum + Math.abs(cn.outstanding_amount),
      0,
    );
    const paidAmount = creditNotes.reduce((sum, cn) => sum + Math.abs(cn.paid_amount), 0);

    return { totalCreditNotes, totalAmount, outstandingAmount, paidAmount };
  };

  const stats = getTotalStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <CreditNoteIcon className="h-8 w-8 text-primary" />
            <span>Credit Notes</span>
          </h1>
          <p className="text-muted-foreground mt-2">Manage credit notes and customer refunds</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadCreditNotes}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingCreditNote(null);
              setShowCreditNoteDialog(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Credit Note
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CreditNoteIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Credit Notes</p>
                <p className="text-2xl font-bold">{stats.totalCreditNotes}</p>
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
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Outstanding</p>
                <p className="text-2xl font-bold">${stats.outstandingAmount.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Paid Amount</p>
                <p className="text-2xl font-bold">${stats.paidAmount.toFixed(2)}</p>
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
                  placeholder="Search credit notes..."
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
              <Label htmlFor="sort">Sort By</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="invoice_date">Credit Note Date</SelectItem>
                  <SelectItem value="due_date">Due Date</SelectItem>
                  <SelectItem value="grand_total">Amount</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
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

      {/* Credit Notes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Credit Notes</CardTitle>
          <CardDescription>{filteredCreditNotes.length} credit notes found</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading credit notes...</div>
            </div>
          ) : filteredCreditNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CreditNoteIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No credit notes found</h3>
              <p className="text-muted-foreground text-center mb-4">
                Get started by creating your first credit note
              </p>
              <Button onClick={() => setShowCreditNoteDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Credit Note
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credit Note</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Workflow</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCreditNotes.map(creditNote => (
                    <TableRow key={creditNote.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getWorkflowStatusIcon(creditNote.status)}
                          </div>
                          <div>
                            <div className="font-medium">{creditNote.invoice_no}</div>
                            <div className="text-sm text-muted-foreground">
                              {format(new Date(creditNote.created_at), "MMM dd, yyyy")}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {creditNote.customer_name || creditNote.supplier_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {creditNote.currency} {Math.abs(creditNote.grand_total).toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>
                            Credit Note: {format(new Date(creditNote.invoice_date), "MMM dd, yyyy")}
                          </div>
                          <div className="text-muted-foreground">
                            Due: {format(new Date(creditNote.due_date), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-right">
                          <div className="font-medium text-red-600">
                            {creditNote.currency} {creditNote.grand_total.toFixed(2)}
                          </div>
                          {creditNote.outstanding_amount !== 0 && (
                            <div className="text-xs text-muted-foreground">
                              Outstanding: {creditNote.currency}{" "}
                              {creditNote.outstanding_amount.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(creditNote.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Workflow className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {creditNote.workflow_states?.length || 0} states
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCreditNote(creditNote)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCreditNote(creditNote);
                              setShowCreditNoteDialog(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCreditNote(creditNote.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Credit Note Dialog */}
      <Dialog open={showCreditNoteDialog} onOpenChange={setShowCreditNoteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCreditNote ? "Edit Credit Note" : "Create Credit Note"}
            </DialogTitle>
            <DialogDescription>
              {editingCreditNote
                ? "Update credit note information"
                : "Enter credit note details for customer refund or adjustment"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-8">
              <CreditNoteIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Credit Note Form</h3>
              <p className="text-muted-foreground">
                The credit note form component will be implemented here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Credit Note Details Dialog */}
      <Dialog open={showCreditNoteDetails} onOpenChange={setShowCreditNoteDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Credit Note Details - {selectedCreditNote?.invoice_no}</DialogTitle>
            <DialogDescription>
              View and manage credit note details with workflow states
            </DialogDescription>
          </DialogHeader>

          {selectedCreditNote && (
            <div className="space-y-6">
              {/* Credit Note Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Credit Note Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Credit Note No:</span>
                      <span className="font-medium">{selectedCreditNote.invoice_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="text-red-600 font-medium">Credit Note</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span>
                        {format(new Date(selectedCreditNote.invoice_date), "MMM dd, yyyy")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due Date:</span>
                      <span>{format(new Date(selectedCreditNote.due_date), "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span>{getStatusBadge(selectedCreditNote.status)}</span>
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
                      <span className="font-medium text-red-600">
                        {selectedCreditNote.currency} {selectedCreditNote.net_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Total:</span>
                      <span className="font-medium text-red-600">
                        {selectedCreditNote.currency} {selectedCreditNote.tax_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Grand Total:</span>
                      <span className="font-medium text-red-600">
                        {selectedCreditNote.currency} {selectedCreditNote.grand_total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Amount:</span>
                      <span className="font-medium text-red-600">
                        {selectedCreditNote.currency} {selectedCreditNote.paid_amount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outstanding:</span>
                      <span className="font-medium text-red-600">
                        {selectedCreditNote.currency}{" "}
                        {selectedCreditNote.outstanding_amount.toFixed(2)}
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
                    {selectedCreditNote.workflow_states?.map((state, index) => (
                      <div key={state.id} className="flex items-center space-x-2">
                        <div className="flex items-center space-x-2">
                          {getWorkflowStatusIcon(state.state_type)}
                          <span className="text-sm">{state.state_name}</span>
                        </div>
                        {index < (selectedCreditNote.workflow_states?.length || 0) - 1 && (
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
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
                    {selectedCreditNote.comments?.map(comment => (
                      <div key={comment.id} className="border-l-4 border-red-500 pl-4">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
