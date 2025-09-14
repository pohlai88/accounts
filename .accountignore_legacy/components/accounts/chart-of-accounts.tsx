"use client";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  FolderOpen,
  Folder,
  FileText,
  Edit,
  Trash2,
  DollarSign,
  Building2,
} from "lucide-react";
import { AccountingService } from "@/lib/accounting-service";
import { AccountCodeGenerator } from "@/lib/numbering-system";
import { getAvailableIndustries, getCoATemplate } from "@/lib/coa-templates";
import { CoASetupWizard } from "./coa-setup-wizard";
import type { AccountHierarchy, AccountType, CreateAccountInput } from "@/lib/supabase";
import type { IndustryType } from "@/lib/coa-templates";

interface ChartOfAccountsProps {
  companyId: string;
}

export function ChartOfAccounts({ companyId }: ChartOfAccountsProps) {
  const [accounts, setAccounts] = useState<AccountHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSetupWizardOpen, setIsSetupWizardOpen] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAccounts();
  }, [companyId]);

  const loadAccounts = async () => {
    setLoading(true);
    const result = await AccountingService.getAccountHierarchy(companyId);
    if (result.data) {
      setAccounts(result.data);
      // Expand all group accounts by default
      const groupAccounts = new Set<string>();
      const collectGroupAccounts = (accs: AccountHierarchy[]) => {
        accs.forEach(acc => {
          if (acc.is_group) groupAccounts.add(acc.id);
          if (acc.children) collectGroupAccounts(acc.children);
        });
      };
      collectGroupAccounts(result.data);
      setExpandedAccounts(groupAccounts);
    }
    setLoading(false);
  };

  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const filterAccounts = (accounts: AccountHierarchy[]): AccountHierarchy[] => {
    if (!searchTerm) return accounts;

    return accounts
      .filter(account => {
        const matchesSearch =
          account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (account.account_code &&
            account.account_code.toLowerCase().includes(searchTerm.toLowerCase()));

        const hasMatchingChildren = account.children && filterAccounts(account.children).length > 0;

        return matchesSearch || hasMatchingChildren;
      })
      .map(account => ({
        ...account,
        children: account.children ? filterAccounts(account.children) : [],
      }));
  };

  const renderAccount = (account: AccountHierarchy) => {
    const isExpanded = expandedAccounts.has(account.id);
    const hasChildren = account.children && account.children.length > 0;
    const filteredChildren = account.children ? filterAccounts(account.children) : [];

    return (
      <div key={account.id} className="w-full">
        <div
          className={`flex items-center space-x-2 p-2 rounded-lg hover:bg-accent/50 transition-colors ${
            account.level > 0 ? `ml-${Math.min(account.level * 6, 24)}` : ""
          }`}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => toggleExpanded(account.id)}
            >
              {isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
            </Button>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center">
              <FileText className="h-3 w-3 text-muted-foreground" />
            </div>
          )}

          {/* Account Info */}
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{account.name}</span>
                  {account.account_code && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {account.account_code}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {account.account_type} • {account.currency}
                </div>
              </div>
            </div>

            {/* Balance & Actions */}
            <div className="flex items-center space-x-2">
              {!account.is_group && (
                <div className="text-right">
                  <div className="text-sm font-medium">$0.00</div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                </div>
              )}

              <div className="flex items-center space-x-1">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="mt-1">{filteredChildren.map(child => renderAccount(child))}</div>
        )}
      </div>
    );
  };

  const filteredAccounts = filterAccounts(accounts);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading chart of accounts...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Chart of Accounts</span>
          </CardTitle>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
              </DialogHeader>
              <CreateAccountForm
                companyId={companyId}
                accounts={accounts}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                  loadAccounts();
                }}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {filteredAccounts.length === 0 ? (
          <div className="text-center py-8">
            {searchTerm ? (
              <div className="text-muted-foreground">No accounts found matching your search.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-muted-foreground">No accounts found.</div>
                <Button onClick={() => setIsSetupWizardOpen(true)} className="mx-auto">
                  <Building2 className="h-4 w-4 mr-2" />
                  Set Up Chart of Accounts
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-1">{filteredAccounts.map(account => renderAccount(account))}</div>
        )}
      </CardContent>

      {/* Setup Wizard */}
      <CoASetupWizard
        companyId={companyId}
        isOpen={isSetupWizardOpen}
        onClose={() => setIsSetupWizardOpen(false)}
        onComplete={loadAccounts}
      />
    </Card>
  );
}

