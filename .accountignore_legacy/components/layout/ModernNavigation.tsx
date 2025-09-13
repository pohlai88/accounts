/**
 * Modern Navigation - Advanced Navigation System with Quick Actions
 * Comprehensive navigation with business shortcuts, quick actions, and modern UI
 * 
 * Features:
 * - Collapsible sidebar with smart sections
 * - Quick action buttons with business context
 * - Search functionality with intelligent suggestions
 * - Recent items and favorites
 * - Business workflow shortcuts
 * - Modern animations and interactions
 */

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutDashboard,
    Receipt,
    CreditCard,
    FileText,
    Settings,
    Users,
    Building2,
    Calculator,
    PieChart,
    BarChart3,
    Wallet,
    Shield,
    Zap,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    Clock,
    Sparkles,
    Brain,
    Target,
    Activity,
    DollarSign,
    CreditCard as CreditCardIcon,
    Receipt as ReceiptIcon,
    FileSpreadsheet,
    PiggyBank,
    Briefcase,
    Globe,
    Lock,
    Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface NavigationItem {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    href: string
    badge?: string
    badgeColor?: string
    children?: NavigationItem[]
    quickActions?: QuickAction[]
}

interface QuickAction {
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    action: () => void
    shortcut?: string
    color?: string
}

interface ModernNavigationProps {
    collapsed?: boolean
    onToggleCollapse?: () => void
}

