import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../Card";
import { Button } from "../../Button";
import { Badge } from "../../Badge";
import { Alert } from "../../Alert";
import { Input } from "../../Input";
import { cn } from "../../utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Code,
  Database,
  Download,
  Edit,
  Eye,
  Filter,
  GitBranch,
  History,
  Play,
  Plus,
  Save,
  Settings,
  TestTube,
  Trash2,
  Upload,
  Zap,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BarChart3,
  Target,
  Shield,
  AlertCircle,
} from "lucide-react";

interface RuleCondition {
  id: string;
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "greater_than"
    | "less_than"
    | "contains"
    | "not_contains"
    | "is_empty"
    | "is_not_empty";
  value: string | number | boolean;
  logicalOperator?: "AND" | "OR";
}

interface RuleAction {
  id: string;
  type:
    | "send_email"
    | "create_task"
    | "update_field"
    | "send_webhook"
    | "assign_user"
    | "create_alert";
  config: Record<string, any>;
  order: number;
}

interface Rule {
  id: string;
  name: string;
  description: string;
  conditions: RuleCondition[];
  actions: RuleAction[];
  status: "draft" | "active" | "paused" | "archived";
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastExecuted?: Date;
  executionCount: number;
  successRate: number;
  averageExecutionTime: number;
  costPerExecution: number;
}

interface RuleStudioProps {
  rules: Rule[];
  onSaveRule: (rule: Rule) => void;
  onDeleteRule: (ruleId: string) => void;
  onExecuteRule: (ruleId: string, testData?: any) => void;
  onToggleRule: (ruleId: string) => void;
  onViewRuleHistory: (ruleId: string) => void;
  onExportRule: (ruleId: string) => void;
  onImportRule: (ruleData: string) => void;
  onTestRule: (
    rule: Rule,
    testData: any,
  ) => Promise<{ success: boolean; result: any; executionTime: number; cost: number }>;
  onExplainRule: (rule: Rule, context: any) => string;
}

