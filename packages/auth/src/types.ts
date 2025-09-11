// V1 Authentication Types
export interface AuthUser {
  id: string;
  email: string;
  tenant_id: string;
  company_id: string;
  role: string;
  permissions?: Record<string, boolean>;
}

export interface JWTClaims {
  sub: string; // user_id
  email: string;
  tenant_id: string;
  company_id: string;
  role: string;
  iat: number;
  exp: number;
}

export type UserRole = 
  | 'admin'
  | 'manager' 
  | 'accountant'
  | 'clerk'
  | 'viewer'
  | 'system';

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  tenantId: string | null;
  companyId: string | null;
  role: UserRole | null;
}
