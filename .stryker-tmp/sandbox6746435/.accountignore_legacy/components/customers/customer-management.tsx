// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  CreditCard,
  TrendingUp,
  Calendar,
  Star,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Target,
  Zap,
  Sparkles,
  Eye,
  Copy,
  MoreHorizontal,
  ArrowUpDown,
  FilterX,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

// Customer validation schema
const customerSchema = z.object({
  name: z.string().min(1, "Customer name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  customer_type: z.enum(["individual", "company", "government"]).default("company"),
  industry: z.string().optional(),
  tax_id: z.string().optional(),
  credit_limit: z.number().min(0).default(0),
  payment_terms: z.string().optional(),
  currency: z.string().default("USD"),
  language: z.string().default("en"),
  timezone: z.string().default("UTC"),
  // Address fields
  billing_address: z.string().optional(),
  billing_city: z.string().optional(),
  billing_state: z.string().optional(),
  billing_country: z.string().optional(),
  billing_postal_code: z.string().optional(),
  shipping_address: z.string().optional(),
  shipping_city: z.string().optional(),
  shipping_state: z.string().optional(),
  shipping_country: z.string().optional(),
  shipping_postal_code: z.string().optional(),
  // Contact person
  contact_person: z.string().optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  // Additional fields
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  // Financial tracking
  outstanding_amount: z.number().default(0),
  total_invoiced: z.number().default(0),
  last_invoice_date: z.string().optional(),
  last_payment_date: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  customer_type: "individual" | "company" | "government";
  industry?: string;
  tax_id?: string;
  credit_limit: number;
  payment_terms?: string;
  currency: string;
  language: string;
  timezone: string;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_postal_code?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  outstanding_amount: number;
  total_invoiced: number;
  last_invoice_date?: string;
  last_payment_date?: string;
  created_at: string;
  updated_at: string;
}

interface CustomerManagementProps {
  companyId: string;
}

export function CustomerManagement({ companyId }: CustomerManagementProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_type: "company",
      currency: "USD",
      language: "en",
      timezone: "UTC",
      credit_limit: 0,
      tags: [],
      is_active: true,
      outstanding_amount: 0,
      total_invoiced: 0,
    },
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, [companyId]);

  // Filter and sort customers
  useEffect(() => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm) ||
          customer.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter(customer => customer.customer_type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Customer];
      let bValue: any = b[sortBy as keyof Customer];

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredCustomers(filtered);
  }, [customers, searchTerm, filterType, sortBy, sortOrder]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      // Mock data - in real app, this would come from API
      const mockCustomers: Customer[] = [
        {
          id: "1",
          name: "ABC Corporation",
          email: "contact@abccorp.com",
          phone: "+1-555-0123",
          website: "https://abccorp.com",
          customer_type: "company",
          industry: "Technology",
          tax_id: "12-3456789",
          credit_limit: 50000,
          payment_terms: "Net 30",
          currency: "USD",
          language: "en",
          timezone: "America/New_York",
          billing_address: "123 Business St",
          billing_city: "New York",
          billing_state: "NY",
          billing_country: "USA",
          billing_postal_code: "10001",
          contact_person: "John Smith",
          contact_email: "john@abccorp.com",
          contact_phone: "+1-555-0124",
          notes: "VIP customer with excellent payment history",
          tags: ["VIP", "Enterprise", "Technology"],
          is_active: true,
          outstanding_amount: 12500,
          total_invoiced: 125000,
          last_invoice_date: "2024-01-15",
          last_payment_date: "2024-01-10",
          created_at: "2023-06-01T00:00:00Z",
          updated_at: "2024-01-15T00:00:00Z",
        },
        {
          id: "2",
          name: "XYZ Limited",
          email: "info@xyzltd.com",
          phone: "+1-555-0456",
          website: "https://xyzltd.com",
          customer_type: "company",
          industry: "Manufacturing",
          tax_id: "98-7654321",
          credit_limit: 25000,
          payment_terms: "Net 15",
          currency: "USD",
          language: "en",
          timezone: "America/Los_Angeles",
          billing_address: "456 Commerce Ave",
          billing_city: "Los Angeles",
          billing_state: "CA",
          billing_country: "USA",
          billing_postal_code: "90210",
          contact_person: "Jane Doe",
          contact_email: "jane@xyzltd.com",
          contact_phone: "+1-555-0457",
          notes: "Regular customer with good payment record",
          tags: ["Regular", "Manufacturing"],
          is_active: true,
          outstanding_amount: 8500,
          total_invoiced: 75000,
          last_invoice_date: "2024-01-10",
          last_payment_date: "2024-01-05",
          created_at: "2023-08-15T00:00:00Z",
          updated_at: "2024-01-10T00:00:00Z",
        },
        {
          id: "3",
          name: "DEF Industries",
          email: "hello@definc.com",
          phone: "+1-555-0789",
          website: "https://definc.com",
          customer_type: "company",
          industry: "Healthcare",
          tax_id: "45-6789012",
          credit_limit: 100000,
          payment_terms: "Net 45",
          currency: "USD",
          language: "en",
          timezone: "America/Chicago",
          billing_address: "789 Industrial Blvd",
          billing_city: "Chicago",
          billing_state: "IL",
          billing_country: "USA",
          billing_postal_code: "60601",
          contact_person: "Mike Johnson",
          contact_email: "mike@definc.com",
          contact_phone: "+1-555-0790",
          notes: "Premium customer with high volume",
          tags: ["Premium", "Healthcare", "High Volume"],
          is_active: true,
          outstanding_amount: 0,
          total_invoiced: 200000,
          last_invoice_date: "2024-01-20",
          last_payment_date: "2024-01-18",
          created_at: "2023-03-10T00:00:00Z",
          updated_at: "2024-01-20T00:00:00Z",
        },
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CustomerFormData) => {
    setLoading(true);
    try {
      if (editingCustomer) {
        // Update existing customer
        const updatedCustomer = {
          ...editingCustomer,
          ...data,
          updated_at: new Date().toISOString(),
        };
        setCustomers(prev => prev.map(c => (c.id === editingCustomer.id ? updatedCustomer : c)));
      } else {
        // Create new customer
        const newCustomer: Customer = {
          id: Date.now().toString(),
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setCustomers(prev => [newCustomer, ...prev]);
      }

      setShowCustomerDialog(false);
      setEditingCustomer(null);
      reset();
    } catch (error) {
      console.error("Error saving customer:", error);
    } finally {
      setLoading(false);
    }
  };

  const editCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    Object.keys(customer).forEach(key => {
      setValue(key as keyof CustomerFormData, customer[key as keyof Customer] as any);
    });
    setShowCustomerDialog(true);
  };

  const deleteCustomer = (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      setCustomers(prev => prev.filter(c => c.id !== customerId));
    }
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId) ? prev.filter(id => id !== customerId) : [...prev, customerId],
    );
  };

  const selectAllCustomers = () => {
    setSelectedCustomers(filteredCustomers.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedCustomers([]);
  };

  const getCustomerStatus = (customer: Customer) => {
    if (!customer.is_active) return { label: "Inactive", color: "gray" };
    if (customer.outstanding_amount > customer.credit_limit * 0.8)
      return { label: "High Risk", color: "red" };
    if (customer.outstanding_amount > customer.credit_limit * 0.5)
      return { label: "Medium Risk", color: "yellow" };
    if (customer.outstanding_amount === 0) return { label: "Paid Up", color: "green" };
    return { label: "Active", color: "blue" };
  };

  const getTotalStats = () => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.is_active).length;
    const totalOutstanding = customers.reduce((sum, c) => sum + c.outstanding_amount, 0);
    const totalInvoiced = customers.reduce((sum, c) => sum + c.total_invoiced, 0);

    return { totalCustomers, activeCustomers, totalOutstanding, totalInvoiced };
  };

  const stats = getTotalStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <Building2 className="h-8 w-8 text-primary" />
            <span>Customer Management</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your customer database and track relationships
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" onClick={loadCustomers}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={() => {
              setEditingCustomer(null);
              reset();
              setShowCustomerDialog(true);
            }}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Customers</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalCustomers}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Customers</p>
                <p className="text-2xl font-bold text-green-900">{stats.activeCustomers}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Outstanding</p>
                <p className="text-2xl font-bold text-yellow-900">
                  ${stats.totalOutstanding.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Invoiced</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${stats.totalInvoiced.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search customers by name, email, phone, or tags..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="individual">Individual</SelectItem>
                  <SelectItem value="company">Company</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="outstanding_amount">Outstanding</SelectItem>
                  <SelectItem value="total_invoiced">Total Invoiced</SelectItem>
                  <SelectItem value="last_invoice_date">Last Invoice</SelectItem>
                  <SelectItem value="created_at">Created Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
              <CardDescription>Manage your customer database</CardDescription>
            </div>
            {selectedCustomers.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCustomers.length} selected
                </span>
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        selectedCustomers.length === filteredCustomers.length &&
                        filteredCustomers.length > 0
                      }
                      onChange={selectAllCustomers}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Invoice</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map(customer => {
                  const status = getCustomerStatus(customer);
                  return (
                    <TableRow key={customer.id} className="hover:bg-gray-50">
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedCustomers.includes(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">{customer.industry}</div>
                          <div className="flex space-x-1">
                            {customer.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Mail className="h-3 w-3" />
                              <span>{customer.email}</span>
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center space-x-1 text-sm">
                              <Phone className="h-3 w-3" />
                              <span>{customer.phone}</span>
                            </div>
                          )}
                          {customer.contact_person && (
                            <div className="text-sm text-muted-foreground">
                              {customer.contact_person}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{customer.customer_type}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        ${customer.credit_limit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">
                          ${customer.outstanding_amount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {((customer.outstanding_amount / customer.credit_limit) * 100).toFixed(1)}
                          % of limit
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={status.color === "green" ? "default" : "secondary"}
                          className={`${
                            status.color === "red"
                              ? "bg-red-100 text-red-800"
                              : status.color === "yellow"
                                ? "bg-yellow-100 text-yellow-800"
                                : status.color === "green"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {customer.last_invoice_date ? (
                          <div className="text-sm">
                            {format(new Date(customer.last_invoice_date), "MMM dd, yyyy")}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => editCustomer(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteCustomer(customer.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer ? "Update customer information" : "Enter customer details"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Customer Name *</Label>
                    <Input id="name" {...register("name")} placeholder="Enter customer name" />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="customer_type">Customer Type</Label>
                    <Select
                      value={watch("customer_type")}
                      onValueChange={value => setValue("customer_type", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Individual</SelectItem>
                        <SelectItem value="company">Company</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register("email")}
                      placeholder="customer@example.com"
                    />
                    {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...register("phone")} placeholder="+1-555-0123" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      {...register("website")}
                      placeholder="https://example.com"
                    />
                    {errors.website && (
                      <p className="text-sm text-red-500">{errors.website.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      {...register("industry")}
                      placeholder="Technology, Manufacturing, etc."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tax_id">Tax ID</Label>
                    <Input id="tax_id" {...register("tax_id")} placeholder="12-3456789" />
                  </div>

                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={watch("currency")}
                      onValueChange={value => setValue("currency", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Address Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Billing Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="billing_address">Address</Label>
                      <Textarea
                        id="billing_address"
                        {...register("billing_address")}
                        placeholder="Street address"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_city">City</Label>
                      <Input id="billing_city" {...register("billing_city")} placeholder="City" />
                    </div>
                    <div>
                      <Label htmlFor="billing_state">State</Label>
                      <Input
                        id="billing_state"
                        {...register("billing_state")}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_country">Country</Label>
                      <Input
                        id="billing_country"
                        {...register("billing_country")}
                        placeholder="Country"
                      />
                    </div>
                    <div>
                      <Label htmlFor="billing_postal_code">Postal Code</Label>
                      <Input
                        id="billing_postal_code"
                        {...register("billing_postal_code")}
                        placeholder="12345"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Financial Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="credit_limit">Credit Limit</Label>
                    <Input
                      id="credit_limit"
                      type="number"
                      {...register("credit_limit", { valueAsNumber: true })}
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Select
                      value={watch("payment_terms") || ""}
                      onValueChange={value => setValue("payment_terms", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Net 15">Net 15</SelectItem>
                        <SelectItem value="Net 30">Net 30</SelectItem>
                        <SelectItem value="Net 45">Net 45</SelectItem>
                        <SelectItem value="Net 60">Net 60</SelectItem>
                        <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    {...register("notes")}
                    placeholder="Additional notes about this customer"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCustomerDialog(false);
                  setEditingCustomer(null);
                  reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting || loading ? "Saving..." : "Save Customer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
