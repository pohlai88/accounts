/**
 * End-to-End Tests: Billing Workflow
 *
 * Tests the complete billing and subscription management flow including:
 * - Viewing subscription details
 * - Updating billing information
 * - Downloading invoices
 * - Handling billing errors
 */

import { test, expect } from "@playwright/test";

test.describe("Billing Workflow", () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto("/login");
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");
    });

    test("should display subscription information", async ({ page }) => {
        // Navigate to billing page
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Verify subscription details are displayed
        await expect(page.locator('[data-testid="subscription-status"]')).toBeVisible();
        await expect(page.locator('[data-testid="plan-name"]')).toBeVisible();
        await expect(page.locator('[data-testid="next-billing-date"]')).toBeVisible();
        await expect(page.locator('[data-testid="subscription-price"]')).toBeVisible();
    });

    test("should display invoice list", async ({ page }) => {
        // Navigate to billing page
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Verify invoices are displayed
        await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();

        // Check if there are any invoices
        const invoiceCount = await page.locator('[data-testid="invoice-item"]').count();
        if (invoiceCount > 0) {
            // Verify invoice details
            await expect(page.locator('[data-testid="invoice-item"]').first()).toContainText("INV-");
            await expect(page.locator('[data-testid="invoice-item"]').first()).toContainText("$");
        }
    });

    test("should update billing information", async ({ page }) => {
        // Navigate to billing page
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Click update billing info button
        await page.click('[data-testid="update-billing-button"]');

        // Wait for modal to open
        await expect(page.locator('[data-testid="billing-modal"]')).toBeVisible();

        // Update billing address
        await page.fill('[data-testid="billing-address-line1"]', "123 Main Street");
        await page.fill('[data-testid="billing-city"]', "Kuala Lumpur");
        await page.fill('[data-testid="billing-postal-code"]', "50000");
        await page.selectOption('[data-testid="billing-country"]', "MY");

        // Save changes
        await page.click('[data-testid="save-billing-button"]');

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-message"]')).toContainText("Billing information updated successfully");

        // Verify modal is closed
        await expect(page.locator('[data-testid="billing-modal"]')).not.toBeVisible();
    });

    test("should download invoice", async ({ page }) => {
        // Navigate to billing page
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Check if there are any invoices
        const invoiceCount = await page.locator('[data-testid="invoice-item"]').count();
        if (invoiceCount > 0) {
            // Click download button on first invoice
            await page.click('[data-testid="download-invoice-button"]').first();

            // Wait for download to start
            const downloadPromise = page.waitForEvent('download');
            const download = await downloadPromise;

            // Verify download
            expect(download.suggestedFilename()).toMatch(/invoice-.*\.pdf/);
        } else {
            // Skip test if no invoices
            test.skip();
        }
    });

    test("should handle billing API errors gracefully", async ({ page }) => {
        // Mock billing API error
        await page.route("**/api/billing**", route => {
            route.fulfill({
                status: 500,
                contentType: "application/json",
                body: JSON.stringify({
                    success: false,
                    error: {
                        type: "internal_error",
                        title: "Billing service unavailable",
                        status: 500,
                        code: "BILLING_SERVICE_ERROR",
                        detail: "The billing service is temporarily unavailable",
                    },
                    timestamp: new Date().toISOString(),
                    requestId: "test-request-id",
                }),
            });
        });

        // Navigate to billing page
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Verify error message is displayed
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText("Billing service unavailable");

        // Verify retry button is available
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test("should validate billing form inputs", async ({ page }) => {
        // Navigate to billing page
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Click update billing info button
        await page.click('[data-testid="update-billing-button"]');

        // Wait for modal to open
        await expect(page.locator('[data-testid="billing-modal"]')).toBeVisible();

        // Try to save with invalid data
        await page.fill('[data-testid="billing-address-line1"]', ""); // Required field
        await page.fill('[data-testid="billing-city"]', ""); // Required field
        await page.click('[data-testid="save-billing-button"]');

        // Verify validation errors
        await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="validation-error"]')).toContainText("Address is required");
    });

    test("should handle subscription plan changes", async ({ page }) => {
        // Navigate to billing page
        await page.click('[data-testid="billing-menu"]');
        await page.waitForURL("/billing");

        // Click change plan button
        await page.click('[data-testid="change-plan-button"]');

        // Wait for plan selection modal
        await expect(page.locator('[data-testid="plan-selection-modal"]')).toBeVisible();

        // Select a different plan
        await page.click('[data-testid="plan-option-professional"]');

        // Confirm plan change
        await page.click('[data-testid="confirm-plan-change"]');

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-message"]')).toContainText("Plan changed successfully");
    });
});
