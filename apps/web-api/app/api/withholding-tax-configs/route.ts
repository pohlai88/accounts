// Withholding Tax Configs API
// DoD: Complete CRUD operations for withholding tax configurations
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

// Withholding tax config schema
const WithholdingTaxConfigSchema = z.object({
    taxCode: z.string().min(1).max(50),
    description: z.string().min(1).max(255),
    rate: z.number().min(0).max(100),
    minimumAmount: z.number().nonnegative().optional(),
    maximumAmount: z.number().nonnegative().optional(),
    isActive: z.boolean().default(true),
    effectiveFrom: z.string().datetime(),
    effectiveTo: z.string().datetime().optional(),
});

const UpdateWithholdingTaxConfigSchema = WithholdingTaxConfigSchema.partial();

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const taxCode = url.searchParams.get("taxCode");
        const isActive = url.searchParams.get("isActive");

        let query = supabase
            .from("withholding_tax_configs")
            .select("*")
            .eq("tenant_id", ctx.tenantId)
            .eq("company_id", ctx.companyId)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (taxCode) {
            query = query.eq("tax_code", taxCode);
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
                detail: "Failed to fetch withholding tax configs",
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
        console.error("Get withholding tax configs error:", error);
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
        const validatedData = WithholdingTaxConfigSchema.parse(body);

        const { data, error } = await supabase
            .from("withholding_tax_configs")
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
                detail: "Failed to create withholding tax config",
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
        console.error("Create withholding tax config error:", error);
        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
