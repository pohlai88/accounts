/**
 * Transaction Builder - Double-Entry Transaction Form Wizard
 * Professional transaction creation with real-time validation and ERPNext logic
 */
// @ts-nocheck


"use client";

import * as React from "react";
import {
  Plus,
  Minus,
  Calculator,
  AlertCircle,
  CheckCircle,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Building2,
  Zap,
  RotateCcw,
  Save,
  Send,
  Eye,
  Copy,
  Trash2,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DatePicker } from "@/components/ui/date-picker";
import { AmountInput } from "@/components/ui/amount-input";
import { AccountSelector, type Account } from "./account-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface TransactionEntry {
  id: string;
  account_id: string;
  account?: Account;
  debit: number;
  credit: number;
  description?: string;
  cost_center_id?: string;
  project_id?: string;
  reference?: string;
}

export interface Transaction {
  id?: string;
  voucher_type: string;
  voucher_number?: string;
  posting_date: Date;
  reference_number?: string;
  reference_date?: Date;
  user_remarks?: string;
  total_debit: number;
  total_credit: number;
  difference: number;
  entries: TransactionEntry[];

  // Business context
  party_type?: "Customer" | "Supplier" | "Employee";
  party_id?: string;
  party_name?: string;

  // Status
  status: "Draft" | "Submitted" | "Cancelled";
  is_opening?: boolean;

  // Metadata
  created_by?: string;
  created_at?: Date;
  modified_by?: string;
  modified_at?: Date;
}

export interface TransactionBuilderProps {
  transaction?: Partial<Transaction>;
  onSave?: (transaction: Transaction) => Promise<void>;
  onSubmit?: (transaction: Transaction) => Promise<void>;
  onCancel?: () => void;

  // Configuration
  voucherType?: string;
  companyId?: string;
  accounts: Account[];

  // Features
  allowDraft?: boolean;
  showPreview?: boolean;
  enableTemplates?: boolean;

  // Validation
  enforceBalance?: boolean;
  requireReferences?: boolean;

  className?: string;
}

