"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calculator,
  TrendingUp,
  DollarSign,
  Calendar,
  Building2,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Tag,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Sparkles,
  MoreHorizontal,
  ArrowUpDown,
  FilterX,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  FileText,
  Settings,
  Receipt,
  Percent,
} from "lucide-react";
import {
  TaxManagementService,
  TaxCategory,
  TaxTemplate,
  TaxRate,
  TaxExemption,
  TaxReport,
  TaxCalculationResult,
} from "@/lib/tax-management-service";
import { format } from "date-fns";

export default function TaxManagementPage() {
  const [activeTab, setActiveTab] = useState("categories");
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Data states
  const [categories, setCategories] = useState<TaxCategory[]>([]);
  const [templates, setTemplates] = useState<TaxTemplate[]>([]);
  const [rates, setRates] = useState<TaxRate[]>([]);
  const [exemptions, setExemptions] = useState<TaxExemption[]>([]);
  const [reports, setReports] = useState<TaxReport[]>([]);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");

  const companyId = "default-company"; // In a real app, this would come from context

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, [companyId, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case "categories":
          await loadCategories();
          break;
        case "templates":
          await loadTemplates();
          break;
        case "rates":
          await loadRates();
          break;
        case "exemptions":
          await loadExemptions();
          break;
        case "reports":
          await loadReports();
          break;
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    const result = await TaxManagementService.getTaxCategories(companyId);
    if (result.success && result.data) {
      setCategories(result.data);
    }
  };

  const loadTemplates = async () => {
    const result = await TaxManagementService.getTaxTemplates(companyId);
    if (result.success && result.data) {
      setTemplates(result.data);
    }
  };

  const loadRates = async () => {
    const result = await TaxManagementService.getTaxRates(companyId);
    if (result.success && result.data) {
      setRates(result.data);
    }
  };

  const loadExemptions = async () => {
    const result = await TaxManagementService.getTaxExemptions(companyId);
    if (result.success && result.data) {
      setExemptions(result.data);
    }
  };

  const loadReports = async () => {
    const result = await TaxManagementService.getTaxReports(companyId);
    if (result.success && result.data) {
      setReports(result.data);
    }
  };

  const handleCreate = (item: any) => {
    setShowDialog(false);
    setEditingItem(null);
    loadData();
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowDialog(true);
  };

  const handleDelete = async (id: string, type: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      // Implement delete logic based on type
      loadData();
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-800">
        <Clock className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      Sales: { variant: "default" as const, label: "Sales", color: "bg-blue-100 text-blue-800" },
      Purchase: {
        variant: "secondary" as const,
        label: "Purchase",
        color: "bg-green-100 text-green-800",
      },
      Both: { variant: "outline" as const, label: "Both", color: "bg-purple-100 text-purple-800" },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.Sales;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getCalculationMethodBadge = (method: string) => {
    const methodConfig = {
      Percentage: { variant: "default" as const, label: "Percentage" },
      Fixed: { variant: "secondary" as const, label: "Fixed" },
      "On Previous Row Amount": { variant: "outline" as const, label: "On Previous Row Amount" },
      "On Previous Row Total": { variant: "outline" as const, label: "On Previous Row Total" },
    };

    const config = methodConfig[method as keyof typeof methodConfig] || methodConfig.Percentage;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getExemptionTypeBadge = (type: string) => {
    const typeConfig = {
      Customer: { variant: "default" as const, label: "Customer" },
      Supplier: { variant: "secondary" as const, label: "Supplier" },
      Item: { variant: "outline" as const, label: "Item" },
      Transaction: { variant: "outline" as const, label: "Transaction" },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.Customer;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getReportStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: { variant: "secondary" as const, label: "Draft" },
      Submitted: { variant: "default" as const, label: "Submitted" },
      Approved: {
        variant: "default" as const,
        label: "Approved",
        color: "bg-green-100 text-green-800",
      },
      Rejected: { variant: "destructive" as const, label: "Rejected" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const renderCategories = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Categories</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading categories...</div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-8">
          <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p className="text-muted-foreground mb-4">Create your first tax category</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(category => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                  {getStatusBadge(category.is_active)}
                </div>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(category.id, "category")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Templates</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Template
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8">
          <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates found</h3>
          <p className="text-muted-foreground mb-4">Create your first tax template</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(template => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {getStatusBadge(template.is_active)}
                </div>
                <CardDescription>{template.description}</CardDescription>
                {template.tax_category_name && (
                  <Badge variant="outline" className="w-fit">
                    {template.tax_category_name}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(template)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id, "template")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderRates = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Rates</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rate
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading rates...</div>
        </div>
      ) : rates.length === 0 ? (
        <div className="text-center py-8">
          <Percent className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No rates found</h3>
          <p className="text-muted-foreground mb-4">Create your first tax rate</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Rate
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map(rate => (
                <TableRow key={rate.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{rate.name}</div>
                      {rate.description && (
                        <div className="text-sm text-muted-foreground">{rate.description}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(rate.tax_type)}</TableCell>
                  <TableCell>
                    <div className="text-right">
                      <div className="font-medium">{rate.tax_rate}%</div>
                      {rate.tax_amount > 0 && (
                        <div className="text-sm text-muted-foreground">
                          Fixed: {rate.currency} {rate.tax_amount}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getCalculationMethodBadge(rate.calculation_method)}</TableCell>
                  <TableCell>
                    <div className="text-sm">{rate.account_head}</div>
                  </TableCell>
                  <TableCell>{getStatusBadge(rate.is_active)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(rate)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rate.id, "rate")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const renderExemptions = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Exemptions</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Exemption
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading exemptions...</div>
        </div>
      ) : exemptions.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No exemptions found</h3>
          <p className="text-muted-foreground mb-4">Create your first tax exemption</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Exemption
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exemptions.map(exemption => (
            <Card key={exemption.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{exemption.name}</CardTitle>
                  {getStatusBadge(exemption.is_active)}
                </div>
                <CardDescription>{exemption.description}</CardDescription>
                <div className="flex space-x-2">
                  {getExemptionTypeBadge(exemption.exemption_type)}
                  {exemption.tax_template_name && (
                    <Badge variant="outline" className="w-fit">
                      {exemption.tax_template_name}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(exemption)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(exemption.id, "exemption")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Tax Reports</h3>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="text-muted-foreground">Loading reports...</div>
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No reports found</h3>
          <p className="text-muted-foreground mb-4">Generate your first tax report</p>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="font-medium">{report.report_name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{report.report_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(report.from_date), "MMM dd, yyyy")} -{" "}
                      {format(new Date(report.to_date), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>{getReportStatusBadge(report.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(report.created_at), "MMM dd, yyyy")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(report)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Calculator className="h-8 w-8 text-primary" />
            <span>Tax Management</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage tax categories, rates, templates, and generate reports
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="rates">Rates</TabsTrigger>
          <TabsTrigger value="exemptions">Exemptions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          {renderCategories()}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          {renderTemplates()}
        </TabsContent>

        <TabsContent value="rates" className="space-y-4">
          {renderRates()}
        </TabsContent>

        <TabsContent value="exemptions" className="space-y-4">
          {renderExemptions()}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {renderReports()}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update item information" : "Enter item details"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Form Component</h3>
              <p className="text-muted-foreground">
                The form component for {activeTab} will be implemented here
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
