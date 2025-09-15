import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";
import { withCache } from "@aibos/web-api/middleware/cache-middleware";
import { withPerformance } from "@aibos/web-api/middleware/performance-middleware";
import { createCacheMiddleware } from "@aibos/web-api/middleware/cache-middleware";
import { createPerformanceMiddleware } from "@aibos/web-api/middleware/performance-middleware";
import { CacheFactory } from "@aibos/cache";

// Switch active tenant request schema
const SwitchTenantSchema = z.object({
  tenantId: z.string().uuid(),
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    let ctx;
    try {
      ctx = await getSecurityContext(req);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 401) {
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

    // Parse request body
    const body = await req.json();
    const { tenantId } = SwitchTenantSchema.parse(body);

    // Verify user has membership in the target tenant
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("tenant_id, role, permissions, company_id")
      .eq("user_id", ctx.userId)
      .eq("tenant_id", tenantId)
      .single();

    if (membershipError || !membership) {
      return problem({
        status: 403,
        title: "Access denied",
        code: "TENANT_ACCESS_DENIED",
        detail: "You do not have access to this tenant",
        requestId: ctx.requestId,
      });
    }

    // Get tenant and company information
    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, name, slug")
      .eq("id", tenantId)
      .single();

    if (tenantError || !tenant) {
      return problem({
        status: 404,
        title: "Tenant not found",
        code: "TENANT_NOT_FOUND",
        detail: "The specified tenant does not exist",
        requestId: ctx.requestId,
      });
    }

    let company = null;
    if (membership.company_id) {
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("id, name, code")
        .eq("id", membership.company_id)
        .single();

      if (!companyError && companyData) {
        company = companyData;
      }
    }

    // Update user's active tenant
    const { error: updateError } = await supabase.from("user_settings").upsert(
      {
        user_id: ctx.userId,
        active_tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      },
    );

    if (updateError) {
      return problem({
        status: 500,
        title: "Failed to switch tenant",
        code: "TENANT_SWITCH_FAILED",
        detail: "Unable to update active tenant",
        requestId: ctx.requestId,
      });
    }

    return ok(
      {
        message: "Active tenant updated successfully",
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
        },
        company: company
          ? {
            id: company.id,
            name: company.name,
            code: company.code,
          }
          : null,
        membership: {
          role: membership.role,
          permissions: membership.permissions,
        },
        status: "switched",
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Switch tenant error:", error);

    if (error instanceof z.ZodError) {
      return problem({
        status: 400,
        title: "Invalid request data",
        code: "VALIDATION_ERROR",
        detail: "Please check your request format",
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    let ctx;
    try {
      ctx = await getSecurityContext(req);
    } catch (error: unknown) {
      if (error && typeof error === "object" && "status" in error && error.status === 401) {
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

    if (settingsError && settingsError.code !== "PGRST116") {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to fetch user settings",
        requestId: ctx.requestId,
      });
    }

    // Get all user's memberships
    const { data: memberships, error: membershipsError } = await supabase
      .from("memberships")
      .select(
        `
        tenant_id,
        role,
        permissions,
        company_id,
        tenants!inner(id, name, slug),
        companies(id, name, code)
      `,
      )
      .eq("user_id", ctx.userId);

    if (membershipsError) {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to fetch memberships",
        requestId: ctx.requestId,
      });
    }

    const activeTenantId = userSettings?.active_tenant_id;
    const availableTenants =
      memberships?.map((m: any) => ({
        id: m.tenant_id,
        name: m.tenants?.[0]?.name || "Unknown Tenant",
        slug: m.tenants?.[0]?.slug || "",
        role: m.role,
        permissions: m.permissions,
        company: m.companies?.[0]
          ? {
            id: m.companies[0].id,
            name: m.companies[0].name,
            code: m.companies[0].code,
          }
          : null,
        isActive: m.tenant_id === activeTenantId,
      })) || [];

    return ok(
      {
        activeTenantId,
        availableTenants,
        totalTenants: availableTenants.length,
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Get active tenant error:", error);

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
