import { auditLogs, type Scope } from "@aibos/db";
import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

interface AuditLogDbRow {
  id: string;
  tenantId: string;
  companyId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  metadata?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Audit action types for business operations
export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "POST"
  | "REVERSE"
  | "APPROVE"
  | "REJECT"
  | "SUBMIT"
  | "CANCEL"
  | "VALIDATE"
  | "EXPORT"
  | "IMPORT"
  | "HIT"
  | "EXPIRE";

// Entity types for audit logging
export type AuditEntityType =
  | "JOURNAL"
  | "JOURNAL_LINE"
  | "INVOICE"
  | "PAYMENT"
  | "ACCOUNT"
  | "TENANT"
  | "COMPANY"
  | "USER"
  | "CUSTOMER"
  | "MEMBERSHIP"
  | "CURRENCY"
  | "FX_RATE"
  | "IDEMPOTENCY_KEY";

// Audit context for tracking request information
export interface AuditContext {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  source?: "API" | "UI" | "SYSTEM" | "BATCH" | "WEBHOOK";
  version?: string;
}

// Audit entry interface
export interface AuditEntry {
  scope: Scope;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  context?: AuditContext;
}

// Audit query filters
export interface AuditQueryFilters {
  entityType?: AuditEntityType;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
}

// Audit log result
export interface AuditLogResult {
  id: string;
  tenantId: string;
  companyId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Database interface for audit operations
 */
export interface AuditDatabase {
  insert: (table: unknown) => {
    values: (values: unknown) => Promise<unknown>;
  };
  select: () => {
    from: (table: unknown) => {
      where: (condition: unknown) => {
        orderBy: (order: unknown) => {
          limit: (limit: number) => {
            offset: (offset: number) => Promise<unknown[]>;
          };
        };
      };
    };
  };
}

/**
 * Audit Service for comprehensive business operation logging
 * Provides application-level audit trail beyond database triggers
 */
export class AuditService {
  private db: AuditDatabase;

  constructor(database?: AuditDatabase) {
    if (database) {
      this.db = database;
    } else {
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is required for audit service");
      }
      const pool = new Pool({ connectionString });
      this.db = drizzle(pool) as unknown as AuditDatabase;
    }
  }

  /**
   * Log a business operation for audit trail
   */
  async logOperation(entry: AuditEntry): Promise<void> {
    try {
      await this.db.insert(auditLogs).values({
        tenantId: entry.scope.tenantId,
        companyId: entry.scope.companyId,
        userId: entry.scope.userId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        metadata: entry.metadata
          ? JSON.stringify({
              ...entry.metadata,
              context: entry.context,
            })
          : entry.context
            ? JSON.stringify({ context: entry.context })
            : null,
        requestId: entry.context?.requestId,
        ipAddress: entry.context?.ipAddress,
        userAgent: entry.context?.userAgent,
      });
    } catch (error) {
      // Log audit failures but don't fail the main operation
      console.error("Audit logging failed:", error);
      // In production, you might want to send this to a monitoring service
    }
  }

  /**
   * Log journal posting operation with comprehensive details
   */
  async logJournalPosting(
    scope: Scope,
    journalId: string,
    journalData: Record<string, unknown>,
    action: "CREATE" | "POST" | "REVERSE" | "APPROVE",
    context?: AuditContext,
    oldValues?: Record<string, unknown>,
  ): Promise<void> {
    await this.logOperation({
      scope,
      action,
      entityType: "JOURNAL",
      entityId: journalId,
      oldValues,
      newValues: journalData,
      metadata: {
        operation: "journal_posting",
        journalNumber: journalData.journalNumber,
        currency: journalData.currency,
        totalDebit: journalData.totalDebit,
        totalCredit: journalData.totalCredit,
        lineCount: Array.isArray(journalData.lines) ? journalData.lines.length : 0,
        requiresApproval: journalData.requiresApproval,
        status: journalData.status,
      },
      context,
    });
  }

  /**
   * Log COA validation events
   */
  async logCOAValidation(
    scope: Scope,
    accountIds: string[],
    validationResult: "SUCCESS" | "FAILURE",
    warnings: Array<{ accountId: string; warning: string }> = [],
    errors: Array<{ code: string; message: string }> = [],
    context?: AuditContext,
  ): Promise<void> {
    await this.logOperation({
      scope,
      action: "VALIDATE",
      entityType: "ACCOUNT",
      entityId: accountIds[0] || "multiple", // Use first account or 'multiple'
      metadata: {
        operation: "coa_validation",
        result: validationResult,
        accountIds,
        accountCount: accountIds.length,
        warningCount: warnings.length,
        errorCount: errors.length,
        warnings: warnings.slice(0, 10), // Limit to first 10 warnings
        errors: errors.slice(0, 10), // Limit to first 10 errors
      },
      context,
    });
  }

