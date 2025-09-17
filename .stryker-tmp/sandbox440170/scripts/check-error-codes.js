#!/usr/bin/env node
// @ts-nocheck

/**
 * Error Code Coverage Checker
 *
 * This script scans the accounting package source code for error codes
 * and verifies that each error code has corresponding test coverage.
 *
 * Usage: node scripts/check-error-codes.js
 */

const fs = require("fs");
const path = require("path");
const { glob } = require("glob");

const ERROR_CODE_PATTERN = /code:\s*["']([A-Z_]+)["']/g;
const TEST_FILE_PATTERN = "tests/**/*.test.ts";
const SOURCE_PATTERN = "packages/accounting/src/**/*.ts";

/**
 * Extract error codes from a file using regex pattern matching
 * @param {string} filePath - Path to the file to scan
 * @returns {string[]} Array of error codes found
 */
function extractErrorCodes(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const codes = [];
    let match;

    while ((match = ERROR_CODE_PATTERN.exec(content)) !== null) {
      codes.push(match[1]);
    }

    return codes;
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}: ${error.message}`);
    return [];
  }
}

/**
 * Check if a test file contains a specific error code
 * @param {string} testFilePath - Path to the test file
 * @param {string} errorCode - Error code to search for
 * @returns {boolean} True if error code is found in test file
 */
function testFileContainsErrorCode(testFilePath, errorCode) {
  try {
    const content = fs.readFileSync(testFilePath, "utf8");
    return content.includes(errorCode);
  } catch (error) {
    console.warn(`Warning: Could not read test file ${testFilePath}: ${error.message}`);
    return false;
  }
}

/**
 * Main function to check error code coverage
 */
async function checkErrorCodeCoverage() {
  console.log("🔍 Scanning for error codes in accounting package...\n");

  try {
    // Get all source files
    const sourceFiles = await glob(SOURCE_PATTERN);
    console.log(`📁 Found ${sourceFiles.length} source files`);

    // Get all test files
    const testFiles = await glob(TEST_FILE_PATTERN);
    console.log(`🧪 Found ${testFiles.length} test files\n`);

    const allErrorCodes = new Set();
    const coveredCodes = new Set();
    const errorCodeDetails = new Map();

    // Extract error codes from source files
    console.log("📊 Extracting error codes from source files...");
    sourceFiles.forEach(file => {
      const codes = extractErrorCodes(file);
      codes.forEach(code => {
        allErrorCodes.add(code);
        if (!errorCodeDetails.has(code)) {
          errorCodeDetails.set(code, []);
        }
        errorCodeDetails.get(code).push(file);
      });
    });

    console.log(`✅ Found ${allErrorCodes.size} unique error codes\n`);

    // Check test coverage for each error code
    console.log("🔍 Checking test coverage for error codes...");
    allErrorCodes.forEach(code => {
      const foundInTests = testFiles.some(testFile =>
        testFileContainsErrorCode(testFile, code)
      );

      if (foundInTests) {
        coveredCodes.add(code);
      }
    });

    // Calculate coverage percentage
    const coverage = allErrorCodes.size > 0 ? (coveredCodes.size / allErrorCodes.size) * 100 : 100;

    // Display results
    console.log("\n📈 Error Code Coverage Report");
    console.log("=" .repeat(50));
    console.log(`Coverage: ${coverage.toFixed(1)}%`);
    console.log(`Covered: ${coveredCodes.size}/${allErrorCodes.size}`);
    console.log(`Missing: ${allErrorCodes.size - coveredCodes.size}\n`);

    // Show covered error codes
    if (coveredCodes.size > 0) {
      console.log("✅ Covered Error Codes:");
      Array.from(coveredCodes).sort().forEach(code => {
        const files = errorCodeDetails.get(code);
        console.log(`  • ${code} (used in ${files.length} file${files.length > 1 ? 's' : ''})`);
      });
      console.log();
    }

    // Show missing error codes
    if (coverage < 100) {
      const missing = Array.from(allErrorCodes).filter(code => !coveredCodes.has(code));
      console.log("❌ Missing Test Coverage:");
      missing.forEach(code => {
        const files = errorCodeDetails.get(code);
        console.log(`  • ${code} (used in ${files.length} file${files.length > 1 ? 's' : ''})`);
        files.forEach(file => {
          console.log(`    - ${file}`);
        });
      });
      console.log();

      console.log("💡 To fix missing coverage:");
      console.log("  1. Add test cases that trigger these error codes");
      console.log("  2. Ensure tests verify the error code is returned");
      console.log("  3. Re-run this script to verify coverage\n");

      process.exit(1);
    } else {
      console.log("🎉 All error codes have test coverage!");
      console.log("✅ Error code coverage check passed\n");
    }

  } catch (error) {
    console.error("❌ Error during coverage check:", error.message);
    process.exit(1);
  }
}

// Run the coverage check
if (require.main === module) {
  checkErrorCodeCoverage().catch(error => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { checkErrorCodeCoverage, extractErrorCodes, testFileContainsErrorCode };
