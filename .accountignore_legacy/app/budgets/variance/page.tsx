/**
 * Budget Variance Analysis Page - CFO Performance Management
 * Advanced Budget vs Actual Reporting and Analysis
 */

"use client";

import React from "react";
import BudgetVarianceDashboard from "@/components/budgets/BudgetVarianceDashboard";

export default function BudgetVariancePage() {
  const budgetPlanId = "current-budget-plan-id"; // Get from params/context in real app
  const companyId = "current-company-id"; // Get from context/props in real app

  return (
    <div className="container mx-auto p-6">
      <BudgetVarianceDashboard budgetPlanId={budgetPlanId} companyId={companyId} />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "Budget Variance Analysis - Advanced Budget vs Actual Performance Management",
  description:
    "Comprehensive budget variance analysis with drill-down capabilities, automated alerts, and AI-powered recommendations for CFO-level financial performance management.",
};
