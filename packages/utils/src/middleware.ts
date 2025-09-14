// V1 Request Context Middleware for Axiom Logging
import { NextRequest, NextResponse } from "next/server";
import { makeLogger, withCtx } from "./logger";

// V1 Required Labels: {env, tenant_id, company_id, request_id, user_id?, region}
export interface RequestContext {
  request_id: string;
  tenant_id?: string;
  company_id?: string;
  user_id?: string;
  user_role?: string;
  path: string;
  method: string;
  user_agent?: string;
  ip?: string;
}

export function createRequestContext(request: NextRequest): RequestContext {
  const request_id = crypto.randomUUID();

  // Extract tenant/company from headers or JWT
  const tenant_id = request.headers.get("x-tenant-id") || extractFromJWT(request, "tenant_id");
  const company_id = request.headers.get("x-company-id") || extractFromJWT(request, "company_id");
  const user_id = request.headers.get("x-user-id") || extractFromJWT(request, "sub");
  const user_role = extractFromJWT(request, "role");

  return {
    request_id,
    tenant_id: tenant_id || undefined,
    company_id: company_id || undefined,
    user_id: user_id || undefined,
    user_role: user_role || undefined,
    path: request.nextUrl.pathname,
    method: request.method,
    user_agent: request.headers.get("user-agent") || undefined,
    ip: getClientIP(request),
  };
}

export function withRequestLogging(
  handler: (request: NextRequest, context: RequestContext) => Promise<NextResponse>,
) {
  return async (request: NextRequest) => {
    const context = createRequestContext(request);
    const logger = withCtx(makeLogger("api"), {
      tenant_id: context.tenant_id,
      company_id: context.company_id,
      request_id: context.request_id,
      user_id: context.user_id,
    });

    const startTime = Date.now();

    // Log request start
    logger.info("Request started", {
      method: context.method,
      path: context.path,
      user_agent: context.user_agent,
      ip: context.ip,
      user_role: context.user_role,
    });

    try {
      const response = await handler(request, context);
      const duration = Date.now() - startTime;

      // Log successful response
      logger.info("Request completed", {
        method: context.method,
        path: context.path,
        status: response.status,
        duration_ms: duration,
        response_size: response.headers.get("content-length"),
      });

      // Add request ID to response headers
      response.headers.set("x-request-id", context.request_id);

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log error
      logger.error("Request failed", {
        method: context.method,
        path: context.path,
        duration_ms: duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  };
}

// V1 Performance Monitoring
export function logPerformanceMetrics(
  context: RequestContext,
  metrics: {
    db_query_time?: number;
    db_query_count?: number;
    cache_hits?: number;
    cache_misses?: number;
    external_api_calls?: number;
    memory_usage?: number;
  },
) {
  const logger = withCtx(makeLogger("api"), {
    tenant_id: context.tenant_id,
    company_id: context.company_id,
    request_id: context.request_id,
    user_id: context.user_id,
  });

  logger.info("Performance metrics", {
    path: context.path,
    method: context.method,
    ...metrics,
  });
}

// V1 Business Event Logging (renamed to avoid conflict)
export function logBusinessEventToLogger(
  context: RequestContext,
  event: {
    type:
      | "journal_posted"
      | "invoice_created"
      | "payment_processed"
      | "user_login"
      | "period_closed";
    entity_type: string;
    entity_id: string;
    amount?: string;
    currency?: string;
    details?: Record<string, unknown>;
  },
) {
  const logger = withCtx(makeLogger("api"), {
    tenant_id: context.tenant_id,
    company_id: context.company_id,
    request_id: context.request_id,
    user_id: context.user_id,
  });

  logger.info("Business event", {
    event_type: event.type,
    entity_type: event.entity_type,
    entity_id: event.entity_id,
    amount: event.amount,
    currency: event.currency,
    details: event.details,
    timestamp: new Date().toISOString(),
  });
}

// Helper functions
function extractFromJWT(request: NextRequest, claim: string): string | null {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return null;

    const token = authHeader.substring(7);
    const tokenPart = token.split(".")[1];
    if (!tokenPart) return null;
    const payload = JSON.parse(atob(tokenPart));
    return payload[claim] || null;
  } catch {
    return null;
  }
}

function getClientIP(request: NextRequest): string | undefined {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim();
  }

  if (realIP) {
    return realIP;
  }

  return request.ip;
}

/**
 * Extract user context for database operations (Scope interface)
 */
export function extractUserContext(request: NextRequest): {
  tenantId: string;
  companyId: string;
  userId: string;
  userRole: string;
} {
  const context = createRequestContext(request);

  if (!context.tenant_id) {
    throw new Error("Missing tenant_id in request context");
  }

  if (!context.company_id) {
    throw new Error("Missing company_id in request context");
  }

  if (!context.user_id) {
    throw new Error("Missing user_id in request context");
  }

  return {
    tenantId: context.tenant_id,
    companyId: context.company_id,
    userId: context.user_id,
    userRole: context.user_role || "user",
  };
}
