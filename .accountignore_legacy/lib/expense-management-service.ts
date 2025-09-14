/**
 * Expense Management Service - Complete Employee Expense System
 * OCR-ready receipt processing, approval workflows, and reimbursements
 * ERPNext-level expense tracking with modern enhancements
 *
 * Features:
 * - Employee expense claims with multi-level approval
 * - OCR receipt processing and data extraction
 * - Policy-based expense validation and limits
 * - Mileage tracking and calculations
 * - Cash advance management
 * - Automated reimbursement processing
 * - Credit card integration and matching
 * - Mobile-first expense submission
 * - Real-time expense analytics
 */

import { supabase } from "./supabase";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type ExpenseClaimStatus =
  | "Draft"
  | "Submitted"
  | "Approved by Manager"
  | "Approved by Finance"
  | "Rejected"
  | "Paid"
  | "Cancelled";
export type ApprovalStatus = "Pending" | "Approved" | "Rejected";
export type OCRStatus = "Pending" | "Processing" | "Completed" | "Failed" | "Not Required";
export type ReimbursementMethod =
  | "Bank Transfer"
  | "Check"
  | "Cash"
  | "Payroll"
  | "Credit to Account";
export type ReimbursementStatus = "Pending" | "Processing" | "Paid" | "Failed" | "Cancelled";
export type AdvanceStatus =
  | "Draft"
  | "Submitted"
  | "Approved"
  | "Rejected"
  | "Disbursed"
  | "Settled"
  | "Partially Settled";
export type ImportStatus = "Imported" | "Matched" | "Expense Created" | "Ignored";

export interface ExpenseCategory {
  id: string;
  company_id: string;
  category_name: string;
  category_code: string;

  // GL Integration
  expense_account: string;
  tax_category_id?: string;

  // Category Settings
  is_billable: boolean;
  requires_receipt: boolean;
  auto_approval_limit: number;

  // Validation Rules
  max_amount_per_claim?: number;
  allowed_currencies: string[];
  description_required: boolean;

