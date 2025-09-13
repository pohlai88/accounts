/**
 * Intercompany Management System
 * Handles transactions between companies in the same group
 * Based on ERPNext, QuickBooks, Odoo, and SAP best practices
 */

import { supabase } from './supabase'
import { CurrencyManagementService, CurrencyCode } from './currency-management'
import { CompanyHierarchyService } from './company-hierarchy'

export type IntercompanyTransactionType = 'Transfer' | 'Invoice' | 'Payment' | 'Expense'
export type IntercompanyStatus = 'Draft' | 'Submitted' | 'Approved' | 'Cancelled'

export interface IntercompanyAccount {
    id: string
    company_id: string
    account_id: string
    account_type: 'Receivable' | 'Payable' | 'Transfer'
    is_active: boolean
    created_at: string
}

export interface IntercompanyTransaction {
    id: string
    transaction_no: string
    from_company_id: string
    to_company_id: string
    transaction_type: IntercompanyTransactionType
    amount: number
    currency: CurrencyCode
    exchange_rate: number
    base_amount: number
    description?: string
    status: IntercompanyStatus
    posting_date: string
    created_by: string
    approved_by?: string
    created_at: string
    updated_at: string
}

export interface IntercompanyBalance {
    counterparty_company_id: string
    counterparty_company_name: string
    receivable_amount: number
    payable_amount: number
    net_amount: number
}

export interface IntercompanyGL {
    id: string
    transaction_id: string
    company_id: string
    account_id: string
    debit: number
    credit: number
    currency: CurrencyCode
    exchange_rate: number
    base_debit: number
    base_credit: number
    posting_date: string
    voucher_type: string
    voucher_no: string
    party_type?: string
    party?: string
    created_at: string
}

/**
 * Intercompany Management Service
 */
export class IntercompanyManagementService {
    /**
     * Create intercompany transaction
     */
    static async createIntercompanyTransaction(
        transaction: Omit<IntercompanyTransaction, 'id' | 'transaction_no' | 'created_at' | 'updated_at'>
    ): Promise<{
        success: boolean
        transaction?: IntercompanyTransaction
        error?: string
    }> {
        try {
            // Validate companies exist and are different
            if (transaction.from_company_id === transaction.to_company_id) {
                return { success: false, error: 'From and to companies must be different' }
            }

            // Validate intercompany eligibility (parent-child relationship)
            const eligibilityResult = await CompanyHierarchyService.validateIntercompanyEligibility(
                transaction.from_company_id,
                transaction.to_company_id
            )

            if (!eligibilityResult.success) {
                return { success: false, error: eligibilityResult.error }
            }

            if (!eligibilityResult.eligible) {
                return {
                    success: false,
                    error: 'Companies must have a parent-child relationship to perform intercompany transactions. Please set up company hierarchy first.'
                }
            }

            // Get exchange rate
            const rateResult = await CurrencyManagementService.getExchangeRate(
                transaction.currency,
                'USD', // Base currency
                transaction.posting_date
            )

            if (!rateResult.success || !rateResult.rate) {
                return { success: false, error: 'Failed to get exchange rate' }
            }

            // Calculate base amount
            const baseAmount = transaction.amount * rateResult.rate

            // Generate transaction number
            const year = new Date(transaction.posting_date).getFullYear()
            const transactionNo = `IC-${year}-${Date.now().toString().slice(-6)}`

            const { data: newTransaction, error } = await supabase
                .from('intercompany_transactions')
                .insert([{
                    ...transaction,
                    transaction_no: transactionNo,
                    exchange_rate: rateResult.rate,
                    base_amount: baseAmount
                }])
                .select()
                .single()

            if (error) throw error

            return { success: true, transaction: newTransaction }
        } catch (error) {
            console.error('Error creating intercompany transaction:', error)
            return { success: false, error: 'Failed to create intercompany transaction' }
        }
    }

