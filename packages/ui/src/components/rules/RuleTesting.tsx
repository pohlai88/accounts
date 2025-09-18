import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Button } from "@aibos/ui/Button";
import { Badge } from "@aibos/ui/Badge";
import { Alert } from "@aibos/ui/Alert";
import { Input } from "@aibos/ui/Input";
import { cn } from "@aibos/ui/utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  Eye,
  Play,
  Plus,
  RotateCcw,
  Save,
  TestTube,
  Trash2,
  Upload,
  Zap,
  BarChart3,
  Target,
  AlertCircle,
  FileText,
  Settings,
} from "lucide-react";

interface TestDataSet {
  id: string;
  name: string;
  description: string;
  data: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

interface TestResult {
  id: string;
  ruleId: string;
  testDataSetId: string;
  success: boolean;
  status: "passed" | "failed" | "error";
  executionTime: number;
  cost: number;
  result: any;
  error?: string;
  executedAt: Date;
  conditions: Array<{
    condition: string;
    result: boolean;
    value: any;
  }>;
  actions: Array<{
    action: string;
    executed: boolean;
    result: any;
  }>;
}

interface RuleTestingProps {
  testDataSets: TestDataSet[];
  testResults: TestResult[];
  onSaveTestDataSet: (dataSet: TestDataSet) => void;
  onDeleteTestDataSet: (dataSetId: string) => void;
  onRunTest: (ruleId: string, testDataSetId: string) => Promise<TestResult>;
  onRunAllTests: (ruleId: string) => Promise<TestResult[]>;
  onExportTestResults: (results: TestResult[]) => void;
  onImportTestData: (data: string) => void;
  onExplainTestResult: (result: TestResult) => string;
}

export const RuleTesting: React.FC<RuleTestingProps> = ({
  testDataSets,
  testResults,
  onSaveTestDataSet,
  onDeleteTestDataSet,
  onRunTest,
  onRunAllTests,
  onExportTestResults,
  onImportTestData,
  onExplainTestResult,
}) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>("");
  const [selectedDataSetId, setSelectedDataSetId] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [newDataSetName, setNewDataSetName] = useState("");
  const [newDataSetDescription, setNewDataSetDescription] = useState("");
  const [newDataSetData, setNewDataSetData] = useState("{}");
  const [isCreatingDataSet, setIsCreatingDataSet] = useState(false);

  const filteredTestResults = useMemo(() => {
    return testResults.filter(result => !selectedRuleId || result.ruleId === selectedRuleId);
  }, [testResults, selectedRuleId]);

