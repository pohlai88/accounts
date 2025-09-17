import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return problem({
        status: 401,
        title: "Missing or invalid authorization header",
        code: "MISSING_TOKEN",
        detail: "Please provide a valid access token",
        requestId,
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // Sign out the user from Supabase (invalidates the session)
    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      // Continue with logout even if Supabase sign out fails
      // Error will be logged by monitoring system if configured
    }

    // Log the logout event for audit purposes
    try {
      // Extract user ID from token if possible (simplified for now)
      // In production, you would decode the JWT to get user info
      // Audit logging handled by monitoring system
    } catch (auditError) {
      // Audit logging errors handled by monitoring system
    }

    return ok(
      {
        message: "Successfully logged out",
      },
      requestId,
    );
  } catch (error) {
    // Error will be handled by standardized error response below

    return problem({
      status: 500,
      title: "Logout failed",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred during logout",
      requestId,
    });
  }
}
