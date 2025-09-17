/**
 * @aibos/monorepo Root Vitest Configuration
 *
 * Extends @aibos/vitest-config for consistent testing across the monorepo.
 * Root configuration with monorepo-specific overrides and workspace patterns.
 */
// @ts-nocheck


/// <reference types="vitest" />
import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "path";
import base, { jsdomConfig, highCoverageConfig } from "./packages/config/vitest-config";

export default mergeConfig(
    base,
    jsdomConfig, // Use jsdom for root-level testing
    defineConfig({
        test: {
            // Root-specific overrides for monorepo
            setupFiles: [resolve(__dirname, "./tests/setup.ts")],

            // Monorepo-wide test patterns
            include: [
                "packages/**/*.{test,spec}.{ts,tsx}",
                "packages/**/test/**/*.{test,spec}.{ts,tsx}",
                "apps/**/*.{test,spec}.{ts,tsx}",
                "services/**/*.{test,spec}.{ts,tsx}",
                "tests/unit/**/*.{test,spec}.{ts,tsx}",
                "tests/integration/**/*.{test,spec}.{ts,tsx}",
                // Package-level patterns for when running from individual packages
                "src/**/*.{test,spec}.{ts,tsx}",
                "**/*.{test,spec}.{ts,tsx}",
            ],

            // Monorepo-specific exclusions
            exclude: [
                "node_modules/**",
                "dist/**",
                "build/**",
                "coverage/**",
                "test-results/**",
                "tests/e2e/**",
                "tests/performance/**",
                "**/*.integration.test.{ts,tsx}",
                "**/*.e2e.test.{ts,tsx}",
                "**/*.performance.test.{ts,tsx}",
            ],

            // Root-level coverage configuration (extends SSOT)
            coverage: {
                // Use SSOT thresholds as base, with root-specific overrides
                thresholds: {
                    global: {
                        branches: 95,
                        functions: 95,
                        lines: 95,
                        statements: 95,
                    },
                    // Critical package overrides (these should match SSOT highCoverageConfig)
                    "packages/accounting/**": {
                        branches: 98,
                        functions: 98,
                        lines: 98,
                        statements: 98,
                    },
                    "packages/db/**": {
                        branches: 90,
                        functions: 90,
                        lines: 90,
                        statements: 90,
                    },
                    "packages/auth/**": {
                        branches: 95,
                        functions: 95,
                        lines: 95,
                        statements: 95,
                    },
                    "packages/security/**": {
                        branches: 95,
                        functions: 95,
                        lines: 95,
                        statements: 95,
                    },
                },
            },
        },

        // Root-level resolve configuration
        resolve: {
            alias: {
                // Root-level aliases (extends SSOT)
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
    }),
);
