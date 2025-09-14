/**
 * @aibos/monorepo Root ESLint Configuration
 *
 * Extends @aibos/eslint-config for consistent linting across the monorepo.
 * Root configuration with monorepo-specific overrides and workspace patterns.
 */

import base from "./packages/config/eslint-config/index.mjs";

export default [
  ...base,
  {
    // Root-specific overrides for monorepo
    files: ["**/*.{js,ts,tsx,mjs}"],
    ignores: [
      // Root-level ignores
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      "test-results/**",
      "*.config.*",
      "**/*.config.*",
      "**/vitest.config.*",
      "**/jest.config.*",
      "**/playwright.config.*",
      "**/*.d.ts",

      // Monorepo-specific patterns
      "packages/*/dist/**",
      "packages/*/build/**",
      "apps/*/dist/**",
      "apps/*/build/**",
      "services/*/dist/**",
      "services/*/build/**",

      // Generated files
      "**/generated/**",
      "**/auto-generated/**",
      "**/*.generated.*",

      // Documentation and scripts
      "docs/**",
      "scripts/**",
      "**/*.md",
      "**/*.mdx",
    ],
    rules: {
      // Root-specific rule overrides
      "no-console": "warn", // Allow console in root scripts
      "@typescript-eslint/no-explicit-any": "warn", // More lenient for root configs
    },
  },
];
