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

// Subscription creation schema
const CreateSubscriptionSchema = z.object({
    tenantId: z.string().uuid(),
    planId: z.string().uuid(),
    startDate: z.string().transform(val => new Date(val)).optional(),
    autoRenew: z.boolean().default(true),
    billingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
});

// Subscription update schema
const UpdateSubscriptionSchema = z.object({
    autoRenew: z.boolean().optional(),
    billingAddress: z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const tenantId = url.searchParams.get("tenantId");
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
        const offset = parseInt(url.searchParams.get("offset") || "0");

        if (!tenantId) {
            return problem({
                status: 400,
                title: "Missing tenant ID",
                code: "MISSING_TENANT_ID",
                detail: "tenantId parameter is required",
                requestId: ctx.requestId,
            });
        }

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", tenantId)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this tenant",
                requestId: ctx.requestId,
            });
        }

        // Get tenant subscriptions
        const { data: subscriptions, error: subscriptionsError } = await supabase
            .from("tenant_subscriptions")
            .select(`
        id,
        status,
        start_date,
        end_date,
        next_billing_date,
        auto_renew,
        billing_address,
        trial_ends_at,
        cancelled_at,
        cancellation_reason,
        created_at,
        updated_at,
        subscription_plans!inner(
          id,
          name,
          description,
          plan_type,
          price,
          currency,
          billing_cycle,
          features,
          limits
        )
      `)
            .eq("tenant_id", tenantId)
            .range(offset, offset + limit - 1)
            .order("created_at", { ascending: false });

        if (subscriptionsError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch subscriptions",
                requestId: ctx.requestId,
            });
        }

        const formattedSubscriptions = subscriptions?.map((s: any) => ({
            id: s.id,
            status: s.status,
            startDate: s.start_date,
            endDate: s.end_date,
            nextBillingDate: s.next_billing_date,
            autoRenew: s.auto_renew,
            billingAddress: s.billing_address,
            trialEndsAt: s.trial_ends_at,
            cancelledAt: s.cancelled_at,
            cancellationReason: s.cancellation_reason,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
            plan: {
                id: s.subscription_plans.id,
                name: s.subscription_plans.name,
                description: s.subscription_plans.description,
                planType: s.subscription_plans.plan_type,
                price: s.subscription_plans.price,
                currency: s.subscription_plans.currency,
                billingCycle: s.subscription_plans.billing_cycle,
                features: s.subscription_plans.features,
                limits: s.subscription_plans.limits,
            },
        })) || [];

        return ok(
            {
                subscriptions: formattedSubscriptions,
                total: formattedSubscriptions.length,
                limit,
                offset,
                tenantId,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get subscriptions error:", error);

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
        const { tenantId, planId, startDate, autoRenew, billingAddress } = CreateSubscriptionSchema.parse(body);

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", tenantId)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this tenant",
                requestId: ctx.requestId,
            });
        }

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can create subscriptions",
                requestId: ctx.requestId,
            });
        }

        // Get plan details
        const { data: plan, error: planError } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", planId)
            .eq("is_active", true)
            .single();

        if (planError || !plan) {
            return problem({
                status: 404,
                title: "Plan not found",
                code: "PLAN_NOT_FOUND",
                detail: "The requested subscription plan does not exist or is inactive",
                requestId: ctx.requestId,
            });
        }

        // Check if tenant already has an active subscription
        const { data: existingSubscription, error: existingError } = await supabase
            .from("tenant_subscriptions")
            .select("id, status")
            .eq("tenant_id", tenantId)
            .eq("status", "ACTIVE")
            .single();

        if (existingError && existingError.code !== "PGRST116") {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to check existing subscription",
                requestId: ctx.requestId,
            });
        }

        if (existingSubscription) {
            return problem({
                status: 409,
                title: "Active subscription exists",
                code: "ACTIVE_SUBSCRIPTION_EXISTS",
                detail: "Tenant already has an active subscription",
                requestId: ctx.requestId,
            });
        }

        // Calculate subscription dates
        const subscriptionStartDate = startDate || new Date();
        const subscriptionEndDate = new Date(subscriptionStartDate);

        if (plan.billing_cycle === "MONTHLY") {
            subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
        } else {
            subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
        }

        const nextBillingDate = new Date(subscriptionEndDate);

        // Create subscription
        const { data: subscription, error: subscriptionError } = await supabase
            .from("tenant_subscriptions")
            .insert({
                tenant_id: tenantId,
                plan_id: planId,
                status: "ACTIVE",
                start_date: subscriptionStartDate.toISOString(),
                end_date: subscriptionEndDate.toISOString(),
                next_billing_date: nextBillingDate.toISOString(),
                auto_renew: autoRenew,
                billing_address: billingAddress,
                trial_ends_at: plan.plan_type === "FREE" ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14-day trial
            })
            .select()
            .single();

        if (subscriptionError) {
            return problem({
                status: 500,
                title: "Failed to create subscription",
                code: "SUBSCRIPTION_CREATION_FAILED",
                detail: subscriptionError.message,
                requestId: ctx.requestId,
            });
        }

        // Create initial invoice if not free plan
        if (plan.plan_type !== "FREE") {
            const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            await supabase.from("subscription_invoices").insert({
                subscription_id: subscription.id,
                invoice_number: invoiceNumber,
                amount: plan.price,
                currency: plan.currency,
                tax_amount: "0",
                total_amount: plan.price,
                status: "DRAFT",
                due_date: subscriptionEndDate.toISOString(),
            });
        }

        return ok(
            {
                id: subscription.id,
                status: subscription.status,
                startDate: subscription.start_date,
                endDate: subscription.end_date,
                nextBillingDate: subscription.next_billing_date,
                autoRenew: subscription.auto_renew,
                billingAddress: subscription.billing_address,
                trialEndsAt: subscription.trial_ends_at,
                createdAt: subscription.created_at,
                updatedAt: subscription.updated_at,
                plan: {
                    id: plan.id,
                    name: plan.name,
                    description: plan.description,
                    planType: plan.plan_type,
                    price: plan.price,
                    currency: plan.currency,
                    billingCycle: plan.billing_cycle,
                    features: plan.features,
                    limits: plan.limits,
                },
            },
            ctx.requestId,
            201,
        );
    } catch (error) {
        console.error("Create subscription error:", error);

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
