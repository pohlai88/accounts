/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    // V1 Requirement: 95% coverage for posting engine
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        },
        // Specific thresholds for critical packages
        'packages/accounting/**': {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98
        },
        'packages/db/**': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      },
      include: [
        'packages/**/*.{ts,tsx}',
        'apps/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}'
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
        'tests/**'
      ]
    },
    environment: 'jsdom',
    setupFiles: [resolve(__dirname, './tests/setup.ts')],
    globals: true,
    include: [
      'packages/**/*.{test,spec}.{ts,tsx}',
      'packages/**/test/**/*.{test,spec}.{ts,tsx}',
      'apps/**/*.{test,spec}.{ts,tsx}',
      'services/**/*.{test,spec}.{ts,tsx}',
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      // Package-level patterns for when running from individual packages
      'src/**/*.{test,spec}.{ts,tsx}',
      '**/*.{test,spec}.{ts,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'tests/e2e/**',
      'tests/performance/**'
    ],
    // V1 Performance Requirements
    testTimeout: 10000,
    hookTimeout: 10000,
    // Parallel execution for speed
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1
      }
    },
    // Reporter configuration
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results/vitest-results.json'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@aibos/accounting': resolve(__dirname, './packages/accounting/src'),
      '@aibos/auth': resolve(__dirname, './packages/auth/src'),
      '@aibos/contracts': resolve(__dirname, './packages/contracts/src'),
      '@aibos/db': resolve(__dirname, './packages/db/src'),
      '@aibos/ui': resolve(__dirname, './packages/ui/src'),
      '@aibos/utils': resolve(__dirname, './packages/utils/src')
    }
  }
})
