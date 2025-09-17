/**
 * REST API Endpoint: Fixed Assets
 * Full CRUD operations for Fixed Asset management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

// Validation schemas
const fixedAssetSchema = z.object({
  asset_name: z.string().min(1, "Asset name is required"),
  asset_category_id: z.string().min(1, "Asset category is required"),
  item_code: z.string().optional(),
  location: z.string().optional(),
  custodian: z.string().optional(),
  department: z.string().optional(),
  purchase_date: z.string().optional(),
  available_for_use_date: z.string().optional(),
  purchase_amount: z.number().min(0).default(0),
  expected_value_after_useful_life: z.number().min(0).default(0),
  useful_life_in_months: z.number().min(1).default(60),
  depreciation_method: z
    .enum(["Straight Line", "Double Declining Balance", "Manual"])
    .default("Straight Line"),
  frequency_of_depreciation: z.number().min(1).max(12).default(12),
  finance_book_id: z.string().optional(),
  opening_accumulated_depreciation: z.number().min(0).default(0),
  number_of_depreciations_booked: z.number().min(0).default(0),
  supplier_id: z.string().optional(),
  is_existing_asset: z.boolean().default(false),
  gross_purchase_amount: z.number().min(0).default(0),
  asset_owner: z.enum(["Company", "Supplier", "Customer"]).default("Company"),
  asset_owner_company: z.string().optional(),
  disposal_date: z.string().optional(),
  journal_entry_for_scrap: z.string().optional(),
  maintenance_required: z.boolean().default(false),
  insurance_required: z.boolean().default(false),
  policy_number: z.string().optional(),
  insurer: z.string().optional(),
  insured_value: z.number().min(0).default(0),
  insurance_start_date: z.string().optional(),
  insurance_end_date: z.string().optional(),
  comprehensive_insurance: z.boolean().default(false),
  calculate_depreciation: z.boolean().default(true),
  allow_monthly_depreciation: z.boolean().default(false),
  status: z
    .enum([
      "Draft",
      "Submitted",
      "Partially Depreciated",
      "Fully Depreciated",
      "Sold",
      "Scrapped",
      "Capitalized",
      "Decapitalized",
    ])
    .default("Draft"),
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
  asset_category_id: z.string().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  status: z.string().optional(),
  custodian: z.string().optional(),
  from_purchase_date: z.string().optional(),
  to_purchase_date: z.string().optional(),
  maintenance_required: z
    .string()
    .optional()
    .transform(val => val === "true"),
  insurance_required: z
    .string()
    .optional()
    .transform(val => val === "true"),
  sort_by: z
    .enum(["asset_name", "purchase_date", "purchase_amount", "current_value"])
    .default("asset_name"),
  sort_order: z.enum(["asc", "desc"]).default("asc"),
});

/**
 * GET /api/v1/fixed-assets
 * Retrieve fixed assets with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse(Object.fromEntries(searchParams));

    // Build query
    let query = supabase
      .from("fixed_assets")
      .select(
        `
                id,
                asset_name,
                asset_category:asset_categories(id, category_name),
                item_code,
                location,
                custodian,
                department,
                purchase_date,
                available_for_use_date,
                purchase_amount,
                expected_value_after_useful_life,
                useful_life_in_months,
                depreciation_method,
                frequency_of_depreciation,
                opening_accumulated_depreciation,
                number_of_depreciations_booked,
                supplier:suppliers(id, supplier_name),
                is_existing_asset,
                gross_purchase_amount,
                asset_owner,
                asset_owner_company,
                disposal_date,
                maintenance_required,
                insurance_required,
                policy_number,
                insurer,
                insured_value,
                insurance_start_date,
                insurance_end_date,
                comprehensive_insurance,
                calculate_depreciation,
                allow_monthly_depreciation,
                status,
                current_value,
                value_after_depreciation,
                accumulated_depreciation_amount,
                created_at,
                modified
            `,
      )
      .range(params.offset, params.offset + params.limit - 1);

    // Apply filters
    if (params.search) {
      query = query.or(
        `asset_name.ilike.%${params.search}%,item_code.ilike.%${params.search}%,location.ilike.%${params.search}%`,
      );
    }

    if (params.asset_category_id) {
      query = query.eq("asset_category_id", params.asset_category_id);
    }

    if (params.location) {
      query = query.eq("location", params.location);
    }

    if (params.department) {
      query = query.eq("department", params.department);
    }

    if (params.status) {
      query = query.eq("status", params.status);
    }

    if (params.custodian) {
      query = query.eq("custodian", params.custodian);
    }

    if (params.from_purchase_date) {
      query = query.gte("purchase_date", params.from_purchase_date);
    }

    if (params.to_purchase_date) {
      query = query.lte("purchase_date", params.to_purchase_date);
    }

    if (params.maintenance_required !== undefined) {
      query = query.eq("maintenance_required", params.maintenance_required);
    }

    if (params.insurance_required !== undefined) {
      query = query.eq("insurance_required", params.insurance_required);
    }

    // Apply sorting
    query = query.order(params.sort_by, { ascending: params.sort_order === "asc" });

    const { data: assets, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch fixed assets", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      data: assets,
      meta: {
        total: count,
        limit: params.limit,
        offset: params.offset,
        has_more: count ? count > params.offset + params.limit : false,
      },
    });
  } catch (error) {
    console.error("GET /api/v1/fixed-assets error:", error);

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
 * POST /api/v1/fixed-assets
 * Create a new fixed asset
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = fixedAssetSchema.parse(body);

    // Validate asset category exists
    const { data: category } = await supabase
      .from("asset_categories")
      .select("id")
      .eq("id", validatedData.asset_category_id)
      .single();

    if (!category) {
      return NextResponse.json({ error: "Asset category not found" }, { status: 400 });
    }

    // Calculate depreciation details
    const depreciationData = calculateDepreciationDetails(validatedData);

    // Create asset in a transaction
    const { data, error } = await supabase.rpc("create_fixed_asset", {
      p_asset_data: {
        ...validatedData,
        ...depreciationData,
      },
    });

    if (error) {
      return NextResponse.json(
        { error: "Failed to create fixed asset", details: error.message },
        { status: 500 },
      );
    }

    // Fetch the created asset with related data
    const { data: asset, error: fetchError } = await supabase
      .from("fixed_assets")
      .select(
        `
                id,
                asset_name,
                asset_category:asset_categories(id, category_name),
                item_code,
                location,
                custodian,
                purchase_date,
                purchase_amount,
                depreciation_method,
                useful_life_in_months,
                status,
                current_value,
                created_at,
                modified
            `,
      )
      .eq("id", data)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: "Asset created but failed to fetch details", details: fetchError.message },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        data: asset,
        message: "Fixed asset created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/v1/fixed-assets error:", error);

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
 * Calculate depreciation details for new asset
 */
