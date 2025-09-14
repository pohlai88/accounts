/**
 * SOC2 & GDPR Compliance Page - Enterprise Security & Data Protection
 */

"use client";

import React from "react";
import ComplianceDashboard from "@/components/compliance/ComplianceDashboard";

export default function CompliancePage() {
  return (
    <div className="container mx-auto p-6">
      <ComplianceDashboard />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "SOC2 & GDPR Compliance - Enterprise Security & Data Protection Framework",
  description:
    "Complete compliance management system with SOC2 Type II controls, GDPR data protection, audit trails, and regulatory reporting.",
};
