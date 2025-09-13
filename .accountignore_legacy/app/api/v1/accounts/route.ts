/**
 * REST API Endpoint: Chart of Accounts
 * Full CRUD operations for Account management
 * ERPNext/Odoo Integration Compatible
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

// Validation schemas
const accountSchema = z.object({
    account_name: z.string().min(1, 'Account name is required'),
    account_type: z.enum([
        'Asset', 'Liability', 'Equity', 'Income', 'Expense',
        'Receivable', 'Payable', 'Bank', 'Cash', 'Stock',
        'Tax', 'Chargeable', 'Income Account', 'Expense Account'
    ]),
    account_currency: z.string().default('USD'),
    parent_account: z.string().optional(),
    is_group: z.boolean().default(false),
    balance_must_be: z.enum(['Credit', 'Debit']).optional(),
    freeze_account: z.enum(['No', 'Yes']).default('No'),
    account_number: z.string().optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    company_id: z.string().min(1, 'Company is required'),
})

const querySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val) : 100),
    offset: z.string().optional().transform(val => val ? parseInt(val) : 0),
    search: z.string().optional(),
    account_type: z.string().optional(),
    is_group: z.string().optional().transform(val => val === 'true'),
    parent_account: z.string().optional(),
    company_id: z.string().optional(),
    include_balances: z.string().optional().transform(val => val === 'true'),
    sort_by: z.enum(['account_name', 'account_number', 'account_type']).default('account_name'),
    sort_order: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * GET /api/v1/accounts
 * Retrieve chart of accounts with filtering, pagination, and sorting
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = querySchema.parse(Object.fromEntries(searchParams))

        // Build base query
        let query = supabase
            .from('accounts')
            .select(`
                id,
                account_name,
                account_number,
                account_type,
                account_currency,
                parent_account,
                is_group,
                balance_must_be,
                freeze_account,
                tax_rate,
                company_id,
                lft,
                rgt,
                created_at,
                modified
            `)

        // Apply filters
        if (params.search) {
            query = query.or(`account_name.ilike.%${params.search}%,account_number.ilike.%${params.search}%`)
        }

        if (params.account_type) {
            query = query.eq('account_type', params.account_type)
        }

        if (params.is_group !== undefined) {
            query = query.eq('is_group', params.is_group)
        }

        if (params.parent_account) {
            query = query.eq('parent_account', params.parent_account)
        }

        if (params.company_id) {
            query = query.eq('company_id', params.company_id)
        }

        // Apply sorting
        query = query.order(params.sort_by, { ascending: params.sort_order === 'asc' })

        // Apply pagination
        query = query.range(params.offset, params.offset + params.limit - 1)

        const { data: accounts, error, count } = await query

        if (error) {
            return NextResponse.json(
                { error: 'Failed to fetch accounts', details: error.message },
                { status: 500 }
            )
        }

        // Include account balances if requested
        let accountsWithBalances = accounts
        if (params.include_balances && accounts?.length) {
            const accountIds = accounts.map(acc => acc.id)

            const { data: balances } = await supabase
                .from('account_balances')
                .select('account_id, balance, balance_in_company_currency')
                .in('account_id', accountIds)

            const balanceMap = new Map(balances?.map(b => [b.account_id, b]) || [])

            accountsWithBalances = accounts.map(account => ({
                ...account,
                balance: balanceMap.get(account.id)?.balance || 0,
                balance_in_company_currency: balanceMap.get(account.id)?.balance_in_company_currency || 0
            }))
        }

        return NextResponse.json({
            data: accountsWithBalances,
            meta: {
                total: count,
                limit: params.limit,
                offset: params.offset,
                has_more: count ? count > params.offset + params.limit : false
            }
        })

    } catch (error) {
        console.error('GET /api/v1/accounts error:', error)

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
 * POST /api/v1/accounts
 * Create a new account
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = accountSchema.parse(body)

        // Validate parent account exists if provided
        if (validatedData.parent_account) {
            const { data: parentAccount } = await supabase
                .from('accounts')
                .select('id, is_group')
                .eq('id', validatedData.parent_account)
                .single()

            if (!parentAccount) {
                return NextResponse.json(
                    { error: 'Parent account not found' },
                    { status: 400 }
                )
            }

            if (!parentAccount.is_group) {
                return NextResponse.json(
                    { error: 'Parent account must be a group account' },
                    { status: 400 }
                )
            }
        }

        // Generate account number if not provided
        let accountNumber = validatedData.account_number
        if (!accountNumber) {
            accountNumber = await generateAccountNumber(validatedData.account_type, validatedData.company_id)
        }

        // Check if account name already exists for this company
        const { data: existingAccount } = await supabase
            .from('accounts')
            .select('id')
            .eq('account_name', validatedData.account_name)
            .eq('company_id', validatedData.company_id)
            .single()

        if (existingAccount) {
            return NextResponse.json(
                { error: 'Account name already exists for this company' },
                { status: 409 }
            )
        }

        // Create account using nested set model for hierarchy
        const { data: account, error } = await supabase.rpc('create_account', {
            p_account_data: {
                ...validatedData,
                account_number: accountNumber
            }
        })

        if (error) {
            return NextResponse.json(
                { error: 'Failed to create account', details: error.message },
                { status: 500 }
            )
        }

        // Fetch the created account with full details
        const { data: createdAccount, error: fetchError } = await supabase
            .from('accounts')
            .select(`
                id,
                account_name,
                account_number,
                account_type,
                account_currency,
                parent_account,
                is_group,
                balance_must_be,
                freeze_account,
                tax_rate,
                company_id,
                lft,
                rgt,
                created_at,
                modified
            `)
            .eq('id', account)
            .single()

        if (fetchError) {
            return NextResponse.json(
                { error: 'Account created but failed to fetch details', details: fetchError.message },
                { status: 201 }
            )
        }

        return NextResponse.json({
            data: createdAccount,
            message: 'Account created successfully'
        }, { status: 201 })

    } catch (error) {
        console.error('POST /api/v1/accounts error:', error)

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
 * Generate account number based on account type and company
 */
async function generateAccountNumber(accountType: string, companyId: string): Promise<string> {
    const prefixMap: Record<string, string> = {
        'Asset': '1',
        'Liability': '2',
        'Equity': '3',
        'Income': '4',
        'Expense': '5',
        'Receivable': '11',
        'Payable': '21',
        'Bank': '12',
        'Cash': '13',
        'Stock': '14',
        'Tax': '23',
        'Chargeable': '24',
        'Income Account': '41',
        'Expense Account': '51'
    }

    const prefix = prefixMap[accountType] || '9'

    const { data, error } = await supabase.rpc('generate_account_number', {
        p_prefix: prefix,
        p_company_id: companyId
    })

    if (error) {
        // Fallback to timestamp-based number
        const timestamp = Date.now().toString().slice(-6)
        return `${prefix}${timestamp}`
    }

    return data
}