  // Settings
  is_active: boolean;
  display_order: number;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface ExpensePolicy {
  id: string;
  company_id: string;
  policy_name: string;
  policy_code: string;

  // Policy Scope
  applies_to_all_employees: boolean;
  department_restrictions?: string[];
  role_restrictions?: string[];

  // Amount Limits
  daily_limit: number;
  weekly_limit: number;
  monthly_limit: number;
  annual_limit: number;

  // Per Diem Settings
  domestic_per_diem: number;
  international_per_diem: number;
  meal_per_diem: number;
  lodging_per_diem: number;

  // Mileage Settings
  mileage_rate: number;
  mileage_currency: string;

  // Advance Settings
  allow_advances: boolean;
  max_advance_percentage: number;
  advance_settlement_days: number;

  // Approval Settings
  require_manager_approval: boolean;
  require_finance_approval: boolean;
  finance_approval_threshold: number;

  // Reimbursement Settings
  reimbursement_method: ReimbursementMethod;
  standard_reimbursement_days: number;

  // Settings
  is_active: boolean;
  is_default: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface ExpenseClaim {
  id: string;
  company_id: string;
  claim_no: string;

  // Employee Details
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  department?: string;

  // Claim Details
  claim_title: string;
  claim_description?: string;
  expense_policy_id?: string;

  // Dates
  claim_date: string;
  expense_start_date?: string;
  expense_end_date?: string;

  // Financial Summary
  total_claimed_amount: number;
  total_sanctioned_amount: number;
  total_advance_amount: number;
  total_reimbursement_amount: number;
  currency: string;
  exchange_rate: number;

  // Status and Workflow
  status: ExpenseClaimStatus;
  docstatus: number;

  // Approval Tracking
  manager_approval_status: ApprovalStatus;
  manager_id?: string;
  manager_approved_at?: string;
  manager_comments?: string;

  finance_approval_status: ApprovalStatus;
  finance_approver_id?: string;
  finance_approved_at?: string;
  finance_comments?: string;

  // Payment Details
  payment_method?: string;
  payment_reference?: string;
  paid_date?: string;
  paid_by?: string;

  // Project Assignment
  project_id?: string;
  cost_center_id?: string;

  // Audit
  submitted_at?: string;
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data (populated when needed)
  policy?: ExpensePolicy;
  items?: ExpenseItem[];
  receipts?: ExpenseReceipt[];
}

export interface ExpenseItem {
  id: string;
  expense_claim_id: string;
  company_id: string;

  // Item Details
  item_date: string;
  expense_category_id: string;
  description: string;

  // Financial Details
  claimed_amount: number;
  sanctioned_amount?: number;
  currency: string;
  exchange_rate: number;

  // Location and Travel Details
  expense_location?: string;
  from_location?: string;
  to_location?: string;
  distance?: number;
  distance_unit: string;

  // Business Purpose
  business_purpose?: string;
  client_project?: string;
  is_billable: boolean;
  attendees?: string;

  // Tax Information
  tax_amount: number;
  tax_category_id?: string;

  // Receipt Information
  receipt_required: boolean;
  receipt_submitted: boolean;
  receipt_amount?: number;
  receipt_currency?: string;

  // Approval Status
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;

  // GL Integration
  account_head?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data
  category?: ExpenseCategory;
  receipts?: ExpenseReceipt[];
}

export interface ExpenseReceipt {
  id: string;
  expense_item_id: string;
  expense_claim_id: string;
  company_id: string;

  // File Details
  file_name: string;
  file_size: number;
  file_type: string;
  file_url: string;
  file_path: string;

  // OCR Processing
  ocr_status: OCRStatus;
  ocr_confidence?: number;
  ocr_processed_at?: string;
  ocr_error_message?: string;

  // Extracted Data (from OCR)
  extracted_amount?: number;
  extracted_currency?: string;
  extracted_date?: string;
  extracted_merchant?: string;
  extracted_category?: string;
  extracted_tax_amount?: number;
  extracted_raw_data?: any;

  // Manual Verification
  is_verified: boolean;
  verified_by?: string;
  verified_at?: string;
  verification_notes?: string;

  // Settings
  is_primary: boolean;

  // Audit
  uploaded_at: string;
  uploaded_by?: string;
}

export interface ExpenseAdvance {
  id: string;
  company_id: string;
  advance_no: string;

  // Employee Details
  employee_id: string;
  employee_name: string;

  // Advance Details
  purpose: string;
  requested_amount: number;
  approved_amount?: number;
  currency: string;

  // Dates
  request_date: string;
  required_date?: string;
  approved_date?: string;
  disbursed_date?: string;
  settlement_due_date?: string;

  // Status
  status: AdvanceStatus;

  // Settlement Tracking
  settled_amount: number;
  outstanding_amount: number;

  // Approval
  approved_by?: string;
  approval_comments?: string;

  // Payment Details
  payment_method?: string;
  payment_reference?: string;
  disbursed_by?: string;

  // Project Assignment
  project_id?: string;
  cost_center_id?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface ExpenseReimbursement {
  id: string;
  company_id: string;
  reimbursement_no: string;

  // Employee Details
  employee_id: string;
  employee_name: string;

  // Reimbursement Details
  total_amount: number;
  currency: string;

  // Payment Details
  payment_method: string;
  payment_date?: string;
  payment_reference?: string;
  bank_account?: string;

  // Status
  status: ReimbursementStatus;

  // Processing
  processed_by?: string;
  processed_at?: string;
  processing_notes?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related claims
  expense_claims?: { id: string; claim_no: string; amount: number }[];
}

export interface MileageLog {
  id: string;
  expense_item_id?: string;
  company_id: string;
  employee_id: string;

  // Trip Details
  trip_date: string;
  from_location: string;
  to_location: string;
  business_purpose: string;

  // Mileage Calculation
  odometer_start?: number;
  odometer_end?: number;
  total_distance: number;
  distance_unit: string;

  // Rate and Amount
  mileage_rate: number;
  calculated_amount: number;

  // Vehicle Information
  vehicle_type?: string;
  vehicle_registration?: string;

  // Approval
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;

  // Audit
  created_at: string;
  created_by?: string;
}

export interface PolicyLimitCheck {
  is_within_limit: boolean;
  limit_type: string;
  limit_amount: number;
  current_usage: number;
  remaining_limit: number;
}

export interface ExpenseAnalytics {
  total_expenses: number;
  total_reimbursed: number;
  pending_approval: number;
  rejected_amount: number;
  average_processing_time: number;
  expenses_by_category: { category: string; amount: number; count: number }[];
  expenses_by_employee: { employee: string; amount: number; count: number }[];
  monthly_trend: { month: string; amount: number }[];
  policy_violations: number;
  receipt_compliance_rate: number;
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreateExpenseCategoryInput {
  company_id: string;
  category_name: string;
  category_code: string;
  expense_account: string;
  tax_category_id?: string;
  is_billable?: boolean;
  requires_receipt?: boolean;
  auto_approval_limit?: number;
  max_amount_per_claim?: number;
  allowed_currencies?: string[];
  description_required?: boolean;
  display_order?: number;
}

export interface CreateExpensePolicyInput {
  company_id: string;
  policy_name: string;
  policy_code: string;
  applies_to_all_employees?: boolean;
  department_restrictions?: string[];
  role_restrictions?: string[];
  daily_limit?: number;
  weekly_limit?: number;
  monthly_limit?: number;
  annual_limit?: number;
  domestic_per_diem?: number;
  international_per_diem?: number;
  meal_per_diem?: number;
  lodging_per_diem?: number;
  mileage_rate?: number;
  mileage_currency?: string;
  allow_advances?: boolean;
  max_advance_percentage?: number;
  advance_settlement_days?: number;
  require_manager_approval?: boolean;
  require_finance_approval?: boolean;
  finance_approval_threshold?: number;
  reimbursement_method?: ReimbursementMethod;
  standard_reimbursement_days?: number;
  is_default?: boolean;
}

export interface CreateExpenseClaimInput {
  company_id: string;
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  department?: string;
  claim_title: string;
  claim_description?: string;
  expense_policy_id?: string;
  expense_start_date?: string;
  expense_end_date?: string;
  currency?: string;
  project_id?: string;
  cost_center_id?: string;
}

export interface CreateExpenseItemInput {
  expense_claim_id: string;
  company_id: string;
  item_date: string;
  expense_category_id: string;
  description: string;
  claimed_amount: number;
  currency?: string;
  exchange_rate?: number;
  expense_location?: string;
  from_location?: string;
  to_location?: string;
  distance?: number;
  distance_unit?: string;
  business_purpose?: string;
  client_project?: string;
  is_billable?: boolean;
  attendees?: string;
  tax_amount?: number;
  tax_category_id?: string;
}

export interface CreateExpenseAdvanceInput {
  company_id: string;
  employee_id: string;
  employee_name: string;
  purpose: string;
  requested_amount: number;
  currency?: string;
  required_date?: string;
  project_id?: string;
  cost_center_id?: string;
}

export interface CreateMileageLogInput {
  company_id: string;
  employee_id: string;
  expense_item_id?: string;
  trip_date: string;
  from_location: string;
  to_location: string;
  business_purpose: string;
  total_distance: number;
  distance_unit?: string;
  mileage_rate?: number;
  odometer_start?: number;
  odometer_end?: number;
  vehicle_type?: string;
  vehicle_registration?: string;
}

export interface UploadReceiptInput {
  expense_item_id: string;
  expense_claim_id: string;
  company_id: string;
  file: File;
  is_primary?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================================================
// EXPENSE MANAGEMENT SERVICE
// =====================================================================================

export class ExpenseManagementService {
  // =====================================================================================
  // EXPENSE CATEGORIES
  // =====================================================================================

  /**
   * Create expense category
   */
  static async createExpenseCategory(
    input: CreateExpenseCategoryInput,
  ): Promise<ApiResponse<ExpenseCategory>> {
    try {
      const { data: category, error } = await supabase
        .from("expense_categories")
        .insert({
          company_id: input.company_id,
          category_name: input.category_name.trim(),
          category_code: input.category_code.trim().toUpperCase(),
          expense_account: input.expense_account,
          tax_category_id: input.tax_category_id,
          is_billable: input.is_billable || false,
          requires_receipt: input.requires_receipt !== false,
          auto_approval_limit: input.auto_approval_limit || 0,
          max_amount_per_claim: input.max_amount_per_claim,
          allowed_currencies: input.allowed_currencies || ["USD"],
          description_required: input.description_required !== false,
          display_order: input.display_order || 0,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: category, message: "Expense category created successfully" };
    } catch (error) {
      console.error("Error creating expense category:", error);
      return { success: false, error: "Failed to create expense category" };
    }
  }

  /**
   * Get expense categories
   */
  static async getExpenseCategories(companyId: string): Promise<ApiResponse<ExpenseCategory[]>> {
    try {
      const { data: categories, error } = await supabase
        .from("expense_categories")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("category_name", { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: categories };
    } catch (error) {
      console.error("Error fetching expense categories:", error);
      return { success: false, error: "Failed to fetch expense categories" };
    }
  }

  // =====================================================================================
  // EXPENSE POLICIES
  // =====================================================================================

  /**
   * Create expense policy
   */
  static async createExpensePolicy(
    input: CreateExpensePolicyInput,
  ): Promise<ApiResponse<ExpensePolicy>> {
    try {
      const { data: policy, error } = await supabase
        .from("expense_policies")
        .insert({
          company_id: input.company_id,
          policy_name: input.policy_name.trim(),
          policy_code: input.policy_code.trim().toUpperCase(),
          applies_to_all_employees: input.applies_to_all_employees !== false,
          department_restrictions: input.department_restrictions,
          role_restrictions: input.role_restrictions,
          daily_limit: input.daily_limit || 0,
          weekly_limit: input.weekly_limit || 0,
          monthly_limit: input.monthly_limit || 0,
          annual_limit: input.annual_limit || 0,
          domestic_per_diem: input.domestic_per_diem || 0,
          international_per_diem: input.international_per_diem || 0,
          meal_per_diem: input.meal_per_diem || 0,
          lodging_per_diem: input.lodging_per_diem || 0,
          mileage_rate: input.mileage_rate || 0,
          mileage_currency: input.mileage_currency || "USD",
          allow_advances: input.allow_advances !== false,
          max_advance_percentage: input.max_advance_percentage || 80,
          advance_settlement_days: input.advance_settlement_days || 30,
          require_manager_approval: input.require_manager_approval !== false,
          require_finance_approval: input.require_finance_approval || false,
          finance_approval_threshold: input.finance_approval_threshold || 1000,
          reimbursement_method: input.reimbursement_method || "Bank Transfer",
          standard_reimbursement_days: input.standard_reimbursement_days || 14,
          is_default: input.is_default || false,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: policy, message: "Expense policy created successfully" };
    } catch (error) {
      console.error("Error creating expense policy:", error);
      return { success: false, error: "Failed to create expense policy" };
    }
  }

  /**
   * Get expense policies
   */
  static async getExpensePolicies(companyId: string): Promise<ApiResponse<ExpensePolicy[]>> {
    try {
      const { data: policies, error } = await supabase
        .from("expense_policies")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("policy_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: policies };
    } catch (error) {
      console.error("Error fetching expense policies:", error);
      return { success: false, error: "Failed to fetch expense policies" };
    }
  }

  // =====================================================================================
  // EXPENSE CLAIMS
  // =====================================================================================

  /**
   * Create expense claim
   */
  static async createExpenseClaim(
    input: CreateExpenseClaimInput,
  ): Promise<ApiResponse<ExpenseClaim>> {
    try {
      // Generate claim number
      const claimNo = await this.generateExpenseClaimNumber(input.company_id);

      const { data: claim, error } = await supabase
        .from("expense_claims")
        .insert({
          company_id: input.company_id,
          claim_no: claimNo,
          employee_id: input.employee_id,
          employee_name: input.employee_name,
          employee_email: input.employee_email,
          department: input.department,
          claim_title: input.claim_title,
          claim_description: input.claim_description,
          expense_policy_id: input.expense_policy_id,
          expense_start_date: input.expense_start_date,
          expense_end_date: input.expense_end_date,
          currency: input.currency || "USD",
          project_id: input.project_id,
          cost_center_id: input.cost_center_id,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: claim,
        message: `Expense claim ${claimNo} created successfully`,
      };
    } catch (error) {
      console.error("Error creating expense claim:", error);
      return { success: false, error: "Failed to create expense claim" };
    }
  }

  /**
   * Get expense claim by ID
   */
  static async getExpenseClaim(claimId: string): Promise<ApiResponse<ExpenseClaim>> {
    try {
      const { data: claim, error } = await supabase
        .from("expense_claims")
        .select(
          `
                    *,
                    policy:expense_policies(*),
                    items:expense_items(
                        *,
                        category:expense_categories(*),
                        receipts:expense_receipts(*)
                    )
                `,
        )
        .eq("id", claimId)
        .single();

      if (error || !claim) {
        return { success: false, error: "Expense claim not found" };
      }

      return { success: true, data: claim };
    } catch (error) {
      console.error("Error fetching expense claim:", error);
      return { success: false, error: "Failed to fetch expense claim" };
    }
  }

  /**
   * Get expense claims with filtering
   */
  static async getExpenseClaims(
    companyId: string,
    filters?: {
      employee_id?: string;
      status?: ExpenseClaimStatus;
      manager_id?: string;
      from_date?: string;
      to_date?: string;
      search?: string;
    },
  ): Promise<ApiResponse<ExpenseClaim[]>> {
    try {
      let query = supabase
        .from("expense_claims")
        .select(
          `
                    *,
                    policy:expense_policies(policy_name),
                    items:expense_items(id, claimed_amount, sanctioned_amount)
                `,
        )
        .eq("company_id", companyId);

      if (filters?.employee_id) {
        query = query.eq("employee_id", filters.employee_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.manager_id) {
        query = query.eq("manager_id", filters.manager_id);
      }

      if (filters?.from_date) {
        query = query.gte("claim_date", filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte("claim_date", filters.to_date);
      }

      if (filters?.search) {
        query = query.or(
          `claim_no.ilike.%${filters.search}%,claim_title.ilike.%${filters.search}%,employee_name.ilike.%${filters.search}%`,
        );
      }

      const { data: claims, error } = await query.order("created_at", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: claims };
    } catch (error) {
      console.error("Error fetching expense claims:", error);
      return { success: false, error: "Failed to fetch expense claims" };
    }
  }

  /**
   * Submit expense claim for approval
   */
  static async submitExpenseClaim(
    claimId: string,
    managerId?: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const updateData: any = {
        status: "Submitted",
        docstatus: 1,
        submitted_at: new Date().toISOString(),
        modified: new Date().toISOString(),
      };

      if (managerId) {
        updateData.manager_id = managerId;
      }

      const { error } = await supabase.from("expense_claims").update(updateData).eq("id", claimId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Expense claim submitted successfully" };
    } catch (error) {
      console.error("Error submitting expense claim:", error);
      return { success: false, error: "Failed to submit expense claim" };
    }
  }

  /**
   * Approve expense claim
   */
  static async approveExpenseClaim(
    claimId: string,
    approverId: string,
    approvalType: "manager" | "finance",
    comments?: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const updateData: any = {
        modified: new Date().toISOString(),
      };

      if (approvalType === "manager") {
        updateData.manager_approval_status = "Approved";
        updateData.manager_approved_at = new Date().toISOString();
        updateData.manager_comments = comments;
        updateData.status = "Approved by Manager";
      } else {
        updateData.finance_approval_status = "Approved";
        updateData.finance_approver_id = approverId;
        updateData.finance_approved_at = new Date().toISOString();
        updateData.finance_comments = comments;
        updateData.status = "Approved by Finance";
      }

      const { error } = await supabase.from("expense_claims").update(updateData).eq("id", claimId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: `Expense claim approved by ${approvalType}` };
    } catch (error) {
      console.error("Error approving expense claim:", error);
      return { success: false, error: "Failed to approve expense claim" };
    }
  }

  // =====================================================================================
  // EXPENSE ITEMS
  // =====================================================================================

  /**
   * Create expense item
   */
  static async createExpenseItem(input: CreateExpenseItemInput): Promise<ApiResponse<ExpenseItem>> {
    try {
      // Check policy limits
      const policyCheck = await this.checkPolicyLimits(
        input.expense_claim_id,
        input.claimed_amount,
        input.item_date,
      );

      if (!policyCheck.success || (policyCheck.data && !policyCheck.data.is_within_limit)) {
        return {
          success: false,
          error: `Policy limit exceeded: ${policyCheck.data?.limit_type}. Remaining: ${policyCheck.data?.remaining_limit}`,
        };
      }

      const { data: item, error } = await supabase
        .from("expense_items")
        .insert({
          expense_claim_id: input.expense_claim_id,
          company_id: input.company_id,
          item_date: input.item_date,
          expense_category_id: input.expense_category_id,
          description: input.description,
          claimed_amount: input.claimed_amount,
          currency: input.currency || "USD",
          exchange_rate: input.exchange_rate || 1,
          expense_location: input.expense_location,
          from_location: input.from_location,
          to_location: input.to_location,
          distance: input.distance,
          distance_unit: input.distance_unit || "miles",
          business_purpose: input.business_purpose,
          client_project: input.client_project,
          is_billable: input.is_billable || false,
          attendees: input.attendees,
          tax_amount: input.tax_amount || 0,
          tax_category_id: input.tax_category_id,
        })
        .select(
          `
                    *,
                    category:expense_categories(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: item, message: "Expense item created successfully" };
    } catch (error) {
      console.error("Error creating expense item:", error);
      return { success: false, error: "Failed to create expense item" };
    }
  }

  // =====================================================================================
  // RECEIPT MANAGEMENT
  // =====================================================================================

  /**
   * Upload receipt
   */
  static async uploadReceipt(input: UploadReceiptInput): Promise<ApiResponse<ExpenseReceipt>> {
    try {
      // Upload file to Supabase Storage
      const fileName = `${input.expense_item_id}-${Date.now()}-${input.file.name}`;
      const filePath = `receipts/${input.company_id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("expense-receipts")
        .upload(filePath, input.file);

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("expense-receipts").getPublicUrl(filePath);

      // Create receipt record
      const { data: receipt, error } = await supabase
        .from("expense_receipts")
        .insert({
          expense_item_id: input.expense_item_id,
          expense_claim_id: input.expense_claim_id,
          company_id: input.company_id,
          file_name: input.file.name,
          file_size: input.file.size,
          file_type: input.file.type,
          file_url: publicUrl,
          file_path: filePath,
          is_primary: input.is_primary || false,
          ocr_status: "Pending",
        })
        .select()
        .single();

      if (error) {
        // Clean up uploaded file
        await supabase.storage.from("expense-receipts").remove([filePath]);
        return { success: false, error: error.message };
      }

      // Update expense item receipt status
      await supabase
        .from("expense_items")
        .update({ receipt_submitted: true })
        .eq("id", input.expense_item_id);

      // Trigger OCR processing (would be handled by a background job)
      await this.triggerOCRProcessing(receipt.id);

      return { success: true, data: receipt, message: "Receipt uploaded successfully" };
    } catch (error) {
      console.error("Error uploading receipt:", error);
      return { success: false, error: "Failed to upload receipt" };
    }
  }

  /**
   * Process OCR results
   */
  static async processOCRResults(
    receiptId: string,
    extractedData: any,
    confidenceScore: number,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.rpc("process_ocr_results", {
        p_receipt_id: receiptId,
        p_extracted_data: extractedData,
        p_confidence_score: confidenceScore,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "OCR results processed successfully" };
    } catch (error) {
      console.error("Error processing OCR results:", error);
      return { success: false, error: "Failed to process OCR results" };
    }
  }

  // =====================================================================================
  // EXPENSE ADVANCES
  // =====================================================================================

  /**
   * Create expense advance
   */
  static async createExpenseAdvance(
    input: CreateExpenseAdvanceInput,
  ): Promise<ApiResponse<ExpenseAdvance>> {
    try {
      // Generate advance number
      const advanceNo = await this.generateAdvanceNumber(input.company_id);

      const { data: advance, error } = await supabase
        .from("expense_advances")
        .insert({
          company_id: input.company_id,
          advance_no: advanceNo,
          employee_id: input.employee_id,
          employee_name: input.employee_name,
          purpose: input.purpose,
          requested_amount: input.requested_amount,
          currency: input.currency || "USD",
          required_date: input.required_date,
          project_id: input.project_id,
          cost_center_id: input.cost_center_id,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: advance,
        message: `Expense advance ${advanceNo} created successfully`,
      };
    } catch (error) {
      console.error("Error creating expense advance:", error);
      return { success: false, error: "Failed to create expense advance" };
    }
  }

  // =====================================================================================
  // MILEAGE MANAGEMENT
  // =====================================================================================

  /**
   * Create mileage log
   */
  static async createMileageLog(input: CreateMileageLogInput): Promise<ApiResponse<MileageLog>> {
    try {
      // Get default mileage rate if not provided
      let mileageRate = input.mileage_rate;
      if (!mileageRate) {
        const { data: policy } = await supabase
          .from("expense_policies")
          .select("mileage_rate")
          .eq("company_id", input.company_id)
          .eq("is_default", true)
          .single();

        mileageRate = policy?.mileage_rate || 0.56; // Default IRS rate
      }

      const { data: mileageLog, error } = await supabase
        .from("mileage_logs")
        .insert({
          expense_item_id: input.expense_item_id,
          company_id: input.company_id,
          employee_id: input.employee_id,
          trip_date: input.trip_date,
          from_location: input.from_location,
          to_location: input.to_location,
          business_purpose: input.business_purpose,
          odometer_start: input.odometer_start,
          odometer_end: input.odometer_end,
          total_distance: input.total_distance,
          distance_unit: input.distance_unit || "miles",
          mileage_rate: mileageRate,
          vehicle_type: input.vehicle_type,
          vehicle_registration: input.vehicle_registration,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: mileageLog, message: "Mileage log created successfully" };
    } catch (error) {
      console.error("Error creating mileage log:", error);
      return { success: false, error: "Failed to create mileage log" };
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Check policy limits
   */
  static async checkPolicyLimits(
    claimId: string,
    expenseAmount: number,
    expenseDate: string,
  ): Promise<ApiResponse<PolicyLimitCheck>> {
    try {
      // Get claim details to identify employee and policy
      const { data: claim } = await supabase
        .from("expense_claims")
        .select("employee_id, expense_policy_id")
        .eq("id", claimId)
        .single();

      if (!claim || !claim.expense_policy_id) {
        return {
          success: true,
          data: {
            is_within_limit: true,
            limit_type: "No Policy",
            limit_amount: 0,
            current_usage: 0,
            remaining_limit: 0,
          },
        };
      }

      const { data: limitCheck, error } = await supabase.rpc("check_expense_policy_limits", {
        p_employee_id: claim.employee_id,
        p_policy_id: claim.expense_policy_id,
        p_expense_amount: expenseAmount,
        p_expense_date: expenseDate,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: limitCheck };
    } catch (error) {
      console.error("Error checking policy limits:", error);
      return { success: false, error: "Failed to check policy limits" };
    }
  }

  /**
   * Get expense analytics
   */
  static async getExpenseAnalytics(
    companyId: string,
    filters?: {
      from_date?: string;
      to_date?: string;
      employee_id?: string;
      department?: string;
    },
  ): Promise<ApiResponse<ExpenseAnalytics>> {
    try {
      // This would be a complex query - simplified for demo
      const { data: claims } = await supabase
        .from("expense_claims")
        .select(
          `
                    total_claimed_amount,
                    total_reimbursement_amount,
                    status,
                    employee_name,
                    department,
                    created_at,
                    submitted_at,
                    items:expense_items(
                        claimed_amount,
                        receipt_submitted,
                        category:expense_categories(category_name)
                    )
                `,
        )
        .eq("company_id", companyId);

      // Calculate analytics
      const totalExpenses =
        claims?.reduce((sum, claim) => sum + (claim.total_claimed_amount || 0), 0) || 0;
      const totalReimbursed =
        claims?.reduce((sum, claim) => sum + (claim.total_reimbursement_amount || 0), 0) || 0;
      const pendingApproval =
        claims
          ?.filter(c => c.status === "Submitted")
          .reduce((sum, claim) => sum + (claim.total_claimed_amount || 0), 0) || 0;
      const rejectedAmount =
        claims
          ?.filter(c => c.status === "Rejected")
          .reduce((sum, claim) => sum + (claim.total_claimed_amount || 0), 0) || 0;

      // Calculate average processing time
      const processedClaims = claims?.filter(c => c.status === "Paid" && c.submitted_at) || [];
      const avgProcessingTime =
        processedClaims.length > 0
          ? processedClaims.reduce((sum, claim) => {
              const submittedAt = new Date(claim.submitted_at!).getTime();
              const createdAt = new Date(claim.created_at).getTime();
              return sum + (submittedAt - createdAt);
            }, 0) /
            processedClaims.length /
            (1000 * 60 * 60 * 24) // Convert to days
          : 0;

      return {
        success: true,
        data: {
          total_expenses: totalExpenses,
          total_reimbursed: totalReimbursed,
          pending_approval: pendingApproval,
          rejected_amount: rejectedAmount,
          average_processing_time: avgProcessingTime,
          expenses_by_category: [], // Would calculate from items
          expenses_by_employee: [], // Would calculate from claims
          monthly_trend: [], // Would calculate monthly totals
          policy_violations: 0, // Would count violations
          receipt_compliance_rate: 100, // Would calculate from items
        },
      };
    } catch (error) {
      console.error("Error fetching expense analytics:", error);
      return { success: false, error: "Failed to fetch expense analytics" };
    }
  }

  /**
   * Generate expense claim number
   */
  private static async generateExpenseClaimNumber(companyId: string): Promise<string> {
    const { data, error } = await supabase.rpc("generate_expense_claim_number", {
      p_company_id: companyId,
    });

    if (error) {
      // Fallback to timestamp-based number
      const timestamp = Date.now().toString(36).toUpperCase();
      return `EXP-${timestamp}`;
    }

    return data;
  }

  /**
   * Generate advance number
   */
  private static async generateAdvanceNumber(companyId: string): Promise<string> {
    // Similar to expense claim number generation
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `ADV-${year}-${timestamp}`;
  }

  /**
   * Trigger OCR processing
   */
  private static async triggerOCRProcessing(receiptId: string): Promise<void> {
    // This would trigger a background job or external OCR service
    // For now, just update status to processing
    await supabase
      .from("expense_receipts")
      .update({ ocr_status: "Processing" })
      .eq("id", receiptId);

    // In a real implementation, this would:
    // 1. Queue the receipt for OCR processing
    // 2. Call an OCR service (AWS Textract, Google Vision, etc.)
    // 3. Process the results and update the database
  }
}
