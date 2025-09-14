// Idempotency Integration Tests
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  createIdempotencyManager,
  defaultIdempotencyConfig,
} from "../../packages/utils/src/idempotency";
import { createCacheManager, defaultCacheConfig } from "../../packages/utils/src/cache";

describe("Idempotency Integration", () => {
  let idempotencyManager: any;
  let cacheManager: any;

  beforeAll(async () => {
    // Initialize cache manager
    cacheManager = createCacheManager({
      ...defaultCacheConfig,
      host: "memory", // Use memory cache for testing
    });
    await cacheManager.connect();

    // Initialize idempotency manager
    idempotencyManager = createIdempotencyManager(
      {
        ...defaultIdempotencyConfig,
        storage: "memory",
      },
      cacheManager,
    );
  });

  afterAll(async () => {
    await cacheManager.disconnect();
  });

  describe("Basic Idempotency", () => {
    it("should execute new operation", async () => {
      const key = "test-key-1";
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "test-operation";
      const requestData = { test: "data" };

      let executionCount = 0;
      const operationFn = async () => {
        executionCount++;
        return { result: "success", executionCount };
      };

      const result = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result.isNew).toBe(true);
      expect(result.status).toBe("completed");
      expect(result.response.result).toBe("success");
      expect(result.response.executionCount).toBe(1);
      expect(executionCount).toBe(1);
    });

    it("should return cached result for duplicate operation", async () => {
      const key = "test-key-2";
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "test-operation";
      const requestData = { test: "data" };

      let executionCount = 0;
      const operationFn = async () => {
        executionCount++;
        return { result: "success", executionCount };
      };

      // First execution
      const result1 = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result1.isNew).toBe(true);
      expect(result1.status).toBe("completed");
      expect(executionCount).toBe(1);

      // Second execution with same key and data
      const result2 = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result2.isNew).toBe(false);
      expect(result2.status).toBe("completed");
      expect(result2.response.result).toBe("success");
      expect(result2.response.executionCount).toBe(1); // Should be cached value
      expect(executionCount).toBe(1); // Function should not be called again
    });

    it("should reject different request data for same key", async () => {
      const key = "test-key-3";
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "test-operation";

      const operationFn = async () => ({ result: "success" });

      // First execution
      await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        { test: "data1" },
        operationFn,
      );

      // Second execution with different data should fail
      await expect(
        idempotencyManager.execute(
          key,
          userId,
          tenantId,
          operation,
          { test: "data2" }, // Different data
          operationFn,
        ),
      ).rejects.toThrow("Idempotency key exists with different request data");
    });
  });

  describe("Error Handling", () => {
    it("should handle operation errors", async () => {
      const key = "error-key-1";
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "error-operation";
      const requestData = { test: "data" };

      const operationFn = async () => {
        throw new Error("Operation failed");
      };

      const result = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result.isNew).toBe(true);
      expect(result.status).toBe("failed");
      expect(result.error).toBe("Operation failed");
    });

    it("should return cached error for duplicate failed operation", async () => {
      const key = "error-key-2";
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "error-operation";
      const requestData = { test: "data" };

      let executionCount = 0;
      const operationFn = async () => {
        executionCount++;
        throw new Error("Operation failed");
      };

      // First execution
      const result1 = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result1.isNew).toBe(true);
      expect(result1.status).toBe("failed");
      expect(executionCount).toBe(1);

      // Second execution should return cached error
      const result2 = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result2.isNew).toBe(false);
      expect(result2.status).toBe("failed");
      expect(result2.error).toBe("Operation failed");
      expect(executionCount).toBe(1); // Function should not be called again
    });
  });

  describe("Retry Logic", () => {
    it("should handle retry logic", async () => {
      const key = "retry-key-1";
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "retry-operation";
      const requestData = { test: "data" };

      let executionCount = 0;
      const operationFn = async () => {
        executionCount++;
        return { result: "success", executionCount };
      };

      // First execution should succeed
      const result1 = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result1.isNew).toBe(true);
      expect(result1.status).toBe("completed");
      expect(executionCount).toBe(1);

      // Second execution should return cached result
      const result2 = await idempotencyManager.execute(
        key,
        userId,
        tenantId,
        operation,
        requestData,
        operationFn,
      );

      expect(result2.isNew).toBe(false);
      expect(result2.status).toBe("completed");
      expect(result2.response.executionCount).toBe(1); // Should be cached value
      expect(executionCount).toBe(1); // Function should not be called again
    });
  });

  describe("Key Management", () => {
    it("should generate consistent keys", async () => {
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "test-operation";
      const requestData = { test: "data" };

      const key1 = idempotencyManager.generateKey(userId, tenantId, operation, requestData);
      const key2 = idempotencyManager.generateKey(userId, tenantId, operation, requestData);

      expect(key1).toBe(key2);
      expect(key1).toMatch(/^[a-f0-9]{64}$/); // Should be 64-character hex string
    });

    it("should generate different keys for different data", async () => {
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "test-operation";

      const key1 = idempotencyManager.generateKey(userId, tenantId, operation, { test: "data1" });
      const key2 = idempotencyManager.generateKey(userId, tenantId, operation, { test: "data2" });

      expect(key1).not.toBe(key2);
    });

    it("should get and delete keys", async () => {
      const key = "management-key-1";
      const userId = "user-123";
      const tenantId = "tenant-123";
      const operation = "test-operation";
      const requestData = { test: "data" };

      const operationFn = async () => ({ result: "success" });

      // Execute operation
      await idempotencyManager.execute(key, userId, tenantId, operation, requestData, operationFn);

      // Get status
      const status = await idempotencyManager.getStatus(key);
      expect(status).toBeDefined();
      expect(status.status).toBe("completed");

      // Delete key
      const deleted = await idempotencyManager.delete(key);
      expect(deleted).toBe(true);

      // Should not exist anymore
      const statusAfterDelete = await idempotencyManager.getStatus(key);
      expect(statusAfterDelete).toBeNull();
    });
  });
});
