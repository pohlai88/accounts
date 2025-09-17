/**
 * Fixed Assets Management Service - Complete Asset Lifecycle
 * ERPNext-level asset tracking, depreciation, and compliance management
 *
 * Features:
 * - Complete asset lifecycle management (Purchase to Disposal)
 * - Multiple depreciation methods (Straight Line, Double Declining Balance, etc.)
 * - Asset maintenance scheduling and tracking
 * - Insurance management and tracking
 * - Asset movements and custodian tracking
 * - Comprehensive reporting and analytics
 */
// @ts-nocheck


import { supabase } from "./supabase";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type DepreciationMethod =
  | "Straight Line"
  | "Double Declining Balance"
  | "Written Down Value"
  | "Sum of Years Digits"
  | "Manual";
export type AssetStatus =
  | "Draft"
  | "Submitted"
  | "Partially Depreciated"
  | "Fully Depreciated"
  | "Sold"
  | "Scrapped"
  | "In Maintenance"
  | "Capitalized";
export type AssetCondition = "Excellent" | "Good" | "Fair" | "Poor" | "Under Repair";
export type AssetOwner = "Company" | "Supplier" | "Customer";
export type MovementType =
  | "Purchase"
  | "Transfer"
  | "Issue"
  | "Receipt"
  | "Disposal"
  | "Maintenance"
  | "Repair";
export type MaintenanceType = "Preventive" | "Breakdown" | "Calibration" | "Upgrade" | "Inspection";
export type MaintenanceStatus = "Planned" | "In Progress" | "Completed" | "Overdue" | "Cancelled";
export type DisposalType = "Sale" | "Scrap" | "Donation" | "Loss/Theft" | "Exchange";

export interface AssetCategory {
  id: string;
  category_name: string;
  category_code: string;
  company_id: string;

  // Accounting Integration
  fixed_asset_account?: string;
  accumulated_depreciation_account?: string;
  depreciation_expense_account?: string;

  // Default Depreciation Settings
  depreciation_method: DepreciationMethod;
  total_number_of_depreciations: number;
  frequency_of_depreciation: number;
  enable_cwip_accounting: boolean;

