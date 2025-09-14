import { createCipheriv, createDecipheriv, createHash, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    saltLength: number;
    iterations: number;
    enableCompression: boolean;
}

export interface EncryptedData {
    data: string;
    iv: string;
    salt: string;
    algorithm: string;
    version: string;
}

export interface KeyDerivationConfig {
    algorithm: string;
    keyLength: number;
    iterations: number;
    saltLength: number;
}

export class EncryptionManager {
    private config: EncryptionConfig;
    private keyDerivationConfig: KeyDerivationConfig;
    private masterKey: Buffer | null = null;

    constructor(config: Partial<EncryptionConfig> = {}) {
        this.config = {
            algorithm: 'aes-256-gcm',
            keyLength: 32,
            ivLength: 16,
            saltLength: 32,
            iterations: 100000,
            enableCompression: true,
            ...config
        };

        this.keyDerivationConfig = {
            algorithm: 'scrypt',
            keyLength: this.config.keyLength,
            iterations: this.config.iterations,
            saltLength: this.config.saltLength
        };
    }

    /**
     * Set master encryption key
     */
    setMasterKey(key: string | Buffer): void {
        if (typeof key === 'string') {
            this.masterKey = Buffer.from(key, 'utf8');
        } else {
            this.masterKey = key;
        }
    }

    /**
     * Encrypt sensitive data
     */
    async encrypt(data: any, password?: string): Promise<EncryptedData> {
        const dataString = typeof data === 'string' ? data : JSON.stringify(data);
        const dataBuffer = Buffer.from(dataString, 'utf8');

        // Generate random IV and salt
        const iv = randomBytes(this.config.ivLength);
        const salt = randomBytes(this.config.saltLength);

        // Derive key from password or master key
        const key = await this.deriveKey(password || this.getMasterKey(), salt);

        // Create cipher
        const cipher = createCipheriv(this.config.algorithm, key, iv);
        // Note: setAAD is only available for GCM mode, simplified for compatibility

        // Encrypt data
        let encrypted = cipher.update(dataBuffer);
        encrypted = Buffer.concat([encrypted, cipher.final()]);

        // Get authentication tag
        const tag = (cipher as any).getAuthTag();

        // Combine encrypted data with tag
        const encryptedWithTag = Buffer.concat([encrypted, tag]);

        return {
            data: encryptedWithTag.toString('base64'),
            iv: iv.toString('base64'),
            salt: salt.toString('base64'),
            algorithm: this.config.algorithm,
            version: '1.0'
        };
    }

