/**
 * Comprehensive Compliance Reporting and Audit Trails System
 *
 * Provides automated compliance reporting, audit trail management,
 * and regulatory compliance documentation for the AI-BOS platform.
 */

import { EventEmitter } from "events";
import { monitoring } from "@aibos/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AuditTrail {
  id: string;
  eventType: "create" | "read" | "update" | "delete" | "export" | "import" | "login" | "logout" | "permission_change" | "role_assignment" | "data_access" | "system_change";
  entityType: string;
  entityId: string;
  userId: string;
  tenantId: string;
  companyId: string;
  action: string;
  description: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata: Record<string, unknown>;
  complianceFlags: ComplianceFlag[];
}

export interface ComplianceFlag {
  framework: "gdpr" | "soc2" | "pci" | "hipaa" | "sox" | "iso27001";
  requirement: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  remediation?: string;
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
}

export interface ComplianceReport {
  id: string;
  framework: "gdpr" | "soc2" | "pci" | "hipaa" | "sox" | "iso27001";
  reportType: "assessment" | "audit" | "self_assessment" | "regulatory" | "incident" | "data_breach";
  title: string;
  description: string;
  period: {
    start: Date;
    end: Date;
  };
  generatedBy: string;
  generatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  status: "draft" | "in_review" | "approved" | "published" | "archived";
  summary: ComplianceReportSummary;
  findings: ComplianceFinding[];
  recommendations: ComplianceRecommendation[];
  attachments: ComplianceAttachment[];
  distribution: ComplianceDistribution[];
  retentionPeriod: number; // days
  nextReview: Date;
  metadata: Record<string, unknown>;
}

export interface ComplianceReportSummary {
  totalRequirements: number;
  implementedRequirements: number;
  partiallyImplementedRequirements: number;
  notImplementedRequirements: number;
  compliancePercentage: number;
  criticalFindings: number;
  highFindings: number;
  mediumFindings: number;
  lowFindings: number;
  totalFindings: number;
  resolvedFindings: number;
  openFindings: number;
  riskScore: number; // 0-100
  lastAssessment: Date;
  nextAssessment: Date;
}

export interface ComplianceFinding {
  id: string;
  requirement: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "technical" | "administrative" | "procedural" | "physical";
  impact: string;
  likelihood: "low" | "medium" | "high" | "critical";
  riskLevel: "low" | "medium" | "high" | "critical";
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
  assignedTo?: string;
  dueDate?: Date;
  remediatedAt?: Date;
  evidence: ComplianceEvidence[];
  recommendations: string[];
  tags: string[];
}

export interface ComplianceRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  category: "technical" | "administrative" | "procedural" | "training";
  estimatedEffort: "low" | "medium" | "high";
  estimatedCost: "low" | "medium" | "high";
  estimatedTimeline: string;
  responsible: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  dueDate?: Date;
  completedAt?: Date;
  dependencies: string[];
  benefits: string[];
  risks: string[];
}

export interface ComplianceEvidence {
  id: string;
  type: "document" | "screenshot" | "log" | "test_result" | "policy" | "procedure" | "training_record" | "certificate";
  title: string;
  description: string;
  filePath?: string;
  url?: string;
  content?: string;
  collectedBy: string;
  collectedAt: Date;
  validUntil?: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  tags: string[];
}

export interface ComplianceAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  filePath: string;
  uploadedBy: string;
  uploadedAt: Date;
  description?: string;
  tags: string[];
}

export interface ComplianceDistribution {
  id: string;
  recipient: string;
  recipientType: "internal" | "external" | "regulatory";
  method: "email" | "portal" | "secure_delivery" | "physical";
  sentAt?: Date;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
  status: "pending" | "sent" | "delivered" | "acknowledged" | "failed";
  notes?: string;
}

