// @ts-nocheck
// ...existing code...
// V1 Authentication Types
import type { UserId, TenantId, CompanyId } from "@aibos/contracts";

export interface AuthUser {
  id: UserId;
  email: string;
  tenant_id: TenantId;
  company_id: CompanyId;
  role: string;
  permissions?: Record<string, boolean>;
}

export interface JWTClaims {
  sub: UserId; // user_id
  email: string;
  tenant_id: TenantId;
  company_id: CompanyId;
  role: string;
  iat: number;
  exp: number;
}

export type UserRole = "admin" | "manager" | "accountant" | "clerk" | "viewer" | "system";

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  tenantId: TenantId | null;
  companyId: CompanyId | null;
  role: UserRole | null;
}


// --- SSOT: Inlined public types from sod.ts for downstream consumers ---
// Source: ./sod.ts

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

export interface SoDRule {
  action: string;
  requiredRole: string[];
  conflictingRoles?: string[];
  requiresApproval?: boolean;
  approverRoles?: string[];
  amountThreshold?: number;
  requiresFeature?: string;
  module?: string;
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
