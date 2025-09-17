import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Helper function to get permissions for a role
function getPermissionsForRole(role: string): string[] {
  const rolePermissions: Record<string, string[]> = {
    admin: ["read", "write", "delete", "approve", "manage_users", "manage_billing"],
    manager: ["read", "write", "delete", "approve", "manage_users"],
    accountant: ["read", "write", "delete", "approve"],
    clerk: ["read", "write"],
    viewer: ["read"],
    user: ["read", "write"],
  };

  return rolePermissions[role] || ["read"];
}

// Login request schema
const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const body = await req.json();
    const { email, password } = LoginRequestSchema.parse(body);

    // Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return problem({
        status: 401,
        title: "Authentication failed",
        code: "INVALID_CREDENTIALS",
        detail: "Email or password is incorrect",
        requestId,
      });
    }

    // Get user data from our actual database schema
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        preferences,
        memberships!inner(
          tenant_id,
          company_id,
          role,
          tenants(name, slug),
          companies(name, code)
        )
      `)
      .eq("id", authData.user.id)
      .single();

    if (userError || !userData) {
      return problem({
        status: 500,
        title: "User data retrieval failed",
        code: "USER_DATA_ERROR",
        detail: "Unable to retrieve user data from database",
        requestId,
      });
    }

    // Get the first membership (primary tenant/company)
    const primaryMembership = userData.memberships?.[0];
    if (!primaryMembership) {
      return problem({
        status: 403,
        title: "No tenant access",
        code: "NO_TENANT_ACCESS",
        detail: "User has no tenant or company access",
        requestId,
      });
    }

    // Extract company and tenant data (they come as arrays from the join)
    const company = Array.isArray(primaryMembership.companies)
      ? primaryMembership.companies[0]
      : primaryMembership.companies;
    const tenant = Array.isArray(primaryMembership.tenants)
      ? primaryMembership.tenants[0]
      : primaryMembership.tenants;

    // Return user data and Supabase session
    return ok(
      {
        user: {
          id: userData.id,
          email: userData.email,
          firstName: userData.first_name || "",
          lastName: userData.last_name || "",
          role: primaryMembership.role || "user",
          permissions: getPermissionsForRole(primaryMembership.role || "user"),
          tenantId: primaryMembership.tenant_id,
          companyId: primaryMembership.company_id,
          companyName: company?.name || "",
          tenantName: tenant?.name || "",
        },
        accessToken: authData.session?.access_token,
        refreshToken: authData.session?.refresh_token,
        expiresAt: authData.session?.expires_at
          ? new Date(authData.session.expires_at * 1000).toISOString()
          : null,
      },
      requestId,
    );
  } catch (error) {
    // Error will be handled by standardized error response below

    if (error instanceof z.ZodError) {
      return problem({
        status: 400,
        title: "Invalid request data",
        code: "VALIDATION_ERROR",
        detail: "Please check your email and password format",
        requestId,
      });
    }

    return problem({
      status: 500,
      title: "Login failed",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId,
    });
  }
}
