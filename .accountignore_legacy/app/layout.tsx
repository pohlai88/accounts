/**
 * Root Layout - Modern Accounting SaaS
 * Clean, minimal layout for Fortune 500-grade application
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Modern Accounting - Fortune 500 Grade SaaS",
  description: "ERPNext-inspired accounting with modern UX. 3x faster than competitors.",
  keywords: "accounting, saas, erpnext, quickbooks, xero, zoho, financial management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
