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

// Subscription plan creation schema
const CreatePlanSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    planType: z.enum(["FREE", "BASIC", "PROFESSIONAL", "ENTERPRISE"]),
    price: z.number().min(0),
    currency: z.string().min(3).max(3).default("USD"),
    billingCycle: z.enum(["MONTHLY", "YEARLY"]),
    features: z.record(z.any()).default({}),
    limits: z.record(z.any()).default({}),
});

// Subscription plan update schema
const UpdatePlanSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    price: z.number().min(0).optional(),
    currency: z.string().min(3).max(3).optional(),
    billingCycle: z.enum(["MONTHLY", "YEARLY"]).optional(),
    features: z.record(z.any()).optional(),
    limits: z.record(z.any()).optional(),
    isActive: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");
        const activeOnly = url.searchParams.get("activeOnly") === "true";

        let query = supabase
            .from("subscription_plans")
            .select("*")
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (activeOnly) {
            query = query.eq("is_active", true);
        }

        const { data: plans, error: plansError } = await query;

        if (plansError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch subscription plans",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                plans: plans || [],
                total: plans?.length || 0,
                limit,
                offset,
                activeOnly,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get subscription plans error:", error);

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
        const planData = CreatePlanSchema.parse(body);

        // Check if user is admin in any tenant (for now, we'll allow any authenticated user to create plans)
        // In a real implementation, you might want to restrict this to super admins
        const { data: adminMemberships } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("role", "admin");

        if (!adminMemberships || adminMemberships.length === 0) {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can create subscription plans",
                requestId: ctx.requestId,
            });
        }

        // Create subscription plan
        const { data: plan, error: planError } = await supabase
            .from("subscription_plans")
            .insert({
                name: planData.name,
                description: planData.description,
                plan_type: planData.planType,
                price: planData.price.toString(),
                currency: planData.currency,
                billing_cycle: planData.billingCycle,
                features: planData.features,
                limits: planData.limits,
            })
            .select()
            .single();

        if (planError) {
            return problem({
                status: 500,
                title: "Failed to create subscription plan",
                code: "PLAN_CREATION_FAILED",
                detail: planError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                planType: plan.plan_type,
                price: plan.price,
                currency: plan.currency,
                billingCycle: plan.billing_cycle,
                features: plan.features,
                limits: plan.limits,
                isActive: plan.is_active,
                createdAt: plan.created_at,
                updatedAt: plan.updated_at,
            },
            ctx.requestId,
            201,
        );
    } catch (error) {
        console.error("Create subscription plan error:", error);

        if (error instanceof z.ZodError) {
            return problem({
                status: 400,
                title: "Invalid request data",
                code: "VALIDATION_ERROR",
                detail: "Please check your request format",
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            });
        }

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
