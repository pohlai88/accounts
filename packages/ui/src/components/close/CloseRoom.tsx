import * as React from "react";
import { cn } from "../../utils";
import { CheckCircle, Clock, Lock, AlertTriangle, FileText, Download, Users, Calendar } from "lucide-react";

// SSOT Compliant Close Room Component
// Dedicated month-end workspace with comprehensive close management

export interface CloseTask {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    priority: 'low' | 'medium' | 'high' | 'critical';
    owner: string;
    ownerName?: string;
    dueDate: string;
    completedAt?: string;
    dependencies?: string[];
    category: 'reconciliation' | 'adjustments' | 'reports' | 'compliance' | 'review';
    estimatedHours?: number;
    actualHours?: number;
    notes?: string;
}

export interface ClosePeriod {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    status: 'open' | 'closing' | 'locked' | 'closed';
    closeDate?: string;
    closedBy?: string;
    closedByName?: string;
    tasks: CloseTask[];
    metrics: {
        totalTasks: number;
        completedTasks: number;
        overdueTasks: number;
        totalHours: number;
        actualHours: number;
    };
}

export interface CloseRoomProps {
    currentPeriod: ClosePeriod;
    onTaskUpdate?: (taskId: string, updates: Partial<CloseTask>) => Promise<void>;
    onPeriodLock?: (periodId: string) => Promise<void>;
    onExportPack?: (periodId: string) => Promise<void>;
    onAddTask?: (task: Omit<CloseTask, 'id'>) => Promise<void>;
    className?: string;
}

