/**
 * @aibos/logger - SSOT Configuration
 *
 * Single Source of Truth for all logging patterns, rules, and configurations
 * This file defines ALLOWED and FORBIDDEN patterns across the entire codebase
 */

export interface LoggingConfig {
  // Environment settings
  environment: 'development' | 'staging' | 'production';
  logLevel: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

  // Output settings
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;

  // Security settings
  enableRedaction: boolean;
  redactionPaths: string[];

  // Performance settings
  enableSampling: boolean;
  sampleRate: number;

  // Context settings
  enableRequestContext: boolean;
  enableTenantContext: boolean;
  enableUserContext: boolean;
}

/**
 * SSOT: Default configuration for all environments
 */
export const DEFAULT_CONFIG: LoggingConfig = {
  environment: (process.env.NODE_ENV as any) || 'development',
  logLevel: (process.env.LOG_LEVEL as any) || 'info',

  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  enableRemote: process.env.NODE_ENV === 'production',

  enableRedaction: true,
  redactionPaths: [
    'password',
    'apiKey',
    'api_key',
    'token',
    'secret',
    'authorization',
    'cookie',
    'supabaseKey',
    'supabaseUrl',
    'supabaseServiceKey',
    'jwt',
    'bearer',
    'session',
    'sessionId',
    'session_id',
    'refreshToken',
    'refresh_token',
    'accessToken',
    'access_token',
    'privateKey',
    'private_key',
    'publicKey',
    'public_key',
    'credential',
    'credentials',
    'auth',
    'authentication',
    'login',
    'signin',
    'signup',
    'register',
    'reset',
    'forgot',
    'change',
    'update',
    'modify',
    'delete',
    'remove',
    'create',
    'new',
    'old',
    'current',
    'previous',
    'next',
    'last',
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
    'tenth'
  ],

  enableSampling: process.env.NODE_ENV === 'production',
  sampleRate: 0.1, // 10% sampling in production

  enableRequestContext: true,
  enableTenantContext: true,
  enableUserContext: true,
};

/**
 * SSOT: ALLOWED logging patterns
 * These are the ONLY patterns that should be used across the codebase
 */
export const ALLOWED_PATTERNS = {
  // ✅ ALLOWED: Structured logging with context
  STRUCTURED: {
    description: 'Structured logging with explicit context and metadata',
    pattern: 'logger.{level}(message, metadata, context)',
    example: `
logger.info('User logged in', {
  userId: '123',
  tenantId: 'abc',
  ip: '192.168.1.1'
}, {
  reqId: 'req-456',
  traceId: 'trace-789'
});`,
    usage: 'Use for all application logging'
  },

  // ✅ ALLOWED: Context-bound logging (automatic context)
  CONTEXT_BOUND: {
    description: 'Logging with automatic request context binding',
    pattern: 'logger.{level}(message, metadata)',
    example: `
logger.info('Processing request', {
  operation: 'create_user',
  duration: 150
});`,
    usage: 'Use in API routes and middleware'
  },

  // ✅ ALLOWED: Error logging with stack traces
  ERROR_WITH_STACK: {
    description: 'Error logging with automatic stack trace capture',
    pattern: 'logger.error(message, error, metadata)',
    example: `
logger.error('Database connection failed', error, {
  database: 'postgres',
  host: 'db.example.com'
});`,
    usage: 'Use for all error handling'
  },

  // ✅ ALLOWED: Business metrics logging
  BUSINESS_METRICS: {
    description: 'Business metrics and KPIs',
    pattern: 'logger.info(message, { event, value, unit, ...metadata })',
    example: `
logger.info('Business metric recorded', {
  event: 'user.signup',
  value: 1,
  unit: 'count',
  tenantId: 'tenant-123',
  source: 'web'
});`,
    usage: 'Use for business analytics and KPIs'
  },

  // ✅ ALLOWED: Performance logging
  PERFORMANCE: {
    description: 'Performance and timing metrics',
    pattern: 'logger.info(message, { operation, duration, ...metadata })',
    example: `
logger.info('Operation completed', {
  operation: 'database.query',
  duration: 45,
  queryType: 'SELECT',
  rowCount: 100
});`,
    usage: 'Use for performance monitoring'
  },

  // ✅ ALLOWED: Security events
  SECURITY: {
    description: 'Security-related events and alerts',
    pattern: 'logger.warn(message, { event, ...metadata })',
    example: `
logger.warn('Security event detected', {
  event: 'rate_limit_exceeded',
  ip: '192.168.1.1',
  limit: 100,
  window: '1m'
});`,
    usage: 'Use for security monitoring and alerts'
  }
} as const;

