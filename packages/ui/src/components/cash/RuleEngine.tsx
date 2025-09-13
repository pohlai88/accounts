'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@aibos/ui/utils';
import { Button } from '@aibos/ui/Button';
import { Input } from '@aibos/ui/Input';
import { Label } from '@aibos/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@aibos/ui/Card';
import { Badge } from '@aibos/ui/Badge';
import { Alert, AlertDescription } from '@aibos/ui/Alert';
import {
  Settings,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Loader2,
  Zap,
  Target,
  Filter,
  Search,
  Eye,
  EyeOff,
  BarChart3,
  Clock,
  TrendingUp
} from 'lucide-react';

// Types
interface MatchingRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  priority: number;
  conditions: RuleCondition[];
  actions: RuleAction[];
  hitCount: number;
  lastHit?: string;
  createdAt: string;
  updatedAt: string;
}

interface RuleCondition {
  id: string;
  field: 'description' | 'amount' | 'date' | 'account' | 'reference' | 'category';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than' | 'between';
  value: string | number;
  value2?: string | number; // For 'between' operator
}

interface RuleAction {
  id: string;
  type: 'auto_match' | 'suggest_match' | 'categorize' | 'tag' | 'flag';
  parameters: Record<string, any>;
}

interface RuleTestResult {
  ruleId: string;
  ruleName: string;
  matches: number;
  confidence: number;
  sampleMatches: Array<{
    bankTransaction: any;
    accountingEntry: any;
    confidence: number;
  }>;
}

interface RuleEngineProps {
  onRuleCreated?: (rule: MatchingRule) => void;
  onRuleUpdated?: (rule: MatchingRule) => void;
  onRuleDeleted?: (ruleId: string) => void;
  onRuleTested?: (result: RuleTestResult) => void;
  className?: string;
}

// Mock data
const mockRules: MatchingRule[] = [
  {
    id: 'rule_001',
    name: 'Office Rent Match',
    description: 'Automatically match office rent payments',
    isActive: true,
    priority: 1,
    conditions: [
      {
        id: 'cond_001',
        field: 'description',
        operator: 'contains',
        value: 'OFFICE RENT'
      },
      {
        id: 'cond_002',
        field: 'amount',
        operator: 'equals',
        value: 2500
      }
    ],
    actions: [
      {
        id: 'act_001',
        type: 'auto_match',
        parameters: {
          confidence: 0.95,
          account: 'Rent Expense'
        }
      }
    ],
    hitCount: 12,
    lastHit: '2024-01-15T10:30:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: 'rule_002',
    name: 'AWS Hosting Match',
    description: 'Match AWS hosting payments',
    isActive: true,
    priority: 2,
    conditions: [
      {
        id: 'cond_003',
        field: 'description',
        operator: 'contains',
        value: 'AMAZON WEB SERVICES'
      }
    ],
    actions: [
      {
        id: 'act_002',
        type: 'auto_match',
        parameters: {
          confidence: 0.90,
          account: 'Technology Expense'
        }
      }
    ],
    hitCount: 8,
    lastHit: '2024-01-14T09:15:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-14T09:15:00Z'
  },
  {
    id: 'rule_003',
    name: 'Client Payment Match',
    description: 'Match client payments from invoices',
    isActive: true,
    priority: 3,
    conditions: [
      {
        id: 'cond_004',
        field: 'description',
        operator: 'contains',
        value: 'CLIENT PAYMENT'
      },
      {
        id: 'cond_005',
        field: 'category',
        operator: 'equals',
        value: 'credit'
      }
    ],
    actions: [
      {
        id: 'act_003',
        type: 'auto_match',
        parameters: {
          confidence: 0.88,
          account: 'Accounts Receivable'
        }
      }
    ],
    hitCount: 15,
    lastHit: '2024-01-13T14:20:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-13T14:20:00Z'
  },
  {
    id: 'rule_004',
    name: 'Payroll Match',
    description: 'Match payroll transactions',
    isActive: false,
    priority: 4,
    conditions: [
      {
        id: 'cond_006',
        field: 'description',
        operator: 'contains',
        value: 'PAYROLL'
      }
    ],
    actions: [
      {
        id: 'act_004',
        type: 'auto_match',
        parameters: {
          confidence: 0.92,
          account: 'Payroll Expense'
        }
      }
    ],
    hitCount: 6,
    lastHit: '2024-01-11T16:45:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-11T16:45:00Z'
  }
];

