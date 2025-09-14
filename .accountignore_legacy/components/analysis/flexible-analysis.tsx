"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  BarChart3,
  PieChart,
  Table,
  Download,
  Bookmark,
  RefreshCw,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Share,
} from "lucide-react";
import {
  FlexibleAnalysisEngine,
  AnalysisConfig,
  AnalysisResult,
  AnalysisNode,
  PivotTableConfig,
  PivotTableResult,
  AnalysisDimension,
  AnalysisMeasure,
  AnalysisFilter,
} from "@/lib/flexible-analysis-engine";

interface FlexibleAnalysisProps {
  companyId: string;
}

export function FlexibleAnalysis({ companyId }: FlexibleAnalysisProps) {
  const [configs, setConfigs] = useState<AnalysisConfig[]>([]);
  const [currentConfig, setCurrentConfig] = useState<AnalysisConfig | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pivotResult, setPivotResult] = useState<PivotTableResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPivotDialog, setShowPivotDialog] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadConfigs();
  }, [companyId]);

  const loadConfigs = async () => {
    try {
      const result = await FlexibleAnalysisEngine.getAnalysisConfigs(companyId);
      if (result.success && result.configs) {
        setConfigs(result.configs);
      }
    } catch (error) {
      console.error("Error loading configs:", error);
    }
  };

  const executeAnalysis = async (configId: string) => {
    setLoading(true);
    try {
      const result = await FlexibleAnalysisEngine.executeAnalysis(configId, companyId);
      if (result.success && result.result) {
        setAnalysisResult(result.result);
        setCurrentConfig(result.result.config);
      }
    } catch (error) {
      console.error("Error executing analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const executePivotTable = async (config: PivotTableConfig) => {
    setLoading(true);
    try {
      const result = await FlexibleAnalysisEngine.executePivotTable(config, companyId);
      if (result.success && result.result) {
        setPivotResult(result.result);
      }
    } catch (error) {
      console.error("Error executing pivot table:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const drillDown = async (nodeId: string) => {
    if (!currentConfig) return;

    try {
      const result = await FlexibleAnalysisEngine.drillDown(nodeId, currentConfig.id!, companyId);
      if (result.success && result.data) {
        // Update the analysis result with drill-down data
        // This would typically update the tree structure
        console.log("Drill-down data:", result.data);
      }
    } catch (error) {
      console.error("Error drilling down:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(2)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Flexible Analysis</h2>
          <p className="text-muted-foreground">
            Advanced collapsible analysis with pivot table capabilities
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreateAnalysisForm
                companyId={companyId}
                onSuccess={() => {
                  setShowCreateDialog(false);
                  loadConfigs();
                }}
                onCancel={() => setShowCreateDialog(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={showPivotDialog} onOpenChange={setShowPivotDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Table className="h-4 w-4 mr-2" />
                Pivot Table
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreatePivotTableForm
                companyId={companyId}
                onSuccess={config => {
                  setShowPivotDialog(false);
                  executePivotTable(config);
                }}
                onCancel={() => setShowPivotDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="pivot">Pivot Table</TabsTrigger>
          <TabsTrigger value="configs">Configurations</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Analysis Results
              </CardTitle>
              <CardDescription>
                Collapsible tree analysis with drill-down capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading analysis...</div>
              ) : analysisResult ? (
                <div className="space-y-4">
                  <AnalysisTree
                    nodes={analysisResult.data}
                    expandedNodes={expandedNodes}
                    onToggleNode={toggleNode}
                    onDrillDown={drillDown}
                    formatCurrency={formatCurrency}
                    formatPercentage={formatPercentage}
                  />
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No analysis results available</p>
                  <p className="text-sm">Select a configuration and run analysis</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pivot" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Table className="h-5 w-5 mr-2" />
                Pivot Table Results
              </CardTitle>
              <CardDescription>Dynamic pivot table analysis</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading pivot table...</div>
              ) : pivotResult ? (
                <PivotTableView result={pivotResult} formatCurrency={formatCurrency} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No pivot table results available</p>
                  <p className="text-sm">Create a pivot table configuration</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Analysis Configurations
              </CardTitle>
              <CardDescription>Manage your analysis and pivot table configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <ConfigurationsList
                configs={configs}
                onExecute={executeAnalysis}
                onEdit={config => console.log("Edit config:", config)}
                onDelete={config => console.log("Delete config:", config)}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AnalysisTreeProps {
  nodes: AnalysisNode[];
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onDrillDown: (nodeId: string) => void;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

function AnalysisTree({
  nodes,
  expandedNodes,
  onToggleNode,
  onDrillDown,
  formatCurrency,
  formatPercentage,
}: AnalysisTreeProps) {
  return (
    <div className="space-y-1">
      {nodes.map(node => (
        <AnalysisTreeNode
          key={node.id}
          node={node}
          expandedNodes={expandedNodes}
          onToggleNode={onToggleNode}
          onDrillDown={onDrillDown}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
      ))}
    </div>
  );
}

interface AnalysisTreeNodeProps {
  node: AnalysisNode;
  expandedNodes: Set<string>;
  onToggleNode: (nodeId: string) => void;
  onDrillDown: (nodeId: string) => void;
  formatCurrency: (amount: number) => string;
  formatPercentage: (percentage: number) => string;
}

function AnalysisTreeNode({
  node,
  expandedNodes,
  onToggleNode,
  onDrillDown,
  formatCurrency,
  formatPercentage,
}: AnalysisTreeNodeProps) {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 ${
          node.level === 0 ? "bg-primary/5 border-primary/20" : ""
        }`}
        style={{ marginLeft: `${node.level * 20}px` }}
      >
        <div className="flex items-center space-x-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleNode(node.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          {!hasChildren && <div className="w-6" />}

          <div>
            <p className="font-medium">{node.label}</p>
            {node.metadata && (
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {Object.entries(node.metadata).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {key}: {value}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="font-bold">{formatCurrency(node.value)}</p>
            {node.percentage && (
              <p className="text-sm text-muted-foreground">{formatPercentage(node.percentage)}</p>
            )}
            {node.variance && (
              <p className="text-sm text-muted-foreground">Var: {formatCurrency(node.variance)}</p>
            )}
          </div>

          <div className="flex items-center space-x-1">
            {node.isCollapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDrillDown(node.id)}
                className="h-8 w-8 p-0"
                title="Drill down"
              >
                <Search className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="More options">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <AnalysisTree
          nodes={node.children}
          expandedNodes={expandedNodes}
          onToggleNode={onToggleNode}
          onDrillDown={onDrillDown}
          formatCurrency={formatCurrency}
          formatPercentage={formatPercentage}
        />
      )}
    </div>
  );
}

interface PivotTableViewProps {
  result: PivotTableResult;
  formatCurrency: (amount: number) => string;
}

function PivotTableView({ result, formatCurrency }: PivotTableViewProps) {
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              {result.config.rows.map(row => (
                <th key={row} className="text-left p-2 font-medium">
                  {row.replace("_", " ").toUpperCase()}
                </th>
              ))}
              {result.config.columns.map(col => (
                <th key={col} className="text-right p-2 font-medium">
                  {col.replace("_", " ").toUpperCase()}
                </th>
              ))}
              <th className="text-right p-2 font-medium">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {result.data.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? "bg-muted/50" : ""}>
                {result.config.rows.map(rowDim => (
                  <td key={rowDim} className="p-2">
                    {row[rowDim]}
                  </td>
                ))}
                {result.config.columns.map(colDim => (
                  <td key={colDim} className="p-2 text-right">
                    {formatCurrency(row[colDim] || 0)}
                  </td>
                ))}
                <td className="p-2 text-right font-bold">{formatCurrency(row._total || 0)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 font-bold">
              <td colSpan={result.config.rows.length} className="p-2">
                GRAND TOTAL
              </td>
              {result.config.columns.map(colDim => (
                <td key={colDim} className="p-2 text-right">
                  {formatCurrency(result.columnTotals[colDim] || 0)}
                </td>
              ))}
              <td className="p-2 text-right">{formatCurrency(result.grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

interface ConfigurationsListProps {
  configs: AnalysisConfig[];
  onExecute: (configId: string) => void;
  onEdit: (config: AnalysisConfig) => void;
  onDelete: (config: AnalysisConfig) => void;
}

function ConfigurationsList({ configs, onExecute, onEdit, onDelete }: ConfigurationsListProps) {
  return (
    <div className="space-y-4">
      {configs.map(config => (
        <div key={config.id} className="p-4 border rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{config.name}</h3>
              <p className="text-sm text-muted-foreground">{config.description}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">{config.period}</Badge>
                <Badge variant="outline">{config.aggregation}</Badge>
                {config.isCollapsible && <Badge variant="outline">Collapsible</Badge>}
                {config.isPublic && <Badge variant="outline">Public</Badge>}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={() => onExecute(config.id!)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Execute
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(config)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(config)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface CreateAnalysisFormProps {
  companyId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function CreateAnalysisForm({ companyId, onSuccess, onCancel }: CreateAnalysisFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dimensions: ["account"] as AnalysisDimension[],
    measures: ["debit", "credit"] as AnalysisMeasure[],
    period: "monthly" as const,
    dateRange: {
      start: new Date().toISOString().split("T")[0],
      end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    },
    groupBy: ["account"] as AnalysisDimension[],
    aggregation: "sum" as const,
    showZeroValues: false,
    showPercentages: true,
    showVariances: false,
    drillDownLevels: 3,
    isCollapsible: true,
    isPublic: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await FlexibleAnalysisEngine.createAnalysisConfig({
        ...formData,
        companyId,
        createdBy: "current-user-id", // This should come from auth context
        filters: [],
        sortBy: [],
      });

      if (result.success) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating analysis config:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Analysis Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter analysis name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="period">Period</Label>
          <Select
            value={formData.period}
            onValueChange={(value: any) => setFormData({ ...formData, period: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="aggregation">Aggregation</Label>
          <Select
            value={formData.aggregation}
            onValueChange={(value: any) => setFormData({ ...formData, aggregation: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sum">Sum</SelectItem>
              <SelectItem value="average">Average</SelectItem>
              <SelectItem value="count">Count</SelectItem>
              <SelectItem value="min">Min</SelectItem>
              <SelectItem value="max">Max</SelectItem>
              <SelectItem value="variance">Variance</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Analysis</Button>
      </div>
    </form>
  );
}

interface CreatePivotTableFormProps {
  companyId: string;
  onSuccess: (config: PivotTableConfig) => void;
  onCancel: () => void;
}

function CreatePivotTableForm({ companyId, onSuccess, onCancel }: CreatePivotTableFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    rows: ["account"] as AnalysisDimension[],
    columns: ["month"] as AnalysisDimension[],
    values: ["debit", "credit"] as AnalysisMeasure[],
    aggregation: "sum" as const,
    filters: [] as AnalysisFilter[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Pivot Table Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter pivot table name"
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Pivot Table</Button>
      </div>
    </form>
  );
}