function calculateDepreciationDetails(assetData: {
  purchase_amount: number;
  expected_value_after_useful_life: number;
  useful_life_in_months: number;
  depreciation_method: string;
  frequency_of_depreciation: number;
  opening_accumulated_depreciation?: number;
  available_for_use_date?: string;
  purchase_date: string;
}) {
  const purchaseAmount = assetData.purchase_amount;
  const expectedValue = assetData.expected_value_after_useful_life;
  const usefulLifeMonths = assetData.useful_life_in_months;
  const depreciationMethod = assetData.depreciation_method;
  const frequencyOfDepreciation = assetData.frequency_of_depreciation;

  let depreciableValue = purchaseAmount - expectedValue;
  let monthlyDepreciation = 0;
  let yearlyDepreciation = 0;

  if (depreciationMethod === "Straight Line") {
    monthlyDepreciation = depreciableValue / usefulLifeMonths;
    yearlyDepreciation = monthlyDepreciation * 12;
  } else if (depreciationMethod === "Double Declining Balance") {
    const rate = 2 / (usefulLifeMonths / 12);
    yearlyDepreciation = purchaseAmount * rate;
    monthlyDepreciation = yearlyDepreciation / 12;
  }

  const currentValue = purchaseAmount - (assetData.opening_accumulated_depreciation || 0);

  return {
    depreciable_value: depreciableValue,
    monthly_depreciation_amount: monthlyDepreciation,
    yearly_depreciation_amount: yearlyDepreciation,
    current_value: currentValue,
    value_after_depreciation: Math.max(0, currentValue - depreciableValue),
    accumulated_depreciation_amount: assetData.opening_accumulated_depreciation || 0,
    next_depreciation_date: calculateNextDepreciationDate(
      assetData.available_for_use_date || assetData.purchase_date,
      frequencyOfDepreciation,
    ),
  };
}

/**
 * Calculate next depreciation date
 */
function calculateNextDepreciationDate(startDate: string, frequency: number): string {
  const date = new Date(startDate);
  date.setMonth(date.getMonth() + 12 / frequency);
  return date.toISOString().split("T")[0];
}
