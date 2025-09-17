#!/usr/bin/env node

/**
 * Documentation Doctest Runner
 *
 * Extracts and validates TypeScript examples from @example blocks
 * Ensures examples compile and type-check correctly
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TYPEDOC_JSON_PATH = 'docs/api.json';
const DOCTEST_DIR = 'docs/doctest';
const DOCTEST_CONFIG = 'docs/doctest/tsconfig.json';

// TypeDoc numeric kinds
const KIND = {
    Function: 64,
    Class: 128,
    Interface: 256,
    Method: 2048,
    Property: 1024
};

function runCommand(command, options = {}) {
    try {
        return execSync(command, {
            encoding: 'utf8',
            stdio: 'pipe',
            ...options
        });
    } catch (error) {
        console.error(`Command failed: ${command}`);
        console.error(error.message);
        throw error;
    }
}

function extractExamples(jsonData) {
    const examples = [];

    function walk(node, stack = []) {
        if (!node) return;

        // Check if this node has examples
        if (node.comment?.tags) {
            const exampleTags = node.comment.tags.filter(tag => tag.tag === 'example');

            for (const exampleTag of exampleTags) {
                if (exampleTag.content && exampleTag.content.length > 0) {
                    const exampleText = exampleTag.content
                        .map(content => content.text || content)
                        .join('')
                        .trim();

                    if (exampleText && exampleText.includes('typescript') || exampleText.includes('ts')) {
                        examples.push({
                            name: stack.concat([node.name]).filter(Boolean).join(' :: '),
                            code: exampleText,
                            kind: node.kind,
                            source: node.sources?.[0]?.fileName || 'unknown'
                        });
                    }
                }
            }
        }

        // Walk children
        if (Array.isArray(node.children)) {
            const nextStack = [KIND.Function, KIND.Class, KIND.Interface, KIND.Method, KIND.Property].includes(node.kind)
                ? [...stack, node.name]
                : stack;
            for (const child of node.children) {
                walk(child, nextStack);
            }
        }
    }

    if (Array.isArray(jsonData.children)) {
        for (const child of jsonData.children) {
            walk(child, []);
        }
    }

    return examples;
}

function createDoctestEnvironment() {
    console.log('🔧 Setting up doctest environment...');

    // Create doctest directory
    if (!fs.existsSync(DOCTEST_DIR)) {
        fs.mkdirSync(DOCTEST_DIR, { recursive: true });
    }

    // Create tsconfig.json for doctest
    const tsconfig = {
        "compilerOptions": {
            "target": "ES2020",
            "module": "commonjs",
            "lib": ["ES2020"],
            "strict": true,
            "esModuleInterop": true,
            "skipLibCheck": true,
            "forceConsistentCasingInFileNames": true,
            "moduleResolution": "node",
            "resolveJsonModule": true,
            "allowSyntheticDefaultImports": true,
            "noImplicitAny": true,
            "noImplicitReturns": true,
            "noImplicitThis": true,
            "noUnusedLocals": true,
            "noUnusedParameters": true
        },
        "include": ["*.ts"],
        "exclude": ["node_modules"]
    };

    fs.writeFileSync(DOCTEST_CONFIG, JSON.stringify(tsconfig, null, 2));

    // Create package.json for doctest
    const packageJson = {
        "name": "doctest",
        "version": "1.0.0",
        "private": true,
        "dependencies": {
            "@aibos/accounting": "file:../../packages/accounting",
            "@aibos/auth": "file:../../packages/auth",
            "@aibos/ui": "file:../../packages/ui",
            "@aibos/utils": "file:../../packages/utils",
            "@aibos/cache": "file:../../packages/cache",
            "@aibos/db": "file:../../packages/db",
            "@aibos/monitoring": "file:../../packages/monitoring",
            "@aibos/realtime": "file:../../packages/realtime",
            "@aibos/security": "file:../../packages/security",
            "@aibos/tokens": "file:../../packages/tokens"
        }
    };

    fs.writeFileSync(path.join(DOCTEST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));
}

function generateDoctestFiles(examples) {
    console.log(`📝 Generating ${examples.length} doctest files...`);

    const results = [];

    for (let i = 0; i < examples.length; i++) {
        const example = examples[i];
        const filename = `example_${i.toString().padStart(3, '0')}_${example.name.replace(/[^a-zA-Z0-9]/g, '_')}.ts`;
        const filepath = path.join(DOCTEST_DIR, filename);

        // Extract TypeScript code from example
        let code = example.code;

        // Remove markdown code block markers
        code = code.replace(/^```(?:typescript|ts)?\s*\n/, '');
        code = code.replace(/\n```$/, '');

        // Add necessary imports
        const imports = extractImports(code);
        const fullCode = imports + '\n\n' + code;

        fs.writeFileSync(filepath, fullCode);

        results.push({
            ...example,
            filename,
            filepath,
            code: fullCode
        });
    }

    return results;
}

function extractImports(code) {
    const imports = new Set();

    // Look for package references
    const packageMatches = code.match(/@aibos\/\w+/g);
    if (packageMatches) {
        for (const pkg of packageMatches) {
            imports.add(`import * as ${pkg.replace('@aibos/', '').replace('-', '_')} from '${pkg}';`);
        }
    }

    // Look for specific function/class references
    const functionMatches = code.match(/\b(validate|calculate|generate|process|create|update|delete|get|set)\w+/g);
    if (functionMatches) {
        for (const func of functionMatches) {
            // Try to determine which package this function belongs to
            if (func.includes('Invoice') || func.includes('Bill') || func.includes('Payment')) {
                imports.add("import * as accounting from '@aibos/accounting';");
            } else if (func.includes('Auth') || func.includes('User') || func.includes('Permission')) {
                imports.add("import * as auth from '@aibos/auth';");
            } else if (func.includes('Button') || func.includes('Card') || func.includes('Form')) {
                imports.add("import * as ui from '@aibos/ui';");
            } else if (func.includes('Cache') || func.includes('Store')) {
                imports.add("import * as cache from '@aibos/cache';");
            } else if (func.includes('Database') || func.includes('Query')) {
                imports.add("import * as db from '@aibos/db';");
            } else if (func.includes('Monitor') || func.includes('Log')) {
                imports.add("import * as monitoring from '@aibos/monitoring';");
            } else if (func.includes('Realtime') || func.includes('Socket')) {
                imports.add("import * as realtime from '@aibos/realtime';");
            } else if (func.includes('Security') || func.includes('Encrypt')) {
                imports.add("import * as security from '@aibos/security';");
            } else if (func.includes('Token') || func.includes('JWT')) {
                imports.add("import * as tokens from '@aibos/tokens';");
            } else {
                imports.add("import * as utils from '@aibos/utils';");
            }
        }
    }

    return Array.from(imports).join('\n');
}

function runDoctests(doctestFiles) {
    console.log('🧪 Running doctests...');

    const results = [];
    let passed = 0;
    let failed = 0;

    for (const doctest of doctestFiles) {
        try {
            console.log(`  Testing ${doctest.filename}...`);

            // Compile the TypeScript file
            runCommand(`npx tsc --noEmit ${doctest.filepath}`, {
                cwd: DOCTEST_DIR
            });

            console.log(`    ✅ ${doctest.filename} - Type check passed`);
            results.push({
                ...doctest,
                status: 'passed',
                error: null
            });
            passed++;

        } catch (error) {
            console.log(`    ❌ ${doctest.filename} - Type check failed`);
            console.log(`      Error: ${error.message}`);
            results.push({
                ...doctest,
                status: 'failed',
                error: error.message
            });
            failed++;
        }
    }

    return { results, passed, failed };
}

function generateDoctestReport(results) {
    console.log('\n📊 Doctest Report');
    console.log('==================');
    console.log(`Total Examples: ${results.results.length}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${((results.passed / results.results.length) * 100).toFixed(1)}%`);

    if (results.failed > 0) {
        console.log('\n❌ Failed Examples:');
        results.results
            .filter(r => r.status === 'failed')
            .forEach(r => {
                console.log(`  - ${r.filename}: ${r.name}`);
                console.log(`    Error: ${r.error}`);
            });
    }

    return results.failed === 0;
}

function cleanup() {
    console.log('🧹 Cleaning up doctest files...');

    if (fs.existsSync(DOCTEST_DIR)) {
        const files = fs.readdirSync(DOCTEST_DIR);
        for (const file of files) {
            if (file.endsWith('.ts') || file.endsWith('.js')) {
                fs.unlinkSync(path.join(DOCTEST_DIR, file));
            }
        }
    }
}

function main() {
    console.log('🔍 Documentation Doctest Runner');
    console.log('=================================');

    try {
        // Check if TypeDoc JSON exists
        if (!fs.existsSync(TYPEDOC_JSON_PATH)) {
            console.log('❌ TypeDoc JSON not found. Run doc-coverage.js first.');
            process.exit(1);
        }

        // Load TypeDoc JSON
        const jsonData = JSON.parse(fs.readFileSync(TYPEDOC_JSON_PATH, 'utf8'));

        // Extract examples
        const examples = extractExamples(jsonData);
        console.log(`Found ${examples.length} examples to test`);

        if (examples.length === 0) {
            console.log('✅ No examples found to test');
            process.exit(0);
        }

        // Set up doctest environment
        createDoctestEnvironment();

        // Generate doctest files
        const doctestFiles = generateDoctestFiles(examples);

        // Run doctests
        const results = runDoctests(doctestFiles);

        // Generate report
        const passed = generateDoctestReport(results);

        // Cleanup
        cleanup();

        // Exit with appropriate code
        process.exit(passed ? 0 : 1);

    } catch (error) {
        console.error('❌ Doctest failed:', error.message);
        cleanup();
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { extractExamples, runDoctests };
