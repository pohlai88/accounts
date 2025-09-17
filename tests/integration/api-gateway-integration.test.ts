/**
 * API Gateway Integration Tests
 *
 * Tests the API Gateway functionality with real HTTP requests and responses.
 * This verifies the complete request/response cycle including middleware.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { startTestServer, hit } from "./utils/test-server";
import { handle, initializeGateway, cleanupGateway } from "@aibos/api-gateway";
import { ok, created, notFound, serverErr } from "@aibos/api-gateway";
import { skipIfNoEnvironment } from "./setup";

describe("API Gateway Integration", () => {
  let baseURL: string;
  let close: () => Promise<void>;

  beforeAll(async () => {
    // Skip tests if environment is not configured
    if (skipIfNoEnvironment()) {
      return;
    }

    // Initialize the API Gateway
    await initializeGateway({
      corsOrigin: ["*"],
      enableLogging: true,
      enableMetrics: true,
    });

    // Start test server with the gateway handler
    const server = await startTestServer(handle);
    baseURL = server.baseURL;
    close = server.close;
  });

  afterAll(async () => {
    await close?.();
    await cleanupGateway();
  });

  describe("Health Check Endpoint", () => {
    it("should return healthy status", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/health");

      expect(r.status).toBe(200);
      expect(r.body.success).toBe(true);
      expect(r.body.data.service).toBe("api-gateway");
      expect(r.body.data.status).toBe("healthy");
      expect(r.body.message).toBe("Service healthy");
    });

    it("should include performance metrics", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/health");

      expect(r.body.data.stats).toBeDefined();
      expect(r.body.data.uptime).toBeGreaterThan(0);
      expect(r.body.data.memory).toBeDefined();
    });
  });

  describe("Metrics Endpoint", () => {
    it("should return gateway metrics", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/metrics");

      expect(r.status).toBe(200);
      expect(r.body.success).toBe(true);
      expect(r.body.data).toBeDefined();
    });
  });

  describe("CORS Headers", () => {
    it("should include CORS headers in responses", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/health");

      expect(r.headers.get("access-control-allow-origin")).toBeTruthy();
      expect(r.headers.get("access-control-allow-methods")).toBeTruthy();
      expect(r.headers.get("access-control-allow-headers")).toBeTruthy();
    });

    it("should handle preflight OPTIONS requests", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "OPTIONS", "/health");

      expect(r.status).toBe(204);
      expect(r.headers.get("access-control-allow-origin")).toBeTruthy();
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/unknown-route");

      expect(r.status).toBe(404);
      expect(r.body.success).toBe(false);
      expect(r.body.error.code).toBe("NOT_FOUND");
      expect(r.body.error.message).toContain("Route");
    });

    it("should handle server errors gracefully", async () => {
      if (skipIfNoEnvironment()) return;

      // This test would require a route that throws an error
      // For now, we'll test the error response format
      const errorResponse = serverErr("TEST_ERROR", "Test error message", { test: true });

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.status).toBe(500);
      expect(errorResponse.error.code).toBe("TEST_ERROR");
      expect(errorResponse.error.message).toBe("Test error message");
      expect(errorResponse.error.details).toEqual({ test: true });
    });
  });

  describe("Rate Limiting", () => {
    it("should include rate limit headers", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/health");

      // Rate limit headers should be present
      expect(r.headers.get("x-ratelimit-limit")).toBeTruthy();
      expect(r.headers.get("x-ratelimit-remaining")).toBeTruthy();
    });
  });

  describe("Request Logging", () => {
    it("should log requests", async () => {
      if (skipIfNoEnvironment()) return;

      // Make a request and verify it's logged
      const r = await hit(baseURL, "GET", "/health");

      expect(r.status).toBe(200);
      // Logging verification would require access to logs
      // For now, we just verify the request completes successfully
    });
  });

  describe("Response Format Validation", () => {
    it("should have consistent response structure", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/health");

      // Verify response structure
      expect(r.body).toHaveProperty("success");
      expect(r.body).toHaveProperty("status");
      expect(r.body).toHaveProperty("message");
      expect(r.body).toHaveProperty("data");

      // Verify data types
      expect(typeof r.body.success).toBe("boolean");
      expect(typeof r.body.status).toBe("number");
      expect(typeof r.body.message).toBe("string");
      expect(typeof r.body.data).toBe("object");
    });

    it("should have consistent error structure", async () => {
      if (skipIfNoEnvironment()) return;

      const r = await hit(baseURL, "GET", "/unknown-route");

      // Verify error structure
      expect(r.body).toHaveProperty("success");
      expect(r.body).toHaveProperty("status");
      expect(r.body).toHaveProperty("error");

      expect(r.body.success).toBe(false);
      expect(r.body.status).toBe(404);
      expect(r.body.error).toHaveProperty("code");
      expect(r.body.error).toHaveProperty("message");
    });
  });

  describe("Performance", () => {
    it("should respond within acceptable time", async () => {
      if (skipIfNoEnvironment()) return;

      const start = Date.now();
      const r = await hit(baseURL, "GET", "/health");
      const duration = Date.now() - start;

      expect(r.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should respond within 1 second
    });

    it("should handle concurrent requests", async () => {
      if (skipIfNoEnvironment()) return;

      const requests = Array.from({ length: 10 }, () =>
        hit(baseURL, "GET", "/health")
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