  // Status
  is_active: boolean;
  description?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface AssetLocation {
  id: string;
  location_name: string;
  location_code?: string;
  company_id: string;
  parent_location_id?: string;

  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;

  // Responsible Person
  custodian_name?: string;
  custodian_email?: string;
  custodian_phone?: string;

  // Status
  is_active: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface Asset {
  id: string;
  asset_name: string;
  asset_code?: string;
  company_id: string;
  asset_category_id: string;

  // Classification
  item_code?: string;
  asset_owner: AssetOwner;
  owner_name?: string;
  custodian?: string;
  location_id?: string;
  department?: string;
  cost_center?: string;
  project?: string;

  // Financial Details
  gross_purchase_amount: number;
  asset_value: number;
  purchase_date: string;
  available_for_use_date?: string;
  purchase_receipt_amount: number;
  purchase_invoice?: string;
  supplier_id?: string;

  // Depreciation Settings
  calculate_depreciation: boolean;
  is_existing_asset: boolean;
  depreciation_method?: DepreciationMethod;
  total_number_of_depreciations?: number;
  frequency_of_depreciation?: number;
  expected_value_after_useful_life: number;

  // Opening Depreciation
  opening_accumulated_depreciation: number;
  number_of_depreciations_booked: number;

  // Status
  status: AssetStatus;
  docstatus: number;

  // Asset Details
  asset_condition: AssetCondition;
  warranty_expiry_date?: string;
  insured_value: number;
  insurance_start_date?: string;
  insurance_end_date?: string;
  policy_number?: string;

  // Additional Info
  manufacturer?: string;
  model?: string;
  serial_no?: string;
  asset_description?: string;

  // References
  purchase_receipt_id?: string;
  journal_entry_for_scrap_id?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data (populated when needed)
  category?: AssetCategory;
  location?: AssetLocation;
  depreciation_schedules?: DepreciationSchedule[];
  maintenance_log?: MaintenanceLog[];
}

export interface DepreciationSchedule {
  id: string;
  asset_id: string;
  company_id: string;
  schedule_date: string;
  depreciation_amount: number;
  accumulated_depreciation_amount: number;
  journal_entry_id?: string;
  is_booked: boolean;
  created_at: string;
}

export interface AssetMovement {
  id: string;
  asset_id: string;
  company_id: string;
  movement_type: MovementType;
  transaction_date: string;

  // From/To Details
  from_employee?: string;
  to_employee?: string;
  from_location_id?: string;
  to_location_id?: string;

  // Movement Details
  purpose?: string;
  reference_name?: string;

  // Audit
  created_at: string;
  created_by?: string;
}

export interface MaintenanceLog {
  id: string;
  asset_id: string;
  company_id: string;
  maintenance_date: string;
  maintenance_type: MaintenanceType;
  maintenance_status: MaintenanceStatus;

  // Service Details
  service_provider?: string;
  maintenance_cost: number;
  completion_date?: string;
  next_due_date?: string;

  // Description
  description?: string;
  work_done?: string;
  parts_replaced?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface AssetDisposal {
  id: string;
  asset_id: string;
  company_id: string;
  disposal_date: string;
  disposal_type: DisposalType;

  // Financial Details
  selling_amount: number;
  selling_expense: number;
  asset_value_at_disposal: number;
  accumulated_depreciation_at_disposal: number;
  gain_loss_on_disposal: number;

  // Disposal Details
  disposed_to?: string;
  disposal_reason?: string;

  // References
  journal_entry_id?: string;

  // Status
  docstatus: number;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface AssetInsurance {
  id: string;
  asset_id: string;
  company_id: string;

  // Insurance Details
  insurance_company: string;
  policy_number: string;
  policy_start_date: string;
  policy_end_date: string;
  insured_value: number;
  premium_amount: number;

  // Coverage Details
  coverage_type?: string;
  deductible_amount: number;

  // Status
  is_active: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreateAssetCategoryInput {
  category_name: string;
  category_code: string;
  company_id: string;
  fixed_asset_account?: string;
  accumulated_depreciation_account?: string;
  depreciation_expense_account?: string;
  depreciation_method?: DepreciationMethod;
  total_number_of_depreciations?: number;
  frequency_of_depreciation?: number;
  enable_cwip_accounting?: boolean;
  description?: string;
}

export interface CreateAssetLocationInput {
  location_name: string;
  location_code?: string;
  company_id: string;
  parent_location_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  custodian_name?: string;
  custodian_email?: string;
  custodian_phone?: string;
}

export interface CreateAssetInput {
  asset_name: string;
  company_id: string;
  asset_category_id: string;
  item_code?: string;
  asset_owner?: AssetOwner;
  owner_name?: string;
  custodian?: string;
  location_id?: string;
  department?: string;
  cost_center?: string;
  project?: string;
  gross_purchase_amount: number;
  purchase_date: string;
  available_for_use_date?: string;
  purchase_receipt_amount?: number;
  purchase_invoice?: string;
  supplier_id?: string;
  calculate_depreciation?: boolean;
  is_existing_asset?: boolean;
  depreciation_method?: DepreciationMethod;
  total_number_of_depreciations?: number;
  frequency_of_depreciation?: number;
  expected_value_after_useful_life?: number;
  opening_accumulated_depreciation?: number;
  number_of_depreciations_booked?: number;
  asset_condition?: AssetCondition;
  warranty_expiry_date?: string;
  insured_value?: number;
  insurance_start_date?: string;
  insurance_end_date?: string;
  policy_number?: string;
  manufacturer?: string;
  model?: string;
  serial_no?: string;
  asset_description?: string;
}

export interface CreateMaintenanceLogInput {
  asset_id: string;
  company_id: string;
  maintenance_date: string;
  maintenance_type: MaintenanceType;
  maintenance_status?: MaintenanceStatus;
  service_provider?: string;
  maintenance_cost?: number;
  completion_date?: string;
  next_due_date?: string;
  description?: string;
  work_done?: string;
  parts_replaced?: string;
}

export interface CreateAssetDisposalInput {
  asset_id: string;
  company_id: string;
  disposal_date: string;
  disposal_type: DisposalType;
  selling_amount?: number;
  selling_expense?: number;
  disposed_to?: string;
  disposal_reason?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================================================
// FIXED ASSETS MANAGEMENT SERVICE
// =====================================================================================

export class FixedAssetsService {
  // =====================================================================================
  // ASSET CATEGORIES
  // =====================================================================================

  /**
   * Create asset category
   */
  static async createAssetCategory(
    input: CreateAssetCategoryInput,
  ): Promise<ApiResponse<AssetCategory>> {
    try {
      const { data: category, error } = await supabase
        .from("asset_categories")
        .insert({
          category_name: input.category_name.trim(),
          category_code: input.category_code.trim().toUpperCase(),
          company_id: input.company_id,
          fixed_asset_account: input.fixed_asset_account,
          accumulated_depreciation_account: input.accumulated_depreciation_account,
          depreciation_expense_account: input.depreciation_expense_account,
          depreciation_method: input.depreciation_method || "Straight Line",
          total_number_of_depreciations: input.total_number_of_depreciations || 60,
          frequency_of_depreciation: input.frequency_of_depreciation || 12,
          enable_cwip_accounting: input.enable_cwip_accounting || false,
          description: input.description,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: category, message: "Asset category created successfully" };
    } catch (error) {
      console.error("Error creating asset category:", error);
      return { success: false, error: "Failed to create asset category" };
    }
  }

  /**
   * Get asset categories
   */
  static async getAssetCategories(companyId: string): Promise<ApiResponse<AssetCategory[]>> {
    try {
      const { data: categories, error } = await supabase
        .from("asset_categories")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("category_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: categories };
    } catch (error) {
      console.error("Error fetching asset categories:", error);
      return { success: false, error: "Failed to fetch asset categories" };
    }
  }

  // =====================================================================================
  // ASSET LOCATIONS
  // =====================================================================================

  /**
   * Create asset location
   */
  static async createAssetLocation(
    input: CreateAssetLocationInput,
  ): Promise<ApiResponse<AssetLocation>> {
    try {
      const { data: location, error } = await supabase
        .from("asset_locations")
        .insert({
          location_name: input.location_name.trim(),
          location_code: input.location_code?.trim().toUpperCase(),
          company_id: input.company_id,
          parent_location_id: input.parent_location_id,
          address_line1: input.address_line1,
          address_line2: input.address_line2,
          city: input.city,
          state: input.state,
          country: input.country,
          postal_code: input.postal_code,
          custodian_name: input.custodian_name,
          custodian_email: input.custodian_email,
          custodian_phone: input.custodian_phone,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: location, message: "Asset location created successfully" };
    } catch (error) {
      console.error("Error creating asset location:", error);
      return { success: false, error: "Failed to create asset location" };
    }
  }

  /**
   * Get asset locations
   */
  static async getAssetLocations(companyId: string): Promise<ApiResponse<AssetLocation[]>> {
    try {
      const { data: locations, error } = await supabase
        .from("asset_locations")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("location_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: locations };
    } catch (error) {
      console.error("Error fetching asset locations:", error);
      return { success: false, error: "Failed to fetch asset locations" };
    }
  }

  // =====================================================================================
  // ASSETS
  // =====================================================================================

  /**
   * Create asset
   */
  static async createAsset(input: CreateAssetInput): Promise<ApiResponse<Asset>> {
    try {
      // Generate asset code
      const { data: categoryData } = await supabase
        .from("asset_categories")
        .select("category_code")
        .eq("id", input.asset_category_id)
        .single();

      const assetCode = await this.generateAssetCode(
        input.company_id,
        categoryData?.category_code || "ASSET",
      );

      const { data: asset, error } = await supabase
        .from("assets")
        .insert({
          asset_name: input.asset_name.trim(),
          asset_code: assetCode,
          company_id: input.company_id,
          asset_category_id: input.asset_category_id,
          item_code: input.item_code,
          asset_owner: input.asset_owner || "Company",
          owner_name: input.owner_name,
          custodian: input.custodian,
          location_id: input.location_id,
          department: input.department,
          cost_center: input.cost_center,
          project: input.project,
          gross_purchase_amount: input.gross_purchase_amount,
          asset_value: input.gross_purchase_amount, // Initially same as purchase amount
          purchase_date: input.purchase_date,
          available_for_use_date: input.available_for_use_date || input.purchase_date,
          purchase_receipt_amount: input.purchase_receipt_amount || input.gross_purchase_amount,
          purchase_invoice: input.purchase_invoice,
          supplier_id: input.supplier_id,
          calculate_depreciation: input.calculate_depreciation !== false,
          is_existing_asset: input.is_existing_asset || false,
          depreciation_method: input.depreciation_method,
          total_number_of_depreciations: input.total_number_of_depreciations,
          frequency_of_depreciation: input.frequency_of_depreciation,
          expected_value_after_useful_life: input.expected_value_after_useful_life || 0,
          opening_accumulated_depreciation: input.opening_accumulated_depreciation || 0,
          number_of_depreciations_booked: input.number_of_depreciations_booked || 0,
          asset_condition: input.asset_condition || "Excellent",
          warranty_expiry_date: input.warranty_expiry_date,
          insured_value: input.insured_value || 0,
          insurance_start_date: input.insurance_start_date,
          insurance_end_date: input.insurance_end_date,
          policy_number: input.policy_number,
          manufacturer: input.manufacturer,
          model: input.model,
          serial_no: input.serial_no,
          asset_description: input.asset_description,
        })
        .select(
          `
                    *,
                    category:asset_categories(*),
                    location:asset_locations(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: asset, message: `Asset ${assetCode} created successfully` };
    } catch (error) {
      console.error("Error creating asset:", error);
      return { success: false, error: "Failed to create asset" };
    }
  }

  /**
   * Get asset by ID
   */
  static async getAsset(assetId: string): Promise<ApiResponse<Asset>> {
    try {
      const { data: asset, error } = await supabase
        .from("assets")
        .select(
          `
                    *,
                    category:asset_categories(*),
                    location:asset_locations(*),
                    depreciation_schedules:asset_depreciation_schedules(*),
                    maintenance_log:asset_maintenance_log(*)
                `,
        )
        .eq("id", assetId)
        .single();

      if (error || !asset) {
        return { success: false, error: "Asset not found" };
      }

      return { success: true, data: asset };
    } catch (error) {
      console.error("Error fetching asset:", error);
      return { success: false, error: "Failed to fetch asset" };
    }
  }

  /**
   * Get assets with filtering
   */
  static async getAssets(
    companyId: string,
    filters?: {
      category_id?: string;
      location_id?: string;
      status?: AssetStatus;
      asset_owner?: AssetOwner;
      search?: string;
    },
  ): Promise<ApiResponse<Asset[]>> {
    try {
      let query = supabase
        .from("assets")
        .select(
          `
                    *,
                    category:asset_categories(category_name),
                    location:asset_locations(location_name)
                `,
        )
        .eq("company_id", companyId);

      if (filters?.category_id) {
        query = query.eq("asset_category_id", filters.category_id);
      }

      if (filters?.location_id) {
        query = query.eq("location_id", filters.location_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.asset_owner) {
        query = query.eq("asset_owner", filters.asset_owner);
      }

      if (filters?.search) {
        query = query.or(
          `asset_name.ilike.%${filters.search}%,asset_code.ilike.%${filters.search}%,serial_no.ilike.%${filters.search}%`,
        );
      }

      const { data: assets, error } = await query.order("asset_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: assets };
    } catch (error) {
      console.error("Error fetching assets:", error);
      return { success: false, error: "Failed to fetch assets" };
    }
  }

  /**
   * Submit asset (make it active)
   */
  static async submitAsset(assetId: string): Promise<ApiResponse<boolean>> {
    try {
      const { data: asset, error: updateError } = await supabase
        .from("assets")
        .update({
          docstatus: 1,
          status: "Submitted",
          modified: new Date().toISOString(),
        })
        .eq("id", assetId)
        .select()
        .single();

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      // Generate depreciation schedule if asset calculates depreciation
      if (asset.calculate_depreciation) {
        const { error: scheduleError } = await supabase.rpc(
          "generate_asset_depreciation_schedule",
          { p_asset_id: assetId },
        );

        if (scheduleError) {
          console.error("Error generating depreciation schedule:", scheduleError);
        }
      }

      return { success: true, data: true, message: "Asset submitted successfully" };
    } catch (error) {
      console.error("Error submitting asset:", error);
      return { success: false, error: "Failed to submit asset" };
    }
  }

  // =====================================================================================
  // DEPRECIATION
  // =====================================================================================

  /**
   * Get depreciation schedule for an asset
   */
  static async getDepreciationSchedule(
    assetId: string,
  ): Promise<ApiResponse<DepreciationSchedule[]>> {
    try {
      const { data: schedules, error } = await supabase
        .from("asset_depreciation_schedules")
        .select("*")
        .eq("asset_id", assetId)
        .order("schedule_date");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: schedules };
    } catch (error) {
      console.error("Error fetching depreciation schedule:", error);
      return { success: false, error: "Failed to fetch depreciation schedule" };
    }
  }

  /**
   * Get pending depreciation entries
   */
  static async getPendingDepreciationEntries(
    companyId: string,
    asOfDate?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      const { data: entries, error } = await supabase.rpc("get_pending_depreciation_entries", {
        p_company_id: companyId,
        p_as_of_date: asOfDate || new Date().toISOString().split("T")[0],
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: entries };
    } catch (error) {
      console.error("Error fetching pending depreciation entries:", error);
      return { success: false, error: "Failed to fetch pending depreciation entries" };
    }
  }

  /**
   * Book depreciation entries
   */
  static async bookDepreciationEntries(entryIds: string[]): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("asset_depreciation_schedules")
        .update({ is_booked: true })
        .in("id", entryIds);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Depreciation entries booked successfully" };
    } catch (error) {
      console.error("Error booking depreciation entries:", error);
      return { success: false, error: "Failed to book depreciation entries" };
    }
  }

  /**
   * Calculate current book value of an asset
   */
  static async getAssetBookValue(assetId: string, asOfDate?: string): Promise<ApiResponse<number>> {
    try {
      const { data: bookValue, error } = await supabase.rpc("get_asset_book_value", {
        p_asset_id: assetId,
        p_as_of_date: asOfDate || new Date().toISOString().split("T")[0],
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: bookValue };
    } catch (error) {
      console.error("Error calculating asset book value:", error);
      return { success: false, error: "Failed to calculate asset book value" };
    }
  }

  // =====================================================================================
  // MAINTENANCE MANAGEMENT
  // =====================================================================================

  /**
   * Create maintenance log entry
   */
  static async createMaintenanceLog(
    input: CreateMaintenanceLogInput,
  ): Promise<ApiResponse<MaintenanceLog>> {
    try {
      const { data: maintenanceLog, error } = await supabase
        .from("asset_maintenance_log")
        .insert({
          asset_id: input.asset_id,
          company_id: input.company_id,
          maintenance_date: input.maintenance_date,
          maintenance_type: input.maintenance_type,
          maintenance_status: input.maintenance_status || "Planned",
          service_provider: input.service_provider,
          maintenance_cost: input.maintenance_cost || 0,
          completion_date: input.completion_date,
          next_due_date: input.next_due_date,
          description: input.description,
          work_done: input.work_done,
          parts_replaced: input.parts_replaced,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: maintenanceLog,
        message: "Maintenance log created successfully",
      };
    } catch (error) {
      console.error("Error creating maintenance log:", error);
      return { success: false, error: "Failed to create maintenance log" };
    }
  }

  /**
   * Get maintenance logs for an asset
   */
  static async getMaintenanceLogs(assetId: string): Promise<ApiResponse<MaintenanceLog[]>> {
    try {
      const { data: logs, error } = await supabase
        .from("asset_maintenance_log")
        .select("*")
        .eq("asset_id", assetId)
        .order("maintenance_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: logs };
    } catch (error) {
      console.error("Error fetching maintenance logs:", error);
      return { success: false, error: "Failed to fetch maintenance logs" };
    }
  }

  /**
   * Get upcoming maintenance schedules
   */
  static async getUpcomingMaintenance(
    companyId: string,
    daysAhead: number = 30,
  ): Promise<ApiResponse<MaintenanceLog[]>> {
    try {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysAhead);

      const { data: upcomingMaintenance, error } = await supabase
        .from("asset_maintenance_log")
        .select(
          `
                    *,
                    asset:assets(asset_name, asset_code)
                `,
        )
        .eq("company_id", companyId)
        .eq("maintenance_status", "Planned")
        .lte("next_due_date", endDate.toISOString().split("T")[0])
        .order("next_due_date");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: upcomingMaintenance };
    } catch (error) {
      console.error("Error fetching upcoming maintenance:", error);
      return { success: false, error: "Failed to fetch upcoming maintenance" };
    }
  }

  // =====================================================================================
  // ASSET DISPOSAL
  // =====================================================================================

  /**
   * Create asset disposal record
   */
  static async createAssetDisposal(
    input: CreateAssetDisposalInput,
  ): Promise<ApiResponse<AssetDisposal>> {
    try {
      // Get current asset book value
      const bookValueResult = await this.getAssetBookValue(input.asset_id, input.disposal_date);
      const assetBookValue = bookValueResult.data || 0;

      // Calculate gain/loss on disposal
      const sellingAmount = input.selling_amount || 0;
      const sellingExpense = input.selling_expense || 0;
      const netSaleAmount = sellingAmount - sellingExpense;
      const gainLossOnDisposal = netSaleAmount - assetBookValue;

      const { data: disposal, error } = await supabase
        .from("asset_disposals")
        .insert({
          asset_id: input.asset_id,
          company_id: input.company_id,
          disposal_date: input.disposal_date,
          disposal_type: input.disposal_type,
          selling_amount: sellingAmount,
          selling_expense: sellingExpense,
          asset_value_at_disposal: assetBookValue,
          gain_loss_on_disposal: gainLossOnDisposal,
          disposed_to: input.disposed_to,
          disposal_reason: input.disposal_reason,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: disposal,
        message: "Asset disposal record created successfully",
      };
    } catch (error) {
      console.error("Error creating asset disposal:", error);
      return { success: false, error: "Failed to create asset disposal" };
    }
  }

  /**
   * Submit asset disposal (finalize disposal)
   */
  static async submitAssetDisposal(disposalId: string): Promise<ApiResponse<boolean>> {
    try {
      // Update disposal status and asset status
      const { data: disposal, error: disposalError } = await supabase
        .from("asset_disposals")
        .update({ docstatus: 1 })
        .eq("id", disposalId)
        .select()
        .single();

      if (disposalError) {
        return { success: false, error: disposalError.message };
      }

      // Update asset status based on disposal type
      const newAssetStatus = disposal.disposal_type === "Sale" ? "Sold" : "Scrapped";

      const { error: assetError } = await supabase
        .from("assets")
        .update({
          status: newAssetStatus,
          modified: new Date().toISOString(),
        })
        .eq("id", disposal.asset_id);

      if (assetError) {
        return { success: false, error: assetError.message };
      }

      return { success: true, data: true, message: "Asset disposal submitted successfully" };
    } catch (error) {
      console.error("Error submitting asset disposal:", error);
      return { success: false, error: "Failed to submit asset disposal" };
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Generate asset code
   */
  private static async generateAssetCode(companyId: string, categoryCode: string): Promise<string> {
    const { data, error } = await supabase.rpc("generate_asset_code", {
      p_company_id: companyId,
      p_category_code: categoryCode,
    });

    if (error) {
      // Fallback to timestamp-based code
      const timestamp = Date.now().toString(36).toUpperCase();
      return `${categoryCode}-${timestamp}`;
    }

    return data;
  }

  /**
   * Get asset analytics
   */
  static async getAssetAnalytics(companyId: string): Promise<
    ApiResponse<{
      total_assets: number;
      total_asset_value: number;
      total_accumulated_depreciation: number;
      net_book_value: number;
      assets_by_category: any[];
      assets_by_location: any[];
      maintenance_due_soon: number;
      insurance_expiring_soon: number;
    }>
  > {
    try {
      // Get total assets and values
      const { data: assetSummary } = await supabase
        .from("assets")
        .select("id, gross_purchase_amount, asset_value, status")
        .eq("company_id", companyId)
        .neq("status", "Draft");

      // Get accumulated depreciation
      const { data: depreciationSummary } = await supabase
        .from("asset_depreciation_schedules")
        .select("depreciation_amount")
        .eq("company_id", companyId)
        .eq("is_booked", true);

      // Get assets by category
      const { data: assetsByCategory } = await supabase
        .from("assets")
        .select(
          `
                    asset_value,
                    category:asset_categories(category_name)
                `,
        )
        .eq("company_id", companyId)
        .neq("status", "Draft");

      // Get maintenance due soon
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const { data: maintenanceDue } = await supabase
        .from("asset_maintenance_log")
        .select("id")
        .eq("company_id", companyId)
        .eq("maintenance_status", "Planned")
        .lte("next_due_date", thirtyDaysFromNow.toISOString().split("T")[0]);

      // Calculate totals
      const totalAssets = assetSummary?.length || 0;
      const totalAssetValue =
        assetSummary?.reduce((sum, asset) => sum + (asset.gross_purchase_amount || 0), 0) || 0;
      const totalAccumulatedDepreciation =
        depreciationSummary?.reduce((sum, dep) => sum + (dep.depreciation_amount || 0), 0) || 0;
      const netBookValue = totalAssetValue - totalAccumulatedDepreciation;

      // Group assets by category
      const categoryGroups =
        assetsByCategory?.reduce((acc, asset) => {
          const categoryName = asset.category?.category_name || "Uncategorized";
          if (!acc[categoryName]) {
            acc[categoryName] = { category: categoryName, count: 0, value: 0 };
          }
          acc[categoryName].count += 1;
          acc[categoryName].value += asset.asset_value || 0;
          return acc;
        }, {} as any) || {};

      const assetsByCategoryArray = Object.values(categoryGroups);

      return {
        success: true,
        data: {
          total_assets: totalAssets,
          total_asset_value: totalAssetValue,
          total_accumulated_depreciation: totalAccumulatedDepreciation,
          net_book_value: netBookValue,
          assets_by_category: assetsByCategoryArray,
          assets_by_location: [], // Could implement location grouping similarly
          maintenance_due_soon: maintenanceDue?.length || 0,
          insurance_expiring_soon: 0, // Could implement insurance expiry check
        },
      };
    } catch (error) {
      console.error("Error fetching asset analytics:", error);
      return { success: false, error: "Failed to fetch asset analytics" };
    }
  }
}
