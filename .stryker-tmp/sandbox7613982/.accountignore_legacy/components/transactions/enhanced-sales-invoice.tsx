// @ts-nocheck
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm, useFieldArray } from "react-hook-form";
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
  Plus,
  Trash2,
  Save,
  Send,
  X,
  Calculator,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building2,
  Search,
  Zap,
  Smartphone,
  Mail,
  Download,
  Eye,
  Edit,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Target,
  Sparkles,
  Wand2,
  Lightbulb,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Star,
  Heart,
  ThumbsUp,
} from "lucide-react";
import {
  TransactionService,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
} from "@/lib/transaction-service";
import { AccountingService } from "@/lib/accounting-service";
import { format, addDays } from "date-fns";

// Enhanced form validation schema
const invoiceItemSchema = z.object({
  item_code: z.string().optional(),
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  item_group: z.string().optional(),
  qty: z.number().min(0.001, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be greater than or equal to 0"),
  tax_rate: z.number().min(0).max(100).default(0),
  discount_percent: z.number().min(0).max(100).default(0),
  income_account_id: z.string().optional(),
  expense_account_id: z.string().optional(),
  cost_center_id: z.string().optional(),
  warehouse: z.string().optional(),
  project_id: z.string().optional(),
  uom: z.string().optional(),
  conversion_factor: z.number().min(0.001).default(1),
});

const salesInvoiceSchema = z.object({
  customer_id: z.string().optional(),
  customer_name: z.string().min(1, "Customer name is required"),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  customer_address: z.string().optional(),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  posting_date: z.string().min(1, "Posting date is required"),
  currency: z.string().min(1, "Currency is required"),
  exchange_rate: z.number().min(0.000001, "Exchange rate must be greater than 0").default(1),
  cost_center_id: z.string().optional(),
  project_id: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  remarks: z.string().optional(),
  reference_no: z.string().optional(),
  reference_date: z.string().optional(),
  payment_terms: z.string().optional(),
  shipping_address: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  // New innovative fields
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  tags: z.array(z.string()).default([]),
  ai_suggestions: z.array(z.string()).default([]),
  template_id: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurring_frequency: z.string().optional(),
  recurring_end_date: z.string().optional(),
});

type SalesInvoiceFormData = z.infer<typeof salesInvoiceSchema>;

interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  credit_limit?: number;
  outstanding_amount?: number;
  payment_terms?: string;
  tags?: string[];
  last_invoice_date?: string;
  total_invoiced?: number;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  items: Partial<CreateInvoiceItemInput>[];
  terms_and_conditions: string;
  payment_terms: string;
  is_default: boolean;
}

interface EnhancedSalesInvoiceProps {
  companyId: string;
  onSave: (invoice: any) => void;
  onCancel: () => void;
  initialData?: Partial<SalesInvoiceFormData>;
}

