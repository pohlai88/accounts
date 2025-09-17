#!/usr/bin/env node

/**
 * AI-BOS Accounting SaaS - Phase 5 Validation Script
 * ============================================================================
 * Validates Phase 5: Test Implementation & Validation completion
 * Follows SSOT principles and high-quality standards
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
    // Phase 5 completion criteria
    criteria: {
        apiGatewayTests: 6,        // API Gateway E2E tests
        goldenFlowsTests: 10,      // Golden flows tests
        integrationTests: 150,     // Comprehensive integration tests
        coverageThreshold: 80,     // Minimum coverage percentage
    },

    // Test file locations
    testFiles: {
        apiGateway: 'packages/api/tests/integration/gateway.e2e.test.ts',
        goldenFlows: 'tests/integration/golden-flows.test.ts',
        comprehensive: 'tests/integration/comprehensive-integration.test.ts',
    },

    // Coverage thresholds
    coverage: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
    },

    // Output files
    output: {
        report: 'phase-5-validation-report.json',
        summary: 'phase-5-summary.md',
    },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Log with timestamp
 * @param {string} message - Message to log
 * @param {string} level - Log level (info, warn, error)
 */
function log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
        info: '✓',
        warn: '⚠',
        error: '✗',
    }[level];

    console.log(`[${timestamp}] ${prefix} ${message}`);
}

/**
 * Check if file exists
 * @param {string} filePath - File path to check
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

/**
 * Count test cases in file
 * @param {string} filePath - Test file path
 * @returns {number} Number of test cases
 */
function countTestCases(filePath) {
    if (!fileExists(filePath)) {
        return 0;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // Count it() and test() calls
        const itMatches = content.match(/\bit\s*\(/g) || [];
        const testMatches = content.match(/\btest\s*\(/g) || [];

        return itMatches.length + testMatches.length;
    } catch (error) {
        log(`Failed to count test cases in ${filePath}: ${error.message}`, 'error');
        return 0;
    }
}

/**
 * Execute command and return output
 * @param {string} command - Command to execute
 * @param {object} options - Execution options
 * @returns {string} Command output
 */
function execCommand(command, options = {}) {
    try {
        return execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe',
            ...options
        });
    } catch (error) {
        log(`Command failed: ${command}`, 'error');
        log(error.message, 'error');
        throw error;
    }
}

/**
 * Read JSON file
 * @param {string} filePath - JSON file path
 * @returns {object} Parsed JSON data
 */
function readJsonFile(filePath) {
    if (!fileExists(filePath)) {
        return null;
    }

    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        log(`Failed to read JSON file: ${filePath}`, 'error');
        return null;
    }
}

/**
 * Write JSON file
 * @param {string} filePath - JSON file path
 * @param {object} data - Data to write
 */
function writeJsonFile(filePath, data) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        log(`Written file: ${filePath}`);
    } catch (error) {
        log(`Failed to write JSON file: ${filePath}`, 'error');
        throw error;
    }
}

/**
 * Write markdown file
 * @param {string} filePath - Markdown file path
 * @param {string} content - Markdown content
 */
function writeMarkdownFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, content);
        log(`Written file: ${filePath}`);
    } catch (error) {
        log(`Failed to write markdown file: ${filePath}`, 'error');
        throw error;
    }
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate API Gateway E2E tests
 * @returns {object} Validation result
 */
function validateApiGatewayTests() {
    log('Validating API Gateway E2E tests...');

    const filePath = CONFIG.testFiles.apiGateway;
    const testCount = countTestCases(filePath);

    const result = {
        file: filePath,
        expected: CONFIG.criteria.apiGatewayTests,
        actual: testCount,
        passed: testCount >= CONFIG.criteria.apiGatewayTests,
        status: testCount >= CONFIG.criteria.apiGatewayTests ? 'PASSED' : 'FAILED',
    };

    log(`API Gateway E2E tests: ${testCount}/${CONFIG.criteria.apiGatewayTests} (${result.status})`);

    return result;
}

/**
 * Validate Golden Flows tests
 * @returns {object} Validation result
 */
function validateGoldenFlowsTests() {
    log('Validating Golden Flows tests...');

    const filePath = CONFIG.testFiles.goldenFlows;
    const testCount = countTestCases(filePath);

    const result = {
        file: filePath,
        expected: CONFIG.criteria.goldenFlowsTests,
        actual: testCount,
        passed: testCount >= CONFIG.criteria.goldenFlowsTests,
        status: testCount >= CONFIG.criteria.goldenFlowsTests ? 'PASSED' : 'FAILED',
    };

    log(`Golden Flows tests: ${testCount}/${CONFIG.criteria.goldenFlowsTests} (${result.status})`);

    return result;
}

/**
 * Validate Comprehensive Integration tests
 * @returns {object} Validation result
 */
