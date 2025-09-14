/**
 * REST API Endpoint: Expense Management
 * Full CRUD operations for Expense Claims and Categories
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const expenseItemSchema = z.object({
  expense_type: z.string().min(1, "Expense type is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  description: z.string().optional(),
  expense_date: z.string().min(1, "Expense date is required"),
  receipt_attached: z.boolean().default(false),
  billable: z.boolean().default(false),
  project_id: z.string().optional(),
  cost_center_id: z.string().optional(),
  tax_amount: z.number().min(0).default(0),
  sanctioned_amount: z.number().optional(),
});

const expenseClaimSchema = z.object({
  employee_id: z.string().min(1, "Employee is required"),
  expense_approver: z.string().optional(),
  department: z.string().optional(),
  project: z.string().optional(),
  task: z.string().optional(),
  company_id: z.string().min(1, "Company is required"),
  posting_date: z.string().min(1, "Posting date is required"),
  total_claimed_amount: z.number().min(0.01, "Total amount must be greater than 0"),
  total_sanctioned_amount: z.number().optional(),
  total_taxes_and_charges: z.number().min(0).default(0),
  advance_paid: z.number().min(0).default(0),
  grand_total: z.number().optional(),
  remarks: z.string().optional(),
  expenses: z.array(expenseItemSchema).min(1, "At least one expense item is required"),
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
  employee_id: z.string().optional(),
  department: z.string().optional(),
  project: z.string().optional(),
  status: z
    .enum([
      "Draft",
      "Submitted",
      "Approved by Manager",
      "Approved by Finance",
      "Rejected",
      "Paid",
      "Cancelled",
    ])
    .optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  search: z.string().optional(),
  sort_by: z
    .enum(["posting_date", "total_claimed_amount", "employee_name"])
    .default("posting_date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/v1/expenses
 * Retrieve expense claims with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("expense_claims")
      .select(
        `
                id,
                name,
                employee_id,
                employee_name,
                expense_approver,
                department,
                project,
                task,
                company_id,
                posting_date,
                total_claimed_amount,
                total_sanctioned_amount,
                total_taxes_and_charges,
                advance_paid,
                grand_total,
                status,
                docstatus,
                remarks,
                is_paid,
                mode_of_payment,
                created_at,
                modified,
                expenses:expense_claim_details(
                    id,
                    expense_type,
                    amount,
                    description,
                    expense_date,
                    receipt_attached,
                    billable,
                    project_id,
                    cost_center_id,
                    tax_amount,
                    sanctioned_amount
                )
            `,
      )
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.employee_id) {
      query = query.eq("employee_id", params.employee_id);
    }

    if (params.department) {
      query = query.eq("department", params.department);
    }

    if (params.project) {
      query = query.eq("project", params.project);
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
        `name.ilike.%${params.search}%,employee_name.ilike.%${params.search}%,remarks.ilike.%${params.search}%`,
      );
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: expenseClaims, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch expense claims", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: expenseClaims,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/expenses error:", error);

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
 * POST /api/v1/expenses
 * Create a new expense claim
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = expenseClaimSchema.parse(body);

    // Generate expense claim name
    const expenseClaimName = await generateExpenseClaimName();

    // Calculate totals
    const totals = calculateExpenseTotals(validatedData.expenses);

    // Create expense claim in a transaction
    const { data, error } = await supabase.rpc("create_expense_claim", {
      p_expense_claim_data: {
        name: expenseClaimName,
        employee_id: validatedData.employee_id,
        expense_approver: validatedData.expense_approver,
        department: validatedData.department,
        project: validatedData.project,
        task: validatedData.task,
        company_id: validatedData.company_id,
        posting_date: validatedData.posting_date,
        total_claimed_amount: totals.total_claimed_amount,
        total_sanctioned_amount: totals.total_sanctioned_amount,
        total_taxes_and_charges: totals.total_taxes_and_charges,
        advance_paid: validatedData.advance_paid,
        grand_total: totals.grand_total,
        remarks: validatedData.remarks,
      },
      p_expenses: validatedData.expenses.map((expense, index) => ({
        ...expense,
        idx: index + 1,
      })),
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create expense claim", details: error.message },
        { status: 500 },
      );
    }

    // Fetch the created expense claim with details
    const { data: expenseClaim, error: fetchError } = await supabase
      .from("expense_claims")
      .select(
        `
                id,
                name,
                employee_id,
                employee_name,
                posting_date,
                total_claimed_amount,
                status,
                docstatus,
                created_at,
                modified,
                expenses:expense_claim_details(
                    id,
                    expense_type,
                    amount,
                    description,
                    expense_date,
                    receipt_attached
                )
            `,
      )
      .eq("id", data)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Expense claim created but failed to fetch details", details: fetchError.message },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        data: expenseClaim,
        message: "Expense claim created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/expenses error:", error);

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
 * Generate unique expense claim name
 */
async function generateExpenseClaimName(): Promise<string> {
  const { data, error } = await supabase.rpc("generate_expense_claim_name");

  if (error) {
    // Fallback to timestamp-based name
    const timestamp = Date.now().toString(36).toUpperCase();
    return `EXP-${timestamp}`;
  }

  return data;
}

/**
 * Calculate expense claim totals
 */
function calculateExpenseTotals(expenses: any[]) {
  const totalClaimedAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalTaxes = expenses.reduce((sum, expense) => sum + (expense.tax_amount || 0), 0);
  const totalSanctionedAmount = expenses.reduce(
    (sum, expense) => sum + (expense.sanctioned_amount || expense.amount),
    0,
  );

  return {
    total_claimed_amount: totalClaimedAmount,
    total_sanctioned_amount: totalSanctionedAmount,
    total_taxes_and_charges: totalTaxes,
    grand_total: totalClaimedAmount + totalTaxes,
  };
}
