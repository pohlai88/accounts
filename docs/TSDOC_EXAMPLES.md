# TSDoc Documentation Examples

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# TSDoc Documentation Standards

This document provides examples of proper TSDoc documentation for the AI-BOS Accounting SaaS platform.

## 📚 **Golden Example**

````typescript
/**
 * Posts a balanced journal entry to the accounting system.
 *
 * @remarks
 * This function validates that debits equal credits and applies tenant RLS constraints.
 * It automatically generates journal line numbers and validates account existence.
 *
 * @example
 * ```typescript
 * const journal = await postJournal(ctx, {
 *   tenantId: 'tenant_123',
 *   lines: [
 *     { accountId: 'acc_001', debit: 1000, description: 'Cash received' },
 *     { accountId: 'acc_002', credit: 1000, description: 'Revenue earned' }
 *   ]
 * });
 * ```
 *
 * @param ctx - Database context with tenant information
 * @param input - Journal entry data including lines and metadata
 * @returns Promise resolving to the created journal entry
 * @throws {InsufficientPermissionError} When user lacks 'journal:write' role
 * @throws {UnbalancedEntryError} When total debits != total credits
 * @throws {AccountNotFoundError} When referenced account doesn't exist
 * @since 1.2.0
 * @public
 */
export async function postJournal(
  ctx: DatabaseContext,
  input: JournalInput
): Promise<Journal> {
  // Implementation
}
````

## 🏷️ **Required Tags**

### **@param**
Document all function parameters:

```typescript
/**
 * @param invoiceData - The invoice data to create
 * @param options - Additional options for invoice creation
 * @param options.sendNotification - Whether to send email notification
 * @param options.templateId - Custom invoice template to use
 */
export function createInvoice(
  invoiceData: InvoiceInput,
  options?: CreateInvoiceOptions
): Promise<Invoice>
```

### **@returns**
Document return values:

```typescript
/**
 * @returns Promise resolving to the created invoice with generated ID
 * @returns The total amount including taxes and fees
 */
export function createInvoice(): Promise<Invoice>
export function calculateTotal(): number
```

### **@throws**
Document all possible exceptions:

```typescript
/**
 * @throws {ValidationError} When invoice data is invalid
 * @throws {PermissionError} When user lacks create permissions
 * @throws {DuplicateError} When invoice number already exists
 */
export function createInvoice(): Promise<Invoice>
```

### **@example**
Provide working code examples:

```typescript
/**
 * @example
 * ```typescript
 * const invoice = await createInvoice({
 *   customerId: 'cust_123',
 *   amount: 1000,
 *   currency: 'USD'
 * });
 * console.log(invoice.id); // 'inv_abc123'
 * ```
 */
export function createInvoice(): Promise<Invoice>
```

## 🏷️ **Optional Tags**

### **@remarks**
Additional context and important information:

```typescript
/**
 * @remarks
 * This function automatically applies tenant RLS constraints and validates
 * that the user has permission to access the specified accounts.
 * 
 * The function also handles currency conversion if the invoice currency
 * differs from the company's base currency.
 */
export function createInvoice(): Promise<Invoice>
```

### **@since**
Version when the API was introduced:

```typescript
/**
 * @since 1.2.0
 * @since 2.0.0 - Added multi-currency support
 */
export function createInvoice(): Promise<Invoice>
```

### **@deprecated**
Mark deprecated APIs:

```typescript
/**
 * @deprecated Use createInvoiceV2 instead
 * @deprecated Will be removed in v3.0.0
 */
export function createInvoice(): Promise<Invoice>
```

### **@public / @beta / @alpha**
API stability levels:

```typescript
/**
 * @public - Stable API, safe for production use
 * @beta - API may change in minor releases
 * @alpha - API may change in any release
 */
export function createInvoice(): Promise<Invoice>
```

### **@internal**
Mark internal APIs:

```typescript
/**
 * @internal
 * Internal helper function for validation
 */
export function validateInvoiceData(): boolean
```

## 🏷️ **Grouping Tags**

### **@group**
Organize APIs by business domain:

```typescript
/**
 * @group Cash > Reconciliation
 * @group Close > Journals
 * @group Reports > Financial
 */
export function postJournal(): Promise<Journal>
```

## 📝 **Class Documentation**

```typescript
/**
 * Manages invoice operations and business logic.
 *
 * @remarks
 * This class handles the complete invoice lifecycle from creation to payment.
 * It automatically applies business rules and validates data integrity.
 *
 * @example
 * ```typescript
 * const invoiceManager = new InvoiceManager(db);
 * const invoice = await invoiceManager.createInvoice(data);
 * await invoiceManager.sendInvoice(invoice.id);
 * ```
 *
 * @public
 */
export class InvoiceManager {
  /**
   * Creates a new invoice manager instance.
   *
   * @param db - Database connection instance
   * @param options - Configuration options
   * @param options.autoSend - Whether to automatically send invoices
   */
  constructor(db: Database, options?: InvoiceManagerOptions) {
    // Implementation
  }

  /**
   * Creates a new invoice in the system.
   *
   * @param data - Invoice data to create
   * @returns Promise resolving to the created invoice
   * @throws {ValidationError} When invoice data is invalid
   */
  async createInvoice(data: InvoiceInput): Promise<Invoice> {
    // Implementation
  }
}
```

