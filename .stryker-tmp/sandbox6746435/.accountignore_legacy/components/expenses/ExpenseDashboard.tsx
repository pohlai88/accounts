/**
 * Expense Dashboard - Complete Employee Expense Management
 * OCR-ready receipt processing, approval workflows, and analytics
 */
// @ts-nocheck


"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Receipt,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  CreditCard,
  Car,
  FileText,
  Users,
  Calendar,
  Settings,
  Eye,
  Edit,
  Upload,
} from "lucide-react";
import {
  ExpenseManagementService,
  ExpenseClaim,
  ExpenseCategory,
  ExpensePolicy,
  ExpenseAdvance,
  ExpenseClaimStatus,
} from "@/lib/expense-management-service";

interface ExpenseAnalytics {
  total_expenses: number;
  total_reimbursed: number;
  pending_approval: number;
  rejected_amount: number;
  average_processing_time: number;
  expenses_by_category: { category: string; amount: number; count: number }[];
  expenses_by_employee: { employee: string; amount: number; count: number }[];
  monthly_trend: { month: string; amount: number }[];
  policy_violations: number;
  receipt_compliance_rate: number;
}

export default function ExpenseDashboard() {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [policies, setPolicies] = useState<ExpensePolicy[]>([]);
  const [advances, setAdvances] = useState<ExpenseAdvance[]>([]);
  const [analytics, setAnalytics] = useState<ExpenseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ExpenseClaimStatus | "All">("All");
  const [userRole, setUserRole] = useState<"employee" | "manager" | "finance">("employee");

  const companyId = "current-company-id"; // Get from context/props
  const currentUserId = "current-user-id"; // Get from auth context

  useEffect(() => {
    loadDashboardData();
  }, [companyId, selectedFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [claimsResult, categoriesResult, policiesResult, advancesResult, analyticsResult] =
        await Promise.all([
          ExpenseManagementService.getExpenseClaims(companyId, {
            status: selectedFilter === "All" ? undefined : selectedFilter,
            employee_id: userRole === "employee" ? currentUserId : undefined,
          }),
          ExpenseManagementService.getExpenseCategories(companyId),
          ExpenseManagementService.getExpensePolicies(companyId),
          // Get advances would be implemented similar to claims
          Promise.resolve({ success: true, data: [] as ExpenseAdvance[] }),
          ExpenseManagementService.getExpenseAnalytics(companyId),
        ]);

      if (claimsResult.success && claimsResult.data) {
        setClaims(claimsResult.data);
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (policiesResult.success && policiesResult.data) {
        setPolicies(policiesResult.data);
      }

      if (advancesResult.success && advancesResult.data) {
        setAdvances(advancesResult.data);
      }

      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
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

  const getStatusBadgeVariant = (status: ExpenseClaimStatus) => {
    switch (status) {
      case "Draft":
        return "secondary";
      case "Submitted":
        return "outline";
      case "Approved by Manager":
      case "Approved by Finance":
        return "default";
      case "Paid":
        return "default";
      case "Rejected":
        return "destructive";
      case "Cancelled":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusColor = (status: ExpenseClaimStatus) => {
    switch (status) {
      case "Paid":
        return "text-green-600";
      case "Approved by Manager":
      case "Approved by Finance":
        return "text-blue-600";
      case "Submitted":
        return "text-yellow-600";
      case "Rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading expense dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Expense Management</h2>
          <p className="text-muted-foreground">Employee expenses, receipts, and reimbursements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Expense
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(analytics.total_expenses)}</div>
              <p className="text-xs text-muted-foreground">All time expenses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reimbursed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.total_reimbursed)}
              </div>
              <p className="text-xs text-muted-foreground">Processed reimbursements</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(analytics.pending_approval)}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.average_processing_time.toFixed(1)} days
              </div>
              <p className="text-xs text-muted-foreground">Average approval time</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">New Expense</h3>
            <p className="text-xs text-muted-foreground mt-1">Submit new expense claim</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Upload className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Upload Receipt</h3>
            <p className="text-xs text-muted-foreground mt-1">Add receipts with OCR</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <Car className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Mileage Log</h3>
            <p className="text-xs text-muted-foreground mt-1">Track vehicle expenses</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardContent className="p-4 text-center">
            <CreditCard className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <h3 className="font-semibold text-sm">Cash Advance</h3>
            <p className="text-xs text-muted-foreground mt-1">Request expense advance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="claims" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="claims">My Claims</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="advances">Advances</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Expense Claims */}
        <TabsContent value="claims" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Expense Claims ({claims.length})
                </span>
                <div className="flex gap-2">
                  <select
                    value={selectedFilter}
                    onChange={e => setSelectedFilter(e.target.value as ExpenseClaimStatus | "All")}
                    className="px-3 py-1 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="All">All Status</option>
                    <option value="Draft">Draft</option>
                    <option value="Submitted">Submitted</option>
                    <option value="Approved by Manager">Approved by Manager</option>
                    <option value="Approved by Finance">Approved by Finance</option>
                    <option value="Paid">Paid</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Claim
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Claim</th>
                      <th className="text-left p-3 font-medium">Employee</th>
                      <th className="text-left p-3 font-medium">Amount</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Submitted</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map(claim => (
                      <tr key={claim.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{claim.claim_no}</div>
                            <div className="text-sm text-muted-foreground">{claim.claim_title}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="text-sm font-medium">{claim.employee_name}</div>
                            <div className="text-xs text-muted-foreground">{claim.department}</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {formatCurrency(claim.total_claimed_amount)}
                          </div>
                          {claim.total_sanctioned_amount !== claim.total_claimed_amount && (
                            <div className="text-sm text-muted-foreground">
                              Approved: {formatCurrency(claim.total_sanctioned_amount)}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(claim.status)}>
                            {claim.status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="text-sm">
                            {claim.submitted_at
                              ? new Date(claim.submitted_at).toLocaleDateString()
                              : "Not submitted"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {claim.status === "Draft" && (
                              <Button size="sm" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {(userRole === "manager" || userRole === "finance") &&
                              claim.status === "Submitted" && (
                                <Button size="sm" variant="outline">
                                  Review
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {claims.length === 0 && (
                <div className="text-center py-8">
                  <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No expense claims found</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Submit your first expense claim to get started
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Expense Claim
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals */}
        <TabsContent value="approvals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No pending approvals</p>
                <p className="text-sm text-muted-foreground">
                  Expense claims requiring your approval will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advances */}
        <TabsContent value="advances" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Cash Advances ({advances.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  Request Advance
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No cash advances</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Request cash advances for upcoming expenses
                </p>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Request Cash Advance
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Expense Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Receipt Compliance</span>
                    <div className="text-right">
                      <div className="font-medium">
                        {analytics.receipt_compliance_rate.toFixed(1)}%
                      </div>
                      <Progress value={analytics.receipt_compliance_rate} className="w-20 mt-1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Policy Violations</span>
                    <div className="font-medium text-red-600">{analytics.policy_violations}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Rejected Amount</span>
                    <div className="font-medium">{formatCurrency(analytics.rejected_amount)}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Top Categories
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categories.slice(0, 5).map(category => (
                      <div key={category.id} className="flex items-center justify-between">
                        <span className="text-sm">{category.category_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {category.is_billable ? "Billable" : "Non-billable"}
                        </Badge>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No expense categories configured
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
