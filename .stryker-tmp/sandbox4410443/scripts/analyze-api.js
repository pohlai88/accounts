#!/usr/bin/env node
// @ts-nocheck

const fs = require('fs');
const path = require('path');

/**
 * Simple API Analysis Script
 * Analyzes the current API state without requiring full TypeScript compilation
 */

const packages = [
    'contracts',
    'db',
    'auth',
    'security',
    'tokens',
    'api-gateway',
    'deployment',
    'utils',
    'monitoring',
    'realtime',
    'cache',
    'accounting'
];

const apiAnalysis = {
    packages: {},
    totalExports: 0,
    totalClasses: 0,
    totalInterfaces: 0,
    totalFunctions: 0,
    issues: []
};

function analyzeFile(filePath, packageName) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const analysis = {
            exports: [],
            classes: [],
            interfaces: [],
            functions: [],
            imports: [],
            issues: []
        };

        lines.forEach((line, index) => {
            const trimmed = line.trim();

            // Find exports
            if (trimmed.startsWith('export ')) {
                analysis.exports.push({
                    line: index + 1,
                    content: trimmed,
                    type: getExportType(trimmed)
                });
            }

            // Find classes
            if (trimmed.includes('class ')) {
                const match = trimmed.match(/class\s+(\w+)/);
                if (match) {
                    analysis.classes.push({
                        line: index + 1,
                        name: match[1],
                        content: trimmed
                    });
                }
            }

            // Find interfaces
            if (trimmed.includes('interface ')) {
                const match = trimmed.match(/interface\s+(\w+)/);
                if (match) {
                    analysis.interfaces.push({
                        line: index + 1,
                        name: match[1],
                        content: trimmed
                    });
                }
            }

            // Find function declarations
            if (trimmed.includes('function ') && trimmed.startsWith('export ')) {
                const match = trimmed.match(/function\s+(\w+)/);
                if (match) {
                    analysis.functions.push({
                        line: index + 1,
                        name: match[1],
                        content: trimmed
                    });
                }
            }

            // Find imports
            if (trimmed.startsWith('import ')) {
                analysis.imports.push({
                    line: index + 1,
                    content: trimmed
                });
            }
        });

        return analysis;
    } catch (error) {
        return {
            exports: [],
            classes: [],
            interfaces: [],
            functions: [],
            imports: [],
            issues: [`Error reading file: ${error.message}`]
        };
    }
}

function getExportType(line) {
    if (line.includes('class ')) return 'class';
    if (line.includes('interface ')) return 'interface';
    if (line.includes('function ')) return 'function';
    if (line.includes('type ')) return 'type';
    if (line.includes('const ')) return 'const';
    if (line.includes('let ')) return 'let';
    if (line.includes('var ')) return 'var';
    return 'other';
}

function analyzePackage(packageName) {
    const packagePath = path.join('packages', packageName, 'src');
    const indexFile = path.join(packagePath, 'index.ts');

    if (!fs.existsSync(indexFile)) {
        apiAnalysis.issues.push(`Package ${packageName}: No index.ts file found`);
        return;
    }

    const packageAnalysis = {
        name: packageName,
        files: {},
        totalExports: 0,
        totalClasses: 0,
        totalInterfaces: 0,
        totalFunctions: 0,
        issues: []
    };

    // Analyze index.ts
    const indexAnalysis = analyzeFile(indexFile, packageName);
    packageAnalysis.files['index.ts'] = indexAnalysis;

    // Analyze other files in the package
    try {
        const files = fs.readdirSync(packagePath);
        files.forEach(file => {
            if (file.endsWith('.ts') && file !== 'index.ts') {
                const filePath = path.join(packagePath, file);
                const fileAnalysis = analyzeFile(filePath, packageName);
                packageAnalysis.files[file] = fileAnalysis;
            }
        });
    } catch (error) {
        packageAnalysis.issues.push(`Error reading package directory: ${error.message}`);
    }

    // Calculate totals
    Object.values(packageAnalysis.files).forEach(fileAnalysis => {
        packageAnalysis.totalExports += fileAnalysis.exports.length;
        packageAnalysis.totalClasses += fileAnalysis.classes.length;
        packageAnalysis.totalInterfaces += fileAnalysis.interfaces.length;
        packageAnalysis.totalFunctions += fileAnalysis.functions.length;
        packageAnalysis.issues.push(...fileAnalysis.issues);
    });

    apiAnalysis.packages[packageName] = packageAnalysis;
    apiAnalysis.totalExports += packageAnalysis.totalExports;
    apiAnalysis.totalClasses += packageAnalysis.totalClasses;
    apiAnalysis.totalInterfaces += packageAnalysis.totalInterfaces;
    apiAnalysis.totalFunctions += packageAnalysis.totalFunctions;
}

// Analyze all packages
packages.forEach(analyzePackage);

// Generate report
const report = {
    summary: {
        totalPackages: packages.length,
        totalExports: apiAnalysis.totalExports,
        totalClasses: apiAnalysis.totalClasses,
        totalInterfaces: apiAnalysis.totalInterfaces,
        totalFunctions: apiAnalysis.totalFunctions,
        totalIssues: apiAnalysis.issues.length
    },
    packages: apiAnalysis.packages,
    issues: apiAnalysis.issues
};

// Write report to file
fs.writeFileSync('docs/api-analysis.json', JSON.stringify(report, null, 2));

// Generate markdown report
let markdown = `# API Analysis Report\n\n`;
markdown += `Generated: ${new Date().toISOString()}\n\n`;
markdown += `## Summary\n\n`;
markdown += `- **Total Packages**: ${report.summary.totalPackages}\n`;
markdown += `- **Total Exports**: ${report.summary.totalExports}\n`;
markdown += `- **Total Classes**: ${report.summary.totalClasses}\n`;
markdown += `- **Total Interfaces**: ${report.summary.totalInterfaces}\n`;
markdown += `- **Total Functions**: ${report.summary.totalFunctions}\n`;
markdown += `- **Total Issues**: ${report.summary.totalIssues}\n\n`;

markdown += `## Package Details\n\n`;
Object.entries(report.packages).forEach(([packageName, packageData]) => {
    markdown += `### ${packageName}\n\n`;
    markdown += `- **Exports**: ${packageData.totalExports}\n`;
    markdown += `- **Classes**: ${packageData.totalClasses}\n`;
    markdown += `- **Interfaces**: ${packageData.totalInterfaces}\n`;
    markdown += `- **Functions**: ${packageData.totalFunctions}\n`;
    markdown += `- **Issues**: ${packageData.issues.length}\n\n`;

    if (packageData.issues.length > 0) {
        markdown += `#### Issues:\n`;
        packageData.issues.forEach(issue => {
            markdown += `- ${issue}\n`;
        });
        markdown += `\n`;
    }
});

markdown += `## All Issues\n\n`;
report.issues.forEach(issue => {
    markdown += `- ${issue}\n`;
});

fs.writeFileSync('docs/api-analysis.md', markdown);

console.log('API Analysis Complete!');
console.log(`- JSON Report: docs/api-analysis.json`);
console.log(`- Markdown Report: docs/api-analysis.md`);
console.log(`- Total Exports: ${report.summary.totalExports}`);
console.log(`- Total Issues: ${report.summary.totalIssues}`);
