/**
 * Utility types for type-safe I/O boundaries
 */

// JSON value types for API boundaries
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

// Branded types for IDs to prevent mixing
export type JournalId = string & { readonly __brand: 'JournalId' };
export type InvoiceId = string & { readonly __brand: 'InvoiceId' };
export type TenantId = string & { readonly __brand: 'TenantId' };
export type CompanyId = string & { readonly __brand: 'CompanyId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type AttachmentId = string & { readonly __brand: 'AttachmentId' };

// Helper to create branded IDs
export function createJournalId(id: string): JournalId {
  return id as JournalId;
}

export function createInvoiceId(id: string): InvoiceId {
  return id as InvoiceId;
}

export function createTenantId(id: string): TenantId {
  return id as TenantId;
}

export function createCompanyId(id: string): CompanyId {
  return id as CompanyId;
}

export function createUserId(id: string): UserId {
  return id as UserId;
}

export function createAttachmentId(id: string): AttachmentId {
  return id as AttachmentId;
}

// Type guard helpers
export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isJsonArray(value: JsonValue): value is JsonArray {
  return Array.isArray(value);
}

// Safe parsing helper for unknown data
export function parseUnknownAsJson(data: unknown): JsonValue {
  if (data === null || typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(parseUnknownAsJson);
  }
  
  if (typeof data === 'object' && data !== null) {
    const result: JsonObject = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = parseUnknownAsJson(value);
    }
    return result;
  }
  
  throw new Error(`Cannot parse unknown data as JSON: ${typeof data}`);
}
