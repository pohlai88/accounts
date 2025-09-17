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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const tenantId = params.id;

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
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

        // Get tenant details
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select(`
        id,
        name,
        slug,
        feature_flags,
        created_at,
        updated_at
      `)
            .eq("id", tenantId)
            .single();

        if (tenantError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch tenant details",
                requestId: ctx.requestId,
            });
        }

        // Get tenant statistics
        const [
            { count: memberCount },
            { count: companyCount },
        ] = await Promise.all([
            supabase.from("memberships").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
            supabase.from("companies").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        ]);

        return ok(
            {
                id: tenant.id,
                name: tenant.name,
                slug: tenant.slug,
                featureFlags: tenant.feature_flags,
                createdAt: tenant.created_at,
                updatedAt: tenant.updated_at,
                userRole: membership.role,
                statistics: {
                    memberCount: memberCount || 0,
                    companyCount: companyCount || 0,
                },
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get tenant error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const tenantId = params.id;
        const body = await req.json();
        const updateData = UpdateTenantSchema.parse(body);

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
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

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can update tenant settings",
                requestId: ctx.requestId,
            });
        }

        // Update tenant
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq("id", tenantId)
            .select()
            .single();

        if (tenantError) {
            return problem({
                status: 500,
                title: "Failed to update tenant",
                code: "TENANT_UPDATE_FAILED",
                detail: tenantError.message,
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
        );
    } catch (error) {
        console.error("Update tenant error:", error);

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const tenantId = params.id;

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
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

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can delete tenants",
                requestId: ctx.requestId,
            });
        }

        // Check if tenant has any companies or data
        const [
            { count: companyCount },
            { count: journalCount },
            { count: invoiceCount },
        ] = await Promise.all([
            supabase.from("companies").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
            supabase.from("gl_journal").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
            supabase.from("ar_invoices").select("*", { count: "exact", head: true }).eq("tenant_id", tenantId),
        ]);

        if ((companyCount || 0) > 0 || (journalCount || 0) > 0 || (invoiceCount || 0) > 0) {
            return problem({
                status: 409,
                title: "Cannot delete tenant with data",
                code: "TENANT_HAS_DATA",
                detail: "Tenant contains companies or financial data and cannot be deleted",
                requestId: ctx.requestId,
            });
        }

        // Delete tenant (cascade will handle memberships)
        const { error: deleteError } = await supabase
            .from("tenants")
            .delete()
            .eq("id", tenantId);

        if (deleteError) {
            return problem({
                status: 500,
                title: "Failed to delete tenant",
                code: "TENANT_DELETE_FAILED",
                detail: deleteError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                message: "Tenant deleted successfully",
                tenantId,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Delete tenant error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
