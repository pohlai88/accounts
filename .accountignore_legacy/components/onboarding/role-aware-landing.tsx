/**
 * Role-Aware Landing Pages
 * Different first screens based on user role (Owner, Admin, Accountant, Viewer)
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    CheckCircle2,
    Circle,
    Crown,
    Shield,
    Calculator,
    Eye,
    FileText,
    Users,
    DollarSign,
    TrendingUp,
    Zap,
    ArrowRight,
    Clock
} from 'lucide-react'

interface OnboardingTask {
    id: string
    title: string
    description: string
    category: 'first_win' | 'setup' | 'team' | 'compliance'
    priority: 'high' | 'medium' | 'low'
    estimated_minutes: number
    is_completed: boolean
    action_url?: string
}

interface RoleAwareLandingProps {
    userRole: 'owner' | 'admin' | 'accountant' | 'viewer'
    userName: string
    companyName: string
    onboardingTasks: OnboardingTask[]
    onTaskComplete: (taskId: string) => void
}

export function RoleAwareLanding({
    userRole,
    userName,
    companyName,
    onboardingTasks,
    onTaskComplete
}: RoleAwareLandingProps) {
    const [completedTasks, setCompletedTasks] = useState(
        onboardingTasks.filter(task => task.is_completed).length
    )

    const progress = (completedTasks / onboardingTasks.length) * 100

    const getRoleConfig = () => {
        switch (userRole) {
            case 'owner':
                return {
                    icon: Crown,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
                    title: 'Welcome, Business Owner! 👑',
                    subtitle: 'Your Malaysia-ready accounting system is live',
                    primaryAction: 'Complete Setup Checklist',
                    description: 'Get your business running smoothly with our guided setup'
                }
            case 'admin':
                return {
                    icon: Shield,
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
                    title: 'Welcome, Administrator! 🛡️',
                    subtitle: 'Manage users, permissions, and system settings',
                    primaryAction: 'Manage Team Access',
                    description: 'Set up user roles and ensure proper access controls'
                }
            case 'accountant':
                return {
                    icon: Calculator,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50 dark:bg-green-900/20',
                    title: 'Welcome, Accountant! 📊',
                    subtitle: 'Your MFRS-aligned books are ready',
                    primaryAction: 'Post First Journal Entry',
                    description: 'Start with transactions - everything is pre-configured'
                }
            case 'viewer':
                return {
                    icon: Eye,
                    color: 'text-purple-600',
                    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
                    title: 'Welcome, Viewer! 👁️',
                    subtitle: 'Access real-time financial insights',
                    primaryAction: 'View Dashboard',
                    description: 'Explore reports and KPIs with read-only access'
                }
        }
    }

    const roleConfig = getRoleConfig()
    const RoleIcon = roleConfig.icon

    const getTasksByPriority = (priority: 'high' | 'medium' | 'low') => {
        return onboardingTasks.filter(task => task.priority === priority && !task.is_completed)
    }

    const handleTaskClick = (task: OnboardingTask) => {
        if (task.action_url) {
            window.location.href = task.action_url
        }
        onTaskComplete(task.id)
    }

    // Role-specific quick actions
    const getQuickActions = () => {
        switch (userRole) {
            case 'owner':
                return [
                    { title: 'Send First Invoice', icon: FileText, url: '/invoices/new', time: '3 min' },
                    { title: 'Add Bank Account', icon: DollarSign, url: '/banking/accounts/new', time: '2 min' },
                    { title: 'Invite Team', icon: Users, url: '/settings/team/invite', time: '1 min' }
                ]
            case 'admin':
                return [
                    { title: 'Manage Users', icon: Users, url: '/settings/team', time: '5 min' },
                    { title: 'Configure Permissions', icon: Shield, url: '/settings/permissions', time: '3 min' },
                    { title: 'Security Settings', icon: Shield, url: '/settings/security', time: '2 min' }
                ]
            case 'accountant':
                return [
                    { title: 'Create Journal Entry', icon: FileText, url: '/journal/new', time: '2 min' },
                    { title: 'Review COA', icon: Calculator, url: '/accounts', time: '5 min' },
                    { title: 'Reconcile Bank', icon: DollarSign, url: '/banking/reconcile', time: '10 min' }
                ]
            case 'viewer':
                return [
                    { title: 'View Reports', icon: TrendingUp, url: '/reports', time: '2 min' },
                    { title: 'Dashboard KPIs', icon: TrendingUp, url: '/dashboard', time: '1 min' },
                    { title: 'Trial Balance', icon: Calculator, url: '/reports/trial-balance', time: '1 min' }
                ]
        }
    }

    const quickActions = getQuickActions()

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <Card className={`border-2 ${roleConfig.bgColor}`}>
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <div className="p-3 rounded-full bg-background">
                            <RoleIcon className={`h-8 w-8 ${roleConfig.color}`} />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-2xl">{roleConfig.title}</CardTitle>
                            <p className="text-muted-foreground">{roleConfig.subtitle}</p>
                        </div>
                        <Badge variant="outline" className="text-sm">
                            {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">{roleConfig.description}</p>

                    {/* Progress for Owner role */}
                    {userRole === 'owner' && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Setup Progress</span>
                                <span className="text-sm text-muted-foreground">
                                    {completedTasks}/{onboardingTasks.length} tasks completed
                                </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - Role Specific */}
                <div className="lg:col-span-2 space-y-6">
                    {userRole === 'owner' && (
                        <OwnerSetupChecklist
                            tasks={onboardingTasks}
                            onTaskClick={handleTaskClick}
                        />
                    )}

                    {userRole === 'admin' && (
                        <AdminControlPanel />
                    )}

                    {userRole === 'accountant' && (
                        <AccountantWorkspace />
                    )}

                    {userRole === 'viewer' && (
                        <ViewerDashboard />
                    )}
                </div>

                {/* Sidebar - Quick Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Zap className="h-5 w-5 text-yellow-500" />
                                <span>Quick Actions</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {quickActions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant="outline"
                                    className="w-full justify-between h-auto p-4"
                                    onClick={() => window.location.href = action.url}
                                >
                                    <div className="flex items-center space-x-3">
                                        <action.icon className="h-4 w-4" />
                                        <div className="text-left">
                                            <div className="font-medium">{action.title}</div>
                                            <div className="text-xs text-muted-foreground flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {action.time}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Trust Banner - Non-dismissable */}
                    <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Shield className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-semibold text-green-800 dark:text-green-400">
                                    Audit is ON
                                </span>
                            </div>
                            <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                                <li>• RLS active</li>
                                <li>• Immutable audit trail</li>
                                <li>• MFA available</li>
                            </ul>
                            <Button variant="link" size="sm" className="p-0 h-auto text-green-600">
                                See what this means →
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

