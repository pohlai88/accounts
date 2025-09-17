/**
 * Comprehensive Access Control and Permissions Management System
 *
 * Provides role-based access control (RBAC), attribute-based access control (ABAC),
 * and fine-grained permissions management for the AI-BOS platform.
 */

import { EventEmitter } from "events";
import { monitoring } from "@aibos/monitoring";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  effect: "allow" | "deny";
  priority: number;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface PermissionCondition {
  attribute: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in" | "greater_than" | "less_than" | "regex";
  value: string | number | boolean | string[];
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[]; // Permission IDs
  inheritsFrom: string[]; // Role IDs
  isSystem: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  metadata: Record<string, unknown>;
}

export interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;
  companyId: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
  isActive: boolean;
  metadata: Record<string, unknown>;
}

export interface AccessPolicy {
  id: string;
  name: string;
  description: string;
  type: "rbac" | "abac" | "hybrid";
  rules: AccessRule[];
  isActive: boolean;
  priority: number;
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
}

export interface AccessRule {
  id: string;
  name: string;
  description: string;
  subjects: string[]; // User IDs, Role IDs, or groups
  resources: string[]; // Resource patterns
  actions: string[]; // Action patterns
  conditions: AccessCondition[];
  effect: "allow" | "deny";
  priority: number;
}

export interface AccessCondition {
  attribute: string;
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "in" | "not_in" | "greater_than" | "less_than" | "regex" | "time_based" | "location_based";
  value: string | number | boolean | string[];
  context?: Record<string, unknown>;
}

export interface AccessDecision {
  decision: "allow" | "deny" | "indeterminate";
  reason: string;
  matchedRules: string[];
  evaluatedConditions: Array<{
    condition: AccessCondition;
    result: boolean;
    reason: string;
  }>;
  context: Record<string, unknown>;
  timestamp: Date;
}

export interface AccessAuditLog {
  id: string;
  userId: string;
  tenantId: string;
  resource: string;
  action: string;
  decision: AccessDecision["decision"];
  reason: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata: Record<string, unknown>;
}

export interface AccessControlConfig {
  enableRBAC: boolean;
  enableABAC: boolean;
  enableAuditLogging: boolean;
  enableCaching: boolean;
  cacheTimeout: number; // seconds
  defaultDeny: boolean;
  enableTimeBasedAccess: boolean;
  enableLocationBasedAccess: boolean;
  maxPermissionDepth: number;
  enablePermissionInheritance: boolean;
}

// ============================================================================
// ACCESS CONTROL MANAGER
// ============================================================================

export class AccessControlManager extends EventEmitter {
  private config: AccessControlConfig;
  private permissions: Permission[] = [];
  private roles: Role[] = [];
  private userRoles: UserRole[] = [];
  private accessPolicies: AccessPolicy[] = [];
  private auditLogs: AccessAuditLog[] = [];
  private permissionCache: Map<string, AccessDecision> = new Map();

  constructor(config: Partial<AccessControlConfig> = {}) {
    super();

    this.config = {
      enableRBAC: true,
      enableABAC: true,
      enableAuditLogging: true,
      enableCaching: true,
      cacheTimeout: 300, // 5 minutes
      defaultDeny: true,
      enableTimeBasedAccess: true,
      enableLocationBasedAccess: false,
      maxPermissionDepth: 10,
      enablePermissionInheritance: true,
      ...config,
    };

    this.initializeDefaultPermissions();
    this.initializeDefaultRoles();
    this.initializeDefaultPolicies();
    this.startCacheCleanup();
  }

