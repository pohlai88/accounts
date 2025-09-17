/**
 * Integration Test Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * Includes integration-specific setup and environment configuration.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "path";
import base, { integrationConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  integrationConfig,
  defineConfig({
    test: {
      // Integration-specific overrides
      setupFiles: [resolve(__dirname, "./setup.ts")],
      teardownTimeout: 10000,
      testTimeout: 30000, // Longer timeout for integration tests
      hookTimeout: 30000,

      // Environment variables for integration tests
      env: {
        NODE_ENV: "test",
        DATABASE_URL: process.env.DATABASE_URL,
        SUPABASE_DB_URL: process.env.SUPABASE_DB_URL,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },

      // Integration test patterns
      include: [
        "**/*.integration.test.{ts,tsx}",
        "**/integration/**/*.{test,spec}.{ts,tsx}",
      ],

      // Exclude unit tests and other test types
      exclude: [
        "**/*.unit.test.{ts,tsx}",
        "**/*.e2e.test.{ts,tsx}",
        "**/*.performance.test.{ts,tsx}",
        "**/unit/**",
        "**/e2e/**",
        "**/performance/**",
      ],
    },
  }),
);
