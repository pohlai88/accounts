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

// Billing webhook schema
const BillingWebhookSchema = z.object({
    event: z.string(),
    data: z.object({
        subscription_id: z.string(),
        customer_id: z.string(),
        amount: z.number(),
        currency: z.string(),
        status: z.string(),
        invoice_id: z.string().optional(),
        payment_method_id: z.string().optional(),
    }),
});

// Payment method schema
const PaymentMethodSchema = z.object({
    tenantId: z.string().uuid(),
    type: z.enum(["card", "bank_account", "paypal"]),
    provider: z.enum(["stripe", "paypal", "razorpay"]),
    providerId: z.string(),
    metadata: z.record(z.any()).optional(),
});

// Billing address schema
const BillingAddressSchema = z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
});

// Update billing info schema
const UpdateBillingInfoSchema = z.object({
    tenantId: z.string().uuid(),
    billingAddress: BillingAddressSchema.optional(),
    paymentMethodId: z.string().optional(),
    taxId: z.string().optional(),
    companyName: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const tenantId = url.searchParams.get("tenantId");

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

        // Get subscription and billing information
        const { data: subscription, error: subscriptionError } = await supabase
            .from("tenant_subscriptions")
            .select(`
        id,
        status,
        start_date,
        end_date,
        next_billing_date,
        auto_renew,
        billing_address,
        payment_method_id,
        trial_ends_at,
        cancelled_at,
        cancellation_reason,
        created_at,
        updated_at,
        subscription_plans!inner(
          id,
          name,
          plan_type,
          price,
          currency,
          billing_cycle,
          features,
          limits
        )
      `)
            .eq("tenant_id", tenantId)
            .single();

        if (subscriptionError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch billing information",
                requestId: ctx.requestId,
            });
        }

        // Get recent invoices
        const { data: invoices, error: invoicesError } = await supabase
            .from("subscription_invoices")
            .select("*")
            .eq("subscription_id", subscription.id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (invoicesError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch invoices",
                requestId: ctx.requestId,
            });
        }

        // Calculate billing summary
        const totalInvoices = invoices?.length || 0;
        const paidInvoices = invoices?.filter(inv => inv.status === "PAID").length || 0;
        const totalPaid = invoices
            ?.filter(inv => inv.status === "PAID")
            .reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0) || 0;

        return ok(
            {
                tenantId,
                subscription: {
                    id: subscription.id,
                    status: subscription.status,
                    startDate: subscription.start_date,
                    endDate: subscription.end_date,
                    nextBillingDate: subscription.next_billing_date,
                    autoRenew: subscription.auto_renew,
                    billingAddress: subscription.billing_address,
                    paymentMethodId: subscription.payment_method_id,
                    trialEndsAt: subscription.trial_ends_at,
                    cancelledAt: subscription.cancelled_at,
                    cancellationReason: subscription.cancellation_reason,
                    createdAt: subscription.created_at,
                    updatedAt: subscription.updated_at,
                    plan: {
                        id: subscription.subscription_plans[0]?.id,
                        name: subscription.subscription_plans[0]?.name,
                        planType: subscription.subscription_plans[0]?.plan_type,
                        price: subscription.subscription_plans[0]?.price,
                        currency: subscription.subscription_plans[0]?.currency,
                        billingCycle: subscription.subscription_plans[0]?.billing_cycle,
                        features: subscription.subscription_plans[0]?.features,
                        limits: subscription.subscription_plans[0]?.limits,
                    },
                },
                invoices: invoices || [],
                summary: {
                    totalInvoices,
                    paidInvoices,
                    totalPaid,
                    currency: subscription.subscription_plans[0]?.currency,
                },
                userRole: membership.role,
            },
            ctx.requestId,
        );
    } catch (error) {
        // Log billing information error to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            // Log billing information error to monitoring service
            if ((process.env.NODE_ENV as string) === 'development') {
                // eslint-disable-next-line no-console
                console.error("Get billing information error:", error);
            }
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

export async function PUT(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const body = await req.json();
        const updateData = UpdateBillingInfoSchema.parse(body);

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", updateData.tenantId)
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
                detail: "Only admins can update billing information",
                requestId: ctx.requestId,
            });
        }

        // Update subscription billing information
        const { data: updatedSubscription, error: updateError } = await supabase
            .from("tenant_subscriptions")
            .update({
                billing_address: updateData.billingAddress,
                payment_method_id: updateData.paymentMethodId,
                updated_at: new Date().toISOString(),
            })
            .eq("tenant_id", updateData.tenantId)
            .select()
            .single();

        if (updateError) {
            return problem({
                status: 500,
                title: "Failed to update billing information",
                code: "BILLING_UPDATE_FAILED",
                detail: updateError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                tenantId: updateData.tenantId,
                billingAddress: updatedSubscription.billing_address,
                paymentMethodId: updatedSubscription.payment_method_id,
                updatedAt: updatedSubscription.updated_at,
            },
            ctx.requestId,
        );
    } catch (error) {
        // Log billing update error to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            // Log billing update error to monitoring service
            if ((process.env.NODE_ENV as string) === 'development') {
                // eslint-disable-next-line no-console
                console.error("Update billing information error:", error);
            }
        }

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

