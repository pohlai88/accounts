// @ts-nocheck
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AIBOS API",
  description: "Multi-tenant accounting API",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
