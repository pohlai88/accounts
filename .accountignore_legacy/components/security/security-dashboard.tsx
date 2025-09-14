"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Users,
  Activity,
  AlertTriangle,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Settings,
  Download,
  RefreshCw,
} from "lucide-react";
import { SecurityService } from "@/lib/security-service";
import { AuditLogsViewer } from "./audit-logs-viewer";
import { SecurityEventsViewer } from "./security-events-viewer";
import { UserManagement } from "./user-management";
import { ComplianceManager } from "./compliance-manager";

interface SecurityDashboardProps {
  companyId: string;
}

interface SecurityDashboardData {
  total_users: number;
  active_sessions: number;
  security_events_today: number;
  critical_events: number;
  audit_logs_today: number;
  compliance_status: string;
}

export function SecurityDashboard({ companyId }: SecurityDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<SecurityDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const result = await SecurityService.getSecurityDashboard(companyId);

      if (result.success && result.dashboard) {
        setDashboardData(result.dashboard);
      } else {
        setError(result.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError("An error occurred while loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>No security data available</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Security & Compliance Dashboard
          </h2>
          <p className="text-muted-foreground">
            Monitor security events, audit trails, and compliance status
          </p>
        </div>
        <Button onClick={loadDashboardData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.total_users}</div>
            <p className="text-xs text-muted-foreground">Active user accounts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.active_sessions}</div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.security_events_today}</div>
            <p className="text-xs text-muted-foreground">Events today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{dashboardData.critical_events}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Compliance Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Status</p>
              <Badge
                variant={dashboardData.compliance_status === "Active" ? "default" : "destructive"}
                className="mt-1"
              >
                {dashboardData.compliance_status}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Audit Logs Today</p>
              <p className="text-2xl font-bold">{dashboardData.audit_logs_today}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="audit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogsViewer companyId={companyId} />
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <SecurityEventsViewer companyId={companyId} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement companyId={companyId} />
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceManager companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
