/**
 * Stryker Mutation Testing Configuration
 *
 * This configuration runs mutation testing on core accounting business logic
 * to ensure our tests catch real bugs and edge cases.
 */
// @ts-nocheck


module.exports = {
  // Files to mutate (core business logic only)
  mutate: [
    "packages/accounting/src/ap/payment-processing.ts",
    "packages/accounting/src/posting.ts",
    "packages/accounting/src/ar/invoice-posting.ts"
  ],

  // Test runner configuration
  testRunner: "command",
  commandRunner: {
    command: "pnpm test:unit"
  },

  // Reporter configuration
  reporters: ["progress", "html"],

  // Coverage analysis
  coverageAnalysis: "perTest",

  // Thresholds for mutation testing
  thresholds: {
    high: 80,
    low: 70,
    break: 80
  },

  // Timeout configuration
  timeoutMS: 60000,

  // Logging configuration
  logLevel: "info",

  // Ignore patterns
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],

  // Mutation testing options
  excludedMutations: [
    "StringLiteral",
    "TemplateLiteral",
    "ArrayDeclaration"
  ],

  // Concurrency
  concurrency: 2,

  // HTML reporter configuration
  htmlReporter: {
    fileName: "reports/mutation/mutation-report.html"
  }
};