    /**
     * Approve intercompany transaction and create GL entries
     */
    static async approveIntercompanyTransaction(
        transactionId: string,
        approvedBy: string
    ): Promise<{
        success: boolean
        glEntries?: IntercompanyGL[]
        error?: string
    }> {
        try {
            // Get transaction details
            const { data: transaction } = await supabase
                .from('intercompany_transactions')
                .select('*')
                .eq('id', transactionId)
                .single()

            if (!transaction) {
                return { success: false, error: 'Transaction not found' }
            }

            if (transaction.status !== 'Submitted') {
                return { success: false, error: 'Transaction must be submitted before approval' }
            }

            // Update transaction status
            const { error: updateError } = await supabase
                .from('intercompany_transactions')
                .update({
                    status: 'Approved',
                    approved_by: approvedBy
                })
                .eq('id', transactionId)

            if (updateError) throw updateError

            // Create GL entries for both companies
            const glEntries = await this.createIntercompanyGLEntries(transaction)

            if (!glEntries.success || !glEntries.glEntries) {
                return { success: false, error: glEntries.error }
            }

            return { success: true, glEntries: glEntries.glEntries }
        } catch (error) {
            console.error('Error approving intercompany transaction:', error)
            return { success: false, error: 'Failed to approve intercompany transaction' }
        }
    }

    /**
     * Create GL entries for intercompany transaction
     */
    private static async createIntercompanyGLEntries(
        transaction: IntercompanyTransaction
    ): Promise<{
        success: boolean
        glEntries?: IntercompanyGL[]
        error?: string
    }> {
        try {
            // Get intercompany accounts for both companies
            const { data: fromAccounts } = await supabase
                .from('intercompany_accounts')
                .select('account_id, account_type')
                .eq('company_id', transaction.from_company_id)
                .eq('is_active', true)

            const { data: toAccounts } = await supabase
                .from('intercompany_accounts')
                .select('account_id, account_type')
                .eq('company_id', transaction.to_company_id)
                .eq('is_active', true)

            if (!fromAccounts || !toAccounts) {
                return { success: false, error: 'Intercompany accounts not found' }
            }

            const fromReceivableAccount = fromAccounts.find(a => a.account_type === 'Receivable')
            const toPayableAccount = toAccounts.find(a => a.account_type === 'Payable')

            if (!fromReceivableAccount || !toPayableAccount) {
                return { success: false, error: 'Required intercompany accounts not found' }
            }

            // Generate voucher number
            const voucherNo = `IC-${transaction.transaction_no}`

            // Create GL entries
            const glEntries = [
                // From company (receivable)
                {
                    transaction_id: transaction.id,
                    company_id: transaction.from_company_id,
                    account_id: fromReceivableAccount.account_id,
                    debit: transaction.amount,
                    credit: 0,
                    currency: transaction.currency,
                    exchange_rate: transaction.exchange_rate,
                    base_debit: transaction.base_amount,
                    base_credit: 0,
                    posting_date: transaction.posting_date,
                    voucher_type: 'Intercompany Entry',
                    voucher_no: voucherNo,
                    party_type: 'Company',
                    party: transaction.to_company_id
                },
                // To company (payable)
                {
                    transaction_id: transaction.id,
                    company_id: transaction.to_company_id,
                    account_id: toPayableAccount.account_id,
                    debit: 0,
                    credit: transaction.amount,
                    currency: transaction.currency,
                    exchange_rate: transaction.exchange_rate,
                    base_debit: 0,
                    base_credit: transaction.base_amount,
                    posting_date: transaction.posting_date,
                    voucher_type: 'Intercompany Entry',
                    voucher_no: voucherNo,
                    party_type: 'Company',
                    party: transaction.from_company_id
                }
            ]

            const { data: newGLEntries, error } = await supabase
                .from('intercompany_gl_entries')
                .insert(glEntries)
                .select()

            if (error) throw error

            return { success: true, glEntries: newGLEntries }
        } catch (error) {
            console.error('Error creating intercompany GL entries:', error)
            return { success: false, error: 'Failed to create intercompany GL entries' }
        }
    }

