/**
 * REST API Endpoint: Payments
 * Full CRUD operations for Payment management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Validation schemas
const paymentAllocationSchema = z.object({
    reference_type: z.enum(['Sales Invoice', 'Purchase Invoice']),
    reference_name: z.string().min(1, 'Reference name is required'),
    allocated_amount: z.number().min(0.01, 'Allocated amount must be greater than 0'),
    outstanding_amount: z.number().optional(),
})

const paymentSchema = z.object({
    payment_type: z.enum(['Receive', 'Pay']),
    party_type: z.enum(['Customer', 'Supplier']),
    party_id: z.string().min(1, 'Party is required'),
    party_name: z.string().min(1, 'Party name is required'),
    posting_date: z.string().min(1, 'Posting date is required'),
    paid_amount: z.number().min(0.01, 'Paid amount must be greater than 0'),
    received_amount: z.number().optional(),
    source_exchange_rate: z.number().min(0.000001).default(1),
    target_exchange_rate: z.number().min(0.000001).default(1),
    paid_from: z.string().min(1, 'Paid from account is required'),
    paid_to: z.string().min(1, 'Paid to account is required'),
    reference_no: z.string().optional(),
    reference_date: z.string().optional(),
    mode_of_payment: z.string().optional(),
    remarks: z.string().optional(),
    allocations: z.array(paymentAllocationSchema).optional(),
})

const querySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    payment_type: z.enum(['Receive', 'Pay']).optional(),
    party_type: z.enum(['Customer', 'Supplier']).optional(),
    party_id: z.string().optional(),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    search: z.string().optional(),
    sort_by: z.enum(['posting_date', 'paid_amount']).default('posting_date'),
    sort_order: z.enum(['asc', 'desc']).default('desc'),
})

/**
 * GET /api/v1/payments
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = querySchema.parse(Object.fromEntries(searchParams))

        // Build query
        let query = supabase
            .from('payment_entries')
            .select(`
        id,
        payment_no,
        payment_type,
        party_type,
        party_id,
        party_name,
        posting_date,
        paid_amount,
        received_amount,
        source_exchange_rate,
        target_exchange_rate,
        paid_from,
        paid_to,
        reference_no,
        reference_date,
        mode_of_payment,
        remarks,
        docstatus,
        created_at,
        modified,
        allocations:payment_entry_references(
          reference_type,
          reference_name,
          allocated_amount,
          outstanding_amount
        )
      `)
            .range(params.offset, params.offset + params.limit - 1)

        // Apply filters
        if (params.payment_type) {
            query = query.eq('payment_type', params.payment_type)
        }

        if (params.party_type) {
            query = query.eq('party_type', params.party_type)
        }

        if (params.party_id) {
            query = query.eq('party_id', params.party_id)
        }

        if (params.from_date) {
            query = query.gte('posting_date', params.from_date)
        }

        if (params.to_date) {
            query = query.lte('posting_date', params.to_date)
        }

        if (params.search) {
            query = query.or(`payment_no.ilike.%${params.search}%,party_name.ilike.%${params.search}%,reference_no.ilike.%${params.search}%`)
        }

        // Apply sorting
        query = query.order(params.sort_by, { ascending: params.sort_order === 'asc' })

        const { data: payments, error, count } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch payments', details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: payments,
            meta: {
                total: count,
                limit: params.limit,
                offset: params.offset,
                has_more: count ? count > params.offset + params.limit : false
            }
        })

    } catch (error) {
        console.error('GET /api/v1/payments error:', error)

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
 * POST /api/v1/payments
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = paymentSchema.parse(body)

        // Generate payment number
        const paymentNo = await generatePaymentNumber(validatedData.payment_type)

        // Calculate received amount if not provided
        const receivedAmount = validatedData.received_amount ||
            (validatedData.paid_amount * validatedData.source_exchange_rate / validatedData.target_exchange_rate)

        // Create payment entry in a transaction
        const { data, error } = await supabase.rpc('create_payment_entry', {
            p_payment_data: {
                payment_no: paymentNo,
                payment_type: validatedData.payment_type,
                party_type: validatedData.party_type,
                party_id: validatedData.party_id,
                party_name: validatedData.party_name,
                posting_date: validatedData.posting_date,
                paid_amount: validatedData.paid_amount,
                received_amount: receivedAmount,
                source_exchange_rate: validatedData.source_exchange_rate,
                target_exchange_rate: validatedData.target_exchange_rate,
                paid_from: validatedData.paid_from,
                paid_to: validatedData.paid_to,
                reference_no: validatedData.reference_no,
                reference_date: validatedData.reference_date,
                mode_of_payment: validatedData.mode_of_payment,
                remarks: validatedData.remarks,
            },
            p_allocations: validatedData.allocations || []
        })

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create payment', details: error.message },
                { status: 500 }
            )
        }

        // Fetch the created payment with allocations
        const { data: payment, error: fetchError } = await supabase
            .from('payment_entries')
            .select(`
        id,
        payment_no,
        payment_type,
        party_type,
        party_id,
        party_name,
        posting_date,
        paid_amount,
        received_amount,
        paid_from,
        paid_to,
        reference_no,
        mode_of_payment,
        remarks,
        docstatus,
        created_at,
        allocations:payment_entry_references(
          reference_type,
          reference_name,
          allocated_amount,
          outstanding_amount
        )
      `)
            .eq('id', data)
            .single()

        if (fetchError) {
            return NextResponse.json(
                { error: 'Payment created but failed to fetch details', details: fetchError.message },
                { status: 201 }
            )
        }

        // Trigger webhook
        await triggerWebhook('payment.created', payment)

        return NextResponse.json({
            data: payment,
            message: 'Payment created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('POST /api/v1/payments error:', error)

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
 * Generate unique payment number
 */
