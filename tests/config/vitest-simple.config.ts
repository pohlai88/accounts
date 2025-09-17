// Simple Vitest Configuration for Single Test Execution
// Minimal configuration to avoid node_modules scanning issues

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        // Basic test settings
        globals: true,
        environment: 'node',
        setupFiles: ['tests/setup.ts'],

        // Include unit tests for business logic
        include: [
            'tests/unit/simple.test.ts',
            'tests/unit/accounting/**/*.{test,spec}.{ts,tsx}',
            'tests/unit/api/**/*.{test,spec}.{ts,tsx}',
            'tests/unit/contracts/**/*.{test,spec}.{ts,tsx}',
            'tests/invariants/**/*.{test,spec}.{ts,tsx}',
        ],

        // Explicit exclusions
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/test-results/**',
        ],

        // Basic timeouts
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 5000,

        // Sequential execution
        sequence: {
            concurrent: false,
            shuffle: false,
        },

        // Basic reporting
        reporters: ['verbose'],

        // No retries for simple test
        retry: 0,
        bail: 1,

        // Critical: inline dependencies so Vitest can transform & mock them
        deps: {
            optimizer: {
                ssr: {
                    include: ['@aibos/db'], // Inline @aibos/db for mocking
                },
            },
        },
    },

    // Basic resolve configuration
    resolve: {
        alias: {
            '@': resolve(process.cwd(), './'),
            '@aibos/accounting': resolve(process.cwd(), './packages/accounting/src'),
            '@aibos/db': resolve(process.cwd(), './packages/db/src/index.ts'), // Point to specific file
            '@aibos/utils': resolve(process.cwd(), './packages/utils/src'),
            '@aibos/contracts': resolve(process.cwd(), './packages/contracts/src'),
            '@aibos/auth': resolve(process.cwd(), './packages/auth/src'),
            '@aibos/cache': resolve(process.cwd(), './packages/cache/src'),
            '@aibos/security': resolve(process.cwd(), './packages/security/src'),
            '@aibos/monitoring': resolve(process.cwd(), './packages/monitoring/src'),
            '@aibos/realtime': resolve(process.cwd(), './packages/realtime/src'),
            '@aibos/api-gateway': resolve(process.cwd(), './packages/api-gateway/src'),
            '@aibos/tokens': resolve(process.cwd(), './packages/tokens/src'),
            '@test-data': resolve(process.cwd(), './tests/config/deterministic-test-data.ts'),
            '@test-config': resolve(process.cwd(), './tests/config'),
        },
        dedupe: ['@aibos/db'], // Ensure single module identity
    },

    // Basic define configuration
    define: {
        'process.env.NODE_ENV': '"test"',
        'process.env.TEST_DETERMINISTIC': 'true',
        'process.env.TEST_SEED': '12345',
    },
});
