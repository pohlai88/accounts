/**
 * Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * All utilities and configurations are centralized in the preset.
 */
// @ts-nocheck


import { defineConfig, mergeConfig } from "vitest/config";
import base, { nodeConfig, dbCoverageConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  nodeConfig,
  dbCoverageConfig,
  defineConfig({
    test: {
      // DB-specific overrides
      setupFiles: [],
    },
  }),
);
