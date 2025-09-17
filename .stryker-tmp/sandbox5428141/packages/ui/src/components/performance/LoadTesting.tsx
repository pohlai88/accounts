// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Button } from "@aibos/ui/Button";
import { Badge } from "@aibos/ui/Badge";
import { Alert } from "@aibos/ui/Alert";
import { cn } from "@aibos/ui/utils";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Play,
  RefreshCw,
  Server,
  Settings,
  StopCircle,
  TrendingUp,
  Users,
  Zap,
  Activity,
  BarChart3,
  Cpu,
  HardDrive,
  MemoryStick,
} from "lucide-react";

interface LoadTest {
  id: string;
  name: string;
  status: "running" | "completed" | "failed" | "scheduled";
  type: "stress" | "spike" | "volume" | "endurance";
  duration: number; // minutes
  virtualUsers: number;
  requestsPerSecond: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: LoadTestResults;
}

interface LoadTestResults {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  databaseConnections: number;
  peakConcurrentUsers: number;
}

interface CapacityPlan {
  id: string;
  name: string;
  currentCapacity: number;
  projectedCapacity: number;
  growthRate: number; // percentage per month
  recommendations: string[];
  costEstimate: number;
  timeline: string;
  status: "draft" | "approved" | "implemented";
}

interface LoadTestingProps {
  loadTests: LoadTest[];
  capacityPlans: CapacityPlan[];
  onRunLoadTest: (testId: string) => void;
  onStopLoadTest: (testId: string) => void;
  onCreateLoadTest: () => void;
  onDeleteLoadTest: (testId: string) => void;
  onCreateCapacityPlan: () => void;
  onUpdateCapacityPlan: (planId: string) => void;
  onGenerateReport: (testId: string) => void;
}