export const RuleStudio: React.FC<RuleStudioProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
  onExecuteRule,
  onToggleRule,
  onViewRuleHistory,
  onExportRule,
  onImportRule,
  onTestRule,
  onExplainRule,
}) => {
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "code" | "test" | "analytics">("visual");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  const filteredRules = useMemo(() => {
    return rules.filter(rule => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || rule.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [rules, searchTerm, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "paused":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "draft":
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
      case "archived":
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getOperatorLabel = (operator: string) => {
    switch (operator) {
      case "equals":
        return "equals";
      case "not_equals":
        return "does not equal";
      case "greater_than":
        return "is greater than";
      case "less_than":
        return "is less than";
      case "contains":
        return "contains";
      case "not_contains":
        return "does not contain";
      case "is_empty":
        return "is empty";
      case "is_not_empty":
        return "is not empty";
      default:
        return operator;
    }
  };

  const getActionLabel = (type: string) => {
    switch (type) {
      case "send_email":
        return "Send Email";
      case "create_task":
        return "Create Task";
      case "update_field":
        return "Update Field";
      case "send_webhook":
        return "Send Webhook";
      case "assign_user":
        return "Assign User";
      case "create_alert":
        return "Create Alert";
      default:
        return type;
    }
  };

  const handleTestRule = useCallback(
    async (rule: Rule) => {
      setIsTesting(true);
      try {
        const testData = {
          // Mock test data - in real implementation, this would come from user input
          customer: { name: "John Doe", email: "john@example.com", value: 1500 },
          order: { amount: 1200, status: "pending", date: new Date() },
          product: { category: "electronics", price: 1200 },
        };

        const result = await onTestRule(rule, testData);
        setTestResults(result);
      } catch (error) {
        console.error("Test failed:", error);
      } finally {
        setIsTesting(false);
      }
    },
    [onTestRule],
  );

  const handleExplainRule = useCallback(
    (rule: Rule) => {
      const context = {
        // Mock context - in real implementation, this would be actual data
        customer: { name: "John Doe", email: "john@example.com", value: 1500 },
        order: { amount: 1200, status: "pending", date: new Date() },
      };

      const explanation = onExplainRule(rule, context);
      alert(explanation); // In real implementation, show in a modal
    },
    [onExplainRule],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Rule Studio</h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Create and manage automation rules with visual editor
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setSelectedRule(null)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Rule</span>
          </Button>
          <Button
            onClick={() => {
              /* Import logic */
            }}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Rules ({filteredRules.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full"
                  aria-label="Search rules"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              {/* Rules List */}
              <div className="space-y-2">
                {filteredRules.map(rule => (
                  <div
                    key={rule.id}
                    className={cn(
                      "p-3 border border-[var(--sys-border-hairline)] rounded-lg cursor-pointer transition-colors",
                      selectedRule?.id === rule.id
                        ? "bg-[var(--sys-fill-low)] border-[var(--sys-accent)]"
                        : "hover:bg-[var(--sys-fill-low)]",
                    )}
                    onClick={() => setSelectedRule(rule)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-[var(--sys-text-primary)]">{rule.name}</h4>
                      <div className="flex items-center space-x-1">
                        <Badge className={cn("text-xs", getStatusColor(rule.status))}>
                          {rule.status}
                        </Badge>
                        <span className="text-xs text-[var(--sys-text-tertiary)]">
                          v{rule.version}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--sys-text-secondary)] mb-2">
                      {rule.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-[var(--sys-text-tertiary)]">
                      <span>{rule.executionCount} runs</span>
                      <span>{rule.successRate}% success</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rule Editor */}
        <div className="lg:col-span-2">
          {selectedRule ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>{selectedRule.name}</span>
                    <Badge className={cn("text-xs", getStatusColor(selectedRule.status))}>
                      {selectedRule.status}
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
                      <Edit className="h-4 w-4 mr-1" />
                      {isEditing ? "View" : "Edit"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onToggleRule(selectedRule.id)}
                    >
                      {selectedRule.status === "active" ? "Pause" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewRuleHistory(selectedRule.id)}
                    >
                      <History className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Tabs */}
                <div className="flex space-x-1 mb-6">
                  {[
                    { id: "visual", label: "Visual", icon: Target },
                    { id: "code", label: "Code", icon: Code },
                    { id: "test", label: "Test", icon: TestTube },
                    { id: "analytics", label: "Analytics", icon: BarChart3 },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <Button
                        key={tab.id}
                        variant={activeTab === tab.id ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setActiveTab(tab.id as any)}
                        className="flex items-center space-x-1"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </Button>
                    );
                  })}
                </div>

                {/* Visual Editor */}
                {activeTab === "visual" && (
                  <div className="space-y-6">
                    {/* Rule Description */}
                    <div>
                      <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                        Description
                      </label>
                      <Input
                        value={selectedRule.description}
                        onChange={e => {
                          /* Update logic */
                        }}
                        placeholder="Describe what this rule does..."
                        className="w-full"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Conditions */}
                    <div>
                      <h4 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
                        Conditions
                      </h4>
                      <div className="space-y-3">
                        {selectedRule.conditions.map((condition, index) => (
                          <div
                            key={condition.id}
                            className="flex items-center space-x-3 p-3 border border-[var(--sys-border-hairline)] rounded-lg"
                          >
                            {index > 0 && (
                              <div className="px-2 py-1 bg-[var(--sys-fill-low)] rounded text-xs font-medium text-[var(--sys-text-secondary)]">
                                {condition.logicalOperator || "AND"}
                              </div>
                            )}
                            <div className="flex-1 grid grid-cols-3 gap-3">
                              <Input
                                value={condition.field}
                                onChange={e => {
                                  /* Update logic */
                                }}
                                placeholder="Field name"
                                disabled={!isEditing}
                              />
                              <select
                                value={condition.operator}
                                onChange={e => {
                                  /* Update logic */
                                }}
                                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                                disabled={!isEditing}
                              >
                                <option value="equals">equals</option>
                                <option value="not_equals">does not equal</option>
                                <option value="greater_than">is greater than</option>
                                <option value="less_than">is less than</option>
                                <option value="contains">contains</option>
                                <option value="not_contains">does not contain</option>
                                <option value="is_empty">is empty</option>
                                <option value="is_not_empty">is not empty</option>
                              </select>
                              <Input
                                value={String(condition.value)}
                                onChange={e => {
                                  /* Update logic */
                                }}
                                placeholder="Value"
                                disabled={!isEditing}
                              />
                            </div>
                            {isEditing && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  /* Delete logic */
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {isEditing && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              /* Add condition logic */
                            }}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Condition
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
                        Actions
                      </h4>
                      <div className="space-y-3">
                        {selectedRule.actions.map(action => (
                          <div
                            key={action.id}
                            className="flex items-center space-x-3 p-3 border border-[var(--sys-border-hairline)] rounded-lg"
                          >
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="font-medium text-[var(--sys-text-primary)]">
                                  {getActionLabel(action.type)}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  Step {action.order}
                                </Badge>
                              </div>
                              <div className="text-sm text-[var(--sys-text-secondary)]">
                                {JSON.stringify(action.config, null, 2)}
                              </div>
                            </div>
                            {isEditing && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  /* Delete logic */
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {isEditing && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              /* Add action logic */
                            }}
                            className="w-full"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Action
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {isEditing && (
                      <div className="flex items-center space-x-3 pt-4 border-t border-[var(--sys-border-hairline)]">
                        <Button
                          onClick={() => onSaveRule(selectedRule)}
                          className="flex items-center space-x-2"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save Rule</span>
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Code Editor */}
                {activeTab === "code" && (
                  <div className="space-y-4">
                    <div className="bg-[var(--sys-fill-low)] p-4 rounded-lg">
                      <pre className="text-sm text-[var(--sys-text-primary)] overflow-x-auto">
                        {JSON.stringify(selectedRule, null, 2)}
                      </pre>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          /* Copy logic */
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onExportRule(selectedRule.id)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>
                )}

                {/* Test Panel */}
                {activeTab === "test" && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={() => handleTestRule(selectedRule)}
                        disabled={isTesting}
                        className="flex items-center space-x-2"
                      >
                        <Play className="h-4 w-4" />
                        <span>{isTesting ? "Testing..." : "Test Rule"}</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleExplainRule(selectedRule)}
                        className="flex items-center space-x-2"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Explain</span>
                      </Button>
                    </div>

                    {testResults && (
                      <div className="space-y-3">
                        <Alert variant={testResults.success ? "default" : "destructive"}>
                          <div className="flex items-center space-x-2">
                            {testResults.success ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <AlertCircle className="h-4 w-4" />
                            )}
                            <span>
                              Test {testResults.success ? "passed" : "failed"} in{" "}
                              {testResults.executionTime}ms
                            </span>
                          </div>
                        </Alert>
                        <div className="bg-[var(--sys-fill-low)] p-4 rounded-lg">
                          <pre className="text-sm text-[var(--sys-text-primary)] overflow-x-auto">
                            {JSON.stringify(testResults.result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Analytics Panel */}
                {activeTab === "analytics" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                          {selectedRule.executionCount}
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Total Runs</div>
                      </div>
                      <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                          {selectedRule.successRate}%
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Success Rate</div>
                      </div>
                      <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                          {selectedRule.averageExecutionTime}ms
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Avg Time</div>
                      </div>
                      <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                        <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                          ${selectedRule.costPerExecution.toFixed(4)}
                        </div>
                        <div className="text-sm text-[var(--sys-text-secondary)]">Cost per Run</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-[var(--sys-text-primary)]">
                        Recent Executions
                      </h4>
                      <div className="space-y-2">
                        {/* Mock recent executions */}
                        {[1, 2, 3].map(i => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 border border-[var(--sys-border-hairline)] rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                              <span className="text-sm text-[var(--sys-text-primary)]">
                                Execution #{i}
                              </span>
                            </div>
                            <div className="text-sm text-[var(--sys-text-tertiary)]">
                              2 minutes ago
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-[var(--sys-text-tertiary)] mb-4" />
                <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                  No Rule Selected
                </h3>
                <p className="text-[var(--sys-text-secondary)] text-center mb-4">
                  Select a rule from the list to view and edit its details, or create a new rule to
                  get started.
                </p>
                <Button
                  onClick={() => setSelectedRule(null)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Rule</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
