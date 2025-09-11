// V1 Segregation of Duties (SoD) Matrix
// This implements the SoD requirements from the V1 plan

export interface SoDRule {
  action: string;
  requiredRole: string[];
  conflictingRoles?: string[];
  requiresApproval?: boolean;
  approverRoles?: string[];
}

// SoD Matrix - V1 Compliance
export const SOD_MATRIX: Record<string, SoDRule> = {
  // Journal Entry Operations
  'journal:create': {
    action: 'Create Journal Entry',
    requiredRole: ['accountant', 'manager', 'admin'],
  },
  'journal:post': {
    action: 'Post Journal Entry',
    requiredRole: ['manager', 'admin'],
    conflictingRoles: ['clerk'], // Clerks cannot post what they create
    requiresApproval: true,
    approverRoles: ['manager', 'admin']
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
  },
  'invoice:approve': {
    action: 'Approve Invoice',
    requiredRole: ['manager', 'admin'],
    conflictingRoles: ['clerk'], // Clerks cannot approve what they create
  },

  // Payment Operations
  'payment:create': {
    action: 'Create Payment',
    requiredRole: ['accountant', 'manager', 'admin'],
  },
  'payment:approve': {
    action: 'Approve Payment',
    requiredRole: ['manager', 'admin'],
    requiresApproval: true,
    approverRoles: ['admin'] // Payments require admin approval
  },

  // Period Close Operations
  'period:close': {
    action: 'Close Accounting Period',
    requiredRole: ['admin'],
    requiresApproval: true,
    approverRoles: ['admin']
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
  },
  'user:modify_roles': {
    action: 'Modify User Roles',
    requiredRole: ['admin'],
  }
};

export function checkSoDCompliance(
  action: string, 
  userRole: string, 
  creatorRole?: string
): { allowed: boolean; requiresApproval: boolean; reason?: string } {
  const rule = SOD_MATRIX[action];
  
  if (!rule) {
    return { allowed: false, requiresApproval: false, reason: 'Unknown action' };
  }

  // Check if user has required role
  if (!rule.requiredRole.includes(userRole)) {
    return { 
      allowed: false, 
      requiresApproval: false, 
      reason: `Role '${userRole}' not authorized for '${rule.action}'` 
    };
  }

  // Check for conflicting roles (SoD violation)
  if (creatorRole && rule.conflictingRoles?.includes(creatorRole)) {
    return { 
      allowed: false, 
      requiresApproval: false, 
      reason: `SoD violation: '${creatorRole}' cannot approve their own work` 
    };
  }

  return {
    allowed: true,
    requiresApproval: rule.requiresApproval || false
  };
}

export function getApproverRoles(action: string): string[] {
  const rule = SOD_MATRIX[action];
  return rule?.approverRoles || [];
}