  const recentTestResults = useMemo(() => {
    return filteredTestResults
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, 10);
  }, [filteredTestResults]);

  const testStats = useMemo(() => {
    const total = filteredTestResults.length;
    const successful = filteredTestResults.filter(r => r.success).length;
    const failed = total - successful;
    const avgExecutionTime =
      total > 0 ? filteredTestResults.reduce((sum, r) => sum + r.executionTime, 0) / total : 0;
    const totalCost = filteredTestResults.reduce((sum, r) => sum + r.cost, 0);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0,
      avgExecutionTime,
      totalCost,
    };
  }, [filteredTestResults]);

  const handleCreateTestDataSet = useCallback(async () => {
    try {
      const data = JSON.parse(newDataSetData);
      const newDataSet: TestDataSet = {
        id: `test_${Date.now()}`,
        name: newDataSetName,
        description: newDataSetDescription,
        data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await onSaveTestDataSet(newDataSet);
      setNewDataSetName("");
      setNewDataSetDescription("");
      setNewDataSetData("{}");
      setIsCreatingDataSet(false);
    } catch (error) {
      console.error("Failed to create test data set:", error);
    }
  }, [newDataSetName, newDataSetDescription, newDataSetData, onSaveTestDataSet]);

  const handleRunTest = useCallback(async () => {
    if (!selectedRuleId || !selectedDataSetId) return;

    setIsRunning(true);
    try {
      await onRunTest(selectedRuleId, selectedDataSetId);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setIsRunning(false);
    }
  }, [selectedRuleId, selectedDataSetId, onRunTest]);

  const handleRunAllTests = useCallback(async () => {
    if (!selectedRuleId) return;

    setIsRunning(true);
    try {
      await onRunAllTests(selectedRuleId);
    } catch (error) {
      console.error("Tests failed:", error);
    } finally {
      setIsRunning(false);
    }
  }, [selectedRuleId, onRunAllTests]);

  const formatExecutionTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Rule Testing</h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Test rules with sample data and validate behavior
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setIsCreatingDataSet(true)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Test Data</span>
          </Button>
          <Button
            onClick={() => onImportTestData("")}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
        </div>
      </div>

      {/* Test Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <TestTube className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
            <span className="text-sm font-medium text-[var(--sys-text-primary)]">Total Tests</span>
          </div>
          <div className="text-2xl font-bold text-[var(--sys-text-primary)]">{testStats.total}</div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />
            <span className="text-sm font-medium text-[var(--sys-text-primary)]">Success Rate</span>
          </div>
          <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
            {testStats.successRate.toFixed(1)}%
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
            <span className="text-sm font-medium text-[var(--sys-text-primary)]">Avg Time</span>
          </div>
          <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
            {formatExecutionTime(testStats.avgExecutionTime)}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Zap className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
            <span className="text-sm font-medium text-[var(--sys-text-primary)]">Total Cost</span>
          </div>
          <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
            {formatCost(testStats.totalCost)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Test Data Sets */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Test Data Sets ({testDataSets.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create New Data Set */}
              {isCreatingDataSet && (
                <div className="p-4 border border-[var(--sys-border-hairline)] rounded-lg space-y-3">
                  <Input
                    placeholder="Data set name"
                    value={newDataSetName}
                    onChange={e => setNewDataSetName(e.target.value)}
                    className="w-full"
                  />
                  <Input
                    placeholder="Description"
                    value={newDataSetDescription}
                    onChange={e => setNewDataSetDescription(e.target.value)}
                    className="w-full"
                  />
                  <textarea
                    placeholder="JSON data"
                    value={newDataSetData}
                    onChange={e => setNewDataSetData(e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  />
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={handleCreateTestDataSet}
                      disabled={!newDataSetName || !newDataSetData}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsCreatingDataSet(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Data Sets List */}
              <div className="space-y-2">
                {testDataSets.map(dataSet => (
                  <div
                    key={dataSet.id}
                    className={cn(
                      "p-3 border border-[var(--sys-border-hairline)] rounded-lg cursor-pointer transition-colors",
                      selectedDataSetId === dataSet.id
                        ? "bg-[var(--sys-fill-low)] border-[var(--sys-accent)]"
                        : "hover:bg-[var(--sys-fill-low)]",
                    )}
                    onClick={() => setSelectedDataSetId(dataSet.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-[var(--sys-text-primary)]">{dataSet.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteTestDataSet(dataSet.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-[var(--sys-text-secondary)] mb-2">
                      {dataSet.description}
                    </p>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">
                      {Object.keys(dataSet.data).length} properties
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Test Runner and Results */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Test Runner</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Test Controls */}
              <div className="flex items-center space-x-3 p-4 border border-[var(--sys-border-hairline)] rounded-lg">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                    Rule ID
                  </label>
                  <Input
                    value={selectedRuleId}
                    onChange={e => setSelectedRuleId(e.target.value)}
                    placeholder="Enter rule ID to test"
                    className="w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                    Test Data Set
                  </label>
                  <select
                    value={selectedDataSetId}
                    onChange={e => setSelectedDataSetId(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  >
                    <option value="">Select test data set</option>
                    {testDataSets.map(dataSet => (
                      <option key={dataSet.id} value={dataSet.id}>
                        {dataSet.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Run Buttons */}
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleRunTest}
                  disabled={!selectedRuleId || !selectedDataSetId || isRunning}
                  className="flex items-center space-x-2"
                >
                  <Play className="h-4 w-4" />
                  <span>{isRunning ? "Running..." : "Run Test"}</span>
                </Button>
                <Button
                  onClick={handleRunAllTests}
                  disabled={!selectedRuleId || isRunning}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Run All Tests</span>
                </Button>
                <Button
                  onClick={() => onExportTestResults(filteredTestResults)}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export Results</span>
                </Button>
              </div>

              {/* Test Results */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-[var(--sys-text-primary)]">
                  Recent Test Results
                </h4>

                {recentTestResults.length === 0 ? (
                  <div className="text-center py-8">
                    <TestTube className="h-12 w-12 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                      No Test Results
                    </h3>
                    <p className="text-[var(--sys-text-secondary)]">
                      Run a test to see results here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentTestResults.map(result => (
                      <div
                        key={result.id}
                        className="p-4 border border-[var(--sys-border-hairline)] rounded-lg"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {result.success ? (
                              <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-[var(--sys-status-error)]" />
                            )}
                            <div>
                              <h5 className="font-medium text-[var(--sys-text-primary)]">
                                Test #{result.id}
                              </h5>
                              <p className="text-sm text-[var(--sys-text-secondary)]">
                                {result.executedAt.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "Passed" : "Failed"}
                            </Badge>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onExplainTestResult(result)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-[var(--sys-text-secondary)]">
                              Execution Time:
                            </span>
                            <span className="ml-1 text-[var(--sys-text-primary)]">
                              {formatExecutionTime(result.executionTime)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--sys-text-secondary)]">Cost:</span>
                            <span className="ml-1 text-[var(--sys-text-primary)]">
                              {formatCost(result.cost)}
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--sys-text-secondary)]">Actions:</span>
                            <span className="ml-1 text-[var(--sys-text-primary)]">
                              {result.actions.filter(a => a.executed).length}/
                              {result.actions.length}
                            </span>
                          </div>
                        </div>

                        {result.error && (
                          <Alert variant="destructive" className="mt-3">
                            <AlertTriangle className="h-4 w-4" />
                            <div>
                              <h4 className="font-medium">Test Failed</h4>
                              <p className="text-sm">{result.error}</p>
                            </div>
                          </Alert>
                        )}

                        {/* Condition Results */}
                        <div className="mt-3">
                          <h6 className="text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                            Condition Results:
                          </h6>
                          <div className="space-y-1">
                            {result.conditions.map((condition, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    condition.result
                                      ? "bg-[var(--sys-status-success)]"
                                      : "bg-[var(--sys-status-error)]",
                                  )}
                                />
                                <span className="text-[var(--sys-text-secondary)]">
                                  {condition.condition}
                                </span>
                                <span className="text-[var(--sys-text-primary)]">
                                  ({JSON.stringify(condition.value)})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Results */}
                        <div className="mt-3">
                          <h6 className="text-sm font-medium text-[var(--sys-text-primary)] mb-2">
                            Action Results:
                          </h6>
                          <div className="space-y-1">
                            {result.actions.map((action, index) => (
                              <div key={index} className="flex items-center space-x-2 text-sm">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full",
                                    action.executed
                                      ? "bg-[var(--sys-status-success)]"
                                      : "bg-[var(--sys-text-tertiary)]",
                                  )}
                                />
                                <span className="text-[var(--sys-text-secondary)]">
                                  {action.action}
                                </span>
                                {action.executed && (
                                  <span className="text-[var(--sys-text-primary)]">
                                    ({JSON.stringify(action.result)})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
