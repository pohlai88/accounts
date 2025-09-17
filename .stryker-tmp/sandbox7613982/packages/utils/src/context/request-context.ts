// @ts-nocheck
// Request Context Utilities - V1 Compliance
import { NextRequest } from "next/server.js";
import type { V1AuditAuditContext } from "../types.js";

export interface RequestContext {
  requestId: string;
  timestamp: Date;
  method: string;
  url: string;
  headers: Record<string, string>;
  userAgent?: string;
  ipAddress?: string;
}

export interface UserContext {
  userId?: string;
  tenantId?: string;
  companyId?: string;
  userRole?: string;
  permissions?: string[];
  sessionId?: string;
  // Enhanced context for admin configuration
  roles?: string[];
  memberPermissions?: {
    roles?: string[];
    allow?: string[];
    deny?: string[];
    overrides?: Record<string, unknown>;
  };
  featureFlags?: Record<string, boolean>;
  policySettings?: Record<string, unknown>;
}

/**
 * Create request context from NextRequest
 */
export function createRequestContext(request: NextRequest): RequestContext {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    requestId: generateRequestId(),
    timestamp: new Date(),
    method: request.method,
    url: request.url,
    headers,
    userAgent: request.headers.get("user-agent") || undefined,
    ipAddress: extractIpAddress(request),
  };
}

/**
 * Extract user context from request headers/JWT
 */
export function extractUserContext(request: NextRequest): UserContext {
  // In a real implementation, this would decode JWT token
  // For now, we'll extract from headers for testing

  const tenantId = request.headers.get("x-tenant-id");
  const companyId = request.headers.get("x-company-id");
  const userId = request.headers.get("x-user-id");
  const role = request.headers.get("x-user-role");
  const sessionId = request.headers.get("x-session-id");

  // TODO: Implement proper JWT token decoding
  // const token = authHeader?.replace('Bearer ', '');
  // const decoded = jwt.verify(token, process.env.JWT_SECRET);

  return {
    userId: userId || undefined,
    tenantId: tenantId || undefined,
    companyId: companyId || undefined,
    userRole: role || "user",
    permissions: [], // TODO: Extract from JWT
    sessionId: sessionId || undefined,
  };
}

/**
 * Create audit context from request
 */
export function createAuditContext(request: NextRequest): V1AuditAuditContext {
  const userContext = extractUserContext(request);

  return {
    userId: userContext.userId,
    tenantId: userContext.tenantId,
    companyId: userContext.companyId,
    sessionId: userContext.sessionId,
    ipAddress: extractIpAddress(request),
    userAgent: request.headers.get("user-agent") || undefined,
    timestamp: new Date(),
  };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract IP address from request
 */
function extractIpAddress(request: NextRequest): string | undefined {
  // Check various headers for IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim();
  }

  if (realIp) {
    return realIp;
  }

  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback - in development this might be undefined
  return undefined;
}

/**
 * Validate required context fields
 */
export function validateContext(
  context: UserContext,
  requiredFields: (keyof UserContext)[],
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (!context[field]) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Sanitize context for logging (remove sensitive data)
 */
export function sanitizeContext(context: unknown): unknown {
  const sanitized = { ...(context as Record<string, unknown>) };

  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.token;
  delete sanitized.apiKey;
  delete sanitized.secret;

  // Truncate long strings
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === "string" && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + "...";
    }
  });

  return sanitized;
}