    /**
     * Get intercompany balances for a company
     */
    static async getIntercompanyBalances(
        companyId: string,
        asOfDate: string = new Date().toISOString().split('T')[0]
    ): Promise<{
        success: boolean
        balances?: IntercompanyBalance[]
        error?: string
    }> {
        try {
            const { data: balances, error } = await supabase
                .rpc('get_intercompany_balances', {
                    p_company_id: companyId,
                    p_as_of_date: asOfDate
                })

            if (error) throw error

            return { success: true, balances: balances || [] }
        } catch (error) {
            console.error('Error fetching intercompany balances:', error)
            return { success: false, error: 'Failed to fetch intercompany balances' }
        }
    }

    /**
     * Get intercompany transactions for a company
     */
    static async getIntercompanyTransactions(
        companyId: string,
        status?: IntercompanyStatus,
        limit: number = 50
    ): Promise<{
        success: boolean
        transactions?: IntercompanyTransaction[]
        error?: string
    }> {
        try {
            let query = supabase
                .from('intercompany_transactions')
                .select(`
          *,
          from_company:companies!intercompany_transactions_from_company_id_fkey(name),
          to_company:companies!intercompany_transactions_to_company_id_fkey(name)
        `)
                .or(`from_company_id.eq.${companyId},to_company_id.eq.${companyId}`)
                .order('created_at', { ascending: false })
                .limit(limit)

            if (status) {
                query = query.eq('status', status)
            }

            const { data: transactions, error } = await query

            if (error) throw error

            return { success: true, transactions: transactions || [] }
        } catch (error) {
            console.error('Error fetching intercompany transactions:', error)
            return { success: false, error: 'Failed to fetch intercompany transactions' }
        }
    }

    /**
     * Get intercompany GL entries for a transaction
     */
    static async getIntercompanyGLEntries(
        transactionId: string
    ): Promise<{
        success: boolean
        glEntries?: IntercompanyGL[]
        error?: string
    }> {
        try {
            const { data: glEntries, error } = await supabase
                .from('intercompany_gl_entries')
                .select(`
          *,
          account:accounts(name, account_code),
          company:companies(name)
        `)
                .eq('transaction_id', transactionId)
                .order('created_at')

            if (error) throw error

            return { success: true, glEntries: glEntries || [] }
        } catch (error) {
            console.error('Error fetching intercompany GL entries:', error)
            return { success: false, error: 'Failed to fetch intercompany GL entries' }
        }
    }

    /**
     * Cancel intercompany transaction
     */
    static async cancelIntercompanyTransaction(
        transactionId: string,
        reason: string
    ): Promise<{
        success: boolean
        error?: string
    }> {
        try {
            // Check if transaction can be cancelled
            const { data: transaction } = await supabase
                .from('intercompany_transactions')
                .select('status')
                .eq('id', transactionId)
                .single()

            if (!transaction) {
                return { success: false, error: 'Transaction not found' }
            }

            if (transaction.status === 'Cancelled') {
                return { success: false, error: 'Transaction already cancelled' }
            }

            if (transaction.status === 'Approved') {
                return { success: false, error: 'Cannot cancel approved transaction. Create reversal instead.' }
            }

            // Update transaction status
            const { error } = await supabase
                .from('intercompany_transactions')
                .update({
                    status: 'Cancelled',
                    description: `${transaction.description || ''}\n\nCancelled: ${reason}`
                })
                .eq('id', transactionId)

            if (error) throw error

            return { success: true }
        } catch (error) {
            console.error('Error cancelling intercompany transaction:', error)
            return { success: false, error: 'Failed to cancel intercompany transaction' }
        }
    }

