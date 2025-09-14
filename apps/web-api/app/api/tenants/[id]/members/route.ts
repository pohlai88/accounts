import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSecurityContext } from "../../../_lib/request";
import { ok, problem } from "../../../_lib/response";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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

    // Get all members of this tenant
    const { data: members, error: membersError } = await supabase
      .from("memberships")
      .select(
        `
        id,
        role,
        permissions,
        created_at,
        users!inner(id, email, first_name, last_name),
        companies(id, name, code)
      `,
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true });

    if (membersError) {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to fetch tenant members",
        requestId: ctx.requestId,
      });
    }

    const formattedMembers =
      members?.map((m: unknown) => ({
        id: m.id,
        userId: m.users?.id || "",
        email: m.users?.email || "",
        firstName: m.users?.first_name || "",
        lastName: m.users?.last_name || "",
        role: m.role,
        permissions: m.permissions,
        company: m.companies
          ? {
              id: m.companies.id,
              name: m.companies.name,
              code: m.companies.code,
            }
          : null,
        joinedAt: m.created_at,
        isCurrentUser: m.users?.id === ctx.userId,
      })) || [];

    return ok(
      {
        members: formattedMembers,
        totalMembers: formattedMembers.length,
        currentUserRole: membership.role,
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Get tenant members error:", error);

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
