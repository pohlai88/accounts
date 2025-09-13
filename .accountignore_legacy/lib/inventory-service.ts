/**
 * Inventory Management Service
 * Complete inventory system with cost tracking and valuation
 * Based on ERPNext, Xero, QuickBooks, and Oracle best practices
 */

import { supabase } from './supabase'

export interface ItemGroup {
    id: string
    group_name: string
    parent_group_id?: string
    description?: string
    company_id: string
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

export interface UnitOfMeasure {
    id: string
    unit_name: string
    unit_symbol: string
    unit_type: 'Weight' | 'Volume' | 'Length' | 'Area' | 'Count' | 'Time' | 'Other'
    base_unit_id?: string
    conversion_factor: number
    company_id: string
    is_active: boolean
    is_base_unit: boolean
    created_at: string
    updated_at: string
}

export interface Item {
    id: string
    item_code: string
    item_name: string
    description?: string
    item_group_id: string
    company_id: string
    item_type: 'Stock' | 'Non-Stock' | 'Service' | 'Fixed Asset'
    is_stock_item: boolean
    is_sales_item: boolean
    is_purchase_item: boolean
    is_manufactured: boolean
    stock_uom_id: string
    purchase_uom_id?: string
    sales_uom_id?: string
    standard_rate: number
    last_purchase_rate: number
    last_sales_rate: number
    maintain_stock: boolean
    include_item_in_manufacturing: boolean
    is_fixed_asset: boolean
    auto_create_assets: boolean
    reorder_level: number
    reorder_qty: number
    min_order_qty: number
    max_order_qty?: number
    weight_per_unit: number
    weight_uom_id?: string
    income_account_id?: string
    expense_account_id?: string
    cost_center_id?: string
    is_active: boolean
    disabled: boolean
    created_at: string
    updated_at: string
}

export interface Warehouse {
    id: string
    warehouse_name: string
    warehouse_code: string
    warehouse_type: 'Stock' | 'Transit' | 'Fixed Asset' | 'Sample' | 'Rejected'
    parent_warehouse_id?: string
    company_id: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    phone?: string
    email?: string
    is_group: boolean
    is_active: boolean
    account_id?: string
    created_at: string
    updated_at: string
}

export interface StockEntry {
    id: string
    entry_no: string
    entry_type: 'Material Issue' | 'Material Receipt' | 'Material Transfer' | 'Manufacture' | 'Repack' | 'Send to Subcontractor' | 'Stock Reconciliation'
    company_id: string
    posting_date: string
    posting_time: string
    set_posting_time: boolean
    from_warehouse_id?: string
    to_warehouse_id?: string
    purchase_order_id?: string
    sales_order_id?: string
    delivery_note_id?: string
    purchase_receipt_id?: string
    total_outgoing_value: number
    total_incoming_value: number
    value_difference: number
    total_additional_costs: number
    docstatus: number
    is_opening: boolean
    is_return: boolean
    remarks?: string
    created_at: string
    updated_at: string
}

export interface StockEntryDetail {
    id: string
    stock_entry_id: string
    item_id: string
    s_warehouse_id?: string
    t_warehouse_id?: string
    qty: number
    transfer_qty?: number
    uom_id: string
    stock_uom_id: string
    conversion_factor: number
    basic_rate: number
    basic_amount: number
    additional_cost: number
    valuation_rate: number
    amount: number
    serial_no?: string
    batch_no?: string
    description?: string
    expense_account_id?: string
    cost_center_id?: string
    created_at: string
    updated_at: string
}

export interface StockLedgerEntry {
    id: string
    item_id: string
    warehouse_id: string
    company_id: string
    posting_date: string
    posting_time: string
    voucher_type: string
    voucher_no: string
    voucher_detail_no?: string
    actual_qty: number
    qty_after_transaction: number
    incoming_rate: number
    outgoing_rate: number
    stock_value: number
    stock_value_difference: number
    valuation_rate: number
    serial_no?: string
    batch_no?: string
    project_id?: string
    cost_center_id?: string
    is_cancelled: boolean
    created_at: string
}

export interface Bin {
    id: string
    item_id: string
    warehouse_id: string
    company_id: string
    actual_qty: number
    planned_qty: number
    indented_qty: number
    ordered_qty: number
    reserved_qty: number
    reserved_qty_for_production: number
    reserved_qty_for_sub_contract: number
    projected_qty: number
    stock_value: number
    valuation_rate: number
    modified: string
}

export interface StockBalance {
    item_id: string
    warehouse_id: string
    actual_qty: number
    stock_value: number
    valuation_rate: number
}

export interface CreateItemGroupInput {
    group_name: string
    parent_group_id?: string
    description?: string
    company_id: string
    sort_order?: number
}

export interface CreateUnitOfMeasureInput {
    unit_name: string
    unit_symbol: string
    unit_type: 'Weight' | 'Volume' | 'Length' | 'Area' | 'Count' | 'Time' | 'Other'
    base_unit_id?: string
    conversion_factor?: number
    company_id: string
    is_base_unit?: boolean
}

export interface CreateItemInput {
    item_code: string
    item_name: string
    description?: string
    item_group_id: string
    company_id: string
    item_type?: 'Stock' | 'Non-Stock' | 'Service' | 'Fixed Asset'
    is_stock_item?: boolean
    is_sales_item?: boolean
    is_purchase_item?: boolean
    is_manufactured?: boolean
    stock_uom_id: string
    purchase_uom_id?: string
    sales_uom_id?: string
    standard_rate?: number
    maintain_stock?: boolean
    reorder_level?: number
    reorder_qty?: number
    min_order_qty?: number
    max_order_qty?: number
    weight_per_unit?: number
    weight_uom_id?: string
    income_account_id?: string
    expense_account_id?: string
    cost_center_id?: string
}

export interface CreateWarehouseInput {
    warehouse_name: string
    warehouse_code: string
    warehouse_type?: 'Stock' | 'Transit' | 'Fixed Asset' | 'Sample' | 'Rejected'
    parent_warehouse_id?: string
    company_id: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    phone?: string
    email?: string
    is_group?: boolean
    account_id?: string
}

export interface CreateStockEntryInput {
    entry_type: 'Material Issue' | 'Material Receipt' | 'Material Transfer' | 'Manufacture' | 'Repack' | 'Send to Subcontractor' | 'Stock Reconciliation'
    company_id: string
    posting_date: string
    posting_time?: string
    set_posting_time?: boolean
    from_warehouse_id?: string
    to_warehouse_id?: string
    remarks?: string
    items: Array<{
        item_id: string
        s_warehouse_id?: string
        t_warehouse_id?: string
        qty: number
        uom_id: string
        basic_rate?: number
        serial_no?: string
        batch_no?: string
        description?: string
    }>
}

export interface ApiResponse<T> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

/**
 * Inventory Management Service
 */
export class InventoryService {
    /**
     * Create item group
     */
    static async createItemGroup(input: CreateItemGroupInput): Promise<ApiResponse<ItemGroup>> {
        try {
            const { data: itemGroup, error } = await supabase
                .from('item_groups')
                .insert([{
                    group_name: input.group_name.trim(),
                    parent_group_id: input.parent_group_id,
                    description: input.description,
                    company_id: input.company_id,
                    sort_order: input.sort_order || 0
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: itemGroup, message: 'Item group created successfully' }
        } catch (error) {
            console.error('Error creating item group:', error)
            return { success: false, error: 'Failed to create item group' }
        }
    }

    /**
     * Get item groups
     */
    static async getItemGroups(companyId: string): Promise<ApiResponse<ItemGroup[]>> {
        try {
            const { data: itemGroups, error } = await supabase
                .from('item_groups')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('sort_order')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: itemGroups }
        } catch (error) {
            console.error('Error fetching item groups:', error)
            return { success: false, error: 'Failed to fetch item groups' }
        }
    }

    /**
     * Create unit of measure
     */
    static async createUnitOfMeasure(input: CreateUnitOfMeasureInput): Promise<ApiResponse<UnitOfMeasure>> {
        try {
            const { data: uom, error } = await supabase
                .from('units_of_measure')
                .insert([{
                    unit_name: input.unit_name.trim(),
                    unit_symbol: input.unit_symbol.trim(),
                    unit_type: input.unit_type,
                    base_unit_id: input.base_unit_id,
                    conversion_factor: input.conversion_factor || 1,
                    company_id: input.company_id,
                    is_base_unit: input.is_base_unit || false
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: uom, message: 'Unit of measure created successfully' }
        } catch (error) {
            console.error('Error creating unit of measure:', error)
            return { success: false, error: 'Failed to create unit of measure' }
        }
    }

    /**
     * Get units of measure
     */
    static async getUnitsOfMeasure(companyId: string): Promise<ApiResponse<UnitOfMeasure[]>> {
        try {
            const { data: uoms, error } = await supabase
                .from('units_of_measure')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('unit_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: uoms }
        } catch (error) {
            console.error('Error fetching units of measure:', error)
            return { success: false, error: 'Failed to fetch units of measure' }
        }
    }

    /**
     * Create item
     */
    static async createItem(input: CreateItemInput): Promise<ApiResponse<Item>> {
        try {
            const { data: item, error } = await supabase
                .from('items')
                .insert([{
                    item_code: input.item_code.trim(),
                    item_name: input.item_name.trim(),
                    description: input.description,
                    item_group_id: input.item_group_id,
                    company_id: input.company_id,
                    item_type: input.item_type || 'Stock',
                    is_stock_item: input.is_stock_item !== false,
                    is_sales_item: input.is_sales_item !== false,
                    is_purchase_item: input.is_purchase_item !== false,
                    is_manufactured: input.is_manufactured || false,
                    stock_uom_id: input.stock_uom_id,
                    purchase_uom_id: input.purchase_uom_id,
                    sales_uom_id: input.sales_uom_id,
                    standard_rate: input.standard_rate || 0,
                    maintain_stock: input.maintain_stock !== false,
                    reorder_level: input.reorder_level || 0,
                    reorder_qty: input.reorder_qty || 0,
                    min_order_qty: input.min_order_qty || 1,
                    max_order_qty: input.max_order_qty,
                    weight_per_unit: input.weight_per_unit || 0,
                    weight_uom_id: input.weight_uom_id,
                    income_account_id: input.income_account_id,
                    expense_account_id: input.expense_account_id,
                    cost_center_id: input.cost_center_id
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: item, message: 'Item created successfully' }
        } catch (error) {
            console.error('Error creating item:', error)
            return { success: false, error: 'Failed to create item' }
        }
    }

    /**
     * Get items
     */
    static async getItems(
        companyId: string,
        itemType?: string,
        itemGroupId?: string,
        isStockItem?: boolean
    ): Promise<ApiResponse<Item[]>> {
        try {
            let query = supabase
                .from('items')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)

            if (itemType) {
                query = query.eq('item_type', itemType)
            }

            if (itemGroupId) {
                query = query.eq('item_group_id', itemGroupId)
            }

            if (isStockItem !== undefined) {
                query = query.eq('is_stock_item', isStockItem)
            }

            const { data: items, error } = await query.order('item_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: items }
        } catch (error) {
            console.error('Error fetching items:', error)
            return { success: false, error: 'Failed to fetch items' }
        }
    }

    /**
     * Create warehouse
     */
    static async createWarehouse(input: CreateWarehouseInput): Promise<ApiResponse<Warehouse>> {
        try {
            const { data: warehouse, error } = await supabase
                .from('warehouses')
                .insert([{
                    warehouse_name: input.warehouse_name.trim(),
                    warehouse_code: input.warehouse_code.trim(),
                    warehouse_type: input.warehouse_type || 'Stock',
                    parent_warehouse_id: input.parent_warehouse_id,
                    company_id: input.company_id,
                    address_line1: input.address_line1,
                    address_line2: input.address_line2,
                    city: input.city,
                    state: input.state,
                    postal_code: input.postal_code,
                    country: input.country,
                    phone: input.phone,
                    email: input.email,
                    is_group: input.is_group || false,
                    account_id: input.account_id
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: warehouse, message: 'Warehouse created successfully' }
        } catch (error) {
            console.error('Error creating warehouse:', error)
            return { success: false, error: 'Failed to create warehouse' }
        }
    }

    /**
     * Get warehouses
     */
    static async getWarehouses(companyId: string): Promise<ApiResponse<Warehouse[]>> {
        try {
            const { data: warehouses, error } = await supabase
                .from('warehouses')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('warehouse_name')

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: warehouses }
        } catch (error) {
            console.error('Error fetching warehouses:', error)
            return { success: false, error: 'Failed to fetch warehouses' }
        }
    }

    /**
     * Create stock entry
     */
    static async createStockEntry(input: CreateStockEntryInput): Promise<ApiResponse<StockEntry>> {
        try {
            // Generate entry number
            const entryNo = await this.generateStockEntryNumber(input.company_id, input.entry_type)

            const { data: stockEntry, error } = await supabase
                .from('stock_entries')
                .insert([{
                    entry_no: entryNo,
                    entry_type: input.entry_type,
                    company_id: input.company_id,
                    posting_date: input.posting_date,
                    posting_time: input.posting_time || new Date().toTimeString().slice(0, 8),
                    set_posting_time: input.set_posting_time || false,
                    from_warehouse_id: input.from_warehouse_id,
                    to_warehouse_id: input.to_warehouse_id,
                    remarks: input.remarks
                }])
                .select()
                .single()

            if (error) {
                return { success: false, error: error.message }
            }

            // Create stock entry details
            const stockEntryDetails = input.items.map(item => ({
                stock_entry_id: stockEntry.id,
                item_id: item.item_id,
                s_warehouse_id: item.s_warehouse_id,
                t_warehouse_id: item.t_warehouse_id,
                qty: item.qty,
                uom_id: item.uom_id,
                stock_uom_id: item.uom_id, // Assuming same for simplicity
                conversion_factor: 1,
                basic_rate: item.basic_rate || 0,
                basic_amount: item.qty * (item.basic_rate || 0),
                valuation_rate: item.basic_rate || 0,
                amount: item.qty * (item.basic_rate || 0),
                serial_no: item.serial_no,
                batch_no: item.batch_no,
                description: item.description
            }))

            const { error: detailsError } = await supabase
                .from('stock_entry_details')
                .insert(stockEntryDetails)

            if (detailsError) {
                return { success: false, error: detailsError.message }
            }

            return { success: true, data: stockEntry, message: 'Stock entry created successfully' }
        } catch (error) {
            console.error('Error creating stock entry:', error)
            return { success: false, error: 'Failed to create stock entry' }
        }
    }

    /**
     * Get stock entries
     */
    static async getStockEntries(
        companyId: string,
        entryType?: string,
        docstatus?: number
    ): Promise<ApiResponse<StockEntry[]>> {
        try {
            let query = supabase
                .from('stock_entries')
                .select('*')
                .eq('company_id', companyId)

            if (entryType) {
                query = query.eq('entry_type', entryType)
            }

            if (docstatus !== undefined) {
                query = query.eq('docstatus', docstatus)
            }

            const { data: stockEntries, error } = await query.order('posting_date', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: stockEntries }
        } catch (error) {
            console.error('Error fetching stock entries:', error)
            return { success: false, error: 'Failed to fetch stock entries' }
        }
    }

    /**
     * Get stock balance
     */
    static async getStockBalance(
        itemId: string,
        warehouseId?: string,
        postingDate?: string
    ): Promise<ApiResponse<StockBalance[]>> {
        try {
            const { data: stockBalance, error } = await supabase.rpc('get_stock_balance', {
                p_item_id: itemId,
                p_warehouse_id: warehouseId,
                p_posting_date: postingDate || new Date().toISOString().split('T')[0]
            })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: stockBalance }
        } catch (error) {
            console.error('Error fetching stock balance:', error)
            return { success: false, error: 'Failed to fetch stock balance' }
        }
    }

    /**
     * Get stock ledger entries
     */
    static async getStockLedgerEntries(
        companyId: string,
        itemId?: string,
        warehouseId?: string,
        fromDate?: string,
        toDate?: string
    ): Promise<ApiResponse<StockLedgerEntry[]>> {
        try {
            let query = supabase
                .from('stock_ledger_entries')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_cancelled', false)

            if (itemId) {
                query = query.eq('item_id', itemId)
            }

            if (warehouseId) {
                query = query.eq('warehouse_id', warehouseId)
            }

            if (fromDate) {
                query = query.gte('posting_date', fromDate)
            }

            if (toDate) {
                query = query.lte('posting_date', toDate)
            }

            const { data: entries, error } = await query.order('posting_date', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: entries }
        } catch (error) {
            console.error('Error fetching stock ledger entries:', error)
            return { success: false, error: 'Failed to fetch stock ledger entries' }
        }
    }

    /**
     * Get bins (current stock)
     */
    static async getBins(
        companyId: string,
        itemId?: string,
        warehouseId?: string
    ): Promise<ApiResponse<Bin[]>> {
        try {
            let query = supabase
                .from('bins')
                .select('*')
                .eq('company_id', companyId)

            if (itemId) {
                query = query.eq('item_id', itemId)
            }

            if (warehouseId) {
                query = query.eq('warehouse_id', warehouseId)
            }

            const { data: bins, error } = await query.order('modified', { ascending: false })

            if (error) {
                return { success: false, error: error.message }
            }

            return { success: true, data: bins }
        } catch (error) {
            console.error('Error fetching bins:', error)
            return { success: false, error: 'Failed to fetch bins' }
        }
    }

    /**
     * Submit stock entry
     */
    static async submitStockEntry(stockEntryId: string): Promise<ApiResponse<boolean>> {
        try {
            // Get stock entry details
            const { data: stockEntry, error: entryError } = await supabase
                .from('stock_entries')
                .select('*, stock_entry_details(*)')
                .eq('id', stockEntryId)
                .single()

            if (entryError || !stockEntry) {
                return { success: false, error: 'Stock entry not found' }
            }

            // Update stock entry status
            const { error: updateError } = await supabase
                .from('stock_entries')
                .update({ docstatus: 1 })
                .eq('id', stockEntryId)

            if (updateError) {
                return { success: false, error: updateError.message }
            }

            // Create stock ledger entries for each item
            for (const detail of stockEntry.stock_entry_details) {
                if (detail.s_warehouse_id) {
                    // Outgoing entry
                    await supabase.rpc('create_stock_ledger_entry', {
                        p_item_id: detail.item_id,
                        p_warehouse_id: detail.s_warehouse_id,
                        p_posting_date: stockEntry.posting_date,
                        p_voucher_type: 'Stock Entry',
                        p_voucher_no: stockEntry.entry_no,
                        p_actual_qty: -detail.qty,
                        p_outgoing_rate: detail.valuation_rate
                    })
                }

                if (detail.t_warehouse_id) {
                    // Incoming entry
                    await supabase.rpc('create_stock_ledger_entry', {
                        p_item_id: detail.item_id,
                        p_warehouse_id: detail.t_warehouse_id,
                        p_posting_date: stockEntry.posting_date,
                        p_voucher_type: 'Stock Entry',
                        p_voucher_no: stockEntry.entry_no,
                        p_actual_qty: detail.qty,
                        p_incoming_rate: detail.valuation_rate
                    })
                }
            }

            return { success: true, data: true, message: 'Stock entry submitted successfully' }
        } catch (error) {
            console.error('Error submitting stock entry:', error)
            return { success: false, error: 'Failed to submit stock entry' }
        }
    }

    /**
     * Generate stock entry number
     */
    private static async generateStockEntryNumber(
        companyId: string,
        entryType: string
    ): Promise<string> {
        const prefix = entryType.split(' ').map(word => word.charAt(0)).join('')
        const year = new Date().getFullYear()

        // Get the next sequence number
        const { data: entries, error } = await supabase
            .from('stock_entries')
            .select('entry_no')
            .eq('company_id', companyId)
            .like('entry_no', `${prefix}-${year}%`)
            .order('created_at', { ascending: false })
            .limit(1)

        let nextNumber = 1
        if (!error && entries && entries.length > 0) {
            const lastNumber = entries[0].entry_no.split('-').pop()
            nextNumber = parseInt(lastNumber || '0') + 1
        }

        return `${prefix}-${year}-${nextNumber.toString().padStart(5, '0')}`
    }

    /**
     * Get inventory statistics
     */
    static async getInventoryStats(companyId: string): Promise<ApiResponse<{
        total_items: number
        total_warehouses: number
        total_stock_value: number
        low_stock_items: number
        stock_movements_today: number
    }>> {
        try {
            // Get total items
            const { data: itemsCount } = await supabase
                .from('items')
                .select('id', { count: 'exact' })
                .eq('company_id', companyId)
                .eq('is_active', true)

            // Get total warehouses
            const { data: warehousesCount } = await supabase
                .from('warehouses')
                .select('id', { count: 'exact' })
                .eq('company_id', companyId)
                .eq('is_active', true)

            // Get total stock value
            const { data: stockValue } = await supabase
                .from('bins')
                .select('stock_value')
                .eq('company_id', companyId)

            // Get low stock items (where actual_qty <= reorder_level)
            const { data: lowStockItems } = await supabase
                .from('bins')
                .select('item_id, items!inner(reorder_level)')
                .eq('company_id', companyId)
                .filter('actual_qty', 'lte', 'items.reorder_level')

            // Get today's stock movements
            const today = new Date().toISOString().split('T')[0]
            const { data: todayMovements } = await supabase
                .from('stock_ledger_entries')
                .select('id', { count: 'exact' })
                .eq('company_id', companyId)
                .eq('posting_date', today)

            const stats = {
                total_items: itemsCount?.length || 0,
                total_warehouses: warehousesCount?.length || 0,
                total_stock_value: stockValue?.reduce((sum, bin) => sum + (bin.stock_value || 0), 0) || 0,
                low_stock_items: lowStockItems?.length || 0,
                stock_movements_today: todayMovements?.length || 0
            }

            return { success: true, data: stats }
        } catch (error) {
            console.error('Error fetching inventory stats:', error)
            return { success: false, error: 'Failed to fetch inventory statistics' }
        }
    }
}
