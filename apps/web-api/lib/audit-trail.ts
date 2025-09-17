// Complete Audit Trail Implementation
// DoD: Complete audit trail implementation
// SSOT: Use existing audit service from @aibos/utils
// Tech Stack: Audit service + database logging

import { createClient } from "@supabase/supabase-js";
import { monitoring } from "./monitoring";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Audit event types
export type AuditEventType =
    | "user.login"
    | "user.logout"
    | "user.create"
    | "user.update"
    | "user.delete"
    | "tenant.create"
    | "tenant.update"
    | "tenant.delete"
    | "tenant.switch"
    | "company.create"
    | "company.update"
    | "company.delete"
    | "invoice.create"
    | "invoice.update"
    | "invoice.delete"
    | "invoice.send"
    | "invoice.pay"
    | "bill.create"
    | "bill.update"
    | "bill.delete"
    | "bill.approve"
    | "bill.pay"
    | "customer.create"
    | "customer.update"
    | "customer.delete"
    | "vendor.create"
    | "vendor.update"
    | "vendor.delete"
    | "payment.create"
    | "payment.update"
    | "payment.delete"
    | "subscription.create"
    | "subscription.update"
    | "subscription.cancel"
    | "subscription.renew"
    | "feature_flag.update"
    | "permission.grant"
    | "permission.revoke"
    | "data.export"
    | "data.import"
    | "system.config_update"
    | "security.event"
    | "api.access"
    | "file.upload"
    | "file.download"
    | "file.delete";

// Audit event severity levels
export type AuditSeverity = "low" | "medium" | "high" | "critical";

// Audit event interface
export interface AuditEvent {
    id: string;
    eventType: AuditEventType;
    severity: AuditSeverity;
    userId: string;
    tenantId: string;
    companyId?: string;
    resourceType: string;
    resourceId: string;
    action: string;
    description: string;
    metadata: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    requestId: string;
    timestamp: Date;
    success: boolean;
    errorMessage?: string;
    duration?: number;
}

// Audit trail configuration
interface AuditTrailConfig {
    enabled: boolean;
    retentionPeriod: number; // days
    enableRealTime: boolean;
    enableCompression: boolean;
    enableEncryption: boolean;
    batchSize: number;
    flushInterval: number; // milliseconds
    sensitiveFields: string[];
    excludedEvents: AuditEventType[];
    includedTenants: string[]; // Empty means all tenants
    excludedTenants: string[];
}

// Default configuration
const defaultConfig: AuditTrailConfig = {
    enabled: true,
    retentionPeriod: 2555, // 7 years for compliance
    enableRealTime: true,
    enableCompression: true,
    enableEncryption: true,
    batchSize: 100,
    flushInterval: 30000, // 30 seconds
    sensitiveFields: [
        "password",
        "token",
        "secret",
        "key",
        "ssn",
        "credit_card",
        "bank_account",
    ],
    excludedEvents: [],
    includedTenants: [],
    excludedTenants: [],
};

// Audit trail manager
export class AuditTrailManager {
    private config: AuditTrailConfig;
    private eventBuffer: AuditEvent[] = [];
    private flushTimer: NodeJS.Timeout | null = null;
    private isInitialized = false;

