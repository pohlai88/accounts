import * as React from "react";
import { cn } from "../../utils";
import { CheckCircle, Clock, Lock, AlertTriangle, ArrowRight, ArrowLeft, Home } from "lucide-react";
import { CloseRoom } from "./CloseRoom";
import { CloseChecklist } from "./CloseChecklist";
import { LockStates } from "./LockStates";
import { AccrualHelpers } from "./AccrualHelpers";
import { AdjustingEntries } from "./AdjustingEntries";
import { ExportPackBuilder } from "./ExportPackBuilder";

// SSOT Compliant Close Workflow Component
// Master workflow orchestrator for month-end close process

export interface CloseStep {
    id: string;
    title: string;
    description: string;
    component: 'close-room' | 'checklist' | 'lock-states' | 'accruals' | 'adjusting-entries' | 'export-pack';
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    required: boolean;
    estimatedHours: number;
    actualHours?: number;
    completedAt?: string;
    completedBy?: string;
    dependencies: string[];
    notes?: string;
}

export interface CloseWorkflowData {
    currentPeriod: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        status: 'open' | 'closing' | 'locked' | 'closed';
    };
    steps: CloseStep[];
    currentStepId: string;
    progress: {
        completedSteps: number;
        totalSteps: number;
        totalHours: number;
        actualHours: number;
    };
}

export interface CloseWorkflowProps {
    workflowData: CloseWorkflowData;
    onStepChange?: (stepId: string, data: CloseWorkflowData) => void;
    onStepComplete?: (stepId: string) => void;
    onWorkflowComplete?: () => void;
    className?: string;
}

