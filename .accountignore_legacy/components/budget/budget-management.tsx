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
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Search,
  Edit,
  Trash2,
  FileText,
  Settings,
  Users,
  Clock,
} from "lucide-react";
import {
  BudgetManagementService,
  Budget,
  BudgetPeriod,
  BudgetItem,
  BudgetVsActualReport,
  BudgetVariance,
  CreateBudgetPeriodInput,
  CreateBudgetInput,
  CreateBudgetItemInput,
} from "@/lib/budget-management";
import { AccountingService } from "@/lib/accounting-service";
import { format } from "date-fns";

interface BudgetManagementProps {
  companyId: string;
}

export function BudgetManagement({ companyId }: BudgetManagementProps) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetPeriods, setBudgetPeriods] = useState<BudgetPeriod[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetReport, setBudgetReport] = useState<BudgetVsActualReport[]>([]);
  const [budgetVariance, setBudgetVariance] = useState<BudgetVariance | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreatePeriodDialog, setShowCreatePeriodDialog] = useState(false);
  const [showCreateBudgetDialog, setShowCreateBudgetDialog] = useState(false);
  const [showCreateItemDialog, setShowCreateItemDialog] = useState(false);

  // Form states
  const [periodForm, setPeriodForm] = useState<CreateBudgetPeriodInput>({
    companyId,
    periodName: "",
    periodType: "Monthly",
    startDate: "",
    endDate: "",
  });

  const [budgetForm, setBudgetForm] = useState<CreateBudgetInput>({
    companyId,
    budgetName: "",
    budgetPeriodId: "",
    budgetType: "Master",
  });

  const [itemForm, setItemForm] = useState<CreateBudgetItemInput>({
    budgetId: "",
    accountId: "",
    budgetAmount: 0,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [companyId]);

  useEffect(() => {
    if (selectedBudget) {
      loadBudgetDetails(selectedBudget.id);
    }
  }, [selectedBudget]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadBudgets(), loadBudgetPeriods(), loadAccounts()]);
    } finally {
      setLoading(false);
    }
  };

  const loadBudgets = async () => {
    try {
      const result = await BudgetManagementService.getBudgets(companyId);
      if (result.success && result.budgets) {
        setBudgets(result.budgets);
      }
    } catch (error) {
      console.error("Error loading budgets:", error);
    }
  };

  const loadBudgetPeriods = async () => {
    try {
      const result = await BudgetManagementService.getBudgetPeriods(companyId);
      if (result.success && result.periods) {
        setBudgetPeriods(result.periods);
      }
    } catch (error) {
      console.error("Error loading budget periods:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await AccountingService.getAccounts(companyId);
      if (result.success && result.data) {
        setAccounts(result.data);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const loadBudgetDetails = async (budgetId: string) => {
    try {
      await Promise.all([
        loadBudgetItems(budgetId),
        loadBudgetReport(budgetId),
        loadBudgetVariance(budgetId),
      ]);
    } catch (error) {
      console.error("Error loading budget details:", error);
    }
  };

  const loadBudgetItems = async (budgetId: string) => {
    try {
      const result = await BudgetManagementService.getBudgetItems(budgetId);
      if (result.success && result.budgetItems) {
        setBudgetItems(result.budgetItems);
      }
    } catch (error) {
      console.error("Error loading budget items:", error);
    }
  };

  const loadBudgetReport = async (budgetId: string) => {
    try {
      const result = await BudgetManagementService.getBudgetVsActualReport(budgetId);
      if (result.success && result.report) {
        setBudgetReport(result.report);
      }
    } catch (error) {
      console.error("Error loading budget report:", error);
    }
  };

  const loadBudgetVariance = async (budgetId: string) => {
    try {
      const result = await BudgetManagementService.getBudgetVariance(budgetId);
      if (result.success && result.variance) {
        setBudgetVariance(result.variance);
      }
    } catch (error) {
      console.error("Error loading budget variance:", error);
    }
  };

  const handleCreatePeriod = async () => {
    try {
      const result = await BudgetManagementService.createBudgetPeriod(periodForm);
      if (result.success) {
        setShowCreatePeriodDialog(false);
        setPeriodForm({
          companyId,
          periodName: "",
          periodType: "Monthly",
          startDate: "",
          endDate: "",
        });
        loadBudgetPeriods();
      }
    } catch (error) {
      console.error("Error creating budget period:", error);
    }
  };

  const handleCreateBudget = async () => {
    try {
      const result = await BudgetManagementService.createBudget(budgetForm);
      if (result.success) {
        setShowCreateBudgetDialog(false);
        setBudgetForm({
          companyId,
          budgetName: "",
          budgetPeriodId: "",
          budgetType: "Master",
        });
        loadBudgets();
      }
    } catch (error) {
      console.error("Error creating budget:", error);
    }
  };

  const handleCreateItem = async () => {
    if (!selectedBudget) return;

    try {
      const result = await BudgetManagementService.addBudgetItem({
        ...itemForm,
        budgetId: selectedBudget.id,
      });
      if (result.success) {
        setShowCreateItemDialog(false);
        setItemForm({
          budgetId: "",
          accountId: "",
          budgetAmount: 0,
          notes: "",
        });
        loadBudgetDetails(selectedBudget.id);
      }
    } catch (error) {
      console.error("Error creating budget item:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "text-green-600 bg-green-50";
      case "Approved":
        return "text-blue-600 bg-blue-50";
      case "Draft":
        return "text-yellow-600 bg-yellow-50";
      case "Closed":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getVarianceColor = (variance: number) => {
    if (variance > 0) return "text-green-600";
    if (variance < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getVarianceIcon = (variance: number) => {
    if (variance > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (variance < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <CheckCircle className="h-4 w-4 text-gray-500" />;
  };

  const filteredBudgets = budgets.filter(budget =>
    budget.budgetName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Budget Management</h2>
          <p className="text-muted-foreground">
            Create, track, and analyze budgets vs actual performance
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showCreateBudgetDialog} onOpenChange={setShowCreateBudgetDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Budget
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Budget</DialogTitle>
                <DialogDescription>Set up a new budget for tracking and analysis</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="budgetName">Budget Name</Label>
                  <Input
                    id="budgetName"
                    value={budgetForm.budgetName}
                    onChange={e => setBudgetForm(prev => ({ ...prev, budgetName: e.target.value }))}
                    placeholder="e.g., 2024 Annual Budget"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budgetPeriod">Budget Period</Label>
                    <Select
                      value={budgetForm.budgetPeriodId}
                      onValueChange={value =>
                        setBudgetForm(prev => ({ ...prev, budgetPeriodId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select period" />
                      </SelectTrigger>
                      <SelectContent>
                        {budgetPeriods.map(period => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.periodName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="budgetType">Budget Type</Label>
                    <Select
                      value={budgetForm.budgetType}
                      onValueChange={value =>
                        setBudgetForm(prev => ({ ...prev, budgetType: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Master">Master Budget</SelectItem>
                        <SelectItem value="Department">Department Budget</SelectItem>
                        <SelectItem value="Project">Project Budget</SelectItem>
                        <SelectItem value="Cash Flow">Cash Flow Budget</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateBudgetDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateBudget}>Create Budget</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Budgets List */}
      <Card>
        <CardHeader>
          <CardTitle>Budgets</CardTitle>
          <CardDescription>Select a budget to view detailed analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredBudgets.length > 0 ? (
            <div className="space-y-4">
              {filteredBudgets.map(budget => (
                <Card
                  key={budget.id}
                  className={`cursor-pointer transition-colors ${
                    selectedBudget?.id === budget.id ? "ring-2 ring-blue-500" : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedBudget(budget)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <BarChart3 className="h-5 w-5 text-blue-500" />
                          <div>
                            <div className="font-medium">{budget.budgetName}</div>
                            <div className="text-sm text-muted-foreground">
                              {budget.budgetType} •{" "}
                              {budgetPeriods.find(p => p.id === budget.budgetPeriodId)?.periodName}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Budget: {formatCurrency(budget.totalBudgetAmount)}</span>
                          <span>Actual: {formatCurrency(budget.totalActualAmount)}</span>
                          <span className={getVarianceColor(budget.totalVarianceAmount)}>
                            Variance: {formatCurrency(budget.totalVarianceAmount)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(budget.status)}>{budget.status}</Badge>
                        <div className="flex items-center space-x-1">
                          {getVarianceIcon(budget.totalVarianceAmount)}
                          <span
                            className={`text-sm font-medium ${getVarianceColor(budget.totalVarianceAmount)}`}
                          >
                            {budget.totalVariancePercentage.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Budgets Found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first budget to start tracking performance
              </p>
              <Button onClick={() => setShowCreateBudgetDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Details */}
      {selectedBudget && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="report">Budget vs Actual</TabsTrigger>
            <TabsTrigger value="items">Budget Items</TabsTrigger>
            <TabsTrigger value="variance">Variance Analysis</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            {/* Budget Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Budget Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(selectedBudget.totalBudgetAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Budget</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatCurrency(selectedBudget.totalActualAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">Actual Amount</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getVarianceColor(selectedBudget.totalVarianceAmount)}`}
                    >
                      {formatCurrency(selectedBudget.totalVarianceAmount)}
                    </div>
                    <div className="text-sm text-muted-foreground">Variance</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-2xl font-bold ${getVarianceColor(selectedBudget.totalVariancePercentage)}`}
                    >
                      {selectedBudget.totalVariancePercentage.toFixed(1)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Variance %</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget Performance */}
            {budgetVariance && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Budget Utilization</span>
                      <span className="font-medium">
                        {((budgetVariance.totalActual / budgetVariance.totalBudget) * 100).toFixed(
                          1,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(budgetVariance.totalActual / budgetVariance.totalBudget) * 100}
                      className="h-2"
                    />
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Remaining Budget</div>
                        <div className="font-medium">
                          {formatCurrency(budgetVariance.totalBudget - budgetVariance.totalActual)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Variance Status</div>
                        <div
                          className={`font-medium ${getVarianceColor(budgetVariance.totalVariance)}`}
                        >
                          {budgetVariance.totalVariance > 0
                            ? "Over Budget"
                            : budgetVariance.totalVariance < 0
                              ? "Under Budget"
                              : "On Budget"}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Budget vs Actual Report Tab */}
          <TabsContent value="report" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Budget vs Actual Report</CardTitle>
                    <CardDescription>
                      Detailed comparison of budgeted vs actual amounts
                    </CardDescription>
                  </div>
                  <Button onClick={() => loadBudgetReport(selectedBudget.id)}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {budgetReport.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Budget</TableHead>
                          <TableHead className="text-right">Actual</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead className="text-right">Variance %</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetReport.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.accountName}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.accountCode}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.accountType}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.budgetAmount)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.actualAmount)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${getVarianceColor(item.varianceAmount)}`}
                            >
                              {formatCurrency(item.varianceAmount)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${getVarianceColor(item.variancePercentage)}`}
                            >
                              {item.variancePercentage.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Report Data</h3>
                    <p className="text-muted-foreground">Add budget items to generate the report</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Budget Items</CardTitle>
                    <CardDescription>Manage individual budget line items</CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateItemDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {budgetItems.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Account</TableHead>
                          <TableHead className="text-right">Budget Amount</TableHead>
                          <TableHead className="text-right">Actual Amount</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell>
                              {accounts.find(a => a.id === item.accountId)?.name ||
                                "Unknown Account"}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.budgetAmount)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.actualAmount)}
                            </TableCell>
                            <TableCell
                              className={`text-right font-medium ${getVarianceColor(item.varianceAmount)}`}
                            >
                              {formatCurrency(item.varianceAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
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
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Budget Items</h3>
                    <p className="text-muted-foreground mb-4">
                      Add budget items to track specific accounts
                    </p>
                    <Button onClick={() => setShowCreateItemDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Variance Analysis Tab */}
          <TabsContent value="variance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Variance Analysis</CardTitle>
                <CardDescription>Analyze budget variances and identify trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Variance Analysis</h3>
                  <p className="text-muted-foreground">
                    Advanced variance analysis features coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Budget Item Dialog */}
      <Dialog open={showCreateItemDialog} onOpenChange={setShowCreateItemDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Item</DialogTitle>
            <DialogDescription>
              Add a new line item to {selectedBudget?.budgetName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountId">Account</Label>
              <Select
                value={itemForm.accountId}
                onValueChange={value => setItemForm(prev => ({ ...prev, accountId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountCode} - {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="budgetAmount">Budget Amount</Label>
              <Input
                id="budgetAmount"
                type="number"
                step="0.01"
                value={itemForm.budgetAmount}
                onChange={e =>
                  setItemForm(prev => ({ ...prev, budgetAmount: parseFloat(e.target.value) }))
                }
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={itemForm.notes}
                onChange={e => setItemForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this budget item"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateItemDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateItem}>Add Item</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
