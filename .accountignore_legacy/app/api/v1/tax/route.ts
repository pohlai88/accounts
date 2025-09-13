/**
 * REST API Endpoint: Tax Management
 * Tax calculations, returns, compliance, and automated tax processing
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Validation schemas
const taxRuleSchema = z.object({
    tax_type: z.enum(['Sales Tax', 'VAT', 'GST', 'Income Tax', 'Corporate Tax', 'Withholding Tax', 'Custom']),
    tax_name: z.string().min(1, 'Tax name is required'),
    rate: z.number().min(0).max(100, 'Tax rate cannot exceed 100%'),
    account_head: z.string().min(1, 'Tax account head is required'),
    description: z.string().optional(),
    charge_type: z.enum(['On Net Total', 'On Previous Row Total', 'On Previous Row Amount', 'Actual']).default('On Net Total'),
    row_id: z.number().optional(),
    included_in_print_rate: z.boolean().default(false),
    is_this_tax_included_in_rate: z.boolean().default(false),
    cost_center: z.string().optional(),
    minimum_net_total: z.number().min(0).default(0),
    maximum_net_total: z.number().min(0).default(0),
})

const taxTemplateSchema = z.object({
    template_name: z.string().min(1, 'Template name is required'),
    company_id: z.string().min(1, 'Company is required'),
    tax_category: z.enum(['In State', 'Out of State', 'Export', 'Import', 'Exempt']).default('In State'),
    is_default: z.boolean().default(false),
    disabled: z.boolean().default(false),
    taxes: z.array(taxRuleSchema).min(1, 'At least one tax rule is required'),
})

const taxCalculationSchema = z.object({
    document_type: z.enum(['Sales Invoice', 'Purchase Invoice', 'Quotation', 'Sales Order', 'Purchase Order']),
    net_total: z.number().min(0, 'Net total cannot be negative'),
    tax_template_id: z.string().optional(),
    customer_id: z.string().optional(),
    supplier_id: z.string().optional(),
    shipping_address: z.object({
        country: z.string(),
        state: z.string().optional(),
        zip_code: z.string().optional(),
    }).optional(),
    billing_address: z.object({
        country: z.string(),
        state: z.string().optional(),
        zip_code: z.string().optional(),
    }).optional(),
    items: z.array(z.object({
        item_code: z.string(),
        item_name: z.string(),
        amount: z.number(),
        tax_category: z.string().optional(),
        is_tax_exempt: z.boolean().default(false),
    })).optional(),
})

const querySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    type: z.enum(['templates', 'calculations', 'returns']).default('templates'),
    company_id: z.string().optional(),
    tax_category: z.string().optional(),
    tax_type: z.string().optional(),
    is_default: z.string().optional().transform(val => val === 'true'),
    disabled: z.string().optional().transform(val => val === 'true'),
    from_date: z.string().optional(),
    to_date: z.string().optional(),
    search: z.string().optional(),
    sort_by: z.enum(['template_name', 'tax_category', 'total_rate', 'created_at']).default('template_name'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * GET /api/v1/tax
 * Retrieve tax templates, calculations, or returns
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = querySchema.parse(Object.fromEntries(searchParams))

        let data, error, count

        switch (params.type) {
            case 'templates':
                ({ data, error, count } = await getTaxTemplates(params))
                break
            case 'calculations':
                ({ data, error, count } = await getTaxCalculations(params))
                break
            case 'returns':
                ({ data, error, count } = await getTaxReturns(params))
                break
            default:
                return NextResponse.json(
                    { error: 'Invalid type parameter' },
                    { status: 400 }
                )
        }

        if (error) {
            return NextResponse.json(
                { error: `Failed to fetch tax ${params.type}`, details: error.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data,
            meta: {
                total: count,
                limit: params.limit,
                offset: params.offset,
                has_more: count ? count > params.offset + params.limit : false,
                type: params.type
            }
        })

    } catch (error) {
        console.error('GET /api/v1/tax error:', error)

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
 * POST /api/v1/tax
 * Create tax template or calculate taxes
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { type } = body

        switch (type) {
            case 'template':
                return await createTaxTemplate(body)
            case 'calculate':
                return await calculateTaxes(body)
            case 'return':
                return await generateTaxReturn(body)
            default:
                return NextResponse.json(
                    { error: 'Invalid type. Must be "template", "calculate", or "return"' },
                    { status: 400 }
                )
        }

    } catch (error) {
        console.error('POST /api/v1/tax error:', error)

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
 * Get tax templates
 */
async function getTaxTemplates(params: any) {
    let query = supabase
        .from('tax_templates')
        .select(`
            id,
            template_name,
            company_id,
            tax_category,
            is_default,
            disabled,
            total_rate,
            created_at,
            modified,
            taxes:tax_template_details(
                id,
                tax_type,
                tax_name,
                rate,
                account_head,
                description,
                charge_type,
                row_id,
                included_in_print_rate,
                is_this_tax_included_in_rate,
                cost_center,
                minimum_net_total,
                maximum_net_total
            )
        `)
        .range(params.offset, params.offset + params.limit - 1)

    if (params.company_id) {
        query = query.eq('company_id', params.company_id)
    }

    if (params.tax_category) {
        query = query.eq('tax_category', params.tax_category)
    }

    if (params.is_default !== undefined) {
        query = query.eq('is_default', params.is_default)
    }

    if (params.disabled !== undefined) {
        query = query.eq('disabled', params.disabled)
    }

    if (params.search) {
        query = query.or(`template_name.ilike.%${params.search}%,tax_category.ilike.%${params.search}%`)
    }

    query = query.order(params.sort_by, { ascending: params.sort_order === 'asc' })

    return await query
}

