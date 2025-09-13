#!/usr/bin/env node

/**
 * Dependencies Doctor
 * 
 * Quick diagnostic commands for dependency health
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

// Check for non-workspace internal refs
function checkNonWorkspaceRefs() {
    log('\n🔍 Checking for non-workspace @aibos/* references...', 'blue')

    const directories = ['apps', 'packages', 'services', 'docs']
    let found = false

    for (const dir of directories) {
        const dirPath = join(rootDir, dir)

        try {
            const entries = readdirSync(dirPath, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const packageJsonPath = join(dirPath, entry.name, 'package.json')

                    if (statSync(packageJsonPath).isFile()) {
                        try {
                            const content = readFileSync(packageJsonPath, 'utf8')
                            const packageJson = JSON.parse(content)

                            const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

                            for (const depType of dependencyTypes) {
                                if (packageJson[depType]) {
                                    for (const [depName, depVersion] of Object.entries(packageJson[depType])) {
                                        if (depName.startsWith('@aibos/') && depVersion !== 'workspace:*') {
                                            log(`❌ ${packageJsonPath}: ${depName} = "${depVersion}" (should be "workspace:*")`, 'red')
                                            found = true
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            // Skip invalid package.json files
                        }
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }
    }

    if (!found) {
        log('✅ All @aibos/* dependencies use workspace:* protocol', 'green')
    }

    return !found
}

// Check for missing packages
function checkMissingPackages() {
    log('\n🔍 Checking for missing @aibos/* packages...', 'blue')

    // Get all workspace package names
    const workspacePackages = new Set()
    const directories = ['packages', 'apps', 'services']

    for (const dir of directories) {
        const dirPath = join(rootDir, dir)

        try {
            const entries = readdirSync(dirPath, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const packageJsonPath = join(dirPath, entry.name, 'package.json')

                    if (statSync(packageJsonPath).isFile()) {
                        try {
                            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
                            if (packageJson.name) {
                                workspacePackages.add(packageJson.name)
                            }
                        } catch (error) {
                            // Skip invalid package.json files
                        }
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }
    }

    // Check for missing packages
    let found = false

    for (const dir of directories) {
        const dirPath = join(rootDir, dir)

        try {
            const entries = readdirSync(dirPath, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const packageJsonPath = join(dirPath, entry.name, 'package.json')

                    if (statSync(packageJsonPath).isFile()) {
                        try {
                            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))

                            const dependencyTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

                            for (const depType of dependencyTypes) {
                                if (packageJson[depType]) {
                                    for (const [depName, depVersion] of Object.entries(packageJson[depType])) {
                                        if (depName.startsWith('@aibos/') && !workspacePackages.has(depName)) {
                                            log(`❌ ${packageJsonPath}: ${depName} (package not found in workspace)`, 'red')
                                            found = true
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            // Skip invalid package.json files
                        }
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }
    }

    if (!found) {
        log('✅ All @aibos/* references point to existing packages', 'green')
    }

    return !found
}

// Show workspace packages
function showWorkspacePackages() {
    log('\n📦 Workspace packages:', 'blue')

    const workspacePackages = new Set()
    const directories = ['packages', 'apps', 'services']

    for (const dir of directories) {
        const dirPath = join(rootDir, dir)

        try {
            const entries = readdirSync(dirPath, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isDirectory()) {
                    const packageJsonPath = join(dirPath, entry.name, 'package.json')

                    if (statSync(packageJsonPath).isFile()) {
                        try {
                            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
                            if (packageJson.name) {
                                workspacePackages.add(packageJson.name)
                            }
                        } catch (error) {
                            // Skip invalid package.json files
                        }
                    }
                }
            }
        } catch (error) {
            // Directory doesn't exist
        }
    }

    for (const pkg of Array.from(workspacePackages).sort()) {
        log(`  - ${pkg}`, 'blue')
    }
}

// Main function
function main() {
    const command = process.argv[2]

    log('🏥 Dependencies Doctor', 'bold')
    log('====================', 'bold')

    switch (command) {
        case 'workspace-refs':
            checkNonWorkspaceRefs()
            break

        case 'missing-packages':
            checkMissingPackages()
            break

        case 'list-packages':
            showWorkspacePackages()
            break

        case 'all':
        default:
            const refsOk = checkNonWorkspaceRefs()
            const packagesOk = checkMissingPackages()
            showWorkspacePackages()

            if (refsOk && packagesOk) {
                log('\n✅ All dependency checks passed!', 'green')
                process.exit(0)
            } else {
                log('\n❌ Some dependency issues found!', 'red')
                process.exit(1)
            }
    }
}

// Run the main function
main()
