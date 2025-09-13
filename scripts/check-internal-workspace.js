#!/usr/bin/env node

/**
 * Workspace Protocol Guard Check
 * 
 * Ensures all @aibos/* dependencies use workspace:* protocol
 * and that all referenced packages actually exist locally.
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

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

// Get all package names in the workspace
function getWorkspacePackages() {
    const packages = new Set()

    // Check packages directory
    try {
        const packagesDir = join(rootDir, 'packages')
        const entries = readdirSync(packagesDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const packageJsonPath = join(packagesDir, entry.name, 'package.json')
                try {
                    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
                    if (packageJson.name) {
                        packages.add(packageJson.name)
                    }
                } catch (error) {
                    // Skip invalid package.json files
                }
            }
        }
    } catch (error) {
        // packages directory doesn't exist
    }

    // Check apps directory
    try {
        const appsDir = join(rootDir, 'apps')
        const entries = readdirSync(appsDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const packageJsonPath = join(appsDir, entry.name, 'package.json')
                try {
                    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
                    if (packageJson.name) {
                        packages.add(packageJson.name)
                    }
                } catch (error) {
                    // Skip invalid package.json files
                }
            }
        }
    } catch (error) {
        // apps directory doesn't exist
    }

    // Check services directory
    try {
        const servicesDir = join(rootDir, 'services')
        const entries = readdirSync(servicesDir, { withFileTypes: true })

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const packageJsonPath = join(servicesDir, entry.name, 'package.json')
                try {
                    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
                    if (packageJson.name) {
                        packages.add(packageJson.name)
                    }
                } catch (error) {
                    // Skip invalid package.json files
                }
            }
        }
    } catch (error) {
        // services directory doesn't exist
    }

    return packages
}

// Check a single package.json file
function checkPackageJson(filePath, workspacePackages) {
    const issues = []

    try {
        const content = readFileSync(filePath, 'utf8')
        const packageJson = JSON.parse(content)

        // Check all dependency types
        const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

        for (const depType of dependencyTypes) {
            if (packageJson[depType]) {
                for (const [depName, depVersion] of Object.entries(packageJson[depType])) {
                    // Check if it's an @aibos package
                    if (depName.startsWith('@aibos/')) {
                        // Check if it uses workspace:* protocol
                        if (depVersion !== 'workspace:*') {
                            issues.push({
                                type: 'non-workspace',
                                file: filePath,
                                dependency: depName,
                                version: depVersion,
                                expected: 'workspace:*'
                            })
                        }

                        // Check if the package actually exists
                        if (!workspacePackages.has(depName)) {
                            issues.push({
                                type: 'missing-package',
                                file: filePath,
                                dependency: depName,
                                version: depVersion
                            })
                        }
                    }
                }
            }
        }
    } catch (error) {
        issues.push({
            type: 'parse-error',
            file: filePath,
            error: error.message
        })
    }

    return issues
}

// Main check function
function runWorkspaceCheck() {
    log('🔍 Checking workspace protocol compliance...', 'blue')

    const workspacePackages = getWorkspacePackages()
    log(`📦 Found ${workspacePackages.size} workspace packages:`, 'blue')
    for (const pkg of Array.from(workspacePackages).sort()) {
        log(`  - ${pkg}`, 'blue')
    }

    const allIssues = []
    const directories = ['apps', 'packages', 'services', 'docs']

    for (const dir of directories) {
        const dirPath = join(rootDir, dir)

        try {
            const entries = readdirSync(dirPath, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const packageJsonPath = join(dirPath, entry.name, 'package.json')

                    if (statSync(packageJsonPath).isFile()) {
                        const issues = checkPackageJson(packageJsonPath, workspacePackages)
                        allIssues.push(...issues)
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't be read
        }
    }

    // Check root package.json
    const rootPackageJsonPath = join(rootDir, 'package.json')
    if (statSync(rootPackageJsonPath).isFile()) {
        const issues = checkPackageJson(rootPackageJsonPath, workspacePackages)
        allIssues.push(...issues)
    }

    // Report results
    log('\n📊 Workspace Protocol Check Results', 'bold')
    log('=====================================', 'bold')

    if (allIssues.length === 0) {
        log('✅ All @aibos/* dependencies use workspace:* protocol', 'green')
        log('✅ All referenced packages exist in workspace', 'green')
        log('\n🎉 Workspace protocol compliance check passed!', 'green')
        return true
    }

    // Group issues by type
    const nonWorkspaceIssues = allIssues.filter(i => i.type === 'non-workspace')
    const missingPackageIssues = allIssues.filter(i => i.type === 'missing-package')
    const parseErrors = allIssues.filter(i => i.type === 'parse-error')

    if (nonWorkspaceIssues.length > 0) {
        log(`\n❌ Found ${nonWorkspaceIssues.length} @aibos/* dependencies not using workspace:* protocol:`, 'red')
        for (const issue of nonWorkspaceIssues) {
            log(`  ${issue.file}: ${issue.dependency} = "${issue.version}" (expected "workspace:*")`, 'red')
        }
    }

    if (missingPackageIssues.length > 0) {
        log(`\n❌ Found ${missingPackageIssues.length} references to non-existent @aibos/* packages:`, 'red')
        for (const issue of missingPackageIssues) {
            log(`  ${issue.file}: ${issue.dependency} (package not found in workspace)`, 'red')
        }
    }

    if (parseErrors.length > 0) {
        log(`\n❌ Found ${parseErrors.length} package.json parse errors:`, 'red')
        for (const issue of parseErrors) {
            log(`  ${issue.file}: ${issue.error}`, 'red')
        }
    }

    log('\n💡 Fix suggestions:', 'yellow')
    log('  1. Convert @aibos/* dependencies to workspace:* protocol', 'yellow')
    log('  2. Remove references to non-existent packages', 'yellow')
    log('  3. Fix package.json syntax errors', 'yellow')
    log('  4. Run: pnpm install to update lockfile', 'yellow')

    return false
}

// Run the check
const success = runWorkspaceCheck()
process.exit(success ? 0 : 1)