export function EnhancedSalesInvoice({
  companyId,
  onSave,
  onCancel,
  initialData,
}: EnhancedSalesInvoiceProps) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isDraft, setIsDraft] = useState(true);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<SalesInvoiceFormData>({
    resolver: zodResolver(salesInvoiceSchema),
    defaultValues: {
      customer_name: "",
      invoice_date: format(new Date(), "yyyy-MM-dd"),
      due_date: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      posting_date: format(new Date(), "yyyy-MM-dd"),
      currency: "USD",
      exchange_rate: 1,
      priority: "medium",
      tags: [],
      ai_suggestions: [],
      is_recurring: false,
      items: [
        {
          item_name: "",
          qty: 1,
          rate: 0,
          tax_rate: 0,
          discount_percent: 0,
          uom: "Nos",
          conversion_factor: 1,
        },
      ],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "items",
  });

  const watchedItems = watch("items");
  const watchedCurrency = watch("currency");
  const watchedExchangeRate = watch("exchange_rate");
  const watchedCustomerName = watch("customer_name");

  // Calculate enhanced totals
  const calculateTotals = useCallback(() => {
    let netTotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    watchedItems.forEach(item => {
      const itemAmount = item.qty * item.rate;
      const discountAmount = (itemAmount * (item.discount_percent || 0)) / 100;
      const afterDiscount = itemAmount - discountAmount;
      const taxAmount = (afterDiscount * (item.tax_rate || 0)) / 100;

      netTotal += afterDiscount;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    return {
      netTotal,
      totalDiscount,
      totalTax,
      grandTotal: netTotal + totalTax,
    };
  }, [watchedItems]);

  const totals = calculateTotals();

  useEffect(() => {
    loadInitialData();
    generateInvoiceNumber();
  }, [companyId]);

  useEffect(() => {
    if (watchedCustomerName) {
      searchCustomers(watchedCustomerName);
    }
  }, [watchedCustomerName]);

  const loadInitialData = async () => {
    try {
      await Promise.all([loadAccounts(), loadCustomers(), loadTemplates()]);
    } catch (error) {
      console.error("Error loading initial data:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await AccountingService.getAccounts(companyId);
      if (result.success && result.accounts) {
        setAccounts(result.accounts);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const loadCustomers = async () => {
    try {
      // Enhanced customer data with more fields
      const mockCustomers: Customer[] = [
        {
          id: "1",
          name: "ABC Corporation",
          email: "contact@abccorp.com",
          phone: "+1-555-0123",
          address: "123 Business St, New York, NY 10001",
          credit_limit: 50000,
          outstanding_amount: 12500,
          payment_terms: "Net 30",
          tags: ["VIP", "Enterprise"],
          last_invoice_date: "2024-01-15",
          total_invoiced: 125000,
        },
        {
          id: "2",
          name: "XYZ Limited",
          email: "info@xyzltd.com",
          phone: "+1-555-0456",
          address: "456 Commerce Ave, Los Angeles, CA 90210",
          credit_limit: 25000,
          outstanding_amount: 8500,
          payment_terms: "Net 15",
          tags: ["Regular", "Tech"],
          last_invoice_date: "2024-01-10",
          total_invoiced: 75000,
        },
        {
          id: "3",
          name: "DEF Industries",
          email: "hello@definc.com",
          phone: "+1-555-0789",
          address: "789 Industrial Blvd, Chicago, IL 60601",
          credit_limit: 100000,
          outstanding_amount: 0,
          payment_terms: "Net 45",
          tags: ["Premium", "Manufacturing"],
          last_invoice_date: "2024-01-20",
          total_invoiced: 200000,
        },
      ];
      setCustomers(mockCustomers);
    } catch (error) {
      console.error("Error loading customers:", error);
    }
  };

  const loadTemplates = async () => {
    try {
      const mockTemplates: InvoiceTemplate[] = [
        {
          id: "1",
          name: "Standard Service Invoice",
          description: "Basic service invoice template",
          items: [
            {
              item_name: "Professional Services",
              qty: 1,
              rate: 150,
              tax_rate: 10,
              uom: "Hours",
            },
          ],
          terms_and_conditions: "Payment due within 30 days",
          payment_terms: "Net 30",
          is_default: true,
        },
        {
          id: "2",
          name: "Product Sales Invoice",
          description: "Product sales with shipping",
          items: [
            {
              item_name: "Product",
              qty: 1,
              rate: 100,
              tax_rate: 8,
              uom: "Nos",
            },
          ],
          terms_and_conditions: "Warranty as per manufacturer terms",
          payment_terms: "Net 15",
          is_default: false,
        },
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error("Error loading templates:", error);
    }
  };

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    setInvoiceNumber(`INV-${year}${month}${day}-${random}`);
  };

  const searchCustomers = (query: string) => {
    if (!query) return;
    const filtered = customers.filter(
      customer =>
        customer.name.toLowerCase().includes(query.toLowerCase()) ||
        customer.email?.toLowerCase().includes(query.toLowerCase()),
    );
    // Show AI suggestions based on search
    if (filtered.length > 0) {
      setAiSuggestions([
        `Found ${filtered.length} customers matching "${query}"`,
        "Consider adding payment terms based on customer history",
        "Check credit limit before finalizing invoice",
      ]);
    }
  };

  const selectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue("customer_name", customer.name);
    setValue("customer_email", customer.email || "");
    setValue("customer_phone", customer.phone || "");
    setValue("customer_address", customer.address || "");
    setValue("payment_terms", customer.payment_terms || "");
    setShowCustomerDialog(false);
  };

  const applyTemplate = (template: InvoiceTemplate) => {
    setValue("items", template.items as any[]);
    setValue("terms_and_conditions", template.terms_and_conditions);
    setValue("payment_terms", template.payment_terms);
    setShowTemplateDialog(false);
  };

  const addSmartItem = () => {
    const newItem = {
      item_name: "",
      qty: 1,
      rate: 0,
      tax_rate: 0,
      discount_percent: 0,
      uom: "Nos",
      conversion_factor: 1,
    };
    append(newItem);

    // Show AI suggestions for new item
    setAiSuggestions([
      "Consider adding item description for better clarity",
      "Set appropriate tax rate based on item category",
      "Add UOM (Unit of Measure) for accurate tracking",
    ]);
    setShowAISuggestions(true);
  };

  const onSubmit = async (data: SalesInvoiceFormData) => {
    setLoading(true);
    try {
      const invoiceData: CreateInvoiceInput = {
        invoice_type: "Sales",
        customer_id: data.customer_id,
        customer_name: data.customer_name,
        invoice_date: data.invoice_date,
        due_date: data.due_date,
        posting_date: data.posting_date,
        currency: data.currency,
        exchange_rate: data.exchange_rate,
        company_id: companyId,
        cost_center_id: data.cost_center_id,
        project_id: data.project_id,
        terms_and_conditions: data.terms_and_conditions,
        remarks: data.remarks,
        reference_no: data.reference_no,
        reference_date: data.reference_date,
        items: data.items.map(item => ({
          item_code: item.item_code,
          item_name: item.item_name,
          description: item.description,
          item_group: item.item_group,
          qty: item.qty,
          rate: item.rate,
          tax_rate: item.tax_rate,
          income_account_id: item.income_account_id,
          expense_account_id: item.expense_account_id,
          cost_center_id: item.cost_center_id,
          warehouse: item.warehouse,
          project_id: item.project_id,
        })),
      };

      const result = await TransactionService.createInvoice(invoiceData);
      if (result.success && result.invoice) {
        onSave(result.invoice);
      } else {
        console.error("Error creating invoice:", result.error);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    append({
      item_name: "",
      qty: 1,
      rate: 0,
      tax_rate: 0,
      discount_percent: 0,
      uom: "Nos",
      conversion_factor: 1,
    });
  };

  const removeItem = (index: number) => {
    remove(index);
  };

  const duplicateItem = (index: number) => {
    const item = watchedItems[index];
    append({ ...item });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header with Invoice Number and Status */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center space-x-3">
            <FileText className="h-8 w-8 text-primary" />
            <span>Sales Invoice</span>
            <Badge variant={isDraft ? "secondary" : "default"} className="ml-2">
              {isDraft ? "Draft" : "Final"}
            </Badge>
          </h1>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>Invoice #: {invoiceNumber}</span>
            <span>•</span>
            <span>Created: {format(new Date(), "MMM dd, yyyy")}</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Quick Actions
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAISuggestions(!showAISuggestions)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Assistant
          </Button>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <Alert className="border-blue-200 bg-blue-50">
          <Lightbulb className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <h4 className="font-medium">AI Suggestions:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {aiSuggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateDialog(true)}
                className="h-auto p-3 flex flex-col items-center space-y-1"
              >
                <FileText className="h-5 w-5" />
                <span className="text-xs">Use Template</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomerDialog(true)}
                className="h-auto p-3 flex flex-col items-center space-y-1"
              >
                <User className="h-5 w-5" />
                <span className="text-xs">Add Customer</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={addSmartItem}
                className="h-auto p-3 flex flex-col items-center space-y-1"
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Smart Add Item</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDraft(!isDraft)}
                className="h-auto p-3 flex flex-col items-center space-y-1"
              >
                <Edit className="h-5 w-5" />
                <span className="text-xs">{isDraft ? "Mark Final" : "Mark Draft"}</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Information Card */}
        <Card className="border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <User className="h-5 w-5" />
              <span>Customer Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <div className="relative">
                  <Input
                    id="customer_name"
                    {...register("customer_name")}
                    placeholder="Search or enter customer name"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCustomerDialog(true)}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
                {errors.customer_name && (
                  <p className="text-sm text-red-500">{errors.customer_name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="customer_email">Email</Label>
                <Input
                  id="customer_email"
                  {...register("customer_email")}
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <Label htmlFor="customer_phone">Phone</Label>
                <Input
                  id="customer_phone"
                  {...register("customer_phone")}
                  placeholder="+1-555-0123"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="customer_address">Address</Label>
              <Textarea
                id="customer_address"
                {...register("customer_address")}
                placeholder="Customer address"
                rows={2}
              />
            </div>

            {selectedCustomer && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-blue-900">Customer Details</h4>
                    <p className="text-sm text-blue-700">
                      Credit Limit: ${selectedCustomer.credit_limit?.toLocaleString()} |
                      Outstanding: ${selectedCustomer.outstanding_amount?.toLocaleString()} |
                      Payment Terms: {selectedCustomer.payment_terms}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    {selectedCustomer.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details Card */}
        <Card className="border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Calendar className="h-5 w-5" />
              <span>Invoice Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="invoice_date">Invoice Date *</Label>
                <Input id="invoice_date" type="date" {...register("invoice_date")} />
                {errors.invoice_date && (
                  <p className="text-sm text-red-500">{errors.invoice_date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="due_date">Due Date *</Label>
                <Input id="due_date" type="date" {...register("due_date")} />
                {errors.due_date && (
                  <p className="text-sm text-red-500">{errors.due_date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="posting_date">Posting Date *</Label>
                <Input id="posting_date" type="date" {...register("posting_date")} />
                {errors.posting_date && (
                  <p className="text-sm text-red-500">{errors.posting_date.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={watch("priority")}
                  onValueChange={value => setValue("priority", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={watchedCurrency}
                  onValueChange={value => setValue("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="MYR">MYR - Malaysian Ringgit</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="exchange_rate">Exchange Rate</Label>
                <Input
                  id="exchange_rate"
                  type="number"
                  step="0.000001"
                  {...register("exchange_rate", { valueAsNumber: true })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Section */}
        <Card className="border-purple-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <DollarSign className="h-5 w-5" />
                <span>Invoice Items</span>
              </CardTitle>
              <div className="flex space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplateDialog(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Templates
                </Button>
                <Button
                  type="button"
                  onClick={addSmartItem}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Smart Add
                </Button>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 p-4">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                    <div className="col-span-3">Item Name</div>
                    <div className="col-span-2">Description</div>
                    <div className="col-span-1">Qty</div>
                    <div className="col-span-1">Rate</div>
                    <div className="col-span-1">Discount %</div>
                    <div className="col-span-1">Tax %</div>
                    <div className="col-span-1">UOM</div>
                    <div className="col-span-1">Amount</div>
                    <div className="col-span-1">Actions</div>
                  </div>
                </div>
                <div className="divide-y">
                  {fields.map((field, index) => {
                    const item = watchedItems[index];
                    const itemAmount = item.qty * item.rate;
                    const discountAmount = (itemAmount * (item.discount_percent || 0)) / 100;
                    const afterDiscount = itemAmount - discountAmount;
                    const taxAmount = (afterDiscount * (item.tax_rate || 0)) / 100;
                    const totalAmount = afterDiscount + taxAmount;

                    return (
                      <div key={field.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <Input
                              {...register(`items.${index}.item_name`)}
                              placeholder="Item name"
                              className="border-0 bg-transparent p-0 focus:ring-0"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              {...register(`items.${index}.description`)}
                              placeholder="Description"
                              className="border-0 bg-transparent p-0 focus:ring-0"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.001"
                              {...register(`items.${index}.qty`, { valueAsNumber: true })}
                              className="border-0 bg-transparent p-0 focus:ring-0 text-right"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.rate`, { valueAsNumber: true })}
                              className="border-0 bg-transparent p-0 focus:ring-0 text-right"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.discount_percent`, {
                                valueAsNumber: true,
                              })}
                              className="border-0 bg-transparent p-0 focus:ring-0 text-right"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              type="number"
                              step="0.01"
                              {...register(`items.${index}.tax_rate`, { valueAsNumber: true })}
                              className="border-0 bg-transparent p-0 focus:ring-0 text-right"
                            />
                          </div>
                          <div className="col-span-1">
                            <Input
                              {...register(`items.${index}.uom`)}
                              placeholder="Nos"
                              className="border-0 bg-transparent p-0 focus:ring-0"
                            />
                          </div>
                          <div className="col-span-1 text-right">
                            <div className="font-medium">${totalAmount.toFixed(2)}</div>
                            <div className="text-xs text-gray-500">
                              ${afterDiscount.toFixed(2)} + ${taxAmount.toFixed(2)} tax
                            </div>
                          </div>
                          <div className="col-span-1">
                            <div className="flex space-x-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateItem(index)}
                                className="h-8 w-8 p-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {errors.items && <p className="text-sm text-red-500">{errors.items.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Totals Section */}
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Calculator className="h-5 w-5" />
              <span>Invoice Totals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-blue-700">Net Total</span>
                    <span className="text-xl font-bold text-blue-900">
                      ${totals.netTotal.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-yellow-700">Total Discount</span>
                    <span className="text-xl font-bold text-yellow-900">
                      -${totals.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-red-700">Total Tax</span>
                    <span className="text-xl font-bold text-red-900">
                      ${totals.totalTax.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-700">Grand Total</span>
                    <span className="text-2xl font-bold text-green-900">
                      ${totals.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <FileText className="h-5 w-5" />
              <span>Additional Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="terms_and_conditions">Terms & Conditions</Label>
                <Textarea
                  id="terms_and_conditions"
                  {...register("terms_and_conditions")}
                  placeholder="Enter terms and conditions"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  {...register("remarks")}
                  placeholder="Enter any additional remarks"
                  rows={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reference_no">Reference No</Label>
                <Input
                  id="reference_no"
                  {...register("reference_no")}
                  placeholder="Enter reference number"
                />
              </div>

              <div>
                <Label htmlFor="reference_date">Reference Date</Label>
                <Input id="reference_date" type="date" {...register("reference_date")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-between items-center pt-6 border-t">
          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="button" variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" disabled={isSubmitting || loading}>
              <Download className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting || loading ? "Saving..." : "Save Invoice"}
            </Button>
            <Button
              type="button"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <Send className="h-4 w-4 mr-2" />
              Send to Customer
            </Button>
          </div>
        </div>
      </form>

      {/* Customer Selection Dialog */}
      <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Customer</DialogTitle>
            <DialogDescription>Choose a customer from your customer database</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search customers..."
                value={customerSearch}
                onChange={e => setCustomerSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {customers
                .filter(
                  customer =>
                    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                    customer.email?.toLowerCase().includes(customerSearch.toLowerCase()),
                )
                .map(customer => (
                  <div
                    key={customer.id}
                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => selectCustomer(customer)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{customer.name}</h4>
                        <p className="text-sm text-gray-600">{customer.email}</p>
                        <p className="text-sm text-gray-500">{customer.address}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          Credit: ${customer.credit_limit?.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">
                          Outstanding: ${customer.outstanding_amount?.toLocaleString()}
                        </div>
                        <div className="flex space-x-1 mt-1">
                          {customer.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Selection Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select Invoice Template</DialogTitle>
            <DialogDescription>
              Choose a template to quickly populate your invoice
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {templates.map(template => (
              <div
                key={template.id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => applyTemplate(template)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium flex items-center space-x-2">
                      {template.name}
                      {template.is_default && (
                        <Badge variant="default" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </h4>
                    <p className="text-sm text-gray-600">{template.description}</p>
                    <p className="text-sm text-gray-500">
                      {template.items.length} item(s) • {template.payment_terms}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Use Template
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
