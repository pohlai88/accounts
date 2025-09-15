import React, { useState, Suspense, lazy } from "react";
import { Card } from "@aibos/ui/Card";
import { Button } from "@aibos/ui/Button";
import { Input } from "@aibos/ui/Input";
import { cn } from "@aibos/ui/utils";
import {
  Activity,
  AlertTriangle,
  Database,
  HardDrive,
  Lock,
  Monitor,
  Search,
  Shield,
  Zap,
} from "lucide-react";

// Lazy load components
const PerformanceMonitor = lazy(() =>
  import("./PerformanceMonitor.js").then(m => ({ default: m.PerformanceMonitor })),
);
const SecurityAudit = lazy(() =>
  import("./SecurityAudit.js").then(m => ({ default: m.SecurityAudit })),
);
const DataEncryption = lazy(() =>
  import("./DataEncryption.js").then(m => ({ default: m.DataEncryption })),
);
const BackupRecovery = lazy(() =>
  import("./BackupRecovery.js").then(m => ({ default: m.BackupRecovery })),
);
const MonitoringAlerting = lazy(() =>
  import("./MonitoringAlerting.js").then(m => ({ default: m.MonitoringAlerting })),
);
const LoadTesting = lazy(() => import("./LoadTesting.js").then(m => ({ default: m.LoadTesting })));

interface PerformanceSecurityWorkflowProps {
  // Performance monitoring props
  performanceMetrics: any;
  performanceAlerts: any[];
  onRefreshPerformance: () => void;
  onResolvePerformanceAlert: (alertId: string) => void;
  onOptimizePerformance: (optimizationType: string) => void;

  // Security audit props
  vulnerabilities: any[];
  compliance: any[];
  onRunSecurityAudit: () => void;
  onResolveVulnerability: (vulnerabilityId: string) => void;
  onGenerateSecurityReport: () => void;
  onExportSecurityFindings: () => void;

  // Data encryption props
  encryptionStatus: any[];
  privacyCompliance: any[];
  onEncryptData: (dataId: string) => void;
  onRotateKeys: () => void;
  onGenerateEncryptionReport: () => void;
  onUpdateCompliance: (standard: string, requirementId: string) => void;

  // Backup recovery props
  backupJobs: any[];
  recoveryPoints: any[];
  disasterRecoveryPlans: any[];
  onRunBackup: (jobId: string) => void;
  onRestoreFromBackup: (recoveryPointId: string) => void;
  onTestDisasterRecovery: (planId: string) => void;
  onCreateBackupJob: () => void;
  onDeleteBackup: (backupId: string) => void;

  // Monitoring alerting props
  alertRules: any[];
  alerts: any[];
  notificationChannels: any[];
  monitoringMetrics: any[];
  onCreateAlertRule: () => void;
  onUpdateAlertRule: (ruleId: string) => void;
  onDeleteAlertRule: (ruleId: string) => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onResolveAlert: (alertId: string) => void;
  onTestChannel: (channelId: string) => void;
  onUpdateChannel: (channelId: string) => void;

  // Load testing props
  loadTests: any[];
  capacityPlans: any[];
  onRunLoadTest: (testId: string) => void;
  onStopLoadTest: (testId: string) => void;
  onCreateLoadTest: () => void;
  onDeleteLoadTest: (testId: string) => void;
  onCreateCapacityPlan: () => void;
  onUpdateCapacityPlan: (planId: string) => void;
  onGenerateLoadTestReport: (testId: string) => void;
}

