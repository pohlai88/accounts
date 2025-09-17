/**
 * Comprehensive Security Monitoring and Alerting System
 *
 * Provides real-time security monitoring, threat detection, alerting,
 * and incident response capabilities for the AI-BOS platform.
 */

import { EventEmitter } from "events";
import { monitoring } from "@aibos/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SecurityThreat {
  id: string;
  type: "malware" | "phishing" | "brute_force" | "ddos" | "injection" | "xss" | "csrf" | "privilege_escalation" | "data_breach" | "insider_threat" | "unknown";
  severity: "low" | "medium" | "high" | "critical";
  source: "internal" | "external" | "unknown";
  description: string;
  indicators: ThreatIndicator[];
  detectedAt: Date;
  status: "active" | "investigating" | "contained" | "resolved" | "false_positive";
  confidence: number; // 0-100
  impact: string;
  remediation: string;
  assignedTo?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface ThreatIndicator {
  type: "ip_address" | "email" | "domain" | "url" | "file_hash" | "user_agent" | "behavior" | "network" | "system";
  value: string;
  description: string;
  confidence: number; // 0-100
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  count: number;
}

export interface SecurityAlert {
  id: string;
  threatId: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "threat_detection" | "anomaly" | "compliance" | "system" | "user_behavior";
  source: string;
  triggeredAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  status: "active" | "acknowledged" | "resolved" | "suppressed";
  recipients: string[];
  escalationLevel: number;
  nextEscalation?: Date;
  metadata: Record<string, unknown>;
}

export interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "contained" | "resolved" | "closed";
  category: "security_breach" | "data_breach" | "system_compromise" | "malware" | "insider_threat" | "compliance_violation" | "privilege_escalation";
  detectedAt: Date;
  reportedAt: Date;
  assignedTo?: string;
  team: string;
  affectedSystems: string[];
  affectedUsers: number;
  businessImpact: string;
  technicalImpact: string;
  rootCause?: string;
  remediation: string;
  lessonsLearned?: string;
  tags: string[];
  metadata: Record<string, unknown>;
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  category: "threat_detection" | "anomaly" | "compliance" | "behavioral";
  enabled: boolean;
  severity: "low" | "medium" | "high" | "critical";
  conditions: SecurityRuleCondition[];
  actions: SecurityRuleAction[];
  threshold: number;
  timeWindow: number; // minutes
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  lastTriggered?: Date;
  triggerCount: number;
}

export interface SecurityRuleCondition {
  field: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than" | "regex" | "in" | "not_in";
  value: string | number | boolean | string[];
  description?: string;
}

