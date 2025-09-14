/**
 * @aibos/cache Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * Node environment for cache package testing.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../packages/config/vitest-config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      // Cache-specific overrides
      setupFiles: [],
    },
  }),
);
