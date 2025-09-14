/**
 * Compliance Dashboard - SOC2 & GDPR Enterprise Security & Data Protection
 * Complete compliance framework with audit trails and regulatory management
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Shield,
  Lock,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Users,
  Database,
  Activity,
  Settings,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  ExternalLink,
  Bell,
  Target,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  User,
  Key,
  Zap,
} from "lucide-react";
import {
  ComplianceService,
  ComplianceFramework,
  SecurityControl,
  DataSubjectRequest,
  DataBreachIncident,
  SystemAuditLog,
  AccessControlEntry,
  DataClassification,
  ComplianceDashboard as ComplianceDashboardData,
  ImplementationStatus,
  RequestStatus,
  DataSubjectRequestType,
  InvestigationStatus,
  EventCategory,
  AccessLevel,
  ClassificationLevel,
} from "@/lib/compliance-service";

export default function ComplianceDashboard() {
  const [dashboard, setDashboard] = useState<ComplianceDashboardData | null>(null);
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [securityControls, setSecurityControls] = useState<SecurityControl[]>([]);
  const [dataSubjectRequests, setDataSubjectRequests] = useState<DataSubjectRequest[]>([]);
  const [dataBreaches, setDataBreaches] = useState<DataBreachIncident[]>([]);
  const [auditLogs, setAuditLogs] = useState<{
    logs: SystemAuditLog[];
    total: number;
    page: number;
    limit: number;
  } | null>(null);
  const [accessControls, setAccessControls] = useState<AccessControlEntry[]>([]);
  const [dataClassifications, setDataClassifications] = useState<DataClassification[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFramework, setSelectedFramework] = useState<string | "All">("All");
  const [selectedStatus, setSelectedStatus] = useState<ImplementationStatus | "All">("All");

  const companyId = "current-company-id"; // Get from context/props

  useEffect(() => {
    loadDashboardData();
  }, [companyId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        dashboardResult,
        frameworksResult,
        controlsResult,
        dsrResult,
        breachesResult,
        auditResult,
        accessResult,
        classificationResult,
        overdueResult,
      ] = await Promise.all([
        ComplianceService.getComplianceDashboard(companyId),
        ComplianceService.getComplianceFrameworks({ is_active: true }),
        ComplianceService.getSecurityControls(companyId, {
          implementation_status: selectedStatus === "All" ? undefined : selectedStatus,
        }),
        ComplianceService.getDataSubjectRequests(companyId),
        ComplianceService.getDataBreachIncidents(companyId),
        ComplianceService.getAuditLogs(companyId, {}, { limit: 20 }),
        ComplianceService.getAccessControlEntries(companyId, { status: "Active" }),
        ComplianceService.getDataClassifications(companyId),
        ComplianceService.getOverdueComplianceTasks(companyId),
      ]);

      if (dashboardResult.success && dashboardResult.data) {
        setDashboard(dashboardResult.data);
      }

      if (frameworksResult.success && frameworksResult.data) {
        setFrameworks(frameworksResult.data);
      }

      if (controlsResult.success && controlsResult.data) {
        setSecurityControls(controlsResult.data);
      }

      if (dsrResult.success && dsrResult.data) {
        setDataSubjectRequests(dsrResult.data);
      }

      if (breachesResult.success && breachesResult.data) {
        setDataBreaches(breachesResult.data);
      }

      if (auditResult.success && auditResult.data) {
        setAuditLogs(auditResult.data);
      }

      if (accessResult.success && accessResult.data) {
        setAccessControls(accessResult.data);
      }

      if (classificationResult.success && classificationResult.data) {
        setDataClassifications(classificationResult.data);
      }

      if (overdueResult.success && overdueResult.data) {
        setOverdueTasks(overdueResult.data);
      }
    } catch (error) {
      console.error("Error loading compliance dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "Operating Effectively":
      case "Implemented":
      case "Completed":
      case "Effective":
      case "Active":
        return "default";
      case "In Progress":
      case "Under Review":
      case "Processing":
        return "outline";
      case "Not Implemented":
      case "Failed":
      case "Overdue":
      case "Critical":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "text-red-600";
      case "High":
        return "text-orange-600";
      case "Medium":
        return "text-yellow-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const getClassificationColor = (level: ClassificationLevel) => {
    switch (level) {
      case "Top Secret":
        return "text-red-600 bg-red-50";
      case "Restricted":
        return "text-red-600 bg-red-50";
      case "Confidential":
        return "text-orange-600 bg-orange-50";
      case "Internal":
        return "text-yellow-600 bg-yellow-50";
      case "Public":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading compliance dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6" />
            SOC2 & GDPR Compliance
          </h2>
          <p className="text-muted-foreground">
            Enterprise security and data protection compliance framework
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Assessment
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SOC2 Compliance</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {dashboard.soc2_compliance_score.toFixed(1)}%
              </div>
              <Progress value={dashboard.soc2_compliance_score} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {dashboard.effective_controls}/{dashboard.total_security_controls} controls
                effective
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">GDPR Compliance</CardTitle>
              <Lock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {dashboard.gdpr_compliance_score.toFixed(1)}%
              </div>
              <Progress value={dashboard.gdpr_compliance_score} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Data protection compliance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Requests</CardTitle>
              <User className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {dashboard.open_data_subject_requests}
              </div>
              <p className="text-xs text-muted-foreground">{dashboard.overdue_dsr_count} overdue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboard.open_data_breaches}</div>
              <p className="text-xs text-muted-foreground">
                {dashboard.high_risk_breaches} high risk
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Clock className="w-5 h-5" />
              Overdue Compliance Tasks ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overdueTasks.slice(0, 3).map((task, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task.task_type}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {task.task_description}
                    </div>
                    <div className="text-xs text-amber-600 mt-1">
                      {task.overdue_days} days overdue
                    </div>
                  </div>
                  <Badge variant="destructive">Overdue</Badge>
                </div>
              ))}
            </div>
            {overdueTasks.length > 3 && (
              <div className="mt-3 text-center">
                <Button variant="outline" size="sm">
                  View All {overdueTasks.length} Tasks
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="controls">Security Controls</TabsTrigger>
          <TabsTrigger value="privacy">Data Rights</TabsTrigger>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="data">Data Classification</TabsTrigger>
        </TabsList>

        {/* Security Controls */}
        <TabsContent value="controls" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Controls ({securityControls.length})
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={e =>
                      setSelectedStatus(e.target.value as ImplementationStatus | "All")
                    }
                    className="px-3 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="All">All Status</option>
                    <option value="Not Implemented">Not Implemented</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Implemented">Implemented</option>
                    <option value="Operating Effectively">Operating Effectively</option>
                    <option value="Needs Remediation">Needs Remediation</option>
                  </select>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Control
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Control ID</th>
                      <th className="text-left p-3 font-medium">Name</th>
                      <th className="text-left p-3 font-medium">Framework</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Risk Level</th>
                      <th className="text-left p-3 font-medium">Last Tested</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityControls.map(control => (
                      <tr key={control.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{control.control_id}</div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">{control.control_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {control.control_category}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">
                            {(control as any).framework?.framework_name}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(control.implementation_status)}>
                            {control.implementation_status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={getRiskLevelColor(control.risk_level)}
                          >
                            {control.risk_level}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {control.last_tested_date
                              ? new Date(control.last_tested_date).toLocaleDateString()
                              : "Never"}
                          </div>
                          {control.last_test_result && (
                            <div className="text-xs text-muted-foreground">
                              Result: {control.last_test_result}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {securityControls.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No security controls configured</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add security controls to track compliance implementation
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Control
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Subject Rights (GDPR) */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Data Subject Rights Requests ({dataSubjectRequests.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Request
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Request #</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Data Subject</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Due Date</th>
                      <th className="text-left p-3 font-medium">Assigned To</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataSubjectRequests.slice(0, 10).map(request => (
                      <tr key={request.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{request.request_number}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(request.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{request.request_type}</Badge>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">
                              {request.data_subject_name || "Anonymous"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {request.data_subject_email}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(request.status)}>
                            {request.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div
                            className={`text-sm ${
                              new Date(request.due_date) < new Date() &&
                              !["Completed", "Rejected"].includes(request.status)
                                ? "text-red-600 font-medium"
                                : ""
                            }`}
                          >
                            {new Date(request.due_date).toLocaleDateString()}
                          </div>
                          {new Date(request.due_date) < new Date() &&
                            !["Completed", "Rejected"].includes(request.status) && (
                              <div className="text-xs text-red-600">Overdue</div>
                            )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {(request as any).assignee?.name || "Unassigned"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {dataSubjectRequests.length === 0 && (
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No data subject requests</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    GDPR data subject rights requests will appear here
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Incidents */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Data Breach Incidents ({dataBreaches.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Report Incident
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Incident #</th>
                      <th className="text-left p-3 font-medium">Title</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Risk Level</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Discovery Date</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataBreaches.slice(0, 10).map(incident => (
                      <tr key={incident.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium text-sm">{incident.incident_number}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-sm">{incident.incident_title}</div>
                          <div className="text-xs text-muted-foreground">
                            {incident.personal_data_involved
                              ? "Personal Data Involved"
                              : "No Personal Data"}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{incident.breach_type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              incident.risk_level === "Critical" || incident.risk_level === "High"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {incident.risk_level}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(incident.investigation_status)}>
                            {incident.investigation_status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {new Date(incident.discovery_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <FileText className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {dataBreaches.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No security incidents reported</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Security incidents and data breaches will be tracked here
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Report Incident
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  System Audit Logs ({auditLogs?.total || 0})
                </span>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search logs..."
                      className="pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <Button size="sm" variant="outline" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Timestamp</th>
                      <th className="text-left p-3 font-medium">Event Type</th>
                      <th className="text-left p-3 font-medium">User</th>
                      <th className="text-left p-3 font-medium">Description</th>
                      <th className="text-left p-3 font-medium">Result</th>
                      <th className="text-left p-3 font-medium">IP Address</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs?.logs.slice(0, 10).map(log => (
                      <tr key={log.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="text-sm">
                            {new Date(log.event_timestamp).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(log.event_timestamp).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{log.event_category}</Badge>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">{log.user_name || "System"}</div>
                            <div className="text-xs text-muted-foreground">{log.user_email}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm max-w-xs truncate" title={log.event_description}>
                            {log.event_description}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(log.event_result)}>
                            {log.event_result}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-muted-foreground">
                            {log.user_ip_address || "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(!auditLogs || auditLogs.logs.length === 0) && (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No audit logs available</p>
                  <p className="text-sm text-muted-foreground">
                    System activity and security events will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Control */}
        <TabsContent value="access" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Access Control Matrix ({accessControls.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Grant Access
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Subject</th>
                      <th className="text-left p-3 font-medium">Resource</th>
                      <th className="text-left p-3 font-medium">Access Level</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Next Review</th>
                      <th className="text-left p-3 font-medium">Granted By</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accessControls.slice(0, 10).map(access => (
                      <tr key={access.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">{access.subject_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {access.subject_type}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium text-sm">{access.resource_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {access.resource_type}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{access.access_level}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(access.status)}>
                            {access.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div
                            className={`text-sm ${
                              access.next_review_date &&
                              new Date(access.next_review_date) < new Date()
                                ? "text-red-600 font-medium"
                                : ""
                            }`}
                          >
                            {access.next_review_date
                              ? new Date(access.next_review_date).toLocaleDateString()
                              : "N/A"}
                          </div>
                          {access.next_review_date &&
                            new Date(access.next_review_date) < new Date() && (
                              <div className="text-xs text-red-600">Review overdue</div>
                            )}
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-muted-foreground">
                            {/* Would show granted_by user name */}
                            Admin
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="text-red-600">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {accessControls.length === 0 && (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No access controls defined</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up access controls to manage user permissions
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Grant First Access
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Data Classification */}
        <TabsContent value="data" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Data Classification ({dataClassifications.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Classify Data
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Data Asset</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-left p-3 font-medium">Classification</th>
                      <th className="text-left p-3 font-medium">Personal Data</th>
                      <th className="text-left p-3 font-medium">Data Owner</th>
                      <th className="text-left p-3 font-medium">Next Review</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataClassifications.slice(0, 10).map(classification => (
                      <tr key={classification.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div className="font-medium text-sm">
                            {classification.data_asset_name}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{classification.data_asset_type}</Badge>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={getClassificationColor(classification.classification_level)}
                          >
                            {classification.classification_level}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {classification.contains_personal_data ? (
                              <Badge variant="secondary" className="text-xs">
                                Personal
                              </Badge>
                            ) : null}
                            {classification.contains_sensitive_data ? (
                              <Badge variant="secondary" className="text-xs">
                                Sensitive
                              </Badge>
                            ) : null}
                            {classification.contains_financial_data ? (
                              <Badge variant="secondary" className="text-xs">
                                Financial
                              </Badge>
                            ) : null}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {/* Would show data owner name */}
                            Data Steward
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {classification.next_review_date
                              ? new Date(classification.next_review_date).toLocaleDateString()
                              : "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {dataClassifications.length === 0 && (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No data classifications</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Classify your data assets to ensure proper handling and protection
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Classify First Data Asset
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