function validateComprehensiveTests() {
    log('Validating Comprehensive Integration tests...');

    const filePath = CONFIG.testFiles.comprehensive;
    const testCount = countTestCases(filePath);

    const result = {
        file: filePath,
        expected: CONFIG.criteria.integrationTests,
        actual: testCount,
        passed: testCount >= CONFIG.criteria.integrationTests,
        status: testCount >= CONFIG.criteria.integrationTests ? 'PASSED' : 'FAILED',
    };

    log(`Comprehensive Integration tests: ${testCount}/${CONFIG.criteria.integrationTests} (${result.status})`);

    return result;
}

/**
 * Validate test coverage
 * @returns {object} Coverage validation result
 */
function validateTestCoverage() {
    log('Validating test coverage...');

    try {
        // Run coverage analysis
        execCommand('pnpm test:coverage');

        // Read coverage summary
        const coverageFile = 'coverage/coverage-summary.json';
        const coverageData = readJsonFile(coverageFile);

        if (!coverageData) {
            return {
                passed: false,
                status: 'FAILED',
                error: 'Coverage data not found',
                details: {},
            };
        }

        const summary = coverageData.total || {};
        const details = {};
        let passed = true;

        // Check each coverage metric
        Object.keys(CONFIG.coverage).forEach(metric => {
            const actual = summary[metric]?.pct || 0;
            const threshold = CONFIG.coverage[metric];

            details[metric] = {
                actual,
                threshold,
                passed: actual >= threshold,
            };

            if (actual < threshold) {
                passed = false;
            }
        });

        const result = {
            passed,
            status: passed ? 'PASSED' : 'FAILED',
            details,
            summary: {
                statements: summary.statements?.pct || 0,
                branches: summary.branches?.pct || 0,
                functions: summary.functions?.pct || 0,
                lines: summary.lines?.pct || 0,
            },
        };

        log(`Test coverage: ${result.status}`);
        log(`Statements: ${result.summary.statements}% (threshold: ${CONFIG.coverage.statements}%)`);
        log(`Branches: ${result.summary.branches}% (threshold: ${CONFIG.coverage.branches}%)`);
        log(`Functions: ${result.summary.functions}% (threshold: ${CONFIG.coverage.functions}%)`);
        log(`Lines: ${result.summary.lines}% (threshold: ${CONFIG.coverage.lines}%)`);

        return result;

    } catch (error) {
        log(`Coverage validation failed: ${error.message}`, 'error');
        return {
            passed: false,
            status: 'FAILED',
            error: error.message,
            details: {},
        };
    }
}

/**
 * Validate test execution
 * @returns {object} Test execution result
 */
function validateTestExecution() {
    log('Validating test execution...');

    try {
        // Run all tests
        const output = execCommand('pnpm test:run');

        // Parse test results
        const lines = output.split('\n');
        let passed = 0;
        let failed = 0;
        let skipped = 0;

        lines.forEach(line => {
            if (line.includes('✓') && line.includes('passed')) {
                const match = line.match(/(\d+)\s+passed/);
                if (match) {
                    passed += parseInt(match[1]);
                }
            } else if (line.includes('✗') && line.includes('failed')) {
                const match = line.match(/(\d+)\s+failed/);
                if (match) {
                    failed += parseInt(match[1]);
                }
            } else if (line.includes('skipped')) {
                const match = line.match(/(\d+)\s+skipped/);
                if (match) {
                    skipped += parseInt(match[1]);
                }
            }
        });

        const result = {
            passed: failed === 0,
            status: failed === 0 ? 'PASSED' : 'FAILED',
            details: {
                passed,
                failed,
                skipped,
                total: passed + failed + skipped,
            },
        };

        log(`Test execution: ${result.status}`);
        log(`Passed: ${passed}, Failed: ${failed}, Skipped: ${skipped}`);

        return result;

    } catch (error) {
        log(`Test execution validation failed: ${error.message}`, 'error');
        return {
            passed: false,
            status: 'FAILED',
            error: error.message,
            details: {},
        };
    }
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate validation report
 * @param {object} results - Validation results
 * @returns {object} Comprehensive report
 */
function generateValidationReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        phase: 'Phase 5: Test Implementation & Validation',
        summary: {
            overall: results.every(r => r.passed),
            totalTests: results.reduce((sum, r) => sum + (r.details?.total || 0), 0),
            passedTests: results.reduce((sum, r) => sum + (r.details?.passed || 0), 0),
            failedTests: results.reduce((sum, r) => sum + (r.details?.failed || 0), 0),
        },
        validations: results,
        criteria: CONFIG.criteria,
        recommendations: generateRecommendations(results),
    };

    return report;
}

/**
 * Generate recommendations based on results
 * @param {object} results - Validation results
 * @returns {array} Recommendations
 */
