/**
 * REST API Endpoint: Individual Customer Operations
 * GET, PUT, DELETE operations for specific customer
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schema for updates
const updateCustomerSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required").optional(),
  customer_type: z.enum(["Individual", "Company"]).optional(),
  customer_group: z.string().optional(),
  territory: z.string().optional(),
  tax_id: z.string().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  market_segment: z.string().optional(),
  language: z.string().optional(),
  default_currency: z.string().optional(),
  credit_limit: z.number().min(0).optional(),
  payment_terms: z.string().optional(),
  is_internal_customer: z.boolean().optional(),
  represents_company: z.string().optional(),
  disabled: z.boolean().optional(),
});

/**
 * GET /api/v1/customers/[id]
 * Retrieve a specific customer by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;

    if (!customerId || customerId === "undefined") {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const { data: customer, error } = await supabase
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
        modified,
        addresses:customer_addresses(
          id,
          address_title,
          address_type,
          address_line1,
          address_line2,
          city,
          state,
          country,
          pincode,
          is_primary_address,
          is_shipping_address
        ),
        contacts:customer_contacts(
          id,
          contact_name,
          designation,
          phone,
          mobile,
          email,
          is_primary_contact
        )
      `,
      )
      .eq("id", customerId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      return NextResponse.json(
        { error: "Failed to fetch customer", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: customer,
    });
  } catch (error) {
    console.error("GET /api/v1/customers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/v1/customers/[id]
 * Update a specific customer
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;

    if (!customerId || customerId === "undefined") {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = updateCustomerSchema.parse(body);

    const { data: customer, error } = await supabase
      .from("customers")
      .update({
        ...validatedData,
        modified: new Date().toISOString(),
      })
      .eq("id", customerId)
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
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      return NextResponse.json(
        { error: "Failed to update customer", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: customer,
      message: "Customer updated successfully",
    });
  } catch (error) {
    console.error("PUT /api/v1/customers/[id] error:", error);

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
 * DELETE /api/v1/customers/[id]
 * Soft delete a customer (set disabled = true)
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customerId = params.id;

    if (!customerId || customerId === "undefined") {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    // Check if customer has any transactions
    const { data: invoices, error: invoiceError } = await supabase
      .from("sales_invoices")
      .select("id")
      .eq("customer_id", customerId)
      .limit(1);

    if (invoiceError) {
      return NextResponse.json({ error: "Failed to check customer transactions" }, { status: 500 });
    }

    if (invoices && invoices.length > 0) {
      // Soft delete - customer has transactions
      const { data: customer, error } = await supabase
        .from("customers")
        .update({
          disabled: true,
          modified: new Date().toISOString(),
        })
        .eq("id", customerId)
        .select("id, customer_name, disabled")
        .single();

      if (error) {
        return NextResponse.json(
          { error: "Failed to disable customer", details: error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        data: customer,
        message: "Customer disabled successfully (has existing transactions)",
      });
    } else {
      // Hard delete - no transactions
      const { error } = await supabase.from("customers").delete().eq("id", customerId);

      if (error) {
        return NextResponse.json(
          { error: "Failed to delete customer", details: error.message },
          { status: 500 },
        );
      }

      return NextResponse.json({
        message: "Customer deleted successfully",
      });
    }
  } catch (error) {
    console.error("DELETE /api/v1/customers/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
