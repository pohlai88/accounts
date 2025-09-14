/**
 * Enhanced Inventory Management Service - ERPNext Level
 * Comprehensive stock tracking, valuation, and warehouse management
 */

import { supabase } from "./supabase";

// Enhanced interfaces for inventory management
export interface Item {
  id: string;
  itemCode: string;
  itemName: string;
  itemGroupId: string;
  companyId: string;
  description?: string;
  brand?: string;
  stockUom: string;
  purchaseUom?: string;
  salesUom?: string;
  itemType: "Stock Item" | "Non-Stock Item" | "Service" | "Fixed Asset";
  isStockItem: boolean;
  isSalesItem: boolean;
  isPurchaseItem: boolean;
  isServiceItem: boolean;
  isFixedAsset: boolean;
  maintainStock: boolean;
  includeItemInManufacturing: boolean;
  valuationMethod: "FIFO" | "LIFO" | "Moving Average";
  standardRate: number;
  openingStock: number;
  incomeAccount?: string;
  expenseAccount?: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  warehouseName: string;
  warehouseCode?: string;
  companyId: string;
  warehouseType: string;
  parentWarehouse?: string;
  isGroup: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  defaultInTransitWarehouse?: string;
  account?: string;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StockBalance {
  itemId: string;
  warehouseId: string;
  actualQty: number;
  reservedQty: number;
  orderedQty: number;
  plannedQty: number;
  stockValue: number;
  valuationRate: number;
}

export interface StockLedgerEntry {
  id: string;
  itemId: string;
  warehouseId: string;
  companyId: string;
  postingDate: string;
  postingTime: string;
  voucherType: string;
  voucherNo: string;
  voucherDetailNo?: string;
  actualQty: number;
  qtyAfterTransaction: number;
  incomingRate: number;
  outgoingRate: number;
  stockValue: number;
  stockValueDifference: number;
  batchNo?: string;
  serialNo?: string;
  projectId?: string;
  isCancelled: boolean;
  docstatus: number;
  createdAt: string;
  createdBy?: string;
}

export interface StockEntry {
  id: string;
  companyId: string;
  stockEntryType: string;
  namingSeries: string;
  title?: string;
  postingDate: string;
  postingTime: string;
  fromWarehouse?: string;
  toWarehouse?: string;
  totalOutgoingValue: number;
  totalIncomingValue: number;
  valueDifference: number;
  totalAdditionalCosts: number;
  purchaseReceipt?: string;
  deliveryNote?: string;
  salesInvoice?: string;
  purchaseInvoice?: string;
  docstatus: number;
  createdAt: string;
  createdBy?: string;
  modifiedAt?: string;
  modifiedBy?: string;
}

export interface StockEntryDetail {
  id: string;
  parent: string;
  itemId: string;
  qty: number;
  transferQty?: number;
  uom: string;
  stockUom: string;
  conversionFactor: number;
  sWarehouse?: string; // Source warehouse
  tWarehouse?: string; // Target warehouse
  basicRate: number;
  valuationRate: number;
  basicAmount: number;
  amount: number;
  batchNo?: string;
  serialNo?: string;
  expenseAccount?: string;
  costCenter?: string;
  projectId?: string;
}

export interface ItemPrice {
  id: string;
  itemId: string;
  priceList: string;
  uom?: string;
  priceListRate: number;
  currency: string;
  validFrom?: string;
  validUpto?: string;
  customer?: string;
  supplier?: string;
  createdAt: string;
}

export interface StockMovementResult {
  success: boolean;
  stockLedgerEntryId?: string;
  newBalance?: StockBalance;
  error?: string;
}

export class EnhancedInventoryManagementService {
  /**
   * Create item
   */
  static async createItem(itemData: Omit<Item, "id" | "createdAt" | "updatedAt">): Promise<{
    success: boolean;
    itemId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("items")
        .insert({
          item_code: itemData.itemCode,
          item_name: itemData.itemName,
          item_group_id: itemData.itemGroupId,
          company_id: itemData.companyId,
          description: itemData.description,
          brand: itemData.brand,
          stock_uom: itemData.stockUom,
          purchase_uom: itemData.purchaseUom,
          sales_uom: itemData.salesUom,
          item_type: itemData.itemType,
          is_stock_item: itemData.isStockItem,
          is_sales_item: itemData.isSalesItem,
          is_purchase_item: itemData.isPurchaseItem,
          is_service_item: itemData.isServiceItem,
          is_fixed_asset: itemData.isFixedAsset,
          maintain_stock: itemData.maintainStock,
          include_item_in_manufacturing: itemData.includeItemInManufacturing,
          valuation_method: itemData.valuationMethod,
          standard_rate: itemData.standardRate,
          opening_stock: itemData.openingStock,
          income_account: itemData.incomeAccount,
          expense_account: itemData.expenseAccount,
          disabled: itemData.disabled,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, itemId: data.id };
    } catch (error) {
      return { success: false, error: `Failed to create item: ${error}` };
    }
  }

