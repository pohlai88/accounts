/**
 * @aibos/logger - Migration Utilities
 *
 * SSOT migration helpers for converting existing logs to structured format
 * These provide the ONLY way to migrate from old logging patterns
 */

import { logger } from './index';
import { ALLOWED_PATTERNS, FORBIDDEN_PATTERNS } from './config';

/**
 * SSOT: Migration result interface
 */
export interface MigrationResult {
    original: string;
    migrated: string;
    pattern: string;
    confidence: number; // 0-1
    warnings: string[];
}

/**
 * SSOT: Log migration utility
 * This provides the ONLY way to migrate existing logs
 */
export class LogMigrator {
    /**
     * Migrate a console.log statement
     */
    static migrateConsoleLog(code: string): MigrationResult {
        const warnings: string[] = [];
        let migrated = code;
        let pattern = 'unknown';
        let confidence = 0.5;

        // Pattern 1: Simple console.log with string
        if (/console\.log\s*\(\s*['"][^'"]*['"]\s*\)/.test(code)) {
            const match = code.match(/console\.log\s*\(\s*['"]([^'"]*)['"]\s*\)/);
            if (match) {
                migrated = `logger.info('${match[1]}');`;
                pattern = 'simple_string';
                confidence = 0.9;
            }
        }

        // Pattern 2: console.log with template literal
        else if (/console\.log\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`\s*\)/.test(code)) {
            const match = code.match(/console\.log\s*\(\s*`([^`]*)`\s*\)/);
            if (match) {
                const template = match[1];
                const variables = template.match(/\$\{([^}]+)\}/g) || [];

                if (variables.length > 0) {
                    const message = template.replace(/\$\{[^}]+\}/g, '{}');
                    const metadata = variables.map(v => v.slice(2, -1)).join(', ');
                    migrated = `logger.info('${message}', { ${metadata} });`;
                    pattern = 'template_literal';
                    confidence = 0.8;
                    warnings.push('Template literal converted to structured logging');
                }
            }
        }

        // Pattern 3: console.log with object
        else if (/console\.log\s*\(\s*[^,)]+\s*\)/.test(code)) {
            const match = code.match(/console\.log\s*\(\s*([^)]+)\s*\)/);
            if (match) {
                const content = match[1].trim();
                migrated = `logger.info('Log entry', { data: ${content} });`;
                pattern = 'object_log';
                confidence = 0.7;
                warnings.push('Object logging converted to structured format');
            }
        }

        // Pattern 4: console.error
        else if (/console\.error\s*\(\s*([^)]+)\s*\)/.test(code)) {
            const match = code.match(/console\.error\s*\(\s*([^)]+)\s*\)/);
            if (match) {
                const content = match[1].trim();
                migrated = `logger.error('Error occurred', undefined, { error: ${content} });`;
                pattern = 'error_log';
                confidence = 0.8;
            }
        }

        // Pattern 5: console.warn
        else if (/console\.warn\s*\(\s*([^)]+)\s*\)/.test(code)) {
            const match = code.match(/console\.warn\s*\(\s*([^)]+)\s*\)/);
            if (match) {
                const content = match[1].trim();
                migrated = `logger.warn('Warning', { message: ${content} });`;
                pattern = 'warning_log';
                confidence = 0.8;
            }
        }

        return {
            original: code,
            migrated,
            pattern,
            confidence,
            warnings,
        };
    }

    /**
     * Migrate a template literal log statement
     */
    static migrateTemplateLiteral(code: string): MigrationResult {
        const warnings: string[] = [];
        let migrated = code;
        let pattern = 'unknown';
        let confidence = 0.5;

        // Pattern 1: logger.info with template literal
        if (/logger\.(info|warn|error|debug|trace|fatal)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/.test(code)) {
            const match = code.match(/logger\.(info|warn|error|debug|trace|fatal)\s*\(\s*`([^`]*)`/);
            if (match) {
                const level = match[1];
                const template = match[2];
                const variables = template.match(/\$\{([^}]+)\}/g) || [];

                if (variables.length > 0) {
                    const message = template.replace(/\$\{[^}]+\}/g, '{}');
                    const metadata = variables.map(v => v.slice(2, -1)).join(', ');
                    migrated = `logger.${level}('${message}', { ${metadata} });`;
                    pattern = 'template_literal';
                    confidence = 0.9;
                    warnings.push('Template literal converted to structured logging');
                }
            }
        }

        return {
            original: code,
            migrated,
            pattern,
            confidence,
            warnings,
        };
    }

    /**
     * Migrate an unstructured error log
     */
    static migrateUnstructuredError(code: string): MigrationResult {
        const warnings: string[] = [];
        let migrated = code;
        let pattern = 'unknown';
        let confidence = 0.5;

        // Pattern 1: logger.error with just error message
        if (/logger\.error\s*\(\s*error\.message\s*\)/.test(code)) {
            migrated = `logger.error('Error occurred', error);`;
            pattern = 'error_message';
            confidence = 0.9;
        }

        // Pattern 2: logger.error with string concatenation
        else if (/logger\.error\s*\(\s*['"][^'"]*['"]\s*\+\s*error\.message/.test(code)) {
            const match = code.match(/logger\.error\s*\(\s*['"]([^'"]*)['"]\s*\+\s*error\.message/);
            if (match) {
                migrated = `logger.error('${match[1]}', error);`;
                pattern = 'error_concatenation';
                confidence = 0.8;
            }
        }

        // Pattern 3: logger.error with template literal
        else if (/logger\.error\s*\(\s*`[^`]*\$\{error\.message\}[^`]*`/.test(code)) {
            const match = code.match(/logger\.error\s*\(\s*`([^`]*)`/);
            if (match) {
                const template = match[1];
                const message = template.replace(/\$\{error\.message\}/g, '{}');
                migrated = `logger.error('${message}', error);`;
                pattern = 'error_template';
                confidence = 0.8;
            }
        }

        return {
            original: code,
            migrated,
            pattern,
            confidence,
            warnings,
        };
    }

    /**
     * Migrate a log statement with sensitive data
     */
    static migrateSensitiveData(code: string): MigrationResult {
        const warnings: string[] = [];
        let migrated = code;
        let pattern = 'unknown';
        let confidence = 0.5;

        // Pattern 1: Direct sensitive data in metadata
        if (/logger\.(info|warn|error|debug|trace|fatal)\s*\(\s*['"][^'"]*['"]\s*,\s*\{[^}]*password[^}]*\}/.test(code)) {
            migrated = code.replace(/password\s*:\s*['"][^'"]*['"]/g, 'password: "[REDACTED]"');
            pattern = 'sensitive_password';
            confidence = 0.9;
            warnings.push('Password field redacted');
        }

        // Pattern 2: API key in metadata
        else if (/logger\.(info|warn|error|debug|trace|fatal)\s*\(\s*['"][^'"]*['"]\s*,\s*\{[^}]*apiKey[^}]*\}/.test(code)) {
            migrated = code.replace(/apiKey\s*:\s*['"][^'"]*['"]/g, 'apiKey: "[REDACTED]"');
            pattern = 'sensitive_api_key';
            confidence = 0.9;
            warnings.push('API key field redacted');
        }

        // Pattern 3: Token in metadata
        else if (/logger\.(info|warn|error|debug|trace|fatal)\s*\(\s*['"][^'"]*['"]\s*,\s*\{[^}]*token[^}]*\}/.test(code)) {
            migrated = code.replace(/token\s*:\s*['"][^'"]*['"]/g, 'token: "[REDACTED]"');
            pattern = 'sensitive_token';
            confidence = 0.9;
            warnings.push('Token field redacted');
        }

        return {
            original: code,
            migrated,
            pattern,
            confidence,
            warnings,
        };
    }

    /**
     * Migrate a log statement missing context
     */
    static migrateMissingContext(code: string): MigrationResult {
        const warnings: string[] = [];
        let migrated = code;
        let pattern = 'unknown';
        let confidence = 0.5;

        // Pattern 1: Simple log without context
        if (/logger\.(info|warn|error|debug|trace|fatal)\s*\(\s*['"][^'"]*['"]\s*\)/.test(code)) {
            const match = code.match(/logger\.(info|warn|error|debug|trace|fatal)\s*\(\s*['"]([^'"]*)['"]\s*\)/);
            if (match) {
                const level = match[1];
                const message = match[2];
                migrated = `logger.${level}('${message}', { context: 'missing' });`;
                pattern = 'missing_context';
                confidence = 0.7;
                warnings.push('Context added to log statement');
            }
        }

        return {
            original: code,
            migrated,
            pattern,
            confidence,
            warnings,
        };
    }

    /**
     * Auto-migrate any log statement
     */
    static autoMigrate(code: string): MigrationResult {
        // Try different migration strategies
        const strategies = [
            () => this.migrateConsoleLog(code),
            () => this.migrateTemplateLiteral(code),
            () => this.migrateUnstructuredError(code),
            () => this.migrateSensitiveData(code),
            () => this.migrateMissingContext(code),
        ];

        let bestResult: MigrationResult | null = null;
        let bestConfidence = 0;

        for (const strategy of strategies) {
            try {
                const result = strategy();
                if (result.confidence > bestConfidence) {
                    bestResult = result;
                    bestConfidence = result.confidence;
                }
            } catch (error) {
                // Strategy failed, continue with next
            }
        }

        if (bestResult && bestConfidence > 0.5) {
            return bestResult;
        }

        // No good migration found
        return {
            original: code,
            migrated: code,
            pattern: 'no_migration',
            confidence: 0,
            warnings: ['No suitable migration pattern found'],
        };
    }
}

/**
 * SSOT: Migration examples
 */
export const MIGRATION_EXAMPLES = {
    consoleLog: {
        before: `console.log('User logged in');`,
        after: `logger.info('User logged in');`,
        pattern: 'simple_string'
    },

    templateLiteral: {
        before: `logger.info(\`User \${userId} logged in from \${ip}\`);`,
        after: `logger.info('User {} logged in from {}', { userId, ip });`,
        pattern: 'template_literal'
    },

    errorMessage: {
        before: `logger.error('Error: ' + error.message);`,
        after: `logger.error('Error occurred', error);`,
        pattern: 'error_concatenation'
    },

    sensitiveData: {
        before: `logger.info('API call', { password: 'secret123' });`,
        after: `logger.info('API call', { password: '[REDACTED]' });`,
        pattern: 'sensitive_password'
    },

    missingContext: {
        before: `logger.info('User action performed');`,
        after: `logger.info('User action performed', { context: 'missing' });`,
        pattern: 'missing_context'
    }
} as const;

/**
 * SSOT: Export migration utilities
 */
export {
    LogMigrator,
    MIGRATION_EXAMPLES,
};
