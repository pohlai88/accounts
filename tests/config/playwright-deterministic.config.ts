// Deterministic Playwright Configuration
// Ensures consistent, reproducible E2E test results

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    outputDir: './test-results/playwright-deterministic',

    // Deterministic test execution
    fullyParallel: false, // Sequential execution for deterministic results
    forbidOnly: !!process.env.CI,
    retries: 0, // No retries for deterministic tests
    workers: 1, // Single worker for deterministic execution

    // Deterministic timeouts
    timeout: 60 * 1000, // 60 seconds max per test
    expect: {
        timeout: 10 * 1000, // 10 seconds for assertions
    },

    // Deterministic setup
    globalSetup: require.resolve('./tests/e2e/deterministic-setup.ts'),
    globalTeardown: require.resolve('./tests/e2e/deterministic-teardown.ts'),

    // Deterministic reporting
    reporter: [
        ['html', { outputFolder: './test-results/playwright-deterministic-report' }],
        ['json', { outputFile: './test-results/playwright-deterministic-results.json' }],
        ['junit', { outputFile: './test-results/playwright-deterministic-junit.xml' }],
        process.env.CI ? ['github'] : ['list'],
    ],

    use: {
        // Deterministic base URL
        baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

        // Deterministic browser settings
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',

        // Deterministic timeouts
        actionTimeout: 10 * 1000,
        navigationTimeout: 15 * 1000,

        // Deterministic locale settings
        locale: 'en-MY',
        timezoneId: 'Asia/Kuala_Lumpur',

        // Deterministic viewport
        viewport: { width: 1280, height: 720 },

        // Deterministic user agent
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },

    projects: [
        // Deterministic browser selection
        {
            name: 'chromium-deterministic',
            use: {
                ...devices['Desktop Chrome'],
                // Deterministic browser settings
                launchOptions: {
                    args: [
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        '--disable-field-trial-config',
                        '--disable-back-forward-cache',
                        '--disable-ipc-flooding-protection',
                        '--no-first-run',
                        '--no-default-browser-check',
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--disable-gpu',
                        '--window-size=1280,720',
                    ],
                },
            },
        },
    ],

    // Deterministic web server setup
    webServer: process.env.CI
        ? undefined
        : [
            {
                command: 'pnpm --filter @aibos/web dev',
                port: 3000,
                reuseExistingServer: !process.env.CI,
                timeout: 120 * 1000,
                env: {
                    NODE_ENV: 'test',
                    TEST_DETERMINISTIC: 'true',
                    TEST_SEED: '12345',
                },
            },
            {
                command: 'pnpm --filter @aibos/web-api dev',
                port: 3001,
                reuseExistingServer: !process.env.CI,
                timeout: 120 * 1000,
                env: {
                    NODE_ENV: 'test',
                    TEST_DETERMINISTIC: 'true',
                    TEST_SEED: '12345',
                },
            },
        ],
});
