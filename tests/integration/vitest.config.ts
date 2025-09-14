/**
 * @aibos/integration-tests Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * Integration test configuration with environment setup.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import { config } from "dotenv";
import { resolve } from "path";
import base, { integrationConfig } from "../../packages/config/vitest-config";

// Load .env.local file
config({ path: resolve(process.cwd(), ".env.local") });

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
