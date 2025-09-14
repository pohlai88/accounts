/**
 * @aibos/ui Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * JSdom environment for React component testing.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base, { jsdomConfig } from "../../packages/config/vitest-config";

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
