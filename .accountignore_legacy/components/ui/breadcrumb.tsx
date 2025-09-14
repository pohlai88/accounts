/**
 * Breadcrumb Navigation Component
 * Hierarchical navigation with business context and smart routing
 */

"use client";

import * as React from "react";
import { ChevronRight, Home, Building2, FileText, DollarSign, Users, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
  isCurrentPage?: boolean;
  dropdown?: BreadcrumbItem[];
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  separator?: React.ReactNode;
  showHome?: boolean;
  maxItems?: number;
  businessContext?: {
    companyName?: string;
    module?: string;
    entityType?: string;
    entityId?: string;
  };
}

export function Breadcrumb({
  items,
  className,
  separator = <ChevronRight className="h-4 w-4 text-muted-foreground" />,
  showHome = true,
  maxItems = 5,
  businessContext,
}: BreadcrumbProps) {
  // Add home item if requested
  const allItems = React.useMemo(() => {
    const breadcrumbItems = [...items];

    if (showHome && (!items.length || items[0].href !== "/")) {
      breadcrumbItems.unshift({
        label: businessContext?.companyName || "Dashboard",
        href: "/",
        icon: businessContext?.companyName ? Building2 : Home,
      });
    }

    return breadcrumbItems;
  }, [items, showHome, businessContext]);

  // Handle overflow with dropdown
  const displayItems = React.useMemo(() => {
    if (allItems.length <= maxItems) {
      return allItems;
    }

    const firstItem = allItems[0];
    const lastItems = allItems.slice(-2);
    const middleItems = allItems.slice(1, -2);

    return [
      firstItem,
      {
        label: "...",
        dropdown: middleItems,
      },
      ...lastItems,
    ];
  }, [allItems, maxItems]);

  const handleNavigation = (href?: string) => {
    if (href) {
      window.location.href = href;
    }
  };

  return (
    <nav className={cn("flex items-center space-x-1 text-sm", className)} aria-label="Breadcrumb">
      <ol className="flex items-center space-x-1">
        {displayItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && <span className="mx-2 flex-shrink-0">{separator}</span>}

            <BreadcrumbItem
              item={item}
              isLast={index === displayItems.length - 1}
              onNavigate={handleNavigation}
            />
          </li>
        ))}
      </ol>

      {/* Business Context Info */}
      {businessContext && (businessContext.module || businessContext.entityType) && (
        <div className="ml-4 flex items-center space-x-2 text-xs text-muted-foreground">
          {businessContext.module && (
            <span className="px-2 py-1 bg-muted rounded">{businessContext.module}</span>
          )}
          {businessContext.entityType && businessContext.entityId && (
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
              {businessContext.entityType} #{businessContext.entityId}
            </span>
          )}
        </div>
      )}
    </nav>
  );
}

interface BreadcrumbItemProps {
  item: BreadcrumbItem;
  isLast: boolean;
  onNavigate: (href?: string) => void;
}

