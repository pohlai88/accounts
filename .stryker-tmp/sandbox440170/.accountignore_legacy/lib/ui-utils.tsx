/**
 * UI Utilities - Standardized UI patterns and helpers
 * Ensures consistent design system usage across the application
 */
// @ts-nocheck


import { Badge } from "@/components/ui/badge";

/**
 * Standardized status badge configuration
 * Uses design tokens exclusively - no hardcoded colors
 */
export const getStatusBadge = (status: string) => {
  const statusConfig = {
    // General Status
    Active: {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    Inactive: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },

    // Document Status
    Draft: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
    Submitted: {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    Approved: {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    Rejected: {
      variant: "destructive" as const,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    Completed: {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    Cancelled: { variant: "outline" as const, className: "bg-muted text-muted-foreground" },

    // Payment Status
    Pending: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
    Processing: {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    Paid: {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    Failed: {
      variant: "destructive" as const,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    Overdue: {
      variant: "destructive" as const,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },

    // Risk Levels
    LOW: { variant: "default" as const, className: "bg-primary/10 text-primary border-primary/20" },
    MEDIUM: { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
    HIGH: {
      variant: "destructive" as const,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    CRITICAL: {
      variant: "destructive" as const,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },

    // Compliance Status
    Compliant: {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    "Non-Compliant": {
      variant: "destructive" as const,
      className: "bg-destructive/10 text-destructive border-destructive/20",
    },
    "Partially Compliant": {
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    },
    "In Progress": {
      variant: "default" as const,
      className: "bg-primary/10 text-primary border-primary/20",
    },
    "Not Assessed": { variant: "secondary" as const, className: "bg-muted text-muted-foreground" },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Draft;
  return { variant: config.variant, className: config.className, label: status };
};

/**
 * Standardized account type styling
 * Uses design tokens for account type indicators
 */
export const getAccountTypeStyle = (accountType: string) => {
  const typeConfig = {
    Asset: "text-primary bg-primary/10 border-primary/20",
    Liability: "text-destructive bg-destructive/10 border-destructive/20",
    Equity: "text-primary bg-primary/10 border-primary/20",
    Income: "text-primary bg-primary/10 border-primary/20",
    Expense: "text-muted-foreground bg-muted border-border",
  };

  return typeConfig[accountType as keyof typeof typeConfig] || typeConfig.Asset;
};

/**
 * Standardized currency formatting
 * Consistent across all components
 */
export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Standardized percentage formatting
 */
export const formatPercentage = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

/**
 * Standardized date formatting
 */
export const formatDate = (date: string | Date, format: "short" | "medium" | "long" = "medium") => {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    case "long":
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      });
    default:
      return dateObj.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
  }
};

/**
 * Standardized loading state component
 */
export const LoadingState = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex items-center justify-center py-8">
    <div className="text-muted-foreground">{message}</div>
  </div>
);

/**
 * Standardized empty state component
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
  <div className="text-center py-8">
    <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-medium mb-2">{title}</h3>
    <p className="text-muted-foreground mb-4">{description}</p>
    {action}
  </div>
);

/**
 * Standardized page header component
 */
export const PageHeader = ({
  icon: Icon,
  title,
  description,
  actions,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold flex items-center space-x-3">
        <Icon className="h-8 w-8 text-primary" />
        <span>{title}</span>
      </h1>
      <p className="text-muted-foreground mt-2">{description}</p>
    </div>
    {actions && <div className="flex items-center space-x-2">{actions}</div>}
  </div>
);