  /**
   * Create warehouse
   */
  static async createWarehouse(
    warehouseData: Omit<Warehouse, "id" | "createdAt" | "updatedAt">,
  ): Promise<{
    success: boolean;
    warehouseId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("warehouses")
        .insert({
          warehouse_name: warehouseData.warehouseName,
          warehouse_code: warehouseData.warehouseCode,
          company_id: warehouseData.companyId,
          warehouse_type: warehouseData.warehouseType,
          parent_warehouse: warehouseData.parentWarehouse,
          is_group: warehouseData.isGroup,
          address_line_1: warehouseData.addressLine1,
          address_line_2: warehouseData.addressLine2,
          city: warehouseData.city,
          state: warehouseData.state,
          country: warehouseData.country,
          pincode: warehouseData.pincode,
          default_in_transit_warehouse: warehouseData.defaultInTransitWarehouse,
          account: warehouseData.account,
          disabled: warehouseData.disabled,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, warehouseId: data.id };
    } catch (error) {
      return { success: false, error: `Failed to create warehouse: ${error}` };
    }
  }

  /**
   * Create stock entry
   */
  static async createStockEntry(
    stockEntryData: Omit<StockEntry, "id" | "createdAt" | "modifiedAt">,
    details: Omit<StockEntryDetail, "id" | "parent">[],
  ): Promise<{ success: boolean; stockEntryId?: string; error?: string }> {
    try {
      // Create stock entry
      const { data: stockEntry, error: stockEntryError } = await supabase
        .from("stock_entries")
        .insert({
          company_id: stockEntryData.companyId,
          stock_entry_type: stockEntryData.stockEntryType,
          naming_series: stockEntryData.namingSeries,
          title: stockEntryData.title,
          posting_date: stockEntryData.postingDate,
          posting_time: stockEntryData.postingTime,
          from_warehouse: stockEntryData.fromWarehouse,
          to_warehouse: stockEntryData.toWarehouse,
          total_outgoing_value: stockEntryData.totalOutgoingValue,
          total_incoming_value: stockEntryData.totalIncomingValue,
          value_difference: stockEntryData.valueDifference,
          total_additional_costs: stockEntryData.totalAdditionalCosts,
          purchase_receipt: stockEntryData.purchaseReceipt,
          delivery_note: stockEntryData.deliveryNote,
          sales_invoice: stockEntryData.salesInvoice,
          purchase_invoice: stockEntryData.purchaseInvoice,
          docstatus: stockEntryData.docstatus,
          created_by: stockEntryData.createdBy,
        })
        .select("id")
        .single();

      if (stockEntryError) {
        return { success: false, error: stockEntryError.message };
      }

      // Create stock entry details
      const stockEntryDetails = details.map(detail => ({
        parent: stockEntry.id,
        item_id: detail.itemId,
        qty: detail.qty,
        transfer_qty: detail.transferQty,
        uom: detail.uom,
        stock_uom: detail.stockUom,
        conversion_factor: detail.conversionFactor,
        s_warehouse: detail.sWarehouse,
        t_warehouse: detail.tWarehouse,
        basic_rate: detail.basicRate,
        valuation_rate: detail.valuationRate,
        basic_amount: detail.basicAmount,
        amount: detail.amount,
        batch_no: detail.batchNo,
        serial_no: detail.serialNo,
        expense_account: detail.expenseAccount,
        cost_center: detail.costCenter,
        project_id: detail.projectId,
      }));

      const { error: detailsError } = await supabase
        .from("stock_entry_details")
        .insert(stockEntryDetails);

      if (detailsError) {
        return { success: false, error: detailsError.message };
      }

      return { success: true, stockEntryId: stockEntry.id };
    } catch (error) {
      return { success: false, error: `Failed to create stock entry: ${error}` };
    }
  }

