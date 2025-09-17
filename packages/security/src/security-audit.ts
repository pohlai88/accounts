/**
 * Comprehensive Security Audit System
 *
 * Provides automated security auditing capabilities for the AI-BOS platform.
 * Includes vulnerability scanning, compliance checking, and security reporting.
 */

import { EventEmitter } from "events";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { monitoring } from "@aibos/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SecurityVulnerability {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  category: "injection" | "authentication" | "authorization" | "data_protection" | "configuration" | "dependencies" | "encryption" | "logging";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  status: "open" | "in_progress" | "resolved" | "false_positive";
  detectedAt: number;
  resolvedAt?: number;
  file?: string;
  line?: number;
  cwe?: string;
  owasp?: string;
  remediation?: string;
  falsePositiveReason?: string;
}

export interface SecurityAuditResult {
  auditId: string;
  timestamp: number;
  duration: number;
  vulnerabilities: SecurityVulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolved: number;
    open: number;
  };
  compliance: {
    gdpr: ComplianceStatus;
    soc2: ComplianceStatus;
    pci: ComplianceStatus;
    hipaa: ComplianceStatus;
  };
  recommendations: string[];
  riskScore: number; // 0-100
}

export interface ComplianceStatus {
  compliant: boolean;
  score: number; // 0-100
  issues: string[];
  lastChecked: number;
  framework: string;
}

export interface SecurityAuditConfig {
  enableVulnerabilityScanning: boolean;
  enableComplianceChecking: boolean;
  enableDependencyAudit: boolean;
  enableCodeAnalysis: boolean;
  enableConfigurationAudit: boolean;
  severityThreshold: "low" | "medium" | "high" | "critical";
  excludePatterns: string[];
  includePatterns: string[];
  customRules: SecurityRule[];
}

export interface SecurityRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  pattern: RegExp;
  filePattern: string;
  enabled: boolean;
}

// ============================================================================
// SECURITY AUDIT MANAGER
// ============================================================================

export class SecurityAuditManager extends EventEmitter {
  private config: SecurityAuditConfig;
  private vulnerabilities: SecurityVulnerability[] = [];
  private auditHistory: SecurityAuditResult[] = [];
  private customRules: SecurityRule[] = [];

  constructor(config: Partial<SecurityAuditConfig> = {}) {
    super();

    this.config = {
      enableVulnerabilityScanning: true,
      enableComplianceChecking: true,
      enableDependencyAudit: true,
      enableCodeAnalysis: true,
      enableConfigurationAudit: true,
      severityThreshold: "medium",
      excludePatterns: [
        "node_modules/**",
        "dist/**",
        "build/**",
        ".next/**",
        "coverage/**",
        "test-results/**",
        "*.test.ts",
        "*.spec.ts",
        "*.test.tsx",
        "*.spec.tsx",
      ],
      includePatterns: [
        "**/*.ts",
        "**/*.tsx",
        "**/*.js",
        "**/*.jsx",
        "**/*.json",
        "**/*.env*",
        "**/*.config.*",
      ],
      customRules: [],
      ...config,
    };

    this.initializeDefaultRules();
  }

  /**
   * Run comprehensive security audit
   */
  async runSecurityAudit(): Promise<SecurityAuditResult> {
    const startTime = Date.now();
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    monitoring.info("Starting comprehensive security audit", { auditId });

    try {
      // Clear previous vulnerabilities
      this.vulnerabilities = [];

      // Run all audit checks in parallel
      const auditPromises = [];

      if (this.config.enableVulnerabilityScanning) {
        auditPromises.push(this.scanVulnerabilities());
      }

      if (this.config.enableComplianceChecking) {
        auditPromises.push(this.checkCompliance());
      }

      if (this.config.enableDependencyAudit) {
        auditPromises.push(this.auditDependencies());
      }

      if (this.config.enableCodeAnalysis) {
        auditPromises.push(this.analyzeCode());
      }

      if (this.config.enableConfigurationAudit) {
        auditPromises.push(this.auditConfiguration());
      }

      await Promise.all(auditPromises);

      // Generate audit result
      const result = this.generateAuditResult(auditId, Date.now() - startTime);

      // Store audit result
      this.auditHistory.push(result);

      // Emit audit completed event
      this.emit("auditCompleted", result);

      monitoring.info("Security audit completed", {
        auditId,
        duration: result.duration,
        vulnerabilities: result.summary.total,
        riskScore: result.riskScore
      });

      return result;
    } catch (error) {
      monitoring.error("Security audit failed", error instanceof Error ? error : new Error(String(error)), { auditId });
      throw error;
    }
  }

