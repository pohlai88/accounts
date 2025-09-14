/**
 * Accounting Dimensions Service - ERPNext Level
 * Flexible multi-dimensional accounting for advanced reporting and analysis
 */

import { supabase } from "./supabase";

export interface AccountingDimension {
  id: string;
  dimensionName: string;
  fieldname: string;
  label: string;
  documentType: string;
  companyId: string;
  isMandatory: boolean;
  disabled: boolean;
  createdAt: string;
}

export interface AccountingDimensionDetail {
  id: string;
  parent: string;
  companyId: string;
  offsettingAccount?: string;
  automaticallyPostBalancingAccountingEntry: boolean;
}

export interface DimensionFilter {
  dimensionId: string;
  accountId: string;
  allowOrRestrict: "Allow" | "Restrict";
  allowedDimensions: string[];
  isMandatory: boolean;
}

export interface DimensionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  mandatoryDimensions: string[];
  restrictedDimensions: string[];
}

export class AccountingDimensionsService {
  /**
   * Create accounting dimension
   */
  static async createAccountingDimension(
    dimensionData: Omit<AccountingDimension, "id" | "createdAt">,
  ): Promise<{ success: boolean; dimensionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("accounting_dimensions")
        .insert({
          dimension_name: dimensionData.dimensionName,
          fieldname: dimensionData.fieldname,
          label: dimensionData.label,
          document_type: dimensionData.documentType,
          company_id: dimensionData.companyId,
          is_mandatory: dimensionData.isMandatory,
          disabled: dimensionData.disabled,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, dimensionId: data.id };
    } catch (error) {
      return { success: false, error: `Failed to create accounting dimension: ${error}` };
    }
  }