export interface SecurityRuleAction {
  type: "alert" | "block" | "log" | "notify" | "escalate" | "quarantine";
  target: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

export interface SecurityMetrics {
  threats: {
    total: number;
    active: number;
    resolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  alerts: {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  incidents: {
    total: number;
    open: number;
    investigating: number;
    contained: number;
    resolved: number;
    byCategory: Record<string, number>;
    bySeverity: Record<string, number>;
  };
  response: {
    averageDetectionTime: number; // minutes
    averageResponseTime: number; // minutes
    averageResolutionTime: number; // minutes
    falsePositiveRate: number; // percentage
  };
}

export interface SecurityMonitoringConfig {
  enableThreatDetection: boolean;
  enableAnomalyDetection: boolean;
  enableBehavioralAnalysis: boolean;
  enableRealTimeAlerting: boolean;
  enableIncidentResponse: boolean;
  threatDetectionThreshold: number; // 0-100
  anomalyDetectionThreshold: number; // 0-100
  alertRetentionDays: number;
  incidentRetentionDays: number;
  enableMachineLearning: boolean;
  enableThreatIntelligence: boolean;
  enableGeolocationTracking: boolean;
  enableDeviceFingerprinting: boolean;
  alertRecipients: string[];
}

// ============================================================================
// SECURITY MONITORING MANAGER
// ============================================================================

export class SecurityMonitoringManager extends EventEmitter {
  private config: SecurityMonitoringConfig;
  private threats: SecurityThreat[] = [];
  private alerts: SecurityAlert[] = [];
  private incidents: SecurityIncident[] = [];
  private rules: SecurityRule[] = [];
  private metrics: SecurityMetrics;

  constructor(config: Partial<SecurityMonitoringConfig> = {}) {
    super();

    this.config = {
      enableThreatDetection: true,
      enableAnomalyDetection: true,
      enableBehavioralAnalysis: true,
      enableRealTimeAlerting: true,
      enableIncidentResponse: true,
      threatDetectionThreshold: 70,
      anomalyDetectionThreshold: 60,
      alertRetentionDays: 90,
      incidentRetentionDays: 2555, // 7 years
      enableMachineLearning: false,
      enableThreatIntelligence: false,
      enableGeolocationTracking: false,
      enableDeviceFingerprinting: false,
      alertRecipients: [],
      ...config,
    };

    this.metrics = this.initializeMetrics();
    this.initializeDefaultRules();
    this.startMonitoring();
  }

  /**
   * Initialize metrics
   */
  private initializeMetrics(): SecurityMetrics {
    return {
      threats: {
        total: 0,
        active: 0,
        resolved: 0,
        byType: {},
        bySeverity: {},
      },
      alerts: {
        total: 0,
        active: 0,
        acknowledged: 0,
        resolved: 0,
        byCategory: {},
        bySeverity: {},
      },
      incidents: {
        total: 0,
        open: 0,
        investigating: 0,
        contained: 0,
        resolved: 0,
        byCategory: {},
        bySeverity: {},
      },
      response: {
        averageDetectionTime: 0,
        averageResponseTime: 0,
        averageResolutionTime: 0,
        falsePositiveRate: 0,
      },
    };
  }

  /**
   * Initialize default security rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: "rule-brute-force",
        name: "Brute Force Attack Detection",
        description: "Detect multiple failed login attempts from the same IP",
        category: "threat_detection",
        enabled: true,
        severity: "high",
        conditions: [
          {
            field: "event_type",
            operator: "equals",
            value: "login_failed",
            description: "Failed login attempt",
          },
          {
            field: "ip_address",
            operator: "equals",
            value: "{{ip_address}}",
            description: "Same IP address",
          },
        ],
        actions: [
          {
            type: "alert",
            target: "security_team",
            parameters: { priority: "high", immediate: true },
            enabled: true,
          },
          {
            type: "block",
            target: "ip_address",
            parameters: { duration: 3600 }, // 1 hour
            enabled: true,
          },
        ],
        threshold: 5,
        timeWindow: 15, // 15 minutes
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        triggerCount: 0,
      },
      {
        id: "rule-suspicious-login",
        name: "Suspicious Login Pattern",
        description: "Detect unusual login patterns",
        category: "behavioral",
        enabled: true,
        severity: "medium",
        conditions: [
          {
            field: "login_time",
            operator: "greater_than",
            value: 22, // After 10 PM
            description: "Late night login",
          },
          {
            field: "location",
            operator: "not_equals",
            value: "{{usual_location}}",
            description: "Unusual location",
          },
        ],
        actions: [
          {
            type: "alert",
            target: "security_team",
            parameters: { priority: "medium" },
            enabled: true,
          },
          {
            type: "notify",
            target: "user",
            parameters: { method: "email" },
            enabled: true,
          },
        ],
        threshold: 1,
        timeWindow: 60, // 1 hour
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        triggerCount: 0,
      },
      {
        id: "rule-data-exfiltration",
        name: "Data Exfiltration Detection",
        description: "Detect large data exports or downloads",
        category: "anomaly",
        enabled: true,
        severity: "critical",
        conditions: [
          {
            field: "action",
            operator: "equals",
            value: "export",
            description: "Data export action",
          },
          {
            field: "data_size",
            operator: "greater_than",
            value: 1000000, // 1MB
            description: "Large data size",
          },
        ],
        actions: [
          {
            type: "alert",
            target: "security_team",
            parameters: { priority: "critical", immediate: true },
            enabled: true,
          },
          {
            type: "block",
            target: "action",
            parameters: { duration: 300 }, // 5 minutes
            enabled: true,
          },
        ],
        threshold: 1,
        timeWindow: 5, // 5 minutes
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        triggerCount: 0,
      },
      {
        id: "rule-privilege-escalation",
        name: "Privilege Escalation Attempt",
        description: "Detect attempts to gain higher privileges",
        category: "threat_detection",
        enabled: true,
        severity: "critical",
        conditions: [
          {
            field: "action",
            operator: "equals",
            value: "role_assignment",
            description: "Role assignment attempt",
          },
          {
            field: "target_role",
            operator: "in",
            value: ["admin", "manager", "security_officer"],
            description: "High privilege role",
          },
        ],
        actions: [
          {
            type: "alert",
            target: "security_team",
            parameters: { priority: "critical", immediate: true },
            enabled: true,
          },
          {
            type: "block",
            target: "action",
            parameters: { duration: 1800 }, // 30 minutes
            enabled: true,
          },
        ],
        threshold: 1,
        timeWindow: 10, // 10 minutes
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        triggerCount: 0,
      },
    ];
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // Set up event listeners for security events
    this.setupEventListeners();

    // Start periodic monitoring tasks
    this.startPeriodicTasks();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen for security events from monitoring system
    monitoring.on("securityViolation", (violation) => {
      this.processSecurityViolation(violation);
    });

    monitoring.on("securityEvent", (event) => {
      this.processSecurityEvent(event);
    });

    // Listen for custom security events
    this.on("securityEvent", (event) => {
      this.processSecurityEvent(event);
    });
  }

  /**
   * Start periodic monitoring tasks
   */
  private startPeriodicTasks(): void {
    // Update metrics every 5 minutes
    setInterval(() => {
      this.updateMetrics();
    }, 5 * 60 * 1000);

    // Clean up old data every hour
    setInterval(() => {
      this.cleanupOldData();
    }, 60 * 60 * 1000);

    // Check for escalated alerts every 15 minutes
    setInterval(() => {
      this.checkEscalatedAlerts();
    }, 15 * 60 * 1000);
  }

  /**
   * Process security violation
   */
  private processSecurityViolation(violation: any): void {
    // Create threat if severity is high enough
    if (this.isHighSeverityViolation(violation)) {
      this.createThreatFromViolation(violation);
    }

    // Create alert
    this.createAlertFromViolation(violation);

    // Check if incident should be created
    if (this.shouldCreateIncident(violation)) {
      this.createIncidentFromViolation(violation);
    }
  }

  /**
   * Process security event
   */
  private processSecurityEvent(event: any): void {
    // Evaluate rules against the event
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      if (this.evaluateRule(rule, event)) {
        this.triggerRule(rule, event);
      }
    }
  }

  /**
   * Evaluate security rule
   */
  private evaluateRule(rule: SecurityRule, event: any): boolean {
    // Check if all conditions are met
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, event)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate rule condition
   */
  private evaluateCondition(condition: SecurityRuleCondition, event: any): boolean {
    const fieldValue = this.getFieldValue(event, condition.field);

    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "not_equals":
        return fieldValue !== condition.value;
      case "contains":
        return typeof fieldValue === "string" && fieldValue.includes(String(condition.value));
      case "not_contains":
        return typeof fieldValue === "string" && !fieldValue.includes(String(condition.value));
      case "greater_than":
        return typeof fieldValue === "number" && fieldValue > Number(condition.value);
      case "less_than":
        return typeof fieldValue === "number" && fieldValue < Number(condition.value);
      case "regex":
        return typeof fieldValue === "string" && new RegExp(String(condition.value)).test(fieldValue);
      case "in":
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case "not_in":
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      default:
        return false;
    }
  }