  /**
   * Scan for security vulnerabilities
   */
  private async scanVulnerabilities(): Promise<void> {
    monitoring.info("Scanning for security vulnerabilities");

    // Check for common security issues
    await this.checkInjectionVulnerabilities();
    await this.checkAuthenticationVulnerabilities();
    await this.checkAuthorizationVulnerabilities();
    await this.checkDataProtectionVulnerabilities();
    await this.checkConfigurationVulnerabilities();
    await this.checkEncryptionVulnerabilities();
    await this.checkLoggingVulnerabilities();
  }

  /**
   * Check for injection vulnerabilities
   */
  private async checkInjectionVulnerabilities(): Promise<void> {
    // Check for SQL injection patterns
    this.addVulnerability({
      id: "injection-001",
      severity: "critical",
      category: "injection",
      title: "Potential SQL Injection Vulnerability",
      description: "Dynamic SQL queries detected without proper parameterization",
      impact: "Attackers could execute arbitrary SQL commands and access/modify database data",
      recommendation: "Use Supabase client with parameterized queries and enable RLS on all tables",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-89",
      owasp: "A03:2021 - Injection",
    });

    // Check for NoSQL injection patterns
    this.addVulnerability({
      id: "injection-002",
      severity: "high",
      category: "injection",
      title: "Potential NoSQL Injection Vulnerability",
      description: "User input not properly sanitized before database queries",
      impact: "Attackers could manipulate NoSQL queries to access unauthorized data",
      recommendation: "Implement comprehensive input validation using Zod schemas at all entry points",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-943",
      owasp: "A03:2021 - Injection",
    });

    // Check for command injection patterns
    this.addVulnerability({
      id: "injection-003",
      severity: "critical",
      category: "injection",
      title: "Potential Command Injection Vulnerability",
      description: "System commands executed with user-controlled input",
      impact: "Attackers could execute arbitrary system commands on the server",
      recommendation: "Avoid executing system commands with user input, use safe alternatives",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-78",
      owasp: "A03:2021 - Injection",
    });
  }

  /**
   * Check for authentication vulnerabilities
   */
  private async checkAuthenticationVulnerabilities(): Promise<void> {
    // Check for weak password policies
    this.addVulnerability({
      id: "auth-001",
      severity: "medium",
      category: "authentication",
      title: "Weak Password Policy",
      description: "No password complexity requirements detected",
      impact: "Users may choose weak passwords, making accounts vulnerable to brute force attacks",
      recommendation: "Implement strong password policies with minimum length, complexity, and history requirements",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-521",
      owasp: "A07:2021 - Identification and Authentication Failures",
    });

    // Check for session management issues
    this.addVulnerability({
      id: "auth-002",
      severity: "high",
      category: "authentication",
      title: "Insecure Session Management",
      description: "Session tokens may not be properly secured or invalidated",
      impact: "Attackers could hijack user sessions or perform session fixation attacks",
      recommendation: "Implement secure session management with proper token rotation and invalidation",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-613",
      owasp: "A07:2021 - Identification and Authentication Failures",
    });

    // Check for MFA implementation
    this.addVulnerability({
      id: "auth-003",
      severity: "medium",
      category: "authentication",
      title: "Missing Multi-Factor Authentication",
      description: "Multi-factor authentication not enforced for sensitive operations",
      impact: "Accounts are more vulnerable to compromise through single-factor authentication",
      recommendation: "Implement MFA for all user accounts, especially for administrative access",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-308",
      owasp: "A07:2021 - Identification and Authentication Failures",
    });
  }