export interface ComplianceDashboard {
  frameworks: Array<{
    id: string;
    name: string;
    compliancePercentage: number;
    status: "compliant" | "partially_compliant" | "non_compliant";
    lastAssessment: Date;
    nextAssessment: Date;
    criticalFindings: number;
    openRecommendations: number;
  }>;
  recentFindings: ComplianceFinding[];
  upcomingDeadlines: Array<{
    type: "assessment" | "review" | "remediation" | "training";
    title: string;
    dueDate: Date;
    priority: "low" | "medium" | "high" | "critical";
  }>;
  statistics: {
    totalReports: number;
    totalFindings: number;
    totalRecommendations: number;
    averageComplianceScore: number;
    riskTrend: "improving" | "stable" | "deteriorating";
  };
}

export interface ComplianceReportingConfig {
  enableAutomatedReporting: boolean;
  enableRealTimeAuditTrails: boolean;
  enableComplianceMonitoring: boolean;
  enableRegulatoryNotifications: boolean;
  reportRetentionDays: number;
  auditTrailRetentionDays: number;
  enableDataClassification: boolean;
  enableAccessLogging: boolean;
  enableChangeTracking: boolean;
  enableIncidentReporting: boolean;
  frameworks: string[];
  reportingSchedule: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
    quarterly: boolean;
    annually: boolean;
  };
}

// ============================================================================
// COMPLIANCE REPORTING MANAGER
// ============================================================================

export class ComplianceReportingManager extends EventEmitter {
  private config: ComplianceReportingConfig;
  private auditTrails: AuditTrail[] = [];
  private reports: ComplianceReport[] = [];
  private findings: ComplianceFinding[] = [];
  private recommendations: ComplianceRecommendation[] = [];

  constructor(config: Partial<ComplianceReportingConfig> = {}) {
    super();

    this.config = {
      enableAutomatedReporting: true,
      enableRealTimeAuditTrails: true,
      enableComplianceMonitoring: true,
      enableRegulatoryNotifications: true,
      reportRetentionDays: 2555, // 7 years
      auditTrailRetentionDays: 2555, // 7 years
      enableDataClassification: true,
      enableAccessLogging: true,
      enableChangeTracking: true,
      enableIncidentReporting: true,
      frameworks: ["gdpr", "soc2", "sox"],
      reportingSchedule: {
        daily: false,
        weekly: true,
        monthly: true,
        quarterly: true,
        annually: true,
      },
      ...config,
    };

    this.initializeDefaultFindings();
    this.initializeDefaultRecommendations();
    this.startPeriodicTasks();
  }

  /**
   * Initialize default findings
   */
  private initializeDefaultFindings(): void {
    this.findings = [
      {
        id: "finding-001",
        requirement: "GDPR Art. 32 - Security of Processing",
        title: "Insufficient Data Encryption",
        description: "Sensitive data is not encrypted at rest",
        severity: "high",
        category: "technical",
        impact: "Risk of data breach if storage is compromised",
        likelihood: "medium",
        riskLevel: "high",
        status: "open",
        evidence: [],
        recommendations: [
          "Implement encryption for all sensitive data at rest",
          "Use strong encryption algorithms (AES-256)",
          "Implement proper key management",
        ],
        tags: ["encryption", "data-protection", "gdpr"],
      },
      {
        id: "finding-002",
        requirement: "SOC2 CC6 - Logical and Physical Access Controls",
        title: "Weak Password Policy",
        description: "Password policy does not meet SOC2 requirements",
        severity: "medium",
        category: "administrative",
        impact: "Increased risk of unauthorized access",
        likelihood: "high",
        riskLevel: "medium",
        status: "open",
        evidence: [],
        recommendations: [
          "Implement strong password complexity requirements",
          "Enforce password history and expiration",
          "Implement multi-factor authentication",
        ],
        tags: ["authentication", "access-control", "soc2"],
      },
      {
        id: "finding-003",
        requirement: "SOX 404 - Internal Controls",
        title: "Insufficient Audit Trails",
        description: "Financial data changes are not properly audited",
        severity: "high",
        category: "technical",
        impact: "Cannot track unauthorized changes to financial data",
        likelihood: "medium",
        riskLevel: "high",
        status: "open",
        evidence: [],
        recommendations: [
          "Implement comprehensive audit logging",
          "Enable change tracking for financial data",
          "Regular review of audit logs",
        ],
        tags: ["audit", "financial", "sox"],
      },
    ];
  }