  /**
   * Get field value from event
   */
  private getFieldValue(event: any, field: string): any {
    const parts = field.split(".");
    let value = event;

    for (const part of parts) {
      if (value && typeof value === "object") {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Trigger security rule
   */
  private triggerRule(rule: SecurityRule, event: any): void {
    rule.lastTriggered = new Date();
    rule.triggerCount++;

    // Execute rule actions
    for (const action of rule.actions) {
      if (!action.enabled) continue;

      this.executeAction(action, event, rule);
    }

    this.emit("ruleTriggered", { rule, event });
  }

  /**
   * Execute rule action
   */
  private executeAction(action: SecurityRuleAction, event: any, rule: SecurityRule): void {
    switch (action.type) {
      case "alert":
        this.createAlert({
          title: rule.name,
          description: rule.description,
          severity: rule.severity,
          category: "threat_detection",
          source: "security_rule",
          metadata: { ruleId: rule.id, event },
          threatId: rule.id,
          recipients: this.config.alertRecipients,
        });
        break;
      case "block":
        this.executeBlockAction(action, event);
        break;
      case "log":
        this.logSecurityEvent(action, event);
        break;
      case "notify":
        this.sendNotification(action, event);
        break;
      case "escalate":
        this.escalateAlert(action, event);
        break;
      case "quarantine":
        this.quarantineThreat(action, event);
        break;
    }
  }

  /**
   * Create threat from violation
   */
  private createThreatFromViolation(violation: any): SecurityThreat {
    const threat: SecurityThreat = {
      id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: this.mapViolationToThreatType(violation.type),
      severity: violation.severity,
      source: "internal",
      description: violation.description,
      indicators: [
        {
          type: "ip_address",
          value: violation.context?.ipAddress || "unknown",
          description: "Source IP address",
          confidence: 80,
          source: "security_monitoring",
          firstSeen: new Date(),
          lastSeen: new Date(),
          count: 1,
        },
      ],
      detectedAt: new Date(),
      status: "active",
      confidence: this.calculateThreatConfidence(violation),
      impact: "Potential security breach",
      remediation: "Investigate and contain threat",
      tags: [violation.type, violation.severity],
      metadata: { violation },
    };

    this.threats.push(threat);
    this.emit("threatDetected", threat);

    monitoring.error("Security threat detected", new Error(threat.description), {
      threatId: threat.id,
      threatType: threat.type,
      severity: threat.severity,
      confidence: threat.confidence,
    });

    return threat;
  }

  /**
   * Create alert from violation
   */
  private createAlertFromViolation(violation: any): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      threatId: "",
      title: `Security Violation: ${violation.type}`,
      description: violation.description,
      severity: violation.severity,
      category: "threat_detection",
      source: "security_monitoring",
      triggeredAt: new Date(),
      status: "active",
      recipients: this.getAlertRecipients(violation.severity),
      escalationLevel: 1,
      metadata: { violation },
    };

    this.alerts.push(alert);
    this.emit("alertTriggered", alert);

    monitoring.warn("Security alert triggered", {
      alertId: alert.id,
      title: alert.title,
      severity: alert.severity,
      category: alert.category,
    });

    return alert;
  }

  /**
   * Create incident from violation
   */
  private createIncidentFromViolation(violation: any): SecurityIncident {
    const incident: SecurityIncident = {
      id: `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `Security Incident: ${violation.type}`,
      description: violation.description,
      severity: violation.severity,
      status: "open",
      category: this.mapViolationToIncidentCategory(violation.type),
      detectedAt: new Date(),
      reportedAt: new Date(),
      team: "security",
      affectedSystems: ["web-api", "database"],
      affectedUsers: 1,
      businessImpact: "Potential data breach or system compromise",
      technicalImpact: "Security controls bypassed",
      remediation: "Investigate, contain, and remediate",
      tags: [violation.type, violation.severity],
      metadata: { violation },
    };

    this.incidents.push(incident);
    this.emit("incidentCreated", incident);

    monitoring.error("Security incident created", new Error(incident.description), {
      incidentId: incident.id,
      title: incident.title,
      severity: incident.severity,
      category: incident.category,
    });

    return incident;
  }

  /**
   * Check if violation is high severity
   */
  private isHighSeverityViolation(violation: any): boolean {
    return violation.severity === "high" || violation.severity === "critical";
  }

  /**
   * Check if incident should be created
   */
  private shouldCreateIncident(violation: any): boolean {
    return violation.severity === "critical" ||
           (violation.severity === "high" && violation.type === "data_breach");
  }

  /**
   * Map violation type to threat type
   */
  private mapViolationToThreatType(violationType: string): SecurityThreat["type"] {
    const mapping: Record<string, SecurityThreat["type"]> = {
      "rate_limit": "brute_force",
      "csrf_attack": "csrf",
      "xss_attempt": "xss",
      "suspicious_activity": "unknown",
      "injection_attempt": "injection",
      "unauthorized_access": "privilege_escalation",
    };

    return mapping[violationType] || "unknown";
  }

  /**
   * Map violation type to incident category
   */
  private mapViolationToIncidentCategory(violationType: string): SecurityIncident["category"] {
    const mapping: Record<string, SecurityIncident["category"]> = {
      "rate_limit": "system_compromise",
      "csrf_attack": "security_breach",
      "xss_attempt": "security_breach",
      "suspicious_activity": "security_breach",
      "injection_attempt": "security_breach",
      "unauthorized_access": "privilege_escalation",
    };

    return mapping[violationType] || "security_breach";
  }

  /**
   * Calculate threat confidence
   */
  private calculateThreatConfidence(violation: any): number {
    let confidence = 50; // Base confidence

    if (violation.severity === "critical") confidence += 30;
    else if (violation.severity === "high") confidence += 20;
    else if (violation.severity === "medium") confidence += 10;

    if (violation.blocked) confidence += 20;

    return Math.min(100, confidence);
  }

  /**
   * Get alert recipients based on severity
   */
  private getAlertRecipients(severity: string): string[] {
    const recipients = ["security@aibos.com"];

    if (severity === "critical") {
      recipients.push("admin@aibos.com", "cto@aibos.com");
    }

    return recipients;
  }

  /**
   * Execute block action
   */
  private executeBlockAction(action: SecurityRuleAction, event: any): void {
    // Implementation would block the source
    monitoring.warn("Block action executed", {
      action: action.type,
      target: action.target,
      event,
    });
  }

  /**
   * Log security event
   */
  private logSecurityEvent(action: SecurityRuleAction, event: any): void {
    monitoring.info("Security event logged", {
      action: action.type,
      target: action.target,
      event,
    });
  }

  /**
   * Send notification
   */
  private sendNotification(action: SecurityRuleAction, event: any): void {
    // Implementation would send notification
    monitoring.info("Security notification sent", {
      action: action.type,
      target: action.target,
      event,
    });
  }

  /**
   * Escalate alert
   */
  private escalateAlert(action: SecurityRuleAction, event: any): void {
    // Implementation would escalate alert
    monitoring.warn("Security alert escalated", {
      action: action.type,
      target: action.target,
      event,
    });
  }

  /**
   * Quarantine threat
   */
  private quarantineThreat(action: SecurityRuleAction, event: any): void {
    // Implementation would quarantine threat
    monitoring.warn("Threat quarantined", {
      action: action.type,
      target: action.target,
      event,
    });
  }

  /**
   * Update metrics
   */
  private updateMetrics(): void {
    this.metrics.threats.total = this.threats.length;
    this.metrics.threats.active = this.threats.filter(t => t.status === "active").length;
    this.metrics.threats.resolved = this.threats.filter(t => t.status === "resolved").length;

    this.metrics.alerts.total = this.alerts.length;
    this.metrics.alerts.active = this.alerts.filter(a => a.status === "active").length;
    this.metrics.alerts.acknowledged = this.alerts.filter(a => a.status === "acknowledged").length;
    this.metrics.alerts.resolved = this.alerts.filter(a => a.status === "resolved").length;

    this.metrics.incidents.total = this.incidents.length;
    this.metrics.incidents.open = this.incidents.filter(i => i.status === "open").length;
    this.metrics.incidents.investigating = this.incidents.filter(i => i.status === "investigating").length;
    this.metrics.incidents.contained = this.incidents.filter(i => i.status === "contained").length;
    this.metrics.incidents.resolved = this.incidents.filter(i => i.status === "resolved").length;
  }

  /**
   * Clean up old data
   */
  private cleanupOldData(): void {
    const now = new Date();

    // Clean up old alerts
    const alertCutoff = new Date(now.getTime() - this.config.alertRetentionDays * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.triggeredAt > alertCutoff);

    // Clean up old incidents (keep resolved ones longer)
    const incidentCutoff = new Date(now.getTime() - this.config.incidentRetentionDays * 24 * 60 * 60 * 1000);
    this.incidents = this.incidents.filter(i =>
      i.detectedAt > incidentCutoff || i.status === "resolved"
    );
  }

  /**
   * Check for escalated alerts
   */
  private checkEscalatedAlerts(): void {
    const now = new Date();

    for (const alert of this.alerts) {
      if (alert.status === "active" && alert.nextEscalation && alert.nextEscalation <= now) {
        this.escalateAlert({
          type: "escalate",
          target: "management",
          parameters: { level: alert.escalationLevel + 1 },
          enabled: true,
        }, { alertId: alert.id });

        alert.escalationLevel++;
        alert.nextEscalation = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      }
    }
  }

  /**
   * Create custom alert
   */
  createAlert(alertData: Omit<SecurityAlert, "id" | "triggeredAt" | "status" | "escalationLevel">): SecurityAlert {
    const alert: SecurityAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      triggeredAt: new Date(),
      status: "active",
      escalationLevel: 1,
      ...alertData,
    };

    this.alerts.push(alert);
    this.emit("alertTriggered", alert);

    monitoring.warn("Custom security alert created", {
      alertId: alert.id,
      title: alert.title,
      severity: alert.severity,
      category: alert.category,
    });

    return alert;
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }

    alert.status = "acknowledged";
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = acknowledgedBy;

    this.emit("alertAcknowledged", alert);

    monitoring.info("Security alert acknowledged", {
      alertId: alert.id,
      acknowledgedBy,
    });

    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return false;
    }

    alert.status = "resolved";
    alert.resolvedAt = new Date();
    alert.resolvedBy = resolvedBy;

    this.emit("alertResolved", alert);

    monitoring.info("Security alert resolved", {
      alertId: alert.id,
      resolvedBy,
    });

    return true;
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get threats
   */
  getThreats(filters?: {
    type?: SecurityThreat["type"];
    severity?: SecurityThreat["severity"];
    status?: SecurityThreat["status"];
    dateRange?: { start: Date; end: Date };
  }): SecurityThreat[] {
    let threats = [...this.threats];

    if (filters) {
      if (filters.type) {
        threats = threats.filter(t => t.type === filters.type);
      }
      if (filters.severity) {
        threats = threats.filter(t => t.severity === filters.severity);
      }
      if (filters.status) {
        threats = threats.filter(t => t.status === filters.status);
      }
      if (filters.dateRange) {
        threats = threats.filter(t =>
          t.detectedAt >= filters.dateRange!.start && t.detectedAt <= filters.dateRange!.end
        );
      }
    }

    return threats.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  /**
   * Get alerts
   */
  getAlerts(filters?: {
    severity?: SecurityAlert["severity"];
    category?: SecurityAlert["category"];
    status?: SecurityAlert["status"];
    dateRange?: { start: Date; end: Date };
  }): SecurityAlert[] {
    let alerts = [...this.alerts];

    if (filters) {
      if (filters.severity) {
        alerts = alerts.filter(a => a.severity === filters.severity);
      }
      if (filters.category) {
        alerts = alerts.filter(a => a.category === filters.category);
      }
      if (filters.status) {
        alerts = alerts.filter(a => a.status === filters.status);
      }
      if (filters.dateRange) {
        alerts = alerts.filter(a =>
          a.triggeredAt >= filters.dateRange!.start && a.triggeredAt <= filters.dateRange!.end
        );
      }
    }

    return alerts.sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Get incidents
   */
  getIncidents(filters?: {
    severity?: SecurityIncident["severity"];
    category?: SecurityIncident["category"];
    status?: SecurityIncident["status"];
    dateRange?: { start: Date; end: Date };
  }): SecurityIncident[] {
    let incidents = [...this.incidents];

    if (filters) {
      if (filters.severity) {
        incidents = incidents.filter(i => i.severity === filters.severity);
      }
      if (filters.category) {
        incidents = incidents.filter(i => i.category === filters.category);
      }
      if (filters.status) {
        incidents = incidents.filter(i => i.status === filters.status);
      }
      if (filters.dateRange) {
        incidents = incidents.filter(i =>
          i.detectedAt >= filters.dateRange!.start && i.detectedAt <= filters.dateRange!.end
        );
      }
    }

    return incidents.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  /**
   * Get security rules
   */
  getSecurityRules(): SecurityRule[] {
    return [...this.rules];
  }

  /**
   * Create security rule
   */
  createSecurityRule(ruleData: Omit<SecurityRule, "id" | "createdAt" | "lastModified" | "triggerCount">): SecurityRule {
    const rule: SecurityRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastModified: new Date(),
      triggerCount: 0,
      ...ruleData,
    };

    this.rules.push(rule);
    this.emit("ruleCreated", rule);

    monitoring.info("Security rule created", {
      ruleId: rule.id,
      ruleName: rule.name,
      category: rule.category,
      severity: rule.severity,
    });

    return rule;
  }

  /**
   * Update security rule
   */
  updateSecurityRule(ruleId: string, updates: Partial<SecurityRule>): boolean {
    const rule = this.rules.find(r => r.id === ruleId);
    if (!rule) {
      return false;
    }

    Object.assign(rule, updates, { lastModified: new Date() });
    this.emit("ruleUpdated", rule);

    monitoring.info("Security rule updated", {
      ruleId: rule.id,
      ruleName: rule.name,
    });

    return true;
  }

  /**
   * Delete security rule
   */
  deleteSecurityRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      return false;
    }

    const rule = this.rules[index];
    this.rules.splice(index, 1);
    this.emit("ruleDeleted", rule);

    monitoring.info("Security rule deleted", {
      ruleId: rule?.id,
      ruleName: rule?.name,
    });

    return true;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const securityMonitoringManager = new SecurityMonitoringManager();

export default SecurityMonitoringManager;
