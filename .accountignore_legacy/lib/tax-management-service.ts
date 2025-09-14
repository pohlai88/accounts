/**
 * Tax Management Service - Complete Tax Compliance System
 * Multi-jurisdiction tax handling (Sales Tax, VAT, GST, etc.)
 * ERPNext-level tax automation with advanced compliance features
 *
 * Features:
 * - Automated tax calculations based on location and rules
 * - Multi-jurisdiction support (Federal, State, County, City)
 * - Tax templates for easy application
 * - Exemption management and checking
 * - Tax filing period automation
 * - Compliance reporting and validation
 * - Integration with invoicing and GL systems
 */

import { supabase } from "./supabase";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type JurisdictionType = "Federal" | "State" | "County" | "City" | "VAT" | "GST" | "Custom";
export type FilingFrequency =
  | "Weekly"
  | "Monthly"
  | "Quarterly"
  | "Semi-Annual"
  | "Annual"
  | "Custom";
export type TaxType =
  | "Sales Tax"
  | "VAT"
  | "GST"
  | "Excise"
  | "Customs"
  | "Service Tax"
  | "Withholding Tax"
  | "Other";
export type CalculationMethod = "Percentage" | "Fixed Amount" | "Tiered" | "Progressive";
export type TemplateType = "Sales" | "Purchase" | "Both";
export type ExemptionType = "Customer" | "Item" | "Transaction" | "Geographic" | "Temporary";
export type FilingStatus = "Open" | "Filed" | "Paid" | "Overdue" | "Amended";
export type ReferenceType =
  | "Sales Invoice"
  | "Purchase Invoice"
  | "Sales Order"
  | "Purchase Order"
  | "Quotation";

export interface TaxAuthority {
  id: string;
  company_id: string;
  authority_name: string;
  authority_code: string;
  jurisdiction_type: JurisdictionType;

  // Contact Information
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;

  // Tax Authority Details
  tax_registration_number?: string;
  filing_frequency: FilingFrequency;
  due_date_offset_days: number;

