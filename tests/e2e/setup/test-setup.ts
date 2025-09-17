/**
 * E2E Test Setup
 *
 * Global setup and teardown for end-to-end tests
 */

import { test as base, expect } from '@playwright/test';

// Extend the base test with custom fixtures
export const test = base.extend({
    // Custom authenticated page fixture
    authenticatedPage: async ({ page }, use) => {
        // Login before each test
        await page.goto('/login');
        await page.fill('[data-testid="email-input"]', 'admin@demo-accounting.com');
        await page.fill('[data-testid="password-input"]', 'password123');
        await page.click('[data-testid="login-button"]');
        await page.waitForURL('/dashboard');

        // Verify login success
        await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

        await use(page);
    },

    // Mock API responses fixture
    mockApiResponse: async ({ page }, use) => {
        const mockResponses = new Map();

        const mockResponse = (url: string, response: any) => {
            mockResponses.set(url, response);
        };

        const clearMocks = () => {
            mockResponses.clear();
        };

        // Set up route interception
        await page.route('**/api/**', route => {
            const url = route.request().url();
            const mockResponse = mockResponses.get(url);

            if (mockResponse) {
                route.fulfill({
                    status: mockResponse.status || 200,
                    contentType: 'application/json',
                    body: JSON.stringify(mockResponse.body),
                });
            } else {
                route.continue();
            }
        });

        await use({ mockResponse, clearMocks });
    },
});

export { expect } from '@playwright/test';

// Global test configuration
test.beforeEach(async ({ page }) => {
    // Set up common test data attributes
    await page.addInitScript(() => {
        // Add test data attributes to elements for easier testing
        window.addEventListener('DOMContentLoaded', () => {
            // Add data-testid attributes to common elements if they don't exist
            const addTestId = (selector: string, testId: string) => {
                const element = document.querySelector(selector);
                if (element && !element.getAttribute('data-testid')) {
                    element.setAttribute('data-testid', testId);
                }
            };

            // Common selectors
            addTestId('button[type="submit"]', 'submit-button');
            addTestId('input[type="email"]', 'email-input');
            addTestId('input[type="password"]', 'password-input');
            addTestId('form', 'form');
        });
    });
});

test.afterEach(async ({ page }) => {
    // Clean up after each test
    await page.evaluate(() => {
        // Clear localStorage
        localStorage.clear();
        sessionStorage.clear();

        // Clear any pending timers
        const highestTimeoutId = setTimeout(() => { }, 0);
        for (let i = 0; i < highestTimeoutId; i++) {
            clearTimeout(i);
        }
    });
});
