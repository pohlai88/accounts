// Advance Accounts API
// DoD: Complete CRUD operations for advance accounts
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

// Advance account schema
const AdvanceAccountSchema = z.object({
    accountId: z.string().uuid(),
    advanceType: z.enum(["EMPLOYEE", "VENDOR", "CUSTOMER"]),
    recipientId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().length(3),
    purpose: z.string().min(1).max(500),
    expectedSettlementDate: z.string().datetime(),
    status: z.enum(["PENDING", "APPROVED", "SETTLED", "CANCELLED"]).default("PENDING"),
    metadata: z.record(z.any()).default({}),
});

const UpdateAdvanceAccountSchema = AdvanceAccountSchema.partial();

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const status = url.searchParams.get("status");
        const advanceType = url.searchParams.get("advanceType");

        let query = supabase
            .from("advance_accounts")
            .select("*")
            .eq("tenant_id", ctx.tenantId)
            .eq("company_id", ctx.companyId)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (status) {
            query = query.eq("status", status);
        }

        if (advanceType) {
            query = query.eq("advance_type", advanceType);
        }

        const { data, error, count } = await query;

        if (error) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch advance accounts",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                advances: data || [],
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
        console.error("Get advance accounts error:", error);
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
        const validatedData = AdvanceAccountSchema.parse(body);

        const { data, error } = await supabase
            .from("advance_accounts")
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
                detail: "Failed to create advance account",
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
        console.error("Create advance account error:", error);
        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