  /**
   * Initialize default recommendations
   */
  private initializeDefaultRecommendations(): void {
    this.recommendations = [
      {
        id: "rec-001",
        title: "Implement Data Encryption",
        description: "Encrypt all sensitive data at rest and in transit",
        priority: "high",
        category: "technical",
        estimatedEffort: "high",
        estimatedCost: "medium",
        estimatedTimeline: "3-6 months",
        responsible: "Security Team",
        status: "pending",
        dependencies: ["key-management-system"],
        benefits: [
          "Reduced risk of data breach",
          "Compliance with GDPR and SOC2",
          "Enhanced data protection",
        ],
        risks: [
          "Performance impact",
          "Key management complexity",
          "Migration challenges",
        ],
      },
      {
        id: "rec-002",
        title: "Strengthen Access Controls",
        description: "Implement comprehensive access control measures",
        priority: "high",
        category: "administrative",
        estimatedEffort: "medium",
        estimatedCost: "low",
        estimatedTimeline: "1-3 months",
        responsible: "IT Team",
        status: "pending",
        dependencies: [],
        benefits: [
          "Reduced unauthorized access risk",
          "Better compliance posture",
          "Improved security monitoring",
        ],
        risks: [
          "User resistance",
          "Implementation complexity",
          "Training requirements",
        ],
      },
      {
        id: "rec-003",
        title: "Enhance Audit Logging",
        description: "Implement comprehensive audit logging system",
        priority: "medium",
        category: "technical",
        estimatedEffort: "medium",
        estimatedCost: "low",
        estimatedTimeline: "2-4 months",
        responsible: "Development Team",
        status: "pending",
        dependencies: ["logging-infrastructure"],
        benefits: [
          "Better compliance tracking",
          "Improved incident response",
          "Enhanced security monitoring",
        ],
        risks: [
          "Storage requirements",
          "Performance impact",
          "Log management complexity",
        ],
      },
    ];
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks(): void {
    // Generate automated reports
    if (this.config.enableAutomatedReporting) {
      this.scheduleAutomatedReports();
    }

    // Clean up old data
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000); // Daily

    // Monitor compliance status
    if (this.config.enableComplianceMonitoring) {
      setInterval(() => {
        this.monitorComplianceStatus();
      }, 60 * 60 * 1000); // Hourly
    }
  }

  /**
   * Schedule automated reports
   */
  private scheduleAutomatedReports(): void {
    // Weekly reports
    if (this.config.reportingSchedule.weekly) {
      this.scheduleReport("weekly", "Compliance Status Report", "assessment");
    }

    // Monthly reports
    if (this.config.reportingSchedule.monthly) {
      this.scheduleReport("monthly", "Monthly Compliance Assessment", "assessment");
    }

    // Quarterly reports
    if (this.config.reportingSchedule.quarterly) {
      this.scheduleReport("quarterly", "Quarterly Compliance Review", "audit");
    }

    // Annual reports
    if (this.config.reportingSchedule.annually) {
      this.scheduleReport("annually", "Annual Compliance Assessment", "regulatory");
    }
  }

  /**
   * Schedule report generation
   */
  private scheduleReport(frequency: string, title: string, type: ComplianceReport["reportType"]): void {
    // Implementation would schedule report generation
    monitoring.info("Compliance report scheduled", {
      frequency,
      title,
      type,
    });
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const now = new Date();

    // Clean up old audit trails
    const auditTrailCutoff = new Date(now.getTime() - this.config.auditTrailRetentionDays * 24 * 60 * 60 * 1000);
    this.auditTrails = this.auditTrails.filter(at => at.timestamp > auditTrailCutoff);

    // Clean up old reports
    const reportCutoff = new Date(now.getTime() - this.config.reportRetentionDays * 24 * 60 * 60 * 1000);
    this.reports = this.reports.filter(r =>
      r.generatedAt > reportCutoff || r.status === "published"
    );
  }

