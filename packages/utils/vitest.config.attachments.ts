/**
 * @aibos/utils Attachment Service Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * Specialized configuration for attachment service tests with high coverage requirements.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base, { nodeConfig, highCoverageConfig } from "../../packages/config/vitest-config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      name: "attachment-service",
      environment: "node",
      setupFiles: ["./test/setup.ts"],
      include: ["test/attachment-*.test.ts"],
      exclude: ["**/*.integration.test.ts"],
      coverage: {
        reportsDirectory: "./test-results/coverage",
        include: ["src/storage/attachment-service.ts", "src/supabase/server.ts"],
        thresholds: {
          global: {
            branches: 98,
            functions: 98,
            lines: 98,
            statements: 98,
          },
          "src/storage/attachment-service.ts": {
            branches: 98,
            functions: 98,
            lines: 98,
            statements: 98,
          },
        },
      },
      outputFile: {
        json: "./test-results/attachment-service-results.json",
      },
    },
  }),
);
