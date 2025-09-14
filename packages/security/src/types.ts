export interface SecurityContext {
  userId: string;
  tenantId: string;
  scopes: string[];
  requestId: string;
  traceId?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface JWTClaims {
  sub: string;
  email: string;
  name: string;
  role: string;
  tenantId: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}
