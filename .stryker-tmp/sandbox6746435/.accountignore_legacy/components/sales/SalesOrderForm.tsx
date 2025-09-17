/**
 * Sales Order Form Component
 * ERPNext-level sales order management with comprehensive features
 *
 * Features:
 * - Complete sales order creation and editing
 * - Quotation conversion support
 * - Item management with delivery tracking
 * - Customer credit limit validation
 * - Real-time total calculations
 * - Document workflow integration
 * - Dark theme optimized UI
 */
// @ts-nocheck


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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CalendarIcon,
  Plus,
  Minus,
  FileText,
  Send,
  X,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Truck,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SalesManagementService,
  CreateSalesOrderInput,
  SalesOrder,
  SalesOrderStatus,
} from "@/lib/sales-management-service";
import { toast } from "sonner";

// Form validation schema
const salesOrderSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  customer_name: z.string().min(1, "Customer name is required"),
  transaction_date: z.string().min(1, "Transaction date is required"),
  delivery_date: z.string().optional(),
  order_type: z.enum(["Sales", "Maintenance", "Shopping Cart"]).default("Sales"),
  currency: z.string().default("USD"),
  conversion_rate: z.number().min(0.000001, "Conversion rate must be greater than 0").default(1),
  po_no: z.string().optional(),
  po_date: z.string().optional(),
  terms: z.string().optional(),
  quotation_id: z.string().optional(),
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
        quotation_item_id: z.string().optional(),
      }),
    )
    .min(1, "At least one item is required"),
});

type SalesOrderFormValues = z.infer<typeof salesOrderSchema>;

interface SalesOrderFormProps {
  companyId: string;
  order?: SalesOrder;
  quotationId?: string;
  onSuccess?: (order: SalesOrder) => void;
  onCancel?: () => void;
}

