/**
 * REST API Endpoint: Customers
 * Full CRUD operations for Customer management
 * ERPNext/Odoo Integration Compatible
 */
// @ts-nocheck


import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const customerSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_type: z.enum(["Individual", "Company"]).default("Company"),
  customer_group: z.string().optional(),
  territory: z.string().optional(),
  tax_id: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  market_segment: z.string().optional(),
  language: z.string().default("en"),
  default_currency: z.string().default("USD"),
  credit_limit: z.number().min(0).default(0),
  payment_terms: z.string().optional(),
  is_internal_customer: z.boolean().default(false),
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
  customer_type: z.enum(["Individual", "Company"]).optional(),
  disabled: z
    .string()
    .optional()
    .transform(val => val === "true"),
  sort_by: z.enum(["customer_name", "created_at", "modified"]).default("customer_name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET /api/v1/customers
 * Retrieve customers with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("customers")
      .select(
        `
        id,
        customer_name,
        customer_code,
        customer_type,
        customer_group,
        territory,
        tax_id,
        website,
        industry,
        market_segment,
        language,
        default_currency,
        credit_limit,
        payment_terms,
        is_internal_customer,
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
        `customer_name.ilike.%${params.search}%,customer_code.ilike.%${params.search}%,tax_id.ilike.%${params.search}%`,
      );
    }

    if (params.customer_type) {
      query = query.eq("customer_type", params.customer_type);
    }

    if (params.disabled !== undefined) {
      query = query.eq("disabled", params.disabled);
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: customers, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch customers", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: customers,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/customers error:", error);

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
 * POST /api/v1/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = customerSchema.parse(body);

    // Generate customer code
    const customerCode = await generateCustomerCode();

    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        ...validatedData,
        customer_code: customerCode,
      })
      .select(
        `
        id,
        customer_name,
        customer_code,
        customer_type,
        customer_group,
        territory,
        tax_id,
        website,
        industry,
        market_segment,
        language,
        default_currency,
        credit_limit,
        payment_terms,
        is_internal_customer,
        represents_company,
        disabled,
        created_at,
        modified
      `,
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create customer", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        data: customer,
        message: "Customer created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/customers error:", error);

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
 * Generate unique customer code
 */
async function generateCustomerCode(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_customer_code");

  if (error) {
    // Fallback to timestamp-based code
    const timestamp = Date.now().toString(36).toUpperCase();
    return `CUST-${timestamp}`;
  }

  return data;
}
