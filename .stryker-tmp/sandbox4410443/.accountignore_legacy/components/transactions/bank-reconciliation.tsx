// @ts-nocheck
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  RefreshCw,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Settings,
  FileText,
  DollarSign,
  Calendar,
  Building2,
} from "lucide-react";
import {
  BankReconciliationService,
  BankAccount,
  BankStatement,
  BankStatementItem,
  PotentialMatch,
} from "@/lib/bank-reconciliation";
import { AccountingService } from "@/lib/accounting-service";
import { format } from "date-fns";

interface BankReconciliationProps {
  companyId: string;
}

export function BankReconciliation({ companyId }: BankReconciliationProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [selectedStatement, setSelectedStatement] = useState<BankStatement | null>(null);
  const [statementItems, setStatementItems] = useState<BankStatementItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<BankStatementItem | null>(null);
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([]);
  const [reconciliationSummary, setReconciliationSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [showCreateStatementDialog, setShowCreateStatementDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showMatchesDialog, setShowMatchesDialog] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);

  // Form states
  const [accountForm, setAccountForm] = useState({
    accountId: "",
    bankName: "",
    accountNumber: "",
    accountType: "Checking" as const,
    currency: "USD",
  });

  const [statementForm, setStatementForm] = useState({
    statementDate: format(new Date(), "yyyy-MM-dd"),
    openingBalance: 0,
    closingBalance: 0,
  });

  useEffect(() => {
    loadBankAccounts();
    loadAccounts();
  }, [companyId]);

  useEffect(() => {
    if (selectedAccount) {
      loadStatements(selectedAccount.id);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedStatement) {
      loadStatementItems(selectedStatement.id);
      loadReconciliationSummary(selectedStatement.id);
    }
  }, [selectedStatement]);

  const loadBankAccounts = async () => {
    try {
      const result = await BankReconciliationService.getBankAccounts(companyId);
      if (result.success && result.accounts) {
        setBankAccounts(result.accounts);
        if (result.accounts.length > 0) {
          setSelectedAccount(result.accounts[0]);
        }
      }
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };

  const loadAccounts = async () => {
    try {
      const result = await AccountingService.getAccounts(companyId);
      if (result.success && result.data) {
        setAccounts(result.data);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const loadStatements = async (bankAccountId: string) => {
    try {
      // This would be implemented in the service
      setStatements([]);
    } catch (error) {
      console.error("Error loading statements:", error);
    }
  };

  const loadStatementItems = async (statementId: string) => {
    try {
      const result = await BankReconciliationService.getStatementItems(statementId);
      if (result.success && result.items) {
        setStatementItems(result.items);
      }
    } catch (error) {
      console.error("Error loading statement items:", error);
    }
  };

  const loadReconciliationSummary = async (statementId: string) => {
    try {
      const result = await BankReconciliationService.getReconciliationSummary(statementId);
      if (result.success && result.summary) {
        setReconciliationSummary(result.summary);
      }
    } catch (error) {
      console.error("Error loading reconciliation summary:", error);
    }
  };

  const handleCreateAccount = async () => {
    try {
      const result = await BankReconciliationService.createBankAccount({
        companyId,
        accountId: accountForm.accountId,
        bankName: accountForm.bankName,
        accountNumber: accountForm.accountNumber,
        accountType: accountForm.accountType,
        currency: accountForm.currency,
      });

      if (result.success) {
        setShowCreateAccountDialog(false);
        setAccountForm({
          accountId: "",
          bankName: "",
          accountNumber: "",
          accountType: "Checking",
          currency: "USD",
        });
        loadBankAccounts();
      }
    } catch (error) {
      console.error("Error creating bank account:", error);
    }
  };

  const handleCreateStatement = async () => {
    if (!selectedAccount) return;

    try {
      const result = await BankReconciliationService.createBankStatement({
        bankAccountId: selectedAccount.id,
        statementDate: statementForm.statementDate,
        openingBalance: statementForm.openingBalance,
        closingBalance: statementForm.closingBalance,
      });

      if (result.success) {
        setShowCreateStatementDialog(false);
        setStatementForm({
          statementDate: format(new Date(), "yyyy-MM-dd"),
          openingBalance: 0,
          closingBalance: 0,
        });
        loadStatements(selectedAccount.id);
      }
    } catch (error) {
      console.error("Error creating bank statement:", error);
    }
  };

  const handleFindMatches = async (item: BankStatementItem) => {
    setSelectedItem(item);
    try {
      const result = await BankReconciliationService.findPotentialMatches(item.id);
      if (result.success && result.matches) {
        setPotentialMatches(result.matches);
        setShowMatchesDialog(true);
      }
    } catch (error) {
      console.error("Error finding matches:", error);
    }
  };

  const handleCreateMatch = async (glEntryId: string) => {
    if (!selectedItem) return;

    try {
      const result = await BankReconciliationService.createMatch(
        selectedItem.id,
        glEntryId,
        "Manual",
        selectedItem.amount,
      );

      if (result.success) {
        setShowMatchesDialog(false);
        loadStatementItems(selectedStatement!.id);
        loadReconciliationSummary(selectedStatement!.id);
      }
    } catch (error) {
      console.error("Error creating match:", error);
    }
  };

  const handleAutoReconcile = async () => {
    if (!selectedStatement) return;

    try {
      const result = await BankReconciliationService.autoReconcile(selectedStatement.id);
      if (result.success) {
        loadStatementItems(selectedStatement.id);
        loadReconciliationSummary(selectedStatement.id);
      }
    } catch (error) {
      console.error("Error auto-reconciling:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusIcon = (isReconciled: boolean) => {
    return isReconciled ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusColor = (isReconciled: boolean) => {
    return isReconciled ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bank Reconciliation</h2>
          <p className="text-muted-foreground">
            Reconcile bank statements with your accounting records
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={loadBankAccounts} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
                <DialogDescription>Add a new bank account for reconciliation</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="accountId">Chart of Accounts Account</Label>
                  <Select
                    value={accountForm.accountId}
                    onValueChange={value => setAccountForm(prev => ({ ...prev, accountId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountCode} - {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={accountForm.bankName}
                      onChange={e =>
                        setAccountForm(prev => ({ ...prev, bankName: e.target.value }))
                      }
                      placeholder="e.g., Chase Bank"
                    />
                  </div>
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input
                      id="accountNumber"
                      value={accountForm.accountNumber}
                      onChange={e =>
                        setAccountForm(prev => ({ ...prev, accountNumber: e.target.value }))
                      }
                      placeholder="Last 4 digits"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountType">Account Type</Label>
                    <Select
                      value={accountForm.accountType}
                      onValueChange={value =>
                        setAccountForm(prev => ({ ...prev, accountType: value as any }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Checking">Checking</SelectItem>
                        <SelectItem value="Savings">Savings</SelectItem>
                        <SelectItem value="Money Market">Money Market</SelectItem>
                        <SelectItem value="Credit Card">Credit Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={accountForm.currency}
                      onValueChange={value =>
                        setAccountForm(prev => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="MYR">MYR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateAccountDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateAccount}>Add Account</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bank Account Selection */}
      {bankAccounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Bank Account</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map(account => (
                <Card
                  key={account.id}
                  className={`cursor-pointer transition-colors ${
                    selectedAccount?.id === account.id
                      ? "ring-2 ring-blue-500"
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-8 w-8 text-blue-500" />
                      <div>
                        <div className="font-medium">{account.bankName}</div>
                        <div className="text-sm text-muted-foreground">
                          {account.accountType} • ****{account.accountNumber.slice(-4)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation Interface */}
      {selectedAccount && (
        <Tabs defaultValue="statements" className="space-y-4">
          <TabsList>
            <TabsTrigger value="statements">Bank Statements</TabsTrigger>
            <TabsTrigger value="reconcile">Reconcile</TabsTrigger>
            <TabsTrigger value="rules">Rules</TabsTrigger>
          </TabsList>

          {/* Bank Statements Tab */}
          <TabsContent value="statements" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Bank Statements</CardTitle>
                    <CardDescription>
                      {selectedAccount.bankName} - {selectedAccount.accountType}
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateStatementDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Statement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {statements.length > 0 ? (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Statement Date</TableHead>
                          <TableHead>Opening Balance</TableHead>
                          <TableHead>Closing Balance</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statements.map(statement => (
                          <TableRow key={statement.id}>
                            <TableCell>
                              {format(new Date(statement.statementDate), "MMM dd, yyyy")}
                            </TableCell>
                            <TableCell>{formatCurrency(statement.openingBalance)}</TableCell>
                            <TableCell>{formatCurrency(statement.closingBalance)}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  statement.isReconciled
                                    ? "text-green-600 bg-green-50"
                                    : "text-yellow-600 bg-yellow-50"
                                }
                              >
                                {statement.isReconciled ? "Reconciled" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedStatement(statement)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Statements Found</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first bank statement to start reconciliation
                    </p>
                    <Button onClick={() => setShowCreateStatementDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Statement
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reconcile Tab */}
          <TabsContent value="reconcile" className="space-y-4">
            {selectedStatement ? (
              <div className="space-y-4">
                {/* Reconciliation Summary */}
                {reconciliationSummary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Reconciliation Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {reconciliationSummary.totalItems}
                          </div>
                          <div className="text-sm text-muted-foreground">Total Items</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {reconciliationSummary.reconciledItems}
                          </div>
                          <div className="text-sm text-muted-foreground">Reconciled</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {reconciliationSummary.unreconciledItems}
                          </div>
                          <div className="text-sm text-muted-foreground">Unreconciled</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {reconciliationSummary.reconciliationPercentage.toFixed(1)}%
                          </div>
                          <div className="text-sm text-muted-foreground">Complete</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Progress
                          value={reconciliationSummary.reconciliationPercentage}
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Statement Items */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Statement Items</CardTitle>
                        <CardDescription>
                          {format(new Date(selectedStatement.statementDate), "MMM dd, yyyy")}
                        </CardDescription>
                      </div>
                      <Button onClick={handleAutoReconcile}>
                        <Settings className="h-4 w-4 mr-2" />
                        Auto Reconcile
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {statementItems.length > 0 ? (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Reference</TableHead>
                              <TableHead className="text-right">Amount</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {statementItems.map(item => (
                              <TableRow key={item.id}>
                                <TableCell>
                                  {format(new Date(item.transactionDate), "MMM dd, yyyy")}
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {item.description}
                                </TableCell>
                                <TableCell>{item.referenceNumber || "-"}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(item.amount)}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    {getStatusIcon(item.isReconciled)}
                                    <Badge className={getStatusColor(item.isReconciled)}>
                                      {item.isReconciled ? "Reconciled" : "Pending"}
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  {!item.isReconciled && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFindMatches(item)}
                                    >
                                      <Search className="h-4 w-4" />
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Statement Items</h3>
                        <p className="text-muted-foreground">
                          Upload or add statement items to begin reconciliation
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Select a Statement</h3>
                    <p className="text-muted-foreground">
                      Choose a bank statement to begin reconciliation
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reconciliation Rules</CardTitle>
                <CardDescription>
                  Set up automatic matching rules for bank reconciliation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Reconciliation Rules</h3>
                  <p className="text-muted-foreground mb-4">
                    Set up automatic matching rules to speed up reconciliation
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Rule
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Create Statement Dialog */}
      <Dialog open={showCreateStatementDialog} onOpenChange={setShowCreateStatementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Bank Statement</DialogTitle>
            <DialogDescription>Create a new bank statement for reconciliation</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="statementDate">Statement Date</Label>
              <Input
                id="statementDate"
                type="date"
                value={statementForm.statementDate}
                onChange={e =>
                  setStatementForm(prev => ({ ...prev, statementDate: e.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openingBalance">Opening Balance</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  value={statementForm.openingBalance}
                  onChange={e =>
                    setStatementForm(prev => ({
                      ...prev,
                      openingBalance: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="closingBalance">Closing Balance</Label>
                <Input
                  id="closingBalance"
                  type="number"
                  step="0.01"
                  value={statementForm.closingBalance}
                  onChange={e =>
                    setStatementForm(prev => ({
                      ...prev,
                      closingBalance: parseFloat(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowCreateStatementDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStatement}>Create Statement</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Potential Matches Dialog */}
      <Dialog open={showMatchesDialog} onOpenChange={setShowMatchesDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Potential Matches</DialogTitle>
            <DialogDescription>
              Found {potentialMatches.length} potential matches for this transaction
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {potentialMatches.map((match, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${match.matchConfidence}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">
                          {match.matchConfidence.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {match.matchReason}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => handleCreateMatch(match.glEntryId)}>
                        Match
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
