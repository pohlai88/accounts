/**
 * End-to-End Tests: Complete User Journey
 *
 * Tests the complete user journey from login to completing key business tasks:
 * - Authentication
 * - Dashboard navigation
 * - Invoice management
 * - Billing management
 * - Report generation
 * - Logout
 */

import { test, expect } from "@playwright/test";

test.describe("Complete User Journey", () => {
    test("should complete full user workflow", async ({ page }) => {
        // Step 1: Login
        await page.goto("/login");
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");

        // Verify login success
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="dashboard-title"]')).toContainText("Dashboard");

        // Step 2: Navigate to Dashboard and verify overview
        await expect(page.locator('[data-testid="revenue-summary"]')).toBeVisible();
        await expect(page.locator('[data-testid="invoice-count"]')).toBeVisible();
        await expect(page.locator('[data-testid="pending-invoices"]')).toBeVisible();

        // Step 3: Create a new invoice
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        await page.click('[data-testid="create-invoice-button"]');
        await expect(page.locator('[data-testid="create-invoice-modal"]')).toBeVisible();

        // Fill invoice details
        const invoiceNumber = `INV-${Date.now()}`;
        await page.fill('[data-testid="invoice-number"]', invoiceNumber);
        await page.fill('[data-testid="customer-name"]', "Complete Journey Customer");
        await page.fill('[data-testid="customer-email"]', "journey@example.com");
        await page.fill('[data-testid="invoice-date"]', "2024-01-15");
        await page.fill('[data-testid="due-date"]', "2024-02-15");

        // Add line items
        await page.click('[data-testid="add-line-item"]');
        await page.fill('[data-testid="line-description"]', "Professional Services");
        await page.fill('[data-testid="line-quantity"]', "5");
        await page.fill('[data-testid="line-unit-price"]', "150.00");

        await page.click('[data-testid="save-invoice-button"]');
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

        // Verify invoice in list
        await expect(page.locator('[data-testid="invoice-item"]')).toContainText(invoiceNumber);

        // Step 4: View and manage billing
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Verify billing information is displayed
        await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="plan-name"]')).toBeVisible();

        // Update billing information
        await page.click('[data-testid="update-billing-button"]');
        await expect(page.locator('[data-testid="billing-modal"]')).toBeVisible();

        await page.fill('[data-testid="billing-address-line1"]', "456 Business Street");
        await page.fill('[data-testid="billing-city"]', "Kuala Lumpur");
        await page.fill('[data-testid="billing-postal-code"]', "50000");
        await page.selectOption('[data-testid="billing-country"]', "MY");

        await page.click('[data-testid="save-billing-button"]');
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

        // Step 5: Generate a report
        await page.click('[data-testid="reports-menu"]');
        await page.waitForURL("/reports");

        // Select report type
        await page.click('[data-testid="create-report-button"]');
        await expect(page.locator('[data-testid="report-builder-modal"]')).toBeVisible();

        await page.selectOption('[data-testid="report-type"]', "income-statement");
        await page.fill('[data-testid="report-start-date"]', "2024-01-01");
        await page.fill('[data-testid="report-end-date"]', "2024-01-31");

        await page.click('[data-testid="generate-report-button"]');

        // Wait for report generation
        await expect(page.locator('[data-testid="report-preview"]')).toBeVisible();

        // Download report
        const downloadPromise = page.waitForEvent('download');
        await page.click('[data-testid="download-report-button"]');
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/income-statement-.*\.pdf/);

        // Step 6: Navigate back to dashboard and verify updated data
        await page.click('[data-testid="dashboard-menu"]');
        await page.waitForURL("/dashboard");

        // Verify dashboard reflects new invoice
        await expect(page.locator('[data-testid="invoice-count"]')).toContainText("1");

        // Step 7: Logout
        await page.click('[data-testid="user-menu"]');
        await page.click('[data-testid="logout-button"]');

        // Verify logout
        await page.waitForURL("/login");
        await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });

    test("should handle errors gracefully throughout the journey", async ({ page }) => {
        // Login
        await page.goto("/login");
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");

        // Mock API errors for different services
        await page.route("**/api/invoices**", route => {
            route.fulfill({
                status: 503,
                contentType: "application/json",
                body: JSON.stringify({
                    success: false,
                    error: {
                        type: "service_unavailable",
                        title: "Service temporarily unavailable",
                        status: 503,
                        code: "SERVICE_UNAVAILABLE",
                        detail: "The service is temporarily unavailable. Please try again later.",
                    },
                    timestamp: new Date().toISOString(),
                    requestId: "test-request-id",
                }),
            });
        });

        // Try to access invoices
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Verify error handling
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();

        // Test retry functionality
        await page.route("**/api/invoices**", route => route.continue());
        await page.click('[data-testid="retry-button"]');

        // Verify service recovers
        await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();
    });

    test("should maintain session state across page navigation", async ({ page }) => {
        // Login
        await page.goto("/login");
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");

        // Navigate through multiple pages
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        await page.click('[data-testid="reports-menu"]');
        await page.waitForURL("/reports");

        await page.click('[data-testid="dashboard-menu"]');
        await page.waitForURL("/dashboard");

        // Verify user is still logged in
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
        await expect(page.locator('[data-testid="user-email"]')).toContainText("admin@demo-accounting.com");
    });

    test("should handle concurrent user actions", async ({ page }) => {
        // Login
        await page.goto("/login");
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");

        // Open multiple tabs/windows
        const invoicesPage = await page.context().newPage();
        await invoicesPage.goto("/invoices");

        const billingPage = await page.context().newPage();
        await billingPage.goto("/billing");

        // Perform actions in different tabs
        await page.click('[data-testid="invoices-menu"]');
        await invoicesPage.click('[data-testid="create-invoice-button"]');
        await billingPage.click('[data-testid="update-billing-button"]');

        // Verify all actions work independently
        await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();
        await expect(invoicesPage.locator('[data-testid="create-invoice-modal"]')).toBeVisible();
        await expect(billingPage.locator('[data-testid="billing-modal"]')).toBeVisible();

        // Clean up
        await invoicesPage.close();
        await billingPage.close();
    });
});
