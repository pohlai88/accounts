/**
 * End-to-End Tests: Invoice Management Workflow
 *
 * Tests the complete invoice management flow including:
 * - Creating invoices
 * - Viewing invoice list
 * - Editing invoices
 * - Invoice validation
 * - Error handling
 */

import { test, expect } from "@playwright/test";

test.describe("Invoice Management Workflow", () => {
    test.beforeEach(async ({ page }) => {
        // Login first
        await page.goto("/login");
        await page.fill('[data-testid="email-input"]', "admin@demo-accounting.com");
        await page.fill('[data-testid="password-input"]', "password123");
        await page.click('[data-testid="login-button"]');
        await page.waitForURL("/dashboard");
    });

    test("should create a new invoice", async ({ page }) => {
        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Click create invoice button
        await page.click('[data-testid="create-invoice-button"]');

        // Wait for create invoice modal/form
        await expect(page.locator('[data-testid="create-invoice-modal"]')).toBeVisible();

        // Fill in invoice details
        await page.fill('[data-testid="invoice-number"]', "INV-2024-001");
        await page.fill('[data-testid="customer-name"]', "Test Customer");
        await page.fill('[data-testid="customer-email"]', "customer@example.com");
        await page.fill('[data-testid="invoice-date"]', "2024-01-15");
        await page.fill('[data-testid="due-date"]', "2024-02-15");

        // Add invoice line items
        await page.click('[data-testid="add-line-item"]');
        await page.fill('[data-testid="line-description"]', "Consulting Services");
        await page.fill('[data-testid="line-quantity"]', "10");
        await page.fill('[data-testid="line-unit-price"]', "100.00");

        // Save invoice
        await page.click('[data-testid="save-invoice-button"]');

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-message"]')).toContainText("Invoice created successfully");

        // Verify invoice appears in list
        await expect(page.locator('[data-testid="invoice-item"]')).toContainText("INV-2024-001");
    });

    test("should validate invoice form inputs", async ({ page }) => {
        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Click create invoice button
        await page.click('[data-testid="create-invoice-button"]');

        // Wait for create invoice modal/form
        await expect(page.locator('[data-testid="create-invoice-modal"]')).toBeVisible();

        // Try to save with invalid data
        await page.fill('[data-testid="invoice-number"]', ""); // Required field
        await page.fill('[data-testid="customer-name"]', ""); // Required field
        await page.click('[data-testid="save-invoice-button"]');

        // Verify validation errors
        await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="validation-error"]')).toContainText("Invoice number is required");
    });

    test("should display invoice list with pagination", async ({ page }) => {
        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Verify invoice list is displayed
        await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();

        // Check pagination if there are many invoices
        const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
        if (paginationExists) {
            // Test pagination
            await page.click('[data-testid="next-page"]');
            await expect(page.locator('[data-testid="current-page"]')).toContainText("2");
        }
    });

    test("should filter invoices by status", async ({ page }) => {
        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Apply status filter
        await page.selectOption('[data-testid="status-filter"]', "paid");

        // Verify filtered results
        await expect(page.locator('[data-testid="invoice-item"]')).toContainText("Paid");

        // Clear filter
        await page.selectOption('[data-testid="status-filter"]', "all");

        // Verify all invoices are shown again
        await expect(page.locator('[data-testid="invoices-list"]')).toBeVisible();
    });

    test("should search invoices by customer name", async ({ page }) => {
        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Search for specific customer
        await page.fill('[data-testid="search-input"]', "Test Customer");
        await page.click('[data-testid="search-button"]');

        // Verify search results
        await expect(page.locator('[data-testid="invoice-item"]')).toContainText("Test Customer");
    });

    test("should edit existing invoice", async ({ page }) => {
        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Click edit button on first invoice
        await page.click('[data-testid="edit-invoice-button"]').first();

        // Wait for edit modal/form
        await expect(page.locator('[data-testid="edit-invoice-modal"]')).toBeVisible();

        // Update invoice details
        await page.fill('[data-testid="customer-name"]', "Updated Customer Name");

        // Save changes
        await page.click('[data-testid="save-invoice-button"]');

        // Verify success message
        await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="success-message"]')).toContainText("Invoice updated successfully");
    });

    test("should handle invoice API errors gracefully", async ({ page }) => {
        // Mock invoice API error
        await page.route("**/api/invoices**", route => {
            route.fulfill({
                status: 500,
                contentType: "application/json",
                body: JSON.stringify({
                    success: false,
                    error: {
                        type: "internal_error",
                        title: "Invoice service unavailable",
                        status: 500,
                        code: "INVOICE_SERVICE_ERROR",
                        detail: "The invoice service is temporarily unavailable",
                    },
                    timestamp: new Date().toISOString(),
                    requestId: "test-request-id",
                }),
            });
        });

        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Verify error message is displayed
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText("Invoice service unavailable");

        // Verify retry button is available
        await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    });

    test("should prevent duplicate invoice numbers", async ({ page }) => {
        // Navigate to invoices page
        await page.click('[data-testid="invoices-menu"]');
        await page.waitForURL("/invoices");

        // Click create invoice button
        await page.click('[data-testid="create-invoice-button"]');

        // Wait for create invoice modal/form
        await expect(page.locator('[data-testid="create-invoice-modal"]')).toBeVisible();

        // Fill in invoice with duplicate number
        await page.fill('[data-testid="invoice-number"]', "INV-2024-001"); // Assuming this already exists
        await page.fill('[data-testid="customer-name"]', "Test Customer");
        await page.fill('[data-testid="customer-email"]', "customer@example.com");
        await page.fill('[data-testid="invoice-date"]', "2024-01-15");
        await page.fill('[data-testid="due-date"]', "2024-02-15");

        // Save invoice
        await page.click('[data-testid="save-invoice-button"]');

        // Verify error message for duplicate number
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        await expect(page.locator('[data-testid="error-message"]')).toContainText("Invoice number already exists");
    });
});