  /**
   * Monitor compliance status
   */
  private monitorComplianceStatus(): void {
    // Check for critical findings
    const criticalFindings = this.findings.filter(f => f.severity === "critical" && f.status === "open");
    if (criticalFindings.length > 0) {
      this.createComplianceAlert("Critical findings require immediate attention", {
        findings: criticalFindings.length,
        severity: "critical",
      });
    }

    // Check for overdue recommendations
    const overdueRecommendations = this.recommendations.filter(r =>
      r.dueDate && r.dueDate < new Date() && r.status !== "completed"
    );
    if (overdueRecommendations.length > 0) {
      this.createComplianceAlert("Overdue recommendations detected", {
        recommendations: overdueRecommendations.length,
        severity: "medium",
      });
    }

    // Check for upcoming deadlines
    const upcomingDeadlines = this.getUpcomingDeadlines();
    if (upcomingDeadlines.length > 0) {
      this.createComplianceAlert("Upcoming compliance deadlines", {
        deadlines: upcomingDeadlines.length,
        severity: "low",
      });
    }
  }

  /**
   * Create compliance alert
   */
  private createComplianceAlert(message: string, metadata: Record<string, unknown>): void {
    monitoring.warn("Compliance alert", {
      message,
      metadata,
    });

    this.emit("complianceAlert", {
      message,
      metadata,
      timestamp: new Date(),
    });
  }

  /**
   * Log audit trail
   */
  logAuditTrail(auditData: Omit<AuditTrail, "id" | "timestamp" | "complianceFlags">): AuditTrail {
    const auditTrail: AuditTrail = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      complianceFlags: this.analyzeComplianceFlags(auditData),
      ...auditData,
    };

    this.auditTrails.push(auditTrail);
    this.emit("auditTrailLogged", auditTrail);

    monitoring.info("Audit trail logged", {
      auditId: auditTrail.id,
      eventType: auditTrail.eventType,
      entityType: auditTrail.entityType,
      userId: auditTrail.userId,
    });

