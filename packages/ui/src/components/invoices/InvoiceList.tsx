import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  Download,
  Calendar,
  DollarSign,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { cn } from "@aibos/ui/utils";

export interface Invoice {
  id: string;
  number: string;
  customerName: string;
  customerEmail: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: "draft" | "sent" | "paid" | "overdue";
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceListProps {
  className?: string;
  invoices?: Invoice[];
  onInvoiceSelect?: (invoice: Invoice) => void;
  onInvoiceEdit?: (invoice: Invoice) => void;
  onInvoiceSend?: (invoice: Invoice) => void;
  onInvoiceDownload?: (invoice: Invoice) => void;
  isLoading?: boolean;
}

const statusConfig = {
  draft: {
    label: "Draft",
    icon: FileText,
    color: "text-sys-text-tertiary bg-sys-fill-low",
    dotColor: "bg-sys-text-tertiary",
  },
  sent: {
    label: "Sent",
    icon: Clock,
    color: "text-sys-status-info bg-sys-status-info/10",
    dotColor: "bg-sys-status-info",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle,
    color: "text-sys-status-success bg-sys-status-success/10",
    dotColor: "bg-sys-status-success",
  },
  overdue: {
    label: "Overdue",
    icon: AlertCircle,
    color: "text-sys-status-error bg-sys-status-error/10",
    dotColor: "bg-sys-status-error",
  },
};

export const InvoiceList: React.FC<InvoiceListProps> = ({
  className,
  invoices = [],
  onInvoiceSelect,
  onInvoiceEdit,
  onInvoiceSend,
  onInvoiceDownload,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

  // Mock data for demonstration
  const mockInvoices: Invoice[] = [
    {
      id: "1",
      number: "INV-2024-001",
      customerName: "Acme Corporation",
      customerEmail: "billing@acme.com",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      amount: 2500.0,
      status: "sent",
      createdAt: "2024-01-15T10:30:00Z",
      updatedAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      number: "INV-2024-002",
      customerName: "Tech Solutions Ltd",
      customerEmail: "accounts@techsolutions.com",
      issueDate: "2024-01-16",
      dueDate: "2024-02-16",
      amount: 1800.0,
      status: "paid",
      createdAt: "2024-01-16T14:20:00Z",
      updatedAt: "2024-01-16T14:20:00Z",
    },
    {
      id: "3",
      number: "INV-2024-003",
      customerName: "Global Enterprises",
      customerEmail: "finance@global.com",
      issueDate: "2024-01-10",
      dueDate: "2024-02-10",
      amount: 3200.0,
      status: "overdue",
      createdAt: "2024-01-10T09:15:00Z",
      updatedAt: "2024-01-10T09:15:00Z",
    },
    {
      id: "4",
      number: "INV-2024-004",
      customerName: "Startup Inc",
      customerEmail: "billing@startup.com",
      issueDate: "2024-01-20",
      dueDate: "2024-02-20",
      amount: 950.0,
      status: "draft",
      createdAt: "2024-01-20T16:45:00Z",
      updatedAt: "2024-01-20T16:45:00Z",
    },
  ];

  const displayInvoices = invoices.length > 0 ? invoices : mockInvoices;

  // Filter and sort invoices
  const filteredInvoices = displayInvoices
    .filter(invoice => {
      const matchesSearch =
        invoice.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue: any = a[sortBy as keyof Invoice];
      let bValue: any = b[sortBy as keyof Invoice];

      if (sortBy === "amount") {
        aValue = a.amount;
        bValue = b.amount;
      } else if (sortBy === "issueDate" || sortBy === "dueDate") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const handleSelectAll = () => {
    if (selectedInvoices.size === filteredInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(filteredInvoices.map(invoice => invoice.id)));
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(invoiceId)) {
      newSelected.delete(invoiceId);
    } else {
      newSelected.add(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-sys-fill-low rounded w-32"></div>
                <div className="h-3 bg-sys-fill-low rounded w-48"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-sys-fill-low rounded w-20"></div>
                <div className="h-3 bg-sys-fill-low rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sys-text-primary">Invoices</h1>
          <p className="text-sys-text-secondary mt-1">
            {filteredInvoices.length} of {displayInvoices.length} invoices
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <label htmlFor="invoice-search" className="sr-only">
                Search invoices
              </label>
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary"
                aria-hidden="true"
              />
              <input
                id="invoice-search"
                type="search"
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input pl-10 w-full"
                aria-label="Search invoices by number, customer name, or email"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
              <label htmlFor="status-filter" className="text-sm font-medium text-sys-text-primary">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="input min-w-32"
                aria-label="Filter invoices by status"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label htmlFor="sort-by" className="text-sm font-medium text-sys-text-primary">
                Sort by:
              </label>
              <select
                id="sort-by"
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="input min-w-32"
                aria-label="Sort invoices"
              >
                <option value="createdAt">Date Created</option>
                <option value="issueDate">Issue Date</option>
                <option value="dueDate">Due Date</option>
                <option value="amount">Amount</option>
                <option value="customerName">Customer</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                className="btn btn-ghost p-2"
                aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-2">
        {filteredInvoices.length === 0 ? (
          <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-12 text-center">
            <FileText
              className="h-12 w-12 text-sys-text-tertiary mx-auto mb-4"
              aria-hidden="true"
            />
            <h3 className="text-lg font-medium text-sys-text-primary mb-2">No invoices found</h3>
            <p className="text-sys-text-secondary">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Create your first invoice to get started"}
            </p>
          </div>
        ) : (
          <>
            {/* Select All */}
            <div className="flex items-center space-x-3 p-4 bg-sys-bg-subtle border border-sys-border-hairline rounded-lg">
              <input
                type="checkbox"
                checked={
                  selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0
                }
                onChange={handleSelectAll}
                className="rounded border-sys-border-hairline text-brand-primary focus:ring-brand-primary"
                aria-label="Select all invoices"
              />
              <span className="text-sm text-sys-text-secondary">
                {selectedInvoices.size > 0
                  ? `${selectedInvoices.size} selected`
                  : "Select all invoices"}
              </span>
            </div>

            {/* Invoice Items */}
            {filteredInvoices.map(invoice => {
              const status = statusConfig[invoice.status];
              const StatusIcon = status.icon;
              const daysUntilDue = getDaysUntilDue(invoice.dueDate);
              const isOverdue = daysUntilDue < 0 && invoice.status !== "paid";

              return (
                <div
                  key={invoice.id}
                  className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 hover:border-sys-border-medium transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={() => handleSelectInvoice(invoice.id)}
                        className="rounded border-sys-border-hairline text-brand-primary focus:ring-brand-primary"
                        aria-label={`Select invoice ${invoice.number}`}
                      />

                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-sys-text-primary">
                            {invoice.number}
                          </span>
                          <span className="text-sm text-sys-text-secondary">
                            {invoice.customerName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right">
                        <div className="font-semibold text-sys-text-primary">
                          {formatCurrency(invoice.amount)}
                        </div>
                        <div className="text-sm text-sys-text-secondary">
                          Due {formatDate(invoice.dueDate)}
                          {isOverdue && (
                            <span className="ml-2 text-sys-status-error">
                              ({Math.abs(daysUntilDue)} days overdue)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={cn(
                            "px-2 py-1 text-xs font-medium rounded-md flex items-center space-x-1",
                            status.color,
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", status.dotColor)}></div>
                          <span>{status.label}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onInvoiceSelect?.(invoice)}
                          className="btn btn-ghost p-2"
                          aria-label={`View invoice ${invoice.number}`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          onClick={() => onInvoiceEdit?.(invoice)}
                          className="btn btn-ghost p-2"
                          aria-label={`Edit invoice ${invoice.number}`}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </button>

                        {invoice.status === "draft" && (
                          <button
                            onClick={() => onInvoiceSend?.(invoice)}
                            className="btn btn-ghost p-2"
                            aria-label={`Send invoice ${invoice.number}`}
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}

                        <button
                          onClick={() => onInvoiceDownload?.(invoice)}
                          className="btn btn-ghost p-2"
                          aria-label={`Download invoice ${invoice.number}`}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </button>

                        <button
                          className="btn btn-ghost p-2"
                          aria-label={`More options for invoice ${invoice.number}`}
                        >
                          <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};
