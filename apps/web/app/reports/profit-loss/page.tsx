"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui";

export default function ProfitLossPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Profit & Loss Statement
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Revenue, expenses, and net income analysis for comprehensive financial performance
        </p>
      </div>

      {/* Report Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">📈</span>
            Profit & Loss Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <div className="text-blue-600 mb-4">
              <span className="text-4xl">🚧</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              The Profit & Loss Statement report is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
