import React, { useState, Suspense, lazy } from "react";
import { Card } from "@aibos/ui/Card";
import { Button } from "@aibos/ui/Button";
import { Input } from "@aibos/ui/Input";
import { cn } from "@aibos/ui/utils";
import {
  Activity,
  Cloud,
  CloudOff,
  Database,
  GitBranch,
  Monitor,
  Search,
  Smartphone,
  RotateCcw,
  Zap,
} from "lucide-react";

// Lazy load components
const OfflineManager = lazy(() =>
  import("./OfflineManager.js").then(m => ({ default: m.OfflineManager })),
);
const ConflictResolver = lazy(() =>
  import("./ConflictResolver.js").then(m => ({ default: m.ConflictResolver })),
);
const BackgroundSync = lazy(() =>
  import("./BackgroundSync.js").then(m => ({ default: m.BackgroundSync })),
);
const MobileWorkflows = lazy(() =>
  import("./MobileWorkflows.js").then(m => ({ default: m.MobileWorkflows })),
);
const ProgressiveWebApp = lazy(() =>
  import("./ProgressiveWebApp.js").then(m => ({ default: m.ProgressiveWebApp })),
);

interface MobileOfflineWorkflowProps {
  // Offline manager props
  syncStatus: any;
  pendingOperations: any[];
  onSyncNow: () => void;
  onRetryOperation: (operationId: string) => void;
  onClearFailedOperations: () => void;
  onViewOperationDetails: (operationId: string) => void;

  // Conflict resolver props
  conflicts: any[];
  onResolveConflict: (resolution: any) => void;
  onResolveAllConflicts: (resolutions: any[]) => void;
  onViewEntity: (entity: string, entityId: string) => void;
  onIgnoreConflict: (conflictId: string) => void;

  // Background sync props
  syncJobs: any[];
  notificationSettings: any;
  onStartSync: (jobId: string) => void;
  onPauseSync: (jobId: string) => void;
  onResumeSync: (jobId: string) => void;
  onStopSync: (jobId: string) => void;
  onUpdateNotificationSettings: (settings: any) => void;
  onTestNotification: (type: string) => void;

  // Mobile workflows props
  workflows: any[];
  activeWorkflow?: string;
  onStartWorkflow: (workflowId: string) => void;
  onCompleteStep: (workflowId: string, stepId: string, data: any) => void;
  onSkipStep: (workflowId: string, stepId: string) => void;
  onFinishWorkflow: (workflowId: string) => void;
  onViewWorkflow: (workflowId: string) => void;

  // PWA props
  pwaStatus: any;
  capabilities: any;
  performance: any;
  onInstall: () => void;
  onUpdate: () => void;
  onUninstall: () => void;
  onEnableCapability: (capability: string) => void;
  onDisableCapability: (capability: string) => void;
  onClearCache: () => void;
  onOptimizePerformance: () => void;
}

