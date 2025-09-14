/**
 * Period Closing Interface Component
 * Automated period closing with P&L transfer and validation
 */

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Download,
} from "lucide-react";
import { PeriodClosingService } from "@/lib/period-closing-service";
import { format } from "date-fns";

interface PeriodClosingStatus {
  id: string;
  companyId: string;
  fiscalYear: string;
  period: string;
  startDate: string;
  endDate: string;
  status: "Open" | "Closing" | "Closed" | "Reopened";
  closedBy?: string;
  closedAt?: string;
  reopenedBy?: string;
  reopenedAt?: string;
  remarks?: string;
  plTransferVoucherId?: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

interface PeriodClosingInterfaceProps {
  companyId: string;
  className?: string;
}

export function PeriodClosingInterface({ companyId, className = "" }: PeriodClosingInterfaceProps) {
  const [periods, setPeriods] = useState<PeriodClosingStatus[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodClosingStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [closingInProgress, setClosingInProgress] = useState(false);
  const [showClosingDialog, setShowClosingDialog] = useState(false);
  const [showReopenDialog, setShowReopenDialog] = useState(false);
  const [closingRemarks, setClosingRemarks] = useState("");
  const [reopenRemarks, setReopenRemarks] = useState("");
  const [closingProgress, setClosingProgress] = useState(0);
  const [closingSteps, setClosingSteps] = useState<string[]>([]);

  // Load periods
  useEffect(() => {
    loadPeriods();
  }, [companyId]);

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const result = await PeriodClosingService.getClosedPeriods(companyId);
      if (result.success && result.data) {
        setPeriods(result.data);
      }
    } catch (error) {
      console.error("Failed to load periods:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClosePeriod = async () => {
    if (!selectedPeriod) return;

    setClosingInProgress(true);
    setClosingProgress(0);
    setClosingSteps([]);

    try {
      // Simulate closing steps with progress updates
      const steps = [
        "Validating period transactions...",
        "Calculating P&L balances...",
        "Creating period closing voucher...",
        "Transferring P&L to retained earnings...",
        "Updating period status...",
        "Finalizing period closure...",
      ];

      for (let i = 0; i < steps.length; i++) {
        setClosingSteps(prev => [...prev, steps[i]]);
        setClosingProgress(((i + 1) / steps.length) * 100);

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const result = await PeriodClosingService.closePeriod(
        companyId,
        selectedPeriod.fiscalYear,
        selectedPeriod.period,
        closingRemarks,
      );

      if (result.success) {
        setShowClosingDialog(false);
        setClosingRemarks("");
        loadPeriods();
      }
    } catch (error) {
      console.error("Failed to close period:", error);
    } finally {
      setClosingInProgress(false);
      setClosingProgress(0);
      setClosingSteps([]);
    }
  };

  const handleReopenPeriod = async () => {
    if (!selectedPeriod) return;

    setLoading(true);
    try {
      const result = await PeriodClosingService.reopenPeriod(
        companyId,
        selectedPeriod.fiscalYear,
        selectedPeriod.period,
        reopenRemarks,
      );

      if (result.success) {
        setShowReopenDialog(false);
        setReopenRemarks("");
        loadPeriods();
      }
    } catch (error) {
      console.error("Failed to reopen period:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Open: { variant: "default" as const, icon: Unlock, color: "text-green-500" },
      Closing: { variant: "default" as const, icon: Clock, color: "text-yellow-500" },
      Closed: { variant: "secondary" as const, icon: Lock, color: "text-red-500" },
      Reopened: { variant: "default" as const, icon: RotateCcw, color: "text-blue-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center">
        <Icon className={`h-3 w-3 mr-1 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  const getProfitLossColor = (amount: number) => {
    if (amount > 0) return "text-green-600";
    if (amount < 0) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-6 w-6 mr-2" />
            Period Closing Management
          </CardTitle>
          <CardDescription>
            Manage accounting period closures with automated P&L transfers
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Current Period Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Current Period Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Unlock className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="font-semibold">Current Period</p>
              <p className="text-sm text-gray-600">December 2024</p>
              <Badge variant="default" className="mt-2">
                Open
              </Badge>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="font-semibold">Transactions</p>
              <p className="text-sm text-gray-600">1,234 entries</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="font-semibold">Net Profit</p>
              <p className="text-sm text-green-600 font-medium">$45,678</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Period History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Period History</CardTitle>
          <Button onClick={loadPeriods} variant="outline" size="sm" disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Loading periods...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Fiscal Year</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Expenses</TableHead>
                  <TableHead>Net Profit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {periods.map(period => (
                  <TableRow key={period.id}>
                    <TableCell className="font-medium">{period.period}</TableCell>
                    <TableCell>{period.fiscalYear}</TableCell>
                    <TableCell>
                      {format(new Date(period.startDate), "MMM dd")} -{" "}
                      {format(new Date(period.endDate), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>{getStatusBadge(period.status)}</TableCell>
                    <TableCell className="text-green-600">
                      ${period.totalRevenue.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-red-600">
                      ${period.totalExpenses.toLocaleString()}
                    </TableCell>
                    <TableCell className={getProfitLossColor(period.netProfit)}>
                      ${period.netProfit.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {period.status === "Open" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setShowClosingDialog(true);
                            }}
                          >
                            <Lock className="h-4 w-4 mr-1" />
                            Close
                          </Button>
                        )}
                        {period.status === "Closed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedPeriod(period);
                              setShowReopenDialog(true);
                            }}
                          >
                            <Unlock className="h-4 w-4 mr-1" />
                            Reopen
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Period Closing Dialog */}
      <Dialog open={showClosingDialog} onOpenChange={setShowClosingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-red-500" />
              Close Accounting Period
            </DialogTitle>
            <DialogDescription>
              This will close the period and transfer P&L balances to retained earnings.
            </DialogDescription>
          </DialogHeader>

          {closingInProgress ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="font-medium">Closing Period...</p>
                <p className="text-sm text-gray-600">Please do not close this window</p>
              </div>

              <Progress value={closingProgress} className="w-full" />

              <div className="space-y-2 max-h-32 overflow-y-auto">
                {closingSteps.map((step, index) => (
                  <div key={index} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    {step}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedPeriod && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Warning:</strong> Closing period {selectedPeriod.period}{" "}
                    {selectedPeriod.fiscalYear} will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Prevent new transactions in this period</li>
                      <li>Transfer P&L balances to retained earnings</li>
                      <li>Create a period closing voucher</li>
                      <li>Lock all accounts for this period</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="closing-remarks">Closing Remarks</Label>
                <Textarea
                  id="closing-remarks"
                  placeholder="Enter remarks for period closure..."
                  value={closingRemarks}
                  onChange={e => setClosingRemarks(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClosingDialog(false)}
              disabled={closingInProgress}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleClosePeriod}
              disabled={closingInProgress || !closingRemarks.trim()}
            >
              {closingInProgress ? "Closing..." : "Close Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Period Reopening Dialog */}
      <Dialog open={showReopenDialog} onOpenChange={setShowReopenDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Unlock className="h-5 w-5 mr-2 text-blue-500" />
              Reopen Accounting Period
            </DialogTitle>
            <DialogDescription>
              This will reopen the closed period and reverse the P&L transfer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {selectedPeriod && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Caution:</strong> Reopening period {selectedPeriod.period}{" "}
                  {selectedPeriod.fiscalYear} will:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Allow new transactions in this period</li>
                    <li>Reverse the P&L transfer voucher</li>
                    <li>Unlock all accounts for this period</li>
                    <li>Require re-closing when done</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div>
              <Label htmlFor="reopen-remarks">Reopening Remarks *</Label>
              <Textarea
                id="reopen-remarks"
                placeholder="Enter reason for reopening period..."
                value={reopenRemarks}
                onChange={e => setReopenRemarks(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReopenDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleReopenPeriod} disabled={loading || !reopenRemarks.trim()}>
              {loading ? "Reopening..." : "Reopen Period"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PeriodClosingInterface;
