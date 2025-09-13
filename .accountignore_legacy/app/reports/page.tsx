import { CurrencyReports } from '@/components/reports/currency-reports'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileText,
    BarChart3,
    Building2,
    DollarSign,
    TrendingUp,
    Calculator,
    PieChart,
    LineChart
} from 'lucide-react'

export default function ReportsPage() {
    // In a real app, get companyId from auth context
    const companyId = 'default-company-id'

    const reportCategories = [
        {
            title: 'Core Financial Reports',
            description: 'Essential financial statements for business analysis',
            reports: [
                {
                    title: 'Profit & Loss Statement',
                    description: 'Revenue, expenses, and net income analysis',
                    href: '/reports/profit-loss',
                    icon: TrendingUp,
                    color: 'text-green-600 bg-green-50'
                },
                {
                    title: 'Balance Sheet',
                    description: 'Assets, liabilities, and equity overview',
                    href: '/reports/balance-sheet',
                    icon: Building2,
                    color: 'text-blue-600 bg-blue-50'
                },
                {
                    title: 'Cash Flow Statement',
                    description: 'Operating, investing, and financing activities',
                    href: '/reports/cash-flow',
                    icon: DollarSign,
                    color: 'text-purple-600 bg-purple-50'
                },
                {
                    title: 'Trial Balance',
                    description: 'All accounts with debit and credit balances',
                    href: '/reports/trial-balance',
                    icon: Calculator,
                    color: 'text-orange-600 bg-orange-50'
                }
            ]
        },
        {
            title: 'Advanced Analytics',
            description: 'Comprehensive analysis and reporting tools',
            reports: [
                {
                    title: 'Multi-Currency Reports',
                    description: 'Financial reports with currency conversion',
                    href: '/reports',
                    icon: PieChart,
                    color: 'text-indigo-600 bg-indigo-50'
                },
                {
                    title: 'Flexible Analysis',
                    description: 'Dynamic pivot tables and data analysis',
                    href: '/analysis',
                    icon: BarChart3,
                    color: 'text-pink-600 bg-pink-50'
                },
                {
                    title: 'Advanced Dashboard',
                    description: 'Interactive dashboards and KPIs',
                    href: '/dashboard',
                    icon: LineChart,
                    color: 'text-cyan-600 bg-cyan-50'
                }
            ]
        }
    ]

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Financial Reports</h1>
                <p className="text-muted-foreground">
                    Comprehensive financial reporting and analysis tools
                </p>
            </div>

            {/* Report Categories */}
            <div className="space-y-8">
                {reportCategories.map((category, categoryIndex) => (
                    <div key={categoryIndex}>
                        <div className="mb-4">
                            <h2 className="text-xl font-semibold">{category.title}</h2>
                            <p className="text-muted-foreground">{category.description}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.reports.map((report, reportIndex) => {
                                const IconComponent = report.icon
                                return (
                                    <Card key={reportIndex} className="hover:shadow-md transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-center space-x-3">
                                                <div className={`p-2 rounded-lg ${report.color}`}>
                                                    <IconComponent className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{report.title}</CardTitle>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="mb-4">
                                                {report.description}
                                            </CardDescription>
                                            <Button asChild className="w-full">
                                                <a href={report.href}>
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View Report
                                                </a>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Access to Multi-Currency Reports */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <PieChart className="h-5 w-5" />
                        <span>Multi-Currency Reports</span>
                    </CardTitle>
                    <CardDescription>
                        View financial reports with real-time currency conversion
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CurrencyReports companyId={companyId} />
                </CardContent>
            </Card>
        </div>
    )
}
