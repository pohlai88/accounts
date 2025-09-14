/**
 * @aibos/vitest-config - SSOT Vitest Configuration
 *
 * Single Source of Truth for all Vitest configurations across the monorepo.
 *
 * This configuration:
 * 1. Provides unified defaults for all packages
 * 2. Supports different environments (node, jsdom, happy-dom)
 * 3. Enforces 95% coverage requirements
 * 4. Optimizes performance with parallel execution
 * 5. Maintains consistency across all test suites
 *
 * Usage:
 * import base from "@aibos/vitest-config";
 * export default mergeConfig(base, defineConfig({}));
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

// Base configuration that all packages will extend
export const baseConfig = defineConfig({
  test: {
    // Global test settings
    globals: true,

    // Environment - can be overridden per package
    environment: "node",

    // Coverage configuration - V1 Requirement: 95% coverage
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        global: {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95,
        },
      },
      include: [
        "src/**/*.{ts,tsx}",
        "packages/**/src/**/*.{ts,tsx}",
        "apps/**/src/**/*.{ts,tsx}",
        "services/**/src/**/*.{ts,tsx}",
      ],
      exclude: [
        "node_modules/**",
        "dist/**",
        "build/**",
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "**/migrations/**",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "tests/**",
        "**/test/**",
        "**/__tests__/**",
      ],
    },

    // Test file patterns
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "**/*.{test,spec}.{ts,tsx}",
      "test/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "tests/e2e/**",
      "tests/performance/**",
      "**/*.integration.test.{ts,tsx}",
    ],

    // Performance optimization
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,

    // Parallel execution for speed
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 1,
      },
    },

    // Retry configuration for flaky tests
    retry: 2,
    bail: 0,

    // Reporter configuration
    reporters: ["verbose", "json"],
    outputFile: {
      json: "./test-results/vitest-results.json",
    },
  },

  // Note: vite-tsconfig-paths plugin removed due to ESM compatibility issues
  // Packages should use resolve.alias instead for path resolution

  // Resolve aliases for monorepo packages (fallback)
  resolve: {
    alias: {
      "@": resolve(process.cwd(), "./"),
      "@aibos/accounting": resolve(process.cwd(), "./packages/accounting/src"),
      "@aibos/auth": resolve(process.cwd(), "./packages/auth/src"),
      "@aibos/contracts": resolve(process.cwd(), "./packages/contracts/src"),
      "@aibos/db": resolve(process.cwd(), "./packages/db/src"),
      "@aibos/ui": resolve(process.cwd(), "./packages/ui/src"),
      "@aibos/utils": resolve(process.cwd(), "./packages/utils/src"),
      "@aibos/cache": resolve(process.cwd(), "./packages/cache/src"),
      "@aibos/security": resolve(process.cwd(), "./packages/security/src"),
      "@aibos/monitoring": resolve(process.cwd(), "./packages/monitoring/src"),
      "@aibos/realtime": resolve(process.cwd(), "./packages/realtime/src"),
      "@aibos/api-gateway": resolve(process.cwd(), "./packages/api-gateway/src"),
      "@aibos/deployment": resolve(process.cwd(), "./packages/deployment/src"),
      "@aibos/tokens": resolve(process.cwd(), "./packages/tokens/src"),
    },
  },
});

// Environment-specific configurations
export const nodeConfig = defineConfig({
  test: {
    environment: "node",
  },
});

export const jsdomConfig = defineConfig({
  test: {
    environment: "jsdom",
  },
});

export const happyDomConfig = defineConfig({
  test: {
    environment: "happy-dom",
  },
});

// High-coverage configuration for critical packages
export const highCoverageConfig = defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 98,
          functions: 98,
          lines: 98,
          statements: 98,
        },
      },
    },
  },
});

// Integration test configuration
export const integrationConfig = defineConfig({
  test: {
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    setupFiles: ["./tests/setup/setup.ts"],
  },
});

// Default export for easy importing
export default baseConfig;
