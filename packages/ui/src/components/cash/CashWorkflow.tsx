"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@aibos/ui/utils";
import { Button } from "@aibos/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Badge } from "@aibos/ui/Badge";
import { Alert, AlertDescription } from "@aibos/ui/Alert";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  Building2,
  Upload,
  Target,
  Settings,
  Activity,
  TrendingUp,
  Loader2,
} from "lucide-react";

// Import the cash workflow components
import { BankConnection } from "./BankConnection";
import { TransactionImport } from "./TransactionImport";
import { ReconciliationCanvas } from "./ReconciliationCanvas";
import { RuleEngine } from "./RuleEngine";
import { BankFeedManagement } from "./BankFeedManagement";
import { CashFlowAnalysis } from "./CashFlowAnalysis";

// Types
interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isCompleted: boolean;
  isActive: boolean;
  isOptional: boolean;
  estimatedTime: string;
  prerequisites: string[];
}

interface WorkflowData {
  currentStep: number;
  completedSteps: string[];
  bankAccounts: any[];
  transactions: any[];
  matches: any[];
  rules: any[];
  feeds: any[];
  cashFlowData: any[];
}

interface CashWorkflowProps {
  onWorkflowComplete?: (data: WorkflowData) => void;
  onStepChange?: (stepId: string, data: any) => void;
  className?: string;
}

// Workflow steps configuration
const workflowSteps: WorkflowStep[] = [
  {
    id: "bank-connection",
    title: "Bank Connection",
    description: "Connect your bank accounts for automatic transaction import",
    component: BankConnection,
    isCompleted: false,
    isActive: true,
    isOptional: false,
    estimatedTime: "5 min",
    prerequisites: [],
  },
  {
    id: "transaction-import",
    title: "Transaction Import",
    description: "Import and categorize transactions from bank feeds",
    component: TransactionImport,
    isCompleted: false,
    isActive: false,
    isOptional: false,
    estimatedTime: "10 min",
    prerequisites: ["bank-connection"],
  },
  {
    id: "reconciliation-canvas",
    title: "Reconciliation Canvas",
    description: "Match bank transactions with accounting entries",
    component: ReconciliationCanvas,
    isCompleted: false,
    isActive: false,
    isOptional: false,
    estimatedTime: "15 min",
    prerequisites: ["transaction-import"],
  },
  {
    id: "rule-engine",
    title: "Rule Engine",
    description: "Create intelligent auto-matching rules",
    component: RuleEngine,
    isCompleted: false,
    isActive: false,
    isOptional: true,
    estimatedTime: "10 min",
    prerequisites: ["reconciliation-canvas"],
  },
  {
    id: "bank-feed-management",
    title: "Bank Feed Management",
    description: "Monitor and manage bank feed connections",
    component: BankFeedManagement,
    isCompleted: false,
    isActive: false,
    isOptional: true,
    estimatedTime: "5 min",
    prerequisites: ["bank-connection"],
  },
  {
    id: "cash-flow-analysis",
    title: "Cash Flow Analysis",
    description: "Analyze cash flow patterns and generate forecasts",
    component: CashFlowAnalysis,
    isCompleted: false,
    isActive: false,
    isOptional: true,
    estimatedTime: "10 min",
    prerequisites: ["transaction-import"],
  },
];

