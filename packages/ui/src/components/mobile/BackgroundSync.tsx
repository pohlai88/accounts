import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../Card";
import { Button } from "../../Button";
import { Badge } from "../../Badge";
import { Alert } from "../../Alert";
import { cn } from "../../utils";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Database,
  Download,
  RefreshCw,
  Settings,
  Smartphone,
  RotateCcw,
  Upload,
  Zap,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
  Pause,
  Play,
  GitBranch,
} from "lucide-react";

interface SyncJob {
  id: string;
  name: string;
  type: "incremental" | "full" | "manual";
  status: "pending" | "running" | "completed" | "failed" | "paused";
  progress: number;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
  itemsProcessed: number;
  totalItems: number;
  error?: string;
  retryCount: number;
}

interface NotificationSettings {
  enabled: boolean;
  syncComplete: boolean;
  syncFailed: boolean;
  conflictsDetected: boolean;
  offlineMode: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface BackgroundSyncProps {
  syncJobs: SyncJob[];
  notificationSettings: NotificationSettings;
  onStartSync: (jobId: string) => void;
  onPauseSync: (jobId: string) => void;
  onResumeSync: (jobId: string) => void;
  onStopSync: (jobId: string) => void;
  onUpdateNotificationSettings: (settings: NotificationSettings) => void;
  onTestNotification: (type: string) => void;
}

export const BackgroundSync: React.FC<BackgroundSyncProps> = ({
  syncJobs,
  notificationSettings,
  onStartSync,
  onPauseSync,
  onResumeSync,
  onStopSync,
  onUpdateNotificationSettings,
  onTestNotification,
}) => {
  const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);
  const [selectedJobType, setSelectedJobType] = useState<string>("all");

