/**
 * Utility types for type-safe I/O boundaries
 */


// Re-export branded types from contracts (SSOT)
export type {
  JournalId,
  InvoiceId,
  TenantId,
  CompanyId,
  UserId,
  AttachmentId,
} from "@aibos/contracts";

export {
  createJournalId,
  createInvoiceId,
  createTenantId,
  createCompanyId,
  createUserId,
  createAttachmentId,
} from "@aibos/contracts";

// JSON value types for API boundaries
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// --- AUDIT TYPES (SSOT) ---

// Classic Audit Service types
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

export interface AuditContext {
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  correlationId?: string;
  source?: "API" | "UI" | "SYSTEM" | "BATCH" | "WEBHOOK";
  version?: string;
}

export interface AuditEntry {
  scope: import("@aibos/db").Scope;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  context?: AuditContext;
}

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

// V1 Audit Service types (Supabase)
export interface V1AuditAuditContext {
  userId?: string;
  tenantId?: string;
  companyId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface V1AuditAuditEvent {
  id?: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  action: string;
  details: Record<string, unknown>;
  context: V1AuditAuditContext;
  createdAt: Date;
}

// --- END AUDIT TYPES ---
