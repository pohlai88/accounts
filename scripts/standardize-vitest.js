#!/usr/bin/env node

/**
 * Standardize Vitest configurations across the monorepo
 *
 * This script ensures all packages use the centralized @aibos/vitest-config
 * and removes any duplicate configurations or custom overrides.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Package-specific Vitest configurations
const PACKAGE_VITEST_CONFIGS = {
    // UI package - React components with jsdom
    "packages/ui": {
        imports: "import base, { jsdomConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  jsdomConfig,
  defineConfig({
    test: {
      // UI-specific overrides
      setupFiles: [],
      // React component testing optimizations
      environmentOptions: {
        jsdom: {
          resources: "usable",
        },
      },
    },
  }),
);`
    },

    // Accounting package - High coverage requirements
    "packages/accounting": {
        imports: "import base, { nodeConfig, accountingCoverageConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  accountingCoverageConfig,
  defineConfig({
    test: {
      // Accounting-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    // Auth package - Standard node environment
    "packages/auth": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Auth-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    // Security package - High coverage requirements
    "packages/security": {
        imports: "import base, { nodeConfig, securityCoverageConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  securityCoverageConfig,
  defineConfig({
    test: {
      // Security-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    // DB package - Standard coverage requirements
    "packages/db": {
        imports: "import base, { nodeConfig, dbCoverageConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  dbCoverageConfig,
  defineConfig({
    test: {
      // DB-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    // Other packages - Standard configuration
    "packages/contracts": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    "packages/cache": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    "packages/monitoring": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    "packages/realtime": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    "packages/api-gateway": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    "packages/deployment": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    "packages/tokens": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Package-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    // Utils package - Special attachment service config
    "packages/utils": {
        imports: "import base, { nodeConfig, attachmentConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  attachmentConfig,
  defineConfig({
    test: {
      // Utils-specific overrides
      setupFiles: [],
    },
  }),
);`
    },

    // Integration tests
    "tests/integration": {
        imports: "import base, { integrationConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  integrationConfig,
  defineConfig({
    test: {
      // Integration-specific overrides
      teardownTimeout: 10000,
    },
  }),
);`
    },

    // Test setup
    "tests/setup": {
        imports: "import base, { nodeConfig } from \"@aibos/vitest-config\";",
        config: `export default mergeConfig(
  base,
  nodeConfig,
  defineConfig({
    test: {
      // Setup-specific overrides
      setupFiles: [],
    },
  }),
);`
    }
};

function standardizeVitestConfig(packagePath, config) {
    const vitestConfigPath = join(rootDir, packagePath, "vitest.config.ts");

    try {
        // Check if file exists
        const existingConfig = readFileSync(vitestConfigPath, "utf8");

        const standardizedConfig = `/**
 * Vitest Configuration
 *
 * Uses @aibos/vitest-config for consistent testing across the monorepo.
 * All utilities and configurations are centralized in the preset.
 */

import { defineConfig, mergeConfig } from "vitest/config";
${config.imports}

${config.config}
`;

        writeFileSync(vitestConfigPath, standardizedConfig);
        console.log(`✅ Standardized ${packagePath}/vitest.config.ts`);
    } catch (error) {
        console.error(`❌ Error standardizing ${packagePath}:`, error.message);
    }
}

console.log("🧪 Standardizing Vitest configurations...\n");

// Standardize all packages with Vitest configs
for (const [packagePath, config] of Object.entries(PACKAGE_VITEST_CONFIGS)) {
    standardizeVitestConfig(packagePath, config);
}

console.log("\n✅ Vitest standardization complete!");
console.log("\n📊 Benefits achieved:");
console.log("  • Single source of truth for all Vitest configurations");
console.log("  • Eliminated duplicate resolve aliases and coverage settings");
console.log("  • Consistent test patterns across all packages");
console.log("  • Zero configuration drift between packages");
console.log("  • Simplified maintenance and updates");
console.log("  • Package-specific coverage requirements centralized");
