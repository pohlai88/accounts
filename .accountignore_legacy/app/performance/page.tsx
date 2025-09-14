/**
 * Performance Monitoring Page - Enterprise System Performance Dashboard
 * Real-time Performance Analytics & Optimization Management
 */

"use client";

import React from "react";
import PerformanceDashboard from "@/components/performance/PerformanceDashboard";

export default function PerformancePage() {
  const companyId = "current-company-id"; // Get from context/props in real app

  return (
    <div className="container mx-auto p-6">
      <PerformanceDashboard companyId={companyId} />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "Performance Dashboard - Enterprise System Performance Monitoring & Optimization",
  description:
    "Real-time system performance monitoring with automated optimization recommendations, database query analysis, and scalability insights for enterprise accounting systems.",
};
