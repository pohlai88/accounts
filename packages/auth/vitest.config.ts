/**
 * @aibos/auth Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * Node environment for auth package testing.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import base from "../../packages/config/vitest-config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      // Auth-specific overrides
      setupFiles: [],
    },
  }),
);
