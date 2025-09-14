/**
 * REST API Endpoint: Sales Invoices
 * Full CRUD operations for Invoice management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const invoiceItemSchema = z.object({
  item_code: z.string().min(1, "Item code is required"),
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  qty: z.number().min(0.001, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate cannot be negative"),
  amount: z.number().optional(), // Will be calculated
  uom: z.string().optional(),
  warehouse: z.string().optional(),
});

const invoiceSchema = z.object({
  customer_id: z.string().min(1, "Customer is required"),
  posting_date: z.string().min(1, "Posting date is required"),
  due_date: z.string().optional(),
  currency: z.string().default("USD"),
  conversion_rate: z.number().min(0.000001).default(1),
  po_no: z.string().optional(),
  po_date: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
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
  customer_id: z.string().optional(),
  status: z.enum(["Draft", "Submitted", "Paid", "Unpaid", "Overdue", "Cancelled"]).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(["posting_date", "grand_total", "outstanding_amount"]).default("posting_date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/v1/invoices
 * Retrieve invoices with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("sales_invoices")
      .select(
        `
        id,
        invoice_no,
        customer_id,
        customer_name,
        posting_date,
        due_date,
        currency,
        conversion_rate,
        po_no,
        po_date,
        status,
        docstatus,
        total_qty,
        base_total,
        base_net_total,
        total,
        net_total,
        total_taxes_and_charges,
        base_total_taxes_and_charges,
        base_grand_total,
        base_rounded_total,
        grand_total,
        rounded_total,
        outstanding_amount,
        terms,
        created_at,
        modified,
        items:sales_invoice_items(
          id,
          item_code,
          item_name,
          description,
          qty,
          rate,
          amount,
          uom,
          warehouse
        )
      `,
      )
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.customer_id) {
      query = query.eq("customer_id", params.customer_id);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.from_date) {
      query = query.gte("posting_date", params.from_date);
    }

    if (params.to_date) {
      query = query.lte("posting_date", params.to_date);
    }

    if (params.search) {
      query = query.or(
        `invoice_no.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,po_no.ilike.%${params.search}%`,
      );
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: invoices, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch invoices", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: invoices,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/invoices error:", error);

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
 * POST /api/v1/invoices
 * Create a new invoice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Generate invoice number
    const invoiceNo = await generateInvoiceNumber();

    // Calculate totals
    const totals = calculateInvoiceTotals(validatedData.items, validatedData.conversion_rate);

    // Create invoice in a transaction
    const { data, error } = await supabase.rpc("create_sales_invoice", {
      p_invoice_data: {
        invoice_no: invoiceNo,
        customer_id: validatedData.customer_id,
        posting_date: validatedData.posting_date,
        due_date: validatedData.due_date || calculateDueDate(validatedData.posting_date),
        currency: validatedData.currency,
        conversion_rate: validatedData.conversion_rate,
        po_no: validatedData.po_no,
        po_date: validatedData.po_date,
        terms: validatedData.terms,
        ...totals,
      },
      p_items: validatedData.items.map((item, index) => ({
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        amount: item.qty * item.rate,
        uom: item.uom,
        warehouse: item.warehouse,
        idx: index + 1,
      })),
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create invoice", details: error.message },
        { status: 500 },
      );
    }

    // Fetch the created invoice with items
    const { data: invoice, error: fetchError } = await supabase
      .from("sales_invoices")
      .select(
        `
        id,
        invoice_no,
        customer_id,
        customer_name,
        posting_date,
        due_date,
        currency,
        conversion_rate,
        po_no,
        po_date,
        status,
        docstatus,
        grand_total,
        outstanding_amount,
        terms,
        created_at,
        modified,
        items:sales_invoice_items(
          id,
          item_code,
          item_name,
          description,
          qty,
          rate,
          amount,
          uom,
          warehouse
        )
      `,
      )
      .eq("id", data)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Invoice created but failed to fetch details", details: fetchError.message },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        data: invoice,
        message: "Invoice created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/invoices error:", error);

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
 * Generate unique invoice number
 */
async function generateInvoiceNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_invoice_number");

  if (error) {
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString(36).toUpperCase();
    return `INV-${timestamp}`;
  }

  return data;
}

/**
 * Calculate invoice totals
 */
function calculateInvoiceTotals(items: any[], conversionRate: number) {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const baseTotal = total * conversionRate;

  return {
    total_qty: totalQty,
    total: total,
    net_total: total,
    base_total: baseTotal,
    base_net_total: baseTotal,
    grand_total: total,
    base_grand_total: baseTotal,
    rounded_total: Math.round(total),
    base_rounded_total: Math.round(baseTotal),
    outstanding_amount: total, // Initially equals grand total
    total_taxes_and_charges: 0,
    base_total_taxes_and_charges: 0,
  };
}

/**
 * Calculate due date based on customer payment terms
 */
function calculateDueDate(postingDate: string): string {
  const date = new Date(postingDate);
  date.setDate(date.getDate() + 30); // Default 30 days
  return date.toISOString().split("T")[0];
}
