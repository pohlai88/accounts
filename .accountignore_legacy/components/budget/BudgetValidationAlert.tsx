/**
 * Budget Validation Alert Component
 * Real-time budget validation with visual feedback
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Info,
  StopCircle,
  AlertCircle,
} from "lucide-react";
import { ERPNextBudgetManagementService } from "@/lib/budget-management-enhanced";

interface BudgetValidationResult {
  isValid: boolean;
  budgetExceeded: boolean;
  budgetUtilization: number;
  availableBudget: number;
  totalBudget: number;
  usedBudget: number;
  action: "Stop" | "Warn" | "Ignore";
  message: string;
  details: {
    accountName: string;
    costCenterName?: string;
    projectName?: string;
    period: string;
  };
}

interface BudgetValidationAlertProps {
  companyId: string;
  accountId: string;
  costCenterId?: string;
  projectId?: string;
  amount: number;
  postingDate: string;
  onValidationResult?: (result: BudgetValidationResult) => void;
  className?: string;
}

export function BudgetValidationAlert({
  companyId,
  accountId,
  costCenterId,
  projectId,
  amount,
  postingDate,
  onValidationResult,
  className = "",
}: BudgetValidationAlertProps) {
  const [validationResult, setValidationResult] = useState<BudgetValidationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Validate budget whenever inputs change
  useEffect(() => {
    if (accountId && amount > 0 && postingDate) {
      validateBudget();
    }
  }, [companyId, accountId, costCenterId, projectId, amount, postingDate]);

  const validateBudget = async () => {
    setLoading(true);
    try {
      const result = await ERPNextBudgetManagementService.validateExpenseAgainstBudget(
        accountId,
        costCenterId,
        projectId,
        companyId,
        postingDate,
        amount,
      );

      if (result.success && result.data) {
        const validation: BudgetValidationResult = {
          isValid: result.data.isValid,
          budgetExceeded: result.data.budgetExceeded,
          budgetUtilization: result.data.budgetUtilization,
          availableBudget: result.data.availableBudget,
          totalBudget: result.data.totalBudget,
          usedBudget: result.data.usedBudget,
          action: result.data.action,
          message: result.data.message,
          details: {
            accountName: result.data.accountName || "Unknown Account",
            costCenterName: result.data.costCenterName,
            projectName: result.data.projectName,
            period: result.data.period || "Current Period",
          },
        };

        setValidationResult(validation);
        onValidationResult?.(validation);
      }
    } catch (error) {
      console.error("Budget validation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Alert className={className}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <AlertDescription className="ml-2">Validating budget...</AlertDescription>
      </Alert>
    );
  }

  if (!validationResult) {
    return null;
  }

  const getAlertVariant = () => {
    switch (validationResult.action) {
      case "Stop":
        return "destructive";
      case "Warn":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = () => {
    switch (validationResult.action) {
      case "Stop":
        return <StopCircle className="h-4 w-4 text-red-500" />;
      case "Warn":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 100) return "text-red-600";
    if (utilization >= 80) return "text-yellow-600";
    return "text-green-600";
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <Alert variant={getAlertVariant()}>
        {getStatusIcon()}
        <AlertDescription className="ml-2">
          <div className="flex items-center justify-between">
            <span>{validationResult.message}</span>
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-auto p-1">
                  <Info className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Budget Validation Details
                  </DialogTitle>
                  <DialogDescription>
                    Detailed budget analysis for this transaction
                  </DialogDescription>
                </DialogHeader>

                <BudgetValidationDetails result={validationResult} />
              </DialogContent>
            </Dialog>
          </div>
        </AlertDescription>
      </Alert>

      {/* Quick Budget Summary */}
      {validationResult.budgetExceeded && (
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Budget Utilization</span>
              <Badge
                variant={validationResult.budgetUtilization >= 100 ? "destructive" : "secondary"}
              >
                {validationResult.budgetUtilization.toFixed(1)}%
              </Badge>
            </div>

            <Progress
              value={Math.min(validationResult.budgetUtilization, 100)}
              className="h-2 mb-2"
            />

            <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
              <div>
                <span className="block">Used</span>
                <span className="font-medium">${validationResult.usedBudget.toLocaleString()}</span>
              </div>
              <div>
                <span className="block">Available</span>
                <span
                  className={`font-medium ${validationResult.availableBudget < 0 ? "text-red-600" : "text-green-600"}`}
                >
                  ${validationResult.availableBudget.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface BudgetValidationDetailsProps {
  result: BudgetValidationResult;
}

function BudgetValidationDetails({ result }: BudgetValidationDetailsProps) {
  return (
    <div className="space-y-4">
      {/* Budget Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <DollarSign className="h-4 w-4 mr-2" />
            Budget Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-500">Total Budget</Label>
              <p className="font-semibold">${result.totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Used Budget</Label>
              <p className="font-semibold">${result.usedBudget.toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Available Budget</Label>
              <p
                className={`font-semibold ${result.availableBudget < 0 ? "text-red-600" : "text-green-600"}`}
              >
                ${result.availableBudget.toLocaleString()}
              </p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Utilization</Label>
              <p className={`font-semibold ${getUtilizationColor(result.budgetUtilization)}`}>
                {result.budgetUtilization.toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Label className="text-xs text-gray-500">Progress</Label>
            <Progress value={Math.min(result.budgetUtilization, 100)} className="h-3 mt-1" />
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Transaction Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Account</span>
            <span className="text-sm font-medium">{result.details.accountName}</span>
          </div>
          {result.details.costCenterName && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Cost Center</span>
              <span className="text-sm font-medium">{result.details.costCenterName}</span>
            </div>
          )}
          {result.details.projectName && (
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Project</span>
              <span className="text-sm font-medium">{result.details.projectName}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Period</span>
            <span className="text-sm font-medium">{result.details.period}</span>
          </div>
        </CardContent>
      </Card>

      {/* Action Required */}
      {result.action !== "Ignore" && (
        <Alert variant={result.action === "Stop" ? "destructive" : "default"}>
          {result.action === "Stop" ? (
            <StopCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            <strong>Action Required:</strong> {result.message}
            {result.action === "Stop" && (
              <div className="mt-2 text-sm">
                This transaction cannot proceed due to budget constraints. Please adjust the amount
                or request budget approval.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={className}>{children}</span>;
}

function getUtilizationColor(utilization: number) {
  if (utilization >= 100) return "text-red-600";
  if (utilization >= 80) return "text-yellow-600";
  return "text-green-600";
}

export default BudgetValidationAlert;
