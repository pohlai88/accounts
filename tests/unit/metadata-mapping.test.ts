/**
 * Metadata Mapping Unit Test
 *
 * Verifies that the standardized metadata mapping system works correctly
 * without requiring database setup.
 */

import { describe, it, expect } from "vitest";
import {
    getTestAccountId,
    getAccountCode,
    getPaymentTypeFromAllocation,
    ALLOCATION_TYPES,
    PAYMENT_TYPES,
    STANDARD_ACCOUNT_CODES,
    TEST_ACCOUNT_IDS
} from "../../packages/accounting/src/metadata/account-mapping";

describe("Metadata Mapping System", () => {
    it("should provide consistent account IDs", () => {
        expect(getTestAccountId('BANK_ACCOUNT')).toBe(TEST_ACCOUNT_IDS.BANK_ACCOUNT);
        expect(getTestAccountId('ACCOUNTS_RECEIVABLE')).toBe(TEST_ACCOUNT_IDS.ACCOUNTS_RECEIVABLE);
        expect(getTestAccountId('ACCOUNTS_PAYABLE')).toBe(TEST_ACCOUNT_IDS.ACCOUNTS_PAYABLE);
    });

    it("should provide consistent account codes", () => {
        expect(getAccountCode('BANK_ACCOUNT')).toBe(STANDARD_ACCOUNT_CODES.BANK_ACCOUNT);
        expect(getAccountCode('ACCOUNTS_RECEIVABLE')).toBe(STANDARD_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE);
        expect(getAccountCode('ACCOUNTS_PAYABLE')).toBe(STANDARD_ACCOUNT_CODES.ACCOUNTS_PAYABLE);
    });

    it("should determine payment type correctly", () => {
        expect(getPaymentTypeFromAllocation(ALLOCATION_TYPES.INVOICE)).toBe(PAYMENT_TYPES.CUSTOMER_PAYMENT);
        expect(getPaymentTypeFromAllocation(ALLOCATION_TYPES.BILL)).toBe(PAYMENT_TYPES.SUPPLIER_PAYMENT);
    });

    it("should have proper UUID format for test account IDs", () => {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

        expect(TEST_ACCOUNT_IDS.BANK_ACCOUNT).toMatch(uuidRegex);
        expect(TEST_ACCOUNT_IDS.ACCOUNTS_RECEIVABLE).toMatch(uuidRegex);
        expect(TEST_ACCOUNT_IDS.ACCOUNTS_PAYABLE).toMatch(uuidRegex);
    });

    it("should have proper account code format", () => {
        const codeRegex = /^\d{4}$/;

        expect(STANDARD_ACCOUNT_CODES.BANK_ACCOUNT).toMatch(codeRegex);
        expect(STANDARD_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE).toMatch(codeRegex);
        expect(STANDARD_ACCOUNT_CODES.ACCOUNTS_PAYABLE).toMatch(codeRegex);
    });
});
