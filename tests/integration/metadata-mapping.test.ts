/**
 * Metadata Mapping Test
 *
 * Verifies that the standardized metadata mapping system works correctly
 * and eliminates field name debugging issues.
 */

import { describe, it, expect } from "vitest";
import {
    createPaymentTestData,
    createBankAccount,
    createInvoice,
    validatePaymentResult
} from "./factories/payment-factory";
import {
    getTestAccountId,
    getAccountCode,
    getPaymentTypeFromAllocation,
    ALLOCATION_TYPES
} from "../../packages/accounting/src/metadata/account-mapping";

describe("Metadata Mapping System", () => {
    it("should create standardized test data", () => {
        const testData = createPaymentTestData();

        // Verify account IDs are proper UUIDs
        expect(testData.accounts.bank).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
        expect(testData.accounts.ar).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);

        // Verify account IDs match expected values
        expect(testData.accounts.bank).toBe(getTestAccountId('BANK_ACCOUNT'));
        expect(testData.accounts.ar).toBe(getTestAccountId('ACCOUNTS_RECEIVABLE'));
    });

    it("should create bank account with proper structure", () => {
        const bankAccount = createBankAccount('MYR');

        expect(bankAccount.id).toBe(getTestAccountId('BANK_ACCOUNT'));
        expect(bankAccount.currency).toBe('MYR');
        expect(bankAccount.isActive).toBe(true);
    });

    it("should create invoice with proper calculations", () => {
        const invoice = createInvoice('customer-123', 1000, 0.1);

        expect(invoice.amount).toBe(1000);
        expect(invoice.taxAmount).toBe(100);
        expect(invoice.totalAmount).toBe(1100);
        expect(invoice.openAmount).toBe(1100);
    });

    it("should determine payment type correctly", () => {
        expect(getPaymentTypeFromAllocation(ALLOCATION_TYPES.INVOICE)).toBe('CUSTOMER_PAYMENT');
        expect(getPaymentTypeFromAllocation(ALLOCATION_TYPES.BILL)).toBe('SUPPLIER_PAYMENT');
    });

    it("should validate payment results correctly", () => {
        const testData = createPaymentTestData();
        const scenario = testData.scenarios.validPayment;

        // Test successful result
        const successResult = {
            success: true,
            totalAmount: 1100,
            allocationsProcessed: 1,
            lines: [{}, {}] // 2 lines
        };

        expect(validatePaymentResult(successResult, scenario.expectedResult)).toBe(true);

        // Test failed result
        const failResult = {
            success: false,
            totalAmount: 1100,
            allocationsProcessed: 1,
            lines: [{}, {}]
        };

        expect(validatePaymentResult(failResult, scenario.expectedResult)).toBe(false);
    });

    it("should provide consistent account codes", () => {
        expect(getAccountCode('BANK_ACCOUNT')).toBe('1000');
        expect(getAccountCode('ACCOUNTS_RECEIVABLE')).toBe('1100');
        expect(getAccountCode('ACCOUNTS_PAYABLE')).toBe('2100');
        expect(getAccountCode('SALES_REVENUE')).toBe('4000');
    });
});
