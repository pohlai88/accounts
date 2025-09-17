/**
 * Comprehensive Security Integration Middleware
 *
 * Integrates all security components including audit, monitoring, compliance,
 * and disaster recovery into a unified security system.
 */

import { NextRequest, NextResponse } from "next/server";
import { monitoring } from "@aibos/monitoring";
import {
    AdvancedSecurityManager,
    SecurityAuditManager,
    DisasterRecoveryManager,
    ComplianceManager
} from "@aibos/security";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SecurityContext {
    requestId: string;
    traceId: string;
    spanId: string;
    tenantId?: string;
    userId?: string;
    ipAddress: string;
    userAgent: string;
    timestamp: number;
    endpoint: string;
    method: string;
    headers: Record<string, string>;
    body?: unknown;
    response?: {
        status: number;
        size: number;
        duration: number;
    };
}

export interface SecurityViolation {
    type: "rate_limit" | "csrf_attack" | "xss_attempt" | "suspicious_activity" | "injection_attempt" | "unauthorized_access";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    context: SecurityContext;
    timestamp: number;
    blocked: boolean;
    remediation?: string;
}

export interface SecurityMetrics {
    totalRequests: number;
    blockedRequests: number;
    securityViolations: number;
    averageResponseTime: number;
    topViolations: Array<{ type: string; count: number }>;
    topAttackingIPs: Array<{ ip: string; count: number }>;
    complianceScore: number;
    lastAuditDate: Date;
    nextAuditDate: Date;
}

// ============================================================================
// SECURITY INTEGRATION MANAGER
// ============================================================================

export class SecurityIntegrationManager {
    private securityManager: AdvancedSecurityManager;
    private auditManager: SecurityAuditManager;
    private disasterRecoveryManager: DisasterRecoveryManager;
    private complianceManager: ComplianceManager;
    private violations: SecurityViolation[] = [];
    private metrics: SecurityMetrics;
    private isInitialized = false;

    constructor() {
        this.securityManager = new AdvancedSecurityManager();
        this.auditManager = new SecurityAuditManager();
        this.disasterRecoveryManager = new DisasterRecoveryManager();
        this.complianceManager = new ComplianceManager();

        this.metrics = {
            totalRequests: 0,
            blockedRequests: 0,
            securityViolations: 0,
            averageResponseTime: 0,
            topViolations: [],
            topAttackingIPs: [],
            complianceScore: 0,
            lastAuditDate: new Date(),
            nextAuditDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        };

        this.initializeSecuritySystem();
    }

    /**
     * Initialize security system
     */
    private async initializeSecuritySystem(): Promise<void> {
        try {
            // Initialize monitoring
            await monitoring.initialize();

            // Run initial security audit
            await this.runSecurityAudit();

            // Set up automated compliance monitoring
            this.setupComplianceMonitoring();

            // Set up automated backup schedule
            this.setupBackupSchedule();

            this.isInitialized = true;
            monitoring.info("Security integration system initialized");
        } catch (error) {
            monitoring.error("Failed to initialize security system", error instanceof Error ? error : new Error(String(error)));
            throw error;
        }
    }

    /**
     * Process request through security pipeline
     */
    async processRequest(req: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>): Promise<NextResponse> {
        const startTime = Date.now();
        const securityContext = this.createSecurityContext(req);

        try {
            // Update metrics
            this.metrics.totalRequests++;

            // Apply security checks
            const securityResult = await this.applySecurityChecks(req, securityContext);
            if (securityResult.blocked && securityResult.violation) {
                this.metrics.blockedRequests++;
                this.recordSecurityViolation(securityResult.violation);
                return this.createSecurityResponse(securityResult.violation);
            }

            // Process request
            const response = await handler(req);

            // Record response metrics
            const duration = Date.now() - startTime;
            securityContext.response = {
                status: response.status,
                size: parseInt(response.headers.get("content-length") || "0"),
                duration,
            };

            // Update metrics
            this.updateResponseMetrics(duration);

            // Log security event
            this.logSecurityEvent(securityContext, "request_processed");

            return response;
        } catch (error) {
            // Record error
            this.logSecurityEvent(securityContext, "request_error", error);

            // Check if error is security-related
            if (this.isSecurityError(error)) {
                this.recordSecurityViolation({
                    type: "unauthorized_access",
                    severity: "high",
                    description: "Security-related error occurred",
                    context: securityContext,
                    timestamp: Date.now(),
                    blocked: false,
                });
            }

            throw error;
        }
    }

