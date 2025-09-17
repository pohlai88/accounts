// @ts-nocheck
// SSOT-Compliant Deterministic Vitest Configuration
// Extends SSOT base configuration with deterministic testing overrides
// Maintains SSOT governance while ensuring reproducible test results

import { defineConfig, mergeConfig } from 'vitest/config';
import { resolve } from 'path';

// SSOT Base Configuration (inline to avoid ESM issues)
const baseConfig = defineConfig({
  test: {
    // SSOT Global test settings
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

// Deterministic Testing Override Configuration
// Extends SSOT base with deterministic testing capabilities
const deterministicOverride = defineConfig({
  test: {
    // Override: Deterministic test execution
    sequence: {
      concurrent: false, // Run tests sequentially for deterministic results
      shuffle: false, // Disable test shuffling
    },
    
    // Override: Deterministic data setup
    setupFiles: [
      './tests/setup.ts',
      './tests/config/deterministic-test-data.ts',
    ],
    
    // Override: Test isolation for deterministic results
    isolate: true,
    pool: 'forks', // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Single fork for deterministic execution
      },
    },
    
    // Override: Deterministic coverage
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage/deterministic',
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
    },
    
    // Override: Deterministic reporting
    reporters: [
      'verbose',
      'json',
      ['html', { outputFile: './test-results/deterministic-report.html' }],
    ],
    
    // Override: Deterministic output
    outputFile: {
      json: './test-results/deterministic-results.json',
    },
    
    // Override: Deterministic timeouts
    testTimeout: 30000, // 30 seconds for deterministic tests
    hookTimeout: 30000,
    teardownTimeout: 10000,
    
    // Override: Deterministic retry configuration
    retry: 0, // No retries for deterministic tests
    bail: 1, // Stop on first failure for deterministic debugging
    
    // Override: Deterministic environment
    environment: 'node',
    environmentOptions: {
      node: {
        // Ensure consistent Node.js environment
        experimentalSpecifierResolution: 'node',
      },
    },
    
    // Override: Deterministic test patterns
    include: [
      'tests/unit/**/*.{test,spec}.{ts,tsx}',
      'tests/integration/**/*.{test,spec}.{ts,tsx}',
      'tests/validation/**/*.{test,spec}.{ts,tsx}',
      // Include SSOT patterns
      'src/**/*.{test,spec}.{ts,tsx}',
      '**/*.{test,spec}.{ts,tsx}',
      'test/**/*.{test,spec}.{ts,tsx}',
    ],
    
    // Override: Deterministic exclusions
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      'test-results/**',
      'tests/e2e/**',
      'tests/performance/**',
      'tests/frontend/**', // Frontend tests have separate config
    ],
  },
  
  // Override: Deterministic resolve configuration
  resolve: {
    alias: {
      '@test-data': resolve(process.cwd(), './tests/config/deterministic-test-data.ts'),
      '@test-utils': resolve(process.cwd(), './tests/utils'),
      '@test-config': resolve(process.cwd(), './tests/config'),
    },
  },
  
  // Override: Deterministic define configuration
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.TEST_DETERMINISTIC': 'true',
    'process.env.TEST_SEED': '12345',
  },
});

// Merge SSOT base with deterministic testing overrides
export default mergeConfig(baseConfig, deterministicOverride);
