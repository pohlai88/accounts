/**
 * Master Data Service - Customer and Supplier Management
 * Implements ERPNext-style master data management with credit limits and business rules
 */

import { supabase } from "./supabase";

export interface Customer {
  id: string;
  customer_name: string;
  customer_code?: string;
  customer_group?: string;
  territory?: string;
  customer_type: "Company" | "Individual";

  // Contact Information
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;

  // Business Information
  tax_id?: string;
  pan_number?: string;
  gst_number?: string;

  // Credit Management
  credit_limit: number;
  credit_days: number;
  payment_terms?: string;

  // Account Configuration
  default_receivable_account_id?: string;
  default_income_account_id?: string;
  default_price_list?: string;

  // Status and Control
  is_active: boolean;
  is_frozen: boolean;
  disabled: boolean;

  // Multi-tenant
  company_id: string;

  // Audit fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface Supplier {
  id: string;
  supplier_name: string;
  supplier_code?: string;
  supplier_group?: string;
  supplier_type: "Company" | "Individual";

  // Contact Information
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;

  // Business Information
  tax_id?: string;
  pan_number?: string;
  gst_number?: string;

  // Payment Information
  payment_terms?: string;
  default_payment_days: number;

  // Account Configuration
  default_payable_account_id?: string;
  default_expense_account_id?: string;

  // Status and Control
  is_active: boolean;
  is_frozen: boolean;
  disabled: boolean;

  // Multi-tenant
  company_id: string;

  // Audit fields
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  address_title?: string;
  address_type: "Billing" | "Shipping" | "Office" | "Other";
  address_line1: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_primary_address: boolean;
  is_shipping_address: boolean;
  created_at: string;
  updated_at: string;
}

export interface CustomerContact {
  id: string;
  customer_id: string;
  contact_name: string;
  designation?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  is_primary_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditLimitCheck {
  within_limit: boolean;
  credit_limit: number;
  current_outstanding: number;
  projected_outstanding: number;
  available_credit: number;
  utilization_percentage: number;
}

export class MasterDataService {
  /**
   * Create a new customer
   */
  static async createCustomer(
    customerData: Omit<Customer, "id" | "created_at" | "updated_at">,
    userId?: string,
  ): Promise<{ data: Customer | null; error: any }> {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        ...customerData,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single();

    return { data, error };
  }

