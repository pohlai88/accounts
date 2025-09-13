/**
 * REST API Endpoint: Items (Inventory)
 * Full CRUD operations for Item management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Validation schemas
const itemSchema = z.object({
    item_code: z.string().min(1, 'Item code is required'),
    item_name: z.string().min(1, 'Item name is required'),
    item_group: z.string().optional(),
    description: z.string().optional(),
    brand: z.string().optional(),
    uom: z.string().default('Unit'),
    maintain_stock: z.boolean().default(true),
    include_item_in_manufacturing: z.boolean().default(false),
    is_purchase_item: z.boolean().default(true),
    is_sales_item: z.boolean().default(true),
    is_service_item: z.boolean().default(false),
    is_stock_item: z.boolean().default(true),
    is_fixed_asset: z.boolean().default(false),
    has_batch_no: z.boolean().default(false),
    has_serial_no: z.boolean().default(false),
    standard_rate: z.number().min(0).default(0),
    opening_stock: z.number().min(0).default(0),
    min_order_qty: z.number().min(0).default(0),
    safety_stock: z.number().min(0).default(0),
    lead_time_days: z.number().min(0).default(0),
    weight_per_unit: z.number().min(0).default(0),
    weight_uom: z.string().optional(),
    default_warehouse: z.string().optional(),
    item_tax_template: z.string().optional(),
    disabled: z.boolean().default(false),
})

const querySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    search: z.string().optional(),
    item_group: z.string().optional(),
    is_purchase_item: z.string().optional().transform(val => val === 'true'),
    is_sales_item: z.string().optional().transform(val => val === 'true'),
    is_service_item: z.string().optional().transform(val => val === 'true'),
    is_stock_item: z.string().optional().transform(val => val === 'true'),
    disabled: z.string().optional().transform(val => val === 'true'),
    sort_by: z.enum(['item_name', 'item_code', 'standard_rate', 'created_at']).default('item_name'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * GET /api/v1/items
 * Retrieve items with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = querySchema.parse(Object.fromEntries(searchParams))

        // Build query
        let query = supabase
            .from('items')
            .select(`
                id,
                item_code,
                item_name,
                item_group,
                description,
                brand,
                uom,
                maintain_stock,
                include_item_in_manufacturing,
                is_purchase_item,
                is_sales_item,
                is_service_item,
                is_stock_item,
                is_fixed_asset,
                has_batch_no,
                has_serial_no,
                standard_rate,
                opening_stock,
                min_order_qty,
                safety_stock,
                lead_time_days,
                weight_per_unit,
                weight_uom,
                default_warehouse,
                item_tax_template,
                disabled,
                created_at,
                modified
            `)
            .range(params.offset, params.offset + params.limit - 1)

        // Apply filters
        if (params.search) {
            query = query.or(`item_code.ilike.%${params.search}%,item_name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
        }

        if (params.item_group) {
            query = query.eq('item_group', params.item_group)
        }

        if (params.is_purchase_item !== undefined) {
            query = query.eq('is_purchase_item', params.is_purchase_item)
        }

        if (params.is_sales_item !== undefined) {
            query = query.eq('is_sales_item', params.is_sales_item)
        }

        if (params.is_service_item !== undefined) {
            query = query.eq('is_service_item', params.is_service_item)
        }

        if (params.is_stock_item !== undefined) {
            query = query.eq('is_stock_item', params.is_stock_item)
        }

        if (params.disabled !== undefined) {
            query = query.eq('disabled', params.disabled)
        }

        // Apply sorting
        query = query.order(params.sort_by, { ascending: params.sort_order === 'asc' })

        const { data: items, error, count } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch items', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: items,
            meta: {
                total: count,
                limit: params.limit,
                offset: params.offset,
                has_more: count ? count > params.offset + params.limit : false
            }
        })

    } catch (error) {
        console.error('GET /api/v1/items error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid query parameters', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/v1/items
 * Create a new item
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = itemSchema.parse(body)

        // Check if item code already exists
        const { data: existingItem } = await supabase
            .from('items')
            .select('id')
            .eq('item_code', validatedData.item_code)
            .single()

        if (existingItem) {
            return NextResponse.json(
                { error: 'Item code already exists' },
                { status: 409 }
            )
        }

        const { data: item, error } = await supabase
            .from('items')
            .insert(validatedData)
            .select(`
                id,
                item_code,
                item_name,
                item_group,
                description,
                brand,
                uom,
                maintain_stock,
                is_purchase_item,
                is_sales_item,
                is_service_item,
                is_stock_item,
                standard_rate,
                opening_stock,
                disabled,
                created_at,
                modified
            `)
            .single()

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create item', details: error.message },
                { status: 500 }
            )
        }

        // Create opening stock entry if provided
        if (validatedData.opening_stock > 0 && validatedData.default_warehouse) {
            await createOpeningStock(item.id, validatedData.opening_stock, validatedData.default_warehouse, validatedData.standard_rate)
        }

        return NextResponse.json({
            data: item,
            message: 'Item created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('POST /api/v1/items error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request body', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

/**
 * Create opening stock entry for new item
 */
async function createOpeningStock(itemId: string, quantity: number, warehouse: string, rate: number) {
    try {
        await supabase
            .from('stock_ledger_entries')
            .insert({
                item_id: itemId,
                warehouse,
                posting_date: new Date().toISOString().split('T')[0],
                voucher_type: 'Opening Stock',
                voucher_no: `OPEN-${Date.now()}`,
                actual_qty: quantity,
                qty_after_transaction: quantity,
                stock_value: quantity * rate,
                stock_value_difference: quantity * rate,
                valuation_rate: rate,
                is_opening: true
            })
    } catch (error) {
        console.error('Failed to create opening stock entry:', error)
    }
}
