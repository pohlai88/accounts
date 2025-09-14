/**
 * Purchase Management Service - Complete Purchase Cycle
 * ERPNext-level Purchase Requests, Purchase Orders, and Supplier Management
 *
 * Features:
 * - Purchase Requests (Material Requests) with approval workflow
 * - Purchase Orders with receipt and billing tracking
 * - Supplier Quotations with comparison features
 * - Supplier performance tracking and evaluation
 * - Comprehensive business logic matching ERPNext
 */

import { supabase } from "./supabase";
import { DocumentWorkflowEngine } from "./document-workflow";

// =====================================================================================
// INTERFACES AND TYPES
// =====================================================================================

export type MaterialRequestType =
  | "Purchase"
  | "Material Transfer"
  | "Material Issue"
  | "Manufacture"
  | "Customer Provided";
export type PurchaseRequestStatus =
  | "Draft"
  | "Submitted"
  | "Stopped"
  | "Cancelled"
  | "Pending"
  | "Partially Ordered"
  | "Ordered"
  | "Issued"
  | "Transferred"
  | "Received";
export type PurchaseOrderStatus =
  | "Draft"
  | "To Receive and Bill"
  | "To Bill"
  | "To Receive"
  | "Completed"
  | "Cancelled"
  | "Closed"
  | "Delivered"
  | "Partly Received";
export type SupplierQuotationStatus =
  | "Draft"
  | "Submitted"
  | "Ordered"
  | "Expired"
  | "Lost"
  | "Cancelled";
export type OrderType = "Purchase" | "Maintenance" | "Services" | "Raw Materials";

export interface PurchaseRequest {
  id: string;
  request_no: string;
  naming_series: string;
  company_id: string;
  material_request_type: MaterialRequestType;
  transaction_date: string;
  required_date?: string;

  // Request Details
  purpose?: string;
  requested_for?: string;
  department?: string;
  cost_center?: string;
  project_id?: string;

  // Status
  docstatus: number;
  status: PurchaseRequestStatus;
  per_ordered: number;
  per_received: number;

  // Additional info
  terms?: string;
  terms_and_conditions?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Items (populated when needed)
  items?: PurchaseRequestItem[];
}

export interface PurchaseRequestItem {
  id: string;
  request_id: string;
  item_code: string;
  item_name: string;
  description?: string;
  item_group?: string;
  brand?: string;

  // Quantity & UOM
  qty: number;
  ordered_qty: number;
  received_qty: number;
  stock_uom?: string;
  uom?: string;
  conversion_factor: number;
  stock_qty: number;

  // Pricing (estimates)
  rate: number;
  amount: number;

  // Requirements
  schedule_date?: string;
  warehouse?: string;

  // Additional
  min_order_qty: number;
  projected_qty: number;
  actual_qty: number;
  image?: string;
  page_break: boolean;

  idx: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: string;
  order_no: string;
  naming_series: string;
  company_id: string;
  supplier_id: string;
  supplier_name: string;
  transaction_date: string;
  schedule_date?: string;
  order_type: OrderType;

  // Supplier Details
  supplier_address?: string;
  contact_person?: string;
  contact_display?: string;
  contact_mobile?: string;
  contact_email?: string;

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

  // Advance Payment
  advance_paid: number;

  // Receipt & Billing
  per_received: number;
  per_billed: number;

  // Status
  docstatus: number;
  status: PurchaseOrderStatus;

  // Additional info
  supplier_quotation?: string;
  terms?: string;
  terms_and_conditions?: string;

  // References
  material_request_id?: string;
  project?: string;
  cost_center?: string;

  // Features
  is_subcontracted: boolean;
  supplier_warehouse?: string;
  set_warehouse?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Items (populated when needed)
  items?: PurchaseOrderItem[];
}

export interface PurchaseOrderItem {
  id: string;
  order_id: string;
  item_code: string;
  item_name: string;
  description?: string;
  item_group?: string;
  brand?: string;

  // Quantity & UOM
  qty: number;
  received_qty: number;
  billed_qty: number;
  returned_qty: number;
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
  schedule_date?: string;
  expected_delivery_date?: string;
  warehouse?: string;