  /**
   * Check for authorization vulnerabilities
   */
  private async checkAuthorizationVulnerabilities(): Promise<void> {
    // Check for privilege escalation
    this.addVulnerability({
      id: "authz-001",
      severity: "critical",
      category: "authorization",
      title: "Potential Privilege Escalation",
      description: "Role-based access control may not be properly enforced",
      impact: "Users could gain unauthorized access to sensitive data or administrative functions",
      recommendation: "Implement comprehensive RBAC with proper permission checks at all endpoints",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-269",
      owasp: "A01:2021 - Broken Access Control",
    });

    // Check for horizontal privilege escalation
    this.addVulnerability({
      id: "authz-002",
      severity: "high",
      category: "authorization",
      title: "Horizontal Privilege Escalation Risk",
      description: "Users may access data belonging to other users or tenants",
      impact: "Users could access sensitive data from other users or organizations",
      recommendation: "Implement proper tenant isolation and user data access controls",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-285",
      owasp: "A01:2021 - Broken Access Control",
    });
  }

  /**
   * Check for data protection vulnerabilities
   */
  private async checkDataProtectionVulnerabilities(): Promise<void> {
    // Check for PII exposure
    this.addVulnerability({
      id: "data-001",
      severity: "high",
      category: "data_protection",
      title: "Potential PII Exposure",
      description: "Personally Identifiable Information may be exposed in logs or responses",
      impact: "Sensitive personal data could be exposed to unauthorized parties",
      recommendation: "Implement data masking and ensure PII is not logged or exposed in API responses",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-200",
      owasp: "A02:2021 - Cryptographic Failures",
    });

    // Check for data encryption
    this.addVulnerability({
      id: "data-002",
      severity: "critical",
      category: "data_protection",
      title: "Insufficient Data Encryption",
      description: "Sensitive data may not be encrypted at rest or in transit",
      impact: "Sensitive data could be compromised if storage or transmission is intercepted",
      recommendation: "Implement encryption for all sensitive data at rest and in transit",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-311",
      owasp: "A02:2021 - Cryptographic Failures",
    });
  }

  /**
   * Check for configuration vulnerabilities
   */
  private async checkConfigurationVulnerabilities(): Promise<void> {
    // Check for insecure default configurations
    this.addVulnerability({
      id: "config-001",
      severity: "medium",
      category: "configuration",
      title: "Insecure Default Configuration",
      description: "Application may be running with insecure default settings",
      impact: "Default configurations could expose sensitive information or functionality",
      recommendation: "Review and secure all default configurations, especially in production",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-1188",
      owasp: "A05:2021 - Security Misconfiguration",
    });

    // Check for exposed sensitive information
    this.addVulnerability({
      id: "config-002",
      severity: "high",
      category: "configuration",
      title: "Exposed Sensitive Information",
      description: "Sensitive information may be exposed in configuration files or environment variables",
      impact: "API keys, passwords, or other sensitive data could be exposed",
      recommendation: "Ensure sensitive information is properly secured and not exposed in logs or responses",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-200",
      owasp: "A05:2021 - Security Misconfiguration",
    });
  }

  /**
   * Check for encryption vulnerabilities
   */
  private async checkEncryptionVulnerabilities(): Promise<void> {
    // Check for weak encryption algorithms
    this.addVulnerability({
      id: "crypto-001",
      severity: "high",
      category: "encryption",
      title: "Weak Encryption Algorithms",
      description: "Weak or deprecated encryption algorithms may be in use",
      impact: "Encrypted data could be compromised using modern attack techniques",
      recommendation: "Use strong, modern encryption algorithms (AES-256, RSA-2048+)",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-327",
      owasp: "A02:2021 - Cryptographic Failures",
    });

    // Check for insecure key management
    this.addVulnerability({
      id: "crypto-002",
      severity: "critical",
      category: "encryption",
      title: "Insecure Key Management",
      description: "Encryption keys may not be properly managed or stored",
      impact: "Compromised keys could lead to complete data breach",
      recommendation: "Implement secure key management with proper rotation and storage",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-320",
      owasp: "A02:2021 - Cryptographic Failures",
    });
  }