  /**
   * Submit stock entry (create stock ledger entries)
   */
  static async submitStockEntry(
    stockEntryId: string,
    submittedBy?: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get stock entry details
      const { data: stockEntry, error: stockEntryError } = await supabase
        .from("stock_entries")
        .select("*")
        .eq("id", stockEntryId)
        .single();

      if (stockEntryError || !stockEntry) {
        return { success: false, error: "Stock entry not found" };
      }

      const { data: details, error: detailsError } = await supabase
        .from("stock_entry_details")
        .select("*")
        .eq("parent", stockEntryId);

      if (detailsError) {
        return { success: false, error: detailsError.message };
      }

      // Create stock ledger entries for each detail
      const stockLedgerEntries = [];
      for (const detail of details) {
        // Outgoing entry (from source warehouse)
        if (detail.s_warehouse) {
          stockLedgerEntries.push({
            item_id: detail.item_id,
            warehouse_id: detail.s_warehouse,
            company_id: stockEntry.company_id,
            posting_date: stockEntry.posting_date,
            posting_time: stockEntry.posting_time,
            voucher_type: "Stock Entry",
            voucher_no: stockEntry.naming_series + stockEntry.id.slice(-6),
            voucher_detail_no: detail.id,
            actual_qty: -detail.qty,
            outgoing_rate: detail.valuation_rate,
            stock_value_difference: -detail.amount,
            batch_no: detail.batch_no,
            serial_no: detail.serial_no,
            project_id: detail.project_id,
            docstatus: 1,
            created_by: submittedBy,
          });
        }

        // Incoming entry (to target warehouse)
        if (detail.t_warehouse) {
          stockLedgerEntries.push({
            item_id: detail.item_id,
            warehouse_id: detail.t_warehouse,
            company_id: stockEntry.company_id,
            posting_date: stockEntry.posting_date,
            posting_time: stockEntry.posting_time,
            voucher_type: "Stock Entry",
            voucher_no: stockEntry.naming_series + stockEntry.id.slice(-6),
            voucher_detail_no: detail.id,
            actual_qty: detail.qty,
            incoming_rate: detail.valuation_rate,
            stock_value_difference: detail.amount,
            batch_no: detail.batch_no,
            serial_no: detail.serial_no,
            project_id: detail.project_id,
            docstatus: 1,
            created_by: submittedBy,
          });
        }
      }

      // Insert stock ledger entries
      if (stockLedgerEntries.length > 0) {
        const { error: sleError } = await supabase
          .from("stock_ledger_entries")
          .insert(stockLedgerEntries);

        if (sleError) {
          return { success: false, error: sleError.message };
        }
      }

      // Update stock entry status
      const { error: updateError } = await supabase
        .from("stock_entries")
        .update({
          docstatus: 1,
          modified_at: new Date().toISOString(),
          modified_by: submittedBy,
        })
        .eq("id", stockEntryId);

      if (updateError) {
        return { success: false, error: updateError.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: `Failed to submit stock entry: ${error}` };
    }
  }