  // Quality Control
  quality_inspection_required: boolean;
  quality_inspection?: string;

  // Manufacturing (subcontracting)
  bom?: string;
  include_exploded_items: boolean;

  // Additional
  item_tax_template?: string;
  weight_per_unit: number;
  total_weight: number;
  weight_uom?: string;
  discount_percentage: number;
  discount_amount: number;
  image?: string;
  page_break: boolean;

  // Reference
  material_request_item_id?: string;

  idx: number;
  created_at: string;
}

export interface SupplierQuotation {
  id: string;
  quotation_no: string;
  naming_series: string;
  company_id: string;
  supplier_id: string;
  supplier_name: string;
  transaction_date: string;
  valid_till?: string;

  // Pricing
  currency: string;
  conversion_rate: number;

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
  status: SupplierQuotationStatus;

  // Additional info
  terms?: string;
  terms_and_conditions?: string;

  // References
  opportunity_id?: string;
  material_request_id?: string;

  // Audit
  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;

  // Items (populated when needed)
  items?: SupplierQuotationItem[];
}

export interface SupplierQuotationItem {
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

  // Lead Time
  lead_time_days: number;
  expected_delivery_date?: string;

  // Additional
  item_tax_template?: string;
  weight_per_unit: number;
  total_weight: number;
  weight_uom?: string;
  image?: string;
  page_break: boolean;

  // Reference
  material_request_item_id?: string;

  idx: number;
  created_at: string;
}

export interface SupplierPerformance {
  id: string;
  supplier_id: string;
  company_id: string;
  evaluation_period_from: string;
  evaluation_period_to: string;

  // Performance Metrics
  total_orders: number;
  total_order_value: number;
  on_time_delivery_rate: number;
  quality_rating: number;
  cost_competitiveness: number;
  overall_rating: number;

  // Delivery Performance
  total_deliveries: number;
  on_time_deliveries: number;
  early_deliveries: number;
  late_deliveries: number;
  average_delivery_days: number;

  // Quality Metrics
  total_inspections: number;
  passed_inspections: number;
  failed_inspections: number;
  rejection_rate: number;

  // Notes
  notes?: string;
  recommendations?: string;

  created_at: string;
  created_by?: string;
  modified: string;
  modified_by?: string;
}

// =====================================================================================
// INPUT TYPES
// =====================================================================================

export interface CreatePurchaseRequestInput {
  company_id: string;
  material_request_type?: MaterialRequestType;
  transaction_date: string;
  required_date?: string;
  purpose?: string;
  requested_for?: string;
  department?: string;
  cost_center?: string;
  project_id?: string;
  terms?: string;
  items: Array<{
    item_code: string;
    item_name: string;
    description?: string;
    qty: number;
    rate?: number;
    uom?: string;
    schedule_date?: string;
    warehouse?: string;
  }>;
}

export interface CreatePurchaseOrderInput {
  company_id: string;
  supplier_id: string;
  supplier_name: string;
  transaction_date: string;
  schedule_date?: string;
  order_type?: OrderType;
  currency?: string;
  conversion_rate?: number;
  price_list_id?: string;
  supplier_quotation?: string;
  terms?: string;
  material_request_id?: string;
  project?: string;
  cost_center?: string;
  is_subcontracted?: boolean;
  supplier_warehouse?: string;
  set_warehouse?: string;
  items: Array<{
    item_code: string;
    item_name: string;
    description?: string;
    qty: number;
    rate: number;
    uom?: string;
    schedule_date?: string;
    expected_delivery_date?: string;
    warehouse?: string;
    quality_inspection_required?: boolean;
    material_request_item_id?: string;
  }>;
}

