/**
 * REST API Endpoint: Suppliers
 * Full CRUD operations for Supplier management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const supplierSchema = z.object({
  supplier_name: z.string().min(1, "Supplier name is required"),
  supplier_type: z.enum(["Individual", "Company"]).default("Company"),
  supplier_group: z.string().optional(),
  country: z.string().optional(),
  tax_id: z.string().optional(),
  website: z.string().url().optional(),
  supplier_details: z.string().optional(),
  default_currency: z.string().default("USD"),
  payment_terms: z.string().optional(),
  is_internal_supplier: z.boolean().default(false),
  represents_company: z.string().optional(),
  disabled: z.boolean().default(false),
});

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 50)),
  offset: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val) : 0)),
  search: z.string().optional(),
  supplier_type: z.enum(["Individual", "Company"]).optional(),
  disabled: z
    .string()
    .optional()
    .transform(val => val === "true"),
  sort_by: z.enum(["supplier_name", "created_at", "modified"]).default("supplier_name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET /api/v1/suppliers
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("suppliers")
      .select(
        `
        id,
        supplier_name,
        supplier_code,
        supplier_type,
        supplier_group,
        country,
        tax_id,
        website,
        supplier_details,
        default_currency,
        payment_terms,
        is_internal_supplier,
        represents_company,
        disabled,
        created_at,
        modified
      `,
      )
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.search) {
      query = query.or(
        `supplier_name.ilike.%${params.search}%,supplier_code.ilike.%${params.search}%,tax_id.ilike.%${params.search}%`,
      );
    }

    if (params.supplier_type) {
      query = query.eq("supplier_type", params.supplier_type);
    }

    if (params.disabled !== undefined) {
      query = query.eq("disabled", params.disabled);
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: suppliers, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch suppliers", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: suppliers,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/suppliers error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/v1/suppliers
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = supplierSchema.parse(body);

    // Generate supplier code
    const supplierCode = await generateSupplierCode();

    const { data: supplier, error } = await supabase
      .from("suppliers")
      .insert({
        ...validatedData,
        supplier_code: supplierCode,
      })
      .select(
        `
        id,
        supplier_name,
        supplier_code,
        supplier_type,
        supplier_group,
        country,
        tax_id,
        website,
        supplier_details,
        default_currency,
        payment_terms,
        is_internal_supplier,
        represents_company,
        disabled,
        created_at,
        modified
      `,
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create supplier", details: error.message },
        { status: 500 },
      );
    }

    // Trigger webhook
    await triggerWebhook("supplier.created", supplier);

    return NextResponse.json(
      {
        data: supplier,
        message: "Supplier created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/suppliers error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Generate unique supplier code
 */
async function generateSupplierCode(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_supplier_code");

  if (error) {
    // Fallback to timestamp-based code
    const timestamp = Date.now().toString(36).toUpperCase();
    return `SUPP-${timestamp}`;
  }

  return data;
}

/**
 * Trigger webhook for external systems
 */
async function triggerWebhook(event: string, data: any) {
  try {
    // Get registered webhooks for this event
    const { data: webhooks } = await supabase
      .from("webhook_endpoints")
      .select("url, secret, is_active")
      .eq("events", event)
      .eq("is_active", true);

    if (!webhooks || webhooks.length === 0) {
      return;
    }

    // Send webhook notifications
    const promises = webhooks.map(async webhook => {
      try {
        const payload = {
          event,
          data,
          timestamp: new Date().toISOString(),
          webhook_id: webhook.id,
        };

        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Modern-Accounting-SaaS/1.0",
            "X-Webhook-Signature": await generateWebhookSignature(payload, webhook.secret),
          },
          body: JSON.stringify(payload),
        });

        // Log webhook delivery
        await supabase.from("webhook_deliveries").insert({
          webhook_endpoint_id: webhook.id,
          event,
          payload: payload,
          response_status: response.status,
          response_body: await response.text(),
          delivered_at: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Webhook delivery failed for ${webhook.url}:`, error);
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("Webhook trigger error:", error);
  }
}

/**
 * Generate webhook signature for verification
 */
async function generateWebhookSignature(payload: any, secret: string): Promise<string> {
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest("hex")}`;
}
