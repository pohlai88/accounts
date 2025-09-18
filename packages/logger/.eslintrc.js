module.exports = {
  extends: ['@aibos/eslint-config'],
  rules: {
    // SSOT: Enforce logging patterns
    'no-console': 'error',
    'no-restricted-properties': [
      'error',
      {
        object: 'console',
        property: 'log',
        message: 'Use @aibos/logger instead of console.log'
      },
      {
        object: 'console',
        property: 'info',
        message: 'Use @aibos/logger instead of console.info'
      },
      {
        object: 'console',
        property: 'warn',
        message: 'Use @aibos/logger instead of console.warn'
      },
      {
        object: 'console',
        property: 'error',
        message: 'Use @aibos/logger instead of console.error'
      },
      {
        object: 'console',
        property: 'debug',
        message: 'Use @aibos/logger instead of console.debug'
      }
    ],

    // SSOT: Prevent template literals in logs
    'no-template-literals-in-logs': 'error',

    // SSOT: Require structured logging
    'require-structured-logging': 'error',

    // SSOT: Prevent sensitive data in logs
    'no-sensitive-data-in-logs': 'error',

    // SSOT: Require proper error handling
    'require-error-context': 'error',

    // SSOT: Require log levels
    'require-log-levels': 'error',

    // SSOT: Prevent debug logs in production
    'no-debug-in-production': 'error',

    // SSOT: Require context in logs
    'require-log-context': 'error',

    // SSOT: Prevent inconsistent log levels
    'consistent-log-levels': 'error',

    // SSOT: Require JSON log format
    'require-json-log-format': 'error'
  }
};
