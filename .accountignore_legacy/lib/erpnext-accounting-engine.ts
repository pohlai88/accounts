/**
 * ERPNext-Inspired Accounting Engine
 * Implements advanced business logic patterns extracted from ERPNext legacy
 */

import { supabase, supabaseAdmin } from './supabase'
import type { GLEntry, CreateGLEntryInput, Account } from './supabase'

export interface ERPNextGLEntry extends CreateGLEntryInput {
    // ERPNext enhanced fields
    against_voucher?: string
    against_voucher_type?: string
    due_date?: string
    is_advance?: boolean
    finance_book?: string
    cost_center_id?: string
    project_id?: string
    is_cancelled?: boolean
    docstatus?: number // 0=Draft, 1=Submitted, 2=Cancelled
}

export interface PaymentLedgerEntry {
    id?: string
    account_id: string
    party_type?: string
    party?: string
    amount: number
    amount_in_account_currency?: number
    against_voucher_type?: string
    against_voucher_no?: string
    voucher_type: string
    voucher_no: string
    posting_date: string
    due_date?: string
    company_id: string
}

export interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

/**
 * ERPNext-Inspired Accounting Engine
 * Implements sophisticated business logic patterns
 */
export class ERPNextAccountingEngine {

    /**
     * Enhanced GL Entry Creation with ERPNext Validation
     */
    static async createGLEntries(
        entries: ERPNextGLEntry[],
        options: {
            validateBalance?: boolean
            createPaymentLedger?: boolean
            validatePeriod?: boolean
            validateAccounts?: boolean
        } = {}
    ): Promise<{ success: boolean; errors: string[]; data?: GLEntry[] }> {

        const {
            validateBalance = true,
            createPaymentLedger = true,
            validatePeriod = true,
            validateAccounts = true
        } = options

        try {
            // Step 1: Pre-validation (ERPNext pattern)
            const validation = await this.validateGLEntries(entries, {
                validateBalance,
                validatePeriod,
                validateAccounts
            })

            if (!validation.valid) {
                return { success: false, errors: validation.errors }
            }

            // Step 2: Process entries (merge duplicates, round amounts)
            const processedEntries = this.processGLEntries(entries)

            // Step 3: Create GL entries
            const { data: glEntries, error: glError } = await supabase
                .from('gl_entries')
                .insert(processedEntries)
                .select()

            if (glError) {
                return { success: false, errors: [glError.message] }
            }

            // Step 4: Create payment ledger entries (ERPNext pattern)
            if (createPaymentLedger && glEntries) {
                await this.createPaymentLedgerEntries(glEntries)
            }

            return { success: true, errors: [], data: glEntries }

        } catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            }
        }
    }

    /**
     * ERPNext-Style GL Entry Validation
     */
    static async validateGLEntries(
        entries: ERPNextGLEntry[],
        options: {
            validateBalance?: boolean
            validatePeriod?: boolean
            validateAccounts?: boolean
        }
    ): Promise<ValidationResult> {

        const errors: string[] = []
        const warnings: string[] = []

        // Validate balance (fundamental accounting rule)
        if (options.validateBalance) {
            const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0)
            const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0)
            const difference = Math.abs(totalDebit - totalCredit)

            if (difference > 0.01) {
                errors.push(`Transaction must balance: Debit (${totalDebit}) ≠ Credit (${totalCredit})`)
            }
        }

        // Validate accounts exist and are active
        if (options.validateAccounts) {
            const accountIds = [...new Set(entries.map(e => e.account_id))]
            const { data: accounts, error } = await supabase
                .from('accounts')
                .select('id, name, is_active, account_type')
                .in('id', accountIds)

            if (error) {
                errors.push(`Account validation failed: ${error.message}`)
            } else if (accounts) {
                const foundIds = new Set(accounts.map(a => a.id))
                const missingIds = accountIds.filter(id => !foundIds.has(id))

                if (missingIds.length > 0) {
                    errors.push(`Accounts not found: ${missingIds.join(', ')}`)
                }

                const inactiveAccounts = accounts.filter(a => !a.is_active)
                if (inactiveAccounts.length > 0) {
                    errors.push(`Inactive accounts: ${inactiveAccounts.map(a => a.name).join(', ')}`)
                }
            }
        }

        // Validate posting dates
        if (options.validatePeriod) {
            const today = new Date().toISOString().split('T')[0]
            const futureEntries = entries.filter(e => e.posting_date > today)

            if (futureEntries.length > 0) {
                warnings.push(`${futureEntries.length} entries have future posting dates`)
            }
        }

        // Validate individual entries
        for (const entry of entries) {
            if (entry.debit === 0 && entry.credit === 0) {
                errors.push(`Entry cannot have both debit and credit as zero`)
            }

            if (entry.debit > 0 && entry.credit > 0) {
                errors.push(`Entry cannot have both debit and credit amounts`)
            }

            if (!entry.voucher_no?.trim()) {
                errors.push(`Voucher number is required`)
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    /**
     * Process GL Entries (ERPNext pattern)
     * Merges duplicate entries and applies rounding
     */
    static processGLEntries(entries: ERPNextGLEntry[]): ERPNextGLEntry[] {
        const processed: ERPNextGLEntry[] = []

        // Group by account, voucher, and other key fields
        const groups = new Map<string, ERPNextGLEntry[]>()

        for (const entry of entries) {
            const key = `${entry.account_id}-${entry.voucher_type}-${entry.voucher_no}-${entry.party_type || ''}-${entry.party || ''}`

            if (!groups.has(key)) {
                groups.set(key, [])
            }
            groups.get(key)!.push(entry)
        }

        // Merge entries in each group
        for (const [key, groupEntries] of groups) {
            const merged: ERPNextGLEntry = {
                ...groupEntries[0],
                debit: this.roundAmount(groupEntries.reduce((sum, e) => sum + e.debit, 0)),
                credit: this.roundAmount(groupEntries.reduce((sum, e) => sum + e.credit, 0))
            }

            // Only add if amounts are not zero
            if (merged.debit > 0 || merged.credit > 0) {
                processed.push(merged)
            }
        }

        return processed
    }

    /**
     * Create Payment Ledger Entries (ERPNext Pattern)
     * Separate ledger for payment reconciliation
     */
    static async createPaymentLedgerEntries(glEntries: GLEntry[]): Promise<void> {
        const paymentEntries: PaymentLedgerEntry[] = []

        for (const glEntry of glEntries) {
            // Only create payment ledger for receivable/payable accounts
            const { data: account } = await supabase
                .from('accounts')
                .select('account_type')
                .eq('id', glEntry.account_id)
                .single()

            if (account && (account.account_type === 'Asset' || account.account_type === 'Liability')) {
                const amount = glEntry.debit - glEntry.credit

                if (amount !== 0) {
                    paymentEntries.push({
                        account_id: glEntry.account_id,
                        party_type: glEntry.party_type,
                        party: glEntry.party,
                        amount,
                        voucher_type: glEntry.voucher_type,
                        voucher_no: glEntry.voucher_no,
                        posting_date: glEntry.posting_date,
                        company_id: glEntry.company_id
                    })
                }
            }
        }

        if (paymentEntries.length > 0) {
            await supabase
                .from('payment_ledger_entries')
                .insert(paymentEntries)
        }
    }

    /**
     * Sales Invoice GL Entries (ERPNext Pattern)
     */
    static createSalesInvoiceEntries(
        invoiceAmount: number,
        receivableAccountId: string,
        revenueAccountId: string,
        voucherNo: string,
        postingDate: string,
        companyId: string,
        options: {
            customerName?: string
            dueDate?: string
            costCenterId?: string
            projectId?: string
        } = {}
    ): ERPNextGLEntry[] {

        return [
            {
                account_id: receivableAccountId,
                debit: invoiceAmount,
                credit: 0,
                posting_date: postingDate,
                voucher_type: 'Sales Invoice',
                voucher_no: voucherNo,
                company_id: companyId,
                party_type: 'Customer',
                party: options.customerName,
                due_date: options.dueDate,
                cost_center_id: options.costCenterId,
                project_id: options.projectId,
                docstatus: 1,
                is_advance: false,
                is_cancelled: false,
                finance_book: 'Default'
            },
            {
                account_id: revenueAccountId,
                debit: 0,
                credit: invoiceAmount,
                posting_date: postingDate,
                voucher_type: 'Sales Invoice',
                voucher_no: voucherNo,
                company_id: companyId,
                party_type: 'Customer',
                party: options.customerName,
                cost_center_id: options.costCenterId,
                project_id: options.projectId,
                docstatus: 1,
                is_advance: false,
                is_cancelled: false,
                finance_book: 'Default'
            }
        ]
    }

    /**
     * Payment Entry GL Entries (ERPNext Pattern)
     */
    static createPaymentEntries(
        paymentAmount: number,
        bankAccountId: string,
        receivableAccountId: string,
        voucherNo: string,
        postingDate: string,
        companyId: string,
        options: {
            customerName?: string
            againstInvoice?: string
            costCenterId?: string
            projectId?: string
        } = {}
    ): ERPNextGLEntry[] {

        return [
            {
                account_id: bankAccountId,
                debit: paymentAmount,
                credit: 0,
                posting_date: postingDate,
                voucher_type: 'Payment Entry',
                voucher_no: voucherNo,
                company_id: companyId,
                party_type: 'Customer',
                party: options.customerName,
                against_voucher: options.againstInvoice,
                against_voucher_type: options.againstInvoice ? 'Sales Invoice' : undefined,
                cost_center_id: options.costCenterId,
                project_id: options.projectId,
                docstatus: 1,
                is_advance: !options.againstInvoice,
                is_cancelled: false,
                finance_book: 'Default'
            },
            {
                account_id: receivableAccountId,
                debit: 0,
                credit: paymentAmount,
                posting_date: postingDate,
                voucher_type: 'Payment Entry',
                voucher_no: voucherNo,
                company_id: companyId,
                party_type: 'Customer',
                party: options.customerName,
                against_voucher: options.againstInvoice,
                against_voucher_type: options.againstInvoice ? 'Sales Invoice' : undefined,
                cost_center_id: options.costCenterId,
                project_id: options.projectId,
                docstatus: 1,
                is_advance: !options.againstInvoice,
                is_cancelled: false,
                finance_book: 'Default'
            }
        ]
    }

    /**
     * Get Account Balance (ERPNext Pattern)
     */
    static async getAccountBalance(
        accountId: string,
        asOfDate?: string,
        companyId?: string
    ): Promise<{ balance: number; debitTotal: number; creditTotal: number }> {

        let query = supabase
            .from('gl_entries')
            .select('debit, credit, account_id')
            .eq('account_id', accountId)

        if (asOfDate) {
            query = query.lte('posting_date', asOfDate)
        }

        if (companyId) {
            query = query.eq('company_id', companyId)
        }

        const { data: entries, error } = await query

        if (error || !entries) {
            return { balance: 0, debitTotal: 0, creditTotal: 0 }
        }

        const debitTotal = entries.reduce((sum, entry) => sum + entry.debit, 0)
        const creditTotal = entries.reduce((sum, entry) => sum + entry.credit, 0)

        // Get account type to determine balance calculation
        const { data: account } = await supabase
            .from('accounts')
            .select('account_type')
            .eq('id', accountId)
            .single()

        let balance = debitTotal - creditTotal

        // For Liability, Equity, and Income accounts, credit increases balance
        if (account && ['Liability', 'Equity', 'Income'].includes(account.account_type)) {
            balance = -balance
        }

        return {
            balance: this.roundAmount(balance),
            debitTotal: this.roundAmount(debitTotal),
            creditTotal: this.roundAmount(creditTotal)
        }
    }

    /**
     * Generate Voucher Number (ERPNext Pattern)
     */
    static generateVoucherNo(voucherType: string, companyCode: string = 'DEMO'): string {
        const date = new Date()
        const year = date.getFullYear().toString().slice(-2)
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')

        const prefixMap: Record<string, string> = {
            'Sales Invoice': 'SI',
            'Purchase Invoice': 'PI',
            'Payment Entry': 'PE',
            'Journal Entry': 'JE'
        }

        const prefix = prefixMap[voucherType] || 'JE'
        return `${prefix}-${companyCode}-${year}${month}-${random}`
    }

    /**
     * Round amount to 2 decimal places
     */
    static roundAmount(amount: number): number {
        return Math.round(amount * 100) / 100
    }

    /**
     * Reverse GL Entries (ERPNext Pattern)
     * Creates exact opposite entries for audit compliance
     */
    static async reverseGLEntries(
        originalVoucherType: string,
        originalVoucherNo: string,
        companyId: string,
        reversalDate: string,
        remarks?: string
    ): Promise<{ success: boolean; errors: string[] }> {

        try {
            // Get original entries
            const { data: originalEntries, error } = await supabase
                .from('gl_entries')
                .select('*')
                .eq('voucher_type', originalVoucherType)
                .eq('voucher_no', originalVoucherNo)
                .eq('company_id', companyId)

            if (error || !originalEntries?.length) {
                return { success: false, errors: ['Original entries not found'] }
            }

            // Create reversal entries
            const reversalVoucherNo = this.generateVoucherNo('Journal Entry')
            const reversalEntries: ERPNextGLEntry[] = originalEntries.map(entry => ({
                account_id: entry.account_id,
                debit: entry.credit, // Swap debit and credit
                credit: entry.debit,
                posting_date: reversalDate,
                voucher_type: 'Journal Entry',
                voucher_no: reversalVoucherNo,
                party_type: entry.party_type,
                party: entry.party,
                remarks: remarks || `Reversal of ${originalVoucherType} ${originalVoucherNo}`,
                company_id: companyId,
                against_voucher: originalVoucherNo,
                against_voucher_type: originalVoucherType,
                docstatus: 1,
                is_cancelled: false
            }))

            return await this.createGLEntries(reversalEntries)

        } catch (error) {
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Reversal failed']
            }
        }
    }
}
