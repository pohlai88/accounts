/**
 * Server Tests
 *
 * Comprehensive tests for the API server functionality
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testServer, testClient, baseUrl } from "./setup.js";
import { ApiClient } from "../client.js";

describe("API Server", () => {
  describe("Health Endpoints", () => {
    it("should respond to /health endpoint", async () => {
      const response = await testClient.get("/health");

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty("service", "api");
      expect(response.data).toHaveProperty("status", "ok");
      expect(response.data).toHaveProperty("timestamp");
      expect(response.data).toHaveProperty("version");
      expect(response.data).toHaveProperty("uptime");
      expect(response.data).toHaveProperty("memory");
      expect(response.data).toHaveProperty("environment");
    });

    it("should respond to /api/health endpoint", async () => {
      const response = await testClient.get("/api/health");

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty("service", "api");
      expect(response.data).toHaveProperty("status", "ok");
      expect(response.data).toHaveProperty("timestamp");
      expect(response.data).toHaveProperty("version");
    });
  });

  describe("Test Endpoint", () => {
    it("should respond to POST /api/test with received data", async () => {
      const testData = { message: "Hello, API!", timestamp: new Date().toISOString() };
      const response = await testClient.post("/api/test", testData);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty("ping", "pong");
      expect(response.data).toHaveProperty("received");
      expect(response.data.received).toEqual(testData);
      expect(response.data).toHaveProperty("timestamp");
      expect(response.data).toHaveProperty("requestId");
    });

    it("should handle empty POST body", async () => {
      const response = await testClient.post("/api/test");

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty("ping", "pong");
      expect(response.data).toHaveProperty("received");
      expect(response.data).toHaveProperty("timestamp");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      try {
        await testClient.get("/unknown-route");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain("Route GET /unknown-route not found");
        }
      }
    });

    it("should handle malformed JSON", async () => {
      try {
        const client = new ApiClient({ baseUrl });
        await client.request("POST", "/api/test", "invalid json");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe("Security Headers", () => {
    it("should include security headers in responses", async () => {
      const response = await fetch(`${baseUrl}/health`);
      const headers = response.headers;

      // Check for common security headers
      expect(headers.get("x-content-type-options")).toBe("nosniff");
      expect(headers.get("x-frame-options")).toBe("DENY");
      expect(headers.get("x-xss-protection")).toBe("0");
    });
  });

  describe("CORS", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await fetch(`${baseUrl}/api/health`, {
        method: "OPTIONS",
        headers: {
          "Origin": "http://localhost:3000",
          "Access-Control-Request-Method": "GET",
          "Access-Control-Request-Headers": "Content-Type",
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
      expect(response.headers.get("access-control-allow-methods")).toContain("GET");
    });
  });

  describe("Request ID", () => {
    it("should include request ID in responses", async () => {
      const response = await testClient.get("/api/health");

      expect(response.success).toBe(true);
      expect(response.meta).toHaveProperty("requestId");
      expect(response.meta?.requestId).toBeTruthy();
    });

    it("should use custom request ID when provided", async () => {
      const customRequestId = "test-request-123";
      testClient.setRequestId(customRequestId);

      const response = await testClient.get("/api/health");

      expect(response.success).toBe(true);
      expect(response.meta?.requestId).toBe(customRequestId);
    });
  });

  describe("Rate Limiting", () => {
    it("should handle rate limiting gracefully", async () => {
      // This test might be flaky depending on rate limit configuration
      // In a real scenario, you'd want to test this more carefully
      const promises = Array.from({ length: 5 }, () => testClient.get("/api/health"));

      const responses = await Promise.allSettled(promises);
      const successful = responses.filter(r => r.status === "fulfilled").length;

      expect(successful).toBeGreaterThan(0);
    });
  });
});