export function CashWorkflow({ onWorkflowComplete, onStepChange, className }: CashWorkflowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    currentStep: 0,
    completedSteps: [],
    bankAccounts: [],
    transactions: [],
    matches: [],
    rules: [],
    feeds: [],
    cashFlowData: [],
  });
  const [steps, setSteps] = useState<WorkflowStep[]>(workflowSteps);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentStep = steps[currentStepIndex];
  const CurrentComponent = currentStep?.component;

  // Update step completion status
  const updateStepCompletion = (stepId: string, isCompleted: boolean) => {
    setSteps(prev => prev.map(step => (step.id === stepId ? { ...step, isCompleted } : step)));

    setWorkflowData(prev => ({
      ...prev,
      completedSteps: isCompleted
        ? [...prev.completedSteps, stepId]
        : prev.completedSteps.filter(id => id !== stepId),
    }));
  };

  // Handle step navigation
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setIsTransitioning(true);

      // Mark current step as completed
      if (currentStep) {
        updateStepCompletion(currentStep.id, true);
      }

      // Move to next step
      setTimeout(() => {
        const nextStepIndex = currentStepIndex + 1;
        setCurrentStepIndex(nextStepIndex);

        // Update steps to show next as active
        setSteps(prev =>
          prev.map((step, index) => ({
            ...step,
            isActive: index === nextStepIndex,
          })),
        );

        setWorkflowData(prev => ({
          ...prev,
          currentStep: nextStepIndex,
        }));

        setIsTransitioning(false);

        if (onStepChange) {
          const nextStep = steps[nextStepIndex];
          if (nextStep) {
            onStepChange(nextStep.id, workflowData);
          }
        }
      }, 300);
    } else {
      // Workflow complete
      handleWorkflowComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setIsTransitioning(true);

      setTimeout(() => {
        const prevStepIndex = currentStepIndex - 1;
        setCurrentStepIndex(prevStepIndex);

        // Update steps to show previous as active
        setSteps(prev =>
          prev.map((step, index) => ({
            ...step,
            isActive: index === prevStepIndex,
          })),
        );

        setWorkflowData(prev => ({
          ...prev,
          currentStep: prevStepIndex,
        }));

        setIsTransitioning(false);

        if (onStepChange) {
          const prevStep = steps[prevStepIndex];
          if (prevStep) {
            onStepChange(prevStep.id, workflowData);
          }
        }
      }, 300);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    const step = steps[stepIndex];
    if (!step) return null;

    // Check if step is accessible (prerequisites met)
    const canAccess = step.prerequisites.every(prereq =>
      workflowData.completedSteps.includes(prereq),
    );

    if (canAccess) {
      setIsTransitioning(true);

      setTimeout(() => {
        setCurrentStepIndex(stepIndex);

        // Update steps to show clicked step as active
        setSteps(prev =>
          prev.map((s, index) => ({
            ...s,
            isActive: index === stepIndex,
          })),
        );

        setWorkflowData(prev => ({
          ...prev,
          currentStep: stepIndex,
        }));

        setIsTransitioning(false);

        if (onStepChange) {
          onStepChange(step.id, workflowData);
        }
      }, 300);
    }
  };

  const handleWorkflowComplete = () => {
    const completedSteps = steps.filter(step => step.isCompleted);

    setWorkflowData(prev => ({
      ...prev,
      completedSteps: completedSteps.map(step => step.id),
    }));

    if (onWorkflowComplete) {
      onWorkflowComplete(workflowData);
    }
  };

  // Handle component-specific events
  const handleComponentEvent = (eventType: string, data: any) => {
    switch (eventType) {
      case "account-connected":
        setWorkflowData(prev => ({
          ...prev,
          bankAccounts: [...prev.bankAccounts, data],
        }));
        break;
      case "transactions-imported":
        setWorkflowData(prev => ({
          ...prev,
          transactions: [...prev.transactions, ...data],
        }));
        break;
      case "match-created":
        setWorkflowData(prev => ({
          ...prev,
          matches: [...prev.matches, data],
        }));
        break;
      case "rule-created":
        setWorkflowData(prev => ({
          ...prev,
          rules: [...prev.rules, data],
        }));
        break;
      case "feed-updated":
        setWorkflowData(prev => ({
          ...prev,
          feeds: [...prev.feeds.filter(f => f.id !== data.id), data],
        }));
        break;
      case "forecast-generated":
        setWorkflowData(prev => ({
          ...prev,
          cashFlowData: [...prev.cashFlowData, ...data],
        }));
        break;
    }
  };

  const getStepIcon = (step: WorkflowStep, index: number) => {
    if (step.isCompleted) {
      return <CheckCircle className="w-5 h-5 text-sys-green-600" />;
    }
    if (step.isActive) {
      return <Clock className="w-5 h-5 text-sys-brand-600" />;
    }
    if (index < currentStepIndex) {
      return <Circle className="w-5 h-5 text-sys-gray-400" />;
    }
    return <Circle className="w-5 h-5 text-sys-gray-300" />;
  };

  const getStepStatus = (step: WorkflowStep, index: number) => {
    if (step.isCompleted) {
      return "bg-sys-green-100 text-sys-green-800 border-sys-green-200";
    }
    if (step.isActive) {
      return "bg-sys-brand-100 text-sys-brand-800 border-sys-brand-200";
    }
    if (index < currentStepIndex) {
      return "bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200";
    }
    return "bg-sys-gray-50 text-sys-gray-500 border-sys-gray-200";
  };

  const canProceed = () => {
    // Check if current step has required data to proceed
    if (!currentStep) return null;

    switch (currentStep.id) {
      case "bank-connection":
        return workflowData.bankAccounts.length > 0;
      case "transaction-import":
        return workflowData.transactions.length > 0;
      case "reconciliation-canvas":
        return workflowData.matches.length > 0;
      default:
        return true;
    }
  };

  const progressPercentage = (workflowData.completedSteps.length / steps.length) * 100;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sys-fg-default">Cash Workflow</h2>
        <p className="text-sys-fg-muted">
          Complete your banking integration and reconciliation setup step by step.
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sys-brand-600" />
            Workflow Progress
          </CardTitle>
          <CardDescription>
            {workflowData.completedSteps.length} of {steps.length} steps completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-sys-fg-muted mb-2">
              <span>Progress</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-sys-gray-200 rounded-full h-2">
              <div
                className="bg-sys-brand-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Steps Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {steps.map((step, index) => (
              <Card
                key={step.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-md",
                  step.isActive && "ring-2 ring-sys-brand-500",
                  !step.isActive && index > currentStepIndex && "opacity-50 cursor-not-allowed",
                )}
                onClick={() => handleStepClick(index)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    {getStepIcon(step, index)}
                    <div className="flex-1">
                      <h3 className="font-medium text-sys-fg-default">{step.title}</h3>
                      <p className="text-sm text-sys-fg-muted">{step.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={getStepStatus(step, index)}>
                      {step.isCompleted
                        ? "Completed"
                        : step.isActive
                          ? "Active"
                          : index < currentStepIndex
                            ? "Skipped"
                            : "Pending"}
                    </Badge>
                    <span className="text-xs text-sys-fg-muted">{step.estimatedTime}</span>
                  </div>

                  {step.isOptional && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Optional
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {currentStep && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {getStepIcon(currentStep, currentStepIndex)}
                  {currentStep?.title}
                </CardTitle>
                <CardDescription>
                  {currentStep?.description} • Estimated time: {currentStep?.estimatedTime}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0 || isTransitioning}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
                <Button onClick={handleNext} disabled={!canProceed() || isTransitioning}>
                  {isTransitioning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : currentStepIndex === steps.length - 1 ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Complete
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isTransitioning ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sys-brand-600" />
              </div>
            ) : (
              CurrentComponent && (
                <CurrentComponent onEvent={handleComponentEvent} workflowData={workflowData} />
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* Workflow Summary */}
      {workflowData.completedSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sys-brand-600" />
              Workflow Summary
            </CardTitle>
            <CardDescription>Overview of your cash workflow setup progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-sys-green-50 rounded-lg">
                <Building2 className="w-8 h-8 text-sys-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-sys-fg-default">
                  {workflowData.bankAccounts.length}
                </p>
                <p className="text-sm text-sys-fg-muted">Bank Accounts</p>
              </div>

              <div className="text-center p-4 bg-sys-blue-50 rounded-lg">
                <Upload className="w-8 h-8 text-sys-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-sys-fg-default">
                  {workflowData.transactions.length}
                </p>
                <p className="text-sm text-sys-fg-muted">Transactions</p>
              </div>

              <div className="text-center p-4 bg-sys-purple-50 rounded-lg">
                <Target className="w-8 h-8 text-sys-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-sys-fg-default">
                  {workflowData.matches.length}
                </p>
                <p className="text-sm text-sys-fg-muted">Matches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completion Alert */}
      {workflowData.completedSteps.length === steps.length && (
        <Alert className="border-sys-green-200">
          <CheckCircle className="w-4 h-4 text-sys-green-500" />
          <AlertDescription>
            <strong>Workflow Complete!</strong> You have successfully set up your cash workflow. All
            banking integration and reconciliation features are now ready to use.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