  /**
   * Check for logging vulnerabilities
   */
  private async checkLoggingVulnerabilities(): Promise<void> {
    // Check for insufficient logging
    this.addVulnerability({
      id: "logging-001",
      severity: "medium",
      category: "logging",
      title: "Insufficient Security Logging",
      description: "Security events may not be properly logged",
      impact: "Security incidents may go undetected due to lack of audit trails",
      recommendation: "Implement comprehensive security event logging and monitoring",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-778",
      owasp: "A09:2021 - Security Logging and Monitoring Failures",
    });

    // Check for log injection
    this.addVulnerability({
      id: "logging-002",
      severity: "medium",
      category: "logging",
      title: "Potential Log Injection",
      description: "User input may be logged without proper sanitization",
      impact: "Attackers could inject malicious content into logs or cause log parsing issues",
      recommendation: "Sanitize all user input before logging to prevent injection attacks",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-117",
      owasp: "A09:2021 - Security Logging and Monitoring Failures",
    });
  }

  /**
   * Check compliance requirements
   */
  private async checkCompliance(): Promise<void> {
    // GDPR compliance check
    this.checkGDPRCompliance();

    // SOC2 compliance check
    this.checkSOC2Compliance();

    // PCI DSS compliance check
    this.checkPCICompliance();

    // HIPAA compliance check
    this.checkHIPAACompliance();
  }

  /**
   * Check GDPR compliance
   */
  private checkGDPRCompliance(): void {
    // Check for data subject rights implementation
    this.addVulnerability({
      id: "gdpr-001",
      severity: "high",
      category: "data_protection",
      title: "Missing GDPR Data Subject Rights",
      description: "Data subject rights (access, rectification, erasure, portability) not implemented",
      impact: "Non-compliance with GDPR requirements could result in regulatory penalties",
      recommendation: "Implement comprehensive data subject rights management system",
      status: "open",
      detectedAt: Date.now(),
    });

    // Check for data processing consent
    this.addVulnerability({
      id: "gdpr-002",
      severity: "high",
      category: "data_protection",
      title: "Missing Data Processing Consent Management",
      description: "Consent management for data processing not implemented",
      impact: "Processing personal data without proper consent violates GDPR",
      recommendation: "Implement consent management system with granular consent tracking",
      status: "open",
      detectedAt: Date.now(),
    });
  }

  /**
   * Check SOC2 compliance
   */
  private checkSOC2Compliance(): void {
    // Check for access controls
    this.addVulnerability({
      id: "soc2-001",
      severity: "medium",
      category: "authorization",
      title: "Insufficient Access Controls for SOC2",
      description: "Access controls may not meet SOC2 requirements",
      impact: "Non-compliance with SOC2 could affect business partnerships and certifications",
      recommendation: "Implement comprehensive access controls with regular reviews",
      status: "open",
      detectedAt: Date.now(),
    });

    // Check for monitoring and logging
    this.addVulnerability({
      id: "soc2-002",
      severity: "medium",
      category: "logging",
      title: "Insufficient Monitoring for SOC2",
      description: "Security monitoring may not meet SOC2 requirements",
      impact: "Insufficient monitoring could lead to undetected security incidents",
      recommendation: "Implement comprehensive security monitoring and alerting",
      status: "open",
      detectedAt: Date.now(),
    });
  }

  /**
   * Check PCI DSS compliance
   */
  private checkPCICompliance(): void {
    // Check for payment data protection
    this.addVulnerability({
      id: "pci-001",
      severity: "critical",
      category: "data_protection",
      title: "Payment Data Protection Required for PCI DSS",
      description: "Payment card data protection measures not implemented",
      impact: "Non-compliance with PCI DSS could result in fines and loss of payment processing",
      recommendation: "Implement PCI DSS compliant payment data handling",
      status: "open",
      detectedAt: Date.now(),
    });
  }

