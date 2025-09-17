/**
 * Comprehensive Compliance Management System
 *
 * Provides automated compliance monitoring, reporting, and management for various
 * regulatory frameworks including GDPR, SOC2, PCI DSS, HIPAA, and SOX.
 */

import { EventEmitter } from "events";
import { monitoring } from "@aibos/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  type: "security" | "privacy" | "financial" | "healthcare" | "industry";
  description: string;
  applicable: boolean;
  requirements: ComplianceRequirement[];
  controls: ComplianceControl[];
  lastUpdated: Date;
}

export interface ComplianceRequirement {
  id: string;
  frameworkId: string;
  category: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  status: "not_applicable" | "not_implemented" | "in_progress" | "implemented" | "verified";
  evidence: ComplianceEvidence[];
  dueDate?: Date;
  responsible: string;
  lastReviewed: Date;
  nextReview: Date;
}

export interface ComplianceControl {
  id: string;
  frameworkId: string;
  requirementId: string;
  name: string;
  description: string;
  type: "preventive" | "detective" | "corrective" | "deterrent" | "recovery";
  implementation: "automated" | "manual" | "hybrid";
  effectiveness: "not_effective" | "partially_effective" | "effective" | "highly_effective";
  frequency: "continuous" | "daily" | "weekly" | "monthly" | "quarterly" | "annually";
  lastTested: Date;
  nextTest: Date;
  testResults: ControlTestResult[];
  owner: string;
  status: "active" | "inactive" | "deprecated";
}

export interface ComplianceEvidence {
  id: string;
  requirementId: string;
  type: "document" | "screenshot" | "log" | "test_result" | "policy" | "procedure";
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
}

export interface ControlTestResult {
  id: string;
  controlId: string;
  testDate: Date;
  testType: "automated" | "manual" | "penetration" | "vulnerability";
  result: "pass" | "fail" | "partial" | "not_applicable";
  score?: number;
  details: string;
  findings: TestFinding[];
  remediated: boolean;
  remediatedAt?: Date;
  tester: string;
}

export interface TestFinding {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
  assignedTo?: string;
  dueDate?: Date;
  remediatedAt?: Date;
}

export interface ComplianceAssessment {
  id: string;
  frameworkId: string;
  assessmentDate: Date;
  assessor: string;
  scope: string[];
  methodology: string;
  findings: ComplianceFinding[];
  recommendations: string[];
  overallScore: number;
  complianceLevel: "non_compliant" | "partially_compliant" | "compliant" | "fully_compliant";
  nextAssessment: Date;
  status: "draft" | "in_progress" | "completed" | "approved";
}

export interface ComplianceFinding {
  id: string;
  requirementId: string;
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  status: "open" | "in_progress" | "resolved" | "accepted_risk";
  assignedTo?: string;
  dueDate?: Date;
  remediatedAt?: Date;
  evidence?: ComplianceEvidence[];
}

export interface DataSubjectRequest {
  id: string;
  requestType: "access" | "rectification" | "erasure" | "portability" | "restriction" | "objection";
  subjectId: string;
  subjectEmail: string;
  requestDate: Date;
  dueDate: Date;
  status: "received" | "in_progress" | "completed" | "rejected" | "expired";
  description: string;
  dataTypes: string[];
  processingBasis: string;
  responseData?: string;
  responseDate?: Date;
  handledBy: string;
  notes?: string;
}

export interface DataBreachIncident {
  id: string;
  incidentDate: Date;
  discoveredDate: Date;
  reportedDate: Date;
  breachType: "confidentiality" | "integrity" | "availability";
  dataTypes: string[];
  affectedSubjects: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  status: "investigating" | "contained" | "remediated" | "closed";
  description: string;
  rootCause: string;
  impact: string;
  remediation: string;
  notificationRequired: boolean;
  notificationDate?: Date;
  regulatoryNotificationRequired: boolean;
  regulatoryNotificationDate?: Date;
  assignedTo: string;
  lessonsLearned?: string;
}

export interface ComplianceReport {
  id: string;
  frameworkId: string;
  reportType: "assessment" | "audit" | "self_assessment" | "regulatory";
  reportDate: Date;
  period: {
    start: Date;
    end: Date;
  };
  generatedBy: string;
  approvedBy?: string;
  approvalDate?: Date;
  summary: {
    totalRequirements: number;
    implementedRequirements: number;
    compliancePercentage: number;
    criticalFindings: number;
    highFindings: number;
    mediumFindings: number;
    lowFindings: number;
  };
  findings: ComplianceFinding[];
  recommendations: string[];
  nextSteps: string[];
  attachments: string[];
}

