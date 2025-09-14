/**
 * Tax Management Page - Complete Tax Compliance System
 */

"use client";

import React from "react";
import TaxDashboard from "@/components/tax/TaxDashboard";

export default function TaxPage() {
  return (
    <div className="container mx-auto p-6">
      <TaxDashboard />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "Tax Management - Multi-jurisdiction Tax Compliance",
  description:
    "Complete tax management system with automated calculations, multi-jurisdiction support, and compliance reporting.",
};