  // Settings
  is_active: boolean;
  requires_registration: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface TaxCategory {
  id: string;
  company_id: string;
  category_name: string;
  category_code: string;
  tax_type: TaxType;

  // Tax Behavior
  is_input_tax: boolean;
  is_output_tax: boolean;
  is_reverse_charge: boolean;

  // GL Account Integration
  tax_account_head?: string;
  input_tax_account_head?: string;

  // Settings
  is_active: boolean;
  description?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface TaxRate {
  id: string;
  company_id: string;
  tax_authority_id: string;
  tax_category_id: string;

  // Rate Details
  rate_name: string;
  rate_code: string;
  tax_rate: number;

  // Applicability Rules
  effective_from: string;
  effective_to?: string;

  // Geographic Applicability
  applicable_states?: string[];
  applicable_cities?: string[];
  applicable_postal_codes?: string[];

  // Transaction Type Applicability
  applicable_to_sales: boolean;
  applicable_to_purchases: boolean;
  applicable_to_services: boolean;
  applicable_to_goods: boolean;

  // Customer/Supplier Type Applicability
  applicable_to_individuals: boolean;
  applicable_to_businesses: boolean;
  exempt_customer_groups?: string[];

  // Amount Thresholds
  minimum_taxable_amount: number;
  maximum_taxable_amount?: number;

  // Tax Calculation Rules
  calculation_method: CalculationMethod;
  compound_tax: boolean;

  // Settings
  is_active: boolean;
  is_default: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data (populated when needed)
  authority?: TaxAuthority;
  category?: TaxCategory;
  tiers?: TaxRateTier[];
}

export interface TaxRateTier {
  id: string;
  tax_rate_id: string;
  tier_from: number;
  tier_to?: number;
  tier_rate: number;
  tier_fixed_amount: number;
  tier_order: number;
}

export interface TaxTemplate {
  id: string;
  company_id: string;
  template_name: string;
  template_code: string;
  template_type: TemplateType;

  // Template Settings
  is_default: boolean;
  is_inclusive: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data
  details?: TaxTemplateDetail[];
}

export interface TaxTemplateDetail {
  id: string;
  tax_template_id: string;
  tax_rate_id: string;
  calculation_order: number;

  // Rate Override
  override_rate?: number;
  account_head_override?: string;

  // Related data
  tax_rate?: TaxRate;
}

export interface TransactionTaxDetail {
  id: string;
  company_id: string;

  // Reference to parent transaction
  reference_type: ReferenceType;
  reference_id: string;
  reference_name?: string;

  // Tax Application Details
  tax_template_id?: string;
  tax_rate_id: string;
  tax_category_id: string;
  tax_authority_id: string;

  // Calculation Details
  taxable_amount: number;
  tax_rate: number;
  tax_amount: number;

  // GL Account Integration
  account_head: string;

  // Item-level details
  item_code?: string;
  item_name?: string;

  // Audit
  created_at: string;
}

export interface TaxExemption {
  id: string;
  company_id: string;

  // Exemption Details
  exemption_name: string;
  exemption_code: string;
  exemption_type: ExemptionType;

  // Applicability
  tax_authority_id?: string;
  tax_category_id?: string;

  // Exemption Rules
  customer_id?: string;
  item_codes?: string[];
  exemption_certificate_number?: string;
  exemption_reason?: string;

  // Date Range
  effective_from: string;
  effective_to?: string;

  // Settings
  is_active: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

export interface TaxFilingPeriod {
  id: string;
  company_id: string;
  tax_authority_id: string;

  // Period Details
  period_name: string;
  filing_frequency: FilingFrequency;
  period_start_date: string;
  period_end_date: string;
  due_date: string;

  // Filing Status
  filing_status: FilingStatus;
  filed_date?: string;
  filed_by?: string;

  // Tax Summary
  total_sales_amount: number;
  total_purchase_amount: number;
  total_tax_collected: number;
  total_tax_paid: number;
  net_tax_liability: number;

  // Payment Details
  payment_reference?: string;
  payment_date?: string;
  payment_amount: number;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Related data
  authority?: TaxAuthority;
}

export interface TaxCalculationRequest {
  company_id: string;
  taxable_amount: number;
  tax_template_id?: string;
  customer_state?: string;
  customer_city?: string;
  customer_postal_code?: string;
  transaction_date?: string;
  customer_type?: "Individual" | "Business";
  item_code?: string;
  customer_id?: string;
}

export interface TaxCalculationResult {
  tax_rate_id: string;
  tax_authority_name: string;
  tax_category_name: string;
  tax_rate: number;
  taxable_amount: number;
  tax_amount: number;
  account_head: string;
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreateTaxAuthorityInput {
  company_id: string;
  authority_name: string;
  authority_code: string;
  jurisdiction_type: JurisdictionType;
  country: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  website?: string;
  tax_registration_number?: string;
  filing_frequency?: FilingFrequency;
  due_date_offset_days?: number;
  requires_registration?: boolean;
}

export interface CreateTaxCategoryInput {
  company_id: string;
  category_name: string;
  category_code: string;
  tax_type: TaxType;
  is_input_tax?: boolean;
  is_output_tax?: boolean;
  is_reverse_charge?: boolean;
  tax_account_head?: string;
  input_tax_account_head?: string;
  description?: string;
}

export interface CreateTaxRateInput {
  company_id: string;
  tax_authority_id: string;
  tax_category_id: string;
  rate_name: string;
  rate_code: string;
  tax_rate: number;
  effective_from?: string;
  effective_to?: string;
  applicable_states?: string[];
  applicable_cities?: string[];
  applicable_postal_codes?: string[];
  applicable_to_sales?: boolean;
  applicable_to_purchases?: boolean;
  applicable_to_services?: boolean;
  applicable_to_goods?: boolean;
  applicable_to_individuals?: boolean;
  applicable_to_businesses?: boolean;
  exempt_customer_groups?: string[];
  minimum_taxable_amount?: number;
  maximum_taxable_amount?: number;
  calculation_method?: CalculationMethod;
  compound_tax?: boolean;
  is_default?: boolean;
}

export interface CreateTaxTemplateInput {
  company_id: string;
  template_name: string;
  template_code: string;
  template_type: TemplateType;
  is_default?: boolean;
  is_inclusive?: boolean;
  tax_rates: {
    tax_rate_id: string;
    calculation_order: number;
    override_rate?: number;
    account_head_override?: string;
  }[];
}

export interface CreateTaxExemptionInput {
  company_id: string;
  exemption_name: string;
  exemption_code: string;
  exemption_type: ExemptionType;
  tax_authority_id?: string;
  tax_category_id?: string;
  customer_id?: string;
  item_codes?: string[];
  exemption_certificate_number?: string;
  exemption_reason?: string;
  effective_from?: string;
  effective_to?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================================================
// TAX MANAGEMENT SERVICE
// =====================================================================================

export class TaxManagementService {
  // =====================================================================================
  // TAX AUTHORITIES
  // =====================================================================================

  /**
   * Create tax authority
   */
  static async createTaxAuthority(
    input: CreateTaxAuthorityInput,
  ): Promise<ApiResponse<TaxAuthority>> {
    try {
      const { data: authority, error } = await supabase
        .from("tax_authorities")
        .insert({
          company_id: input.company_id,
          authority_name: input.authority_name.trim(),
          authority_code: input.authority_code.trim().toUpperCase(),
          jurisdiction_type: input.jurisdiction_type,
          country: input.country,
          address_line1: input.address_line1,
          address_line2: input.address_line2,
          city: input.city,
          state: input.state,
          postal_code: input.postal_code,
          phone: input.phone,
          email: input.email,
          website: input.website,
          tax_registration_number: input.tax_registration_number,
          filing_frequency: input.filing_frequency || "Monthly",
          due_date_offset_days: input.due_date_offset_days || 15,
          requires_registration: input.requires_registration !== false,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: authority, message: "Tax authority created successfully" };
    } catch (error) {
      console.error("Error creating tax authority:", error);
      return { success: false, error: "Failed to create tax authority" };
    }
  }

  /**
   * Get tax authorities
   */
  static async getTaxAuthorities(companyId: string): Promise<ApiResponse<TaxAuthority[]>> {
    try {
      const { data: authorities, error } = await supabase
        .from("tax_authorities")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("authority_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: authorities };
    } catch (error) {
      console.error("Error fetching tax authorities:", error);
      return { success: false, error: "Failed to fetch tax authorities" };
    }
  }

  // =====================================================================================
  // TAX CATEGORIES
  // =====================================================================================

  /**
   * Create tax category
   */
  static async createTaxCategory(input: CreateTaxCategoryInput): Promise<ApiResponse<TaxCategory>> {
    try {
      const { data: category, error } = await supabase
        .from("tax_categories")
        .insert({
          company_id: input.company_id,
          category_name: input.category_name.trim(),
          category_code: input.category_code.trim().toUpperCase(),
          tax_type: input.tax_type,
          is_input_tax: input.is_input_tax || false,
          is_output_tax: input.is_output_tax !== false,
          is_reverse_charge: input.is_reverse_charge || false,
          tax_account_head: input.tax_account_head,
          input_tax_account_head: input.input_tax_account_head,
          description: input.description,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: category, message: "Tax category created successfully" };
    } catch (error) {
      console.error("Error creating tax category:", error);
      return { success: false, error: "Failed to create tax category" };
    }
  }

  /**
   * Get tax categories
   */
  static async getTaxCategories(companyId: string): Promise<ApiResponse<TaxCategory[]>> {
    try {
      const { data: categories, error } = await supabase
        .from("tax_categories")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("category_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: categories };
    } catch (error) {
      console.error("Error fetching tax categories:", error);
      return { success: false, error: "Failed to fetch tax categories" };
    }
  }

  // =====================================================================================
  // TAX RATES
  // =====================================================================================

  /**
   * Create tax rate
   */
  static async createTaxRate(input: CreateTaxRateInput): Promise<ApiResponse<TaxRate>> {
    try {
      const { data: rate, error } = await supabase
        .from("tax_rates")
        .insert({
          company_id: input.company_id,
          tax_authority_id: input.tax_authority_id,
          tax_category_id: input.tax_category_id,
          rate_name: input.rate_name.trim(),
          rate_code: input.rate_code.trim().toUpperCase(),
          tax_rate: input.tax_rate,
          effective_from: input.effective_from || new Date().toISOString().split("T")[0],
          effective_to: input.effective_to,
          applicable_states: input.applicable_states,
          applicable_cities: input.applicable_cities,
          applicable_postal_codes: input.applicable_postal_codes,
          applicable_to_sales: input.applicable_to_sales !== false,
          applicable_to_purchases: input.applicable_to_purchases || false,
          applicable_to_services: input.applicable_to_services !== false,
          applicable_to_goods: input.applicable_to_goods !== false,
          applicable_to_individuals: input.applicable_to_individuals !== false,
          applicable_to_businesses: input.applicable_to_businesses !== false,
          exempt_customer_groups: input.exempt_customer_groups,
          minimum_taxable_amount: input.minimum_taxable_amount || 0,
          maximum_taxable_amount: input.maximum_taxable_amount,
          calculation_method: input.calculation_method || "Percentage",
          compound_tax: input.compound_tax || false,
          is_default: input.is_default || false,
        })
        .select(
          `
                    *,
                    authority:tax_authorities(*),
                    category:tax_categories(*)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: rate, message: "Tax rate created successfully" };
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
    filters?: {
      authority_id?: string;
      category_id?: string;
      effective_date?: string;
    },
  ): Promise<ApiResponse<TaxRate[]>> {
    try {
      let query = supabase
        .from("tax_rates")
        .select(
          `
                    *,
                    authority:tax_authorities(authority_name, authority_code),
                    category:tax_categories(category_name, category_code, tax_type)
                `,
        )
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (filters?.authority_id) {
        query = query.eq("tax_authority_id", filters.authority_id);
      }

      if (filters?.category_id) {
        query = query.eq("tax_category_id", filters.category_id);
      }

      if (filters?.effective_date) {
        query = query
          .lte("effective_from", filters.effective_date)
          .or(`effective_to.is.null,effective_to.gt.${filters.effective_date}`);
      }

      const { data: rates, error } = await query.order("rate_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: rates };
    } catch (error) {
      console.error("Error fetching tax rates:", error);
      return { success: false, error: "Failed to fetch tax rates" };
    }
  }

  // =====================================================================================
  // TAX TEMPLATES
  // =====================================================================================

  /**
   * Create tax template
   */
  static async createTaxTemplate(input: CreateTaxTemplateInput): Promise<ApiResponse<TaxTemplate>> {
    try {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from("tax_templates")
        .insert({
          company_id: input.company_id,
          template_name: input.template_name.trim(),
          template_code: input.template_code.trim().toUpperCase(),
          template_type: input.template_type,
          is_default: input.is_default || false,
          is_inclusive: input.is_inclusive || false,
        })
        .select()
        .single();

      if (templateError) {
        return { success: false, error: templateError.message };
      }

      // Create template details
      const templateDetails = input.tax_rates.map((rate, index) => ({
        tax_template_id: template.id,
        tax_rate_id: rate.tax_rate_id,
        calculation_order: rate.calculation_order || index + 1,
        override_rate: rate.override_rate,
        account_head_override: rate.account_head_override,
      }));

      const { error: detailsError } = await supabase
        .from("tax_template_details")
        .insert(templateDetails);

      if (detailsError) {
        // Rollback template creation
        await supabase.from("tax_templates").delete().eq("id", template.id);
        return { success: false, error: detailsError.message };
      }

      // Fetch complete template with details
      const { data: completeTemplate, error: fetchError } = await supabase
        .from("tax_templates")
        .select(
          `
                    *,
                    details:tax_template_details(
                        *,
                        tax_rate:tax_rates(
                            *,
                            authority:tax_authorities(authority_name),
                            category:tax_categories(category_name, tax_type)
                        )
                    )
                `,
        )
        .eq("id", template.id)
        .single();

      if (fetchError) {
        return { success: false, error: fetchError.message };
      }

      return {
        success: true,
        data: completeTemplate,
        message: "Tax template created successfully",
      };
    } catch (error) {
      console.error("Error creating tax template:", error);
      return { success: false, error: "Failed to create tax template" };
    }
  }

  /**
   * Get tax templates
   */
  static async getTaxTemplates(
    companyId: string,
    templateType?: TemplateType,
  ): Promise<ApiResponse<TaxTemplate[]>> {
    try {
      let query = supabase
        .from("tax_templates")
        .select(
          `
                    *,
                    details:tax_template_details(
                        *,
                        tax_rate:tax_rates(
                            rate_name,
                            rate_code,
                            tax_rate,
                            authority:tax_authorities(authority_name),
                            category:tax_categories(category_name, tax_type)
                        )
                    )
                `,
        )
        .eq("company_id", companyId);

      if (templateType) {
        query = query.or(`template_type.eq.${templateType},template_type.eq.Both`);
      }

      const { data: templates, error } = await query.order("template_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: templates };
    } catch (error) {
      console.error("Error fetching tax templates:", error);
      return { success: false, error: "Failed to fetch tax templates" };
    }
  }

  // =====================================================================================
  // TAX CALCULATIONS
  // =====================================================================================

  /**
   * Calculate tax for given amount and conditions
   */
  static async calculateTax(
    request: TaxCalculationRequest,
  ): Promise<ApiResponse<TaxCalculationResult[]>> {
    try {
      const { data: results, error } = await supabase.rpc("calculate_tax_amount", {
        p_company_id: request.company_id,
        p_taxable_amount: request.taxable_amount,
        p_tax_template_id: request.tax_template_id || null,
        p_customer_state: request.customer_state || null,
        p_customer_city: request.customer_city || null,
        p_customer_postal_code: request.customer_postal_code || null,
        p_transaction_date: request.transaction_date || new Date().toISOString().split("T")[0],
        p_customer_type: request.customer_type || "Business",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: results };
    } catch (error) {
      console.error("Error calculating tax:", error);
      return { success: false, error: "Failed to calculate tax" };
    }
  }

  /**
   * Check if transaction is exempt from tax
   */
  static async checkTaxExemption(
    companyId: string,
    customerId: string,
    itemCode?: string,
    transactionDate?: string,
    taxAuthorityId?: string,
    taxCategoryId?: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { data: isExempt, error } = await supabase.rpc("check_tax_exemption", {
        p_company_id: companyId,
        p_customer_id: customerId,
        p_item_code: itemCode || null,
        p_transaction_date: transactionDate || new Date().toISOString().split("T")[0],
        p_tax_authority_id: taxAuthorityId || null,
        p_tax_category_id: taxCategoryId || null,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: isExempt };
    } catch (error) {
      console.error("Error checking tax exemption:", error);
      return { success: false, error: "Failed to check tax exemption" };
    }
  }

  /**
   * Apply tax to transaction
   */
  static async applyTaxToTransaction(
    referenceType: ReferenceType,
    referenceId: string,
    referenceName: string,
    taxCalculations: TaxCalculationResult[],
  ): Promise<ApiResponse<TransactionTaxDetail[]>> {
    try {
      const transactionTaxDetails = taxCalculations.map(calc => ({
        company_id: "current-company", // Should be passed in calculation
        reference_type: referenceType,
        reference_id: referenceId,
        reference_name: referenceName,
        tax_rate_id: calc.tax_rate_id,
        // These would need to be looked up from the tax_rate_id
        tax_category_id: "lookup-needed",
        tax_authority_id: "lookup-needed",
        taxable_amount: calc.taxable_amount,
        tax_rate: calc.tax_rate,
        tax_amount: calc.tax_amount,
        account_head: calc.account_head,
      }));

      const { data: appliedTaxes, error } = await supabase
        .from("transaction_tax_details")
        .insert(transactionTaxDetails)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: appliedTaxes, message: "Tax applied successfully" };
    } catch (error) {
      console.error("Error applying tax to transaction:", error);
      return { success: false, error: "Failed to apply tax to transaction" };
    }
  }

  // =====================================================================================
  // TAX EXEMPTIONS
  // =====================================================================================

  /**
   * Create tax exemption
   */
  static async createTaxExemption(
    input: CreateTaxExemptionInput,
  ): Promise<ApiResponse<TaxExemption>> {
    try {
      const { data: exemption, error } = await supabase
        .from("tax_exemptions")
        .insert({
          company_id: input.company_id,
          exemption_name: input.exemption_name.trim(),
          exemption_code: input.exemption_code.trim().toUpperCase(),
          exemption_type: input.exemption_type,
          tax_authority_id: input.tax_authority_id,
          tax_category_id: input.tax_category_id,
          customer_id: input.customer_id,
          item_codes: input.item_codes,
          exemption_certificate_number: input.exemption_certificate_number,
          exemption_reason: input.exemption_reason,
          effective_from: input.effective_from || new Date().toISOString().split("T")[0],
          effective_to: input.effective_to,
        })
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: exemption, message: "Tax exemption created successfully" };
    } catch (error) {
      console.error("Error creating tax exemption:", error);
      return { success: false, error: "Failed to create tax exemption" };
    }
  }

  /**
   * Get tax exemptions
   */
  static async getTaxExemptions(
    companyId: string,
    exemptionType?: ExemptionType,
  ): Promise<ApiResponse<TaxExemption[]>> {
    try {
      let query = supabase
        .from("tax_exemptions")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true);

      if (exemptionType) {
        query = query.eq("exemption_type", exemptionType);
      }

      const { data: exemptions, error } = await query.order("exemption_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: exemptions };
    } catch (error) {
      console.error("Error fetching tax exemptions:", error);
      return { success: false, error: "Failed to fetch tax exemptions" };
    }
  }

  // =====================================================================================
  // TAX FILING
  // =====================================================================================

  /**
   * Generate tax filing periods
   */
  static async generateFilingPeriods(
    companyId: string,
    taxAuthorityId: string,
    year: number,
    filingFrequency?: FilingFrequency,
  ): Promise<ApiResponse<number>> {
    try {
      const { data: periodsGenerated, error } = await supabase.rpc("generate_tax_filing_periods", {
        p_company_id: companyId,
        p_tax_authority_id: taxAuthorityId,
        p_year: year,
        p_filing_frequency: filingFrequency || "Monthly",
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: periodsGenerated,
        message: `${periodsGenerated} filing periods generated`,
      };
    } catch (error) {
      console.error("Error generating filing periods:", error);
      return { success: false, error: "Failed to generate filing periods" };
    }
  }

  /**
   * Get tax filing periods
   */
  static async getFilingPeriods(
    companyId: string,
    filters?: {
      authority_id?: string;
      status?: FilingStatus;
      year?: number;
    },
  ): Promise<ApiResponse<TaxFilingPeriod[]>> {
    try {
      let query = supabase
        .from("tax_filing_periods")
        .select(
          `
                    *,
                    authority:tax_authorities(authority_name, authority_code)
                `,
        )
        .eq("company_id", companyId);

      if (filters?.authority_id) {
        query = query.eq("tax_authority_id", filters.authority_id);
      }

      if (filters?.status) {
        query = query.eq("filing_status", filters.status);
      }

      if (filters?.year) {
        const yearStart = `${filters.year}-01-01`;
        const yearEnd = `${filters.year}-12-31`;
        query = query.gte("period_start_date", yearStart).lte("period_end_date", yearEnd);
      }

      const { data: periods, error } = await query.order("due_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: periods };
    } catch (error) {
      console.error("Error fetching filing periods:", error);
      return { success: false, error: "Failed to fetch filing periods" };
    }
  }

  /**
   * Calculate filing summary for a period
   */
  static async calculateFilingSummary(filingPeriodId: string): Promise<
    ApiResponse<{
      total_sales_amount: number;
      total_purchase_amount: number;
      total_tax_collected: number;
      total_tax_paid: number;
      net_tax_liability: number;
    }>
  > {
    try {
      const { data: summary, error } = await supabase
        .rpc("calculate_tax_filing_summary", { p_filing_period_id: filingPeriodId })
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Update the filing period with calculated summary
      await supabase
        .from("tax_filing_periods")
        .update({
          total_sales_amount: (summary as any).total_sales_amount || 0,
          total_purchase_amount: (summary as any).total_purchase_amount || 0,
          total_tax_collected: (summary as any).total_tax_collected || 0,
          total_tax_paid: (summary as any).total_tax_paid || 0,
          net_tax_liability: (summary as any).net_tax_liability || 0,
        })
        .eq("id", filingPeriodId);

      return { success: true, data: summary as any };
    } catch (error) {
      console.error("Error calculating filing summary:", error);
      return { success: false, error: "Failed to calculate filing summary" };
    }
  }

  /**
   * Submit tax filing
   */
  static async submitFilingPeriod(
    filingPeriodId: string,
    filedBy: string,
  ): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from("tax_filing_periods")
        .update({
          filing_status: "Filed",
          filed_date: new Date().toISOString().split("T")[0],
          filed_by: filedBy,
          modified: new Date().toISOString(),
        })
        .eq("id", filingPeriodId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Tax filing submitted successfully" };
    } catch (error) {
      console.error("Error submitting tax filing:", error);
      return { success: false, error: "Failed to submit tax filing" };
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Get tax analytics
   */
  static async getTaxAnalytics(
    companyId: string,
    year?: number,
  ): Promise<
    ApiResponse<{
      total_tax_collected: number;
      total_tax_paid: number;
      net_tax_liability: number;
      tax_by_authority: any[];
      tax_by_category: any[];
      filing_compliance_rate: number;
    }>
  > {
    try {
      const currentYear = year || new Date().getFullYear();

      // Get tax details for the year
      const { data: taxDetails } = await supabase
        .from("transaction_tax_details")
        .select(
          `
                    tax_amount,
                    reference_type,
                    authority:tax_authorities(authority_name),
                    category:tax_categories(category_name, tax_type)
                `,
        )
        .eq("company_id", companyId)
        .gte("created_at", `${currentYear}-01-01`)
        .lt("created_at", `${currentYear + 1}-01-01`);

      // Get filing periods compliance
      const { data: filingPeriods } = await supabase
        .from("tax_filing_periods")
        .select("filing_status")
        .eq("company_id", companyId)
        .gte("period_start_date", `${currentYear}-01-01`)
        .lt("period_start_date", `${currentYear + 1}-01-01`);

      // Calculate analytics
      const totalTaxCollected =
        taxDetails
          ?.filter(t => t.reference_type.includes("Sales"))
          .reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0;

      const totalTaxPaid =
        taxDetails
          ?.filter(t => t.reference_type.includes("Purchase"))
          .reduce((sum, t) => sum + (t.tax_amount || 0), 0) || 0;

      const netTaxLiability = totalTaxCollected - totalTaxPaid;

      const filedPeriods = filingPeriods?.filter(p => p.filing_status === "Filed").length || 0;
      const totalPeriods = filingPeriods?.length || 0;
      const complianceRate = totalPeriods > 0 ? (filedPeriods / totalPeriods) * 100 : 100;

      // Group by authority and category
      const taxByAuthority = this.groupTaxDetails(taxDetails || [], "authority");
      const taxByCategory = this.groupTaxDetails(taxDetails || [], "category");

      return {
        success: true,
        data: {
          total_tax_collected: totalTaxCollected,
          total_tax_paid: totalTaxPaid,
          net_tax_liability: netTaxLiability,
          tax_by_authority: taxByAuthority,
          tax_by_category: taxByCategory,
          filing_compliance_rate: complianceRate,
        },
      };
    } catch (error) {
      console.error("Error fetching tax analytics:", error);
      return { success: false, error: "Failed to fetch tax analytics" };
    }
  }

  /**
   * Group tax details by authority or category
   */
  private static groupTaxDetails(taxDetails: any[], groupBy: "authority" | "category") {
    if (!taxDetails) return [];

    const grouped = taxDetails.reduce((acc, detail) => {
      const key =
        groupBy === "authority" ? detail.authority?.authority_name : detail.category?.category_name;

      if (!key) return acc;

      if (!acc[key]) {
        acc[key] = {
          name: key,
          total_amount: 0,
          transaction_count: 0,
        };
      }

      acc[key].total_amount += detail.tax_amount || 0;
      acc[key].transaction_count += 1;

      return acc;
    }, {} as any);

    return Object.values(grouped);
  }
}
