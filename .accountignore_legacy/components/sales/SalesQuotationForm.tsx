/**
 * Sales Quotation Form Component
 * ERPNext-level quotation management with comprehensive features
 *
 * Features:
 * - Complete quotation creation and editing
 * - Item management with pricing
 * - Customer selection and validation
 * - Real-time total calculations
 * - Document workflow integration
 * - Dark theme optimized UI
 */

"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Plus, Minus, FileText, Send, X, DollarSign } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  SalesManagementService,
  CreateQuotationInput,
  SalesQuotation,
  QuotationStatus,
} from "@/lib/sales-management-service";
import { toast } from "sonner";

// Form validation schema
const quotationSchema = z.object({
  customer_id: z.string().optional(),
  quotation_to: z.enum(["Customer", "Lead"]),
  customer_name: z.string().min(1, "Customer name is required"),
  transaction_date: z.string().min(1, "Transaction date is required"),
  valid_till: z.string().optional(),
  order_type: z.enum(["Sales", "Maintenance", "Shopping Cart"]).default("Sales"),
  currency: z.string().default("USD"),
  conversion_rate: z.number().min(0.000001, "Conversion rate must be greater than 0").default(1),
  terms: z.string().optional(),
  items: z
    .array(
      z.object({
        item_code: z.string().min(1, "Item code is required"),
        item_name: z.string().min(1, "Item name is required"),
        description: z.string().optional(),
        qty: z.number().min(0.001, "Quantity must be greater than 0"),
        rate: z.number().min(0, "Rate cannot be negative"),
        uom: z.string().optional(),
        delivery_date: z.string().optional(),
        warehouse: z.string().optional(),
      }),
    )
    .min(1, "At least one item is required"),
});

type QuotationFormValues = z.infer<typeof quotationSchema>;

interface SalesQuotationFormProps {
  companyId: string;
  quotation?: SalesQuotation;
  onSuccess?: (quotation: SalesQuotation) => void;
  onCancel?: () => void;
}

export function SalesQuotationForm({
  companyId,
  quotation,
  onSuccess,
  onCancel,
}: SalesQuotationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      quotation_to: "Customer",
      customer_name: "",
      transaction_date: new Date().toISOString().split("T")[0],
      valid_till: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 30 days from now
      order_type: "Sales",
      currency: "USD",
      conversion_rate: 1,
      terms: "",
      items: [
        {
          item_code: "",
          item_name: "",
          description: "",
          qty: 1,
          rate: 0,
          uom: "Nos",
          delivery_date: "",
          warehouse: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const conversionRate = form.watch("conversion_rate");

  // Calculate totals
  const totals = {
    qty: watchedItems.reduce((sum, item) => sum + (item.qty || 0), 0),
    amount: watchedItems.reduce((sum, item) => sum + (item.qty || 0) * (item.rate || 0), 0),
  };

  const baseTotals = {
    amount: totals.amount * conversionRate,
  };

  // Load form data if editing
  useEffect(() => {
    if (quotation) {
      form.reset({
        customer_id: quotation.customer_id,
        quotation_to: quotation.quotation_to,
        customer_name: quotation.customer_name,
        transaction_date: quotation.transaction_date,
        valid_till: quotation.valid_till,
        order_type: quotation.order_type,
        currency: quotation.currency,
        conversion_rate: quotation.conversion_rate,
        terms: quotation.terms,
        items:
          quotation.items?.map(item => ({
            item_code: item.item_code,
            item_name: item.item_name,
            description: item.description,
            qty: item.qty,
            rate: item.rate,
            uom: item.uom,
            delivery_date: item.delivery_date,
            warehouse: item.warehouse,
          })) || [],
      });
    }
  }, [quotation, form]);

  // Load customers and items on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load customers - placeholder implementation
      // In real implementation, you'd load from your customer service
      setCustomers([
        { id: "1", name: "Sample Customer 1" },
        { id: "2", name: "Sample Customer 2" },
      ]);

      // Load items - placeholder implementation
      setItems([
        { code: "ITEM001", name: "Sample Item 1", rate: 100 },
        { code: "ITEM002", name: "Sample Item 2", rate: 200 },
      ]);
    } catch (error) {
      toast.error("Failed to load initial data");
    }
  };

  const onSubmit = async (data: QuotationFormValues) => {
    setIsLoading(true);
    try {
      const input: CreateQuotationInput = {
        company_id: companyId,
        ...data,
      };

      const result = await SalesManagementService.createQuotation(input);

      if (result.success && result.data) {
        toast.success(result.message || "Quotation created successfully");
        onSuccess?.(result.data);
      } else {
        toast.error(result.error || "Failed to create quotation");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDocument = async () => {
    if (!quotation?.id) return;

    setIsLoading(true);
    try {
      const result = await SalesManagementService.submitQuotation(quotation.id);

      if (result.success) {
        toast.success("Quotation submitted successfully");
        onSuccess?.(quotation);
      } else {
        toast.error(result.error || "Failed to submit quotation");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: QuotationStatus) => {
    switch (status) {
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
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {quotation ? `Edit Quotation ${quotation.quotation_no}` : "New Sales Quotation"}
          </h2>
          <p className="text-muted-foreground">
            {quotation ? "Update quotation details" : "Create a new sales quotation"}
          </p>
        </div>
        {quotation && (
          <Badge variant={getStatusBadgeVariant(quotation.status)}>{quotation.status}</Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quotation_to"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quotation To</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Lead">Lead</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customer_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quotation Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_till"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid Till</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="order_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select order type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Maintenance">Maintenance</SelectItem>
                        <SelectItem value="Shopping Cart">Shopping Cart</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <FormControl>
                      <Input placeholder="USD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Items</span>
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({
                      item_code: "",
                      item_name: "",
                      description: "",
                      qty: 1,
                      rate: 0,
                      uom: "Nos",
                      delivery_date: "",
                      warehouse: "",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Item {index + 1}</span>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.item_code`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter item code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.item_name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter item name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.qty`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.001"
                                min="0.001"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.rate`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rate</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                {...field}
                                onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`items.${index}.uom`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>UOM</FormLabel>
                            <FormControl>
                              <Input placeholder="Nos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.delivery_date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Delivery Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.warehouse`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Warehouse</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter warehouse" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter item description" rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      <div className="text-sm text-muted-foreground">
                        Amount: $
                        {(
                          (watchedItems[index]?.qty || 0) * (watchedItems[index]?.rate || 0)
                        ).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Qty</p>
                  <p className="text-lg font-semibold">{totals.qty.toFixed(3)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Net Total</p>
                  <p className="text-lg font-semibold">${totals.amount.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-xl font-bold">${totals.amount.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Grand Total (Base)</p>
                  <p className="text-xl font-bold">${baseTotals.amount.toFixed(2)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="terms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Terms and Conditions</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter terms and conditions" rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {quotation && quotation.docstatus === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmitDocument}
                disabled={isLoading}
              >
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : quotation ? "Update Quotation" : "Create Quotation"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