## 📝 **Interface Documentation**

```typescript
/**
 * Configuration options for invoice creation.
 *
 * @remarks
 * All options are optional and have sensible defaults.
 * The system will automatically apply tenant-specific settings.
 */
export interface CreateInvoiceOptions {
  /** Whether to send email notification to customer */
  sendNotification?: boolean;
  
  /** Custom invoice template to use */
  templateId?: string;
  
  /** Additional metadata to attach to the invoice */
  metadata?: Record<string, any>;
  
  /** Payment terms in days */
  paymentTerms?: number;
}
```

## 📝 **Type Alias Documentation**

```typescript
/**
 * Invoice status values for tracking invoice lifecycle.
 *
 * @remarks
 * Status transitions are: draft → sent → paid/overdue → cancelled
 */
export type InvoiceStatus = 
  | 'draft'      /** Invoice is being prepared */
  | 'sent'       /** Invoice has been sent to customer */
  | 'paid'       /** Invoice has been paid */
  | 'overdue'    /** Invoice is past due date */
  | 'cancelled'; /** Invoice has been cancelled */
```

## 📝 **Enum Documentation**

```typescript
/**
 * Error codes for invoice operations.
 *
 * @remarks
 * These codes are used in API responses and error handling.
 * They follow the pattern: MODULE_OPERATION_ERROR
 */
export enum InvoiceErrorCode {
  /** Invalid invoice data provided */
  INVALID_DATA = 'INVOICE_INVALID_DATA',
  
  /** Invoice not found */
  NOT_FOUND = 'INVOICE_NOT_FOUND',
  
  /** Insufficient permissions */
  PERMISSION_DENIED = 'INVOICE_PERMISSION_DENIED',
  
  /** Invoice already exists */
  DUPLICATE = 'INVOICE_DUPLICATE'
}
```

## 📝 **Package Documentation**

```typescript
/**
 * @packageDocumentation
 * 
 * # AI-BOS Accounting Package
 * 
 * This package provides core accounting functionality including:
 * - Invoice management and processing
 * - Payment tracking and reconciliation
 * - Financial reporting and analytics
 * - Multi-currency support
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { InvoiceManager, createInvoice } from '@aibos/accounting';
 * 
 * const manager = new InvoiceManager(db);
 * const invoice = await manager.createInvoice({
 *   customerId: 'cust_123',
 *   amount: 1000
 * });
 * ```
 * 
 * ## Key Features
 * 
 * - **Multi-tenant**: Automatic tenant isolation
 * - **Multi-currency**: Support for 150+ currencies
 * - **Real-time**: Live updates and notifications
 * - **Compliant**: SOX, GAAP, and IFRS compliant
 */
```

## 📝 **Module Documentation**

```typescript
/**
 * @fileoverview Invoice management module
 * 
 * This module handles all invoice-related operations including
 * creation, validation, processing, and payment tracking.
 * 
 * Key components:
 * - InvoiceManager: Main class for invoice operations
 * - InvoiceValidator: Data validation and business rules
 * - InvoiceProcessor: Payment processing and reconciliation
 */
```

## ✅ **Quality Checklist**

### **Required Elements**
- [ ] `@param` for all parameters
- [ ] `@returns` for return values
- [ ] `@throws` for exceptions
- [ ] `@example` with working code
- [ ] Clear, concise description

### **Recommended Elements**
- [ ] `@remarks` for additional context
- [ ] `@since` for version information
- [ ] `@group` for business domain
- [ ] `@public/@beta/@alpha` for stability
- [ ] `@deprecated` for obsolete APIs

### **Quality Standards**
- [ ] Examples compile and run
- [ ] Descriptions are clear and concise
- [ ] All public APIs are documented
- [ ] Internal APIs marked with `@internal`
- [ ] Deprecated APIs have replacement notes

## 🚫 **Common Mistakes**

### **❌ Don't Do This**
```typescript
/**
 * Creates invoice
 * @param data - data
 * @returns invoice
 */
export function createInvoice(data: any): any {
  // Implementation
}
```

### **✅ Do This Instead**
```typescript
/**
 * Creates a new invoice in the system.
 *
 * @param data - Invoice data including customer and line items
 * @returns Promise resolving to the created invoice with generated ID
 * @throws {ValidationError} When invoice data is invalid
 * @example
 * ```typescript
 * const invoice = await createInvoice({
 *   customerId: 'cust_123',
 *   amount: 1000
 * });
 * ```
 */
export function createInvoice(data: InvoiceInput): Promise<Invoice> {
  // Implementation
}
```

---

**Last Updated**: September 17, 2025  
**Standards Version**: 1.0  
**Next Review**: December 17, 2025
