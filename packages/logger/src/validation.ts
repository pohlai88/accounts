/**
 * @aibos/logger - Validation Utilities
 *
 * SSOT validation functions for logging patterns
 * These enforce the ALLOWED and FORBIDDEN patterns
 */

import { ALLOWED_PATTERNS, FORBIDDEN_PATTERNS, VALIDATION } from './config';

/**
 * SSOT: Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

/**
 * SSOT: Log pattern validator
 * This validates logging patterns against SSOT rules
 */
export class LogPatternValidator {
  /**
   * Validate a log statement
   */
  static validateLogStatement(
    code: string,
    lineNumber: number,
    fileName: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for forbidden patterns
    for (const [patternName, pattern] of Object.entries(FORBIDDEN_PATTERNS)) {
      if (this.matchesPattern(code, pattern.pattern)) {
        errors.push(`Line ${lineNumber}: ${pattern.description} - ${pattern.reason}`);
        suggestions.push(`Suggestion: ${pattern.replacement}`);
      }
    }

    // Check for allowed patterns
    let hasAllowedPattern = false;
    for (const [patternName, pattern] of Object.entries(ALLOWED_PATTERNS)) {
      if (this.matchesPattern(code, pattern.pattern)) {
        hasAllowedPattern = true;
        break;
      }
    }

    if (!hasAllowedPattern && this.isLogStatement(code)) {
      errors.push(`Line ${lineNumber}: Invalid logging pattern`);
      suggestions.push('Use one of the allowed patterns from @aibos/logger');
    }

    // Check for sensitive data
    const sensitiveFields = this.extractSensitiveData(code);
    if (sensitiveFields.length > 0) {
      errors.push(`Line ${lineNumber}: Sensitive data detected: ${sensitiveFields.join(', ')}`);
      suggestions.push('Remove sensitive data or use redaction');
    }

    // Check for template literals
    if (this.hasTemplateLiterals(code)) {
      errors.push(`Line ${lineNumber}: Template literals not allowed in logs`);
      suggestions.push('Use structured logging with explicit fields');
    }

    // Check for missing context
    if (this.isMissingContext(code)) {
      warnings.push(`Line ${lineNumber}: Missing request context`);
      suggestions.push('Use context-bound logger or include explicit context');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Check if code matches a pattern
   */
  private static matchesPattern(code: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\{.*?\}/g, '.*?'), 'i');
    return regex.test(code);
  }

  /**
   * Check if code is a log statement
   */
  private static isLogStatement(code: string): boolean {
    return /logger\.(trace|debug|info|warn|error|fatal)|console\.(log|info|warn|error|debug)/.test(code);
  }

  /**
   * Extract sensitive data from code
   */
  private static extractSensitiveData(code: string): string[] {
    const sensitiveFields: string[] = [];
    const sensitivePatterns = [
      'password',
      'apiKey',
      'api_key',
      'token',
      'secret',
      'authorization',
      'cookie',
      'supabase',
      'jwt',
      'bearer',
      'x-api-key',
      'x-auth-token',
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
    ];

    for (const pattern of sensitivePatterns) {
      if (code.toLowerCase().includes(pattern.toLowerCase())) {
        sensitiveFields.push(pattern);
      }
    }

    return sensitiveFields;
  }

  /**
   * Check if code has template literals
   */
  private static hasTemplateLiterals(code: string): boolean {
    return /`.*\$\{.*\}.*`/.test(code);
  }

  /**
   * Check if code is missing context
   */
  private static isMissingContext(code: string): boolean {
    // Check if it's a simple log statement without context
    const simpleLogPattern = /logger\.(trace|debug|info|warn|error|fatal)\s*\(\s*['"][^'"]*['"]\s*\)/;
    return simpleLogPattern.test(code);
  }
}

/**
 * SSOT: Log level validator
 */
export class LogLevelValidator {
  /**
   * Validate log level usage
   */
  static validateLogLevel(level: string, message: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if level is valid
    if (!VALIDATION.isValidLogLevel(level)) {
      errors.push(`Invalid log level: ${level}`);
      suggestions.push('Use one of: trace, debug, info, warn, error, fatal');
    }

    // Check if level matches message type
    const messageType = this.detectMessageType(message);
    const recommendedLevel = this.getRecommendedLevel(messageType);

    if (level !== recommendedLevel) {
      warnings.push(`Log level '${level}' may not match message type '${messageType}'`);
      suggestions.push(`Consider using '${recommendedLevel}' for this message type`);
    }

    // Check for debug logs in production
    if (level === 'debug' && process.env.NODE_ENV === 'production') {
      errors.push('Debug logs not allowed in production');
      suggestions.push('Use info level or enable debug only with feature flags');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Detect message type from message content
   */
  private static detectMessageType(message: string): string {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('error') || lowerMessage.includes('failed') || lowerMessage.includes('exception')) {
      return 'error';
    }

    if (lowerMessage.includes('warning') || lowerMessage.includes('warn') || lowerMessage.includes('deprecated')) {
      return 'warning';
    }

    if (lowerMessage.includes('debug') || lowerMessage.includes('trace') || lowerMessage.includes('verbose')) {
      return 'debug';
    }

    if (lowerMessage.includes('critical') || lowerMessage.includes('fatal') || lowerMessage.includes('emergency')) {
      return 'critical';
    }

    return 'info';
  }

  /**
   * Get recommended log level for message type
   */
  private static getRecommendedLevel(messageType: string): string {
    const levelMap = {
      debug: 'debug',
      info: 'info',
      warning: 'warn',
      error: 'error',
      critical: 'fatal',
    };
    return levelMap[messageType] || 'info';
  }
}

/**
 * SSOT: Log metadata validator
 */
export class LogMetadataValidator {
  /**
   * Validate log metadata
   */
  static validateMetadata(metadata: Record<string, any>): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for sensitive data
    const sensitiveFields = VALIDATION.containsSensitiveData(metadata);
    if (sensitiveFields.length > 0) {
      errors.push(`Sensitive data detected: ${sensitiveFields.join(', ')}`);
      suggestions.push('Remove sensitive data or use redaction');
    }

    // Check for required fields
    const requiredFields = ['timestamp', 'service', 'environment'];
    for (const field of requiredFields) {
      if (!metadata[field]) {
        warnings.push(`Missing required field: ${field}`);
        suggestions.push(`Include ${field} in metadata`);
      }
    }

    // Check for proper data types
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'function') {
        errors.push(`Function values not allowed in metadata: ${key}`);
        suggestions.push('Convert function to string or remove');
      }

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        warnings.push(`Nested objects in metadata: ${key}`);
        suggestions.push('Flatten nested objects or use JSON.stringify');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }
}

/**
 * SSOT: Export all validators
 */
export {
  LogPatternValidator,
  LogLevelValidator,
  LogMetadataValidator,
};