export const LoadTesting: React.FC<LoadTestingProps> = ({
  loadTests,
  capacityPlans,
  onRunLoadTest,
  onStopLoadTest,
  onCreateLoadTest,
  onDeleteLoadTest,
  onCreateCapacityPlan,
  onUpdateCapacityPlan,
  onGenerateReport,
}) => {
  const [selectedTestType, setSelectedTestType] = useState<string>("all");
  const [selectedTestStatus, setSelectedTestStatus] = useState<string>("all");
  const [isRunningTest, setIsRunningTest] = useState(false);

  const handleRunTest = async (testId: string) => {
    setIsRunningTest(true);
    await onRunLoadTest(testId);
    setIsRunningTest(false);
  };

  const getTestStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "running":
        return "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10";
      case "failed":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      case "scheduled":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case "stress":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      case "spike":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "volume":
        return "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10";
      case "endurance":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getPlanStatusColor = (status: string) => {
    switch (status) {
      case "implemented":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "approved":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "draft":
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const filteredTests = loadTests.filter(test => {
    const typeMatch = selectedTestType === "all" || test.type === selectedTestType;
    const statusMatch = selectedTestStatus === "all" || test.status === selectedTestStatus;
    return typeMatch && statusMatch;
  });

  const runningTests = loadTests.filter(test => test.status === "running");
  const completedTests = loadTests.filter(test => test.status === "completed");
  const failedTests = loadTests.filter(test => test.status === "failed");
  const totalTests = loadTests.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">
            Load Testing & Capacity Planning
          </h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Performance testing and infrastructure capacity planning
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={onCreateLoadTest}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Create Test</span>
          </Button>
          <Button onClick={onCreateCapacityPlan} className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Create Plan</span>
          </Button>
        </div>
      </div>

      {/* Running Tests Alert */}
      {runningTests.length > 0 && (
        <Alert variant="default">
          <Activity className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Load Tests Running</h4>
            <p className="text-sm">
              {runningTests.length} load test(s) are currently running. Monitor progress below.
            </p>
          </div>
        </Alert>
      )}

      {/* Load Testing Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Total Tests</div>
              <Activity className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">{totalTests}</div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">
              {completedTests.length} completed
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Running</div>
              <Play className="h-4 w-4 text-[var(--sys-status-info)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-info)]">
              {runningTests.length}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Currently executing</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Failed</div>
              <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-error)]">
              {failedTests.length}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Need attention</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Capacity Plans</div>
              <BarChart3 className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {capacityPlans.length}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">
              {capacityPlans.filter(p => p.status === "implemented").length} implemented
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Tests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Load Tests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Test Filters */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedTestType}
                onChange={e => setSelectedTestType(e.target.value)}
                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Filter by test type"
              >
                <option value="all">All Types</option>
                <option value="stress">Stress Test</option>
                <option value="spike">Spike Test</option>
                <option value="volume">Volume Test</option>
                <option value="endurance">Endurance Test</option>
              </select>
              <select
                value={selectedTestStatus}
                onChange={e => setSelectedTestStatus(e.target.value)}
                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Filter by test status"
              >
                <option value="all">All Statuses</option>
                <option value="running">Running</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Tests List */}
            <div className="space-y-3">
              {filteredTests.map(test => (
                <div
                  key={test.id}
                  className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getTestTypeColor(test.type),
                          )}
                        >
                          {test.type.toUpperCase()}
                        </div>
                        <div
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getTestStatusColor(test.status),
                          )}
                        >
                          {test.status.toUpperCase()}
                        </div>
                      </div>
                      <h4 className="font-medium text-[var(--sys-text-primary)] mb-1">
                        {test.name}
                      </h4>
                      <p className="text-sm text-[var(--sys-text-secondary)] mb-2">
                        Duration: {formatDuration(test.duration)} | Virtual Users:{" "}
                        {formatNumber(test.virtualUsers)} | RPS:{" "}
                        {formatNumber(test.requestsPerSecond)}
                      </p>
                      {test.results && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                          <div>
                            <span className="text-[var(--sys-text-tertiary)]">Avg Response:</span>
                            <span className="ml-1 font-medium">
                              {test.results.averageResponseTime}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--sys-text-tertiary)]">Throughput:</span>
                            <span className="ml-1 font-medium">
                              {formatNumber(test.results.throughput)} req/s
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--sys-text-tertiary)]">Error Rate:</span>
                            <span className="ml-1 font-medium">
                              {test.results.errorRate.toFixed(2)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[var(--sys-text-tertiary)]">Success Rate:</span>
                            <span className="ml-1 font-medium">
                              {(
                                (test.results.successfulRequests / test.results.totalRequests) *
                                100
                              ).toFixed(1)}
                              %
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="mt-2 text-xs text-[var(--sys-text-tertiary)]">
                        Created: {test.createdAt.toLocaleString()}
                        {test.startedAt && ` | Started: ${test.startedAt.toLocaleString()}`}
                        {test.completedAt && ` | Completed: ${test.completedAt.toLocaleString()}`}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {test.status === "scheduled" && (
                        <Button
                          size="sm"
                          onClick={() => handleRunTest(test.id)}
                          disabled={isRunningTest}
                          className="flex items-center space-x-1"
                        >
                          <Play className="h-3 w-3" />
                          <span>Run</span>
                        </Button>
                      )}
                      {test.status === "running" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStopLoadTest(test.id)}
                          className="flex items-center space-x-1"
                        >
                          <StopCircle className="h-3 w-3" />
                          <span>Stop</span>
                        </Button>
                      )}
                      {test.status === "completed" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onGenerateReport(test.id)}
                          className="flex items-center space-x-1"
                        >
                          <BarChart3 className="h-3 w-3" />
                          <span>Report</span>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteLoadTest(test.id)}
                        className="text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Capacity Plans</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {capacityPlans.map(plan => (
              <div
                key={plan.id}
                className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getPlanStatusColor(plan.status),
                      )}
                    >
                      {plan.status.toUpperCase()}
                    </div>
                    <h4 className="font-medium text-[var(--sys-text-primary)]">{plan.name}</h4>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onUpdateCapacityPlan(plan.id)}>
                    <Settings className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                      {formatNumber(plan.currentCapacity)}
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">Current Capacity</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                      {formatNumber(plan.projectedCapacity)}
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">
                      Projected Capacity
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                      {plan.growthRate}%
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">Growth Rate/Month</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="font-medium text-[var(--sys-text-primary)]">Recommendations:</h5>
                  <ul className="space-y-1">
                    {plan.recommendations.map((recommendation, index) => (
                      <li
                        key={index}
                        className="text-sm text-[var(--sys-text-secondary)] flex items-start space-x-2"
                      >
                        <span className="text-[var(--sys-text-tertiary)]">{index + 1}.</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t border-[var(--sys-border-hairline)] flex items-center justify-between text-xs text-[var(--sys-text-tertiary)]">
                  <span>Cost Estimate: ${plan.costEstimate.toLocaleString()}</span>
                  <span>Timeline: {plan.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Performance Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">
                Load Testing Best Practices
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Start with baseline tests
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Establish performance baselines before optimization
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Test realistic scenarios
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Use production-like data and user patterns
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Monitor system resources
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Track CPU, memory, and database performance
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Test failure scenarios
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Simulate component failures and recovery
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Capacity Planning</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Monitor growth trends
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Track usage patterns and growth rates
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Plan for peak loads
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Account for seasonal and event-driven spikes
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Consider auto-scaling
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Implement dynamic resource allocation
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Regular reviews
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Update plans based on actual usage
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
