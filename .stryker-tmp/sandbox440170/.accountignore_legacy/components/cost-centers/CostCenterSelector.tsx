/**
 * Cost Center Selector Component
 * Hierarchical cost center selection with allocation support
 */
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  Plus,
  Search,
  ChevronRight,
  ChevronDown,
  Target,
  Percent,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface CostCenter {
  id: string;
  costCenterName: string;
  costCenterCode?: string;
  parentCostCenter?: string;
  isGroup: boolean;
  companyId: string;
  disabled: boolean;
  children?: CostCenter[];
}

interface CostCenterAllocation {
  id: string;
  costCenterId: string;
  costCenterName: string;
  percentage: number;
}

interface CostCenterSelectorProps {
  companyId: string;
  selectedCostCenter?: string;
  onCostCenterChange: (costCenterId: string, costCenterName: string) => void;
  allowAllocation?: boolean;
  allocations?: CostCenterAllocation[];
  onAllocationsChange?: (allocations: CostCenterAllocation[]) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CostCenterSelector({
  companyId,
  selectedCostCenter,
  onCostCenterChange,
  allowAllocation = false,
  allocations = [],
  onAllocationsChange,
  required = false,
  disabled = false,
  className = "",
}: CostCenterSelectorProps) {
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [showAllocationDialog, setShowAllocationDialog] = useState(false);
  const [tempAllocations, setTempAllocations] = useState<CostCenterAllocation[]>([]);

  // Load cost centers
  useEffect(() => {
    loadCostCenters();
  }, [companyId]);

  const loadCostCenters = async () => {
    setLoading(true);
    try {
      // This would call your cost center service
      // const result = await CostCenterService.getCostCenters(companyId)
      // For now, using mock data
      const mockCostCenters: CostCenter[] = [
        {
          id: "1",
          costCenterName: "Main Cost Center",
          costCenterCode: "MAIN",
          companyId,
          isGroup: true,
          disabled: false,
          children: [
            {
              id: "2",
              costCenterName: "Sales Department",
              costCenterCode: "SALES",
              parentCostCenter: "1",
              companyId,
              isGroup: false,
              disabled: false,
            },
            {
              id: "3",
              costCenterName: "Marketing Department",
              costCenterCode: "MARKETING",
              parentCostCenter: "1",
              companyId,
              isGroup: false,
              disabled: false,
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

  const renderCostCenterTree = (costCenters: CostCenter[], level = 0) => {
    return costCenters
      .filter(
        cc =>
          !searchTerm ||
          cc.costCenterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          cc.costCenterCode?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .map(costCenter => (
        <div key={costCenter.id} className={`ml-${level * 4}`}>
          <div className="flex items-center py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md cursor-pointer">
            {costCenter.isGroup && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto mr-2"
                onClick={() => toggleNode(costCenter.id)}
              >
                {expandedNodes.has(costCenter.id) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            <div
              className="flex-1 flex items-center"
              onClick={() =>
                !costCenter.isGroup && onCostCenterChange(costCenter.id, costCenter.costCenterName)
              }
            >
              <Building2 className="h-4 w-4 mr-2 text-blue-500" />
              <span
                className={`${costCenter.isGroup ? "font-semibold" : ""} ${selectedCostCenter === costCenter.id ? "text-blue-600 font-medium" : ""}`}
              >
                {costCenter.costCenterName}
              </span>
              {costCenter.costCenterCode && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {costCenter.costCenterCode}
                </Badge>
              )}
              {costCenter.isGroup && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  Group
                </Badge>
              )}
            </div>

            {selectedCostCenter === costCenter.id && (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </div>

          {costCenter.isGroup && expandedNodes.has(costCenter.id) && costCenter.children && (
            <div className="ml-4">{renderCostCenterTree(costCenter.children, level + 1)}</div>
          )}
        </div>
      ));
  };

  const handleAllocationSave = () => {
    const totalPercentage = tempAllocations.reduce((sum, alloc) => sum + alloc.percentage, 0);

    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert("Total allocation percentage must equal 100%");
      return;
    }

    onAllocationsChange?.(tempAllocations);
    setShowAllocationDialog(false);
  };

  const addAllocation = () => {
    setTempAllocations([
      ...tempAllocations,
      {
        id: Date.now().toString(),
        costCenterId: "",
        costCenterName: "",
        percentage: 0,
      },
    ]);
  };

  const updateAllocation = (index: number, field: keyof CostCenterAllocation, value: any) => {
    const updated = [...tempAllocations];
    updated[index] = { ...updated[index], [field]: value };
    setTempAllocations(updated);
  };

  const removeAllocation = (index: number) => {
    setTempAllocations(tempAllocations.filter((_, i) => i !== index));
  };

  const selectedCostCenterName =
    costCenters.flatMap(cc => [cc, ...(cc.children || [])]).find(cc => cc.id === selectedCostCenter)
      ?.costCenterName || "";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          Cost Center {required && <span className="text-red-500">*</span>}
        </Label>
        {allowAllocation && (
          <Dialog open={showAllocationDialog} onOpenChange={setShowAllocationDialog}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempAllocations([...allocations]);
                  setShowAllocationDialog(true);
                }}
              >
                <Percent className="h-4 w-4 mr-2" />
                Allocate
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Cost Center Allocation</DialogTitle>
                <DialogDescription>
                  Distribute costs across multiple cost centers. Total must equal 100%.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Allocations</h4>
                  <Button onClick={addAllocation} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Allocation
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cost Center</TableHead>
                      <TableHead>Percentage</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempAllocations.map((allocation, index) => (
                      <TableRow key={allocation.id}>
                        <TableCell>
                          <Select
                            value={allocation.costCenterId}
                            onValueChange={value => {
                              const costCenter = costCenters
                                .flatMap(cc => [cc, ...(cc.children || [])])
                                .find(cc => cc.id === value);
                              updateAllocation(index, "costCenterId", value);
                              updateAllocation(
                                index,
                                "costCenterName",
                                costCenter?.costCenterName || "",
                              );
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select cost center" />
                            </SelectTrigger>
                            <SelectContent>
                              {costCenters
                                .flatMap(cc => [cc, ...(cc.children || [])])
                                .filter(cc => !cc.isGroup)
                                .map(cc => (
                                  <SelectItem key={cc.id} value={cc.id}>
                                    {cc.costCenterName}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={allocation.percentage}
                            onChange={e =>
                              updateAllocation(index, "percentage", parseFloat(e.target.value) || 0)
                            }
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => removeAllocation(index)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {tempAllocations.length > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                    <span className="font-medium">Total:</span>
                    <span
                      className={`font-bold ${
                        Math.abs(
                          tempAllocations.reduce((sum, alloc) => sum + alloc.percentage, 0) - 100,
                        ) < 0.01
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {tempAllocations.reduce((sum, alloc) => sum + alloc.percentage, 0).toFixed(2)}
                      %
                    </span>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowAllocationDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAllocationSave}>Save Allocations</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Current Selection Display */}
      {selectedCostCenter && !allowAllocation && (
        <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <Building2 className="h-4 w-4 mr-2 text-blue-500" />
          <span className="text-sm font-medium">{selectedCostCenterName}</span>
        </div>
      )}

      {/* Allocation Summary */}
      {allowAllocation && allocations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Cost Center Allocation</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {allocations.map(allocation => (
                <div key={allocation.id} className="flex justify-between items-center text-sm">
                  <span>{allocation.costCenterName}</span>
                  <Badge variant="outline">{allocation.percentage}%</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cost Center Selection */}
      {!allowAllocation && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full justify-start" disabled={disabled}>
              <Building2 className="h-4 w-4 mr-2" />
              {selectedCostCenterName || "Select Cost Center"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select Cost Center</DialogTitle>
              <DialogDescription>Choose a cost center for this transaction</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search cost centers..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-64 overflow-y-auto border rounded-md">
                {loading ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading cost centers...
                  </div>
                ) : (
                  renderCostCenterTree(costCenters)
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default CostCenterSelector;
