import * as React from "react";
import { cn } from "../../utils";
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Building2,
  TrendingUp,
  Users,
  Settings,
  MoreVertical,
  Check,
  X,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

// SSOT Compliant Chart of Accounts Management Component
// Comprehensive account hierarchy management with industry templates

export interface Account {
  id: string;
  code: string;
  name: string;
  description?: string;
  accountType: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
  parentId?: string;
  level: number;
  isActive: boolean;
  isGroup: boolean;
  currency: string;
  balance: number;
  children?: Account[];
  createdAt: string;
  updatedAt: string;
}

export interface AccountType {
  id: string;
  name: string;
  description: string;
  category: "BALANCE_SHEET" | "INCOME_STATEMENT";
  normalBalance: "DEBIT" | "CREDIT";
  isSystem: boolean;
  color: string;
}

export interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  industry: string;
  accounts: Omit<Account, "id" | "createdAt" | "updatedAt" | "balance">[];
}

export interface ChartOfAccountsManagerProps {
  accounts: Account[];
  accountTypes: AccountType[];
  industryTemplates: IndustryTemplate[];
  onAccountCreate: (
    accountData: Omit<Account, "id" | "createdAt" | "updatedAt" | "balance" | "children">,
  ) => Promise<void>;
  onAccountUpdate: (accountId: string, updates: Partial<Account>) => Promise<void>;
  onAccountDelete: (accountId: string) => Promise<void>;
  onAccountMove: (accountId: string, newParentId: string | null) => Promise<void>;
  onTemplateApply: (templateId: string) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export const ChartOfAccountsManager: React.FC<ChartOfAccountsManagerProps> = ({
  accounts,
  accountTypes,
  industryTemplates,
  onAccountCreate,
  onAccountUpdate,
  onAccountDelete,
  onAccountMove,
  onTemplateApply,
  loading = false,
  className,
}) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [filterStatus, setFilterStatus] = React.useState<string>("all");
  const [expandedAccounts, setExpandedAccounts] = React.useState<Set<string>>(new Set());
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null);

  const accountTypeMap = React.useMemo(() => {
    return accountTypes.reduce(
      (acc, type) => {
        acc[type.id] = type;
        return acc;
      },
      {} as Record<string, AccountType>,
    );
  }, [accountTypes]);

  const filteredAccounts = React.useMemo(() => {
    const filter = (accountList: Account[]): Account[] => {
      return accountList.filter(account => {
        const matchesSearch =
          account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          account.code.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === "all" || account.accountType === filterType;
        const matchesStatus =
          filterStatus === "all" ||
          (filterStatus === "active" && account.isActive) ||
          (filterStatus === "inactive" && !account.isActive);

        const matches = matchesSearch && matchesType && matchesStatus;

        if (matches && account.children) {
          account.children = filter(account.children);
        }

        return matches || (account.children && account.children.length > 0);
      });
    };

    return filter(accounts);
  }, [accounts, searchTerm, filterType, filterStatus]);

  const toggleExpanded = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const getAccountTypeColor = (accountType: Account["accountType"]) => {
    const colors = {
      ASSET: "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10",
      LIABILITY: "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10",
      EQUITY: "text-[var(--sys-accent)] bg-[var(--sys-accent)]/10",
      REVENUE: "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10",
      EXPENSE: "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10",
    };
    return colors[accountType] || "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
  };

  const getAccountTypeIcon = (accountType: Account["accountType"]) => {
    const icons = {
      ASSET: <DollarSign className="h-4 w-4" />,
      LIABILITY: <Building2 className="h-4 w-4" />,
      EQUITY: <TrendingUp className="h-4 w-4" />,
      REVENUE: <TrendingUp className="h-4 w-4" />,
      EXPENSE: <FileText className="h-4 w-4" />,
    };
    return icons[accountType] || <FileText className="h-4 w-4" />;
  };

  const formatBalance = (balance: number, accountType: Account["accountType"]) => {
    const isDebit = accountType === "ASSET" || accountType === "EXPENSE";
    const displayBalance = isDebit ? Math.abs(balance) : Math.abs(balance);
    const sign = balance < 0 ? "-" : "+";
    return `${sign}$${displayBalance.toLocaleString()}`;
  };

  const renderAccount = (account: Account, level: number = 0) => {
    const isExpanded = expandedAccounts.has(account.id);
    const hasChildren = account.children && account.children.length > 0;
    const indentClass = `ml-${level * 4}`;

    return (
      <div key={account.id} className="space-y-1">
        <div
          className={cn(
            "flex items-center p-3 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] hover:border-[var(--sys-border-subtle)] transition-colors",
            indentClass,
          )}
        >
          {/* Expand/Collapse Button */}
          <div className="flex items-center space-x-2">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(account.id)}
                className="p-1 hover:bg-[var(--sys-fill-low)] rounded transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                )}
              </button>
            ) : (
              <div className="w-6" />
            )}

            {/* Account Type Icon */}
            <div className={cn("p-1 rounded", getAccountTypeColor(account.accountType))}>
              {getAccountTypeIcon(account.accountType)}
            </div>

            {/* Account Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-sm text-[var(--sys-text-secondary)]">
                  {account.code}
                </span>
                <h3 className="font-medium text-[var(--sys-text-primary)] truncate">
                  {account.name}
                </h3>
                {account.isGroup && (
                  <div className="px-2 py-1 bg-[var(--sys-fill-low)] text-[var(--sys-text-tertiary)] text-xs rounded">
                    Group
                  </div>
                )}
                {!account.isActive && (
                  <div className="px-2 py-1 bg-[var(--sys-status-error)]/10 text-[var(--sys-status-error)] text-xs rounded">
                    Inactive
                  </div>
                )}
              </div>
              {account.description && (
                <p className="text-sm text-[var(--sys-text-secondary)] mt-1">
                  {account.description}
                </p>
              )}
            </div>

            {/* Balance */}
            <div className="text-right">
              <div className="text-sm font-medium text-[var(--sys-text-primary)]">
                {formatBalance(account.balance, account.accountType)}
              </div>
              <div className="text-xs text-[var(--sys-text-tertiary)]">{account.accountType}</div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedAccount(account)}
                className="p-1 hover:bg-[var(--sys-fill-low)] rounded transition-colors"
                aria-label="Account settings"
              >
                <Settings className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
              </button>
              <button
                onClick={() => {
                  /* Handle edit */
                }}
                className="p-1 hover:bg-[var(--sys-fill-low)] rounded transition-colors"
                aria-label="Edit account"
              >
                <Edit className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
              </button>
              <button
                onClick={() => {
                  /* Handle delete */
                }}
                className="p-1 hover:bg-[var(--sys-fill-low)] rounded transition-colors"
                aria-label="Delete account"
              >
                <Trash2 className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
              </button>
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {account.children!.map(child => renderAccount(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--sys-accent)]"></div>
        <span className="ml-2 text-[var(--sys-text-secondary)]">Loading chart of accounts...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
            Chart of Accounts
          </h2>
          <p className="text-sm text-[var(--sys-text-secondary)] mt-1">
            Manage your accounting structure and account hierarchy
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTemplateDialog(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
          >
            <FileText className="h-4 w-4" />
            <span>Templates</span>
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] rounded-lg hover:bg-[var(--sys-accent)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--sys-text-tertiary)]" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] placeholder:text-[var(--sys-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
            aria-label="Search accounts"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
          aria-label="Filter by account type"
        >
          <option value="all">All Types</option>
          <option value="ASSET">Assets</option>
          <option value="LIABILITY">Liabilities</option>
          <option value="EQUITY">Equity</option>
          <option value="REVENUE">Revenue</option>
          <option value="EXPENSE">Expenses</option>
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:border-transparent"
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Accounts List */}
      <div className="space-y-2">{filteredAccounts.map(account => renderAccount(account))}</div>

      {/* Empty State */}
      {filteredAccounts.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
            No accounts found
          </h3>
          <p className="text-[var(--sys-text-secondary)] mb-6">
            {searchTerm || filterType !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Get started by creating your first account or applying an industry template"}
          </p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={() => setShowCreateDialog(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--sys-accent)] text-[var(--sys-text-on-accent)] rounded-lg hover:bg-[var(--sys-accent)]/90 transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
            >
              <Plus className="h-4 w-4" />
              <span>Create Account</span>
            </button>
            <button
              onClick={() => setShowTemplateDialog(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] focus:ring-offset-2"
            >
              <FileText className="h-4 w-4" />
              <span>Use Template</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
