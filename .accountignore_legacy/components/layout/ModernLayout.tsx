/**
 * Modern Layout - Advanced Layout System with Business Context
 * Comprehensive layout with modern navigation, header, and business features
 * 
 * Features:
 * - Responsive sidebar with collapse functionality
 * - Modern header with business metrics and notifications
 * - Quick actions and keyboard shortcuts
 * - Business context awareness
 * - Performance optimizations
 * - Mobile-first design
 */

'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import ModernNavigation from './ModernNavigation'
import ModernHeader from './ModernHeader'
import { cn } from '@/lib/utils'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Plus,
    Search,
    ArrowUp,
    Activity,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Sparkles
} from 'lucide-react'

interface ModernLayoutProps {
    children: React.ReactNode
}

interface BusinessAlert {
    id: string
    type: 'info' | 'warning' | 'success' | 'error'
    title: string
    message: string
    action?: {
        label: string
        href: string
    }
}


export default function ModernLayout({ children }: ModernLayoutProps) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [showScrollTop, setShowScrollTop] = useState(false)
    const [businessAlerts, setBusinessAlerts] = useState<BusinessAlert[]>([])
    const pathname = usePathname()

    // Handle scroll to show/hide scroll to top button
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.scrollY > 400)
        }

        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Command/Ctrl + K for search
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault()
                // Trigger search modal
                document.dispatchEvent(new CustomEvent('open-search'))
            }

            // Command/Ctrl + I for new invoice
            if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
                event.preventDefault()
                window.location.href = '/invoices/new'
            }

            // Command/Ctrl + P for new payment
            if ((event.metaKey || event.ctrlKey) && event.key === 'p') {
                event.preventDefault()
                window.location.href = '/payments/new'
            }

            // Command/Ctrl + B for bank reconciliation
            if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
                event.preventDefault()
                window.location.href = '/bank-reconciliation'
            }

            // Command/Ctrl + R for reports
            if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
                event.preventDefault()
                window.location.href = '/reports'
            }

            // Command/Ctrl + A for AI insights
            if ((event.metaKey || event.ctrlKey) && event.key === 'a') {
                event.preventDefault()
                window.location.href = '/predictive'
            }

            // Escape to close modals
            if (event.key === 'Escape') {
                document.dispatchEvent(new CustomEvent('close-modals'))
            }

            // Command/Ctrl + / for help
            if ((event.metaKey || event.ctrlKey) && event.key === '/') {
                event.preventDefault()
                document.dispatchEvent(new CustomEvent('open-help'))
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Sample business alerts - in real app, this would come from API
    useEffect(() => {
        const alerts: BusinessAlert[] = [
            {
                id: 'cash-flow',
                type: 'warning',
                title: 'Cash Flow Alert',
                message: 'Projected cash shortfall in 30 days. Consider expediting receivables.',
                action: { label: 'View Forecast', href: '/treasury' }
            },
            {
                id: 'reconciliation',
                type: 'info',
                title: 'Bank Reconciliation',
                message: '5 transactions require reconciliation in Wells Fargo account.',
                action: { label: 'Reconcile Now', href: '/bank-reconciliation' }
            }
        ]

        setBusinessAlerts(alerts)
    }, [])

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Get page context for business features
    const getPageContext = () => {
        if (pathname.includes('/dashboard')) return 'dashboard'
        if (pathname.includes('/invoice')) return 'invoicing'
        if (pathname.includes('/payment')) return 'payments'
        if (pathname.includes('/report')) return 'reporting'
        if (pathname.includes('/predictive')) return 'analytics'
        if (pathname.includes('/treasury')) return 'treasury'
        return 'general'
    }

    const pageContext = getPageContext()


    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
                {/* Sidebar */}
                <div
                    className={cn(
                        "fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out lg:static lg:inset-auto",
                        sidebarCollapsed ? "w-20" : "w-80",
                        "lg:block"
                    )}
                >
                    <ModernNavigation
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Header */}
                    <ModernHeader
                        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
                        sidebarCollapsed={sidebarCollapsed}
                    />

                    {/* Business Alerts Bar */}
                    {businessAlerts.length > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-b border-blue-200/50 dark:border-blue-800/50">
                            <div className="flex items-center gap-4 px-4 py-3 overflow-x-auto">
                                {businessAlerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-2 rounded-lg border whitespace-nowrap min-w-0",
                                            alert.type === 'warning'
                                                ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50"
                                                : alert.type === 'error'
                                                    ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800/50"
                                                    : alert.type === 'success'
                                                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800/50"
                                                        : "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50"
                                        )}
                                    >
                                        {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                                        {alert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                                        {alert.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                                        {alert.type === 'info' && <Activity className="w-4 h-4 text-blue-600" />}

                                        <div className="min-w-0">
                                            <div className={cn(
                                                "font-medium text-sm",
                                                alert.type === 'warning' ? "text-amber-800 dark:text-amber-200"
                                                    : alert.type === 'error' ? "text-red-800 dark:text-red-200"
                                                        : alert.type === 'success' ? "text-green-800 dark:text-green-200"
                                                            : "text-blue-800 dark:text-blue-200"
                                            )}>
                                                {alert.title}
                                            </div>
                                            <div className={cn(
                                                "text-xs truncate",
                                                alert.type === 'warning' ? "text-amber-700 dark:text-amber-300"
                                                    : alert.type === 'error' ? "text-red-700 dark:text-red-300"
                                                        : alert.type === 'success' ? "text-green-700 dark:text-green-300"
                                                            : "text-blue-700 dark:text-blue-300"
                                            )}>
                                                {alert.message}
                                            </div>
                                        </div>

                                        {alert.action && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={cn(
                                                    "text-xs border-current",
                                                    alert.type === 'warning' ? "text-amber-700 hover:bg-amber-100"
                                                        : alert.type === 'error' ? "text-red-700 hover:bg-red-100"
                                                            : alert.type === 'success' ? "text-green-700 hover:bg-green-100"
                                                                : "text-blue-700 hover:bg-blue-100"
                                                )}
                                            >
                                                {alert.action.label}
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Page Content */}
                    <main className="flex-1 overflow-auto">
                        <div className="h-full">
                            {children}
                        </div>
                    </main>

                    {/* Footer */}
                    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
                        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span>System Online</span>
                                </div>
                                <div className="hidden sm:block">
                                    Last sync: {new Date().toLocaleTimeString()}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden lg:flex items-center gap-2">
                                    <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border">⌘K</kbd>
                                    <span>Search</span>
                                </div>
                                <div className="hidden lg:flex items-center gap-2">
                                    <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded border">⌘I</kbd>
                                    <span>New Invoice</span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                    v2.0.0
                                </Badge>
                            </div>
                        </div>
                    </footer>
                </div>

                {/* Scroll to Top Button */}
                {showScrollTop && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="icon"
                                onClick={scrollToTop}
                                className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                            >
                                <ArrowUp className="w-4 h-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="left">
                            <p>Scroll to top</p>
                        </TooltipContent>
                    </Tooltip>
                )}

                {/* Quick Actions Float (Mobile) */}
                <div className="lg:hidden fixed bottom-6 right-6 z-40">
                    <div className="flex flex-col gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    className="rounded-full shadow-lg bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                    onClick={() => window.location.href = '/invoices/new'}
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Quick Create</p>
                            </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="outline"
                                    className="rounded-full shadow-lg bg-white dark:bg-gray-900"
                                    onClick={() => document.dispatchEvent(new CustomEvent('open-search'))}
                                >
                                    <Search className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Search</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>

                {/* Keyboard Shortcuts Help */}
                <div className="hidden lg:block fixed bottom-4 left-4 z-40">
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-lg p-3">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Keyboard Shortcuts
                        </div>
                        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center justify-between gap-4">
                                <span>Search</span>
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘K</kbd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span>New Invoice</span>
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘I</kbd>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <span>AI Insights</span>
                                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">⌘A</kbd>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Context-Aware Business Sidebar (when applicable) */}
                {pageContext === 'dashboard' && (
                    <div className="hidden xl:block w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Business Insights
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">AI-powered recommendations</p>
                        </div>

                        <div className="p-4 space-y-4">
                            {/* Sample AI insights */}
                            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                            Revenue Growth Opportunity
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                            Your top 3 customers show 25% increase in order frequency. Consider upselling complementary services.
                                        </div>
                                        <Button size="sm" variant="outline" className="text-xs">
                                            View Details
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 dark:border-amber-800/50 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1">
                                            Payment Terms Optimization
                                        </div>
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                            Reduce payment terms by 5 days to improve cash flow by $45K monthly.
                                        </div>
                                        <Button size="sm" variant="outline" className="text-xs">
                                            Implement
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    )
}
