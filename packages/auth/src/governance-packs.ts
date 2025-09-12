// Governance Pack Presets - Ready-to-use admin configurations
// Provides 3 preset configurations for different organizational needs

import type { FeatureFlags, PolicySettings, MemberPermissions } from './sod';

export interface GovernancePack {
    name: string;
    description: string;
    useCase: string;
    featureFlags: FeatureFlags;
    policySettings: PolicySettings;
    defaultRoles: string[];
    memberPermissionTemplates: Record<string, MemberPermissions>;
}

// 1. Starter Pack - Simple RBAC for small teams
export const STARTER_PACK: GovernancePack = {
    name: 'Starter Pack',
    description: 'Basic features for small teams (≤10 users, single company)',
    useCase: 'Small businesses getting started with accounting automation',
    featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: false,        // Disabled initially
        je: false,        // Disabled initially  
        regulated_mode: false
    },
    policySettings: {
        approval_threshold_rm: 50000,
        export_requires_reason: false,
        mfa_required_for_admin: false,  // Optional for small teams
        session_timeout_minutes: 480    // 8 hours
    },
    defaultRoles: ['owner', 'accountant', 'viewer'],
    memberPermissionTemplates: {
        owner: {
            roles: ['owner'],
            allow: ['*'], // All permissions
            deny: [],
            overrides: {}
        },
        accountant: {
            roles: ['accountant'],
            allow: ['invoice:create', 'invoice:post', 'report:generate', 'attachment:upload'],
            deny: ['admin:configure'],
            overrides: {
                approval_threshold_rm: 75000 // Higher threshold for senior accountants
            }
        },
        viewer: {
            roles: ['viewer'],
            allow: ['report:generate'],
            deny: ['invoice:post', 'payment:create', 'admin:access'],
            overrides: {}
        }
    }
};

// 2. Business Pack - Full features for growing companies
export const BUSINESS_PACK: GovernancePack = {
    name: 'Business Pack',
    description: 'Full features for growing companies (11-200 users, multi-dept)',
    useCase: 'Growing businesses with multiple departments and processes',
    featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: true,         // Enabled for full AP workflow
        je: true,         // Enabled for manual adjustments
        regulated_mode: false
    },
    policySettings: {
        approval_threshold_rm: 30000,   // Lower threshold for better controls
        export_requires_reason: true,   // Audit trail for exports
        mfa_required_for_admin: true,
        session_timeout_minutes: 240    // 4 hours
    },
    defaultRoles: ['owner', 'admin', 'manager', 'accountant', 'clerk', 'viewer'],
    memberPermissionTemplates: {
        owner: {
            roles: ['owner'],
            allow: ['*'],
            deny: [],
            overrides: {}
        },
        admin: {
            roles: ['admin'],
            allow: ['admin:access', 'admin:configure', 'user:create', 'user:modify_roles'],
            deny: [],
            overrides: {}
        },
        manager: {
            roles: ['manager'],
            allow: ['invoice:approve', 'payment:approve', 'report:export', 'period:close'],
            deny: ['admin:configure'],
            overrides: {
                approval_threshold_rm: 50000 // Managers can approve higher amounts
            }
        },
        accountant: {
            roles: ['accountant'],
            allow: ['invoice:create', 'invoice:post', 'je:create', 'payment:create', 'report:generate'],
            deny: ['admin:access'],
            overrides: {}
        },
        clerk: {
            roles: ['clerk'],
            allow: ['invoice:create', 'attachment:upload'],
            deny: ['invoice:approve', 'payment:approve', 'je:create'],
            overrides: {}
        },
        viewer: {
            roles: ['viewer'],
            allow: ['report:generate'],
            deny: ['invoice:post', 'payment:create', 'admin:access'],
            overrides: {}
        }
    }
};

