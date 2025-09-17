// @ts-nocheck
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔬 Minimal Mutation Test');
console.log('========================');

// Create a minimal test file for mutation testing
const minimalTestContent = `
import { describe, it, expect } from 'vitest';

describe('Minimal Mutation Test', () => {
  it('should test basic arithmetic', () => {
    const add = (a, b) => a + b;
    expect(add(2, 3)).toBe(5);
    expect(add(0, 0)).toBe(0);
    expect(add(-1, 1)).toBe(0);
  });

  it('should test string operations', () => {
    const greet = (name) => \`Hello \${name}\`;
    expect(greet('World')).toBe('Hello World');
    expect(greet('')).toBe('Hello ');
  });
});
`;

// Create a minimal source file to mutate
const minimalSourceContent = `
export function add(a, b) {
  return a + b;
}

export function greet(name) {
  return \`Hello \${name}\`;
}

export function multiply(a, b) {
  return a * b;
}
`;

// Write test files
fs.writeFileSync('test-minimal.test.ts', minimalTestContent);
fs.writeFileSync('src-minimal.ts', minimalSourceContent);

// Create minimal Stryker config
const minimalConfig = `
module.exports = {
  mutate: ["src-minimal.ts"],
  testRunner: "command",
  commandRunner: {
    command: "npx vitest run test-minimal.test.ts"
  },
  reporters: ["progress"],
  coverageAnalysis: "off",
  timeoutMS: 15000,
  logLevel: "error",
  ignorePatterns: [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.git/**",
    "**/coverage/**",
    "**/*.d.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  warnings: {
    unknownOptions: false,
    unserializableOptions: false
  },
  concurrency: 1
};
`;

fs.writeFileSync('stryker-minimal.conf.cjs', minimalConfig);

console.log('📁 Created minimal test files:');
console.log('  - test-minimal.test.ts');
console.log('  - src-minimal.ts');
console.log('  - stryker-minimal.conf.cjs');

console.log('\n🧪 Running minimal mutation test...');
console.log('This should complete in under 30 seconds');

try {
  const startTime = Date.now();
  const result = execSync('npx stryker run -c stryker-minimal.conf.cjs', { 
    stdio: 'inherit',
    timeout: 60000 // 1 minute max
  });
  
  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n✅ Minimal mutation test completed in ${duration} seconds`);
  
  // Clean up
  fs.unlinkSync('test-minimal.test.ts');
  fs.unlinkSync('src-minimal.ts');
  fs.unlinkSync('stryker-minimal.conf.cjs');
  
  console.log('✅ Mutation testing setup is working!');
  console.log('\n🎯 You can now run the full mutation test:');
  console.log('npx stryker run -c stryker.quick.conf.cjs');
  
} catch (error) {
  const duration = Math.round((Date.now() - startTime) / 1000);
  console.log(`\n❌ Minimal mutation test failed after ${duration} seconds`);
  console.log('Error:', error.message);
  
  // Clean up
  try {
    fs.unlinkSync('test-minimal.test.ts');
    fs.unlinkSync('src-minimal.ts');
    fs.unlinkSync('stryker-minimal.conf.cjs');
  } catch (cleanupError) {
    // Ignore cleanup errors
  }
  
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Check if Vitest is installed: npx vitest --version');
  console.log('2. Check if Stryker is installed: npx stryker --version');
  console.log('3. Try running the test manually: npx vitest run test-minimal.test.ts');
}
