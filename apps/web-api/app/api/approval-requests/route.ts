// Approval Requests API
// DoD: Complete CRUD operations for approval requests
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

// Approval request schema
const ApprovalRequestSchema = z.object({
    workflowId: z.string().uuid(),
    entityType: z.enum(["INVOICE", "BILL", "PAYMENT", "JOURNAL_ENTRY"]),
    entityId: z.string().uuid(),
    entityData: z.record(z.any()),
    priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
    dueDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    metadata: z.record(z.any()).default({}),
});

const UpdateApprovalRequestSchema = ApprovalRequestSchema.partial();

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const status = url.searchParams.get("status");
        const entityType = url.searchParams.get("entityType");

        let query = supabase
            .from("approval_requests")
            .select(`
                *,
                approval_workflows(name, description),
                users!approval_requests_requested_by_fkey(first_name, last_name, email)
            `)
            .eq("tenant_id", ctx.tenantId)
            .eq("company_id", ctx.companyId)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        }

        if (entityType) {
            query = query.eq("entity_type", entityType);
        }

        const { data, error, count } = await query;

        if (error) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch approval requests",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                requests: data || [],
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
        console.error("Get approval requests error:", error);
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
        const validatedData = ApprovalRequestSchema.parse(body);

        const { data, error } = await supabase
            .from("approval_requests")
            .insert({
                tenant_id: ctx.tenantId,
                company_id: ctx.companyId,
                requested_by: ctx.userId,
                ...validatedData,
            })
            .select()
            .single();

        if (error) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to create approval request",
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
        console.error("Create approval request error:", error);
        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