  /**
   * Get stock balance
   */
  static async getStockBalance(
    itemId: string,
    warehouseId: string,
    asOfDate?: string,
  ): Promise<{ success: boolean; data?: StockBalance; error?: string }> {
    try {
      const { data, error } = await supabase.rpc("get_stock_balance", {
        p_item_id: itemId,
        p_warehouse_id: warehouseId,
        p_as_of_date: asOfDate || new Date().toISOString().slice(0, 10),
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const result = data[0];
      const stockBalance: StockBalance = {
        itemId,
        warehouseId,
        actualQty: result.actual_qty,
        reservedQty: 0, // Would need additional logic
        orderedQty: 0, // Would need additional logic
        plannedQty: 0, // Would need additional logic
        stockValue: result.stock_value,
        valuationRate: result.valuation_rate,
      };

      return { success: true, data: stockBalance };
    } catch (error) {
      return { success: false, error: `Failed to get stock balance: ${error}` };
    }
  }

  /**
   * Get stock ledger entries
   */
  static async getStockLedgerEntries(
    companyId: string,
    filters?: {
      itemId?: string;
      warehouseId?: string;
      voucherType?: string;
      voucherNo?: string;
      fromDate?: string;
      toDate?: string;
    },
  ): Promise<{ success: boolean; data?: StockLedgerEntry[]; error?: string }> {
    try {
      let query = supabase
        .from("stock_ledger_entries")
        .select("*")
        .eq("company_id", companyId)
        .eq("docstatus", 1)
        .eq("is_cancelled", false);

      if (filters?.itemId) {
        query = query.eq("item_id", filters.itemId);
      }

      if (filters?.warehouseId) {
        query = query.eq("warehouse_id", filters.warehouseId);
      }

      if (filters?.voucherType) {
        query = query.eq("voucher_type", filters.voucherType);
      }

      if (filters?.voucherNo) {
        query = query.eq("voucher_no", filters.voucherNo);
      }

      if (filters?.fromDate) {
        query = query.gte("posting_date", filters.fromDate);
      }

      if (filters?.toDate) {
        query = query.lte("posting_date", filters.toDate);
      }

      const { data, error } = await query.order("posting_date", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const entries: StockLedgerEntry[] = data.map(item => ({
        id: item.id,
        itemId: item.item_id,
        warehouseId: item.warehouse_id,
        companyId: item.company_id,
        postingDate: item.posting_date,
        postingTime: item.posting_time,
        voucherType: item.voucher_type,
        voucherNo: item.voucher_no,
        voucherDetailNo: item.voucher_detail_no,
        actualQty: item.actual_qty,
        qtyAfterTransaction: item.qty_after_transaction,
        incomingRate: item.incoming_rate,
        outgoingRate: item.outgoing_rate,
        stockValue: item.stock_value,
        stockValueDifference: item.stock_value_difference,
        batchNo: item.batch_no,
        serialNo: item.serial_no,
        projectId: item.project_id,
        isCancelled: item.is_cancelled,
        docstatus: item.docstatus,
        createdAt: item.created_at,
        createdBy: item.created_by,
      }));

      return { success: true, data: entries };
    } catch (error) {
      return { success: false, error: `Failed to get stock ledger entries: ${error}` };
    }
  }

  /**
   * Get items
   */
  static async getItems(
    companyId: string,
    filters?: {
      itemGroupId?: string;
      itemType?: string;
      disabled?: boolean;
    },
  ): Promise<{ success: boolean; data?: Item[]; error?: string }> {
    try {
      let query = supabase.from("items").select("*").eq("company_id", companyId);

      if (filters?.itemGroupId) {
        query = query.eq("item_group_id", filters.itemGroupId);
      }

      if (filters?.itemType) {
        query = query.eq("item_type", filters.itemType);
      }

      if (filters?.disabled !== undefined) {
        query = query.eq("disabled", filters.disabled);
      }

      const { data, error } = await query.order("item_name");

      if (error) {
        return { success: false, error: error.message };
      }

      const items: Item[] = data.map(item => ({
        id: item.id,
        itemCode: item.item_code,
        itemName: item.item_name,
        itemGroupId: item.item_group_id,
        companyId: item.company_id,
        description: item.description,
        brand: item.brand,
        stockUom: item.stock_uom,
        purchaseUom: item.purchase_uom,
        salesUom: item.sales_uom,
        itemType: item.item_type,
        isStockItem: item.is_stock_item,
        isSalesItem: item.is_sales_item,
        isPurchaseItem: item.is_purchase_item,
        isServiceItem: item.is_service_item,
        isFixedAsset: item.is_fixed_asset,
        maintainStock: item.maintain_stock,
        includeItemInManufacturing: item.include_item_in_manufacturing,
        valuationMethod: item.valuation_method,
        standardRate: item.standard_rate,
        openingStock: item.opening_stock,
        incomeAccount: item.income_account,
        expenseAccount: item.expense_account,
        disabled: item.disabled,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, data: items };
    } catch (error) {
      return { success: false, error: `Failed to get items: ${error}` };
    }
  }

  /**
   * Get warehouses
   */
  static async getWarehouses(
    companyId: string,
    includeDisabled: boolean = false,
  ): Promise<{ success: boolean; data?: Warehouse[]; error?: string }> {
    try {
      let query = supabase.from("warehouses").select("*").eq("company_id", companyId);

      if (!includeDisabled) {
        query = query.eq("disabled", false);
      }

      const { data, error } = await query.order("warehouse_name");

      if (error) {
        return { success: false, error: error.message };
      }

      const warehouses: Warehouse[] = data.map(item => ({
        id: item.id,
        warehouseName: item.warehouse_name,
        warehouseCode: item.warehouse_code,
        companyId: item.company_id,
        warehouseType: item.warehouse_type,
        parentWarehouse: item.parent_warehouse,
        isGroup: item.is_group,
        addressLine1: item.address_line_1,
        addressLine2: item.address_line_2,
        city: item.city,
        state: item.state,
        country: item.country,
        pincode: item.pincode,
        defaultInTransitWarehouse: item.default_in_transit_warehouse,
        account: item.account,
        disabled: item.disabled,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }));

      return { success: true, data: warehouses };
    } catch (error) {
      return { success: false, error: `Failed to get warehouses: ${error}` };
    }
  }

  /**
   * Get stock summary report
   */
  static async getStockSummaryReport(
    companyId: string,
    warehouseId?: string,
    itemGroupId?: string,
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // This would be a complex query joining items, warehouses, and bins
      // For now, return a simplified version
      let query = supabase
        .from("bins")
        .select(
          `
                    *,
                    items!inner(item_code, item_name, item_group_id),
                    warehouses!inner(warehouse_name)
                `,
        )
        .gt("actual_qty", 0);

      if (warehouseId) {
        query = query.eq("warehouse_id", warehouseId);
      }

      if (itemGroupId) {
        query = query.eq("items.item_group_id", itemGroupId);
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return { success: false, error: `Failed to get stock summary report: ${error}` };
    }
  }

  /**
   * Create item price
   */
  static async createItemPrice(priceData: Omit<ItemPrice, "id" | "createdAt">): Promise<{
    success: boolean;
    priceId?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from("item_prices")
        .insert({
          item_id: priceData.itemId,
          price_list: priceData.priceList,
          uom: priceData.uom,
          price_list_rate: priceData.priceListRate,
          currency: priceData.currency,
          valid_from: priceData.validFrom,
          valid_upto: priceData.validUpto,
          customer: priceData.customer,
          supplier: priceData.supplier,
        })
        .select("id")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, priceId: data.id };
    } catch (error) {
      return { success: false, error: `Failed to create item price: ${error}` };
    }
  }

  /**
   * Get item prices
   */
  static async getItemPrices(
    itemId: string,
    priceList?: string,
    asOfDate?: string,
  ): Promise<{ success: boolean; data?: ItemPrice[]; error?: string }> {
    try {
      let query = supabase.from("item_prices").select("*").eq("item_id", itemId);

      if (priceList) {
        query = query.eq("price_list", priceList);
      }

      if (asOfDate) {
        query = query
          .or(`valid_from.is.null,valid_from.lte.${asOfDate}`)
          .or(`valid_upto.is.null,valid_upto.gte.${asOfDate}`);
      }

      const { data, error } = await query.order("valid_from", { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      const prices: ItemPrice[] = data.map(item => ({
        id: item.id,
        itemId: item.item_id,
        priceList: item.price_list,
        uom: item.uom,
        priceListRate: item.price_list_rate,
        currency: item.currency,
        validFrom: item.valid_from,
        validUpto: item.valid_upto,
        customer: item.customer,
        supplier: item.supplier,
        createdAt: item.created_at,
      }));

      return { success: true, data: prices };
    } catch (error) {
      return { success: false, error: `Failed to get item prices: ${error}` };
    }
  }
}

export default EnhancedInventoryManagementService;