export const MobileOfflineWorkflow: React.FC<MobileOfflineWorkflowProps> = ({
  syncStatus,
  pendingOperations,
  onSyncNow,
  onRetryOperation,
  onClearFailedOperations,
  onViewOperationDetails,
  conflicts,
  onResolveConflict,
  onResolveAllConflicts,
  onViewEntity,
  onIgnoreConflict,
  syncJobs,
  notificationSettings,
  onStartSync,
  onPauseSync,
  onResumeSync,
  onStopSync,
  onUpdateNotificationSettings,
  onTestNotification,
  workflows,
  activeWorkflow,
  onStartWorkflow,
  onCompleteStep,
  onSkipStep,
  onFinishWorkflow,
  onViewWorkflow,
  pwaStatus,
  capabilities,
  performance,
  onInstall,
  onUpdate,
  onUninstall,
  onEnableCapability,
  onDisableCapability,
  onClearCache,
  onOptimizePerformance,
}) => {
  const [activeSection, setActiveSection] = useState<string>("offline");
  const [searchTerm, setSearchTerm] = useState("");

  const sections = [
    {
      id: "offline",
      name: "Offline Manager",
      description: "Manage offline operations and data synchronization",
      icon: CloudOff,
      color: "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10",
    },
    {
      id: "conflicts",
      name: "Conflict Resolution",
      description: "Resolve data conflicts between local and server versions",
      icon: GitBranch,
      color: "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10",
    },
    {
      id: "sync",
      name: "Background Sync",
      description: "Manage background synchronization and notifications",
      icon: RotateCcw,
      color: "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10",
    },
    {
      id: "workflows",
      name: "Mobile Workflows",
      description: "Touch-optimized workflows for mobile devices",
      icon: Smartphone,
      color: "text-[var(--sys-accent)] bg-[var(--sys-accent)]/10",
    },
    {
      id: "pwa",
      name: "Progressive Web App",
      description: "Mobile app experience with web technology",
      icon: Monitor,
      color: "text-[var(--sys-text-primary)] bg-[var(--sys-fill-low)]",
    },
  ];

  const filteredSections = sections.filter(
    section =>
      section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const currentSection = sections.find(s => s.id === activeSection);

  return (
    <div className="flex flex-col md:flex-row h-full bg-[var(--sys-bg-surface)]">
      {/* Sidebar Navigation */}
      <Card className="w-full md:w-64 flex-shrink-0 border-r border-[var(--sys-border-hairline)] bg-[var(--sys-bg-primary)] p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[var(--sys-text-primary)] mb-2">
            Mobile & Offline
          </h2>
          <Input
            type="text"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label="Search mobile and offline sections"
          />
        </div>
        <nav className="space-y-2">
          {filteredSections.map(section => {
            const Icon = section.icon;
            return (
              <Button
                key={section.id}
                variant="ghost"
                className={cn(
                  "w-full justify-start text-[var(--sys-text-secondary)] hover:text-[var(--sys-text-primary)] p-3",
                  activeSection === section.id &&
                  "bg-[var(--sys-fill-low)] text-[var(--sys-text-primary)]",
                )}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? "page" : undefined}
              >
                <div className="flex items-center space-x-3 w-full">
                  <div className={cn("p-2 rounded-lg", section.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs text-[var(--sys-text-tertiary)]">
                      {section.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>
      </Card>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 overflow-auto">
        <Card className="h-full p-6 bg-[var(--sys-bg-primary)]">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--sys-accent)] mx-auto mb-4"></div>
                  <p className="text-[var(--sys-text-secondary)]">Loading...</p>
                </div>
              </div>
            }
          >
            {activeSection === "offline" && (
              <OfflineManager
                syncStatus={syncStatus}
                pendingOperations={pendingOperations}
                onSyncNow={onSyncNow}
                onRetryOperation={onRetryOperation}
                onClearFailedOperations={onClearFailedOperations}
                onViewOperationDetails={onViewOperationDetails}
              />
            )}
            {activeSection === "conflicts" && (
              <ConflictResolver
                conflicts={conflicts}
                onResolveConflict={onResolveConflict}
                onResolveAllConflicts={onResolveAllConflicts}
                onViewEntity={onViewEntity}
                onIgnoreConflict={onIgnoreConflict}
              />
            )}
            {activeSection === "sync" && (
              <BackgroundSync
                syncJobs={syncJobs}
                notificationSettings={notificationSettings}
                onStartSync={onStartSync}
                onPauseSync={onPauseSync}
                onResumeSync={onResumeSync}
                onStopSync={onStopSync}
                onUpdateNotificationSettings={onUpdateNotificationSettings}
                onTestNotification={onTestNotification}
              />
            )}
            {activeSection === "workflows" && (
              <MobileWorkflows
                workflows={workflows}
                activeWorkflow={activeWorkflow}
                onStartWorkflow={onStartWorkflow}
                onCompleteStep={onCompleteStep}
                onSkipStep={onSkipStep}
                onFinishWorkflow={onFinishWorkflow}
                onViewWorkflow={onViewWorkflow}
              />
            )}
            {activeSection === "pwa" && (
              <ProgressiveWebApp
                pwaStatus={pwaStatus}
                capabilities={capabilities}
                performance={performance}
                onInstall={onInstall}
                onUpdate={onUpdate}
                onUninstall={onUninstall}
                onEnableCapability={onEnableCapability}
                onDisableCapability={onDisableCapability}
                onClearCache={onClearCache}
                onOptimizePerformance={onOptimizePerformance}
              />
            )}
          </Suspense>
        </Card>
      </main>
    </div>
  );
};
