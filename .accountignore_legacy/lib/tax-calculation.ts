/**
 * Tax Calculation Engine Service
 * Handles tax rates, calculations, and compliance
 */

import { supabase } from "./supabase";

export type TaxType = "Sales Tax" | "VAT" | "GST" | "Income Tax" | "Withholding Tax" | "Custom";
export type TransactionType = "Sales Invoice" | "Purchase Invoice" | "Payment" | "Journal Entry";
export type ReturnType = "Sales Tax Return" | "VAT Return" | "GST Return" | "Income Tax Return";
export type FilingStatus = "Draft" | "Ready" | "Filed" | "Accepted" | "Rejected";
export type ExemptionType = "Customer" | "Product" | "Transaction" | "Amount";
export type RuleType = "Customer Type" | "Product Category" | "Amount Threshold" | "Date Range";
export type RuleOperator = "equals" | "contains" | "greater_than" | "less_than" | "between";

export interface TaxCategory {
  id: string;
  companyId: string;
  categoryName: string;
  categoryCode: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxRate {
  id: string;
  companyId: string;
  taxCategoryId: string;
  rateName: string;
  rateCode: string;
  taxType: TaxType;
  ratePercentage: number;
  isCompound: boolean;
  isInclusive: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  jurisdiction?: string;
  taxAuthority?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxGroup {
  id: string;
  companyId: string;
  groupName: string;
  groupCode: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaxCalculation {
  id: string;
  companyId: string;
  transactionId: string;
  transactionType: TransactionType;
  taxGroupId?: string;
  baseAmount: number;
  totalTaxAmount: number;
  totalAmount: number;
  calculationDate: string;
  isReversed: boolean;
  reversedAt?: string;
  createdAt: string;
}

export interface TaxCalculationDetail {
  id: string;
  calculationId: string;
  taxRateId: string;
  taxCategoryId: string;
  baseAmount: number;
  taxRate: number;
  taxAmount: number;
  isCompound: boolean;
  calculationOrder: number;
  createdAt: string;
}

export interface TaxReturn {
  id: string;
  companyId: string;
  returnName: string;
  returnType: ReturnType;
  taxPeriodStart: string;
  taxPeriodEnd: string;
  dueDate: string;
  filingStatus: FilingStatus;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  totalRefundAmount: number;
  filedAt?: string;
  filedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaxReturnItem {
  id: string;
  returnId: string;
  taxCategoryId: string;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  createdAt: string;
}

export interface TaxSummary {
  taxCategoryId: string;
  categoryName: string;
  totalTaxableAmount: number;
  totalTaxAmount: number;
  transactionCount: number;
}

export interface CreateTaxCategoryInput {
  companyId: string;
  categoryName: string;
  categoryCode: string;
  description?: string;
}

export interface CreateTaxRateInput {
  companyId: string;
  taxCategoryId: string;
  rateName: string;
  rateCode: string;
  taxType: TaxType;
  ratePercentage: number;
  isCompound?: boolean;
  isInclusive?: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  jurisdiction?: string;
  taxAuthority?: string;
}

export interface CreateTaxGroupInput {
  companyId: string;
  groupName: string;
  groupCode: string;
  description?: string;
  taxRateIds: string[];
}

export interface CalculateTaxInput {
  companyId: string;
  transactionId: string;
  transactionType: TransactionType;
  baseAmount: number;
  taxGroupId?: string;
  calculationDate?: string;
}

export class TaxCalculationService {
  /**
   * Create a tax category
   */
  static async createTaxCategory(
    input: CreateTaxCategoryInput,
  ): Promise<{ success: boolean; category?: TaxCategory; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_categories")
        .insert({
          company_id: input.companyId,
          category_name: input.categoryName,
          category_code: input.categoryCode,
          description: input.description,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating tax category:", error);
        return { success: false, error: "Failed to create tax category" };
      }

      const category: TaxCategory = {
        id: data.id,
        companyId: data.company_id,
        categoryName: data.category_name,
        categoryCode: data.category_code,
        description: data.description,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, category };
    } catch (error) {
      console.error("Error creating tax category:", error);
      return { success: false, error: "Failed to create tax category" };
    }
  }

  /**
   * Get tax categories
   */
  static async getTaxCategories(
    companyId: string,
  ): Promise<{ success: boolean; categories?: TaxCategory[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_categories")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("category_name", { ascending: true });

      if (error) {
        console.error("Error fetching tax categories:", error);
        return { success: false, error: "Failed to fetch tax categories" };
      }

      const categories: TaxCategory[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        categoryName: item.category_name,
        categoryCode: item.category_code,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, categories };
    } catch (error) {
      console.error("Error fetching tax categories:", error);
      return { success: false, error: "Failed to fetch tax categories" };
    }
  }

  /**
   * Create a tax rate
   */
  static async createTaxRate(
    input: CreateTaxRateInput,
  ): Promise<{ success: boolean; rate?: TaxRate; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_rates")
        .insert({
          company_id: input.companyId,
          tax_category_id: input.taxCategoryId,
          rate_name: input.rateName,
          rate_code: input.rateCode,
          tax_type: input.taxType,
          rate_percentage: input.ratePercentage,
          is_compound: input.isCompound || false,
          is_inclusive: input.isInclusive || false,
          effective_from: input.effectiveFrom,
          effective_to: input.effectiveTo,
          jurisdiction: input.jurisdiction,
          tax_authority: input.taxAuthority,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating tax rate:", error);
        return { success: false, error: "Failed to create tax rate" };
      }

      const rate: TaxRate = {
        id: data.id,
        companyId: data.company_id,
        taxCategoryId: data.tax_category_id,
        rateName: data.rate_name,
        rateCode: data.rate_code,
        taxType: data.tax_type,
        ratePercentage: data.rate_percentage,
        isCompound: data.is_compound,
        isInclusive: data.is_inclusive,
        effectiveFrom: data.effective_from,
        effectiveTo: data.effective_to,
        jurisdiction: data.jurisdiction,
        taxAuthority: data.tax_authority,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, rate };
    } catch (error) {
      console.error("Error creating tax rate:", error);
      return { success: false, error: "Failed to create tax rate" };
    }
  }

  /**
   * Get tax rates
   */
  static async getTaxRates(
    companyId: string,
  ): Promise<{ success: boolean; rates?: TaxRate[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_rates")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("effective_from", { ascending: false });

      if (error) {
        console.error("Error fetching tax rates:", error);
        return { success: false, error: "Failed to fetch tax rates" };
      }

      const rates: TaxRate[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        taxCategoryId: item.tax_category_id,
        rateName: item.rate_name,
        rateCode: item.rate_code,
        taxType: item.tax_type,
        ratePercentage: item.rate_percentage,
        isCompound: item.is_compound,
        isInclusive: item.is_inclusive,
        effectiveFrom: item.effective_from,
        effectiveTo: item.effective_to,
        jurisdiction: item.jurisdiction,
        taxAuthority: item.tax_authority,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, rates };
    } catch (error) {
      console.error("Error fetching tax rates:", error);
      return { success: false, error: "Failed to fetch tax rates" };
    }
  }

  /**
   * Create a tax group
   */
  static async createTaxGroup(
    input: CreateTaxGroupInput,
  ): Promise<{ success: boolean; group?: TaxGroup; error?: string }> {
    try {
      // Create tax group
      const { data: groupData, error: groupError } = await supabase
        .from("tax_groups")
        .insert({
          company_id: input.companyId,
          group_name: input.groupName,
          group_code: input.groupCode,
          description: input.description,
        })
        .select()
        .single();

      if (groupError) {
        console.error("Error creating tax group:", groupError);
        return { success: false, error: "Failed to create tax group" };
      }

      // Add tax rates to group
      if (input.taxRateIds.length > 0) {
        const groupItems = input.taxRateIds.map((rateId, index) => ({
          tax_group_id: groupData.id,
          tax_rate_id: rateId,
          calculation_order: index + 1,
        }));

        const { error: itemsError } = await supabase.from("tax_group_items").insert(groupItems);

        if (itemsError) {
          console.error("Error adding tax rates to group:", itemsError);
          return { success: false, error: "Failed to add tax rates to group" };
        }
      }

      const group: TaxGroup = {
        id: groupData.id,
        companyId: groupData.company_id,
        groupName: groupData.group_name,
        groupCode: groupData.group_code,
        description: groupData.description,
        isActive: groupData.is_active,
        createdAt: groupData.created_at,
        updatedAt: groupData.updated_at,
      };

      return { success: true, group };
    } catch (error) {
      console.error("Error creating tax group:", error);
      return { success: false, error: "Failed to create tax group" };
    }
  }

  /**
   * Get tax groups
   */
  static async getTaxGroups(
    companyId: string,
  ): Promise<{ success: boolean; groups?: TaxGroup[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_groups")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("group_name", { ascending: true });

      if (error) {
        console.error("Error fetching tax groups:", error);
        return { success: false, error: "Failed to fetch tax groups" };
      }

      const groups: TaxGroup[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        groupName: item.group_name,
        groupCode: item.group_code,
        description: item.description,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, groups };
    } catch (error) {
      console.error("Error fetching tax groups:", error);
      return { success: false, error: "Failed to fetch tax groups" };
    }
  }

  /**
   * Calculate tax for a transaction
   */
  static async calculateTax(
    input: CalculateTaxInput,
  ): Promise<{ success: boolean; calculation?: TaxCalculation; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("calculate_tax", {
        p_company_id: input.companyId,
        p_transaction_id: input.transactionId,
        p_transaction_type: input.transactionType,
        p_base_amount: input.baseAmount,
        p_tax_group_id: input.taxGroupId || null,
        p_calculation_date: input.calculationDate || new Date().toISOString().split("T")[0],
      });

      if (error) {
        console.error("Error calculating tax:", error);
        return { success: false, error: "Failed to calculate tax" };
      }

      if (data && data.length > 0) {
        const result = data[0];
        const calculation: TaxCalculation = {
          id: result.calculation_id,
          companyId: input.companyId,
          transactionId: input.transactionId,
          transactionType: input.transactionType,
          taxGroupId: input.taxGroupId,
          baseAmount: input.baseAmount,
          totalTaxAmount: result.total_tax_amount,
          totalAmount: result.total_amount,
          calculationDate: input.calculationDate || new Date().toISOString().split("T")[0],
          isReversed: false,
          createdAt: new Date().toISOString(),
        };

        return { success: true, calculation };
      }

      return { success: false, error: "No calculation data returned" };
    } catch (error) {
      console.error("Error calculating tax:", error);
      return { success: false, error: "Failed to calculate tax" };
    }
  }

  /**
   * Get tax calculations for a transaction
   */
  static async getTaxCalculations(
    transactionId: string,
    transactionType: TransactionType,
  ): Promise<{ success: boolean; calculations?: TaxCalculation[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_calculations")
        .select("*")
        .eq("transaction_id", transactionId)
        .eq("transaction_type", transactionType)
        .eq("is_reversed", false)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tax calculations:", error);
        return { success: false, error: "Failed to fetch tax calculations" };
      }

      const calculations: TaxCalculation[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        transactionId: item.transaction_id,
        transactionType: item.transaction_type,
        taxGroupId: item.tax_group_id,
        baseAmount: item.base_amount,
        totalTaxAmount: item.total_tax_amount,
        totalAmount: item.total_amount,
        calculationDate: item.calculation_date,
        isReversed: item.is_reversed,
        reversedAt: item.reversed_at,
        createdAt: item.created_at,
      }));

      return { success: true, calculations };
    } catch (error) {
      console.error("Error fetching tax calculations:", error);
      return { success: false, error: "Failed to fetch tax calculations" };
    }
  }

