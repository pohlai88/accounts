/**
 * Supplier Management Service
 * Comprehensive supplier master data management
 * Based on ERPNext, Xero, QuickBooks, and Oracle best practices
 */
// @ts-nocheck


import { supabase } from "./supabase";

export interface Supplier {
  id: string;
  supplier_code: string;
  supplier_name: string;
  supplier_type: "Individual" | "Company" | "Government";
  supplier_group_id?: string;
  supplier_group_name?: string;

  // Contact Information
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  fax?: string;

  // Business Information
  industry?: string;
  business_type?: string;
  tax_id?: string;
  registration_no?: string;
  pan_no?: string;
  gstin?: string;

  // Financial Information
  credit_limit: number;
  outstanding_amount: number;
  total_invoiced: number;
  total_paid: number;
  currency: string;
  payment_terms?: string;
  credit_days: number;

  // Address Information
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_postal_code?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_postal_code?: string;

  // Contact Person
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_mobile?: string;

  // Additional Information
  language: string;
  timezone: string;
  notes?: string;
  tags: string[];
  is_active: boolean;
  is_frozen: boolean;

  // References
  company_id: string;
  default_cost_center_id?: string;
  default_expense_account_id?: string;
  default_payable_account_id?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface SupplierGroup {
  id: string;
  name: string;
  parent_id?: string;
  is_group: boolean;
  company_id: string;
  created_at: string;
  updated_at: string;
}

export interface SupplierAddress {
  id: string;
  supplier_id: string;
  address_type: "Billing" | "Shipping" | "Other";
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_primary: boolean;
  is_shipping_address: boolean;
  is_billing_address: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierContact {
  id: string;
  supplier_id: string;
  contact_name: string;
  contact_type: "Primary" | "Secondary" | "Emergency" | "Other";
  email?: string;
  phone?: string;
  mobile?: string;
  designation?: string;
  department?: string;
  is_primary: boolean;
  is_billing_contact: boolean;
  is_shipping_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierInput {
  supplier_name: string;
  supplier_type: "Individual" | "Company" | "Government";
  supplier_group_id?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
  fax?: string;
  industry?: string;
  business_type?: string;
  tax_id?: string;
  registration_no?: string;
  pan_no?: string;
  gstin?: string;
  credit_limit?: number;
  currency?: string;
  payment_terms?: string;
  credit_days?: number;
  billing_address?: string;
  billing_city?: string;
  billing_state?: string;
  billing_country?: string;
  billing_postal_code?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_country?: string;
  shipping_postal_code?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_mobile?: string;
  language?: string;
  timezone?: string;
  notes?: string;
  tags?: string[];
  is_active?: boolean;
  company_id: string;
  default_cost_center_id?: string;
  default_expense_account_id?: string;
  default_payable_account_id?: string;
}

export interface UpdateSupplierInput extends Partial<CreateSupplierInput> {
  id: string;
}

export interface SupplierFilters {
  company_id: string;
  search?: string;
  supplier_type?: string;
  supplier_group_id?: string;
  is_active?: boolean;
  industry?: string;
  currency?: string;
  credit_limit_min?: number;
  credit_limit_max?: number;
  outstanding_amount_min?: number;
  outstanding_amount_max?: number;
  tags?: string[];
  created_from?: string;
  created_to?: string;
}

export interface SupplierStats {
  total_suppliers: number;
  active_suppliers: number;
  total_outstanding: number;
  total_invoiced: number;
  average_credit_limit: number;
  top_industries: Array<{ industry: string; count: number }>;
  top_supplier_groups: Array<{ group_name: string; count: number }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Supplier Management Service
 */
export class SupplierService {
  /**
   * Create a new supplier
   */
  static async createSupplier(input: CreateSupplierInput): Promise<ApiResponse<Supplier>> {
    try {
      // Generate supplier code
      const { data: supplierCode } = await supabase.rpc("generate_supplier_code", {
        company_id: input.company_id,
      });

      if (!supplierCode) {
        return { success: false, error: "Failed to generate supplier code" };
      }

      // Create supplier
      const { data: supplier, error } = await supabase
        .from("suppliers")
        .insert([
          {
            supplier_code: supplierCode,
            supplier_name: input.supplier_name.trim(),
            supplier_type: input.supplier_type,
            supplier_group_id: input.supplier_group_id,
            email: input.email,
            phone: input.phone,
            mobile: input.mobile,
            website: input.website,
            fax: input.fax,
            industry: input.industry,
            business_type: input.business_type,
            tax_id: input.tax_id,
            registration_no: input.registration_no,
            pan_no: input.pan_no,
            gstin: input.gstin,
            credit_limit: input.credit_limit || 0,
            currency: input.currency || "USD",
            payment_terms: input.payment_terms,
            credit_days: input.credit_days || 0,
            billing_address: input.billing_address,
            billing_city: input.billing_city,
            billing_state: input.billing_state,
            billing_country: input.billing_country,
            billing_postal_code: input.billing_postal_code,
            shipping_address: input.shipping_address,
            shipping_city: input.shipping_city,
            shipping_state: input.shipping_state,
            shipping_country: input.shipping_country,
            shipping_postal_code: input.shipping_postal_code,
            contact_person: input.contact_person,
            contact_email: input.contact_email,
            contact_phone: input.contact_phone,
            contact_mobile: input.contact_mobile,
            language: input.language || "en",
            timezone: input.timezone || "UTC",
            notes: input.notes,
            tags: input.tags || [],
            is_active: input.is_active !== false,
            company_id: input.company_id,
            default_cost_center_id: input.default_cost_center_id,
            default_expense_account_id: input.default_expense_account_id,
            default_payable_account_id: input.default_payable_account_id,
          },
        ])
        .select(
          `
                    *,
                    supplier_groups!supplier_group_id(name)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          ...supplier,
          supplier_group_name: supplier.supplier_groups?.name,
        },
        message: "Supplier created successfully",
      };
    } catch (error) {
      console.error("Error creating supplier:", error);
      return { success: false, error: "Failed to create supplier" };
    }
  }

  /**
   * Get suppliers with filters
   */
  static async getSuppliers(filters: SupplierFilters): Promise<ApiResponse<Supplier[]>> {
    try {
      let query = supabase
        .from("suppliers")
        .select(
          `
                    *,
                    supplier_groups!supplier_group_id(name)
                `,
        )
        .eq("company_id", filters.company_id);

      // Apply filters
      if (filters.search) {
        query = query.or(
          `supplier_name.ilike.%${filters.search}%,supplier_code.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
        );
      }

      if (filters.supplier_type) {
        query = query.eq("supplier_type", filters.supplier_type);
      }

      if (filters.supplier_group_id) {
        query = query.eq("supplier_group_id", filters.supplier_group_id);
      }

      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      }

      if (filters.industry) {
        query = query.eq("industry", filters.industry);
      }

      if (filters.currency) {
        query = query.eq("currency", filters.currency);
      }

      if (filters.credit_limit_min !== undefined) {
        query = query.gte("credit_limit", filters.credit_limit_min);
      }

      if (filters.credit_limit_max !== undefined) {
        query = query.lte("credit_limit", filters.credit_limit_max);
      }

      if (filters.outstanding_amount_min !== undefined) {
        query = query.gte("outstanding_amount", filters.outstanding_amount_min);
      }

      if (filters.outstanding_amount_max !== undefined) {
        query = query.lte("outstanding_amount", filters.outstanding_amount_max);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps("tags", filters.tags);
      }

      if (filters.created_from) {
        query = query.gte("created_at", filters.created_from);
      }

      if (filters.created_to) {
        query = query.lte("created_at", filters.created_to);
      }

      const { data: suppliers, error } = await query.order("supplier_name");

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: suppliers.map(supplier => ({
          ...supplier,
          supplier_group_name: supplier.supplier_groups?.name,
        })),
      };
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      return { success: false, error: "Failed to fetch suppliers" };
    }
  }

