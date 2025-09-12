import { describe, it, expect } from "vitest";
import { validateFxPolicy } from "../src/fx/policy";

describe("FX Policy", () => {
  describe("validateFxPolicy", () => {
    it("should pass for same currency transactions", () => {
      const result = validateFxPolicy("MYR", "MYR");

      expect(result.requiresFxRate).toBe(false);
      expect(result.baseCurrency).toBe("MYR");
      expect(result.transactionCurrency).toBe("MYR");
      expect(result.exchangeRate).toBe(1.0);
    });

    it("should require FX rate for different currencies", () => {
      const result = validateFxPolicy("MYR", "USD");

      expect(result.requiresFxRate).toBe(true);
      expect(result.baseCurrency).toBe("MYR");
      expect(result.transactionCurrency).toBe("USD");
      expect(result.exchangeRate).toBe(1.0); // Default when no rate provided
    });

    it("should handle EUR to USD conversion", () => {
      const result = validateFxPolicy("EUR", "USD");

      expect(result.requiresFxRate).toBe(true);
      expect(result.baseCurrency).toBe("EUR");
      expect(result.transactionCurrency).toBe("USD");
    });

    it("should handle case insensitive currencies", () => {
      const result = validateFxPolicy("myr", "usd");

      expect(result.requiresFxRate).toBe(true);
      expect(result.baseCurrency).toBe("MYR");
      expect(result.transactionCurrency).toBe("USD");
    });

    it("should validate currency code format", () => {
      expect(() => validateFxPolicy("INVALID", "USD")).toThrow("Invalid currency code");
      expect(() => validateFxPolicy("MYR", "TOOLONG")).toThrow("Invalid currency code");
      expect(() => validateFxPolicy("", "USD")).toThrow("Invalid currency code");
    });

    it("should handle all major currencies", () => {
      const majorCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "SGD", "THB", "VND", "IDR", "PHP"];

      majorCurrencies.forEach(currency => {
        expect(() => validateFxPolicy("MYR", currency)).not.toThrow();
      });
    });

    it("should provide proper validation results structure", () => {
      const result = validateFxPolicy("MYR", "USD");

      expect(result).toHaveProperty("requiresFxRate");
      expect(result).toHaveProperty("baseCurrency");
      expect(result).toHaveProperty("transactionCurrency");
      expect(result).toHaveProperty("exchangeRate");
      expect(typeof result.requiresFxRate).toBe("boolean");
      expect(typeof result.baseCurrency).toBe("string");
      expect(typeof result.transactionCurrency).toBe("string");
      expect(typeof result.exchangeRate).toBe("number");
    });

    it("should handle edge cases", () => {
      // Whitespace trimming
      const result1 = validateFxPolicy(" MYR ", " USD ");
      expect(result1.baseCurrency).toBe("MYR");
      expect(result1.transactionCurrency).toBe("USD");

      // Same currency different case
      const result2 = validateFxPolicy("MYR", "myr");
      expect(result2.requiresFxRate).toBe(false);
    });
  });

  describe("Multi-currency scenarios", () => {
    it("should handle SEA currency combinations", () => {
      const seaCurrencies = ["MYR", "SGD", "THB", "VND", "IDR", "PHP"];

      seaCurrencies.forEach(base => {
        seaCurrencies.forEach(transaction => {
          const result = validateFxPolicy(base, transaction);

          if (base === transaction) {
            expect(result.requiresFxRate).toBe(false);
            expect(result.exchangeRate).toBe(1.0);
          } else {
            expect(result.requiresFxRate).toBe(true);
          }
        });
      });
    });

    it("should handle major global currencies", () => {
      const globalCurrencies = ["USD", "EUR", "GBP", "JPY", "AUD"];

      globalCurrencies.forEach(currency => {
        const result = validateFxPolicy("MYR", currency);
        expect(result.requiresFxRate).toBe(true);
        expect(result.baseCurrency).toBe("MYR");
        expect(result.transactionCurrency).toBe(currency);
      });
    });
  });

  describe("Error handling", () => {
    it("should throw for null/undefined currencies", () => {
      expect(() => validateFxPolicy(null as unknown as string, "USD")).toThrow();
      expect(() => validateFxPolicy("MYR", undefined as unknown as string)).toThrow();
    });

    it("should throw for non-string currencies", () => {
      expect(() => validateFxPolicy(123 as unknown as string, "USD")).toThrow();
      expect(() => validateFxPolicy("MYR", {} as unknown as string)).toThrow();
    });

    it("should provide meaningful error messages", () => {
      try {
        validateFxPolicy("INVALID", "USD");
        expect.fail("Should have thrown");
      } catch (error) {
        expect((error as Error).message).toContain("Invalid currency code");
        expect((error as Error).message).toContain("INVALID");
      }
    });
  });
});
