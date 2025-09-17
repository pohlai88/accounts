#!/usr/bin/env node

/**
 * AI-BOS Accounting SaaS - Test Validation Script
 * ============================================================================
 * Comprehensive test validation and coverage reporting
 * Follows SSOT principles and high-quality standards
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
    // Test directories
    testDirs: [
        'packages/api/tests',
        'tests/integration',
        'tests/unit',
        'packages/accounting/tests',
    ],

    // Coverage thresholds
    coverage: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
    },

    // Test types
    testTypes: {
        unit: 'Unit Tests',
        integration: 'Integration Tests',
        e2e: 'End-to-End Tests',
        performance: 'Performance Tests',
    },

    // Output files
    output: {
        coverage: 'coverage/coverage-summary.json',
        report: 'test-validation-report.json',
        html: 'coverage/index.html',
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
 * Check if file exists
 * @param {string} filePath - File path to check
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
    return fs.existsSync(filePath);
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

// ============================================================================
// Test Discovery
// ============================================================================

/**
 * Discover test files
 * @returns {object} Test files by type
 */
function discoverTestFiles() {
    const testFiles = {
        unit: [],
        integration: [],
        e2e: [],
        performance: [],
    };

    CONFIG.testDirs.forEach(dir => {
        if (!fileExists(dir)) {
            log(`Test directory not found: ${dir}`, 'warn');
            return;
        }

        const files = findTestFiles(dir);
        files.forEach(file => {
            const type = categorizeTestFile(file);
            if (testFiles[type]) {
                testFiles[type].push(file);
            }
        });
    });

    return testFiles;
}

/**
 * Find test files recursively
 * @param {string} dir - Directory to search
 * @returns {array} Array of test file paths
 */
function findTestFiles(dir) {
    const testFiles = [];

    function searchDir(currentDir) {
        const items = fs.readdirSync(currentDir);

        items.forEach(item => {
            const itemPath = path.join(currentDir, item);
            const stat = fs.statSync(itemPath);

            if (stat.isDirectory()) {
                searchDir(itemPath);
            } else if (stat.isFile() && isTestFile(item)) {
                testFiles.push(itemPath);
            }
        });
    }

    searchDir(dir);
    return testFiles;
}

/**
 * Check if file is a test file
 * @param {string} filename - Filename to check
 * @returns {boolean} True if test file
 */
function isTestFile(filename) {
    const testPatterns = [
        /\.test\.(js|ts|jsx|tsx)$/,
        /\.spec\.(js|ts|jsx|tsx)$/,
        /\.e2e\.(js|ts|jsx|tsx)$/,
        /\.integration\.(js|ts|jsx|tsx)$/,
    ];

    return testPatterns.some(pattern => pattern.test(filename));
}

/**
 * Categorize test file by type
 * @param {string} filePath - Test file path
 * @returns {string} Test type
 */
function categorizeTestFile(filePath) {
    const filename = path.basename(filePath);

    if (filename.includes('.e2e.')) {
        return 'e2e';
    } else if (filename.includes('.integration.')) {
        return 'integration';
    } else if (filename.includes('.performance.')) {
        return 'performance';
    } else {
        return 'unit';
    }
}

// ============================================================================
// Test Execution
// ============================================================================

/**
 * Run tests and collect results
 * @param {string} testType - Type of tests to run
 * @param {array} testFiles - Test files to run
 * @returns {object} Test results
 */
function runTests(testType, testFiles) {
    log(`Running ${CONFIG.testTypes[testType]}...`);

    const startTime = Date.now();
    let results = {
        type: testType,
        files: testFiles,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        errors: [],
    };

    try {
        // Run tests using appropriate test runner
        const command = getTestCommand(testType, testFiles);
        const output = execCommand(command);

        results.duration = Date.now() - startTime;
        results = parseTestOutput(output, results);

        log(`${CONFIG.testTypes[testType]}: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`);

    } catch (error) {
        results.duration = Date.now() - startTime;
        results.errors.push(error.message);
        log(`${CONFIG.testTypes[testType]} failed: ${error.message}`, 'error');
    }

    return results;
}

/**
 * Get test command for test type
 * @param {string} testType - Type of tests
 * @param {array} testFiles - Test files to run
 * @returns {string} Test command
 */
function getTestCommand(testType, testFiles) {
    const baseCommand = 'pnpm test:run';

    switch (testType) {
        case 'unit':
            return `${baseCommand} --reporter=verbose`;
        case 'integration':
            return `${baseCommand} --reporter=verbose --testNamePattern="Integration"`;
        case 'e2e':
            return `${baseCommand} --reporter=verbose --testNamePattern="E2E"`;
        case 'performance':
            return `${baseCommand} --reporter=verbose --testNamePattern="Performance"`;
        default:
            return baseCommand;
    }
}

/**
 * Parse test output
 * @param {string} output - Test output
 * @param {object} results - Results object to update
 * @returns {object} Updated results
 */
