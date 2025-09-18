"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui";
import { TrialBalanceWrapper } from "./TrialBalanceWrapper";

export default function TrialBalancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Trial Balance Report
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Verify accounting accuracy with complete account balances and comprehensive verification
        </p>
      </div>

      {/* Report Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            Trial Balance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrialBalanceWrapper />
        </CardContent>
      </Card>
    </div>
  );
}