export const CloseRoom: React.FC<CloseRoomProps> = ({
    currentPeriod,
    onTaskUpdate,
    onPeriodLock,
    onExportPack,
    onAddTask,
    className
}) => {
    const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
    const [selectedStatus, setSelectedStatus] = React.useState<string>('all');
    const [showAddTask, setShowAddTask] = React.useState(false);

    // Filter tasks based on selected filters
    const filteredTasks = React.useMemo(() => {
        return currentPeriod.tasks.filter(task => {
            const categoryMatch = selectedCategory === 'all' || task.category === selectedCategory;
            const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
            return categoryMatch && statusMatch;
        });
    }, [currentPeriod.tasks, selectedCategory, selectedStatus]);

    // Calculate progress metrics
    const progressMetrics = React.useMemo(() => {
        const total = currentPeriod.tasks.length;
        const completed = currentPeriod.tasks.filter(t => t.status === 'completed').length;
        const overdue = currentPeriod.tasks.filter(t =>
            t.status !== 'completed' && new Date(t.dueDate) < new Date()
        ).length;
        const totalHours = currentPeriod.tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
        const actualHours = currentPeriod.tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);

        return { total, completed, overdue, totalHours, actualHours };
    }, [currentPeriod.tasks]);

    const getStatusIcon = (status: CloseTask['status']) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />;
            case 'in_progress': return <Clock className="h-4 w-4 text-[var(--sys-status-warning)]" />;
            case 'blocked': return <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />;
            default: return <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />;
        }
    };

    const getPriorityColor = (priority: CloseTask['priority']) => {
        switch (priority) {
            case 'critical': return 'bg-[var(--sys-status-error)] text-white';
            case 'high': return 'bg-[var(--sys-status-warning)] text-white';
            case 'medium': return 'bg-[var(--sys-accent)] text-white';
            default: return 'bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]';
        }
    };

    const getCategoryIcon = (category: CloseTask['category']) => {
        switch (category) {
            case 'reconciliation': return <FileText className="h-4 w-4" />;
            case 'adjustments': return <AlertTriangle className="h-4 w-4" />;
            case 'reports': return <Download className="h-4 w-4" />;
            case 'compliance': return <Lock className="h-4 w-4" />;
            case 'review': return <Users className="h-4 w-4" />;
            default: return <FileText className="h-4 w-4" />;
        }
    };

    const handleTaskStatusChange = async (taskId: string, newStatus: CloseTask['status']) => {
        if (onTaskUpdate) {
            await onTaskUpdate(taskId, {
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
            });
        }
    };

    const handlePeriodLock = async () => {
        if (onPeriodLock) {
            await onPeriodLock(currentPeriod.id);
        }
    };

    const handleExportPack = async () => {
        if (onExportPack) {
            await onExportPack(currentPeriod.id);
        }
    };

    const isPeriodLocked = currentPeriod.status === 'locked' || currentPeriod.status === 'closed';
    const canLock = currentPeriod.tasks.every(task => task.status === 'completed') && !isPeriodLocked;

    return (
        <div className={cn("bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg", className)}>
            {/* Header */}
            <div className="p-6 border-b border-[var(--sys-border-hairline)]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            Close Room
                        </h1>
                        <p className="text-[var(--sys-text-secondary)] mt-1">
                            {currentPeriod.name} • {new Date(currentPeriod.startDate).toLocaleDateString()} - {new Date(currentPeriod.endDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[var(--sys-text-secondary)]" />
                            <span className="text-sm text-[var(--sys-text-secondary)]">
                                {currentPeriod.status.charAt(0).toUpperCase() + currentPeriod.status.slice(1)}
                            </span>
                        </div>

                        {!isPeriodLocked && (
                            <button
                                onClick={() => setShowAddTask(true)}
                                className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Add new close task"
                            >
                                Add Task
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {progressMetrics.completed}/{progressMetrics.total}
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Tasks Complete</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-status-error)]">
                            {progressMetrics.overdue}
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Overdue</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {Math.round((progressMetrics.completed / progressMetrics.total) * 100)}%
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Progress</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {progressMetrics.actualHours}h
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Actual Hours</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {progressMetrics.totalHours}h
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Estimated</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="p-4 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
                <div className="flex flex-wrap gap-4">
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        aria-label="Filter by category"
                    >
                        <option value="all">All Categories</option>
                        <option value="reconciliation">Reconciliation</option>
                        <option value="adjustments">Adjustments</option>
                        <option value="reports">Reports</option>
                        <option value="compliance">Compliance</option>
                        <option value="review">Review</option>
                    </select>

                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        aria-label="Filter by status"
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Task List */}
            <div className="divide-y divide-[var(--sys-border-hairline)]">
                {filteredTasks.map((task) => (
                    <div key={task.id} className="p-4 hover:bg-[var(--sys-bg-subtle)]">
                        <div className="flex items-start gap-4">
                            <div className="flex items-center gap-2 mt-1">
                                {getStatusIcon(task.status)}
                                {getCategoryIcon(task.category)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-medium text-[var(--sys-text-primary)]">
                                        {task.title}
                                    </h3>
                                    <span className={cn(
                                        "px-2 py-1 text-xs font-medium rounded-full",
                                        getPriorityColor(task.priority)
                                    )}>
                                        {task.priority}
                                    </span>
                                </div>

                                <p className="text-sm text-[var(--sys-text-secondary)] mb-3">
                                    {task.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-[var(--sys-text-tertiary)]">
                                    <span>Owner: {task.ownerName || task.owner}</span>
                                    <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                    {task.estimatedHours && (
                                        <span>Est: {task.estimatedHours}h</span>
                                    )}
                                    {task.actualHours && (
                                        <span>Actual: {task.actualHours}h</span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!isPeriodLocked && (
                                    <select
                                        value={task.status}
                                        onChange={(e) => handleTaskStatusChange(task.id, e.target.value as CloseTask['status'])}
                                        className="px-2 py-1 text-sm border border-[var(--sys-border-hairline)] rounded bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                        aria-label={`Update status for ${task.title}`}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-[var(--sys-text-secondary)]">
                        {filteredTasks.length} of {currentPeriod.tasks.length} tasks shown
                    </div>

                    <div className="flex items-center gap-3">
                        {canLock && (
                            <button
                                onClick={handlePeriodLock}
                                className="px-4 py-2 bg-[var(--sys-status-warning)] text-white rounded-md hover:bg-[var(--sys-status-warning)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-warning)]"
                                aria-label="Lock period"
                            >
                                <Lock className="h-4 w-4 mr-2 inline" />
                                Lock Period
                            </button>
                        )}

                        {isPeriodLocked && (
                            <button
                                onClick={handleExportPack}
                                className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                aria-label="Export compliance pack"
                            >
                                <Download className="h-4 w-4 mr-2 inline" />
                                Export Pack
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloseRoom;
