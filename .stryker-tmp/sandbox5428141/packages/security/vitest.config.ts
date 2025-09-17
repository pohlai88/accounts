/**
 * Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * All utilities and configurations are centralized in the preset.
 */
// @ts-nocheck


import { defineConfig, mergeConfig } from "vitest/config";
import base, { nodeConfig, securityCoverageConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  nodeConfig,
  securityCoverageConfig,
  defineConfig({
    test: {
      // Security-specific overrides
      setupFiles: [],
    },
  }),
);
