/**
 * Sales Management Service - Complete Sales Cycle
 * ERPNext-level Quotations, Sales Orders, and Customer Credit Management
 *
 * Features:
 * - Sales Quotations with validity and conversion tracking
 * - Sales Orders with delivery and billing status
 * - Customer credit limit management
 * - Price list management
 * - Comprehensive business logic matching ERPNext
 */

import { supabase } from "./supabase";
import { DocumentWorkflowEngine } from "./document-workflow";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type QuotationStatus =
  | "Draft"
  | "Open"
  | "Replied"
  | "Partially Ordered"
  | "Ordered"
  | "Lost"
  | "Cancelled"
  | "Expired";
export type SalesOrderStatus =
  | "Draft"
  | "To Deliver and Bill"
  | "To Bill"
  | "To Deliver"
  | "Completed"
  | "Cancelled"
  | "Closed";
export type QuotationTo = "Customer" | "Lead";
export type OrderType = "Sales" | "Maintenance" | "Shopping Cart";

export interface SalesQuotation {
  id: string;
  quotation_no: string;
  naming_series: string;
  company_id: string;
  customer_id?: string;
  quotation_to: QuotationTo;
  customer_name: string;
  transaction_date: string;
  valid_till?: string;
  order_type: OrderType;

  // Pricing
  currency: string;
  conversion_rate: number;
  price_list_id?: string;

  // Amounts
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  total_taxes_and_charges: number;
  base_total_taxes_and_charges: number;
  base_grand_total: number;
  base_rounded_total: number;
  grand_total: number;
  rounded_total: number;
  base_in_words?: string;
  in_words?: string;

  // Status
  docstatus: number;
  status: QuotationStatus;

  // Additional info
  order_lost_reason?: string;
  terms?: string;
  terms_and_conditions?: string;

  // References
  opportunity_id?: string;
  lead_id?: string;
  campaign?: string;
  source?: string;

  // Party details
  customer_address_id?: string;
  shipping_address_name?: string;
  shipping_address?: string;
  contact_person?: string;
  contact_display?: string;
  contact_mobile?: string;
  contact_email?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Items (populated when needed)
  items?: SalesQuotationItem[];
}

export interface SalesQuotationItem {
  id: string;
  quotation_id: string;
  item_code: string;
  item_name: string;
  description?: string;
  item_group?: string;
  brand?: string;

  // Quantity & UOM
  qty: number;
  stock_uom?: string;
  uom?: string;
  conversion_factor: number;
  stock_qty: number;

  // Pricing
  rate: number;
  price_list_rate: number;
  base_rate: number;
  base_amount: number;
  amount: number;

  // Delivery
  delivery_date?: string;
  warehouse?: string;

  // Additional
  item_tax_template?: string;
  weight_per_unit: number;
  total_weight: number;
  weight_uom?: string;
  image?: string;
  page_break: boolean;

  idx: number;
  created_at: string;
}

export interface SalesOrder {
  id: string;
  order_no: string;
  naming_series: string;
  company_id: string;
  customer_id: string;
  customer_name: string;
  transaction_date: string;
  delivery_date?: string;
  order_type: OrderType;

  // Pricing
  currency: string;
  conversion_rate: number;
  price_list_id?: string;

  // Amounts
  total_qty: number;
  base_total: number;
  base_net_total: number;
  total: number;
  net_total: number;
  total_taxes_and_charges: number;
  base_total_taxes_and_charges: number;
  base_grand_total: number;
  base_rounded_total: number;
  grand_total: number;
  rounded_total: number;
  base_in_words?: string;
  in_words?: string;

  // Delivery & Billing
  per_delivered: number;
  per_billed: number;

  // Status
  docstatus: number;
  status: SalesOrderStatus;

  // Additional info
  po_no?: string; // Customer's PO number
  po_date?: string;
  terms?: string;
  terms_and_conditions?: string;

  // References
  quotation_id?: string;
  project?: string;
  cost_center?: string;

  // Party details
  customer_address_id?: string;
  shipping_address_name?: string;
  shipping_address?: string;
  contact_person?: string;
  contact_display?: string;
  contact_mobile?: string;
  contact_email?: string;