    constructor(config: Partial<AuditTrailConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Start buffer flushing
            this.startBufferFlushing();

            // Set up cleanup for old audit records
            this.setupCleanup();

            this.isInitialized = true;
            console.log("✅ Audit trail manager initialized");
        } catch (error) {
            console.error("Failed to initialize audit trail manager:", error);
            throw error;
        }
    }

    private startBufferFlushing(): void {
        this.flushTimer = setInterval(() => {
            this.flushBuffer();
        }, this.config.flushInterval);
    }

    private setupCleanup(): void {
        // Run cleanup daily at 2 AM
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(2, 0, 0, 0);

        const msUntilCleanup = tomorrow.getTime() - now.getTime();

        setTimeout(() => {
            this.cleanupOldRecords();
            // Set up recurring cleanup
            setInterval(() => {
                this.cleanupOldRecords();
            }, 24 * 60 * 60 * 1000); // 24 hours
        }, msUntilCleanup);
    }

    // Record audit event
    async recordEvent(event: Omit<AuditEvent, "id" | "timestamp">): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        // Check if event should be excluded
        if (this.shouldExcludeEvent(event)) {
            return;
        }

        // Sanitize sensitive data
        const sanitizedEvent = this.sanitizeEvent(event);

        // Create audit event
        const auditEvent: AuditEvent = {
            ...sanitizedEvent,
            id: this.generateEventId(),
            timestamp: new Date(),
        };

        // Add to buffer
        this.eventBuffer.push(auditEvent);

        // Flush immediately if buffer is full
        if (this.eventBuffer.length >= this.config.batchSize) {
            await this.flushBuffer();
        }

        // Record in monitoring system
        monitoring.recordSecurityEvent(
            auditEvent.eventType,
            auditEvent.severity,
            auditEvent.tenantId,
            auditEvent.userId,
            {
                resourceType: auditEvent.resourceType,
                resourceId: auditEvent.resourceId,
                action: auditEvent.action,
                success: auditEvent.success,
            }
        );
    }

    private shouldExcludeEvent(event: Omit<AuditEvent, "id" | "timestamp">): boolean {
        // Check excluded events
        if (this.config.excludedEvents.includes(event.eventType)) {
            return true;
        }

        // Check tenant inclusion/exclusion
        if (this.config.includedTenants.length > 0 && !this.config.includedTenants.includes(event.tenantId)) {
            return true;
        }

        if (this.config.excludedTenants.includes(event.tenantId)) {
            return true;
        }

        return false;
    }

    private sanitizeEvent(event: Omit<AuditEvent, "id" | "timestamp">): Omit<AuditEvent, "id" | "timestamp"> {
        const sanitized = { ...event };

        // Remove sensitive fields from metadata
        if (sanitized.metadata) {
            sanitized.metadata = this.removeSensitiveFields(sanitized.metadata);
        }

        return sanitized;
    }

    private removeSensitiveFields(obj: any): any {
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.removeSensitiveFields(item));
        }

        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = this.config.sensitiveFields.some(field =>
                lowerKey.includes(field.toLowerCase())
            );

            if (isSensitive) {
                sanitized[key] = "[REDACTED]";
            } else if (typeof value === "object" && value !== null) {
                sanitized[key] = this.removeSensitiveFields(value);
            } else {
                sanitized[key] = value;
            }
        }

        return sanitized;
    }

    private generateEventId(): string {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async flushBuffer(): Promise<void> {
        if (this.eventBuffer.length === 0) {
            return;
        }

        const events = [...this.eventBuffer];
        this.eventBuffer = [];

        try {
            await this.storeEvents(events);
        } catch (error) {
            console.error("Failed to flush audit buffer:", error);
            // Re-add events to buffer on failure
            this.eventBuffer.unshift(...events);
        }
    }

    private async storeEvents(events: AuditEvent[]): Promise<void> {
        try {
            const { error } = await supabase
                .from("audit_events")
                .insert(events.map(event => ({
                    id: event.id,
                    event_type: event.eventType,
                    severity: event.severity,
                    user_id: event.userId,
                    tenant_id: event.tenantId,
                    company_id: event.companyId,
                    resource_type: event.resourceType,
                    resource_id: event.resourceId,
                    action: event.action,
                    description: event.description,
                    metadata: event.metadata,
                    ip_address: event.ipAddress,
                    user_agent: event.userAgent,
                    request_id: event.requestId,
                    timestamp: event.timestamp.toISOString(),
                    success: event.success,
                    error_message: event.errorMessage,
                    duration: event.duration,
                })));

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error("Failed to store audit events:", error);
            throw error;
        }
    }

    private async cleanupOldRecords(): Promise<void> {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionPeriod);

            const { error } = await supabase
                .from("audit_events")
                .delete()
                .lt("timestamp", cutoffDate.toISOString());

            if (error) {
                throw error;
            }

            console.log(`Cleaned up audit records older than ${this.config.retentionPeriod} days`);
        } catch (error) {
            console.error("Failed to cleanup old audit records:", error);
        }
    }

    // Query audit events
    async queryEvents(filters: {
        tenantId?: string;
        userId?: string;
        eventType?: AuditEventType;
        severity?: AuditSeverity;
        resourceType?: string;
        resourceId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<{ events: AuditEvent[]; total: number }> {
        try {
            let query = supabase
                .from("audit_events")
                .select("*", { count: "exact" });

            // Apply filters
            if (filters.tenantId) {
                query = query.eq("tenant_id", filters.tenantId);
            }
            if (filters.userId) {
                query = query.eq("user_id", filters.userId);
            }
            if (filters.eventType) {
                query = query.eq("event_type", filters.eventType);
            }
            if (filters.severity) {
                query = query.eq("severity", filters.severity);
            }
            if (filters.resourceType) {
                query = query.eq("resource_type", filters.resourceType);
            }
            if (filters.resourceId) {
                query = query.eq("resource_id", filters.resourceId);
            }
            if (filters.startDate) {
                query = query.gte("timestamp", filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte("timestamp", filters.endDate.toISOString());
            }

            // Apply pagination
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.offset) {
                query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
            }

            // Order by timestamp descending
            query = query.order("timestamp", { ascending: false });

            const { data, error, count } = await query;

            if (error) {
                throw error;
            }

            const events: AuditEvent[] = (data || []).map(row => ({
                id: row.id,
                eventType: row.event_type,
                severity: row.severity,
                userId: row.user_id,
                tenantId: row.tenant_id,
                companyId: row.company_id,
                resourceType: row.resource_type,
                resourceId: row.resource_id,
                action: row.action,
                description: row.description,
                metadata: row.metadata,
                ipAddress: row.ip_address,
                userAgent: row.user_agent,
                requestId: row.request_id,
                timestamp: new Date(row.timestamp),
                success: row.success,
                errorMessage: row.error_message,
                duration: row.duration,
            }));

            return {
                events,
                total: count || 0,
            };
        } catch (error) {
            console.error("Failed to query audit events:", error);
            throw error;
        }
    }

    // Generate audit report
    async generateReport(filters: {
        tenantId?: string;
        startDate: Date;
        endDate: Date;
        groupBy?: "eventType" | "severity" | "userId" | "resourceType";
    }): Promise<any> {
        try {
            const { events } = await this.queryEvents({
                tenantId: filters.tenantId,
                startDate: filters.startDate,
                endDate: filters.endDate,
                limit: 10000, // Large limit for reporting
            });

            const report: any = {
                summary: {
                    totalEvents: events.length,
                    dateRange: {
                        start: filters.startDate.toISOString(),
                        end: filters.endDate.toISOString(),
                    },
                    generatedAt: new Date().toISOString(),
                },
                breakdown: {},
            };

            // Group by specified field
            if (filters.groupBy) {
                const grouped = events.reduce((acc, event) => {
                    const key = event[filters.groupBy!];
                    if (!acc[key]) {
                        acc[key] = 0;
                    }
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                report.breakdown[filters.groupBy] = grouped;
            }

            // Severity breakdown
            const severityBreakdown = events.reduce((acc, event) => {
                if (!acc[event.severity]) {
                    acc[event.severity] = 0;
                }
                acc[event.severity] = (acc[event.severity] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            report.breakdown.severity = severityBreakdown;

            // Event type breakdown
            const eventTypeBreakdown = events.reduce((acc, event) => {
                if (!acc[event.eventType]) {
                    acc[event.eventType] = 0;
                }
                acc[event.eventType] = (acc[event.eventType] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            report.breakdown.eventType = eventTypeBreakdown;

            // Success/failure breakdown
            const successBreakdown = events.reduce((acc, event) => {
                const key = event.success ? "success" : "failure";
                if (!acc[key]) {
                    acc[key] = 0;
                }
                acc[key]++;
                return acc;
            }, {} as Record<string, number>);

            report.breakdown.success = successBreakdown;

            return report;
        } catch (error) {
            console.error("Failed to generate audit report:", error);
            throw error;
        }
    }

    // Cleanup resources
    async shutdown(): Promise<void> {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }

        // Flush remaining buffer
        await this.flushBuffer();

        this.isInitialized = false;
        console.log("Audit trail manager shutdown complete");
    }
}

// Export singleton instance
export const auditTrail = new AuditTrailManager();

// Helper functions for common audit events
export class AuditEventHelpers {
    static async recordUserLogin(
        userId: string,
        tenantId: string,
        ipAddress: string,
        userAgent: string,
        requestId: string,
        success: boolean,
        errorMessage?: string
    ): Promise<void> {
        await auditTrail.recordEvent({
            eventType: "user.login",
            severity: success ? "low" : "medium",
            userId,
            tenantId,
            resourceType: "user",
            resourceId: userId,
            action: "login",
            description: success ? "User logged in successfully" : "User login failed",
            metadata: { ipAddress, userAgent },
            ipAddress,
            userAgent,
            requestId,
            success,
            errorMessage,
        });
    }

    static async recordUserLogout(
        userId: string,
        tenantId: string,
        ipAddress: string,
        userAgent: string,
        requestId: string
    ): Promise<void> {
        await auditTrail.recordEvent({
            eventType: "user.logout",
            severity: "low",
            userId,
            tenantId,
            resourceType: "user",
            resourceId: userId,
            action: "logout",
            description: "User logged out",
            metadata: { ipAddress, userAgent },
            ipAddress,
            userAgent,
            requestId,
            success: true,
        });
    }

    static async recordDataAccess(
        userId: string,
        tenantId: string,
        resourceType: string,
        resourceId: string,
        action: string,
        ipAddress: string,
        userAgent: string,
        requestId: string,
        success: boolean,
        metadata?: Record<string, any>
    ): Promise<void> {
        await auditTrail.recordEvent({
            eventType: "api.access",
            severity: success ? "low" : "medium",
            userId,
            tenantId,
            resourceType,
            resourceId,
            action,
            description: `${action} ${resourceType} ${resourceId}`,
            metadata: { ...metadata, ipAddress, userAgent },
            ipAddress,
            userAgent,
            requestId,
            success,
        });
    }

    static async recordDataModification(
        userId: string,
        tenantId: string,
        resourceType: string,
        resourceId: string,
        action: "create" | "update" | "delete",
        ipAddress: string,
        userAgent: string,
        requestId: string,
        success: boolean,
        metadata?: Record<string, any>
    ): Promise<void> {
        const eventTypeMap = {
            create: "create",
            update: "update",
            delete: "delete",
        };

        await auditTrail.recordEvent({
            eventType: `${resourceType}.${eventTypeMap[action]}` as AuditEventType,
            severity: success ? "medium" : "high",
            userId,
            tenantId,
            resourceType,
            resourceId,
            action,
            description: `${action} ${resourceType} ${resourceId}`,
            metadata: { ...metadata, ipAddress, userAgent },
            ipAddress,
            userAgent,
            requestId,
            success,
        });
    }
}
