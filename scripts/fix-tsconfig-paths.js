#!/usr/bin/env node

/**
 * Fix TypeScript configuration paths to use relative paths instead of @aibos/tsconfig/* aliases
 * This ensures TypeScript can properly resolve the configuration files
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Package configurations with their correct relative paths
const PACKAGE_TSCONFIG_FIXES = {
    // React libraries
    "packages/ui": {
        extends: "../../packages/config/tsconfig/react-lib.json"
    },

    // Node libraries
    "packages/accounting": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/auth": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/contracts": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/db": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/utils": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/cache": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/security": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/monitoring": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/realtime": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/api-gateway": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/deployment": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },
    "packages/tokens": {
        extends: "../../packages/config/tsconfig/node-lib.json"
    },

    // Next.js apps
    "apps/web": {
        extends: "../../packages/config/tsconfig/next-app.json"
    },
    "apps/web-api": {
        extends: "../../packages/config/tsconfig/next-app.json"
    }
};

function fixPackageTsconfig(packagePath, config) {
    const tsconfigPath = join(rootDir, packagePath, "tsconfig.json");

    try {
        const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
        tsconfig.extends = config.extends;
        writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + "\n");
        console.log(`✅ Fixed ${packagePath}/tsconfig.json`);
    } catch (error) {
        console.error(`❌ Error fixing ${packagePath}:`, error.message);
    }
}

console.log("🔧 Fixing TypeScript configuration paths...\n");

// Fix all packages
for (const [packagePath, config] of Object.entries(PACKAGE_TSCONFIG_FIXES)) {
    fixPackageTsconfig(packagePath, config);
}

console.log("\n✅ TypeScript path fixes complete!");
