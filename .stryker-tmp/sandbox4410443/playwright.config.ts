// @ts-nocheck
import { defineConfig, devices } from "@playwright/test";

/**
 * V1 Playwright Configuration with Live Supabase RLS Testing
 * Target: 80% E2E coverage for core flows + RLS verification
 * Performance: p95 < 500ms, error rate < 1%
 */
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright-results",

  // V1 Performance Requirements (increased for RLS testing)
  timeout: 60 * 1000, // 60 seconds max per test (RLS setup takes time)
  expect: {
    timeout: 10 * 1000, // 10 seconds for assertions (database operations)
  },

  // Global setup for Supabase RLS
  globalSetup: require.resolve("./tests/e2e/supabase-rls-setup.ts"),
  globalTeardown: require.resolve("./tests/e2e/global-teardown.ts"),

  // Fail fast on CI, retry locally
  fullyParallel: false, // Sequential for RLS testing to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Reduced retries for RLS tests
  workers: process.env.CI ? 1 : 2, // Limited workers for database testing

  // Comprehensive reporting
  reporter: [
    ["html", { outputFolder: "./test-results/playwright-report" }],
    ["json", { outputFile: "./test-results/playwright-results.json" }],
    ["junit", { outputFile: "./test-results/playwright-junit.xml" }],
    process.env.CI ? ["github"] : ["list"],
  ],

  use: {
    // Base URL for testing
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",

    // V1 Performance tracking
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    // Browser settings
    actionTimeout: 10 * 1000,
    navigationTimeout: 15 * 1000,

    // Locale settings (V1 requirement: Malaysia default)
    locale: "en-MY",
    timezoneId: "Asia/Kuala_Lumpur",
  },

  projects: [
    // Desktop browsers
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    // Mobile devices (V1 requirement: mobile excellence)
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },

    // Tablet
    {
      name: "Tablet",
      use: { ...devices["iPad Pro"] },
    },
  ],

  // Development server setup
  webServer: process.env.CI
    ? undefined
    : [
        {
          command: "pnpm --filter @aibos/web dev",
          port: 3000,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
        {
          command: "pnpm --filter @aibos/web-api dev",
          port: 3001,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      ],
});
