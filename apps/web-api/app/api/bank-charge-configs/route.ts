// Bank Charge Configs API
// DoD: Complete CRUD operations for bank charge configurations
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

// Bank charge config schema
const BankChargeConfigSchema = z.object({
    bankAccountId: z.string().uuid(),
    chargeType: z.enum(["TRANSACTION", "MONTHLY", "QUARTERLY", "ANNUAL"]),
    amount: z.number().nonnegative(),
    currency: z.string().length(3),
    description: z.string().min(1).max(255),
    isActive: z.boolean().default(true),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().optional(),
});

const UpdateBankChargeConfigSchema = BankChargeConfigSchema.partial();

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const bankAccountId = url.searchParams.get("bankAccountId");
        const isActive = url.searchParams.get("isActive");

        let query = supabase
            .from("bank_charge_configs")
            .select("*")
            .eq("tenant_id", ctx.tenantId)
            .eq("company_id", ctx.companyId)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (bankAccountId) {
            query = query.eq("bank_account_id", bankAccountId);
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
                detail: "Failed to fetch bank charge configs",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                configs: data || [],
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
        console.error("Get bank charge configs error:", error);
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
        const validatedData = BankChargeConfigSchema.parse(body);

        const { data, error } = await supabase
            .from("bank_charge_configs")
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
                detail: "Failed to create bank charge config",
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
        console.error("Create bank charge config error:", error);
        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
