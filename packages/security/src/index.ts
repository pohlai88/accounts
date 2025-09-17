// Export all runtime functionality
export * from "./auth";
export * from "./advanced-security";
export * from "./encryption";
export * from "./audit-logger";
export * from "./auditEvent";

// Export new security modules - using explicit exports to avoid conflicts
export { SecurityAuditManager, securityAuditManager } from "./security-audit";
export { DisasterRecoveryManager, disasterRecoveryManager } from "./disaster-recovery";
export { ComplianceManager } from "./compliance-manager";
export { DataProtectionManager } from "./data-protection";
export { AccessControlManager } from "./access-control";
export { SecurityMonitoringManager } from "./security-monitoring";
export { ComplianceReportingManager, complianceReportingManager } from "./compliance-reporting";

// Explicitly export conflicting types to resolve ambiguity
export type { SecurityRule as SecurityAuditRule } from "./security-audit";
export type { SecurityRule as SecurityMonitoringRule } from "./security-monitoring";
export type { ComplianceEvidence as ComplianceManagerEvidence } from "./compliance-manager";
export type { ComplianceFinding as ComplianceManagerFinding } from "./compliance-manager";
export type { ComplianceReport as ComplianceManagerReport } from "./compliance-manager";
export type { ComplianceEvidence as ComplianceReportingEvidence } from "./compliance-reporting";
export type { ComplianceFinding as ComplianceReportingFinding } from "./compliance-reporting";
export type { ComplianceReport as ComplianceReportingReport } from "./compliance-reporting";

// Export all types from SSOT types file
export * from "./types.js";
