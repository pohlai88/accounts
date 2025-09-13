import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../Card';
import { Button } from '../../Button';
import { Badge } from '../../Badge';
import { Alert } from '../../Alert';
import { cn } from '../../utils';
import {
    Activity,
    AlertTriangle,
    BarChart3,
    CheckCircle,
    Clock,
    Code,
    Database,
    Download,
    Eye,
    Filter,
    GitBranch,
    History,
    Play,
    Plus,
    RotateCcw,
    Save,
    Settings,
    TestTube,
    Trash2,
    Upload,
    Zap,
    Target,
    Shield,
    AlertCircle,
    FileText,
    Users,
    Calendar,
    RefreshCw,
    DollarSign
} from 'lucide-react';

// Import the rule components
import { RuleStudio } from './RuleStudio';
import { RuleTesting } from './RuleTesting';
import { RuleAnalytics } from './RuleAnalytics';
import { RuleVersioning } from './RuleVersioning';

interface Rule {
    id: string;
    name: string;
    description: string;
    conditions: any[];
    actions: any[];
    status: 'draft' | 'active' | 'paused' | 'archived';
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

interface RuleMetrics {
    ruleId: string;
    ruleName: string;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    totalCost: number;
    costPerExecution: number;
    lastExecuted: Date;
    firstExecuted: Date;
    executionsToday: number;
    executionsThisWeek: number;
    executionsThisMonth: number;
    peakExecutionTime: string;
    mostCommonTrigger: string;
    errorRate: number;
    retryCount: number;
}

interface RuleVersion {
    id: string;
    ruleId: string;
    version: number;
    name: string;
    description: string;
    conditions: any[];
    actions: any[];
    status: 'draft' | 'active' | 'archived';
    createdAt: Date;
    createdBy: string;
    changeLog: string;
    isActive: boolean;
    executionCount: number;
    successRate: number;
    averageExecutionTime: number;
    costPerExecution: number;
    parentVersionId?: string;
    tags: string[];
}

interface PerformanceAlert {
    id: string;
    ruleId: string;
    ruleName: string;
    type: 'error_rate' | 'execution_time' | 'cost' | 'success_rate';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    threshold: number;
    currentValue: number;
    triggeredAt: Date;
    resolved: boolean;
}

interface RuleWorkflowProps {
    // Mock data - in real implementation, this would come from props or API
    rules?: Rule[];
    testDataSets?: TestDataSet[];
    testResults?: TestResult[];
    metrics?: RuleMetrics[];
    versions?: RuleVersion[];
    alerts?: PerformanceAlert[];
}

export const RuleWorkflow: React.FC<RuleWorkflowProps> = ({
    rules = [],
    testDataSets = [],
    testResults = [],
    metrics = [],
    versions = [],
    alerts = []
}) => {
    const [activeSection, setActiveSection] = useState<'studio' | 'testing' | 'analytics' | 'versioning'>('studio');
    const [isLoading, setIsLoading] = useState(false);

    // Mock data for demonstration
    const mockRules: Rule[] = rules.length > 0 ? rules : [
        {
            id: 'rule_001',
            name: 'Invoice Overdue Alert',
            description: 'Send email alert when invoice is overdue',
            conditions: [
                { id: '1', field: 'invoice.dueDate', operator: 'less_than', value: 'today', logicalOperator: 'AND' },
                { id: '2', field: 'invoice.status', operator: 'equals', value: 'sent' }
            ],
            actions: [
                { id: '1', type: 'send_email', config: { template: 'overdue_alert', to: 'customer.email' }, order: 1 },
                { id: '2', type: 'create_task', config: { title: 'Follow up on overdue invoice', assignee: 'accounting' }, order: 2 }
            ],
            status: 'active',
            version: 1,
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            createdBy: 'john.doe@company.com',
            lastExecuted: new Date('2024-01-20'),
            executionCount: 45,
            successRate: 95.6,
            averageExecutionTime: 120,
            costPerExecution: 0.0025
        },
        {
            id: 'rule_002',
            name: 'High Value Customer Discount',
            description: 'Apply 10% discount for customers with lifetime value > $10,000',
            conditions: [
                { id: '1', field: 'customer.lifetimeValue', operator: 'greater_than', value: 10000 },
                { id: '2', field: 'order.amount', operator: 'greater_than', value: 500 }
            ],
            actions: [
                { id: '1', type: 'update_field', config: { field: 'order.discount', value: '10%' }, order: 1 },
                { id: '2', type: 'send_webhook', config: { url: 'https://api.company.com/discounts', data: { customerId: 'customer.id', discount: '10%' } }, order: 2 }
            ],
            status: 'active',
            version: 2,
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-18'),
            createdBy: 'jane.smith@company.com',
            lastExecuted: new Date('2024-01-20'),
            executionCount: 23,
            successRate: 100,
            averageExecutionTime: 85,
            costPerExecution: 0.0018
        }
    ];

    const mockTestDataSets: TestDataSet[] = testDataSets.length > 0 ? testDataSets : [
        {
            id: 'test_001',
            name: 'Overdue Invoice Test',
            description: 'Test data for overdue invoice scenario',
            data: {
                invoice: {
                    id: 'INV-001',
                    dueDate: '2024-01-10',
                    status: 'sent',
                    amount: 1500,
                    customer: { email: 'test@example.com', name: 'Test Customer' }
                }
            },
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
        },
        {
            id: 'test_002',
            name: 'High Value Customer Test',
            description: 'Test data for high value customer discount',
            data: {
                customer: {
                    id: 'CUST-001',
                    lifetimeValue: 15000,
                    name: 'Premium Customer'
                },
                order: {
                    id: 'ORD-001',
                    amount: 750,
                    items: ['Product A', 'Product B']
                }
            },
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15')
        }
    ];

    const mockTestResults: TestResult[] = testResults.length > 0 ? testResults : [
        {
            id: 'result_001',
            ruleId: 'rule_001',
            testDataSetId: 'test_001',
            success: true,
            executionTime: 125,
            cost: 0.0025,
            result: { emailSent: true, taskCreated: true },
            executedAt: new Date('2024-01-20T10:30:00Z'),
            conditions: [
                { condition: 'invoice.dueDate < today', result: true, value: '2024-01-10' },
                { condition: 'invoice.status = sent', result: true, value: 'sent' }
            ],
            actions: [
                { action: 'send_email', executed: true, result: { success: true, messageId: 'msg_123' } },
                { action: 'create_task', executed: true, result: { success: true, taskId: 'task_456' } }
            ]
        }
    ];

    const mockMetrics: RuleMetrics[] = metrics.length > 0 ? metrics : [
        {
            ruleId: 'rule_001',
            ruleName: 'Invoice Overdue Alert',
            totalExecutions: 45,
            successfulExecutions: 43,
            failedExecutions: 2,
            successRate: 95.6,
            averageExecutionTime: 120,
            totalCost: 0.1125,
            costPerExecution: 0.0025,
            lastExecuted: new Date('2024-01-20'),
            firstExecuted: new Date('2024-01-15'),
            executionsToday: 3,
            executionsThisWeek: 12,
            executionsThisMonth: 45,
            peakExecutionTime: '14:30',
            mostCommonTrigger: 'invoice.dueDate',
            errorRate: 4.4,
            retryCount: 1
        },
        {
            ruleId: 'rule_002',
            ruleName: 'High Value Customer Discount',
            totalExecutions: 23,
            successfulExecutions: 23,
            failedExecutions: 0,
            successRate: 100,
            averageExecutionTime: 85,
            totalCost: 0.0414,
            costPerExecution: 0.0018,
            lastExecuted: new Date('2024-01-20'),
            firstExecuted: new Date('2024-01-10'),
            executionsToday: 1,
            executionsThisWeek: 5,
            executionsThisMonth: 23,
            peakExecutionTime: '11:15',
            mostCommonTrigger: 'customer.lifetimeValue',
            errorRate: 0,
            retryCount: 0
        }
    ];

    const mockVersions: RuleVersion[] = versions.length > 0 ? versions : [
        {
            id: 'version_001',
            ruleId: 'rule_001',
            version: 1,
            name: 'Invoice Overdue Alert',
            description: 'Send email alert when invoice is overdue',
            conditions: [],
            actions: [],
            status: 'active',
            createdAt: new Date('2024-01-15'),
            createdBy: 'john.doe@company.com',
            changeLog: 'Initial version of overdue invoice alert rule',
            isActive: true,
            executionCount: 45,
            successRate: 95.6,
            averageExecutionTime: 120,
            costPerExecution: 0.0025,
            tags: ['invoice', 'alert', 'email']
        },
        {
            id: 'version_002',
            ruleId: 'rule_002',
            version: 2,
            name: 'High Value Customer Discount',
            description: 'Apply 10% discount for customers with lifetime value > $10,000',
            conditions: [],
            actions: [],
            status: 'active',
            createdAt: new Date('2024-01-18'),
            createdBy: 'jane.smith@company.com',
            changeLog: 'Updated discount percentage from 5% to 10%',
            isActive: true,
            executionCount: 23,
            successRate: 100,
            averageExecutionTime: 85,
            costPerExecution: 0.0018,
            tags: ['discount', 'customer', 'pricing']
        }
    ];

    const mockAlerts: PerformanceAlert[] = alerts.length > 0 ? alerts : [
        {
            id: 'alert_001',
            ruleId: 'rule_001',
            ruleName: 'Invoice Overdue Alert',
            type: 'error_rate',
            severity: 'medium',
            message: 'Error rate has increased to 4.4%',
            threshold: 3.0,
            currentValue: 4.4,
            triggeredAt: new Date('2024-01-20T09:15:00Z'),
            resolved: false
        }
    ];

    const sections = [
        {
            id: 'studio',
            name: 'Rule Studio',
            description: 'Create and edit automation rules',
            icon: Zap,
            color: 'text-[var(--sys-accent)]',
            component: RuleStudio
        },
        {
            id: 'testing',
            name: 'Rule Testing',
            description: 'Test rules with sample data',
            icon: TestTube,
            color: 'text-[var(--sys-status-info)]',
            component: RuleTesting
        },
        {
            id: 'analytics',
            name: 'Analytics',
            description: 'Monitor rule performance and metrics',
            icon: BarChart3,
            color: 'text-[var(--sys-status-success)]',
            component: RuleAnalytics
        },
        {
            id: 'versioning',
            name: 'Versioning',
            description: 'Manage rule versions and history',
            icon: GitBranch,
            color: 'text-[var(--sys-status-warning)]',
            component: RuleVersioning
        }
    ];

    const currentSection = sections.find(s => s.id === activeSection);
    const CurrentComponent = currentSection?.component;

    // Mock handlers - in real implementation, these would make API calls
    const handleSaveRule = useCallback(async (rule: Rule) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Rule saved:', rule);
        } catch (error) {
            console.error('Failed to save rule:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDeleteRule = useCallback(async (ruleId: string) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Rule deleted:', ruleId);
        } catch (error) {
            console.error('Failed to delete rule:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleExecuteRule = useCallback(async (ruleId: string, testData?: any) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            console.log('Rule executed:', ruleId, testData);
        } catch (error) {
            console.error('Failed to execute rule:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleToggleRule = useCallback(async (ruleId: string) => {
        setIsLoading(true);
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 500));
            console.log('Rule toggled:', ruleId);
        } catch (error) {
            console.error('Failed to toggle rule:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleTestRule = useCallback(async (rule: Rule, testData: any) => {
        // Mock test execution
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            success: Math.random() > 0.1, // 90% success rate
            result: { message: 'Test completed successfully' },
            executionTime: Math.floor(Math.random() * 200) + 50,
            cost: Math.random() * 0.01
        };
    }, []);

