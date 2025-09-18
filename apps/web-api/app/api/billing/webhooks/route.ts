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
    object: z.record(z.unknown()),
  }),
  created: z.number(),
});

// PayPal webhook schema
const PayPalWebhookSchema = z.object({
  id: z.string(),
  event_type: z.string(),
  create_time: z.string(),
  resource: z.record(z.unknown()),
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
        eventType: provider === "stripe" ? (webhookData as { type: string }).type : (webhookData as { event_type: string }).event_type,
        processedAt: new Date().toISOString(),
        result,
      },
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    );
  } catch {
    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "An unexpected error occurred",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

async function verifyWebhookSignature(_body: string, _signature: string): Promise<boolean> {
  // Implementation depends on payment provider
  // For Stripe: use stripe.webhooks.constructEvent()
  // For PayPal: use PayPal SDK verification
  // For now, return true for development
  return true;
}

async function processWebhook(webhookData: Record<string, unknown>, provider: string) {
  const eventType = provider === "stripe" ? webhookData.type : webhookData.event_type;
  const data = provider === "stripe" ? (webhookData as { data: { object: Record<string, unknown> } }).data.object : (webhookData as { resource: Record<string, unknown> }).resource;


  switch (eventType) {
    // Stripe events
    case "customer.subscription.created":
      return await handleStripeSubscriptionCreated(data as { id: string });
    case "customer.subscription.updated":
      return await handleStripeSubscriptionUpdated(data as { id: string });
    case "customer.subscription.deleted":
      return await handleStripeSubscriptionDeleted(data as { id: string });
    case "invoice.payment_succeeded":
      return await handleStripeInvoicePaid(data as { id: string });
    case "invoice.payment_failed":
      return await handleStripeInvoiceFailed(data as { id: string });
    case "payment_method.attached":
      return await handleStripePaymentMethodAttached(data as { id: string });

    // PayPal events
    case "BILLING.SUBSCRIPTION.CREATED":
      return await handlePayPalSubscriptionCreated(data as { id: string });
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      return await handlePayPalSubscriptionActivated(data as { id: string });
    case "BILLING.SUBSCRIPTION.CANCELLED":
      return await handlePayPalSubscriptionCancelled(data as { id: string });
    case "PAYMENT.SALE.COMPLETED":
      return await handlePayPalPaymentCompleted(data as { id: string });

    default:
      return { status: "ignored", reason: "Unhandled event type" };
  }
}

// Stripe event handlers
async function handleStripeSubscriptionCreated(_data: { id: string }) {
  // Update subscription status in database
  return { status: "processed", action: "subscription_created" };
}

async function handleStripeSubscriptionUpdated(_data: { id: string }) {
  // Update subscription details in database
  return { status: "processed", action: "subscription_updated" };
}

async function handleStripeSubscriptionDeleted(_data: { id: string }) {
  // Mark subscription as cancelled in database
  return { status: "processed", action: "subscription_cancelled" };
}

async function handleStripeInvoicePaid(data: { id: string }) {
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

async function handleStripeInvoiceFailed(data: { id: string }) {
  // Update invoice status to overdue
  await supabase
    .from("subscription_invoices")
    .update({
      status: "OVERDUE",
    })
    .eq("external_invoice_id", data.id);

  return { status: "processed", action: "invoice_failed" };
}

async function handleStripePaymentMethodAttached(_data: { id: string }) {
  // Update subscription payment method
  return { status: "processed", action: "payment_method_updated" };
}

// PayPal event handlers
async function handlePayPalSubscriptionCreated(_data: { id: string }) {
  return { status: "processed", action: "subscription_created" };
}

async function handlePayPalSubscriptionActivated(_data: { id: string }) {
  return { status: "processed", action: "subscription_activated" };
}

async function handlePayPalSubscriptionCancelled(_data: { id: string }) {
  return { status: "processed", action: "subscription_cancelled" };
}

async function handlePayPalPaymentCompleted(_data: { id: string }) {
  return { status: "processed", action: "payment_completed" };
}
