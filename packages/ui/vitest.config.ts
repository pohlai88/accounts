/**
 * Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * All utilities and configurations are centralized in the preset.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base, { jsdomConfig } from "@aibos/vitest-config";

export default mergeConfig(
  base,
  jsdomConfig,
  defineConfig({
    test: {
      // UI-specific overrides
      setupFiles: [],
      // React component testing optimizations
      environmentOptions: {
        jsdom: {
          resources: "usable",
        },
      },
    },
  }),
);
