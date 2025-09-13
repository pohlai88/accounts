/**
 * Bank Reconciliation Service
 * Handles bank statement reconciliation with accounting records
 */

import { supabase } from './supabase'

export type BankAccountType = 'Checking' | 'Savings' | 'Money Market' | 'Credit Card'
export type MatchType = 'Exact' | 'Partial' | 'Manual'
export type RuleType = 'Description' | 'Amount' | 'Date' | 'Reference'

export interface BankAccount {
    id: string
    companyId: string
    accountId: string // Links to Chart of Accounts
    bankName: string
    accountNumber: string
    accountType: BankAccountType
    currency: string
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface BankStatement {
    id: string
    bankAccountId: string
    statementDate: string
    openingBalance: number
    closingBalance: number
    totalDeposits: number
    totalWithdrawals: number
    isReconciled: boolean
    reconciledAt?: string
    reconciledBy?: string
    createdAt: string
    updatedAt: string
}

export interface BankStatementItem {
    id: string
    statementId: string
    transactionDate: string
    description: string
    referenceNumber?: string
    amount: number
    balanceAfter: number
    isReconciled: boolean
    reconciledGlEntryId?: string
    reconciledAt?: string
    reconciledBy?: string
    createdAt: string
    updatedAt: string
}

export interface ReconciliationMatch {
    id: string
    statementItemId: string
    glEntryId: string
    matchType: MatchType
    matchAmount: number
    matchConfidence: number
    createdAt: string
    createdBy?: string
}

export interface ReconciliationRule {
    id: string
    companyId: string
    ruleName: string
    ruleType: RuleType
    rulePattern: string
    targetAccountId: string
    isActive: boolean
    priority: number
    createdAt: string
    updatedAt: string
}

export interface CreateBankAccountInput {
    companyId: string
    accountId: string
    bankName: string
    accountNumber: string
    accountType: BankAccountType
    currency?: string
}

export interface CreateBankStatementInput {
    bankAccountId: string
    statementDate: string
    openingBalance: number
    closingBalance: number
}

export interface CreateBankStatementItemInput {
    statementId: string
    transactionDate: string
    description: string
    referenceNumber?: string
    amount: number
    balanceAfter: number
}

export interface PotentialMatch {
    glEntryId: string
    matchConfidence: number
    matchReason: string
}

export class BankReconciliationService {
    /**
     * Create a new bank account
     */
    static async createBankAccount(input: CreateBankAccountInput): Promise<{ success: boolean; account?: BankAccount; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('bank_accounts')
                .insert({
                    company_id: input.companyId,
                    account_id: input.accountId,
                    bank_name: input.bankName,
                    account_number: input.accountNumber,
                    account_type: input.accountType,
                    currency: input.currency || 'USD'
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating bank account:', error)
                return { success: false, error: 'Failed to create bank account' }
            }

            const account: BankAccount = {
                id: data.id,
                companyId: data.company_id,
                accountId: data.account_id,
                bankName: data.bank_name,
                accountNumber: data.account_number,
                accountType: data.account_type,
                currency: data.currency,
                isActive: data.is_active,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            }

            return { success: true, account }
        } catch (error) {
            console.error('Error creating bank account:', error)
            return { success: false, error: 'Failed to create bank account' }
        }
    }

    /**
     * Get all bank accounts for a company
     */
    static async getBankAccounts(companyId: string): Promise<{ success: boolean; accounts?: BankAccount[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('bank_accounts')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Error fetching bank accounts:', error)
                return { success: false, error: 'Failed to fetch bank accounts' }
            }

            const accounts: BankAccount[] = data.map(item => ({
                id: item.id,
                companyId: item.company_id,
                accountId: item.account_id,
                bankName: item.bank_name,
                accountNumber: item.account_number,
                accountType: item.account_type,
                currency: item.currency,
                isActive: item.is_active,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }))

            return { success: true, accounts }
        } catch (error) {
            console.error('Error fetching bank accounts:', error)
            return { success: false, error: 'Failed to fetch bank accounts' }
        }
    }

