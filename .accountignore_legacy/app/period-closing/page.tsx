"use client";

import React from "react";
import PeriodClosingInterface from "@/components/period-closing/PeriodClosingInterface";

export default function PeriodClosingPage() {
  const companyId = "default-company"; // In a real app, this would come from context

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Period Closing</h1>
        <p className="text-muted-foreground mt-2">
          Manage accounting period closures with automated P&L transfers and comprehensive
          validation
        </p>
      </div>

      {/* Period Closing Interface */}
      <PeriodClosingInterface companyId={companyId} />
    </div>
  );
}