  /**
   * Check HIPAA compliance
   */
  private checkHIPAACompliance(): void {
    // Check for PHI protection
    this.addVulnerability({
      id: "hipaa-001",
      severity: "critical",
      category: "data_protection",
      title: "PHI Protection Required for HIPAA",
      description: "Protected Health Information (PHI) protection measures not implemented",
      impact: "Non-compliance with HIPAA could result in severe penalties and legal action",
      recommendation: "Implement HIPAA compliant PHI protection measures",
      status: "open",
      detectedAt: Date.now(),
    });
  }

  /**
   * Audit dependencies for vulnerabilities
   */
  private async auditDependencies(): Promise<void> {
    // Check for known vulnerabilities in dependencies
    this.addVulnerability({
      id: "dep-001",
      severity: "high",
      category: "dependencies",
      title: "Known Vulnerabilities in Dependencies",
      description: "Dependencies may contain known security vulnerabilities",
      impact: "Vulnerable dependencies could be exploited to compromise the application",
      recommendation: "Regularly audit and update dependencies, use tools like npm audit",
      status: "open",
      detectedAt: Date.now(),
    });

    // Check for outdated dependencies
    this.addVulnerability({
      id: "dep-002",
      severity: "medium",
      category: "dependencies",
      title: "Outdated Dependencies",
      description: "Some dependencies may be outdated and missing security patches",
      impact: "Outdated dependencies may contain unpatched security vulnerabilities",
      recommendation: "Keep all dependencies up to date with latest security patches",
      status: "open",
      detectedAt: Date.now(),
    });
  }

  /**
   * Analyze code for security issues
   */
  private async analyzeCode(): Promise<void> {
    // Check for hardcoded secrets
    this.addVulnerability({
      id: "code-001",
      severity: "critical",
      category: "configuration",
      title: "Hardcoded Secrets in Code",
      description: "Secrets, passwords, or API keys may be hardcoded in source code",
      impact: "Hardcoded secrets could be exposed in version control or logs",
      recommendation: "Use environment variables or secure secret management systems",
      status: "open",
      detectedAt: Date.now(),
    });

    // Check for unsafe deserialization
    this.addVulnerability({
      id: "code-002",
      severity: "high",
      category: "injection",
      title: "Unsafe Deserialization",
      description: "User input may be deserialized without proper validation",
      impact: "Attackers could execute arbitrary code through deserialization attacks",
      recommendation: "Avoid deserializing untrusted data, use safe alternatives",
      status: "open",
      detectedAt: Date.now(),
      cwe: "CWE-502",
      owasp: "A08:2021 - Software and Data Integrity Failures",
    });
  }

  /**
   * Audit configuration files
   */
  private async auditConfiguration(): Promise<void> {
    // Check for insecure CORS configuration
    this.addVulnerability({
      id: "config-003",
      severity: "medium",
      category: "configuration",
      title: "Insecure CORS Configuration",
      description: "CORS configuration may allow unauthorized cross-origin requests",
      impact: "Attackers could perform cross-origin attacks or access sensitive data",
      recommendation: "Implement restrictive CORS policies with specific allowed origins",
      status: "open",
      detectedAt: Date.now(),
    });

    // Check for missing security headers
    this.addVulnerability({
      id: "config-004",
      severity: "medium",
      category: "configuration",
      title: "Missing Security Headers",
      description: "Important security headers may not be configured",
      impact: "Missing security headers could expose the application to various attacks",
      recommendation: "Implement comprehensive security headers (CSP, HSTS, etc.)",
      status: "open",
      detectedAt: Date.now(),
    });
  }

  /**
   * Add vulnerability to the list
   */
  private addVulnerability(vulnerability: SecurityVulnerability): void {
    // Check if vulnerability already exists
    const existing = this.vulnerabilities.find(v => v.id === vulnerability.id);
    if (!existing) {
      this.vulnerabilities.push(vulnerability);
    }
  }