export interface CreateSupplierQuotationInput {
  company_id: string;
  supplier_id: string;
  supplier_name: string;
  transaction_date: string;
  valid_till?: string;
  currency?: string;
  conversion_rate?: number;
  terms?: string;
  material_request_id?: string;
  items: Array<{
    item_code: string;
    item_name: string;
    description?: string;
    qty: number;
    rate: number;
    uom?: string;
    lead_time_days?: number;
    expected_delivery_date?: string;
    material_request_item_id?: string;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// =====================================================================================
// PURCHASE MANAGEMENT SERVICE
// =====================================================================================

export class PurchaseManagementService {
  // =====================================================================================
  // PURCHASE REQUESTS
  // =====================================================================================

  /**
   * Create a new purchase request
   */
  static async createPurchaseRequest(
    input: CreatePurchaseRequestInput,
  ): Promise<ApiResponse<PurchaseRequest>> {
    try {
      // Generate request number
      const requestNo = await this.generatePurchaseRequestNumber(input.company_id, "PR-REQ-");

      // Calculate totals
      const totals = this.calculateRequestTotals(input.items);

      // Create purchase request
      const { data: request, error: requestError } = await supabase
        .from("purchase_requests")
        .insert({
          request_no: requestNo,
          company_id: input.company_id,
          material_request_type: input.material_request_type || "Purchase",
          transaction_date: input.transaction_date,
          required_date: input.required_date,
          purpose: input.purpose,
          requested_for: input.requested_for,
          department: input.department,
          cost_center: input.cost_center,
          project_id: input.project_id,
          terms: input.terms,
        })
        .select()
        .single();

      if (requestError) {
        return { success: false, error: requestError.message };
      }

      // Create request items
      const requestItems = input.items.map((item, index) => ({
        request_id: request.id,
        item_code: item.item_code,
        item_name: item.item_name,
        description: item.description,
        qty: item.qty,
        rate: item.rate || 0,
        amount: item.qty * (item.rate || 0),
        uom: item.uom,
        schedule_date: item.schedule_date,
        warehouse: item.warehouse,
        ordered_qty: 0,
        received_qty: 0,
        stock_qty: item.qty,
        conversion_factor: 1,
        min_order_qty: 0,
        projected_qty: 0,
        actual_qty: 0,
        page_break: false,
        idx: index + 1,
      }));

      const { error: itemsError } = await supabase
        .from("purchase_request_items")
        .insert(requestItems);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // Fetch complete request with items
      const completeRequest = await this.getPurchaseRequest(request.id);

      return {
        success: true,
        data: completeRequest.data,
        message: `Purchase Request ${requestNo} created successfully`,
      };
    } catch (error) {
      console.error("Error creating purchase request:", error);
      return { success: false, error: "Failed to create purchase request" };
    }
  }

  /**
   * Get purchase request by ID
   */
  static async getPurchaseRequest(requestId: string): Promise<ApiResponse<PurchaseRequest>> {
    try {
      const { data: request, error: requestError } = await supabase
        .from("purchase_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestError || !request) {
        return { success: false, error: "Purchase request not found" };
      }

      // Get request items
      const { data: items, error: itemsError } = await supabase
        .from("purchase_request_items")
        .select("*")
        .eq("request_id", requestId)
        .order("idx");

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      return {
        success: true,
        data: { ...request, items },
      };
    } catch (error) {
      console.error("Error fetching purchase request:", error);
      return { success: false, error: "Failed to fetch purchase request" };
    }
  }

  /**
   * Get purchase requests with filtering
   */
  static async getPurchaseRequests(
    companyId: string,
    filters?: {
      status?: PurchaseRequestStatus;
      material_request_type?: MaterialRequestType;
      from_date?: string;
      to_date?: string;
      department?: string;
    },
  ): Promise<ApiResponse<PurchaseRequest[]>> {
    try {
      let query = supabase
        .from("purchase_requests")
        .select("*, purchase_request_items(count)")
        .eq("company_id", companyId);

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.material_request_type) {
        query = query.eq("material_request_type", filters.material_request_type);
      }

      if (filters?.department) {
        query = query.eq("department", filters.department);
      }

      if (filters?.from_date) {
        query = query.gte("transaction_date", filters.from_date);
      }

      if (filters?.to_date) {
        query = query.lte("transaction_date", filters.to_date);
      }

      const { data: requests, error } = await query.order("transaction_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: requests };
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
      return { success: false, error: "Failed to fetch purchase requests" };
    }
  }

  /**
   * Submit purchase request
   */
  static async submitPurchaseRequest(requestId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await DocumentWorkflowService.submitDocument("purchase_requests", requestId);

      if (!result.success) {
        return result;
      }

      // Update status to Submitted
      const { error } = await supabase
        .from("purchase_requests")
        .update({
          status: "Submitted",
          modified: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Purchase request submitted successfully" };
    } catch (error) {
      console.error("Error submitting purchase request:", error);
      return { success: false, error: "Failed to submit purchase request" };
    }
  }

  // =====================================================================================
  // PURCHASE ORDERS
  // =====================================================================================

  /**
   * Create a new purchase order
   */
  static async createPurchaseOrder(
    input: CreatePurchaseOrderInput,
  ): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Generate order number
      const orderNo = await this.generatePurchaseOrderNumber(input.company_id, "PO-");

      // Calculate totals
      const totals = this.calculateOrderTotals(input.items, input.conversion_rate || 1);

      // Create purchase order
      const { data: order, error: orderError } = await supabase
        .from("purchase_orders")
        .insert({
          order_no: orderNo,
          company_id: input.company_id,
          supplier_id: input.supplier_id,
          supplier_name: input.supplier_name,
          transaction_date: input.transaction_date,
          schedule_date: input.schedule_date,
          order_type: input.order_type || "Purchase",
          currency: input.currency || "USD",
          conversion_rate: input.conversion_rate || 1,
          price_list_id: input.price_list_id,
          supplier_quotation: input.supplier_quotation,
          terms: input.terms,
          material_request_id: input.material_request_id,
          project: input.project,
          cost_center: input.cost_center,
          is_subcontracted: input.is_subcontracted || false,
          supplier_warehouse: input.supplier_warehouse,
          set_warehouse: input.set_warehouse,
          advance_paid: 0,
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
        received_qty: 0,
        billed_qty: 0,
        returned_qty: 0,
        rate: item.rate,
        amount: item.qty * item.rate,
        base_rate: item.rate * (input.conversion_rate || 1),
        base_amount: item.qty * item.rate * (input.conversion_rate || 1),
        uom: item.uom,
        schedule_date: item.schedule_date,
        expected_delivery_date: item.expected_delivery_date,
        warehouse: item.warehouse,
        quality_inspection_required: item.quality_inspection_required || false,
        material_request_item_id: item.material_request_item_id,
        stock_qty: item.qty,
        conversion_factor: 1,
        price_list_rate: item.rate,
        include_exploded_items: true,
        weight_per_unit: 0,
        total_weight: 0,
        discount_percentage: 0,
        discount_amount: 0,
        page_break: false,
        idx: index + 1,
      }));

      const { error: itemsError } = await supabase.from("purchase_order_items").insert(orderItems);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // Update material request item quantities if linked
      if (input.material_request_id) {
        await this.updateMaterialRequestQuantities(input.material_request_id, input.items);
      }

      // Fetch complete order with items
      const completeOrder = await this.getPurchaseOrder(order.id);

      return {
        success: true,
        data: completeOrder.data,
        message: `Purchase Order ${orderNo} created successfully`,
      };
    } catch (error) {
      console.error("Error creating purchase order:", error);
      return { success: false, error: "Failed to create purchase order" };
    }
  }

