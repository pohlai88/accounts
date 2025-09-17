#!/usr/bin/env node

/**
 * AI-BOS Accounting SaaS - Docker Health Check Script
 * ============================================================================
 * Comprehensive health check for Docker containers
 * Follows SSOT principles and high-quality standards
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// ============================================================================
// Configuration
// ============================================================================
const CONFIG = {
    // Health check endpoints
    endpoints: [
        { path: '/health', name: 'Health Check' },
        { path: '/api/health', name: 'API Health Check' },
    ],

    // Timeout and retry configuration
    timeout: 5000,
    retries: 3,
    retryDelay: 1000,

    // Success criteria
    expectedStatus: 200,
    expectedContent: 'success',

    // Logging
    verbose: process.env.HEALTH_CHECK_VERBOSE === 'true',
};

// ============================================================================
// Health Check Functions
// ============================================================================

/**
 * Perform HTTP health check
 * @param {string} url - URL to check
 * @param {string} name - Name of the check
 * @returns {Promise<boolean>} - Success status
 */
async function checkEndpoint(url, name) {
    return new Promise((resolve) => {
        const parsedUrl = new URL(url);
        const client = parsedUrl.protocol === 'https:' ? https : http;

        const options = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'GET',
            timeout: CONFIG.timeout,
            headers: {
                'User-Agent': 'AI-BOS-HealthCheck/1.0.0',
                'Accept': 'application/json',
            },
        };

        const req = client.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                const success = res.statusCode === CONFIG.expectedStatus &&
                    data.includes(CONFIG.expectedContent);

                if (CONFIG.verbose) {
                    console.log(`[${name}] Status: ${res.statusCode}, Success: ${success}`);
                }

                resolve(success);
            });
        });

        req.on('error', (error) => {
            if (CONFIG.verbose) {
                console.error(`[${name}] Error:`, error.message);
            }
            resolve(false);
        });

        req.on('timeout', () => {
            if (CONFIG.verbose) {
                console.error(`[${name}] Timeout after ${CONFIG.timeout}ms`);
            }
            req.destroy();
            resolve(false);
        });

        req.end();
    });
}

/**
 * Perform comprehensive health check
 * @param {string} baseUrl - Base URL for health checks
 * @returns {Promise<boolean>} - Overall health status
 */
async function performHealthCheck(baseUrl) {
    const results = [];

    for (const endpoint of CONFIG.endpoints) {
        const url = `${baseUrl}${endpoint.path}`;
        const result = await checkEndpoint(url, endpoint.name);
        results.push({ endpoint: endpoint.name, success: result });

        if (!result) {
            if (CONFIG.verbose) {
                console.error(`[FAIL] ${endpoint.name} failed`);
            }
        }
    }

    const allSuccessful = results.every(result => result.success);

    if (CONFIG.verbose) {
        console.log('\n=== Health Check Results ===');
        results.forEach(result => {
            console.log(`${result.success ? '✓' : '✗'} ${result.endpoint}`);
        });
        console.log(`\nOverall Status: ${allSuccessful ? 'HEALTHY' : 'UNHEALTHY'}`);
    }

    return allSuccessful;
}

/**
 * Retry health check with exponential backoff
 * @param {string} baseUrl - Base URL for health checks
 * @returns {Promise<boolean>} - Final health status
 */
async function retryHealthCheck(baseUrl) {
    for (let attempt = 1; attempt <= CONFIG.retries; attempt++) {
        if (CONFIG.verbose) {
            console.log(`\n=== Health Check Attempt ${attempt}/${CONFIG.retries} ===`);
        }

        const success = await performHealthCheck(baseUrl);

        if (success) {
            return true;
        }

        if (attempt < CONFIG.retries) {
            if (CONFIG.verbose) {
                console.log(`Waiting ${CONFIG.retryDelay}ms before retry...`);
            }
            await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay));
        }
    }

    return false;
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
    const baseUrl = process.env.HEALTH_CHECK_URL || 'http://localhost:3001';

    if (CONFIG.verbose) {
        console.log(`Starting health check for: ${baseUrl}`);
        console.log(`Configuration:`, {
            timeout: CONFIG.timeout,
            retries: CONFIG.retries,
            retryDelay: CONFIG.retryDelay,
        });
    }

    try {
        const isHealthy = await retryHealthCheck(baseUrl);
        process.exit(isHealthy ? 0 : 1);
    } catch (error) {
        if (CONFIG.verbose) {
            console.error('Health check failed with error:', error);
        }
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = {
    checkEndpoint,
    performHealthCheck,
    retryHealthCheck,
};
