// SSOT: Public types for @aibos/security
// This file re-exports all public types for downstream consumers

// Core Security Types
export type SecurityContext = {
  userId: string;
  email: string;
  tenantId: string;
  companyId: string | null;
  tenantName: string | null;
  companyName: string | null;
  scopes: string[];
  requestId: string;
  availableTenants?: Array<{
    tenantId: string;
    role: string;
    permissions: Record<string, boolean>;
  }>;
};

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

// Audit & Compliance Types
export interface AuditLogEvent {
  id: string;
  timestamp: number;
  tenantId: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, string | number | boolean | string[] | number[]>;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  severity: "low" | "medium" | "high" | "critical";
  category:
  | "authentication"
  | "authorization"
  | "data_access"
  | "data_modification"
  | "system"
  | "security"
  | "compliance";
  outcome: "success" | "failure" | "partial";
  riskScore: number; // 0-100
  complianceFlags: string[];
  metadata: Record<string, string | number | boolean | string[] | number[]>;
}

export interface AuditConfig {
  enableRealTime: boolean;
  enableBatchProcessing: boolean;
  batchSize: number;
  batchInterval: number; // milliseconds
  retentionPeriod: number; // days
  enableEncryption: boolean;
  enableCompression: boolean;
  maxEventSize: number; // bytes
  enableRiskScoring: boolean;
  enableComplianceMonitoring: boolean;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  conditions: ComplianceCondition[];
  actions: ComplianceAction[];
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ComplianceCondition {
  field: string;
  operator:
  | "equals"
  | "not_equals"
  | "contains"
  | "not_contains"
  | "greater_than"
  | "less_than"
  | "in"
  | "not_in";
  value: string | number | boolean | string[] | number[] | boolean[];
  caseSensitive?: boolean;
}

export interface ComplianceAction {
  type: "alert" | "block" | "log" | "notify" | "escalate";
  target: string;
  parameters: Record<string, string | number | boolean | string[]>;
}

// Result Types
export type Ok<T> = { ok: true; value: T };
export type Err<E = Error> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

// Advanced Security Types
export interface SecurityConfig {
  enableRateLimiting: boolean;
  enableCSRFProtection: boolean;
  enableXSSProtection: boolean;
  enableContentSecurityPolicy: boolean;
  enableHSTS: boolean;
  enableCORS: boolean;
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  maxRequestsPerDay: number;
  trustedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  securityHeaders: Record<string, string>;
}

export interface SecurityEvent {
  type: "rate_limit" | "csrf_attack" | "xss_attempt" | "suspicious_activity" | "security_violation";
  severity: "low" | "medium" | "high" | "critical";
  ip: string;
  userAgent: string;
  tenantId?: string;
  userId?: string;
  details: Record<string, string | number | boolean | string[] | number[]>;
  timestamp: number;
  requestId: string;
}

export interface RateLimitInfo {
  ip: string;
  requests: number;
  windowStart: number;
  blocked: boolean;
  resetTime: number;
}

// Encryption Types
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
