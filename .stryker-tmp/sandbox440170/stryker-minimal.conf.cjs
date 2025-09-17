// @ts-nocheck

module.exports = {
  mutate: ["src-minimal.ts"],
  testRunner: "command",
  commandRunner: {
    command: "npx vitest run test-minimal.test.ts"
  },
  reporters: ["progress"],
  coverageAnalysis: "off",
  timeoutMS: 15000,
  logLevel: "error",
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
  warnings: {
    unknownOptions: false,
    unserializableOptions: false
  },
  concurrency: 1
};