    /**
     * Create intercompany reversal transaction
     */
    static async createIntercompanyReversal(
        originalTransactionId: string,
        reversalDate: string,
        createdBy: string
    ): Promise<{
        success: boolean
        reversalTransaction?: IntercompanyTransaction
        error?: string
    }> {
        try {
            // Get original transaction
            const { data: originalTransaction } = await supabase
                .from('intercompany_transactions')
                .select('*')
                .eq('id', originalTransactionId)
                .single()

            if (!originalTransaction) {
                return { success: false, error: 'Original transaction not found' }
            }

            if (originalTransaction.status !== 'Approved') {
                return { success: false, error: 'Can only reverse approved transactions' }
            }

            // Create reversal transaction (swap from/to companies)
            const reversalTransaction = {
                from_company_id: originalTransaction.to_company_id,
                to_company_id: originalTransaction.from_company_id,
                transaction_type: originalTransaction.transaction_type,
                amount: originalTransaction.amount,
                currency: originalTransaction.currency,
                description: `Reversal of ${originalTransaction.transaction_no}`,
                status: 'Draft' as IntercompanyStatus,
                posting_date: reversalDate,
                created_by: createdBy
            }

            const result = await this.createIntercompanyTransaction(reversalTransaction)

            if (!result.success) {
                return result
            }

            return {
                success: true,
                reversalTransaction: result.transaction
            }
        } catch (error) {
            console.error('Error creating intercompany reversal:', error)
            return { success: false, error: 'Failed to create intercompany reversal' }
        }
    }

    /**
     * Get intercompany account setup status
     */
    static async getIntercompanyAccountStatus(
        companyId: string
    ): Promise<{
        success: boolean
        accounts?: IntercompanyAccount[]
        isSetupComplete?: boolean
        error?: string
    }> {
        try {
            const { data: accounts, error } = await supabase
                .from('intercompany_accounts')
                .select(`
          *,
          account:accounts(name, account_code, account_type)
        `)
                .eq('company_id', companyId)
                .eq('is_active', true)

            if (error) throw error

            const requiredTypes = ['Receivable', 'Payable', 'Transfer']
            const existingTypes = accounts?.map(a => a.account_type) || []
            const isSetupComplete = requiredTypes.every(type => existingTypes.includes(type))

            return {
                success: true,
                accounts: accounts || [],
                isSetupComplete
            }
        } catch (error) {
            console.error('Error checking intercompany account status:', error)
            return { success: false, error: 'Failed to check intercompany account status' }
        }
    }

    /**
     * Setup intercompany accounts for a company
     */
    static async setupIntercompanyAccounts(
        companyId: string
    ): Promise<{
        success: boolean
        accounts?: IntercompanyAccount[]
        error?: string
    }> {
        try {
            // Check if already setup
            const statusResult = await this.getIntercompanyAccountStatus(companyId)
            if (statusResult.success && statusResult.isSetupComplete) {
                return { success: true, accounts: statusResult.accounts }
            }

            // Create intercompany accounts
            const accountTypes = [
                { name: 'Intercompany Receivable', type: 'Asset', code: '1200', account_type: 'Receivable' },
                { name: 'Intercompany Payable', type: 'Liability', code: '2200', account_type: 'Payable' },
                { name: 'Intercompany Transfer', type: 'Equity', code: '3200', account_type: 'Transfer' }
            ]

            const createdAccounts = []

            for (const accountData of accountTypes) {
                // Create account
                const { data: account } = await supabase
                    .from('accounts')
                    .insert([{
                        company_id: companyId,
                        name: accountData.name,
                        account_type: accountData.type,
                        account_code: accountData.code,
                        is_group: false,
                        is_active: true
                    }])
                    .select()
                    .single()

                if (account) {
                    // Link to intercompany accounts
                    const { data: intercompanyAccount } = await supabase
                        .from('intercompany_accounts')
                        .insert([{
                            company_id: companyId,
                            account_id: account.id,
                            account_type: accountData.account_type,
                            is_active: true
                        }])
                        .select()
                        .single()

                    if (intercompanyAccount) {
                        createdAccounts.push(intercompanyAccount)
                    }
                }
            }

            return { success: true, accounts: createdAccounts }
        } catch (error) {
            console.error('Error setting up intercompany accounts:', error)
            return { success: false, error: 'Failed to setup intercompany accounts' }
        }
    }
}
