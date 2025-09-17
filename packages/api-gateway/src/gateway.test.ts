/**
 * @aibos/api-gateway - Gateway Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import { APIGateway, defaultGatewayConfig } from "./gateway";

// Mock cache service
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  getStats: vi.fn(() => ({ hits: 0, misses: 0, sets: 0, deletes: 0, errors: 0 })),
} as any;

describe("APIGateway", () => {
  let gateway: APIGateway;
  let app: any;

  beforeEach(() => {
    vi.clearAllMocks();
    gateway = new APIGateway(mockCache, defaultGatewayConfig);
    app = gateway.getApp();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("success", true);
      expect(response.body).toHaveProperty("status", 200);
      expect(response.body.data).toHaveProperty("status", "healthy");
      expect(response.body.data).toHaveProperty("timestamp");
      expect(response.body.data).toHaveProperty("uptime");
    });
  });

  describe("CORS", () => {
    it("should handle CORS preflight requests", async () => {
      await request(app).options("/api/test").set("Origin", "http://localhost:3000").expect(204);
    });
  });

  describe("Rate Limiting", () => {
    it("should include rate limit headers", async () => {
      const response = await request(app)
        .get("/api/test")
        .set("X-Tenant-ID", "test-tenant")
        .set("X-User-ID", "test-user");

      expect(response.headers).toHaveProperty("x-ratelimit-limit");
      expect(response.headers).toHaveProperty("x-ratelimit-remaining");
      expect(response.headers).toHaveProperty("x-ratelimit-reset");
    });
  });

  describe("Request Tracking", () => {
    it("should add request ID to response", async () => {
      const response = await request(app).get("/api/test");

      expect(response.headers).toHaveProperty("x-request-id");
    });

    it("should track request statistics", async () => {
      await request(app).get("/api/test");
      await request(app).get("/api/test");

      const stats = gateway.getStats();
      expect(stats.totalRequests).toBe(2);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for unknown routes", async () => {
      const response = await request(app).get("/unknown-route").expect(404);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("status", 404);
      expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
      expect(response.body.error).toHaveProperty("message", "Route GET /unknown-route not found");
    });
  });

  describe("Authentication", () => {
    it("should require authentication headers for API routes", async () => {
      const response = await request(app).get("/api/test").expect(401);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("status", 401);
      expect(response.body.error).toHaveProperty("code", "UNAUTHORIZED");
      expect(response.body.error).toHaveProperty("message", "Missing authentication headers");
    });

    it("should allow requests with proper headers", async () => {
      const response = await request(app)
        .get("/api/test")
        .set("Authorization", "Bearer test-token")
        .set("X-Tenant-ID", "test-tenant")
        .set("X-User-ID", "test-user");

      expect(response.status).not.toBe(401);
    });
  });
});
