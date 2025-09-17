/**
 * End-to-End Tests: Authentication Workflow
 *
 * Tests the complete authentication flow including:
 * - User login
 * - Session management
 * - Token refresh
 * - Logout
 * - Error handling
 */

import { test, expect } from "@playwright/test";

test.describe("Authentication Workflow", () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the login page
        await page.goto("/login");
    });

    test("should successfully log in with valid credentials", async ({ page }) => {
        // Fill in login form
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");

        // Click login button
        await page.click('[data-testid="login-button"]');

        // Wait for redirect to dashboard
        await page.waitForURL("/dashboard");

        // Verify user is logged in
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-email"]')).toContainText("admin@demo-accounting.com");
    });

    test("should show error for invalid credentials", async ({ page }) => {
        // Fill in invalid credentials
        await page.fill('[data-testid="email-input"]', "invalid@example.com");
        await page.fill('[data-testid="password-input"]', "wrongpassword");

        // Click login button
        await page.click('[data-testid="login-button"]');

        // Verify error message is shown
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText("Email or password is incorrect");

        // Verify still on login page
        await expect(page).toHaveURL("/login");
    });

    test("should handle network errors gracefully", async ({ page }) => {
        // Mock network failure
        await page.route("**/api/auth/login", route => route.abort());

        // Fill in valid credentials
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");

        // Click login button
        await page.click('[data-testid="login-button"]');

        // Verify error message is shown
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText("Network error");
    });

    test("should automatically refresh expired tokens", async ({ page }) => {
        // Login first
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");

        // Mock token expiration
        await page.route("**/api/**", route => {
            if (route.request().headers()["authorization"]) {
                // Simulate expired token response
                route.fulfill({
                    status: 401,
                    contentType: "application/json",
                    body: JSON.stringify({
                        success: false,
                        error: {
                            type: "authentication_error",
                            title: "Token expired",
                            status: 401,
                            code: "TOKEN_EXPIRED",
                            detail: "Please refresh your token",
                        },
                        timestamp: new Date().toISOString(),
                        requestId: "test-request-id",
                    }),
                });
            } else {
                route.continue();
            }
        });

        // Try to navigate to a protected page
        await page.click('[data-testid="invoices-menu"]');

        // Should automatically refresh token and continue
        await page.waitForURL("/invoices");
        await expect(page.locator('[data-testid="invoices-page"]')).toBeVisible();
    });

    test("should logout successfully", async ({ page }) => {
        // Login first
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");

        // Click logout
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');

        // Verify redirect to login page
        await page.waitForURL("/login");

        // Verify user is logged out
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test("should redirect to login when accessing protected route without authentication", async ({ page }) => {
        // Try to access protected route directly
        await page.goto("/dashboard");

        // Should redirect to login
        await page.waitForURL("/login");
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
});