    /**
     * Create a new bank statement
     */
    static async createBankStatement(input: CreateBankStatementInput): Promise<{ success: boolean; statement?: BankStatement; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('bank_statements')
                .insert({
                    bank_account_id: input.bankAccountId,
                    statement_date: input.statementDate,
                    opening_balance: input.openingBalance,
                    closing_balance: input.closingBalance
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating bank statement:', error)
                return { success: false, error: 'Failed to create bank statement' }
            }

            const statement: BankStatement = {
                id: data.id,
                bankAccountId: data.bank_account_id,
                statementDate: data.statement_date,
                openingBalance: data.opening_balance,
                closingBalance: data.closing_balance,
                totalDeposits: data.total_deposits,
                totalWithdrawals: data.total_withdrawals,
                isReconciled: data.is_reconciled,
                reconciledAt: data.reconciled_at,
                reconciledBy: data.reconciled_by,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            }

            return { success: true, statement }
        } catch (error) {
            console.error('Error creating bank statement:', error)
            return { success: false, error: 'Failed to create bank statement' }
        }
    }

    /**
     * Add items to a bank statement
     */
    static async addStatementItems(statementId: string, items: CreateBankStatementItemInput[]): Promise<{ success: boolean; error?: string }> {
        try {
            const { error } = await supabase
                .from('bank_statement_items')
                .insert(items.map(item => ({
                    statement_id: statementId,
                    transaction_date: item.transactionDate,
                    description: item.description,
                    reference_number: item.referenceNumber,
                    amount: item.amount,
                    balance_after: item.balanceAfter
                })))

            if (error) {
                console.error('Error adding statement items:', error)
                return { success: false, error: 'Failed to add statement items' }
            }

            return { success: true }
        } catch (error) {
            console.error('Error adding statement items:', error)
            return { success: false, error: 'Failed to add statement items' }
        }
    }

    /**
     * Get statement items for reconciliation
     */
    static async getStatementItems(statementId: string): Promise<{ success: boolean; items?: BankStatementItem[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('bank_statement_items')
                .select('*')
                .eq('statement_id', statementId)
                .order('transaction_date', { ascending: true })

            if (error) {
                console.error('Error fetching statement items:', error)
                return { success: false, error: 'Failed to fetch statement items' }
            }

            const items: BankStatementItem[] = data.map(item => ({
                id: item.id,
                statementId: item.statement_id,
                transactionDate: item.transaction_date,
                description: item.description,
                referenceNumber: item.reference_number,
                amount: item.amount,
                balanceAfter: item.balance_after,
                isReconciled: item.is_reconciled,
                reconciledGlEntryId: item.reconciled_gl_entry_id,
                reconciledAt: item.reconciled_at,
                reconciledBy: item.reconciled_by,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }))

            return { success: true, items }
        } catch (error) {
            console.error('Error fetching statement items:', error)
            return { success: false, error: 'Failed to fetch statement items' }
        }
    }

    /**
     * Find potential matches for a statement item
     */
    static async findPotentialMatches(statementItemId: string, threshold: number = 80): Promise<{ success: boolean; matches?: PotentialMatch[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .rpc('find_potential_matches', {
                    statement_item_id: statementItemId,
                    match_threshold: threshold
                })

            if (error) {
                console.error('Error finding potential matches:', error)
                return { success: false, error: 'Failed to find potential matches' }
            }

            const matches: PotentialMatch[] = data.map(item => ({
                glEntryId: item.gl_entry_id,
                matchConfidence: item.match_confidence,
                matchReason: item.match_reason
            }))

            return { success: true, matches }
        } catch (error) {
            console.error('Error finding potential matches:', error)
            return { success: false, error: 'Failed to find potential matches' }
        }
    }

    /**
     * Create a reconciliation match
     */
    static async createMatch(
        statementItemId: string,
        glEntryId: string,
        matchType: MatchType,
        matchAmount: number,
        createdBy?: string
    ): Promise<{ success: boolean; matchId?: string; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('reconciliation_matches')
                .insert({
                    statement_item_id: statementItemId,
                    gl_entry_id: glEntryId,
                    match_type: matchType,
                    match_amount: matchAmount,
                    match_confidence: 100.00, // Manual matches have 100% confidence
                    created_by: createdBy
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating reconciliation match:', error)
                return { success: false, error: 'Failed to create reconciliation match' }
            }

            // Mark the statement item as reconciled
            const { error: updateError } = await supabase
                .from('bank_statement_items')
                .update({
                    is_reconciled: true,
                    reconciled_gl_entry_id: glEntryId,
                    reconciled_at: new Date().toISOString(),
                    reconciled_by: createdBy
                })
                .eq('id', statementItemId)

            if (updateError) {
                console.error('Error updating statement item:', updateError)
                return { success: false, error: 'Failed to update statement item' }
            }

            return { success: true, matchId: data.id }
        } catch (error) {
            console.error('Error creating reconciliation match:', error)
            return { success: false, error: 'Failed to create reconciliation match' }
        }
    }

