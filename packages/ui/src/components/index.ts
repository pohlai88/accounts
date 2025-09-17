/**
 * Components Index - SSOT Compliant
 *
 * Single source of truth for all component exports
 * All components follow semantic token system
 */

// Empty States
export { EmptyState } from "./empty-states/EmptyState.js";
export { InvoiceEmptyState } from "./empty-states/InvoiceEmptyState.js";
export { BillEmptyState } from "./empty-states/BillEmptyState.js";

// App Shell
export { AppShell } from "./app-shell/AppShell.js";
export { StatusBar } from "./app-shell/StatusBar.js";
export { Dock } from "./app-shell/Dock.js";
export { CommandPalette } from "./app-shell/CommandPalette.js";
export { UniversalInbox } from "./app-shell/UniversalInbox.js";
export { TimelineDrawer } from "./app-shell/TimelineDrawer.js";
export { UniversalCreate } from "./app-shell/UniversalCreate.js";

// Common Components
export { ErrorBoundary, ErrorBoundaryProvider, DefaultErrorFallback, MinimalErrorFallback, useErrorHandler } from "./common/index.js";
export { AccessibilityProvider, AccessibilityToolbar, useAccessibility, useAccessibilityPreferences, useAccessibilityAnnouncements } from "./common/index.js";
export { ResponsiveProvider, ResponsiveComponent, ResponsiveHide, ResponsiveShow, ResponsiveGrid, ResponsiveDebug, useResponsive, useBreakpoint, useDeviceType, useOrientation, useScreenSize, useTouchEnabled, ResponsiveUtils } from "./common/index.js";

// Account Management Components
export { ChartOfAccounts } from "./accounts/index.js";

// Period Management Components
export { PeriodManagement } from "./periods/index.js";

// Payment Processing Components
export { PaymentProcessing } from "./payments/index.js";

// Dashboard Components
export { Dashboard } from "./dashboard/index.js";

// Typography
export {
  Typography,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Body,
  BodySmall,
  Caption,
  Link,
} from "./typography/Typography.js";

// Theme
export { ThemeProvider, useTheme } from "./theme/ThemeProvider.js";
export { ThemeToggle } from "./theme/ThemeToggle.js";

// Invoice Components
export { InvoiceWorkflow } from "./invoices/InvoiceWorkflow.js";
export { InvoiceForm } from "./invoices/InvoiceForm.js";
export { InvoiceList } from "./invoices/InvoiceList.js";
export { CustomerSelector } from "./invoices/CustomerSelector.js";
export { PaymentCapture } from "./invoices/PaymentCapture.js";
export { InvoiceSender } from "./invoices/InvoiceSender.js";
export { PaymentReminders } from "./invoices/PaymentReminders.js";
export { InvoiceStatusTimeline } from "./invoices/InvoiceStatusTimeline.js";

// Bill Components
export { BillWorkflow } from "./bills/BillWorkflow.js";
export { BillForm } from "./bills/BillForm.js";
export { OCRDataExtractor } from "./bills/OCRDataExtractor.js";
export { ApprovalWorkflow } from "./bills/ApprovalWorkflow.js";
export { PaymentProcessor } from "./bills/PaymentProcessor.js";
export { VendorManager } from "./bills/VendorManager.js";
export { ExpenseCategorizer } from "./bills/ExpenseCategorizer.js";

// Cash Components
export { CashWorkflow } from "./cash/CashWorkflow.js";
export { BankConnection } from "./cash/BankConnection.js";
export { TransactionImport } from "./cash/TransactionImport.js";
export { ReconciliationCanvas } from "./cash/ReconciliationCanvas.js";
export { RuleEngine } from "./cash/RuleEngine.js";
export { BankFeedManagement } from "./cash/BankFeedManagement.js";
export { CashFlowAnalysis } from "./cash/CashFlowAnalysis.js";

// Close Components
export { CloseWorkflow } from "./close/CloseWorkflow.js";
export { CloseRoom } from "./close/CloseRoom.js";
export { CloseChecklist } from "./close/CloseChecklist.js";
export { LockStates } from "./close/LockStates.js";
export { AccrualHelpers } from "./close/AccrualHelpers.js";
export { AdjustingEntries } from "./close/AdjustingEntries.js";
export { ExportPackBuilder } from "./close/ExportPackBuilder.js";

// Reports Components
export { ReportsWorkflow } from "./reports/ReportsWorkflow.js";
export { ProfitLossReport } from "./reports/ProfitLossReport.js";
export { BalanceSheetReport } from "./reports/BalanceSheetReport.js";
export { CashFlowStatement } from "./reports/CashFlowStatement.js";
export { TrialBalance } from "./reports/TrialBalance.js";
export { ARAgingReport } from "./reports/ARAgingReport.js";
export { APAgingReport } from "./reports/APAgingReport.js";
export { CustomReportBuilder } from "./reports/CustomReportBuilder.js";

// Enterprise Components
export { EnterpriseWorkflow } from "./enterprise/EnterpriseWorkflow.js";
export { MultiCompanyManager } from "./enterprise/MultiCompanyManager.js";
export { UserRolesManager } from "./enterprise/UserRolesManager.js";
export { ChartOfAccountsManager } from "./enterprise/ChartOfAccountsManager.js";
export { CompanySettingsManager } from "./enterprise/CompanySettingsManager.js";

// Performance & Security Components
export { PerformanceSecurityWorkflow } from "./performance/PerformanceSecurityWorkflow.js";
export { PerformanceMonitor } from "./performance/PerformanceMonitor.js";
export { SecurityAudit } from "./performance/SecurityAudit.js";
export { DataEncryption } from "./performance/DataEncryption.js";
export { BackupRecovery } from "./performance/BackupRecovery.js";
export { MonitoringAlerting } from "./performance/MonitoringAlerting.js";
export { LoadTesting } from "./performance/LoadTesting.js";

// Mobile & Offline Components
export { MobileOfflineWorkflow } from "./mobile/MobileOfflineWorkflow.js";
export { OfflineManager } from "./mobile/OfflineManager.js";
export { ConflictResolver } from "./mobile/ConflictResolver.js";
export { BackgroundSync } from "./mobile/BackgroundSync.js";
export { MobileWorkflows } from "./mobile/MobileWorkflows.js";
export { ProgressiveWebApp } from "./mobile/ProgressiveWebApp.js";

// Rule Studio & Automation Components
export { RuleWorkflow } from "./rules/RuleWorkflow.js";
export { RuleStudio } from "./rules/RuleStudio.js";
export { RuleTesting } from "./rules/RuleTesting.js";
export { RuleAnalytics } from "./rules/RuleAnalytics.js";
export { RuleVersioning } from "./rules/RuleVersioning.js";

// Tenant Management Components
export { TenantOnboarding } from "./onboarding/TenantOnboarding.js";
export { UserManagement } from "./users/UserManagement.js";
export { default as TenantSwitcher } from "./tenant-switcher.js";
export { default as MemberManagement } from "./member-management.js";

// SaaS Features Components
export { SubscriptionManagement } from "./subscriptions/SubscriptionManagement.js";
export { UsageDashboard } from "./usage/UsageDashboard.js";
export { FeatureFlags } from "./features/FeatureFlags.js";

// Common Components (already exported above)