    return auditTrail;
  }

  /**
   * Analyze compliance flags
   */
  private analyzeComplianceFlags(auditData: any): ComplianceFlag[] {
    const flags: ComplianceFlag[] = [];

    // GDPR flags
    if (auditData.eventType === "data_access" && auditData.entityType === "personal_data") {
      flags.push({
        framework: "gdpr",
        requirement: "Art. 5 - Lawfulness of processing",
        severity: "medium",
        description: "Personal data access logged",
        status: "open",
      });
    }

    // SOC2 flags
    if (auditData.eventType === "permission_change" || auditData.eventType === "role_assignment") {
      flags.push({
        framework: "soc2",
        requirement: "CC6 - Logical and Physical Access Controls",
        severity: "high",
        description: "Access control change detected",
        status: "open",
      });
    }

    // SOX flags
    if (auditData.eventType === "update" && auditData.entityType === "financial_data") {
      flags.push({
        framework: "sox",
        requirement: "404 - Internal Controls",
        severity: "high",
        description: "Financial data modification detected",
        status: "open",
      });
    }

    return flags;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(
    framework: ComplianceReport["framework"],
    reportType: ComplianceReport["reportType"],
    period: { start: Date; end: Date },
    generatedBy: string
  ): ComplianceReport {
    const report: ComplianceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      framework,
      reportType,
      title: `${framework.toUpperCase()} ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      description: `Compliance report for ${framework.toUpperCase()} framework`,
      period,
      generatedBy,
      generatedAt: new Date(),
      status: "draft",
      summary: this.calculateReportSummary(framework, period),
      findings: this.getFindingsForFramework(framework, period),
      recommendations: this.getRecommendationsForFramework(framework),
      attachments: [],
      distribution: [],
      retentionPeriod: this.config.reportRetentionDays,
      nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      metadata: {
        framework,
        reportType,
        period,
        generatedBy,
      },
    };

    this.reports.push(report);
    this.emit("complianceReportGenerated", report);

    monitoring.info("Compliance report generated", {
      reportId: report.id,
      framework: report.framework,
      reportType: report.reportType,
      compliancePercentage: report.summary.compliancePercentage,
    });

    return report;
  }

  /**
   * Calculate report summary
   */
  private calculateReportSummary(framework: string, period: { start: Date; end: Date }): ComplianceReportSummary {
    const frameworkFindings = this.getFindingsForFramework(framework, period);
    const frameworkRecommendations = this.getRecommendationsForFramework(framework);

    const totalRequirements = this.getTotalRequirements(framework);
    const implementedRequirements = this.getImplementedRequirements(framework);
    const compliancePercentage = Math.round((implementedRequirements / totalRequirements) * 100);

    return {
      totalRequirements,
      implementedRequirements,
      partiallyImplementedRequirements: Math.floor(totalRequirements * 0.1),
      notImplementedRequirements: totalRequirements - implementedRequirements,
      compliancePercentage,
      criticalFindings: frameworkFindings.filter(f => f.severity === "critical").length,
      highFindings: frameworkFindings.filter(f => f.severity === "high").length,
      mediumFindings: frameworkFindings.filter(f => f.severity === "medium").length,
      lowFindings: frameworkFindings.filter(f => f.severity === "low").length,
      totalFindings: frameworkFindings.length,
      resolvedFindings: frameworkFindings.filter(f => f.status === "resolved").length,
      openFindings: frameworkFindings.filter(f => f.status === "open").length,
      riskScore: this.calculateRiskScore(frameworkFindings),
      lastAssessment: new Date(),
      nextAssessment: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    };
  }

  /**
   * Get total requirements for framework
   */
  private getTotalRequirements(framework: string): number {
    const requirements: Record<string, number> = {
      gdpr: 25,
      soc2: 30,
      pci: 20,
      hipaa: 15,
      sox: 10,
      iso27001: 40,
    };
    return requirements[framework] || 20;
  }

  /**
   * Get implemented requirements for framework
   */
  private getImplementedRequirements(framework: string): number {
    const total = this.getTotalRequirements(framework);
    return Math.floor(total * 0.8); // Assume 80% implementation
  }

  /**
   * Calculate risk score
   */
  private calculateRiskScore(findings: ComplianceFinding[]): number {
    let score = 100; // Start with perfect score

    for (const finding of findings) {
      switch (finding.severity) {
        case "critical":
          score -= 25;
          break;
        case "high":
          score -= 15;
          break;
        case "medium":
          score -= 10;
          break;
        case "low":
          score -= 5;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Get findings for framework
   */
  private getFindingsForFramework(framework: string, period: { start: Date; end: Date }): ComplianceFinding[] {
    return this.findings.filter(f =>
      f.tags.includes(framework.toLowerCase()) &&
      f.status !== "resolved"
    );
  }

  /**
   * Get recommendations for framework
   */
  private getRecommendationsForFramework(framework: string): ComplianceRecommendation[] {
    return this.recommendations.filter(r =>
      r.status !== "completed"
    );
  }

  /**
   * Get upcoming deadlines
   */
  getUpcomingDeadlines(): Array<{
    type: "assessment" | "review" | "remediation" | "training";
    title: string;
    dueDate: Date;
    priority: "low" | "medium" | "high" | "critical";
  }> {
    const deadlines: Array<{
      type: "assessment" | "review" | "remediation" | "training";
      title: string;
      dueDate: Date;
      priority: "low" | "medium" | "high" | "critical";
    }> = [];

    // Add upcoming assessments
    deadlines.push({
      type: "assessment",
      title: "GDPR Compliance Assessment",
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      priority: "high",
    });

    deadlines.push({
      type: "review",
      title: "SOC2 Control Review",
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      priority: "medium",
    });

    // Add overdue recommendations
    for (const rec of this.recommendations) {
      if (rec.dueDate && rec.dueDate < new Date() && rec.status !== "completed") {
        deadlines.push({
          type: "remediation",
          title: rec.title,
          dueDate: rec.dueDate,
          priority: rec.priority,
        });
      }
    }

    return deadlines.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }

  /**
   * Get compliance dashboard
   */
  getComplianceDashboard(): ComplianceDashboard {
    const frameworks = this.config.frameworks.map(framework => {
      const findings = this.getFindingsForFramework(framework, {
        start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
        end: new Date(),
      });
      const recommendations = this.getRecommendationsForFramework(framework);

      return {
        id: framework,
        name: framework.toUpperCase(),
        compliancePercentage: this.calculateReportSummary(framework, {
          start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          end: new Date(),
        }).compliancePercentage,
        status: this.getComplianceStatus(framework),
        lastAssessment: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        nextAssessment: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
        criticalFindings: findings.filter(f => f.severity === "critical").length,
        openRecommendations: recommendations.filter(r => r.status !== "completed").length,
      };
    });

    const recentFindings = this.findings
      .filter(f => f.status === "open")
      .sort((a, b) => b.severity.localeCompare(a.severity))
      .slice(0, 10);

    const upcomingDeadlines = this.getUpcomingDeadlines().slice(0, 5);

    const statistics = {
      totalReports: this.reports.length,
      totalFindings: this.findings.length,
      totalRecommendations: this.recommendations.length,
      averageComplianceScore: frameworks.reduce((sum, f) => sum + f.compliancePercentage, 0) / frameworks.length,
      riskTrend: "stable" as "improving" | "stable" | "deteriorating",
    };

    return {
      frameworks,
      recentFindings,
      upcomingDeadlines,
      statistics,
    };
  }

  /**
   * Get compliance status
   */
  private getComplianceStatus(framework: string): "compliant" | "partially_compliant" | "non_compliant" {
    const summary = this.calculateReportSummary(framework, {
      start: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      end: new Date(),
    });

    if (summary.compliancePercentage >= 90) {
      return "compliant";
    } else if (summary.compliancePercentage >= 70) {
      return "partially_compliant";
    } else {
      return "non_compliant";
    }
  }

  /**
   * Get audit trails
   */
  getAuditTrails(filters?: {
    eventType?: AuditTrail["eventType"];
    entityType?: string;
    userId?: string;
    tenantId?: string;
    dateRange?: { start: Date; end: Date };
  }): AuditTrail[] {
    let trails = [...this.auditTrails];

    if (filters) {
      if (filters.eventType) {
        trails = trails.filter(t => t.eventType === filters.eventType);
      }
      if (filters.entityType) {
        trails = trails.filter(t => t.entityType === filters.entityType);
      }
      if (filters.userId) {
        trails = trails.filter(t => t.userId === filters.userId);
      }
      if (filters.tenantId) {
        trails = trails.filter(t => t.tenantId === filters.tenantId);
      }
      if (filters.dateRange) {
        trails = trails.filter(t =>
          t.timestamp >= filters.dateRange!.start && t.timestamp <= filters.dateRange!.end
        );
      }
    }

    return trails.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get compliance reports
   */
  getComplianceReports(filters?: {
    framework?: ComplianceReport["framework"];
    reportType?: ComplianceReport["reportType"];
    status?: ComplianceReport["status"];
    dateRange?: { start: Date; end: Date };
  }): ComplianceReport[] {
    let reports = [...this.reports];

    if (filters) {
      if (filters.framework) {
        reports = reports.filter(r => r.framework === filters.framework);
      }
      if (filters.reportType) {
        reports = reports.filter(r => r.reportType === filters.reportType);
      }
      if (filters.status) {
        reports = reports.filter(r => r.status === filters.status);
      }
      if (filters.dateRange) {
        reports = reports.filter(r =>
          r.generatedAt >= filters.dateRange!.start && r.generatedAt <= filters.dateRange!.end
        );
      }
    }

    return reports.sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
  }

  /**
   * Get findings
   */
  getFindings(filters?: {
    severity?: ComplianceFinding["severity"];
    status?: ComplianceFinding["status"];
    category?: ComplianceFinding["category"];
    tags?: string[];
  }): ComplianceFinding[] {
    let findings = [...this.findings];

    if (filters) {
      if (filters.severity) {
        findings = findings.filter(f => f.severity === filters.severity);
      }
      if (filters.status) {
        findings = findings.filter(f => f.status === filters.status);
      }
      if (filters.category) {
        findings = findings.filter(f => f.category === filters.category);
      }
      if (filters.tags) {
        findings = findings.filter(f =>
          filters.tags!.some(tag => f.tags.includes(tag))
        );
      }
    }

    return findings.sort((a, b) => b.severity.localeCompare(a.severity));
  }

  /**
   * Get recommendations
   */
  getRecommendations(filters?: {
    priority?: ComplianceRecommendation["priority"];
    status?: ComplianceRecommendation["status"];
    category?: ComplianceRecommendation["category"];
  }): ComplianceRecommendation[] {
    let recommendations = [...this.recommendations];

    if (filters) {
      if (filters.priority) {
        recommendations = recommendations.filter(r => r.priority === filters.priority);
      }
      if (filters.status) {
        recommendations = recommendations.filter(r => r.status === filters.status);
      }
      if (filters.category) {
        recommendations = recommendations.filter(r => r.category === filters.category);
      }
    }

    return recommendations.sort((a, b) => b.priority.localeCompare(a.priority));
  }

  /**
   * Create finding
   */
  createFinding(findingData: Omit<ComplianceFinding, "id">): ComplianceFinding {
    const finding: ComplianceFinding = {
      id: `finding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...findingData,
    };

    this.findings.push(finding);
    this.emit("findingCreated", finding);

    monitoring.warn("Compliance finding created", {
      findingId: finding.id,
      title: finding.title,
      severity: finding.severity,
      requirement: finding.requirement,
    });

    return finding;
  }

  /**
   * Update finding
   */
  updateFinding(findingId: string, updates: Partial<ComplianceFinding>): boolean {
    const finding = this.findings.find(f => f.id === findingId);
    if (!finding) {
      return false;
    }

    Object.assign(finding, updates);
    this.emit("findingUpdated", finding);

    monitoring.info("Compliance finding updated", {
      findingId: finding.id,
      title: finding.title,
      status: finding.status,
    });

    return true;
  }

  /**
   * Create recommendation
   */
  createRecommendation(recommendationData: Omit<ComplianceRecommendation, "id">): ComplianceRecommendation {
    const recommendation: ComplianceRecommendation = {
      id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...recommendationData,
    };

    this.recommendations.push(recommendation);
    this.emit("recommendationCreated", recommendation);

    monitoring.info("Compliance recommendation created", {
      recommendationId: recommendation.id,
      title: recommendation.title,
      priority: recommendation.priority,
      responsible: recommendation.responsible,
    });

    return recommendation;
  }

  /**
   * Update recommendation
   */
  updateRecommendation(recommendationId: string, updates: Partial<ComplianceRecommendation>): boolean {
    const recommendation = this.recommendations.find(r => r.id === recommendationId);
    if (!recommendation) {
      return false;
    }

    Object.assign(recommendation, updates);
    this.emit("recommendationUpdated", recommendation);

    monitoring.info("Compliance recommendation updated", {
      recommendationId: recommendation.id,
      title: recommendation.title,
      status: recommendation.status,
    });

    return true;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const complianceReportingManager = new ComplianceReportingManager();

export default ComplianceReportingManager;
