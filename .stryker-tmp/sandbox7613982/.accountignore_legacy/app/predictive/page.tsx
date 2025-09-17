/**
 * Predictive Analytics Page
 * AI-Powered Financial Forecasting & Machine Learning Interface
 *
 * Features:
 * - AI-powered financial forecasting with multiple algorithms
 * - Real-time model performance monitoring
 * - Automated predictive insights generation
 * - Feature engineering and ML model management
 * - A/B testing and experimentation framework
 */
// @ts-nocheck


import { Metadata } from "next";
import PredictiveAnalyticsDashboard from "@/components/predictive/PredictiveAnalyticsDashboard";

export const metadata: Metadata = {
  title: "Predictive Analytics | Modern Accounting SaaS",
  description:
    "AI-powered financial forecasting, machine learning models, and predictive business insights dashboard",
};

export default function PredictivePage() {
  // For demo purposes, using a default company ID
  // In a real application, this would be derived from user session or context
  const companyId = "demo-company-001";

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <PredictiveAnalyticsDashboard companyId={companyId} />
    </div>
  );
}
