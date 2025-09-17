#!/usr/bin/env node

/**
 * Quick Mutation Test Verification
 *
 * This script runs a minimal mutation test to verify our configuration
 * and test quality improvements are working before running the full test.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Quick Mutation Test Verification');
console.log('=====================================\n');

// Check if Stryker is installed
try {
  execSync('npx stryker --version', { stdio: 'pipe' });
  console.log('✅ Stryker is installed');
} catch (error) {
  console.log('❌ Stryker not found. Installing...');
  execSync('pnpm install @stryker-mutator/core @stryker-mutator/vitest-runner', { stdio: 'inherit' });
}

// Check if our test files exist
const testFiles = [
  'tests/unit/accounting/payment-processing-enhanced.test.ts',
  'tests/unit/accounting/payment-processing.test.ts',
  'tests/unit/accounting/payment-processing-focused.test.ts',
  'tests/unit/accounting/payment-processing-optimized.test.ts'
];

console.log('\n📁 Checking test files...');
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check if our source file exists
const sourceFile = 'packages/accounting/src/ap/payment-processing.ts';
if (fs.existsSync(sourceFile)) {
  console.log(`✅ ${sourceFile}`);
} else {
  console.log(`❌ ${sourceFile} - Missing`);
}

// Run a quick unit test to verify tests are working
console.log('\n🧪 Running quick unit test...');
try {
  const result = execSync('pnpm test:unit', {
    stdio: 'pipe',
    timeout: 30000 // 30 second timeout
  });
  console.log('✅ Unit tests are running');
} catch (error) {
  console.log('❌ Unit tests failed:', error.message);
}

// Check Stryker configuration
console.log('\n⚙️  Checking Stryker configuration...');
const configFile = 'stryker.conf.cjs';
if (fs.existsSync(configFile)) {
  const config = fs.readFileSync(configFile, 'utf8');

  if (config.includes('packages/accounting/src/ap/payment-processing.ts')) {
    console.log('✅ Mutation target file configured');
  } else {
    console.log('❌ Mutation target file not configured');
  }

  if (config.includes('**/*.html')) {
    console.log('✅ HTML files excluded');
  } else {
    console.log('❌ HTML files not excluded');
  }

  if (config.includes('**/.accountsignore_legacy/**')) {
    console.log('✅ Legacy files excluded');
  } else {
    console.log('❌ Legacy files not excluded');
  }
} else {
  console.log('❌ Stryker configuration file missing');
}

// Run a minimal mutation test (5 minutes max)
console.log('\n🔬 Running minimal mutation test (5 minutes max)...');
console.log('This will test a small subset of mutations to verify our setup.');

try {
  // Create a temporary minimal config
  const minimalConfig = `
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
`;

  fs.writeFileSync('stryker.quick.conf.cjs', minimalConfig);

  console.log('⏱️  Starting quick mutation test...');
  const startTime = Date.now();

  const result = execSync('npx stryker run -c stryker.quick.conf.cjs', {
    stdio: 'inherit',
    timeout: 300000 // 5 minutes max
  });

  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n✅ Quick mutation test completed in ${duration} seconds`);

  // Clean up
  fs.unlinkSync('stryker.quick.conf.cjs');

} catch (error) {
  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n❌ Quick mutation test failed after ${duration} seconds`);
  console.log('Error:', error.message);

  // Clean up
  if (fs.existsSync('stryker.quick.conf.cjs')) {
    fs.unlinkSync('stryker.quick.conf.cjs');
  }
}

console.log('\n📊 Quick Test Summary');
console.log('====================');
console.log('If the quick test shows:');
console.log('- ✅ Some mutants killed: Our tests are working');
console.log('- ❌ All mutants surviving: Need to improve test quality');
console.log('- ⏱️  Fast execution: Configuration is optimized');
console.log('- 🐌 Slow execution: Need to optimize further');

console.log('\n🎯 Next Steps');
console.log('=============');
console.log('1. If quick test passes: Run full mutation test');
console.log('2. If quick test fails: Improve test quality first');
console.log('3. If quick test is slow: Optimize configuration further');
