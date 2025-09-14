#!/usr/bin/env node

/**
 * Standardize package scripts to align with Turbo pipeline
 *
 * This script ensures all packages have consistent scripts that work
 * with the optimized Turbo pipeline configuration.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Standard package scripts based on package type
const PACKAGE_SCRIPTS = {
    // React library packages (UI components)
    "ui": {
        "build": "tsc -p . --noEmit",
        "dev": "tsc -p . --watch",
        "typecheck": "tsc -p . --noEmit",
        "lint": "eslint .",
        "test": "vitest run",
        "test:watch": "vitest",
        "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json}\"",
        "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json}\""
    },

    // Node library packages (auth, db, utils, etc.)
    "node-lib": {
        "build": "tsc -p . --noEmit",
        "dev": "tsc -p . --watch",
        "typecheck": "tsc -p . --noEmit",
        "lint": "eslint .",
        "test": "vitest run",
        "test:watch": "vitest",
        "format": "prettier --write \"src/**/*.{ts,js,json}\"",
        "format:check": "prettier --check \"src/**/*.{ts,js,json}\""
    },

    // Next.js applications
    "next-app": {
        "build": "next build",
        "dev": "next dev",
        "start": "next start",
        "typecheck": "tsc -p . --noEmit",
        "lint": "eslint .",
        "test": "vitest run",
        "test:watch": "vitest",
        "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json}\"",
        "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json}\""
    },

    // Services (worker, etc.)
    "service": {
        "build": "tsc -p . --noEmit",
        "dev": "tsc -p . --watch",
        "typecheck": "tsc -p . --noEmit",
        "lint": "eslint .",
        "test": "vitest run",
        "test:watch": "vitest",
        "format": "prettier --write \"src/**/*.{ts,js,json}\"",
        "format:check": "prettier --check \"src/**/*.{ts,js,json}\""
    }
};

// Package type mapping
const PACKAGE_TYPES = {
    "packages/ui": "ui",
    "packages/accounting": "node-lib",
    "packages/auth": "node-lib",
    "packages/contracts": "node-lib",
    "packages/db": "node-lib",
    "packages/utils": "node-lib",
    "packages/cache": "node-lib",
    "packages/security": "node-lib",
    "packages/monitoring": "node-lib",
    "packages/realtime": "node-lib",
    "packages/api-gateway": "node-lib",
    "packages/deployment": "node-lib",
    "packages/tokens": "node-lib",
    "apps/web": "next-app",
    "apps/web-api": "next-app",
    "services/worker": "service"
};

function standardizePackageScripts(packagePath, packageType) {
    const packageJsonPath = join(rootDir, packagePath, "package.json");

    try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
        const standardScripts = PACKAGE_SCRIPTS[packageType];

        if (!standardScripts) {
            console.log(`⚠️  No standard scripts defined for package type: ${packageType}`);
            return;
        }

        // Update scripts section
        packageJson.scripts = {
            ...packageJson.scripts,
            ...standardScripts
        };

        // Ensure required scripts are present
        const requiredScripts = ["build", "dev", "typecheck", "lint", "test", "format", "format:check"];
        for (const script of requiredScripts) {
            if (!packageJson.scripts[script]) {
                console.log(`⚠️  Missing required script '${script}' in ${packagePath}`);
            }
        }

        writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");
        console.log(`✅ Standardized ${packagePath}/package.json scripts`);
    } catch (error) {
        console.error(`❌ Error standardizing ${packagePath}:`, error.message);
    }
}

console.log("🚀 Standardizing package scripts for Turbo pipeline...\n");

// Standardize all packages
for (const [packagePath, packageType] of Object.entries(PACKAGE_TYPES)) {
    standardizePackageScripts(packagePath, packageType);
}

console.log("\n✅ Package script standardization complete!");
console.log("\n📊 Benefits achieved:");
console.log("  • Consistent scripts across all packages");
console.log("  • Alignment with optimized Turbo pipeline");
console.log("  • One-way build flow: lint → typecheck → build → test");
console.log("  • Standardized formatting and quality checks");
console.log("  • Simplified maintenance and debugging");