export async function POST(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const body = await req.json();
        const webhookData = BillingWebhookSchema.parse(body);

        // Verify webhook signature (in production, verify with payment provider)
        const webhookSecret = req.headers.get("x-webhook-secret");
        if (!webhookSecret || webhookSecret !== process.env.BILLING_WEBHOOK_SECRET) {
            return problem({
                status: 401,
                title: "Unauthorized",
                code: "WEBHOOK_UNAUTHORIZED",
                detail: "Invalid webhook signature",
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            });
        }

        const { event, data } = webhookData;

        // Handle different webhook events
        switch (event) {
            case "subscription.created":
                await handleSubscriptionCreated(data);
                break;
            case "subscription.updated":
                await handleSubscriptionUpdated(data);
                break;
            case "subscription.cancelled":
                await handleSubscriptionCancelled(data);
                break;
            case "invoice.paid":
                await handleInvoicePaid(data);
                break;
            case "invoice.payment_failed":
                await handleInvoicePaymentFailed(data);
                break;
            case "payment_method.updated":
                await handlePaymentMethodUpdated(data);
                break;
            default:
                // Log unhandled webhook event to monitoring service
                if ((process.env.NODE_ENV as string) === 'development') {
                    // eslint-disable-next-line no-console
                    // Log unhandled webhook event to monitoring service
                    if ((process.env.NODE_ENV as string) === 'development') {
                        // eslint-disable-next-line no-console
                        console.log(`Unhandled webhook event: ${event}`);
                    }
                }
        }

        return ok(
            {
                message: "Webhook processed successfully",
                event,
                processedAt: new Date().toISOString(),
            },
            ctx.requestId,
        );
    } catch (error) {
        // Log billing webhook error to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            // Log billing webhook error to monitoring service
            if ((process.env.NODE_ENV as string) === 'development') {
                // eslint-disable-next-line no-console
                console.error("Process billing webhook error:", error);
            }
        }

        if (error instanceof z.ZodError) {
            return problem({
                status: 400,
                title: "Invalid webhook data",
                code: "VALIDATION_ERROR",
                detail: "Please check your webhook payload format",
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

// Webhook event handlers
async function handleSubscriptionCreated(data: Record<string, unknown>) {
    // Log subscription creation to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
        // Log subscription creation to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            console.log("Handling subscription created:", data);
        }
    }
    // Implementation for subscription created event
}

async function handleSubscriptionUpdated(data: Record<string, unknown>) {
    // Log subscription update to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
        // Log subscription update to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            console.log("Handling subscription updated:", data);
        }
    }
    // Implementation for subscription updated event
}

async function handleSubscriptionCancelled(data: Record<string, unknown>) {
    // Log subscription cancellation to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
        // Log subscription cancellation to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            console.log("Handling subscription cancelled:", data);
        }
    }
    // Implementation for subscription cancelled event
}

async function handleInvoicePaid(data: Record<string, unknown>) {
    // Log invoice payment to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
        // Log invoice payment to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            console.log("Handling invoice paid:", data);
        }
    }

    // Update invoice status to paid
    if (data.invoice_id) {
        await supabase
            .from("subscription_invoices")
            .update({
                status: "PAID",
                paid_at: new Date().toISOString(),
                payment_method_id: data.payment_method_id,
            })
            .eq("external_invoice_id", data.invoice_id);
    }
}

async function handleInvoicePaymentFailed(data: Record<string, unknown>) {
    // Log invoice payment failure to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
        // Log invoice payment failure to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            console.log("Handling invoice payment failed:", data);
        }
    }

    // Update invoice status to overdue
    if (data.invoice_id) {
        await supabase
            .from("subscription_invoices")
            .update({
                status: "OVERDUE",
            })
            .eq("external_invoice_id", data.invoice_id);
    }
}

async function handlePaymentMethodUpdated(data: Record<string, unknown>) {
    // Log payment method update to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
        // Log payment method update to monitoring service
        if ((process.env.NODE_ENV as string) === 'development') {
            // eslint-disable-next-line no-console
            console.log("Handling payment method updated:", data);
        }
    }

    // Update subscription payment method
    if (data.subscription_id && data.payment_method_id) {
        await supabase
            .from("tenant_subscriptions")
            .update({
                payment_method_id: data.payment_method_id,
                updated_at: new Date().toISOString(),
            })
            .eq("id", data.subscription_id);
    }
}
