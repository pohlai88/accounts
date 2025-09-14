/**
 * Portal Dashboard - Client & Vendor Self-Service Portal
 * Complete portal experience with documents, payments, and support
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  CreditCard,
  MessageCircle,
  HelpCircle,
  Bell,
  Download,
  Eye,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Users,
  Activity,
  Settings,
  Search,
  Filter,
  Plus,
  Send,
  Upload,
} from "lucide-react";
import {
  PortalService,
  DocumentAccess,
  PortalMessage,
  SupportTicket,
  PortalNotification,
  PortalPayment,
  DashboardSummary,
  DocumentType,
  MessageType,
  TicketCategory,
  TicketStatus,
  PaymentStatus,
} from "@/lib/portal-service";

interface PortalUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  portal_type: "Client" | "Vendor";
  last_login_at?: string;
}

export default function PortalDashboard() {
  const [currentUser, setCurrentUser] = useState<PortalUser | null>(null);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [documents, setDocuments] = useState<DocumentAccess[]>([]);
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [payments, setPayments] = useState<PortalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | "All">("All");
  const [searchTerm, setSearchTerm] = useState("");

  // Mock current user - in real app would come from auth context
  const mockCurrentUser: PortalUser = {
    id: "portal-user-123",
    first_name: "John",
    last_name: "Doe",
    email: "john@acme.com",
    company_name: "Acme Corporation",
    portal_type: "Client",
    last_login_at: new Date().toISOString(),
  };

  useEffect(() => {
    setCurrentUser(mockCurrentUser);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);

      const [dashboardResult, documentsResult, messagesResult, ticketsResult, notificationsResult] =
        await Promise.all([
          PortalService.getPortalUserDashboard(currentUser.id),
          PortalService.getPortalUserDocuments(currentUser.id, {
            document_type: selectedDocumentType === "All" ? undefined : selectedDocumentType,
            search: searchTerm || undefined,
          }),
          PortalService.getPortalMessages(currentUser.id, { unread_only: false }),
          PortalService.getSupportTickets(currentUser.id),
          // Mock notifications call
          Promise.resolve({ success: true, data: [] as PortalNotification[] }),
        ]);

      if (dashboardResult.success && dashboardResult.data) {
        setDashboardSummary(dashboardResult.data);
      }

      if (documentsResult.success && documentsResult.data) {
        setDocuments(documentsResult.data);
      }

      if (messagesResult.success && messagesResult.data) {
        setMessages(messagesResult.data);
      }

      if (ticketsResult.success && ticketsResult.data) {
        setSupportTickets(ticketsResult.data);
      }

      if (notificationsResult.success && notificationsResult.data) {
        setNotifications(notificationsResult.data);
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Completed":
      case "Paid":
      case "Resolved":
      case "Closed":
        return "default";
      case "Pending":
      case "Open":
      case "In Progress":
        return "outline";
      case "Overdue":
      case "Failed":
      case "Urgent":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getDocumentIcon = (docType: DocumentType) => {
    switch (docType) {
      case "Sales Invoice":
      case "Purchase Invoice":
        return <FileText className="w-4 h-4" />;
      case "Payment":
        return <CreditCard className="w-4 h-4" />;
      case "Sales Order":
      case "Purchase Order":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome, {currentUser?.first_name}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {currentUser?.company_name} • {currentUser?.portal_type} Portal
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
                {notifications.length > 0 && (
                  <Badge variant="destructive" className="ml-1 px-1 py-0 text-xs">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        {dashboardSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardSummary.total_invoices}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardSummary.pending_invoices} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Amount Due</CardTitle>
                <DollarSign className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(dashboardSummary.total_amount_due)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {dashboardSummary.overdue_invoices} overdue
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardSummary.unread_messages}</div>
                <p className="text-xs text-muted-foreground">Unread messages</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
                <HelpCircle className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardSummary.open_tickets}</div>
                <p className="text-xs text-muted-foreground">Open tickets</p>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="documents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
          </TabsList>

          {/* Documents */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents ({documents.length})
                  </span>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search documents..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <select
                      value={selectedDocumentType}
                      onChange={e =>
                        setSelectedDocumentType(e.target.value as DocumentType | "All")
                      }
                      className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="All">All Documents</option>
                      <option value="Sales Invoice">Invoices</option>
                      <option value="Sales Order">Orders</option>
                      <option value="Payment">Payments</option>
                      <option value="Credit Note">Credit Notes</option>
                      <option value="Statement">Statements</option>
                    </select>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Document</th>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Date</th>
                        <th className="text-left p-3 font-medium">Access</th>
                        <th className="text-center p-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map(doc => (
                        <tr key={doc.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getDocumentIcon(doc.document_type)}
                              <div>
                                <div className="font-medium">{doc.document_number}</div>
                                <div className="text-sm text-muted-foreground">
                                  Accessed {doc.access_count} times
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{doc.document_type}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="text-sm">
                              {new Date(doc.granted_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              {doc.can_view && (
                                <Badge variant="secondary" className="text-xs">
                                  View
                                </Badge>
                              )}
                              {doc.can_download && (
                                <Badge variant="secondary" className="text-xs">
                                  Download
                                </Badge>
                              )}
                              {doc.can_print && (
                                <Badge variant="secondary" className="text-xs">
                                  Print
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-2">
                              {doc.can_view && (
                                <Button size="sm" variant="ghost">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              {doc.can_download && (
                                <Button size="sm" variant="ghost">
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {documents.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No documents available</p>
                    <p className="text-sm text-muted-foreground">
                      Documents shared with you will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Messages ({messages.length})
                  </span>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Message
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {messages.slice(0, 5).map(message => (
                    <div
                      key={message.id}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {message.sender_name.charAt(0)}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{message.sender_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(message.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {message.message_type}
                            </Badge>
                            {message.priority !== "Normal" && (
                              <Badge
                                variant={
                                  message.priority === "High" || message.priority === "Urgent"
                                    ? "destructive"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {message.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="font-medium text-sm mb-1">{message.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {message.message_body}
                        </p>
                        {message.has_attachments && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs gap-1">
                              <Upload className="w-3 h-3" />
                              {message.attachment_count} attachment
                              {message.attachment_count !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {messages.length === 0 && (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No messages yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start a conversation with our team
                      </p>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        Send Message
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payments ({payments.length})
                  </span>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Make Payment
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No payments yet</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Make secure online payments for your invoices
                    </p>
                    <Button className="gap-2">
                      <CreditCard className="w-4 h-4" />
                      Make Payment
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Reference</th>
                          <th className="text-left p-3 font-medium">Amount</th>
                          <th className="text-left p-3 font-medium">Method</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map(payment => (
                          <tr key={payment.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="font-medium">{payment.payment_reference}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-medium">
                                {formatCurrency(payment.payment_amount)}
                              </div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{payment.payment_method}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant={getStatusBadgeVariant(payment.status)}>
                                {payment.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                {new Date(payment.payment_date).toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support */}
          <TabsContent value="support" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-5 h-5" />
                    Support Tickets ({supportTickets.length})
                  </span>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Ticket
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supportTickets.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No support tickets</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Need help? Create a support ticket and we'll assist you
                    </p>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Create Ticket
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-medium">Ticket</th>
                          <th className="text-left p-3 font-medium">Subject</th>
                          <th className="text-left p-3 font-medium">Category</th>
                          <th className="text-left p-3 font-medium">Priority</th>
                          <th className="text-left p-3 font-medium">Status</th>
                          <th className="text-left p-3 font-medium">Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supportTickets.map(ticket => (
                          <tr key={ticket.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">
                              <div className="font-medium">{ticket.ticket_number}</div>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">{ticket.subject}</div>
                            </td>
                            <td className="p-3">
                              <Badge variant="outline">{ticket.category}</Badge>
                            </td>
                            <td className="p-3">
                              <Badge
                                variant={
                                  ticket.priority === "High" || ticket.priority === "Urgent"
                                    ? "destructive"
                                    : "secondary"
                                }
                              >
                                {ticket.priority}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <Badge variant={getStatusBadgeVariant(ticket.status)}>
                                {ticket.status}
                              </Badge>
                            </td>
                            <td className="p-3">
                              <div className="text-sm">
                                {new Date(ticket.created_at).toLocaleDateString()}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
