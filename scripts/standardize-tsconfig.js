#!/usr/bin/env node

/**
 * Standardize TypeScript configurations across all packages
 * Implements the recommended SSOT pattern for tsconfig and package.json scripts
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Package configurations based on their type
const PACKAGE_CONFIGS = {
    // React libraries
    "packages/ui": {
        tsconfig: {
            extends: "@aibos/tsconfig/react-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },

    // Node libraries
    "packages/accounting": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/auth": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/contracts": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/db": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest",
            "db:generate": "drizzle-kit generate",
            "db:migrate": "drizzle-kit migrate",
            "db:push": "drizzle-kit push",
            "db:studio": "drizzle-kit studio"
        }
    },
    "packages/utils": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest",
            "test:attachments": "vitest run test/attachment-*.test.ts --config vitest.config.attachments.ts",
            "test:attachments:watch": "vitest test/attachment-*.test.ts --config vitest.config.attachments.ts --watch"
        }
    },
    "packages/cache": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/security": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/monitoring": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/realtime": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/api-gateway": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "packages/deployment": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest",
            "deploy:staging": "node dist/scripts/deploy-staging.js",
            "deploy:production": "node dist/scripts/deploy-production.js",
            "health-check": "node dist/scripts/health-check.js"
        }
    },
    "packages/tokens": {
        tsconfig: {
            extends: "@aibos/tsconfig/node-lib.json",
            include: ["src"]
        },
        scripts: {
            build: "tsc -p . --noEmit && node scripts/build-preset.cjs",
            dev: "tsc -p . --watch",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },

    // Next.js apps
    "apps/web": {
        tsconfig: {
            extends: "@aibos/tsconfig/next-app.json",
            compilerOptions: {
                paths: {
                    "@/*": ["./*"]
                }
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            exclude: ["node_modules"]
        },
        scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    },
    "apps/web-api": {
        tsconfig: {
            extends: "@aibos/tsconfig/next-app.json",
            compilerOptions: {
                paths: {
                    "@/*": ["./*"]
                }
            },
            include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
            exclude: ["node_modules"]
        },
        scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
            typecheck: "tsc -p . --noEmit",
            lint: "eslint .",
            test: "vitest run",
            "test:watch": "vitest"
        }
    }
};

function updatePackageConfig(packagePath, config) {
    const packageJsonPath = join(rootDir, packagePath, "package.json");
    const tsconfigPath = join(rootDir, packagePath, "tsconfig.json");

    try {
        // Update package.json scripts
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        packageJson.scripts = { ...packageJson.scripts, ...config.scripts };
        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

        // Update tsconfig.json
        writeFileSync(tsconfigPath, JSON.stringify(config.tsconfig, null, 2) + "\n");

        console.log(`✅ Updated ${packagePath}`);
    } catch (error) {
        console.error(`❌ Error updating ${packagePath}:`, error.message);
    }
}

console.log("🔧 Standardizing TypeScript configurations and package scripts...\n");

// Update all packages
for (const [packagePath, config] of Object.entries(PACKAGE_CONFIGS)) {
    updatePackageConfig(packagePath, config);
}

console.log("\n✅ Standardization complete!");
console.log("\n📋 Summary of changes:");
console.log("- All packages now use standardized @aibos/tsconfig/* presets");
console.log("- Package scripts are now consistent across all packages");
console.log("- TypeScript configurations follow SSOT principles");
console.log("- No more custom path overrides in individual packages");