function parseTestOutput(output, results) {
    // Parse Vitest output format
    const lines = output.split('\n');

    lines.forEach(line => {
        if (line.includes('✓') && line.includes('passed')) {
            const match = line.match(/(\d+)\s+passed/);
            if (match) {
                results.passed += parseInt(match[1]);
            }
        } else if (line.includes('✗') && line.includes('failed')) {
            const match = line.match(/(\d+)\s+failed/);
            if (match) {
                results.failed += parseInt(match[1]);
            }
        } else if (line.includes('skipped')) {
            const match = line.match(/(\d+)\s+skipped/);
            if (match) {
                results.skipped += parseInt(match[1]);
            }
        }
    });

    return results;
}

// ============================================================================
// Coverage Analysis
// ============================================================================

/**
 * Analyze test coverage
 * @returns {object} Coverage analysis
 */
function analyzeCoverage() {
    log('Analyzing test coverage...');

    const coverageFile = CONFIG.output.coverage;
    const coverageData = readJsonFile(coverageFile);

    if (!coverageData) {
        log('Coverage file not found, running coverage analysis...', 'warn');
        runCoverageAnalysis();
        return analyzeCoverage();
    }

    const analysis = {
        summary: coverageData.total || {},
        thresholds: CONFIG.coverage,
        passed: true,
        details: {},
    };

    // Check coverage thresholds
    Object.keys(CONFIG.coverage).forEach(metric => {
        const actual = analysis.summary[metric]?.pct || 0;
        const threshold = CONFIG.coverage[metric];

        analysis.details[metric] = {
            actual,
            threshold,
            passed: actual >= threshold,
        };

        if (actual < threshold) {
            analysis.passed = false;
            log(`Coverage ${metric}: ${actual}% < ${threshold}%`, 'warn');
        } else {
            log(`Coverage ${metric}: ${actual}% >= ${threshold}%`);
        }
    });

    return analysis;
}

/**
 * Run coverage analysis
 */
function runCoverageAnalysis() {
    try {
        execCommand('pnpm test:coverage');
        log('Coverage analysis completed');
    } catch (error) {
        log('Coverage analysis failed', 'error');
        throw error;
    }
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate comprehensive test report
 * @param {object} testResults - Test results by type
 * @param {object} coverageAnalysis - Coverage analysis
 * @returns {object} Comprehensive report
 */
function generateReport(testResults, coverageAnalysis) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalTests: 0,
            totalPassed: 0,
            totalFailed: 0,
            totalSkipped: 0,
            totalDuration: 0,
            coveragePassed: coverageAnalysis.passed,
        },
        testResults: testResults,
        coverage: coverageAnalysis,
        recommendations: [],
    };

    // Calculate totals
    Object.values(testResults).forEach(result => {
        report.summary.totalTests += result.passed + result.failed + result.skipped;
        report.summary.totalPassed += result.passed;
        report.summary.totalFailed += result.failed;
        report.summary.totalSkipped += result.skipped;
        report.summary.totalDuration += result.duration;
    });

    // Generate recommendations
    if (report.summary.totalFailed > 0) {
        report.recommendations.push('Fix failing tests before deployment');
    }

    if (!coverageAnalysis.passed) {
        report.recommendations.push('Improve test coverage to meet thresholds');
    }

    if (report.summary.totalDuration > 60000) {
        report.recommendations.push('Consider optimizing test performance');
    }

    return report;
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main validation function
 */
async function main() {
    log('Starting comprehensive test validation...');

    try {
        // Discover test files
        const testFiles = discoverTestFiles();
        log(`Discovered ${Object.values(testFiles).flat().length} test files`);

        // Run tests by type
        const testResults = {};
        for (const [type, files] of Object.entries(testFiles)) {
            if (files.length > 0) {
                testResults[type] = runTests(type, files);
            }
        }

        // Analyze coverage
        const coverageAnalysis = analyzeCoverage();

        // Generate report
        const report = generateReport(testResults, coverageAnalysis);
        writeJsonFile(CONFIG.output.report, report);

        // Print summary
        log('\n=== Test Validation Summary ===');
        log(`Total Tests: ${report.summary.totalTests}`);
        log(`Passed: ${report.summary.totalPassed}`);
        log(`Failed: ${report.summary.totalFailed}`);
        log(`Skipped: ${report.summary.totalSkipped}`);
        log(`Duration: ${(report.summary.totalDuration / 1000).toFixed(2)}s`);
        log(`Coverage: ${coverageAnalysis.passed ? 'PASSED' : 'FAILED'}`);

        if (report.recommendations.length > 0) {
            log('\n=== Recommendations ===');
            report.recommendations.forEach(rec => log(rec, 'warn'));
        }

        // Exit with appropriate code
        const success = report.summary.totalFailed === 0 && coverageAnalysis.passed;
        process.exit(success ? 0 : 1);

    } catch (error) {
        log(`Validation failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    discoverTestFiles,
    runTests,
    analyzeCoverage,
    generateReport,
    main,
};
