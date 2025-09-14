/**
 * Enhanced Payment Entry Form with Outstanding Management
 * Connects payment processing to outstanding management with real-time allocation
 */

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Save,
  Send,
  X,
  DollarSign,
  Calendar,
  User,
  Building2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  CreditCard,
  Receipt,
  Calculator,
} from "lucide-react";
import { TransactionService, CreatePaymentInput } from "@/lib/transaction-service";
import {
  OutstandingManagementService,
  OutstandingInvoice,
  PaymentAllocationResult,
} from "@/lib/outstanding-management";
import { DocumentWorkflowEngine } from "@/lib/document-workflow";
import { MasterDataService } from "@/lib/master-data-service";
import { useAuth, useCompany } from "@/hooks/useAuth";
import { format } from "date-fns";

// Form validation schema
const paymentEntrySchema = z.object({
  payment_type: z.enum(["Received", "Paid"]),
  party_type: z.enum(["Customer", "Supplier"]),
  party_id: z.string().optional(),
  party_name: z.string().min(1, "Party name is required"),
  payment_date: z.string().min(1, "Payment date is required"),
  posting_date: z.string().min(1, "Posting date is required"),
  payment_method: z.string().min(1, "Payment method is required"),
  bank_account_id: z.string().optional(),
  bank_account_name: z.string().min(1, "Bank account is required"),
  paid_amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().min(1, "Currency is required"),
  exchange_rate: z.number().min(0.000001, "Exchange rate must be greater than 0").default(1),
  reference_no: z.string().optional(),
  reference_date: z.string().optional(),
  remarks: z.string().optional(),
  cost_center_id: z.string().optional(),
  project_id: z.string().optional(),
});

type PaymentEntryFormData = z.infer<typeof paymentEntrySchema>;

interface PaymentAllocation {
  invoice_id: string;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  outstanding_amount: number;
  allocated_amount: number;
  selected: boolean;
}

interface EnhancedPaymentEntryFormProps {
  paymentId?: string;
  onSave: (payment: any) => void;
  onCancel: () => void;
  onSubmit?: (payment: any) => void;
  initialData?: Partial<PaymentEntryFormData>;
  mode?: "create" | "edit" | "view";
}