  // Features
  skip_delivery_note: boolean;
  group_same_items: boolean;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Items (populated when needed)
  items?: SalesOrderItem[];
}

export interface SalesOrderItem {
  id: string;
  order_id: string;
  item_code: string;
  item_name: string;
  description?: string;
  item_group?: string;
  brand?: string;

  // Quantity & UOM
  qty: number;
  delivered_qty: number;
  billed_qty: number;
  pending_qty: number;
  stock_uom?: string;
  uom?: string;
  conversion_factor: number;
  stock_qty: number;

  // Pricing
  rate: number;
  price_list_rate: number;
  base_rate: number;
  base_amount: number;
  amount: number;

  // Delivery
  delivery_date?: string;
  warehouse?: string;

  // Production
  planned_qty: number;
  produced_qty: number;
  returned_qty: number;

  // Additional
  item_tax_template?: string;
  weight_per_unit: number;
  total_weight: number;
  weight_uom?: string;
  image?: string;
  page_break: boolean;

  // Reference
  quotation_item_id?: string;

  idx: number;
  created_at: string;
}

export interface CustomerCreditLimit {
  id: string;
  customer_id: string;
  company_id: string;
  credit_limit: number;
  bypass_credit_limit_check: boolean;
  created_at: string;
  created_by?: string;
}

export interface CreditLimitCheck {
  credit_limit_exceeded: boolean;
  credit_limit: number;
  outstanding_amount: number;
  credit_utilization: number;
  credit_available: number;
}

export interface PriceList {
  id: string;
  price_list_name: string;
  currency: string;
  buying: boolean;
  selling: boolean;
  price_not_uom_dependent: boolean;
  enabled: boolean;
  company_id: string;
  created_at: string;
  created_by?: string;
}

