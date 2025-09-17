// @ts-nocheck
// =====================================================
// Phase 8: Export Manager Component
// Professional export interface with multiple formats
// =====================================================

"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  FileImage,
  FileCode,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  Filter,
  Calendar,
} from "lucide-react";
import { ExportService, ExportOptions, ExportResult, ExportJob } from "@/lib/export-service";
import { format } from "date-fns";

interface ExportManagerProps {
  companyId: string;
  userId: string;
}

export function ExportManager({ companyId, userId }: ExportManagerProps) {
  const [exportService] = useState(new ExportService(companyId, userId));
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "CSV",
    dataType: "accounts",
    includeMetadata: true,
    compression: false,
  });
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    accountIds: [] as string[],
    currency: "",
    status: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load export jobs on component mount
  useEffect(() => {
    loadExportJobs();
  }, []);

  const loadExportJobs = async () => {
    try {
      const jobs = await exportService.getExportJobs();
      setExportJobs(jobs);
    } catch (error) {
      console.error("Failed to load export jobs:", error);
    }
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);
      setError(null);
      setSuccess(null);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await exportService.exportData(exportOptions);

      clearInterval(progressInterval);
      setExportProgress(100);

      if (result.success) {
        setSuccess(`Export completed successfully! Job ID: ${result.jobId}`);
        await loadExportJobs();
      } else {
        setError(result.error || "Export failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const handleDownload = async (jobId: string, filePath: string) => {
    try {
      const downloadUrl = await exportService.getDownloadUrl(filePath);
      window.open(downloadUrl, "_blank");
    } catch (error) {
      setError("Failed to generate download URL");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await exportService.deleteExportJob(jobId);
      await loadExportJobs();
      setSuccess("Export job deleted successfully");
    } catch (error) {
      setError("Failed to delete export job");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      failed: "destructive",
      processing: "secondary",
      pending: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Export Manager</h2>
          <p className="text-muted-foreground">
            Export your data in multiple formats with professional-grade features
          </p>
        </div>
        <Button onClick={loadExportJobs} variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="export" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="export">Create Export</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
        </TabsList>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Export Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Export Configuration</CardTitle>
                <CardDescription>Configure your export settings and data selection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Format Selection */}
                <div className="space-y-2">
                  <Label htmlFor="format">Export Format</Label>
                  <Select
                    value={exportOptions.format}
                    onValueChange={(value: any) =>
                      setExportOptions(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSV">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          CSV
                        </div>
                      </SelectItem>
                      <SelectItem value="Excel">
                        <div className="flex items-center">
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel
                        </div>
                      </SelectItem>
                      <SelectItem value="JSON">
                        <div className="flex items-center">
                          <FileJson className="h-4 w-4 mr-2" />
                          JSON
                        </div>
                      </SelectItem>
                      <SelectItem value="QuickBooks">
                        <div className="flex items-center">
                          <FileCode className="h-4 w-4 mr-2" />
                          QuickBooks
                        </div>
                      </SelectItem>
                      <SelectItem value="PDF">
                        <div className="flex items-center">
                          <FileImage className="h-4 w-4 mr-2" />
                          PDF
                        </div>
                      </SelectItem>
                      <SelectItem value="XML">
                        <div className="flex items-center">
                          <FileCode className="h-4 w-4 mr-2" />
                          XML
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Type Selection */}
                <div className="space-y-2">
                  <Label htmlFor="dataType">Data Type</Label>
                  <Select
                    value={exportOptions.dataType}
                    onValueChange={(value: any) =>
                      setExportOptions(prev => ({ ...prev, dataType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select data type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Data</SelectItem>
                      <SelectItem value="accounts">Chart of Accounts</SelectItem>
                      <SelectItem value="transactions">Transactions</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="vendors">Vendors</SelectItem>
                      <SelectItem value="items">Items</SelectItem>
                      <SelectItem value="reports">Reports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeMetadata"
                      checked={exportOptions.includeMetadata}
                      onCheckedChange={checked =>
                        setExportOptions(prev => ({ ...prev, includeMetadata: !!checked }))
                      }
                    />
                    <Label htmlFor="includeMetadata">Include Metadata</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="compression"
                      checked={exportOptions.compression}
                      onCheckedChange={checked =>
                        setExportOptions(prev => ({ ...prev, compression: !!checked }))
                      }
                    />
                    <Label htmlFor="compression">Enable Compression</Label>
                  </div>
                </div>

                {/* Export Button */}
                <Button onClick={handleExport} disabled={isExporting} className="w-full">
                  {isExporting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Create Export
                    </>
                  )}
                </Button>

                {/* Progress Bar */}
                {isExporting && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Export Progress</span>
                      <span>{exportProgress}%</span>
                    </div>
                    <Progress value={exportProgress} className="w-full" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </CardTitle>
                <CardDescription>Apply filters to your export data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">From Date</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={filters.dateFrom}
                      onChange={e => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateTo">To Date</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={filters.dateTo}
                      onChange={e => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Currency */}
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={filters.currency}
                    onValueChange={value => setFilters(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All currencies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Currencies</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="MYR">MYR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={value => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
              <CardDescription>View and manage your export jobs</CardDescription>
            </CardHeader>
            <CardContent>
              {exportJobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No export jobs found</div>
              ) : (
                <div className="space-y-4">
                  {exportJobs.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        {getStatusIcon(job.status)}
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{job.jobType.toUpperCase()} Export</span>
                            {getStatusBadge(job.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {job.dataTypes.join(", ")} •{" "}
                            {format(new Date(job.createdAt), "MMM dd, yyyy HH:mm")}
                          </div>
                          {job.fileSizeBytes && (
                            <div className="text-sm text-muted-foreground">
                              Size: {formatFileSize(job.fileSizeBytes)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {job.status === "completed" && job.filePath && (
                          <Button size="sm" onClick={() => handleDownload(job.id, job.filePath!)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => handleDeleteJob(job.id)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
