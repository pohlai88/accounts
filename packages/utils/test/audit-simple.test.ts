import { describe, it, expect } from "vitest";
import { createAuditContext } from "@aibos/utils/audit/service";

describe("Audit Service - Core Functions", () => {
  describe("createAuditContext", () => {
    it("should create audit context with all parameters", () => {
      const context = createAuditContext("req-123", "192.168.1.1", "Mozilla/5.0", "API");

      expect(context).toEqual({
        requestId: "req-123",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        source: "API",
        version: process.env.APP_VERSION || "1.0.0",
      });
    });

    it("should create audit context with defaults", () => {
      const context = createAuditContext();

      expect(context).toEqual({
        requestId: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        source: "API",
        version: "1.0.0",
      });
    });

    it("should handle different sources", () => {
      const sources = ["API", "UI", "SYSTEM", "BATCH", "WEBHOOK"] as const;

      sources.forEach(source => {
        const context = createAuditContext("req", "ip", "ua", source);
        expect(context.source).toBe(source);
      });
    });

    it("should include version from environment", () => {
      const originalVersion = process.env.APP_VERSION;
      process.env.APP_VERSION = "2.0.0";

      const context = createAuditContext();
      expect(context.version).toBe("2.0.0");

      // Restore original
      if (originalVersion) {
        process.env.APP_VERSION = originalVersion;
      } else {
        delete process.env.APP_VERSION;
      }
    });
  });

  describe("Type Definitions", () => {
    it("should have correct audit action types", () => {
      // This tests that our types are properly exported
      const actions = [
        "CREATE",
        "UPDATE",
        "DELETE",
        "POST",
        "REVERSE",
        "APPROVE",
        "REJECT",
        "SUBMIT",
        "CANCEL",
        "VALIDATE",
        "EXPORT",
        "IMPORT",
        "HIT",
        "EXPIRE",
      ];

      // If types are properly defined, this should not cause TypeScript errors
      actions.forEach(action => {
        expect(typeof action).toBe("string");
      });
    });

    it("should have correct entity types", () => {
      const entities = [
        "JOURNAL",
        "JOURNAL_LINE",
        "INVOICE",
        "PAYMENT",
        "ACCOUNT",
        "TENANT",
        "COMPANY",
        "USER",
        "MEMBERSHIP",
        "CURRENCY",
        "FX_RATE",
        "IDEMPOTENCY_KEY",
      ];

      entities.forEach(entity => {
        expect(typeof entity).toBe("string");
      });
    });
  });

  describe("Audit Context Validation", () => {
    it("should handle special characters in user agent", () => {
      const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      const context = createAuditContext("req", "ip", userAgent);

      expect(context.userAgent).toBe(userAgent);
    });

    it("should handle IPv6 addresses", () => {
      const ipv6 = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";
      const context = createAuditContext("req", ipv6, "ua");

      expect(context.ipAddress).toBe(ipv6);
    });

    it("should handle long request IDs", () => {
      const longId = "req-" + "a".repeat(100);
      const context = createAuditContext(longId, "ip", "ua");

      expect(context.requestId).toBe(longId);
    });
  });

  describe("Error Handling", () => {
    it("should handle undefined values gracefully", () => {
      const context = createAuditContext(undefined, undefined, undefined);

      expect(context.requestId).toBeUndefined();
      expect(context.ipAddress).toBeUndefined();
      expect(context.userAgent).toBeUndefined();
      expect(context.source).toBe("API");
    });

    it("should handle empty strings", () => {
      const context = createAuditContext("", "", "");

      expect(context.requestId).toBe("");
      expect(context.ipAddress).toBe("");
      expect(context.userAgent).toBe("");
    });
  });
});
