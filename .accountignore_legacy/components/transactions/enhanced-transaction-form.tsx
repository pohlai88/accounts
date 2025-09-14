"use client";

/**
 * Enhanced Transaction Form with ERPNext Business Logic
 * Demonstrates sophisticated accounting patterns
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  DollarSign,
  Receipt,
  CreditCard,
  FileText,
  Undo2,
  Calculator,
} from "lucide-react";

interface Account {
  id: string;
  name: string;
  account_code: string;
  account_type: string;
}

interface TransactionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: string[];
}

export function EnhancedTransactionForm({ companyId }: { companyId: string }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [activeTab, setActiveTab] = useState("sales_invoice");

  // Form states
  const [salesInvoiceForm, setSalesInvoiceForm] = useState({
    customer_name: "",
    invoice_amount: "",
    receivable_account_id: "",
    revenue_account_id: "",
    posting_date: new Date().toISOString().split("T")[0],
    due_date: "",
    remarks: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    customer_name: "",
    payment_amount: "",
    bank_account_id: "",
    receivable_account_id: "",
    posting_date: new Date().toISOString().split("T")[0],
    against_invoice: "",
    remarks: "",
  });

  const [journalForm, setJournalForm] = useState({
    posting_date: new Date().toISOString().split("T")[0],
    entries: [
      { account_id: "", debit: "", credit: "", party: "", remarks: "" },
      { account_id: "", debit: "", credit: "", party: "", remarks: "" },
    ],
  });

  const [reversalForm, setReversalForm] = useState({
    voucher_type: "",
    voucher_no: "",
    reversal_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  // Load accounts on component mount
  useEffect(() => {
    loadAccounts();
  }, [companyId]);

  const loadAccounts = async () => {
    try {
      const response = await fetch(`/api/v1/accounts?company_id=${companyId}&limit=100`);
      const data = await response.json();
      if (data.data) {
        setAccounts(data.data);
      }
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const handleSalesInvoice = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/v1/transactions?type=sales_invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...salesInvoiceForm,
          invoice_amount: parseFloat(salesInvoiceForm.invoice_amount),
          company_id: companyId,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form
        setSalesInvoiceForm({
          customer_name: "",
          invoice_amount: "",
          receivable_account_id: "",
          revenue_account_id: "",
          posting_date: new Date().toISOString().split("T")[0],
          due_date: "",
          remarks: "",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to create sales invoice",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentEntry = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/v1/transactions?type=payment_entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          payment_amount: parseFloat(paymentForm.payment_amount),
          company_id: companyId,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form
        setPaymentForm({
          customer_name: "",
          payment_amount: "",
          bank_account_id: "",
          receivable_account_id: "",
          posting_date: new Date().toISOString().split("T")[0],
          against_invoice: "",
          remarks: "",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to create payment entry",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJournalEntry = async () => {
    setLoading(true);
    setResult(null);

    try {
      const entries = journalForm.entries.map(entry => ({
        ...entry,
        debit: parseFloat(entry.debit) || 0,
        credit: parseFloat(entry.credit) || 0,
      }));

      const response = await fetch("/api/v1/transactions?type=journal_entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posting_date: journalForm.posting_date,
          entries,
          company_id: companyId,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form
        setJournalForm({
          posting_date: new Date().toISOString().split("T")[0],
          entries: [
            { account_id: "", debit: "", credit: "", party: "", remarks: "" },
            { account_id: "", debit: "", credit: "", party: "", remarks: "" },
          ],
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to create journal entry",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReversal = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/v1/transactions?type=reversal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reversalForm,
          company_id: companyId,
        }),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        // Reset form
        setReversalForm({
          voucher_type: "",
          voucher_no: "",
          reversal_date: new Date().toISOString().split("T")[0],
          remarks: "",
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: "Failed to reverse transaction",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      });
    } finally {
      setLoading(false);
    }
  };

  const addJournalEntry = () => {
    setJournalForm({
      ...journalForm,
      entries: [
        ...journalForm.entries,
        { account_id: "", debit: "", credit: "", party: "", remarks: "" },
      ],
    });
  };

  const updateJournalEntry = (index: number, field: string, value: string) => {
    const newEntries = [...journalForm.entries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setJournalForm({ ...journalForm, entries: newEntries });
  };

  const calculateJournalTotals = () => {
    const totalDebit = journalForm.entries.reduce(
      (sum, entry) => sum + (parseFloat(entry.debit) || 0),
      0,
    );
    const totalCredit = journalForm.entries.reduce(
      (sum, entry) => sum + (parseFloat(entry.credit) || 0),
      0,
    );
    return { totalDebit, totalCredit, difference: Math.abs(totalDebit - totalCredit) };
  };

  const getAccountsByType = (type: string) => {
    return accounts.filter(account => account.account_type === type);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign className="h-6 w-6" />
          <span>Enhanced Transaction Processing</span>
          <Badge variant="secondary">ERPNext-Inspired</Badge>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sales_invoice" className="flex items-center space-x-2">
              <Receipt className="h-4 w-4" />
              <span>Sales Invoice</span>
            </TabsTrigger>
            <TabsTrigger value="payment_entry" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger value="journal_entry" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Journal</span>
            </TabsTrigger>
            <TabsTrigger value="reversal" className="flex items-center space-x-2">
              <Undo2 className="h-4 w-4" />
              <span>Reversal</span>
            </TabsTrigger>
          </TabsList>

          {/* Sales Invoice Tab */}
          <TabsContent value="sales_invoice" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={salesInvoiceForm.customer_name}
                  onChange={e =>
                    setSalesInvoiceForm({ ...salesInvoiceForm, customer_name: e.target.value })
                  }
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="invoice_amount">Invoice Amount</Label>
                <Input
                  id="invoice_amount"
                  type="number"
                  step="0.01"
                  value={salesInvoiceForm.invoice_amount}
                  onChange={e =>
                    setSalesInvoiceForm({ ...salesInvoiceForm, invoice_amount: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivable_account">Receivable Account</Label>
                <Select
                  value={salesInvoiceForm.receivable_account_id}
                  onValueChange={value =>
                    setSalesInvoiceForm({ ...salesInvoiceForm, receivable_account_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select receivable account" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAccountsByType("Asset").map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="revenue_account">Revenue Account</Label>
                <Select
                  value={salesInvoiceForm.revenue_account_id}
                  onValueChange={value =>
                    setSalesInvoiceForm({ ...salesInvoiceForm, revenue_account_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select revenue account" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAccountsByType("Income").map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="posting_date">Posting Date</Label>
                <Input
                  id="posting_date"
                  type="date"
                  value={salesInvoiceForm.posting_date}
                  onChange={e =>
                    setSalesInvoiceForm({ ...salesInvoiceForm, posting_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Due Date</Label>
                <Input
                  id="due_date"
                  type="date"
                  value={salesInvoiceForm.due_date}
                  onChange={e =>
                    setSalesInvoiceForm({ ...salesInvoiceForm, due_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={salesInvoiceForm.remarks}
                onChange={e =>
                  setSalesInvoiceForm({ ...salesInvoiceForm, remarks: e.target.value })
                }
                placeholder="Optional remarks"
              />
            </div>

            <Button onClick={handleSalesInvoice} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Sales Invoice"}
            </Button>
          </TabsContent>

          {/* Payment Entry Tab */}
          <TabsContent value="payment_entry" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_customer">Customer Name</Label>
                <Input
                  id="payment_customer"
                  value={paymentForm.customer_name}
                  onChange={e => setPaymentForm({ ...paymentForm, customer_name: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_amount">Payment Amount</Label>
                <Input
                  id="payment_amount"
                  type="number"
                  step="0.01"
                  value={paymentForm.payment_amount}
                  onChange={e => setPaymentForm({ ...paymentForm, payment_amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">Bank Account</Label>
                <Select
                  value={paymentForm.bank_account_id}
                  onValueChange={value =>
                    setPaymentForm({ ...paymentForm, bank_account_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select bank account" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAccountsByType("Asset").map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_receivable">Receivable Account</Label>
                <Select
                  value={paymentForm.receivable_account_id}
                  onValueChange={value =>
                    setPaymentForm({ ...paymentForm, receivable_account_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select receivable account" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAccountsByType("Asset").map(account => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.account_code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={paymentForm.posting_date}
                  onChange={e => setPaymentForm({ ...paymentForm, posting_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="against_invoice">Against Invoice (Optional)</Label>
                <Input
                  id="against_invoice"
                  value={paymentForm.against_invoice}
                  onChange={e =>
                    setPaymentForm({ ...paymentForm, against_invoice: e.target.value })
                  }
                  placeholder="SI-DEMO-2401-001"
                />
              </div>
            </div>

            <Button onClick={handlePaymentEntry} disabled={loading} className="w-full">
              {loading ? "Processing..." : "Create Payment Entry"}
            </Button>
          </TabsContent>

          {/* Journal Entry Tab */}
          <TabsContent value="journal_entry" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="journal_date">Posting Date</Label>
              <Input
                id="journal_date"
                type="date"
                value={journalForm.posting_date}
                onChange={e => setJournalForm({ ...journalForm, posting_date: e.target.value })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Journal Entries</Label>
                <Button onClick={addJournalEntry} variant="outline" size="sm">
                  Add Entry
                </Button>
              </div>

              {journalForm.entries.map((entry, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 p-4 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Select
                      value={entry.account_id}
                      onValueChange={value => updateJournalEntry(index, "account_id", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map(account => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.account_code} - {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Debit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={entry.debit}
                      onChange={e => updateJournalEntry(index, "debit", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Credit</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={entry.credit}
                      onChange={e => updateJournalEntry(index, "credit", e.target.value)}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Party</Label>
                    <Input
                      value={entry.party}
                      onChange={e => updateJournalEntry(index, "party", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Remarks</Label>
                    <Input
                      value={entry.remarks}
                      onChange={e => updateJournalEntry(index, "remarks", e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              ))}

              {/* Balance Check */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-4">
                  <Calculator className="h-5 w-5" />
                  <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Total Debit: </span>
                      <span>${calculateJournalTotals().totalDebit.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Credit: </span>
                      <span>${calculateJournalTotals().totalCredit.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Difference: </span>
                      <span>${calculateJournalTotals().difference.toFixed(2)}</span>
                      {calculateJournalTotals().difference === 0 ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleJournalEntry}
              disabled={loading || calculateJournalTotals().difference !== 0}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Journal Entry"}
            </Button>
          </TabsContent>

          {/* Reversal Tab */}
          <TabsContent value="reversal" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voucher_type">Voucher Type</Label>
                <Select
                  value={reversalForm.voucher_type}
                  onValueChange={value => setReversalForm({ ...reversalForm, voucher_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voucher type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales Invoice">Sales Invoice</SelectItem>
                    <SelectItem value="Payment Entry">Payment Entry</SelectItem>
                    <SelectItem value="Journal Entry">Journal Entry</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="voucher_no">Voucher Number</Label>
                <Input
                  id="voucher_no"
                  value={reversalForm.voucher_no}
                  onChange={e => setReversalForm({ ...reversalForm, voucher_no: e.target.value })}
                  placeholder="e.g., SI-DEMO-2401-001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reversal_date">Reversal Date</Label>
                <Input
                  id="reversal_date"
                  type="date"
                  value={reversalForm.reversal_date}
                  onChange={e =>
                    setReversalForm({ ...reversalForm, reversal_date: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reversal_remarks">Reversal Remarks</Label>
              <Textarea
                id="reversal_remarks"
                value={reversalForm.remarks}
                onChange={e => setReversalForm({ ...reversalForm, remarks: e.target.value })}
                placeholder="Reason for reversal"
              />
            </div>

            <Button
              onClick={handleReversal}
              disabled={loading}
              className="w-full"
              variant="destructive"
            >
              {loading ? "Reversing..." : "Reverse Transaction"}
            </Button>
          </TabsContent>
        </Tabs>

        {/* Result Display */}
        {result && (
          <div
            className={`mt-6 p-4 rounded-lg border ${result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <div className="flex items-center space-x-2 mb-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <span className={`font-medium ${result.success ? "text-green-800" : "text-red-800"}`}>
                {result.message}
              </span>
            </div>

            {result.success && result.data && (
              <div className="text-sm text-green-700 space-y-1">
                <div>
                  Voucher: {result.data.voucher_type} {result.data.voucher_no}
                </div>
                {result.data.amount && <div>Amount: ${result.data.amount}</div>}
                {result.data.customer && <div>Customer: {result.data.customer}</div>}
                {result.data.gl_entries && (
                  <div>GL Entries Created: {result.data.gl_entries.length}</div>
                )}
              </div>
            )}

            {result.errors && result.errors.length > 0 && (
              <div className="text-sm text-red-700 space-y-1">
                {result.errors.map((error, index) => (
                  <div key={index}>• {error}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
