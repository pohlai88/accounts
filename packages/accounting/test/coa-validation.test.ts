import { describe, it, expect } from "vitest";
import {
  validateAccountsExist,
  validateCurrencyConsistency,
  validateNormalBalances,
  validateControlAccounts,
  validateCOAFlags,
  COAValidationError,
  AccountTypeSchema
} from "../src/coa-validation";
import type { AccountInfo } from "@aibos/db";

describe("COA Validation", () => {
  const mockAccounts: AccountInfo[] = [
    {
      id: "acc-asset-001",
      code: "1001",
      name: "Cash at Bank",
      accountType: "ASSET",
      currency: "MYR",
      isActive: true,
      level: 1,
      parentId: "acc-asset-parent"
    },
    {
      id: "acc-revenue-001", 
      code: "4001",
      name: "Sales Revenue",
      accountType: "REVENUE",
      currency: "MYR",
      isActive: true,
      level: 1,
      parentId: "acc-revenue-parent"
    },
    {
      id: "acc-control-001",
      code: "1000",
      name: "Assets Control",
      accountType: "ASSET",
      currency: "MYR",
      isActive: true,
      level: 0, // Control account
      parentId: undefined
    },
    {
      id: "acc-inactive-001",
      code: "9999",
      name: "Inactive Account",
      accountType: "ASSET",
      currency: "MYR",
      isActive: false, // Inactive
      level: 1,
      parentId: undefined
    },
    {
      id: "acc-usd-001",
      code: "1002",
      name: "USD Cash",
      accountType: "ASSET",
      currency: "USD", // Different currency
      isActive: true,
      level: 1,
      parentId: undefined
    },
    {
      id: "acc-expense-001",
      code: "5001",
      name: "Office Expenses", 
      accountType: "EXPENSE",
      currency: "MYR",
      isActive: true,
      level: 1,
      parentId: "acc-expense-parent"
    },
    {
      id: "acc-liability-001",
      code: "2001",
      name: "Accounts Payable",
      accountType: "LIABILITY", 
      currency: "MYR",
      isActive: true,
      level: 1,
      parentId: "acc-liability-parent"
    },
    {
      id: "acc-equity-001",
      code: "3001",
      name: "Retained Earnings",
      accountType: "EQUITY",
      currency: "MYR", 
      isActive: true,
      level: 1,
      parentId: "acc-equity-parent"
    }
  ];

  const accountsMap = new Map(mockAccounts.map(acc => [acc.id, acc]));

  describe("validateAccountsExist", () => {
    it("should pass when all accounts exist and are active", () => {
      const accountIds = ["acc-asset-001", "acc-revenue-001"];
      
      expect(() => validateAccountsExist(accountIds, accountsMap)).not.toThrow();
    });

    it("should fail when accounts don't exist", () => {
      const accountIds = ["acc-asset-001", "non-existent-account"];
      
      expect(() => validateAccountsExist(accountIds, accountsMap))
        .toThrow(COAValidationError);
      expect(() => validateAccountsExist(accountIds, accountsMap))
        .toThrow("Account(s) not found");
    });

    it("should fail when accounts are inactive", () => {
      const accountIds = ["acc-asset-001", "acc-inactive-001"];
      
      expect(() => validateAccountsExist(accountIds, accountsMap))
        .toThrow(COAValidationError);
      expect(() => validateAccountsExist(accountIds, accountsMap))
        .toThrow("Inactive account(s) cannot be used");
    });

    it("should handle empty account list", () => {
      expect(() => validateAccountsExist([], accountsMap)).not.toThrow();
    });

    it("should provide detailed error information", () => {
      const accountIds = ["missing-1", "missing-2"];
      
      try {
        validateAccountsExist(accountIds, accountsMap);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(COAValidationError);
        expect((error as COAValidationError).code).toBe("ACCOUNTS_NOT_FOUND");
        expect((error as COAValidationError).details).toEqual({
          missingAccountIds: ["missing-1", "missing-2"]
        });
      }
    });
  });

  describe("validateCurrencyConsistency", () => {
    it("should pass when all accounts match journal currency", () => {
      const accountIds = ["acc-asset-001", "acc-revenue-001"]; // Both MYR
      
      expect(() => validateCurrencyConsistency("MYR", accountsMap, accountIds))
        .not.toThrow();
    });

    it("should fail when accounts have different currencies", () => {
      const accountIds = ["acc-asset-001", "acc-usd-001"]; // MYR and USD
      
      expect(() => validateCurrencyConsistency("MYR", accountsMap, accountIds))
        .toThrow(COAValidationError);
      expect(() => validateCurrencyConsistency("MYR", accountsMap, accountIds))
        .toThrow("Currency mismatch");
    });

    it("should handle empty account list", () => {
      expect(() => validateCurrencyConsistency("MYR", accountsMap, []))
        .not.toThrow();
    });

    it("should provide detailed mismatch information", () => {
      const accountIds = ["acc-asset-001", "acc-usd-001"];
      
      try {
        validateCurrencyConsistency("MYR", accountsMap, accountIds);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(COAValidationError);
        expect((error as COAValidationError).code).toBe("CURRENCY_MISMATCH");
        expect((error as COAValidationError).details).toMatchObject({
          journalCurrency: "MYR",
          mismatches: expect.arrayContaining([
            expect.objectContaining({
              accountId: "acc-usd-001",
              accountCurrency: "USD"
            })
          ])
        });
      }
    });
  });

  describe("validateNormalBalances", () => {
    it("should return no warnings for normal balance entries", () => {
      const lines = [
        { accountId: "acc-asset-001", debit: 100, credit: 0 }, // Asset debit (normal)
        { accountId: "acc-revenue-001", debit: 0, credit: 100 } // Revenue credit (normal)
      ];
      
      const warnings = validateNormalBalances(lines, accountsMap);
      expect(warnings).toHaveLength(0);
    });

    it("should warn for asset accounts with credit entries", () => {
      const lines = [
        { accountId: "acc-asset-001", debit: 0, credit: 100 } // Asset credit (unusual)
      ];
      
      const warnings = validateNormalBalances(lines, accountsMap);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        accountId: "acc-asset-001",
        accountType: "ASSET",
        amount: 100,
        side: "credit"
      });
      expect(warnings[0]?.warning).toContain("normally has debit balance");
    });

    it("should warn for revenue accounts with debit entries", () => {
      const lines = [
        { accountId: "acc-revenue-001", debit: 100, credit: 0 } // Revenue debit (unusual)
      ];
      
      const warnings = validateNormalBalances(lines, accountsMap);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatchObject({
        accountId: "acc-revenue-001", 
        accountType: "REVENUE",
        amount: 100,
        side: "debit"
      });
      expect(warnings[0]?.warning).toContain("normally has credit balance");
    });

    it("should handle all account types correctly", () => {
      const lines = [
        // Against normal balances
        { accountId: "acc-asset-001", debit: 0, credit: 100 },    // Asset credit
        { accountId: "acc-expense-001", debit: 0, credit: 100 },  // Expense credit
        { accountId: "acc-liability-001", debit: 100, credit: 0 }, // Liability debit
        { accountId: "acc-equity-001", debit: 100, credit: 0 },   // Equity debit
        { accountId: "acc-revenue-001", debit: 100, credit: 0 }   // Revenue debit
      ];
      
      const warnings = validateNormalBalances(lines, accountsMap);
      expect(warnings).toHaveLength(5);
      
      // Check each warning
      expect(warnings.find(w => w.accountId === "acc-asset-001")?.warning)
        .toContain("ASSET account");
      expect(warnings.find(w => w.accountId === "acc-expense-001")?.warning)
        .toContain("EXPENSE account");
      expect(warnings.find(w => w.accountId === "acc-liability-001")?.warning)
        .toContain("LIABILITY account");
      expect(warnings.find(w => w.accountId === "acc-equity-001")?.warning)
        .toContain("EQUITY account");
      expect(warnings.find(w => w.accountId === "acc-revenue-001")?.warning)
        .toContain("REVENUE account");
    });

    it("should ignore non-existent accounts", () => {
      const lines = [
        { accountId: "non-existent", debit: 100, credit: 0 }
      ];
      
      const warnings = validateNormalBalances(lines, accountsMap);
      expect(warnings).toHaveLength(0);
    });
  });

  describe("validateControlAccounts", () => {
    it("should pass for non-control accounts", () => {
      const accountIds = ["acc-asset-001", "acc-revenue-001"]; // Level 1 accounts
      
      expect(() => validateControlAccounts(accountIds, accountsMap, mockAccounts))
        .not.toThrow();
    });

    it("should fail for level 0 control accounts", () => {
      const accountIds = ["acc-control-001"]; // Level 0 account
      
      expect(() => validateControlAccounts(accountIds, accountsMap, mockAccounts))
        .toThrow(COAValidationError);
      expect(() => validateControlAccounts(accountIds, accountsMap, mockAccounts))
        .toThrow("Control account violations");
    });

    it("should fail for accounts with children", () => {
      // Create an account that has children
      const accountWithChildren = {
        id: "acc-parent-001",
        code: "1000",
        name: "Parent Account", 
        accountType: "ASSET",
        currency: "MYR",
        isActive: true,
        level: 1,
        parentId: undefined
      };
      
      const childAccount = {
        id: "acc-child-001",
        code: "1001",
        name: "Child Account",
        accountType: "ASSET", 
        currency: "MYR",
        isActive: true,
        level: 2,
        parentId: "acc-parent-001" // Points to parent
      };
      
      const extendedAccounts = [...mockAccounts, accountWithChildren, childAccount];
      const extendedMap = new Map([...accountsMap, [accountWithChildren.id, accountWithChildren]]);
      
      expect(() => validateControlAccounts(["acc-parent-001"], extendedMap, extendedAccounts))
        .toThrow(COAValidationError);
    });

    it("should provide detailed violation information", () => {
      const accountIds = ["acc-control-001"];
      
      try {
        validateControlAccounts(accountIds, accountsMap, mockAccounts);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(COAValidationError);
        expect((error as COAValidationError).code).toBe("CONTROL_ACCOUNT_VIOLATION");
        expect((error as COAValidationError).details).toMatchObject({
          violations: expect.arrayContaining([
            expect.objectContaining({
              accountId: "acc-control-001",
              code: "1000",
              reason: "Top-level control account (level 0) cannot be posted to directly"
            })
          ])
        });
      }
    });

    it("should handle empty account list", () => {
      expect(() => validateControlAccounts([], accountsMap, mockAccounts))
        .not.toThrow();
    });
  });

  describe("validateCOAFlags - Integration", () => {
    it("should pass comprehensive validation for valid journal", async () => {
      const lines = [
        { accountId: "acc-asset-001", debit: 1000, credit: 0 },
        { accountId: "acc-revenue-001", debit: 0, credit: 1000 }
      ];
      
      const result = await validateCOAFlags(lines, "MYR", accountsMap, mockAccounts);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0);
      expect(result.accountDetails).toBe(accountsMap);
    });

    it("should fail for accounts that don't exist", async () => {
      const lines = [
        { accountId: "non-existent", debit: 100, credit: 0 },
        { accountId: "acc-revenue-001", debit: 0, credit: 100 }
      ];
      
      await expect(validateCOAFlags(lines, "MYR", accountsMap, mockAccounts))
        .rejects.toThrow(COAValidationError);
    });

    it("should fail for currency mismatches", async () => {
      const lines = [
        { accountId: "acc-asset-001", debit: 100, credit: 0 }, // MYR
        { accountId: "acc-usd-001", debit: 0, credit: 100 }    // USD
      ];
      
      await expect(validateCOAFlags(lines, "MYR", accountsMap, mockAccounts))
        .rejects.toThrow(COAValidationError);
    });

    it("should fail for control account violations", async () => {
      const lines = [
        { accountId: "acc-control-001", debit: 100, credit: 0 },
        { accountId: "acc-revenue-001", debit: 0, credit: 100 }
      ];
      
      await expect(validateCOAFlags(lines, "MYR", accountsMap, mockAccounts))
        .rejects.toThrow(COAValidationError);
    });

    it("should return warnings for normal balance violations", async () => {
      const lines = [
        { accountId: "acc-asset-001", debit: 0, credit: 100 },   // Asset credit (unusual)
        { accountId: "acc-revenue-001", debit: 100, credit: 0 }  // Revenue debit (unusual)
      ];
      
      const result = await validateCOAFlags(lines, "MYR", accountsMap, mockAccounts);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(2);
    });

    it("should handle complex multi-account scenarios", async () => {
      const lines = [
        { accountId: "acc-asset-001", debit: 500, credit: 0 },
        { accountId: "acc-expense-001", debit: 300, credit: 0 },
        { accountId: "acc-liability-001", debit: 0, credit: 200 },
        { accountId: "acc-revenue-001", debit: 0, credit: 600 }
      ];
      
      const result = await validateCOAFlags(lines, "MYR", accountsMap, mockAccounts);
      
      expect(result.valid).toBe(true);
      expect(result.warnings).toHaveLength(0); // All normal balances
      expect(result.accountDetails.size).toBe(8); // All mock accounts are in the map
    });
  });

  describe("AccountType Enum", () => {
    it("should validate account type enum values", () => {
      expect(() => AccountTypeSchema.parse("ASSET")).not.toThrow();
      expect(() => AccountTypeSchema.parse("LIABILITY")).not.toThrow();
      expect(() => AccountTypeSchema.parse("EQUITY")).not.toThrow();
      expect(() => AccountTypeSchema.parse("REVENUE")).not.toThrow();
      expect(() => AccountTypeSchema.parse("EXPENSE")).not.toThrow();
      
      expect(() => AccountTypeSchema.parse("INVALID")).toThrow();
    });
  });

  describe("COAValidationError", () => {
    it("should create error with proper structure", () => {
      const error = new COAValidationError("Test message", "TEST_CODE", { detail: "test" });
      
      expect(error.name).toBe("COAValidationError");
      expect(error.message).toBe("Test message");
      expect(error.code).toBe("TEST_CODE");
      expect(error.details).toEqual({ detail: "test" });
    });

    it("should work without details", () => {
      const error = new COAValidationError("Test message", "TEST_CODE");
      
      expect(error.details).toBeUndefined();
    });
  });
});
