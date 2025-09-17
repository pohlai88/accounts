/**
 * Account Selector - Hierarchical Chart of Accounts Picker
 * Professional account selection with MFRS compliance and smart search
 */
// @ts-nocheck


"use client";

import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Search,
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Calculator,
  Check,
  AlertCircle,
  Info,
  Star,
  Clock,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: "Asset" | "Liability" | "Equity" | "Income" | "Expense";
  parent_id?: string;
  is_group: boolean;
  is_active: boolean;
  balance?: number;
  currency?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;

  // Computed fields
  level?: number;
  children?: Account[];
  full_path?: string;
  recent_transactions?: number;
  is_favorite?: boolean;
}

export interface AccountSelectorProps {
  value?: string | string[];
  onChange?: (value: string | string[] | undefined) => void;
  accounts: Account[];
  loading?: boolean;
  error?: string;

  // Selection mode
  multiple?: boolean;
  allowGroups?: boolean;

  // Filtering
  accountTypes?: Account["type"][];
  excludeInactive?: boolean;
  onlyLeafAccounts?: boolean;

  // UI customization
  placeholder?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;

  // Business features
  showBalances?: boolean;
  showCodes?: boolean;
  showFavorites?: boolean;
  showRecent?: boolean;
  companyId?: string;

  // Validation
  onValidate?: (account: Account) => string | null;

  // Events
  onAccountCreate?: (parentId?: string) => void;
  onAccountEdit?: (accountId: string) => void;
}

