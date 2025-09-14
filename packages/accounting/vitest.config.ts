/**
 * @aibos/accounting Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * High coverage requirements for critical accounting package.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import { resolve } from "path";
import base, { nodeConfig, highCoverageConfig } from "../../packages/config/vitest-config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      // Accounting-specific overrides
      environment: "node",
      setupFiles: [],
      // Additional coverage thresholds for critical accounting functions
      coverage: {
        thresholds: {
          global: {
            branches: 98,
            functions: 98,
            lines: 98,
            statements: 98,
          },
          "src/fx/ingest.ts": {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
          },
          "src/reports/": {
            branches: 98,
            functions: 98,
            lines: 98,
            statements: 98,
          },
        },
      },
    },
    resolve: {
      alias: {
        "@aibos/db": resolve(__dirname, "../db/dist"),
        "@aibos/auth": resolve(__dirname, "../auth/dist"),
        "@aibos/contracts": resolve(__dirname, "../contracts/dist"),
        "@aibos/utils": resolve(__dirname, "../utils/dist"),
        "@aibos/cache": resolve(__dirname, "../cache/dist"),
        "@aibos/security": resolve(__dirname, "../security/dist"),
        "@aibos/monitoring": resolve(__dirname, "../monitoring/dist"),
        "@aibos/realtime": resolve(__dirname, "../realtime/dist"),
        "@aibos/api-gateway": resolve(__dirname, "../api-gateway/dist"),
        "@aibos/deployment": resolve(__dirname, "../deployment/dist"),
        "@aibos/tokens": resolve(__dirname, "../tokens/dist"),
      },
    },
  }),
);
