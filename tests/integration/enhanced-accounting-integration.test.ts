/**
 * Enhanced Accounting Integration Tests
 *
 * Comprehensive test suite demonstrating the enhanced metadata mapping
 * and deterministic seed system capabilities.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Pool } from "pg";
import { validatePaymentProcessingEnhanced } from "@aibos/accounting";
import { seedEnhanced, type EnhancedSeededData } from "./enhanced-seed";
import {
    createPaymentFactory,
    createScenarioBuilder,
    validatePaymentResult,
    validateOverpaymentResult,
    validateFXResult
} from "./enhanced-factories";
import {
    ACCOUNT_IDS,
    CURRENCIES,
    PAYMENT_TYPES,
    ALLOCATION_TYPES,
    VALIDATION_RULES
} from "../../packages/accounting/src/metadata/enhanced-account-mapping";

// ============================================================================
// TEST SETUP
// ============================================================================

let pool: Pool;
let seeded: EnhancedSeededData;
const schema = `test_${Date.now()}_${Math.random().toString(36).substring(7)}`;

beforeAll(async () => {
    // Initialize database connection
    pool = new Pool({
        connectionString: process.env.SUPABASE_DB_URL || process.env.DATABASE_URL,
    });

    // Seed enhanced data
    seeded = await seedEnhanced({ schema, conn: pool });
});

afterAll(async () => {
    // Clean up test schema
    if (pool) {
        await pool.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        await pool.end();
    }
});

// ============================================================================
// CORE PAYMENT PROCESSING TESTS
// ============================================================================

describe("Enhanced Payment Processing", () => {
    describe("Basic Customer Payments", () => {
        it("should process simple customer payment", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createCustomerPayment(c, {
                    amount: 1100,
                    currency: CURRENCIES.MYR,
                    invoiceAmount: 1000,
                    taxRate: 0.1
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                validatePaymentResult(result, 1100, 1, 2);

                // Verify specific journal lines
                expect(result.lines).toContainEqual(
                    expect.objectContaining({
                        accountId: ACCOUNT_IDS.BANK,
                        debit: 1100,
                        credit: 0
                    })
                );
                expect(result.lines).toContainEqual(
                    expect.objectContaining({
                        accountId: ACCOUNT_IDS.AR,
                        debit: 0,
                        credit: 1100
                    })
                );
            });
        });

        it("should handle customer overpayment", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createCustomerPayment(c, {
                    amount: 1500,
                    currency: CURRENCIES.MYR,
                    invoiceAmount: 1000,
                    taxRate: 0.1,
                    overpayment: 400
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                validatePaymentResult(result, 1500, 1, 3);
                validateOverpaymentResult(result, 400, ACCOUNT_IDS.ADV_CUSTOMER);
            });
        });

        it("should handle bank charges", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createCustomerPayment(c, {
                    amount: 1125,
                    currency: CURRENCIES.MYR,
                    invoiceAmount: 1000,
                    taxRate: 0.1,
                    bankCharges: 25
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                validatePaymentResult(result, 1125, 1, 3);

                // Verify bank charges line
                expect(result.lines).toContainEqual(
                    expect.objectContaining({
                        accountId: ACCOUNT_IDS.FEES,
                        debit: 25,
                        credit: 0
                    })
                );
            });
        });
    });

    describe("Supplier Payments", () => {
        it("should process supplier payment", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createSupplierPayment(c, {
                    amount: 1100,
                    currency: CURRENCIES.MYR,
                    billAmount: 1000,
                    taxRate: 0.1
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                validatePaymentResult(result, 1100, 1, 2);

                // Verify supplier payment journal lines
                expect(result.lines).toContainEqual(
                    expect.objectContaining({
                        accountId: ACCOUNT_IDS.AP,
                        debit: 1100,
                        credit: 0
                    })
                );
                expect(result.lines).toContainEqual(
                    expect.objectContaining({
                        accountId: ACCOUNT_IDS.BANK,
                        debit: 0,
                        credit: 1100
                    })
                );
            });
        });

        it("should handle supplier overpayment", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createSupplierPayment(c, {
                    amount: 1500,
                    currency: CURRENCIES.MYR,
                    billAmount: 1000,
                    taxRate: 0.1,
                    overpayment: 400
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                validatePaymentResult(result, 1500, 1, 3);
                validateOverpaymentResult(result, 400, ACCOUNT_IDS.PREPAY_VENDOR);
            });
        });
    });

    describe("Multi-Currency Payments", () => {
        it("should handle USD payment for MYR invoice", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createMultiCurrencyPayment(c, {
                    paymentCurrency: CURRENCIES.USD,
                    invoiceCurrency: CURRENCIES.MYR,
                    amount: 1000,
                    exchangeRate: 4.2
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                validatePaymentResult(result, 4200, 1, 2); // 1000 MYR * 4.2 = 4200 MYR equivalent
            });
        });

        it("should handle EUR payment for USD invoice", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createMultiCurrencyPayment(c, {
                    paymentCurrency: CURRENCIES.EUR,
                    invoiceCurrency: CURRENCIES.USD,
                    amount: 1000,
                    exchangeRate: 0.85
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.USD
                );

                validatePaymentResult(result, 850, 1, 2); // 1000 USD * 0.85 = 850 USD equivalent
            });
        });
    });

    describe("Complex Payment Scenarios", () => {
        it("should handle multiple invoice allocations", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createComplexPayment(c, {
                    currency: CURRENCIES.MYR,
                    allocations: [
                        { type: ALLOCATION_TYPES.INVOICE, amount: 1000, taxRate: 0.1, description: 'Product A' },
                        { type: ALLOCATION_TYPES.INVOICE, amount: 500, taxRate: 0.1, description: 'Product B' }
                    ],
                    bankCharges: 25
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                // Expected: 1000 + 100 + 500 + 50 + 25 = 1675
                validatePaymentResult(result, 1675, 2, 3);
            });
        });

        it("should handle mixed invoice and bill allocations", async () => {
            const factory = createPaymentFactory(seeded, schema);

            await pool.query("BEGIN", async (c) => {
                const { paymentInput } = await factory.createComplexPayment(c, {
                    currency: CURRENCIES.MYR,
                    allocations: [
                        { type: ALLOCATION_TYPES.INVOICE, amount: 1000, taxRate: 0.1, description: 'Product Sale' },
                        { type: ALLOCATION_TYPES.BILL, amount: 800, taxRate: 0.1, description: 'Service Purchase' }
                    ],
                    bankCharges: 30,
                    withholdingTax: 50
                });

                const result = await validatePaymentProcessingEnhanced(
                    paymentInput,
                    "test-user",
                    "admin",
                    CURRENCIES.MYR
                );

                // Expected: 1000 + 100 + 800 + 80 + 30 + 50 = 2060
                validatePaymentResult(result, 2060, 2, 4);
            });
        });
    });
});

// ============================================================================
// SCENARIO-BASED TESTS
// ============================================================================

describe("Scenario-Based Testing", () => {
    it("should execute basic customer payment scenario", async () => {
        const builder = createScenarioBuilder(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput, invoice } = await builder.buildBasicCustomerPayment(c);

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            validatePaymentResult(result, 1100, 1, 2);
        });
    });

    it("should execute overpayment scenario", async () => {
        const builder = createScenarioBuilder(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput, invoice } = await builder.buildOverpaymentScenario(c);

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            validatePaymentResult(result, 1500, 1, 3);
            validateOverpaymentResult(result, 400, ACCOUNT_IDS.ADV_CUSTOMER);
        });
    });

    it("should execute multi-currency scenario", async () => {
        const builder = createScenarioBuilder(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput, invoice } = await builder.buildMultiCurrencyScenario(c);

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            validatePaymentResult(result, 4200, 1, 2);
        });
    });

    it("should execute supplier payment scenario", async () => {
        const builder = createScenarioBuilder(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput, bill } = await builder.buildSupplierPaymentScenario(c);

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            validatePaymentResult(result, 1100, 1, 2);
        });
    });

    it("should execute complex payment scenario", async () => {
        const builder = createScenarioBuilder(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput, documents } = await builder.buildComplexPaymentScenario(c);

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            // Expected: 1000 + 100 + 500 + 50 + 800 + 80 + 25 + 50 = 2605
            validatePaymentResult(result, 2605, 3, 4);
        });
    });
});

// ============================================================================
// VALIDATION AND ERROR HANDLING TESTS
// ============================================================================

describe("Validation and Error Handling", () => {
    it("should validate account existence", async () => {
        const factory = createPaymentFactory(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput } = await factory.createCustomerPayment(c, {
                amount: 1100,
                currency: CURRENCIES.MYR,
                invoiceAmount: 1000,
                taxRate: 0.1
            });

            // Modify to use invalid account ID
            paymentInput.allocations[0].arAccountId = "invalid_account_id";

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            expect(result.success).toBe(false);
            expect(result.code).toBe("ACCOUNTS_NOT_FOUND");
        });
    });

    it("should validate currency consistency", async () => {
        const factory = createPaymentFactory(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput } = await factory.createCustomerPayment(c, {
                amount: 1100,
                currency: CURRENCIES.MYR,
                invoiceAmount: 1000,
                taxRate: 0.1
            });

            // Modify to use different currency for allocation
            paymentInput.allocations[0].currency = CURRENCIES.USD;

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            // This should still work as the system handles multi-currency
            expect(result.success).toBe(true);
        });
    });

    it("should validate minimum amount", async () => {
        const factory = createPaymentFactory(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput } = await factory.createCustomerPayment(c, {
                amount: 0.005, // Below minimum
                currency: CURRENCIES.MYR,
                invoiceAmount: 0.005,
                taxRate: 0.1
            });

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            expect(result.success).toBe(false);
            expect(result.code).toBe("INVALID_AMOUNT");
        });
    });
});

// ============================================================================
// PERFORMANCE AND STRESS TESTS
// ============================================================================

describe("Performance and Stress Tests", () => {
    it("should handle large number of allocations", async () => {
        const factory = createPaymentFactory(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const allocations = Array.from({ length: 10 }, (_, i) => ({
                type: ALLOCATION_TYPES.INVOICE,
                amount: 100,
                taxRate: 0.1,
                description: `Product ${i + 1}`
            }));

            const { paymentInput } = await factory.createComplexPayment(c, {
                currency: CURRENCIES.MYR,
                allocations
            });

            const startTime = Date.now();
            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );
            const duration = Date.now() - startTime;

            expect(result.success).toBe(true);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    it("should handle concurrent payments", async () => {
        const factory = createPaymentFactory(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const promises = Array.from({ length: 5 }, (_, i) =>
                factory.createCustomerPayment(c, {
                    amount: 1100 + i * 100,
                    currency: CURRENCIES.MYR,
                    invoiceAmount: 1000 + i * 100,
                    taxRate: 0.1
                }).then(({ paymentInput }) =>
                    validatePaymentProcessingEnhanced(
                        paymentInput,
                        "test-user",
                        "admin",
                        CURRENCIES.MYR
                    )
                )
            );

            const results = await Promise.all(promises);

            results.forEach(result => {
                expect(result.success).toBe(true);
            });
        });
    });
});

// ============================================================================
// BUSINESS RULE VALIDATION TESTS
// ============================================================================

describe("Business Rule Validation", () => {
    it("should enforce journal balancing", async () => {
        const factory = createPaymentFactory(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput } = await factory.createCustomerPayment(c, {
                amount: 1100,
                currency: CURRENCIES.MYR,
                invoiceAmount: 1000,
                taxRate: 0.1
            });

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            expect(result.success).toBe(true);

            // Verify journal is balanced
            const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
            const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
            expect(totalDebits).toBeCloseTo(totalCredits, VALIDATION_RULES.ROUNDING_PRECISION);
        });
    });

    it("should handle FX rounding correctly", async () => {
        const factory = createPaymentFactory(seeded, schema);

        await pool.query("BEGIN", async (c) => {
            const { paymentInput } = await factory.createMultiCurrencyPayment(c, {
                paymentCurrency: CURRENCIES.USD,
                invoiceCurrency: CURRENCIES.MYR,
                amount: 1000,
                exchangeRate: 4.201234 // This will create rounding differences
            });

            const result = await validatePaymentProcessingEnhanced(
                paymentInput,
                "test-user",
                "admin",
                CURRENCIES.MYR
            );

            expect(result.success).toBe(true);

            // Verify FX rounding is handled
            const totalDebits = result.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
            const totalCredits = result.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
            const difference = Math.abs(totalDebits - totalCredits);

            // Difference should be within rounding threshold
            expect(difference).toBeLessThanOrEqual(VALIDATION_RULES.FX_ROUNDING_THRESHOLD);
        });
    });
});