export const CloseWorkflow: React.FC<CloseWorkflowProps> = ({
    workflowData,
    onStepChange,
    onStepComplete,
    onWorkflowComplete,
    className
}) => {
    const [currentStep, setCurrentStep] = React.useState<CloseStep | null>(null);
    const [workflowState, setWorkflowState] = React.useState<CloseWorkflowData>(workflowData);

    // Update current step when workflow data changes
    React.useEffect(() => {
        const step = workflowState.steps.find(s => s.id === workflowState.currentStepId);
        setCurrentStep(step || null);
    }, [workflowState]);

    // Calculate progress metrics
    const progressMetrics = React.useMemo(() => {
        const total = workflowState.steps.length;
        const completed = workflowState.steps.filter(s => s.status === 'completed').length;
        const inProgress = workflowState.steps.filter(s => s.status === 'in_progress').length;
        const blocked = workflowState.steps.filter(s => s.status === 'blocked').length;
        const totalHours = workflowState.steps.reduce((sum, s) => sum + s.estimatedHours, 0);
        const actualHours = workflowState.steps.reduce((sum, s) => sum + (s.actualHours || 0), 0);

        return { total, completed, inProgress, blocked, totalHours, actualHours };
    }, [workflowState.steps]);

    const getStepIcon = (status: CloseStep['status']) => {
        switch (status) {
            case 'completed': return <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />;
            case 'in_progress': return <Clock className="h-5 w-5 text-[var(--sys-status-warning)]" />;
            case 'blocked': return <AlertTriangle className="h-5 w-5 text-[var(--sys-status-error)]" />;
            default: return <Clock className="h-5 w-5 text-[var(--sys-text-tertiary)]" />;
        }
    };

    const getStepStatusColor = (status: CloseStep['status']) => {
        switch (status) {
            case 'completed': return 'bg-[var(--sys-status-success)] text-white';
            case 'in_progress': return 'bg-[var(--sys-status-warning)] text-white';
            case 'blocked': return 'bg-[var(--sys-status-error)] text-white';
            default: return 'bg-[var(--sys-bg-subtle)] text-[var(--sys-text-secondary)]';
        }
    };

    const handleStepClick = (stepId: string) => {
        const step = workflowState.steps.find(s => s.id === stepId);
        if (step && onStepChange) {
            const updatedData = { ...workflowState, currentStepId: stepId };
            setWorkflowState(updatedData);
            onStepChange(stepId, updatedData);
        }
    };

    const handleStepComplete = (stepId: string) => {
        if (onStepComplete) {
            onStepComplete(stepId);
        }
    };

    const handleNextStep = () => {
        const currentIndex = workflowState.steps.findIndex(s => s.id === workflowState.currentStepId);
        if (currentIndex < workflowState.steps.length - 1) {
            const nextStep = workflowState.steps[currentIndex + 1];
            if (nextStep) {
                handleStepClick(nextStep.id);
            }
        }
    };

    const handlePrevStep = () => {
        const currentIndex = workflowState.steps.findIndex(s => s.id === workflowState.currentStepId);
        if (currentIndex > 0) {
            const prevStep = workflowState.steps[currentIndex - 1];
            if (prevStep) {
                handleStepClick(prevStep.id);
            }
        }
    };

    const handleWorkflowComplete = () => {
        if (onWorkflowComplete) {
            onWorkflowComplete();
        }
    };

    const isWorkflowComplete = progressMetrics.completed === progressMetrics.total;
    const canProceed = currentStep?.status === 'completed' || currentStep?.status === 'in_progress';

    // Render current step component
    const renderCurrentStep = () => {
        if (!currentStep) return null;

        const commonProps = {
            className: "mt-6"
        };

        switch (currentStep.component) {
            case 'close-room':
                return (
                    <CloseRoom
                        {...commonProps}
                        currentPeriod={{
                            ...workflowState.currentPeriod,
                            tasks: [], // This should come from props
                            metrics: {
                                totalTasks: 0,
                                completedTasks: 0,
                                overdueTasks: 0,
                                totalHours: 0,
                                actualHours: 0
                            }
                        }}
                        onTaskUpdate={async () => { }}
                        onPeriodLock={async () => { }}
                        onExportPack={async () => { }}
                        onAddTask={async () => { }}
                    />
                );
            case 'checklist':
                return (
                    <CloseChecklist
                        {...commonProps}
                        items={[]} // This should come from props
                        onItemUpdate={async () => { }}
                        onBulkUpdate={async () => { }}
                        onAddItem={async () => { }}
                        onRemoveItem={async () => { }}
                    />
                );
            case 'lock-states':
                return (
                    <LockStates
                        {...commonProps}
                        currentPeriod={workflowState.currentPeriod}
                        locks={[]} // This should come from props
                        lockRules={[]} // This should come from props
                        onLockPeriod={async () => { }}
                        onUnlockPeriod={async () => { }}
                        onUpdateLockRule={async () => { }}
                    />
                );
            case 'accruals':
                return (
                    <AccrualHelpers
                        {...commonProps}
                        accruals={[]} // This should come from props
                        depreciations={[]} // This should come from props
                        onCalculateAccruals={async () => { }}
                        onPostAccrual={async () => { }}
                        onReverseAccrual={async () => { }}
                        onCalculateDepreciation={async () => { }}
                        onPostDepreciation={async () => { }}
                        onAddAccrual={async () => { }}
                        onAddDepreciation={async () => { }}
                    />
                );
            case 'adjusting-entries':
                return (
                    <AdjustingEntries
                        {...commonProps}
                        entries={[]} // This should come from props
                        onAddEntry={async () => { }}
                        onUpdateEntry={async () => { }}
                        onPostEntry={async () => { }}
                        onReverseEntry={async () => { }}
                        onDeleteEntry={async () => { }}
                        onAddLine={async () => { }}
                        onUpdateLine={async () => { }}
                        onDeleteLine={async () => { }}
                    />
                );
            case 'export-pack':
                return (
                    <ExportPackBuilder
                        {...commonProps}
                        currentPack={undefined} // This should come from props
                        availableDocuments={[]} // This should come from props
                        onGenerateDocument={async () => { }}
                        onGeneratePack={async () => { }}
                        onDownloadDocument={async () => { }}
                        onDownloadPack={async () => { }}
                        onUpdatePack={async () => { }}
                        onPreviewDocument={async () => { }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className={cn("bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg", className)}>
            {/* Header */}
            <div className="p-6 border-b border-[var(--sys-border-hairline)]">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            Close Workflow
                        </h1>
                        <p className="text-[var(--sys-text-secondary)] mt-1">
                            {workflowState.currentPeriod.name} • {new Date(workflowState.currentPeriod.startDate).toLocaleDateString()} - {new Date(workflowState.currentPeriod.endDate).toLocaleDateString()}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-[var(--sys-text-secondary)]" />
                            <span className="text-sm text-[var(--sys-text-secondary)]">
                                {workflowState.currentPeriod.status.charAt(0).toUpperCase() + workflowState.currentPeriod.status.slice(1)}
                            </span>
                        </div>

                        {isWorkflowComplete && (
                            <button
                                onClick={handleWorkflowComplete}
                                className="px-4 py-2 bg-[var(--sys-status-success)] text-white rounded-md hover:bg-[var(--sys-status-success)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-status-success)]"
                                aria-label="Complete workflow"
                            >
                                <CheckCircle className="h-4 w-4 mr-2 inline" />
                                Complete Workflow
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Overview */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {progressMetrics.completed}/{progressMetrics.total}
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Steps Complete</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-status-warning)]">
                            {progressMetrics.inProgress}
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">In Progress</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-status-error)]">
                            {progressMetrics.blocked}
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Blocked</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                            {Math.round((progressMetrics.completed / progressMetrics.total) * 100)}%
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Progress</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-lg font-bold text-[var(--sys-text-primary)]">
                            {progressMetrics.actualHours}h
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Actual Hours</div>
                    </div>

                    <div className="bg-[var(--sys-bg-subtle)] p-4 rounded-lg">
                        <div className="text-lg font-bold text-[var(--sys-text-primary)]">
                            {progressMetrics.totalHours}h
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Estimated</div>
                    </div>
                </div>
            </div>

            {/* Steps Navigation */}
            <div className="p-6 border-b border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-[var(--sys-text-primary)]">
                        Workflow Steps
                    </h2>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevStep}
                            disabled={workflowState.steps.findIndex(s => s.id === workflowState.currentStepId) === 0}
                            className="p-2 text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-primary)] rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            aria-label="Previous step"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleNextStep}
                            disabled={workflowState.steps.findIndex(s => s.id === workflowState.currentStepId) === workflowState.steps.length - 1}
                            className="p-2 text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] hover:bg-[var(--sys-bg-primary)] rounded disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            aria-label="Next step"
                        >
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {workflowState.steps.map((step) => (
                        <button
                            key={step.id}
                            onClick={() => handleStepClick(step.id)}
                            className={cn(
                                "p-4 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]",
                                step.id === workflowState.currentStepId
                                    ? "bg-[var(--sys-accent)] text-white"
                                    : "bg-[var(--sys-bg-primary)] hover:bg-[var(--sys-bg-subtle)]"
                            )}
                            aria-label={`Go to ${step.title}`}
                        >
                            <div className="flex items-center gap-2 mb-2">
                                {getStepIcon(step.status)}
                                <span className="text-xs font-medium">
                                    {step.id === workflowState.currentStepId ? 'CURRENT' : step.status.toUpperCase()}
                                </span>
                            </div>
                            <h3 className="font-medium text-sm mb-1">
                                {step.title}
                            </h3>
                            <p className="text-xs opacity-75">
                                {step.description}
                            </p>
                            <div className="mt-2 text-xs opacity-75">
                                Est: {step.estimatedHours}h
                                {step.actualHours && (
                                    <span className="ml-2">Actual: {step.actualHours}h</span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Current Step Content */}
            <div className="p-6">
                {currentStep && (
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            {getStepIcon(currentStep.status)}
                            <div>
                                <h2 className="text-xl font-semibold text-[var(--sys-text-primary)]">
                                    {currentStep.title}
                                </h2>
                                <p className="text-[var(--sys-text-secondary)]">
                                    {currentStep.description}
                                </p>
                            </div>
                            <span className={cn(
                                "px-3 py-1 text-sm font-medium rounded-full ml-auto",
                                getStepStatusColor(currentStep.status)
                            )}>
                                {currentStep.status.toUpperCase()}
                            </span>
                        </div>

                        {renderCurrentStep()}
                    </div>
                )}
            </div>

            {/* Navigation Footer */}
            <div className="p-4 border-t border-[var(--sys-border-hairline)] bg-[var(--sys-bg-subtle)]">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-[var(--sys-text-secondary)]">
                        Step {workflowState.steps.findIndex(s => s.id === workflowState.currentStepId) + 1} of {workflowState.steps.length}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handlePrevStep}
                            disabled={workflowState.steps.findIndex(s => s.id === workflowState.currentStepId) === 0}
                            className="px-4 py-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-primary)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            aria-label="Previous step"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2 inline" />
                            Previous
                        </button>
                        <button
                            onClick={handleNextStep}
                            disabled={workflowState.steps.findIndex(s => s.id === workflowState.currentStepId) === workflowState.steps.length - 1}
                            className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                            aria-label="Next step"
                        >
                            Next
                            <ArrowRight className="h-4 w-4 ml-2 inline" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloseWorkflow;