function generateRecommendations(results) {
    const recommendations = [];

    results.forEach(result => {
        if (!result.passed) {
            if (result.file) {
                recommendations.push(`Add more tests to ${result.file} (${result.actual}/${result.expected})`);
            } else if (result.error) {
                recommendations.push(`Fix error: ${result.error}`);
            } else if (result.details) {
                Object.entries(result.details).forEach(([metric, data]) => {
                    if (data.actual < data.threshold) {
                        recommendations.push(`Improve ${metric} coverage: ${data.actual}% < ${data.threshold}%`);
                    }
                });
            }
        }
    });

    if (recommendations.length === 0) {
        recommendations.push('All Phase 5 criteria have been met successfully!');
    }

    return recommendations;
}

/**
 * Generate markdown summary
 * @param {object} report - Validation report
 * @returns {string} Markdown content
 */
function generateMarkdownSummary(report) {
    const { summary, validations, criteria, recommendations } = report;

    return `# Phase 5: Test Implementation & Validation - Validation Report

## 📊 Summary

- **Overall Status**: ${summary.overall ? '✅ PASSED' : '❌ FAILED'}
- **Total Tests**: ${summary.totalTests}
- **Passed Tests**: ${summary.passedTests}
- **Failed Tests**: ${summary.failedTests}

## 🎯 Validation Results

### API Gateway E2E Tests
- **Status**: ${validations[0]?.status || 'UNKNOWN'}
- **Tests**: ${validations[0]?.actual || 0}/${criteria.apiGatewayTests}
- **File**: ${validations[0]?.file || 'N/A'}

### Golden Flows Tests
- **Status**: ${validations[1]?.status || 'UNKNOWN'}
- **Tests**: ${validations[1]?.actual || 0}/${criteria.goldenFlowsTests}
- **File**: ${validations[1]?.file || 'N/A'}

### Comprehensive Integration Tests
- **Status**: ${validations[2]?.status || 'UNKNOWN'}
- **Tests**: ${validations[2]?.actual || 0}/${criteria.integrationTests}
- **File**: ${validations[2]?.file || 'N/A'}

### Test Coverage
- **Status**: ${validations[3]?.status || 'UNKNOWN'}
- **Statements**: ${validations[3]?.summary?.statements || 0}% (threshold: ${criteria.coverageThreshold}%)
- **Branches**: ${validations[3]?.summary?.branches || 0}% (threshold: 75%)
- **Functions**: ${validations[3]?.summary?.functions || 0}% (threshold: ${criteria.coverageThreshold}%)
- **Lines**: ${validations[3]?.summary?.lines || 0}% (threshold: ${criteria.coverageThreshold}%)

### Test Execution
- **Status**: ${validations[4]?.status || 'UNKNOWN'}
- **Passed**: ${validations[4]?.details?.passed || 0}
- **Failed**: ${validations[4]?.details?.failed || 0}
- **Skipped**: ${validations[4]?.details?.skipped || 0}

## 📋 Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

## 🎉 Phase 5 Status

**${summary.overall ? '✅ COMPLETE' : '❌ INCOMPLETE'}**

${summary.overall ?
            'All Phase 5 criteria have been successfully met. The test implementation and validation phase is complete.' :
            'Some Phase 5 criteria have not been met. Please address the recommendations above to complete this phase.'
        }

---
*Generated on ${new Date().toLocaleString()}*
`;
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main validation function
 */
async function main() {
    log('Starting Phase 5 validation...');

    try {
        // Run all validations
        const results = [
            validateApiGatewayTests(),
            validateGoldenFlowsTests(),
            validateComprehensiveTests(),
            validateTestCoverage(),
            validateTestExecution(),
        ];

        // Generate report
        const report = generateValidationReport(results);
        const markdownSummary = generateMarkdownSummary(report);

        // Write reports
        writeJsonFile(CONFIG.output.report, report);
        writeMarkdownFile(CONFIG.output.summary, markdownSummary);

        // Print summary
        log('\n=== Phase 5 Validation Summary ===');
        log(`Overall Status: ${report.summary.overall ? 'PASSED' : 'FAILED'}`);
        log(`Total Tests: ${report.summary.totalTests}`);
        log(`Passed Tests: ${report.summary.passedTests}`);
        log(`Failed Tests: ${report.summary.failedTests}`);

        if (report.recommendations.length > 0) {
            log('\n=== Recommendations ===');
            report.recommendations.forEach(rec => log(rec, 'warn'));
        }

        // Exit with appropriate code
        process.exit(report.summary.overall ? 0 : 1);

    } catch (error) {
        log(`Phase 5 validation failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    validateApiGatewayTests,
    validateGoldenFlowsTests,
    validateComprehensiveTests,
    validateTestCoverage,
    validateTestExecution,
    generateValidationReport,
    main,
};
