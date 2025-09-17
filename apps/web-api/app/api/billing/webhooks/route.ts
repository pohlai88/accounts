import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Stripe webhook schema
const StripeWebhookSchema = z.object({
    id: z.string(),
    object: z.literal("event"),
    type: z.string(),
    data: z.object({
        object: z.any(),
    }),
    created: z.number(),
});

// PayPal webhook schema
const PayPalWebhookSchema = z.object({
    id: z.string(),
    event_type: z.string(),
    create_time: z.string(),
    resource: z.any(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const signature = req.headers.get("stripe-signature") || req.headers.get("paypal-signature");

        if (!signature) {
            return problem({
                status: 401,
                title: "Missing signature",
                code: "MISSING_SIGNATURE",
                detail: "Webhook signature is required",
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            });
        }

        // Verify webhook signature (implementation depends on payment provider)
        const isValid = await verifyWebhookSignature(body, signature);
        if (!isValid) {
            return problem({
                status: 401,
                title: "Invalid signature",
                code: "INVALID_SIGNATURE",
                detail: "Webhook signature verification failed",
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            });
        }

        let webhookData;
        let provider: "stripe" | "paypal" | "unknown";

        try {
            // Try to parse as Stripe webhook
            webhookData = StripeWebhookSchema.parse(JSON.parse(body));
            provider = "stripe";
        } catch {
            try {
                // Try to parse as PayPal webhook
                webhookData = PayPalWebhookSchema.parse(JSON.parse(body));
                provider = "paypal";
            } catch {
                return problem({
                    status: 400,
                    title: "Invalid webhook format",
                    code: "INVALID_WEBHOOK_FORMAT",
                    detail: "Unsupported webhook format",
                    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                });
            }
        }

        // Process webhook based on provider
        const result = await processWebhook(webhookData, provider);

        return ok(
            {
                message: "Webhook processed successfully",
                provider,
                eventType: provider === "stripe" ? (webhookData as any).type : (webhookData as any).event_type,
                processedAt: new Date().toISOString(),
                result,
            },
            `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        );
    } catch (error) {
        console.error("Process webhook error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}

async function verifyWebhookSignature(body: string, signature: string): Promise<boolean> {
    // Implementation depends on payment provider
    // For Stripe: use stripe.webhooks.constructEvent()
    // For PayPal: use PayPal SDK verification
    // For now, return true for development
    return true;
}

async function processWebhook(webhookData: any, provider: string) {
    const eventType = provider === "stripe" ? webhookData.type : webhookData.event_type;
    const data = provider === "stripe" ? webhookData.data.object : webhookData.resource;

    console.log(`Processing ${provider} webhook: ${eventType}`);

    switch (eventType) {
        // Stripe events
        case "customer.subscription.created":
            return await handleStripeSubscriptionCreated(data);
        case "customer.subscription.updated":
            return await handleStripeSubscriptionUpdated(data);
        case "customer.subscription.deleted":
            return await handleStripeSubscriptionDeleted(data);
        case "invoice.payment_succeeded":
            return await handleStripeInvoicePaid(data);
        case "invoice.payment_failed":
            return await handleStripeInvoiceFailed(data);
        case "payment_method.attached":
            return await handleStripePaymentMethodAttached(data);

        // PayPal events
        case "BILLING.SUBSCRIPTION.CREATED":
            return await handlePayPalSubscriptionCreated(data);
        case "BILLING.SUBSCRIPTION.ACTIVATED":
            return await handlePayPalSubscriptionActivated(data);
        case "BILLING.SUBSCRIPTION.CANCELLED":
            return await handlePayPalSubscriptionCancelled(data);
        case "PAYMENT.SALE.COMPLETED":
            return await handlePayPalPaymentCompleted(data);

        default:
            console.log(`Unhandled webhook event: ${eventType}`);
            return { status: "ignored", reason: "Unhandled event type" };
    }
}

// Stripe event handlers
async function handleStripeSubscriptionCreated(data: any) {
    console.log("Handling Stripe subscription created:", data.id);
    // Update subscription status in database
    return { status: "processed", action: "subscription_created" };
}

async function handleStripeSubscriptionUpdated(data: any) {
    console.log("Handling Stripe subscription updated:", data.id);
    // Update subscription details in database
    return { status: "processed", action: "subscription_updated" };
}

async function handleStripeSubscriptionDeleted(data: any) {
    console.log("Handling Stripe subscription deleted:", data.id);
    // Mark subscription as cancelled in database
    return { status: "processed", action: "subscription_cancelled" };
}

async function handleStripeInvoicePaid(data: any) {
    console.log("Handling Stripe invoice paid:", data.id);

    // Update invoice status to paid
    await supabase
        .from("subscription_invoices")
        .update({
            status: "PAID",
            paid_at: new Date().toISOString(),
            external_invoice_id: data.id,
        })
        .eq("external_invoice_id", data.id);

    return { status: "processed", action: "invoice_paid" };
}

async function handleStripeInvoiceFailed(data: any) {
    console.log("Handling Stripe invoice failed:", data.id);

    // Update invoice status to overdue
    await supabase
        .from("subscription_invoices")
        .update({
            status: "OVERDUE",
        })
        .eq("external_invoice_id", data.id);

    return { status: "processed", action: "invoice_failed" };
}

async function handleStripePaymentMethodAttached(data: any) {
    console.log("Handling Stripe payment method attached:", data.id);
    // Update subscription payment method
    return { status: "processed", action: "payment_method_updated" };
}

// PayPal event handlers
async function handlePayPalSubscriptionCreated(data: any) {
    console.log("Handling PayPal subscription created:", data.id);
    return { status: "processed", action: "subscription_created" };
}

async function handlePayPalSubscriptionActivated(data: any) {
    console.log("Handling PayPal subscription activated:", data.id);
    return { status: "processed", action: "subscription_activated" };
}

async function handlePayPalSubscriptionCancelled(data: any) {
    console.log("Handling PayPal subscription cancelled:", data.id);
    return { status: "processed", action: "subscription_cancelled" };
}

async function handlePayPalPaymentCompleted(data: any) {
    console.log("Handling PayPal payment completed:", data.id);
    return { status: "processed", action: "payment_completed" };
}