export const PerformanceSecurityWorkflow: React.FC<PerformanceSecurityWorkflowProps> = ({
  performanceMetrics,
  performanceAlerts,
  onRefreshPerformance,
  onResolvePerformanceAlert,
  onOptimizePerformance,
  vulnerabilities,
  compliance,
  onRunSecurityAudit,
  onResolveVulnerability,
  onGenerateSecurityReport,
  onExportSecurityFindings,
  encryptionStatus,
  privacyCompliance,
  onEncryptData,
  onRotateKeys,
  onGenerateEncryptionReport,
  onUpdateCompliance,
  backupJobs,
  recoveryPoints,
  disasterRecoveryPlans,
  onRunBackup,
  onRestoreFromBackup,
  onTestDisasterRecovery,
  onCreateBackupJob,
  onDeleteBackup,
  alertRules,
  alerts,
  notificationChannels,
  monitoringMetrics,
  onCreateAlertRule,
  onUpdateAlertRule,
  onDeleteAlertRule,
  onAcknowledgeAlert,
  onResolveAlert,
  onTestChannel,
  onUpdateChannel,
  loadTests,
  capacityPlans,
  onRunLoadTest,
  onStopLoadTest,
  onCreateLoadTest,
  onDeleteLoadTest,
  onCreateCapacityPlan,
  onUpdateCapacityPlan,
  onGenerateLoadTestReport,
}) => {
  const [activeSection, setActiveSection] = useState<string>("performance");
  const [searchTerm, setSearchTerm] = useState("");

  const sections = [
    {
      id: "performance",
      name: "Performance Monitor",
      description: "Real-time performance metrics and optimization",
      icon: Activity,
      color: "text-[var(--sys-accent)] bg-[var(--sys-accent)]/10",
    },
    {
      id: "security",
      name: "Security Audit",
      description: "Vulnerability assessment and compliance",
      icon: Shield,
      color: "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10",
    },
    {
      id: "encryption",
      name: "Data Encryption",
      description: "Data protection and privacy compliance",
      icon: Lock,
      color: "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10",
    },
    {
      id: "backup",
      name: "Backup & Recovery",
      description: "Backup management and disaster recovery",
      icon: HardDrive,
      color: "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10",
    },
    {
      id: "monitoring",
      name: "Monitoring & Alerting",
      description: "Real-time monitoring and notifications",
      icon: Monitor,
      color: "text-[var(--sys-status-info)] bg-[var(--sys-status-info)]/10",
    },
    {
      id: "load-testing",
      name: "Load Testing",
      description: "Performance testing and capacity planning",
      icon: Zap,
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
            Performance & Security
          </h2>
          <Input
            type="text"
            placeholder="Search sections..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
            aria-label="Search performance and security sections"
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
            {activeSection === "performance" && (
              <PerformanceMonitor
                metrics={performanceMetrics}
                alerts={performanceAlerts}
                onRefresh={onRefreshPerformance}
                onResolveAlert={onResolvePerformanceAlert}
                onOptimize={onOptimizePerformance}
              />
            )}
            {activeSection === "security" && (
              <SecurityAudit
                vulnerabilities={vulnerabilities}
                compliance={compliance}
                onRunAudit={onRunSecurityAudit}
                onResolveVulnerability={onResolveVulnerability}
                onGenerateReport={onGenerateSecurityReport}
                onExportFindings={onExportSecurityFindings}
              />
            )}
            {activeSection === "encryption" && (
              <DataEncryption
                encryptionStatus={encryptionStatus}
                privacyCompliance={privacyCompliance}
                onEncryptData={onEncryptData}
                onRotateKeys={onRotateKeys}
                onGenerateReport={onGenerateEncryptionReport}
                onUpdateCompliance={onUpdateCompliance}
              />
            )}
            {activeSection === "backup" && (
              <BackupRecovery
                backupJobs={backupJobs}
                recoveryPoints={recoveryPoints}
                disasterRecoveryPlans={disasterRecoveryPlans}
                onRunBackup={onRunBackup}
                onRestoreFromBackup={onRestoreFromBackup}
                onTestDisasterRecovery={onTestDisasterRecovery}
                onCreateBackupJob={onCreateBackupJob}
                onDeleteBackup={onDeleteBackup}
              />
            )}
            {activeSection === "monitoring" && (
              <MonitoringAlerting
                alertRules={alertRules}
                alerts={alerts}
                notificationChannels={notificationChannels}
                metrics={monitoringMetrics}
                onCreateAlertRule={onCreateAlertRule}
                onUpdateAlertRule={onUpdateAlertRule}
                onDeleteAlertRule={onDeleteAlertRule}
                onAcknowledgeAlert={onAcknowledgeAlert}
                onResolveAlert={onResolveAlert}
                onTestChannel={onTestChannel}
                onUpdateChannel={onUpdateChannel}
              />
            )}
            {activeSection === "load-testing" && (
              <LoadTesting
                loadTests={loadTests}
                capacityPlans={capacityPlans}
                onRunLoadTest={onRunLoadTest}
                onStopLoadTest={onStopLoadTest}
                onCreateLoadTest={onCreateLoadTest}
                onDeleteLoadTest={onDeleteLoadTest}
                onCreateCapacityPlan={onCreateCapacityPlan}
                onUpdateCapacityPlan={onUpdateCapacityPlan}
                onGenerateReport={onGenerateLoadTestReport}
              />
            )}
          </Suspense>
        </Card>
      </main>
    </div>
  );
};
