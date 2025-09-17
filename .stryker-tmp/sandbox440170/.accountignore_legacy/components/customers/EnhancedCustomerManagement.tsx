/**
 * Enhanced Customer Management with Service Integration
 * Connects customer management UI to MasterDataService with full CRUD operations
 */
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Save,
  X,
  User,
  Building2,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  CreditCard,
} from "lucide-react";
import { MasterDataService, Customer } from "@/lib/master-data-service";
import { OutstandingManagementService } from "@/lib/outstanding-management";
import { useCompany } from "@/hooks/useAuth";
import { format } from "date-fns";

// Form validation schema
const customerSchema = z.object({
  customer_name: z.string().min(2, "Customer name must be at least 2 characters"),
  customer_code: z.string().optional(),
  customer_type: z.enum(["Company", "Individual"]),
  customer_group: z.string().optional(),
  territory: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  tax_id: z.string().optional(),
  pan_number: z.string().optional(),
  gst_number: z.string().optional(),
  credit_limit: z.number().min(0, "Credit limit must be non-negative").default(0),
  credit_days: z.number().min(1, "Credit days must be at least 1").default(30),
  payment_terms: z.string().optional(),
  is_active: z.boolean().default(true),
  is_frozen: z.boolean().default(false),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerWithOutstanding extends Customer {
  outstanding_amount?: number;
  overdue_amount?: number;
}

export function EnhancedCustomerManagement() {
  const { currentCompany } = useCompany();

  // State management
  const [customers, setCustomers] = useState<CustomerWithOutstanding[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerWithOutstanding[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      customer_type: "Company",
      credit_limit: 0,
      credit_days: 30,
      payment_terms: "Net 30",
      is_active: true,
      is_frozen: false,
    },
  });

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();
  }, [currentCompany]);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        customer =>
          customer.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.customer_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      setFilteredCustomers(filtered);
    }
  }, [customers, searchTerm]);

  const loadCustomers = async () => {
    if (!currentCompany) return;

    try {
      setLoading(true);
      const result = await MasterDataService.searchCustomers(currentCompany.id);

      if (result.success && result.data) {
        // Load outstanding amounts for each customer
        const customersWithOutstanding = await Promise.all(
          result.data.map(async customer => {
            try {
              const outstanding = await OutstandingManagementService.getCustomerOutstandingInvoices(
                customer.id,
                currentCompany.id,
              );

              const totalOutstanding = outstanding.reduce(
                (sum, invoice) => sum + invoice.outstanding_amount,
                0,
              );
              const overdueAmount = outstanding
                .filter(invoice => new Date(invoice.due_date) < new Date())
                .reduce((sum, invoice) => sum + invoice.outstanding_amount, 0);

              return {
                ...customer,
                outstanding_amount: totalOutstanding,
                overdue_amount: overdueAmount,
              };
            } catch (error) {
              console.error(`Error loading outstanding for customer ${customer.id}:`, error);
              return { ...customer, outstanding_amount: 0, overdue_amount: 0 };
            }
          }),
        );

        setCustomers(customersWithOutstanding);
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (data: CustomerFormData) => {
    if (!currentCompany) return;

    try {
      const result = await MasterDataService.createCustomer({
        ...data,
        company_id: currentCompany.id,
      });

      if (result.success) {
        setShowCreateDialog(false);
        reset();
        await loadCustomers();
      } else {
        console.error("Error creating customer:", result.error);
      }
    } catch (error) {
      console.error("Error creating customer:", error);
    }
  };

  const handleUpdateCustomer = async (data: CustomerFormData) => {
    if (!selectedCustomer || !currentCompany) return;

    try {
      const result = await MasterDataService.updateCustomer(selectedCustomer.id, data);

      if (result.success) {
        setShowEditDialog(false);
        setSelectedCustomer(null);
        reset();
        await loadCustomers();
      } else {
        console.error("Error updating customer:", result.error);
      }
    } catch (error) {
      console.error("Error updating customer:", error);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      const result = await MasterDataService.deleteCustomer(customerToDelete.id);

      if (result.success) {
        setShowDeleteDialog(false);
        setCustomerToDelete(null);
        await loadCustomers();
      } else {
        console.error("Error deleting customer:", result.error);
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const openEditDialog = (customer: Customer) => {
    setSelectedCustomer(customer);

    // Populate form with customer data
    Object.keys(customer).forEach(key => {
      if (key in customerSchema.shape) {
        setValue(key as keyof CustomerFormData, customer[key as keyof Customer] as any);
      }
    });

    setShowEditDialog(true);
  };

  const openViewDialog = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowViewDialog(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteDialog(true);
  };

  const getStatusBadge = (customer: CustomerWithOutstanding) => {
    if (!customer.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (customer.is_frozen) {
      return <Badge variant="destructive">Frozen</Badge>;
    }
    if (customer.overdue_amount && customer.overdue_amount > 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (customer.outstanding_amount && customer.outstanding_amount > 0) {
      return <Badge variant="secondary">Outstanding</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getCreditUtilization = (customer: CustomerWithOutstanding) => {
    if (!customer.credit_limit || customer.credit_limit === 0) return 0;
    return ((customer.outstanding_amount || 0) / customer.credit_limit) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Management
              </CardTitle>
              <CardDescription>
                Manage customer information, credit limits, and outstanding balances
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name, code, or email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadCustomers} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading customers...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Credit Limit</TableHead>
                  <TableHead>Outstanding</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map(customer => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.customer_name}</div>
                        {customer.email && (
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{customer.customer_code || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.customer_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {customer.phone && <div>{customer.phone}</div>}
                        {customer.mobile && <div>{customer.mobile}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{customer.credit_limit.toFixed(2)}</div>
                        {customer.credit_limit > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {getCreditUtilization(customer).toFixed(1)}% used
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {(customer.outstanding_amount || 0).toFixed(2)}
                        </div>
                        {customer.overdue_amount && customer.overdue_amount > 0 && (
                          <div className="text-sm text-red-600">
                            {customer.overdue_amount.toFixed(2)} overdue
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(customer)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => openViewDialog(customer)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openEditDialog(customer)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(customer)}
                          disabled={customer.outstanding_amount && customer.outstanding_amount > 0}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "No customers found matching your search."
                : "No customers found. Create your first customer to get started."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>Add a new customer to your system</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleCreateCustomer)} className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  {...register("customer_name")}
                  placeholder="Enter customer name"
                />
                {errors.customer_name && (
                  <p className="text-sm text-destructive">{errors.customer_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_code">Customer Code</Label>
                <Input
                  id="customer_code"
                  {...register("customer_code")}
                  placeholder="Auto-generated if empty"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_type">Customer Type *</Label>
                <Select
                  onValueChange={(value: "Company" | "Individual") =>
                    setValue("customer_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Company">Company</SelectItem>
                    <SelectItem value="Individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="customer@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} placeholder="+1-555-0123" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile</Label>
                <Input id="mobile" {...register("mobile")} placeholder="+1-555-0123" />
              </div>
            </div>

            {/* Credit Management */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  {...register("credit_limit", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.credit_limit && (
                  <p className="text-sm text-destructive">{errors.credit_limit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_days">Credit Days</Label>
                <Input
                  id="credit_days"
                  type="number"
                  {...register("credit_days", { valueAsNumber: true })}
                  placeholder="30"
                />
                {errors.credit_days && (
                  <p className="text-sm text-destructive">{errors.credit_days.message}</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Input id="payment_terms" {...register("payment_terms")} placeholder="Net 30" />
              </div>
            </div>

            {/* Tax Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tax_id">Tax ID</Label>
                <Input
                  id="tax_id"
                  {...register("tax_id")}
                  placeholder="Tax identification number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan_number">PAN Number</Label>
                <Input id="pan_number" {...register("pan_number")} placeholder="PAN number" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  {...register("gst_number")}
                  placeholder="GST registration number"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Create Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>Update customer information</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(handleUpdateCustomer)} className="space-y-4">
            {/* Same form fields as create dialog */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  {...register("customer_name")}
                  placeholder="Enter customer name"
                />
                {errors.customer_name && (
                  <p className="text-sm text-destructive">{errors.customer_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer_code">Customer Code</Label>
                <Input
                  id="customer_code"
                  {...register("customer_code")}
                  placeholder="Customer code"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="customer@example.com"
                />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} placeholder="+1-555-0123" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_limit">Credit Limit</Label>
                <Input
                  id="credit_limit"
                  type="number"
                  step="0.01"
                  {...register("credit_limit", { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {errors.credit_limit && (
                  <p className="text-sm text-destructive">{errors.credit_limit.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="credit_days">Credit Days</Label>
                <Input
                  id="credit_days"
                  type="number"
                  {...register("credit_days", { valueAsNumber: true })}
                  placeholder="30"
                />
                {errors.credit_days && (
                  <p className="text-sm text-destructive">{errors.credit_days.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Update Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View customer information and outstanding balances
            </DialogDescription>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm">{selectedCustomer.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer Code</Label>
                  <p className="text-sm">{selectedCustomer.customer_code || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{selectedCustomer.customer_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedCustomer.email || "-"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Credit Limit</Label>
                  <p className="text-sm">{selectedCustomer.credit_limit.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Credit Days</Label>
                  <p className="text-sm">{selectedCustomer.credit_days} days</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-sm font-medium">Outstanding Summary</Label>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Outstanding</div>
                    <div className="text-lg font-bold">
                      {(
                        (selectedCustomer as CustomerWithOutstanding).outstanding_amount || 0
                      ).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Overdue Amount</div>
                    <div className="text-lg font-bold text-red-600">
                      {((selectedCustomer as CustomerWithOutstanding).overdue_amount || 0).toFixed(
                        2,
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this customer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {customerToDelete && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                You are about to delete <strong>{customerToDelete.customer_name}</strong>. This will
                permanently remove all customer data.
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCustomer}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