const mockTestResults: RuleTestResult[] = [
  {
    ruleId: 'rule_001',
    ruleName: 'Office Rent Match',
    matches: 3,
    confidence: 0.95,
    sampleMatches: [
      {
        bankTransaction: { description: 'OFFICE RENT - JANUARY', amount: 2500 },
        accountingEntry: { description: 'Office Rent Payment', amount: 2500 },
        confidence: 0.95
      }
    ]
  }
];

export function RuleEngine({
  onRuleCreated,
  onRuleUpdated,
  onRuleDeleted,
  onRuleTested,
  className
}: RuleEngineProps) {
  const [rules, setRules] = useState<MatchingRule[]>(mockRules);
  const [selectedRule, setSelectedRule] = useState<MatchingRule | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<RuleTestResult[]>(mockTestResults);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showStats, setShowStats] = useState(false);

  // Filter rules based on search and status
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && rule.isActive) ||
      (filterStatus === 'inactive' && !rule.isActive);

    return matchesSearch && matchesStatus;
  });

  const handleCreateRule = () => {
    setIsCreating(true);
    setSelectedRule(null);
  };

  const handleEditRule = (rule: MatchingRule) => {
    setSelectedRule(rule);
    setIsEditing(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));

    if (onRuleDeleted) {
      onRuleDeleted(ruleId);
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule =>
      rule.id === ruleId
        ? { ...rule, isActive: !rule.isActive, updatedAt: new Date().toISOString() }
        : rule
    ));
  };

  const handleTestRule = async (ruleId: string) => {
    setIsTesting(true);

    // Simulate rule testing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const testResult: RuleTestResult = {
      ruleId: rule.id,
      ruleName: rule.name,
      matches: Math.floor(Math.random() * 10) + 1,
      confidence: 0.85 + Math.random() * 0.15,
      sampleMatches: [
        {
          bankTransaction: { description: 'Sample Bank Transaction', amount: 100 },
          accountingEntry: { description: 'Sample Accounting Entry', amount: 100 },
          confidence: 0.90
        }
      ]
    };

    setTestResults(prev => [...prev.filter(r => r.ruleId !== ruleId), testResult]);
    setIsTesting(false);

    if (onRuleTested) {
      onRuleTested(testResult);
    }
  };

  const handleSaveRule = (ruleData: Partial<MatchingRule>) => {
    if (isEditing && selectedRule) {
      // Update existing rule
      const updatedRule: MatchingRule = {
        ...selectedRule,
        ...ruleData,
        updatedAt: new Date().toISOString()
      };

      setRules(prev => prev.map(rule =>
        rule.id === selectedRule.id ? updatedRule : rule
      ));

      if (onRuleUpdated) {
        onRuleUpdated(updatedRule);
      }
    } else {
      // Create new rule
      const newRule: MatchingRule = {
        id: `rule_${Date.now()}`,
        name: ruleData.name || 'New Rule',
        description: ruleData.description || '',
        isActive: ruleData.isActive ?? true,
        priority: ruleData.priority ?? rules.length + 1,
        conditions: ruleData.conditions || [],
        actions: ruleData.actions || [],
        hitCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setRules(prev => [...prev, newRule]);

      if (onRuleCreated) {
        onRuleCreated(newRule);
      }
    }

    setIsCreating(false);
    setIsEditing(false);
    setSelectedRule(null);
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'bg-sys-red-100 text-sys-red-800 border-sys-red-200';
    if (priority <= 4) return 'bg-sys-yellow-100 text-sys-yellow-800 border-sys-yellow-200';
    return 'bg-sys-green-100 text-sys-green-800 border-sys-green-200';
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-sys-green-100 text-sys-green-800 border-sys-green-200'
      : 'bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200';
  };

  const formatLastHit = (lastHit?: string) => {
    if (!lastHit) return 'Never';
    const date = new Date(lastHit);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const totalRules = rules.length;
  const activeRules = rules.filter(r => r.isActive).length;
  const totalHits = rules.reduce((sum, rule) => sum + rule.hitCount, 0);
  const avgConfidence = testResults.length > 0
    ? testResults.reduce((sum, result) => sum + result.confidence, 0) / testResults.length
    : 0;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sys-fg-default">Rule Engine</h2>
        <p className="text-sys-fg-muted">
          Create and manage intelligent auto-matching rules for transaction reconciliation.
        </p>
      </div>

      {/* Statistics */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-sys-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{totalRules}</p>
                  <p className="text-sm text-sys-fg-muted">Total Rules</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Play className="w-8 h-8 text-sys-green-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{activeRules}</p>
                  <p className="text-sm text-sys-fg-muted">Active Rules</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-sys-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{totalHits}</p>
                  <p className="text-sm text-sys-fg-muted">Total Hits</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-sys-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{Math.round(avgConfidence * 100)}%</p>
                  <p className="text-sm text-sys-fg-muted">Avg Confidence</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-sys-brand-600" />
                Rule Management
              </CardTitle>
              <CardDescription>
                Create, edit, and manage auto-matching rules for transaction reconciliation.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStats(!showStats)}
              >
                {showStats ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showStats ? 'Hide Stats' : 'Show Stats'}
              </Button>
              <Button
                onClick={handleCreateRule}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Rule
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search" className="sr-only">Search rules</Label>
              <Input
                id="search"
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Rules</CardTitle>
          <CardDescription>
            {filteredRules.length} of {totalRules} rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredRules.map(rule => (
              <Card key={rule.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-sys-fg-muted" />
                      <div>
                        <h3 className="font-medium text-sys-fg-default">{rule.name}</h3>
                        <p className="text-sm text-sys-fg-muted">{rule.description}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(rule.priority)}>
                        Priority {rule.priority}
                      </Badge>
                      <Badge className={getStatusColor(rule.isActive)}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-medium text-sys-fg-default">{rule.hitCount} hits</p>
                      <p className="text-sm text-sys-fg-muted">
                        Last hit: {formatLastHit(rule.lastHit)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestRule(rule.id)}
                        disabled={isTesting}
                      >
                        {isTesting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Zap className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id)}
                      >
                        {rule.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Rule Details */}
                <div className="mt-4 pt-4 border-t border-sys-border">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sys-fg-muted">Conditions</Label>
                      <div className="space-y-1 mt-1">
                        {rule.conditions.map(condition => (
                          <div key={condition.id} className="text-sm text-sys-fg-default">
                            {condition.field} {condition.operator} {condition.value}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sys-fg-muted">Actions</Label>
                      <div className="space-y-1 mt-1">
                        {rule.actions.map(action => (
                          <div key={action.id} className="text-sm text-sys-fg-default">
                            {action.type}: {JSON.stringify(action.parameters)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {filteredRules.length === 0 && (
              <div className="text-center py-8 text-sys-fg-muted">
                <Settings className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No rules found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-sys-brand-600" />
              Test Results
            </CardTitle>
            <CardDescription>
              Results from recent rule testing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map(result => (
                <Card key={result.ruleId} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Target className="w-4 h-4 text-sys-fg-muted" />
                      <div>
                        <h3 className="font-medium text-sys-fg-default">{result.ruleName}</h3>
                        <p className="text-sm text-sys-fg-muted">
                          {result.matches} matches found
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium text-sys-fg-default">
                          {Math.round(result.confidence * 100)}% confidence
                        </p>
                        <Badge className="bg-sys-green-100 text-sys-green-800 border-sys-green-200">
                          {result.matches} matches
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Sample Matches */}
                  {result.sampleMatches.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-sys-border">
                      <Label className="text-sys-fg-muted">Sample Matches</Label>
                      <div className="space-y-2 mt-2">
                        {result.sampleMatches.map((match, index) => (
                          <div key={index} className="flex items-center gap-4 p-2 bg-sys-gray-50 rounded-md">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-sys-fg-default">
                                {match.bankTransaction.description}
                              </p>
                              <p className="text-xs text-sys-fg-muted">
                                Amount: {match.bankTransaction.amount}
                              </p>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-sys-fg-default">
                                {match.accountingEntry.description}
                              </p>
                              <p className="text-xs text-sys-fg-muted">
                                Amount: {match.accountingEntry.amount}
                              </p>
                            </div>
                            <Badge className="bg-sys-blue-100 text-sys-blue-800 border-sys-blue-200">
                              {Math.round(match.confidence * 100)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rule Editor Modal Placeholder */}
      {(isCreating || isEditing) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isCreating ? 'Create New Rule' : 'Edit Rule'}
            </CardTitle>
            <CardDescription>
              {isCreating ? 'Create a new auto-matching rule' : 'Edit the selected rule'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rule-name">Rule Name</Label>
                <Input
                  id="rule-name"
                  placeholder="Enter rule name..."
                  defaultValue={selectedRule?.name || ''}
                />
              </div>
              <div>
                <Label htmlFor="rule-description">Description</Label>
                <Input
                  id="rule-description"
                  placeholder="Enter rule description..."
                  defaultValue={selectedRule?.description || ''}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleSaveRule({})}>
                  {isCreating ? 'Create Rule' : 'Update Rule'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setIsEditing(false);
                    setSelectedRule(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
