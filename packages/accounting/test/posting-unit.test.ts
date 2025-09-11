import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { 
  validateBalanced,
  validateJournalLines,
  validateSoDCompliance,
  PostingError,
  PostingContext
} from "../src/posting";

// Mock the auth functions
vi.mock("@aibos/auth", () => ({
  checkSoDCompliance: vi.fn()
}));

import { checkSoDCompliance } from "@aibos/auth";

describe("Posting Engine - Unit Tests (No Database)", () => {
  const mockContext: PostingContext = {
    tenantId: "tenant-123",
    companyId: "company-456", 
    userId: "user-789",
    userRole: "manager"
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default successful SoD mock
    vi.mocked(checkSoDCompliance).mockReturnValue({
      allowed: true,
      requiresApproval: false
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("validateBalanced", () => {
    it("should pass for balanced entries", () => {
      const lines = [
        { accountId: "acc1", debit: 100, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 100 }
      ];
      
      expect(() => validateBalanced(lines)).not.toThrow();
    });

    it("should pass for multiple balanced entries", () => {
      const lines = [
        { accountId: "acc1", debit: 500, credit: 0 },
        { accountId: "acc2", debit: 300, credit: 0 },
        { accountId: "acc3", debit: 0, credit: 800 }
      ];
      
      expect(() => validateBalanced(lines)).not.toThrow();
    });

    it("should fail for unbalanced entries", () => {
      const lines = [
        { accountId: "acc1", debit: 100, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 90 }
      ];
      
      expect(() => validateBalanced(lines)).toThrow(PostingError);
      expect(() => validateBalanced(lines)).toThrow("Journal must be balanced");
    });

    it("should handle small rounding differences (within 0.01)", () => {
      const lines = [
        { accountId: "acc1", debit: 100.001, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 100.000 }
      ];
      
      expect(() => validateBalanced(lines)).not.toThrow();
    });

    it("should fail for rounding differences exceeding tolerance", () => {
      const lines = [
        { accountId: "acc1", debit: 100.02, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 100.00 }
      ];
      
      expect(() => validateBalanced(lines)).toThrow(PostingError);
    });

    it("should provide detailed error information", () => {
      const lines = [
        { accountId: "acc1", debit: 100, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 90 }
      ];
      
      try {
        validateBalanced(lines);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(PostingError);
        expect((error as PostingError).code).toBe("UNBALANCED_JOURNAL");
        expect((error as PostingError).details).toMatchObject({
          totalDebit: 100,
          totalCredit: 90,
          difference: 10
        });
      }
    });
  });

  describe("validateJournalLines", () => {
    it("should pass for valid lines", () => {
      const lines = [
        { accountId: "acc1", debit: 100, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 100 }
      ];
      
      expect(() => validateJournalLines(lines)).not.toThrow();
    });

    it("should fail for empty lines", () => {
      expect(() => validateJournalLines([])).toThrow(PostingError);
      expect(() => validateJournalLines([])).toThrow("Journal must have at least one line");
    });

    it("should fail for too many lines", () => {
      const lines = Array(101).fill(0).map((_, i) => ({
        accountId: `acc${i}`,
        debit: i % 2 === 0 ? 10 : 0,
        credit: i % 2 === 1 ? 10 : 0
      }));
      
      expect(() => validateJournalLines(lines)).toThrow(PostingError);
      expect(() => validateJournalLines(lines)).toThrow("Journal cannot have more than 100 lines");
    });

    it("should fail for lines with both debit and credit", () => {
      const lines = [
        { accountId: "acc1", debit: 100, credit: 50 }, // Invalid
        { accountId: "acc2", debit: 0, credit: 150 }
      ];
      
      expect(() => validateJournalLines(lines)).toThrow(PostingError);
      expect(() => validateJournalLines(lines)).toThrow("Cannot have both debit and credit amounts");
    });

    it("should fail for lines with zero amounts", () => {
      const lines = [
        { accountId: "acc1", debit: 0, credit: 0 }, // Invalid
        { accountId: "acc2", debit: 0, credit: 100 }
      ];
      
      expect(() => validateJournalLines(lines)).toThrow(PostingError);
      expect(() => validateJournalLines(lines)).toThrow("Must have either debit or credit amount");
    });

    it("should handle negative amounts correctly", () => {
      // Negative amounts are allowed by the validation (they're not zero)
      // The Zod schema should handle nonnegative validation at the input level
      const lines = [
        { accountId: "acc1", debit: -100, credit: 0 }, // Negative debit
        { accountId: "acc2", debit: 0, credit: 100 }
      ];
      
      // This should NOT throw because -100 !== 0, so it passes the zero check
      // The nonnegative validation happens at the Zod schema level
      expect(() => validateJournalLines(lines)).not.toThrow();
    });

    it("should provide detailed error information for invalid lines", () => {
      const lines = [
        { accountId: "acc1", debit: 100, credit: 50 }, // Invalid - both amounts
        { accountId: "acc2", debit: 0, credit: 150 }
      ];
      
      try {
        validateJournalLines(lines);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(PostingError);
        expect((error as PostingError).code).toBe("INVALID_LINE_AMOUNTS");
        expect((error as PostingError).details).toMatchObject({
          lineIndex: 0,
          debit: 100,
          credit: 50
        });
      }
    });
  });

  describe("validateSoDCompliance", () => {
    it("should pass for authorized roles", () => {
      vi.mocked(checkSoDCompliance).mockReturnValue({
        allowed: true,
        requiresApproval: false
      });
      
      const result = validateSoDCompliance(mockContext);
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(false);
    });

    it("should fail for unauthorized roles", () => {
      vi.mocked(checkSoDCompliance).mockReturnValue({
        allowed: false,
        requiresApproval: false,
        reason: "Insufficient privileges"
      });
      
      expect(() => validateSoDCompliance(mockContext)).toThrow(PostingError);
      expect(() => validateSoDCompliance(mockContext)).toThrow("not authorized to post journal entries");
    });

    it("should return approval requirements", () => {
      vi.mocked(checkSoDCompliance).mockReturnValue({
        allowed: true,
        requiresApproval: true
      });
      
      const result = validateSoDCompliance(mockContext);
      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
    });

    it("should provide detailed error information for SoD violations", () => {
      vi.mocked(checkSoDCompliance).mockReturnValue({
        allowed: false,
        requiresApproval: false,
        reason: "Clerk role cannot post journals"
      });
      
      try {
        validateSoDCompliance(mockContext);
        expect.fail("Should have thrown error");
      } catch (error) {
        expect(error).toBeInstanceOf(PostingError);
        expect((error as PostingError).code).toBe("SOD_VIOLATION");
        expect((error as PostingError).details).toMatchObject({
          action: 'journal:post',
          userRole: 'manager',
          reason: 'Clerk role cannot post journals'
        });
      }
    });
  });

  describe("Edge Cases and Boundary Conditions", () => {
    it("should handle very large amounts in balance validation", () => {
      const lines = [
        { accountId: "acc1", debit: 999999999.99, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 999999999.99 }
      ];
      
      expect(() => validateBalanced(lines)).not.toThrow();
    });

    it("should handle very small amounts in balance validation", () => {
      const lines = [
        { accountId: "acc1", debit: 0.01, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 0.01 }
      ];
      
      expect(() => validateBalanced(lines)).not.toThrow();
    });

    it("should handle maximum number of lines", () => {
      const lines = Array(100).fill(0).map((_, i) => ({
        accountId: `acc${i}`,
        debit: i % 2 === 0 ? 10 : 0,
        credit: i % 2 === 1 ? 10 : 0
      }));
      
      expect(() => validateJournalLines(lines)).not.toThrow();
    });

    it("should handle precision edge cases in balance validation", () => {
      const lines = [
        { accountId: "acc1", debit: 1/3, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 1/3 }
      ];
      
      expect(() => validateBalanced(lines)).not.toThrow();
    });

    it("should handle floating point precision issues", () => {
      const lines = [
        { accountId: "acc1", debit: 0.1 + 0.2, credit: 0 }, // 0.30000000000000004
        { accountId: "acc2", debit: 0, credit: 0.3 }
      ];
      
      expect(() => validateBalanced(lines)).not.toThrow();
    });
  });

  describe("Performance Tests", () => {
    it("should validate large journals efficiently", () => {
      const lines = Array(100).fill(0).map((_, i) => ({
        accountId: `acc${i % 10}`, // Reuse account IDs
        debit: i % 2 === 0 ? 10 : 0,
        credit: i % 2 === 1 ? 10 : 0
      }));
      
      const startTime = Date.now();
      
      expect(() => validateJournalLines(lines)).not.toThrow();
      expect(() => validateBalanced(lines)).not.toThrow();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it("should handle repeated validations efficiently", () => {
      const lines = [
        { accountId: "acc1", debit: 100, credit: 0 },
        { accountId: "acc2", debit: 0, credit: 100 }
      ];
      
      const startTime = Date.now();
      
      // Run validation 1000 times
      for (let i = 0; i < 1000; i++) {
        validateJournalLines(lines);
        validateBalanced(lines);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
