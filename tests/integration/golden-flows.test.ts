/**
 * AI-BOS Accounting SaaS - Golden Flows Integration Tests
 * ============================================================================
 * Comprehensive integration tests for core business workflows
 * Follows SSOT principles and high-quality standards
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { withTestSchema } from "./helpers/db-test-schema.js";
import {
  validateInvoicePosting,
  validatePaymentProcessingEnhanced,
  validateJournalPosting
} from "@aibos/accounting";
import { seedEnhanced } from "./enhanced-seed.js";
import { createPaymentFactory } from "./enhanced-factories.js";
import {
  ACCOUNT_IDS,
  CURRENCIES,
  PAYMENT_TYPES,
  ALLOCATION_TYPES
} from "@aibos/accounting/metadata/enhanced-account-mapping.js";

// ============================================================================
// Test Configuration
// ============================================================================
const TEST_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
} as const;

// ============================================================================
// Test Suite
// ============================================================================
describe("Golden Flow Integration Tests", () => {
  let seededData: any;

  beforeAll(async () => {
    // Global setup if needed
  });

  afterAll(async () => {
    // Global cleanup if needed
  });

  // ============================================================================
  // Invoice Posting Workflow Tests
  // ============================================================================
  describe("Invoice Posting Workflow", () => {
    it("should complete invoice posting workflow with RLS", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const invoiceInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          customerId: seededData.customerId,
          amount: 1000,
          currency: CURRENCIES.MYR,
          lines: [
            {
              accountId: seededData.accounts.rev,
              credit: 1000,
              description: "Sales Revenue",
              reference: "INV-001"
            },
            {
              accountId: seededData.accounts.ar,
              debit: 1000,
              description: "Accounts Receivable",
              reference: "INV-001"
            },
          ],
        };

        const result = await validateInvoicePosting(invoiceInput);

        expect(result.validated).toBe(true);
        expect(result.journalInput).toBeDefined();
        expect(result.journalInput.lines).toHaveLength(2);
        expect(result.journalInput.lines[0].credit).toBe(1000);
        expect(result.journalInput.lines[1].debit).toBe(1000);
      });
    });

    it("should handle foreign currency invoice with FX conversion", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const invoiceInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          customerId: seededData.customerId,
          amount: 100, // USD
          currency: CURRENCIES.USD,
          exchangeRate: 4.5,
          lines: [
            {
              accountId: seededData.accounts.rev,
              credit: 450,
              description: "Sales Revenue (MYR)",
              reference: "INV-002"
            },
            {
              accountId: seededData.accounts.ar,
              debit: 450,
              description: "Accounts Receivable (MYR)",
              reference: "INV-002"
            },
          ],
        };

        const result = await validateInvoicePosting(invoiceInput);

        expect(result.validated).toBe(true);
        expect(result.journalInput.lines[0].credit).toBe(450); // Converted to MYR
        expect(result.journalInput.lines[1].debit).toBe(450);
      });
    });

    it("should handle multi-line invoice with tax", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const invoiceInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          customerId: seededData.customerId,
          amount: 1100, // 1000 + 100 tax
          currency: CURRENCIES.MYR,
          lines: [
            {
              accountId: seededData.accounts.rev,
              credit: 1000,
              description: "Sales Revenue",
              reference: "INV-003"
            },
            {
              accountId: seededData.accounts.tax,
              credit: 100,
              description: "SST Payable",
              reference: "INV-003"
            },
            {
              accountId: seededData.accounts.ar,
              debit: 1100,
              description: "Accounts Receivable",
              reference: "INV-003"
            },
          ],
        };

        const result = await validateInvoicePosting(invoiceInput);

        expect(result.validated).toBe(true);
        expect(result.journalInput.lines).toHaveLength(3);

        // Verify journal is balanced
        const totalDebits = result.journalInput.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = result.journalInput.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        expect(totalDebits).toBe(totalCredits);
      });
    });
  });

  // ============================================================================
  // Payment Processing Workflow Tests
  // ============================================================================
  describe("Payment Processing Workflow", () => {
    it("should complete customer payment workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });
        const factory = createPaymentFactory(seededData, schema);

        const { paymentInput, expectedLines } = await factory.createCustomerPayment(conn, {
          amount: 1000,
          currency: CURRENCIES.MYR,
          invoiceAmount: 1000,
        });

        const result = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(result.success).toBe(true);
        expect(result.totalAmount).toBe(1000);
        expect(result.allocationsProcessed).toBe(1);
        expect(result.lines).toHaveLength(2); // Bank debit, AR credit
      });
    });

    it("should handle supplier payment workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });
        const factory = createPaymentFactory(seededData, schema);

        const { paymentInput } = await factory.createSupplierPayment(conn, {
          amount: 500,
          currency: CURRENCIES.MYR,
          billAmount: 500,
        });

        const result = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(result.success).toBe(true);
        expect(result.totalAmount).toBe(500);
        expect(result.allocationsProcessed).toBe(1);
        expect(result.lines).toHaveLength(2); // AP debit, Bank credit
      });
    });

    it("should handle overpayment workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });
        const factory = createPaymentFactory(seededData, schema);

        const { paymentInput } = await factory.createOverpayment(conn, {
          currency: CURRENCIES.MYR,
          invoiceAmount: 1000,
          overpayment: 200,
        });

        const result = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(result.success).toBe(true);
        expect(result.totalAmount).toBe(1200);
        expect(result.allocationsProcessed).toBe(1);
        expect(result.lines).toHaveLength(3); // Bank debit, AR credit, Advance credit

        // Verify overpayment goes to advance account
        const advanceLine = result.lines.find(line => line.accountId === seededData.accounts.advCustomer);
        expect(advanceLine).toBeDefined();
        expect(advanceLine?.credit).toBe(200);
      });
    });

    it("should handle multi-currency payment workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });
        const factory = createPaymentFactory(seededData, schema);

        const { paymentInput } = await factory.createMultiCurrencyPayment(conn, {
          amount: 100, // USD
          currency: CURRENCIES.USD,
          invoiceAmount: 100,
          exchangeRate: 4.5,
        });

        const result = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(result.success).toBe(true);
        expect(result.totalAmount).toBe(450); // Converted to MYR
        expect(result.allocationsProcessed).toBe(1);
        expect(result.lines).toHaveLength(2);
      });
    });
  });

  // ============================================================================
  // Journal Posting Workflow Tests
  // ============================================================================
  describe("Journal Posting Workflow", () => {
    it("should complete journal posting workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const journalInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          reference: "JRN-001",
          description: "Test Journal Entry",
          lines: [
            {
              accountId: seededData.accounts.bank,
              debit: 1000,
              description: "Bank Account",
              reference: "JRN-001"
            },
            {
              accountId: seededData.accounts.rev,
              credit: 1000,
              description: "Sales Revenue",
              reference: "JRN-001"
            },
          ],
        };

        const result = await validateJournalPosting(journalInput);

        expect(result.validated).toBe(true);
        expect(result.journalId).toBeDefined();
        expect(result.lines).toHaveLength(2);

        // Verify journal is balanced
        const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        expect(totalDebits).toBe(totalCredits);
      });
    });

    it("should handle complex journal with multiple accounts", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const journalInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          reference: "JRN-002",
          description: "Complex Journal Entry",
          lines: [
            {
              accountId: seededData.accounts.bank,
              debit: 1500,
              description: "Bank Account",
              reference: "JRN-002"
            },
            {
              accountId: seededData.accounts.rev,
              credit: 1000,
              description: "Sales Revenue",
              reference: "JRN-002"
            },
            {
              accountId: seededData.accounts.tax,
              credit: 150,
              description: "SST Payable",
              reference: "JRN-002"
            },
            {
              accountId: seededData.accounts.fee,
              credit: 350,
              description: "Bank Fees",
              reference: "JRN-002"
            },
          ],
        };

        const result = await validateJournalPosting(journalInput);

        expect(result.validated).toBe(true);
        expect(result.lines).toHaveLength(4);

        // Verify journal is balanced
        const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
        const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
        expect(totalDebits).toBe(totalCredits);
      });
    });
  });

  // ============================================================================
  // End-to-End Business Workflow Tests
  // ============================================================================
  describe("End-to-End Business Workflows", () => {
    it("should complete full invoice-to-payment workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        // Step 1: Create invoice
        const invoiceInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          customerId: seededData.customerId,
          amount: 1000,
          currency: CURRENCIES.MYR,
          lines: [
            {
              accountId: seededData.accounts.rev,
              credit: 1000,
              description: "Sales Revenue",
              reference: "INV-001"
            },
            {
              accountId: seededData.accounts.ar,
              debit: 1000,
              description: "Accounts Receivable",
              reference: "INV-001"
            },
          ],
        };

        const invoiceResult = await validateInvoicePosting(invoiceInput);
        expect(invoiceResult.validated).toBe(true);

        // Step 2: Process payment
        const paymentInput = {
          currency: CURRENCIES.MYR,
          amount: 1000,
          bankAccountId: seededData.bankAccounts.myrBank,
          allocations: [{
            type: ALLOCATION_TYPES.INVOICE,
            documentId: "invoice-123",
            documentNumber: "INV-001",
            customerId: seededData.customerId,
            allocatedAmount: 1000,
            arAccountId: seededData.accounts.ar,
          }],
        };

        const paymentResult = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(paymentResult.success).toBe(true);
        expect(paymentResult.totalAmount).toBe(1000);
      });
    });

    it("should handle refund workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        // Step 1: Process original payment
        const paymentInput = {
          currency: CURRENCIES.MYR,
          amount: 1000,
          bankAccountId: seededData.bankAccounts.myrBank,
          allocations: [{
            type: ALLOCATION_TYPES.INVOICE,
            documentId: "invoice-123",
            documentNumber: "INV-001",
            customerId: seededData.customerId,
            allocatedAmount: 1000,
            arAccountId: seededData.accounts.ar,
          }],
        };

        const paymentResult = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(paymentResult.success).toBe(true);

        // Step 2: Process refund
        const refundInput = {
          currency: CURRENCIES.MYR,
          amount: -500, // Negative amount for refund
          bankAccountId: seededData.bankAccounts.myrBank,
          allocations: [{
            type: ALLOCATION_TYPES.INVOICE,
            documentId: "invoice-123",
            documentNumber: "INV-001",
            customerId: seededData.customerId,
            allocatedAmount: -500,
            arAccountId: seededData.accounts.ar,
          }],
        };

        const refundResult = await validatePaymentProcessingEnhanced(
          refundInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(refundResult.success).toBe(true);
        expect(refundResult.totalAmount).toBe(-500);
      });
    });

    it("should handle complex multi-currency workflow", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        // Step 1: Create USD invoice
        const invoiceInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          customerId: seededData.customerId,
          amount: 100, // USD
          currency: CURRENCIES.USD,
          exchangeRate: 4.5,
          lines: [
            {
              accountId: seededData.accounts.rev,
              credit: 450,
              description: "Sales Revenue (MYR)",
              reference: "INV-USD-001"
            },
            {
              accountId: seededData.accounts.ar,
              debit: 450,
              description: "Accounts Receivable (MYR)",
              reference: "INV-USD-001"
            },
          ],
        };

        const invoiceResult = await validateInvoicePosting(invoiceInput);
        expect(invoiceResult.validated).toBe(true);

        // Step 2: Process USD payment
        const paymentInput = {
          currency: CURRENCIES.USD,
          amount: 100,
          bankAccountId: seededData.bankAccounts.usdBank,
          allocations: [{
            type: ALLOCATION_TYPES.INVOICE,
            documentId: "invoice-usd-123",
            documentNumber: "INV-USD-001",
            customerId: seededData.customerId,
            allocatedAmount: 100,
            arAccountId: seededData.accounts.ar,
          }],
        };

        const paymentResult = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(paymentResult.success).toBe(true);
        expect(paymentResult.totalAmount).toBe(450); // Converted to MYR
      });
    });
  });

  // ============================================================================
  // Error Handling and Edge Cases
  // ============================================================================
  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid account references", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const invoiceInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          customerId: seededData.customerId,
          amount: 1000,
          currency: CURRENCIES.MYR,
          lines: [
            {
              accountId: "invalid-account-id",
              credit: 1000,
              description: "Invalid Account",
              reference: "INV-ERROR"
            },
          ],
        };

        const result = await validateInvoicePosting(invoiceInput);

        expect(result.validated).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it("should handle unbalanced journal entries", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const journalInput = {
          tenantId: seededData.tenantId,
          companyId: seededData.companyId,
          reference: "JRN-ERROR",
          description: "Unbalanced Journal Entry",
          lines: [
            {
              accountId: seededData.accounts.bank,
              debit: 1000,
              description: "Bank Account",
              reference: "JRN-ERROR"
            },
            {
              accountId: seededData.accounts.rev,
              credit: 500,
              description: "Sales Revenue",
              reference: "JRN-ERROR"
            },
          ],
        };

        const result = await validateJournalPosting(journalInput);

        expect(result.validated).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors.some(error => error.includes("unbalanced"))).toBe(true);
      });
    });

    it("should handle invalid currency conversions", async () => {
      await withTestSchema(async ({ schema, conn }) => {
        seededData = await seedEnhanced({ schema, conn });

        const paymentInput = {
          currency: CURRENCIES.USD,
          amount: 100,
          bankAccountId: seededData.bankAccounts.usdBank,
          allocations: [{
            type: ALLOCATION_TYPES.INVOICE,
            documentId: "invoice-123",
            documentNumber: "INV-001",
            customerId: seededData.customerId,
            allocatedAmount: 100,
            arAccountId: seededData.accounts.ar,
          }],
          // Missing exchange rate
        };

        const result = await validatePaymentProcessingEnhanced(
          paymentInput,
          "test-user",
          "admin",
          CURRENCIES.MYR
        );

        expect(result.success).toBe(false);
        expect(result.error).toContain("exchange rate");
      });
    });
  });
});
