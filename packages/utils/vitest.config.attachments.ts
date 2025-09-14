// Vitest configuration for attachment service tests
// V1 compliance: Comprehensive test coverage configuration

import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        name: 'attachment-service',
        environment: 'node',
        globals: true,
        setupFiles: ['./test/setup.ts'],
        include: [
            'test/attachment-*.test.ts'
        ],
        exclude: [
            'node_modules/**',
            'dist/**',
            '**/*.integration.test.ts'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './test-results/coverage',
            include: [
                'src/storage/attachment-service.ts',
                'src/supabase/server.ts'
            ],
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.spec.ts',
                'src/**/*.d.ts',
                'src/**/index.ts'
            ],
            thresholds: {
                global: {
                    branches: 95,
                    functions: 95,
                    lines: 95,
                    statements: 95
                },
                'src/storage/attachment-service.ts': {
                    branches: 98,
                    functions: 98,
                    lines: 98,
                    statements: 98
                }
            }
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 10000,
        maxConcurrency: 5,
        minThreads: 1,
        maxThreads: 4,
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false
            }
        },
        retry: 2,
        bail: 0,
        reporter: [
            'verbose',
            'json'
        ],
        outputFile: {
            json: './test-results/attachment-service-results.json'
        }
    },
    resolve: {
        alias: {
            '@aibos/utils': resolve(__dirname, 'src'),
            '@aibos/db': resolve(__dirname, '../db/src'),
            '@aibos/contracts': resolve(__dirname, '../contracts/src')
        }
    }
});
