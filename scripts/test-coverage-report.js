#!/usr/bin/env node

/**
 * AI-BOS Accounting SaaS - Test Coverage Report Generator
 * ============================================================================
 * Generates comprehensive test coverage reports and analysis
 * Follows SSOT principles and high-quality standards
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
    // Coverage thresholds
    thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
    },

    // Output directories
    output: {
        coverage: 'coverage',
        reports: 'coverage/reports',
        html: 'coverage/html',
    },

    // Package-specific coverage
    packages: [
        'packages/api',
        'packages/accounting',
        'packages/auth',
        'packages/db',
        'packages/utils',
    ],

    // Coverage types
    types: {
        unit: 'Unit Test Coverage',
        integration: 'Integration Test Coverage',
        e2e: 'End-to-End Test Coverage',
        total: 'Total Coverage',
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

/**
 * Write HTML file
 * @param {string} filePath - HTML file path
 * @param {string} content - HTML content
 */
function writeHtmlFile(filePath, content) {
    try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(filePath, content);
        log(`Written file: ${filePath}`);
    } catch (error) {
        log(`Failed to write HTML file: ${filePath}`, 'error');
        throw error;
    }
}

// ============================================================================
// Coverage Collection
// ============================================================================

/**
 * Collect coverage data for all packages
 * @returns {object} Coverage data by package
 */
function collectCoverageData() {
    log('Collecting coverage data...');

    const coverageData = {};

    CONFIG.packages.forEach(packageName => {
        const packagePath = packageName;
        const coverageFile = path.join(packagePath, 'coverage/coverage-summary.json');

        if (fileExists(coverageFile)) {
            const data = readJsonFile(coverageFile);
            if (data) {
                coverageData[packageName] = data;
                log(`Collected coverage for ${packageName}`);
            }
        } else {
            log(`No coverage data found for ${packageName}`, 'warn');
        }
    });

    return coverageData;
}

/**
 * Run coverage analysis for specific package
 * @param {string} packageName - Package name
 * @returns {object} Coverage data
 */
function runPackageCoverage(packageName) {
    log(`Running coverage analysis for ${packageName}...`);

    try {
        const packagePath = packageName;
        const command = `cd ${packagePath} && pnpm test:coverage`;
        execCommand(command);

        const coverageFile = path.join(packagePath, 'coverage/coverage-summary.json');
        return readJsonFile(coverageFile);
    } catch (error) {
        log(`Coverage analysis failed for ${packageName}: ${error.message}`, 'error');
        return null;
    }
}

// ============================================================================
// Coverage Analysis
// ============================================================================

/**
 * Analyze coverage data
 * @param {object} coverageData - Coverage data by package
 * @returns {object} Analysis results
 */
function analyzeCoverage(coverageData) {
    log('Analyzing coverage data...');

    const analysis = {
        packages: {},
        summary: {
            statements: { total: 0, covered: 0, percentage: 0 },
            branches: { total: 0, covered: 0, percentage: 0 },
            functions: { total: 0, covered: 0, percentage: 0 },
            lines: { total: 0, covered: 0, percentage: 0 },
        },
        thresholds: CONFIG.thresholds,
        passed: true,
        recommendations: [],
    };

    // Analyze each package
    Object.entries(coverageData).forEach(([packageName, data]) => {
        const packageAnalysis = analyzePackageCoverage(packageName, data);
        analysis.packages[packageName] = packageAnalysis;

        // Aggregate totals
        Object.keys(analysis.summary).forEach(metric => {
            if (packageAnalysis.summary[metric]) {
                analysis.summary[metric].total += packageAnalysis.summary[metric].total;
                analysis.summary[metric].covered += packageAnalysis.summary[metric].covered;
            }
        });
    });

    // Calculate percentages
    Object.keys(analysis.summary).forEach(metric => {
        const { total, covered } = analysis.summary[metric];
        analysis.summary[metric].percentage = total > 0 ? (covered / total) * 100 : 0;
    });

    // Check thresholds
    Object.keys(CONFIG.thresholds).forEach(metric => {
        const actual = analysis.summary[metric].percentage;
        const threshold = CONFIG.thresholds[metric];

        if (actual < threshold) {
            analysis.passed = false;
            analysis.recommendations.push(
                `Improve ${metric} coverage: ${actual.toFixed(2)}% < ${threshold}%`
            );
        }
    });

    return analysis;
}

