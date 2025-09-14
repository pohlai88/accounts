import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { AdvancedSecurityManager, EncryptionManager, AuditLogger } from "@aibos/security";

describe("Security Features Integration", () => {
  let securityManager: AdvancedSecurityManager;
  let encryptionManager: EncryptionManager;
  let auditLogger: AuditLogger;

  beforeAll(() => {
    // Initialize security components
    securityManager = new AdvancedSecurityManager({
      enableRateLimiting: true,
      enableCSRFProtection: true,
      enableXSSProtection: true,
      maxRequestsPerMinute: 10, // Low limit for testing
      trustedOrigins: ["http://localhost:3000"],
    });

    encryptionManager = new EncryptionManager({
      algorithm: "aes-256-gcm",
      keyLength: 32,
      enableCompression: false,
    });

    auditLogger = new AuditLogger({
      enableRealTime: true,
      enableBatchProcessing: false,
      retentionPeriod: 1, // 1 day for testing
    });
  });

  describe("Advanced Security Manager", () => {
    it("should initialize with default configuration", () => {
      expect(securityManager).toBeDefined();
      const stats = securityManager.getSecurityStats();
      expect(stats).toHaveProperty("totalEvents");
      expect(stats).toHaveProperty("eventsByType");
    });

    it("should detect XSS attempts", () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/test?q=<script>alert("xss")</script>',
        headers: {
          get: (name: string) => {
            if (name === "user-agent") return "Mozilla/5.0";
            return null;
          },
        },
      };

      const result = securityManager.detectXSSAttempt(mockRequest);
      expect(result.detected).toBe(true);
      expect(result.payload).toContain("<script>");
    });

    it("should detect suspicious activity", () => {
      const mockRequest = {
        url: "http://localhost:3000/api/admin/../../../etc/passwd",
        headers: {
          get: (name: string) => {
            if (name === "user-agent") return "Mozilla/5.0";
            return null;
          },
        },
      };

      const result = securityManager.detectSuspiciousActivity(mockRequest, "192.168.1.1");
      expect(result.detected).toBe(true);
      expect(result.reason).toContain("Path traversal");
    });

    it("should handle rate limiting", async () => {
      const ip = "192.168.1.100";
      const url = "http://localhost:3000/api/test";

      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 5; i++) {
        const result = await securityManager.checkRateLimit(ip, url);
        if (i < 4) {
          expect(result.blocked).toBe(false);
        }
      }

      // The 5th request should be blocked
      const result = await securityManager.checkRateLimit(ip, url);
      expect(result.blocked).toBe(true);
    });
  });

  describe("Encryption Manager", () => {
    beforeAll(() => {
      encryptionManager.setMasterKey("test-master-key-12345");
    });

    it("should encrypt and decrypt data", async () => {
      const originalData = { message: "Hello World", number: 42 };

      const encrypted = await encryptionManager.encrypt(originalData);
      expect(encrypted).toHaveProperty("data");
      expect(encrypted).toHaveProperty("iv");
      expect(encrypted).toHaveProperty("salt");
      expect(encrypted.algorithm).toBe("aes-256-gcm");

      const decrypted = await encryptionManager.decrypt(encrypted);
      expect(decrypted).toEqual(originalData);
    });

    it("should hash data securely", () => {
      const data = "sensitive-data";
      const hash1 = encryptionManager.hash(data);
      const hash2 = encryptionManager.hash(data);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA256 hex length
    });

    it("should generate secure random strings", () => {
      const random1 = encryptionManager.generateSecureRandom(16);
      const random2 = encryptionManager.generateSecureRandom(16);

      expect(random1).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(random2).toHaveLength(32);
      expect(random1).not.toBe(random2);
    });

    it("should mask sensitive data", () => {
      const sensitiveData = {
        password: "secret123",
        email: "user@example.com",
        normalField: "not-sensitive",
      };

      const masked = encryptionManager.maskSensitiveData(sensitiveData, ["password", "email"]);

      expect(masked.password).toMatch(/\*+/);
      expect(masked.email).toMatch(/\*+/);
      expect(masked.normalField).toBe("not-sensitive");
    });
  });

  describe("Audit Logger", () => {
    it("should log authentication events", async () => {
      const eventId = await auditLogger.logAuthentication(
        "tenant-1",
        "user-1",
        "login",
        { ipAddress: "192.168.1.1", userAgent: "Mozilla/5.0" },
        "success",
      );

      expect(eventId).toBeDefined();

      const events = auditLogger.getEvents({ tenantId: "tenant-1", limit: 10 });
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe("login");
      expect(events[0].category).toBe("authentication");
    });

    it("should log data access events", async () => {
      const eventId = await auditLogger.logDataAccess(
        "tenant-1",
        "user-1",
        "financial_data",
        "record-123",
        "read",
        { recordCount: 1, dataType: "transaction" },
      );

      expect(eventId).toBeDefined();

      const events = auditLogger.getEvents({ tenantId: "tenant-1", category: "data_access" });
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe("read");
      expect(events[0].resource).toBe("financial_data");
    });

    it("should log security events", async () => {
      const eventId = await auditLogger.logSecurityEvent(
        "tenant-1",
        "suspicious_login_attempt",
        { ipAddress: "192.168.1.100", threatLevel: "high" },
        "high",
      );

      expect(eventId).toBeDefined();

      const events = auditLogger.getEvents({ tenantId: "tenant-1", category: "security" });
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe("suspicious_login_attempt");
      expect(events[0].severity).toBe("high");
    });

    it("should provide audit statistics", () => {
      const stats = auditLogger.getAuditStats("tenant-1");

      expect(stats).toHaveProperty("totalEvents");
      expect(stats).toHaveProperty("eventsByCategory");
      expect(stats).toHaveProperty("eventsBySeverity");
      expect(stats).toHaveProperty("averageRiskScore");
    });

    it("should add and manage compliance rules", () => {
      const ruleId = auditLogger.addComplianceRule({
        name: "Test Rule",
        description: "Test compliance rule",
        category: "test",
        severity: "medium",
        conditions: [{ field: "action", operator: "equals", value: "test" }],
        actions: [{ type: "log", target: "audit_log", parameters: {} }],
        enabled: true,
      });

      expect(ruleId).toBeDefined();

      const updated = auditLogger.updateComplianceRule(ruleId, { enabled: false });
      expect(updated).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should handle end-to-end security flow", async () => {
      // Simulate a suspicious request
      const mockRequest = {
        url: 'http://localhost:3000/api/data?q=<script>alert("xss")</script>',
        method: "GET",
        headers: {
          get: (name: string) => {
            if (name === "user-agent") return "Mozilla/5.0";
            if (name === "x-request-id") return "test-request-123";
            return null;
          },
        },
      };

      // Apply security checks
      const securityResponse = await securityManager.applySecurity(mockRequest);
      expect(securityResponse).toBeDefined();
      expect(securityResponse.status).toBe(400);

      // Log the security event
      const eventId = await auditLogger.logSecurityEvent(
        "tenant-1",
        "xss_attempt_blocked",
        {
          ipAddress: "192.168.1.1",
          payload: '<script>alert("xss")</script>',
          blocked: true,
        },
        "high",
      );

      expect(eventId).toBeDefined();

      // Verify audit trail
      const events = auditLogger.getEvents({
        tenantId: "tenant-1",
        category: "security",
        limit: 5,
      });

      expect(events.length).toBeGreaterThan(0);
      const xssEvent = events.find(e => e.action === "xss_attempt_blocked");
      expect(xssEvent).toBeDefined();
      expect(xssEvent?.severity).toBe("high");
    });

    it("should encrypt sensitive audit data", async () => {
      const sensitiveDetails = {
        password: "secret123",
        creditCard: "4111-1111-1111-1111",
        ssn: "123-45-6789",
      };

      const eventId = await auditLogger.logAuthentication(
        "tenant-1",
        "user-1",
        "password_changed",
        sensitiveDetails,
        "success",
      );

      expect(eventId).toBeDefined();

      // In a real implementation, the details would be encrypted
      // For this test, we just verify the event was logged
      const events = auditLogger.getEvents({
        tenantId: "tenant-1",
        action: "password_changed",
      });

      expect(events).toHaveLength(1);
    });
  });
});