  /**
   * Log idempotency key usage
   */
  async logIdempotencyUsage(
    scope: Scope,
    idempotencyKey: string,
    action: "CREATE" | "HIT" | "EXPIRE",
    entityType: AuditEntityType,
    entityId?: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.logOperation({
      scope,
      action,
      entityType: "IDEMPOTENCY_KEY",
      entityId: idempotencyKey,
      metadata: {
        operation: "idempotency",
        targetEntityType: entityType,
        targetEntityId: entityId,
        keyUsage: action,
      },
      context,
    });
  }

  /**
   * Log SoD compliance checks
   */
  async logSoDCompliance(
    scope: Scope,
    operation: string,
    result: "ALLOWED" | "DENIED" | "REQUIRES_APPROVAL",
    reason?: string,
    context?: AuditContext,
  ): Promise<void> {
    await this.logOperation({
      scope,
      action: "VALIDATE",
      entityType: "USER",
      entityId: scope.userId,
      metadata: {
        operation: "sod_compliance",
        targetOperation: operation,
        result,
        reason,
        userRole: scope.userRole,
      },
      context,
    });
  }

  /**
   * Query audit logs with filters
   */
  async queryAuditLogs(scope: Scope, filters: AuditQueryFilters = {}): Promise<AuditLogResult[]> {
    // Build where conditions array
    const whereConditions = [eq(auditLogs.tenantId, scope.tenantId)];

    // Apply filters
    if (scope.companyId) {
      whereConditions.push(eq(auditLogs.companyId, scope.companyId));
    }

    if (filters.entityType) {
      whereConditions.push(eq(auditLogs.entityType, filters.entityType));
    }

    if (filters.entityId) {
      whereConditions.push(eq(auditLogs.entityId, filters.entityId));
    }

    if (filters.action) {
      whereConditions.push(eq(auditLogs.action, filters.action));
    }

    if (filters.userId) {
      whereConditions.push(eq(auditLogs.userId, filters.userId));
    }

    // Build the query with all conditions and pagination
    const query = this.db
      .select()
      .from(auditLogs)
      .where(and(...whereConditions))
      .orderBy(desc(auditLogs.createdAt))
      .limit(filters.limit || 100)
      .offset(filters.offset || 0);

    const results = await query;

    return (results as AuditLogDbRow[]).map((row: AuditLogDbRow) => ({
      id: row.id,
      tenantId: row.tenantId,
      companyId: row.companyId || undefined,
      userId: row.userId || undefined,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId || "",
      oldValues: row.oldValues ? JSON.parse(row.oldValues as string) : undefined,
      newValues: row.newValues ? JSON.parse(row.newValues as string) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata as string) : undefined,
      requestId: row.requestId || undefined,
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined,
      createdAt: row.createdAt!,
    }));
  }

  /**
   * Get audit trail for a specific entity
   */
  async getEntityAuditTrail(
    scope: Scope,
    entityType: AuditEntityType,
    entityId: string,
    limit: number = 50,
  ): Promise<AuditLogResult[]> {
    return this.queryAuditLogs(scope, {
      entityType,
      entityId,
      limit,
    });
  }

  /**
   * Get recent audit activity for a user
   */
  async getUserAuditActivity(
    scope: Scope,
    userId: string,
    limit: number = 100,
  ): Promise<AuditLogResult[]> {
    return this.queryAuditLogs(scope, {
      userId,
      limit,
    });
  }

  /**
   * Log security events (failed authentication, authorization failures, etc.)
   */
  async logSecurityEvent(
    scope: Scope,
    event: "AUTH_FAILURE" | "AUTHZ_FAILURE" | "SUSPICIOUS_ACTIVITY" | "RATE_LIMIT",
    details: Record<string, unknown>,
    context?: AuditContext,
  ): Promise<void> {
    await this.logOperation({
      scope,
      action: "VALIDATE",
      entityType: "USER",
      entityId: scope.userId,
      metadata: {
        operation: "security_event",
        event,
        details,
        severity: event === "SUSPICIOUS_ACTIVITY" ? "HIGH" : "MEDIUM",
      },
      context,
    });
  }
}

// Singleton instance for application use
let auditServiceInstance: AuditService | null = null;

/**
 * Get the singleton audit service instance
 */
export function getAuditService(database?: AuditDatabase): AuditService {
  if (!auditServiceInstance) {
    auditServiceInstance = new AuditService(database);
  }
  return auditServiceInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetAuditService(): void {
  auditServiceInstance = null;
}

/**
 * Helper function to create audit context from request
 */
export function createAuditContext(
  requestId?: string,
  ipAddress?: string,
  userAgent?: string,
  source: AuditContext["source"] = "API",
): AuditContext {
  return {
    requestId,
    ipAddress,
    userAgent,
    source,
    version: process.env.APP_VERSION || "1.0.0",
  };
}