  /**
   * Update customer information
   */
  static async updateCustomer(
    customerId: string,
    updates: Partial<Customer>,
    userId?: string,
  ): Promise<{ data: Customer | null; error: any }> {
    const { data, error } = await supabase
      .from("customers")
      .update({
        ...updates,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", customerId)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Get customer by ID with full details
   */
  static async getCustomer(
    customerId: string,
    companyId: string,
  ): Promise<{
    customer: Customer | null;
    addresses: CustomerAddress[];
    contacts: CustomerContact[];
    error: any;
  }> {
    // Get customer
    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .eq("company_id", companyId)
      .single();

    if (customerError) {
      return { customer: null, addresses: [], contacts: [], error: customerError };
    }

    // Get addresses
    const { data: addresses, error: addressError } = await supabase
      .from("customer_addresses")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_primary_address", { ascending: false });

    // Get contacts
    const { data: contacts, error: contactError } = await supabase
      .from("customer_contacts")
      .select("*")
      .eq("customer_id", customerId)
      .order("is_primary_contact", { ascending: false });

    return {
      customer,
      addresses: addresses || [],
      contacts: contacts || [],
      error: addressError || contactError,
    };
  }

  /**
   * Search customers with filters
   */
  static async searchCustomers(
    companyId: string,
    filters: {
      search?: string;
      customer_group?: string;
      territory?: string;
      is_active?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ data: Customer[]; count: number; error: any }> {
    let query = supabase
      .from("customers")
      .select("*", { count: "exact" })
      .eq("company_id", companyId);

    // Apply filters
    if (filters.search) {
      query = query.or(
        `customer_name.ilike.%${filters.search}%,customer_code.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
      );
    }

    if (filters.customer_group) {
      query = query.eq("customer_group", filters.customer_group);
    }

    if (filters.territory) {
      query = query.eq("territory", filters.territory);
    }

    if (filters.is_active !== undefined) {
      query = query.eq("is_active", filters.is_active);
    }

    // Pagination
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    // Order by name
    query = query.order("customer_name");

    const { data, error, count } = await query;

    return { data: data || [], count: count || 0, error };
  }

  /**
   * Check customer credit limit
   */
  static async checkCustomerCreditLimit(
    customerId: string,
    companyId: string,
    additionalAmount: number = 0,
  ): Promise<CreditLimitCheck> {
    const { data, error } = await supabase.rpc("check_customer_credit_limit", {
      p_customer_id: customerId,
      p_company_id: companyId,
      p_additional_amount: additionalAmount,
    });

    if (error) {
      console.error("Error checking credit limit:", error);
      return {
        within_limit: false,
        credit_limit: 0,
        current_outstanding: 0,
        projected_outstanding: additionalAmount,
        available_credit: 0,
        utilization_percentage: 100,
      };
    }

    return (
      data || {
        within_limit: false,
        credit_limit: 0,
        current_outstanding: 0,
        projected_outstanding: additionalAmount,
        available_credit: 0,
        utilization_percentage: 100,
      }
    );
  }

  /**
   * Get customer outstanding summary
   */
  static async getCustomerOutstandingSummary(
    customerId: string,
    companyId: string,
  ): Promise<{
    total_outstanding: number;
    overdue_amount: number;
    current_amount: number;
    invoice_count: number;
    last_payment_date?: string;
  }> {
    const { data, error } = await supabase.rpc("get_customer_outstanding_summary", {
      p_customer_id: customerId,
      p_company_id: companyId,
    });

    if (error) {
      console.error("Error getting outstanding summary:", error);
      return {
        total_outstanding: 0,
        overdue_amount: 0,
        current_amount: 0,
        invoice_count: 0,
      };
    }

    return (
      data || {
        total_outstanding: 0,
        overdue_amount: 0,
        current_amount: 0,
        invoice_count: 0,
      }
    );
  }

  /**
   * Add customer address
   */
  static async addCustomerAddress(
    addressData: Omit<CustomerAddress, "id" | "created_at" | "updated_at">,
  ): Promise<{ data: CustomerAddress | null; error: any }> {
    const { data, error } = await supabase
      .from("customer_addresses")
      .insert(addressData)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Add customer contact
   */
  static async addCustomerContact(
    contactData: Omit<CustomerContact, "id" | "created_at" | "updated_at">,
  ): Promise<{ data: CustomerContact | null; error: any }> {
    const { data, error } = await supabase
      .from("customer_contacts")
      .insert(contactData)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Validate customer business rules before transaction
   */
  static async validateCustomerForTransaction(
    customerId: string,
    companyId: string,
    transactionAmount: number,
  ): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Get customer details
      const { customer } = await this.getCustomer(customerId, companyId);

      if (!customer) {
        errors.push("Customer not found");
        return { valid: false, errors, warnings };
      }

      // Check if customer is active
      if (!customer.is_active) {
        errors.push("Customer is inactive");
      }

      // Check if customer is frozen
      if (customer.is_frozen) {
        errors.push("Customer account is frozen");
      }

      // Check if customer is disabled
      if (customer.disabled) {
        errors.push("Customer is disabled");
      }

      // Check credit limit
      const creditCheck = await this.checkCustomerCreditLimit(
        customerId,
        companyId,
        transactionAmount,
      );

      if (!creditCheck.within_limit) {
        if (customer.credit_limit > 0) {
          errors.push(
            `Credit limit exceeded. Limit: ${customer.credit_limit}, ` +
              `Current Outstanding: ${creditCheck.current_outstanding}, ` +
              `Projected: ${creditCheck.projected_outstanding}`,
          );
        }
      }

      // Warning for high credit utilization (>80%)
      if (creditCheck.utilization_percentage > 80 && creditCheck.utilization_percentage <= 100) {
        warnings.push(`High credit utilization: ${creditCheck.utilization_percentage.toFixed(1)}%`);
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        "Error validating customer: " + (error instanceof Error ? error.message : "Unknown error"),
      );
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Get customer payment behavior analytics
   */
  static async getCustomerPaymentBehavior(
    customerId: string,
    companyId: string,
  ): Promise<{
    average_payment_days: number;
    payment_reliability_score: number; // 0-100
    total_transactions: number;
    on_time_payments: number;
    late_payments: number;
    average_delay_days: number;
  }> {
    const { data, error } = await supabase.rpc("get_customer_payment_behavior", {
      p_customer_id: customerId,
      p_company_id: companyId,
    });

    if (error) {
      console.error("Error getting payment behavior:", error);
      return {
        average_payment_days: 0,
        payment_reliability_score: 0,
        total_transactions: 0,
        on_time_payments: 0,
        late_payments: 0,
        average_delay_days: 0,
      };
    }

    return (
      data || {
        average_payment_days: 0,
        payment_reliability_score: 0,
        total_transactions: 0,
        on_time_payments: 0,
        late_payments: 0,
        average_delay_days: 0,
      }
    );
  }

  // Similar methods for Suppliers would be implemented here...
  // createSupplier, updateSupplier, getSupplier, searchSuppliers, etc.
}
