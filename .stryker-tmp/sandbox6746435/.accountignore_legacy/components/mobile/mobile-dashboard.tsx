// @ts-nocheck
// =====================================================
// Phase 9: Mobile Dashboard Component
// Touch-optimized dashboard for mobile devices
// =====================================================

"use client";

import React, { useState, useEffect } from "react";
import { MobileLayout, MobileCard, MobileButton, MobileSwipeableCard } from "./mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface MobileDashboardProps {
  companyId: string;
  userId: string;
}

export function MobileDashboard({ companyId, userId }: MobileDashboardProps) {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isOnline, setIsOnline] = useState(true);

  // Mock data - in real app, this would come from Supabase
  const dashboardData = {
    totalRevenue: 125430,
    totalExpenses: 89240,
    profit: 36190,
    invoiceCount: 24,
    customerCount: 18,
    pendingInvoices: 5,
    overdueInvoices: 2,
    recentTransactions: [
      {
        id: "1",
        description: "Payment from ABC Corp",
        amount: 5000,
        type: "income",
        date: "2024-01-15",
      },
      {
        id: "2",
        description: "Office supplies",
        amount: -250,
        type: "expense",
        date: "2024-01-14",
      },
      {
        id: "3",
        description: "Consulting services",
        amount: 3500,
        type: "income",
        date: "2024-01-13",
      },
      {
        id: "4",
        description: "Software subscription",
        amount: -99,
        type: "expense",
        date: "2024-01-12",
      },
      { id: "5", description: "Client payment", amount: 1200, type: "income", date: "2024-01-11" },
    ],
    upcomingTasks: [
      { id: "1", title: "Send invoice #INV-001", due: "2024-01-16", priority: "high" },
      { id: "2", title: "Follow up with client", due: "2024-01-17", priority: "medium" },
      { id: "3", title: "Prepare monthly report", due: "2024-01-20", priority: "low" },
    ],
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
      default:
        return "outline";
    }
  };

  const handleSwipeLeft = () => {
    setCurrentSlide(Math.min(currentSlide + 1, 2));
  };

  const handleSwipeRight = () => {
    setCurrentSlide(Math.max(currentSlide - 1, 0));
  };

  return (
    <MobileLayout
      title="Dashboard"
      showSearch={true}
      showNotifications={true}
      showAddButton={true}
      onAddClick={() => console.log("Add clicked")}
      onSearchClick={() => console.log("Search clicked")}
      onNotificationClick={() => console.log("Notifications clicked")}
    >
      {/* Offline indicator */}
      {!isOnline && (
        <div className="bg-yellow-500 text-yellow-900 px-4 py-2 text-center text-sm font-medium">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          You're offline. Some features may be limited.
        </div>
      )}

      {/* Quick Actions */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <MobileButton className="h-20 flex flex-col items-center justify-center space-y-2">
            <FileText className="h-6 w-6" />
            <span className="text-sm">New Invoice</span>
          </MobileButton>
          <MobileButton
            variant="outline"
            className="h-20 flex flex-col items-center justify-center space-y-2"
          >
            <Plus className="h-6 w-6" />
            <span className="text-sm">Add Transaction</span>
          </MobileButton>
        </div>

        {/* Financial Overview - Swipeable Cards */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Financial Overview</h2>
          <div className="relative">
            <MobileSwipeableCard onSwipeLeft={handleSwipeLeft} onSwipeRight={handleSwipeRight}>
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {/* Revenue Card */}
                <Card className="min-w-[280px] bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {showSensitiveData ? formatCurrency(dashboardData.totalRevenue) : "••••••"}
                    </div>
                    <div className="text-sm opacity-90">+12.5% from last month</div>
                  </CardContent>
                </Card>

                {/* Expenses Card */}
                <Card className="min-w-[280px] bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                      <TrendingDown className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {showSensitiveData ? formatCurrency(dashboardData.totalExpenses) : "••••••"}
                    </div>
                    <div className="text-sm opacity-90">+5.2% from last month</div>
                  </CardContent>
                </Card>

                {/* Profit Card */}
                <Card className="min-w-[280px] bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {showSensitiveData ? formatCurrency(dashboardData.profit) : "••••••"}
                    </div>
                    <div className="text-sm opacity-90">+8.3% from last month</div>
                  </CardContent>
                </Card>
              </div>
            </MobileSwipeableCard>
          </div>

          {/* Slide indicators */}
          <div className="flex justify-center space-x-2 mt-3">
            {[0, 1, 2].map(index => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  currentSlide === index ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Toggle sensitive data visibility */}
        <div className="flex items-center justify-center mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="flex items-center space-x-2"
          >
            {showSensitiveData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-sm">{showSensitiveData ? "Hide" : "Show"} amounts</span>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Invoices</p>
                <p className="text-2xl font-bold">{dashboardData.invoiceCount}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge variant="destructive" className="text-xs">
                {dashboardData.overdueInvoices} overdue
              </Badge>
            </div>
          </MobileCard>

          <MobileCard>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customers</p>
                <p className="text-2xl font-bold">{dashboardData.customerCount}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-2">
              <Badge variant="default" className="text-xs">
                {dashboardData.pendingInvoices} pending
              </Badge>
            </div>
          </MobileCard>
        </div>

        {/* Recent Transactions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-2">
            {dashboardData.recentTransactions.slice(0, 3).map(transaction => (
              <MobileSwipeableCard
                key={transaction.id}
                onSwipeLeft={() => console.log("Edit transaction", transaction.id)}
                onSwipeRight={() => console.log("Delete transaction", transaction.id)}
              >
                <MobileCard className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(transaction.date)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {transaction.type === "income" ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`font-medium ${
                          transaction.type === "income" ? "text-green-500" : "text-red-500"
                        }`}
                      >
                        {showSensitiveData ? formatCurrency(transaction.amount) : "••••"}
                      </span>
                    </div>
                  </div>
                </MobileCard>
              </MobileSwipeableCard>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Upcoming Tasks</h2>
            <Button variant="ghost" size="sm">
              View All
            </Button>
          </div>

          <div className="space-y-2">
            {dashboardData.upcomingTasks.map(task => (
              <MobileCard key={task.id} className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{formatDate(task.due)}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                    <Button variant="ghost" size="sm" className="p-1">
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </MobileCard>
            ))}
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Performance</h2>
          <MobileCard>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Revenue Growth</span>
                  <span>+12.5%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Customer Satisfaction</span>
                  <span>94%</span>
                </div>
                <Progress value={94} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Invoice Collection</span>
                  <span>87%</span>
                </div>
                <Progress value={87} className="h-2" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Quick Tips */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Tips</h2>
          <MobileCard className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              <div>
                <p className="font-medium text-sm text-blue-900">Pro Tip</p>
                <p className="text-sm text-blue-700">
                  Swipe left on transactions to edit, swipe right to delete. This works throughout
                  the app!
                </p>
              </div>
            </div>
          </MobileCard>
        </div>
      </div>
    </MobileLayout>
  );
}
