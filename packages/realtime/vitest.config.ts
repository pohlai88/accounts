/**
 * @aibos/realtime Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * Node environment for realtime package testing.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../packages/config/vitest-config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      // Realtime-specific overrides
      setupFiles: [],
    },
  }),
);
