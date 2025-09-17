/**
 * @aibos/api-gateway - API Gateway Response Tests
 *
 * Test standardized response format and middleware functionality
 */

import { describe, it, expect } from "vitest";
import { ok, created, notFound, serverErr, unauthorized } from "./response";

describe("API Gateway Response System", () => {
    describe("Success Responses", () => {
        it("should create OK response with data", () => {
            const data = { message: "Hello World" };
            const response = ok(data, "Success");

            expect(response).toEqual({
                success: true,
                status: 200,
                message: "Success",
                data: { message: "Hello World" },
            });
        });

        it("should create Created response", () => {
            const data = { id: "123", name: "Test" };
            const response = created(data);

            expect(response).toEqual({
                success: true,
                status: 201,
                message: "Created",
                data: { id: "123", name: "Test" },
            });
        });
    });

    describe("Error Responses", () => {
        it("should create Not Found response", () => {
            const response = notFound("RESOURCE_NOT_FOUND", "User not found");

            expect(response).toEqual({
                success: false,
                status: 404,
                error: {
                    code: "RESOURCE_NOT_FOUND",
                    message: "User not found",
                },
            });
        });

        it("should create Unauthorized response", () => {
            const response = unauthorized("INVALID_TOKEN", "Token expired");

            expect(response).toEqual({
                success: false,
                status: 401,
                error: {
                    code: "INVALID_TOKEN",
                    message: "Token expired",
                },
            });
        });

        it("should create Server Error response with details", () => {
            const details = { requestId: "req-123", timestamp: "2024-01-01T00:00:00Z" };
            const response = serverErr("DATABASE_ERROR", "Connection failed", details);

            expect(response).toEqual({
                success: false,
                status: 500,
                error: {
                    code: "DATABASE_ERROR",
                    message: "Connection failed",
                    details: { requestId: "req-123", timestamp: "2024-01-01T00:00:00Z" },
                },
            });
        });
    });

    describe("Response Format Validation", () => {
        it("should have consistent structure for all responses", () => {
            const responses = [
                ok({ test: "data" }),
                created({ id: "123" }),
                notFound("NOT_FOUND", "Not found"),
                unauthorized("UNAUTHORIZED", "Unauthorized"),
                serverErr("ERROR", "Error"),
            ];

            responses.forEach(response => {
                expect(response).toHaveProperty("success");
                expect(response).toHaveProperty("status");
                expect(typeof response.success).toBe("boolean");
                expect(typeof response.status).toBe("number");

                if (response.success) {
                    expect(response).toHaveProperty("data");
                } else {
                    expect(response).toHaveProperty("error");
                    expect(response.error).toHaveProperty("code");
                    expect(response.error).toHaveProperty("message");
                }
            });
        });
    });
});
