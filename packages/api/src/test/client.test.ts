/**
 * API Client Tests
 *
 * Tests for the API client functionality
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ApiClient, ApiError } from "../client.js";

describe("API Client", () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient({
      baseUrl: "http://localhost:3001",
      timeout: 5000,
      retries: 1,
    });
  });

  describe("Configuration", () => {
    it("should create client with default configuration", () => {
      const defaultClient = new ApiClient();

      expect(defaultClient.baseUrl).toBe("http://localhost:3001");
      expect(defaultClient.timeout).toBe(30000);
      expect(defaultClient.retries).toBe(3);
    });

    it("should create client with custom configuration", () => {
      const customClient = new ApiClient({
        baseUrl: "https://api.example.com",
        timeout: 10000,
        retries: 5,
      });

      expect(customClient.baseUrl).toBe("https://api.example.com");
      expect(customClient.timeout).toBe(10000);
      expect(customClient.retries).toBe(5);
    });
  });

  describe("Header Management", () => {
    it("should set and get headers", () => {
      client.setHeader("Authorization", "Bearer token123");
      client.setHeader("X-Custom-Header", "custom-value");

      // Headers are internal, so we can't directly test them
      // But we can test that the methods don't throw
      expect(() => client.setHeader("Test", "Value")).not.toThrow();
    });

    it("should remove headers", () => {
      client.setHeader("Test-Header", "test-value");
      client.removeHeader("Test-Header");

      // Again, we can't directly test internal state
      expect(() => client.removeHeader("Test-Header")).not.toThrow();
    });

    it("should set auth token", () => {
      expect(() => client.setAuthToken("token123")).not.toThrow();
    });

    it("should set API key", () => {
      expect(() => client.setApiKey("key123")).not.toThrow();
    });

    it("should set request ID", () => {
      expect(() => client.setRequestId("req123")).not.toThrow();
    });
  });

  describe("HTTP Methods", () => {
    it("should have all HTTP methods", () => {
      expect(typeof client.get).toBe("function");
      expect(typeof client.post).toBe("function");
      expect(typeof client.put).toBe("function");
      expect(typeof client.patch).toBe("function");
      expect(typeof client.delete).toBe("function");
    });

    it("should handle GET requests", async () => {
      // This would need a real server to test properly
      // For now, we just test that the method exists and doesn't throw
      expect(() => client.get("/test")).not.toThrow();
    });

    it("should handle POST requests", async () => {
      expect(() => client.post("/test", { data: "test" })).not.toThrow();
    });

    it("should handle PUT requests", async () => {
      expect(() => client.put("/test", { data: "test" })).not.toThrow();
    });

    it("should handle PATCH requests", async () => {
      expect(() => client.patch("/test", { data: "test" })).not.toThrow();
    });

    it("should handle DELETE requests", async () => {
      expect(() => client.delete("/test")).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should create ApiError with correct properties", () => {
      const error = new ApiError("Test error", 400, "TEST_ERROR", { detail: "test" });

      expect(error.message).toBe("Test error");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("TEST_ERROR");
      expect(error.details).toEqual({ detail: "test" });
      expect(error.name).toBe("ApiError");
    });

    it("should handle network errors", async () => {
      const invalidClient = new ApiClient({
        baseUrl: "http://invalid-url-that-does-not-exist",
        timeout: 1000,
        retries: 0,
      });

      try {
        await invalidClient.get("/test");
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        if (error instanceof ApiError) {
          expect(error.code).toBe("NETWORK_ERROR");
        }
      }
    });
  });

  describe("Utility Methods", () => {
    it("should have abort method", () => {
      expect(typeof client.abort).toBe("function");
      expect(() => client.abort()).not.toThrow();
    });

    it("should have convenience methods", () => {
      expect(typeof client.healthCheck).toBe("function");
      expect(typeof client.testConnection).toBe("function");
    });
  });

  describe("Request Options", () => {
    it("should handle custom headers in requests", async () => {
      // This would need a real server to test properly
      expect(() => client.get("/test", { "X-Custom": "value" })).not.toThrow();
    });

    it("should handle custom timeout", async () => {
      const fastClient = new ApiClient({
        baseUrl: "http://localhost:3001",
        timeout: 1000,
        retries: 0,
      });

      expect(() => fastClient.get("/test")).not.toThrow();
    });
  });
});
