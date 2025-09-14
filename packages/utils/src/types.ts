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
  AttachmentId
} from '@aibos/contracts';

export {
  createJournalId,
  createInvoiceId,
  createTenantId,
  createCompanyId,
  createUserId,
  createAttachmentId
} from '@aibos/contracts';

// JSON value types for API boundaries
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

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
