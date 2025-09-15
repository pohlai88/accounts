import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Button } from "@aibos/ui/Button";
import { Badge } from "@aibos/ui/Badge";
import { Alert } from "@aibos/ui/Alert";
import { cn } from "@aibos/ui/utils";
import {
  Activity,
  CheckCircle,
  Clock,
  Database,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Plus,
  Search,
  Smartphone,
  Upload,
  Users,
  Zap,
  ArrowRight,
  ArrowLeft,
  MousePointer,
  Hand,
  Move,
} from "lucide-react";

interface MobileWorkflow {
  id: string;
  name: string;
  description: string;
  category: "invoice" | "bill" | "payment" | "report" | "customer" | "vendor";
  steps: WorkflowStep[];
  estimatedTime: number; // minutes
  difficulty: "easy" | "medium" | "hard";
  isOfflineCapable: boolean;
  touchOptimized: boolean;
  gestures: string[];
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  type: "form" | "scan" | "select" | "confirm" | "upload";
  isRequired: boolean;
  isCompleted: boolean;
  data?: any;
}

interface MobileWorkflowsProps {
  workflows: MobileWorkflow[];
  activeWorkflow?: string;
  onStartWorkflow: (workflowId: string) => void;
  onCompleteStep: (workflowId: string, stepId: string, data: any) => void;
  onSkipStep: (workflowId: string, stepId: string) => void;
  onFinishWorkflow: (workflowId: string) => void;
  onViewWorkflow: (workflowId: string) => void;
}

