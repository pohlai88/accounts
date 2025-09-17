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

// User creation schema
const CreateUserSchema = z.object({
    email: z.string().email(),
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    password: z.string().min(8).optional(),
    tenantId: z.string().uuid().optional(),
    role: z.enum(["admin", "manager", "accountant", "clerk", "viewer", "user"]).default("user"),
});

// User update schema
const UpdateUserSchema = z.object({
    firstName: z.string().min(1).max(50).optional(),
    lastName: z.string().min(1).max(50).optional(),
    email: z.string().email().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const tenantId = url.searchParams.get("tenantId");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
            .from("users")
            .select(`
        id,
        email,
        first_name,
        last_name,
        created_at,
        updated_at
      `)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        // If tenantId is provided, filter by users in that tenant
        if (tenantId) {
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

            // Get users in this tenant with their roles
            const { data: tenantUsers, error: tenantUsersError } = await supabase
                .from("memberships")
                .select(`
          role,
          permissions,
          created_at,
          users!inner(
            id,
            email,
            first_name,
            last_name,
            created_at,
            updated_at
          )
        `)
                .eq("tenant_id", tenantId)
                .range(offset, offset + limit - 1)
                .order("created_at", { ascending: false });

            if (tenantUsersError) {
                return problem({
                    status: 500,
                    title: "Database error",
                    code: "DATABASE_ERROR",
                    detail: "Failed to fetch tenant users",
                    requestId: ctx.requestId,
                });
            }

            const users = tenantUsers?.map((m: any) => ({
                id: m.users.id,
                email: m.users.email,
                firstName: m.users.first_name,
                lastName: m.users.last_name,
                role: m.role,
                permissions: m.permissions,
                createdAt: m.users.created_at,
                updatedAt: m.users.updated_at,
                joinedAt: m.created_at,
            })) || [];

            return ok(
                {
                    users,
                    total: users.length,
                    limit,
                    offset,
                    tenantId,
                },
                ctx.requestId,
            );
        }

        // Get all users (admin only)
        const { data: users, error: usersError } = await query;

        if (usersError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch users",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                users: users || [],
                total: users?.length || 0,
                limit,
                offset,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get users error:", error);

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
        const { email, firstName, lastName, password, tenantId, role } = CreateUserSchema.parse(body);

        // Check if user already exists
        const { data: existingUser, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("email", email)
            .single();

        if (userError && userError.code !== "PGRST116") {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to check existing user",
                requestId: ctx.requestId,
            });
        }

        let userId: string;

        if (existingUser) {
            userId = existingUser.id;
        } else {
            // Create new user in Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: password || "temp-password-" + Math.random().toString(36).substr(2, 9),
                email_confirm: true,
                user_metadata: {
                    first_name: firstName || "",
                    last_name: lastName || "",
                },
            });

            if (authError || !authData.user) {
                return problem({
                    status: 400,
                    title: "Failed to create user",
                    code: "USER_CREATION_FAILED",
                    detail: authError?.message || "Unable to create user",
                    requestId: ctx.requestId,
                });
            }

            userId = authData.user.id;

            // Create user profile
            const { error: profileError } = await supabase.from("users").insert({
                id: userId,
                email: email,
                first_name: firstName || "",
                last_name: lastName || "",
            });

            if (profileError) {
                // Rollback auth user creation
                await supabase.auth.admin.deleteUser(userId);
                return problem({
                    status: 500,
                    title: "Failed to create user profile",
                    code: "PROFILE_CREATION_FAILED",
                    detail: profileError.message,
                    requestId: ctx.requestId,
                });
            }
        }

        // If tenantId is provided, create membership
        if (tenantId) {
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
                    detail: "Only admins and managers can add users to tenants",
                    requestId: ctx.requestId,
                });
            }

            // Check if membership already exists
            const { data: existingMembership } = await supabase
                .from("memberships")
                .select("id")
                .eq("user_id", userId)
                .eq("tenant_id", tenantId)
                .single();

            if (existingMembership) {
                // Update existing membership
                const { error: membershipError2 } = await supabase
                    .from("memberships")
                    .update({ role: role })
                    .eq("id", existingMembership.id);

                if (membershipError2) {
                    return problem({
                        status: 500,
                        title: "Failed to update membership",
                        code: "MEMBERSHIP_UPDATE_FAILED",
                        detail: membershipError2.message,
                        requestId: ctx.requestId,
                    });
                }
            } else {
                // Create new membership
                const { error: membershipError2 } = await supabase.from("memberships").insert({
                    user_id: userId,
                    tenant_id: tenantId,
                    role: role,
                    permissions: {
                        can_manage_users: role === "admin",
                        can_manage_settings: role === "admin",
                        can_view_reports: ["admin", "manager", "accountant"].includes(role),
                        can_manage_companies: ["admin", "manager"].includes(role),
                    },
                });

                if (membershipError2) {
                    return problem({
                        status: 500,
                        title: "Failed to create membership",
                        code: "MEMBERSHIP_CREATION_FAILED",
                        detail: membershipError2.message,
                        requestId: ctx.requestId,
                    });
                }
            }
        }

        // Get user details
        const { data: user, error: userError2 } = await supabase
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

        if (userError2) {
            return problem({
                status: 500,
                title: "Failed to fetch user details",
                code: "USER_FETCH_FAILED",
                detail: userError2.message,
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
                ...(tenantId && { role, tenantId }),
            },
            ctx.requestId,
            201,
        );
    } catch (error) {
        console.error("Create user error:", error);

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
