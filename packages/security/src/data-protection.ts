/**
 * Comprehensive Data Protection System
 *
 * Provides automated data classification, encryption, masking, and protection
 * for sensitive information including PII, financial data, and business data.
 */

import { EventEmitter } from "events";
import { EncryptionManager } from "./encryption";
import { monitoring } from "@aibos/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DataClassification {
  id: string;
  name: string;
  level: "public" | "internal" | "confidential" | "restricted";
  description: string;
  handlingRequirements: string[];
  retentionPeriod: number; // days
  encryptionRequired: boolean;
  accessControls: string[];
  auditRequired: boolean;
}

export interface SensitiveDataField {
  fieldName: string;
  dataType: "pii" | "financial" | "health" | "business" | "technical";
  classification: DataClassification["level"];
  encryptionRequired: boolean;
  maskingRequired: boolean;
  retentionPeriod: number;
  accessLevel: "public" | "internal" | "confidential" | "restricted";
  owner: string;
  lastReviewed: Date;
  nextReview: Date;
}

export interface DataProtectionRule {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  fieldPattern: string;
  dataType: SensitiveDataField["dataType"];
  classification: DataClassification["level"];
  action: "encrypt" | "mask" | "redact" | "block" | "log";
  enabled: boolean;
  priority: number;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface DataProtectionEvent {
  id: string;
  eventType: "access" | "modification" | "deletion" | "export" | "classification" | "encryption" | "masking";
  dataType: SensitiveDataField["dataType"];
  classification: DataClassification["level"];
  fieldName: string;
  tableName: string;
  recordId: string;
  userId: string;
  tenantId: string;
  action: string;
  timestamp: Date;
  success: boolean;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface DataProtectionConfig {
  enableAutomaticClassification: boolean;
  enableRealTimeEncryption: boolean;
  enableDataMasking: boolean;
  enableAccessLogging: boolean;
  enableRetentionManagement: boolean;
  defaultClassification: DataClassification["level"];
  encryptionAlgorithm: string;
  keyRotationInterval: number; // days
  auditRetentionPeriod: number; // days
  maskingRules: DataMaskingRule[];
}

export interface DataMaskingRule {
  id: string;
  name: string;
  pattern: RegExp;
  maskType: "full" | "partial" | "hash" | "tokenize" | "redact";
  maskCharacter: string;
  visibleChars: number;
  position: "start" | "end" | "middle";
  enabled: boolean;
}

export interface DataRetentionPolicy {
  id: string;
  name: string;
  description: string;
  dataTypes: SensitiveDataField["dataType"][];
  classifications: DataClassification["level"][];
  retentionPeriod: number; // days
  action: "delete" | "archive" | "anonymize" | "encrypt";
  enabled: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
  createdBy: string;
  createdAt: Date;
}

// ============================================================================
// DATA PROTECTION MANAGER
// ============================================================================

export class DataProtectionManager extends EventEmitter {
  private encryptionManager: EncryptionManager;
  private config: DataProtectionConfig;
  private classifications: DataClassification[] = [];
  private sensitiveFields: SensitiveDataField[] = [];
  private protectionRules: DataProtectionRule[] = [];
  private maskingRules: DataMaskingRule[] = [];
  private retentionPolicies: DataRetentionPolicy[] = [];
  private events: DataProtectionEvent[] = [];

  constructor(config: Partial<DataProtectionConfig> = {}) {
    super();

    this.config = {
      enableAutomaticClassification: true,
      enableRealTimeEncryption: true,
      enableDataMasking: true,
      enableAccessLogging: true,
      enableRetentionManagement: true,
      defaultClassification: "internal",
      encryptionAlgorithm: "aes-256-gcm",
      keyRotationInterval: 90,
      auditRetentionPeriod: 2555, // 7 years
      maskingRules: [],
      ...config,
    };

    this.encryptionManager = new EncryptionManager();
    this.initializeDefaultClassifications();
    this.initializeDefaultRules();
    this.initializeDefaultMaskingRules();
    this.initializeDefaultRetentionPolicies();
  }

  /**
   * Initialize default data classifications
   */
  private initializeDefaultClassifications(): void {
    this.classifications = [
      {
        id: "public",
        name: "Public",
        level: "public",
        description: "Information that can be freely shared",
        handlingRequirements: ["No special handling required"],
        retentionPeriod: 365,
        encryptionRequired: false,
        accessControls: ["public"],
        auditRequired: false,
      },
      {
        id: "internal",
        name: "Internal",
        level: "internal",
        description: "Information for internal use only",
        handlingRequirements: ["Restrict to authorized personnel", "No external sharing"],
        retentionPeriod: 1095, // 3 years
        encryptionRequired: false,
        accessControls: ["internal"],
        auditRequired: true,
      },
      {
        id: "confidential",
        name: "Confidential",
        level: "confidential",
        description: "Sensitive information requiring protection",
        handlingRequirements: ["Encrypt at rest", "Limit access", "Audit all access"],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ["confidential"],
        auditRequired: true,
      },
      {
        id: "restricted",
        name: "Restricted",
        level: "restricted",
        description: "Highly sensitive information with strict controls",
        handlingRequirements: ["Strong encryption", "Minimal access", "Full audit trail"],
        retentionPeriod: 2555, // 7 years
        encryptionRequired: true,
        accessControls: ["restricted"],
        auditRequired: true,
      },
    ];
  }

  /**
   * Initialize default protection rules
   */
  private initializeDefaultRules(): void {
    this.protectionRules = [
      // PII Rules
      {
        id: "rule-pii-email",
        name: "Email Address Protection",
        description: "Protect email addresses",
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        fieldPattern: "*email*",
        dataType: "pii",
        classification: "confidential",
        action: "encrypt",
        enabled: true,
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "rule-pii-phone",
        name: "Phone Number Protection",
        description: "Protect phone numbers",
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        fieldPattern: "*phone*",
        dataType: "pii",
        classification: "confidential",
        action: "encrypt",
        enabled: true,
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "rule-pii-ssn",
        name: "SSN Protection",
        description: "Protect Social Security Numbers",
        pattern: /^\d{3}-?\d{2}-?\d{4}$/,
        fieldPattern: "*ssn*",
        dataType: "pii",
        classification: "restricted",
        action: "encrypt",
        enabled: true,
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      // Financial Rules
      {
        id: "rule-financial-credit-card",
        name: "Credit Card Protection",
        description: "Protect credit card numbers",
        pattern: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
        fieldPattern: "*credit*card*",
        dataType: "financial",
        classification: "restricted",
        action: "encrypt",
        enabled: true,
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "rule-financial-bank-account",
        name: "Bank Account Protection",
        description: "Protect bank account numbers",
        pattern: /^\d{8,17}$/,
        fieldPattern: "*bank*account*",
        dataType: "financial",
        classification: "restricted",
        action: "encrypt",
        enabled: true,
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      // Health Rules
      {
        id: "rule-health-medical-id",
        name: "Medical ID Protection",
        description: "Protect medical record numbers",
        pattern: /^[A-Z0-9]{6,12}$/,
        fieldPattern: "*medical*id*",
        dataType: "health",
        classification: "restricted",
        action: "encrypt",
        enabled: true,
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
    ];
  }

  /**
   * Initialize default masking rules
   */
  private initializeDefaultMaskingRules(): void {
    this.maskingRules = [
      {
        id: "mask-email",
        name: "Email Masking",
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        maskType: "partial",
        maskCharacter: "*",
        visibleChars: 2,
        position: "start",
        enabled: true,
      },
      {
        id: "mask-phone",
        name: "Phone Masking",
        pattern: /^[\+]?[1-9][\d]{0,15}$/,
        maskType: "partial",
        maskCharacter: "*",
        visibleChars: 4,
        position: "end",
        enabled: true,
      },
      {
        id: "mask-ssn",
        name: "SSN Masking",
        pattern: /^\d{3}-?\d{2}-?\d{4}$/,
        maskType: "partial",
        maskCharacter: "*",
        visibleChars: 4,
        position: "end",
        enabled: true,
      },
      {
        id: "mask-credit-card",
        name: "Credit Card Masking",
        pattern: /^\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}$/,
        maskType: "partial",
        maskCharacter: "*",
        visibleChars: 4,
        position: "end",
        enabled: true,
      },
    ];
  }

  /**
   * Initialize default retention policies
   */
  private initializeDefaultRetentionPolicies(): void {
    this.retentionPolicies = [
      {
        id: "retention-pii",
        name: "PII Retention Policy",
        description: "Retention policy for personally identifiable information",
        dataTypes: ["pii"],
        classifications: ["confidential", "restricted"],
        retentionPeriod: 2555, // 7 years
        action: "anonymize",
        enabled: true,
        createdBy: "system",
        createdAt: new Date(),
      },
      {
        id: "retention-financial",
        name: "Financial Data Retention Policy",
        description: "Retention policy for financial information",
        dataTypes: ["financial"],
        classifications: ["confidential", "restricted"],
        retentionPeriod: 2555, // 7 years
        action: "archive",
        enabled: true,
        createdBy: "system",
        createdAt: new Date(),
      },
      {
        id: "retention-health",
        name: "Health Data Retention Policy",
        description: "Retention policy for health information",
        dataTypes: ["health"],
        classifications: ["restricted"],
        retentionPeriod: 2555, // 7 years
        action: "encrypt",
        enabled: true,
        createdBy: "system",
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Classify data field
   */
  classifyDataField(fieldName: string, value: string, tableName: string): {
    classification: DataClassification["level"];
    dataType: SensitiveDataField["dataType"];
    action: DataProtectionRule["action"];
    rule?: DataProtectionRule;
  } {
    // Check against protection rules
    for (const rule of this.protectionRules.sort((a, b) => a.priority - b.priority)) {
      if (rule.enabled && this.matchesFieldPattern(fieldName, rule.fieldPattern)) {
        if (rule.pattern.test(value)) {
          return {
            classification: rule.classification,
            dataType: rule.dataType,
            action: rule.action,
            rule,
          };
        }
      }
    }

    // Default classification
    return {
      classification: this.config.defaultClassification,
      dataType: "business",
      action: "log",
    };
  }

  /**
   * Protect sensitive data
   */
  async protectData(
    data: Record<string, unknown>,
    tableName: string,
    recordId: string,
    userId: string,
    tenantId: string
  ): Promise<Record<string, unknown>> {
    const protectedData: Record<string, unknown> = {};
    const protectionEvents: DataProtectionEvent[] = [];

    for (const [fieldName, value] of Object.entries(data)) {
      if (typeof value === "string" && value.length > 0) {
        const classification = this.classifyDataField(fieldName, value, tableName);

        let processedValue = value;
        let success = true;
        let error: string | undefined;

        try {
          switch (classification.action) {
            case "encrypt":
              if (this.config.enableRealTimeEncryption) {
                const encrypted = await this.encryptionManager.encrypt(value);
                processedValue = encrypted.data;
              }
              break;
            case "mask":
              if (this.config.enableDataMasking) {
                processedValue = this.maskData(value, fieldName);
              }
              break;
            case "redact":
              processedValue = "[REDACTED]";
              break;
            case "block":
              throw new Error("Data access blocked due to classification");
            case "log":
              // Just log, no modification
              break;
          }
        } catch (err) {
          success = false;
          error = err instanceof Error ? err.message : String(err);
          processedValue = value; // Keep original value on error
        }

        // Record protection event
        if (this.config.enableAccessLogging) {
          const event: DataProtectionEvent = {
            id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            eventType: "classification",
            dataType: classification.dataType,
            classification: classification.classification,
            fieldName,
            tableName,
            recordId,
            userId,
            tenantId,
            action: classification.action,
            timestamp: new Date(),
            success,
            error,
            metadata: {
              originalLength: value.length,
              processedLength: String(processedValue).length,
              rule: classification.rule?.id || undefined,
            },
          };
          protectionEvents.push(event);
        }

        protectedData[fieldName] = processedValue;
      } else {
        protectedData[fieldName] = value;
      }
    }

    // Store protection events
    if (protectionEvents.length > 0) {
      this.events.push(...protectionEvents);
      this.emit("dataProtectionEvents", protectionEvents);
    }

    return protectedData;
  }

  /**
   * Mask sensitive data
   */
  maskData(value: string, fieldName: string): string {
    const maskingRule = this.maskingRules.find(rule =>
      rule.enabled && rule.pattern.test(value)
    );

    if (!maskingRule) {
      return this.defaultMask(value);
    }

    switch (maskingRule.maskType) {
      case "full":
        return maskingRule.maskCharacter.repeat(value.length);
      case "partial":
        return this.partialMask(value, maskingRule);
      case "hash":
        return this.hashMask(value);
      case "tokenize":
        return this.tokenizeMask(value);
      case "redact":
        return "[REDACTED]";
      default:
        return this.defaultMask(value);
    }
  }

  /**
   * Partial mask implementation
   */
  private partialMask(value: string, rule: DataMaskingRule): string {
    const visibleChars = Math.min(rule.visibleChars, value.length);
    const maskedLength = value.length - visibleChars;

    if (maskedLength <= 0) {
      return value;
    }

    const mask = rule.maskCharacter.repeat(maskedLength);

    switch (rule.position) {
      case "start":
        return mask + value.slice(-visibleChars);
      case "end":
        return value.slice(0, visibleChars) + mask;
      case "middle":
        const startChars = Math.floor(visibleChars / 2);
        const endChars = visibleChars - startChars;
        return value.slice(0, startChars) + mask + value.slice(-endChars);
      default:
        return value.slice(0, visibleChars) + mask;
    }
  }

  /**
   * Hash mask implementation
   */
  private hashMask(value: string): string {
    const { createHash } = require("crypto");
    const hash = createHash("sha256");
    hash.update(value);
    return `hash_${hash.digest("hex").substring(0, 8)}`;
  }

  /**
   * Tokenize mask implementation
   */
  private tokenizeMask(value: string): string {
    return `token_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Default mask implementation
   */
  private defaultMask(value: string): string {
    if (value.length <= 4) {
      return "*".repeat(value.length);
    }
    return value.slice(0, 2) + "*".repeat(value.length - 4) + value.slice(-2);
  }

  /**
   * Check if field matches pattern
   */
  private matchesFieldPattern(fieldName: string, pattern: string): boolean {
    // Convert wildcard pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, ".*")
      .replace(/\?/g, ".");
    const regex = new RegExp(`^${regexPattern}$`, "i");
    return regex.test(fieldName);
  }

  /**
   * Execute retention policies
   */
  async executeRetentionPolicies(): Promise<{
    executed: number;
    processed: number;
    errors: string[];
  }> {
    const result = {
      executed: 0,
      processed: 0,
      errors: [] as string[],
    };

    for (const policy of this.retentionPolicies) {
      if (!policy.enabled) continue;

      try {
        const cutoffDate = new Date(Date.now() - policy.retentionPeriod * 24 * 60 * 60 * 1000);

        // Find data that exceeds retention period
        const expiredData = this.events.filter(event =>
          event.timestamp < cutoffDate &&
          policy.dataTypes.includes(event.dataType) &&
          policy.classifications.includes(event.classification)
        );

        // Process expired data based on policy action
        for (const event of expiredData) {
          try {
            await this.processRetentionAction(event, policy.action);
            result.processed++;
          } catch (error) {
            result.errors.push(`Failed to process event ${event.id}: ${error}`);
          }
        }

        policy.lastExecuted = new Date();
        policy.nextExecution = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
        result.executed++;

        monitoring.info("Retention policy executed", {
          policyId: policy.id,
          policyName: policy.name,
          processed: expiredData.length,
        });
      } catch (error) {
        result.errors.push(`Failed to execute policy ${policy.id}: ${error}`);
      }
    }

    return result;
  }

  /**
   * Process retention action
   */
  private async processRetentionAction(event: DataProtectionEvent, action: DataRetentionPolicy["action"]): Promise<void> {
    switch (action) {
      case "delete":
        // Remove from events (simplified - in real implementation, would delete actual data)
        const index = this.events.findIndex(e => e.id === event.id);
        if (index > -1) {
          this.events.splice(index, 1);
        }
        break;
      case "archive":
        // Mark as archived (simplified)
        event.metadata.archived = true;
        event.metadata.archivedAt = new Date();
        break;
      case "anonymize":
        // Anonymize data (simplified)
        event.metadata.anonymized = true;
        event.metadata.anonymizedAt = new Date();
        break;
      case "encrypt":
        // Additional encryption (simplified)
        event.metadata.additionalEncryption = true;
        event.metadata.additionalEncryptionAt = new Date();
        break;
    }
  }

  /**
   * Get data protection statistics
   */
  getDataProtectionStatistics(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByClassification: Record<string, number>;
    eventsByDataType: Record<string, number>;
    protectionRules: {
      total: number;
      enabled: number;
      disabled: number;
    };
    maskingRules: {
      total: number;
      enabled: number;
      disabled: number;
    };
    retentionPolicies: {
      total: number;
      enabled: number;
      disabled: number;
    };
  } {
    const eventsByType: Record<string, number> = {};
    const eventsByClassification: Record<string, number> = {};
    const eventsByDataType: Record<string, number> = {};

    for (const event of this.events) {
      eventsByType[event.eventType] = (eventsByType[event.eventType] || 0) + 1;
      eventsByClassification[event.classification] = (eventsByClassification[event.classification] || 0) + 1;
      eventsByDataType[event.dataType] = (eventsByDataType[event.dataType] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      eventsByType,
      eventsByClassification,
      eventsByDataType,
      protectionRules: {
        total: this.protectionRules.length,
        enabled: this.protectionRules.filter(r => r.enabled).length,
        disabled: this.protectionRules.filter(r => !r.enabled).length,
      },
      maskingRules: {
        total: this.maskingRules.length,
        enabled: this.maskingRules.filter(r => r.enabled).length,
        disabled: this.maskingRules.filter(r => !r.enabled).length,
      },
      retentionPolicies: {
        total: this.retentionPolicies.length,
        enabled: this.retentionPolicies.filter(p => p.enabled).length,
        disabled: this.retentionPolicies.filter(p => !p.enabled).length,
      },
    };
  }

  /**
   * Get data protection events
   */
  getDataProtectionEvents(filters?: {
    eventType?: DataProtectionEvent["eventType"];
    dataType?: DataProtectionEvent["dataType"];
    classification?: DataProtectionEvent["classification"];
    dateRange?: { start: Date; end: Date };
  }): DataProtectionEvent[] {
    let events = [...this.events];

    if (filters) {
      if (filters.eventType) {
        events = events.filter(e => e.eventType === filters.eventType);
      }
      if (filters.dataType) {
        events = events.filter(e => e.dataType === filters.dataType);
      }
      if (filters.classification) {
        events = events.filter(e => e.classification === filters.classification);
      }
      if (filters.dateRange) {
        events = events.filter(e =>
          e.timestamp >= filters.dateRange!.start && e.timestamp <= filters.dateRange!.end
        );
      }
    }

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Add protection rule
   */
  addProtectionRule(rule: Omit<DataProtectionRule, "id" | "createdAt" | "lastModified">): DataProtectionRule {
    const newRule: DataProtectionRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastModified: new Date(),
      ...rule,
    };

    this.protectionRules.push(newRule);
    this.emit("protectionRuleAdded", newRule);

    monitoring.info("Data protection rule added", {
      ruleId: newRule.id,
      ruleName: newRule.name,
      dataType: newRule.dataType,
      classification: newRule.classification,
    });

    return newRule;
  }

  /**
   * Update protection rule
   */
  updateProtectionRule(ruleId: string, updates: Partial<DataProtectionRule>): boolean {
    const rule = this.protectionRules.find(r => r.id === ruleId);
    if (!rule) {
      return false;
    }

    Object.assign(rule, updates, { lastModified: new Date() });
    this.emit("protectionRuleUpdated", rule);

    monitoring.info("Data protection rule updated", {
      ruleId: rule.id,
      ruleName: rule.name,
    });

    return true;
  }

  /**
   * Delete protection rule
   */
  deleteProtectionRule(ruleId: string): boolean {
    const index = this.protectionRules.findIndex(r => r.id === ruleId);
    if (index === -1) {
      return false;
    }

    const rule = this.protectionRules[index];
    this.protectionRules.splice(index, 1);
    this.emit("protectionRuleDeleted", rule);

    monitoring.info("Data protection rule deleted", {
      ruleId: rule?.id,
      ruleName: rule?.name,
    });

    return true;
  }

  /**
   * Get protection rules
   */
  getProtectionRules(): DataProtectionRule[] {
    return [...this.protectionRules];
  }

  /**
   * Get masking rules
   */
  getMaskingRules(): DataMaskingRule[] {
    return [...this.maskingRules];
  }

  /**
   * Get retention policies
   */
  getRetentionPolicies(): DataRetentionPolicy[] {
    return [...this.retentionPolicies];
  }

  /**
   * Get data classifications
   */
  getDataClassifications(): DataClassification[] {
    return [...this.classifications];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const dataProtectionManager = new DataProtectionManager();

export default DataProtectionManager;
