// V1 Segregation of Duties (SoD) Matrix + Admin Configuration
// This implements the SoD requirements from the V1 plan with enhanced RBAC + ABAC

export interface SoDRule {
  action: string;
  requiredRole: string[];
  conflictingRoles?: string[];
  requiresApproval?: boolean;
  approverRoles?: string[];
  // ABAC enhancements
  amountThreshold?: number;
  requiresFeature?: string;
  module?: string;
}

// Feature flags and policy types
export interface FeatureFlags {
  attachments?: boolean;
  reports?: boolean;
  ap?: boolean;
  ar?: boolean;
  je?: boolean;
  regulated_mode?: boolean;
  [key: string]: boolean | undefined;
}

export interface PolicySettings {
  approval_threshold_rm?: number;
  export_requires_reason?: boolean;
  mfa_required_for_admin?: boolean;
  ip_allowlist?: string[];
  session_timeout_minutes?: number;
}

export interface MemberPermissions {
  roles?: string[];
  allow?: string[];
  deny?: string[];
  overrides?: {
    approval_threshold_rm?: number;
    [key: string]: unknown;
  };
}

export interface UserContext {
  id: string;
  tenantId: string;
  companyId: string;
  roles: string[];
  permissions?: MemberPermissions;
}

export interface ActionContext {
  amount?: number;
  module?: string;
  ip?: string;
  creatorRole?: string;
}

export interface Decision {
  allowed: boolean;
  requiresApproval?: boolean;
  reason?: string;
}

// SoD Matrix - V1 Compliance
export const SOD_MATRIX: Record<string, SoDRule> = {
  // Journal Entry Operations
  'journal:create': {
    action: 'Create Journal Entry',
    requiredRole: ['accountant', 'manager', 'admin'],
    requiresFeature: 'je',
    module: 'GL'
  },
  'journal:post': {
    action: 'Post Journal Entry',
    requiredRole: ['manager', 'admin'],
    conflictingRoles: ['clerk'], // Clerks cannot post what they create
    requiresApproval: true,
    approverRoles: ['manager', 'admin'],
    requiresFeature: 'je',
    module: 'GL',
    amountThreshold: 50000 // Default threshold, can be overridden by policy
  },
  'journal:reverse': {
    action: 'Reverse Journal Entry',
    requiredRole: ['admin'],
    requiresApproval: true,
    approverRoles: ['admin']
  },

  // Invoice Operations
  'invoice:create': {
    action: 'Create Invoice',
    requiredRole: ['clerk', 'accountant', 'manager', 'admin'],
    requiresFeature: 'ar',
    module: 'AR'
  },
  'invoice:post': {
    action: 'Post Invoice',
    requiredRole: ['accountant', 'manager', 'admin'],
    requiresFeature: 'ar',
    module: 'AR',
    amountThreshold: 50000
  },
  'invoice:approve': {
    action: 'Approve Invoice',
    requiredRole: ['manager', 'admin'],
    conflictingRoles: ['clerk'], // Clerks cannot approve what they create
    requiresFeature: 'ar',
    module: 'AR'
  },

  // Payment Operations
  'payment:create': {
    action: 'Create Payment',
    requiredRole: ['accountant', 'manager', 'admin'],
    requiresFeature: 'ap',
    module: 'AP'
  },
  'payment:approve': {
    action: 'Approve Payment',
    requiredRole: ['manager', 'admin'],
    requiresApproval: true,
    approverRoles: ['admin'], // Payments require admin approval
    requiresFeature: 'ap',
    module: 'AP',
    amountThreshold: 10000 // Lower threshold for payments
  },

  // Period Close Operations
  'period:close': {
    action: 'Close Accounting Period',
    requiredRole: ['admin'],
    requiresApproval: true,
    approverRoles: ['admin']
  },

  // Financial Reporting Operations (D4 V1 compliance)
  'report:generate': {
    action: 'Generate Financial Reports',
    requiredRole: ['accountant', 'manager', 'admin'],
    requiresFeature: 'reports',
    module: 'REPORTS'
  },
  'report:export': {
    action: 'Export Financial Reports',
    requiredRole: ['manager', 'admin'],
    requiresApproval: true,
    approverRoles: ['admin'],
    requiresFeature: 'reports',
    module: 'REPORTS'
  },
  'report:view_sensitive': {
    action: 'View Sensitive Financial Data',
    requiredRole: ['manager', 'admin'],
    requiresFeature: 'regulated_mode',
    module: 'REPORTS'
  },

  // Attachment Operations
  'attachment:upload': {
    action: 'Upload Attachment',
    requiredRole: ['clerk', 'accountant', 'manager', 'admin'],
    requiresFeature: 'attachments',
    module: 'ATTACHMENTS'
  },
  'attachment:delete': {
    action: 'Delete Attachment',
    requiredRole: ['manager', 'admin'],
    requiresFeature: 'attachments',
    module: 'ATTACHMENTS'
  },

  // Chart of Accounts
  'coa:modify': {
    action: 'Modify Chart of Accounts',
    requiredRole: ['admin'],
  },

  // User Management
  'user:create': {
    action: 'Create User',
    requiredRole: ['admin'],
    module: 'ADMIN'
  },
  'user:modify_roles': {
    action: 'Modify User Roles',
    requiredRole: ['admin'],
    module: 'ADMIN'
  },

  // Admin Operations
  'admin:access': {
    action: 'Access Admin Panel',
    requiredRole: ['admin'],
    module: 'ADMIN'
  },
  'admin:configure': {
    action: 'Configure System Settings',
    requiredRole: ['admin'],
    module: 'ADMIN'
  }
};

