/**
 * Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * All utilities and configurations are centralized in the preset.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base, { integrationConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  integrationConfig,
  defineConfig({
    test: {
      // Integration-specific overrides
      teardownTimeout: 10000,
    },
  }),
);
