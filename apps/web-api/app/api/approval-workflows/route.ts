// Approval Workflows API
// DoD: Complete CRUD operations for approval workflows
// SSOT: Use existing patterns from apps/web-api/app/api/_lib/
// Tech Stack: Next.js Route Handler + Drizzle ORM + Supabase

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

// Approval workflow schema
const ApprovalWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  entityType: z.enum(["INVOICE", "BILL", "PAYMENT", "JOURNAL_ENTRY"]),
  conditions: z.record(z.any()).default({}),
  isActive: z.boolean().default(true),
});

const UpdateApprovalWorkflowSchema = ApprovalWorkflowSchema.partial();

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const entityType = url.searchParams.get("entityType");
    const isActive = url.searchParams.get("isActive");

    let query = supabase
      .from("approval_workflows")
      .select("*")
      .eq("tenant_id", ctx.tenantId)
      .eq("company_id", ctx.companyId)
      .range(offset, offset + limit - 1)
      .order("created_at", { ascending: false });

    if (entityType) {
      query = query.eq("entity_type", entityType);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data, error, count } = await query;

    if (error) {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to fetch approval workflows",
        requestId: ctx.requestId,
      });
    }

    return ok(
      {
        workflows: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          hasMore: (count || 0) > offset + limit,
        },
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Get approval workflows error:", error);
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
    const validatedData = ApprovalWorkflowSchema.parse(body);

    const { data, error } = await supabase
      .from("approval_workflows")
      .insert({
        tenant_id: ctx.tenantId,
        company_id: ctx.companyId,
        ...validatedData,
      })
      .select()
      .single();

    if (error) {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to create approval workflow",
        requestId: ctx.requestId,
      });
    }

    return ok(data, ctx.requestId);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return problem({
        status: 400,
        title: "Validation error",
        code: "VALIDATION_ERROR",
        detail: error.errors[0]?.message || "Validation failed",
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }
    console.error("Create approval workflow error:", error);
    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