export function EnhancedPaymentEntryForm({
  paymentId,
  onSave,
  onCancel,
  onSubmit,
  initialData,
  mode = "create",
}: EnhancedPaymentEntryFormProps) {
  const { user } = useAuth();
  const { currentCompany } = useCompany();

  // State management
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [outstandingInvoices, setOutstandingInvoices] = useState<OutstandingInvoice[]>([]);
  const [paymentAllocations, setPaymentAllocations] = useState<PaymentAllocation[]>([]);
  const [payment, setPayment] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<"Draft" | "Submitted" | "Cancelled">("Draft");
  const [loading, setLoading] = useState(false);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [allocationResult, setAllocationResult] = useState<PaymentAllocationResult | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PaymentEntryFormData>({
    resolver: zodResolver(paymentEntrySchema),
    defaultValues: {
      payment_type: "Received",
      party_type: "Customer",
      payment_date: format(new Date(), "yyyy-MM-dd"),
      posting_date: format(new Date(), "yyyy-MM-dd"),
      currency: "USD",
      exchange_rate: 1,
      payment_method: "Bank Transfer",
      paid_amount: 0,
      ...initialData,
    },
  });

  const watchedPartyType = watch("party_type");
  const watchedPartyName = watch("party_name");
  const watchedPaidAmount = watch("paid_amount");

  // Load initial data
  useEffect(() => {
    loadFormData();
    if (paymentId) {
      loadPaymentData();
    }
  }, [paymentId, currentCompany]);

  // Load outstanding invoices when party changes
  useEffect(() => {
    if (watchedPartyName && currentCompany) {
      loadOutstandingInvoices();
    }
  }, [watchedPartyName, watchedPartyType, currentCompany]);

  // Auto-allocate payments when amount changes
  useEffect(() => {
    if (watchedPaidAmount > 0 && paymentAllocations.length > 0) {
      autoAllocatePayment();
    }
  }, [watchedPaidAmount]);

  const loadFormData = async () => {
    if (!currentCompany) return;

    try {
      // Load customers and suppliers
      const [customersData, suppliersData] = await Promise.all([
        MasterDataService.searchCustomers(currentCompany.id),
        MasterDataService.searchSuppliers(currentCompany.id),
      ]);

      setCustomers(customersData.data || []);
      setSuppliers(suppliersData.data || []);

      // Load bank accounts (simplified for demo)
      setBankAccounts([
        { id: "1", name: "Main Bank Account", account_type: "Asset" },
        { id: "2", name: "Petty Cash", account_type: "Asset" },
        { id: "3", name: "Credit Card", account_type: "Liability" },
      ]);
    } catch (error) {
      console.error("Error loading form data:", error);
    }
  };

  const loadPaymentData = async () => {
    if (!paymentId || !currentCompany) return;

    try {
      // Load payment data from TransactionService
      // This is a placeholder - implement actual loading
      const paymentData = {
        id: paymentId,
        status: "Draft",
        // ... other payment fields
      };

      setPayment(paymentData);
      setPaymentStatus(paymentData.status);
    } catch (error) {
      console.error("Error loading payment:", error);
    }
  };

  const loadOutstandingInvoices = async () => {
    if (!watchedPartyName || !currentCompany) return;

    try {
      setLoadingOutstanding(true);

      // Find the party ID
      const parties = watchedPartyType === "Customer" ? customers : suppliers;
      const party = parties.find(p =>
        watchedPartyType === "Customer"
          ? p.customer_name === watchedPartyName
          : p.supplier_name === watchedPartyName,
      );

      if (!party) return;

      // Load outstanding invoices
      const outstanding =
        watchedPartyType === "Customer"
          ? await OutstandingManagementService.getCustomerOutstandingInvoices(
              party.id,
              currentCompany.id,
            )
          : await OutstandingManagementService.getSupplierOutstandingInvoices(
              party.id,
              currentCompany.id,
            );

      setOutstandingInvoices(outstanding);

      // Initialize payment allocations
      const allocations: PaymentAllocation[] = outstanding.map(invoice => ({
        invoice_id: invoice.id,
        invoice_no: invoice.invoice_no,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        outstanding_amount: invoice.outstanding_amount,
        allocated_amount: 0,
        selected: false,
      }));

      setPaymentAllocations(allocations);
    } catch (error) {
      console.error("Error loading outstanding invoices:", error);
    } finally {
      setLoadingOutstanding(false);
    }
  };

  const autoAllocatePayment = () => {
    const totalAmount = watchedPaidAmount || 0;
    let remainingAmount = totalAmount;

    const updatedAllocations = paymentAllocations.map(allocation => {
      if (remainingAmount <= 0) {
        return { ...allocation, allocated_amount: 0, selected: false };
      }

      const allocateAmount = Math.min(remainingAmount, allocation.outstanding_amount);
      remainingAmount -= allocateAmount;

      return {
        ...allocation,
        allocated_amount: allocateAmount,
        selected: allocateAmount > 0,
      };
    });

    setPaymentAllocations(updatedAllocations);
  };

  const handleAllocationChange = (invoiceId: string, allocatedAmount: number) => {
    setPaymentAllocations(prev =>
      prev.map(allocation =>
        allocation.invoice_id === invoiceId
          ? {
              ...allocation,
              allocated_amount: Math.min(allocatedAmount, allocation.outstanding_amount),
              selected: allocatedAmount > 0,
            }
          : allocation,
      ),
    );
  };

  const handleInvoiceSelection = (invoiceId: string, selected: boolean) => {
    setPaymentAllocations(prev =>
      prev.map(allocation =>
        allocation.invoice_id === invoiceId
          ? {
              ...allocation,
              selected,
              allocated_amount: selected ? allocation.outstanding_amount : 0,
            }
          : allocation,
      ),
    );
  };

  const getTotalAllocated = () => {
    return paymentAllocations.reduce((sum, allocation) => sum + allocation.allocated_amount, 0);
  };

  const getUnallocatedAmount = () => {
    return (watchedPaidAmount || 0) - getTotalAllocated();
  };

  // Form submission handlers
  const onSaveAsDraft = async (data: PaymentEntryFormData) => {
    if (!currentCompany || !user) return;

    try {
      setLoading(true);

      const paymentInput: CreatePaymentInput = {
        payment_type: data.payment_type,
        party_type: data.party_type,
        party_name: data.party_name,
        party_id: data.party_id,
        payment_date: data.payment_date,
        posting_date: data.posting_date,
        payment_method: data.payment_method,
        bank_account_name: data.bank_account_name,
        bank_account_id: data.bank_account_id,
        paid_amount: data.paid_amount,
        currency: data.currency,
        exchange_rate: data.exchange_rate,
        status: "Draft",
        company_id: currentCompany.id,
        cost_center_id: data.cost_center_id,
        project_id: data.project_id,
        reference_no: data.reference_no,
        reference_date: data.reference_date,
        remarks: data.remarks,
        allocations: paymentAllocations
          .filter(allocation => allocation.selected && allocation.allocated_amount > 0)
          .map(allocation => ({
            invoice_id: allocation.invoice_id,
            allocated_amount: allocation.allocated_amount,
          })),
      };

      const result = await TransactionService.createPayment(paymentInput);
      setPayment(result);
      onSave(result);
    } catch (error) {
      console.error("Error saving payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPayment = async () => {
    if (!payment || !user || !currentCompany) return;

    try {
      setLoading(true);

      // Process payment allocation
      const selectedAllocations = paymentAllocations.filter(
        allocation => allocation.selected && allocation.allocated_amount > 0,
      );

      if (selectedAllocations.length > 0) {
        const allocationResult = await OutstandingManagementService.allocatePaymentToInvoices(
          payment.id,
          selectedAllocations.map(allocation => ({
            invoice_id: allocation.invoice_id,
            allocated_amount: allocation.allocated_amount,
          })),
          currentCompany.id,
        );

        setAllocationResult(allocationResult);

        if (!allocationResult.success) {
          console.error("Payment allocation failed:", allocationResult.errors);
          return;
        }
      }

      // Submit the payment through workflow engine
      const result = await DocumentWorkflowEngine.submitPaymentEntry(payment.id, {
        userId: user.id,
        companyId: currentCompany.id,
        postingDate: format(new Date(), "yyyy-MM-dd"),
        remarks: "Payment submitted via web interface",
      });

      if (result.success) {
        setPaymentStatus("Submitted");
        setShowSubmitDialog(false);
        if (onSubmit) onSubmit(payment);
      } else {
        console.error("Submission failed:", result.errors);
      }
    } catch (error) {
      console.error("Error submitting payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (paymentStatus) {
      case "Draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "Submitted":
        return <Badge variant="default">Submitted</Badge>;
      case "Cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const canEdit = paymentStatus === "Draft" && mode !== "view";
  const canSubmit = paymentStatus === "Draft" && payment && mode !== "view";

  const parties = watchedPartyType === "Customer" ? customers : suppliers;
  const partyNameField = watchedPartyType === "Customer" ? "customer_name" : "supplier_name";

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Entry
                {payment && <span className="text-muted-foreground">#{payment.payment_no}</span>}
              </CardTitle>
              <CardDescription>
                Record payments with automatic outstanding allocation
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">{getStatusBadge()}</div>
          </div>
        </CardHeader>
      </Card>

      {/* Main Form */}
      <form onSubmit={handleSubmit(onSaveAsDraft)} className="space-y-6">
        {/* Payment Type and Party */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_type">Payment Type *</Label>
              <Select
                onValueChange={(value: "Received" | "Paid") => setValue("payment_type", value)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Received">Payment Received</SelectItem>
                  <SelectItem value="Paid">Payment Made</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="party_type">Party Type *</Label>
              <Select
                onValueChange={(value: "Customer" | "Supplier") => {
                  setValue("party_type", value);
                  setValue("party_name", "");
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select party type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Supplier">Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="party_name">
                {watchedPartyType === "Customer" ? "Customer" : "Supplier"} Name *
              </Label>
              <Select
                onValueChange={value => {
                  const party = parties.find(p => p[partyNameField] === value);
                  setValue("party_name", value);
                  if (party) {
                    setValue("party_id", party.id);
                  }
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select ${watchedPartyType.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {parties.map(party => (
                    <SelectItem key={party.id} value={party[partyNameField]}>
                      {party[partyNameField]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.party_name && (
                <p className="text-sm text-destructive">{errors.party_name.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Payment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                {...register("payment_date")}
                disabled={!canEdit}
              />
              {errors.payment_date && (
                <p className="text-sm text-destructive">{errors.payment_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="posting_date">Posting Date *</Label>
              <Input
                id="posting_date"
                type="date"
                {...register("posting_date")}
                disabled={!canEdit}
              />
              {errors.posting_date && (
                <p className="text-sm text-destructive">{errors.posting_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                onValueChange={value => setValue("payment_method", value)}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Online Payment">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_account_name">Bank Account *</Label>
              <Select
                onValueChange={value => {
                  const account = bankAccounts.find(a => a.name === value);
                  setValue("bank_account_name", value);
                  if (account) {
                    setValue("bank_account_id", account.id);
                  }
                }}
                disabled={!canEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(account => (
                    <SelectItem key={account.id} value={account.name}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paid_amount">Amount *</Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                {...register("paid_amount", { valueAsNumber: true })}
                disabled={!canEdit}
              />
              {errors.paid_amount && (
                <p className="text-sm text-destructive">{errors.paid_amount.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select onValueChange={value => setValue("currency", value)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="MYR">MYR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Outstanding Invoices Allocation */}
        {outstandingInvoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Outstanding Invoices
                {loadingOutstanding && <Loader2 className="h-4 w-4 animate-spin" />}
              </CardTitle>
              <CardDescription>Allocate payment against outstanding invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Select</TableHead>
                    <TableHead>Invoice No</TableHead>
                    <TableHead>Invoice Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Outstanding</TableHead>
                    <TableHead>Allocated</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentAllocations.map(allocation => (
                    <TableRow key={allocation.invoice_id}>
                      <TableCell>
                        <Checkbox
                          checked={allocation.selected}
                          onCheckedChange={checked =>
                            handleInvoiceSelection(allocation.invoice_id, checked as boolean)
                          }
                          disabled={!canEdit}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{allocation.invoice_no}</TableCell>
                      <TableCell>
                        {format(new Date(allocation.invoice_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{format(new Date(allocation.due_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{allocation.outstanding_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={allocation.allocated_amount}
                          onChange={e =>
                            handleAllocationChange(
                              allocation.invoice_id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          disabled={!canEdit || !allocation.selected}
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        {allocation.allocated_amount >= allocation.outstanding_amount ? (
                          <Badge variant="default">Fully Paid</Badge>
                        ) : allocation.allocated_amount > 0 ? (
                          <Badge variant="secondary">Partially Paid</Badge>
                        ) : (
                          <Badge variant="outline">Unpaid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Allocation Summary */}
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Payment:</span>
                    <div className="text-lg font-bold">{(watchedPaidAmount || 0).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Total Allocated:</span>
                    <div className="text-lg font-bold">{getTotalAllocated().toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="font-medium">Unallocated:</span>
                    <div
                      className={`text-lg font-bold ${getUnallocatedAmount() < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {getUnallocatedAmount().toFixed(2)}
                    </div>
                  </div>
                </div>

                {getUnallocatedAmount() < 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Allocated amount exceeds payment amount. Please adjust allocations.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reference_no">Reference No</Label>
                <Input
                  id="reference_no"
                  {...register("reference_no")}
                  placeholder="Enter reference number"
                  disabled={!canEdit}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference_date">Reference Date</Label>
                <Input
                  id="reference_date"
                  type="date"
                  {...register("reference_date")}
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                {...register("remarks")}
                placeholder="Enter remarks"
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <div className="flex gap-2">
                {canEdit && (
                  <Button type="submit" variant="outline" disabled={isSubmitting || loading}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <Save className="h-4 w-4 mr-2" />
                    Save as Draft
                  </Button>
                )}

                {canSubmit && (
                  <Button
                    type="button"
                    onClick={() => setShowSubmitDialog(true)}
                    disabled={loading || getUnallocatedAmount() < 0}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Submit Payment
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Submit Confirmation Dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Payment</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit this payment? This will create GL entries and update
              outstanding amounts.
            </DialogDescription>
          </DialogHeader>

          {/* Allocation Summary in Dialog */}
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Payment Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Payment Amount:</span>
                  <span className="font-medium">{(watchedPaidAmount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Allocated Amount:</span>
                  <span className="font-medium">{getTotalAllocated().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unallocated Amount:</span>
                  <span className="font-medium">{getUnallocatedAmount().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {paymentAllocations.filter(a => a.selected).length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Invoice Allocations</h4>
                <div className="space-y-1 text-sm">
                  {paymentAllocations
                    .filter(allocation => allocation.selected && allocation.allocated_amount > 0)
                    .map(allocation => (
                      <div key={allocation.invoice_id} className="flex justify-between">
                        <span>{allocation.invoice_no}:</span>
                        <span className="font-medium">
                          {allocation.allocated_amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitPayment} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 mr-2" />
              Submit Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
