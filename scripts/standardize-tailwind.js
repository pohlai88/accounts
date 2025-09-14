#!/usr/bin/env node

/**
 * Standardize Tailwind CSS configurations across the monorepo
 *
 * This script ensures all packages use the centralized @aibos/tailwind-preset
 * and removes any duplicate configurations or custom overrides.
 */

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Standard Tailwind configuration template
const STANDARD_TAILWIND_CONFIG = `/**
 * Tailwind Configuration
 *
 * Uses @aibos/tailwind-preset for consistent design system.
 * All utilities and theme extensions are centralized in the preset.
 */

const preset = require("@aibos/tailwind-preset");

module.exports = {
  presets: [preset],
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
    "./app/**/*.{ts,tsx,js,jsx}",
    "./components/**/*.{ts,tsx,js,jsx}",
    "./pages/**/*.{ts,tsx,js,jsx}",
    "../../packages/ui/src/**/*.{ts,tsx,js,jsx}",
    "../../packages/tokens/src/**/*.{ts,tsx,js,jsx}",
  ],
  // No additional theme extensions or plugins - everything comes from SSOT preset
  // This ensures zero drift and single source of truth
};
`;

// Package-specific content overrides
const PACKAGE_CONTENT_OVERRIDES = {
    "packages/ui": [
        "./src/**/*.{ts,tsx}",
        "../../packages/tokens/src/**/*.{ts,tsx}",
    ],
    "apps/web": [
        "../../packages/ui/src/**/*.{ts,tsx}",
        "../../packages/tokens/src/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
        "./components/**/*.{ts,tsx}",
    ],
    "apps/web-api": [
        "../../packages/ui/src/**/*.{ts,tsx}",
        "../../packages/tokens/src/**/*.{ts,tsx}",
        "./app/**/*.{ts,tsx}",
    ],
};

function standardizeTailwindConfig(packagePath) {
    const tailwindConfigPath = join(rootDir, packagePath, "tailwind.config.cjs");

    try {
        // Check if file exists
        const existingConfig = readFileSync(tailwindConfigPath, "utf8");

        // Create package-specific content
        const content = PACKAGE_CONTENT_OVERRIDES[packagePath] || [
            "./src/**/*.{ts,tsx,js,jsx}",
            "./app/**/*.{ts,tsx,js,jsx}",
            "./components/**/*.{ts,tsx,js,jsx}",
            "./pages/**/*.{ts,tsx,js,jsx}",
            "../../packages/ui/src/**/*.{ts,tsx,js,jsx}",
            "../../packages/tokens/src/**/*.{ts,tsx,js,jsx}",
        ];

        const packageSpecificConfig = `/**
 * Tailwind Configuration
 *
 * Uses @aibos/tailwind-preset for consistent design system.
 * All utilities and theme extensions are centralized in the preset.
 */

const preset = require("@aibos/tailwind-preset");

module.exports = {
  presets: [preset],
  content: ${JSON.stringify(content, null, 4)},
  // No additional theme extensions or plugins - everything comes from SSOT preset
  // This ensures zero drift and single source of truth
};
`;

        writeFileSync(tailwindConfigPath, packageSpecificConfig);
        console.log(`✅ Standardized ${packagePath}/tailwind.config.cjs`);
    } catch (error) {
        console.error(`❌ Error standardizing ${packagePath}:`, error.message);
    }
}

console.log("🎨 Standardizing Tailwind CSS configurations...\n");

// Standardize all packages with Tailwind configs
const packagesWithTailwind = [
    "packages/ui",
    "apps/web",
    "apps/web-api",
];

packagesWithTailwind.forEach(standardizeTailwindConfig);

console.log("\n✅ Tailwind CSS standardization complete!");
console.log("\n📊 Benefits achieved:");
console.log("  • Single source of truth for all Tailwind configurations");
console.log("  • Eliminated duplicate utilities and theme extensions");
console.log("  • Consistent content paths across all packages");
console.log("  • Zero configuration drift between packages");
console.log("  • Simplified maintenance and updates");
