/**
 * @aibos/contracts - Entity Types (SSOT)
 * 
 * Single source of truth for all entity definitions used across the system
 */

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    companyId: string; // For tenant isolation
    createdAt: string;
    updatedAt: string;
}

export interface Company {
    id: string;
    name: string;
    settings: CompanySettings;
    users: User[];
    createdAt: string;
    updatedAt: string;
}

export interface CompanySettings {
    baseCurrency: string;
    fiscalYearEnd: string;
    approvalThreshold: number;
    mfaRequired: boolean;
    sessionTimeout: number;
}

// Note: User and Company are defined above, no need to re-export