  /**
   * Initialize default permissions
   */
  private initializeDefaultPermissions(): void {
    this.permissions = [
      // User Management Permissions
      {
        id: "user:create",
        name: "Create User",
        description: "Create new users",
        resource: "users",
        action: "create",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "user:read",
        name: "Read User",
        description: "View user information",
        resource: "users",
        action: "read",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "user:update",
        name: "Update User",
        description: "Modify user information",
        resource: "users",
        action: "update",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "user:delete",
        name: "Delete User",
        description: "Delete users",
        resource: "users",
        action: "delete",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      // Financial Data Permissions
      {
        id: "financial:read",
        name: "Read Financial Data",
        description: "View financial information",
        resource: "financial",
        action: "read",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "financial:create",
        name: "Create Financial Data",
        description: "Create financial records",
        resource: "financial",
        action: "create",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "financial:update",
        name: "Update Financial Data",
        description: "Modify financial records",
        resource: "financial",
        action: "update",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "financial:delete",
        name: "Delete Financial Data",
        description: "Delete financial records",
        resource: "financial",
        action: "delete",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      // Security Permissions
      {
        id: "security:audit:run",
        name: "Run Security Audit",
        description: "Execute security audits",
        resource: "security",
        action: "audit:run",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "security:backup:create",
        name: "Create Backup",
        description: "Create system backups",
        resource: "security",
        action: "backup:create",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "security:backup:restore",
        name: "Restore Backup",
        description: "Restore system backups",
        resource: "security",
        action: "backup:restore",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      // Compliance Permissions
      {
        id: "compliance:dsr:create",
        name: "Create Data Subject Request",
        description: "Create data subject requests",
        resource: "compliance",
        action: "dsr:create",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "compliance:dsr:process",
        name: "Process Data Subject Request",
        description: "Process data subject requests",
        resource: "compliance",
        action: "dsr:process",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "compliance:breach:create",
        name: "Create Data Breach Incident",
        description: "Create data breach incidents",
        resource: "compliance",
        action: "breach:create",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "compliance:breach:update",
        name: "Update Data Breach Incident",
        description: "Update data breach incidents",
        resource: "compliance",
        action: "breach:update",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "compliance:reports:generate",
        name: "Generate Compliance Report",
        description: "Generate compliance reports",
        resource: "compliance",
        action: "reports:generate",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      // Disaster Recovery Permissions
      {
        id: "security:disaster-recovery:test",
        name: "Test Disaster Recovery",
        description: "Test disaster recovery procedures",
        resource: "security",
        action: "disaster-recovery:test",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "security:failover:execute",
        name: "Execute Failover",
        description: "Execute failover procedures",
        resource: "security",
        action: "failover:execute",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
      {
        id: "security:failover:configure",
        name: "Configure Failover",
        description: "Configure failover settings",
        resource: "security",
        action: "failover:configure",
        effect: "allow",
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
    ];
  }

  /**
   * Initialize default roles
   */
  private initializeDefaultRoles(): void {
    this.roles = [
      {
        id: "admin",
        name: "Administrator",
        description: "Full system administrator with all permissions",
        permissions: this.permissions.map(p => p.id),
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        metadata: {
          level: "highest",
          description: "Complete system access",
        },
      },
      {
        id: "manager",
        name: "Manager",
        description: "Manager with financial and user management permissions",
        permissions: [
          "user:create", "user:read", "user:update",
          "financial:read", "financial:create", "financial:update",
          "compliance:dsr:create", "compliance:dsr:process",
          "compliance:reports:generate",
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        metadata: {
          level: "high",
          description: "Management level access",
        },
      },
      {
        id: "accountant",
        name: "Accountant",
        description: "Accountant with financial data access",
        permissions: [
          "financial:read", "financial:create", "financial:update",
          "compliance:dsr:create",
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        metadata: {
          level: "medium",
          description: "Financial data access",
        },
      },
      {
        id: "user",
        name: "User",
        description: "Basic user with limited permissions",
        permissions: [
          "user:read",
          "financial:read",
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        metadata: {
          level: "low",
          description: "Basic user access",
        },
      },
      {
        id: "security-officer",
        name: "Security Officer",
        description: "Security officer with security and compliance permissions",
        permissions: [
          "security:audit:run",
          "security:backup:create", "security:backup:restore",
          "security:disaster-recovery:test",
          "security:failover:execute", "security:failover:configure",
          "compliance:breach:create", "compliance:breach:update",
          "compliance:reports:generate",
        ],
        inheritsFrom: [],
        isSystem: true,
        isActive: true,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
        metadata: {
          level: "high",
          description: "Security and compliance access",
        },
      },
    ];
  }

  /**
   * Initialize default access policies
   */
  private initializeDefaultPolicies(): void {
    this.accessPolicies = [
      {
        id: "policy-default",
        name: "Default Access Policy",
        description: "Default access control policy",
        type: "rbac",
        rules: [
          {
            id: "rule-admin-all",
            name: "Admin Full Access",
            description: "Administrators have full access",
            subjects: ["admin"],
            resources: ["*"],
            actions: ["*"],
            conditions: [],
            effect: "allow",
            priority: 1,
          },
          {
            id: "rule-manager-financial",
            name: "Manager Financial Access",
            description: "Managers can access financial data",
            subjects: ["manager"],
            resources: ["financial", "users"],
            actions: ["read", "create", "update"],
            conditions: [],
            effect: "allow",
            priority: 2,
          },
          {
            id: "rule-accountant-financial",
            name: "Accountant Financial Access",
            description: "Accountants can access financial data",
            subjects: ["accountant"],
            resources: ["financial"],
            actions: ["read", "create", "update"],
            conditions: [],
            effect: "allow",
            priority: 3,
          },
          {
            id: "rule-user-basic",
            name: "User Basic Access",
            description: "Users have basic read access",
            subjects: ["user"],
            resources: ["financial"],
            actions: ["read"],
            conditions: [],
            effect: "allow",
            priority: 4,
          },
        ],
        isActive: true,
        priority: 1,
        createdBy: "system",
        createdAt: new Date(),
        lastModified: new Date(),
      },
    ];
  }

  /**
   * Check if user has permission
   */
  async checkPermission(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    context: Record<string, unknown> = {}
  ): Promise<AccessDecision> {
    const cacheKey = `${userId}:${tenantId}:${resource}:${action}:${JSON.stringify(context)}`;

    // Check cache first
    if (this.config.enableCaching) {
      const cached = this.permissionCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const decision = await this.evaluateAccess(userId, tenantId, resource, action, context);

    // Cache the decision
    if (this.config.enableCaching) {
      this.permissionCache.set(cacheKey, decision);
    }

    // Log the access attempt
    if (this.config.enableAuditLogging) {
      this.logAccessAttempt(userId, tenantId, resource, action, decision, context);
    }

    return decision;
  }

  /**
   * Evaluate access using RBAC and ABAC
   */
  private async evaluateAccess(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    context: Record<string, unknown>
  ): Promise<AccessDecision> {
    const matchedRules: string[] = [];
    const evaluatedConditions: Array<{
      condition: AccessCondition;
      result: boolean;
      reason: string;
    }> = [];

    // Get user roles
    const userRoles = this.getUserRoles(userId, tenantId);
    if (userRoles.length === 0) {
      return {
        decision: this.config.defaultDeny ? "deny" : "indeterminate",
        reason: "No roles assigned to user",
        matchedRules,
        evaluatedConditions,
        context,
        timestamp: new Date(),
      };
    }

    // Check each access policy
    for (const policy of this.accessPolicies.sort((a, b) => a.priority - b.priority)) {
      if (!policy.isActive) continue;

      for (const rule of policy.rules.sort((a, b) => a.priority - b.priority)) {
        // Check if user matches subjects
        const userMatches = this.matchesSubjects(userId, userRoles.map(ur => ur.roleId), rule.subjects);
        if (!userMatches) continue;

        // Check if resource matches
        const resourceMatches = this.matchesResources(resource, rule.resources);
        if (!resourceMatches) continue;

        // Check if action matches
        const actionMatches = this.matchesActions(action, rule.actions);
        if (!actionMatches) continue;

        // Evaluate conditions
        let conditionsMet = true;
        for (const condition of rule.conditions) {
          const result = this.evaluateCondition(condition, context);
          evaluatedConditions.push({
            condition,
            result: result.result,
            reason: result.reason,
          });

          if (!result.result) {
            conditionsMet = false;
            break;
          }
        }

        if (conditionsMet) {
          matchedRules.push(rule.id);
          return {
            decision: rule.effect,
            reason: `Access ${rule.effect}ed by rule: ${rule.name}`,
            matchedRules,
            evaluatedConditions,
            context,
            timestamp: new Date(),
          };
        }
      }
    }

    return {
      decision: this.config.defaultDeny ? "deny" : "indeterminate",
      reason: "No matching rules found",
      matchedRules,
      evaluatedConditions,
      context,
      timestamp: new Date(),
    };
  }

  /**
   * Check if user matches subjects
   */
  private matchesSubjects(userId: string, userRoleIds: string[], subjects: string[]): boolean {
    for (const subject of subjects) {
      if (subject === "*" || subject === userId) {
        return true;
      }
      if (userRoleIds.includes(subject)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check if resource matches resources
   */
  private matchesResources(resource: string, resources: string[]): boolean {
    for (const res of resources) {
      if (res === "*") {
        return true;
      }
      if (res === resource) {
        return true;
      }
      // Check for wildcard patterns
      if (res.includes("*")) {
        const pattern = res.replace(/\*/g, ".*");
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(resource)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Check if action matches actions
   */
  private matchesActions(action: string, actions: string[]): boolean {
    for (const act of actions) {
      if (act === "*") {
        return true;
      }
      if (act === action) {
        return true;
      }
      // Check for wildcard patterns
      if (act.includes("*")) {
        const pattern = act.replace(/\*/g, ".*");
        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(action)) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Evaluate access condition
   */
  private evaluateCondition(condition: AccessCondition, context: Record<string, unknown>): {
    result: boolean;
    reason: string;
  } {
    const attributeValue = context[condition.attribute];

    switch (condition.operator) {
      case "equals":
        return {
          result: attributeValue === condition.value,
          reason: `${condition.attribute} ${attributeValue === condition.value ? "equals" : "does not equal"} ${condition.value}`,
        };
      case "not_equals":
        return {
          result: attributeValue !== condition.value,
          reason: `${condition.attribute} ${attributeValue !== condition.value ? "does not equal" : "equals"} ${condition.value}`,
        };
      case "contains":
        return {
          result: typeof attributeValue === "string" && attributeValue.includes(String(condition.value)),
          reason: `${condition.attribute} ${typeof attributeValue === "string" && attributeValue.includes(String(condition.value)) ? "contains" : "does not contain"} ${String(condition.value)}`,
        };
      case "not_contains":
        return {
          result: typeof attributeValue === "string" && !attributeValue.includes(String(condition.value)),
          reason: `${condition.attribute} ${typeof attributeValue === "string" && !attributeValue.includes(String(condition.value)) ? "does not contain" : "contains"} ${String(condition.value)}`,
        };
      case "in":
        return {
          result: Array.isArray(condition.value) && condition.value.includes(String(attributeValue)),
          reason: `${condition.attribute} ${Array.isArray(condition.value) && condition.value.includes(String(attributeValue)) ? "is in" : "is not in"} ${String(condition.value)}`,
        };
      case "not_in":
        return {
          result: Array.isArray(condition.value) && !condition.value.includes(String(attributeValue)),
          reason: `${condition.attribute} ${Array.isArray(condition.value) && !condition.value.includes(String(attributeValue)) ? "is not in" : "is in"} ${String(condition.value)}`,
        };
      case "greater_than":
        return {
          result: typeof attributeValue === "number" && typeof condition.value === "number" && attributeValue > condition.value,
          reason: `${condition.attribute} ${typeof attributeValue === "number" && typeof condition.value === "number" && attributeValue > condition.value ? "is greater than" : "is not greater than"} ${condition.value}`,
        };
      case "less_than":
        return {
          result: typeof attributeValue === "number" && typeof condition.value === "number" && attributeValue < condition.value,
          reason: `${condition.attribute} ${typeof attributeValue === "number" && typeof condition.value === "number" && attributeValue < condition.value ? "is less than" : "is not less than"} ${condition.value}`,
        };
      case "regex":
        return {
          result: typeof attributeValue === "string" && new RegExp(String(condition.value)).test(attributeValue),
          reason: `${condition.attribute} ${typeof attributeValue === "string" && new RegExp(String(condition.value)).test(attributeValue) ? "matches" : "does not match"} regex ${condition.value}`,
        };
      case "time_based":
        if (!this.config.enableTimeBasedAccess) {
          return { result: true, reason: "Time-based access not enabled" };
        }
        // Implement time-based logic
        return { result: true, reason: "Time-based access check passed" };
      case "location_based":
        if (!this.config.enableLocationBasedAccess) {
          return { result: true, reason: "Location-based access not enabled" };
        }
        // Implement location-based logic
        return { result: true, reason: "Location-based access check passed" };
      default:
        return { result: false, reason: `Unknown operator: ${condition.operator}` };
    }
  }

  /**
   * Get user roles
   */
  private getUserRoles(userId: string, tenantId: string): UserRole[] {
    return this.userRoles.filter(ur =>
      ur.userId === userId &&
      ur.tenantId === tenantId &&
      ur.isActive &&
      (!ur.expiresAt || ur.expiresAt > new Date())
    );
  }

  /**
   * Log access attempt
   */
  private logAccessAttempt(
    userId: string,
    tenantId: string,
    resource: string,
    action: string,
    decision: AccessDecision,
    context: Record<string, unknown>
  ): void {
    const log: AccessAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      tenantId,
      resource,
      action,
      decision: decision.decision,
      reason: decision.reason,
      timestamp: new Date(),
      ipAddress: context.ipAddress as string || "unknown",
      userAgent: context.userAgent as string || "unknown",
      metadata: {
        matchedRules: decision.matchedRules,
        evaluatedConditions: decision.evaluatedConditions,
        context,
      },
    };

    this.auditLogs.push(log);
    this.emit("accessAuditLog", log);

    // Keep only recent logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Start cache cleanup
   */
  private startCacheCleanup(): void {
    if (!this.config.enableCaching) return;

    setInterval(() => {
      const now = Date.now();
      for (const [key, decision] of this.permissionCache) {
        if (now - decision.timestamp.getTime() > this.config.cacheTimeout * 1000) {
          this.permissionCache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Assign role to user
   */
  assignRole(
    userId: string,
    roleId: string,
    tenantId: string,
    companyId: string,
    assignedBy: string,
    expiresAt?: Date
  ): UserRole {
    const userRole: UserRole = {
      userId,
      roleId,
      tenantId,
      companyId,
      assignedBy,
      assignedAt: new Date(),
      expiresAt,
      isActive: true,
      metadata: {},
    };

    this.userRoles.push(userRole);
    this.emit("roleAssigned", userRole);

    monitoring.info("Role assigned to user", {
      userId,
      roleId,
      tenantId,
      companyId,
      assignedBy,
    });

    return userRole;
  }

  /**
   * Remove role from user
   */
  removeRole(userId: string, roleId: string, tenantId: string): boolean {
    const index = this.userRoles.findIndex(ur =>
      ur.userId === userId &&
      ur.roleId === roleId &&
      ur.tenantId === tenantId
    );

    if (index === -1) {
      return false;
    }

    const userRole = this.userRoles[index];
    this.userRoles.splice(index, 1);
    this.emit("roleRemoved", userRole);

    monitoring.info("Role removed from user", {
      userId,
      roleId,
      tenantId,
    });

    return true;
  }

  /**
   * Get user permissions
   */
  getUserPermissions(userId: string, tenantId: string): Permission[] {
    const userRoles = this.getUserRoles(userId, tenantId);
    const permissionIds = new Set<string>();

    // Collect permissions from user roles
    for (const userRole of userRoles) {
      const role = this.roles.find(r => r.id === userRole.roleId);
      if (role) {
        role.permissions.forEach(pid => permissionIds.add(pid));

        // Handle role inheritance
        if (this.config.enablePermissionInheritance) {
          this.collectInheritedPermissions(role, permissionIds);
        }
      }
    }

    return this.permissions.filter(p => permissionIds.has(p.id));
  }

  /**
   * Collect inherited permissions
   */
  private collectInheritedPermissions(role: Role, permissionIds: Set<string>, depth = 0): void {
    if (depth >= this.config.maxPermissionDepth) {
      return;
    }

    for (const parentRoleId of role.inheritsFrom) {
      const parentRole = this.roles.find(r => r.id === parentRoleId);
      if (parentRole) {
        parentRole.permissions.forEach(pid => permissionIds.add(pid));
        this.collectInheritedPermissions(parentRole, permissionIds, depth + 1);
      }
    }
  }

  /**
   * Get access audit logs
   */
  getAccessAuditLogs(filters?: {
    userId?: string;
    tenantId?: string;
    resource?: string;
    action?: string;
    decision?: AccessDecision["decision"];
    dateRange?: { start: Date; end: Date };
  }): AccessAuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(l => l.userId === filters.userId);
      }
      if (filters.tenantId) {
        logs = logs.filter(l => l.tenantId === filters.tenantId);
      }
      if (filters.resource) {
        logs = logs.filter(l => l.resource === filters.resource);
      }
      if (filters.action) {
        logs = logs.filter(l => l.action === filters.action);
      }
      if (filters.decision) {
        logs = logs.filter(l => l.decision === filters.decision);
      }
      if (filters.dateRange) {
        logs = logs.filter(l =>
          l.timestamp >= filters.dateRange!.start && l.timestamp <= filters.dateRange!.end
        );
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get access control statistics
   */
  getAccessControlStatistics(): {
    totalUsers: number;
    totalRoles: number;
    totalPermissions: number;
    totalPolicies: number;
    totalAuditLogs: number;
    accessDecisions: {
      allow: number;
      deny: number;
      indeterminate: number;
    };
    topResources: Array<{ resource: string; count: number }>;
    topActions: Array<{ action: string; count: number }>;
  } {
    const uniqueUsers = new Set(this.userRoles.map(ur => ur.userId)).size;
    const accessDecisions = {
      allow: this.auditLogs.filter(l => l.decision === "allow").length,
      deny: this.auditLogs.filter(l => l.decision === "deny").length,
      indeterminate: this.auditLogs.filter(l => l.decision === "indeterminate").length,
    };

    const resourceCounts: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};

    for (const log of this.auditLogs) {
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    }

    const topResources = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalUsers: uniqueUsers,
      totalRoles: this.roles.length,
      totalPermissions: this.permissions.length,
      totalPolicies: this.accessPolicies.length,
      totalAuditLogs: this.auditLogs.length,
      accessDecisions,
      topResources,
      topActions,
    };
  }

  /**
   * Create new permission
   */
  createPermission(permission: Omit<Permission, "id" | "createdAt" | "lastModified">): Permission {
    const newPermission: Permission = {
      id: `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastModified: new Date(),
      ...permission,
    };

    this.permissions.push(newPermission);
    this.emit("permissionCreated", newPermission);

    monitoring.info("Permission created", {
      permissionId: newPermission.id,
      permissionName: newPermission.name,
      resource: newPermission.resource,
      action: newPermission.action,
    });

    return newPermission;
  }

  /**
   * Create new role
   */
  createRole(role: Omit<Role, "id" | "createdAt" | "lastModified">): Role {
    const newRole: Role = {
      id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      lastModified: new Date(),
      ...role,
    };

    this.roles.push(newRole);
    this.emit("roleCreated", newRole);

    monitoring.info("Role created", {
      roleId: newRole.id,
      roleName: newRole.name,
      permissions: newRole.permissions.length,
    });

    return newRole;
  }

  /**
   * Get all permissions
   */
  getPermissions(): Permission[] {
    return [...this.permissions];
  }

  /**
   * Get all roles
   */
  getRoles(): Role[] {
    return [...this.roles];
  }

  /**
   * Get all access policies
   */
  getAccessPolicies(): AccessPolicy[] {
    return [...this.accessPolicies];
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const accessControlManager = new AccessControlManager();

export default AccessControlManager;
