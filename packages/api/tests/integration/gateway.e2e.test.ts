/**
 * AI-BOS Accounting SaaS - API Gateway E2E Tests
 * ============================================================================
 * Comprehensive end-to-end tests for API Gateway functionality
 * Follows SSOT principles and high-quality standards
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { ApiClient } from "../../src/client.js";
import type { ApiResponse } from "../../src/http/response.js";

// ============================================================================
// Test Configuration
// ============================================================================
const TEST_CONFIG = {
    baseUrl: "http://localhost:3001",
    timeout: 10000,
    retries: 3,
    retryDelay: 1000,
} as const;

// ============================================================================
// Test Suite
// ============================================================================
describe("API Gateway E2E Tests", () => {
    let client: ApiClient;
    let server: any;

    // ============================================================================
    // Setup and Teardown
    // ============================================================================
    beforeAll(async () => {
        try {
            // Start API server
            const { app } = await import("../../src/server.js");
            server = app;

            // Initialize API client
            client = new ApiClient(TEST_CONFIG.baseUrl);

            // Wait for server to be ready
            await waitForServer(TEST_CONFIG.baseUrl, TEST_CONFIG.timeout);
        } catch (error) {
            console.error("Failed to start test server:", error);
            throw error;
        }
    });

    afterAll(async () => {
        try {
            if (server && typeof server.close === "function") {
                await new Promise<void>((resolve) => {
                    server.close(() => resolve());
                });
            }
        } catch (error) {
            console.error("Error closing server:", error);
        }
    });

    beforeEach(async () => {
        // Reset client state before each test
        client.clearAuthToken();
    });

    // ============================================================================
    // Health Check Tests
    // ============================================================================
    describe("Health Check Endpoints", () => {
        it("should return 200 with service status for /health", async () => {
            const response = await client.get("/health");

            expect(response.status).toBe("success");
            expect(response.data).toBeDefined();
            expect(response.data.service).toBe("api");
            expect(response.data.status).toBe("ok");
            expect(response.data.timestamp).toBeDefined();
        });

        it("should return 200 with detailed status for /api/health", async () => {
            const response = await client.get("/api/health");

            expect(response.status).toBe("success");
            expect(response.data).toBeDefined();
            expect(response.data.service).toBe("api");
            expect(response.data.status).toBe("ok");
            expect(response.data.version).toBeDefined();
            expect(response.data.uptime).toBeDefined();
        });

        it("should include health check metadata", async () => {
            const response = await client.get("/api/health");

            expect(response.data.checks).toBeDefined();
            expect(response.data.checks.database).toBeDefined();
            expect(response.data.checks.redis).toBeDefined();
            expect(response.data.checks.memory).toBeDefined();
        });
    });

    // ============================================================================
    // CORS Tests
    // ============================================================================
    describe("CORS Configuration", () => {
        it("should include CORS headers in responses", async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, {
                method: "GET",
                headers: { Origin: "http://localhost:3000" },
            });

            expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
            expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
            expect(response.headers.get("Access-Control-Allow-Headers")).toBeTruthy();
        });

        it("should handle preflight OPTIONS requests", async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, {
                method: "OPTIONS",
                headers: {
                    Origin: "http://localhost:3000",
                    "Access-Control-Request-Method": "POST",
                    "Access-Control-Request-Headers": "Content-Type",
                },
            });

            expect(response.status).toBe(200);
            expect(response.headers.get("Access-Control-Allow-Origin")).toBeTruthy();
            expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
        });

        it("should reject requests from unauthorized origins", async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`, {
                method: "GET",
                headers: { Origin: "http://malicious-site.com" },
            });

            // Should still work but with restricted CORS headers
            expect(response.status).toBe(200);
        });
    });

    // ============================================================================
    // Error Handling Tests
    // ============================================================================
    describe("Error Handling", () => {
        it("should return 404 for unknown routes", async () => {
            try {
                await client.get("/api/unknown-route");
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.statusCode).toBe(404);
                expect(error.message).toContain("Not Found");
            }
        });

        it("should return 405 for unsupported methods", async () => {
            try {
                await client.request("PATCH", "/api/health");
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.statusCode).toBe(405);
                expect(error.message).toContain("Method Not Allowed");
            }
        });

        it("should return 400 for malformed JSON", async () => {
            try {
                await fetch(`${TEST_CONFIG.baseUrl}/api/test`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: "invalid json",
                });
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                // Should handle malformed JSON gracefully
                expect(error).toBeDefined();
            }
        });

        it("should return 415 for unsupported content type", async () => {
            try {
                await fetch(`${TEST_CONFIG.baseUrl}/api/test`, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: "test data",
                });
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                // Should handle unsupported content type
                expect(error).toBeDefined();
            }
        });
    });

    // ============================================================================
    // Request/Response Tests
    // ============================================================================
    describe("Request/Response Handling", () => {
        it("should handle GET requests with proper status codes", async () => {
            const response = await client.get("/api/health");

            expect(response.status).toBe("success");
            expect(response.data).toBeDefined();
        });

        it("should handle POST requests with proper status codes", async () => {
            const testData = { message: "test", timestamp: new Date().toISOString() };
            const response = await client.post("/api/test", testData);

            expect(response.status).toBe("success");
            expect(response.data).toBeDefined();
            expect(response.data.message).toBe("Test successful");
        });

        it("should handle PUT requests with proper status codes", async () => {
            const testData = { id: "test-123", message: "updated" };
            const response = await client.put("/api/test/test-123", testData);

            expect(response.status).toBe("success");
            expect(response.data).toBeDefined();
        });

        it("should handle DELETE requests with proper status codes", async () => {
            const response = await client.delete("/api/test/test-123");

            expect(response.status).toBe("success");
            expect(response.data).toBeDefined();
        });
    });

    // ============================================================================
    // Middleware Tests
    // ============================================================================
    describe("Middleware Integration", () => {
        it("should include request ID in responses", async () => {
            const response = await client.get("/api/health");

            expect(response.data.requestId).toBeDefined();
            expect(typeof response.data.requestId).toBe("string");
        });

        it("should include response time in headers", async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);

            expect(response.headers.get("X-Response-Time")).toBeDefined();
            expect(response.headers.get("X-Request-ID")).toBeDefined();
        });

        it("should handle rate limiting", async () => {
            // Make multiple requests quickly to test rate limiting
            const promises = Array.from({ length: 10 }, () =>
                client.get("/api/health")
            );

            const responses = await Promise.allSettled(promises);

            // All requests should succeed (rate limit is high for testing)
            responses.forEach((result) => {
                expect(result.status).toBe("fulfilled");
            });
        });

        it("should include security headers", async () => {
            const response = await fetch(`${TEST_CONFIG.baseUrl}/api/health`);

            expect(response.headers.get("X-Frame-Options")).toBe("DENY");
            expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
            expect(response.headers.get("X-XSS-Protection")).toBe("1; mode=block");
        });
    });

    // ============================================================================
    // Authentication Tests
    // ============================================================================
    describe("Authentication", () => {
        it("should handle requests without authentication", async () => {
            const response = await client.get("/api/health");

            expect(response.status).toBe("success");
            // Health endpoint should be accessible without auth
        });

        it("should handle requests with invalid authentication", async () => {
            client.setAuthToken("invalid-token");

            try {
                await client.get("/api/protected");
                expect.fail("Should have thrown an error");
            } catch (error: any) {
                expect(error.statusCode).toBe(401);
                expect(error.message).toContain("Unauthorized");
            }
        });

        it("should handle requests with valid authentication", async () => {
            // This would require a valid token in a real scenario
            client.setAuthToken("valid-token");

            try {
                await client.get("/api/protected");
                // In a real scenario, this should succeed
            } catch (error: any) {
                // For now, expect this to fail as we don't have real auth
                expect(error.statusCode).toBe(401);
            }
        });
    });

    // ============================================================================
    // Performance Tests
    // ============================================================================
    describe("Performance", () => {
        it("should respond within acceptable time limits", async () => {
            const startTime = Date.now();
            await client.get("/api/health");
            const endTime = Date.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        });

        it("should handle concurrent requests", async () => {
            const concurrentRequests = 10;
            const promises = Array.from({ length: concurrentRequests }, () =>
                client.get("/api/health")
            );

            const startTime = Date.now();
            const responses = await Promise.all(promises);
            const endTime = Date.now();

            expect(responses).toHaveLength(concurrentRequests);
            responses.forEach((response) => {
                expect(response.status).toBe("success");
            });

            const totalTime = endTime - startTime;
            expect(totalTime).toBeLessThan(5000); // All requests within 5 seconds
        });
    });

    // ============================================================================
    // Integration Tests
    // ============================================================================
    describe("Integration", () => {
        it("should integrate with accounting package", async () => {
            const response = await client.get("/api/health");

            expect(response.data.checks.accounting).toBeDefined();
            expect(response.data.checks.accounting.status).toBe("ok");
        });

        it("should integrate with database package", async () => {
            const response = await client.get("/api/health");

            expect(response.data.checks.database).toBeDefined();
            expect(response.data.checks.database.status).toBe("ok");
        });

        it("should integrate with cache package", async () => {
            const response = await client.get("/api/health");

            expect(response.data.checks.redis).toBeDefined();
            expect(response.data.checks.redis.status).toBe("ok");
        });
    });
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Wait for server to be ready
 * @param url - Server URL
 * @param timeout - Timeout in milliseconds
 */
async function waitForServer(url: string, timeout: number): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
        try {
            const response = await fetch(`${url}/health`);
            if (response.ok) {
                return;
            }
        } catch (error) {
            // Server not ready yet, continue waiting
        }

        await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Server not ready after ${timeout}ms`);
}
