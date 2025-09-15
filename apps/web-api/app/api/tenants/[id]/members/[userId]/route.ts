import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } },
) {
  try {
    const ctx = await getSecurityContext(req);
    const tenantId = params.id;
    const targetUserId = params.userId;

    // Verify user has admin/manager role in this tenant
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", ctx.userId)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
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
        detail: "Only admins and managers can remove members",
        requestId: ctx.requestId,
      });
    }

    // Check if trying to remove self
    if (targetUserId === ctx.userId) {
      return problem({
        status: 400,
        title: "Cannot remove self",
        code: "CANNOT_REMOVE_SELF",
        detail: "You cannot remove yourself from the tenant",
        requestId: ctx.requestId,
      });
    }

    // Get target user's membership
    const { data: targetMembership, error: targetError } = await supabase
      .from("memberships")
      .select("id, role, status")
      .eq("user_id", targetUserId)
      .eq("tenant_id", tenantId)
      .single();

    if (targetError || !targetMembership) {
      return problem({
        status: 404,
        title: "Membership not found",
        code: "MEMBERSHIP_NOT_FOUND",
        detail: "User is not a member of this tenant",
        requestId: ctx.requestId,
      });
    }

    // Check if target user is the last admin
    if (targetMembership.role === "admin") {
      const { data: adminCount, error: countError } = await supabase
        .from("memberships")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("role", "admin")
        .eq("status", "active");

      if (countError || (adminCount?.length || 0) <= 1) {
        return problem({
          status: 400,
          title: "Cannot remove last admin",
          code: "CANNOT_REMOVE_LAST_ADMIN",
          detail: "Cannot remove the last admin from the tenant",
          requestId: ctx.requestId,
        });
      }
    }

    // Update membership status to disabled
    const { error: updateError } = await supabase
      .from("memberships")
      .update({
        status: "disabled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetMembership.id);

    if (updateError) {
      return problem({
        status: 500,
        title: "Failed to remove member",
        code: "REMOVAL_FAILED",
        detail: "Unable to remove user from tenant",
        requestId: ctx.requestId,
      });
    }

    // Clear user's active tenant if it was this tenant
    const { data: userSettings } = await supabase
      .from("user_settings")
      .select("active_tenant_id")
      .eq("user_id", targetUserId)
      .single();

    if (userSettings?.active_tenant_id === tenantId) {
      await supabase
        .from("user_settings")
        .update({
          active_tenant_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", targetUserId);
    }

    return ok(
      {
        message: "Member removed successfully",
        userId: targetUserId,
        tenantId: tenantId,
        status: "removed",
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Remove member error:", error);

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } },
) {
  try {
    const ctx = await getSecurityContext(req);
    const tenantId = params.id;
    const targetUserId = params.userId;

    // Parse request body
    const body = await req.json();
    const { role } = body;

    if (!role || !["admin", "manager", "accountant", "clerk", "viewer"].includes(role)) {
      return problem({
        status: 400,
        title: "Invalid role",
        code: "INVALID_ROLE",
        detail: "Role must be one of: admin, manager, accountant, clerk, viewer",
        requestId: ctx.requestId,
      });
    }

    // Verify user has admin role in this tenant
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", ctx.userId)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
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
        detail: "Only admins can change user roles",
        requestId: ctx.requestId,
      });
    }

    // Get target user's membership
    const { data: targetMembership, error: targetError } = await supabase
      .from("memberships")
      .select("id, role")
      .eq("user_id", targetUserId)
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .single();

    if (targetError || !targetMembership) {
      return problem({
        status: 404,
        title: "Membership not found",
        code: "MEMBERSHIP_NOT_FOUND",
        detail: "User is not a member of this tenant",
        requestId: ctx.requestId,
      });
    }

    // Check if trying to change role of last admin
    if (targetMembership.role === "admin" && role !== "admin") {
      const { data: adminCount, error: countError } = await supabase
        .from("memberships")
        .select("id", { count: "exact" })
        .eq("tenant_id", tenantId)
        .eq("role", "admin")
        .eq("status", "active");

      if (countError || (adminCount?.length || 0) <= 1) {
        return problem({
          status: 400,
          title: "Cannot change last admin role",
          code: "CANNOT_CHANGE_LAST_ADMIN",
          detail: "Cannot change the role of the last admin",
          requestId: ctx.requestId,
        });
      }
    }

    // Update membership role
    const { error: updateError } = await supabase
      .from("memberships")
      .update({
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetMembership.id);

    if (updateError) {
      return problem({
        status: 500,
        title: "Failed to update role",
        code: "UPDATE_FAILED",
        detail: "Unable to update user role",
        requestId: ctx.requestId,
      });
    }

    return ok(
      {
        message: "User role updated successfully",
        userId: targetUserId,
        tenantId: tenantId,
        role: role,
        status: "updated",
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Update member role error:", error);

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