  /**
   * Add dimension detail (company-specific settings)
   */
  static async addDimensionDetail(
    dimensionId: string,
    companyId: string,
    offsettingAccount?: string,
    automaticallyPostBalancingEntry: boolean = false,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from("accounting_dimension_details").insert({
        parent: dimensionId,
        company_id: companyId,
        offsetting_account: offsettingAccount,
        automatically_post_balancing_accounting_entry: automaticallyPostBalancingEntry,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to add dimension detail: ${error}` };
    }
  }

  /**
   * Get accounting dimensions for a company and document type
   */
  static async getAccountingDimensions(
    companyId: string,
    documentType?: string,
  ): Promise<{ success: boolean; data?: AccountingDimension[]; error?: string }> {
    try {
      let query = supabase
        .from("accounting_dimensions")
        .select("*")
        .eq("company_id", companyId)
        .eq("disabled", false);

      if (documentType) {
        query = query.eq("document_type", documentType);
      }

      const { data, error } = await query.order("dimension_name");

      if (error) {
        return { success: false, error: error.message };
      }

      const dimensions: AccountingDimension[] = data.map(item => ({
        id: item.id,
        dimensionName: item.dimension_name,
        fieldname: item.fieldname,
        label: item.label,
        documentType: item.document_type,
        companyId: item.company_id,
        isMandatory: item.is_mandatory,
        disabled: item.disabled,
        createdAt: item.created_at,
      }));

      return { success: true, data: dimensions };
    } catch (error) {
      return { success: false, error: `Failed to get accounting dimensions: ${error}` };
    }
  }

  /**
   * Get dimension details with offsetting accounts
   */
  static async getDimensionDetails(dimensionId: string): Promise<{
    success: boolean;
    data?: AccountingDimensionDetail[];
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("accounting_dimension_details")
        .select("*")
        .eq("parent", dimensionId);

      if (error) {
        return { success: false, error: error.message };
      }

      const details: AccountingDimensionDetail[] = data.map(item => ({
        id: item.id,
        parent: item.parent,
        companyId: item.company_id,
        offsettingAccount: item.offsetting_account,
        automaticallyPostBalancingAccountingEntry:
          item.automatically_post_balancing_accounting_entry,
      }));

      return { success: true, data: details };
    } catch (error) {
      return { success: false, error: `Failed to get dimension details: ${error}` };
    }
  }

  /**
   * Validate dimensions for GL entry
   */
  static async validateDimensions(
    companyId: string,
    documentType: string,
    glEntryData: Record<string, any>,
  ): Promise<DimensionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const mandatoryDimensions: string[] = [];
    const restrictedDimensions: string[] = [];

    try {
      // Get applicable dimensions
      const { data: dimensions } = await this.getAccountingDimensions(companyId, documentType);
      if (!dimensions) {
        return {
          isValid: true,
          errors: [],
          warnings: [],
          mandatoryDimensions: [],
          restrictedDimensions: [],
        };
      }

      // Validate each dimension
      for (const dimension of dimensions) {
        const value = glEntryData[dimension.fieldname];

        // Check mandatory dimensions
        if (dimension.isMandatory && !value) {
          errors.push(`${dimension.label} is mandatory for ${documentType}`);
          mandatoryDimensions.push(dimension.fieldname);
        }

        // Check dimension filters (if implemented)
        if (value && glEntryData.accountId) {
          const filterValidation = await this.validateDimensionFilter(
            dimension.id,
            glEntryData.accountId,
            value,
          );

          if (!filterValidation.isValid) {
            errors.push(...filterValidation.errors);
            if (filterValidation.isRestricted) {
              restrictedDimensions.push(dimension.fieldname);
            }
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        mandatoryDimensions,
        restrictedDimensions,
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [`Dimension validation error: ${error}`],
        warnings: [],
        mandatoryDimensions: [],
        restrictedDimensions: [],
      };
    }
  }

  /**
   * Create offsetting entries for accounting dimensions
   */
  static async createOffsettingEntries(
    companyId: string,
    glEntries: any[],
  ): Promise<{ success: boolean; offsettingEntries?: any[]; error?: string }> {
    try {
      const offsettingEntries: any[] = [];

      // Get dimensions that require offsetting entries
      const { data: dimensions } = await supabase
        .from("accounting_dimensions")
        .select(
          `
                    *,
                    accounting_dimension_details!inner(*)
                `,
        )
        .eq("company_id", companyId)
        .eq("disabled", false)
        .eq("accounting_dimension_details.automatically_post_balancing_accounting_entry", true);

      if (!dimensions || dimensions.length === 0) {
        return { success: true, offsettingEntries: [] };
      }

      // Group GL entries by dimension values
      for (const dimension of dimensions) {
        const dimensionValues = new Set(
          glEntries.map(entry => entry[dimension.fieldname]).filter(value => value),
        );

        // If there are multiple dimension values, create offsetting entries
        if (dimensionValues.size > 1) {
          const dimensionDetail = dimension.accounting_dimension_details[0];
          const offsettingAccount = dimensionDetail.offsetting_account;

          if (!offsettingAccount) {
            continue;
          }

          // Calculate total amounts for each dimension value
          const dimensionTotals = new Map<string, { debit: number; credit: number }>();

          for (const entry of glEntries) {
            const dimValue = entry[dimension.fieldname];
            if (!dimValue) continue;

            const current = dimensionTotals.get(dimValue) || { debit: 0, credit: 0 };
            current.debit += entry.debit || 0;
            current.credit += entry.credit || 0;
            dimensionTotals.set(dimValue, current);
          }

          // Create offsetting entries
          for (const [dimValue, totals] of dimensionTotals) {
            const netAmount = totals.debit - totals.credit;

            if (Math.abs(netAmount) > 0.01) {
              offsettingEntries.push({
                accountId: offsettingAccount,
                debit: netAmount < 0 ? Math.abs(netAmount) : 0,
                credit: netAmount > 0 ? netAmount : 0,
                [dimension.fieldname]: dimValue,
                remarks: `Offsetting entry for ${dimension.label} - ${dimValue}`,
                isOffsettingEntry: true,
              });
            }
          }
        }
      }

      return { success: true, offsettingEntries };
    } catch (error) {
      return { success: false, error: `Failed to create offsetting entries: ${error}` };
    }
  }

  /**
   * Update accounting dimension
   */
  static async updateAccountingDimension(
    dimensionId: string,
    updates: Partial<Omit<AccountingDimension, "id" | "createdAt" | "companyId">>,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};

      if (updates.dimensionName !== undefined) updateData.dimension_name = updates.dimensionName;
      if (updates.label !== undefined) updateData.label = updates.label;
      if (updates.isMandatory !== undefined) updateData.is_mandatory = updates.isMandatory;
      if (updates.disabled !== undefined) updateData.disabled = updates.disabled;

      const { error } = await supabase
        .from("accounting_dimensions")
        .update(updateData)
        .eq("id", dimensionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to update accounting dimension: ${error}` };
    }
  }

