"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Settings,
  Building2,
  Calculator,
  Package,
  Target,
  TrendingUp,
  FileText,
  Wrench,
  Zap,
} from "lucide-react";
import { RecurringTransactions } from "@/components/transactions/recurring-transactions";
import { BankReconciliation } from "@/components/transactions/bank-reconciliation";
import { InventoryManagement } from "@/components/inventory/inventory-management";
import { ProjectCosting } from "@/components/projects/project-costing";
import { BudgetManagement } from "@/components/budget/budget-management";
import { TaxCalculation } from "@/components/tax/tax-calculation";
import { FixedAssetsManagement } from "@/components/fixed-assets/fixed-assets-management";
import { QuickWinsDashboard } from "@/components/quick-wins/quick-wins-dashboard";

export default function AdvancedFeaturesPage() {
  const [loading, setLoading] = useState(false);

  const companyId = "default-company"; // In a real app, this would come from context

  const features = [
    {
      id: "recurring",
      title: "Recurring Transactions",
      description:
        "Automate recurring transactions like monthly rent, subscriptions, and regular payments",
      icon: RefreshCw,
      color: "text-blue-600 bg-blue-50",
    },
    {
      id: "reconciliation",
      title: "Bank Reconciliation",
      description: "Reconcile bank statements with your accounting records automatically",
      icon: Calculator,
      color: "text-green-600 bg-green-50",
    },
    {
      id: "inventory",
      title: "Inventory Tracking",
      description: "Track inventory levels, costs, and movements",
      icon: Package,
      color: "text-orange-600 bg-orange-50",
    },
    {
      id: "projects",
      title: "Project Costing",
      description: "Track costs and profitability by project or job",
      icon: Target,
      color: "text-purple-600 bg-purple-50",
    },
    {
      id: "budgets",
      title: "Budget vs Actual",
      description: "Compare actual results with budgeted amounts",
      icon: TrendingUp,
      color: "text-cyan-600 bg-cyan-50",
    },
    {
      id: "tax",
      title: "Tax Calculation",
      description: "Automated tax calculations and compliance",
      icon: FileText,
      color: "text-red-600 bg-red-50",
    },
    {
      id: "fixed-assets",
      title: "Fixed Assets Management",
      description: "Comprehensive asset management with depreciation and maintenance",
      icon: Wrench,
      color: "text-indigo-600 bg-indigo-50",
    },
    {
      id: "quick-wins",
      title: "Quick Wins",
      description: "Power user features and performance optimizations",
      icon: Zap,
      color: "text-yellow-600 bg-yellow-50",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Advanced Features</h1>
        <p className="text-muted-foreground">
          Powerful tools to automate and streamline your accounting processes
        </p>
      </div>

      {/* Feature Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(feature => {
          const IconComponent = feature.icon;
          const isAvailable =
            feature.id === "recurring" ||
            feature.id === "reconciliation" ||
            feature.id === "inventory" ||
            feature.id === "projects" ||
            feature.id === "budgets" ||
            feature.id === "tax" ||
            feature.id === "fixed-assets" ||
            feature.id === "quick-wins";

          return (
            <Card
              key={feature.id}
              className={`transition-all ${
                isAvailable ? "hover:shadow-md cursor-pointer" : "opacity-60 cursor-not-allowed"
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${feature.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    {!isAvailable && (
                      <Badge variant="outline" className="text-xs">
                        Coming Soon
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="recurring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="recurring">Recurring Transactions</TabsTrigger>
          <TabsTrigger value="reconciliation">Bank Reconciliation</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Management</TabsTrigger>
          <TabsTrigger value="projects">Project Costing</TabsTrigger>
          <TabsTrigger value="budgets">Budget Management</TabsTrigger>
          <TabsTrigger value="tax">Tax Calculation</TabsTrigger>
          <TabsTrigger value="fixed-assets">Fixed Assets</TabsTrigger>
          <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
        </TabsList>

        <TabsContent value="recurring" className="space-y-4">
          <RecurringTransactions companyId={companyId} />
        </TabsContent>

        <TabsContent value="reconciliation" className="space-y-4">
          <BankReconciliation companyId={companyId} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <InventoryManagement companyId={companyId} />
        </TabsContent>

        <TabsContent value="projects" className="space-y-4">
          <ProjectCosting companyId={companyId} />
        </TabsContent>

        <TabsContent value="budgets" className="space-y-4">
          <BudgetManagement companyId={companyId} />
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <TaxCalculation companyId={companyId} />
        </TabsContent>

        <TabsContent value="fixed-assets" className="space-y-4">
          <FixedAssetsManagement companyId={companyId} />
        </TabsContent>

        <TabsContent value="quick-wins" className="space-y-4">
          <QuickWinsDashboard companyId={companyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
