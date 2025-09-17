/**
 * Consolidated Reporting Page
 * Multi-Entity Financial Consolidation & Reporting Interface
 *
 * Features:
 * - Multi-entity consolidation management
 * - Real-time consolidation processing and monitoring
 * - Consolidated financial statement generation
 * - Intercompany elimination tracking
 * - Multi-currency consolidation support
 */
// @ts-nocheck


import { Metadata } from "next";
import ConsolidatedReportingDashboard from "@/components/consolidation/ConsolidatedReportingDashboard";

export const metadata: Metadata = {
  title: "Consolidated Reporting | Modern Accounting SaaS",
  description: "Multi-entity financial consolidation and consolidated reporting dashboard",
};

export default function ConsolidationPage() {
  // For demo purposes, using a default consolidation group
  // In a real application, this would be selected by the user or passed as a parameter
  const consolidationGroupId = "demo-group-001";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ConsolidatedReportingDashboard consolidationGroupId={consolidationGroupId} />
    </div>
  );
}