/**
 * Analyze coverage for specific package
 * @param {string} packageName - Package name
 * @param {object} data - Coverage data
 * @returns {object} Package analysis
 */
function analyzePackageCoverage(packageName, data) {
    const analysis = {
        package: packageName,
        summary: data.total || {},
        files: data.files || {},
        passed: true,
        recommendations: [],
    };

    // Check package-specific thresholds
    Object.keys(CONFIG.thresholds).forEach(metric => {
        const actual = analysis.summary[metric]?.pct || 0;
        const threshold = CONFIG.thresholds[metric];

        if (actual < threshold) {
            analysis.passed = false;
            analysis.recommendations.push(
                `${metric} coverage below threshold: ${actual}% < ${threshold}%`
            );
        }
    });

    // Analyze individual files
    Object.entries(analysis.files).forEach(([filePath, fileData]) => {
        const fileAnalysis = analyzeFileCoverage(filePath, fileData);
        if (!fileAnalysis.passed) {
            analysis.recommendations.push(
                `Low coverage in ${filePath}: ${fileAnalysis.summary.statements.pct}% statements`
            );
        }
    });

    return analysis;
}

/**
 * Analyze coverage for specific file
 * @param {string} filePath - File path
 * @param {object} data - File coverage data
 * @returns {object} File analysis
 */
function analyzeFileCoverage(filePath, data) {
    const analysis = {
        file: filePath,
        summary: data,
        passed: true,
    };

    // Check if file meets minimum thresholds
    Object.keys(CONFIG.thresholds).forEach(metric => {
        const actual = data[metric]?.pct || 0;
        const threshold = CONFIG.thresholds[metric];

        if (actual < threshold) {
            analysis.passed = false;
        }
    });

    return analysis;
}

// ============================================================================
// Report Generation
// ============================================================================

/**
 * Generate comprehensive coverage report
 * @param {object} analysis - Coverage analysis
 * @returns {object} Coverage report
 */
function generateCoverageReport(analysis) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: analysis.summary,
        packages: analysis.packages,
        thresholds: analysis.thresholds,
        passed: analysis.passed,
        recommendations: analysis.recommendations,
        metrics: {
            totalFiles: Object.values(analysis.packages).reduce(
                (sum, pkg) => sum + Object.keys(pkg.files || {}).length, 0
            ),
            totalPackages: Object.keys(analysis.packages).length,
            packagesPassed: Object.values(analysis.packages).filter(pkg => pkg.passed).length,
        },
    };

    return report;
}

/**
 * Generate HTML coverage report
 * @param {object} analysis - Coverage analysis
 * @returns {string} HTML content
 */
