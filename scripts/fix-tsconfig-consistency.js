#!/usr/bin/env node

/**
 * Script to standardize TypeScript configurations across packages
 * Ensures consistent compilation settings for better error detection
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Packages with standalone tsconfig that should extend base config
const packagesNeedingTsconfigFix = [
    'packages/cache',
    'packages/api-gateway',
    'packages/realtime'
];

// Standard tsconfig template for packages extending base config
const standardTsconfigTemplate = {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
        "outDir": "dist",
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true
    },
    "include": ["src/**/*"],
    "exclude": ["dist", "node_modules", "**/*.test.ts", "**/*.spec.ts"]
};

function fixTsconfig(packagePath) {
    const tsconfigPath = join(rootDir, packagePath, 'tsconfig.json');

    try {
        const currentConfig = JSON.parse(readFileSync(tsconfigPath, 'utf8'));

        // Check if already extends base config
        if (currentConfig.extends) {
            console.log(`✅ ${packagePath} already extends base config`);
            return;
        }

        // Create new config that extends base
        const newConfig = {
            ...standardTsconfigTemplate,
            compilerOptions: {
                ...standardTsconfigTemplate.compilerOptions,
                // Preserve any package-specific options
                ...currentConfig.compilerOptions,
                // Override with standard settings
                outDir: "dist",
                declaration: true,
                declarationMap: true,
                sourceMap: true
            }
        };

        writeFileSync(tsconfigPath, JSON.stringify(newConfig, null, 2) + '\n');
        console.log(`✅ Updated ${packagePath} to extend base tsconfig`);

    } catch (error) {
        console.error(`❌ Error processing ${packagePath}:`, error.message);
    }
}

console.log('🔧 Standardizing TypeScript configurations...\n');

packagesNeedingTsconfigFix.forEach(fixTsconfig);

console.log('\n✅ TypeScript configuration fixes completed!');
console.log('\nBenefits:');
console.log('- Consistent compilation settings across all packages');
console.log('- Better error detection with standardized strict settings');
console.log('- Easier maintenance with centralized base configuration');
