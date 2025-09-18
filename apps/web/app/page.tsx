"use client";

import {
  useAuth,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Alert,
  AlertDescription,
} from "@aibos/ui";
import { ClientOnlyAccessibility } from "./components/ClientOnlyAccessibility";
import { useInvoices, useCustomers, useTrialBalance, useInvalidateQueries } from "@aibos/utils";
import { useState, useEffect } from "react";

// Type definitions for data structures
interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  currency: string;
  totalAmount: number;
  status: string;
}

interface Customer {
  id: string;
  name: string;
  customerNumber: string;
  currency: string;
}

interface TrialBalance {
  assets?: number;
  liabilities?: number;
  equity?: number;
  netIncome?: number;
}

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render anything until we're on the client side
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand-primary)] mx-auto"></div>
          <p className="mt-2 text-[var(--sys-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  const { session, login, logout, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Get request context for API calls - ensure it's serializable
  const requestContext = session
    ? {
      tenantId: session.user.companyId,
      companyId: session.user.companyId,
      userId: session.user.id,
      userRole: session.user.role,
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }
    : null;

  // Fetch data when authenticated - only on client side
  const shouldFetchData = typeof window !== "undefined" && !!requestContext;

  const { data: invoices, isLoading: invoicesLoading } = useInvoices(
    requestContext!,
    { limit: 5 },
    { enabled: shouldFetchData },
  );

  const { data: customers, isLoading: customersLoading } = useCustomers(
    requestContext!,
    { limit: 5 },
    { enabled: shouldFetchData },
  );

  const { data: trialBalance, isLoading: trialBalanceLoading } = useTrialBalance(
    requestContext!,
    {
      fromDate:
        new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0] || "2024-01-01",
      toDate: new Date().toISOString().split("T")[0] || "2024-12-31",
      companyId: (session?.user as any)?.companyId || "default-company",
      tenantId: (session?.user as any)?.tenantId || "default-tenant",
    },
    { enabled: shouldFetchData && !!(session?.user as any)?.companyId },
  );

  const { invalidateAll } = useInvalidateQueries();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !isClient) { return; }

    setIsLoggingIn(true);
    try {
      await login(email, password);
      // Refresh all data after successful login
      invalidateAll();
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (!isClient) { return; }
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--sys-bg-primary)]">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-[var(--sys-text-primary)]">
              Welcome to AIBOS Accounting
            </CardTitle>
            <CardDescription className="text-[var(--sys-text-secondary)]">
              Sign in to access your cloud accounting platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert className="mb-4" variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-2 text-[var(--sys-text-primary)]"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] placeholder-[var(--sys-text-secondary)]"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium mb-2 text-[var(--sys-text-primary)]"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] placeholder-[var(--sys-text-secondary)]"
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--sys-bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)]">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
                AIBOS Accounting
              </h1>
              <p className="text-sm text-[var(--sys-text-secondary)]">
                Welcome back, {session.user.name || session.user.email}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ClientOnlyAccessibility>
                {({ preferences, updatePreference }) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={isClient ? () => updatePreference('colorScheme', preferences.colorScheme === 'light' ? 'dark' : 'light') : undefined}
                    className="text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)]"
                    disabled={!isClient}
                  >
                    {preferences.colorScheme === "light" ? "🌙 Dark" : "☀️ Light"}
                  </Button>
                )}
              </ClientOnlyAccessibility>
              <Badge variant="outline">{session.user.role}</Badge>
              <Button variant="outline" onClick={handleLogout}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recent Invoices
                <Badge variant="secondary">{invoices?.invoices?.length || 0}</Badge>
              </CardTitle>
              <CardDescription>Latest invoice activity</CardDescription>
            </CardHeader>
            <CardContent>
              {invoicesLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-[var(--sys-bg-subtle)] animate-pulse rounded" />
                  ))}
                </div>
              ) : invoices?.invoices && invoices.invoices.length > 0 ? (
                <div className="space-y-2">
                  {(invoices as { invoices: Invoice[] }).invoices
                    .slice(0, 3)
                    .map((invoice: Invoice) => (
                      <div
                        key={invoice.id}
                        className="flex justify-between items-center py-2 border-b border-[var(--sys-border-hairline)] last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-[var(--sys-text-primary)]">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-[var(--sys-text-secondary)]">
                            {invoice.customerName}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-[var(--sys-text-primary)]">
                            {invoice.currency} {Number(invoice.totalAmount).toFixed(2)}
                          </p>
                          <Badge variant={invoice.status === "paid" ? "success" : "secondary"}>
                            {invoice.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-[var(--sys-text-secondary)] text-sm">No invoices found</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Recent Customers
                <Badge variant="secondary">{customers?.customers?.length || 0}</Badge>
              </CardTitle>
              <CardDescription>Customer management</CardDescription>
            </CardHeader>
            <CardContent>
              {customersLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-[var(--sys-bg-subtle)] animate-pulse rounded" />
                  ))}
                </div>
              ) : customers?.customers && customers.customers.length > 0 ? (
                <div className="space-y-2">
                  {(customers as { customers: Customer[] }).customers
                    .slice(0, 3)
                    .map((customer: Customer) => (
                      <div
                        key={customer.id}
                        className="flex justify-between items-center py-2 border-b border-[var(--sys-border-hairline)] last:border-b-0"
                      >
                        <div>
                          <p className="font-medium text-[var(--sys-text-primary)]">
                            {customer.name}
                          </p>
                          <p className="text-sm text-[var(--sys-text-secondary)]">
                            {customer.customerNumber}
                          </p>
                        </div>
                        <Badge variant="outline">{customer.currency}</Badge>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-[var(--sys-text-secondary)] text-sm">No customers found</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
              <CardDescription>Financial overview</CardDescription>
            </CardHeader>
            <CardContent>
              {trialBalanceLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-4 bg-[var(--sys-bg-subtle)] animate-pulse rounded" />
                  ))}
                </div>
              ) : trialBalance ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--sys-text-secondary)]">Total Assets</span>
                    <span className="font-medium text-[var(--sys-text-primary)]">
                      {(trialBalance as TrialBalance).assets?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--sys-text-secondary)]">
                      Total Liabilities
                    </span>
                    <span className="font-medium text-[var(--sys-text-primary)]">
                      {(trialBalance as TrialBalance).liabilities?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--sys-text-secondary)]">Total Equity</span>
                    <span className="font-medium text-[var(--sys-text-primary)]">
                      {(trialBalance as TrialBalance).equity?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[var(--sys-text-secondary)]">Net Income</span>
                    <span className="font-medium text-[var(--sys-text-primary)]">
                      {(trialBalance as TrialBalance).netIncome?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[var(--sys-text-secondary)] text-sm">
                  No financial data available
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* User Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[var(--sys-text-secondary)]">Email</p>
                <p className="font-medium text-[var(--sys-text-primary)]">{session.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--sys-text-secondary)]">Role</p>
                <p className="font-medium text-[var(--sys-text-primary)]">{session.user.role}</p>
              </div>
              <div>
                <p className="text-sm text-[var(--sys-text-secondary)]">Company</p>
                <p className="font-medium text-[var(--sys-text-primary)]">
                  {session.user.companyName || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-[var(--sys-text-secondary)]">Permissions</p>
                <p className="font-medium text-[var(--sys-text-primary)]">
                  {session.user.permissions.length} granted
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