/**
 * SSOT: FORBIDDEN logging patterns
 * These patterns are STRICTLY PROHIBITED across the entire codebase
 */
export const FORBIDDEN_PATTERNS = {
  // ❌ FORBIDDEN: Raw console statements
  CONSOLE_RAW: {
    description: 'Raw console.log, console.info, console.warn, console.error',
    pattern: 'console.{method}(...)',
    example: `
console.log('User logged in');
console.info('Processing request');
console.warn('Rate limit exceeded');
console.error('Database error');`,
    reason: 'No structured logging, no context, no redaction, no correlation',
    replacement: 'Use logger.{level}() instead'
  },

  // ❌ FORBIDDEN: Template literals in logs
  TEMPLATE_LITERALS: {
    description: 'Template literals in log messages',
    pattern: 'logger.{level}(`message ${variable}`)',
    example: `
logger.info(\`User \${userId} logged in from \${ip}\`);
logger.warn(\`Rate limit exceeded: \${count}/\${limit}\`);`,
    reason: 'Difficult to search, parse, and analyze in log aggregation systems',
    replacement: 'Use structured logging with explicit fields'
  },

  // ❌ FORBIDDEN: Unstructured error logging
  UNSTRUCTURED_ERRORS: {
    description: 'Error logging without structured metadata',
    pattern: 'logger.error(error.message)',
    example: `
logger.error(error.message);
logger.error('Error: ' + error.message);
logger.error(\`Error: \${error.message}\`);`,
    reason: 'Missing context, stack traces, and correlation data',
    replacement: 'Use logger.error(message, error, metadata)'
  },

  // ❌ FORBIDDEN: Sensitive data in logs
  SENSITIVE_DATA: {
    description: 'Logging sensitive information without redaction',
    pattern: 'logger.{level}(message, { password, apiKey, token, ... })',
    example: `
logger.info('API call', {
  password: 'secret123',
  apiKey: 'sk-1234567890',
  token: 'Bearer abc123'
});`,
    reason: 'Security risk - sensitive data exposure',
    replacement: 'Use redaction or exclude sensitive fields'
  },

  // ❌ FORBIDDEN: Debug logs in production
  DEBUG_IN_PRODUCTION: {
    description: 'Debug-level logging in production environment',
    pattern: 'logger.debug(...) in production',
    example: `
// In production code
logger.debug('Debug information', { data: 'sensitive' });`,
    reason: 'Performance impact and potential data exposure',
    replacement: 'Use appropriate log levels or feature flags'
  },

  // ❌ FORBIDDEN: Inconsistent log levels
  INCONSISTENT_LEVELS: {
    description: 'Using wrong log levels for message types',
    pattern: 'Incorrect level usage',
    example: `
logger.info('CRITICAL ERROR OCCURRED'); // Should be error/fatal
logger.error('User clicked button'); // Should be debug/info
logger.warn('System shutting down'); // Should be error/fatal`,
    reason: 'Makes log filtering and alerting unreliable',
    replacement: 'Use appropriate log levels consistently'
  },

  // ❌ FORBIDDEN: Missing context
  MISSING_CONTEXT: {
    description: 'Logging without request/tenant/user context',
    pattern: 'logger.{level}(message) without context',
    example: `
logger.info('User action performed');
logger.warn('Rate limit exceeded');
logger.error('Database error');`,
    reason: 'Cannot correlate logs across requests or users',
    replacement: 'Always include relevant context'
  },

  // ❌ FORBIDDEN: Non-JSON log formats
  NON_JSON_FORMATS: {
    description: 'Custom log formatting instead of JSON',
    pattern: 'Custom string formatting',
    example: `
logger.info('[INFO] User 123 logged in from IP 192.168.1.1');
logger.warn('WARNING: Rate limit exceeded for user 456');`,
    reason: 'Difficult to parse and analyze in log aggregation systems',
    replacement: 'Use structured JSON logging'
  }
} as const;

