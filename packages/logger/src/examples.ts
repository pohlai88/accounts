/**
 * @aibos/logger - Usage Examples
 *
 * SSOT examples showing ALLOWED patterns and FORBIDDEN patterns
 * These are the ONLY examples that should be followed
 */

import { logger } from './index';
import { logger as contextLogger } from './bind';

/**
 * SSOT: ALLOWED Examples
 * These are the ONLY patterns that should be used
 */

// ✅ ALLOWED: Basic structured logging
export const basicLogging = () => {
    logger.info('User logged in', {
        userId: '123',
        tenantId: 'abc',
        ip: '192.168.1.1'
    });
};

// ✅ ALLOWED: Error logging with stack traces
export const errorLogging = () => {
    try {
        throw new Error('Database connection failed');
    } catch (error) {
        logger.error('Database operation failed', error, {
            database: 'postgres',
            host: 'db.example.com',
            operation: 'connect'
        });
    }
};

// ✅ ALLOWED: Business metrics
export const businessMetrics = () => {
    logger.metric('user.signup', 1, 'count', {
        tenantId: 'tenant-123',
        source: 'web',
        plan: 'premium'
    });
};

// ✅ ALLOWED: Performance tracking
export const performanceTracking = () => {
    const startTime = Date.now();

    // Simulate some operation
    setTimeout(() => {
        const duration = Date.now() - startTime;
        logger.performance('database.query', duration, {
            queryType: 'SELECT',
            rowCount: 100,
            table: 'users'
        });
    }, 100);
};

// ✅ ALLOWED: Security events
export const securityEvents = () => {
    logger.security('rate_limit_exceeded', {
        ip: '192.168.1.1',
        limit: 100,
        window: '1m',
        endpoint: '/api/users'
    });
};

// ✅ ALLOWED: Context-bound logging
export const contextBoundLogging = () => {
    // Automatically includes reqId, tenantId, userId, etc.
    contextLogger.info('Processing request', {
        operation: 'create_user',
        duration: 150
    });
};

// ✅ ALLOWED: Different log levels
export const logLevels = () => {
    logger.trace('Function entry', { function: 'processUser' });
    logger.debug('API request', { method: 'POST', url: '/api/users' });
    logger.info('User created', { userId: '123', email: 'user@example.com' });
    logger.warn('Deprecated API used', { endpoint: '/api/v1/users', version: 'v1' });
    logger.error('Validation failed', undefined, { field: 'email', value: 'invalid' });
    logger.fatal('System out of memory', undefined, { memoryUsage: '95%' });
};

// ✅ ALLOWED: Complex metadata
export const complexMetadata = () => {
    logger.info('Complex operation completed', {
        operation: 'bulk_import',
        recordsProcessed: 1000,
        recordsSuccessful: 950,
        recordsFailed: 50,
        duration: 5000,
        errors: [
            { code: 'VALIDATION_ERROR', count: 30 },
            { code: 'DUPLICATE_ERROR', count: 20 }
        ],
        metadata: {
            source: 'csv_upload',
            fileSize: '2MB',
            columns: ['name', 'email', 'phone']
        }
    });
};

// ✅ ALLOWED: Conditional logging
export const conditionalLogging = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
        logger.debug('Development mode enabled', {
            features: ['hot_reload', 'debug_panel', 'mock_data']
        });
    }

    logger.info('Application started', {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version
    });
};

// ✅ ALLOWED: Async logging
export const asyncLogging = async () => {
    try {
        const result = await fetch('/api/users');
        logger.info('API call successful', {
            endpoint: '/api/users',
            statusCode: result.status,
            responseTime: Date.now()
        });
    } catch (error) {
        logger.error('API call failed', error, {
            endpoint: '/api/users',
            retryCount: 3
        });
    }
};

/**
 * SSOT: FORBIDDEN Examples
 * These patterns are STRICTLY PROHIBITED
 */

// ❌ FORBIDDEN: Raw console statements
export const forbiddenConsoleLogging = () => {
    // console.log('User logged in'); // FORBIDDEN
    // console.info('Processing request'); // FORBIDDEN
    // console.warn('Rate limit exceeded'); // FORBIDDEN
    // console.error('Database error'); // FORBIDDEN
    // console.debug('Debug information'); // FORBIDDEN
};

// ❌ FORBIDDEN: Template literals in logs
export const forbiddenTemplateLiterals = () => {
    const userId = '123';
    const ip = '192.168.1.1';

    // logger.info(`User ${userId} logged in from ${ip}`); // FORBIDDEN
    // logger.warn(`Rate limit exceeded: ${count}/${limit}`); // FORBIDDEN
    // logger.error(`Error: ${error.message}`); // FORBIDDEN
};

