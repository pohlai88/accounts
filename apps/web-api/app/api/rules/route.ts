import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";
import { AdvancedCacheManager } from "@aibos/cache";
import { getErrorMessage } from "@aibos/utils";
// import { webSocketServer } from '@aibos/web-api/lib/websocket-server';
// import { withSecurity, withRateLimit } from '@aibos/web-api/middleware/security-middleware';
import { monitoring } from '@aibos/web-api/lib/monitoring-integration';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Initialize cache manager
let cacheManager: AdvancedCacheManager | null = null;

function getCacheManager(): AdvancedCacheManager {
  if (!cacheManager) {
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    // Use the compatibility layer AdvancedCacheManager (no constructor args)
    cacheManager = new AdvancedCacheManager();
  }
  return cacheManager;
}

async function getRulesHandler(req: NextRequest) {
  const startTime = Date.now();
  let ctx;

  try {
    // Initialize monitoring if not already done
    // if (!monitoring['isInitialized']) {
    //     await monitoring.initialize();
    // }

    try {
      ctx = await getSecurityContext(req);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 401) {
        // monitoring.recordAPIRequest('/api/rules', 'GET', 401, Date.now() - startTime, 'unknown');
        return problem({
          status: 401,
          title: "Unauthorized",
          code: "UNAUTHORIZED",
          detail: "Invalid or missing authentication token",
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      }
      throw error;
    }

    // Get user's current active tenant
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("active_tenant_id")
      .eq("user_id", ctx.userId)
      .single();

    if (settingsError || !userSettings) {
      return problem({
        status: 404,
        title: "No active tenant",
        code: "NO_ACTIVE_TENANT",
        detail: "User has no active tenant set",
        requestId: ctx.requestId,
      });
    }

    const tenantId = userSettings.active_tenant_id;
    const cache = getCacheManager();

    // Try to get rules from cache first
    try {
      const cachedRules = await cache.get(`${tenantId}:rules_list`) as any[];
      if (cachedRules && Array.isArray(cachedRules)) {
        console.log(`Cache hit for rules in tenant ${tenantId}`);
        return ok(
          {
            rules: cachedRules,
            activeTenantId: tenantId,
            totalRules: cachedRules.length,
            cached: true,
          },
          ctx.requestId,
        );
      }
    } catch (cacheError) {
      console.warn("Cache read error:", cacheError);
    }

    // Cache miss - fetch from database
    console.log(`Cache miss for rules in tenant ${tenantId}`);

    // Return mock rules data with tenant context (in production, this would be a real DB query)
    const rules = [
      {
        id: "rule-1",
        name: "Sample Rule 1",
        tenantId: tenantId,
        description: "This is a sample rule for testing tenant context",
      },
      {
        id: "rule-2",
        name: "Sample Rule 2",
        tenantId: tenantId,
        description: "Another sample rule for testing",
      },
    ];

    // Cache the result
    try {
      await cache.set(`${tenantId}:rules_list`, rules, 300); // 5 minutes TTL
      console.log(`Cached rules for tenant ${tenantId}`);
    } catch (cacheError) {
      console.warn("Cache write error:", cacheError);
    }

    // Record successful API request
    // monitoring.recordAPIRequest('/api/rules', 'GET', 200, Date.now() - startTime, tenantId, ctx.userId);

    return ok(
      {
        rules: rules,
        activeTenantId: tenantId,
        totalRules: rules.length,
        cached: false,
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Rules API error:", error);

    // Record error
    // monitoring.recordAPIRequest('/api/rules', 'GET', 500, Date.now() - startTime, 'unknown', ctx?.userId);
    // monitoring.error('Rules API error', { error: error.message, stack: error.stack });

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

async function postRulesHandler(req: NextRequest) {
  const startTime = Date.now();
  let ctx;

  try {
    // Initialize monitoring if not already done
    if (!monitoring["isInitialized"]) {
      await monitoring.initialize();
    }

    try {
      ctx = await getSecurityContext(req);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 401) {
        monitoring.recordAPIMetric(
          "/api/rules",
          "GET",
          Date.now() - startTime,
          401,
          0,
          { tenantId: ctx?.tenantId || "unknown" }
        );
        return problem({
          status: 401,
          title: "Unauthorized",
          code: "UNAUTHORIZED",
          detail: "Invalid or missing authentication token",
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
      }
      throw error;
    }

    // Get user's current active tenant
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_settings")
      .select("active_tenant_id")
      .eq("user_id", ctx.userId)
      .single();

    if (settingsError || !userSettings) {
      return problem({
        status: 404,
        title: "No active tenant",
        code: "NO_ACTIVE_TENANT",
        detail: "User has no active tenant set",
        requestId: ctx.requestId,
      });
    }

    const tenantId = userSettings.active_tenant_id;
    const cache = getCacheManager();

    // Parse request body
    const body = await req.json();
    const { name, description } = body;

    if (!name) {
      return problem({
        status: 400,
        title: "Validation error",
        code: "VALIDATION_ERROR",
        detail: "Rule name is required",
        requestId: ctx.requestId,
      });
    }

    // Create new rule (mock implementation)
    const newRule = {
      id: `rule-${Date.now()}`,
      name,
      description: description || "",
      tenantId,
      createdAt: new Date().toISOString(),
    };

    // Invalidate cache for this tenant
    try {
      await cache.invalidatePattern(`${tenantId}:rules_*`);
      console.log(`Cache invalidated for tenant ${tenantId}`);
    } catch (cacheError) {
      console.warn("Cache invalidation error:", cacheError);
    }

    // Trigger real-time event
    // try {
    //     webSocketServer.triggerRuleCreated(tenantId, newRule);
    //     console.log(`Real-time event triggered for rule creation in tenant ${tenantId}`);
    // } catch (eventError) {
    //     console.warn('Real-time event error:', eventError);
    // }

    // Record successful API request
    // monitoring.recordAPIRequest('/api/rules', 'POST', 201, Date.now() - startTime, tenantId, ctx.userId);
    // monitoring.recordBusinessMetric('rules_created', 1, 'count', tenantId, { user: ctx.userId });

    return ok(
      {
        rule: newRule,
        message: "Rule created successfully",
      },
      ctx.requestId,
      201,
    );
  } catch (error) {
    // Error will be handled by standardized error response below

    // Record error
    monitoring.recordAPIMetric(
      "/api/rules",
      "POST",
      Date.now() - startTime,
      500,
      0,
      { tenantId: ctx?.tenantId || "unknown" }
    );
    monitoring.error("Rules POST API error", error instanceof Error ? error : new Error(getErrorMessage(error)), { stack: error instanceof Error ? error.stack : undefined });

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

// Export handlers (simplified for now)
export const GET = getRulesHandler;
export const POST = postRulesHandler;
