import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Production-optimized Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Validate configuration
if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Client-side Supabase client (public operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    db: {
        schema: 'public',
    },
    global: {
        headers: {
            'X-Client-Info': 'modern-accounting-saas@1.0.0',
        },
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
})

// Server-side Supabase client (admin operations)
export const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
        db: {
            schema: 'public',
        },
        global: {
            headers: {
                'X-Client-Info': 'modern-accounting-saas-admin@1.0.0',
            },
        },
    })
    : null

// Connection health check
export async function checkSupabaseConnection(): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('count(*)')
            .single()

        return !error
    } catch (error) {
        console.error('Supabase connection check failed:', error)
        return false
    }
}

// Enhanced error handling wrapper
export async function withErrorHandling<T>(
    operation: () => Promise<T>,
    context: string
): Promise<{ data?: T; error?: string; success: boolean }> {
    try {
        const data = await operation()
        return { data, success: true }
    } catch (error: any) {
        console.error(`${context} error:`, error)

        // Handle specific Supabase errors
        if (error?.message?.includes('JWT')) {
            return { error: 'Authentication required. Please log in again.', success: false }
        }

        if (error?.message?.includes('Row Level Security')) {
            return { error: 'Access denied. Check your permissions.', success: false }
        }

        if (error?.message?.includes('duplicate key')) {
            return { error: 'Record already exists.', success: false }
        }

        if (error?.message?.includes('foreign key')) {
            return { error: 'Referenced record not found.', success: false }
        }

        return {
            error: error?.message || 'An unexpected error occurred',
            success: false
        }
    }
}

// Optimized batch operations
export async function batchInsert<T>(
    table: string,
    records: T[],
    batchSize: number = 1000
): Promise<{ success: boolean; error?: string; insertedCount?: number }> {
    if (records.length === 0) {
        return { success: true, insertedCount: 0 }
    }

    let totalInserted = 0

    try {
        // Process in batches to avoid memory issues
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize)

            const { data, error } = await supabase
                .from(table)
                .insert(batch)
                .select('id')

            if (error) {
                throw error
            }

            totalInserted += data?.length || 0
        }

        return { success: true, insertedCount: totalInserted }
    } catch (error: any) {
        console.error(`Batch insert error for ${table}:`, error)
        return {
            success: false,
            error: error?.message || 'Batch insert failed',
            insertedCount: totalInserted
        }
    }
}

// Connection pool management for server-side operations
class SupabaseConnectionPool {
    private connections: Map<string, SupabaseClient> = new Map()
    private maxConnections = 10

    getConnection(key: string = 'default'): SupabaseClient {
        if (!this.connections.has(key) && this.connections.size < this.maxConnections) {
            const client = createClient(supabaseUrl!, supabaseAnonKey!, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            })
            this.connections.set(key, client)
        }

        return this.connections.get(key) || supabase
    }

    closeConnection(key: string): void {
        const connection = this.connections.get(key)
        if (connection) {
            // Supabase clients don't have explicit close method
            this.connections.delete(key)
        }
    }

    closeAllConnections(): void {
        this.connections.clear()
    }
}

export const connectionPool = new SupabaseConnectionPool()

// Core accounting types
export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'
export type VoucherType = 'Sales Invoice' | 'Purchase Invoice' | 'Payment Entry' | 'Journal Entry'

// Database types matching schema
export interface Company {
    id: string
    name: string
    default_currency: string
    fiscal_year_start: string
    country?: string
    created_at: string
    updated_at: string
}

export interface Account {
    id: string
    name: string
    account_type: AccountType
    parent_id?: string
    account_code?: string
    currency: string
    company_id: string
    is_group: boolean
    is_active: boolean
    created_at: string
    updated_at: string
}

export interface GLEntry {
    id: string
    account_id: string
    debit: number
    credit: number
    posting_date: string
    voucher_type: VoucherType
    voucher_no: string
    party_type?: string
    party?: string
    remarks?: string
    company_id: string
    created_at: string
    created_by?: string
    // Enhanced ERPNext fields
    against_voucher?: string
    against_voucher_type?: string
    due_date?: string
    is_opening?: boolean
    finance_book?: string
    cost_center_id?: string
    project_id?: string
    is_advance?: boolean
    against_account?: string
    reference_type?: string
    reference_name?: string
    user_remark?: string
    is_cancelled?: boolean
    docstatus?: number // 0=Draft, 1=Submitted, 2=Cancelled
}

// Business logic types
export interface AccountBalance {
    account_id: string
    account_name: string
    account_type: AccountType
    balance: number
    debit_total: number
    credit_total: number
}

export interface TrialBalanceRow {
    account_id: string
    account_name: string
    account_type: AccountType
    debit_balance: number
    credit_balance: number
}

export interface AccountHierarchy extends Account {
    children?: AccountHierarchy[]
    balance?: number
    level: number
}

// Form types for creating entries
export interface CreateAccountInput {
    name: string
    account_type: AccountType
    parent_id?: string
    account_code?: string
    currency?: string
    company_id: string
    is_group?: boolean
}

export interface CreateGLEntryInput {
    account_id: string
    debit: number
    credit: number
    posting_date: string
    voucher_type: VoucherType
    voucher_no: string
    party_type?: string
    party?: string
    remarks?: string
    company_id: string
}

// Validation types
export interface ValidationError {
    field: string
    message: string
}

export interface ValidationResult {
    valid: boolean
    errors: ValidationError[]
}

// API response types
export interface ApiResponse<T> {
    data?: T
    error?: string
    message?: string
}

export interface PaginatedResponse<T> {
    data: T[]
    count: number
    page: number
    limit: number
    total_pages: number
}

// Security and compliance types
export interface User {
    id: string
    email: string
    full_name?: string
    avatar_url?: string
    created_at: string
    updated_at: string
}

export interface UserRole {
    id: string
    user_id: string
    role: string
    company_id: string
    created_at: string
}

export interface AuditLog {
    id: string
    user_id: string
    action: string
    resource_type: string
    resource_id: string
    details: Record<string, any>
    ip_address?: string
    user_agent?: string
    created_at: string
}

export interface SecurityEvent {
    id: string
    event_type: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    user_id?: string
    ip_address?: string
    metadata: Record<string, any>
    resolved: boolean
    created_at: string
}

export interface ComplianceStandard {
    id: string
    name: string
    version: string
    description: string
    requirements: Record<string, any>
    created_at: string
}

export interface CompanyCompliance {
    id: string
    company_id: string
    standard_id: string
    compliance_status: 'compliant' | 'non_compliant' | 'in_progress'
    last_assessment: string
    next_assessment: string
    created_at: string
}