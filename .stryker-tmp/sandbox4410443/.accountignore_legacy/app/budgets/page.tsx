/**
 * Budgeting & Forecasting Page - Complete Financial Planning System
 */
// @ts-nocheck


"use client";

import React from "react";
import BudgetDashboard from "@/components/budgeting/BudgetDashboard";

export default function BudgetsPage() {
  return (
    <div className="container mx-auto p-6">
      <BudgetDashboard />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "Budgeting & Forecasting - Financial Planning & Variance Analysis",
  description:
    "Complete budgeting system with multi-dimensional planning, variance analysis, forecasting algorithms, and scenario modeling.",
};