    /**
     * Apply comprehensive security checks
     */
    private async applySecurityChecks(req: NextRequest, context: SecurityContext): Promise<{
        blocked: boolean;
        violation?: SecurityViolation;
    }> {
        try {
            // Rate limiting
            const rateLimitResult = await this.securityManager.checkRateLimit(context.ipAddress, context.endpoint);
            if (rateLimitResult.blocked) {
                return {
                    blocked: true,
                    violation: {
                        type: "rate_limit",
                        severity: "medium",
                        description: "Rate limit exceeded",
                        context,
                        timestamp: Date.now(),
                        blocked: true,
                        remediation: "Wait before making additional requests",
                    },
                };
            }

            // CSRF protection
            if (this.isStateChangingMethod(context.method)) {
                const csrfResult = await this.securityManager.validateCSRFToken(req);
                if (!csrfResult.valid) {
                    return {
                        blocked: true,
                        violation: {
                            type: "csrf_attack",
                            severity: "high",
                            description: "CSRF token validation failed",
                            context,
                            timestamp: Date.now(),
                            blocked: true,
                            remediation: "Include valid CSRF token in request",
                        },
                    };
                }
            }

            // XSS detection
            const xssResult = this.securityManager.detectXSSAttempt(req);
            if (xssResult.detected) {
                return {
                    blocked: true,
                    violation: {
                        type: "xss_attempt",
                        severity: "high",
                        description: "XSS attack attempt detected",
                        context,
                        timestamp: Date.now(),
                        blocked: true,
                        remediation: "Remove malicious scripts from request",
                    },
                };
            }

            // Suspicious activity detection
            const suspiciousResult = this.securityManager.detectSuspiciousActivity(req, context.ipAddress);
            if (suspiciousResult.detected) {
                return {
                    blocked: suspiciousResult.severity === "critical",
                    violation: {
                        type: "suspicious_activity",
                        severity: suspiciousResult.severity,
                        description: suspiciousResult.reason || "Suspicious activity detected",
                        context,
                        timestamp: Date.now(),
                        blocked: suspiciousResult.severity === "critical",
                        remediation: "Review request patterns and user behavior",
                    },
                };
            }

            return { blocked: false };
        } catch (error) {
            monitoring.error("Security check failed", error instanceof Error ? error : new Error(String(error)), { context });
            return { blocked: false };
        }
    }

    /**
     * Create security context from request
     */
    private createSecurityContext(req: NextRequest): SecurityContext {
        return {
            requestId: req.headers.get("x-request-id") || this.generateRequestId(),
            traceId: req.headers.get("x-trace-id") || this.generateTraceId(),
            spanId: req.headers.get("x-span-id") || this.generateSpanId(),
            tenantId: req.headers.get("x-tenant-id") || undefined,
            userId: req.headers.get("x-user-id") || undefined,
            ipAddress: this.getClientIP(req),
            userAgent: req.headers.get("user-agent") || "",
            timestamp: Date.now(),
            endpoint: req.nextUrl.pathname,
            method: req.method,
            headers: this.convertHeadersToObject(req.headers),
            body: req.body,
        };
    }

