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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  RefreshCw,
  Play,
  Pause,
  Edit,
  Trash2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  History,
} from "lucide-react";
import {
  RecurringTransactionsService,
  RecurringTemplate,
  RecurringExecution,
  CreateRecurringTemplateInput,
} from "@/lib/recurring-transactions";
import { format } from "date-fns";

interface RecurringTransactionsProps {
  companyId: string;
}

export function RecurringTransactions({ companyId }: RecurringTransactionsProps) {
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [upcomingExecutions, setUpcomingExecutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<RecurringTemplate | null>(null);
  const [executionHistory, setExecutionHistory] = useState<RecurringExecution[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  // Form state for creating new template
  const [formData, setFormData] = useState<CreateRecurringTemplateInput>({
    companyId,
    name: "",
    description: "",
    transactionType: "Sales Invoice",
    frequency: "Monthly",
    startDate: format(new Date(), "yyyy-MM-dd"),
    templateData: {},
  });

  useEffect(() => {
    loadTemplates();
    loadUpcomingExecutions();
  }, [companyId]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const result = await RecurringTransactionsService.getTemplates(companyId);
      if (result.success && result.templates) {
        setTemplates(result.templates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingExecutions = async () => {
    try {
      const result = await RecurringTransactionsService.getUpcomingExecutions(companyId, 30);
      if (result.success && result.executions) {
        setUpcomingExecutions(result.executions);
      }
    } catch (error) {
      console.error("Error loading upcoming executions:", error);
    }
  };

  const loadExecutionHistory = async (templateId: string) => {
    try {
      const result = await RecurringTransactionsService.getExecutionHistory(templateId);
      if (result.success && result.executions) {
        setExecutionHistory(result.executions);
      }
    } catch (error) {
      console.error("Error loading execution history:", error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const result = await RecurringTransactionsService.createTemplate(formData);
      if (result.success) {
        setShowCreateDialog(false);
        setFormData({
          companyId,
          name: "",
          description: "",
          transactionType: "Sales Invoice",
          frequency: "Monthly",
          startDate: format(new Date(), "yyyy-MM-dd"),
          templateData: {},
        });
        loadTemplates();
        loadUpcomingExecutions();
      }
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const handleExecuteTemplate = async (templateId: string) => {
    try {
      const result = await RecurringTransactionsService.executeTemplate(templateId);
      if (result.success) {
        loadTemplates();
        loadUpcomingExecutions();
      }
    } catch (error) {
      console.error("Error executing template:", error);
    }
  };

  const handlePauseTemplate = async (templateId: string) => {
    try {
      const result = await RecurringTransactionsService.pauseTemplate(templateId);
      if (result.success) {
        loadTemplates();
        loadUpcomingExecutions();
      }
    } catch (error) {
      console.error("Error pausing template:", error);
    }
  };

  const handleResumeTemplate = async (templateId: string) => {
    try {
      const result = await RecurringTransactionsService.resumeTemplate(templateId);
      if (result.success) {
        loadTemplates();
        loadUpcomingExecutions();
      }
    } catch (error) {
      console.error("Error resuming template:", error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm("Are you sure you want to delete this recurring template?")) {
      try {
        const result = await RecurringTransactionsService.deleteTemplate(templateId);
        if (result.success) {
          loadTemplates();
          loadUpcomingExecutions();
        }
      } catch (error) {
        console.error("Error deleting template:", error);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Executed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "Failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "Pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "Skipped":
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Executed":
        return "text-green-600 bg-green-50";
      case "Failed":
        return "text-red-600 bg-red-50";
      case "Pending":
        return "text-yellow-600 bg-yellow-50";
      case "Skipped":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Transactions</h2>
          <p className="text-muted-foreground">
            Automate recurring transactions like monthly rent, subscriptions, and regular payments
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadTemplates} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Recurring Template</DialogTitle>
                <DialogDescription>
                  Set up a template for automated recurring transactions
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Monthly Rent"
                    />
                  </div>
                  <div>
                    <Label htmlFor="transactionType">Transaction Type</Label>
                    <Select
                      value={formData.transactionType}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, transactionType: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sales Invoice">Sales Invoice</SelectItem>
                        <SelectItem value="Purchase Invoice">Purchase Invoice</SelectItem>
                        <SelectItem value="Payment Entry">Payment Entry</SelectItem>
                        <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select
                      value={formData.frequency}
                      onValueChange={value =>
                        setFormData(prev => ({ ...prev, frequency: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Daily">Daily</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Quarterly">Quarterly</SelectItem>
                        <SelectItem value="Yearly">Yearly</SelectItem>
                        <SelectItem value="Custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>

                {formData.frequency === "Custom" && (
                  <div>
                    <Label htmlFor="customInterval">Custom Interval (months)</Label>
                    <Input
                      id="customInterval"
                      type="number"
                      min="1"
                      value={formData.customInterval || ""}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, customInterval: parseInt(e.target.value) }))
                      }
                      placeholder="e.g., 3 for every 3 months"
                    />
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateTemplate}>Create Template</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Executions</TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Templates</CardTitle>
              <CardDescription>
                Manage your automated recurring transaction templates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-8 w-8 animate-spin mr-2" />
                  <span>Loading templates...</span>
                </div>
              ) : templates.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Next Execution</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {templates.map(template => (
                        <TableRow key={template.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{template.name}</div>
                              {template.description && (
                                <div className="text-sm text-muted-foreground">
                                  {template.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{template.transactionType}</TableCell>
                          <TableCell>
                            {template.frequency}
                            {template.customInterval && ` (${template.customInterval} months)`}
                          </TableCell>
                          <TableCell>
                            {format(new Date(template.nextExecutionDate), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                template.isActive
                                  ? "text-green-600 bg-green-50"
                                  : "text-gray-600 bg-gray-50"
                              }
                            >
                              {template.isActive ? "Active" : "Paused"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  loadExecutionHistory(template.id);
                                  setShowHistoryDialog(true);
                                }}
                              >
                                <History className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExecuteTemplate(template.id)}
                                disabled={!template.isActive}
                              >
                                <Play className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  template.isActive
                                    ? handlePauseTemplate(template.id)
                                    : handleResumeTemplate(template.id)
                                }
                              >
                                {template.isActive ? (
                                  <Pause className="h-4 w-4" />
                                ) : (
                                  <Play className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteTemplate(template.id)}
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
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Templates Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first recurring transaction template to get started
                  </p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upcoming Executions Tab */}
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Executions</CardTitle>
              <CardDescription>
                Transactions scheduled to be executed in the next 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingExecutions.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Template</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Scheduled Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingExecutions.map(execution => (
                        <TableRow key={execution.id}>
                          <TableCell className="font-medium">{execution.name}</TableCell>
                          <TableCell>{execution.transaction_type}</TableCell>
                          <TableCell>{execution.frequency}</TableCell>
                          <TableCell>
                            {format(new Date(execution.next_execution_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleExecuteTemplate(execution.id)}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Upcoming Executions</h3>
                  <p className="text-muted-foreground">
                    No recurring transactions are scheduled for the next 30 days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Execution History Dialog */}
      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Execution History</DialogTitle>
            <DialogDescription>
              History of executions for {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Execution Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Executed At</TableHead>
                  <TableHead>Error Message</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {executionHistory.map(execution => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      {format(new Date(execution.executionDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(execution.status)}
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {execution.executedAt
                        ? format(new Date(execution.executedAt), "MMM dd, yyyy HH:mm")
                        : "-"}
                    </TableCell>
                    <TableCell>{execution.errorMessage || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