    const handleExplainRule = useCallback((rule: Rule, context: any) => {
        return `This rule ${rule.name} will execute when the conditions are met. The conditions check ${rule.conditions.length} criteria and will perform ${rule.actions.length} actions when triggered.`;
    }, []);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--sys-text-primary)]">Rule Studio & Automation</h1>
                    <p className="text-[var(--sys-text-secondary)] mt-2">
                        Create, test, and manage automation rules with enterprise-grade features
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="flex items-center space-x-1">
                        <Activity className="h-4 w-4" />
                        <span>{mockRules.length} Rules</span>
                    </Badge>
                    <Badge variant="outline" className="flex items-center space-x-1">
                        <CheckCircle className="h-4 w-4" />
                        <span>{mockRules.filter(r => r.status === 'active').length} Active</span>
                    </Badge>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex space-x-1 bg-[var(--sys-fill-low)] p-1 rounded-lg">
                {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                        <Button
                            key={section.id}
                            variant={activeSection === section.id ? 'primary' : 'ghost'}
                            onClick={() => setActiveSection(section.id as any)}
                            className={cn(
                                "flex-1 flex items-center space-x-2",
                                activeSection === section.id && "bg-[var(--sys-bg-primary)] shadow-sm"
                            )}
                        >
                            <Icon className={cn("h-4 w-4", activeSection === section.id ? "text-[var(--sys-text-primary)]" : section.color)} />
                            <span className="hidden sm:inline">{section.name}</span>
                        </Button>
                    );
                })}
            </div>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="h-5 w-5 animate-spin text-[var(--sys-accent)]" />
                        <span className="text-[var(--sys-text-secondary)]">Processing...</span>
                    </div>
                </div>
            )}

            {/* Active Section Content */}
            {CurrentComponent && (
                <CurrentComponent
                    rules={mockRules}
                    testDataSets={mockTestDataSets}
                    testResults={mockTestResults}
                    metrics={mockMetrics}
                    versions={mockVersions}
                    alerts={mockAlerts}
                    onSaveRule={handleSaveRule}
                    onDeleteRule={handleDeleteRule}
                    onExecuteRule={handleExecuteRule}
                    onToggleRule={handleToggleRule}
                    onTestRule={handleTestRule}
                    onExplainRule={handleExplainRule}
                    onSaveTestDataSet={async (dataSet) => console.log('Test data set saved:', dataSet)}
                    onDeleteTestDataSet={async (id) => console.log('Test data set deleted:', id)}
                    onRunTest={async (ruleId, testDataSetId) => {
                        console.log('Test run:', ruleId, testDataSetId);
                        return mockTestResults[0] || {
                            id: 'mock_result',
                            ruleId,
                            testDataSetId,
                            success: true,
                            executionTime: 100,
                            cost: 0.001,
                            result: { message: 'Mock test result' },
                            executedAt: new Date(),
                            conditions: [],
                            actions: []
                        };
                    }}
                    onRunAllTests={async (ruleId) => {
                        console.log('All tests run:', ruleId);
                        return mockTestResults; // Return mock results
                    }}
                    onExportTestResults={(results) => console.log('Export test results:', results)}
                    onImportTestData={(data) => console.log('Import test data:', data)}
                    onExplainTestResult={(result) => {
                        console.log('Explain test result:', result);
                        return 'Test explanation'; // Return string
                    }}
                    onRefreshMetrics={() => console.log('Refresh metrics')}
                    onExportMetrics={(metrics) => console.log('Export metrics:', metrics)}
                    onExportExecutions={(executions) => console.log('Export executions:', executions)}
                    onViewRuleDetails={(ruleId) => console.log('View rule details:', ruleId)}
                    onResolveAlert={(alertId) => console.log('Resolve alert:', alertId)}
                    onSetAlertThreshold={(ruleId, type, threshold) => console.log('Set alert threshold:', ruleId, type, threshold)}
                    onCreateVersion={async (ruleId, changeLog) => {
                        console.log('Create version:', ruleId, changeLog);
                        return mockVersions[0] || {
                            id: 'mock_version',
                            ruleId,
                            version: 1,
                            name: 'Mock Version',
                            description: 'Mock version description',
                            conditions: [],
                            actions: [],
                            status: 'draft' as const,
                            createdAt: new Date(),
                            createdBy: 'mock@example.com',
                            changeLog,
                            isActive: false,
                            executionCount: 0,
                            successRate: 0,
                            averageExecutionTime: 0,
                            costPerExecution: 0,
                            tags: []
                        };
                    }}
                    onActivateVersion={async (versionId) => {
                        console.log('Activate version:', versionId);
                    }}
                    onArchiveVersion={async (versionId) => {
                        console.log('Archive version:', versionId);
                    }}
                    onDeleteVersion={async (versionId) => {
                        console.log('Delete version:', versionId);
                    }}
                    onCompareVersions={async (version1Id, version2Id) => {
                        console.log('Compare versions:', version1Id, version2Id);
                        return []; // Return empty diff array
                    }}
                    onExportVersion={async (versionId) => {
                        console.log('Export version:', versionId);
                        return 'exported data'; // Return string
                    }}
                    onImportVersion={async (ruleId, versionData) => {
                        console.log('Import version:', ruleId, versionData);
                        return mockVersions[0] || {
                            id: 'mock_imported_version',
                            ruleId,
                            version: 1,
                            name: 'Imported Version',
                            description: 'Imported version description',
                            conditions: [],
                            actions: [],
                            status: 'draft' as const,
                            createdAt: new Date(),
                            createdBy: 'mock@example.com',
                            changeLog: 'Imported from external source',
                            isActive: false,
                            executionCount: 0,
                            successRate: 0,
                            averageExecutionTime: 0,
                            costPerExecution: 0,
                            tags: []
                        };
                    }}
                    onTagVersion={async (versionId, tags) => console.log('Tag version:', versionId, tags)}
                    onViewRuleHistory={(ruleId) => console.log('View rule history:', ruleId)}
                    onViewVersionHistory={(ruleId) => console.log('View version history:', ruleId)}
                    onExportRule={(ruleId) => console.log('Export rule:', ruleId)}
                    onImportRule={(ruleData) => console.log('Import rule:', ruleData)}
                    executions={[]}
                />
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Zap className="h-5 w-5 text-[var(--sys-accent)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Total Rules</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">{mockRules.length}</div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">
                        {mockRules.filter(r => r.status === 'active').length} active
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <Activity className="h-5 w-5 text-[var(--sys-status-success)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Total Executions</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        {mockRules.reduce((sum, r) => sum + r.executionCount, 0)}
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">
                        Last 30 days
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-[var(--sys-status-success)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Success Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        {(mockRules.reduce((sum, r) => sum + r.successRate, 0) / mockRules.length).toFixed(1)}%
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">
                        Average across all rules
                    </div>
                </Card>

                <Card className="p-4">
                    <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
                        <span className="text-sm font-medium text-[var(--sys-text-primary)]">Total Cost</span>
                    </div>
                    <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        ${mockRules.reduce((sum, r) => sum + (r.costPerExecution * r.executionCount), 0).toFixed(4)}
                    </div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">
                        Last 30 days
                    </div>
                </Card>
            </div>
        </div>
    );
};
