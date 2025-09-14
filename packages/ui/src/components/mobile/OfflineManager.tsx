import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../Card";
import { Button } from "../../Button";
import { Badge } from "../../Badge";
import { Alert } from "../../Alert";
import { cn } from "../../utils";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Download,
  RefreshCw,
  Server,
  Wifi,
  WifiOff,
  Zap,
  Cloud,
  CloudOff,
  RotateCcw,
  AlertCircle,
} from "lucide-react";

interface OfflineOperation {
  id: string;
  type: "create" | "update" | "delete";
  entity: string;
  data: any;
  timestamp: Date;
  status: "pending" | "syncing" | "completed" | "failed";
  retryCount: number;
  error?: string;
}

interface SyncStatus {
  isOnline: boolean;
  lastSync: Date | null;
  pendingOperations: number;
  failedOperations: number;
  syncInProgress: boolean;
  connectionQuality: "excellent" | "good" | "poor" | "offline";
}

interface OfflineManagerProps {
  syncStatus: SyncStatus;
  pendingOperations: OfflineOperation[];
  onSyncNow: () => void;
  onRetryOperation: (operationId: string) => void;
  onClearFailedOperations: () => void;
  onViewOperationDetails: (operationId: string) => void;
}

export const OfflineManager: React.FC<OfflineManagerProps> = ({
  syncStatus,
  pendingOperations,
  onSyncNow,
  onRetryOperation,
  onClearFailedOperations,
  onViewOperationDetails,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedOperationType, setSelectedOperationType] = useState<string>("all");

  const handleSyncNow = useCallback(async () => {
    await onSyncNow();
  }, [onSyncNow]);

  const handleRetryOperation = useCallback(
    async (operationId: string) => {
      setIsRetrying(true);
      await onRetryOperation(operationId);
      setIsRetrying(false);
    },
    [onRetryOperation],
  );

  const getConnectionStatusColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "good":
        return "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10";
      case "poor":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "offline":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getOperationStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "syncing":
        return "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10";
      case "failed":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      case "pending":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getOperationTypeIcon = (type: string) => {
    switch (type) {
      case "create":
        return Database;
      case "update":
        return RefreshCw;
      case "delete":
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const filteredOperations =
    selectedOperationType === "all"
      ? pendingOperations
      : pendingOperations.filter(op => op.type === selectedOperationType);

  const pendingCount = pendingOperations.filter(op => op.status === "pending").length;
  const syncingCount = pendingOperations.filter(op => op.status === "syncing").length;
  const failedCount = pendingOperations.filter(op => op.status === "failed").length;
  const completedCount = pendingOperations.filter(op => op.status === "completed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Offline Manager</h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Manage offline operations and data synchronization
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleSyncNow}
            disabled={!syncStatus.isOnline || syncStatus.syncInProgress}
            className="flex items-center space-x-2"
          >
            <RotateCcw className={cn("h-4 w-4", syncStatus.syncInProgress && "animate-spin")} />
            <span>Sync Now</span>
          </Button>
        </div>
      </div>

      {/* Connection Status Alert */}
      {!syncStatus.isOnline && (
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Offline Mode</h4>
            <p className="text-sm">
              You're currently offline. Changes will be synced when connection is restored.
            </p>
          </div>
        </Alert>
      )}

      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Connection</div>
              {syncStatus.isOnline ? (
                <Wifi className="h-4 w-4 text-[var(--sys-status-success)]" />
              ) : (
                <WifiOff className="h-4 w-4 text-[var(--sys-status-error)]" />
              )}
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {syncStatus.isOnline ? "Online" : "Offline"}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">
              {syncStatus.connectionQuality}
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Pending</div>
              <Clock className="h-4 w-4 text-[var(--sys-status-warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-warning)]">
              {pendingCount}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Operations queued</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Syncing</div>
              <RefreshCw className="h-4 w-4 text-[var(--sys-status-info)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-info)]">{syncingCount}</div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">In progress</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Failed</div>
              <AlertCircle className="h-4 w-4 text-[var(--sys-status-error)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-error)]">{failedCount}</div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Need attention</div>
          </CardContent>
        </Card>
      </div>

      {/* Last Sync Info */}
      {syncStatus.lastSync && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Cloud className="h-5 w-5 text-[var(--sys-text-tertiary)]" />
              <div>
                <h4 className="font-medium text-[var(--sys-text-primary)]">Last Sync</h4>
                <p className="text-sm text-[var(--sys-text-secondary)]">
                  {formatTimeAgo(syncStatus.lastSync)} • {syncStatus.pendingOperations} operations
                  pending
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Operations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Pending Operations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Operation Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedOperationType}
                onChange={e => setSelectedOperationType(e.target.value)}
                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Filter by operation type"
              >
                <option value="all">All Types</option>
                <option value="create">Create</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
              </select>
              {failedCount > 0 && (
                <Button
                  onClick={onClearFailedOperations}
                  variant="outline"
                  size="sm"
                  className="text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                >
                  Clear Failed
                </Button>
              )}
            </div>

            {/* Operations List */}
            <div className="space-y-3">
              {filteredOperations.map(operation => {
                const OperationIcon = getOperationTypeIcon(operation.type);
                return (
                  <div
                    key={operation.id}
                    className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <OperationIcon className="h-4 w-4" />
                        <div>
                          <h4 className="font-medium text-[var(--sys-text-primary)]">
                            {operation.type.charAt(0).toUpperCase() + operation.type.slice(1)}{" "}
                            {operation.entity}
                          </h4>
                          <p className="text-sm text-[var(--sys-text-secondary)]">
                            {formatTimeAgo(operation.timestamp)} • Retry count:{" "}
                            {operation.retryCount}
                            {operation.error && ` • Error: ${operation.error}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getOperationStatusColor(operation.status),
                          )}
                        >
                          {operation.status.toUpperCase()}
                        </div>
                        {operation.status === "failed" && (
                          <Button
                            size="sm"
                            onClick={() => handleRetryOperation(operation.id)}
                            disabled={isRetrying}
                            className="flex items-center space-x-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Retry</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onViewOperationDetails(operation.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredOperations.length === 0 && (
              <div className="text-center py-8">
                <CloudOff className="h-12 w-12 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                  No Operations
                </h3>
                <p className="text-[var(--sys-text-secondary)]">
                  No pending operations found for the selected filter.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Offline Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Offline Capabilities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Available Offline</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">View Data</p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Browse cached invoices, bills, and reports
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Create Records
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Draft invoices and bills offline
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Edit Records
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Modify existing records locally
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Generate Reports
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Create reports from cached data
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Sync When Online</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">Auto Sync</p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Automatic sync when connection restored
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Conflict Resolution
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Smart conflict detection and resolution
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Retry Logic
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Exponential backoff for failed operations
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Data Integrity
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Ensures data consistency across devices
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