export function SalesOrderForm({
  companyId,
  order,
  quotationId,
  onSuccess,
  onCancel,
}: SalesOrderFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [creditLimitCheck, setCreditLimitCheck] = useState<any>(null);
  const [isCheckingCredit, setIsCheckingCredit] = useState(false);

  const form = useForm<SalesOrderFormValues>({
    resolver: zodResolver(salesOrderSchema),
    defaultValues: {
      customer_id: "",
      customer_name: "",
      transaction_date: new Date().toISOString().split("T")[0],
      delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 7 days from now
      order_type: "Sales",
      currency: "USD",
      conversion_rate: 1,
      po_no: "",
      po_date: "",
      terms: "",
      quotation_id: quotationId,
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
          quotation_item_id: "",
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedCustomerId = form.watch("customer_id");
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
    if (order) {
      form.reset({
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        transaction_date: order.transaction_date,
        delivery_date: order.delivery_date,
        order_type: order.order_type,
        currency: order.currency,
        conversion_rate: order.conversion_rate,
        po_no: order.po_no,
        po_date: order.po_date,
        terms: order.terms,
        quotation_id: order.quotation_id,
        items:
          order.items?.map(item => ({
            item_code: item.item_code,
            item_name: item.item_name,
            description: item.description,
            qty: item.qty,
            rate: item.rate,
            uom: item.uom,
            delivery_date: item.delivery_date,
            warehouse: item.warehouse,
            quotation_item_id: item.quotation_item_id,
          })) || [],
      });
    }
  }, [order, form]);

  // Load quotation data if converting
  useEffect(() => {
    if (quotationId && !order) {
      loadQuotationData();
    }
  }, [quotationId]);

  // Load customers and items on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Check credit limit when customer or amount changes
  useEffect(() => {
    if (watchedCustomerId && totals.amount > 0) {
      checkCustomerCreditLimit();
    }
  }, [watchedCustomerId, totals.amount]);

  const loadInitialData = async () => {
    try {
      // Load customers - placeholder implementation
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

  const loadQuotationData = async () => {
    if (!quotationId) return;

    try {
      const result = await SalesManagementService.getQuotation(quotationId);
      if (result.success && result.data) {
        const quotation = result.data;
        form.reset({
          ...form.getValues(),
          customer_id: quotation.customer_id,
          customer_name: quotation.customer_name,
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
              quotation_item_id: item.id,
            })) || [],
        });
      }
    } catch (error) {
      toast.error("Failed to load quotation data");
    }
  };

  const checkCustomerCreditLimit = async () => {
    if (!watchedCustomerId) return;

    setIsCheckingCredit(true);
    try {
      const result = await SalesManagementService.checkCustomerCreditLimit(
        watchedCustomerId,
        companyId,
        totals.amount,
      );

      if (result.success) {
        setCreditLimitCheck(result.data);
      }
    } catch (error) {
      console.error("Failed to check credit limit:", error);
    } finally {
      setIsCheckingCredit(false);
    }
  };

  const onSubmit = async (data: SalesOrderFormValues) => {
    setIsLoading(true);
    try {
      const input: CreateSalesOrderInput = {
        company_id: companyId,
        ...data,
      };

      const result = await SalesManagementService.createSalesOrder(input);

      if (result.success && result.data) {
        toast.success(result.message || "Sales order created successfully");
        onSuccess?.(result.data);
      } else {
        toast.error(result.error || "Failed to create sales order");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitDocument = async () => {
    if (!order?.id) return;

    setIsLoading(true);
    try {
      const result = await SalesManagementService.submitSalesOrder(order.id);

      if (result.success) {
        toast.success("Sales order submitted successfully");
        onSuccess?.(order);
      } else {
        toast.error(result.error || "Failed to submit sales order");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: SalesOrderStatus) => {
    switch (status) {
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
  };

  const getStatusIcon = (status: SalesOrderStatus) => {
    switch (status) {
      case "Completed":
        return <CheckCircle className="h-4 w-4" />;
      case "To Deliver":
        return <Truck className="h-4 w-4" />;
      case "To Bill":
        return <Receipt className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight">
            {order ? `Edit Sales Order ${order.order_no}` : "New Sales Order"}
          </h2>
          <p className="text-muted-foreground">
            {order
              ? "Update sales order details"
              : quotationId
                ? "Convert quotation to sales order"
                : "Create a new sales order"}
          </p>
        </div>
        {order && (
          <div className="flex items-center space-x-2">
            <Badge
              variant={getStatusBadgeVariant(order.status)}
              className="flex items-center space-x-1"
            >
              {getStatusIcon(order.status)}
              <span>{order.status}</span>
            </Badge>
          </div>
        )}
      </div>

      {/* Credit Limit Warning */}
      {creditLimitCheck?.credit_limit_exceeded && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Credit limit exceeded! Credit limit: ${creditLimitCheck.credit_limit.toFixed(2)},
            Outstanding: ${creditLimitCheck.outstanding_amount.toFixed(2)}, Available: $
            {creditLimitCheck.credit_available.toFixed(2)}
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery & Billing Progress (for existing orders) */}
      {order && order.docstatus === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Delivery Progress</span>
                <span>{order.per_delivered.toFixed(1)}%</span>
              </div>
              <Progress value={order.per_delivered} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Billing Progress</span>
                <span>{order.per_billed.toFixed(1)}%</span>
              </div>
              <Progress value={order.per_billed} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

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
                    <FormLabel>Order Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Delivery Date</FormLabel>
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
                name="po_no"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer PO Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter customer PO number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="po_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer PO Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Currency Information */}
          <Card>
            <CardHeader>
              <CardTitle>Currency & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <FormField
                control={form.control}
                name="conversion_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversion Rate</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value) || 1)}
                      />
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
                      quotation_item_id: "",
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
                            <FormLabel>Expected Delivery</FormLabel>
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

                    {/* Show delivery/billing status for existing orders */}
                    {order && order.items?.[index] && (
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Delivered: </span>
                          <span className="font-medium">
                            {order.items[index].delivered_qty.toFixed(3)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Billed: </span>
                          <span className="font-medium">
                            {order.items[index].billed_qty.toFixed(3)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pending: </span>
                          <span className="font-medium">
                            {order.items[index].pending_qty.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    )}

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

              {creditLimitCheck && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Credit Limit</p>
                      <p className="font-medium">${creditLimitCheck.credit_limit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Outstanding</p>
                      <p className="font-medium">
                        ${creditLimitCheck.outstanding_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Utilization</p>
                      <p className="font-medium">
                        {creditLimitCheck.credit_utilization.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Available</p>
                      <p
                        className={cn(
                          "font-medium",
                          creditLimitCheck.credit_available < 0
                            ? "text-destructive"
                            : "text-green-600",
                        )}
                      >
                        ${creditLimitCheck.credit_available.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
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
            {order && order.docstatus === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleSubmitDocument}
                disabled={
                  isLoading ||
                  (creditLimitCheck?.credit_limit_exceeded && !form.getValues("customer_id"))
                }
              >
                <Send className="h-4 w-4 mr-2" />
                Submit
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || (creditLimitCheck?.credit_limit_exceeded && !order)}
            >
              {isLoading ? "Processing..." : order ? "Update Sales Order" : "Create Sales Order"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
