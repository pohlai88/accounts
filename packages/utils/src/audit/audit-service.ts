// Audit Service - V1 Compliance
import { createClient } from '@supabase/supabase-js';

export interface AuditContext {
    userId?: string;
    tenantId?: string;
    companyId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
}

export interface AuditEvent {
    id?: string;
    eventType: string;
    entityType: string;
    entityId?: string;
    action: string;
    details: Record<string, unknown>;
    context: AuditContext;
    createdAt: Date;
}

export class AuditService {
    private supabase: any;

    constructor() {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    /**
     * Log report generation events
     */
    async logReportGeneration(
        context: AuditContext,
        reportType: string,
        parameters: Record<string, unknown>,
        result: Record<string, unknown>
    ): Promise<void> {
        try {
            const event: AuditEvent = {
                eventType: 'REPORT_GENERATION',
                entityType: 'FINANCIAL_REPORT',
                entityId: `${reportType}_${context.tenantId}_${context.companyId}`,
                action: 'GENERATE',
                details: {
                    reportType,
                    parameters,
                    result,
                    success: result.success || false,
                    generationTime: result.generationTime || null
                },
                context,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log report generation:', error);
        }
    }

    /**
     * Log security violations
     */
    async logSecurityViolation(
        context: AuditContext,
        violationType: string,
        details: Record<string, unknown>
    ): Promise<void> {
        try {
            const event: AuditEvent = {
                eventType: 'SECURITY_VIOLATION',
                entityType: 'ACCESS_CONTROL',
                action: 'DENY',
                details: {
                    violationType,
                    ...details,
                    severity: 'HIGH'
                },
                context,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log security violation:', error);
        }
    }

    /**
     * Log period management operations
     */
    async logPeriodOperation(
        context: AuditContext,
        operation: string,
        periodId: string,
        details: Record<string, unknown>
    ): Promise<void> {
        try {
            const event: AuditEvent = {
                eventType: 'PERIOD_MANAGEMENT',
                entityType: 'FISCAL_PERIOD',
                entityId: periodId,
                action: operation,
                details,
                context,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log period operation:', error);
        }
    }

    /**
     * Log journal posting operations
     */
    async logJournalPosting(
        context: AuditContext,
        journalId: string,
        operation: string,
        details: Record<string, unknown>
    ): Promise<void> {
        try {
            const event: AuditEvent = {
                eventType: 'JOURNAL_POSTING',
                entityType: 'GL_JOURNAL',
                entityId: journalId,
                action: operation,
                details,
                context,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log journal posting:', error);
        }
    }

    /**
     * Log general errors
     */
    async logError(
        context: AuditContext,
        errorType: string,
        details: Record<string, unknown>
    ): Promise<void> {
        try {
            const event: AuditEvent = {
                eventType: 'ERROR',
                entityType: 'SYSTEM',
                action: 'ERROR_OCCURRED',
                details: {
                    errorType,
                    ...details,
                    severity: 'ERROR'
                },
                context,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log error:', error);
        }
    }

    /**
     * Log user authentication events
     */
    async logAuthentication(
        context: AuditContext,
        action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED',
        details: Record<string, unknown>
    ): Promise<void> {
        try {
            const event: AuditEvent = {
                eventType: 'AUTHENTICATION',
                entityType: 'USER_SESSION',
                entityId: context.userId,
                action,
                details,
                context,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log authentication:', error);
        }
    }

    /**
     * Log SoD compliance checks
     */
    async logSoDCompliance(
        scope: any,
        operation: string,
        result: string,
        details?: string,
        context?: AuditContext
    ): Promise<void> {
        try {
            const auditContext = context || {
                userId: scope.userId,
                tenantId: scope.tenantId,
                companyId: scope.companyId,
                sessionId: scope.sessionId,
                ipAddress: undefined,
                userAgent: undefined,
                timestamp: new Date()
            };

            const event: AuditEvent = {
                eventType: 'SOD_COMPLIANCE',
                entityType: 'ACCESS_CONTROL',
                action: operation,
                details: {
                    result,
                    details,
                    userRole: scope.userRole,
                    operation
                },
                context: auditContext,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log SoD compliance:', error);
        }
    }

    /**
     * Log Chart of Accounts validation
     */
    async logCOAValidation(
        scope: any,
        accountIds: string[],
        result: string,
        warnings?: string[],
        context?: AuditContext
    ): Promise<void> {
        try {
            const auditContext = context || {
                userId: scope.userId,
                tenantId: scope.tenantId,
                companyId: scope.companyId,
                sessionId: scope.sessionId,
                ipAddress: undefined,
                userAgent: undefined,
                timestamp: new Date()
            };

            const event: AuditEvent = {
                eventType: 'COA_VALIDATION',
                entityType: 'CHART_OF_ACCOUNTS',
                action: 'VALIDATE',
                details: {
                    result,
                    accountIds,
                    warnings: warnings || [],
                    accountCount: accountIds.length
                },
                context: auditContext,
                createdAt: new Date()
            };

            await this.storeAuditEvent(event);
        } catch (error) {
            console.error('Failed to log COA validation:', error);
        }
    }

    /**
     * Store audit event in database
     */
    private async storeAuditEvent(event: AuditEvent): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('audit_log')
                .insert({
                    event_type: event.eventType,
                    entity_type: event.entityType,
                    entity_id: event.entityId,
                    action: event.action,
                    details: event.details,
                    user_id: event.context.userId,
                    tenant_id: event.context.tenantId,
                    company_id: event.context.companyId,
                    session_id: event.context.sessionId,
                    ip_address: event.context.ipAddress,
                    user_agent: event.context.userAgent,
                    created_at: event.createdAt.toISOString()
                });

            if (error) {
                console.error('Failed to store audit event:', error);
            }
        } catch (error) {
            console.error('Failed to store audit event:', error);
        }
    }

    /**
     * Query audit events
     */
    async queryAuditEvents(
        filters: {
            tenantId?: string;
            companyId?: string;
            userId?: string;
            eventType?: string;
            entityType?: string;
            startDate?: Date;
            endDate?: Date;
            limit?: number;
        }
    ): Promise<AuditEvent[]> {
        try {
            let query = this.supabase
                .from('audit_log')
                .select('*')
                .order('created_at', { ascending: false });

            if (filters.tenantId) {
                query = query.eq('tenant_id', filters.tenantId);
            }
            if (filters.companyId) {
                query = query.eq('company_id', filters.companyId);
            }
            if (filters.userId) {
                query = query.eq('user_id', filters.userId);
            }
            if (filters.eventType) {
                query = query.eq('event_type', filters.eventType);
            }
            if (filters.entityType) {
                query = query.eq('entity_type', filters.entityType);
            }
            if (filters.startDate) {
                query = query.gte('created_at', filters.startDate.toISOString());
            }
            if (filters.endDate) {
                query = query.lte('created_at', filters.endDate.toISOString());
            }
            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Failed to query audit events:', error);
                return [];
            }

            return data.map((row: any) => ({
                id: row.id,
                eventType: row.event_type,
                entityType: row.entity_type,
                entityId: row.entity_id,
                action: row.action,
                details: row.details,
                context: {
                    userId: row.user_id,
                    tenantId: row.tenant_id,
                    companyId: row.company_id,
                    sessionId: row.session_id,
                    ipAddress: row.ip_address,
                    userAgent: row.user_agent,
                    timestamp: new Date(row.created_at)
                },
                createdAt: new Date(row.created_at)
            }));

        } catch (error) {
            console.error('Failed to query audit events:', error);
            return [];
        }
    }
}

// Singleton instance
let auditServiceInstance: AuditService | null = null;

export function getAuditService(): AuditService {
    if (!auditServiceInstance) {
        auditServiceInstance = new AuditService();
    }
    return auditServiceInstance;
}