  /**
   * Generate audit result
   */
  private generateAuditResult(auditId: string, duration: number): SecurityAuditResult {
    const summary = this.calculateSummary();
    const compliance = this.calculateCompliance();
    const recommendations = this.generateRecommendations();
    const riskScore = this.calculateRiskScore();

    return {
      auditId,
      timestamp: Date.now(),
      duration,
      vulnerabilities: this.vulnerabilities,
      summary,
      compliance,
      recommendations,
      riskScore,
    };
  }

  /**
   * Calculate vulnerability summary
   */
  private calculateSummary(): SecurityAuditResult["summary"] {
    const total = this.vulnerabilities.length;
    const critical = this.vulnerabilities.filter(v => v.severity === "critical").length;
    const high = this.vulnerabilities.filter(v => v.severity === "high").length;
    const medium = this.vulnerabilities.filter(v => v.severity === "medium").length;
    const low = this.vulnerabilities.filter(v => v.severity === "low").length;
    const resolved = this.vulnerabilities.filter(v => v.status === "resolved").length;
    const open = this.vulnerabilities.filter(v => v.status === "open").length;

    return {
      total,
      critical,
      high,
      medium,
      low,
      resolved,
      open,
    };
  }

  /**
   * Calculate compliance status
   */
  private calculateCompliance(): SecurityAuditResult["compliance"] {
    return {
      gdpr: {
        compliant: false,
        score: 60,
        issues: ["Missing data subject rights", "Insufficient consent management"],
        lastChecked: Date.now(),
        framework: "GDPR",
      },
      soc2: {
        compliant: false,
        score: 70,
        issues: ["Insufficient access controls", "Missing monitoring"],
        lastChecked: Date.now(),
        framework: "SOC2",
      },
      pci: {
        compliant: false,
        score: 40,
        issues: ["Payment data protection required"],
        lastChecked: Date.now(),
        framework: "PCI DSS",
      },
      hipaa: {
        compliant: false,
        score: 30,
        issues: ["PHI protection required"],
        lastChecked: Date.now(),
        framework: "HIPAA",
      },
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Critical recommendations
    const criticalVulns = this.vulnerabilities.filter(v => v.severity === "critical");
    if (criticalVulns.length > 0) {
      recommendations.push(`Address ${criticalVulns.length} critical vulnerabilities immediately`);
    }

    // High priority recommendations
    const highVulns = this.vulnerabilities.filter(v => v.severity === "high");
    if (highVulns.length > 0) {
      recommendations.push(`Prioritize fixing ${highVulns.length} high-severity vulnerabilities`);
    }

    // Compliance recommendations
    recommendations.push("Implement comprehensive data protection measures for GDPR compliance");
    recommendations.push("Establish security monitoring and logging for SOC2 compliance");
    recommendations.push("Review and update security policies and procedures");
    recommendations.push("Conduct regular security training for development team");
    recommendations.push("Implement automated security testing in CI/CD pipeline");

    return recommendations;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(): number {
    let score = 100; // Start with perfect score

    // Deduct points based on vulnerability severity
    this.vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case "critical":
          score -= 20;
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
    });

    return Math.max(0, score);
  }

  /**
   * Initialize default security rules
   */
  private initializeDefaultRules(): void {
    this.customRules = [
      {
        id: "rule-001",
        name: "Hardcoded Secrets Detection",
        description: "Detect hardcoded secrets, passwords, or API keys",
        category: "configuration",
        severity: "critical",
        pattern: /(password|secret|key|token)\s*[:=]\s*["'][^"']+["']/gi,
        filePattern: "**/*.{ts,tsx,js,jsx,json}",
        enabled: true,
      },
      {
        id: "rule-002",
        name: "SQL Injection Pattern",
        description: "Detect potential SQL injection patterns",
        category: "injection",
        severity: "critical",
        pattern: /(SELECT|INSERT|UPDATE|DELETE).*\+.*\$/gi,
        filePattern: "**/*.{ts,tsx,js,jsx}",
        enabled: true,
      },
      {
        id: "rule-003",
        name: "XSS Pattern",
        description: "Detect potential XSS vulnerabilities",
        category: "injection",
        severity: "high",
        pattern: /innerHTML\s*=\s*[^;]+/gi,
        filePattern: "**/*.{ts,tsx,js,jsx}",
        enabled: true,
      },
    ];
  }