// Enhanced permission checking with RBAC + ABAC + Feature Flags
export function canPerformAction(
  user: UserContext,
  action: string,
  context: ActionContext,
  featureFlags: FeatureFlags,
  policySettings: PolicySettings
): Decision {
  const rule = SOD_MATRIX[action];

  if (!rule) {
    return { allowed: false, reason: 'Unknown action' };
  }

  // 1. Check feature flag requirement
  if (rule.requiresFeature && !featureFlags[rule.requiresFeature]) {
    return { allowed: false, reason: `Feature '${rule.requiresFeature}' is disabled` };
  }

  // 2. Check explicit deny in member permissions
  if (user.permissions?.deny?.includes(action)) {
    return { allowed: false, reason: 'Explicitly denied' };
  }

  // 3. Check explicit allow in member permissions (bypasses role check)
  const explicitAllow = user.permissions?.allow?.includes(action);

  // 4. Check role-based access
  const roleAllowed = user.roles.some(role => rule.requiredRole.includes(role));

  if (!explicitAllow && !roleAllowed) {
    return {
      allowed: false,
      reason: `Role(s) '${user.roles.join(', ')}' not authorized for '${rule.action}'`
    };
  }

  // 5. Check SoD violations
  if (context.creatorRole && rule.conflictingRoles?.includes(context.creatorRole)) {
    return {
      allowed: false,
      reason: `SoD violation: '${context.creatorRole}' cannot approve their own work`
    };
  }

  // 6. Check amount thresholds (ABAC)
  if (context.amount && rule.amountThreshold) {
    const threshold = user.permissions?.overrides?.approval_threshold_rm ??
      policySettings.approval_threshold_rm ??
      rule.amountThreshold;

    if (context.amount > threshold) {
      // Check if user has approver role for high amounts
      const hasApproverRole = rule.approverRoles?.some(role => user.roles.includes(role));
      if (!hasApproverRole) {
        return {
          allowed: false,
          reason: `Amount ${context.amount} exceeds threshold ${threshold}, requires approver role`
        };
      }
    }
  }

  return {
    allowed: true,
    requiresApproval: rule.requiresApproval || false
  };
}

// Feature flag checking
export function isFeatureEnabled(
  feature: string,
  featureFlags: FeatureFlags,
  userRoles: string[]
): boolean {
  // Check if feature is globally enabled
  if (!featureFlags[feature]) {
    return false;
  }

  // Special role-based feature restrictions
  if (feature === 'regulated_mode') {
    return userRoles.includes('admin') || userRoles.includes('manager');
  }

  return true;
}

// Legacy function for backward compatibility
export function checkSoDCompliance(
  action: string,
  userRole: string,
  creatorRole?: string
): { allowed: boolean; requiresApproval: boolean; reason?: string } {
  // Convert to new format for backward compatibility
  const user: UserContext = {
    id: 'legacy',
    tenantId: 'legacy',
    companyId: 'legacy',
    roles: [userRole]
  };

  const context: ActionContext = {
    creatorRole
  };

  const decision = canPerformAction(user, action, context, {}, {});

  return {
    allowed: decision.allowed,
    requiresApproval: decision.requiresApproval || false,
    reason: decision.reason
  };
}

export function getApproverRoles(action: string): string[] {
  const rule = SOD_MATRIX[action];
  return rule?.approverRoles || [];
}
