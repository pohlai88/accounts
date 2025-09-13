/**
 * Components Index - SSOT Compliant
 * 
 * Single source of truth for all component exports
 * All components follow semantic token system
 */

// Empty States
export { EmptyState } from './empty-states/EmptyState';
export { InvoiceEmptyState } from './empty-states/InvoiceEmptyState';
export { BillEmptyState } from './empty-states/BillEmptyState';

// App Shell
export { AppShell } from './app-shell/AppShell';
export { StatusBar } from './app-shell/StatusBar';
export { Dock } from './app-shell/Dock';
export { CommandPalette } from './app-shell/CommandPalette';
export { UniversalInbox } from './app-shell/UniversalInbox';
export { TimelineDrawer } from './app-shell/TimelineDrawer';
export { UniversalCreate } from './app-shell/UniversalCreate';

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
    Link
} from './typography/Typography';

// Theme
export { ThemeProvider, useTheme } from './theme/ThemeProvider';
export { ThemeToggle } from './theme/ThemeToggle';

// Invoice Components
export { InvoiceWorkflow } from './invoices/InvoiceWorkflow';
export { InvoiceForm } from './invoices/InvoiceForm';
export { InvoiceList } from './invoices/InvoiceList';
export { CustomerSelector } from './invoices/CustomerSelector';
export { PaymentCapture } from './invoices/PaymentCapture';
export { InvoiceSender } from './invoices/InvoiceSender';
export { PaymentReminders } from './invoices/PaymentReminders';
export { InvoiceStatusTimeline } from './invoices/InvoiceStatusTimeline';

// Bill Components
export { BillWorkflow } from './bills/BillWorkflow';
export { BillForm } from './bills/BillForm';
export { OCRDataExtractor } from './bills/OCRDataExtractor';
export { ApprovalWorkflow } from './bills/ApprovalWorkflow';
export { PaymentProcessor } from './bills/PaymentProcessor';
export { VendorManager } from './bills/VendorManager';
export { ExpenseCategorizer } from './bills/ExpenseCategorizer';

// Cash Components
export { CashWorkflow } from './cash/CashWorkflow';
export { BankConnection } from './cash/BankConnection';
export { TransactionImport } from './cash/TransactionImport';
export { ReconciliationCanvas } from './cash/ReconciliationCanvas';
export { RuleEngine } from './cash/RuleEngine';
export { BankFeedManagement } from './cash/BankFeedManagement';
export { CashFlowAnalysis } from './cash/CashFlowAnalysis';

// Close Components
export { CloseWorkflow } from './close/CloseWorkflow';
export { CloseRoom } from './close/CloseRoom';
export { CloseChecklist } from './close/CloseChecklist';
export { LockStates } from './close/LockStates';
export { AccrualHelpers } from './close/AccrualHelpers';
export { AdjustingEntries } from './close/AdjustingEntries';
export { ExportPackBuilder } from './close/ExportPackBuilder';

// Reports Components
export { ReportsWorkflow } from './reports/ReportsWorkflow';
export { ProfitLossReport } from './reports/ProfitLossReport';
export { BalanceSheetReport } from './reports/BalanceSheetReport';
export { CashFlowStatement } from './reports/CashFlowStatement';
export { TrialBalance } from './reports/TrialBalance';
export { ARAgingReport } from './reports/ARAgingReport';
export { APAgingReport } from './reports/APAgingReport';
export { CustomReportBuilder } from './reports/CustomReportBuilder';

// Enterprise Components
export { EnterpriseWorkflow } from './enterprise/EnterpriseWorkflow';
export { MultiCompanyManager } from './enterprise/MultiCompanyManager';
export { UserRolesManager } from './enterprise/UserRolesManager';
export { ChartOfAccountsManager } from './enterprise/ChartOfAccountsManager';
export { CompanySettingsManager } from './enterprise/CompanySettingsManager';

// Performance & Security Components
export { PerformanceSecurityWorkflow } from './performance/PerformanceSecurityWorkflow';
export { PerformanceMonitor } from './performance/PerformanceMonitor';
export { SecurityAudit } from './performance/SecurityAudit';
export { DataEncryption } from './performance/DataEncryption';
export { BackupRecovery } from './performance/BackupRecovery';
export { MonitoringAlerting } from './performance/MonitoringAlerting';
export { LoadTesting } from './performance/LoadTesting';

// Mobile & Offline Components
export { MobileOfflineWorkflow } from './mobile/MobileOfflineWorkflow';
export { OfflineManager } from './mobile/OfflineManager';
export { ConflictResolver } from './mobile/ConflictResolver';
export { BackgroundSync } from './mobile/BackgroundSync';
export { MobileWorkflows } from './mobile/MobileWorkflows';
export { ProgressiveWebApp } from './mobile/ProgressiveWebApp';

// Rule Studio & Automation Components
export { RuleWorkflow } from './rules/RuleWorkflow';
export { RuleStudio } from './rules/RuleStudio';
export { RuleTesting } from './rules/RuleTesting';
export { RuleAnalytics } from './rules/RuleAnalytics';
export { RuleVersioning } from './rules/RuleVersioning';
