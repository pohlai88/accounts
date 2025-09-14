/**
 * Advanced Automation Page - AI-Powered Business Intelligence
 */

"use client";

import React from "react";
import AutomationDashboard from "@/components/automation/AutomationDashboard";

export default function AutomationPage() {
  return (
    <div className="container mx-auto p-6">
      <AutomationDashboard />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "Advanced Automation - AI-Powered Business Intelligence & Workflow Automation",
  description:
    "Comprehensive automation platform with AI models, smart recommendations, anomaly detection, and intelligent workflow automation.",
};
