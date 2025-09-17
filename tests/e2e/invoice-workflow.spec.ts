// Playwright End-to-End Tests for Invoice Workflow
// Tests complete user journey from invoice creation to payment

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_USER = {
    email: 'test@example.com',
    password: 'testpassword123',
};

// Test data
const TEST_CUSTOMER = {
    name: 'Test Customer',
    email: 'customer@test.com',
    phone: '+1234567890',
};

const TEST_INVOICE = {
    amount: 1000.00,
    currency: 'USD',
    dueDate: '2024-02-01',
    description: 'Test Invoice',
    lineItems: [
        {
            description: 'Test Item',
            quantity: 1,
            unitPrice: 1000.00,
            total: 1000.00,
        },
    ],
};

const TEST_PAYMENT = {
    amount: 1000.00,
    paymentMethod: 'CASH',
    paymentDate: new Date().toISOString().split('T')[0],
    description: 'Test Payment',
};

// Helper functions
async function login(page: Page) {
    await page.goto(`${BASE_URL}/login`);
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(`${BASE_URL}/dashboard`);
}

async function createCustomer(page: Page) {
    await page.goto(`${BASE_URL}/customers`);
    await page.click('[data-testid="create-customer-button"]');

    await page.fill('[data-testid="customer-name-input"]', TEST_CUSTOMER.name);
    await page.fill('[data-testid="customer-email-input"]', TEST_CUSTOMER.email);
    await page.fill('[data-testid="customer-phone-input"]', TEST_CUSTOMER.phone);

    await page.click('[data-testid="save-customer-button"]');
    await expect(page.locator('[data-testid="customer-success-message"]')).toBeVisible();
}

async function createInvoice(page: Page, customerId: string) {
    await page.goto(`${BASE_URL}/invoices`);
    await page.click('[data-testid="create-invoice-button"]');

    await page.selectOption('[data-testid="customer-select"]', customerId);
    await page.fill('[data-testid="invoice-amount-input"]', TEST_INVOICE.amount.toString());
    await page.selectOption('[data-testid="currency-select"]', TEST_INVOICE.currency);
    await page.fill('[data-testid="due-date-input"]', TEST_INVOICE.dueDate);
    await page.fill('[data-testid="invoice-description-input"]', TEST_INVOICE.description);

    // Add line item
    await page.click('[data-testid="add-line-item-button"]');
    await page.fill('[data-testid="line-item-description-input"]', TEST_INVOICE.lineItems[0].description);
    await page.fill('[data-testid="line-item-quantity-input"]', TEST_INVOICE.lineItems[0].quantity.toString());
    await page.fill('[data-testid="line-item-unit-price-input"]', TEST_INVOICE.lineItems[0].unitPrice.toString());

    await page.click('[data-testid="save-invoice-button"]');
    await expect(page.locator('[data-testid="invoice-success-message"]')).toBeVisible();
}

async function sendInvoice(page: Page, invoiceId: string) {
    await page.goto(`${BASE_URL}/invoices/${invoiceId}`);
    await page.click('[data-testid="send-invoice-button"]');
    await expect(page.locator('[data-testid="invoice-sent-message"]')).toBeVisible();
}

async function createPayment(page: Page, invoiceId: string) {
    await page.goto(`${BASE_URL}/payments`);
    await page.click('[data-testid="create-payment-button"]');

    await page.fill('[data-testid="payment-amount-input"]', TEST_PAYMENT.amount.toString());
    await page.selectOption('[data-testid="payment-method-select"]', TEST_PAYMENT.paymentMethod);
    await page.fill('[data-testid="payment-date-input"]', TEST_PAYMENT.paymentDate);
    await page.fill('[data-testid="payment-description-input"]', TEST_PAYMENT.description);

    // Add allocation
    await page.click('[data-testid="add-allocation-button"]');
    await page.selectOption('[data-testid="allocation-type-select"]', 'INVOICE');
    await page.fill('[data-testid="allocation-entity-id-input"]', invoiceId);
    await page.fill('[data-testid="allocation-amount-input"]', TEST_PAYMENT.amount.toString());

    await page.click('[data-testid="save-payment-button"]');
    await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();
}

