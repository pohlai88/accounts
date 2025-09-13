/**
 * REST API Endpoint: Sales Orders
 * Full CRUD operations for Sales Order management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Validation schemas
const salesOrderItemSchema = z.object({
    item_code: z.string().min(1, 'Item code is required'),
    item_name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    qty: z.number().min(0.001, 'Quantity must be greater than 0'),
    rate: z.number().min(0, 'Rate cannot be negative'),
    amount: z.number().optional(), // Will be calculated
    uom: z.string().optional(),
    warehouse: z.string().optional(),
    delivery_date: z.string().optional(),
    delivered_qty: z.number().min(0).default(0),
    billed_amt: z.number().min(0).default(0),
})

const salesOrderSchema = z.object({
    customer_id: z.string().min(1, 'Customer is required'),
    transaction_date: z.string().min(1, 'Transaction date is required'),
    delivery_date: z.string().optional(),
    currency: z.string().default('USD'),
    conversion_rate: z.number().min(0.000001).default(1),
    order_type: z.enum(['Sales', 'Maintenance', 'Shopping Cart']).default('Sales'),
    customer_address: z.string().optional(),
    shipping_address: z.string().optional(),
    contact_person: z.string().optional(),
    customer_po_no: z.string().optional(),
    customer_po_date: z.string().optional(),
    terms: z.string().optional(),
    items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
})

const querySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    customer_id: z.string().optional(),
    status: z.enum(['Draft', 'To Deliver and Bill', 'To Bill', 'To Deliver', 'Completed', 'Cancelled', 'Closed']).optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    search: z.string().optional(),
    sort_by: z.enum(['transaction_date', 'delivery_date', 'grand_total']).default('transaction_date'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/v1/sales-orders
 * Retrieve sales orders with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = querySchema.parse(Object.fromEntries(searchParams))

        // Build query
        let query = supabase
            .from('sales_orders')
            .select(`
                id,
                name,
                customer_id,
                customer_name,
                transaction_date,
                delivery_date,
                currency,
                conversion_rate,
                order_type,
                customer_address,
                shipping_address,
                contact_person,
                customer_po_no,
                customer_po_date,
                status,
                docstatus,
                total_qty,
                base_total,
                base_net_total,
                total,
                net_total,
                total_taxes_and_charges,
                base_total_taxes_and_charges,
                base_grand_total,
                base_rounded_total,
                grand_total,
                rounded_total,
                advance_paid,
                terms,
                per_delivered,
                per_billed,
                billing_status,
                delivery_status,
                created_at,
                modified,
                items:sales_order_items(
                    id,
                    item_code,
                    item_name,
                    description,
                    qty,
                    rate,
                    amount,
                    uom,
                    warehouse,
                    delivery_date,
                    delivered_qty,
                    billed_amt
                )
            `)
            .range(params.offset, params.offset + params.limit - 1)

        // Apply filters
        if (params.customer_id) {
            query = query.eq('customer_id', params.customer_id)
        }

        if (params.status) {
            query = query.eq('status', params.status)
        }

        if (params.from_date) {
            query = query.gte('transaction_date', params.from_date)
        }

        if (params.to_date) {
            query = query.lte('transaction_date', params.to_date)
        }

        if (params.search) {
            query = query.or(`name.ilike.%${params.search}%,customer_name.ilike.%${params.search}%,customer_po_no.ilike.%${params.search}%`)
        }

        // Apply sorting
        query = query.order(params.sort_by, { ascending: params.sort_order === 'asc' })

        const { data: orders, error, count } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch sales orders', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: orders,
            meta: {
                total: count,
                limit: params.limit,
                offset: params.offset,
                has_more: count ? count > params.offset + params.limit : false
            }
        })

    } catch (error) {
        console.error('GET /api/v1/sales-orders error:', error)

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
 * POST /api/v1/sales-orders
 * Create a new sales order
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = salesOrderSchema.parse(body)

        // Generate sales order name
        const orderName = await generateSalesOrderName()

        // Calculate totals
        const totals = calculateOrderTotals(validatedData.items, validatedData.conversion_rate)

        // Set default delivery date if not provided (7 days from transaction date)
        const deliveryDate = validatedData.delivery_date || calculateDeliveryDate(validatedData.transaction_date)

        // Create sales order in a transaction
        const { data, error } = await supabase.rpc('create_sales_order', {
            p_order_data: {
                name: orderName,
                customer_id: validatedData.customer_id,
                transaction_date: validatedData.transaction_date,
                delivery_date: deliveryDate,
                currency: validatedData.currency,
                conversion_rate: validatedData.conversion_rate,
                order_type: validatedData.order_type,
                customer_address: validatedData.customer_address,
                shipping_address: validatedData.shipping_address,
                contact_person: validatedData.contact_person,
                customer_po_no: validatedData.customer_po_no,
                customer_po_date: validatedData.customer_po_date,
                terms: validatedData.terms,
                ...totals
            },
            p_items: validatedData.items.map((item, index) => ({
                item_code: item.item_code,
                item_name: item.item_name,
                description: item.description,
                qty: item.qty,
                rate: item.rate,
                amount: item.qty * item.rate,
                uom: item.uom,
                warehouse: item.warehouse,
                delivery_date: item.delivery_date || deliveryDate,
                delivered_qty: 0,
                billed_amt: 0,
                idx: index + 1
            }))
        })

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create sales order', details: error.message },
                { status: 500 }
            )
        }

        // Fetch the created order with items
        const { data: order, error: fetchError } = await supabase
            .from('sales_orders')
            .select(`
                id,
                name,
                customer_id,
                customer_name,
                transaction_date,
                delivery_date,
                currency,
                order_type,
                status,
                docstatus,
                grand_total,
                terms,
                created_at,
                modified,
                items:sales_order_items(
                    id,
                    item_code,
                    item_name,
                    description,
                    qty,
                    rate,
                    amount,
                    uom,
                    warehouse,
                    delivery_date
                )
            `)
            .eq('id', data)
            .single()

        if (fetchError) {
            return NextResponse.json(
                { error: 'Sales order created but failed to fetch details', details: fetchError.message },
                { status: 201 }
            )
        }

        return NextResponse.json({
            data: order,
            message: 'Sales order created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('POST /api/v1/sales-orders error:', error)

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
 * Generate unique sales order name
 */
async function generateSalesOrderName(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_sales_order_name')

    if (error) {
        // Fallback to timestamp-based name
        const timestamp = Date.now().toString(36).toUpperCase()
        return `SO-${timestamp}`
    }

    return data
}

/**
 * Calculate order totals
 */
function calculateOrderTotals(items: any[], conversionRate: number) {
    const totalQty = items.reduce((sum, item) => sum + item.qty, 0)
    const total = items.reduce((sum, item) => sum + (item.qty * item.rate), 0)
    const baseTotal = total * conversionRate

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
        advance_paid: 0,
        per_delivered: 0,
        per_billed: 0,
        billing_status: 'Not Billed',
        delivery_status: 'Not Delivered'
    }
}

/**
 * Calculate delivery date (default 7 days from transaction date)
 */
function calculateDeliveryDate(transactionDate: string): string {
    const date = new Date(transactionDate)
    date.setDate(date.getDate() + 7)
    return date.toISOString().split('T')[0]
}
