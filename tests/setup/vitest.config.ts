/**
 * @aibos/setup-tests Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * Integration test configuration with environment variables.
 */

import { defineConfig, mergeConfig } from "vitest/config";
import { loadEnv } from "vite";
import base, { integrationConfig } from "../../packages/config/vitest-config";

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return mergeConfig(
    base,
    integrationConfig,
    defineConfig({
      test: {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
          API_BASE_URL: env.API_BASE_URL || "http://localhost:3000",
        },
      },
    }),
  );
});
