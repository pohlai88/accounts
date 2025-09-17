// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  Target,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  Settings,
  Eye,
  Percent,
} from "lucide-react";
import CostCenterSelector from "@/components/cost-centers/CostCenterSelector";

interface CostCenter {
  id: string;
  costCenterName: string;
  costCenterCode?: string;
  parentCostCenter?: string;
  isGroup: boolean;
  companyId: string;
  disabled: boolean;
  children?: CostCenter[];
  // Analytics
  totalBudget?: number;
  actualExpenses?: number;
  budgetUtilization?: number;
  employeeCount?: number;
}

export default function CostCentersPage() {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCostCenter, setSelectedCostCenter] = useState<CostCenter | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(["1"]));
  const [searchTerm, setSearchTerm] = useState("");
  const [newCostCenter, setNewCostCenter] = useState({
    costCenterName: "",
    costCenterCode: "",
    parentCostCenter: "",
    isGroup: false,
  });

  const companyId = "default-company"; // In a real app, this would come from context

  useEffect(() => {
    loadCostCenters();
  }, [companyId]);

  const loadCostCenters = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would call your service
      const mockCostCenters: CostCenter[] = [
        {
          id: "1",
          costCenterName: "Main Cost Center",
          costCenterCode: "MAIN",
          companyId,
          isGroup: true,
          disabled: false,
          totalBudget: 1000000,
          actualExpenses: 750000,
          budgetUtilization: 75,
          children: [
            {
              id: "2",
              costCenterName: "Sales Department",
              costCenterCode: "SALES",
              parentCostCenter: "1",
              companyId,
              isGroup: false,
              disabled: false,
              totalBudget: 400000,
              actualExpenses: 320000,
              budgetUtilization: 80,
              employeeCount: 15,
            },
            {
              id: "3",
              costCenterName: "Marketing Department",
              costCenterCode: "MARKETING",
              parentCostCenter: "1",
              companyId,
              isGroup: false,
              disabled: false,
              totalBudget: 300000,
              actualExpenses: 180000,
              budgetUtilization: 60,
              employeeCount: 8,
            },
            {
              id: "4",
              costCenterName: "Operations",
              costCenterCode: "OPS",
              parentCostCenter: "1",
              companyId,
              isGroup: true,
              disabled: false,
              totalBudget: 300000,
              actualExpenses: 250000,
              budgetUtilization: 83,
              children: [
                {
                  id: "5",
                  costCenterName: "IT Department",
                  costCenterCode: "IT",
                  parentCostCenter: "4",
                  companyId,
                  isGroup: false,
                  disabled: false,
                  totalBudget: 150000,
                  actualExpenses: 125000,
                  budgetUtilization: 83,
                  employeeCount: 12,
                },
                {
                  id: "6",
                  costCenterName: "HR Department",
                  costCenterCode: "HR",
                  parentCostCenter: "4",
                  companyId,
                  isGroup: false,
                  disabled: false,
                  totalBudget: 150000,
                  actualExpenses: 125000,
                  budgetUtilization: 83,
                  employeeCount: 5,
                },
              ],
            },
          ],
        },
      ];
      setCostCenters(mockCostCenters);
    } catch (error) {
      console.error("Failed to load cost centers:", error);
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

  const handleCreateCostCenter = async () => {
    // In real implementation, this would call your service
    console.log("Creating cost center:", newCostCenter);
    setShowCreateDialog(false);
    setNewCostCenter({
      costCenterName: "",
      costCenterCode: "",
      parentCostCenter: "",
      isGroup: false,
    });
    loadCostCenters();
  };

  const handleEditCostCenter = (costCenter: CostCenter) => {
    setSelectedCostCenter(costCenter);
    setShowEditDialog(true);
  };

  const getBudgetUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "text-red-600";
    if (utilization >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const renderCostCenterTree = (costCenters: CostCenter[], level = 0) => {
    return costCenters
      .filter(
        cc =>
          !searchTerm ||
          cc.costCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cc.costCenterCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .map(costCenter => (
        <div key={costCenter.id}>
          <div
            className={`flex items-center py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md border-b ${level > 0 ? "ml-8" : ""}`}
          >
            {costCenter.isGroup && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto mr-3"
                onClick={() => toggleNode(costCenter.id)}
              >
                {expandedNodes.has(costCenter.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
              {/* Cost Center Info */}
              <div className="flex items-center md:col-span-2">
                <Building2 className="h-5 w-5 mr-3 text-blue-500" />
                <div>
                  <div className="font-medium">{costCenter.costCenterName}</div>
                  {costCenter.costCenterCode && (
                    <div className="text-sm text-gray-500">{costCenter.costCenterCode}</div>
                  )}
                  {costCenter.isGroup && (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Group
                    </Badge>
                  )}
                </div>
              </div>

              {/* Budget Info */}
              <div className="text-center">
                <div className="text-sm font-medium">
                  ${costCenter.totalBudget?.toLocaleString() || "0"}
                </div>
                <div className="text-xs text-gray-500">Budget</div>
              </div>

              {/* Actual Expenses */}
              <div className="text-center">
                <div className="text-sm font-medium">
                  ${costCenter.actualExpenses?.toLocaleString() || "0"}
                </div>
                <div className="text-xs text-gray-500">Actual</div>
              </div>

              {/* Utilization */}
              <div className="text-center">
                <div
                  className={`text-sm font-medium ${getBudgetUtilizationColor(costCenter.budgetUtilization || 0)}`}
                >
                  {costCenter.budgetUtilization || 0}%
                </div>
                <div className="text-xs text-gray-500">Utilization</div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditCostCenter(costCenter)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
                {!costCenter.isGroup && (
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {costCenter.isGroup && expandedNodes.has(costCenter.id) && costCenter.children && (
            <div>{renderCostCenterTree(costCenter.children, level + 1)}</div>
          )}
        </div>
      ));
  };

  const getTotalStats = () => {
    const flatten = (centers: CostCenter[]): CostCenter[] => {
      return centers.reduce((acc, center) => {
        acc.push(center);
        if (center.children) {
          acc.push(...flatten(center.children));
        }
        return acc;
      }, [] as CostCenter[]);
    };

    const allCenters = flatten(costCenters).filter(cc => !cc.isGroup);

    return {
      totalCenters: allCenters.length,
      totalBudget: allCenters.reduce((sum, cc) => sum + (cc.totalBudget || 0), 0),
      totalExpenses: allCenters.reduce((sum, cc) => sum + (cc.actualExpenses || 0), 0),
      totalEmployees: allCenters.reduce((sum, cc) => sum + (cc.employeeCount || 0), 0),
    };
  };

  const stats = getTotalStats();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cost Centers</h1>
          <p className="text-muted-foreground">
            Manage organizational cost centers and budget allocation
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Cost Center
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Cost Centers</p>
                <p className="text-2xl font-bold">{stats.totalCenters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Budget</p>
                <p className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Expenses</p>
                <p className="text-2xl font-bold">${stats.totalExpenses.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cost centers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Cost Centers Tree */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Center Hierarchy</CardTitle>
          <CardDescription>
            Organizational structure with budget allocation and utilization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading cost centers...</div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-md text-sm font-medium">
                <div className="md:col-span-2">Cost Center</div>
                <div className="text-center">Budget</div>
                <div className="text-center">Actual</div>
                <div className="text-center">Utilization</div>
                <div className="text-center">Actions</div>
              </div>

              {/* Tree */}
              <div className="space-y-1">{renderCostCenterTree(costCenters)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Cost Center Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Cost Center</DialogTitle>
            <DialogDescription>
              Add a new cost center to your organizational structure
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="costCenterName">Cost Center Name *</Label>
              <Input
                id="costCenterName"
                value={newCostCenter.costCenterName}
                onChange={e =>
                  setNewCostCenter(prev => ({ ...prev, costCenterName: e.target.value }))
                }
                placeholder="Enter cost center name"
              />
            </div>

            <div>
              <Label htmlFor="costCenterCode">Cost Center Code</Label>
              <Input
                id="costCenterCode"
                value={newCostCenter.costCenterCode}
                onChange={e =>
                  setNewCostCenter(prev => ({ ...prev, costCenterCode: e.target.value }))
                }
                placeholder="Enter cost center code"
              />
            </div>

            <div>
              <Label htmlFor="parentCostCenter">Parent Cost Center</Label>
              <Select
                value={newCostCenter.parentCostCenter}
                onValueChange={value =>
                  setNewCostCenter(prev => ({ ...prev, parentCostCenter: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent cost center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Root Level)</SelectItem>
                  <SelectItem value="1">Main Cost Center</SelectItem>
                  <SelectItem value="4">Operations</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isGroup"
                checked={newCostCenter.isGroup}
                onChange={e => setNewCostCenter(prev => ({ ...prev, isGroup: e.target.checked }))}
              />
              <Label htmlFor="isGroup">Is Group</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCostCenter}
              disabled={!newCostCenter.costCenterName.trim()}
            >
              Create Cost Center
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cost Center Selector Demo */}
      <Card>
        <CardHeader>
          <CardTitle>Cost Center Selector Demo</CardTitle>
          <CardDescription>Test the cost center selector component</CardDescription>
        </CardHeader>
        <CardContent>
          <CostCenterSelector
            companyId={companyId}
            onCostCenterChange={(id, name) => console.log("Selected:", id, name)}
            allowAllocation={true}
            onAllocationsChange={allocations => console.log("Allocations:", allocations)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
