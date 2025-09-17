/**
 * Modern Header - Advanced Header with Business Context & Quick Actions
 * Comprehensive header with real-time business data, notifications, and quick access
 *
 * Features:
 * - Real-time business metrics and KPIs
 * - Smart notifications with business context
 * - Global search with intelligent suggestions
 * - Quick action shortcuts
 * - User profile and company switcher
 * - Modern responsive design
 */
// @ts-nocheck


"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Settings,
  User,
  ChevronDown,
  Building2,
  TrendingUp,
  CheckCircle,
  Plus,
  Clock,
  Menu,
  Sun,
  Moon,
  Sparkles,
  Target,
  BarChart3,
  Receipt,
  Wallet,
  Shield,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
interface ModernHeaderProps {
  onToggleSidebar?: () => void;
}

interface BusinessMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "neutral";
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  timestamp: string;
  action?: {
    label: string;
    href: string;
  };
}

interface QuickSearch {
  id: string;
  title: string;
  description: string;
  href: string;
  type: "page" | "action" | "report" | "customer" | "invoice";
  icon: React.ComponentType<{ className?: string }>;
}

export default function ModernHeader({ onToggleSidebar }: ModernHeaderProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Sample business metrics - in real app, this would come from API
  const businessMetrics: BusinessMetric[] = [
    {
      id: "revenue",
      label: "Monthly Revenue",
      value: "$284,592",
      change: 12.5,
      trend: "up",
      color: "text-green-600",
      icon: TrendingUp,
    },
    {
      id: "cash",
      label: "Cash Position",
      value: "$1,847,230",
      change: -3.2,
      trend: "down",
      color: "text-blue-600",
      icon: Wallet,
    },
    {
      id: "outstanding",
      label: "Outstanding AR",
      value: "$124,856",
      change: -8.1,
      trend: "up",
      color: "text-amber-600",
      icon: Receipt,
    },
    {
      id: "profit",
      label: "Net Profit",
      value: "$89,324",
      change: 15.7,
      trend: "up",
      color: "text-emerald-600",
      icon: Target,
    },
  ];

  // Sample notifications - in real app, this would come from API
  const sampleNotifications: Notification[] = [
    {
      id: "1",
      title: "Payment Received",
      message: "Invoice INV-2024-001 has been paid ($5,240)",
      type: "success",
      timestamp: "5 min ago",
      action: { label: "View Invoice", href: "/invoices/INV-2024-001" },
    },
    {
      id: "2",
      title: "Bank Reconciliation Required",
      message: "3 transactions need reconciliation for Wells Fargo account",
      type: "warning",
      timestamp: "15 min ago",
      action: { label: "Reconcile", href: "/bank-reconciliation" },
    },
    {
      id: "3",
      title: "AI Insight Available",
      message: "Cash flow forecast shows potential shortage next month",
      type: "info",
      timestamp: "1 hour ago",
      action: { label: "View Insights", href: "/predictive" },
    },
  ];

  // Sample quick search results
  const quickSearchResults: QuickSearch[] = [
    {
      id: "dashboard",
      title: "Executive Dashboard",
      description: "Real-time business overview and KPIs",
      href: "/dashboard/executive",
      type: "page",
      icon: BarChart3,
    },
    {
      id: "new-invoice",
      title: "Create New Invoice",
      description: "Generate a new sales invoice",
      href: "/invoices/new",
      type: "action",
      icon: Plus,
    },
    {
      id: "cash-flow",
      title: "Cash Flow Report",
      description: "View detailed cash flow analysis",
      href: "/reports/cash-flow",
      type: "report",
      icon: TrendingUp,
    },
    {
      id: "ai-insights",
      title: "Predictive Analytics",
      description: "AI-powered business insights and forecasting",
      href: "/predictive",
      type: "page",
      icon: Sparkles,
    },
  ];

  const filteredSearchResults = searchQuery
    ? quickSearchResults.filter(
        item =>
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : quickSearchResults.slice(0, 6);

  const unreadNotifications = sampleNotifications.length;
  const hasUrgentNotifications = sampleNotifications.some(
    n => n.type === "error" || n.type === "warning",
  );

  return (
    <TooltipProvider>
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between h-16 px-4 lg:px-6">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
              <Menu className="w-5 h-5" />
            </Button>

            {/* Business Metrics */}
            <div className="hidden xl:flex items-center gap-6">
              {businessMetrics.map(metric => (
                <Tooltip key={metric.id}>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer group">
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                          "bg-gray-50 dark:bg-gray-800 group-hover:bg-gray-100 dark:group-hover:bg-gray-700",
                        )}
                      >
                        <metric.icon className={cn("w-4 h-4", metric.color)} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                          {metric.value}
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="text-gray-500 dark:text-gray-400 truncate">
                            {metric.label}
                          </span>
                          <span
                            className={cn(
                              "font-medium",
                              metric.trend === "up"
                                ? "text-green-600"
                                : metric.trend === "down"
                                  ? "text-red-600"
                                  : "text-gray-500",
                            )}
                          >
                            {metric.change > 0 ? "+" : ""}
                            {metric.change}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{metric.label}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-4">
            <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
              <DialogTrigger asChild>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search anything... (⌘K)"
                    className="pl-10 pr-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:bg-white dark:focus:bg-gray-900 transition-colors cursor-pointer"
                    readOnly
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <kbd className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 rounded border">
                      ⌘K
                    </kbd>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Quick Search
                  </DialogTitle>
                  <DialogDescription>
                    Search for pages, actions, reports, customers, and more
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Type to search..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                      autoFocus
                    />
                  </div>

                  {filteredSearchResults.length > 0 ? (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {filteredSearchResults.map(result => (
                        <Card
                          key={result.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800">
                                <result.icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                  {result.title}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {result.description}
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {result.type}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : searchQuery ? (
                    <div className="text-center py-8 text-gray-500">
                      <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No results found for &quot;{searchQuery}&quot;</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <CardContent className="p-3 text-center">
                          <Plus className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="text-sm font-medium">Quick Actions</p>
                          <p className="text-xs text-gray-500">Create invoices, payments</p>
                        </CardContent>
                      </Card>
                      <Card className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <CardContent className="p-3 text-center">
                          <BarChart3 className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-sm font-medium">Reports</p>
                          <p className="text-xs text-gray-500">Financial statements</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Quick Actions (Desktop) */}
            <div className="hidden lg:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Plus className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick Create</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>AI Insights</p>
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sync Data</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-2" />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <div
                      className={cn(
                        "absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-white",
                        hasUrgentNotifications ? "bg-red-500" : "bg-blue-500",
                      )}
                    >
                      {unreadNotifications > 9 ? "9+" : unreadNotifications}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadNotifications > 0 && (
                    <Badge variant="secondary">{unreadNotifications}</Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {sampleNotifications.length > 0 ? (
                  <>
                    {sampleNotifications.map(notification => (
                      <DropdownMenuItem key={notification.id} className="flex-col items-start p-3">
                        <div className="flex items-start gap-3 w-full">
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                              notification.type === "success"
                                ? "bg-green-500"
                                : notification.type === "warning"
                                  ? "bg-yellow-500"
                                  : notification.type === "error"
                                    ? "bg-red-500"
                                    : "bg-blue-500",
                            )}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{notification.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{notification.message}</div>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-400">
                                {notification.timestamp}
                              </span>
                              {notification.action && (
                                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                  {notification.action.label}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-center text-sm">
                      View all notifications
                    </DropdownMenuItem>
                  </>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>All caught up!</p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Building2 className="w-4 h-4 mr-2" />
                  Company Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Shield className="w-4 h-4 mr-2" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setDarkMode(!darkMode)}>
                  {darkMode ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                  {darkMode ? "Light Mode" : "Dark Mode"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">JD</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">John Doe</div>
                    <div className="text-xs text-gray-500">Acme Corp</div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">JD</span>
                    </div>
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-xs text-gray-500">john@acmecorp.com</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Building2 className="w-4 h-4 mr-2" />
                  Switch Company
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="w-4 h-4 mr-2" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <User className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Time Display */}
            <div className="hidden lg:flex items-center gap-2 ml-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-mono text-gray-700 dark:text-gray-300">
                {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
