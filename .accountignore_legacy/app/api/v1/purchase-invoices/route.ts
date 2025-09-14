/**
 * REST API Endpoint: Purchase Invoices
 * Full CRUD operations for Purchase Invoice management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const purchaseInvoiceItemSchema = z.object({
  item_code: z.string().min(1, "Item code is required"),
  item_name: z.string().min(1, "Item name is required"),
  description: z.string().optional(),
  qty: z.number().min(0.001, "Quantity must be greater than 0"),
  rate: z.number().min(0, "Rate cannot be negative"),
  amount: z.number().optional(), // Will be calculated
  uom: z.string().optional(),
  warehouse: z.string().optional(),
  expense_account: z.string().optional(),
  tax_amount: z.number().min(0).default(0),
});

const purchaseInvoiceSchema = z.object({
  supplier_id: z.string().min(1, "Supplier is required"),
  posting_date: z.string().min(1, "Posting date is required"),
  due_date: z.string().optional(),
  currency: z.string().default("USD"),
  conversion_rate: z.number().min(0.000001).default(1),
  supplier_invoice: z.string().optional(),
  supplier_invoice_date: z.string().optional(),
  credit_to: z.string().optional(),
  terms: z.string().optional(),
  items: z.array(purchaseInvoiceItemSchema).min(1, "At least one item is required"),
  update_stock: z.boolean().default(true),
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
  supplier_id: z.string().optional(),
  status: z.enum(["Draft", "Submitted", "Paid", "Unpaid", "Overdue", "Cancelled"]).optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(["posting_date", "grand_total", "outstanding_amount"]).default("posting_date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/v1/purchase-invoices
 * Retrieve purchase invoices with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("purchase_invoices")
      .select(
        `
                id,
                invoice_no,
                supplier_id,
                supplier_name,
                posting_date,
                due_date,
                currency,
                conversion_rate,
                supplier_invoice,
                supplier_invoice_date,
                credit_to,
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
                update_stock,
                created_at,
                modified,
                items:purchase_invoice_items(
                    id,
                    item_code,
                    item_name,
                    description,
                    qty,
                    rate,
                    amount,
                    uom,
                    warehouse,
                    expense_account,
                    tax_amount
                )
            `,
      )
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.supplier_id) {
      query = query.eq("supplier_id", params.supplier_id);
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
        `invoice_no.ilike.%${params.search}%,supplier_name.ilike.%${params.search}%,supplier_invoice.ilike.%${params.search}%`,
      );
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: invoices, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch purchase invoices", details: error.message },
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
    console.error("GET /api/v1/purchase-invoices error:", error);

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
 * POST /api/v1/purchase-invoices
 * Create a new purchase invoice
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = purchaseInvoiceSchema.parse(body);

    // Generate invoice number
    const invoiceNo = await generatePurchaseInvoiceNumber();

    // Calculate totals
    const totals = calculateInvoiceTotals(validatedData.items, validatedData.conversion_rate);

    // Set default credit account if not provided
    const creditTo = validatedData.credit_to || (await getDefaultPayableAccount());

    // Create purchase invoice in a transaction
    const { data, error } = await supabase.rpc("create_purchase_invoice", {
      p_invoice_data: {
        invoice_no: invoiceNo,
        supplier_id: validatedData.supplier_id,
        posting_date: validatedData.posting_date,
        due_date: validatedData.due_date || calculateDueDate(validatedData.posting_date),
        currency: validatedData.currency,
        conversion_rate: validatedData.conversion_rate,
        supplier_invoice: validatedData.supplier_invoice,
        supplier_invoice_date: validatedData.supplier_invoice_date,
        credit_to: creditTo,
        terms: validatedData.terms,
        update_stock: validatedData.update_stock,
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
        expense_account: item.expense_account,
        tax_amount: item.tax_amount,
        idx: index + 1,
      })),
      p_update_stock: validatedData.update_stock,
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create purchase invoice", details: error.message },
        { status: 500 },
      );
    }

    // Fetch the created invoice with items
    const { data: invoice, error: fetchError } = await supabase
      .from("purchase_invoices")
      .select(
        `
                id,
                invoice_no,
                supplier_id,
                supplier_name,
                posting_date,
                due_date,
                currency,
                conversion_rate,
                supplier_invoice,
                status,
                docstatus,
                grand_total,
                outstanding_amount,
                terms,
                created_at,
                modified,
                items:purchase_invoice_items(
                    id,
                    item_code,
                    item_name,
                    description,
                    qty,
                    rate,
                    amount,
                    uom,
                    warehouse,
                    expense_account
                )
            `,
      )
      .eq("id", data)
      .single();

    if (fetchError) {
      return NextResponse.json(
        {
          error: "Purchase invoice created but failed to fetch details",
          details: fetchError.message,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        data: invoice,
        message: "Purchase invoice created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/purchase-invoices error:", error);

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
 * Generate unique purchase invoice number
 */
async function generatePurchaseInvoiceNumber(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_purchase_invoice_number");

  if (error) {
    // Fallback to timestamp-based number
    const timestamp = Date.now().toString(36).toUpperCase();
    return `PINV-${timestamp}`;
  }

  return data;
}

/**
 * Get default payable account
 */
async function getDefaultPayableAccount(): Promise<string> {
  const { data } = await supabase
    .from("accounts")
    .select("id")
    .eq("account_type", "Payable")
    .eq("is_group", false)
    .limit(1)
    .single();

  return data?.id || "default-payable-account";
}

/**
 * Calculate invoice totals
 */
function calculateInvoiceTotals(items: any[], conversionRate: number) {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const total = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const totalTax = items.reduce((sum, item) => sum + (item.tax_amount || 0), 0);
  const baseTotal = total * conversionRate;
  const baseTotalTax = totalTax * conversionRate;

  return {
    total_qty: totalQty,
    total: total,
    net_total: total,
    base_total: baseTotal,
    base_net_total: baseTotal,
    total_taxes_and_charges: totalTax,
    base_total_taxes_and_charges: baseTotalTax,
    grand_total: total + totalTax,
    base_grand_total: baseTotal + baseTotalTax,
    rounded_total: Math.round(total + totalTax),
    base_rounded_total: Math.round(baseTotal + baseTotalTax),
    outstanding_amount: total + totalTax, // Initially equals grand total
  };
}

/**
 * Calculate due date based on supplier payment terms
 */
function calculateDueDate(postingDate: string): string {
  const date = new Date(postingDate);
  date.setDate(date.getDate() + 30); // Default 30 days
  return date.toISOString().split("T")[0];
}