/**
 * SSOT: Log level usage guidelines
 */
export const LOG_LEVEL_GUIDELINES = {
  TRACE: {
    description: 'Very detailed information for debugging',
    usage: 'Development only, never in production',
    examples: ['Function entry/exit', 'Variable values', 'Loop iterations']
  },

  DEBUG: {
    description: 'Detailed information for debugging',
    usage: 'Development and staging, feature-flagged in production',
    examples: ['API request/response', 'Database queries', 'Cache hits/misses']
  },

  INFO: {
    description: 'General information about application flow',
    usage: 'All environments, normal operation events',
    examples: ['User actions', 'Business events', 'System status']
  },

  WARN: {
    description: 'Warning about potentially harmful situations',
    usage: 'All environments, recoverable issues',
    examples: ['Rate limits', 'Deprecated API usage', 'Performance degradation']
  },

  ERROR: {
    description: 'Error events that might still allow the application to continue',
    usage: 'All environments, application errors',
    examples: ['Database errors', 'API failures', 'Validation errors']
  },

  FATAL: {
    description: 'Very severe error events that will abort the application',
    usage: 'All environments, critical system failures',
    examples: ['Out of memory', 'Database connection lost', 'Security breach']
  }
} as const;

/**
 * SSOT: Environment-specific configurations
 */
export const ENVIRONMENT_CONFIGS = {
  development: {
    logLevel: 'debug',
    enableConsole: true,
    enableFile: false,
    enableRemote: false,
    enableRedaction: false, // For easier debugging
    enableSampling: false,
    prettyPrint: true
  },

  staging: {
    logLevel: 'info',
    enableConsole: true,
    enableFile: true,
    enableRemote: false,
    enableRedaction: true,
    enableSampling: true,
    sampleRate: 0.5,
    prettyPrint: false
  },

  production: {
    logLevel: 'info',
    enableConsole: false, // Use file/remote only
    enableFile: true,
    enableRemote: true,
    enableRedaction: true,
    enableSampling: true,
    sampleRate: 0.1,
    prettyPrint: false
  }
} as const;

/**
 * SSOT: Validation functions
 */
export const VALIDATION = {
  /**
   * Check if a log pattern is allowed
   */
  isAllowedPattern: (pattern: string): boolean => {
    const allowedPatterns = Object.keys(ALLOWED_PATTERNS);
    return allowedPatterns.some(key =>
      pattern.toLowerCase().includes(key.toLowerCase())
    );
  },

  /**
   * Check if a log pattern is forbidden
   */
  isForbiddenPattern: (pattern: string): boolean => {
    const forbiddenPatterns = Object.keys(FORBIDDEN_PATTERNS);
    return forbiddenPatterns.some(key =>
      pattern.toLowerCase().includes(key.toLowerCase())
    );
  },

  /**
   * Validate log level usage
   */
  isValidLogLevel: (level: string): boolean => {
    return ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(level);
  },

  /**
   * Check for sensitive data in log metadata
   */
  containsSensitiveData: (metadata: Record<string, any>): string[] => {
    const sensitiveFields: string[] = [];
    const checkObject = (obj: any, path: string = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (DEFAULT_CONFIG.redactionPaths.some(pattern =>
          key.toLowerCase().includes(pattern.toLowerCase()) ||
          fullPath.toLowerCase().includes(pattern.toLowerCase())
        )) {
          sensitiveFields.push(fullPath);
        }
        if (typeof value === 'object' && value !== null) {
          checkObject(value, fullPath);
        }
      }
    };
    checkObject(metadata);
    return sensitiveFields;
  }
} as const;

/**
 * SSOT: Export all configurations
 */
export const SSOT_CONFIG = {
  DEFAULT_CONFIG,
  ALLOWED_PATTERNS,
  FORBIDDEN_PATTERNS,
  LOG_LEVEL_GUIDELINES,
  ENVIRONMENT_CONFIGS,
  VALIDATION
} as const;
