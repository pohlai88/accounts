/**
 * @aibos/monorepo - Robust Testing Configuration
 *
 * Standalone, production-ready testing setup optimized for:
 * - Speed and reliability
 * - TypeScript and React support
 * - Monorepo architecture
 * - 3-tier testing strategy (Unit, Integration, E2E)
 */

import { defineConfig } from "vitest/config";
import { resolve } from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load environment variables from .env.test
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      // Global test settings
      globals: true,
      environment: "node",

      // Test file patterns (exclude React components - handled by vitest.config.react.ts)
      include: [
        "**/*.{test,spec}.{ts,tsx}",
        "tests/**/*.{test,spec}.{ts,tsx}",
      ],
      exclude: [
        "node_modules/**",
        "dist/**",
        "build/**",
        ".next/**",
        "coverage/**",
        "test-results/**",
        "tests/e2e/**", // E2E tests handled by Playwright
        ".stryker-tmp/**", // Stryker temp files
        "**/node_modules/**", // Nested node_modules
        "**/zod/src/v4/classic/tests/**", // Zod internal tests
        "packages/ui/**/*.{test,spec}.{ts,tsx}", // React components handled by vitest.config.react.ts
        "apps/web/**/*.{test,spec}.{ts,tsx}", // React components handled by vitest.config.react.ts
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

      // Coverage configuration
      coverage: {
        provider: "v8",
        reporter: ["text", "json", "html", "lcov"],
        reportsDirectory: "./coverage",
        thresholds: {
          global: {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
          },
          // Critical package overrides
          "packages/accounting/**": {
            branches: 95,
            functions: 95,
            lines: 95,
            statements: 95,
          },
          "packages/db/**": {
            branches: 85,
            functions: 85,
            lines: 85,
            statements: 85,
          },
          "packages/auth/**": {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
          },
          "packages/security/**": {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90,
          },
        },
        include: [
          "packages/**/src/**/*.{ts,tsx}",
          "apps/**/src/**/*.{ts,tsx}",
          "apps/**/app/**/*.{ts,tsx}",
        ],
        exclude: [
          "**/*.d.ts",
          "**/*.config.{ts,js}",
          "**/*.test.{ts,tsx}",
          "**/*.spec.{ts,tsx}",
          "**/migrations/**",
          "**/node_modules/**",
        ],
      },

      // Reporter configuration
      reporters: ["verbose", "json"],
      outputFile: {
        json: "./test-results/vitest-results.json",
      },

      // Setup files
      setupFiles: ["./tests/setup/global-setup.ts"],
    },

    // Define environment variables for tests
    define: {
      'process.env': env,
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
  };
});
