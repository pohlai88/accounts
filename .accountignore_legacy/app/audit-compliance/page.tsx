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
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  Settings,
  Receipt,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Lock,
  Unlock,
  AlertTriangle,
  CheckSquare,
  XCircle,
  User,
  Globe,
  Database,
  FileCheck,
  Scale,
  Gavel,
  BookOpen,
  ClipboardCheck,
  UserCheck,
  ShieldCheck,
  Key,
  Fingerprint,
  Monitor,
  Smartphone,
  MapPin,
  Clock3,
  Calendar as CalendarIcon,
  Flag,
  Bell,
  Archive,
  Trash,
  History,
  Search as SearchIcon,
  Filter as FilterIcon,
} from "lucide-react";
import {
  AuditComplianceService,
  AuditLog,
  AccessLog,
  ComplianceFramework,
  ComplianceViolation,
} from "@/lib/audit-compliance-service";
import { format } from "date-fns";

export default function AuditCompliancePage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // Data states
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [complianceFrameworks, setComplianceFrameworks] = useState<ComplianceFramework[]>([]);
  const [complianceViolations, setComplianceViolations] = useState<ComplianceViolation[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [complianceStatus, setComplianceStatus] = useState<any[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOperation, setFilterOperation] = useState<string>("all");
  const [filterRiskLevel, setFilterRiskLevel] = useState<string>("all");
  const [filterModule, setFilterModule] = useState<string>("all");
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const companyId = "default-company";

  useEffect(() => {
    loadData();
  }, [companyId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "dashboard":
          await loadAuditStats();
          await loadComplianceStatus();
          break;
        case "audit-logs":
          await loadAuditLogs();
          break;
        case "access-logs":
          await loadAccessLogs();
          break;
        case "compliance":
          await loadComplianceFrameworks();
          await loadComplianceViolations();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadAuditStats = async () => {
    const result = await AuditComplianceService.getAuditStatistics(companyId);
    if (result.success && result.data) {
      setAuditStats(result.data);
    }
  };

  const loadComplianceStatus = async () => {
    const result = await AuditComplianceService.getComplianceStatus(companyId);
    if (result.success && result.data) {
      setComplianceStatus(result.data);
    }
  };

  const loadAuditLogs = async () => {
    const result = await AuditComplianceService.getAuditLogs(companyId, {
      startDate: dateRange.start,
      endDate: dateRange.end,
      limit: 100,
    });
    if (result.success && result.data) {
      setAuditLogs(result.data);
    }
  };

  const loadAccessLogs = async () => {
    const result = await AuditComplianceService.getAccessLogs(companyId, {
      startDate: dateRange.start,
      endDate: dateRange.end,
      limit: 100,
    });
    if (result.success && result.data) {
      setAccessLogs(result.data);
    }
  };

  const loadComplianceFrameworks = async () => {
    const result = await AuditComplianceService.getComplianceFrameworks();
    if (result.success && result.data) {
      setComplianceFrameworks(result.data);
    }
  };

  const loadComplianceViolations = async () => {
    const result = await AuditComplianceService.getComplianceViolations(companyId);
    if (result.success && result.data) {
      setComplianceViolations(result.data);
    }
  };

  const handleExportAuditLogs = async () => {
    const result = await AuditComplianceService.exportAuditLogsToCSV(companyId, {
      startDate: dateRange.start,
      endDate: dateRange.end,
    });

    if (result.success && result.data) {
      // Create download link
      const blob = new Blob([result.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${dateRange.start}-to-${dateRange.end}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Compliant: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      "Non-Compliant": { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      "Partially Compliant": {
        variant: "default" as const,
        color: "bg-yellow-100 text-yellow-800",
      },
      "In Progress": { variant: "default" as const, color: "bg-blue-100 text-blue-800" },
      "Not Assessed": { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
      LOW: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      MEDIUM: { variant: "default" as const, color: "bg-yellow-100 text-yellow-800" },
      HIGH: { variant: "default" as const, color: "bg-orange-100 text-orange-800" },
      CRITICAL: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      Open: { variant: "destructive" as const, color: "bg-red-100 text-red-800" },
      Resolved: { variant: "default" as const, color: "bg-green-100 text-green-800" },
      Closed: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig["Not Assessed"];
    return (
      <Badge variant={config.variant} className={config.color}>
        {status}
      </Badge>
    );
  };

  const getRiskLevelIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case "LOW":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "MEDIUM":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "HIGH":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case "CRITICAL":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case "CREATE":
        return <Plus className="h-4 w-4 text-green-500" />;
      case "UPDATE":
        return <Edit className="h-4 w-4 text-blue-500" />;
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-500" />;
      case "LOGIN":
        return <User className="h-4 w-4 text-blue-500" />;
      case "LOGOUT":
        return <User className="h-4 w-4 text-gray-500" />;
      case "VIEW":
        return <Eye className="h-4 w-4 text-purple-500" />;
      case "EXPORT":
        return <Download className="h-4 w-4 text-orange-500" />;
      case "IMPORT":
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Audit & Compliance Dashboard</h3>
        <Button onClick={loadAuditStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total Audit Logs</p>
                <p className="text-2xl font-bold">{auditStats?.total_audit_logs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Access Events</p>
                <p className="text-2xl font-bold">{auditStats?.total_access_logs || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">High Risk Events</p>
                <p className="text-2xl font-bold">{auditStats?.high_risk_events || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Failed Access</p>
                <p className="text-2xl font-bold">{auditStats?.failed_access_attempts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Status</CardTitle>
          <CardDescription>Current compliance status across all frameworks</CardDescription>
        </CardHeader>
        <CardContent>
          {complianceStatus.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No compliance frameworks configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {complianceStatus.map((framework, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{framework.framework_name}</CardTitle>
                      {getStatusBadge(framework.compliance_status)}
                    </div>
                    <CardDescription>{framework.framework_code}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Last Assessment:</span>
                        <span>
                          {framework.last_assessment_date
                            ? format(new Date(framework.last_assessment_date), "MMM dd, yyyy")
                            : "Never"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Due:</span>
                        <span>
                          {framework.next_assessment_due
                            ? format(new Date(framework.next_assessment_due), "MMM dd, yyyy")
                            : "Not Set"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Violations:</span>
                        <span
                          className={
                            framework.violations_count > 0 ? "text-red-600 font-medium" : ""
                          }
                        >
                          {framework.violations_count || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Critical:</span>
                        <span
                          className={
                            framework.high_severity_violations > 0 ? "text-red-600 font-medium" : ""
                          }
                        >
                          {framework.high_severity_violations || 0}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Compliance Violations</p>
                <p className="text-2xl font-bold">{auditStats?.compliance_violations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-sm font-medium">Critical Violations</p>
                <p className="text-2xl font-bold">{auditStats?.critical_violations || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">PII Access Events</p>
                <p className="text-2xl font-bold">{auditStats?.pii_access_events || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Financial Data Access</p>
                <p className="text-2xl font-bold">
                  {auditStats?.financial_data_access_events || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderAuditLogs = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Audit Logs</h3>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportAuditLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={loadAuditLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search logs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="operation">Operation</Label>
              <Select value={filterOperation} onValueChange={setFilterOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  <SelectItem value="CREATE">Create</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="VIEW">View</SelectItem>
                  <SelectItem value="EXPORT">Export</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="risk">Risk Level</Label>
              <Select value={filterRiskLevel} onValueChange={setFilterRiskLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading audit logs...</div>
        </div>
      ) : auditLogs.length === 0 ? (
        <div className="text-center py-8">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No audit logs found</h3>
          <p className="text-muted-foreground">Audit logs will appear as system activity occurs</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Operation</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Risk Level</TableHead>
                <TableHead>Module</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(log.timestamp), "MMM dd, yyyy HH:mm:ss")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getOperationIcon(log.operation_type)}
                      <span className="text-sm">{log.operation_type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium">{log.table_name}</div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{log.user_name || "System"}</div>
                      <div className="text-xs text-muted-foreground">{log.user_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRiskLevelIcon(log.risk_level)}
                      {getStatusBadge(log.risk_level)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{log.module_name || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{log.user_ip_address || "-"}</div>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderAccessLogs = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Access Logs</h3>
        <Button onClick={loadAccessLogs}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Access Logs Table */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading access logs...</div>
        </div>
      ) : accessLogs.length === 0 ? (
        <div className="text-center py-8">
          <Eye className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No access logs found</h3>
          <p className="text-muted-foreground">Access logs will appear as users access resources</p>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Access Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Classification</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(log.accessed_at), "MMM dd, yyyy HH:mm:ss")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{log.user_name}</div>
                      <div className="text-xs text-muted-foreground">{log.user_role}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">{log.resource_type}</div>
                      <div className="text-xs text-muted-foreground">{log.resource_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.access_type}</Badge>
                  </TableCell>
                  <TableCell>
                    {log.access_granted ? (
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Granted</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm">Denied</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(log.data_classification)}</TableCell>
                  <TableCell>
                    <div className="text-sm font-mono">{log.ip_address || "-"}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Compliance Management</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Framework
        </Button>
      </div>

      {/* Compliance Frameworks */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Frameworks</CardTitle>
          <CardDescription>Available compliance frameworks and standards</CardDescription>
        </CardHeader>
        <CardContent>
          {complianceFrameworks.length === 0 ? (
            <div className="text-center py-8">
              <Scale className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No compliance frameworks available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complianceFrameworks.map(framework => (
                <Card key={framework.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{framework.framework_name}</CardTitle>
                      {getStatusBadge(framework.is_active ? "Active" : "Inactive")}
                    </div>
                    <CardDescription>
                      {framework.framework_code} v{framework.version}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{framework.description}</p>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compliance Violations */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Violations</CardTitle>
          <CardDescription>Recent compliance violations requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {complianceViolations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No violations found</h3>
              <p className="text-muted-foreground">Your system is currently compliant</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complianceViolations.slice(0, 5).map(violation => (
                <div key={violation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{violation.title}</h4>
                    <div className="flex items-center space-x-2">
                      {getRiskLevelIcon(violation.severity_level)}
                      {getStatusBadge(violation.severity_level)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{violation.description}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Detected: {format(new Date(violation.detection_date), "MMM dd, yyyy")}
                    </span>
                    <span>Status: {getStatusBadge(violation.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Shield className="h-8 w-8 text-primary" />
            <span>Audit & Compliance</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive audit trail and compliance management system
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
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          {renderDashboard()}
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          {renderAuditLogs()}
        </TabsContent>

        <TabsContent value="access-logs" className="space-y-4">
          {renderAccessLogs()}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          {renderCompliance()}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Compliance Framework</DialogTitle>
            <DialogDescription>
              Configure a new compliance framework for your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Framework Configuration</h3>
              <p className="text-muted-foreground">
                The compliance framework configuration form will be implemented here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
