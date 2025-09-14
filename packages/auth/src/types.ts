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