// 3. Enterprise Pack - Maximum security and compliance
export const ENTERPRISE_PACK: GovernancePack = {
    name: 'Enterprise Pack',
    description: 'Maximum security and compliance (multi-entity, audit scrutiny)',
    useCase: 'Large enterprises with strict compliance and audit requirements',
    featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: true,
        je: true,
        regulated_mode: true  // Enhanced compliance features
    },
    policySettings: {
        approval_threshold_rm: 10000,   // Very low threshold for strict controls
        export_requires_reason: true,
        mfa_required_for_admin: true,
        session_timeout_minutes: 120,   // 2 hours for security
        ip_allowlist: [],               // Can be configured per organization
    },
    defaultRoles: ['owner', 'admin', 'manager', 'accountant', 'clerk', 'auditor', 'viewer'],
    memberPermissionTemplates: {
        owner: {
            roles: ['owner'],
            allow: ['*'],
            deny: [],
            overrides: {}
        },
        admin: {
            roles: ['admin'],
            allow: ['admin:access', 'admin:configure', 'user:create', 'user:modify_roles'],
            deny: [],
            overrides: {
                approval_threshold_rm: 25000 // Even admins have limits in enterprise
            }
        },
        manager: {
            roles: ['manager'],
            allow: ['invoice:approve', 'payment:approve', 'report:export'],
            deny: ['admin:configure', 'period:close'], // Period close requires higher approval
            overrides: {
                approval_threshold_rm: 15000
            }
        },
        accountant: {
            roles: ['accountant'],
            allow: ['invoice:create', 'je:create', 'payment:create', 'report:generate'],
            deny: ['invoice:approve', 'payment:approve', 'admin:access'],
            overrides: {}
        },
        clerk: {
            roles: ['clerk'],
            allow: ['invoice:create', 'attachment:upload'],
            deny: ['invoice:approve', 'payment:approve', 'je:create', 'report:export'],
            overrides: {}
        },
        auditor: {
            roles: ['auditor'],
            allow: ['report:view_sensitive', 'report:export', 'admin:access'],
            deny: ['invoice:create', 'payment:create', 'admin:configure'],
            overrides: {
                approval_threshold_rm: 0 // Auditors can view all transactions
            }
        },
        viewer: {
            roles: ['viewer'],
            allow: ['report:generate'],
            deny: ['invoice:post', 'payment:create', 'admin:access', 'report:export'],
            overrides: {}
        }
    }
};

// 4. Regulated Finance Pack - SOX/MFRS compliance
export const REGULATED_FINANCE_PACK: GovernancePack = {
    name: 'Regulated Finance Pack',
    description: 'SOX/MFRS compliance with strict SoD and data roles',
    useCase: 'Listed companies, IPO-track, external audit scrutiny',
    featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: true,
        je: true,
        regulated_mode: true
    },
    policySettings: {
        approval_threshold_rm: 5000,    // Very strict threshold
        export_requires_reason: true,
        mfa_required_for_admin: true,
        session_timeout_minutes: 60,    // 1 hour maximum
        ip_allowlist: []
    },
    defaultRoles: ['owner', 'cfo', 'controller', 'accountant', 'clerk', 'auditor', 'viewer'],
    memberPermissionTemplates: {
        owner: {
            roles: ['owner'],
            allow: ['*'],
            deny: [],
            overrides: {}
        },
        cfo: {
            roles: ['cfo'],
            allow: ['admin:access', 'period:close', 'report:export', 'report:view_sensitive'],
            deny: ['invoice:create', 'payment:create'], // SoD: CFO cannot create transactions
            overrides: {
                approval_threshold_rm: 100000 // CFO can approve large amounts
            }
        },
        controller: {
            roles: ['controller'],
            allow: ['invoice:approve', 'payment:approve', 'je:approve', 'report:export'],
            deny: ['invoice:create', 'payment:create'], // SoD: Controller cannot create what they approve
            overrides: {
                approval_threshold_rm: 50000
            }
        },
        accountant: {
            roles: ['accountant'],
            allow: ['invoice:create', 'je:create', 'payment:create', 'report:generate'],
            deny: ['invoice:approve', 'payment:approve', 'period:close'],
            overrides: {}
        },
        clerk: {
            roles: ['clerk'],
            allow: ['invoice:create', 'attachment:upload'],
            deny: ['invoice:approve', 'payment:create', 'je:create'],
            overrides: {}
        },
        auditor: {
            roles: ['auditor'],
            allow: ['report:view_sensitive', 'report:export', 'admin:access'],
            deny: ['invoice:create', 'payment:create', 'admin:configure', 'period:close'],
            overrides: {
                approval_threshold_rm: 0 // Auditors can view all
            }
        },
        viewer: {
            roles: ['viewer'],
            allow: ['report:generate'],
            deny: ['invoice:post', 'payment:create', 'admin:access', 'report:export'],
            overrides: {}
        }
    }
};