    /**
     * Record security violation
     */
    private recordSecurityViolation(violation: SecurityViolation): void {
        this.violations.push(violation);
        this.metrics.securityViolations++;

        // Keep only recent violations
        if (this.violations.length > 1000) {
            this.violations = this.violations.slice(-1000);
        }

        // Log to monitoring
        monitoring.warn("Security violation detected", {
            type: violation.type,
            severity: violation.severity,
            description: violation.description,
            context: violation.context,
            blocked: violation.blocked,
        });

        // Emit event for real-time monitoring
        monitoring.emit("securityViolation", violation);
    }

    /**
     * Log security event
     */
    private logSecurityEvent(context: SecurityContext, eventType: string, error?: unknown): void {
        monitoring.info("Security event", {
            eventType,
            context,
            error: error instanceof Error ? error.message : undefined,
        });
    }

    /**
     * Update response metrics
     */
    private updateResponseMetrics(duration: number): void {
        // Update average response time
        const totalRequests = this.metrics.totalRequests;
        this.metrics.averageResponseTime =
            (this.metrics.averageResponseTime * (totalRequests - 1) + duration) / totalRequests;
    }

    /**
     * Check if method is state-changing
     */
    private isStateChangingMethod(method: string): boolean {
        return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    }

    /**
     * Check if error is security-related
     */
    private isSecurityError(error: unknown): boolean {
        if (error instanceof Error) {
            const message = error.message.toLowerCase();
            return message.includes("unauthorized") ||
                message.includes("forbidden") ||
                message.includes("security") ||
                message.includes("access denied");
        }
        return false;
    }

    /**
     * Create security response
     */
    private createSecurityResponse(violation: SecurityViolation): NextResponse {
        const status = violation.severity === "critical" ? 403 : 429;

        return NextResponse.json(
            {
                success: false,
                error: {
                    type: "security_violation",
                    title: "Security Violation",
                    status,
                    code: violation.type.toUpperCase(),
                    detail: violation.description,
                    remediation: violation.remediation,
                },
                timestamp: new Date().toISOString(),
                requestId: violation.context.requestId,
            },
            {
                status,
                headers: {
                    "X-Security-Violation": violation.type,
                    "X-Security-Severity": violation.severity,
                    ...(violation.type === "rate_limit" && { "Retry-After": "60" }),
                },
            }
        );
    }

