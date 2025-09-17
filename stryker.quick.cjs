/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
    mutate: [
        "packages/accounting/src/posting/invoice.ts",
        "packages/accounting/src/posting/bill.ts",
        "packages/accounting/src/posting/payment.ts",
        "packages/accounting/src/posting/journal.ts"
    ],
    testRunner: "vitest",
    vitest: {
        configFile: "vitest.config.ts",
        // Narrow tests to the accounting package only:
        testFilePattern: ["packages/accounting/tests/**/*.test.ts"],
        // Speed: only run related tests for each mutant (Vitest supports this)
        enableFindRelatedTests: true
    },
    reporters: ["progress", "clear-text", "html"],
    coverageAnalysis: "perTest",
    // Performance controls
    concurrency: 4,                // tune for your CI runner
    timeoutMS: 30000,              // per mutant
    maxTestRunnerReuse: 10,        // recycle runners for speed
    cleanTempDir: true,
    // Keep it simple: rely on default mutators; do not configure deprecated 'mutator' key
    symlinkNodeModules: true,
    thresholds: { high: 80, low: 70, break: 80 }
};