export function TransactionBuilder({
  transaction: initialTransaction,
  onSave,
  onSubmit,
  onCancel,
  voucherType = "Journal Entry",
  companyId,
  accounts,
  allowDraft = true,
  showPreview = true,
  enableTemplates = true,
  enforceBalance = true,
  requireReferences = false,
  className,
}: TransactionBuilderProps) {
  const [transaction, setTransaction] = React.useState<Transaction>({
    voucher_type: voucherType,
    posting_date: new Date(),
    total_debit: 0,
    total_credit: 0,
    difference: 0,
    entries: [
      { id: "1", account_id: "", debit: 0, credit: 0 },
      { id: "2", account_id: "", debit: 0, credit: 0 },
    ],
    status: "Draft",
    ...initialTransaction,
  });

  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [showPreviewDialog, setShowPreviewDialog] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("entries");

  // Calculate totals and difference
  React.useEffect(() => {
    const totalDebit = transaction.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = transaction.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    setTransaction(prev => ({
      ...prev,
      total_debit: totalDebit,
      total_credit: totalCredit,
      difference,
    }));
  }, [transaction.entries]);

  // Validation
  const validateTransaction = (): Record<string, string> => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!transaction.posting_date) {
      newErrors.posting_date = "Posting date is required";
    }

    // Entry validation
    transaction.entries.forEach((entry, index) => {
      if (!entry.account_id) {
        newErrors[`entry_${index}_account`] = "Account is required";
      }

      if (entry.debit === 0 && entry.credit === 0) {
        newErrors[`entry_${index}_amount`] = "Either debit or credit amount is required";
      }

      if (entry.debit > 0 && entry.credit > 0) {
        newErrors[`entry_${index}_amount`] = "Cannot have both debit and credit amounts";
      }
    });

    // Balance validation
    if (enforceBalance && transaction.difference > 0.01) {
      newErrors.balance = "Transaction must balance (Total Debit = Total Credit)";
    }

    // Minimum entries
    const validEntries = transaction.entries.filter(
      e => e.account_id && (e.debit > 0 || e.credit > 0),
    );
    if (validEntries.length < 2) {
      newErrors.entries = "At least 2 entries are required";
    }

    return newErrors;
  };

  const addEntry = () => {
    const newEntry: TransactionEntry = {
      id: Date.now().toString(),
      account_id: "",
      debit: 0,
      credit: 0,
    };

    setTransaction(prev => ({
      ...prev,
      entries: [...prev.entries, newEntry],
    }));
  };

  const removeEntry = (entryId: string) => {
    if (transaction.entries.length <= 2) return; // Minimum 2 entries

    setTransaction(prev => ({
      ...prev,
      entries: prev.entries.filter(entry => entry.id !== entryId),
    }));
  };

  const updateEntry = (entryId: string, updates: Partial<TransactionEntry>) => {
    setTransaction(prev => ({
      ...prev,
      entries: prev.entries.map(entry => (entry.id === entryId ? { ...entry, ...updates } : entry)),
    }));
  };

  const balanceTransaction = () => {
    const totalDebit = transaction.total_debit;
    const totalCredit = transaction.total_credit;

    if (totalDebit === totalCredit) return;

    // Find the last entry with an amount
    const lastEntryIndex = transaction.entries.findLastIndex(e => e.debit > 0 || e.credit > 0);
    if (lastEntryIndex === -1) return;

    const lastEntry = transaction.entries[lastEntryIndex];
    const difference = totalDebit - totalCredit;

    if (difference > 0) {
      // Need more credit
      updateEntry(lastEntry.id, { credit: lastEntry.credit + difference, debit: 0 });
    } else {
      // Need more debit
      updateEntry(lastEntry.id, { debit: lastEntry.debit + Math.abs(difference), credit: 0 });
    }
  };

  const duplicateEntry = (entryId: string) => {
    const entryToDuplicate = transaction.entries.find(e => e.id === entryId);
    if (!entryToDuplicate) return;

    const newEntry: TransactionEntry = {
      ...entryToDuplicate,
      id: Date.now().toString(),
      debit: 0,
      credit: 0,
    };

    setTransaction(prev => ({
      ...prev,
      entries: [...prev.entries, newEntry],
    }));
  };

  const handleSave = async () => {
    const validationErrors = validateTransaction();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await onSave?.(transaction);
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validateTransaction();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setLoading(true);
    try {
      await onSubmit?.({ ...transaction, status: "Submitted" });
    } catch (error) {
      console.error("Submit failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAccountById = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId);
  };

  const isBalanced = transaction.difference < 0.01;
  const hasValidEntries =
    transaction.entries.filter(e => e.account_id && (e.debit > 0 || e.credit > 0)).length >= 2;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{voucherType}</h2>
          <p className="text-muted-foreground">
            {transaction.voucher_number ? `#${transaction.voucher_number}` : "New Transaction"}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant={isBalanced ? "default" : "destructive"}>
            {isBalanced ? "Balanced" : "Unbalanced"}
          </Badge>
          <Badge variant="outline">{transaction.status}</Badge>
        </div>
      </div>

      {/* Balance Alert */}
      {!isBalanced && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Transaction is unbalanced by {transaction.difference.toLocaleString()}
              (Debit: {transaction.total_debit.toLocaleString()}, Credit:{" "}
              {transaction.total_credit.toLocaleString()})
            </span>
            <Button variant="outline" size="sm" onClick={balanceTransaction}>
              <Zap className="h-4 w-4 mr-1" />
              Auto Balance
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="entries">Journal Entries</TabsTrigger>
          <TabsTrigger value="details">Transaction Details</TabsTrigger>
          {showPreview && <TabsTrigger value="preview">Preview</TabsTrigger>}
        </TabsList>

        {/* Journal Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Journal Entries</span>
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addEntry}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Entry
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Entry Headers */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-4">Account</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Credit</div>
                  <div className="col-span-3">Description</div>
                  <div className="col-span-1">Actions</div>
                </div>

                {/* Entries */}
                {transaction.entries.map((entry, index) => (
                  <div key={entry.id} className="grid grid-cols-12 gap-2 items-start">
                    {/* Account Selector */}
                    <div className="col-span-4">
                      <AccountSelector
                        value={entry.account_id}
                        onChange={accountId => {
                          const account = getAccountById(accountId as string);
                          updateEntry(entry.id, {
                            account_id: accountId as string,
                            account,
                          });
                        }}
                        accounts={accounts}
                        placeholder="Select account..."
                        showCodes={true}
                        onlyLeafAccounts={true}
                        error={errors[`entry_${index}_account`]}
                      />
                    </div>

                    {/* Debit Amount */}
                    <div className="col-span-2">
                      <AmountInput
                        value={entry.debit}
                        onChange={amount =>
                          updateEntry(entry.id, {
                            debit: amount || 0,
                            credit: 0,
                          })
                        }
                        placeholder="0.00"
                        currency="MYR"
                        showCurrency={false}
                        error={errors[`entry_${index}_amount`]}
                      />
                    </div>

                    {/* Credit Amount */}
                    <div className="col-span-2">
                      <AmountInput
                        value={entry.credit}
                        onChange={amount =>
                          updateEntry(entry.id, {
                            credit: amount || 0,
                            debit: 0,
                          })
                        }
                        placeholder="0.00"
                        currency="MYR"
                        showCurrency={false}
                        error={errors[`entry_${index}_amount`]}
                      />
                    </div>

                    {/* Description */}
                    <div className="col-span-3">
                      <Input
                        value={entry.description || ""}
                        onChange={e => updateEntry(entry.id, { description: e.target.value })}
                        placeholder="Entry description..."
                      />
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateEntry(entry.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {transaction.entries.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEntry(entry.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Totals */}
                <div className="border-t pt-4">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium">
                    <div className="col-span-4 text-right">Totals:</div>
                    <div className="col-span-2 text-right">
                      <Badge variant={isBalanced ? "default" : "destructive"}>
                        MYR {transaction.total_debit.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="col-span-2 text-right">
                      <Badge variant={isBalanced ? "default" : "destructive"}>
                        MYR {transaction.total_credit.toLocaleString()}
                      </Badge>
                    </div>
                    <div className="col-span-3">
                      {!isBalanced && (
                        <span className="text-red-500 text-sm">
                          Difference: MYR {transaction.difference.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="col-span-1"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Transaction Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Posting Date */}
                <div>
                  <DatePicker
                    value={transaction.posting_date}
                    onChange={date => setTransaction(prev => ({ ...prev, posting_date: date! }))}
                    label="Posting Date"
                    required
                    businessDaysOnly={false}
                    error={errors.posting_date}
                  />
                </div>

                {/* Reference Number */}
                <div>
                  <Label htmlFor="reference_number">Reference Number</Label>
                  <Input
                    id="reference_number"
                    value={transaction.reference_number || ""}
                    onChange={e =>
                      setTransaction(prev => ({
                        ...prev,
                        reference_number: e.target.value,
                      }))
                    }
                    placeholder="REF-001"
                  />
                </div>

                {/* Reference Date */}
                <div>
                  <DatePicker
                    value={transaction.reference_date}
                    onChange={date => setTransaction(prev => ({ ...prev, reference_date: date }))}
                    label="Reference Date"
                  />
                </div>

                {/* Voucher Type */}
                <div>
                  <Label htmlFor="voucher_type">Voucher Type</Label>
                  <Select
                    value={transaction.voucher_type}
                    onValueChange={value =>
                      setTransaction(prev => ({ ...prev, voucher_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                      <SelectItem value="Payment Entry">Payment Entry</SelectItem>
                      <SelectItem value="Receipt Entry">Receipt Entry</SelectItem>
                      <SelectItem value="Opening Entry">Opening Entry</SelectItem>
                      <SelectItem value="Closing Entry">Closing Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* User Remarks */}
              <div>
                <Label htmlFor="user_remarks">User Remarks</Label>
                <Textarea
                  id="user_remarks"
                  value={transaction.user_remarks || ""}
                  onChange={e =>
                    setTransaction(prev => ({
                      ...prev,
                      user_remarks: e.target.value,
                    }))
                  }
                  placeholder="Additional notes or remarks..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        {showPreview && (
          <TabsContent value="preview">
            <TransactionPreview transaction={transaction} accounts={accounts} />
          </TabsContent>
        )}
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center space-x-2">
          {Object.keys(errors).length > 0 && (
            <Alert variant="destructive" className="w-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix {Object.keys(errors).length} error(s) before saving
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}

          {allowDraft && (
            <Button variant="outline" onClick={handleSave} disabled={loading || !hasValidEntries}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
          )}

          <Button onClick={handleSubmit} disabled={loading || !isBalanced || !hasValidEntries}>
            <Send className="h-4 w-4 mr-2" />
            Submit Transaction
          </Button>
        </div>
      </div>
    </div>
  );
}

// Transaction Preview Component
interface TransactionPreviewProps {
  transaction: Transaction;
  accounts: Account[];
}

function TransactionPreview({ transaction, accounts }: TransactionPreviewProps) {
  const getAccountById = (accountId: string) => {
    return accounts.find(acc => acc.id === accountId);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Eye className="h-5 w-5" />
          <span>Transaction Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Transaction Header */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <h3 className="font-semibold">{transaction.voucher_type}</h3>
            <p className="text-sm text-muted-foreground">
              {transaction.voucher_number || "New Transaction"}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{format(transaction.posting_date, "dd MMM yyyy")}</p>
            <p className="text-sm text-muted-foreground">
              {transaction.reference_number || "No reference"}
            </p>
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-2">
          <h4 className="font-semibold">Journal Entries</h4>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3">Account</th>
                  <th className="text-right p-3">Debit</th>
                  <th className="text-right p-3">Credit</th>
                </tr>
              </thead>
              <tbody>
                {transaction.entries
                  .filter(entry => entry.account_id && (entry.debit > 0 || entry.credit > 0))
                  .map((entry, index) => {
                    const account = getAccountById(entry.account_id);
                    return (
                      <tr
                        key={entry.id}
                        className={index % 2 === 0 ? "bg-background" : "bg-muted/50"}
                      >
                        <td className="p-3">
                          <div>
                            <span className="font-medium">
                              {account?.name || "Unknown Account"}
                            </span>
                            <br />
                            <span className="text-sm text-muted-foreground font-mono">
                              {account?.code}
                            </span>
                            {entry.description && (
                              <>
                                <br />
                                <span className="text-sm text-muted-foreground italic">
                                  {entry.description}
                                </span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">
                          {entry.debit > 0 ? `MYR ${entry.debit.toLocaleString()}` : "-"}
                        </td>
                        <td className="p-3 text-right font-mono">
                          {entry.credit > 0 ? `MYR ${entry.credit.toLocaleString()}` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                <tr className="bg-muted font-semibold">
                  <td className="p-3">Total</td>
                  <td className="p-3 text-right font-mono">
                    MYR {transaction.total_debit.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono">
                    MYR {transaction.total_credit.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Remarks */}
        {transaction.user_remarks && (
          <div>
            <h4 className="font-semibold mb-2">Remarks</h4>
            <p className="text-sm p-3 bg-muted rounded-lg">{transaction.user_remarks}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