export function AccountSelector({
  value,
  onChange,
  accounts,
  loading = false,
  error,
  multiple = false,
  allowGroups = true,
  accountTypes,
  excludeInactive = true,
  onlyLeafAccounts = false,
  placeholder = "Select account...",
  label,
  required = false,
  disabled = false,
  className,
  showBalances = false,
  showCodes = true,
  showFavorites = true,
  showRecent = true,
  companyId,
  onValidate,
  onAccountCreate,
  onAccountEdit,
}: AccountSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [selectedAccounts, setSelectedAccounts] = React.useState<Set<string>>(new Set());
  const [filterType, setFilterType] = React.useState<Account["type"] | "all">("all");
  const [showOnlyFavorites, setShowOnlyFavorites] = React.useState(false);

  // Build hierarchical account tree
  const accountTree = React.useMemo(() => {
    const buildTree = (parentId?: string, level = 0): Account[] => {
      return accounts
        .filter(account => account.parent_id === parentId)
        .map(account => ({
          ...account,
          level,
          children: buildTree(account.id, level + 1),
          full_path: getAccountPath(account.id, accounts),
        }))
        .sort((a, b) => a.code.localeCompare(b.code));
    };

    return buildTree();
  }, [accounts]);

  // Filter accounts based on criteria
  const filteredAccounts = React.useMemo(() => {
    let filtered = accounts;

    // Type filter
    if (accountTypes && accountTypes.length > 0) {
      filtered = filtered.filter(account => accountTypes.includes(account.type));
    }

    if (filterType !== "all") {
      filtered = filtered.filter(account => account.type === filterType);
    }

    // Active filter
    if (excludeInactive) {
      filtered = filtered.filter(account => account.is_active);
    }

    // Leaf accounts only
    if (onlyLeafAccounts) {
      filtered = filtered.filter(account => !account.is_group);
    }

    // Group filter
    if (!allowGroups) {
      filtered = filtered.filter(account => !account.is_group);
    }

    // Favorites filter
    if (showOnlyFavorites) {
      filtered = filtered.filter(account => account.is_favorite);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        account =>
          account.code.toLowerCase().includes(query) ||
          account.name.toLowerCase().includes(query) ||
          account.description?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [
    accounts,
    accountTypes,
    filterType,
    excludeInactive,
    onlyLeafAccounts,
    allowGroups,
    showOnlyFavorites,
    searchQuery,
  ]);

  // Initialize selected accounts
  React.useEffect(() => {
    if (value) {
      const values = Array.isArray(value) ? value : [value];
      setSelectedAccounts(new Set(values));
    } else {
      setSelectedAccounts(new Set());
    }
  }, [value]);

  const handleAccountSelect = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    // Validate account selection
    if (onValidate) {
      const validationError = onValidate(account);
      if (validationError) {
        // Show validation error (could integrate with toast system)
        console.warn("Account validation failed:", validationError);
        return;
      }
    }

    if (multiple) {
      const newSelected = new Set(selectedAccounts);
      if (newSelected.has(accountId)) {
        newSelected.delete(accountId);
      } else {
        newSelected.add(accountId);
      }
      setSelectedAccounts(newSelected);
      onChange?.(Array.from(newSelected));
    } else {
      setSelectedAccounts(new Set([accountId]));
      onChange?.(accountId);
      setOpen(false);
    }
  };

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const getSelectedAccountsDisplay = () => {
    if (selectedAccounts.size === 0) return placeholder;

    const selectedAccountsList = Array.from(selectedAccounts)
      .map(id => accounts.find(a => a.id === id))
      .filter(Boolean) as Account[];

    if (multiple) {
      if (selectedAccountsList.length === 1) {
        const account = selectedAccountsList[0];
        return `${showCodes ? account.code + " - " : ""}${account.name}`;
      }
      return `${selectedAccountsList.length} accounts selected`;
    } else {
      const account = selectedAccountsList[0];
      return account ? `${showCodes ? account.code + " - " : ""}${account.name}` : placeholder;
    }
  };

  const getAccountIcon = (account: Account) => {
    switch (account.type) {
      case "Asset":
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case "Liability":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "Equity":
        return <DollarSign className="h-4 w-4 text-purple-500" />;
      case "Income":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "Expense":
        return <FileText className="h-4 w-4 text-orange-500" />;
      default:
        return <Calculator className="h-4 w-4 text-gray-500" />;
    }
  };

  const renderAccountTree = (accountList: Account[]) => {
    return accountList.map(account => (
      <div key={account.id}>
        <div
          className={cn(
            "flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer",
            selectedAccounts.has(account.id) && "bg-primary/10 border border-primary/20",
            account.level && `ml-${account.level * 4}`,
          )}
          onClick={() =>
            account.is_group ? toggleGroup(account.id) : handleAccountSelect(account.id)
          }
        >
          {/* Expand/Collapse for groups */}
          {account.is_group && (
            <Button
              variant="ghost"
              size="sm"
              className="h-4 w-4 p-0"
              onClick={e => {
                e.stopPropagation();
                toggleGroup(account.id);
              }}
            >
              {expandedGroups.has(account.id) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          {/* Selection checkbox for multiple mode */}
          {multiple && !account.is_group && (
            <Checkbox
              checked={selectedAccounts.has(account.id)}
              onChange={() => handleAccountSelect(account.id)}
            />
          )}

          {/* Account icon */}
          {getAccountIcon(account)}

          {/* Account info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              {showCodes && (
                <span className="font-mono text-sm text-muted-foreground">{account.code}</span>
              )}
              <span className={cn("font-medium truncate", account.is_group && "font-semibold")}>
                {account.name}
              </span>

              {/* Badges */}
              <div className="flex items-center space-x-1">
                {account.is_favorite && showFavorites && (
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                )}
                {account.is_group && (
                  <Badge variant="outline" className="text-xs">
                    Group
                  </Badge>
                )}
                {!account.is_active && (
                  <Badge variant="destructive" className="text-xs">
                    Inactive
                  </Badge>
                )}
              </div>
            </div>

            {/* Balance display */}
            {showBalances && account.balance !== undefined && (
              <div className="text-sm text-muted-foreground">
                Balance: {account.currency || "MYR"} {account.balance.toLocaleString()}
              </div>
            )}

            {/* Description */}
            {account.description && (
              <div className="text-xs text-muted-foreground truncate">{account.description}</div>
            )}
          </div>

          {/* Recent activity indicator */}
          {showRecent && account.recent_transactions && account.recent_transactions > 0 && (
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{account.recent_transactions}</span>
            </div>
          )}

          {/* Selection indicator */}
          {selectedAccounts.has(account.id) && <Check className="h-4 w-4 text-primary" />}
        </div>

        {/* Render children if expanded */}
        {account.is_group && expandedGroups.has(account.id) && account.children && (
          <div className="ml-4">{renderAccountTree(account.children)}</div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className={cn("space-y-2", className)}>
        {label && <Label>{label}</Label>}
        <div className="flex items-center space-x-2 p-3 border rounded-md">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          <span className="text-sm text-muted-foreground">Loading accounts...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedAccounts.size && "text-muted-foreground",
              error && "border-red-500",
            )}
            disabled={disabled}
          >
            <span className="truncate">{getSelectedAccountsDisplay()}</span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[500px] p-0" align="start">
          {/* Search and filters */}
          <div className="p-3 border-b space-y-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Asset">Assets</SelectItem>
                  <SelectItem value="Liability">Liabilities</SelectItem>
                  <SelectItem value="Equity">Equity</SelectItem>
                  <SelectItem value="Income">Income</SelectItem>
                  <SelectItem value="Expense">Expenses</SelectItem>
                </SelectContent>
              </Select>

              {showFavorites && (
                <Button
                  variant={showOnlyFavorites ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                >
                  <Star className="h-4 w-4 mr-1" />
                  Favorites
                </Button>
              )}

              {onAccountCreate && (
                <Button variant="outline" size="sm" onClick={() => onAccountCreate()}>
                  <FileText className="h-4 w-4 mr-1" />
                  New
                </Button>
              )}
            </div>
          </div>

          {/* Account list */}
          <ScrollArea className="h-[400px]">
            <div className="p-2">
              {filteredAccounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>No accounts found</p>
                  {searchQuery && <p className="text-sm">Try adjusting your search or filters</p>}
                </div>
              ) : searchQuery ? (
                // Flat list for search results
                filteredAccounts.map(account => (
                  <div
                    key={account.id}
                    className={cn(
                      "flex items-center space-x-2 p-2 hover:bg-muted rounded-md cursor-pointer",
                      selectedAccounts.has(account.id) && "bg-primary/10 border border-primary/20",
                    )}
                    onClick={() => handleAccountSelect(account.id)}
                  >
                    {multiple && (
                      <Checkbox
                        checked={selectedAccounts.has(account.id)}
                        onChange={() => handleAccountSelect(account.id)}
                      />
                    )}
                    {getAccountIcon(account)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-sm text-muted-foreground">
                          {account.code}
                        </span>
                        <span className="font-medium">{account.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{account.full_path}</div>
                    </div>
                    {selectedAccounts.has(account.id) && <Check className="h-4 w-4 text-primary" />}
                  </div>
                ))
              ) : (
                // Hierarchical tree view
                renderAccountTree(accountTree)
              )}
            </div>
          </ScrollArea>

          {/* Footer with selection info */}
          {multiple && selectedAccounts.size > 0 && (
            <div className="p-3 border-t bg-muted/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {selectedAccounts.size} account(s) selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedAccounts(new Set());
                    onChange?.(multiple ? [] : undefined);
                  }}
                >
                  Clear all
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {error && (
        <p className="text-sm text-red-500 flex items-center space-x-1">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

// Utility function to get account path
function getAccountPath(accountId: string, accounts: Account[]): string {
  const account = accounts.find(a => a.id === accountId);
  if (!account) return "";

  if (account.parent_id) {
    const parentPath = getAccountPath(account.parent_id, accounts);
    return parentPath ? `${parentPath} > ${account.name}` : account.name;
  }

  return account.name;
}

// Quick account selector for common use cases
export interface QuickAccountSelectorProps {
  value?: string;
  onChange?: (value: string | undefined) => void;
  accountType: Account["type"];
  placeholder?: string;
  className?: string;
  companyId?: string;
}

export function QuickAccountSelector({
  value,
  onChange,
  accountType,
  placeholder,
  className,
  companyId,
}: QuickAccountSelectorProps) {
  // This would fetch accounts from your API
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Fetch accounts by type
    // This is a placeholder - replace with your actual API call
    const fetchAccounts = async () => {
      setLoading(true);
      try {
        // const response = await api.getAccounts({ type: accountType, companyId })
        // setAccounts(response.data)
        setAccounts([]); // Placeholder
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [accountType, companyId]);

  return (
    <AccountSelector
      value={value}
      onChange={onChange}
      accounts={accounts}
      loading={loading}
      accountTypes={[accountType]}
      onlyLeafAccounts={true}
      placeholder={placeholder || `Select ${accountType.toLowerCase()} account...`}
      className={className}
      showCodes={true}
      showBalances={true}
    />
  );
}