export interface ItemPrice {
  id: string;
  item_code: string;
  price_list_id: string;
  uom?: string;
  min_qty: number;
  price_list_rate: number;
  valid_from?: string;
  valid_upto?: string;
  lead_time_days: number;
  note?: string;
  created_at: string;
  created_by?: string;
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreateQuotationInput {
  company_id: string;
  customer_id?: string;
  quotation_to: QuotationTo;
  customer_name: string;
  transaction_date: string;
  valid_till?: string;
  order_type?: OrderType;
  currency?: string;
  conversion_rate?: number;
  price_list_id?: string;
  terms?: string;
  items: Array<{
    item_code: string;
    item_name: string;
    description?: string;
    qty: number;
    rate: number;
    uom?: string;
    delivery_date?: string;
    warehouse?: string;
  }>;
}

export interface CreateSalesOrderInput {
  company_id: string;
  customer_id: string;
  customer_name: string;
  transaction_date: string;
  delivery_date?: string;
  order_type?: OrderType;
  currency?: string;
  conversion_rate?: number;
  price_list_id?: string;
  po_no?: string;
  po_date?: string;
  terms?: string;
  quotation_id?: string;
  items: Array<{
    item_code: string;
    item_name: string;
    description?: string;
    qty: number;
    rate: number;
    uom?: string;
    delivery_date?: string;
    warehouse?: string;
    quotation_item_id?: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================================================
// SALES MANAGEMENT SERVICE
// =====================================================================================

export class SalesManagementService {
  // =====================================================================================
  // SALES QUOTATIONS
  // =====================================================================================

  /**
   * Create a new sales quotation
   */
  static async createQuotation(input: CreateQuotationInput): Promise<ApiResponse<SalesQuotation>> {
    try {
      // Generate quotation number
      const quotationNo = await this.generateQuotationNumber(input.company_id, "QTN-");

      // Calculate totals
      const totals = this.calculateQuotationTotals(input.items, input.conversion_rate || 1);

      // Create quotation
      const { data: quotation, error: quotationError } = await supabase
        .from("sales_quotations")
        .insert({
          quotation_no: quotationNo,
          company_id: input.company_id,
          customer_id: input.customer_id,
          quotation_to: input.quotation_to,
          customer_name: input.customer_name,
          transaction_date: input.transaction_date,
          valid_till: input.valid_till,
          order_type: input.order_type || "Sales",
          currency: input.currency || "USD",
          conversion_rate: input.conversion_rate || 1,
          price_list_id: input.price_list_id,
          terms: input.terms,
          ...totals,
        })
        .select()
        .single();

      if (quotationError) {
        return { success: false, error: quotationError.message };
      }

      // Create quotation items
      const quotationItems = input.items.map((item, index) => ({
        quotation_id: quotation.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        qty: item.qty,
        rate: item.rate,
        amount: item.qty * item.rate,
        base_rate: item.rate * (input.conversion_rate || 1),
        base_amount: item.qty * item.rate * (input.conversion_rate || 1),
        uom: item.uom,
        delivery_date: item.delivery_date,
        warehouse: item.warehouse,
        stock_qty: item.qty,
        conversion_factor: 1,
        price_list_rate: item.rate,
        weight_per_unit: 0,
        total_weight: 0,
        page_break: false,
        idx: index + 1,
      }));

      const { error: itemsError } = await supabase
        .from("sales_quotation_items")
        .insert(quotationItems);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // Fetch complete quotation with items
      const completeQuotation = await this.getQuotation(quotation.id);

      return {
        success: true,
        data: completeQuotation.data,
        message: `Quotation ${quotationNo} created successfully`,
      };
    } catch (error) {
      console.error("Error creating quotation:", error);
      return { success: false, error: "Failed to create quotation" };
    }
  }

  /**
   * Get quotation by ID
   */
  static async getQuotation(quotationId: string): Promise<ApiResponse<SalesQuotation>> {
    try {
      const { data: quotation, error: quotationError } = await supabase
        .from("sales_quotations")
        .select("*")
        .eq("id", quotationId)
        .single();

      if (quotationError || !quotation) {
        return { success: false, error: "Quotation not found" };
      }

      // Get quotation items
      const { data: items, error: itemsError } = await supabase
        .from("sales_quotation_items")
        .select("*")
        .eq("quotation_id", quotationId)
        .order("idx");

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      return {
        success: true,
        data: { ...quotation, items },
      };
    } catch (error) {
      console.error("Error fetching quotation:", error);
      return { success: false, error: "Failed to fetch quotation" };
    }
  }

  /**
   * Get quotations with filtering
   */
  static async getQuotations(
    companyId: string,
    filters?: {
      customer_id?: string;
      status?: QuotationStatus;
      from_date?: string;
      to_date?: string;
      quotation_to?: QuotationTo;
    },
  ): Promise<ApiResponse<SalesQuotation[]>> {
    try {
      let query = supabase
        .from("sales_quotations")
        .select("*, sales_quotation_items(count)")
        .eq("company_id", companyId);

      if (filters?.customer_id) {
        query = query.eq("customer_id", filters.customer_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.quotation_to) {
        query = query.eq("quotation_to", filters.quotation_to);
      }

      if (filters?.from_date) {
        query = query.gte("transaction_date", filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte("transaction_date", filters.to_date);
      }

      const { data: quotations, error } = await query.order("transaction_date", {
        ascending: false,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: quotations };
    } catch (error) {
      console.error("Error fetching quotations:", error);
      return { success: false, error: "Failed to fetch quotations" };
    }
  }

  /**
   * Submit quotation
   */
  static async submitQuotation(quotationId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await DocumentWorkflowService.submitDocument("sales_quotations", quotationId);

      if (!result.success) {
        return result;
      }

      // Update status to Open
      const { error } = await supabase
        .from("sales_quotations")
        .update({
          status: "Open",
          modified: new Date().toISOString(),
        })
        .eq("id", quotationId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Quotation submitted successfully" };
    } catch (error) {
      console.error("Error submitting quotation:", error);
      return { success: false, error: "Failed to submit quotation" };
    }
  }

  /**
   * Convert quotation to sales order
   */
  static async convertToSalesOrder(
    quotationId: string,
    orderInput: Partial<CreateSalesOrderInput>,
  ): Promise<ApiResponse<SalesOrder>> {
    try {
      // Get quotation details
      const quotationResult = await this.getQuotation(quotationId);
      if (!quotationResult.success || !quotationResult.data) {
        return { success: false, error: "Quotation not found" };
      }

      const quotation = quotationResult.data;

      // Create sales order input from quotation
      const salesOrderInput: CreateSalesOrderInput = {
        company_id: quotation.company_id,
        customer_id: quotation.customer_id!,
        customer_name: quotation.customer_name,
        transaction_date: orderInput.transaction_date || new Date().toISOString().split("T")[0],
        delivery_date: orderInput.delivery_date,
        order_type: quotation.order_type,
        currency: quotation.currency,
        conversion_rate: quotation.conversion_rate,
        price_list_id: quotation.price_list_id,
        terms: quotation.terms,
        quotation_id: quotation.id,
        ...orderInput,
        items:
          quotation.items?.map(item => ({
            item_code: item.item_code,
            item_name: item.item_name,
            description: item.description,
            qty: item.qty,
            rate: item.rate,
            uom: item.uom,
            delivery_date: item.delivery_date,
            warehouse: item.warehouse,
            quotation_item_id: item.id,
          })) || [],
      };

      // Create sales order
      const orderResult = await this.createSalesOrder(salesOrderInput);

      if (orderResult.success) {
        // Update quotation status
        await supabase
          .from("sales_quotations")
          .update({
            status: "Ordered",
            modified: new Date().toISOString(),
          })
          .eq("id", quotationId);
      }

      return orderResult;
    } catch (error) {
      console.error("Error converting quotation to sales order:", error);
      return { success: false, error: "Failed to convert quotation to sales order" };
    }
  }

  // =====================================================================================
  // SALES ORDERS
  // =====================================================================================

  /**
   * Create a new sales order
   */
  static async createSalesOrder(input: CreateSalesOrderInput): Promise<ApiResponse<SalesOrder>> {
    try {
      // Check customer credit limit
      if (input.customer_id) {
        const creditCheck = await this.checkCustomerCreditLimit(
          input.customer_id,
          input.company_id,
          this.calculateOrderTotal(input.items),
        );

        if (creditCheck.success && creditCheck.data?.credit_limit_exceeded) {
          return {
            success: false,
            error: `Credit limit exceeded. Available credit: ${creditCheck.data.credit_available}`,
          };
        }
      }

      // Generate order number
      const orderNo = await this.generateSalesOrderNumber(input.company_id, "SO-");

      // Calculate totals
      const totals = this.calculateOrderTotals(input.items, input.conversion_rate || 1);

      // Create sales order
      const { data: order, error: orderError } = await supabase
        .from("sales_orders")
        .insert({
          order_no: orderNo,
          company_id: input.company_id,
          customer_id: input.customer_id,
          customer_name: input.customer_name,
          transaction_date: input.transaction_date,
          delivery_date: input.delivery_date,
          order_type: input.order_type || "Sales",
          currency: input.currency || "USD",
          conversion_rate: input.conversion_rate || 1,
          price_list_id: input.price_list_id,
          po_no: input.po_no,
          po_date: input.po_date,
          terms: input.terms,
          quotation_id: input.quotation_id,
          skip_delivery_note: false,
          group_same_items: false,
          ...totals,
        })
        .select()
        .single();

      if (orderError) {
        return { success: false, error: orderError.message };
      }

      // Create order items
      const orderItems = input.items.map((item, index) => ({
        order_id: order.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        qty: item.qty,
        delivered_qty: 0,
        billed_qty: 0,
        pending_qty: item.qty,
        rate: item.rate,
        amount: item.qty * item.rate,
        base_rate: item.rate * (input.conversion_rate || 1),
        base_amount: item.qty * item.rate * (input.conversion_rate || 1),
        uom: item.uom,
        delivery_date: item.delivery_date,
        warehouse: item.warehouse,
        quotation_item_id: item.quotation_item_id,
        stock_qty: item.qty,
        conversion_factor: 1,
        price_list_rate: item.rate,
        planned_qty: 0,
        produced_qty: 0,
        returned_qty: 0,
        weight_per_unit: 0,
        total_weight: 0,
        page_break: false,
        idx: index + 1,
      }));

      const { error: itemsError } = await supabase.from("sales_order_items").insert(orderItems);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // Fetch complete order with items
      const completeOrder = await this.getSalesOrder(order.id);

      return {
        success: true,
        data: completeOrder.data,
        message: `Sales Order ${orderNo} created successfully`,
      };
    } catch (error) {
      console.error("Error creating sales order:", error);
      return { success: false, error: "Failed to create sales order" };
    }
  }

  /**
   * Get sales order by ID
   */
  static async getSalesOrder(orderId: string): Promise<ApiResponse<SalesOrder>> {
    try {
      const { data: order, error: orderError } = await supabase
        .from("sales_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return { success: false, error: "Sales order not found" };
      }

      // Get order items
      const { data: items, error: itemsError } = await supabase
        .from("sales_order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("idx");

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      return {
        success: true,
        data: { ...order, items },
      };
    } catch (error) {
      console.error("Error fetching sales order:", error);
      return { success: false, error: "Failed to fetch sales order" };
    }
  }

  /**
   * Get sales orders with filtering
   */
  static async getSalesOrders(
    companyId: string,
    filters?: {
      customer_id?: string;
      status?: SalesOrderStatus;
      from_date?: string;
      to_date?: string;
    },
  ): Promise<ApiResponse<SalesOrder[]>> {
    try {
      let query = supabase
        .from("sales_orders")
        .select("*, sales_order_items(count)")
        .eq("company_id", companyId);

      if (filters?.customer_id) {
        query = query.eq("customer_id", filters.customer_id);
      }

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.from_date) {
        query = query.gte("transaction_date", filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte("transaction_date", filters.to_date);
      }

      const { data: orders, error } = await query.order("transaction_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: orders };
    } catch (error) {
      console.error("Error fetching sales orders:", error);
      return { success: false, error: "Failed to fetch sales orders" };
    }
  }

  /**
   * Submit sales order
   */
  static async submitSalesOrder(orderId: string): Promise<ApiResponse<boolean>> {
    try {
      // Get order details for credit limit check
      const orderResult = await this.getSalesOrder(orderId);
      if (!orderResult.success || !orderResult.data) {
        return { success: false, error: "Sales order not found" };
      }

      const order = orderResult.data;

      // Check customer credit limit
      const creditCheck = await this.checkCustomerCreditLimit(
        order.customer_id,
        order.company_id,
        order.grand_total,
      );

      if (creditCheck.success && creditCheck.data?.credit_limit_exceeded) {
        return {
          success: false,
          error: `Credit limit exceeded. Available credit: ${creditCheck.data.credit_available}`,
        };
      }

      const result = await DocumentWorkflowService.submitDocument("sales_orders", orderId);

      if (!result.success) {
        return result;
      }

      // Update status to open
      const { error } = await supabase
        .from("sales_orders")
        .update({
          status: "To Deliver and Bill",
          modified: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Sales order submitted successfully" };
    } catch (error) {
      console.error("Error submitting sales order:", error);
      return { success: false, error: "Failed to submit sales order" };
    }
  }

  // =====================================================================================
  // CUSTOMER CREDIT MANAGEMENT
  // =====================================================================================

  /**
   * Set customer credit limit
   */
  static async setCustomerCreditLimit(
    customerId: string,
    companyId: string,
    creditLimit: number,
    bypassCheck: boolean = false,
  ): Promise<ApiResponse<CustomerCreditLimit>> {
    try {
      const { data: creditLimitRecord, error } = await supabase
        .from("customer_credit_limits")
        .upsert(
          {
            customer_id: customerId,
            company_id: companyId,
            credit_limit: creditLimit,
            bypass_credit_limit_check: bypassCheck,
          },
          {
            onConflict: "customer_id,company_id",
          },
        )
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        data: creditLimitRecord,
        message: "Customer credit limit updated successfully",
      };
    } catch (error) {
      console.error("Error setting customer credit limit:", error);
      return { success: false, error: "Failed to set customer credit limit" };
    }
  }

  /**
   * Check customer credit limit
   */
  static async checkCustomerCreditLimit(
    customerId: string,
    companyId: string,
    additionalAmount: number = 0,
  ): Promise<ApiResponse<CreditLimitCheck>> {
    try {
      const { data: creditCheck, error } = await supabase.rpc("check_customer_credit_limit", {
        p_customer_id: customerId,
        p_company_id: companyId,
        p_additional_amount: additionalAmount,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: creditCheck[0] };
    } catch (error) {
      console.error("Error checking customer credit limit:", error);
      return { success: false, error: "Failed to check customer credit limit" };
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Generate quotation number
   */
  private static async generateQuotationNumber(companyId: string, series: string): Promise<string> {
    const { data, error } = await supabase.rpc("generate_quotation_number", {
      p_company_id: companyId,
      p_naming_series: series,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Generate sales order number
   */
  private static async generateSalesOrderNumber(
    companyId: string,
    series: string,
  ): Promise<string> {
    const { data, error } = await supabase.rpc("generate_sales_order_number", {
      p_company_id: companyId,
      p_naming_series: series,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Calculate quotation totals
   */
  private static calculateQuotationTotals(items: any[], conversionRate: number) {
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
    const baseTotal = total * conversionRate;

    return {
      total_qty: totalQty,
      total: total,
      net_total: total,
      base_total: baseTotal,
      base_net_total: baseTotal,
      grand_total: total,
      base_grand_total: baseTotal,
      rounded_total: Math.round(total),
      base_rounded_total: Math.round(baseTotal),
      total_taxes_and_charges: 0,
      base_total_taxes_and_charges: 0,
    };
  }

  /**
   * Calculate order totals
   */
  private static calculateOrderTotals(items: any[], conversionRate: number) {
    return this.calculateQuotationTotals(items, conversionRate);
  }

  /**
   * Calculate order total for credit check
   */
  private static calculateOrderTotal(items: any[]): number {
    return items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  }

  /**
   * Get sales analytics
   */
  static async getSalesAnalytics(
    companyId: string,
    period?: string,
  ): Promise<
    ApiResponse<{
      total_quotations: number;
      total_orders: number;
      quotation_conversion_rate: number;
      total_sales_value: number;
      pending_deliveries: number;
      pending_invoices: number;
    }>
  > {
    try {
      const today = new Date();
      const fromDate = new Date();

      switch (period) {
        case "month":
          fromDate.setMonth(today.getMonth() - 1);
          break;
        case "quarter":
          fromDate.setMonth(today.getMonth() - 3);
          break;
        case "year":
          fromDate.setFullYear(today.getFullYear() - 1);
          break;
        default:
          fromDate.setMonth(today.getMonth() - 1); // Default to last month
      }

      const fromDateStr = fromDate.toISOString().split("T")[0];

      // Get quotations count
      const { data: quotationsData } = await supabase
        .from("sales_quotations")
        .select("id, status")
        .eq("company_id", companyId)
        .gte("transaction_date", fromDateStr);

      // Get orders count
      const { data: ordersData } = await supabase
        .from("sales_orders")
        .select("id, grand_total, status, per_delivered, per_billed")
        .eq("company_id", companyId)
        .gte("transaction_date", fromDateStr);

      const totalQuotations = quotationsData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const convertedQuotations = quotationsData?.filter(q => q.status === "Ordered").length || 0;
      const conversionRate =
        totalQuotations > 0 ? (convertedQuotations / totalQuotations) * 100 : 0;
      const totalSalesValue =
        ordersData?.reduce((sum, order) => sum + (order.grand_total || 0), 0) || 0;
      const pendingDeliveries = ordersData?.filter(order => order.per_delivered < 100).length || 0;
      const pendingInvoices = ordersData?.filter(order => order.per_billed < 100).length || 0;

      return {
        success: true,
        data: {
          total_quotations: totalQuotations,
          total_orders: totalOrders,
          quotation_conversion_rate: Math.round(conversionRate * 100) / 100,
          total_sales_value: totalSalesValue,
          pending_deliveries: pendingDeliveries,
          pending_invoices: pendingInvoices,
        },
      };
    } catch (error) {
      console.error("Error fetching sales analytics:", error);
      return { success: false, error: "Failed to fetch sales analytics" };
    }
  }
}
