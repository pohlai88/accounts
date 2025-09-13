/**
 * REST API Endpoint: Sales Quotations
 * Full CRUD operations for Quotation management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Validation schemas
const quotationItemSchema = z.object({
    item_code: z.string().min(1, 'Item code is required'),
    item_name: z.string().min(1, 'Item name is required'),
    description: z.string().optional(),
    qty: z.number().min(0.001, 'Quantity must be greater than 0'),
    rate: z.number().min(0, 'Rate cannot be negative'),
    amount: z.number().optional(), // Will be calculated
    uom: z.string().optional(),
    warehouse: z.string().optional(),
    delivery_date: z.string().optional(),
})

const quotationSchema = z.object({
    customer_id: z.string().min(1, 'Customer is required'),
    quotation_to: z.enum(['Customer', 'Lead']).default('Customer'),
    transaction_date: z.string().min(1, 'Transaction date is required'),
    valid_till: z.string().optional(),
    currency: z.string().default('USD'),
    conversion_rate: z.number().min(0.000001).default(1),
    order_type: z.enum(['Sales', 'Maintenance', 'Shopping Cart']).default('Sales'),
    customer_address: z.string().optional(),
    shipping_address: z.string().optional(),
    contact_person: z.string().optional(),
    terms: z.string().optional(),
    items: z.array(quotationItemSchema).min(1, 'At least one item is required'),
})

const querySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    customer_id: z.string().optional(),
    status: z.enum(['Draft', 'Open', 'Replied', 'Partially Ordered', 'Ordered', 'Lost', 'Cancelled', 'Expired']).optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    search: z.string().optional(),
    sort_by: z.enum(['transaction_date', 'grand_total', 'valid_till']).default('transaction_date'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/v1/quotations
 * Retrieve quotations with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = querySchema.parse(Object.fromEntries(searchParams))

        // Build query
        let query = supabase
            .from('quotations')
            .select(`
                id,
                name,
                customer_id,
                customer_name,
                quotation_to,
                transaction_date,
                valid_till,
                currency,
                conversion_rate,
                order_type,
                customer_address,
                shipping_address,
                contact_person,
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
                terms,
                created_at,
                modified,
                items:quotation_items(
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
            query = query.or(`name.ilike.%${params.search}%,customer_name.ilike.%${params.search}%`)
        }

        // Apply sorting
        query = query.order(params.sort_by, { ascending: params.sort_order === 'asc' })

        const { data: quotations, error, count } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch quotations', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: quotations,
            meta: {
                total: count,
                limit: params.limit,
                offset: params.offset,
                has_more: count ? count > params.offset + params.limit : false
            }
        })

    } catch (error) {
        console.error('GET /api/v1/quotations error:', error)

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
 * POST /api/v1/quotations
 * Create a new quotation
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = quotationSchema.parse(body)

        // Generate quotation name
        const quotationName = await generateQuotationName()

        // Calculate totals
        const totals = calculateQuotationTotals(validatedData.items, validatedData.conversion_rate)

        // Set default valid till if not provided (30 days from transaction date)
        const validTill = validatedData.valid_till || calculateValidTill(validatedData.transaction_date)

        // Create quotation in a transaction
        const { data, error } = await supabase.rpc('create_quotation', {
            p_quotation_data: {
                name: quotationName,
                customer_id: validatedData.customer_id,
                quotation_to: validatedData.quotation_to,
                transaction_date: validatedData.transaction_date,
                valid_till: validTill,
                currency: validatedData.currency,
                conversion_rate: validatedData.conversion_rate,
                order_type: validatedData.order_type,
                customer_address: validatedData.customer_address,
                shipping_address: validatedData.shipping_address,
                contact_person: validatedData.contact_person,
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
                delivery_date: item.delivery_date,
                idx: index + 1
            }))
        })

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create quotation', details: error.message },
                { status: 500 }
            )
        }

        // Fetch the created quotation with items
        const { data: quotation, error: fetchError } = await supabase
            .from('quotations')
            .select(`
                id,
                name,
                customer_id,
                customer_name,
                transaction_date,
                valid_till,
                currency,
                conversion_rate,
                order_type,
                status,
                docstatus,
                grand_total,
                terms,
                created_at,
                modified,
                items:quotation_items(
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
                { error: 'Quotation created but failed to fetch details', details: fetchError.message },
                { status: 201 }
            )
        }

        return NextResponse.json({
            data: quotation,
            message: 'Quotation created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('POST /api/v1/quotations error:', error)

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
 * Generate unique quotation name
 */
async function generateQuotationName(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_quotation_name')

    if (error) {
        // Fallback to timestamp-based name
        const timestamp = Date.now().toString(36).toUpperCase()
        return `QUOT-${timestamp}`
    }

    return data
}

/**
 * Calculate quotation totals
 */
function calculateQuotationTotals(items: any[], conversionRate: number) {
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
        base_total_taxes_and_charges: 0
    }
}

/**
 * Calculate valid till date (default 30 days from transaction date)
 */
function calculateValidTill(transactionDate: string): string {
    const date = new Date(transactionDate)
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
}
