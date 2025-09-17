/**
 * ERPNext Enhanced Sales Invoice Form
 * Integrates all new ERPNext-level features: Cost Centers, Dimensions, Budget Validation, Workflow
 */
// @ts-nocheck


"use client";

import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Trash2,
  Save,
  Send,
  Calculator,
  FileText,
  DollarSign,
  Calendar,
  User,
  Building2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Target,
  Grid3X3,
} from "lucide-react";

// Import new components
import CostCenterSelector from "@/components/cost-centers/CostCenterSelector";
import AccountingDimensionsForm from "@/components/dimensions/AccountingDimensionsForm";
import BudgetValidationAlert from "@/components/budget/BudgetValidationAlert";
import DocumentWorkflowStatus, {
  DocumentStatus,
} from "@/components/workflow/DocumentWorkflowStatus";

// Import services
import {
  TransactionService,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
} from "@/lib/transaction-service";
import { ERPNextGLEntryValidator } from "@/lib/validation/gl-entry-validator-erpnext-enhanced";
import { EnhancedDocumentWorkflowEngine } from "@/lib/document-workflow-enhanced";
import { useAuth } from "@/hooks/useAuth";

// Enhanced form validation schema
const invoiceItemSchema = z.object({
  item_code: z.string().optional(),
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  item_group: z.string().optional(),
  qty: z.number().min(0.001, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate must be greater than or equal to 0"),
  tax_rate: z.number().min(0).max(100).default(0),
  income_account_id: z.string().optional(),
  expense_account_id: z.string().optional(),
  cost_center_id: z.string().optional(), // New field
  project_id: z.string().optional(), // New field
  // Accounting dimensions (dynamic)
  department: z.string().optional(),
  branch: z.string().optional(),
  territory: z.string().optional(),
});

const invoiceSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  posting_date: z.string().min(1, "Posting date is required"),
  due_date: z.string().min(1, "Due date is required"),
  currency: z.string().default("USD"),
  exchange_rate: z.number().default(1),
  cost_center_id: z.string().optional(), // New field
  project_id: z.string().optional(), // New field
  // Accounting dimensions
  department: z.string().optional(),
  branch: z.string().optional(),
  territory: z.string().optional(),
  // Existing fields
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  notes: z.string().optional(),
  terms_and_conditions: z.string().optional(),
  discount_type: z.enum(["Percentage", "Amount"]).default("Percentage"),
  discount_value: z.number().min(0).default(0),
  tax_template: z.string().optional(),
  payment_terms: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

interface ERPNextEnhancedSalesInvoiceFormProps {
  companyId: string;
  invoiceId?: string;
  initialData?: Partial<InvoiceFormData>;
  onSave?: (data: InvoiceFormData) => void;
  onSubmit?: (data: InvoiceFormData) => void;
  onCancel?: () => void;
}

export function ERPNextEnhancedSalesInvoiceForm({
  companyId,
  invoiceId,
  initialData,
  onSave,
  onSubmit,
  onCancel,
}: ERPNextEnhancedSalesInvoiceFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>("Draft");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [budgetValidationResults, setBudgetValidationResults] = useState<Record<string, any>>({});

  // Form setup
  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      currency: "USD",
      exchange_rate: 1,
      discount_type: "Percentage",
      discount_value: 0,
      posting_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      items: [
        {
          item_name: "",
          qty: 1,
          rate: 0,
          tax_rate: 0,
        },
      ],
      ...initialData,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watch form values for real-time validation
  const watchedValues = form.watch();
  const watchedItems = form.watch("items");

  // Calculate totals
  const calculateTotals = () => {
    const items = watchedItems || [];
    const subtotal = items.reduce((sum, item) => {
      const amount = (item.qty || 0) * (item.rate || 0);
      return sum + amount;
    }, 0);

    const taxTotal = items.reduce((sum, item) => {
      const amount = (item.qty || 0) * (item.rate || 0);
      const tax = amount * ((item.tax_rate || 0) / 100);
      return sum + tax;
    }, 0);

    const discountAmount =
      watchedValues.discount_type === "Percentage"
        ? subtotal * ((watchedValues.discount_value || 0) / 100)
        : watchedValues.discount_value || 0;

    const total = subtotal + taxTotal - discountAmount;

    return { subtotal, taxTotal, discountAmount, total };
  };

  const totals = calculateTotals();

  // Real-time GL validation
  useEffect(() => {
    if (watchedValues.customer_id && totals.total > 0) {
      validateGLEntries();
    }
  }, [watchedValues, totals]);

  const validateGLEntries = async () => {
    try {
      const glEntries = [
        {
          account: "Accounts Receivable", // This would be dynamic
          debit: totals.total,
          credit: 0,
          costCenter: watchedValues.cost_center_id,
          project: watchedValues.project_id,
          department: watchedValues.department,
          branch: watchedValues.branch,
          territory: watchedValues.territory,
        },
        {
          account: "Sales Revenue", // This would be dynamic
          debit: 0,
          credit: totals.subtotal,
          costCenter: watchedValues.cost_center_id,
          project: watchedValues.project_id,
          department: watchedValues.department,
          branch: watchedValues.branch,
          territory: watchedValues.territory,
        },
      ];

      const validation = await ERPNextGLEntryValidator.validateVoucher(
        companyId,
        "Sales Invoice",
        glEntries,
        watchedValues.posting_date,
      );

      if (!validation.isValid) {
        setValidationErrors(validation.errors);
      } else {
        setValidationErrors([]);
      }
    } catch (error) {
      console.error("GL validation failed:", error);
    }
  };

  const handleSave = async (data: InvoiceFormData) => {
    setSaving(true);
    try {
      // Save as draft
      const invoiceData: CreateInvoiceInput = {
        ...data,
        company_id: companyId,
        docstatus: 0, // Draft
      };

      const result = await TransactionService.createInvoice(invoiceData);
      if (result.success) {
        onSave?.(data);
      }
    } catch (error) {
      console.error("Failed to save invoice:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (data: InvoiceFormData) => {
    setSubmitting(true);
    try {
      // First save the invoice
      const invoiceData: CreateInvoiceInput = {
        ...data,
        company_id: companyId,
        docstatus: 0, // Will be updated by workflow
      };

      const result = await TransactionService.createInvoice(invoiceData);
      if (result.success && result.invoiceId) {
        // Submit through enhanced workflow
        const workflowResult = await EnhancedDocumentWorkflowEngine.submitDocumentEnhanced(
          "Sales Invoice",
          result.invoiceId,
          {
            companyId,
            userId: user?.id || "",
            submissionDate: new Date().toISOString(),
          },
        );

        if (workflowResult.success) {
          setDocumentStatus(workflowResult.approvalRequired ? "Pending Approval" : "Submitted");
          onSubmit?.(data);
        }
      }
    } catch (error) {
      console.error("Failed to submit invoice:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const addItem = () => {
    append({
      item_name: "",
      qty: 1,
      rate: 0,
      tax_rate: 0,
    });
  };

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Document Status */}
      {invoiceId && (
        <DocumentWorkflowStatus
          documentType="Sales Invoice"
          documentId={invoiceId}
          currentStatus={documentStatus}
          companyId={companyId}
          userId={user?.id || ""}
          userRole={user?.role}
          onStatusChange={setDocumentStatus}
        />
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-6 w-6 mr-2" />
              Sales Invoice
            </CardTitle>
            <CardDescription>
              Create a new sales invoice with enhanced ERPNext features
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Details</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="items">Items</TabsTrigger>
            <TabsTrigger value="totals">Totals & Submit</TabsTrigger>
          </TabsList>

          {/* Basic Details Tab */}
          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_id">Customer *</Label>
                  <Select
                    value={form.watch("customer_id")}
                    onValueChange={value => form.setValue("customer_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer1">Customer 1</SelectItem>
                      <SelectItem value="customer2">Customer 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="posting_date">Posting Date *</Label>
                  <Input type="date" {...form.register("posting_date")} />
                </div>

                <div>
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input type="date" {...form.register("due_date")} />
                </div>

                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    value={form.watch("currency")}
                    onValueChange={value => form.setValue("currency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dimensions Tab */}
          <TabsContent value="dimensions" className="space-y-4">
            {/* Cost Center Selection */}
            <CostCenterSelector
              companyId={companyId}
              selectedCostCenter={form.watch("cost_center_id")}
              onCostCenterChange={costCenterId => form.setValue("cost_center_id", costCenterId)}
            />

            {/* Accounting Dimensions */}
            <AccountingDimensionsForm
              companyId={companyId}
              documentType="Sales Invoice"
              values={{
                department: form.watch("department") || "",
                branch: form.watch("branch") || "",
                territory: form.watch("territory") || "",
              }}
              onChange={values => {
                Object.entries(values).forEach(([key, value]) => {
                  form.setValue(key as any, value);
                });
              }}
            />

            {/* Budget Validation */}
            {form.watch("cost_center_id") && totals.total > 0 && (
              <BudgetValidationAlert
                companyId={companyId}
                accountId="sales-revenue-account" // This would be dynamic
                costCenterId={form.watch("cost_center_id")}
                projectId={form.watch("project_id")}
                amount={totals.total}
                postingDate={form.watch("posting_date")}
                onValidationResult={result => {
                  setBudgetValidationResults(prev => ({
                    ...prev,
                    [form.watch("cost_center_id") || "default"]: result,
                  }));
                }}
              />
            )}
          </TabsContent>

          {/* Items Tab */}
          <TabsContent value="items" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Invoice Items</CardTitle>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Tax %</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Cost Center</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <Input
                            {...form.register(`items.${index}.item_name`)}
                            placeholder="Item name"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.001"
                            {...form.register(`items.${index}.qty`, { valueAsNumber: true })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.rate`, { valueAsNumber: true })}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            {...form.register(`items.${index}.tax_rate`, { valueAsNumber: true })}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            $
                            {(
                              (watchedItems[index]?.qty || 0) * (watchedItems[index]?.rate || 0)
                            ).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CostCenterSelector
                            companyId={companyId}
                            selectedCostCenter={form.watch(`items.${index}.cost_center_id`)}
                            onCostCenterChange={costCenterId =>
                              form.setValue(`items.${index}.cost_center_id`, costCenterId)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Totals & Submit Tab */}
          <TabsContent value="totals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Invoice Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax Total:</span>
                      <span>${totals.taxTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discount:</span>
                      <span>-${totals.discountAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={form.handleSubmit(handleSave)}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Draft
                      </>
                    )}
                  </Button>
                  <Button type="submit" disabled={submitting || validationErrors.length > 0}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Submit Invoice
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

export default ERPNextEnhancedSalesInvoiceForm;
