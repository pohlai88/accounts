// @ts-nocheck

module.exports = {
  mutate: [
    "packages/accounting/src/ap/payment-processing.ts"
  ],
  testRunner: "command",
  commandRunner: {
    command: "pnpm test:unit"
  },
  reporters: ["progress"],
  coverageAnalysis: "perTest",
  thresholds: {
    high: 20,
    low: 10,
    break: null
  },
  timeoutMS: 30000,
  logLevel: "info",
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
    "**/services/**"
  ],
  excludedMutations: [
    "StringLiteral",
    "TemplateLiteral",
    "ArrayDeclaration"
  ],
  concurrency: 1
};