  /**
   * Get purchase order by ID
   */
  static async getPurchaseOrder(orderId: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const { data: order, error: orderError } = await supabase
        .from("purchase_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return { success: false, error: "Purchase order not found" };
      }

      // Get order items
      const { data: items, error: itemsError } = await supabase
        .from("purchase_order_items")
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
      console.error("Error fetching purchase order:", error);
      return { success: false, error: "Failed to fetch purchase order" };
    }
  }

  /**
   * Get purchase orders with filtering
   */
  static async getPurchaseOrders(
    companyId: string,
    filters?: {
      supplier_id?: string;
      status?: PurchaseOrderStatus;
      from_date?: string;
      to_date?: string;
    },
  ): Promise<ApiResponse<PurchaseOrder[]>> {
    try {
      let query = supabase
        .from("purchase_orders")
        .select("*, purchase_order_items(count)")
        .eq("company_id", companyId);

      if (filters?.supplier_id) {
        query = query.eq("supplier_id", filters.supplier_id);
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
      console.error("Error fetching purchase orders:", error);
      return { success: false, error: "Failed to fetch purchase orders" };
    }
  }

  /**
   * Submit purchase order
   */
  static async submitPurchaseOrder(orderId: string): Promise<ApiResponse<boolean>> {
    try {
      const result = await DocumentWorkflowService.submitDocument("purchase_orders", orderId);

      if (!result.success) {
        return result;
      }

      // Update status
      const { error } = await supabase
        .from("purchase_orders")
        .update({
          status: "To Receive and Bill",
          modified: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: true, message: "Purchase order submitted successfully" };
    } catch (error) {
      console.error("Error submitting purchase order:", error);
      return { success: false, error: "Failed to submit purchase order" };
    }
  }

  // =====================================================================================
  // SUPPLIER QUOTATIONS
  // =====================================================================================

  /**
   * Create a new supplier quotation
   */
  static async createSupplierQuotation(
    input: CreateSupplierQuotationInput,
  ): Promise<ApiResponse<SupplierQuotation>> {
    try {
      // Generate quotation number
      const quotationNo = await this.generateSupplierQuotationNumber(input.company_id, "SUPP-QTN-");

      // Calculate totals
      const totals = this.calculateSupplierQuotationTotals(input.items, input.conversion_rate || 1);

      // Create supplier quotation
      const { data: quotation, error: quotationError } = await supabase
        .from("supplier_quotations")
        .insert({
          quotation_no: quotationNo,
          company_id: input.company_id,
          supplier_id: input.supplier_id,
          supplier_name: input.supplier_name,
          transaction_date: input.transaction_date,
          valid_till: input.valid_till,
          currency: input.currency || "USD",
          conversion_rate: input.conversion_rate || 1,
          terms: input.terms,
          material_request_id: input.material_request_id,
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
        lead_time_days: item.lead_time_days || 0,
        expected_delivery_date: item.expected_delivery_date,
        material_request_item_id: item.material_request_item_id,
        stock_qty: item.qty,
        conversion_factor: 1,
        price_list_rate: item.rate,
        weight_per_unit: 0,
        total_weight: 0,
        page_break: false,
        idx: index + 1,
      }));

      const { error: itemsError } = await supabase
        .from("supplier_quotation_items")
        .insert(quotationItems);

      if (itemsError) {
        return { success: false, error: itemsError.message };
      }

      // Fetch complete quotation with items
      const completeQuotation = await this.getSupplierQuotation(quotation.id);

      return {
        success: true,
        data: completeQuotation.data,
        message: `Supplier Quotation ${quotationNo} created successfully`,
      };
    } catch (error) {
      console.error("Error creating supplier quotation:", error);
      return { success: false, error: "Failed to create supplier quotation" };
    }
  }

  /**
   * Get supplier quotation by ID
   */
  static async getSupplierQuotation(quotationId: string): Promise<ApiResponse<SupplierQuotation>> {
    try {
      const { data: quotation, error: quotationError } = await supabase
        .from("supplier_quotations")
        .select("*")
        .eq("id", quotationId)
        .single();

      if (quotationError || !quotation) {
        return { success: false, error: "Supplier quotation not found" };
      }

      // Get quotation items
      const { data: items, error: itemsError } = await supabase
        .from("supplier_quotation_items")
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
      console.error("Error fetching supplier quotation:", error);
      return { success: false, error: "Failed to fetch supplier quotation" };
    }
  }

  // =====================================================================================
  // SUPPLIER PERFORMANCE
  // =====================================================================================

  /**
   * Calculate supplier performance
   */
  static async calculateSupplierPerformance(
    supplierId: string,
    companyId: string,
    periodFrom: string,
    periodTo: string,
  ): Promise<ApiResponse<SupplierPerformance>> {
    try {
      const { data: performance, error } = await supabase.rpc("calculate_supplier_performance", {
        p_supplier_id: supplierId,
        p_company_id: companyId,
        p_period_from: periodFrom,
        p_period_to: periodTo,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: performance[0] };
    } catch (error) {
      console.error("Error calculating supplier performance:", error);
      return { success: false, error: "Failed to calculate supplier performance" };
    }
  }

  // =====================================================================================
  // UTILITY METHODS
  // =====================================================================================

  /**
   * Generate purchase request number
   */
  private static async generatePurchaseRequestNumber(
    companyId: string,
    series: string,
  ): Promise<string> {
    const { data, error } = await supabase.rpc("generate_purchase_request_number", {
      p_company_id: companyId,
      p_naming_series: series,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Generate purchase order number
   */
  private static async generatePurchaseOrderNumber(
    companyId: string,
    series: string,
  ): Promise<string> {
    const { data, error } = await supabase.rpc("generate_purchase_order_number", {
      p_company_id: companyId,
      p_naming_series: series,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Generate supplier quotation number
   */
  private static async generateSupplierQuotationNumber(
    companyId: string,
    series: string,
  ): Promise<string> {
    const { data, error } = await supabase.rpc("generate_supplier_quotation_number", {
      p_company_id: companyId,
      p_naming_series: series,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Calculate request totals
   */
  private static calculateRequestTotals(items: any[]) {
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
    const total = items.reduce((sum, item) => sum + item.qty * (item.rate || 0), 0);

    return {
      total_qty: totalQty,
      total: total,
      net_total: total,
      base_total: total,
      base_net_total: total,
      grand_total: total,
      base_grand_total: total,
      rounded_total: Math.round(total),
      base_rounded_total: Math.round(total),
      total_taxes_and_charges: 0,
      base_total_taxes_and_charges: 0,
    };
  }

  /**
   * Calculate order totals
   */
  private static calculateOrderTotals(items: any[], conversionRate: number) {
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
   * Calculate supplier quotation totals
   */
  private static calculateSupplierQuotationTotals(items: any[], conversionRate: number) {
    return this.calculateOrderTotals(items, conversionRate);
  }

  /**
   * Update material request quantities when creating purchase order
   */
  private static async updateMaterialRequestQuantities(materialRequestId: string, items: any[]) {
    try {
      for (const item of items) {
        if (item.material_request_item_id) {
          await supabase
            .from("purchase_request_items")
            .update({
              ordered_qty: item.qty,
            })
            .eq("id", item.material_request_item_id);
        }
      }
    } catch (error) {
      console.error("Error updating material request quantities:", error);
    }
  }

  /**
   * Get purchase analytics
   */
  static async getPurchaseAnalytics(
    companyId: string,
    period?: string,
  ): Promise<
    ApiResponse<{
      total_requests: number;
      total_orders: number;
      request_to_order_conversion_rate: number;
      total_purchase_value: number;
      pending_receipts: number;
      pending_invoices: number;
      active_suppliers: number;
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

      // Get requests count
      const { data: requestsData } = await supabase
        .from("purchase_requests")
        .select("id, status")
        .eq("company_id", companyId)
        .gte("transaction_date", fromDateStr);

      // Get orders count and value
      const { data: ordersData } = await supabase
        .from("purchase_orders")
        .select("id, grand_total, status, per_received, per_billed, supplier_id")
        .eq("company_id", companyId)
        .gte("transaction_date", fromDateStr);

      const totalRequests = requestsData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const orderedRequests = requestsData?.filter(r => r.status === "Ordered").length || 0;
      const conversionRate = totalRequests > 0 ? (orderedRequests / totalRequests) * 100 : 0;
      const totalPurchaseValue =
        ordersData?.reduce((sum, order) => sum + (order.grand_total || 0), 0) || 0;
      const pendingReceipts = ordersData?.filter(order => order.per_received < 100).length || 0;
      const pendingInvoices = ordersData?.filter(order => order.per_billed < 100).length || 0;
      const uniqueSuppliers = new Set(ordersData?.map(order => order.supplier_id)).size || 0;

      return {
        success: true,
        data: {
          total_requests: totalRequests,
          total_orders: totalOrders,
          request_to_order_conversion_rate: Math.round(conversionRate * 100) / 100,
          total_purchase_value: totalPurchaseValue,
          pending_receipts: pendingReceipts,
          pending_invoices: pendingInvoices,
          active_suppliers: uniqueSuppliers,
        },
      };
    } catch (error) {
      console.error("Error fetching purchase analytics:", error);
      return { success: false, error: "Failed to fetch purchase analytics" };
    }
  }
}
