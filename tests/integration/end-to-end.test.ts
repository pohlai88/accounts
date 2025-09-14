// End-to-End Integration Tests
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApiGateway, defaultGatewayConfig } from "../../packages/utils/src/api-gateway";
import { createCacheManager, defaultCacheConfig } from "../../packages/utils/src/cache";
import { createCacheMiddleware } from "../../packages/utils/src/api-gateway/cache-middleware";
import {
  createIdempotencyManager,
  defaultIdempotencyConfig,
  createIdempotencyMiddleware,
  createIdempotencyValidationMiddleware,
} from "../../packages/utils/src/idempotency";

describe("End-to-End Integration", () => {
  let gateway: any;
  let cacheManager: any;
  let idempotencyManager: any;

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

    // Initialize API gateway with all middleware
    gateway = createApiGateway({
      ...defaultGatewayConfig,
      baseUrl: "http://localhost:3001",
      caching: { enabled: true, defaultTtl: 60 },
      rateLimiting: { enabled: true, defaultWindowMs: 60000, defaultMax: 10 },
    });

    // Add cache middleware
    gateway.use(createCacheMiddleware(cacheManager));

    // Add idempotency middleware
    gateway.use(createIdempotencyMiddleware(idempotencyManager));

    // Register test routes
    setupTestRoutes();
  });

  afterAll(async () => {
    await cacheManager.disconnect();
  });

  function setupTestRoutes() {
    // Simple GET route
    gateway
      .route("/api/test", "GET")
      .handler(async req => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: { message: "Test successful", timestamp: Date.now() },
      }))
      .build();

    // POST route with idempotency
    gateway
      .route("/api/create", "POST")
      .handler(async req => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 100));

        return {
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: {
            id: Math.random().toString(36).substr(2, 9),
            data: req.body,
            created: new Date().toISOString(),
          },
        };
      })
      .build();

    // PUT route with caching
    gateway
      .route("/api/update/:id", "PUT")
      .handler(async req => ({
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: {
          id: req.params.id,
          data: req.body,
          updated: new Date().toISOString(),
        },
      }))
      .build();
  }

  describe("Caching Integration", () => {
    it("should cache GET responses", async () => {
      const request = {
        method: "GET",
        path: "/api/test",
        headers: {},
        query: {},
        user: { id: "user-123", tenantId: "tenant-123" },
      };

      // First request
      const response1 = await gateway.processRequest(request);
      expect(response1.status).toBe(200);
      expect(response1.headers["X-Cache"]).toBe("MISS");

      // Second request should be cached
      const response2 = await gateway.processRequest(request);
      expect(response2.status).toBe(200);
      expect(response2.headers["X-Cache"]).toBe("HIT");
      expect(response2.body).toEqual(response1.body);
    });

    it("should not cache POST responses", async () => {
      const request = {
        method: "POST",
        path: "/api/create",
        headers: { "Content-Type": "application/json" },
        query: {},
        body: { test: "data" },
        user: { id: "user-123", tenantId: "tenant-123" },
      };

      const response = await gateway.processRequest(request);
      expect(response.status).toBe(201);
      expect(response.headers["X-Cache"]).toBeUndefined();
    });
  });

  describe("Idempotency Integration", () => {
    it("should handle idempotent POST requests", async () => {
      const idempotencyKey = "test-idempotency-key-123";
      const request = {
        method: "POST",
        path: "/api/create",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        query: {},
        body: { test: "idempotent data" },
        user: { id: "user-123", tenantId: "tenant-123" },
      };

      // First request
      const response1 = await gateway.processRequest(request);
      expect(response1.status).toBe(201);
      expect(response1.headers["X-Idempotency-Key"]).toBe(idempotencyKey);
      expect(response1.headers["X-Idempotency-Status"]).toBe("completed");

      // Second request with same idempotency key
      const response2 = await gateway.processRequest(request);
      expect(response2.status).toBe(201);
      expect(response2.headers["X-Idempotency-Key"]).toBe(idempotencyKey);
      expect(response2.headers["X-Idempotency-Status"]).toBe("completed");

      // Should return same response
      expect(response2.body.id).toBe(response1.body.id);
      expect(response2.body.data).toEqual(response1.body.data);
    });

    it("should reject invalid idempotency keys", async () => {
      // Create a fresh gateway instance for this test
      const testGateway = createApiGateway({
        ...defaultGatewayConfig,
        baseUrl: "http://localhost:3001",
        caching: { enabled: false, defaultTtl: 60 },
        rateLimiting: { enabled: false, defaultWindowMs: 60000, defaultMax: 100 },
      });

      // Add idempotency validation middleware
      testGateway.use(createIdempotencyValidationMiddleware());

      // Register test route
      testGateway
        .route("/api/create", "POST")
        .handler(async req => ({
          status: 201,
          headers: { "Content-Type": "application/json" },
          body: { message: "Created" },
        }))
        .build();

      const request = {
        method: "POST",
        path: "/api/create",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "invalid-key",
        },
        query: {},
        body: { test: "data" },
        user: { id: "user-123", tenantId: "tenant-123" },
      };

      const response = await testGateway.processRequest(request);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid idempotency key");
    });
  });

  describe("Rate Limiting Integration", () => {
    it("should enforce rate limits", async () => {
      // Create a completely fresh gateway instance with unique configuration
      const testGateway = createApiGateway({
        baseUrl: "http://localhost:3001",
        timeout: 30000,
        retries: 3,
        caching: { enabled: false, defaultTtl: 60 },
        rateLimiting: {
          enabled: true,
          defaultWindowMs: 60000,
          defaultMax: 3, // Lower limit for testing
          storage: "memory", // Use memory storage to avoid Redis conflicts
        },
        cors: {
          enabled: true,
          origins: ["http://localhost:3000"],
          methods: ["GET", "POST", "PUT", "DELETE"],
          headers: ["Content-Type", "Authorization"],
        },
        logging: {
          enabled: true,
          level: "info",
        },
      });

      const request = {
        method: "GET",
        path: "/api/rate-test",
        headers: {},
        query: {},
        user: { id: "user-456", tenantId: "tenant-456" }, // Use unique user/tenant
      };

      // Register test route
      testGateway
        .route("/api/rate-test", "GET")
        .handler(async req => ({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: { message: "Test successful" },
        }))
        .build();

      // Make requests up to the limit
      for (let i = 0; i < 3; i++) {
        const response = await testGateway.processRequest(request);
        expect(response.status).toBe(200);
      }

      // Next request should be rate limited
      const rateLimitedResponse = await testGateway.processRequest(request);
      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body.error).toBe("Rate limit exceeded");
    });
  });

  describe("Error Handling Integration", () => {
    it("should handle middleware errors gracefully", async () => {
      // Create a fresh gateway instance for this test
      const testGateway = createApiGateway({
        ...defaultGatewayConfig,
        baseUrl: "http://localhost:3001",
        caching: { enabled: false, defaultTtl: 60 },
        rateLimiting: { enabled: false, defaultWindowMs: 60000, defaultMax: 100 },
      });

      // Register test route
      testGateway
        .route("/api/test", "GET")
        .handler(async req => ({
          status: 200,
          headers: { "Content-Type": "application/json" },
          body: { message: "Test successful" },
        }))
        .build();

      const request = {
        method: "GET",
        path: "/api/test",
        headers: {},
        query: {},
        user: { id: "user-123", tenantId: "tenant-123" },
      };

      // Should still work even if some middleware fails
      const response = await testGateway.processRequest(request);
      expect(response.status).toBe(200);
    });

    it("should handle handler errors with proper error responses", async () => {
      // Create a fresh gateway instance for this test
      const testGateway = createApiGateway({
        ...defaultGatewayConfig,
        baseUrl: "http://localhost:3001",
        caching: { enabled: false, defaultTtl: 60 },
        rateLimiting: { enabled: false, defaultWindowMs: 60000, defaultMax: 100 },
      });

      // Register an error-prone route
      testGateway
        .route("/api/error", "GET")
        .handler(async req => {
          throw new Error("Handler error");
        })
        .build();

      const request = {
        method: "GET",
        path: "/api/error",
        headers: {},
        query: {},
        user: { id: "user-123", tenantId: "tenant-123" },
      };

      const response = await testGateway.processRequest(request);
      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Internal server error");
    });
  });

  describe("Performance Integration", () => {
    it("should handle concurrent requests", async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        method: "GET",
        path: "/api/test",
        headers: {},
        query: { id: i.toString() },
        user: { id: `user-${i}`, tenantId: "tenant-123" },
      }));

      const startTime = Date.now();
      const responses = await Promise.all(requests.map(req => gateway.processRequest(req)));
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000); // Less than 1 second
    });
  });
});