  /**
   * Get tax calculation details
   */
  static async getTaxCalculationDetails(
    calculationId: string,
  ): Promise<{ success: boolean; details?: TaxCalculationDetail[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_calculation_details")
        .select("*")
        .eq("calculation_id", calculationId)
        .order("calculation_order", { ascending: true });

      if (error) {
        console.error("Error fetching tax calculation details:", error);
        return { success: false, error: "Failed to fetch tax calculation details" };
      }

      const details: TaxCalculationDetail[] = data.map(item => ({
        id: item.id,
        calculationId: item.calculation_id,
        taxRateId: item.tax_rate_id,
        taxCategoryId: item.tax_category_id,
        baseAmount: item.base_amount,
        taxRate: item.tax_rate,
        taxAmount: item.tax_amount,
        isCompound: item.is_compound,
        calculationOrder: item.calculation_order,
        createdAt: item.created_at,
      }));

      return { success: true, details };
    } catch (error) {
      console.error("Error fetching tax calculation details:", error);
      return { success: false, error: "Failed to fetch tax calculation details" };
    }
  }

  /**
   * Get tax summary for a period
   */
  static async getTaxSummary(
    companyId: string,
    startDate: string,
    endDate: string,
  ): Promise<{ success: boolean; summary?: TaxSummary[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_tax_summary", {
        p_company_id: companyId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error("Error fetching tax summary:", error);
        return { success: false, error: "Failed to fetch tax summary" };
      }

      const summary: TaxSummary[] = data.map(item => ({
        taxCategoryId: item.tax_category_id,
        categoryName: item.category_name,
        totalTaxableAmount: item.total_taxable_amount,
        totalTaxAmount: item.total_tax_amount,
        transactionCount: item.transaction_count,
      }));

      return { success: true, summary };
    } catch (error) {
      console.error("Error fetching tax summary:", error);
      return { success: false, error: "Failed to fetch tax summary" };
    }
  }

  /**
   * Create a tax return
   */
  static async createTaxReturn(
    companyId: string,
    returnName: string,
    returnType: ReturnType,
    periodStart: string,
    periodEnd: string,
    dueDate: string,
  ): Promise<{ success: boolean; returnId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("create_tax_return", {
        p_company_id: companyId,
        p_return_name: returnName,
        p_return_type: returnType,
        p_period_start: periodStart,
        p_period_end: periodEnd,
        p_due_date: dueDate,
      });

      if (error) {
        console.error("Error creating tax return:", error);
        return { success: false, error: "Failed to create tax return" };
      }

      return { success: true, returnId: data };
    } catch (error) {
      console.error("Error creating tax return:", error);
      return { success: false, error: "Failed to create tax return" };
    }
  }

  /**
   * Get tax returns
   */
  static async getTaxReturns(
    companyId: string,
  ): Promise<{ success: boolean; returns?: TaxReturn[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("tax_returns")
        .select("*")
        .eq("company_id", companyId)
        .order("tax_period_start", { ascending: false });

      if (error) {
        console.error("Error fetching tax returns:", error);
        return { success: false, error: "Failed to fetch tax returns" };
      }

      const returns: TaxReturn[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        returnName: item.return_name,
        returnType: item.return_type,
        taxPeriodStart: item.tax_period_start,
        taxPeriodEnd: item.tax_period_end,
        dueDate: item.due_date,
        filingStatus: item.filing_status,
        totalTaxableAmount: item.total_taxable_amount,
        totalTaxAmount: item.total_tax_amount,
        totalRefundAmount: item.total_refund_amount,
        filedAt: item.filed_at,
        filedBy: item.filed_by,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, returns };
    } catch (error) {
      console.error("Error fetching tax returns:", error);
      return { success: false, error: "Failed to fetch tax returns" };
    }
  }

  /**
   * Reverse a tax calculation
   */
  static async reverseTaxCalculation(
    calculationId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("reverse_tax_calculation", {
        p_calculation_id: calculationId,
      });

      if (error) {
        console.error("Error reversing tax calculation:", error);
        return { success: false, error: "Failed to reverse tax calculation" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error reversing tax calculation:", error);
      return { success: false, error: "Failed to reverse tax calculation" };
    }
  }

  /**
   * Update tax return status
   */
  static async updateTaxReturnStatus(
    returnId: string,
    status: FilingStatus,
    filedBy?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = { filing_status: status };

      if (status === "Filed" && filedBy) {
        updateData.filed_by = filedBy;
        updateData.filed_at = new Date().toISOString();
      }

      const { error } = await supabase.from("tax_returns").update(updateData).eq("id", returnId);

      if (error) {
        console.error("Error updating tax return status:", error);
        return { success: false, error: "Failed to update tax return status" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating tax return status:", error);
      return { success: false, error: "Failed to update tax return status" };
    }
  }
}
