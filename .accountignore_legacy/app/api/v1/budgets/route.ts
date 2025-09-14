/**
 * REST API Endpoint: Budget Management
 * Full CRUD operations for Budgets with variance analysis
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const budgetAccountSchema = z.object({
  account_id: z.string().min(1, "Account is required"),
  budget_amount: z.number().min(0, "Budget amount cannot be negative"),
});

const budgetSchema = z.object({
  budget_name: z.string().min(1, "Budget name is required"),
  company_id: z.string().min(1, "Company is required"),
  fiscal_year: z.string().min(1, "Fiscal year is required"),
  budget_against: z.enum(["Cost Center", "Project", "Department"]).default("Cost Center"),
  cost_center_id: z.string().optional(),
  project_id: z.string().optional(),
  department: z.string().optional(),
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  budget_type: z.enum(["Expense", "Income", "Capital Expenditure"]).default("Expense"),
  monthly_distribution: z.enum(["Equally", "Custom"]).default("Equally"),
  action_if_annual_budget_exceeded: z.enum(["Stop", "Warn", "Ignore"]).default("Warn"),
  action_if_accumulated_monthly_budget_exceeded: z.enum(["Stop", "Warn", "Ignore"]).default("Warn"),
  action_if_monthly_budget_exceeded: z.enum(["Stop", "Warn", "Ignore"]).default("Warn"),
  accounts: z.array(budgetAccountSchema).min(1, "At least one account is required"),
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
  company_id: z.string().optional(),
  fiscal_year: z.string().optional(),
  budget_against: z.string().optional(),
  cost_center_id: z.string().optional(),
  project_id: z.string().optional(),
  department: z.string().optional(),
  budget_type: z.string().optional(),
  status: z.enum(["Draft", "Submitted", "Active", "Inactive"]).optional(),
  search: z.string().optional(),
  sort_by: z.enum(["budget_name", "from_date", "total_budget_amount"]).default("budget_name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET /api/v1/budgets
 * Retrieve budgets with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("budgets")
      .select(
        `
                id,
                budget_name,
                company_id,
                fiscal_year,
                budget_against,
                cost_center_id,
                cost_center:cost_centers(cost_center_name),
                project_id,
                project:projects(project_name),
                department,
                from_date,
                to_date,
                budget_type,
                monthly_distribution,
                action_if_annual_budget_exceeded,
                action_if_accumulated_monthly_budget_exceeded,
                action_if_monthly_budget_exceeded,
                total_budget_amount,
                actual_amount,
                variance_amount,
                variance_percentage,
                status,
                docstatus,
                created_at,
                modified,
                accounts:budget_accounts(
                    id,
                    account_id,
                    account:accounts(account_name, account_type),
                    budget_amount,
                    actual_amount,
                    variance_amount,
                    variance_percentage
                )
            `,
      )
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.company_id) {
      query = query.eq("company_id", params.company_id);
    }

    if (params.fiscal_year) {
      query = query.eq("fiscal_year", params.fiscal_year);
    }

    if (params.budget_against) {
      query = query.eq("budget_against", params.budget_against);
    }

    if (params.cost_center_id) {
      query = query.eq("cost_center_id", params.cost_center_id);
    }

    if (params.project_id) {
      query = query.eq("project_id", params.project_id);
    }

    if (params.department) {
      query = query.eq("department", params.department);
    }

    if (params.budget_type) {
      query = query.eq("budget_type", params.budget_type);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.search) {
      query = query.or(`budget_name.ilike.%${params.search}%,department.ilike.%${params.search}%`);
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: budgets, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch budgets", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: budgets,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/budgets error:", error);

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
 * POST /api/v1/budgets
 * Create a new budget
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = budgetSchema.parse(body);

    // Validate date range
    const fromDate = new Date(validatedData.from_date);
    const toDate = new Date(validatedData.to_date);

    if (fromDate >= toDate) {
      return NextResponse.json({ error: "To date must be after from date" }, { status: 400 });
    }

    // Check if budget name already exists for this company and fiscal year
    const { data: existingBudget } = await supabase
      .from("budgets")
      .select("id")
      .eq("budget_name", validatedData.budget_name)
      .eq("company_id", validatedData.company_id)
      .eq("fiscal_year", validatedData.fiscal_year)
      .single();

    if (existingBudget) {
      return NextResponse.json(
        { error: "Budget with this name already exists for the fiscal year" },
        { status: 409 },
      );
    }

    // Calculate totals
    const totalBudgetAmount = validatedData.accounts.reduce(
      (sum, account) => sum + account.budget_amount,
      0,
    );

    // Create budget in a transaction
    const { data, error } = await supabase.rpc("create_budget", {
      p_budget_data: {
        ...validatedData,
        total_budget_amount: totalBudgetAmount,
        actual_amount: 0,
        variance_amount: -totalBudgetAmount,
        variance_percentage: -100,
      },
      p_accounts: validatedData.accounts.map((account, index) => ({
        ...account,
        actual_amount: 0,
        variance_amount: -account.budget_amount,
        variance_percentage: -100,
        idx: index + 1,
      })),
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create budget", details: error.message },
        { status: 500 },
      );
    }

    // Fetch the created budget with accounts
    const { data: budget, error: fetchError } = await supabase
      .from("budgets")
      .select(
        `
                id,
                budget_name,
                company_id,
                fiscal_year,
                budget_against,
                from_date,
                to_date,
                budget_type,
                total_budget_amount,
                status,
                docstatus,
                created_at,
                modified,
                accounts:budget_accounts(
                    id,
                    account_id,
                    account:accounts(account_name, account_type),
                    budget_amount
                )
            `,
      )
      .eq("id", data)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Budget created but failed to fetch details", details: fetchError.message },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        data: budget,
        message: "Budget created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/budgets error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request body", details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
