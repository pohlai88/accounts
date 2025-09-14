/**
 * @aibos/contracts - Branded Types (SSOT)
 * 
 * Single source of truth for all branded ID types used across the system
 * These types prevent mixing different ID types and provide type safety
 */

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