// ============================================================================
// COMPLIANCE MANAGER
// ============================================================================

export class ComplianceManager extends EventEmitter {
  private frameworks: ComplianceFramework[] = [];
  private assessments: ComplianceAssessment[] = [];
  private dataSubjectRequests: DataSubjectRequest[] = [];
  private dataBreachIncidents: DataBreachIncident[] = [];
  private reports: ComplianceReport[] = [];

  constructor() {
    super();
    this.initializeFrameworks();
  }

  /**
   * Initialize compliance frameworks
   */
  private initializeFrameworks(): void {
    this.frameworks = [
      this.createGDPRFramework(),
      this.createSOC2Framework(),
      this.createPCIFramework(),
      this.createHIPAAFramework(),
      this.createSOXFramework(),
    ];
  }

  /**
   * Create GDPR framework
   */
  private createGDPRFramework(): ComplianceFramework {
    return {
      id: "gdpr",
      name: "General Data Protection Regulation",
      version: "2018",
      type: "privacy",
      description: "EU regulation on data protection and privacy",
      applicable: true,
      requirements: [
        {
          id: "gdpr-art-5",
          frameworkId: "gdpr",
          category: "Data Processing Principles",
          title: "Lawfulness, fairness and transparency",
          description: "Personal data must be processed lawfully, fairly and in a transparent manner",
          priority: "critical",
          status: "implemented",
          evidence: [],
          responsible: "Data Protection Officer",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "gdpr-art-6",
          frameworkId: "gdpr",
          category: "Lawfulness of Processing",
          title: "Lawfulness of processing",
          description: "Processing is lawful only if at least one legal basis applies",
          priority: "critical",
          status: "implemented",
          evidence: [],
          responsible: "Data Protection Officer",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "gdpr-art-12-22",
          frameworkId: "gdpr",
          category: "Data Subject Rights",
          title: "Data subject rights",
          description: "Data subjects have rights to access, rectification, erasure, portability, etc.",
          priority: "high",
          status: "in_progress",
          evidence: [],
          responsible: "Data Protection Officer",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "gdpr-art-25",
          frameworkId: "gdpr",
          category: "Data Protection by Design",
          title: "Data protection by design and by default",
          description: "Technical and organizational measures to implement data protection principles",
          priority: "high",
          status: "implemented",
          evidence: [],
          responsible: "Technical Team",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "gdpr-art-32",
          frameworkId: "gdpr",
          category: "Security of Processing",
          title: "Security of processing",
          description: "Appropriate technical and organizational measures to ensure security",
          priority: "critical",
          status: "implemented",
          evidence: [],
          responsible: "Security Team",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "gdpr-art-33-34",
          frameworkId: "gdpr",
          category: "Breach Notification",
          title: "Personal data breach notification",
          description: "Notification of personal data breaches to supervisory authority and data subjects",
          priority: "critical",
          status: "implemented",
          evidence: [],
          responsible: "Data Protection Officer",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      ],
      controls: [
        {
          id: "gdpr-ctrl-001",
          frameworkId: "gdpr",
          requirementId: "gdpr-art-5",
          name: "Data Processing Transparency",
          description: "Ensure data processing is transparent to data subjects",
          type: "preventive",
          implementation: "automated",
          effectiveness: "effective",
          frequency: "continuous",
          lastTested: new Date(),
          nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          testResults: [],
          owner: "Data Protection Officer",
          status: "active",
        },
        {
          id: "gdpr-ctrl-002",
          frameworkId: "gdpr",
          requirementId: "gdpr-art-12-22",
          name: "Data Subject Rights Management",
          description: "Automated system for handling data subject requests",
          type: "preventive",
          implementation: "hybrid",
          effectiveness: "partially_effective",
          frequency: "continuous",
          lastTested: new Date(),
          nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          testResults: [],
          owner: "Data Protection Officer",
          status: "active",
        },
      ],
      lastUpdated: new Date(),
    };
  }

  /**
   * Create SOC2 framework
   */
  private createSOC2Framework(): ComplianceFramework {
    return {
      id: "soc2",
      name: "SOC 2 Type II",
      version: "2017",
      type: "security",
      description: "Security, availability, processing integrity, confidentiality, and privacy",
      applicable: true,
      requirements: [
        {
          id: "soc2-cc6",
          frameworkId: "soc2",
          category: "Logical and Physical Access Controls",
          title: "Logical and physical access security",
          description: "System access is restricted to authorized individuals",
          priority: "critical",
          status: "implemented",
          evidence: [],
          responsible: "Security Team",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "soc2-cc7",
          frameworkId: "soc2",
          category: "System Operations",
          title: "System operations",
          description: "System operations are authorized and monitored",
          priority: "high",
          status: "implemented",
          evidence: [],
          responsible: "Operations Team",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "soc2-cc8",
          frameworkId: "soc2",
          category: "Change Management",
          title: "Change management",
          description: "System changes are authorized and monitored",
          priority: "high",
          status: "implemented",
          evidence: [],
          responsible: "Development Team",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      ],
      controls: [
        {
          id: "soc2-ctrl-001",
          frameworkId: "soc2",
          requirementId: "soc2-cc6",
          name: "Access Control System",
          description: "Multi-factor authentication and role-based access control",
          type: "preventive",
          implementation: "automated",
          effectiveness: "effective",
          frequency: "continuous",
          lastTested: new Date(),
          nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          testResults: [],
          owner: "Security Team",
          status: "active",
        },
      ],
      lastUpdated: new Date(),
    };
  }

  /**
   * Create PCI DSS framework
   */
  private createPCIFramework(): ComplianceFramework {
    return {
      id: "pci-dss",
      name: "Payment Card Industry Data Security Standard",
      version: "4.0",
      type: "financial",
      description: "Security standards for organizations that handle credit card information",
      applicable: false, // Not applicable unless handling payment cards
      requirements: [],
      controls: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Create HIPAA framework
   */
  private createHIPAAFramework(): ComplianceFramework {
    return {
      id: "hipaa",
      name: "Health Insurance Portability and Accountability Act",
      version: "1996",
      type: "healthcare",
      description: "US federal law for protecting health information",
      applicable: false, // Not applicable unless handling health information
      requirements: [],
      controls: [],
      lastUpdated: new Date(),
    };
  }

  /**
   * Create SOX framework
   */
  private createSOXFramework(): ComplianceFramework {
    return {
      id: "sox",
      name: "Sarbanes-Oxley Act",
      version: "2002",
      type: "financial",
      description: "US federal law for financial reporting and corporate governance",
      applicable: true,
      requirements: [
        {
          id: "sox-302",
          frameworkId: "sox",
          category: "Financial Reporting",
          title: "Corporate responsibility for financial reports",
          description: "CEO and CFO must certify financial reports",
          priority: "critical",
          status: "implemented",
          evidence: [],
          responsible: "Finance Team",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: "sox-404",
          frameworkId: "sox",
          category: "Internal Controls",
          title: "Management assessment of internal controls",
          description: "Management must assess and report on internal controls",
          priority: "critical",
          status: "implemented",
          evidence: [],
          responsible: "Finance Team",
          lastReviewed: new Date(),
          nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        },
      ],
      controls: [
        {
          id: "sox-ctrl-001",
          frameworkId: "sox",
          requirementId: "sox-404",
          name: "Financial Controls",
          description: "Internal controls over financial reporting",
          type: "preventive",
          implementation: "hybrid",
          effectiveness: "effective",
          frequency: "continuous",
          lastTested: new Date(),
          nextTest: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          testResults: [],
          owner: "Finance Team",
          status: "active",
        },
      ],
      lastUpdated: new Date(),
    };
  }

  /**
   * Get compliance frameworks
   */
  getFrameworks(): ComplianceFramework[] {
    return this.frameworks;
  }

  /**
   * Get framework by ID
   */
  getFramework(frameworkId: string): ComplianceFramework | undefined {
    return this.frameworks.find(f => f.id === frameworkId);
  }

  /**
   * Get compliance status for framework
   */
  getComplianceStatus(frameworkId: string): {
    framework: ComplianceFramework;
    overallScore: number;
    complianceLevel: "non_compliant" | "partially_compliant" | "compliant" | "fully_compliant";
    requirements: {
      total: number;
      implemented: number;
      inProgress: number;
      notImplemented: number;
    };
    controls: {
      total: number;
      effective: number;
      partiallyEffective: number;
      notEffective: number;
    };
    nextActions: string[];
  } {
    const framework = this.getFramework(frameworkId);
    if (!framework) {
      throw new Error(`Framework ${frameworkId} not found`);
    }

    const requirements = framework.requirements;
    const controls = framework.controls;

    const reqStats = {
      total: requirements.length,
      implemented: requirements.filter(r => r.status === "implemented").length,
      inProgress: requirements.filter(r => r.status === "in_progress").length,
      notImplemented: requirements.filter(r => r.status === "not_implemented").length,
    };

    const ctrlStats = {
      total: controls.length,
      effective: controls.filter(c => c.effectiveness === "effective" || c.effectiveness === "highly_effective").length,
      partiallyEffective: controls.filter(c => c.effectiveness === "partially_effective").length,
      notEffective: controls.filter(c => c.effectiveness === "not_effective").length,
    };

    const overallScore = Math.round(
      ((reqStats.implemented / reqStats.total) * 0.7 + (ctrlStats.effective / ctrlStats.total) * 0.3) * 100
    );

    let complianceLevel: "non_compliant" | "partially_compliant" | "compliant" | "fully_compliant";
    if (overallScore >= 90) {
      complianceLevel = "fully_compliant";
    } else if (overallScore >= 75) {
      complianceLevel = "compliant";
    } else if (overallScore >= 50) {
      complianceLevel = "partially_compliant";
    } else {
      complianceLevel = "non_compliant";
    }

    const nextActions = this.generateNextActions(framework);

    return {
      framework,
      overallScore,
      complianceLevel,
      requirements: reqStats,
      controls: ctrlStats,
      nextActions,
    };
  }

  /**
   * Generate next actions for framework
   */
  private generateNextActions(framework: ComplianceFramework): string[] {
    const actions: string[] = [];

    // Check for overdue reviews
    const overdueReviews = framework.requirements.filter(
      r => r.nextReview < new Date() && r.status !== "implemented"
    );
    if (overdueReviews.length > 0) {
      actions.push(`Review ${overdueReviews.length} overdue requirements`);
    }

    // Check for in-progress requirements
    const inProgress = framework.requirements.filter(r => r.status === "in_progress");
    if (inProgress.length > 0) {
      actions.push(`Complete ${inProgress.length} in-progress requirements`);
    }

    // Check for ineffective controls
    const ineffectiveControls = framework.controls.filter(c => c.effectiveness === "not_effective");
    if (ineffectiveControls.length > 0) {
      actions.push(`Improve ${ineffectiveControls.length} ineffective controls`);
    }

    // Check for overdue tests
    const overdueTests = framework.controls.filter(c => c.nextTest < new Date());
    if (overdueTests.length > 0) {
      actions.push(`Conduct ${overdueTests.length} overdue control tests`);
    }

    return actions;
  }

  /**
   * Create data subject request
   */
  createDataSubjectRequest(request: Omit<DataSubjectRequest, "id" | "requestDate" | "status">): DataSubjectRequest {
    const dsr: DataSubjectRequest = {
      id: `dsr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      requestDate: new Date(),
      status: "received",
      ...request,
    };

    this.dataSubjectRequests.push(dsr);
    this.emit("dataSubjectRequestCreated", dsr);

    monitoring.info("Data subject request created", {
      requestId: dsr.id,
      requestType: dsr.requestType,
      subjectEmail: dsr.subjectEmail
    });

    return dsr;
  }

  /**
   * Process data subject request
   */
  async processDataSubjectRequest(requestId: string, responseData: string, handledBy: string): Promise<void> {
    const request = this.dataSubjectRequests.find(r => r.id === requestId);
    if (!request) {
      throw new Error(`Data subject request ${requestId} not found`);
    }

    request.status = "completed";
    request.responseData = responseData;
    request.responseDate = new Date();
    request.handledBy = handledBy;

    this.emit("dataSubjectRequestCompleted", request);

    monitoring.info("Data subject request completed", {
      requestId: request.id,
      requestType: request.requestType,
      handledBy
    });
  }

  /**
   * Create data breach incident
   */
  createDataBreachIncident(incident: Omit<DataBreachIncident, "id" | "discoveredDate" | "status">): DataBreachIncident {
    const breach: DataBreachIncident = {
      id: `breach_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      discoveredDate: new Date(),
      status: "investigating",
      ...incident,
    };

    this.dataBreachIncidents.push(breach);
    this.emit("dataBreachIncidentCreated", breach);

    monitoring.error("Data breach incident created", new Error("Data breach detected"), {
      breachId: breach.id,
      breachType: breach.breachType,
      riskLevel: breach.riskLevel,
      affectedSubjects: breach.affectedSubjects
    });

    return breach;
  }

  /**
   * Update data breach incident
   */
  updateDataBreachIncident(breachId: string, updates: Partial<DataBreachIncident>): void {
    const incident = this.dataBreachIncidents.find(b => b.id === breachId);
    if (!incident) {
      throw new Error(`Data breach incident ${breachId} not found`);
    }

    Object.assign(incident, updates);
    this.emit("dataBreachIncidentUpdated", incident);

    monitoring.info("Data breach incident updated", {
      breachId: incident.id,
      status: incident.status,
      riskLevel: incident.riskLevel
    });
  }

  /**
   * Create compliance assessment
   */
  createComplianceAssessment(assessment: Omit<ComplianceAssessment, "id" | "assessmentDate" | "status">): ComplianceAssessment {
    const newAssessment: ComplianceAssessment = {
      id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assessmentDate: new Date(),
      status: "draft",
      ...assessment,
    };

    this.assessments.push(newAssessment);
    this.emit("complianceAssessmentCreated", newAssessment);

    monitoring.info("Compliance assessment created", {
      assessmentId: newAssessment.id,
      frameworkId: newAssessment.frameworkId,
      assessor: newAssessment.assessor
    });

    return newAssessment;
  }

  /**
   * Generate compliance report
   */
  generateComplianceReport(frameworkId: string, reportType: ComplianceReport["reportType"], period: { start: Date; end: Date }): ComplianceReport {
    const framework = this.getFramework(frameworkId);
    if (!framework) {
      throw new Error(`Framework ${frameworkId} not found`);
    }

    const status = this.getComplianceStatus(frameworkId);
    const findings = this.assessments
      .filter(a => a.frameworkId === frameworkId && a.status === "completed")
      .flatMap(a => a.findings);

    const report: ComplianceReport = {
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      frameworkId,
      reportType,
      reportDate: new Date(),
      period,
      generatedBy: "Compliance Manager",
      summary: {
        totalRequirements: status.requirements.total,
        implementedRequirements: status.requirements.implemented,
        compliancePercentage: status.overallScore,
        criticalFindings: findings.filter(f => f.severity === "critical").length,
        highFindings: findings.filter(f => f.severity === "high").length,
        mediumFindings: findings.filter(f => f.severity === "medium").length,
        lowFindings: findings.filter(f => f.severity === "low").length,
      },
      findings,
      recommendations: this.generateRecommendations(framework),
      nextSteps: status.nextActions,
      attachments: [],
    };

    this.reports.push(report);
    this.emit("complianceReportGenerated", report);

    monitoring.info("Compliance report generated", {
      reportId: report.id,
      frameworkId: report.frameworkId,
      reportType: report.reportType,
      compliancePercentage: report.summary.compliancePercentage
    });

    return report;
  }

  /**
   * Generate recommendations for framework
   */
  private generateRecommendations(framework: ComplianceFramework): string[] {
    const recommendations: string[] = [];

    // Requirements recommendations
    const notImplemented = framework.requirements.filter(r => r.status === "not_implemented");
    if (notImplemented.length > 0) {
      recommendations.push(`Implement ${notImplemented.length} missing requirements`);
    }

    const inProgress = framework.requirements.filter(r => r.status === "in_progress");
    if (inProgress.length > 0) {
      recommendations.push(`Complete ${inProgress.length} in-progress requirements`);
    }

    // Controls recommendations
    const ineffectiveControls = framework.controls.filter(c => c.effectiveness === "not_effective");
    if (ineffectiveControls.length > 0) {
      recommendations.push(`Improve effectiveness of ${ineffectiveControls.length} controls`);
    }

    const overdueTests = framework.controls.filter(c => c.nextTest < new Date());
    if (overdueTests.length > 0) {
      recommendations.push(`Conduct overdue testing for ${overdueTests.length} controls`);
    }

    // General recommendations
    recommendations.push("Conduct regular compliance training for staff");
    recommendations.push("Implement automated compliance monitoring");
    recommendations.push("Establish regular compliance review cycles");
    recommendations.push("Maintain up-to-date compliance documentation");

    return recommendations;
  }

  /**
   * Get data subject requests
   */
  getDataSubjectRequests(filters?: {
    status?: DataSubjectRequest["status"];
    requestType?: DataSubjectRequest["requestType"];
    dateRange?: { start: Date; end: Date };
  }): DataSubjectRequest[] {
    let requests = [...this.dataSubjectRequests];

    if (filters) {
      if (filters.status) {
        requests = requests.filter(r => r.status === filters.status);
      }
      if (filters.requestType) {
        requests = requests.filter(r => r.requestType === filters.requestType);
      }
      if (filters.dateRange) {
        requests = requests.filter(r =>
          r.requestDate >= filters.dateRange!.start && r.requestDate <= filters.dateRange!.end
        );
      }
    }

    return requests.sort((a, b) => b.requestDate.getTime() - a.requestDate.getTime());
  }

  /**
   * Get data breach incidents
   */
  getDataBreachIncidents(filters?: {
    status?: DataBreachIncident["status"];
    riskLevel?: DataBreachIncident["riskLevel"];
    dateRange?: { start: Date; end: Date };
  }): DataBreachIncident[] {
    let incidents = [...this.dataBreachIncidents];

    if (filters) {
      if (filters.status) {
        incidents = incidents.filter(i => i.status === filters.status);
      }
      if (filters.riskLevel) {
        incidents = incidents.filter(i => i.riskLevel === filters.riskLevel);
      }
      if (filters.dateRange) {
        incidents = incidents.filter(i =>
          i.incidentDate >= filters.dateRange!.start && i.incidentDate <= filters.dateRange!.end
        );
      }
    }

    return incidents.sort((a, b) => b.incidentDate.getTime() - a.incidentDate.getTime());
  }

  /**
   * Get compliance reports
   */
  getComplianceReports(frameworkId?: string): ComplianceReport[] {
    let reports = [...this.reports];

    if (frameworkId) {
      reports = reports.filter(r => r.frameworkId === frameworkId);
    }

    return reports.sort((a, b) => b.reportDate.getTime() - a.reportDate.getTime());
  }

  /**
   * Get compliance dashboard data
   */
  getComplianceDashboard(): {
    frameworks: Array<{
      id: string;
      name: string;
      complianceLevel: string;
      overallScore: number;
      nextActions: string[];
    }>;
    dataSubjectRequests: {
      total: number;
      pending: number;
      overdue: number;
    };
    dataBreachIncidents: {
      total: number;
      open: number;
      critical: number;
    };
    upcomingReviews: Array<{
      frameworkId: string;
      requirementId: string;
      title: string;
      dueDate: Date;
    }>;
  } {
    const frameworks = this.frameworks.map(f => {
      const status = this.getComplianceStatus(f.id);
      return {
        id: f.id,
        name: f.name,
        complianceLevel: status.complianceLevel,
        overallScore: status.overallScore,
        nextActions: status.nextActions,
      };
    });

    const dsrStats = {
      total: this.dataSubjectRequests.length,
      pending: this.dataSubjectRequests.filter(r => r.status === "received" || r.status === "in_progress").length,
      overdue: this.dataSubjectRequests.filter(r => r.dueDate < new Date() && r.status !== "completed").length,
    };

    const breachStats = {
      total: this.dataBreachIncidents.length,
      open: this.dataBreachIncidents.filter(i => i.status === "investigating" || i.status === "contained").length,
      critical: this.dataBreachIncidents.filter(i => i.riskLevel === "critical").length,
    };

    const upcomingReviews = this.frameworks
      .flatMap(f => f.requirements)
      .filter(r => r.nextReview > new Date() && r.nextReview < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
      .map(r => ({
        frameworkId: r.frameworkId,
        requirementId: r.id,
        title: r.title,
        dueDate: r.nextReview,
      }))
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    return {
      frameworks,
      dataSubjectRequests: dsrStats,
      dataBreachIncidents: breachStats,
      upcomingReviews,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const complianceManager = new ComplianceManager();

export default ComplianceManager;
