import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  AuditService,
  getAuditService,
  resetAuditService,
  type AuditEntry,
  type AuditContext,
  type AuditDatabase
} from "../src/audit/service";
import type { Scope } from "@aibos/db";

describe("Audit Service - Dependency Injection Tests", () => {
  const mockScope: Scope = {
    tenantId: "tenant-123",
    companyId: "company-456",
    userId: "user-789",
    userRole: "manager"
  };

  const mockAuditContext: AuditContext = {
    requestId: "req-123",
    ipAddress: "192.168.1.1",
    userAgent: "Mozilla/5.0 Test Browser",
    source: "API",
    version: "1.0.0"
  };

  let mockDatabase: AuditDatabase;
  let mockInsert: unknown;
  let mockValues: unknown;
  let mockSelect: unknown;

  beforeEach(() => {
    // Reset singleton before each test
    resetAuditService();

    // Create mock database with proper chaining
    mockValues = vi.fn().mockResolvedValue(undefined);
    mockInsert = vi.fn().mockReturnValue({ values: mockValues });

    const mockResults = [
      {
        id: "audit-1",
        tenantId: "tenant-123",
        companyId: "company-456",
        userId: "user-789",
        action: "CREATE",
        entityType: "JOURNAL",
        entityId: "journal-123",
        oldValues: null,
        newValues: '{"status": "posted"}',
        metadata: '{"operation": "test"}',
        requestId: "req-123",
        ipAddress: "192.168.1.1",
        userAgent: "test-agent",
        createdAt: new Date()
      }
    ];

    // Create a proper mock chain that resolves to the results
    const mockOffset = vi.fn().mockResolvedValue(mockResults);
    const mockLimit = vi.fn().mockReturnValue({ offset: mockOffset });
    const mockOrderBy = vi.fn().mockReturnValue({ limit: mockLimit });
    const mockWhere = vi.fn().mockReturnValue({ orderBy: mockOrderBy });
    const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
    mockSelect = vi.fn().mockReturnValue({ from: mockFrom });

    mockDatabase = {
      insert: mockInsert,
      select: mockSelect
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    resetAuditService();
  });

  describe("AuditService Constructor", () => {
    it("should create audit service with injected database", () => {
      const auditService = new AuditService(mockDatabase);
      expect(auditService).toBeInstanceOf(AuditService);
    });

    it("should create audit service without database (uses environment)", () => {
      process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

      // This will try to create a real connection, but we're just testing the constructor
      expect(() => new AuditService()).not.toThrow();
    });

    it("should throw error without DATABASE_URL and no injected database", () => {
      delete process.env.DATABASE_URL;

      expect(() => new AuditService()).toThrow("DATABASE_URL environment variable is required");
    });
  });

  describe("Singleton Pattern with Dependency Injection", () => {
    it("should return same instance on multiple calls", () => {
      const service1 = getAuditService(mockDatabase);
      const service2 = getAuditService();

      expect(service1).toBe(service2);
    });

    it("should reset singleton instance", () => {
      const service1 = getAuditService(mockDatabase);
      resetAuditService();
      const service2 = getAuditService(mockDatabase);

      expect(service1).not.toBe(service2);
    });
  });

  describe("logOperation", () => {
    let auditService: AuditService;

    beforeEach(() => {
      auditService = new AuditService(mockDatabase);
    });

    it("should log basic operation", async () => {
      const entry: AuditEntry = {
        scope: mockScope,
        action: "CREATE",
        entityType: "JOURNAL",
        entityId: "journal-123"
      };

      await auditService.logOperation(entry);

      expect(mockInsert).toHaveBeenCalled();
      expect(mockValues).toHaveBeenCalledWith({
        tenantId: mockScope.tenantId,
        companyId: mockScope.companyId,
        userId: mockScope.userId,
        action: "CREATE",
        entityType: "JOURNAL",
        entityId: "journal-123",
        oldValues: null,
        newValues: null,
        metadata: null,
        requestId: undefined,
        ipAddress: undefined,
        userAgent: undefined
      });
    });

    it("should log operation with full data", async () => {
      const entry: AuditEntry = {
        scope: mockScope,
        action: "UPDATE",
        entityType: "JOURNAL",
        entityId: "journal-123",
        oldValues: { status: "draft" },
        newValues: { status: "posted" },
        metadata: { reason: "approved" },
        context: mockAuditContext
      };

      await auditService.logOperation(entry);

      expect(mockValues).toHaveBeenCalledWith({
        tenantId: mockScope.tenantId,
        companyId: mockScope.companyId,
        userId: mockScope.userId,
        action: "UPDATE",
        entityType: "JOURNAL",
        entityId: "journal-123",
        oldValues: JSON.stringify({ status: "draft" }),
        newValues: JSON.stringify({ status: "posted" }),
        metadata: JSON.stringify({
          reason: "approved",
          context: mockAuditContext
        }),
        requestId: mockAuditContext.requestId,
        ipAddress: mockAuditContext.ipAddress,
        userAgent: mockAuditContext.userAgent
      });
    });

    it("should handle database errors gracefully", async () => {
      mockValues.mockRejectedValue(new Error("Database error"));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

      const entry: AuditEntry = {
        scope: mockScope,
        action: "CREATE",
        entityType: "JOURNAL",
        entityId: "journal-123"
      };

      // Should not throw
      await expect(auditService.logOperation(entry)).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalledWith('Audit logging failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe("logJournalPosting", () => {
    let auditService: AuditService;

    beforeEach(() => {
      auditService = new AuditService(mockDatabase);
    });

    it("should log journal posting with metadata", async () => {
      const journalData = {
        journalNumber: "JE-001",
        currency: "MYR",
        totalDebit: 1000,
        totalCredit: 1000,
        lines: [
          { accountId: "acc1", debit: 1000, credit: 0 },
          { accountId: "acc2", debit: 0, credit: 1000 }
        ],
        requiresApproval: false,
        status: "posted"
      };

      await auditService.logJournalPosting(
        mockScope,
        "journal-123",
        journalData,
        "POST",
        mockAuditContext
      );

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: mockScope.tenantId,
          action: "POST",
          entityType: "JOURNAL",
          entityId: "journal-123",
          newValues: JSON.stringify(journalData),
          metadata: JSON.stringify({
            operation: "journal_posting",
            journalNumber: "JE-001",
            currency: "MYR",
            totalDebit: 1000,
            totalCredit: 1000,
            lineCount: 2,
            requiresApproval: false,
            status: "posted",
            context: mockAuditContext
          })
        })
      );
    });
  });

  describe("queryAuditLogs", () => {
    let auditService: AuditService;

    beforeEach(() => {
      auditService = new AuditService(mockDatabase);
    });

    it("should query audit logs with filters", async () => {
      const results = await auditService.queryAuditLogs(mockScope, {
        entityType: "JOURNAL",
        limit: 10
      });

      expect(mockSelect).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        id: "audit-1",
        tenantId: "tenant-123",
        action: "CREATE",
        entityType: "JOURNAL"
      });
    });

    it("should get entity audit trail", async () => {
      const results = await auditService.getEntityAuditTrail(
        mockScope,
        "JOURNAL",
        "journal-123"
      );

      expect(results).toHaveLength(1);
      expect(results[0].entityId).toBe("journal-123");
    });
  });

  describe("Specialized Logging Methods", () => {
    let auditService: AuditService;

    beforeEach(() => {
      auditService = new AuditService(mockDatabase);
    });

    it("should log COA validation", async () => {
      await auditService.logCOAValidation(
        mockScope,
        ["acc1", "acc2"],
        "SUCCESS",
        [{ accountId: "acc1", warning: "Unusual balance" }],
        [],
        mockAuditContext
      );

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "VALIDATE",
          entityType: "ACCOUNT",
          metadata: expect.stringContaining("coa_validation")
        })
      );
    });

    it("should log idempotency usage", async () => {
      await auditService.logIdempotencyUsage(
        mockScope,
        "idem-key-123",
        "CREATE",
        "JOURNAL",
        "journal-456",
        mockAuditContext
      );

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "CREATE",
          entityType: "IDEMPOTENCY_KEY",
          entityId: "idem-key-123"
        })
      );
    });

    it("should log SoD compliance", async () => {
      await auditService.logSoDCompliance(
        mockScope,
        "journal:post",
        "ALLOWED",
        undefined,
        mockAuditContext
      );

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "VALIDATE",
          entityType: "USER",
          entityId: mockScope.userId
        })
      );
    });

    it("should log security events", async () => {
      await auditService.logSecurityEvent(
        mockScope,
        "AUTH_FAILURE",
        { reason: "invalid_token" },
        mockAuditContext
      );

      expect(mockValues).toHaveBeenCalledWith(
        expect.objectContaining({
          action: "VALIDATE",
          entityType: "USER",
          metadata: expect.stringContaining("security_event")
        })
      );
    });
  });

  describe("Edge Cases", () => {
    let auditService: AuditService;

    beforeEach(() => {
      auditService = new AuditService(mockDatabase);
    });

    it("should handle null values gracefully", async () => {
      const entry: AuditEntry = {
        scope: mockScope,
        action: "DELETE",
        entityType: "JOURNAL",
        entityId: "journal-123",
        oldValues: null,
        newValues: null,
        metadata: null,
        context: undefined
      };

      await expect(auditService.logOperation(entry)).resolves.toBeUndefined();
    });

    it("should handle large metadata objects", async () => {
      const largeMetadata = {
        data: "x".repeat(10000),
        nested: { deep: { object: { value: "test" } } }
      };

      const entry: AuditEntry = {
        scope: mockScope,
        action: "CREATE",
        entityType: "JOURNAL",
        entityId: "journal-123",
        metadata: largeMetadata
      };

      await expect(auditService.logOperation(entry)).resolves.toBeUndefined();
    });
  });
});
