/**
 * @aibos/logger - Core Logger Implementation
 *
 * Single Source of Truth implementation following SSOT patterns
 * This is the ONLY logger that should be used across the entire codebase
 */

import pino, { LoggerOptions, Logger } from 'pino';
import { DEFAULT_CONFIG, ENVIRONMENT_CONFIGS, VALIDATION } from './config';

/**
 * SSOT: Core logger interface
 * This defines the ONLY logging interface allowed in the codebase
 */
export interface AibosLogger {
  trace(message: string, metadata?: Record<string, any>): void;
  debug(message: string, metadata?: Record<string, any>): void;
  info(message: string, metadata?: Record<string, any>): void;
  warn(message: string, metadata?: Record<string, any>): void;
  error(message: string, error?: Error, metadata?: Record<string, any>): void;
  fatal(message: string, error?: Error, metadata?: Record<string, any>): void;

  // Business metrics
  metric(event: string, value: number, unit: string, metadata?: Record<string, any>): void;

  // Performance tracking
  performance(operation: string, duration: number, metadata?: Record<string, any>): void;

  // Security events
  security(event: string, metadata?: Record<string, any>): void;
}

/**
 * SSOT: Logger configuration
 */
interface LoggerConfig {
  service: string;
  version?: string;
  environment?: string;
  enableRedaction?: boolean;
  enableSampling?: boolean;
  sampleRate?: number;
}

/**
 * SSOT: Create logger instance
 * This is the ONLY way to create loggers in the codebase
 */
export function createLogger(config: LoggerConfig): AibosLogger {
  const envConfig = ENVIRONMENT_CONFIGS[DEFAULT_CONFIG.environment] || ENVIRONMENT_CONFIGS.development;

  const pinoConfig: LoggerOptions = {
    level: envConfig.logLevel,
    base: {
      service: config.service,
      version: config.version || '1.0.0',
      environment: config.environment || DEFAULT_CONFIG.environment,
    },

    // Redaction configuration
    redact: {
      paths: DEFAULT_CONFIG.redactionPaths,
      remove: true,
    },

    // Timestamp configuration
    timestamp: pino.stdTimeFunctions.isoTime,

    // Transport configuration
    transport: envConfig.prettyPrint ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'SYS:standard',
        colorize: true,
        ignore: 'pid,hostname',
      },
    } : undefined,
  };

  const pinoLogger = pino(pinoConfig);

  // SSOT: Implement AibosLogger interface
  return {
    trace: (message: string, metadata?: Record<string, any>) => {
      const level = envConfig.logLevel as string;
      if (level === 'trace') {
        pinoLogger.trace(metadata || {}, message);
      }
    },

    debug: (message: string, metadata?: Record<string, any>) => {
      const level = envConfig.logLevel as string;
      if (level === 'debug' || level === 'trace') {
        pinoLogger.debug(metadata || {}, message);
      }
    },

    info: (message: string, metadata?: Record<string, any>) => {
      pinoLogger.info(metadata || {}, message);
    },

    warn: (message: string, metadata?: Record<string, any>) => {
      pinoLogger.warn(metadata || {}, message);
    },

    error: (message: string, error?: Error, metadata?: Record<string, any>) => {
      const errorMetadata = error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      } : metadata;

      pinoLogger.error(errorMetadata || {}, message);
    },

    fatal: (message: string, error?: Error, metadata?: Record<string, any>) => {
      const errorMetadata = error ? {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        ...metadata,
      } : metadata;

      pinoLogger.fatal(errorMetadata || {}, message);
    },

    // Business metrics
    metric: (event: string, value: number, unit: string, metadata?: Record<string, any>) => {
      pinoLogger.info({
        type: 'metric',
        event,
        value,
        unit,
        ...metadata,
      }, `Business metric: ${event}`);
    },

    // Performance tracking
    performance: (operation: string, duration: number, metadata?: Record<string, any>) => {
      pinoLogger.info({
        type: 'performance',
        operation,
        duration,
        ...metadata,
      }, `Performance: ${operation} took ${duration}ms`);
    },

    // Security events
    security: (event: string, metadata?: Record<string, any>) => {
      pinoLogger.warn({
        type: 'security',
        event,
        ...metadata,
      }, `Security event: ${event}`);
    },
  };
}

/**
 * SSOT: Default logger instances
 * These are the ONLY logger instances that should be used
 */
export const logger = createLogger({
  service: 'aibos-core',
  version: process.env.npm_package_version || '1.0.0',
  environment: DEFAULT_CONFIG.environment,
});

/**
 * SSOT: Service-specific loggers
 * Use these for different services in the monorepo
 */
export const apiLogger = createLogger({
  service: 'aibos-api',
  version: process.env.npm_package_version || '1.0.0',
  environment: DEFAULT_CONFIG.environment,
});

export const uiLogger = createLogger({
  service: 'aibos-ui',
  version: process.env.npm_package_version || '1.0.0',
  environment: DEFAULT_CONFIG.environment,
});

export const workerLogger = createLogger({
  service: 'aibos-worker',
  version: process.env.npm_package_version || '1.0.0',
  environment: DEFAULT_CONFIG.environment,
});

export const monitoringLogger = createLogger({
  service: 'aibos-monitoring',
  version: process.env.npm_package_version || '1.0.0',
  environment: DEFAULT_CONFIG.environment,
});

/**
 * SSOT: Validation helpers
 */
export const LoggingValidation = {
  /**
   * Validate log metadata for sensitive data
   */
  validateMetadata: (metadata: Record<string, any>): { isValid: boolean; issues: string[] } => {
    const sensitiveFields = VALIDATION.containsSensitiveData(metadata);
    return {
      isValid: sensitiveFields.length === 0,
      issues: sensitiveFields.map(field => `Sensitive field detected: ${field}`),
    };
  },

  /**
   * Validate log level
   */
  validateLogLevel: (level: string): boolean => {
    return VALIDATION.isValidLogLevel(level);
  },

  /**
   * Get recommended log level for message type
   */
  getRecommendedLevel: (messageType: 'debug' | 'info' | 'warning' | 'error' | 'critical'): string => {
    const levelMap = {
      debug: 'debug',
      info: 'info',
      warning: 'warn',
      error: 'error',
      critical: 'fatal',
    };
    return levelMap[messageType];
  },
};

/**
 * SSOT: Export everything
 */
export { DEFAULT_CONFIG, ENVIRONMENT_CONFIGS, VALIDATION } from './config';
export type { LoggingConfig } from './config';
