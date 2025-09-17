/**
 * Inventory Management Service
 * Handles inventory tracking, stock management, and costing
 */
// @ts-nocheck


import { supabase } from "./supabase";

export type ItemType = "Stock" | "Service" | "Consumable";
export type PriceType = "Sales" | "Purchase" | "Standard";
export type TransactionType = "Purchase" | "Sale" | "Transfer" | "Adjustment" | "Count";
export type AdjustmentStatus = "Draft" | "Submitted" | "Approved" | "Cancelled";

export interface ItemCategory {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  parentId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  companyId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  categoryId?: string;
  unitOfMeasure: string;
  itemType: ItemType;
  isSellable: boolean;
  isPurchasable: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemPricing {
  id: string;
  itemId: string;
  priceType: PriceType;
  currency: string;
  unitPrice: number;
  effectiveDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  companyId: string;
  warehouseCode: string;
  warehouseName: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ItemStock {
  id: string;
  itemId: string;
  warehouseId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  reorderQty: number;
  lastCountedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockTransaction {
  id: string;
  companyId: string;
  itemId: string;
  warehouseId: string;
  transactionType: TransactionType;
  transactionDate: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  createdBy?: string;
  createdAt: string;
}

export interface StockAdjustment {
  id: string;
  companyId: string;
  adjustmentNo: string;
  adjustmentDate: string;
  warehouseId: string;
  reason: string;
  status: AdjustmentStatus;
  totalAdjustmentValue: number;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockAdjustmentItem {
  id: string;
  adjustmentId: string;
  itemId: string;
  warehouseId: string;
  currentQty: number;
  countedQty: number;
  varianceQty: number;
  unitCost: number;
  varianceValue: number;
  remarks?: string;
  createdAt: string;
}

export interface CreateItemInput {
  companyId: string;
  itemCode: string;
  itemName: string;
  description?: string;
  categoryId?: string;
  unitOfMeasure: string;
  itemType: ItemType;
  isSellable?: boolean;
  isPurchasable?: boolean;
}

export interface CreateWarehouseInput {
  companyId: string;
  warehouseCode: string;
  warehouseName: string;
  address?: string;
}

export interface CreateStockTransactionInput {
  companyId: string;
  itemId: string;
  warehouseId: string;
  transactionType: TransactionType;
  transactionDate: string;
  quantity: number;
  unitCost?: number;
  referenceType?: string;
  referenceId?: string;
  remarks?: string;
  createdBy?: string;
}

export class InventoryManagementService {
  /**
   * Create a new item
   */
  static async createItem(
    input: CreateItemInput,
  ): Promise<{ success: boolean; item?: Item; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({
          company_id: input.companyId,
          item_code: input.itemCode,
          item_name: input.itemName,
          description: input.description,
          category_id: input.categoryId,
          unit_of_measure: input.unitOfMeasure,
          item_type: input.itemType,
          is_sellable: input.isSellable ?? true,
          is_purchasable: input.isPurchasable ?? true,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating item:", error);
        return { success: false, error: "Failed to create item" };
      }

      const item: Item = {
        id: data.id,
        companyId: data.company_id,
        itemCode: data.item_code,
        itemName: data.item_name,
        description: data.description,
        categoryId: data.category_id,
        unitOfMeasure: data.unit_of_measure,
        itemType: data.item_type,
        isSellable: data.is_sellable,
        isPurchasable: data.is_purchasable,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, item };
    } catch (error) {
      console.error("Error creating item:", error);
      return { success: false, error: "Failed to create item" };
    }
  }

  /**
   * Get all items for a company
   */
  static async getItems(
    companyId: string,
  ): Promise<{ success: boolean; items?: Item[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("item_name", { ascending: true });

      if (error) {
        console.error("Error fetching items:", error);
        return { success: false, error: "Failed to fetch items" };
      }

      const items: Item[] = data.map(item => ({
        id: item.id,
        companyId: item.company_id,
        itemCode: item.item_code,
        itemName: item.item_name,
        description: item.description,
        categoryId: item.category_id,
        unitOfMeasure: item.unit_of_measure,
        itemType: item.item_type,
        isSellable: item.is_sellable,
        isPurchasable: item.is_purchasable,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, items };
    } catch (error) {
      console.error("Error fetching items:", error);
      return { success: false, error: "Failed to fetch items" };
    }
  }

  /**
   * Create a new warehouse
   */
  static async createWarehouse(
    input: CreateWarehouseInput,
  ): Promise<{ success: boolean; warehouse?: Warehouse; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .insert({
          company_id: input.companyId,
          warehouse_code: input.warehouseCode,
          warehouse_name: input.warehouseName,
          address: input.address,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating warehouse:", error);
        return { success: false, error: "Failed to create warehouse" };
      }

      const warehouse: Warehouse = {
        id: data.id,
        companyId: data.company_id,
        warehouseCode: data.warehouse_code,
        warehouseName: data.warehouse_name,
        address: data.address,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { success: true, warehouse };
    } catch (error) {
      console.error("Error creating warehouse:", error);
      return { success: false, error: "Failed to create warehouse" };
    }
  }

  /**
   * Get all warehouses for a company
   */
  static async getWarehouses(
    companyId: string,
  ): Promise<{ success: boolean; warehouses?: Warehouse[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .select("*")
        .eq("company_id", companyId)
        .eq("is_active", true)
        .order("warehouse_name", { ascending: true });

      if (error) {
        console.error("Error fetching warehouses:", error);
        return { success: false, error: "Failed to fetch warehouses" };
      }

      const warehouses: Warehouse[] = data.map(warehouse => ({
        id: warehouse.id,
        companyId: warehouse.company_id,
        warehouseCode: warehouse.warehouse_code,
        warehouseName: warehouse.warehouse_name,
        address: warehouse.address,
        isActive: warehouse.is_active,
        createdAt: warehouse.created_at,
        updatedAt: warehouse.updated_at,
      }));

      return { success: true, warehouses };
    } catch (error) {
      console.error("Error fetching warehouses:", error);
      return { success: false, error: "Failed to fetch warehouses" };
    }
  }

  /**
   * Get stock summary for items
   */
  static async getStockSummary(
    companyId: string,
    warehouseId?: string,
  ): Promise<{ success: boolean; stockSummary?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_item_stock_summary", {
        p_company_id: companyId,
        p_warehouse_id: warehouseId || null,
      });

      if (error) {
        console.error("Error fetching stock summary:", error);
        return { success: false, error: "Failed to fetch stock summary" };
      }

      return { success: true, stockSummary: data };
    } catch (error) {
      console.error("Error fetching stock summary:", error);
      return { success: false, error: "Failed to fetch stock summary" };
    }
  }

  /**
   * Get low stock items
   */
  static async getLowStockItems(
    companyId: string,
    warehouseId?: string,
  ): Promise<{ success: boolean; lowStockItems?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_low_stock_items", {
        p_company_id: companyId,
        p_warehouse_id: warehouseId || null,
      });

      if (error) {
        console.error("Error fetching low stock items:", error);
        return { success: false, error: "Failed to fetch low stock items" };
      }

      return { success: true, lowStockItems: data };
    } catch (error) {
      console.error("Error fetching low stock items:", error);
      return { success: false, error: "Failed to fetch low stock items" };
    }
  }

  /**
   * Create a stock transaction
   */
  static async createStockTransaction(
    input: CreateStockTransactionInput,
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("stock_transactions")
        .insert({
          company_id: input.companyId,
          item_id: input.itemId,
          warehouse_id: input.warehouseId,
          transaction_type: input.transactionType,
          transaction_date: input.transactionDate,
          quantity: input.quantity,
          unit_cost: input.unitCost,
          total_cost: input.totalCost,
          reference_type: input.referenceType,
          reference_id: input.referenceId,
          remarks: input.remarks,
          created_by: input.createdBy,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating stock transaction:", error);
        return { success: false, error: "Failed to create stock transaction" };
      }

      return { success: true, transactionId: data.id };
    } catch (error) {
      console.error("Error creating stock transaction:", error);
      return { success: false, error: "Failed to create stock transaction" };
    }
  }

  /**
   * Get stock transactions
   */
  static async getStockTransactions(
    companyId: string,
    itemId?: string,
    warehouseId?: string,
    fromDate?: string,
    toDate?: string,
  ): Promise<{ success: boolean; transactions?: StockTransaction[]; error?: string }> {
    try {
      let query = supabase
        .from("stock_transactions")
        .select("*")
        .eq("company_id", companyId)
        .order("transaction_date", { ascending: false });

      if (itemId) {
        query = query.eq("item_id", itemId);
      }
      if (warehouseId) {
        query = query.eq("warehouse_id", warehouseId);
      }
      if (fromDate) {
        query = query.gte("transaction_date", fromDate);
      }
      if (toDate) {
        query = query.lte("transaction_date", toDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching stock transactions:", error);
        return { success: false, error: "Failed to fetch stock transactions" };
      }

      const transactions: StockTransaction[] = data.map(transaction => ({
        id: transaction.id,
        companyId: transaction.company_id,
        itemId: transaction.item_id,
        warehouseId: transaction.warehouse_id,
        transactionType: transaction.transaction_type,
        transactionDate: transaction.transaction_date,
        quantity: transaction.quantity,
        unitCost: transaction.unit_cost,
        totalCost: transaction.total_cost,
        referenceType: transaction.reference_type,
        referenceId: transaction.reference_id,
        remarks: transaction.remarks,
        createdBy: transaction.created_by,
        createdAt: transaction.created_at,
      }));

      return { success: true, transactions };
    } catch (error) {
      console.error("Error fetching stock transactions:", error);
      return { success: false, error: "Failed to fetch stock transactions" };
    }
  }

  /**
   * Create item pricing
   */
  static async createItemPricing(
    itemId: string,
    priceType: PriceType,
    unitPrice: number,
    currency: string = "USD",
    effectiveDate?: string,
  ): Promise<{ success: boolean; pricingId?: string; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("item_pricing")
        .insert({
          item_id: itemId,
          price_type: priceType,
          currency: currency,
          unit_price: unitPrice,
          effective_date: effectiveDate || new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating item pricing:", error);
        return { success: false, error: "Failed to create item pricing" };
      }

      return { success: true, pricingId: data.id };
    } catch (error) {
      console.error("Error creating item pricing:", error);
      return { success: false, error: "Failed to create item pricing" };
    }
  }

  /**
   * Get item pricing
   */
  static async getItemPricing(
    itemId: string,
  ): Promise<{ success: boolean; pricing?: ItemPricing[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from("item_pricing")
        .select("*")
        .eq("item_id", itemId)
        .eq("is_active", true)
        .order("effective_date", { ascending: false });

      if (error) {
        console.error("Error fetching item pricing:", error);
        return { success: false, error: "Failed to fetch item pricing" };
      }

      const pricing: ItemPricing[] = data.map(item => ({
        id: item.id,
        itemId: item.item_id,
        priceType: item.price_type,
        currency: item.currency,
        unitPrice: item.unit_price,
        effectiveDate: item.effective_date,
        isActive: item.is_active,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, pricing };
    } catch (error) {
      console.error("Error fetching item pricing:", error);
      return { success: false, error: "Failed to fetch item pricing" };
    }
  }

  /**
   * Update item stock levels
   */
  static async updateStockLevels(
    itemId: string,
    warehouseId: string,
    reorderLevel: number,
    reorderQty: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("item_stock")
        .update({
          reorder_level: reorderLevel,
          reorder_qty: reorderQty,
        })
        .eq("item_id", itemId)
        .eq("warehouse_id", warehouseId);

      if (error) {
        console.error("Error updating stock levels:", error);
        return { success: false, error: "Failed to update stock levels" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating stock levels:", error);
      return { success: false, error: "Failed to update stock levels" };
    }
  }
}
