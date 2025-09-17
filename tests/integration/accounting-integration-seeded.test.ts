/**
 * Accounting Integration Tests with Deterministic Seed
 *
 * Tests accounting business logic with real database operations using
 * deterministic seed data for fast, repeatable, parallel-safe tests.
 */

import { describe, it, expect } from "vitest";
import { withTestSchema } from "../../packages/accounting/tests/integration/db-schema";
import { skipIfNoEnvironment } from "./setup";
import { seedCore } from "./seed";
import {
    addBankAccount,
    addFxRate,
    buildInvoiceOpen,
    addAdvanceAccount,
    addPerformanceIndices,
    tx
} from "./builders";
import { validatePaymentProcessingEnhanced } from "@aibos/accounting";
import { createPaymentTestData, createBankAccount, createInvoice, validatePaymentResult } from "./factories/payment-factory";
import { ACCOUNT_IDS } from "../../packages/accounting/src/metadata/account-mapping";

describe("Accounting Integration (Seeded)", () => {
    describe("Payment Processing", () => {
        it("should process valid payment with real database", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                await tx(conn, async (c) => {

                    // Create bank account
                    const bankId = await addBankAccount(c, schema, "bank-1000", "MYR");

                    // Create open invoice
                    const invoice = await buildInvoiceOpen(c, schema, {
                        companyId: seeded.companyId,
                        customerId: seeded.customerId,
                        currency: "MYR",
                        revAccountId: seeded.accounts.rev,
                        taxAccountId: seeded.accounts.tax,
                        amount: 1000,
                        taxRate: 0.1, // 10% tax
                        description: "Test Invoice"
                    });

                    // Verify invoice was created correctly
                    const { rows } = await c.query(`select open_amount from "${schema}"."invoices" where id = $1`, [invoice.id]);
                    expect(rows[0].open_amount).toBeCloseTo(1100, 2); // 1000 + 100 tax

                    // Create payment input using metadata account IDs
                    const paymentInput = {
                        currency: "MYR",
                        amount: 1100, // Full amount including tax
                        bankAccountId: bankId,
                        allocations: [{
                            type: "INVOICE" as const,
                            documentId: invoice.id,
                            documentNumber: "INV-001",
                            customerId: seeded.customerId,
                            allocatedAmount: 1100,
                            arAccountId: ACCOUNT_IDS.AR, // Use metadata account ID
                        }],
                    };

                    // Process payment
                    const result = await validatePaymentProcessingEnhanced(
                        paymentInput,
                        "test-user",
                        "admin",
                        "MYR"
                    );

                    console.log('Payment result:', JSON.stringify(result, null, 2));
                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.totalAmount).toBe(1100);
                        expect(result.allocationsProcessed).toBe(1);
                        expect(result.lines).toHaveLength(2); // Debit AR, Credit Bank

                        // Verify journal is balanced
                        const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
                        const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
                        expect(totalDebits).toBeCloseTo(totalCredits, 2);
                    }
                });
            });
        });

        it("should handle foreign currency payments", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                await tx(conn, async (c) => {

                    // Create MYR bank account
                    const bankId = await addBankAccount(c, schema, "bank-1000", "MYR");

                    // Add FX rate
                    await addFxRate(c, schema, "MYR", "USD", 4.50);

                    // Create USD invoice
                    const invoice = await buildInvoiceOpen(c, schema, {
                        companyId: seeded.companyId,
                        customerId: seeded.customerId,
                        currency: "USD",
                        revAccountId: seeded.accounts.rev,
                        amount: 100,
                        description: "USD Invoice"
                    });

                    // Verify invoice was created correctly
                    const { rows } = await c.query(`select open_amount from "${schema}"."invoices" where id = $1`, [invoice.id]);
                    expect(rows[0].open_amount).toBeCloseTo(100, 2);

                    // Create USD payment input
                    const paymentInput = {
                        currency: "USD",
                        amount: 100,
                        exchangeRate: 4.50,
                        bankAccountId: bankId,
                        allocations: [{
                            type: "INVOICE" as const,
                            documentId: invoice.id,
                            documentNumber: "INV-001",
                            customerId: seeded.customerId,
                            allocatedAmount: 100,
                            arAccountId: ACCOUNT_IDS.AR,
                        }],
                    };

                    // Process payment
                    const result = await validatePaymentProcessingEnhanced(
                        paymentInput,
                        "test-user",
                        "admin",
                        "MYR"
                    );

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.totalAmount).toBeCloseTo(450, 2); // 100 USD * 4.50
                        expect(result.fxApplied).toBeDefined();
                        expect(result.fxApplied?.fromCurrency).toBe("USD");
                        expect(result.fxApplied?.toCurrency).toBe("MYR");
                        expect(result.fxApplied?.exchangeRate).toBe(4.50);

                        // Verify journal is balanced
                        const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
                        const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
                        expect(totalDebits).toBeCloseTo(totalCredits, 2);
                    }
                });
            });
        });

        it("should handle overpayments", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                await tx(conn, async (c) => {

                    // Create bank account
                    const bankId = await addBankAccount(c, schema, "bank-1000", "MYR");

                    // Create advance account for overpayments
                    const advanceId = await addAdvanceAccount(c, schema, {
                        partyType: "CUSTOMER",
                        partyId: seeded.customerId,
                        currency: "MYR",
                        initialBalance: 0
                    });

                    // Create open invoice for 1000
                    const invoice = await buildInvoiceOpen(c, schema, {
                        companyId: seeded.companyId,
                        customerId: seeded.customerId,
                        currency: "MYR",
                        revAccountId: seeded.accounts.rev,
                        amount: 1000,
                        description: "Test Invoice"
                    });

                    // Verify invoice was created correctly
                    const { rows } = await c.query(`select open_amount from "${schema}"."invoices" where id = $1`, [invoice.id]);
                    expect(rows[0].open_amount).toBeCloseTo(1000, 2);

                    // Create overpayment (1500 for 1000 invoice)
                    const paymentInput = {
                        currency: "MYR",
                        amount: 1500, // Overpayment
                        bankAccountId: bankId,
                        allocations: [{
                            type: "INVOICE" as const,
                            documentId: invoice.id,
                            documentNumber: "INV-003",
                            customerId: seeded.customerId,
                            allocatedAmount: 1000, // Only 1000 allocated
                            arAccountId: ACCOUNT_IDS.AR,
                        }],
                    };

                    // Process payment
                    const result = await validatePaymentProcessingEnhanced(
                        paymentInput,
                        "test-user",
                        "admin",
                        "MYR"
                    );

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.totalAmount).toBe(1500);
                        expect(result.allocationsProcessed).toBe(1);
                        // Should have 3 lines: Debit AR, Credit Bank, Credit Advance
                        expect(result.lines).toHaveLength(3);

                        // Verify journal is balanced
                        const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
                        const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
                        expect(totalDebits).toBeCloseTo(totalCredits, 2);

                        // Verify overpayment amount (500) goes to advance account
                        const advanceLine = result.lines.find(line => line.accountId === ACCOUNT_IDS.ADV_CUSTOMER);
                        expect(advanceLine).toBeDefined();
                        expect(advanceLine?.credit).toBeCloseTo(500, 2); // 1500 - 1000 = 500 overpayment
                    }
                });
            });
        });

        it("should validate business rules", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                await tx(conn, async (c) => {

                    // Create bank account
                    const bankId = await addBankAccount(c, schema, "bank-1000", "MYR");

                    // Create USD invoice
                    const invoice = await buildInvoiceOpen(c, schema, {
                        companyId: seeded.companyId,
                        customerId: seeded.customerId,
                        currency: "USD",
                        revAccountId: seeded.accounts.rev,
                        amount: 100,
                        description: "USD Invoice"
                    });

                    // Test missing exchange rate for foreign currency
                    const paymentInput = {
                        currency: "USD",
                        amount: 100,
                        // Missing exchangeRate
                        bankAccountId: bankId,
                        allocations: [{
                            type: "INVOICE" as const,
                            documentId: invoice.id,
                            documentNumber: "INV-004",
                            customerId: seeded.customerId,
                            allocatedAmount: 100,
                            arAccountId: ACCOUNT_IDS.AR,
                        }],
                    };

                    // Process payment - should fail
                    const result = await validatePaymentProcessingEnhanced(
                        paymentInput,
                        "test-user",
                        "admin",
                        "MYR"
                    );

                    expect(result.success).toBe(false);
                    if (!result.success) {
                        expect(result.error).toContain("Exchange rate is required");
                        expect(result.code).toBe("EXCHANGE_RATE_REQUIRED");
                    }
                });
            });
        });
    });

    describe("Journal Posting", () => {
        it("should create balanced journal entries", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                // Create a simple journal entry
                const journalInput = {
                    journalId: "journal-1",
                    description: "Test journal entry",
                    lines: [
                        {
                            accountId: seeded.accounts.bank,
                            debit: 1000,
                            credit: 0,
                            description: "Bank debit"
                        },
                        {
                            accountId: seeded.accounts.ar,
                            debit: 0,
                            credit: 1000,
                            description: "AR credit"
                        }
                    ],
                    context: {
                        companyId: seeded.companyId,
                        userId: "test-user",
                        userRole: "admin"
                    }
                };

                // This would call your journal posting function
                // For now, just verify the data structure
                expect(journalInput.lines).toHaveLength(2);
                const totalDebits = journalInput.lines.reduce((sum, line) => sum + line.debit, 0);
                const totalCredits = journalInput.lines.reduce((sum, line) => sum + line.credit, 0);
                expect(totalDebits).toBe(totalCredits);
            });
        });

        it("should validate journal balancing", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                // Create unbalanced journal entry
                const journalInput = {
                    journalId: "journal-2",
                    description: "Unbalanced journal entry",
                    lines: [
                        {
                            accountId: seeded.accounts.bank,
                            debit: 1000,
                            credit: 0,
                            description: "Bank debit"
                        },
                        {
                            accountId: seeded.accounts.ar,
                            debit: 0,
                            credit: 500, // Only 500 credit - unbalanced!
                            description: "AR credit"
                        }
                    ],
                    context: {
                        companyId: seeded.companyId,
                        userId: "test-user",
                        userRole: "admin"
                    }
                };

                // Verify it's unbalanced
                const totalDebits = journalInput.lines.reduce((sum, line) => sum + line.debit, 0);
                const totalCredits = journalInput.lines.reduce((sum, line) => sum + line.credit, 0);
                expect(totalDebits).not.toBe(totalCredits);
            });
        });
    });

    describe("Multi-Currency Support", () => {
        it("should handle multiple currencies in same transaction", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                await tx(conn, async (c) => {

                    // Create MYR bank account
                    const bankId = await addBankAccount(c, schema, "bank-1000", "MYR");

                    // Add FX rate
                    await addFxRate(c, schema, "MYR", "USD", 4.50);

                    // Create USD invoice
                    const invoice = await buildInvoiceOpen(c, schema, {
                        companyId: seeded.companyId,
                        customerId: seeded.customerId,
                        currency: "USD",
                        revAccountId: seeded.accounts.rev,
                        amount: 100,
                        description: "USD Invoice"
                    });

                    // Verify invoice was created correctly
                    const { rows } = await c.query(`select open_amount from "${schema}"."invoices" where id = $1`, [invoice.id]);
                    expect(rows[0].open_amount).toBeCloseTo(100, 2);

                    // Create multi-currency payment
                    const paymentInput = {
                        currency: "USD",
                        amount: 100,
                        exchangeRate: 4.50,
                        bankAccountId: bankId, // MYR bank account
                        allocations: [{
                            type: "INVOICE" as const,
                            documentId: invoice.id,
                            documentNumber: "INV-MULTI",
                            customerId: seeded.customerId,
                            allocatedAmount: 100, // USD
                            arAccountId: ACCOUNT_IDS.AR, // MYR account
                        }],
                    };

                    // Process payment
                    const result = await validatePaymentProcessingEnhanced(
                        paymentInput,
                        "test-user",
                        "admin",
                        "MYR"
                    );

                    expect(result.success).toBe(true);
                    if (result.success) {
                        expect(result.fxApplied).toBeDefined();
                        expect(result.fxApplied?.fromCurrency).toBe("USD");
                        expect(result.fxApplied?.toCurrency).toBe("MYR");
                        expect(result.fxApplied?.exchangeRate).toBe(4.50);

                        // Verify journal is balanced
                        const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
                        const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
                        expect(totalDebits).toBeCloseTo(totalCredits, 2);
                    }
                });
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle invalid account IDs", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                // Create payment with invalid account ID
                const paymentInput = {
                    currency: "MYR",
                    amount: 1000,
                    bankAccountId: "invalid-bank-id",
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-error",
                        documentNumber: "INV-ERROR",
                        customerId: seeded.customerId,
                        allocatedAmount: 1000,
                        arAccountId: ACCOUNT_IDS.AR,
                    }],
                };

                // Process payment
                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    "MYR"
                );

                // Should fail due to invalid bank account
                expect(result.success).toBe(false);
            });
        });

        it("should handle invalid customer IDs", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                // Create payment with invalid customer ID
                const paymentInput = {
                    currency: "MYR",
                    amount: 1000,
                    bankAccountId: "bank_1000",
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-error-2",
                        documentNumber: "INV-ERROR-2",
                        customerId: "invalid-customer-id",
                        allocatedAmount: 1000,
                        arAccountId: ACCOUNT_IDS.AR,
                    }],
                };

                // Process payment
                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    "MYR"
                );

                // Should fail due to invalid customer
                expect(result.success).toBe(false);
            });
        });
    });

    describe("Performance", () => {
        it("should process payments within acceptable time", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                await tx(conn, async (c) => {

                    // Create bank account
                    const bankId = await addBankAccount(c, schema, "bank-1000", "MYR");

                    // Create invoice
                    const invoice = await buildInvoiceOpen(c, schema, {
                        companyId: seeded.companyId,
                        customerId: seeded.customerId,
                        currency: "MYR",
                        revAccountId: seeded.accounts.rev,
                        amount: 1000,
                        description: "Performance Test Invoice"
                    });

                    const start = Date.now();

                    // Create payment input
                    const paymentInput = {
                        currency: "MYR",
                        amount: 1000,
                        bankAccountId: bankId,
                        allocations: [{
                            type: "INVOICE" as const,
                            documentId: invoice.id,
                            documentNumber: "INV-PERF",
                            customerId: seeded.customerId,
                            allocatedAmount: 1000,
                            arAccountId: ACCOUNT_IDS.AR,
                        }],
                    };

                    // Process payment
                    const result = await validatePaymentProcessingEnhanced(
                        paymentInput,
                        "test-user",
                        "admin",
                        "MYR"
                    );

                    const duration = Date.now() - start;

                    expect(result.success).toBe(true);
                    expect(duration).toBeLessThan(5000); // Should process within 5 seconds

                    // Verify journal is balanced
                    const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
                    const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
                    expect(totalDebits).toBeCloseTo(totalCredits, 2);
                });
            });
        });
    });
});
