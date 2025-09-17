// @ts-nocheck
// =====================================================
// Phase 8: Integration & Export Page
// Main page for all integration and export features
// =====================================================

"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  Key,
  Plug,
  Database,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileCode,
  FileImage,
  Shield,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { ExportManager } from "@/components/integration-export/export-manager";
import { APIManager } from "@/components/integration-export/api-manager";
import { IntegrationManager } from "@/components/integration-export/integration-manager";
import { BackupManager } from "@/components/integration-export/backup-manager";

export default function IntegrationExportPage() {
  const [companyId] = useState("demo-company-id"); // This would come from auth context
  const [userId] = useState("demo-user-id"); // This would come from auth context

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Integration & Export</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Professional-grade data export, API management, third-party integrations, and backup
          solutions for enterprise accounting systems
        </p>
      </div>

      {/* Feature Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-blue-500" />
              <CardTitle className="text-lg">Data Export</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Export data in multiple formats: CSV, Excel, JSON, QuickBooks, PDF, XML
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-green-500" />
              <CardTitle className="text-lg">API Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Secure API keys, rate limiting, and comprehensive documentation
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Plug className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg">Integrations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Connect with QuickBooks, Xero, Stripe, PayPal, and more
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Database className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-lg">Backup & Restore</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-sm">
              Enterprise-grade backup with encryption and compression
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="export" className="flex items-center space-x-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center space-x-2">
            <Key className="h-4 w-4" />
            <span>API</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Plug className="h-4 w-4" />
            <span>Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Backup</span>
          </TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export">
          <ExportManager companyId={companyId} userId={userId} />
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api">
          <APIManager companyId={companyId} userId={userId} />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <IntegrationManager companyId={companyId} userId={userId} />
        </TabsContent>

        {/* Backup Tab */}
        <TabsContent value="backup">
          <BackupManager companyId={companyId} userId={userId} />
        </TabsContent>
      </Tabs>

      {/* Supported Formats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Supported Export Formats
          </CardTitle>
          <CardDescription>
            Professional-grade export capabilities for all major accounting systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <FileText className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">CSV</span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <FileSpreadsheet className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium">Excel</span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <FileJson className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium">JSON</span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <FileCode className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium">QuickBooks</span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <FileImage className="h-5 w-5 text-red-500" />
              <span className="text-sm font-medium">PDF</span>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <FileCode className="h-5 w-5 text-gray-500" />
              <span className="text-sm font-medium">XML</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integration Partners */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plug className="h-5 w-5 mr-2" />
            Integration Partners
          </CardTitle>
          <CardDescription>Seamlessly connect with your favorite business tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <span className="text-sm font-medium">QuickBooks</span>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <span className="text-sm font-medium">Xero</span>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <span className="text-sm font-medium">Stripe</span>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <span className="text-sm font-medium">PayPal</span>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <span className="text-sm font-medium">Salesforce</span>
            </div>
            <div className="flex items-center justify-center p-4 border rounded-lg hover:shadow-md transition-shadow">
              <span className="text-sm font-medium">HubSpot</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Enterprise Security
          </CardTitle>
          <CardDescription>Bank-level security for all your data operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Data Encryption</h4>
              <p className="text-sm text-muted-foreground">
                AES-256 encryption for all data at rest and in transit
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Access Control</h4>
              <p className="text-sm text-muted-foreground">
                Role-based permissions and API key management
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Audit Trail</h4>
              <p className="text-sm text-muted-foreground">
                Complete logging of all data operations and access
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
              <Download className="h-4 w-4" />
              <span className="text-sm">Export All Data</span>
            </button>
            <button className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
              <RefreshCw className="h-4 w-4" />
              <span className="text-sm">Sync Integrations</span>
            </button>
            <button className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
              <Database className="h-4 w-4" />
              <span className="text-sm">Create Backup</span>
            </button>
            <button className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted transition-colors">
              <ExternalLink className="h-4 w-4" />
              <span className="text-sm">API Documentation</span>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