// Owner Setup Checklist Component
function OwnerSetupChecklist({
    tasks,
    onTaskClick
}: {
    tasks: OnboardingTask[]
    onTaskClick: (task: OnboardingTask) => void
}) {
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.is_completed)
    const mediumPriorityTasks = tasks.filter(t => t.priority === 'medium' && !t.is_completed)
    const lowPriorityTasks = tasks.filter(t => t.priority === 'low' && !t.is_completed)

    const TaskList = ({ title, tasks, color }: { title: string, tasks: OnboardingTask[], color: string }) => (
        <div className="space-y-3">
            <h3 className="font-semibold flex items-center space-x-2">
                <span>{title}</span>
                <Badge variant="outline" className="text-xs">
                    {tasks.length}
                </Badge>
            </h3>
            {tasks.map(task => (
                <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onTaskClick(task)}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start space-x-3">
                            <Circle className={`h-5 w-5 mt-0.5 ${color}`} />
                            <div className="flex-1">
                                <h4 className="font-medium">{task.title}</h4>
                                <p className="text-sm text-muted-foreground">{task.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <Clock className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                        {task.estimated_minutes} min
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                        {task.category}
                                    </Badge>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    return (
        <Card>
            <CardHeader>
                <CardTitle>Setup Checklist</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Complete these tasks to get the most out of your accounting system
                </p>
            </CardHeader>
            <CardContent className="space-y-6">
                {highPriorityTasks.length > 0 && (
                    <TaskList title="🔥 High Priority" tasks={highPriorityTasks} color="text-red-500" />
                )}
                {mediumPriorityTasks.length > 0 && (
                    <TaskList title="⚡ Medium Priority" tasks={mediumPriorityTasks} color="text-yellow-500" />
                )}
                {lowPriorityTasks.length > 0 && (
                    <TaskList title="📋 When You Have Time" tasks={lowPriorityTasks} color="text-gray-500" />
                )}
            </CardContent>
        </Card>
    )
}

// Admin Control Panel Component
function AdminControlPanel() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    <span>Admin Control Panel</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">User Management</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Invite team members and manage their access levels
                        </p>
                        <Button size="sm">Manage Users</Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">Security Settings</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Configure MFA, session policies, and audit settings
                        </p>
                        <Button size="sm">Security Center</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// Accountant Workspace Component
function AccountantWorkspace() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Calculator className="h-5 w-5 text-green-600" />
                    <span>Accountant Workspace</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
                        <h3 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                            Ready to Start! 🎉
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-300">
                            Your MFRS-aligned Chart of Accounts is set up. All Malaysian tax rates are configured.
                        </p>
                    </div>
                    <Button className="w-full">Post Your First Journal Entry</Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Viewer Dashboard Component
function ViewerDashboard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    <span>Financial Overview</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">RM 0</div>
                        <div className="text-xs text-muted-foreground">Total Revenue</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">RM 0</div>
                        <div className="text-xs text-muted-foreground">Net Profit</div>
                    </div>
                </div>
                <Button className="w-full mt-4" variant="outline">
                    View Detailed Reports
                </Button>
            </CardContent>
        </Card>
    )
}
