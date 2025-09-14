/**
 * Executive KPI Dashboard Page - Advanced Financial Intelligence
 * Real-time Executive Dashboard with Comprehensive KPI Analytics
 */

"use client";

import React from "react";
import AdvancedKPIDashboard from "@/components/kpi/AdvancedKPIDashboard";

export default function ExecutiveDashboardPage() {
  const companyId = "current-company-id"; // Get from context/props in real app

  return (
    <div className="container mx-auto p-6">
      <AdvancedKPIDashboard companyId={companyId} />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "Executive Dashboard - Advanced Financial Intelligence & Real-time KPI Analytics",
  description:
    "Comprehensive executive dashboard with real-time KPI monitoring, AI-powered financial insights, performance benchmarking, and strategic recommendations for C-level decision making.",
};
