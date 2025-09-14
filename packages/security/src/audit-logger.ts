import { EventEmitter } from "events";
import { createHash } from "crypto";

export interface AuditEvent {
  id: string;
  timestamp: number;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
    | "authentication"
    | "authorization"
    | "data_access"
    | "data_modification"
    | "system"
    | "security"
    | "compliance";
  outcome: "success" | "failure" | "partial";
  riskScore: number; // 0-100
  complianceFlags: string[];
  metadata: Record<string, any>;
}

export interface AuditConfig {
  enableRealTime: boolean;
  enableBatchProcessing: boolean;
  batchSize: number;
  batchInterval: number; // milliseconds
  retentionPeriod: number; // days
  enableEncryption: boolean;
  enableCompression: boolean;
  maxEventSize: number; // bytes
  enableRiskScoring: boolean;
  enableComplianceMonitoring: boolean;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  conditions: ComplianceCondition[];
  actions: ComplianceAction[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ComplianceCondition {
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: any;
  caseSensitive?: boolean;
}

export interface ComplianceAction {
  type: "alert" | "block" | "log" | "notify" | "escalate";
  target: string;
  parameters: Record<string, any>;
}

export class AuditLogger extends EventEmitter {
  private config: AuditConfig;
  private events: AuditEvent[] = [];
  private complianceRules: ComplianceRule[] = [];
  private riskScoringWeights: Record<string, number>;
  private encryptionManager?: any;

  constructor(config: Partial<AuditConfig> = {}, encryptionManager?: any) {
    super();

    this.config = {
      enableRealTime: true,
      enableBatchProcessing: true,
      batchSize: 100,
      batchInterval: 60000, // 1 minute
      retentionPeriod: 2555, // 7 years
      enableEncryption: false,
      enableCompression: false,
      maxEventSize: 1024 * 1024, // 1MB
      enableRiskScoring: true,
      enableComplianceMonitoring: true,
      ...config,
    };

    this.encryptionManager = encryptionManager;
    this.riskScoringWeights = {
      authentication: 0.3,
      authorization: 0.4,
      data_access: 0.2,
      data_modification: 0.3,
      system: 0.1,
      security: 0.8,
      compliance: 0.6,
    };

    this.initializeComplianceRules();
    this.startBatchProcessing();
    this.startCleanupProcess();
  }

  /**
   * Log audit event
   */
  async logEvent(
    event: Omit<AuditEvent, "id" | "timestamp" | "riskScore" | "complianceFlags">,
  ): Promise<string> {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now(),
      riskScore: this.config.enableRiskScoring ? this.calculateRiskScore(event) : 0,
      complianceFlags: this.config.enableComplianceMonitoring
        ? this.checkComplianceRules(event)
        : [],
    };

    // Validate event size
    const eventSize = JSON.stringify(auditEvent).length;
    if (eventSize > this.config.maxEventSize) {
      throw new Error(
        `Event size ${eventSize} exceeds maximum allowed size ${this.config.maxEventSize}`,
      );
    }

    // Encrypt sensitive data if enabled
    if (this.config.enableEncryption && this.encryptionManager) {
      auditEvent.details = await this.encryptionManager.encryptPII(
        auditEvent.details,
        auditEvent.tenantId,
      );
    }

    // Store event
    this.events.push(auditEvent);

    // Real-time processing
    if (this.config.enableRealTime) {
      this.processEvent(auditEvent);
    }

    // Emit event for external listeners
    this.emit("auditEvent", auditEvent);

    return auditEvent.id;
  }

  /**
   * Log authentication event
   */
  async logAuthentication(
    tenantId: string,
    userId: string,
    action: "login" | "logout" | "login_failed" | "password_changed" | "account_locked",
    details: Record<string, any> = {},
    outcome: "success" | "failure" = "success",
  ): Promise<string> {
    return this.logEvent({
      tenantId,
      userId,
      action,
      resource: "authentication",
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      sessionId: details.sessionId,
      severity: this.getAuthenticationSeverity(action, outcome),
      category: "authentication",
      outcome,
      metadata: {
        eventType: "authentication",
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Log data access event
   */
  async logDataAccess(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    action: "read" | "export" | "download" | "view",
    details: Record<string, any> = {},
  ): Promise<string> {
    return this.logEvent({
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      sessionId: details.sessionId,
      severity: this.getDataAccessSeverity(action, details),
      category: "data_access",
      outcome: "success",
      metadata: {
        eventType: "data_access",
        dataType: details.dataType,
        recordCount: details.recordCount,
      },
    });
  }

  /**
   * Log data modification event
   */
  async logDataModification(
    tenantId: string,
    userId: string,
    resource: string,
    resourceId: string,
    action: "create" | "update" | "delete" | "restore",
    details: Record<string, any> = {},
  ): Promise<string> {
    return this.logEvent({
      tenantId,
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      sessionId: details.sessionId,
      severity: this.getDataModificationSeverity(action, details),
      category: "data_modification",
      outcome: "success",
      metadata: {
        eventType: "data_modification",
        changes: details.changes,
        previousValues: details.previousValues,
      },
    });
  }

  /**
   * Log security event
   */
  async logSecurityEvent(
    tenantId: string,
    action: string,
    details: Record<string, any> = {},
    severity: "low" | "medium" | "high" | "critical" = "medium",
  ): Promise<string> {
    return this.logEvent({
      tenantId,
      action,
      resource: "security",
      details,
      ipAddress: details.ipAddress,
      userAgent: details.userAgent,
      severity,
      category: "security",
      outcome: "failure",
      metadata: {
        eventType: "security",
        threatLevel: details.threatLevel,
        attackVector: details.attackVector,
      },
    });
  }

  /**
   * Get audit events with filtering
   */
  getEvents(
    filters: {
      tenantId?: string;
      userId?: string;
      category?: string;
      severity?: string;
      action?: string;
      startDate?: number;
      endDate?: number;
      limit?: number;
      offset?: number;
    } = {},
  ): AuditEvent[] {
    let filteredEvents = this.events;

    if (filters.tenantId) {
      filteredEvents = filteredEvents.filter(e => e.tenantId === filters.tenantId);
    }

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
    }

    if (filters.category) {
      filteredEvents = filteredEvents.filter(e => e.category === filters.category);
    }

    if (filters.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === filters.severity);
    }

    if (filters.action) {
      filteredEvents = filteredEvents.filter(e => e.action === filters.action);
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 100;

    return filteredEvents.slice(offset, offset + limit);
  }

  /**
   * Get audit statistics
   */
  getAuditStats(tenantId?: string): {
    totalEvents: number;
    eventsByCategory: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    eventsByOutcome: Record<string, number>;
    averageRiskScore: number;
    highRiskEvents: number;
    complianceViolations: number;
    topActions: Array<{ action: string; count: number }>;
    topUsers: Array<{ userId: string; count: number }>;
  } {
    let events = this.events;

    if (tenantId) {
      events = events.filter(e => e.tenantId === tenantId);
    }

    const stats = {
      totalEvents: events.length,
      eventsByCategory: {} as Record<string, number>,
      eventsBySeverity: {} as Record<string, number>,
      eventsByOutcome: {} as Record<string, number>,
      averageRiskScore: 0,
      highRiskEvents: 0,
      complianceViolations: 0,
      topActions: [] as Array<{ action: string; count: number }>,
      topUsers: [] as Array<{ userId: string; count: number }>,
    };

    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};
    let totalRiskScore = 0;

    for (const event of events) {
      // Count by category
      stats.eventsByCategory[event.category] = (stats.eventsByCategory[event.category] || 0) + 1;

      // Count by severity
      stats.eventsBySeverity[event.severity] = (stats.eventsBySeverity[event.severity] || 0) + 1;

      // Count by outcome
      stats.eventsByOutcome[event.outcome] = (stats.eventsByOutcome[event.outcome] || 0) + 1;

      // Risk scoring
      totalRiskScore += event.riskScore;
      if (event.riskScore > 70) {
        stats.highRiskEvents++;
      }

      // Compliance violations
      if (event.complianceFlags.length > 0) {
        stats.complianceViolations++;
      }

      // Action counts
      actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;

      // User counts
      if (event.userId) {
        userCounts[event.userId] = (userCounts[event.userId] || 0) + 1;
      }
    }

    // Calculate averages
    if (events.length > 0) {
      stats.averageRiskScore = totalRiskScore / events.length;
    }

    // Top actions
    stats.topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top users
    stats.topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Add compliance rule
   */
  addComplianceRule(rule: Omit<ComplianceRule, "id" | "createdAt" | "updatedAt">): string {
    const complianceRule: ComplianceRule = {
      ...rule,
      id: this.generateRuleId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.complianceRules.push(complianceRule);
    this.emit("complianceRuleAdded", complianceRule);

    return complianceRule.id;
  }

  /**
   * Update compliance rule
   */
  updateComplianceRule(ruleId: string, updates: Partial<ComplianceRule>): boolean {
    const ruleIndex = this.complianceRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    const existingRule = this.complianceRules[ruleIndex];
    if (!existingRule) return false;

    this.complianceRules[ruleIndex] = {
      id: existingRule.id,
      name: updates.name ?? existingRule.name,
      description: updates.description ?? existingRule.description,
      category: updates.category ?? existingRule.category,
      severity: updates.severity ?? existingRule.severity,
      conditions: updates.conditions ?? existingRule.conditions,
      actions: updates.actions ?? existingRule.actions,
      enabled: updates.enabled ?? existingRule.enabled,
      createdAt: existingRule.createdAt,
      updatedAt: Date.now(),
    };

    this.emit("complianceRuleUpdated", this.complianceRules[ruleIndex]);
    return true;
  }

  /**
   * Process event for real-time monitoring
   */
  private processEvent(event: AuditEvent): void {
    // Check for high-risk events
    if (event.riskScore > 80) {
      this.emit("highRiskEvent", event);
    }

    // Check compliance violations
    if (event.complianceFlags.length > 0) {
      this.emit("complianceViolation", event);
    }

    // Check for suspicious patterns
    this.checkSuspiciousPatterns(event);
  }

  /**
   * Check suspicious patterns
   */
  private checkSuspiciousPatterns(event: AuditEvent): void {
    const recentEvents = this.events.filter(
      e =>
        e.tenantId === event.tenantId &&
        e.userId === event.userId &&
        event.timestamp - e.timestamp < 300000, // Last 5 minutes
    );

    // Check for rapid successive actions
    if (recentEvents.length > 10) {
      this.emit("suspiciousActivity", {
        type: "rapid_actions",
        event,
        count: recentEvents.length,
      });
    }

    // Check for unusual access patterns
    const uniqueResources = new Set(recentEvents.map(e => e.resource));
    if (uniqueResources.size > 20) {
      this.emit("suspiciousActivity", {
        type: "unusual_access_pattern",
        event,
        resourceCount: uniqueResources.size,
      });
    }
  }

  /**
   * Calculate risk score for event
   */
  private calculateRiskScore(
    event: Omit<AuditEvent, "id" | "timestamp" | "riskScore" | "complianceFlags">,
  ): number {
    let score = 0;

    // Base score by category
    score += (this.riskScoringWeights[event.category] || 0.1) * 100;

    // Adjust by severity
    const severityMultipliers = { low: 0.5, medium: 1.0, high: 1.5, critical: 2.0 };
    score *= severityMultipliers[event.severity];

    // Adjust by outcome
    if (event.outcome === "failure") {
      score *= 1.2;
    }

    // Adjust by action
    const highRiskActions = ["delete", "export", "admin_access", "privilege_escalation"];
    if (highRiskActions.some(action => event.action.includes(action))) {
      score *= 1.3;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Check compliance rules
   */
  private checkComplianceRules(
    event: Omit<AuditEvent, "id" | "timestamp" | "riskScore" | "complianceFlags">,
  ): string[] {
    const violations: string[] = [];

    for (const rule of this.complianceRules) {
      if (!rule.enabled) continue;

      let matches = true;
      for (const condition of rule.conditions) {
        if (!this.evaluateCondition(event, condition)) {
          matches = false;
          break;
        }
      }

      if (matches) {
        violations.push(rule.id);
      }
    }

    return violations;
  }

  /**
   * Evaluate compliance condition
   */
  private evaluateCondition(event: any, condition: ComplianceCondition): boolean {
    const fieldValue = this.getFieldValue(event, condition.field);
    const conditionValue = condition.value;
    const caseSensitive = condition.caseSensitive ?? true;

    let value1 = fieldValue;
    let value2 = conditionValue;

    if (!caseSensitive && typeof value1 === "string" && typeof value2 === "string") {
      value1 = value1.toLowerCase();
      value2 = value2.toLowerCase();
    }

    switch (condition.operator) {
      case "equals":
        return value1 === value2;
      case "not_equals":
        return value1 !== value2;
      case "contains":
        return typeof value1 === "string" && value1.includes(value2);
      case "not_contains":
        return typeof value1 === "string" && !value1.includes(value2);
      case "greater_than":
        return Number(value1) > Number(value2);
      case "less_than":
        return Number(value1) < Number(value2);
      case "in":
        return Array.isArray(value2) && value2.includes(value1);
      case "not_in":
        return Array.isArray(value2) && !value2.includes(value1);
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
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Get authentication severity
   */
  private getAuthenticationSeverity(
    action: string,
    outcome: string,
  ): "low" | "medium" | "high" | "critical" {
    if (action === "login_failed" && outcome === "failure") return "medium";
    if (action === "account_locked") return "high";
    if (action === "password_changed") return "medium";
    if (action === "login" && outcome === "success") return "low";
    if (action === "logout" && outcome === "success") return "low";
    return "medium";
  }

  /**
   * Get data access severity
   */
  private getDataAccessSeverity(
    action: string,
    details: any,
  ): "low" | "medium" | "high" | "critical" {
    if (action === "export" || action === "download") return "high";
    if (details.recordCount > 1000) return "high";
    if (details.recordCount > 100) return "medium";
    return "low";
  }

  /**
   * Get data modification severity
   */
  private getDataModificationSeverity(
    action: string,
    details: any,
  ): "low" | "medium" | "high" | "critical" {
    if (action === "delete") return "critical";
    if (action === "create" && details.recordCount > 100) return "high";
    if (action === "update" && details.recordCount > 50) return "medium";
    return "low";
  }

  /**
   * Initialize default compliance rules
   */
  private initializeComplianceRules(): void {
    // GDPR compliance rules
    this.addComplianceRule({
      name: "GDPR Data Export",
      description: "Monitor large data exports for GDPR compliance",
      category: "data_protection",
      severity: "high",
      conditions: [
        { field: "action", operator: "equals", value: "export" },
        { field: "details.recordCount", operator: "greater_than", value: 1000 },
      ],
      actions: [{ type: "alert", target: "security_team", parameters: { priority: "high" } }],
      enabled: true,
    });

    // SOX compliance rules
    this.addComplianceRule({
      name: "SOX Financial Data Access",
      description: "Monitor access to financial data for SOX compliance",
      category: "financial_compliance",
      severity: "high",
      conditions: [
        { field: "resource", operator: "contains", value: "financial" },
        { field: "action", operator: "in", value: ["read", "export", "download"] },
      ],
      actions: [
        { type: "log", target: "audit_log", parameters: {} },
        { type: "notify", target: "compliance_team", parameters: { immediate: true } },
      ],
      enabled: true,
    });
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    if (!this.config.enableBatchProcessing) return;

    setInterval(() => {
      if (this.events.length >= this.config.batchSize) {
        this.emit("batchProcess", this.events.splice(0, this.config.batchSize));
      }
    }, this.config.batchInterval);
  }

  /**
   * Start cleanup process
   */
  private startCleanupProcess(): void {
    setInterval(
      () => {
        const cutoff = Date.now() - this.config.retentionPeriod * 24 * 60 * 60 * 1000;
        this.events = this.events.filter(e => e.timestamp > cutoff);
      },
      24 * 60 * 60 * 1000,
    ); // Daily cleanup
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate rule ID
   */
  private generateRuleId(): string {
    return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
