// Approval Delegations API
// DoD: Complete CRUD operations for approval delegations
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

// Approval delegation schema
const ApprovalDelegationSchema = z.object({
    delegateId: z.string().uuid(),
    entityTypes: z.array(z.string()),
    conditions: z.record(z.any()).default({}),
    validFrom: z.string().datetime(),
    validTo: z.string().datetime().optional(),
});

const UpdateApprovalDelegationSchema = ApprovalDelegationSchema.partial();

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const isActive = url.searchParams.get("isActive");

        let query = supabase
            .from("approval_delegations")
            .select(`
                *,
                users!approval_delegations_delegate_id_fkey(first_name, last_name, email)
            `)
            .eq("tenant_id", ctx.tenantId)
            .eq("company_id", ctx.companyId)
            .eq("delegator_id", ctx.userId)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (isActive !== null) {
            query = query.eq("is_active", isActive === "true");
        }

        const { data, error, count } = await query;

        if (error) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch approval delegations",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                delegations: data || [],
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
        console.error("Get approval delegations error:", error);
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
        const validatedData = ApprovalDelegationSchema.parse(body);

        const { data, error } = await supabase
            .from("approval_delegations")
            .insert({
                tenant_id: ctx.tenantId,
                company_id: ctx.companyId,
                delegator_id: ctx.userId,
                ...validatedData,
            })
            .select()
            .single();

        if (error) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to create approval delegation",
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
        console.error("Create approval delegation error:", error);
        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