// 5. Franchise Pack - Multi-brand with local overrides
export const FRANCHISE_PACK: GovernancePack = {
    name: 'Franchise Pack',
    description: 'Multi-brand operations with delegated admin and local overrides',
    useCase: 'Franchise operations, many outlets/entities, delegated administration',
    featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: true,
        je: false,        // Restricted at franchise level
        regulated_mode: false
    },
    policySettings: {
        approval_threshold_rm: 20000,
        export_requires_reason: true,
        mfa_required_for_admin: true,
        session_timeout_minutes: 360    // 6 hours for operational efficiency
    },
    defaultRoles: ['hq_admin', 'regional_manager', 'franchise_admin', 'store_manager', 'cashier', 'viewer'],
    memberPermissionTemplates: {
        hq_admin: {
            roles: ['hq_admin'],
            allow: ['*'],
            deny: [],
            overrides: {}
        },
        regional_manager: {
            roles: ['regional_manager'],
            allow: ['admin:access', 'report:export', 'invoice:approve', 'payment:approve'],
            deny: ['admin:configure'], // Cannot change global settings
            overrides: {
                approval_threshold_rm: 100000 // Regional managers have high limits
            }
        },
        franchise_admin: {
            roles: ['franchise_admin'],
            allow: ['user:create', 'invoice:approve', 'payment:approve', 'report:export'],
            deny: ['admin:configure', 'period:close'],
            overrides: {
                approval_threshold_rm: 50000
            }
        },
        store_manager: {
            roles: ['store_manager'],
            allow: ['invoice:create', 'invoice:approve', 'payment:create', 'report:generate'],
            deny: ['admin:access', 'user:create'],
            overrides: {
                approval_threshold_rm: 10000
            }
        },
        cashier: {
            roles: ['cashier'],
            allow: ['invoice:create', 'attachment:upload'],
            deny: ['invoice:approve', 'payment:create', 'report:export'],
            overrides: {}
        },
        viewer: {
            roles: ['viewer'],
            allow: ['report:generate'],
            deny: ['invoice:post', 'payment:create', 'admin:access'],
            overrides: {}
        }
    }
};

// Export all packs
export const GOVERNANCE_PACKS = {
    starter: STARTER_PACK,
    business: BUSINESS_PACK,
    enterprise: ENTERPRISE_PACK,
    regulated: REGULATED_FINANCE_PACK,
    franchise: FRANCHISE_PACK
} as const;

// Helper function to apply a governance pack
export function applyGovernancePack(packName: keyof typeof GOVERNANCE_PACKS): GovernancePack {
    return GOVERNANCE_PACKS[packName];
}

// Helper function to get pack recommendations based on organization size
export function getRecommendedPack(userCount: number, hasCompliance: boolean = false): keyof typeof GOVERNANCE_PACKS {
    if (hasCompliance) return 'regulated';
    if (userCount <= 10) return 'starter';
    if (userCount <= 200) return 'business';
    return 'enterprise';
}
