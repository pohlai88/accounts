#!/usr/bin/env node

/**
 * Health Check Script
 */

const { runFullHealthCheck } = require('../dist/health-check');

async function main() {
    try {
        console.log('🔍 Running production health check...');
        await runFullHealthCheck();
        console.log('✅ Health check completed successfully');
    } catch (error) {
        console.error('❌ Health check failed:', error);
        process.exit(1);
    }
}

main();
