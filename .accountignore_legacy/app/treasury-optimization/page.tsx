/**
 * Treasury Optimization Page
 * Advanced Cash Management & Working Capital Analysis Interface
 *
 * Features:
 * - Working capital components analysis and optimization
 * - Advanced cash optimization strategies with automated execution
 * - Real-time liquidity position monitoring and risk assessment
 * - AI-powered investment opportunity analysis and recommendations
 * - Treasury performance analytics and benchmarking
 * - Strategic working capital optimization recommendations
 */

import { Metadata } from "next";
import TreasuryOptimizationDashboard from "@/components/treasury/TreasuryOptimizationDashboard";

export const metadata: Metadata = {
  title: "Treasury Optimization | Modern Accounting SaaS",
  description:
    "Advanced cash management, working capital analysis, liquidity optimization, and strategic treasury management dashboard",
};

export default function TreasuryOptimizationPage() {
  // For demo purposes, using a default company ID
  // In a real application, this would be derived from user session or context
  const companyId = "demo-company-001";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <TreasuryOptimizationDashboard companyId={companyId} />
    </div>
  );
}