  /**
   * Get supplier by ID
   */
  static async getSupplierById(id: string): Promise<ApiResponse<Supplier>> {
    try {
      const { data: supplier, error } = await supabase
        .from("suppliers")
        .select(
          `
                    *,
                    supplier_groups!supplier_group_id(name)
                `,
        )
        .eq("id", id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          ...supplier,
          supplier_group_name: supplier.supplier_groups?.name,
        },
      };
    } catch (error) {
      console.error("Error fetching supplier:", error);
      return { success: false, error: "Failed to fetch supplier" };
    }
  }

  /**
   * Update supplier
   */
  static async updateSupplier(input: UpdateSupplierInput): Promise<ApiResponse<Supplier>> {
    try {
      const { id, ...updateData } = input;

      const { data: supplier, error } = await supabase
        .from("suppliers")
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select(
          `
                    *,
                    supplier_groups!supplier_group_id(name)
                `,
        )
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: {
          ...supplier,
          supplier_group_name: supplier.supplier_groups?.name,
        },
        message: "Supplier updated successfully",
      };
    } catch (error) {
      console.error("Error updating supplier:", error);
      return { success: false, error: "Failed to update supplier" };
    }
  }

  /**
   * Delete supplier
   */
  static async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: "Supplier deleted successfully" };
    } catch (error) {
      console.error("Error deleting supplier:", error);
      return { success: false, error: "Failed to delete supplier" };
    }
  }

  /**
   * Get supplier groups
   */
  static async getSupplierGroups(companyId: string): Promise<ApiResponse<SupplierGroup[]>> {
    try {
      const { data: groups, error } = await supabase
        .from("supplier_groups")
        .select("*")
        .eq("company_id", companyId)
        .order("name");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: groups };
    } catch (error) {
      console.error("Error fetching supplier groups:", error);
      return { success: false, error: "Failed to fetch supplier groups" };
    }
  }

  /**
   * Create supplier group
   */
  static async createSupplierGroup(data: {
    name: string;
    parent_id?: string;
    company_id: string;
  }): Promise<ApiResponse<SupplierGroup>> {
    try {
      const { data: group, error } = await supabase
        .from("supplier_groups")
        .insert([
          {
            name: data.name.trim(),
            parent_id: data.parent_id,
            is_group: true,
            company_id: data.company_id,
          },
        ])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: group, message: "Supplier group created successfully" };
    } catch (error) {
      console.error("Error creating supplier group:", error);
      return { success: false, error: "Failed to create supplier group" };
    }
  }

  /**
   * Get supplier addresses
   */
  static async getSupplierAddresses(supplierId: string): Promise<ApiResponse<SupplierAddress[]>> {
    try {
      const { data: addresses, error } = await supabase
        .from("supplier_addresses")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: addresses };
    } catch (error) {
      console.error("Error fetching supplier addresses:", error);
      return { success: false, error: "Failed to fetch supplier addresses" };
    }
  }

  /**
   * Get supplier contacts
   */
  static async getSupplierContacts(supplierId: string): Promise<ApiResponse<SupplierContact[]>> {
    try {
      const { data: contacts, error } = await supabase
        .from("supplier_contacts")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at");

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: contacts };
    } catch (error) {
      console.error("Error fetching supplier contacts:", error);
      return { success: false, error: "Failed to fetch supplier contacts" };
    }
  }

  /**
   * Get supplier statistics
   */
  static async getSupplierStats(companyId: string): Promise<ApiResponse<SupplierStats>> {
    try {
      const { data: suppliers, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("company_id", companyId);

      if (error) {
        return { success: false, error: error.message };
      }

      const stats: SupplierStats = {
        total_suppliers: suppliers.length,
        active_suppliers: suppliers.filter(s => s.is_active).length,
        total_outstanding: suppliers.reduce((sum, s) => sum + s.outstanding_amount, 0),
        total_invoiced: suppliers.reduce((sum, s) => sum + s.total_invoiced, 0),
        average_credit_limit:
          suppliers.length > 0
            ? suppliers.reduce((sum, s) => sum + s.credit_limit, 0) / suppliers.length
            : 0,
        top_industries: [],
        top_supplier_groups: [],
      };

      // Calculate top industries
      const industryCounts = suppliers.reduce(
        (acc, s) => {
          if (s.industry) {
            acc[s.industry] = (acc[s.industry] || 0) + 1;
          }
          return acc;
        },
        {} as Record<string, number>,
      );

      stats.top_industries = Object.entries(industryCounts)
        .map(([industry, count]) => ({ industry, count: count as number }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return { success: true, data: stats };
    } catch (error) {
      console.error("Error fetching supplier stats:", error);
      return { success: false, error: "Failed to fetch supplier statistics" };
    }
  }

  /**
   * Search suppliers
   */
  static async searchSuppliers(
    companyId: string,
    searchTerm: string,
  ): Promise<ApiResponse<Supplier[]>> {
    try {
      const { data: suppliers, error } = await supabase
        .from("suppliers")
        .select(
          `
                    *,
                    supplier_groups!supplier_group_id(name)
                `,
        )
        .eq("company_id", companyId)
        .or(
          `supplier_name.ilike.%${searchTerm}%,supplier_code.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
        )
        .limit(10);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: suppliers.map(supplier => ({
          ...supplier,
          supplier_group_name: supplier.supplier_groups?.name,
        })),
      };
    } catch (error) {
      console.error("Error searching suppliers:", error);
      return { success: false, error: "Failed to search suppliers" };
    }
  }
}
