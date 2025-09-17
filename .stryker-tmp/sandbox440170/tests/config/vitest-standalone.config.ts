// @ts-nocheck
// SSOT-Compliant Vitest Configuration Override
// Extends @aibos/vitest-config base configuration while maintaining SSOT governance
// This configuration overrides specific settings for comprehensive testing

import { defineConfig, mergeConfig } from 'vitest/config';
import { resolve } from 'path';

// Import SSOT base configuration (inline to avoid ESM issues)
const baseConfig = defineConfig({
    test: {
        // Global test settings from SSOT
        globals: true,
        environment: 'node',

        // SSOT Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            thresholds: {
                global: {
                    branches: 95,
                    functions: 95,
                    lines: 95,
                    statements: 95,
                },
            },
            include: [
                'src/**/*.{ts,tsx}',
                'packages/**/src/**/*.{ts,tsx}',
                'apps/**/src/**/*.{ts,tsx}',
                'services/**/src/**/*.{ts,tsx}',
            ],
            exclude: [
                'node_modules/**',
                'dist/**',
                'build/**',
                '**/*.d.ts',
                '**/*.config.{ts,js}',
                '**/migrations/**',
                '**/*.test.{ts,tsx}',
                '**/*.spec.{ts,tsx}',
                'tests/**',
                '**/test/**',
                '**/__tests__/**',
            ],
        },

        // SSOT Test file patterns
        include: [
            'src/**/*.{test,spec}.{ts,tsx}',
            '**/*.{test,spec}.{ts,tsx}',
            'test/**/*.{test,spec}.{ts,tsx}',
            'tests/**/*.{test,spec}.{ts,tsx}',
        ],

        exclude: [
            'node_modules/**',
            'dist/**',
            'build/**',
            'tests/e2e/**',
            'tests/performance/**',
            '**/*.integration.test.{ts,tsx}',
        ],

        // SSOT Performance optimization
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 5000,

        // SSOT Parallel execution
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
                maxThreads: 4,
                minThreads: 1,
            },
        },

        // SSOT Retry configuration
        retry: 2,
        bail: 0,

        // SSOT Reporter configuration
        reporters: ['verbose', 'json'],
        outputFile: {
            json: './test-results/vitest-results.json',
        },
    },

    // SSOT Resolve aliases
    resolve: {
        alias: {
            '@': resolve(process.cwd(), './'),
            '@aibos/accounting': resolve(process.cwd(), './packages/accounting/src'),
            '@aibos/auth': resolve(process.cwd(), './packages/auth/src'),
            '@aibos/contracts': resolve(process.cwd(), './packages/contracts/src'),
            '@aibos/db': resolve(process.cwd(), './packages/db/src'),
            '@aibos/ui': resolve(process.cwd(), './packages/ui/src'),
            '@aibos/utils': resolve(process.cwd(), './packages/utils/src'),
            '@aibos/cache': resolve(process.cwd(), './packages/cache/src'),
            '@aibos/security': resolve(process.cwd(), './packages/security/src'),
            '@aibos/monitoring': resolve(process.cwd(), './packages/monitoring/src'),
            '@aibos/realtime': resolve(process.cwd(), './packages/realtime/src'),
            '@aibos/api-gateway': resolve(process.cwd(), './packages/api-gateway/src'),
            '@aibos/deployment': resolve(process.cwd(), './packages/deployment/src'),
            '@aibos/tokens': resolve(process.cwd(), './packages/tokens/src'),
        },
    },
});

// Comprehensive Testing Override Configuration
// Extends SSOT base while adding comprehensive testing capabilities
const comprehensiveOverride = defineConfig({
    test: {
        // Override: Specific test patterns to avoid node_modules scanning
        include: [
            'tests/unit/**/*.{test,spec}.{ts,tsx}',
            'tests/integration/**/*.{test,spec}.{ts,tsx}',
            'tests/validation/**/*.{test,spec}.{ts,tsx}',
            'packages/**/src/**/*.{test,spec}.{ts,tsx}',
            'apps/**/src/**/*.{test,spec}.{ts,tsx}',
        ],

        // Override: Explicit exclusions to prevent node_modules scanning
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/test-results/**',
            '**/tests/e2e/**',
            '**/tests/performance/**',
            '**/*.integration.test.{ts,tsx}',
            '**/*.e2e.test.{ts,tsx}',
            '**/*.performance.test.{ts,tsx}',
            '**/zod/**',
            '**/@types/**',
        ],

        // Override: Extended timeouts for comprehensive testing
        testTimeout: 30000,
        hookTimeout: 30000,
        teardownTimeout: 10000,

        // Override: Sequential execution for deterministic results
        sequence: {
            concurrent: false,
            shuffle: false,
        },

        // Override: Test isolation for comprehensive testing
        isolate: true,
        pool: 'forks',
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },

        // Override: No retries for deterministic testing
        retry: 0,
        bail: 1,

        // Override: Enhanced reporting for comprehensive testing
        reporters: [
            'verbose',
            'json',
            ['html', { outputFile: './test-results/comprehensive-vitest-report.html' }],
        ],

        // Override: Enhanced output for comprehensive testing
        outputFile: {
            json: './test-results/comprehensive-vitest-results.json',
        },

        // Override: Additional setup files for comprehensive testing
        setupFiles: [
            './tests/setup.ts',
            './tests/config/deterministic-test-data.ts',
        ],
    },

    // Override: Additional resolve aliases for comprehensive testing
    resolve: {
        alias: {
            '@test-data': resolve(process.cwd(), './tests/config/deterministic-test-data.ts'),
            '@test-utils': resolve(process.cwd(), './tests/utils'),
            '@test-config': resolve(process.cwd(), './tests/config'),
        },
    },

    // Override: Additional define configuration for comprehensive testing
    define: {
        'process.env.NODE_ENV': '"test"',
        'process.env.TEST_DETERMINISTIC': 'true',
        'process.env.TEST_SEED': '12345',
        'process.env.COMPREHENSIVE_TESTING': 'true',
    },
});

// Merge SSOT base with comprehensive testing overrides
export default mergeConfig(baseConfig, comprehensiveOverride);
