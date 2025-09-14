#!/usr/bin/env node

/**
 * Script to fix missing typecheck and lint scripts across all packages
 * This ensures consistent error detection across the monorepo
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Packages that need typecheck script added
const packagesNeedingTypecheck = [
    'packages/accounting',
    'packages/auth',
    'packages/cache',
    'packages/contracts',
    'packages/db',
    'packages/utils',
    'packages/api-gateway',
    'packages/monitoring',
    'packages/realtime',
    'packages/deployment',
    'services/worker',
    'apps/web',
    'apps/web-api'
];

// Packages that need lint script added
const packagesNeedingLint = [
    'packages/cache',
    'packages/api-gateway',
    'packages/monitoring',
    'packages/realtime',
    'packages/deployment',
    'apps/web-api'
];

// Fix typecheck script naming inconsistency
const packagesWithInconsistentTypecheck = [
    'packages/security' // has "type-check" instead of "typecheck"
];

function fixPackageJson(packagePath, fixes) {
    const packageJsonPath = join(rootDir, packagePath, 'package.json');

    try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        let modified = false;

        // Add missing scripts
        if (fixes.addTypecheck && !packageJson.scripts?.typecheck) {
            packageJson.scripts = packageJson.scripts || {};
            packageJson.scripts.typecheck = 'tsc --noEmit';
            modified = true;
            console.log(`✅ Added typecheck script to ${packagePath}`);
        }

        if (fixes.addLint && !packageJson.scripts?.lint) {
            packageJson.scripts = packageJson.scripts || {};
            packageJson.scripts.lint = 'eslint .';
            modified = true;
            console.log(`✅ Added lint script to ${packagePath}`);
        }

        // Fix inconsistent naming
        if (fixes.fixTypecheckNaming && packageJson.scripts?.['type-check']) {
            packageJson.scripts.typecheck = packageJson.scripts['type-check'];
            delete packageJson.scripts['type-check'];
            modified = true;
            console.log(`✅ Fixed typecheck script naming in ${packagePath}`);
        }

        if (modified) {
            writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        }

    } catch (error) {
        console.error(`❌ Error processing ${packagePath}:`, error.message);
    }
}

console.log('🔧 Fixing missing scripts across packages...\n');

// Fix packages needing typecheck
packagesNeedingTypecheck.forEach(packagePath => {
    fixPackageJson(packagePath, { addTypecheck: true });
});

// Fix packages needing lint
packagesNeedingLint.forEach(packagePath => {
    fixPackageJson(packagePath, { addLint: true });
});

// Fix inconsistent naming
packagesWithInconsistentTypecheck.forEach(packagePath => {
    fixPackageJson(packagePath, { fixTypecheckNaming: true });
});

console.log('\n✅ Script fixes completed!');
console.log('\nNext steps:');
console.log('1. Run: pnpm -w run typecheck');
console.log('2. Run: pnpm -w run lint');
console.log('3. Verify all packages now have consistent error detection');