// ❌ FORBIDDEN: Unstructured error logging
export const forbiddenUnstructuredErrors = () => {
    const error = new Error('Database connection failed');

    // logger.error(error.message); // FORBIDDEN
    // logger.error('Error: ' + error.message); // FORBIDDEN
    // logger.error(`Error: ${error.message}`); // FORBIDDEN
};

// ❌ FORBIDDEN: Sensitive data in logs
export const forbiddenSensitiveData = () => {
    // logger.info('API call', {
    //   password: 'secret123', // FORBIDDEN
    //   apiKey: 'sk-1234567890', // FORBIDDEN
    //   token: 'Bearer abc123' // FORBIDDEN
    // });
};

// ❌ FORBIDDEN: Debug logs in production
export const forbiddenDebugInProduction = () => {
    if (process.env.NODE_ENV === 'production') {
        // logger.debug('Debug information', { data: 'sensitive' }); // FORBIDDEN
    }
};

// ❌ FORBIDDEN: Inconsistent log levels
export const forbiddenInconsistentLevels = () => {
    // logger.info('CRITICAL ERROR OCCURRED'); // FORBIDDEN - should be error/fatal
    // logger.error('User clicked button'); // FORBIDDEN - should be debug/info
    // logger.warn('System shutting down'); // FORBIDDEN - should be error/fatal
};

// ❌ FORBIDDEN: Missing context
export const forbiddenMissingContext = () => {
    // logger.info('User action performed'); // FORBIDDEN - no context
    // logger.warn('Rate limit exceeded'); // FORBIDDEN - no context
    // logger.error('Database error'); // FORBIDDEN - no context
};

// ❌ FORBIDDEN: Non-JSON log formats
export const forbiddenNonJsonFormats = () => {
    // logger.info('[INFO] User 123 logged in from IP 192.168.1.1'); // FORBIDDEN
    // logger.warn('WARNING: Rate limit exceeded for user 456'); // FORBIDDEN
};

/**
 * SSOT: Migration Examples
 * These show how to convert FORBIDDEN patterns to ALLOWED patterns
 */

export const migrationExamples = {
    // Before: console.log('User logged in');
    // After: logger.info('User logged in');

    // Before: logger.info(`User ${userId} logged in from ${ip}`);
    // After: logger.info('User logged in', { userId, ip });

    // Before: logger.error('Error: ' + error.message);
    // After: logger.error('Error occurred', error);

    // Before: logger.info('API call', { password: 'secret123' });
    // After: logger.info('API call', { password: '[REDACTED]' });

    // Before: logger.info('User action performed');
    // After: logger.info('User action performed', { context: 'missing' });
};

/**
 * SSOT: Best Practices
 */

export const bestPractices = {
    // Always use structured logging
    structured: () => {
        logger.info('User action', {
            action: 'login',
            userId: '123',
            timestamp: new Date().toISOString()
        });
    },

    // Always include relevant context
    contextual: () => {
        logger.info('Request processed', {
            reqId: 'req-456',
            tenantId: 'tenant-123',
            userId: 'user-789',
            duration: 150,
            statusCode: 200
        });
    },

    // Always use appropriate log levels
    appropriateLevels: () => {
        logger.trace('Function entry'); // Development only
        logger.debug('API request'); // Development/staging
        logger.info('User action'); // All environments
        logger.warn('Deprecated usage'); // All environments
        logger.error('Application error'); // All environments
        logger.fatal('System failure'); // All environments
    },

    // Always handle errors properly
    properErrorHandling: () => {
        try {
            throw new Error('Something went wrong');
        } catch (error) {
            logger.error('Operation failed', error, {
                operation: 'riskyOperation',
                retryCount: 3,
                context: 'user_action'
            });
        }
    },

    // Always use business metrics for KPIs
    businessMetrics: () => {
        logger.metric('revenue.generated', 99.99, 'USD', {
            tenantId: 'tenant-123',
            product: 'premium_plan',
            source: 'web'
        });
    },

    // Always track performance for optimization
    performanceTracking: () => {
        const startTime = Date.now();

        // Simulate operation
        setTimeout(() => {
            const duration = Date.now() - startTime;
            logger.performance('database.query', duration, {
                queryType: 'SELECT',
                table: 'users',
                rowCount: 100
            });
        }, 100);
    }
};

/**
 * SSOT: Export all examples
 */
export {
    basicLogging,
    errorLogging,
    businessMetrics,
    performanceTracking,
    securityEvents,
    contextBoundLogging,
    logLevels,
    complexMetadata,
    conditionalLogging,
    asyncLogging,
    migrationExamples,
    bestPractices,
};
