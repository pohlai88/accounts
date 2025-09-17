/**
 * React Testing Configuration
 *
 * Separate configuration for React component testing with jsdom environment.
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Global test settings
    globals: true,
    environment: "jsdom", // Use jsdom for React components

    // Test file patterns for React components
    include: [
      "packages/ui/**/*.{test,spec}.{ts,tsx}",
      "apps/web/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "coverage/**",
      "test-results/**",
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

    // Setup files for React testing
    setupFiles: [
      "./tests/setup/global-setup.ts",
      "./tests/setup/react-setup.ts",
    ],

    // Coverage configuration for UI components
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      include: [
        "packages/ui/src/**/*.{ts,tsx}",
        "apps/web/src/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.config.{ts,js}",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
        "**/node_modules/**",
      ],
    },
  },

  // Resolve configuration for monorepo
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
      "@aibos/accounting": resolve(__dirname, "./packages/accounting/src"),
      "@aibos/auth": resolve(__dirname, "./packages/auth/src"),
      "@aibos/contracts": resolve(__dirname, "./packages/contracts/src"),
      "@aibos/db": resolve(__dirname, "./packages/db/src"),
      "@aibos/ui": resolve(__dirname, "./packages/ui/src"),
      "@aibos/utils": resolve(__dirname, "./packages/utils/src"),
      "@aibos/cache": resolve(__dirname, "./packages/cache/src"),
      "@aibos/security": resolve(__dirname, "./packages/security/src"),
      "@aibos/monitoring": resolve(__dirname, "./packages/monitoring/src"),
      "@aibos/realtime": resolve(__dirname, "./packages/realtime/src"),
      "@aibos/api-gateway": resolve(__dirname, "./packages/api-gateway/src"),
      "@aibos/deployment": resolve(__dirname, "./packages/deployment/src"),
      "@aibos/tokens": resolve(__dirname, "./packages/tokens/src"),
    },
  },
});
