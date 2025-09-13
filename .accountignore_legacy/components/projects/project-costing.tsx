'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
    Plus,
    RefreshCw,
    Target,
    Clock,
    DollarSign,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Search,
    Edit,
    Trash2,
    BarChart3,
    Users,
    Calendar,
    FileText,
    Settings
} from 'lucide-react'
import {
    ProjectCostingService,
    Project,
    TimeEntry,
    ProjectExpense,
    ProjectProfitability,
    TimeSummary,
    ProjectBudget,
    CreateProjectInput,
    CreateTimeEntryInput,
    CreateProjectExpenseInput
} from '@/lib/project-costing'
import { format } from 'date-fns'

interface ProjectCostingProps {
    companyId: string
}

export function ProjectCosting({ companyId }: ProjectCostingProps) {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
    const [expenses, setExpenses] = useState<ProjectExpense[]>([])
    const [profitability, setProfitability] = useState<ProjectProfitability | null>(null)
    const [timeSummary, setTimeSummary] = useState<TimeSummary[]>([])
    const [budgets, setBudgets] = useState<ProjectBudget[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreateProjectDialog, setShowCreateProjectDialog] = useState(false)
    const [showCreateTimeDialog, setShowCreateTimeDialog] = useState(false)
    const [showCreateExpenseDialog, setShowCreateExpenseDialog] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Form states
    const [projectForm, setProjectForm] = useState<CreateProjectInput>({
        companyId,
        projectCode: '',
        projectName: '',
        description: '',
        projectType: 'Time & Materials',
        priority: 'Medium',
        budgetAmount: 0
    })

    const [timeForm, setTimeForm] = useState<CreateTimeEntryInput>({
        companyId,
        projectId: '',
        userId: 'current-user', // In real app, get from auth
        entryDate: format(new Date(), 'yyyy-MM-dd'),
        hoursWorked: 0,
        hourlyRate: 0,
        description: '',
        billable: true
    })

    const [expenseForm, setExpenseForm] = useState<CreateProjectExpenseInput>({
        companyId,
        projectId: '',
        expenseDate: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        amount: 0,
        currency: 'USD',
        billable: true
    })

    useEffect(() => {
        loadProjects()
    }, [companyId])

    useEffect(() => {
        if (selectedProject) {
            loadProjectDetails(selectedProject.id)
        }
    }, [selectedProject])

    const loadProjects = async () => {
        setLoading(true)
        try {
            const result = await ProjectCostingService.getProjects(companyId)
            if (result.success && result.projects) {
                setProjects(result.projects)
            }
        } catch (error) {
            console.error('Error loading projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadProjectDetails = async (projectId: string) => {
        try {
            await Promise.all([
                loadTimeEntries(projectId),
                loadExpenses(projectId),
                loadProfitability(projectId),
                loadTimeSummary(projectId),
                loadBudgets(projectId)
            ])
        } catch (error) {
            console.error('Error loading project details:', error)
        }
    }

    const loadTimeEntries = async (projectId: string) => {
        try {
            const result = await ProjectCostingService.getTimeEntries(projectId)
            if (result.success && result.timeEntries) {
                setTimeEntries(result.timeEntries)
            }
        } catch (error) {
            console.error('Error loading time entries:', error)
        }
    }

    const loadExpenses = async (projectId: string) => {
        try {
            const result = await ProjectCostingService.getProjectExpenses(projectId)
            if (result.success && result.expenses) {
                setExpenses(result.expenses)
            }
        } catch (error) {
            console.error('Error loading expenses:', error)
        }
    }

    const loadProfitability = async (projectId: string) => {
        try {
            const result = await ProjectCostingService.getProjectProfitability(projectId)
            if (result.success && result.profitability) {
                setProfitability(result.profitability)
            }
        } catch (error) {
            console.error('Error loading profitability:', error)
        }
    }

    const loadTimeSummary = async (projectId: string) => {
        try {
            const result = await ProjectCostingService.getProjectTimeSummary(projectId)
            if (result.success && result.timeSummary) {
                setTimeSummary(result.timeSummary)
            }
        } catch (error) {
            console.error('Error loading time summary:', error)
        }
    }

    const loadBudgets = async (projectId: string) => {
        try {
            const result = await ProjectCostingService.getProjectBudgets(projectId)
            if (result.success && result.budgets) {
                setBudgets(result.budgets)
            }
        } catch (error) {
            console.error('Error loading budgets:', error)
        }
    }

    const handleCreateProject = async () => {
        try {
            const result = await ProjectCostingService.createProject(projectForm)
            if (result.success) {
                setShowCreateProjectDialog(false)
                setProjectForm({
                    companyId,
                    projectCode: '',
                    projectName: '',
                    description: '',
                    projectType: 'Time & Materials',
                    priority: 'Medium',
                    budgetAmount: 0
                })
                loadProjects()
            }
        } catch (error) {
            console.error('Error creating project:', error)
        }
    }

    const handleCreateTimeEntry = async () => {
        if (!selectedProject) return

        try {
            const result = await ProjectCostingService.createTimeEntry({
                ...timeForm,
                projectId: selectedProject.id
            })
            if (result.success) {
                setShowCreateTimeDialog(false)
                setTimeForm({
                    companyId,
                    projectId: '',
                    userId: 'current-user',
                    entryDate: format(new Date(), 'yyyy-MM-dd'),
                    hoursWorked: 0,
                    hourlyRate: 0,
                    description: '',
                    billable: true
                })
                loadProjectDetails(selectedProject.id)
            }
        } catch (error) {
            console.error('Error creating time entry:', error)
        }
    }

    const handleCreateExpense = async () => {
        if (!selectedProject) return

        try {
            const result = await ProjectCostingService.createProjectExpense({
                ...expenseForm,
                projectId: selectedProject.id
            })
            if (result.success) {
                setShowCreateExpenseDialog(false)
                setExpenseForm({
                    companyId,
                    projectId: '',
                    expenseDate: format(new Date(), 'yyyy-MM-dd'),
                    description: '',
                    amount: 0,
                    currency: 'USD',
                    billable: true
                })
                loadProjectDetails(selectedProject.id)
            }
        } catch (error) {
            console.error('Error creating expense:', error)
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount)
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Active': return 'text-green-600 bg-green-50'
            case 'Completed': return 'text-blue-600 bg-blue-50'
            case 'On Hold': return 'text-yellow-600 bg-yellow-50'
            case 'Cancelled': return 'text-red-600 bg-red-50'
            case 'Planning': return 'text-purple-600 bg-purple-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Critical': return 'text-red-600 bg-red-50'
            case 'High': return 'text-orange-600 bg-orange-50'
            case 'Medium': return 'text-yellow-600 bg-yellow-50'
            case 'Low': return 'text-green-600 bg-green-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    const filteredProjects = projects.filter(project =>
        project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projectCode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Project Costing</h2>
                    <p className="text-muted-foreground">
                        Track project costs, time, and profitability
                    </p>
                </div>
                <div className="flex space-x-2">
                    <Button variant="outline" onClick={loadProjects} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Dialog open={showCreateProjectDialog} onOpenChange={setShowCreateProjectDialog}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New Project</DialogTitle>
                                <DialogDescription>
                                    Set up a new project for cost tracking
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="projectCode">Project Code</Label>
                                        <Input
                                            id="projectCode"
                                            value={projectForm.projectCode}
                                            onChange={(e) => setProjectForm(prev => ({ ...prev, projectCode: e.target.value }))}
                                            placeholder="e.g., PRJ-001"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="projectName">Project Name</Label>
                                        <Input
                                            id="projectName"
                                            value={projectForm.projectName}
                                            onChange={(e) => setProjectForm(prev => ({ ...prev, projectName: e.target.value }))}
                                            placeholder="e.g., Website Redesign"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="description">Description</Label>
                                    <Input
                                        id="description"
                                        value={projectForm.description}
                                        onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                                        placeholder="Project description"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="projectType">Project Type</Label>
                                        <Select
                                            value={projectForm.projectType}
                                            onValueChange={(value) => setProjectForm(prev => ({ ...prev, projectType: value as any }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Fixed Price">Fixed Price</SelectItem>
                                                <SelectItem value="Time & Materials">Time & Materials</SelectItem>
                                                <SelectItem value="Cost Plus">Cost Plus</SelectItem>
                                                <SelectItem value="Retainer">Retainer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="priority">Priority</Label>
                                        <Select
                                            value={projectForm.priority}
                                            onValueChange={(value) => setProjectForm(prev => ({ ...prev, priority: value as any }))}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Low">Low</SelectItem>
                                                <SelectItem value="Medium">Medium</SelectItem>
                                                <SelectItem value="High">High</SelectItem>
                                                <SelectItem value="Critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={projectForm.startDate || ''}
                                            onChange={(e) => setProjectForm(prev => ({ ...prev, startDate: e.target.value }))}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="budgetAmount">Budget Amount</Label>
                                        <Input
                                            id="budgetAmount"
                                            type="number"
                                            step="0.01"
                                            value={projectForm.budgetAmount}
                                            onChange={(e) => setProjectForm(prev => ({ ...prev, budgetAmount: parseFloat(e.target.value) }))}
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-2">
                                    <Button variant="outline" onClick={() => setShowCreateProjectDialog(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleCreateProject}>
                                        Create Project
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Projects List */}
            <Card>
                <CardHeader>
                    <CardTitle>Projects</CardTitle>
                    <CardDescription>
                        Select a project to view detailed costing information
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredProjects.length > 0 ? (
                        <div className="space-y-4">
                            {filteredProjects.map((project) => (
                                <Card
                                    key={project.id}
                                    className={`cursor-pointer transition-colors ${selectedProject?.id === project.id ? 'ring-2 ring-blue-500' : 'hover:bg-muted/50'
                                        }`}
                                    onClick={() => setSelectedProject(project)}
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <Target className="h-5 w-5 text-blue-500" />
                                                    <div>
                                                        <div className="font-medium">{project.projectName}</div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {project.projectCode} • {project.projectType}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                    <span>Budget: {formatCurrency(project.budgetAmount)}</span>
                                                    <span>Actual: {formatCurrency(project.actualCost)}</span>
                                                    <span>Billed: {formatCurrency(project.billedAmount)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Badge className={getStatusColor(project.status)}>
                                                    {project.status}
                                                </Badge>
                                                <Badge className={getPriorityColor(project.priority)}>
                                                    {project.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2">No Projects Found</h3>
                            <p className="text-muted-foreground mb-4">
                                Create your first project to start tracking costs
                            </p>
                            <Button onClick={() => setShowCreateProjectDialog(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Project
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Project Details */}
            {selectedProject && (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="time">Time Tracking</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="budgets">Budgets</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-4">
                        {/* Profitability Summary */}
                        {profitability && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Profitability</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-600">
                                                {formatCurrency(profitability.totalBudget)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Budget</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-orange-600">
                                                {formatCurrency(profitability.totalActualCost)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Actual Cost</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatCurrency(profitability.totalBilled)}
                                            </div>
                                            <div className="text-sm text-muted-foreground">Total Billed</div>
                                        </div>
                                        <div className="text-center">
                                            <div className={`text-2xl font-bold ${profitability.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                                                }`}>
                                                {profitability.profitMargin.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-muted-foreground">Profit Margin</div>
                                        </div>
                                    </div>
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-sm mb-2">
                                            <span>Project Completion</span>
                                            <span>{profitability.completionPercentage.toFixed(1)}%</span>
                                        </div>
                                        <Progress value={profitability.completionPercentage} className="h-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Time Summary */}
                        {timeSummary.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Time Summary</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>User</TableHead>
                                                    <TableHead className="text-right">Total Hours</TableHead>
                                                    <TableHead className="text-right">Billable Hours</TableHead>
                                                    <TableHead className="text-right">Total Cost</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {timeSummary.map((summary, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{summary.userName}</TableCell>
                                                        <TableCell className="text-right">{summary.totalHours.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">{summary.billableHours.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(summary.totalCost)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Time Tracking Tab */}
                    <TabsContent value="time" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Time Entries</CardTitle>
                                        <CardDescription>
                                            Track time spent on {selectedProject.projectName}
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => setShowCreateTimeDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Time Entry
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {timeEntries.length > 0 ? (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Hours</TableHead>
                                                    <TableHead>Rate</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {timeEntries.map((entry) => (
                                                    <TableRow key={entry.id}>
                                                        <TableCell>
                                                            {format(new Date(entry.entryDate), 'MMM dd, yyyy')}
                                                        </TableCell>
                                                        <TableCell>{entry.hoursWorked.toFixed(2)}</TableCell>
                                                        <TableCell>{formatCurrency(entry.hourlyRate)}</TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatCurrency(entry.totalCost)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={entry.approved ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}>
                                                                {entry.approved ? 'Approved' : 'Pending'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end space-x-1">
                                                                <Button variant="ghost" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Time Entries</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Start tracking time for this project
                                        </p>
                                        <Button onClick={() => setShowCreateTimeDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Time Entry
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Expenses Tab */}
                    <TabsContent value="expenses" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Project Expenses</CardTitle>
                                        <CardDescription>
                                            Track expenses for {selectedProject.projectName}
                                        </CardDescription>
                                    </div>
                                    <Button onClick={() => setShowCreateExpenseDialog(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Expense
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {expenses.length > 0 ? (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Date</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead className="text-right">Amount</TableHead>
                                                    <TableHead>Status</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {expenses.map((expense) => (
                                                    <TableRow key={expense.id}>
                                                        <TableCell>
                                                            {format(new Date(expense.expenseDate), 'MMM dd, yyyy')}
                                                        </TableCell>
                                                        <TableCell className="max-w-xs truncate">
                                                            {expense.description}
                                                        </TableCell>
                                                        <TableCell>
                                                            {expense.category || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium">
                                                            {formatCurrency(expense.amount)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge className={expense.approved ? 'text-green-600 bg-green-50' : 'text-yellow-600 bg-yellow-50'}>
                                                                {expense.approved ? 'Approved' : 'Pending'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end space-x-1">
                                                                <Button variant="ghost" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="sm">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Expenses</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Track expenses for this project
                                        </p>
                                        <Button onClick={() => setShowCreateExpenseDialog(true)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Expense
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Budgets Tab */}
                    <TabsContent value="budgets" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Project Budgets</CardTitle>
                                <CardDescription>
                                    Budget vs actual analysis for {selectedProject.projectName}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {budgets.length > 0 ? (
                                    <div className="border rounded-lg">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Budget Type</TableHead>
                                                    <TableHead className="text-right">Budget</TableHead>
                                                    <TableHead className="text-right">Actual</TableHead>
                                                    <TableHead className="text-right">Variance</TableHead>
                                                    <TableHead className="text-right">Variance %</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {budgets.map((budget) => (
                                                    <TableRow key={budget.id}>
                                                        <TableCell className="font-medium">{budget.budgetType}</TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(budget.budgetAmount)}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {formatCurrency(budget.actualAmount)}
                                                        </TableCell>
                                                        <TableCell className={`text-right font-medium ${budget.varianceAmount >= 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {formatCurrency(budget.varianceAmount)}
                                                        </TableCell>
                                                        <TableCell className={`text-right font-medium ${budget.variancePercentage >= 0 ? 'text-green-600' : 'text-red-600'
                                                            }`}>
                                                            {budget.variancePercentage.toFixed(1)}%
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">No Budgets</h3>
                                        <p className="text-muted-foreground">
                                            Set up budgets for this project
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Create Time Entry Dialog */}
            <Dialog open={showCreateTimeDialog} onOpenChange={setShowCreateTimeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Time Entry</DialogTitle>
                        <DialogDescription>
                            Log time spent on {selectedProject?.projectName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="entryDate">Date</Label>
                            <Input
                                id="entryDate"
                                type="date"
                                value={timeForm.entryDate}
                                onChange={(e) => setTimeForm(prev => ({ ...prev, entryDate: e.target.value }))}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="hoursWorked">Hours Worked</Label>
                                <Input
                                    id="hoursWorked"
                                    type="number"
                                    step="0.25"
                                    value={timeForm.hoursWorked}
                                    onChange={(e) => setTimeForm(prev => ({ ...prev, hoursWorked: parseFloat(e.target.value) }))}
                                />
                            </div>
                            <div>
                                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                                <Input
                                    id="hourlyRate"
                                    type="number"
                                    step="0.01"
                                    value={timeForm.hourlyRate}
                                    onChange={(e) => setTimeForm(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={timeForm.description}
                                onChange={(e) => setTimeForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What did you work on?"
                            />
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowCreateTimeDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateTimeEntry}>
                                Add Time Entry
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Create Expense Dialog */}
            <Dialog open={showCreateExpenseDialog} onOpenChange={setShowCreateExpenseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Project Expense</DialogTitle>
                        <DialogDescription>
                            Record an expense for {selectedProject?.projectName}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="expenseDate">Date</Label>
                            <Input
                                id="expenseDate"
                                type="date"
                                value={expenseForm.expenseDate}
                                onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="expenseDescription">Description</Label>
                            <Input
                                id="expenseDescription"
                                value={expenseForm.description}
                                onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="What was this expense for?"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="expenseCategory">Category</Label>
                                <Select
                                    value={expenseForm.category || ''}
                                    onValueChange={(value) => setExpenseForm(prev => ({ ...prev, category: value as any }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Travel">Travel</SelectItem>
                                        <SelectItem value="Meals">Meals</SelectItem>
                                        <SelectItem value="Equipment">Equipment</SelectItem>
                                        <SelectItem value="Software">Software</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="expenseAmount">Amount</Label>
                                <Input
                                    id="expenseAmount"
                                    type="number"
                                    step="0.01"
                                    value={expenseForm.amount}
                                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                            <Button variant="outline" onClick={() => setShowCreateExpenseDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateExpense}>
                                Add Expense
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
