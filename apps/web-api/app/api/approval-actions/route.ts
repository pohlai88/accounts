// Approval Actions API
// DoD: Complete CRUD operations for approval actions
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

// Approval action schema
const ApprovalActionSchema = z.object({
    requestId: z.string().uuid(),
    stepId: z.string().uuid(),
    action: z.enum(["APPROVE", "REJECT", "DELEGATE", "REQUEST_INFO"]),
    comments: z.string().optional(),
    metadata: z.record(z.any()).default({}),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const requestId = url.searchParams.get("requestId");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");

        let query = supabase
            .from("approval_actions")
            .select(`
                *,
                approval_requests(entity_type, entity_id),
                approval_workflow_steps(step_name, approver_type),
                users!approval_actions_performed_by_fkey(first_name, last_name, email)
            `)
            .range(offset, offset + limit - 1)
            .order("performed_at", { ascending: false });

        if (requestId) {
            query = query.eq("request_id", requestId);
        }

        const { data, error, count } = await query;

        if (error) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch approval actions",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                actions: data || [],
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
        console.error("Get approval actions error:", error);
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
        const validatedData = ApprovalActionSchema.parse(body);

        const { data, error } = await supabase
            .from("approval_actions")
            .insert({
                performed_by: ctx.userId,
                ...validatedData,
            })
            .select()
            .single();

        if (error) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to create approval action",
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
        console.error("Create approval action error:", error);
        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
