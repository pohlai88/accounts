import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSecurityContext } from "../../../_lib/request";
import { ok, problem } from "../../../_lib/response";

// Invite user request schema
const InviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "manager", "accountant", "clerk", "viewer", "user"]).default("viewer"),
  expiresInDays: z.number().min(1).max(30).default(7),
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ctx = await getSecurityContext(req);
    const tenantId = params.id;

    // Verify user has admin/manager role in this tenant
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
        detail: "Only admins and managers can invite users",
        requestId: ctx.requestId,
      });
    }

    // Parse request body
    const body = await req.json();
    const { email, role, expiresInDays } = InviteUserSchema.parse(body);

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let userId: string;

    if (userError && userError.code === "PGRST116") {
      // User doesn't exist, create them directly
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: "temp-password-" + Math.random().toString(36).substr(2, 9),
        email_confirm: true,
        user_metadata: {
          tenant_id: tenantId,
          role: role,
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
      await supabase.from("users").insert({
        id: userId,
        email: email,
        first_name: "",
        last_name: "",
      });
    } else if (userError) {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to check existing user",
        requestId: ctx.requestId,
      });
    } else {
      // User exists, check if already a member
      const { data: existingMembership } = await supabase
        .from("memberships")
        .select("id")
        .eq("user_id", existingUser.id)
        .eq("tenant_id", tenantId)
        .single();

      if (existingMembership) {
        return problem({
          status: 409,
          title: "User already a member",
          code: "USER_ALREADY_MEMBER",
          detail: "This user is already a member of this tenant",
          requestId: ctx.requestId,
        });
      }

      userId = existingUser.id;
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
        console.error("Membership update error:", membershipError2);
        return problem({
          status: 500,
          title: "Failed to update membership",
          code: "MEMBERSHIP_UPDATE_FAILED",
          detail: `Unable to update user membership: ${membershipError2.message}`,
          requestId: ctx.requestId,
        });
      }
    } else {
      // Create new membership
      const { error: membershipError2 } = await supabase.from("memberships").insert({
        user_id: userId,
        tenant_id: tenantId,
        role: role,
      });

      if (membershipError2) {
        console.error("Membership creation error:", membershipError2);
        return problem({
          status: 500,
          title: "Failed to create membership",
          code: "MEMBERSHIP_CREATION_FAILED",
          detail: `Unable to add user to tenant: ${membershipError2.message}`,
          requestId: ctx.requestId,
        });
      }
    }

    // Create invitation record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { error: invitationError } = await supabase.from("tenant_invitations").insert({
      tenant_id: tenantId,
      email: email,
      role: role,
      invited_by: ctx.userId,
      expires_at: expiresAt.toISOString(),
      status: "pending",
    });

    if (invitationError) {
      console.error("Failed to create invitation record:", invitationError);
      // Don't fail the request, just log the error
    }

    return ok(
      {
        message: "User invited successfully",
        userId: userId,
        email: email,
        role: role,
        status: "invited",
        expiresAt: expiresAt.toISOString(),
      },
      ctx.requestId,
      201,
    );
  } catch (error) {
    console.error("Invite user error:", error);

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
