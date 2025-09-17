#!/usr/bin/env node

// Comprehensive Test Runner for Accounting SaaS
// Runs all test suites: unit, integration, performance, and e2e

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test configuration
const config = {
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    apiKey: process.env.API_KEY || 'test-api-key',
    testTimeout: process.env.TEST_TIMEOUT || '30000',
    parallel: process.env.PARALLEL || 'true',
    coverage: process.env.COVERAGE || 'true',
    report: process.env.REPORT || 'true',
    performance: process.env.PERFORMANCE || 'false',
    e2e: process.env.E2E || 'false',
};

// Test results
const results = {
    unit: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    integration: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    performance: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    e2e: { passed: 0, failed: 0, skipped: 0, duration: 0 },
    total: { passed: 0, failed: 0, skipped: 0, duration: 0 },
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Utility functions
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`  ${title}`, 'bright');
    log(`${'='.repeat(60)}`, 'cyan');
}

function logResult(testType, result) {
    const status = result.failed > 0 ? 'FAILED' : 'PASSED';
    const color = result.failed > 0 ? 'red' : 'green';

    log(`\n${testType.toUpperCase()} TESTS: ${status}`, color);
    log(`  Passed: ${result.passed}`, 'green');
    log(`  Failed: ${result.failed}`, 'red');
    log(`  Skipped: ${result.skipped}`, 'yellow');
    log(`  Duration: ${result.duration}ms`, 'blue');
}

function runCommand(command, options = {}) {
    try {
        const startTime = Date.now();
        const output = execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe',
            ...options
        });
        const duration = Date.now() - startTime;
        return { success: true, output, duration };
    } catch (error) {
        const duration = Date.now() - (error.startTime || Date.now());
        return { success: false, error: error.message, output: error.stdout, duration };
    }
}

function parseTestOutput(output, testType) {
    const lines = output.split('\n');
    let passed = 0, failed = 0, skipped = 0;

    lines.forEach(line => {
        if (line.includes('✓') || line.includes('PASS')) {
            passed++;
        } else if (line.includes('✗') || line.includes('FAIL')) {
            failed++;
        } else if (line.includes('○') || line.includes('SKIP')) {
            skipped++;
        }
    });

    return { passed, failed, skipped };
}

// Test runners
function runUnitTests() {
    logSection('RUNNING UNIT TESTS');

    const command = `npx vitest run tests/unit --reporter=verbose --coverage=${config.coverage}`;
    const result = runCommand(command);

    if (result.success) {
        const parsed = parseTestOutput(result.output, 'unit');
        results.unit = { ...parsed, duration: result.duration };
        log('Unit tests completed successfully', 'green');
    } else {
        log('Unit tests failed', 'red');
        log(result.error, 'red');
        results.unit = { passed: 0, failed: 1, skipped: 0, duration: result.duration };
    }

    return result.success;
}

function runIntegrationTests() {
    logSection('RUNNING INTEGRATION TESTS');

    const command = `npx vitest run tests/integration --reporter=verbose --coverage=${config.coverage}`;
    const result = runCommand(command);

    if (result.success) {
        const parsed = parseTestOutput(result.output, 'integration');
        results.integration = { ...parsed, duration: result.duration };
        log('Integration tests completed successfully', 'green');
    } else {
        log('Integration tests failed', 'red');
        log(result.error, 'red');
        results.integration = { passed: 0, failed: 1, skipped: 0, duration: result.duration };
    }

    return result.success;
}

function runPerformanceTests() {
    if (config.performance !== 'true') {
        log('Performance tests skipped (set PERFORMANCE=true to enable)', 'yellow');
        return true;
    }

    logSection('RUNNING PERFORMANCE TESTS');

    // Run load tests
    log('Running load tests...', 'blue');
    const loadCommand = `k6 run tests/performance/load-testing.js --env BASE_URL=${config.baseUrl} --env API_KEY=${config.apiKey}`;
    const loadResult = runCommand(loadCommand);

    if (loadResult.success) {
        log('Load tests completed successfully', 'green');
    } else {
        log('Load tests failed', 'red');
        log(loadResult.error, 'red');
    }

    // Run stress tests
    log('Running stress tests...', 'blue');
    const stressCommand = `k6 run tests/performance/stress-testing.js --env BASE_URL=${config.baseUrl} --env API_KEY=${config.apiKey}`;
    const stressResult = runCommand(stressCommand);

    if (stressResult.success) {
        log('Stress tests completed successfully', 'green');
    } else {
        log('Stress tests failed', 'red');
        log(stressResult.error, 'red');
    }

    // Run endurance tests
    log('Running endurance tests...', 'blue');
    const enduranceCommand = `k6 run tests/performance/endurance-testing.js --env BASE_URL=${config.baseUrl} --env API_KEY=${config.apiKey}`;
    const enduranceResult = runCommand(enduranceCommand);

    if (enduranceResult.success) {
        log('Endurance tests completed successfully', 'green');
    } else {
        log('Endurance tests failed', 'red');
        log(enduranceResult.error, 'red');
    }

    const performanceSuccess = loadResult.success && stressResult.success && enduranceResult.success;
    results.performance = {
        passed: performanceSuccess ? 1 : 0,
        failed: performanceSuccess ? 0 : 1,
        skipped: 0,
        duration: loadResult.duration + stressResult.duration + enduranceResult.duration
    };

    return performanceSuccess;
}