  /**
   * Delete accounting dimension
   */
  static async deleteAccountingDimension(
    dimensionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if dimension is being used
      const { data: usage, error: usageError } = await supabase
        .from("gl_entries")
        .select("id")
        .not(dimensionId, "is", null)
        .limit(1);

      if (usageError) {
        return { success: false, error: usageError.message };
      }

      if (usage && usage.length > 0) {
        return {
          success: false,
          error: "Cannot delete dimension that is being used in GL entries",
        };
      }

      // Delete dimension details first
      const { error: detailsError } = await supabase
        .from("accounting_dimension_details")
        .delete()
        .eq("parent", dimensionId);

      if (detailsError) {
        return { success: false, error: detailsError.message };
      }

      // Delete dimension
      const { error } = await supabase.from("accounting_dimensions").delete().eq("id", dimensionId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to delete accounting dimension: ${error}` };
    }
  }

  /**
   * Get dimension usage report
   */
  static async getDimensionUsageReport(
    companyId: string,
    dimensionId?: string,
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // This would be a complex query to show dimension usage across GL entries
      // For now, return a simplified version
      const { data, error } = await supabase
        .from("accounting_dimensions")
        .select(
          `
                    id,
                    dimension_name,
                    fieldname,
                    label,
                    document_type,
                    is_mandatory
                `,
        )
        .eq("company_id", companyId)
        .eq("disabled", false);

      if (error) {
        return { success: false, error: error.message };
      }

      // For each dimension, count usage in GL entries
      const usageData = [];
      for (const dimension of data) {
        // This would need to be implemented with proper SQL queries
        // based on the actual dimension fieldname in gl_entries table
        usageData.push({
          ...dimension,
          usageCount: 0, // Placeholder
          lastUsed: null, // Placeholder
        });
      }

      return { success: true, data: usageData };
    } catch (error) {
      return { success: false, error: `Failed to get dimension usage report: ${error}` };
    }
  }

  /**
   * Validate dimension filter (private helper method)
   */
  private static async validateDimensionFilter(
    dimensionId: string,
    accountId: string,
    value: string,
  ): Promise<{ isValid: boolean; errors: string[]; isRestricted: boolean }> {
    // This would implement dimension filter validation
    // For now, return a simple validation
    return {
      isValid: true,
      errors: [],
      isRestricted: false,
    };
  }

  /**
   * Setup default dimensions for a company
   */
  static async setupDefaultDimensions(
    companyId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const defaultDimensions = [
        {
          dimensionName: "Department",
          fieldname: "department",
          label: "Department",
          documentType: "GL Entry",
          isMandatory: false,
          disabled: false,
        },
        {
          dimensionName: "Branch",
          fieldname: "branch",
          label: "Branch",
          documentType: "GL Entry",
          isMandatory: false,
          disabled: false,
        },
        {
          dimensionName: "Territory",
          fieldname: "territory",
          label: "Territory",
          documentType: "Sales Invoice",
          isMandatory: false,
          disabled: false,
        },
      ];

      for (const dimension of defaultDimensions) {
        await this.createAccountingDimension({
          ...dimension,
          companyId,
        });
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to setup default dimensions: ${error}` };
    }
  }

  /**
   * Get dimension values for a specific dimension
   */
  static async getDimensionValues(
    companyId: string,
    dimensionFieldname: string,
  ): Promise<{ success: boolean; data?: string[]; error?: string }> {
    try {
      // This would query the actual dimension values from GL entries
      // For now, return empty array as placeholder
      return { success: true, data: [] };
    } catch (error) {
      return { success: false, error: `Failed to get dimension values: ${error}` };
    }
  }

  /**
   * Bulk update dimension values
   */
  static async bulkUpdateDimensionValues(
    companyId: string,
    dimensionFieldname: string,
    oldValue: string,
    newValue: string,
  ): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
    try {
      // This would update dimension values across GL entries
      // Implementation would depend on the actual table structure
      return { success: true, updatedCount: 0 };
    } catch (error) {
      return { success: false, error: `Failed to bulk update dimension values: ${error}` };
    }
  }
}

export default AccountingDimensionsService;
