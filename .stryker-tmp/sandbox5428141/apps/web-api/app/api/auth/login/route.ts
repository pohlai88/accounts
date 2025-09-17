// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { ok, problem } from "@aibos/web-api/_lib/response";

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

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      return problem({
        status: 500,
        title: "Profile retrieval failed",
        code: "PROFILE_ERROR",
        detail: "Unable to retrieve user profile",
        requestId,
      });
    }

    // Return user data and Supabase session
    return ok(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: profile.first_name || "",
          lastName: profile.last_name || "",
          role: profile.role || "user",
          permissions: profile.permissions || ["read"],
          tenantId: profile.tenant_id || "",
          companyId: profile.company_id || "",
          companyName: profile.company_name || "",
          tenantName: profile.tenant_name || "",
        },
        session: {
          accessToken: authData.session?.access_token,
          refreshToken: authData.session?.refresh_token,
          expiresAt: authData.session?.expires_at
            ? new Date(authData.session.expires_at * 1000).toISOString()
            : null,
        },
      },
      requestId,
    );
  } catch (error) {
    console.error("Login error:", error);

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