function runE2ETests() {
    if (config.e2e !== 'true') {
        log('E2E tests skipped (set E2E=true to enable)', 'yellow');
        return true;
    }

    logSection('RUNNING E2E TESTS');

    const command = `npx playwright test tests/e2e --reporter=verbose`;
    const result = runCommand(command);

    if (result.success) {
        const parsed = parseTestOutput(result.output, 'e2e');
        results.e2e = { ...parsed, duration: result.duration };
        log('E2E tests completed successfully', 'green');
    } else {
        log('E2E tests failed', 'red');
        log(result.error, 'red');
        results.e2e = { passed: 0, failed: 1, skipped: 0, duration: result.duration };
    }

    return result.success;
}

function generateReport() {
    logSection('GENERATING TEST REPORT');

    // Calculate totals
    results.total = {
        passed: results.unit.passed + results.integration.passed + results.performance.passed + results.e2e.passed,
        failed: results.unit.failed + results.integration.failed + results.performance.failed + results.e2e.failed,
        skipped: results.unit.skipped + results.integration.skipped + results.performance.skipped + results.e2e.skipped,
        duration: results.unit.duration + results.integration.duration + results.performance.duration + results.e2e.duration,
    };

    // Display results
    logResult('Unit', results.unit);
    logResult('Integration', results.integration);
    logResult('Performance', results.performance);
    logResult('E2E', results.e2e);

    logSection('OVERALL RESULTS');
    logResult('Total', results.total);

    // Generate HTML report
    if (config.report === 'true') {
        const htmlReport = generateHTMLReport();
        const reportPath = path.join(__dirname, 'test-report.html');
        fs.writeFileSync(reportPath, htmlReport);
        log(`\nHTML report generated: ${reportPath}`, 'green');
    }

    // Generate JSON report
    const jsonReport = JSON.stringify(results, null, 2);
    const jsonPath = path.join(__dirname, 'test-results.json');
    fs.writeFileSync(jsonPath, jsonReport);
    log(`JSON report generated: ${jsonPath}`, 'green');

    return results.total.failed === 0;
}

function generateHTMLReport() {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Accounting SaaS Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; }
        .test-type { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .passed { color: green; }
        .failed { color: red; }
        .skipped { color: orange; }
        .summary { background: #f9f9f9; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Accounting SaaS Test Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${results.total.passed + results.total.failed + results.total.skipped}</p>
        <p><strong>Passed:</strong> <span class="passed">${results.total.passed}</span></p>
        <p><strong>Failed:</strong> <span class="failed">${results.total.failed}</span></p>
        <p><strong>Skipped:</strong> <span class="skipped">${results.total.skipped}</span></p>
        <p><strong>Duration:</strong> ${results.total.duration}ms</p>
    </div>

    <div class="section">
        <h2>Test Results by Type</h2>

        <div class="test-type">
            <h3>Unit Tests</h3>
            <p>Passed: <span class="passed">${results.unit.passed}</span> |
               Failed: <span class="failed">${results.unit.failed}</span> |
               Skipped: <span class="skipped">${results.unit.skipped}</span> |
               Duration: ${results.unit.duration}ms</p>
        </div>

        <div class="test-type">
            <h3>Integration Tests</h3>
            <p>Passed: <span class="passed">${results.integration.passed}</span> |
               Failed: <span class="failed">${results.integration.failed}</span> |
               Skipped: <span class="skipped">${results.integration.skipped}</span> |
               Duration: ${results.integration.duration}ms</p>
        </div>

        <div class="test-type">
            <h3>Performance Tests</h3>
            <p>Passed: <span class="passed">${results.performance.passed}</span> |
               Failed: <span class="failed">${results.performance.failed}</span> |
               Skipped: <span class="skipped">${results.performance.skipped}</span> |
               Duration: ${results.performance.duration}ms</p>
        </div>

        <div class="test-type">
            <h3>E2E Tests</h3>
            <p>Passed: <span class="passed">${results.e2e.passed}</span> |
               Failed: <span class="failed">${results.e2e.failed}</span> |
               Skipped: <span class="skipped">${results.e2e.skipped}</span> |
               Duration: ${results.e2e.duration}ms</p>
        </div>
    </div>
</body>
</html>
  `;
}

// Main execution
async function main() {
    log('Starting Accounting SaaS Test Suite', 'bright');
    log(`Base URL: ${config.baseUrl}`, 'blue');
    log(`API Key: ${config.apiKey ? '***' : 'Not set'}`, 'blue');
    log(`Parallel: ${config.parallel}`, 'blue');
    log(`Coverage: ${config.coverage}`, 'blue');
    log(`Report: ${config.report}`, 'blue');
    log(`Performance: ${config.performance}`, 'blue');
    log(`E2E: ${config.e2e}`, 'blue');

    const startTime = Date.now();

    try {
        // Run tests in sequence
        const unitSuccess = runUnitTests();
        const integrationSuccess = runIntegrationTests();
        const performanceSuccess = runPerformanceTests();
        const e2eSuccess = runE2ETests();

        // Generate report
        const overallSuccess = generateReport();

        const totalDuration = Date.now() - startTime;
        log(`\nTotal execution time: ${totalDuration}ms`, 'blue');

        if (overallSuccess) {
            log('\n🎉 All tests passed!', 'green');
            process.exit(0);
        } else {
            log('\n❌ Some tests failed!', 'red');
            process.exit(1);
        }
    } catch (error) {
        log(`\n💥 Test execution failed: ${error.message}`, 'red');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, runUnitTests, runIntegrationTests, runPerformanceTests, runE2ETests };