  const handleUpdateSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      setIsUpdatingSettings(true);
      await onUpdateNotificationSettings(newSettings);
      setIsUpdatingSettings(false);
    },
    [onUpdateNotificationSettings],
  );

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "running":
        return "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10";
      case "failed":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      case "paused":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "pending":
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case "incremental":
        return RefreshCw;
      case "full":
        return Database;
      case "manual":
        return Upload;
      default:
        return RotateCcw;
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
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

  const filteredJobs =
    selectedJobType === "all" ? syncJobs : syncJobs.filter(job => job.type === selectedJobType);

  const runningJobs = syncJobs.filter(job => job.status === "running");
  const completedJobs = syncJobs.filter(job => job.status === "completed");
  const failedJobs = syncJobs.filter(job => job.status === "failed");
  const pendingJobs = syncJobs.filter(job => job.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">Background Sync</h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Manage background synchronization and notifications
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => onTestNotification("sync-complete")}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Bell className="h-4 w-4" />
            <span>Test Notification</span>
          </Button>
        </div>
      </div>

      {/* Sync Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Running</div>
              <Activity className="h-4 w-4 text-[var(--sys-status-info)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-info)]">
              {runningJobs.length}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Active sync jobs</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Completed</div>
              <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-success)]">
              {completedJobs.length}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Successfully synced</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Failed</div>
              <AlertTriangle className="h-4 w-4 text-[var(--sys-status-error)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-error)]">
              {failedJobs.length}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Need attention</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Pending</div>
              <Clock className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {pendingJobs.length}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Queued for sync</div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5" />
            <span>Sync Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Job Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedJobType}
                onChange={e => setSelectedJobType(e.target.value)}
                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Filter by job type"
              >
                <option value="all">All Types</option>
                <option value="incremental">Incremental</option>
                <option value="full">Full Sync</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            {/* Jobs List */}
            <div className="space-y-3">
              {filteredJobs.map(job => {
                const JobIcon = getJobTypeIcon(job.type);
                return (
                  <div
                    key={job.id}
                    className="p-4 border border-[var(--sys-border-hairline)] rounded-lg hover:bg-[var(--sys-fill-low)] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <JobIcon className="h-4 w-4" />
                        <div>
                          <h4 className="font-medium text-[var(--sys-text-primary)]">{job.name}</h4>
                          <p className="text-sm text-[var(--sys-text-secondary)]">
                            {job.type.charAt(0).toUpperCase() + job.type.slice(1)} sync •
                            {job.itemsProcessed}/{job.totalItems} items •{job.retryCount} retries
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            getJobStatusColor(job.status),
                          )}
                        >
                          {job.status.toUpperCase()}
                        </div>
                        {job.status === "running" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onPauseSync(job.id)}
                            className="flex items-center space-x-1"
                          >
                            <Pause className="h-3 w-3" />
                            <span>Pause</span>
                          </Button>
                        )}
                        {job.status === "paused" && (
                          <Button
                            size="sm"
                            onClick={() => onResumeSync(job.id)}
                            className="flex items-center space-x-1"
                          >
                            <Play className="h-3 w-3" />
                            <span>Resume</span>
                          </Button>
                        )}
                        {job.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => onStartSync(job.id)}
                            className="flex items-center space-x-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            <span>Start</span>
                          </Button>
                        )}
                        {job.status === "failed" && (
                          <Button
                            size="sm"
                            onClick={() => onStartSync(job.id)}
                            className="flex items-center space-x-1"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Retry</span>
                          </Button>
                        )}
                        {(job.status === "running" || job.status === "paused") && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onStopSync(job.id)}
                            className="text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                          >
                            Stop
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {job.status === "running" && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-[var(--sys-text-tertiary)] mb-1">
                          <span>Progress</span>
                          <span>{job.progress}%</span>
                        </div>
                        <div className="w-full bg-[var(--sys-fill-low)] rounded-full h-2">
                          <div
                            className="bg-[var(--sys-accent)] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Job Details */}
                    <div className="mt-3 text-xs text-[var(--sys-text-tertiary)]">
                      {job.startedAt && `Started: ${formatTimeAgo(job.startedAt)}`}
                      {job.completedAt && ` • Completed: ${formatTimeAgo(job.completedAt)}`}
                      {job.duration && ` • Duration: ${formatDuration(job.duration)}`}
                      {job.error && ` • Error: ${job.error}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredJobs.length === 0 && (
              <div className="text-center py-8">
                <RotateCcw className="h-12 w-12 text-[var(--sys-text-tertiary)] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                  No Sync Jobs
                </h3>
                <p className="text-[var(--sys-text-secondary)]">
                  No sync jobs found for the selected filter.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Global Settings</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.enabled}
                    onChange={e =>
                      handleUpdateSettings({
                        ...notificationSettings,
                        enabled: e.target.checked,
                      })
                    }
                    className="rounded border-[var(--sys-border-hairline)]"
                    aria-label="Enable notifications"
                  />
                  <span className="text-sm text-[var(--sys-text-primary)]">
                    Enable Notifications
                  </span>
                </label>
              </div>
            </div>

            {/* Notification Types */}
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Notification Types</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.syncComplete}
                    onChange={e =>
                      handleUpdateSettings({
                        ...notificationSettings,
                        syncComplete: e.target.checked,
                      })
                    }
                    className="rounded border-[var(--sys-border-hairline)]"
                    aria-label="Sync complete notifications"
                  />
                  <span className="text-sm text-[var(--sys-text-primary)]">Sync Complete</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.syncFailed}
                    onChange={e =>
                      handleUpdateSettings({
                        ...notificationSettings,
                        syncFailed: e.target.checked,
                      })
                    }
                    className="rounded border-[var(--sys-border-hairline)]"
                    aria-label="Sync failed notifications"
                  />
                  <span className="text-sm text-[var(--sys-text-primary)]">Sync Failed</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.conflictsDetected}
                    onChange={e =>
                      handleUpdateSettings({
                        ...notificationSettings,
                        conflictsDetected: e.target.checked,
                      })
                    }
                    className="rounded border-[var(--sys-border-hairline)]"
                    aria-label="Conflicts detected notifications"
                  />
                  <span className="text-sm text-[var(--sys-text-primary)]">Conflicts Detected</span>
                </label>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.offlineMode}
                    onChange={e =>
                      handleUpdateSettings({
                        ...notificationSettings,
                        offlineMode: e.target.checked,
                      })
                    }
                    className="rounded border-[var(--sys-border-hairline)]"
                    aria-label="Offline mode notifications"
                  />
                  <span className="text-sm text-[var(--sys-text-primary)]">Offline Mode</span>
                </label>
              </div>
            </div>

            {/* Quiet Hours */}
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Quiet Hours</h4>
              <div className="space-y-3">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={notificationSettings.quietHours.enabled}
                    onChange={e =>
                      handleUpdateSettings({
                        ...notificationSettings,
                        quietHours: {
                          ...notificationSettings.quietHours,
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-[var(--sys-border-hairline)]"
                    aria-label="Enable quiet hours"
                  />
                  <span className="text-sm text-[var(--sys-text-primary)]">Enable Quiet Hours</span>
                </label>
                {notificationSettings.quietHours.enabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[var(--sys-text-secondary)] mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.start}
                        onChange={e =>
                          handleUpdateSettings({
                            ...notificationSettings,
                            quietHours: {
                              ...notificationSettings.quietHours,
                              start: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        aria-label="Quiet hours start time"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--sys-text-secondary)] mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={notificationSettings.quietHours.end}
                        onChange={e =>
                          handleUpdateSettings({
                            ...notificationSettings,
                            quietHours: {
                              ...notificationSettings.quietHours,
                              end: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                        aria-label="Quiet hours end time"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Test Notifications */}
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Test Notifications</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTestNotification("sync-complete")}
                  className="flex items-center space-x-1"
                >
                  <CheckCircle className="h-3 w-3" />
                  <span>Complete</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTestNotification("sync-failed")}
                  className="flex items-center space-x-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>Failed</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTestNotification("conflicts")}
                  className="flex items-center space-x-1"
                >
                  <GitBranch className="h-3 w-3" />
                  <span>Conflicts</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onTestNotification("offline")}
                  className="flex items-center space-x-1"
                >
                  <WifiOff className="h-3 w-3" />
                  <span>Offline</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sync Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Sync Capabilities</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Background Sync</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Automatic Sync
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Syncs data in the background when online
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Incremental Updates
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Only syncs changed data for efficiency
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
                      Automatically retries failed operations
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
                      Handles data conflicts intelligently
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Notifications</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Push Notifications
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Real-time updates on mobile devices
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Customizable Alerts
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Choose which events to be notified about
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Quiet Hours
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Silence notifications during specified times
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)]" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Rich Notifications
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Detailed information in notification content
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
