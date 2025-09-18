"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui";

export default function BalanceSheetPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Balance Sheet Report
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Assets, liabilities, and equity overview for complete financial position analysis
        </p>
      </div>

      {/* Report Component */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            Balance Sheet Summary
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
              The Balance Sheet report is currently under development and will be available soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