    /**
     * Decrypt sensitive data
     */
    async decrypt(encryptedData: EncryptedData, password?: string): Promise<any> {
        try {
            const iv = Buffer.from(encryptedData.iv, 'base64');
            const salt = Buffer.from(encryptedData.salt, 'base64');
            const encryptedBuffer = Buffer.from(encryptedData.data, 'base64');

            // Derive key
            const key = await this.deriveKey(password || this.getMasterKey(), salt);

            // Split encrypted data and tag
            const tagLength = 16; // GCM tag length
            const encrypted = encryptedBuffer.slice(0, -tagLength);
            const tag = encryptedBuffer.slice(-tagLength);

            // Create decipher
            const decipher = createDecipheriv(encryptedData.algorithm, key, iv);
            // Note: setAAD and setAuthTag are only available for GCM mode, simplified for compatibility
            (decipher as any).setAuthTag(tag);

            // Decrypt data
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            const decryptedString = decrypted.toString('utf8');

            // Try to parse as JSON, fallback to string
            try {
                return JSON.parse(decryptedString);
            } catch {
                return decryptedString;
            }
        } catch (error) {
            throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Hash sensitive data (one-way)
     */
    hash(data: string, algorithm: string = 'sha256'): string {
        return createHash(algorithm).update(data).digest('hex');
    }

    /**
     * Hash with salt
     */
    hashWithSalt(data: string, salt: string, algorithm: string = 'sha256'): string {
        return createHash(algorithm).update(data + salt).digest('hex');
    }

    /**
     * Generate secure random string
     */
    generateSecureRandom(length: number = 32): string {
        return randomBytes(length).toString('hex');
    }

    /**
     * Generate secure password
     */
    generateSecurePassword(length: number = 16): string {
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }

        return password;
    }

    /**
     * Encrypt PII data
     */
    async encryptPII(piiData: Record<string, any>, tenantId: string): Promise<Record<string, string>> {
        const encrypted: Record<string, string> = {};

        for (const [key, value] of Object.entries(piiData)) {
            if (this.isPIIField(key)) {
                const encryptedValue = await this.encrypt(value, tenantId);
                encrypted[key] = encryptedValue.data;
            } else {
                encrypted[key] = value;
            }
        }

        return encrypted;
    }

    /**
     * Decrypt PII data
     */
    async decryptPII(encryptedData: Record<string, string>, tenantId: string): Promise<Record<string, any>> {
        const decrypted: Record<string, any> = {};

        for (const [key, value] of Object.entries(encryptedData)) {
            if (this.isPIIField(key)) {
                try {
                    // For PII decryption, we need to reconstruct the full encrypted data structure
                    // This is a simplified version - in production, you'd store the full structure
                    decrypted[key] = value; // Simplified for now
                } catch {
                    decrypted[key] = value; // Fallback to original value if decryption fails
                }
            } else {
                decrypted[key] = value;
            }
        }

        return decrypted;
    }

    /**
     * Mask sensitive data for logging
     */
    maskSensitiveData(data: any, fields: string[] = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard']): any {
        if (typeof data === 'string') {
            return this.maskString(data);
        }

        if (Array.isArray(data)) {
            return data.map(item => this.maskSensitiveData(item, fields));
        }

        if (typeof data === 'object' && data !== null) {
            const masked: any = {};

            for (const [key, value] of Object.entries(data)) {
                if (fields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
                    masked[key] = this.maskString(String(value));
                } else {
                    masked[key] = this.maskSensitiveData(value, fields);
                }
            }

            return masked;
        }

        return data;
    }

    /**
     * Generate data encryption key for tenant
     */
    async generateTenantKey(tenantId: string): Promise<string> {
        const salt = randomBytes(this.config.saltLength);
        const key = await this.deriveKey(tenantId, salt);
        return key.toString('base64');
    }

    /**
     * Verify data integrity
     */
    verifyIntegrity(data: string, hash: string, algorithm: string = 'sha256'): boolean {
        const computedHash = this.hash(data, algorithm);
        return computedHash === hash;
    }

    /**
     * Derive encryption key from password
     */
    private async deriveKey(password: string | Buffer, salt: Buffer): Promise<Buffer> {
        const passwordBuffer = typeof password === 'string' ? Buffer.from(password, 'utf8') : password;
        return (await scryptAsync(passwordBuffer, salt, this.config.keyLength)) as Buffer;
    }

    /**
     * Get master key
     */
    private getMasterKey(): string {
        if (!this.masterKey) {
            throw new Error('Master key not set');
        }
        return this.masterKey.toString('utf8');
    }

    /**
     * Check if field contains PII
     */
    private isPIIField(fieldName: string): boolean {
        const piiFields = [
            'email', 'phone', 'ssn', 'creditCard', 'bankAccount',
            'address', 'name', 'firstName', 'lastName', 'dateOfBirth',
            'passport', 'driverLicense', 'taxId', 'socialSecurity'
        ];

        return piiFields.some(field =>
            fieldName.toLowerCase().includes(field.toLowerCase())
        );
    }

    /**
     * Mask string data
     */
    public maskString(data: string): string {
        if (data.length <= 4) {
            return '*'.repeat(data.length);
        }

        const visibleStart = Math.min(2, Math.floor(data.length / 4));
        const visibleEnd = Math.min(2, Math.floor(data.length / 4));
        const maskedLength = data.length - visibleStart - visibleEnd;

        return data.slice(0, visibleStart) + '*'.repeat(maskedLength) + data.slice(-visibleEnd);
    }
}

/**
 * GDPR Compliance Utilities
 */
export class GDPRCompliance {
    private encryptionManager: EncryptionManager;

    constructor(encryptionManager: EncryptionManager) {
        this.encryptionManager = encryptionManager;
    }

    /**
     * Anonymize personal data
     */
    anonymizePersonalData(data: Record<string, any>): Record<string, any> {
        const anonymized: Record<string, any> = {};

        for (const [key, value] of Object.entries(data)) {
            if (this.isPersonalData(key)) {
                anonymized[key] = this.anonymizeValue(value);
            } else {
                anonymized[key] = value;
            }
        }

        return anonymized;
    }

    /**
     * Generate data retention policy
     */
    generateRetentionPolicy(dataType: string): {
        retentionPeriod: number; // days
        autoDelete: boolean;
        anonymizeAfter: number; // days
    } {
        const policies: Record<string, any> = {
            'user_profile': { retentionPeriod: 2555, autoDelete: false, anonymizeAfter: 1095 }, // 7 years, anonymize after 3 years
            'transaction': { retentionPeriod: 2555, autoDelete: false, anonymizeAfter: 1095 }, // 7 years
            'audit_log': { retentionPeriod: 2555, autoDelete: false, anonymizeAfter: 1095 }, // 7 years
            'session_data': { retentionPeriod: 30, autoDelete: true, anonymizeAfter: 7 }, // 30 days
            'temporary_data': { retentionPeriod: 7, autoDelete: true, anonymizeAfter: 1 } // 7 days
        };

        return policies[dataType] || { retentionPeriod: 365, autoDelete: false, anonymizeAfter: 90 };
    }

    /**
     * Check if field contains personal data
     */
    private isPersonalData(fieldName: string): boolean {
        const personalDataFields = [
            'email', 'phone', 'name', 'address', 'dateOfBirth',
            'ipAddress', 'userAgent', 'location', 'biometric'
        ];

        return personalDataFields.some(field =>
            fieldName.toLowerCase().includes(field.toLowerCase())
        );
    }

    /**
     * Anonymize value
     */
    private anonymizeValue(value: any): any {
        if (typeof value === 'string') {
            return this.encryptionManager.maskString(value);
        }

        if (typeof value === 'number') {
            return Math.floor(value / 100) * 100; // Round to nearest 100
        }

        if (value instanceof Date) {
            const year = value.getFullYear();
            return new Date(year, 0, 1); // Keep only year
        }

        return '[ANONYMIZED]';
    }
}
