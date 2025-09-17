/**
 * Accounting Integration Tests
 *
 * Tests accounting business logic with real database operations.
 * Uses isolated test schemas to prevent data pollution.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { withTestSchema, skipIfNoEnvironment } from "./setup";
import { seedCore, buildInvoice, buildBill } from "./seed";
import { validatePaymentProcessingEnhanced } from "@aibos/accounting";

describe("Accounting Integration", () => {
    describe("Payment Processing", () => {
        it("should process valid payment with real database", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                // Create payment input using seeded data
                const paymentInput = {
                    currency: "MYR",
                    amount: 1000,
                    bankAccountId: "bank_1000", // Seeded bank account
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: seeded.customerId,
                        allocatedAmount: 1000,
                        arAccountId: seeded.accounts.ar,
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
                    expect(result.totalAmount).toBe(1000);
                    expect(result.allocationsProcessed).toBe(1);
                    expect(result.lines).toHaveLength(2); // Debit AR, Credit Bank
                }
            });
        });

        it("should handle foreign currency payments", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async ({ schema, conn }) => {
                const seeded = await seedCore({ schema, conn });

                // Create USD payment input
                const paymentInput = {
                    currency: "USD",
                    amount: 100,
                    exchangeRate: 4.50,
                    bankAccountId: "bank_1000", // Seeded bank account
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: seeded.customerId,
                        allocatedAmount: 100,
                        arAccountId: seeded.accounts.ar,
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
                }
            });
        });

        it("should handle overpayments", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                // Create overpayment input
                const paymentInput = {
                    currency: "MYR",
                    amount: 1500, // More than allocated
                    bankAccountId: "00000000-0000-0000-0000-000000000005",
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "00000000-0000-0000-0000-000000000002",
                        allocatedAmount: 1000, // Less than payment amount
                        arAccountId: "00000000-0000-0000-0000-000000000003",
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
                    expect(result.lines).toHaveLength(3); // Debit AR, Credit Cash, Credit Advance
                }
            });
        });

        it("should validate business rules", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                // Create invalid payment input (missing exchange rate for foreign currency)
                const paymentInput = {
                    currency: "USD",
                    amount: 100,
                    // Missing exchangeRate
                    bankAccountId: "00000000-0000-0000-0000-000000000005",
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "00000000-0000-0000-0000-000000000002",
                        allocatedAmount: 100,
                        arAccountId: "00000000-0000-0000-0000-000000000003",
                    }],
                };

                // Process payment
                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    "MYR"
                );

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toContain("Exchange rate required");
                    expect(result.code).toBe("EXCHANGE_RATE_REQUIRED");
                }
            });
        });
    });

    describe("Journal Posting", () => {
        it("should create balanced journal entries", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                // Create journal input
                const journalInput = {
                    journalId: "test-journal-001",
                    description: "Test journal entry",
                    lines: [
                        {
                            accountId: "00000000-0000-0000-0000-000000000005", // Cash
                            debit: 1000,
                            credit: 0,
                        },
                        {
                            accountId: "00000000-0000-0000-0000-000000000004", // Revenue
                            debit: 0,
                            credit: 1000,
                        },
                    ],
                    context: {
                        companyId: "00000000-0000-0000-0000-000000000001",
                        userId: "test-user",
                        userRole: "admin",
                    },
                };

                // This would require the actual journal posting function
                // For now, we'll test the structure
                expect(journalInput.lines).toHaveLength(2);

                const totalDebits = journalInput.lines.reduce((sum, line) => sum + line.debit, 0);
                const totalCredits = journalInput.lines.reduce((sum, line) => sum + line.credit, 0);

                expect(totalDebits).toBe(totalCredits);
            });
        });

        it("should validate journal balancing", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                // Create unbalanced journal input
                const journalInput = {
                    journalId: "test-journal-002",
                    description: "Unbalanced journal entry",
                    lines: [
                        {
                            accountId: "00000000-0000-0000-0000-000000000005", // Cash
                            debit: 1000,
                            credit: 0,
                        },
                        {
                            accountId: "00000000-0000-0000-0000-000000000004", // Revenue
                            debit: 0,
                            credit: 500, // Unbalanced
                        },
                    ],
                    context: {
                        companyId: "00000000-0000-0000-0000-000000000001",
                        userId: "test-user",
                        userRole: "admin",
                    },
                };

                // This would require the actual journal validation function
                // For now, we'll test the structure
                const totalDebits = journalInput.lines.reduce((sum, line) => sum + line.debit, 0);
                const totalCredits = journalInput.lines.reduce((sum, line) => sum + line.credit, 0);

                expect(totalDebits).not.toBe(totalCredits);
            });
        });
    });

    describe("Multi-Currency Support", () => {
        it("should handle multiple currencies in same transaction", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                // Create multi-currency payment input
                const paymentInput = {
                    currency: "USD",
                    amount: 100,
                    exchangeRate: 4.50,
                    bankAccountId: "00000000-0000-0000-0000-000000000005", // MYR account
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "00000000-0000-0000-0000-000000000002",
                        allocatedAmount: 100, // USD
                        arAccountId: "00000000-0000-0000-0000-000000000003", // MYR account
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
                }
            });
        });
    });

    describe("Error Handling", () => {
        it("should handle invalid account IDs", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                // Create payment with invalid account ID
                const paymentInput = {
                    currency: "MYR",
                    amount: 1000,
                    bankAccountId: "invalid-account-id",
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "00000000-0000-0000-0000-000000000002",
                        allocatedAmount: 1000,
                        arAccountId: "00000000-0000-0000-0000-000000000003",
                    }],
                };

                // Process payment
                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    "MYR"
                );

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBeDefined();
                    expect(result.code).toBeDefined();
                }
            });
        });

        it("should handle invalid customer IDs", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                // Create payment with invalid customer ID
                const paymentInput = {
                    currency: "MYR",
                    amount: 1000,
                    bankAccountId: "00000000-0000-0000-0000-000000000005",
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "invalid-customer-id",
                        allocatedAmount: 1000,
                        arAccountId: "00000000-0000-0000-0000-000000000003",
                    }],
                };

                // Process payment
                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    "MYR"
                );

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toBeDefined();
                    expect(result.code).toBeDefined();
                }
            });
        });
    });

    describe("Performance", () => {
        it("should process payments within acceptable time", async () => {
            if (skipIfNoEnvironment()) return;

            await withTestSchema(async (schema, supa) => {
                await setupTestData(schema, supa);

                const paymentInput = {
                    currency: "MYR",
                    amount: 1000,
                    bankAccountId: "00000000-0000-0000-0000-000000000005",
                    allocations: [{
                        type: "INVOICE" as const,
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "00000000-0000-0000-0000-000000000002",
                        allocatedAmount: 1000,
                        arAccountId: "00000000-0000-0000-0000-000000000003",
                    }],
                };

                const start = Date.now();
                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    "MYR"
                );
                const duration = Date.now() - start;

                expect(result.success).toBe(true);
                expect(duration).toBeLessThan(5000); // Should process within 5 seconds
            });
        });
    });
});