function BreadcrumbItem({ item, isLast, onNavigate }: BreadcrumbItemProps) {
  const Icon = item.icon;

  // Dropdown item
  if (item.dropdown) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-auto p-1 text-muted-foreground hover:text-foreground"
          >
            {item.label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {item.dropdown.map((dropdownItem, index) => (
            <DropdownMenuItem
              key={index}
              onClick={() => onNavigate(dropdownItem.href)}
              className="flex items-center space-x-2"
            >
              {dropdownItem.icon && <dropdownItem.icon className="h-4 w-4" />}
              <span>{dropdownItem.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Current page (no link)
  if (isLast || item.isCurrentPage) {
    return (
      <span className="flex items-center space-x-1 font-medium text-foreground" aria-current="page">
        {Icon && <Icon className="h-4 w-4" />}
        <span>{item.label}</span>
      </span>
    );
  }

  // Clickable item
  if (item.href) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1 text-muted-foreground hover:text-foreground"
        onClick={() => onNavigate(item.href)}
      >
        <span className="flex items-center space-x-1">
          {Icon && <Icon className="h-4 w-4" />}
          <span>{item.label}</span>
        </span>
      </Button>
    );
  }

  // Non-clickable item
  return (
    <span className="flex items-center space-x-1 text-muted-foreground">
      {Icon && <Icon className="h-4 w-4" />}
      <span>{item.label}</span>
    </span>
  );
}

// Business-specific breadcrumb builders
export const breadcrumbBuilders = {
  // Accounting module breadcrumbs
  accounting: {
    chartOfAccounts: (accountCode?: string) => [
      { label: "Accounting", href: "/accounting", icon: FileText },
      { label: "Chart of Accounts", href: "/accounts" },
      ...(accountCode ? [{ label: `Account ${accountCode}`, isCurrentPage: true }] : []),
    ],

    transactions: (type?: string, id?: string) => [
      { label: "Accounting", href: "/accounting", icon: FileText },
      { label: "Transactions", href: "/transactions" },
      ...(type ? [{ label: type, href: `/transactions/${type.toLowerCase()}` }] : []),
      ...(id ? [{ label: `#${id}`, isCurrentPage: true }] : []),
    ],

    reports: (reportType?: string) => [
      { label: "Accounting", href: "/accounting", icon: FileText },
      { label: "Reports", href: "/reports" },
      ...(reportType ? [{ label: reportType, isCurrentPage: true }] : []),
    ],
  },

  // Banking module breadcrumbs
  banking: {
    accounts: (accountId?: string) => [
      { label: "Banking", href: "/banking", icon: DollarSign },
      { label: "Bank Accounts", href: "/banking/accounts" },
      ...(accountId ? [{ label: `Account ${accountId}`, isCurrentPage: true }] : []),
    ],

    reconciliation: (accountId?: string) => [
      { label: "Banking", href: "/banking", icon: DollarSign },
      { label: "Reconciliation", href: "/banking/reconcile" },
      ...(accountId ? [{ label: `Account ${accountId}`, isCurrentPage: true }] : []),
    ],
  },

  // Customer management breadcrumbs
  customers: {
    list: () => [{ label: "Customers", href: "/customers", icon: Users }],

    detail: (customerId: string, customerName?: string) => [
      { label: "Customers", href: "/customers", icon: Users },
      { label: customerName || `Customer ${customerId}`, isCurrentPage: true },
    ],

    invoices: (customerId: string, customerName?: string) => [
      { label: "Customers", href: "/customers", icon: Users },
      { label: customerName || `Customer ${customerId}`, href: `/customers/${customerId}` },
      { label: "Invoices", isCurrentPage: true },
    ],
  },

  // Settings breadcrumbs
  settings: {
    main: () => [{ label: "Settings", href: "/settings", icon: Settings }],

    section: (section: string) => [
      { label: "Settings", href: "/settings", icon: Settings },
      { label: section, isCurrentPage: true },
    ],
  },
};

// Hook for automatic breadcrumb generation based on route
export function useBreadcrumbs(pathname: string, params?: Record<string, string>) {
  return React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Build breadcrumbs based on route segments
    segments.forEach((segment, index) => {
      const isLast = index === segments.length - 1;
      const href = "/" + segments.slice(0, index + 1).join("/");

      // Get human-readable label
      const label = getSegmentLabel(segment, params);

      // Get appropriate icon
      const icon = getSegmentIcon(segment);

      items.push({
        label,
        href: isLast ? undefined : href,
        icon,
        isCurrentPage: isLast,
      });
    });

    return items;
  }, [pathname, params]);
}

function getSegmentLabel(segment: string, params?: Record<string, string>): string {
  // Check if segment is a parameter (UUID or ID)
  if (params && Object.values(params).includes(segment)) {
    const paramKey = Object.keys(params).find(key => params[key] === segment);
    return paramKey ? `${paramKey} ${segment.slice(0, 8)}` : segment;
  }

  // Convert kebab-case to title case
  return segment
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getSegmentIcon(segment: string) {
  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    accounting: FileText,
    accounts: FileText,
    transactions: FileText,
    banking: DollarSign,
    customers: Users,
    suppliers: Users,
    reports: FileText,
    settings: Settings,
    dashboard: Home,
  };

  return iconMap[segment];
}
