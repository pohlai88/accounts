/**
 * API Integration Tests
 *
 * Tests the integration between frontend and backend APIs
 * Validates data flow, error handling, and response formats
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createApiClient, ApiError } from "../../packages/ui/src/lib/api-client";
import { TestDataFactory } from "../e2e/fixtures/test-data";

describe("API Integration Tests", () => {
    let apiClient: ReturnType<typeof createApiClient>;
    let authToken: string | null = null;

    beforeAll(async () => {
        // Initialize API client
        apiClient = createApiClient({
            baseUrl: process.env.API_BASE_URL || "http://localhost:3000/api",
            timeout: 10000,
            retries: 3,
            retryDelay: 1000,
        });
    });

    afterAll(async () => {
        // Cleanup
        if (authToken) {
            try {
                await apiClient.post("/auth/logout");
            } catch (error) {
                // Ignore logout errors in cleanup
            }
        }
    });

    describe("Authentication API", () => {
        it("should login successfully with valid credentials", async () => {
            const testUser = TestDataFactory.createUser();

            const response = await apiClient.post("/auth/login", {
                email: testUser.email,
                password: testUser.password,
            });

            expect(response).toHaveProperty("user");
            expect(response).toHaveProperty("accessToken");
            expect(response).toHaveProperty("refreshToken");
            expect(response).toHaveProperty("expiresAt");

            expect(response.user.email).toBe(testUser.email);
            expect(response.user.firstName).toBe(testUser.firstName);
            expect(response.user.lastName).toBe(testUser.lastName);

            // Store token for other tests
            authToken = response.accessToken;
            apiClient.setAuthTokens(response.accessToken, response.refreshToken);
        });

        it("should reject invalid credentials", async () => {
            await expect(
                apiClient.post("/auth/login", {
                    email: "invalid@example.com",
                    password: "wrongpassword",
                })
            ).rejects.toThrow(ApiError);
        });

        it("should refresh token successfully", async () => {
            if (!authToken) {
                // Login first if not already logged in
                const testUser = TestDataFactory.createUser();
                const loginResponse = await apiClient.post("/auth/login", {
                    email: testUser.email,
                    password: testUser.password,
                });
                authToken = loginResponse.accessToken;
                apiClient.setAuthTokens(loginResponse.accessToken, loginResponse.refreshToken);
            }

            const refreshResponse = await apiClient.post("/auth/refresh", {
                refreshToken: apiClient["refreshToken"],
            });

            expect(refreshResponse).toHaveProperty("user");
            expect(refreshResponse).toHaveProperty("accessToken");
            expect(refreshResponse).toHaveProperty("refreshToken");
            expect(refreshResponse).toHaveProperty("expiresAt");
        });

        it("should logout successfully", async () => {
            if (!authToken) {
                // Login first if not already logged in
                const testUser = TestDataFactory.createUser();
                const loginResponse = await apiClient.post("/auth/login", {
                    email: testUser.email,
                    password: testUser.password,
                });
                authToken = loginResponse.accessToken;
                apiClient.setAuthTokens(loginResponse.accessToken, loginResponse.refreshToken);
            }

            const logoutResponse = await apiClient.post("/auth/logout");

            expect(logoutResponse).toHaveProperty("message");
            expect(logoutResponse.message).toBe("Successfully logged out");
        });
    });

    describe("Billing API", () => {
        beforeAll(async () => {
            // Ensure we're authenticated
            if (!authToken) {
                const testUser = TestDataFactory.createUser();
                const loginResponse = await apiClient.post("/auth/login", {
                    email: testUser.email,
                    password: testUser.password,
                });
                authToken = loginResponse.accessToken;
                apiClient.setAuthTokens(loginResponse.accessToken, loginResponse.refreshToken);
            }
        });

        it("should fetch billing information", async () => {
            const billingResponse = await apiClient.get("/billing?tenantId=00000000-0000-0000-0000-000000000001");

            expect(billingResponse).toHaveProperty("subscription");
            expect(billingResponse).toHaveProperty("invoices");

            expect(billingResponse.subscription).toHaveProperty("id");
            expect(billingResponse.subscription).toHaveProperty("status");
            expect(billingResponse.subscription).toHaveProperty("plan");

            expect(Array.isArray(billingResponse.invoices)).toBe(true);
        });

        it("should update billing information", async () => {
            const billingInfo = TestDataFactory.createBillingInfo();

            const updateResponse = await apiClient.put("/billing?tenantId=00000000-0000-0000-0000-000000000001", {
                billingAddress: billingInfo,
            });

            expect(updateResponse).toHaveProperty("subscription");
            expect(updateResponse).toHaveProperty("invoices");
        });
    });

    describe("Invoice API", () => {
        beforeAll(async () => {
            // Ensure we're authenticated
            if (!authToken) {
                const testUser = TestDataFactory.createUser();
                const loginResponse = await apiClient.post("/auth/login", {
                    email: testUser.email,
                    password: testUser.password,
                });
                authToken = loginResponse.accessToken;
                apiClient.setAuthTokens(loginResponse.accessToken, loginResponse.refreshToken);
            }
        });

        it("should fetch invoices list", async () => {
            const invoicesResponse = await apiClient.get("/invoices");

            expect(invoicesResponse).toHaveProperty("invoices");
            expect(invoicesResponse).toHaveProperty("pagination");

            expect(Array.isArray(invoicesResponse.invoices)).toBe(true);
            expect(invoicesResponse.pagination).toHaveProperty("total");
            expect(invoicesResponse.pagination).toHaveProperty("totalPages");
        });

        it("should create a new invoice", async () => {
            const testInvoice = TestDataFactory.createInvoice();

            const createResponse = await apiClient.post("/invoices", testInvoice);

            expect(createResponse).toHaveProperty("id");
            expect(createResponse).toHaveProperty("number");
            expect(createResponse.number).toBe(testInvoice.number);
            expect(createResponse).toHaveProperty("customerName");
            expect(createResponse.customerName).toBe(testInvoice.customerName);
        });

        it("should reject duplicate invoice numbers", async () => {
            const testInvoice = TestDataFactory.createInvoice({
                number: "INV-DUPLICATE-TEST",
            });

            // Create first invoice
            await apiClient.post("/invoices", testInvoice);

            // Try to create duplicate
            await expect(
                apiClient.post("/invoices", testInvoice)
            ).rejects.toThrow(ApiError);
        });
    });

    describe("Error Handling", () => {
        it("should handle 404 errors correctly", async () => {
            await expect(
                apiClient.get("/nonexistent-endpoint")
            ).rejects.toThrow(ApiError);
        });

        it("should handle 500 errors correctly", async () => {
            // Mock a 500 error by calling an endpoint that might fail
            await expect(
                apiClient.get("/invoices?page=999999") // Unlikely to exist
            ).rejects.toThrow(ApiError);
        });

        it("should handle network timeouts", async () => {
            const timeoutClient = createApiClient({
                baseUrl: "http://localhost:3000/api",
                timeout: 1, // Very short timeout
                retries: 0,
            });

            await expect(
                timeoutClient.get("/invoices")
            ).rejects.toThrow();
        });

        it("should retry failed requests", async () => {
            let attemptCount = 0;
            const retryClient = createApiClient({
                baseUrl: "http://localhost:3000/api",
                timeout: 10000,
                retries: 3,
                retryDelay: 100,
            });

            // Mock a flaky endpoint
            const originalRequest = retryClient.request.bind(retryClient);
            retryClient.request = async (endpoint: string, config: any) => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error("Network error");
                }
                return originalRequest(endpoint, config);
            };

            const response = await retryClient.get("/invoices");
            expect(response).toHaveProperty("invoices");
            expect(attemptCount).toBe(3);
        });
    });

    describe("Response Format Validation", () => {
        it("should return consistent success response format", async () => {
            const testUser = TestDataFactory.createUser();
            const loginResponse = await apiClient.post("/auth/login", {
                email: testUser.email,
                password: testUser.password,
            });

            // Check response structure
            expect(loginResponse).toHaveProperty("user");
            expect(loginResponse).toHaveProperty("accessToken");
            expect(loginResponse).toHaveProperty("refreshToken");
            expect(loginResponse).toHaveProperty("expiresAt");

            // Check user object structure
            expect(loginResponse.user).toHaveProperty("id");
            expect(loginResponse.user).toHaveProperty("email");
            expect(loginResponse.user).toHaveProperty("firstName");
            expect(loginResponse.user).toHaveProperty("lastName");
            expect(loginResponse.user).toHaveProperty("role");
            expect(loginResponse.user).toHaveProperty("permissions");
            expect(loginResponse.user).toHaveProperty("tenantId");
            expect(loginResponse.user).toHaveProperty("companyId");
        });

        it("should return consistent error response format", async () => {
            try {
                await apiClient.post("/auth/login", {
                    email: "invalid@example.com",
                    password: "wrongpassword",
                });
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                expect(error.status).toBe(401);
                expect(error.code).toBe("INVALID_CREDENTIALS");
                expect(error.detail).toBeDefined();
                expect(error.requestId).toBeDefined();
            }
        });
    });
});
