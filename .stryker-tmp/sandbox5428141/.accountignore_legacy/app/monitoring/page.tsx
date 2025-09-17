/**
 * Continuous Monitoring Page
 * Advanced Financial Controls & Risk Monitoring Interface
 *
 * Features:
 * - Real-time control effectiveness monitoring
 * - Automated monitoring rules engine
 * - Key Risk Indicators (KRI) tracking
 * - Control testing execution and management
 * - Exception handling and remediation
 */
// @ts-nocheck


import { Metadata } from "next";
import ContinuousMonitoringDashboard from "@/components/monitoring/ContinuousMonitoringDashboard";

export const metadata: Metadata = {
  title: "Continuous Monitoring | Modern Accounting SaaS",
  description:
    "Advanced financial controls monitoring, automated testing, and risk assessment dashboard",
};

export default function MonitoringPage() {
  // For demo purposes, using a default company ID
  // In a real application, this would be derived from user session or context
  const companyId = "demo-company-001";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <ContinuousMonitoringDashboard companyId={companyId} />
    </div>
  );
}