/**
 * Get tax calculations
 */
async function getTaxCalculations(params: any) {
    let query = supabase
        .from('tax_calculations')
        .select(`
            id,
            document_type,
            document_name,
            net_total,
            total_taxes_and_charges,
            grand_total,
            tax_template_id,
            tax_template:tax_templates(template_name),
            customer_id,
            customer:customers(customer_name),
            supplier_id,
            supplier:suppliers(supplier_name),
            calculation_date,
            created_at,
            tax_details:tax_calculation_details(
                tax_type,
                tax_name,
                rate,
                tax_amount,
                total
            )
        `)
        .range(params.offset, params.offset + params.limit - 1)

    if (params.from_date) {
        query = query.gte('calculation_date', params.from_date)
    }

    if (params.to_date) {
        query = query.lte('calculation_date', params.to_date)
    }

    if (params.search) {
        query = query.or(`document_name.ilike.%${params.search}%`)
    }

    query = query.order('calculation_date', { ascending: false })

    return await query
}

/**
 * Get tax returns
 */
async function getTaxReturns(params: any) {
    let query = supabase
        .from('tax_returns')
        .select(`
            id,
            return_name,
            company_id,
            tax_period,
            from_date,
            to_date,
            return_type,
            status,
            total_sales,
            total_purchases,
            tax_payable,
            tax_paid,
            balance_due,
            filing_date,
            due_date,
            created_at,
            modified
        `)
        .range(params.offset, params.offset + params.limit - 1)

    if (params.company_id) {
        query = query.eq('company_id', params.company_id)
    }

    if (params.from_date) {
        query = query.gte('from_date', params.from_date)
    }

    if (params.to_date) {
        query = query.lte('to_date', params.to_date)
    }

    query = query.order('from_date', { ascending: false })

    return await query
}

/**
 * Create tax template
 */
async function createTaxTemplate(body: any) {
    const validatedData = taxTemplateSchema.parse(body.data)

    // Check if template name already exists for this company
    const { data: existingTemplate } = await supabase
        .from('tax_templates')
        .select('id')
        .eq('template_name', validatedData.template_name)
        .eq('company_id', validatedData.company_id)
        .single()

    if (existingTemplate) {
        return NextResponse.json(
            { error: 'Tax template with this name already exists for this company' },
            { status: 409 }
        )
    }

    // Calculate total rate
    const totalRate = validatedData.taxes.reduce((sum, tax) => sum + tax.rate, 0)

    const { data, error } = await supabase.rpc('create_tax_template', {
        p_template_data: {
            ...validatedData,
            total_rate: totalRate
        },
        p_taxes: validatedData.taxes.map((tax, index) => ({
            ...tax,
            idx: index + 1
        }))
    })

    if (error) {
        return NextResponse.json(
            { error: 'Failed to create tax template', details: error.message },
            { status: 500 }
        )
    }

    // Fetch the created template with taxes
    const { data: template, error: fetchError } = await supabase
        .from('tax_templates')
        .select(`
            id,
            template_name,
            company_id,
            tax_category,
            is_default,
            total_rate,
            created_at,
            taxes:tax_template_details(
                tax_type,
                tax_name,
                rate,
                account_head,
                charge_type
            )
        `)
        .eq('id', data)
        .single()

    if (fetchError) {
        return NextResponse.json(
            { error: 'Tax template created but failed to fetch details', details: fetchError.message },
            { status: 201 }
        )
    }

    return NextResponse.json({
        data: template,
        message: 'Tax template created successfully'
    }, { status: 201 })
}

/**
 * Calculate taxes for a document
 */
async function calculateTaxes(body: any) {
    const validatedData = taxCalculationSchema.parse(body.data)

    const { data, error } = await supabase.rpc('calculate_taxes', {
        p_calculation_data: validatedData
    })

    if (error) {
        return NextResponse.json(
            { error: 'Failed to calculate taxes', details: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json({
        data,
        message: 'Tax calculation completed successfully'
    }, { status: 200 })
}

/**
 * Generate tax return
 */
async function generateTaxReturn(body: any) {
    const { company_id, from_date, to_date, return_type } = body.data

    if (!company_id || !from_date || !to_date || !return_type) {
        return NextResponse.json(
            { error: 'Company ID, date range, and return type are required' },
            { status: 400 }
        )
    }

    const { data, error } = await supabase.rpc('generate_tax_return', {
        p_company_id: company_id,
        p_from_date: from_date,
        p_to_date: to_date,
        p_return_type: return_type
    })

    if (error) {
        return NextResponse.json(
            { error: 'Failed to generate tax return', details: error.message },
            { status: 500 }
        )
    }

    return NextResponse.json({
        data,
        message: 'Tax return generated successfully'
    }, { status: 201 })
}