// Test suite
test.describe('Invoice Workflow', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should complete full invoice workflow', async ({ page }) => {
        // Step 1: Create customer
        await createCustomer(page);

        // Get customer ID from the success message or URL
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();
        expect(customerId).toBeTruthy();

        // Step 2: Create invoice
        await createInvoice(page, customerId!);

        // Get invoice ID from the success message or URL
        const invoiceId = await page.locator('[data-testid="invoice-id"]').textContent();
        expect(invoiceId).toBeTruthy();

        // Step 3: Send invoice
        await sendInvoice(page, invoiceId!);

        // Verify invoice status is 'sent'
        await page.goto(`${BASE_URL}/invoices/${invoiceId}`);
        await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('sent');

        // Step 4: Create payment
        await createPayment(page, invoiceId!);

        // Step 5: Verify invoice is marked as paid
        await page.goto(`${BASE_URL}/invoices/${invoiceId}`);
        await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('paid');

        // Step 6: Verify payment appears in payments list
        await page.goto(`${BASE_URL}/payments`);
        await expect(page.locator('[data-testid="payment-list"]')).toContainText(TEST_PAYMENT.description);
    });

    test('should handle invoice creation validation', async ({ page }) => {
        await page.goto(`${BASE_URL}/invoices`);
        await page.click('[data-testid="create-invoice-button"]');

        // Try to save without required fields
        await page.click('[data-testid="save-invoice-button"]');

        // Verify validation errors
        await expect(page.locator('[data-testid="customer-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="amount-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="due-date-error"]')).toBeVisible();
    });

    test('should handle invoice editing', async ({ page }) => {
        // Create customer first
        await createCustomer(page);
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();

        // Create invoice
        await createInvoice(page, customerId!);
        const invoiceId = await page.locator('[data-testid="invoice-id"]').textContent();

        // Edit invoice
        await page.goto(`${BASE_URL}/invoices/${invoiceId}`);
        await page.click('[data-testid="edit-invoice-button"]');

        await page.fill('[data-testid="invoice-description-input"]', 'Updated Test Invoice');
        await page.click('[data-testid="save-invoice-button"]');

        // Verify changes
        await expect(page.locator('[data-testid="invoice-description"]')).toHaveText('Updated Test Invoice');
    });

    test('should handle invoice cancellation', async ({ page }) => {
        // Create customer first
        await createCustomer(page);
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();

        // Create invoice
        await createInvoice(page, customerId!);
        const invoiceId = await page.locator('[data-testid="invoice-id"]').textContent();

        // Cancel invoice
        await page.goto(`${BASE_URL}/invoices/${invoiceId}`);
        await page.click('[data-testid="cancel-invoice-button"]');

        // Confirm cancellation
        await page.click('[data-testid="confirm-cancel-button"]');

        // Verify invoice status is 'cancelled'
        await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('cancelled');
    });

    test('should handle partial payment', async ({ page }) => {
        // Create customer first
        await createCustomer(page);
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();

        // Create invoice
        await createInvoice(page, customerId!);
        const invoiceId = await page.locator('[data-testid="invoice-id"]').textContent();

        // Send invoice
        await sendInvoice(page, invoiceId!);

        // Create partial payment
        await page.goto(`${BASE_URL}/payments`);
        await page.click('[data-testid="create-payment-button"]');

        const partialAmount = TEST_PAYMENT.amount / 2;
        await page.fill('[data-testid="payment-amount-input"]', partialAmount.toString());
        await page.selectOption('[data-testid="payment-method-select"]', TEST_PAYMENT.paymentMethod);
        await page.fill('[data-testid="payment-date-input"]', TEST_PAYMENT.paymentDate);
        await page.fill('[data-testid="payment-description-input"]', 'Partial Payment');

        // Add allocation
        await page.click('[data-testid="add-allocation-button"]');
        await page.selectOption('[data-testid="allocation-type-select"]', 'INVOICE');
        await page.fill('[data-testid="allocation-entity-id-input"]', invoiceId!);
        await page.fill('[data-testid="allocation-amount-input"]', partialAmount.toString());

        await page.click('[data-testid="save-payment-button"]');
        await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();

        // Verify invoice is still 'sent' (not fully paid)
        await page.goto(`${BASE_URL}/invoices/${invoiceId}`);
        await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('sent');
    });

    test('should handle overpayment', async ({ page }) => {
        // Create customer first
        await createCustomer(page);
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();

        // Create invoice
        await createInvoice(page, customerId!);
        const invoiceId = await page.locator('[data-testid="invoice-id"]').textContent();

        // Send invoice
        await sendInvoice(page, invoiceId!);

        // Create overpayment
        await page.goto(`${BASE_URL}/payments`);
        await page.click('[data-testid="create-payment-button"]');

        const overAmount = TEST_PAYMENT.amount * 1.5;
        await page.fill('[data-testid="payment-amount-input"]', overAmount.toString());
        await page.selectOption('[data-testid="payment-method-select"]', TEST_PAYMENT.paymentMethod);
        await page.fill('[data-testid="payment-date-input"]', TEST_PAYMENT.paymentDate);
        await page.fill('[data-testid="payment-description-input"]', 'Overpayment');

        // Add allocation
        await page.click('[data-testid="add-allocation-button"]');
        await page.selectOption('[data-testid="allocation-type-select"]', 'INVOICE');
        await page.fill('[data-testid="allocation-entity-id-input"]', invoiceId!);
        await page.fill('[data-testid="allocation-amount-input"]', overAmount.toString());

        await page.click('[data-testid="save-payment-button"]');
        await expect(page.locator('[data-testid="payment-success-message"]')).toBeVisible();

        // Verify invoice is marked as 'paid'
        await page.goto(`${BASE_URL}/invoices/${invoiceId}`);
        await expect(page.locator('[data-testid="invoice-status"]')).toHaveText('paid');
    });

    test('should display invoice in dashboard', async ({ page }) => {
        // Create customer first
        await createCustomer(page);
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();

        // Create invoice
        await createInvoice(page, customerId!);
        const invoiceId = await page.locator('[data-testid="invoice-id"]').textContent();

        // Check dashboard
        await page.goto(`${BASE_URL}/dashboard`);

        // Verify invoice appears in recent invoices
        await expect(page.locator('[data-testid="recent-invoices"]')).toContainText(TEST_INVOICE.description);

        // Verify invoice count increased
        await expect(page.locator('[data-testid="total-invoices"]')).toContainText('1');
    });

    test('should handle invoice search and filtering', async ({ page }) => {
        // Create customer first
        await createCustomer(page);
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();

        // Create invoice
        await createInvoice(page, customerId!);

        // Test search
        await page.goto(`${BASE_URL}/invoices`);
        await page.fill('[data-testid="search-input"]', TEST_INVOICE.description);
        await page.click('[data-testid="search-button"]');

        // Verify search results
        await expect(page.locator('[data-testid="invoice-list"]')).toContainText(TEST_INVOICE.description);

        // Test filtering by status
        await page.selectOption('[data-testid="status-filter"]', 'draft');
        await expect(page.locator('[data-testid="invoice-list"]')).toContainText(TEST_INVOICE.description);
    });

    test('should handle invoice export', async ({ page }) => {
        // Create customer first
        await createCustomer(page);
        const customerId = await page.locator('[data-testid="customer-id"]').textContent();

        // Create invoice
        await createInvoice(page, customerId!);

        // Test export
        await page.goto(`${BASE_URL}/invoices`);
        await page.click('[data-testid="export-button"]');
        await page.selectOption('[data-testid="export-format"]', 'PDF');
        await page.click('[data-testid="confirm-export-button"]');

        // Verify download started
        const download = await page.waitForEvent('download');
        expect(download.suggestedFilename()).toContain('invoices');
    });
});

// Test suite for error handling
test.describe('Invoice Error Handling', () => {
    test.beforeEach(async ({ page }) => {
        await login(page);
    });

    test('should handle network errors gracefully', async ({ page }) => {
        // Mock network error
        await page.route('**/api/invoices', route => route.abort());

        await page.goto(`${BASE_URL}/invoices`);
        await page.click('[data-testid="create-invoice-button"]');

        // Try to create invoice
        await page.fill('[data-testid="invoice-amount-input"]', '1000');
        await page.click('[data-testid="save-invoice-button"]');

        // Verify error message
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });

    test('should handle server errors gracefully', async ({ page }) => {
        // Mock server error
        await page.route('**/api/invoices', route => route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Internal Server Error' }),
        }));

        await page.goto(`${BASE_URL}/invoices`);
        await page.click('[data-testid="create-invoice-button"]');

        // Try to create invoice
        await page.fill('[data-testid="invoice-amount-input"]', '1000');
        await page.click('[data-testid="save-invoice-button"]');

        // Verify error message
        await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    });
});
