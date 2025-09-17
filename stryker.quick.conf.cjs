module.exports = {
  // Test only a single, simple function to verify setup
  mutate: [
    "packages/accounting/src/ap/payment-processing.ts"
  ],

  // Use command test runner with a focused test
  testRunner: "command",
  commandRunner: {
    command: "pnpm test:unit --filter=@aibos/accounting"
  },

  // Minimal configuration for quick test
  reporters: ["progress"],
  coverageAnalysis: "off", // Skip coverage for speed

  // Very short timeout
  timeoutMS: 30000, // 30 seconds max

  // Minimal logging
  logLevel: "error",

  // Ignore everything except our target
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.html",
    "**/.accountsignore_legacy/**",
    "**/docs/**",
    "**/apps/**",
    "**/services/**",
    "**/packages/db/**",
    "**/packages/auth/**",
    "**/packages/ui/**",
    "**/packages/web/**",
    "**/packages/web-api/**",
    "**/packages/worker/**",
    "**/packages/monitoring/**",
    "**/packages/realtime/**",
    "**/packages/cache/**",
    "**/packages/security/**",
    "**/packages/contracts/**",
    "**/packages/tokens/**",
    "**/packages/utils/**",
    "**/packages/vitest-config/**",
    "**/packages/eslint-config/**",
    "**/packages/prettier-config/**",
    "**/packages/deployment/**",
    "**/packages/docs/**",
    "**/packages/api-gateway/**"
  ],

  // Disable warnings for cleaner output
  warnings: {
    unknownOptions: false,
    unserializableOptions: false
  },

  // Single thread for simplicity
  concurrency: 1
};
