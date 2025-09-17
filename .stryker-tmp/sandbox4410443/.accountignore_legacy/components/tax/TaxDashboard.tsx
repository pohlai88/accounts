/**
 * Tax Dashboard - Complete Tax Management & Compliance Overview
 * Multi-jurisdiction tax handling with automated calculations and filing
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
  Calculator,
  Receipt,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Settings,
  Plus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building,
  Shield,
  DollarSign,
  PieChart,
} from "lucide-react";
import {
  TaxManagementService,
  TaxAuthority,
  TaxCategory,
  TaxTemplate,
  TaxFilingPeriod,
  FilingStatus,
} from "@/lib/tax-management-service";

interface TaxAnalytics {
  total_tax_collected: number;
  total_tax_paid: number;
  net_tax_liability: number;
  tax_by_authority: { name: string; total_amount: number; transaction_count: number }[];
  tax_by_category: { name: string; total_amount: number; transaction_count: number }[];
  filing_compliance_rate: number;
}

export default function TaxDashboard() {
  const [authorities, setAuthorities] = useState<TaxAuthority[]>([]);
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [templates, setTemplates] = useState<TaxTemplate[]>([]);
  const [filingPeriods, setFilingPeriods] = useState<TaxFilingPeriod[]>([]);
  const [analytics, setAnalytics] = useState<TaxAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const companyId = "current-company-id"; // Get from context/props

  useEffect(() => {
    loadDashboardData();
  }, [companyId, selectedYear]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        authoritiesResult,
        categoriesResult,
        templatesResult,
        filingPeriodsResult,
        analyticsResult,
      ] = await Promise.all([
        TaxManagementService.getTaxAuthorities(companyId),
        TaxManagementService.getTaxCategories(companyId),
        TaxManagementService.getTaxTemplates(companyId),
        TaxManagementService.getFilingPeriods(companyId, { year: selectedYear }),
        TaxManagementService.getTaxAnalytics(companyId, selectedYear),
      ]);

      if (authoritiesResult.success && authoritiesResult.data) {
        setAuthorities(authoritiesResult.data);
      }

      if (categoriesResult.success && categoriesResult.data) {
        setCategories(categoriesResult.data);
      }

      if (templatesResult.success && templatesResult.data) {
        setTemplates(templatesResult.data);
      }

      if (filingPeriodsResult.success && filingPeriodsResult.data) {
        setFilingPeriods(filingPeriodsResult.data);
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

  const getStatusBadgeVariant = (status: FilingStatus) => {
    switch (status) {
      case "Filed":
      case "Paid":
        return "default";
      case "Open":
        return "secondary";
      case "Overdue":
        return "destructive";
      case "Amended":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tax dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Tax Management</h2>
          <p className="text-muted-foreground">
            Multi-jurisdiction tax compliance and automated calculations
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(parseInt(e.target.value))}
            className="px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Tax Rate
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Collected</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(analytics.total_tax_collected)}
              </div>
              <p className="text-xs text-muted-foreground">Sales tax collected this year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tax Paid</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(analytics.total_tax_paid)}
              </div>
              <p className="text-xs text-muted-foreground">Purchase tax paid this year</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Liability</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${analytics.net_tax_liability >= 0 ? "text-red-600" : "text-green-600"}`}
              >
                {formatCurrency(Math.abs(analytics.net_tax_liability))}
              </div>
              <p className="text-xs text-muted-foreground">
                {analytics.net_tax_liability >= 0 ? "Amount owed" : "Refund expected"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <Shield
                className={`h-4 w-4 ${getComplianceColor(analytics.filing_compliance_rate)}`}
              />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getComplianceColor(analytics.filing_compliance_rate)}`}
              >
                {analytics.filing_compliance_rate.toFixed(1)}%
              </div>
              <Progress value={analytics.filing_compliance_rate} className="mt-2" />
              <p className="text-xs text-muted-foreground mt-2">Filing compliance rate</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="authorities">Authorities</TabsTrigger>
          <TabsTrigger value="rates">Tax Rates</TabsTrigger>
          <TabsTrigger value="filing">Filing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Quick Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Tax Authorities</p>
                    <p className="text-sm text-muted-foreground">{authorities.length} configured</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {authorities.length === 0 ? "Add First" : "Manage"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Tax Categories</p>
                    <p className="text-sm text-muted-foreground">{categories.length} configured</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {categories.length === 0 ? "Add First" : "Manage"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Tax Templates</p>
                    <p className="text-sm text-muted-foreground">{templates.length} configured</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {templates.length === 0 ? "Add First" : "Manage"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Filings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Filings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filingPeriods
                    .filter(period => period.filing_status === "Open")
                    .slice(0, 5)
                    .map(period => (
                      <div
                        key={period.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{period.period_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Due: {new Date(period.due_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusBadgeVariant(period.filing_status)}>
                            {period.filing_status}
                          </Badge>
                          {new Date(period.due_date) < new Date() && (
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    ))}

                  {filingPeriods.filter(p => p.filing_status === "Open").length === 0 && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                      <p className="text-muted-foreground">All filings up to date</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Tax Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No recent tax activity</p>
                <p className="text-sm text-muted-foreground">
                  Tax calculations and filings will appear here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Authorities */}
        <TabsContent value="authorities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Tax Authorities ({authorities.length})
                </span>
                <Button size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Authority
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Authority</th>
                      <th className="text-left p-3 font-medium">Jurisdiction</th>
                      <th className="text-left p-3 font-medium">Filing Frequency</th>
                      <th className="text-left p-3 font-medium">Registration</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authorities.map(authority => (
                      <tr key={authority.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{authority.authority_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {authority.authority_code}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline">{authority.jurisdiction_type}</Badge>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">{authority.filing_frequency}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">
                            {authority.tax_registration_number || "Not set"}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant={authority.is_active ? "default" : "secondary"}>
                            {authority.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            <Button size="sm" variant="ghost">
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {authorities.length === 0 && (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">No tax authorities configured</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set up tax authorities to start calculating taxes
                  </p>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Tax Authority
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tax Rates */}
        <TabsContent value="rates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Tax Rates & Templates
                </span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Template
                  </Button>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Rate
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Tax Templates ({templates.length})</h4>
                  <div className="space-y-2">
                    {templates.slice(0, 5).map(template => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{template.template_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {template.template_type} • {template.is_default ? "Default" : "Custom"}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost">
                          Edit
                        </Button>
                      </div>
                    ))}
                    {templates.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No templates configured
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-3">Tax Categories ({categories.length})</h4>
                  <div className="space-y-2">
                    {categories.slice(0, 5).map(category => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{category.category_name}</p>
                          <p className="text-sm text-muted-foreground">{category.tax_type}</p>
                        </div>
                        <Badge variant={category.is_active ? "default" : "secondary"}>
                          {category.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No categories configured
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Filing */}
        <TabsContent value="filing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Tax Filing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Period</th>
                      <th className="text-left p-3 font-medium">Authority</th>
                      <th className="text-left p-3 font-medium">Due Date</th>
                      <th className="text-left p-3 font-medium">Tax Liability</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-center p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filingPeriods.slice(0, 10).map(period => (
                      <tr key={period.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{period.period_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(period.period_start_date).toLocaleDateString()} -{" "}
                              {new Date(period.period_end_date).toLocaleDateString()}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-sm">
                            {(period as any).authority?.authority_name}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {new Date(period.due_date).toLocaleDateString()}
                            </span>
                            {new Date(period.due_date) < new Date() &&
                              period.filing_status === "Open" && (
                                <AlertTriangle className="w-4 h-4 text-red-500" />
                              )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-medium">
                            {formatCurrency(period.net_tax_liability)}
                          </span>
                        </td>
                        <td className="p-3">
                          <Badge variant={getStatusBadgeVariant(period.filing_status)}>
                            {period.filing_status}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-2">
                            {period.filing_status === "Open" && (
                              <Button size="sm" variant="outline">
                                File Return
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              View Details
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
                    <PieChart className="w-5 h-5" />
                    Tax by Authority
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.tax_by_authority.map(authority => (
                      <div key={authority.name} className="flex items-center justify-between">
                        <span className="text-sm">{authority.name}</span>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(authority.total_amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {authority.transaction_count} transactions
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Tax by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.tax_by_category.map(category => (
                      <div key={category.name} className="flex items-center justify-between">
                        <span className="text-sm">{category.name}</span>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(category.total_amount)}</div>
                          <div className="text-xs text-muted-foreground">
                            {category.transaction_count} transactions
                          </div>
                        </div>
                      </div>
                    ))}
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
