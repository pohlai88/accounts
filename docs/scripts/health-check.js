#!/usr/bin/env node

/**
 * Documentation Health Check System
 * 
 * This script performs comprehensive health checks on the documentation:
 * - Link validation (internal and external)
 * - Content quality checks
 * - API documentation sync validation
 * - Cross-package reference validation
 * - Performance and accessibility checks
 */

import { execSync } from 'child_process'
import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const rootDir = join(__dirname, '..', '..')

// Health check results
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    checks: []
}

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
}

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`)
}

function addCheck(name, status, message, fix = null) {
    results.checks.push({ name, status, message, fix })
    if (status === 'pass') results.passed++
    else if (status === 'fail') results.failed++
    else if (status === 'warn') results.warnings++
}

// Check 1: Link Validation
async function checkLinks() {
    log('\n🔗 Checking links...', 'blue')

    try {
        // Check internal links
        const { execSync } = await import('child_process')
        execSync('npx markdown-link-check docs/**/*.md --config .markdown-link-check.json', {
            stdio: 'pipe',
            cwd: rootDir
        })
        addCheck('Internal Links', 'pass', 'All internal links are valid')
    } catch (error) {
        addCheck('Internal Links', 'fail', 'Some internal links are broken', 'Run: npx markdown-link-check docs/**/*.md')
    }

    try {
        // Check external links
        execSync('npx markdown-link-check docs/**/*.md --config .markdown-link-check-external.json', {
            stdio: 'pipe',
            cwd: rootDir
        })
        addCheck('External Links', 'pass', 'All external links are valid')
    } catch (error) {
        addCheck('External Links', 'warn', 'Some external links may be broken', 'Check external links manually')
    }
}

// Check 2: Content Quality
async function checkContentQuality() {
    log('\n📝 Checking content quality...', 'blue')

    try {
        // Spell check
        execSync('npx cspell "docs/**/*.md" --no-progress', {
            stdio: 'pipe',
            cwd: rootDir
        })
        addCheck('Spelling', 'pass', 'No spelling errors found')
    } catch (error) {
        addCheck('Spelling', 'warn', 'Spelling issues detected', 'Run: npx cspell "docs/**/*.md" --fix')
    }

    try {
        // Grammar check
        execSync('npx write-good "docs/**/*.md"', {
            stdio: 'pipe',
            cwd: rootDir
        })
        addCheck('Grammar', 'pass', 'No grammar issues found')
    } catch (error) {
        addCheck('Grammar', 'warn', 'Grammar issues detected', 'Review and improve writing quality')
    }
}

// Check 3: API Documentation Sync
async function checkApiSync() {
    log('\n📚 Checking API documentation sync...', 'blue')

    try {
        // Check if TypeDoc can generate API docs
        execSync('pnpm docs:api', {
            stdio: 'pipe',
            cwd: rootDir
        })
        addCheck('API Generation', 'pass', 'API documentation generated successfully')
    } catch (error) {
        addCheck('API Generation', 'fail', 'API documentation generation failed', 'Fix TypeScript errors and run: pnpm docs:api')
    }

    // Check if API docs exist
    const apiDir = join(rootDir, 'docs', 'api')
    try {
        const files = readdirSync(apiDir)
        if (files.length > 0) {
            addCheck('API Files', 'pass', `API documentation files found: ${files.length}`)
        } else {
            addCheck('API Files', 'warn', 'No API documentation files found', 'Run: pnpm docs:api')
        }
    } catch (error) {
        addCheck('API Files', 'fail', 'API documentation directory not found', 'Run: pnpm docs:api')
    }
}

// Check 4: Cross-Package References
async function checkCrossPackageRefs() {
    log('\n🔗 Checking cross-package references...', 'blue')

    const packages = ['accounting', 'ui', 'utils', 'contracts', 'db', 'auth']
    let validRefs = 0
    let totalRefs = 0

    for (const pkg of packages) {
        const pkgDir = join(rootDir, 'packages', pkg)
        const readmePath = join(pkgDir, 'README.md')

        try {
            const content = readFileSync(readmePath, 'utf8')
            const refs = content.match(/@aibos\/\w+/g) || []
            totalRefs += refs.length

            // Check if references are valid
            for (const ref of refs) {
                const refPkg = ref.replace('@aibos/', '')
                if (packages.includes(refPkg)) {
                    validRefs++
                }
            }
        } catch (error) {
            // README doesn't exist, skip
        }
    }

    if (totalRefs === 0) {
        addCheck('Cross-Package Refs', 'warn', 'No cross-package references found', 'Add references between packages in documentation')
    } else if (validRefs === totalRefs) {
        addCheck('Cross-Package Refs', 'pass', `All ${totalRefs} cross-package references are valid`)
    } else {
        addCheck('Cross-Package Refs', 'fail', `${validRefs}/${totalRefs} cross-package references are valid`, 'Fix invalid package references')
    }
}

// Check 5: Documentation Structure
async function checkDocStructure() {
    log('\n📁 Checking documentation structure...', 'blue')

    const requiredFiles = [
        'docs/index.md',
        'docs/packages/index.md',
        'docs/api/index.md',
        'docs/guides/development-workflow.md'
    ]

    let missingFiles = 0

    for (const file of requiredFiles) {
        try {
            statSync(join(rootDir, file))
        } catch (error) {
            missingFiles++
            addCheck(`File: ${file}`, 'fail', 'Required documentation file missing', `Create ${file}`)
        }
    }

    if (missingFiles === 0) {
        addCheck('Documentation Structure', 'pass', 'All required documentation files exist')
    }
}

// Check 6: VitePress Build
async function checkVitePressBuild() {
    log('\n🏗️ Checking VitePress build...', 'blue')

    try {
        execSync('pnpm docs:build', {
            stdio: 'pipe',
            cwd: rootDir
        })
        addCheck('VitePress Build', 'pass', 'Documentation builds successfully')
    } catch (error) {
        addCheck('VitePress Build', 'fail', 'Documentation build failed', 'Fix build errors and run: pnpm docs:build')
    }
}

// Main health check function
async function runHealthChecks() {
    log('🏥 AI-BOS Documentation Health Check', 'bold')
    log('=====================================', 'bold')

    await checkLinks()
    await checkContentQuality()
    await checkApiSync()
    await checkCrossPackageRefs()
    await checkDocStructure()
    await checkVitePressBuild()

    // Print summary
    log('\n📊 Health Check Summary', 'bold')
    log('========================', 'bold')

    for (const check of results.checks) {
        const status = check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'
        const color = check.status === 'pass' ? 'green' : check.status === 'fail' ? 'red' : 'yellow'
        log(`${status} ${check.name}: ${check.message}`, color)

        if (check.fix) {
            log(`   💡 Fix: ${check.fix}`, 'blue')
        }
    }

    log('\n📈 Results', 'bold')
    log(`✅ Passed: ${results.passed}`, 'green')
    log(`❌ Failed: ${results.failed}`, 'red')
    log(`⚠️  Warnings: ${results.warnings}`, 'yellow')

    const total = results.passed + results.failed + results.warnings
    const successRate = Math.round((results.passed / total) * 100)
    log(`📊 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow')

    if (results.failed > 0) {
        log('\n❌ Health check failed! Please fix the issues above.', 'red')
        process.exit(1)
    } else if (results.warnings > 0) {
        log('\n⚠️  Health check completed with warnings.', 'yellow')
    } else {
        log('\n✅ All health checks passed!', 'green')
    }
}

// Run health checks
runHealthChecks().catch(error => {
    log(`\n💥 Health check failed with error: ${error.message}`, 'red')
    process.exit(1)
})