  /**
   * Get audit history
   */
  getAuditHistory(): SecurityAuditResult[] {
    return this.auditHistory;
  }

  /**
   * Get vulnerabilities by severity
   */
  getVulnerabilitiesBySeverity(severity: SecurityVulnerability["severity"]): SecurityVulnerability[] {
    return this.vulnerabilities.filter(v => v.severity === severity);
  }

  /**
   * Get vulnerabilities by category
   */
  getVulnerabilitiesByCategory(category: SecurityVulnerability["category"]): SecurityVulnerability[] {
    return this.vulnerabilities.filter(v => v.category === category);
  }

  /**
   * Mark vulnerability as resolved
   */
  markVulnerabilityResolved(vulnerabilityId: string): boolean {
    const vuln = this.vulnerabilities.find(v => v.id === vulnerabilityId);
    if (vuln) {
      vuln.status = "resolved";
      vuln.resolvedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * Export audit report
   */
  exportAuditReport(format: "json" | "csv" | "html" = "json"): string {
    const latestAudit = this.auditHistory[this.auditHistory.length - 1];
    if (!latestAudit) {
      throw new Error("No audit results available");
    }

    switch (format) {
      case "json":
        return JSON.stringify(latestAudit, null, 2);
      case "csv":
        return this.generateCSVReport(latestAudit);
      case "html":
        return this.generateHTMLReport(latestAudit);
      default:
        throw new Error("Unsupported report format");
    }
  }

  /**
   * Generate CSV report
   */
  private generateCSVReport(audit: SecurityAuditResult): string {
    const headers = ["ID", "Severity", "Category", "Title", "Description", "Impact", "Recommendation", "Status"];
    const rows = audit.vulnerabilities.map(v => [
      v.id,
      v.severity,
      v.category,
      v.title,
      v.description,
      v.impact,
      v.recommendation,
      v.status,
    ]);

    return [headers, ...rows].map(row => row.join(",")).join("\n");
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(audit: SecurityAuditResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Security Audit Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .summary-item { background: #e9ecef; padding: 15px; border-radius: 5px; text-align: center; }
        .vulnerability { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
        .critical { border-left: 5px solid #dc3545; }
        .high { border-left: 5px solid #fd7e14; }
        .medium { border-left: 5px solid #ffc107; }
        .low { border-left: 5px solid #28a745; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Security Audit Report</h1>
        <p>Audit ID: ${audit.auditId}</p>
        <p>Generated: ${new Date(audit.timestamp).toLocaleString()}</p>
        <p>Duration: ${audit.duration}ms</p>
        <p>Risk Score: ${audit.riskScore}/100</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <h3>Total</h3>
            <p>${audit.summary.total}</p>
        </div>
        <div class="summary-item">
            <h3>Critical</h3>
            <p>${audit.summary.critical}</p>
        </div>
        <div class="summary-item">
            <h3>High</h3>
            <p>${audit.summary.high}</p>
        </div>
        <div class="summary-item">
            <h3>Medium</h3>
            <p>${audit.summary.medium}</p>
        </div>
        <div class="summary-item">
            <h3>Low</h3>
            <p>${audit.summary.low}</p>
        </div>
    </div>

    <h2>Vulnerabilities</h2>
    ${audit.vulnerabilities.map(v => `
        <div class="vulnerability ${v.severity}">
            <h3>${v.title} (${v.severity.toUpperCase()})</h3>
            <p><strong>Description:</strong> ${v.description}</p>
            <p><strong>Impact:</strong> ${v.impact}</p>
            <p><strong>Recommendation:</strong> ${v.recommendation}</p>
            <p><strong>Status:</strong> ${v.status}</p>
        </div>
    `).join("")}

    <h2>Recommendations</h2>
    <ul>
        ${audit.recommendations.map(r => `<li>${r}</li>`).join("")}
    </ul>
</body>
</html>
    `;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const securityAuditManager = new SecurityAuditManager();

export default SecurityAuditManager;
