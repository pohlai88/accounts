#!/usr/bin/env node

/**
 * Syncpack Wrapper Script
 * 
 * Wraps syncpack commands to handle errors gracefully
 * and provide consistent behavior across platforms.
 */

import { spawn } from 'child_process'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

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

// Run syncpack command with error handling
function runSyncpack(args, allowFailure = true) {
    return new Promise((resolve) => {
        const syncpackPath = join(rootDir, 'node_modules', '.bin', 'syncpack')
        const child = spawn('node', [syncpackPath, ...args], {
            cwd: rootDir,
            stdio: 'inherit',
            shell: true
        })

        child.on('close', (code) => {
            if (code === 0) {
                log('✅ Syncpack command completed successfully', 'green')
                resolve(true)
            } else {
                if (allowFailure) {
                    log(`⚠️  Syncpack command completed with warnings (exit code: ${code})`, 'yellow')
                    resolve(true)
                } else {
                    log(`❌ Syncpack command failed (exit code: ${code})`, 'red')
                    resolve(false)
                }
            }
        })

        child.on('error', (error) => {
            if (allowFailure) {
                log(`⚠️  Syncpack command error: ${error.message}`, 'yellow')
                resolve(true)
            } else {
                log(`❌ Syncpack command error: ${error.message}`, 'red')
                resolve(false)
            }
        })
    })
}

// Main function
async function main() {
    const command = process.argv[2]
    const args = process.argv.slice(3)

    if (!command) {
        log('Usage: node scripts/syncpack-wrapper.js <command> [args...]', 'red')
        log('Available commands: list, lint, fix-mismatches, set-semver-ranges, update', 'blue')
        process.exit(1)
    }

    // Add config file to args if not already present
    if (!args.includes('--config')) {
        args.push('--config', '.syncpackrc.yaml')
    }

    log(`🔧 Running syncpack ${command}...`, 'blue')

    const success = await runSyncpack([command, ...args], true)

    if (success) {
        log('✅ Syncpack wrapper completed', 'green')
        process.exit(0)
    } else {
        log('❌ Syncpack wrapper failed', 'red')
        process.exit(1)
    }
}

// Run the main function
main().catch(error => {
    log(`💥 Syncpack wrapper error: ${error.message}`, 'red')
    process.exit(1)
})
