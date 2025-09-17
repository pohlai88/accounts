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

// Cancellation schema
const CancelSubscriptionSchema = z.object({
    reason: z.string().optional(),
    effectiveDate: z.string().transform(val => new Date(val)).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const subscriptionId = params.id;

        // Get subscription details
        const { data: subscription, error: subscriptionError } = await supabase
            .from("tenant_subscriptions")
            .select(`
        id,
        tenant_id,
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
            .eq("id", subscriptionId)
            .single();

        if (subscriptionError) {
            if (subscriptionError.code === "PGRST116") {
                return problem({
                    status: 404,
                    title: "Subscription not found",
                    code: "SUBSCRIPTION_NOT_FOUND",
                    detail: "The requested subscription does not exist",
                    requestId: ctx.requestId,
                });
            }

            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch subscription details",
                requestId: ctx.requestId,
            });
        }

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", subscription.tenant_id)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this subscription",
                requestId: ctx.requestId,
            });
        }

        // Get subscription invoices
        const { data: invoices, error: invoicesError } = await supabase
            .from("subscription_invoices")
            .select("*")
            .eq("subscription_id", subscriptionId)
            .order("created_at", { ascending: false });

        if (invoicesError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch subscription invoices",
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                id: subscription.id,
                tenantId: subscription.tenant_id,
                status: subscription.status,
                startDate: subscription.start_date,
                endDate: subscription.end_date,
                nextBillingDate: subscription.next_billing_date,
                autoRenew: subscription.auto_renew,
                billingAddress: subscription.billing_address,
                trialEndsAt: subscription.trial_ends_at,
                cancelledAt: subscription.cancelled_at,
                cancellationReason: subscription.cancellation_reason,
                createdAt: subscription.created_at,
                updatedAt: subscription.updated_at,
                plan: {
                    id: subscription.subscription_plans[0]?.id,
                    name: subscription.subscription_plans[0]?.name,
                    description: subscription.subscription_plans[0]?.description,
                    planType: subscription.subscription_plans[0]?.plan_type,
                    price: subscription.subscription_plans[0]?.price,
                    currency: subscription.subscription_plans[0]?.currency,
                    billingCycle: subscription.subscription_plans[0]?.billing_cycle,
                    features: subscription.subscription_plans[0]?.features,
                    limits: subscription.subscription_plans[0]?.limits,
                },
                invoices: invoices || [],
                userRole: membership.role,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get subscription error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const subscriptionId = params.id;
        const body = await req.json();
        const updateData = UpdateSubscriptionSchema.parse(body);

        // Get subscription details first
        const { data: subscription, error: subscriptionError } = await supabase
            .from("tenant_subscriptions")
            .select("tenant_id")
            .eq("id", subscriptionId)
            .single();

        if (subscriptionError) {
            if (subscriptionError.code === "PGRST116") {
                return problem({
                    status: 404,
                    title: "Subscription not found",
                    code: "SUBSCRIPTION_NOT_FOUND",
                    detail: "The requested subscription does not exist",
                    requestId: ctx.requestId,
                });
            }

            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch subscription",
                requestId: ctx.requestId,
            });
        }

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", subscription.tenant_id)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this subscription",
                requestId: ctx.requestId,
            });
        }

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can update subscriptions",
                requestId: ctx.requestId,
            });
        }

        // Update subscription
        const { data: updatedSubscription, error: updateError } = await supabase
            .from("tenant_subscriptions")
            .update({
                ...updateData,
                updated_at: new Date().toISOString(),
            })
            .eq("id", subscriptionId)
            .select()
            .single();

        if (updateError) {
            return problem({
                status: 500,
                title: "Failed to update subscription",
                code: "SUBSCRIPTION_UPDATE_FAILED",
                detail: updateError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                id: updatedSubscription.id,
                status: updatedSubscription.status,
                startDate: updatedSubscription.start_date,
                endDate: updatedSubscription.end_date,
                nextBillingDate: updatedSubscription.next_billing_date,
                autoRenew: updatedSubscription.auto_renew,
                billingAddress: updatedSubscription.billing_address,
                trialEndsAt: updatedSubscription.trial_ends_at,
                cancelledAt: updatedSubscription.cancelled_at,
                cancellationReason: updatedSubscription.cancellation_reason,
                createdAt: updatedSubscription.created_at,
                updatedAt: updatedSubscription.updated_at,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Update subscription error:", error);

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const subscriptionId = params.id;
        const body = await req.json();
        const { reason, effectiveDate } = CancelSubscriptionSchema.parse(body);

        // Get subscription details first
        const { data: subscription, error: subscriptionError } = await supabase
            .from("tenant_subscriptions")
            .select("tenant_id, status")
            .eq("id", subscriptionId)
            .single();

        if (subscriptionError) {
            if (subscriptionError.code === "PGRST116") {
                return problem({
                    status: 404,
                    title: "Subscription not found",
                    code: "SUBSCRIPTION_NOT_FOUND",
                    detail: "The requested subscription does not exist",
                    requestId: ctx.requestId,
                });
            }

            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch subscription",
                requestId: ctx.requestId,
            });
        }

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", subscription.tenant_id)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this subscription",
                requestId: ctx.requestId,
            });
        }

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can cancel subscriptions",
                requestId: ctx.requestId,
            });
        }

        if (subscription.status === "CANCELLED") {
            return problem({
                status: 409,
                title: "Subscription already cancelled",
                code: "SUBSCRIPTION_ALREADY_CANCELLED",
                detail: "This subscription has already been cancelled",
                requestId: ctx.requestId,
            });
        }

        // Cancel subscription
        const cancellationDate = effectiveDate || new Date();
        const { data: cancelledSubscription, error: cancelError } = await supabase
            .from("tenant_subscriptions")
            .update({
                status: "CANCELLED",
                cancelled_at: cancellationDate.toISOString(),
                cancelled_by: ctx.userId,
                cancellation_reason: reason,
                auto_renew: false,
                updated_at: new Date().toISOString(),
            })
            .eq("id", subscriptionId)
            .select()
            .single();

        if (cancelError) {
            return problem({
                status: 500,
                title: "Failed to cancel subscription",
                code: "SUBSCRIPTION_CANCEL_FAILED",
                detail: cancelError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                message: "Subscription cancelled successfully",
                id: cancelledSubscription.id,
                status: cancelledSubscription.status,
                cancelledAt: cancelledSubscription.cancelled_at,
                cancellationReason: cancelledSubscription.cancellation_reason,
                effectiveDate: cancellationDate.toISOString(),
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Cancel subscription error:", error);

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