function generateHtmlReport(analysis) {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-BOS Accounting SaaS - Test Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333; margin: 0; }
        .header p { color: #666; margin: 5px 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; margin: 5px 0; }
        .metric .percentage { font-size: 18px; color: #666; }
        .metric.passed .value { color: #28a745; }
        .metric.failed .value { color: #dc3545; }
        .packages { margin-bottom: 30px; }
        .package { background: #f8f9fa; padding: 15px; margin-bottom: 15px; border-radius: 6px; }
        .package h3 { margin: 0 0 10px 0; color: #333; }
        .package-metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .package-metric { text-align: center; padding: 10px; background: white; border-radius: 4px; }
        .package-metric .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .package-metric .value { font-size: 16px; font-weight: bold; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 6px; border-left: 4px solid #ffc107; }
        .recommendations h3 { margin: 0 0 10px 0; color: #856404; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .recommendations li { color: #856404; margin-bottom: 5px; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.passed { background: #d4edda; color: #155724; }
        .status.failed { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>AI-BOS Accounting SaaS</h1>
            <p>Test Coverage Report</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric ${analysis.passed ? 'passed' : 'failed'}">
                <h3>Overall Status</h3>
                <div class="value">${analysis.passed ? 'PASSED' : 'FAILED'}</div>
                <div class="percentage">${analysis.passed ? 'All thresholds met' : 'Thresholds not met'}</div>
            </div>
            <div class="metric">
                <h3>Statements</h3>
                <div class="value">${analysis.summary.statements.percentage.toFixed(2)}%</div>
                <div class="percentage">${analysis.summary.statements.covered}/${analysis.summary.statements.total}</div>
            </div>
            <div class="metric">
                <h3>Branches</h3>
                <div class="value">${analysis.summary.branches.percentage.toFixed(2)}%</div>
                <div class="percentage">${analysis.summary.branches.covered}/${analysis.summary.branches.total}</div>
            </div>
            <div class="metric">
                <h3>Functions</h3>
                <div class="value">${analysis.summary.functions.percentage.toFixed(2)}%</div>
                <div class="percentage">${analysis.summary.functions.covered}/${analysis.summary.functions.total}</div>
            </div>
            <div class="metric">
                <h3>Lines</h3>
                <div class="value">${analysis.summary.lines.percentage.toFixed(2)}%</div>
                <div class="percentage">${analysis.summary.lines.covered}/${analysis.summary.lines.total}</div>
            </div>
        </div>

        <div class="packages">
            <h2>Package Coverage</h2>
            ${Object.entries(analysis.packages).map(([packageName, pkg]) => `
                <div class="package">
                    <h3>${packageName} <span class="status ${pkg.passed ? 'passed' : 'failed'}">${pkg.passed ? 'PASSED' : 'FAILED'}</span></h3>
                    <div class="package-metrics">
                        <div class="package-metric">
                            <div class="label">Statements</div>
                            <div class="value">${pkg.summary.statements?.pct || 0}%</div>
                        </div>
                        <div class="package-metric">
                            <div class="label">Branches</div>
                            <div class="value">${pkg.summary.branches?.pct || 0}%</div>
                        </div>
                        <div class="package-metric">
                            <div class="label">Functions</div>
                            <div class="value">${pkg.summary.functions?.pct || 0}%</div>
                        </div>
                        <div class="package-metric">
                            <div class="label">Lines</div>
                            <div class="value">${pkg.summary.lines?.pct || 0}%</div>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        ${analysis.recommendations.length > 0 ? `
            <div class="recommendations">
                <h3>Recommendations</h3>
                <ul>
                    ${analysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
</body>
</html>
  `;

    return html;
}

// ============================================================================
// Main Execution
// ============================================================================

/**
 * Main coverage report function
 */
async function main() {
    log('Starting test coverage report generation...');

    try {
        // Collect coverage data
        const coverageData = collectCoverageData();

        if (Object.keys(coverageData).length === 0) {
            log('No coverage data found, running coverage analysis...', 'warn');

            // Run coverage for each package
            CONFIG.packages.forEach(packageName => {
                const data = runPackageCoverage(packageName);
                if (data) {
                    coverageData[packageName] = data;
                }
            });
        }

        // Analyze coverage
        const analysis = analyzeCoverage(coverageData);

        // Generate reports
        const report = generateCoverageReport(analysis);
        const htmlReport = generateHtmlReport(analysis);

        // Write reports
        writeJsonFile(path.join(CONFIG.output.reports, 'coverage-report.json'), report);
        writeHtmlFile(path.join(CONFIG.output.html, 'index.html'), htmlReport);

        // Print summary
        log('\n=== Coverage Report Summary ===');
        log(`Overall Status: ${analysis.passed ? 'PASSED' : 'FAILED'}`);
        log(`Statements: ${analysis.summary.statements.percentage.toFixed(2)}%`);
        log(`Branches: ${analysis.summary.branches.percentage.toFixed(2)}%`);
        log(`Functions: ${analysis.summary.functions.percentage.toFixed(2)}%`);
        log(`Lines: ${analysis.summary.lines.percentage.toFixed(2)}%`);
        log(`Packages: ${Object.keys(analysis.packages).length}`);
        log(`Packages Passed: ${Object.values(analysis.packages).filter(pkg => pkg.passed).length}`);

        if (analysis.recommendations.length > 0) {
            log('\n=== Recommendations ===');
            analysis.recommendations.forEach(rec => log(rec, 'warn'));
        }

        // Exit with appropriate code
        process.exit(analysis.passed ? 0 : 1);

    } catch (error) {
        log(`Coverage report generation failed: ${error.message}`, 'error');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    collectCoverageData,
    analyzeCoverage,
    generateCoverageReport,
    generateHtmlReport,
    main,
};