    /**
     * Run security audit
     */
    async runSecurityAudit(): Promise<void> {
        try {
            monitoring.info("Starting security audit");

            const auditResult = await this.auditManager.runSecurityAudit();

            this.metrics.lastAuditDate = new Date(auditResult.timestamp);
            this.metrics.nextAuditDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

            // Update compliance score
            const complianceStatus = this.complianceManager.getComplianceStatus("gdpr");
            this.metrics.complianceScore = complianceStatus.overallScore;

            monitoring.info("Security audit completed", {
                vulnerabilities: auditResult.summary.total,
                riskScore: auditResult.riskScore,
                complianceScore: this.metrics.complianceScore,
            });
        } catch (error) {
            monitoring.error("Security audit failed", error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Setup compliance monitoring
     */
    private setupComplianceMonitoring(): void {
        // Run compliance check every 24 hours
        setInterval(async () => {
            try {
                const dashboard = this.complianceManager.getComplianceDashboard();

                // Check for overdue data subject requests
                if (dashboard.dataSubjectRequests.overdue > 0) {
                    monitoring.warn("Overdue data subject requests", {
                        count: dashboard.dataSubjectRequests.overdue,
                    });
                }

                // Check for open data breach incidents
                if (dashboard.dataBreachIncidents.open > 0) {
                    monitoring.error("Open data breach incidents", new Error(`Open data breach incidents: ${dashboard.dataBreachIncidents.open} open, ${dashboard.dataBreachIncidents.critical} critical`));
                }

                // Check compliance scores
                dashboard.frameworks.forEach(framework => {
                    if (framework.overallScore < 75) {
                        monitoring.warn("Low compliance score", {
                            framework: framework.name,
                            score: framework.overallScore,
                        });
                    }
                });
            } catch (error) {
                monitoring.error("Compliance monitoring failed", error instanceof Error ? error : new Error(String(error)));
            }
        }, 24 * 60 * 60 * 1000); // 24 hours
    }

    /**
     * Setup backup schedule
     */
    private setupBackupSchedule(): void {
        // Run backup every 24 hours at 2 AM
        const now = new Date();
        const nextBackup = new Date(now);
        nextBackup.setHours(2, 0, 0, 0);
        if (nextBackup <= now) {
            nextBackup.setDate(nextBackup.getDate() + 1);
        }

        const timeUntilBackup = nextBackup.getTime() - now.getTime();

        setTimeout(() => {
            this.runScheduledBackup();

            // Set up recurring backup
            setInterval(() => {
                this.runScheduledBackup();
            }, 24 * 60 * 60 * 1000); // 24 hours
        }, timeUntilBackup);
    }

    /**
     * Run scheduled backup
     */
    private async runScheduledBackup(): Promise<void> {
        try {
            monitoring.info("Starting scheduled backup");

            const backupResult = await this.disasterRecoveryManager.createBackup();

            if (backupResult.success) {
                monitoring.info("Scheduled backup completed", {
                    backupId: backupResult.backupId,
                    size: backupResult.size,
                    duration: backupResult.duration,
                });
            } else {
                monitoring.error("Scheduled backup failed", new Error(`Backup failed: ${JSON.stringify(backupResult.errors)}`));
            }
        } catch (error) {
            monitoring.error("Scheduled backup error", error instanceof Error ? error : new Error(String(error)));
        }
    }

    /**
     * Get security metrics
     */
    getSecurityMetrics(): SecurityMetrics {
        // Update top violations
        const violationCounts = this.violations.reduce((acc, v) => {
            acc[v.type] = (acc[v.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        this.metrics.topViolations = Object.entries(violationCounts)
            .map(([type, count]) => ({ type, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Update top attacking IPs
        const ipCounts = this.violations.reduce((acc, v) => {
            acc[v.context.ipAddress] = (acc[v.context.ipAddress] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        this.metrics.topAttackingIPs = Object.entries(ipCounts)
            .map(([ip, count]) => ({ ip, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return { ...this.metrics };
    }

    /**
     * Get security violations
     */
    getSecurityViolations(filters?: {
        type?: SecurityViolation["type"];
        severity?: SecurityViolation["severity"];
        dateRange?: { start: Date; end: Date };
    }): SecurityViolation[] {
        let violations = [...this.violations];

        if (filters) {
            if (filters.type) {
                violations = violations.filter(v => v.type === filters.type);
            }
            if (filters.severity) {
                violations = violations.filter(v => v.severity === filters.severity);
            }
            if (filters.dateRange) {
                violations = violations.filter(v =>
                    v.timestamp >= filters.dateRange!.start.getTime() &&
                    v.timestamp <= filters.dateRange!.end.getTime()
                );
            }
        }

        return violations.sort((a, b) => b.timestamp - a.timestamp);
    }

    /**
     * Generate request ID
     */
    private generateRequestId(): string {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate trace ID
     */
    private generateTraceId(): string {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate span ID
     */
    private generateSpanId(): string {
        return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Convert headers to object
     */
    private convertHeadersToObject(headers: Headers): Record<string, string> {
        const result: Record<string, string> = {};
        headers.forEach((value, key) => {
            result[key] = value;
        });
        return result;
    }

    /**
     * Get client IP address
     */
    private getClientIP(req: NextRequest): string {
        const forwarded = req.headers.get("x-forwarded-for");
        if (forwarded) {
            return forwarded.split(",")[0]?.trim() || "unknown";
        }

        const realIP = req.headers.get("x-real-ip");
        if (realIP) {
            return realIP;
        }

        return "unknown";
    }

    /**
     * Check if system is initialized
     */
    isReady(): boolean {
        return this.isInitialized;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const securityIntegration = new SecurityIntegrationManager();

export default SecurityIntegrationManager;