async function generatePaymentNumber(paymentType: string): Promise<string> {
    const prefix = paymentType === 'Receive' ? 'PE-RCV-' : 'PE-PAY-'
    const { data, error } = await supabase.rpc('generate_payment_number', { p_prefix: prefix })

    if (error) {
        // Fallback to timestamp-based number
        const timestamp = Date.now().toString(36).toUpperCase()
        return `${prefix}${timestamp}`
    }

    return data
}

/**
 * Trigger webhook for external systems
 */
async function triggerWebhook(event: string, data: any) {
    try {
        // Get registered webhooks for this event
        const { data: webhooks } = await supabase
            .from('webhook_endpoints')
            .select('id, url, secret, is_active')
            .contains('events', [event])
            .eq('is_active', true)

        if (!webhooks || webhooks.length === 0) {
            return
        }

        // Send webhook notifications
        const promises = webhooks.map(async (webhook) => {
            try {
                const payload = {
                    event,
                    data,
                    timestamp: new Date().toISOString(),
                    webhook_id: webhook.id
                }

                const response = await fetch(webhook.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Modern-Accounting-SaaS/1.0',
                        'X-Webhook-Signature': await generateWebhookSignature(payload, webhook.secret)
                    },
                    body: JSON.stringify(payload),
                    timeout: 30000 // 30 seconds timeout
                })

                // Log webhook delivery
                await supabase
                    .from('webhook_deliveries')
                    .insert({
                        webhook_endpoint_id: webhook.id,
                        event,
                        payload: payload,
                        response_status: response.status,
                        response_body: await response.text(),
                        delivered_at: new Date().toISOString(),
                        success: response.ok
                    })

            } catch (error) {
                console.error(`Webhook delivery failed for ${webhook.url}:`, error)

                // Log failed delivery
                await supabase
                    .from('webhook_deliveries')
                    .insert({
                        webhook_endpoint_id: webhook.id,
                        event,
                        payload: { event, data },
                        response_status: 0,
                        response_body: error.message,
                        delivered_at: new Date().toISOString(),
                        success: false
                    })
            }
        })

        await Promise.allSettled(promises)

    } catch (error) {
        console.error('Webhook trigger error:', error)
    }
}

/**
 * Generate webhook signature for verification
 */
async function generateWebhookSignature(payload: any, secret: string): Promise<string> {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    hmac.update(JSON.stringify(payload))
    return `sha256=${hmac.digest('hex')}`
}