    /**
     * Auto-reconcile statement items
     */
    static async autoReconcile(statementId: string): Promise<{ success: boolean; reconciledCount?: number; error?: string }> {
        try {
            const { data, error } = await supabase
                .rpc('auto_reconcile_statement_items', {
                    statement_id: statementId
                })

            if (error) {
                console.error('Error auto-reconciling statement items:', error)
                return { success: false, error: 'Failed to auto-reconcile statement items' }
            }

            return { success: true, reconciledCount: data }
        } catch (error) {
            console.error('Error auto-reconciling statement items:', error)
            return { success: false, error: 'Failed to auto-reconcile statement items' }
        }
    }

    /**
     * Get reconciliation summary for a statement
     */
    static async getReconciliationSummary(statementId: string): Promise<{ success: boolean; summary?: any; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('bank_statement_items')
                .select(`
          id,
          amount,
          is_reconciled,
          transaction_date
        `)
                .eq('statement_id', statementId)

            if (error) {
                console.error('Error fetching reconciliation summary:', error)
                return { success: false, error: 'Failed to fetch reconciliation summary' }
            }

            const totalItems = data.length
            const reconciledItems = data.filter(item => item.is_reconciled).length
            const unreconciledItems = totalItems - reconciledItems
            const totalAmount = data.reduce((sum, item) => sum + item.amount, 0)
            const reconciledAmount = data
                .filter(item => item.is_reconciled)
                .reduce((sum, item) => sum + item.amount, 0)
            const unreconciledAmount = totalAmount - reconciledAmount

            const summary = {
                totalItems,
                reconciledItems,
                unreconciledItems,
                totalAmount,
                reconciledAmount,
                unreconciledAmount,
                reconciliationPercentage: totalItems > 0 ? (reconciledItems / totalItems) * 100 : 0
            }

            return { success: true, summary }
        } catch (error) {
            console.error('Error fetching reconciliation summary:', error)
            return { success: false, error: 'Failed to fetch reconciliation summary' }
        }
    }

    /**
     * Create reconciliation rules
     */
    static async createReconciliationRule(
        companyId: string,
        ruleName: string,
        ruleType: RuleType,
        rulePattern: string,
        targetAccountId: string,
        priority: number = 0
    ): Promise<{ success: boolean; ruleId?: string; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('reconciliation_rules')
                .insert({
                    company_id: companyId,
                    rule_name: ruleName,
                    rule_type: ruleType,
                    rule_pattern: rulePattern,
                    target_account_id: targetAccountId,
                    priority: priority
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating reconciliation rule:', error)
                return { success: false, error: 'Failed to create reconciliation rule' }
            }

            return { success: true, ruleId: data.id }
        } catch (error) {
            console.error('Error creating reconciliation rule:', error)
            return { success: false, error: 'Failed to create reconciliation rule' }
        }
    }

    /**
     * Get reconciliation rules for a company
     */
    static async getReconciliationRules(companyId: string): Promise<{ success: boolean; rules?: ReconciliationRule[]; error?: string }> {
        try {
            const { data, error } = await supabase
                .from('reconciliation_rules')
                .select('*')
                .eq('company_id', companyId)
                .eq('is_active', true)
                .order('priority', { ascending: false })

            if (error) {
                console.error('Error fetching reconciliation rules:', error)
                return { success: false, error: 'Failed to fetch reconciliation rules' }
            }

            const rules: ReconciliationRule[] = data.map(item => ({
                id: item.id,
                companyId: item.company_id,
                ruleName: item.rule_name,
                ruleType: item.rule_type,
                rulePattern: item.rule_pattern,
                targetAccountId: item.target_account_id,
                isActive: item.is_active,
                priority: item.priority,
                createdAt: item.created_at,
                updatedAt: item.updated_at
            }))

            return { success: true, rules }
        } catch (error) {
            console.error('Error fetching reconciliation rules:', error)
            return { success: false, error: 'Failed to fetch reconciliation rules' }
        }
    }
}