export default function ModernNavigation({ collapsed = false, onToggleCollapse }: ModernNavigationProps) {
    const pathname = usePathname()
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [recentItems, setRecentItems] = useState<string[]>([])

    // Quick Actions for business operations
    const quickActions: QuickAction[] = [
        {
            id: 'new-invoice',
            label: 'New Invoice',
            icon: ReceiptIcon,
            action: () => window.location.href = '/invoices/new',
            shortcut: '⌘+I',
            color: 'text-blue-600'
        },
        {
            id: 'new-payment',
            label: 'Record Payment',
            icon: CreditCardIcon,
            action: () => window.location.href = '/payments/new',
            shortcut: '⌘+P',
            color: 'text-green-600'
        },
        {
            id: 'new-expense',
            label: 'Add Expense',
            icon: Receipt,
            action: () => window.location.href = '/expenses/new',
            shortcut: '⌘+E',
            color: 'text-red-600'
        },
        {
            id: 'bank-reconcile',
            label: 'Bank Reconciliation',
            icon: Wallet,
            action: () => window.location.href = '/bank-reconciliation',
            shortcut: '⌘+B',
            color: 'text-purple-600'
        },
        {
            id: 'ai-insights',
            label: 'AI Insights',
            icon: Sparkles,
            action: () => window.location.href = '/predictive',
            shortcut: '⌘+A',
            color: 'text-amber-600'
        },
        {
            id: 'generate-report',
            label: 'Generate Report',
            icon: FileSpreadsheet,
            action: () => window.location.href = '/reports',
            shortcut: '⌘+R',
            color: 'text-indigo-600'
        },
    ]

    // Navigation structure with modern organization
    const navigationItems: NavigationItem[] = [
        {
            id: 'overview',
            label: 'Overview',
            icon: LayoutDashboard,
            href: '/',
        },

        // Core Financial Operations
        {
            id: 'financials',
            label: 'Financial Operations',
            icon: DollarSign,
            href: '/financials',
            children: [
                { id: 'invoices', label: 'Sales Invoices', icon: Receipt, href: '/invoices' },
                { id: 'payments', label: 'Payments', icon: CreditCard, href: '/payments' },
                { id: 'expenses', label: 'Expenses', icon: TrendingDown, href: '/expenses' },
                { id: 'bank-reconciliation', label: 'Bank Reconciliation', icon: Wallet, href: '/bank-reconciliation' },
                { id: 'journal-entries', label: 'Journal Entries', icon: FileText, href: '/journal-entries' },
            ],
            quickActions: [
                { id: 'quick-invoice', label: 'Quick Invoice', icon: Plus, action: () => { } },
                { id: 'bulk-payment', label: 'Bulk Payments', icon: CreditCard, action: () => { } },
            ]
        },

        // Advanced Analytics & Intelligence
        {
            id: 'intelligence',
            label: 'Business Intelligence',
            icon: Brain,
            href: '/intelligence',
            badge: 'AI',
            badgeColor: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
            children: [
                { id: 'dashboard-executive', label: 'Executive Dashboard', icon: BarChart3, href: '/dashboard/executive' },
                { id: 'predictive', label: 'Predictive Analytics', icon: Sparkles, href: '/predictive' },
                { id: 'budget-variance', label: 'Budget Variance', icon: Target, href: '/budgets/variance' },
                { id: 'treasury', label: 'Treasury Management', icon: PiggyBank, href: '/treasury' },
                { id: 'kpi-dashboard', label: 'KPI Dashboard', icon: Activity, href: '/kpi-dashboard' },
            ]
        },

        // Reporting & Compliance
        {
            id: 'reports',
            label: 'Reports & Analytics',
            icon: PieChart,
            href: '/reports',
            children: [
                { id: 'financial-reports', label: 'Financial Reports', icon: FileSpreadsheet, href: '/reports/financial' },
                { id: 'consolidation', label: 'Consolidated Reports', icon: Building2, href: '/consolidation' },
                { id: 'compliance', label: 'Compliance Reports', icon: Shield, href: '/compliance' },
                { id: 'tax-reports', label: 'Tax Reports', icon: Calculator, href: '/tax' },
            ]
        },

        // Operations & Management
        {
            id: 'operations',
            label: 'Operations',
            icon: Briefcase,
            href: '/operations',
            children: [
                { id: 'customers', label: 'Customers', icon: Users, href: '/customers' },
                { id: 'suppliers', label: 'Suppliers', icon: Building2, href: '/suppliers' },
                { id: 'inventory', label: 'Inventory', icon: Package, href: '/inventory' },
                { id: 'assets', label: 'Fixed Assets', icon: Building2, href: '/assets' },
                { id: 'projects', label: 'Projects', icon: Briefcase, href: '/projects' },
            ]
        },

        // Advanced Features
        {
            id: 'advanced',
            label: 'Advanced Features',
            icon: Zap,
            href: '/advanced',
            badge: 'Pro',
            badgeColor: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white',
            children: [
                { id: 'automation', label: 'Automation', icon: Zap, href: '/automation' },
                { id: 'monitoring', label: 'Continuous Monitoring', icon: Shield, href: '/monitoring' },
                { id: 'treasury-optimization', label: 'Treasury Optimization', icon: PiggyBank, href: '/treasury-optimization' },
                { id: 'banking', label: 'Bank Integration', icon: Wallet, href: '/banking' },
                { id: 'portals', label: 'Client/Vendor Portals', icon: Globe, href: '/portal' },
            ]
        },

        // System & Configuration
        {
            id: 'system',
            label: 'System',
            icon: Settings,
            href: '/system',
            children: [
                { id: 'accounts', label: 'Chart of Accounts', icon: Calculator, href: '/accounts' },
                { id: 'users', label: 'User Management', icon: Users, href: '/users' },
                { id: 'security', label: 'Security', icon: Lock, href: '/security' },
                { id: 'integrations', label: 'Integrations', icon: Globe, href: '/integrations' },
            ]
        },
    ]

    // Track recent items
    useEffect(() => {
        const currentPath = pathname
        setRecentItems(prev => {
            const updated = [currentPath, ...prev.filter(item => item !== currentPath)].slice(0, 5)
            return updated
        })
    }, [pathname])

    // Get current navigation item
    const getCurrentItem = (items: NavigationItem[], path: string): NavigationItem | null => {
        for (const item of items) {
            if (item.href === path) return item
            if (item.children) {
                const child = getCurrentItem(item.children, path)
                if (child) return child
            }
        }
        return null
    }

    return (
        <TooltipProvider>
            <div className={cn(
                "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 ease-in-out flex flex-col h-full",
                collapsed ? "w-20" : "w-80"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        {!collapsed && (
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        ModernERP
                                    </h2>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Next-Gen Accounting
                                    </p>
                                </div>
                            </div>
                        )}

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onToggleCollapse}
                            className="ml-auto hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {collapsed ? (
                                <ChevronRight className="w-4 h-4" />
                            ) : (
                                <ChevronLeft className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Quick Actions */}
                {!collapsed && (
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Quick Actions</h3>
                                <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="w-6 h-6">
                                            <Search className="w-4 h-4" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-md">
                                        <DialogHeader>
                                            <DialogTitle>Quick Search</DialogTitle>
                                            <DialogDescription>
                                                Search for features, reports, or actions
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4">
                                            <Input
                                                placeholder="Search..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full"
                                            />
                                            {/* Search results would go here */}
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                {quickActions.slice(0, 4).map((action) => (
                                    <Tooltip key={action.id}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={action.action}
                                                className="flex items-center gap-2 h-auto py-3 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                <action.icon className={cn("w-4 h-4", action.color)} />
                                                <span className="text-xs font-medium truncate">{action.label}</span>
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom">
                                            <p>{action.label} {action.shortcut && <kbd className="ml-1">{action.shortcut}</kbd>}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>

                            {quickActions.length > 4 && (
                                <Button variant="ghost" size="sm" className="w-full text-xs text-gray-600">
                                    <Plus className="w-3 h-3 mr-1" />
                                    {quickActions.length - 4} more actions
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                    <nav className="p-2">
                        {navigationItems.map((item) => (
                            <NavigationSection
                                key={item.id}
                                item={item}
                                collapsed={collapsed}
                                pathname={pathname}
                                level={0}
                            />
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    {!collapsed ? (
                        <div className="space-y-3">
                            {/* Recent Items */}
                            {recentItems.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                                        Recent
                                    </h4>
                                    <div className="space-y-1">
                                        {recentItems.slice(0, 3).map((path) => {
                                            const item = getCurrentItem(navigationItems, path)
                                            return item ? (
                                                <Link
                                                    key={path}
                                                    href={path}
                                                    className="flex items-center gap-2 px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
                                                >
                                                    <Clock className="w-3 h-3" />
                                                    {item.label}
                                                </Link>
                                            ) : null
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Status */}
                            <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>System Online</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    v2.0.0
                                </Badge>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <Badge variant="outline" className="text-xs">
                                v2.0
                            </Badge>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}

// Navigation Section Component
interface NavigationSectionProps {
    item: NavigationItem
    collapsed: boolean
    pathname: string
    level: number
}

function NavigationSection({ item, collapsed, pathname, level }: NavigationSectionProps) {
    const [expanded, setExpanded] = useState(false)
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const hasChildren = item.children && item.children.length > 0

    useEffect(() => {
        if (isActive && hasChildren) {
            setExpanded(true)
        }
    }, [isActive, hasChildren])

    const ItemIcon = item.icon

    if (collapsed && level === 0) {
        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link
                        href={item.href}
                        className={cn(
                            "flex items-center justify-center w-12 h-12 rounded-lg mb-2 transition-all duration-200",
                            isActive
                                ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        )}
                    >
                        <ItemIcon className="w-5 h-5" />
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                    <div className="flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.badge && (
                            <Badge className={item.badgeColor || 'bg-blue-100 text-blue-800'}>
                                {item.badge}
                            </Badge>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        )
    }

    return (
        <div className="mb-1">
            <div
                className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group",
                    isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 text-blue-700 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/50"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
                onClick={() => hasChildren ? setExpanded(!expanded) : window.location.href = item.href}
            >
                <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-lg transition-colors",
                    isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400 group-hover:bg-gray-100 dark:group-hover:bg-gray-700"
                )}>
                    <ItemIcon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{item.label}</span>
                        <div className="flex items-center gap-1">
                            {item.badge && (
                                <Badge className={cn(
                                    "text-xs px-1.5 py-0.5 font-medium",
                                    item.badgeColor || 'bg-blue-100 text-blue-700 border-blue-200'
                                )}>
                                    {item.badge}
                                </Badge>
                            )}
                            {hasChildren && (
                                <ChevronRight className={cn(
                                    "w-4 h-4 transition-transform duration-200",
                                    expanded && "rotate-90"
                                )} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Children */}
            {hasChildren && expanded && (
                <div className="ml-4 mt-1 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-4">
                    {item.children!.map((child) => (
                        <Link
                            key={child.id}
                            href={child.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                                pathname === child.href
                                    ? "bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 font-medium"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            )}
                        >
                            <child.icon className="w-4 h-4" />
                            <span>{child.label}</span>
                            {child.badge && (
                                <Badge variant="outline" className="ml-auto text-xs">
                                    {child.badge}
                                </Badge>
                            )}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}
