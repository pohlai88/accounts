import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Tenant creation schema
const CreateTenantSchema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
    featureFlags: z.object({
        attachments: z.boolean().default(true),
        reports: z.boolean().default(true),
        ar: z.boolean().default(true),
        ap: z.boolean().default(false),
        je: z.boolean().default(false),
        regulated_mode: z.boolean().default(false),
    }).optional(),
});

// Tenant update schema
const UpdateTenantSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    featureFlags: z.object({
        attachments: z.boolean().optional(),
        reports: z.boolean().optional(),
        ar: z.boolean().optional(),
        ap: z.boolean().optional(),
        je: z.boolean().optional(),
        regulated_mode: z.boolean().optional(),
    }).optional(),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");

        // Get all tenants the user has access to
        const { data: memberships, error: membershipsError } = await supabase
            .from("memberships")
            .select(`
        tenant_id,
        role,
        tenants!inner(
          id,
          name,
          slug,
          feature_flags,
          created_at,
          updated_at
        )
      `)
            .eq("user_id", ctx.userId)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (membershipsError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch tenants",
                requestId: ctx.requestId,
            });
        }

        const tenants = memberships?.map((m: any) => ({
            id: m.tenants.id,
            name: m.tenants.name,
            slug: m.tenants.slug,
            featureFlags: m.tenants.feature_flags,
            role: m.role,
            createdAt: m.tenants.created_at,
            updatedAt: m.tenants.updated_at,
        })) || [];

        return ok(
            {
                tenants,
                total: tenants.length,
                limit,
                offset,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get tenants error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}

export async function POST(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const body = await req.json();
        const { name, slug, featureFlags } = CreateTenantSchema.parse(body);

        // Check if slug is already taken
        const { data: existingTenant, error: checkError } = await supabase
            .from("tenants")
            .select("id")
            .eq("slug", slug)
            .single();

        if (checkError && checkError.code !== "PGRST116") {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to check tenant slug availability",
                requestId: ctx.requestId,
            });
        }

        if (existingTenant) {
            return problem({
                status: 409,
                title: "Tenant slug already exists",
                code: "TENANT_SLUG_EXISTS",
                detail: "A tenant with this slug already exists",
                requestId: ctx.requestId,
            });
        }

        // Create tenant
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .insert({
                name,
                slug,
                feature_flags: featureFlags || {
                    attachments: true,
                    reports: true,
                    ar: true,
                    ap: false,
                    je: false,
                    regulated_mode: false,
                },
            })
            .select()
            .single();

        if (tenantError) {
            return problem({
                status: 500,
                title: "Failed to create tenant",
                code: "TENANT_CREATION_FAILED",
                detail: tenantError.message,
                requestId: ctx.requestId,
            });
        }

        // Create admin membership for the creator
        const { error: membershipError } = await supabase
            .from("memberships")
            .insert({
                user_id: ctx.userId,
                tenant_id: tenant.id,
                role: "admin",
                permissions: {
                    can_manage_users: true,
                    can_manage_settings: true,
                    can_view_reports: true,
                    can_manage_companies: true,
                },
            });

        if (membershipError) {
            // Rollback tenant creation
            await supabase.from("tenants").delete().eq("id", tenant.id);

            return problem({
                status: 500,
                title: "Failed to create membership",
                code: "MEMBERSHIP_CREATION_FAILED",
                detail: membershipError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                featureFlags: tenant.feature_flags,
                createdAt: tenant.created_at,
                updatedAt: tenant.updated_at,
            },
            ctx.requestId,
            201,
        );
    } catch (error) {
        console.error("Create tenant error:", error);

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
