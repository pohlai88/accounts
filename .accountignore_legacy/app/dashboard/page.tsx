/**
 * Main Dashboard - Protected Route
 * Fortune 500-grade accounting dashboard
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AuthService, type UserProfile } from "@/lib/auth-service";
import { WelcomeTour, useWelcomeTour } from "@/components/onboarding/welcome-tour";
import { EnhancedTransactionForm } from "@/components/transactions/enhanced-transaction-form";
import { ChartOfAccounts } from "@/components/accounts/chart-of-accounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  Building2,
  DollarSign,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  Sparkles,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { isTourOpen, hasCompletedTour, startTour, closeTour, completeTour } = useWelcomeTour();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
        return;
      }

      setUser(session.user);

      // Load user profile
      const userProfile = await AuthService.getCurrentUserProfile();
      setProfile(userProfile);
    } catch (error) {
      console.error("Auth check error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const result = await AuthService.signOut();
    if (result.success) {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Sparkles className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading your accounting dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card" id="dashboard-header">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold">Modern Accounting</h1>
                <Badge variant="secondary">ERPNext-Inspired</Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-medium">{profile.full_name || user.email}</div>
                <div className="text-sm text-muted-foreground flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {profile.role}
                  </Badge>
                  {profile.company_id && <Building2 className="h-3 w-3" />}
                </div>
              </div>
              {!hasCompletedTour && (
                <Button variant="outline" size="sm" onClick={startTour}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Take Tour
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8" id="dashboard-content">
        {profile.company_id ? (
          <Tabs defaultValue="transactions" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger
                value="transactions"
                className="flex items-center space-x-2"
                id="transactions-tab"
              >
                <FileText className="h-4 w-4" />
                <span>Transactions</span>
              </TabsTrigger>
              <TabsTrigger
                value="accounts"
                className="flex items-center space-x-2"
                id="accounts-tab"
              >
                <DollarSign className="h-4 w-4" />
                <span>Chart of Accounts</span>
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center space-x-2" id="reports-tab">
                <TrendingUp className="h-4 w-4" />
                <span>Reports</span>
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="flex items-center space-x-2"
                id="settings-tab"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Transactions Tab */}
            <TabsContent value="transactions">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Transaction Processing</h2>
                  <p className="text-muted-foreground">
                    Create sales invoices, payments, journal entries with ERPNext-level validation
                  </p>
                </div>
                <EnhancedTransactionForm companyId={profile.company_id} />
              </div>
            </TabsContent>

            {/* Chart of Accounts Tab */}
            <TabsContent value="accounts">
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Chart of Accounts</h2>
                  <p className="text-muted-foreground">
                    Manage your account hierarchy with intelligent validation
                  </p>
                </div>
                <ChartOfAccounts companyId={profile.company_id} />
              </div>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Trial Balance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      View account balances and ensure books are balanced
                    </p>
                    <Button className="w-full">Generate Report</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="h-5 w-5" />
                      <span>P&L Statement</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Profit and loss statement with drill-down capability
                    </p>
                    <Button className="w-full">Generate Report</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5" />
                      <span>Balance Sheet</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Assets, liabilities, and equity with comparatives
                    </p>
                    <Button className="w-full">Generate Report</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5" />
                      <span>Profile Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <p className="text-sm text-muted-foreground">
                        {profile.full_name || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-muted-foreground">{profile.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <Badge variant="outline">{profile.role}</Badge>
                    </div>
                    <Button className="w-full">Update Profile</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="h-5 w-5" />
                      <span>Company Settings</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Company ID</label>
                      <p className="text-sm text-muted-foreground font-mono">
                        {profile.company_id}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Member Since</label>
                      <p className="text-sm text-muted-foreground">
                        {new Date(profile.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button className="w-full">Manage Company</Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // No company assigned
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Welcome to Modern Accounting</h2>
              <p className="text-muted-foreground">
                You need to be assigned to a company to access the accounting features.
              </p>
            </div>

            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle>No Company Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Contact your administrator to get access to a company, or create a new account if
                  you need to set up a new company.
                </p>
                <div className="space-y-2">
                  <Button onClick={handleSignOut} className="w-full">
                    Sign Out & Create New Company
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Welcome Tour */}
      <WelcomeTour isOpen={isTourOpen} onClose={closeTour} onComplete={completeTour} />
    </div>
  );
}