export const MobileWorkflows: React.FC<MobileWorkflowsProps> = ({
  workflows,
  activeWorkflow,
  onStartWorkflow,
  onCompleteStep,
  onSkipStep,
  onFinishWorkflow,
  onViewWorkflow,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showOfflineOnly, setShowOfflineOnly] = useState(false);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "invoice":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "bill":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "payment":
        return "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10";
      case "report":
        return "text-[var(--sys-accent)] bg-[var(--sys-accent)]/10";
      case "customer":
        return "text-[var(--sys-text-primary)] bg-[var(--sys-fill-low)]";
      case "vendor":
        return "text-[var(--sys-text-secondary)] bg-[var(--sys-fill-low)]";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "invoice":
        return FileText;
      case "bill":
        return Database;
      case "payment":
        return CheckCircle;
      case "report":
        return Activity;
      case "customer":
        return Users;
      case "vendor":
        return Users;
      default:
        return Activity;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "medium":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "hard":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getStepTypeIcon = (type: string) => {
    switch (type) {
      case "form":
        return Edit;
      case "scan":
        return Upload;
      case "select":
        return Filter;
      case "confirm":
        return CheckCircle;
      case "upload":
        return Upload;
      default:
        return Activity;
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const categoryMatch = selectedCategory === "all" || workflow.category === selectedCategory;
    const searchMatch =
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description.toLowerCase().includes(searchTerm.toLowerCase());
    const offlineMatch = !showOfflineOnly || workflow.isOfflineCapable;
    return categoryMatch && searchMatch && offlineMatch;
  });

  const categories = [
    { id: "all", name: "All Workflows", count: workflows.length },
    {
      id: "invoice",
      name: "Invoices",
      count: workflows.filter(w => w.category === "invoice").length,
    },
    { id: "bill", name: "Bills", count: workflows.filter(w => w.category === "bill").length },
    {
      id: "payment",
      name: "Payments",
      count: workflows.filter(w => w.category === "payment").length,
    },
    { id: "report", name: "Reports", count: workflows.filter(w => w.category === "report").length },
    {
      id: "customer",
      name: "Customers",
      count: workflows.filter(w => w.category === "customer").length,
    },
    { id: "vendor", name: "Vendors", count: workflows.filter(w => w.category === "vendor").length },
  ];

  const activeWorkflowData = workflows.find(w => w.id === activeWorkflow);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Mobile Workflows</h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Touch-optimized workflows for mobile devices
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => onStartWorkflow("quick-invoice")}
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Quick Invoice</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  aria-label="Search workflows"
                />
              </div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showOfflineOnly}
                  onChange={e => setShowOfflineOnly(e.target.checked)}
                  className="rounded border-[var(--sys-border-hairline)]"
                  aria-label="Show offline capable workflows only"
                />
                <span className="text-sm text-[var(--sys-text-secondary)]">Offline Only</span>
              </label>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="flex items-center space-x-2"
                >
                  <span>{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Workflow */}
      {activeWorkflowData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Active Workflow: {activeWorkflowData.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-[var(--sys-text-secondary)]">{activeWorkflowData.description}</p>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--sys-text-secondary)]">Progress</span>
                  <span className="text-[var(--sys-text-primary)]">
                    {activeWorkflowData.steps.filter(s => s.isCompleted).length} /{" "}
                    {activeWorkflowData.steps.length} steps
                  </span>
                </div>
                <div className="w-full bg-[var(--sys-fill-low)] rounded-full h-2">
                  <div
                    className="bg-[var(--sys-accent)] h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(activeWorkflowData.steps.filter(s => s.isCompleted).length / activeWorkflowData.steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Steps */}
              <div className="space-y-3">
                {activeWorkflowData.steps.map((step, index) => {
                  const StepIcon = getStepTypeIcon(step.type);
                  return (
                    <div
                      key={step.id}
                      className="flex items-center space-x-3 p-3 border border-[var(--sys-border-hairline)] rounded-lg"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                          step.isCompleted
                            ? "bg-[var(--sys-status-success)] text-white"
                            : index === activeWorkflowData.steps.findIndex(s => !s.isCompleted)
                              ? "bg-[var(--sys-accent)] text-white"
                              : "bg-[var(--sys-fill-low)] text-[var(--sys-text-tertiary)]",
                        )}
                      >
                        {step.isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-[var(--sys-text-primary)]">{step.title}</h4>
                        <p className="text-sm text-[var(--sys-text-secondary)]">
                          {step.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StepIcon className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
                        {step.isRequired && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-4 border-t border-[var(--sys-border-hairline)]">
                <Button
                  onClick={() => onFinishWorkflow(activeWorkflowData.id)}
                  className="flex items-center space-x-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Finish Workflow</span>
                </Button>
                <Button onClick={() => onViewWorkflow(activeWorkflowData.id)} variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflows Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredWorkflows.map(workflow => {
          const CategoryIcon = getCategoryIcon(workflow.category);
          const completedSteps = workflow.steps.filter(s => s.isCompleted).length;
          const totalSteps = workflow.steps.length;
          const progress = (completedSteps / totalSteps) * 100;

          return (
            <Card key={workflow.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <CategoryIcon className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getCategoryColor(workflow.category),
                        )}
                      >
                        {workflow.category.toUpperCase()}
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {workflow.isOfflineCapable && (
                        <Badge variant="outline" className="text-xs">
                          <Database className="h-3 w-3 mr-1" />
                          Offline
                        </Badge>
                      )}
                      {workflow.touchOptimized && (
                        <Badge variant="outline" className="text-xs">
                          <Hand className="h-3 w-3 mr-1" />
                          Touch
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-[var(--sys-text-primary)] mb-1">
                      {workflow.name}
                    </h4>
                    <p className="text-sm text-[var(--sys-text-secondary)] line-clamp-2">
                      {workflow.description}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[var(--sys-text-tertiary)]">
                      <span>Progress</span>
                      <span>
                        {completedSteps}/{totalSteps} steps
                      </span>
                    </div>
                    <div className="w-full bg-[var(--sys-fill-low)] rounded-full h-1">
                      <div
                        className="bg-[var(--sys-accent)] h-1 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-3 w-3 text-[var(--sys-text-tertiary)]" />
                      <span className="text-xs text-[var(--sys-text-tertiary)]">
                        {formatTime(workflow.estimatedTime)}
                      </span>
                      <div
                        className={cn(
                          "px-1 py-0.5 rounded text-xs font-medium",
                          getDifficultyColor(workflow.difficulty),
                        )}
                      >
                        {workflow.difficulty}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => onStartWorkflow(workflow.id)}
                      className="flex items-center space-x-1"
                    >
                      <ArrowRight className="h-3 w-3" />
                      <span>Start</span>
                    </Button>
                  </div>

                  {/* Gestures */}
                  {workflow.gestures.length > 0 && (
                    <div className="pt-2 border-t border-[var(--sys-border-hairline)]">
                      <div className="flex items-center space-x-1">
                        <Move className="h-3 w-3 text-[var(--sys-text-tertiary)]" />
                        <span className="text-xs text-[var(--sys-text-tertiary)]">Gestures:</span>
                        <div className="flex space-x-1">
                          {workflow.gestures.map((gesture, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {gesture}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredWorkflows.length === 0 && (
        <div className="text-center py-12">
          <Smartphone className="h-12 w-12 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
            No Workflows Found
          </h3>
          <p className="text-[var(--sys-text-secondary)]">
            No workflows match your current filters. Try adjusting your search or category
            selection.
          </p>
        </div>
      )}

      {/* Mobile Optimization Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Mobile Optimization Tips</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Touch Interactions</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Hand className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Large Touch Targets
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Minimum 44px touch targets for easy tapping
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MousePointer className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Swipe Gestures
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Swipe left/right for quick actions
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Move className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Pinch to Zoom
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Zoom in on detailed content
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Offline Features</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Database className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Local Storage
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Data cached locally for offline access
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Upload className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">Sync Queue</p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Changes queued for sync when online
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Conflict Resolution
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Smart conflict detection and resolution
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
