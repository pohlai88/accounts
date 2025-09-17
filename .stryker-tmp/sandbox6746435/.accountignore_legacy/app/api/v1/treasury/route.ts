/**
 * REST API Endpoint: Treasury Management
 * Cash flow forecasting, liquidity management, and working capital analysis
 * ERPNext/Odoo Integration Compatible
 */
// @ts-nocheck


import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const cashFlowEntrySchema = z.object({
  entry_type: z.enum(["Inflow", "Outflow"]),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("USD"),
  description: z.string().min(1, "Description is required"),
  category: z.enum(["Operations", "Investment", "Financing", "Other"]).default("Operations"),
  subcategory: z.string().optional(),
  expected_date: z.string().min(1, "Expected date is required"),
  actual_date: z.string().optional(),
  confidence_level: z.enum(["High", "Medium", "Low"]).default("Medium"),
  account_id: z.string().optional(),
  project_id: z.string().optional(),
  cost_center_id: z.string().optional(),
  reference_type: z.string().optional(),
  reference_name: z.string().optional(),
  is_recurring: z.boolean().default(false),
  recurrence_pattern: z.string().optional(),
});

const treasuryForecastSchema = z.object({
  forecast_name: z.string().min(1, "Forecast name is required"),
  company_id: z.string().min(1, "Company is required"),
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  base_currency: z.string().default("USD"),
  forecast_type: z.enum(["Rolling", "Static", "Scenario"]).default("Rolling"),
  scenario_name: z.string().optional(),
  auto_update: z.boolean().default(true),
  entries: z.array(cashFlowEntrySchema).min(1, "At least one cash flow entry is required"),
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
  forecast_type: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  currency: z.string().optional(),
  category: z.string().optional(),
  confidence_level: z.string().optional(),
  search: z.string().optional(),
  sort_by: z.enum(["forecast_name", "from_date", "net_cash_flow"]).default("from_date"),
  sort_order: z.enum(["asc", "desc"]).default("desc"),
});

/**
 * GET /api/v1/treasury
 * Retrieve treasury forecasts and cash flow data
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("treasury_forecasts")
      .select(
        `
                id,
                forecast_name,
                company_id,
                from_date,
                to_date,
                base_currency,
                forecast_type,
                scenario_name,
                auto_update,
                total_inflows,
                total_outflows,
                net_cash_flow,
                opening_balance,
                closing_balance,
                cash_surplus_deficit,
                working_capital,
                current_ratio,
                quick_ratio,
                status,
                created_at,
                modified,
                entries:treasury_cash_flow_entries(
                    id,
                    entry_type,
                    amount,
                    currency,
                    description,
                    category,
                    subcategory,
                    expected_date,
                    actual_date,
                    confidence_level,
                    account_id,
                    project_id,
                    cost_center_id,
                    is_recurring
                )
            `,
      )
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.company_id) {
      query = query.eq("company_id", params.company_id);
    }

    if (params.forecast_type) {
      query = query.eq("forecast_type", params.forecast_type);
    }

    if (params.from_date) {
      query = query.gte("from_date", params.from_date);
    }

    if (params.to_date) {
      query = query.lte("to_date", params.to_date);
    }

    if (params.currency) {
      query = query.eq("base_currency", params.currency);
    }

    if (params.search) {
      query = query.or(
        `forecast_name.ilike.%${params.search}%,scenario_name.ilike.%${params.search}%`,
      );
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: treasuryForecasts, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch treasury forecasts", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: treasuryForecasts,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/treasury error:", error);

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
 * POST /api/v1/treasury
 * Create a new treasury forecast
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = treasuryForecastSchema.parse(body);

    // Validate date range
    const fromDate = new Date(validatedData.from_date);
    const toDate = new Date(validatedData.to_date);

    if (fromDate >= toDate) {
      return NextResponse.json({ error: "To date must be after from date" }, { status: 400 });
    }

    // Calculate totals and ratios
    const totals = calculateTreasuryTotals(validatedData.entries);
    const ratios = await calculateLiquidityRatios(validatedData.company_id);

    // Create treasury forecast in a transaction
    const { data, error } = await supabase.rpc("create_treasury_forecast", {
      p_forecast_data: {
        ...validatedData,
        ...totals,
        ...ratios,
        cash_surplus_deficit: totals.net_cash_flow,
      },
      p_entries: validatedData.entries.map((entry, index) => ({
        ...entry,
        idx: index + 1,
      })),
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create treasury forecast", details: error.message },
        { status: 500 },
      );
    }

    // Fetch the created forecast with entries
    const { data: forecast, error: fetchError } = await supabase
      .from("treasury_forecasts")
      .select(
        `
                id,
                forecast_name,
                company_id,
                from_date,
                to_date,
                base_currency,
                forecast_type,
                total_inflows,
                total_outflows,
                net_cash_flow,
                status,
                created_at,
                modified,
                entries:treasury_cash_flow_entries(
                    id,
                    entry_type,
                    amount,
                    currency,
                    description,
                    category,
                    expected_date,
                    confidence_level
                )
            `,
      )
      .eq("id", data)
      .single();

    if (fetchError) {
      return NextResponse.json(
        {
          error: "Treasury forecast created but failed to fetch details",
          details: fetchError.message,
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        data: forecast,
        message: "Treasury forecast created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/treasury error:", error);

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
 * Calculate treasury forecast totals
 */
function calculateTreasuryTotals(entries: any[]) {
  const inflows = entries.filter(e => e.entry_type === "Inflow");
  const outflows = entries.filter(e => e.entry_type === "Outflow");

  const totalInflows = inflows.reduce((sum, entry) => sum + entry.amount, 0);
  const totalOutflows = outflows.reduce((sum, entry) => sum + entry.amount, 0);
  const netCashFlow = totalInflows - totalOutflows;

  return {
    total_inflows: totalInflows,
    total_outflows: totalOutflows,
    net_cash_flow: netCashFlow,
  };
}

/**
 * Calculate liquidity ratios for working capital analysis
 */
async function calculateLiquidityRatios(companyId: string) {
  try {
    // Get current assets and liabilities from balance sheet
    const { data: balanceSheetData } = await supabase.rpc("get_balance_sheet_summary", {
      p_company_id: companyId,
      p_as_of_date: new Date().toISOString().split("T")[0],
    });

    if (!balanceSheetData) {
      return {
        working_capital: 0,
        current_ratio: 0,
        quick_ratio: 0,
        opening_balance: 0,
        closing_balance: 0,
      };
    }

    const currentAssets = balanceSheetData.current_assets || 0;
    const currentLiabilities = balanceSheetData.current_liabilities || 0;
    const inventory = balanceSheetData.inventory || 0;
    const cash = balanceSheetData.cash_and_equivalents || 0;

    const workingCapital = currentAssets - currentLiabilities;
    const currentRatio = currentLiabilities > 0 ? currentAssets / currentLiabilities : 0;
    const quickRatio =
      currentLiabilities > 0 ? (currentAssets - inventory) / currentLiabilities : 0;

    return {
      working_capital: workingCapital,
      current_ratio: currentRatio,
      quick_ratio: quickRatio,
      opening_balance: cash,
      closing_balance: cash, // Will be updated when forecast is processed
    };
  } catch (error) {
    console.error("Error calculating liquidity ratios:", error);
    return {
      working_capital: 0,
      current_ratio: 0,
      quick_ratio: 0,
      opening_balance: 0,
      closing_balance: 0,
    };
  }
}
