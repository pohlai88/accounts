/**
 * Expense Management Page - Complete Employee Expense System
 */
// @ts-nocheck


"use client";

import React from "react";
import ExpenseDashboard from "@/components/expenses/ExpenseDashboard";

export default function ExpensesPage() {
  return (
    <div className="container mx-auto p-6">
      <ExpenseDashboard />
    </div>
  );
}

/**
 * Page metadata
 */
export const metadata = {
  title: "Expense Management - Employee Expenses & Reimbursements",
  description:
    "Complete expense management system with OCR receipt processing, approval workflows, and automated reimbursements.",
};