// Create Account Form Component
interface CreateAccountFormProps {
  companyId: string;
  accounts: AccountHierarchy[];
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateAccountForm({ companyId, accounts, onSuccess, onCancel }: CreateAccountFormProps) {
  const [formData, setFormData] = useState<CreateAccountInput>({
    name: "",
    account_type: "Asset",
    parent_id: "",
    account_code: "",
    currency: "USD",
    company_id: companyId,
    is_group: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestedCode, setSuggestedCode] = useState("");
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; message?: string }>({
    valid: true,
  });

  // Generate suggested account code when account type changes
  const handleAccountTypeChange = async (accountType: AccountType) => {
    setFormData({ ...formData, account_type: accountType });

    // Get smart suggestion
    const suggestion = await AccountCodeGenerator.suggestAccountCode(
      companyId,
      accountType,
      formData.parent_id,
    );
    setSuggestedCode(suggestion);

    // If no code entered yet, use suggestion
    if (!formData.account_code) {
      setFormData(prev => ({ ...prev, account_code: suggestion }));
    }
  };

  // Validate account code when it changes
  const handleAccountCodeChange = (code: string) => {
    setFormData({ ...formData, account_code: code });

    if (code) {
      const validation = AccountCodeGenerator.validateAccountCode(formData.account_type, code);
      setCodeValidation(validation);
    } else {
      setCodeValidation({ valid: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await AccountingService.createAccount({
      ...formData,
      parent_id: formData.parent_id || undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  // Flatten accounts for parent selection
  const flattenAccounts = (accs: AccountHierarchy[]): AccountHierarchy[] => {
    const result: AccountHierarchy[] = [];
    accs.forEach(acc => {
      if (acc.is_group) {
        result.push(acc);
        if (acc.children) {
          result.push(...flattenAccounts(acc.children));
        }
      }
    });
    return result;
  };

  const parentOptions = flattenAccounts(accounts);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Account Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Cash in Bank"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account_code">
            Account Code
            {suggestedCode && (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 ml-2 text-xs"
                onClick={() => handleAccountCodeChange(suggestedCode)}
              >
                Use suggested: {suggestedCode}
              </Button>
            )}
          </Label>
          <Input
            id="account_code"
            value={formData.account_code}
            onChange={e => handleAccountCodeChange(e.target.value)}
            placeholder="e.g., 1110"
            className={!codeValidation.valid ? "border-destructive" : ""}
          />
          {!codeValidation.valid && (
            <p className="text-xs text-destructive">{codeValidation.message}</p>
          )}
          {codeValidation.valid && formData.account_code && (
            <p className="text-xs text-muted-foreground">✓ Valid account code</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="account_type">Account Type *</Label>
          <Select
            value={formData.account_type}
            onValueChange={value => handleAccountTypeChange(value as AccountType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Asset">Asset</SelectItem>
              <SelectItem value="Liability">Liability</SelectItem>
              <SelectItem value="Equity">Equity</SelectItem>
              <SelectItem value="Income">Income</SelectItem>
              <SelectItem value="Expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={formData.currency}
            onValueChange={value => setFormData({ ...formData, currency: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="GBP">GBP</SelectItem>
              <SelectItem value="JPY">JPY</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="parent_id">Parent Account</Label>
        <Select
          value={formData.parent_id}
          onValueChange={value => setFormData({ ...formData, parent_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent account (optional)" />
          </SelectTrigger>
          <SelectContent>
            {parentOptions.map(account => (
              <SelectItem key={account.id} value={account.id}>
                {"  ".repeat(account.level)}
                {account.name} ({account.account_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="is_group"
          checked={formData.is_group}
          onChange={e => setFormData({ ...formData, is_group: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="is_group">This is a group account (can contain sub-accounts)</Label>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Account"}
        </Button>
      </div>
    </form>
  );
}
