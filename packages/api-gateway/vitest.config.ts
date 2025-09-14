/**
 * Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * All utilities and configurations are centralized in the preset.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base, { nodeConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);
