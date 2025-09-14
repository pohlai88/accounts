/**
 * Sales Dashboard Component - Modern Design System
 * Complete sales management interface with quotations and orders
 *
 * Features:
 * - Sales analytics and KPIs with real-time data
 * - Quotation management with conversion tracking
 * - Sales order management with delivery/billing status
 * - Customer credit monitoring and alerts
 * - Modern UI with business context colors
 * - API-connected with error handling
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  FileText,
  TrendingUp,
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Receipt,
  RotateCcw,
  RefreshCw,
  ArrowUpRight,
  Target,
  Activity,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { apiClient, useApiCall } from "@/lib/api-client";
import { designSystem } from "@/lib/design-system";
import { format } from "date-fns";
import { toast } from "sonner";

// Modern types for API responses
interface SalesQuotation {
  id: string;
  name: string;
  customer_name: string;
  transaction_date: string;
  valid_till: string;
  grand_total: number;
  status:
    | "Draft"
    | "Open"
    | "Replied"
    | "Partially Ordered"
    | "Ordered"
    | "Lost"
    | "Cancelled"
    | "Expired";
}

interface SalesOrder {
  id: string;
  name: string;
  customer_name: string;
  transaction_date: string;
  delivery_date: string;
  grand_total: number;
  status:
    | "Draft"
    | "To Deliver and Bill"
    | "To Bill"
    | "To Deliver"
    | "Completed"
    | "Cancelled"
    | "Closed";
  per_delivered: number;
  per_billed: number;
  billing_status: string;
  delivery_status: string;
}

interface SalesDashboardProps {
  companyId: string;
}

export function SalesDashboard({ companyId }: SalesDashboardProps) {
  const [quotations, setQuotations] = useState<SalesQuotation[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  const { handleApiCall } = useApiCall();

  useEffect(() => {
    loadDashboardData();
  }, [companyId, selectedPeriod]);

  const loadDashboardData = async () => {
    setIsLoading(true);

    // Load quotations with new API client
    const quotationsCall = () =>
      apiClient.getQuotations({
        limit: 50,
        sort_by: "transaction_date",
        sort_order: "desc",
      });

    const quotationsResult = await handleApiCall(quotationsCall, {
      errorMessage: "Failed to load quotations",
      showErrorToast: false, // Handle error manually
    });

    if (quotationsResult.success && quotationsResult.data) {
      setQuotations(quotationsResult.data as SalesQuotation[]);
    }

    // Load sales orders with new API client
    const ordersCall = () =>
      apiClient.getSalesOrders({
        limit: 50,
        sort_by: "transaction_date",
        sort_order: "desc",
      });

    const ordersResult = await handleApiCall(ordersCall, {
      errorMessage: "Failed to load sales orders",
      showErrorToast: false,
    });

    if (ordersResult.success && ordersResult.data) {
      setOrders(ordersResult.data as SalesOrder[]);
    }

    // Generate analytics from loaded data
    generateAnalytics();
    setIsLoading(false);
  };

  const generateAnalytics = () => {
    if (!quotations.length && !orders.length) return;

    const thisMonth = new Date();
    thisMonth.setDate(1);

    const monthlyQuotations = quotations.filter(q => new Date(q.transaction_date) >= thisMonth);

    const monthlyOrders = orders.filter(o => new Date(o.transaction_date) >= thisMonth);

    setAnalytics({
      totalQuotations: quotations.length,
      monthlyQuotations: monthlyQuotations.length,
      quotationValue: monthlyQuotations.reduce((sum, q) => sum + q.grand_total, 0),
      totalOrders: orders.length,
      monthlyOrders: monthlyOrders.length,
      orderValue: monthlyOrders.reduce((sum, o) => sum + o.grand_total, 0),
      conversionRate:
        monthlyQuotations.length > 0 ? (monthlyOrders.length / monthlyQuotations.length) * 100 : 0,
      avgOrderValue:
        monthlyOrders.length > 0
          ? monthlyOrders.reduce((sum, o) => sum + o.grand_total, 0) / monthlyOrders.length
          : 0,
    });
  };

  const handleConvertToOrder = async (quotationId: string) => {
    try {
      const result = await SalesManagementService.convertToSalesOrder(quotationId, {
        transaction_date: new Date().toISOString().split("T")[0],
      });

      if (result.success) {
        toast.success("Quotation converted to sales order successfully");
        loadDashboardData();
      } else {
        toast.error(result.error || "Failed to convert quotation");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const getStatusBadge = (
    status: QuotationStatus | SalesOrderStatus,
    type: "quotation" | "order",
  ) => {
    const getVariant = () => {
      if (type === "quotation") {
        switch (status as QuotationStatus) {
          case "Draft":
            return "secondary";
          case "Open":
            return "default";
          case "Replied":
            return "outline";
          case "Ordered":
            return "default";
          case "Lost":
            return "destructive";
          case "Cancelled":
            return "destructive";
          case "Expired":
            return "secondary";
          default:
            return "secondary";
        }
      } else {
        switch (status as SalesOrderStatus) {
          case "Draft":
            return "secondary";
          case "To Deliver and Bill":
            return "default";
          case "To Bill":
            return "default";
          case "To Deliver":
            return "default";
          case "Completed":
            return "default";
          case "Cancelled":
            return "destructive";
          case "Closed":
            return "secondary";
          default:
            return "secondary";
        }
      }
    };

    const getIcon = () => {
      if (type === "quotation") {
        switch (status as QuotationStatus) {
          case "Ordered":
            return <CheckCircle className="h-3 w-3" />;
          case "Open":
            return <Clock className="h-3 w-3" />;
          case "Lost":
            return <AlertCircle className="h-3 w-3" />;
          case "Expired":
            return <AlertCircle className="h-3 w-3" />;
          default:
            return <FileText className="h-3 w-3" />;
        }
      } else {
        switch (status as SalesOrderStatus) {
          case "Completed":
            return <CheckCircle className="h-3 w-3" />;
          case "To Deliver":
            return <Truck className="h-3 w-3" />;
          case "To Bill":
            return <Receipt className="h-3 w-3" />;
          case "To Deliver and Bill":
            return <Clock className="h-3 w-3" />;
          default:
            return <FileText className="h-3 w-3" />;
        }
      }
    };

    return (
      <Badge variant={getVariant()} className="flex items-center space-x-1">
        {getIcon()}
        <span>{status}</span>
      </Badge>
    );
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch =
      quotation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || quotation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading sales dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header with Business Context */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gradient-primary">
                Sales Dashboard
              </h2>
              <p className="text-slate-600 dark:text-slate-400 font-medium">
                Manage quotations, sales orders, and track your pipeline performance
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[140px] bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={loadDashboardData}
            className="interactive shadow-lg"
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Modern Analytics Cards with Business Context */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="interactive shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Monthly Quotations
              </CardTitle>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {analytics.monthlyQuotations}
              </div>
              <div className="flex items-center space-x-2 text-xs text-blue-600 dark:text-blue-400">
                <span>Value: ${analytics.quotationValue.toLocaleString()}</span>
                {analytics.monthlyQuotations > 0 && <ArrowUpRight className="h-3 w-3" />}
              </div>
            </CardContent>
          </Card>

          <Card className="interactive shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                Monthly Orders
              </CardTitle>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                {analytics.monthlyOrders}
              </div>
              <div className="flex items-center space-x-2 text-xs text-green-600 dark:text-green-400">
                <span>Value: ${analytics.orderValue.toLocaleString()}</span>
                {analytics.monthlyOrders > 0 && <ArrowUpRight className="h-3 w-3" />}
              </div>
            </CardContent>
          </Card>

          <Card className="interactive shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Conversion Rate
              </CardTitle>
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {analytics.conversionRate.toFixed(1)}%
              </div>
              <div className="flex items-center space-x-1 text-xs">
                <Progress value={analytics.conversionRate} className="flex-1 h-2" />
                <span className="text-purple-600 dark:text-purple-400">Target</span>
              </div>
            </CardContent>
          </Card>

          <Card className="interactive shadow-lg border-0 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Avg Order Value
              </CardTitle>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                <DollarSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                ${analytics.avgOrderValue.toLocaleString()}
              </div>
              <div className="flex items-center space-x-2 text-xs text-orange-600 dark:text-orange-400">
                <Activity className="h-3 w-3" />
                <span>Monthly average</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search quotations and orders..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="To Deliver and Bill">To Deliver & Bill</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Quotation
          </Button>
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Data Tables */}
      <Tabs defaultValue="quotations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotations" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Quotations ({quotations.length})</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4" />
            <span>Sales Orders ({orders.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quotations">
          <Card>
            <CardHeader>
              <CardTitle>Sales Quotations</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Valid Till</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No quotations found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQuotations.map(quotation => (
                      <TableRow key={quotation.id}>
                        <TableCell className="font-medium">{quotation.quotation_no}</TableCell>
                        <TableCell>{quotation.customer_name}</TableCell>
                        <TableCell>
                          {format(new Date(quotation.transaction_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {quotation.valid_till
                            ? format(new Date(quotation.valid_till), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(quotation.status, "quotation")}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${quotation.grand_total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {quotation.status === "Open" && (
                                <DropdownMenuItem
                                  onClick={() => handleConvertToOrder(quotation.id)}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Convert to Order
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Sales Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No.</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No sales orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">{order.order_no}</TableCell>
                        <TableCell>{order.customer_name}</TableCell>
                        <TableCell>
                          {format(new Date(order.transaction_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell>
                          {order.delivery_date
                            ? format(new Date(order.delivery_date), "MMM dd, yyyy")
                            : "-"}
                        </TableCell>
                        <TableCell>{getStatusBadge(order.status, "order")}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Truck className="h-3 w-3 text-muted-foreground" />
                              <Progress value={order.per_delivered} className="flex-1 h-1" />
                              <span className="text-xs text-muted-foreground w-8">
                                {order.per_delivered.toFixed(0)}%
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Receipt className="h-3 w-3 text-muted-foreground" />
                              <Progress value={order.per_billed} className="flex-1 h-1" />
                              <span className="text-xs text-muted-foreground w-8">
                                {order.per_billed.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${order.grand_total.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                <Truck className="mr-2 h-4 w-4" />
                                Create Delivery Note
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Receipt className="mr-2 h-4 w-4" />
                                Create Invoice
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
