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

// User update schema
const UpdateUserSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
});

// Role update schema
const UpdateRoleSchema = z.object({
    role: z.enum(["admin", "manager", "accountant", "clerk", "viewer", "user"]),
    tenantId: z.string().uuid(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const userId = params.id;

        // Get user details
        const { data: user, error: userError } = await supabase
            .from("users")
            .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        updated_at
      `)
            .eq("id", userId)
            .single();

        if (userError) {
            if (userError.code === "PGRST116") {
                return problem({
                    status: 404,
                    title: "User not found",
                    code: "USER_NOT_FOUND",
                    detail: "The requested user does not exist",
                    requestId: ctx.requestId,
                });
            }

            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch user details",
                requestId: ctx.requestId,
            });
        }

        // Get user's tenant memberships
        const { data: memberships, error: membershipsError } = await supabase
            .from("memberships")
            .select(`
        id,
        role,
        permissions,
        created_at,
        tenants!inner(
          id,
          name,
          slug
        )
      `)
            .eq("user_id", userId);

        if (membershipsError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch user memberships",
                requestId: ctx.requestId,
            });
        }

        const tenantMemberships = memberships?.map((m: any) => ({
            id: m.id,
            tenantId: m.tenants.id,
            tenantName: m.tenants.name,
            tenantSlug: m.tenants.slug,
            role: m.role,
            permissions: m.permissions,
            joinedAt: m.created_at,
        })) || [];

        return ok(
            {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                createdAt: user.created_at,
                updatedAt: user.updated_at,
                tenantMemberships,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get user error:", error);

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
        const userId = params.id;
        const body = await req.json();

        // Check if this is a role update or profile update
        if (body.role && body.tenantId) {
            // Role update
            const { role, tenantId } = UpdateRoleSchema.parse(body);

            // Verify user has admin/manager access to this tenant
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

            if (!["admin", "manager"].includes(membership.role)) {
                return problem({
                    status: 403,
                    title: "Insufficient permissions",
                    code: "INSUFFICIENT_PERMISSIONS",
                    detail: "Only admins and managers can update user roles",
                    requestId: ctx.requestId,
                });
            }

            // Update membership role
            const { data: updatedMembership, error: updateError } = await supabase
                .from("memberships")
                .update({
                    role: role,
                    permissions: {
                        can_manage_users: role === "admin",
                        can_manage_settings: role === "admin",
                        can_view_reports: ["admin", "manager", "accountant"].includes(role),
                        can_manage_companies: ["admin", "manager"].includes(role),
                    },
                })
                .eq("user_id", userId)
                .eq("tenant_id", tenantId)
                .select()
                .single();

            if (updateError) {
                return problem({
                    status: 500,
                    title: "Failed to update user role",
                    code: "ROLE_UPDATE_FAILED",
                    detail: updateError.message,
                    requestId: ctx.requestId,
                });
            }

            return ok(
                {
                    message: "User role updated successfully",
                    userId,
                    tenantId,
                    role: updatedMembership.role,
                    permissions: updatedMembership.permissions,
                },
                ctx.requestId,
            );
        } else {
            // Profile update
            const updateData = UpdateUserSchema.parse(body);

            // Users can only update their own profile unless they're admin
            if (userId !== ctx.userId) {
                // Check if user is admin in any tenant
                const { data: adminMemberships } = await supabase
                    .from("memberships")
                    .select("role")
                    .eq("user_id", ctx.userId)
                    .eq("role", "admin");

                if (!adminMemberships || adminMemberships.length === 0) {
                    return problem({
                        status: 403,
                        title: "Access denied",
                        code: "ACCESS_DENIED",
                        detail: "You can only update your own profile",
                        requestId: ctx.requestId,
                    });
                }
            }

            // Update user profile
            const { data: user, error: userError } = await supabase
                .from("users")
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", userId)
                .select()
                .single();

            if (userError) {
                return problem({
                    status: 500,
                    title: "Failed to update user",
                    code: "USER_UPDATE_FAILED",
                    detail: userError.message,
                    requestId: ctx.requestId,
                });
            }

            return ok(
                {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    createdAt: user.created_at,
                    updatedAt: user.updated_at,
                },
                ctx.requestId,
            );
        }
    } catch (error) {
        console.error("Update user error:", error);

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
        const userId = params.id;

        // Users can only delete their own account unless they're admin
        if (userId !== ctx.userId) {
            // Check if user is admin in any tenant
            const { data: adminMemberships } = await supabase
                .from("memberships")
                .select("role")
                .eq("user_id", ctx.userId)
                .eq("role", "admin");

            if (!adminMemberships || adminMemberships.length === 0) {
                return problem({
                    status: 403,
                    title: "Access denied",
                    code: "ACCESS_DENIED",
                    detail: "You can only delete your own account",
                    requestId: ctx.requestId,
                });
            }
        }

        // Check if user has any financial data
        const [
            { count: journalCount },
            { count: invoiceCount },
            { count: billCount },
        ] = await Promise.all([
            supabase.from("gl_journal").select("*", { count: "exact", head: true }).eq("created_by", userId),
            supabase.from("ar_invoices").select("*", { count: "exact", head: true }).eq("created_by", userId),
            supabase.from("ap_bills").select("*", { count: "exact", head: true }).eq("created_by", userId),
        ]);

        if ((journalCount || 0) > 0 || (invoiceCount || 0) > 0 || (billCount || 0) > 0) {
            return problem({
                status: 409,
                title: "Cannot delete user with data",
                code: "USER_HAS_DATA",
                detail: "User has created financial data and cannot be deleted",
                requestId: ctx.requestId,
            });
        }

        // Delete user from Supabase Auth
        const { error: authError } = await supabase.auth.admin.deleteUser(userId);

        if (authError) {
            return problem({
                status: 500,
                title: "Failed to delete user",
                code: "USER_DELETE_FAILED",
                detail: authError.message,
                requestId: ctx.requestId,
            });
        }

        // Delete user profile (cascade will handle memberships)
        const { error: profileError } = await supabase
            .from("users")
            .delete()
            .eq("id", userId);

        if (profileError) {
            return problem({
                status: 500,
                title: "Failed to delete user profile",
                code: "PROFILE_DELETE_FAILED",
                detail: profileError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                message: "User deleted successfully",
                userId,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Delete user error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
