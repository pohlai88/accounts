// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Activity,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SecurityService } from "@/lib/security-service";
import { format } from "date-fns";

interface AuditLogsViewerProps {
  companyId: string;
}

interface AuditLog {
  id: string;
  user_id?: string;
  company_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  metadata?: Record<string, any>;
  created_at: string;
  user?: {
    email: string;
    full_name?: string;
  };
  company?: {
    name: string;
  };
}

export function AuditLogsViewer({ companyId }: AuditLogsViewerProps) {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState({
    user_id: "",
    action: "",
    entity_type: "",
    from_date: "",
    to_date: "",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
  });

  const loadLogs = async () => {
    try {
      setLoading(true);
      const result = await SecurityService.getAuditLogs(companyId, {
        ...filters,
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit,
      });

      if (result.success) {
        setLogs(result.logs || []);
        setTotal(result.total || 0);
      } else {
        setError(result.error || "Failed to load audit logs");
      }
    } catch (err) {
      setError("An error occurred while loading audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [companyId, filters, pagination]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-blue-100 text-blue-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "LOGIN":
        return "bg-purple-100 text-purple-800";
      case "LOGOUT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPages = Math.ceil(total / pagination.limit);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Audit Logs
          </CardTitle>
          <CardDescription>Monitor all system activities and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={e => handleFilterChange("search", e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Action</label>
              <Select
                value={filters.action}
                onValueChange={value => handleFilterChange("action", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Entity Type</label>
              <Select
                value={filters.entity_type}
                onValueChange={value => handleFilterChange("entity_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All entities</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="gl_entry">GL Entry</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="user_profile">User Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={filters.from_date}
                onChange={e => handleFilterChange("from_date", e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {logs.length} of {total} logs
            </div>
            <Button onClick={loadLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-6 w-6 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-4 text-center text-red-600">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {format(new Date(log.created_at), "MMM dd, yyyy HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{log.user?.full_name || "System"}</div>
                          <div className="text-sm text-muted-foreground">
                            {log.user?.email || "system@company.com"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.entity_type}</div>
                        {log.entity_id && (
                          <div className="text-sm text-muted-foreground">
                            ID: {log.entity_id.slice(0, 8)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{log.ip_address || "-"}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Audit Log Details</DialogTitle>
                            <DialogDescription>
                              Detailed information about this audit event
                            </DialogDescription>
                          </DialogHeader>
                          {selectedLog && (
                            <ScrollArea className="max-h-96">
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Action</label>
                                    <p className="text-sm">{selectedLog.action}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Entity Type</label>
                                    <p className="text-sm">{selectedLog.entity_type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Timestamp</label>
                                    <p className="text-sm">
                                      {format(new Date(selectedLog.created_at), "PPpp")}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">IP Address</label>
                                    <p className="text-sm">{selectedLog.ip_address || "N/A"}</p>
                                  </div>
                                </div>

                                {selectedLog.old_values && (
                                  <div>
                                    <label className="text-sm font-medium">Old Values</label>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                      {JSON.stringify(selectedLog.old_values, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedLog.new_values && (
                                  <div>
                                    <label className="text-sm font-medium">New Values</label>
                                    <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                      {JSON.stringify(selectedLog.new_values, null, 2)}
                                    </pre>
                                  </div>
                                )}

                                {selectedLog.metadata &&
                                  Object.keys(selectedLog.metadata).length > 0 && (
                                    <div>
                                      <label className="text-sm font-medium">Metadata</label>
                                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                                        {JSON.stringify(selectedLog.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  )}
                              </div>
                            </ScrollArea>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
