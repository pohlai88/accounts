/**
 * Intelligent Numbering System
 * Based on competitor analysis (ERPNext, Odoo, QuickBooks)
 */

import { supabase } from './supabase'
import type { AccountType, VoucherType } from './supabase'

/**
 * Account Code Intelligence
 * Based on standard accounting practices
 */
export const ACCOUNT_CODE_RANGES = {
    'Asset': { start: 1000, end: 1999, prefix: '1' },
    'Liability': { start: 2000, end: 2999, prefix: '2' },
    'Equity': { start: 3000, end: 3999, prefix: '3' },
    'Income': { start: 4000, end: 4999, prefix: '4' },
    'Expense': { start: 5000, end: 5999, prefix: '5' }
} as const

/**
 * Sub-account ranges within each type
 */
export const SUB_ACCOUNT_RANGES = {
    'Asset': {
        'Current Assets': { start: 1100, end: 1499 },
        'Fixed Assets': { start: 1500, end: 1799 },
        'Other Assets': { start: 1800, end: 1999 }
    },
    'Liability': {
        'Current Liabilities': { start: 2100, end: 2499 },
        'Long-term Liabilities': { start: 2500, end: 2799 },
        'Other Liabilities': { start: 2800, end: 2999 }
    },
    'Equity': {
        'Owner Equity': { start: 3100, end: 3499 },
        'Retained Earnings': { start: 3500, end: 3799 },
        'Other Equity': { start: 3800, end: 3999 }
    },
    'Income': {
        'Operating Revenue': { start: 4100, end: 4499 },
        'Other Income': { start: 4500, end: 4999 }
    },
    'Expense': {
        'Cost of Goods Sold': { start: 5100, end: 5199 },
        'Operating Expenses': { start: 5200, end: 5799 },
        'Other Expenses': { start: 5800, end: 5999 }
    }
} as const

/**
 * Document numbering sequences
 */
export interface NumberingSequence {
    id: string
    company_id: string
    document_type: VoucherType
    prefix: string
    current_number: number
    padding: number
    format: string // e.g., "{PREFIX}-{COMPANY_CODE}-{YEAR}-{SEQUENCE}"
    created_at: string
    updated_at: string
}

/**
 * Account Code Generator
 */
export class AccountCodeGenerator {
    /**
     * Suggest next available account code for a given type
     */
    static async suggestAccountCode(
        companyId: string,
        accountType: AccountType,
        parentCode?: string
    ): Promise<string> {
        const range = ACCOUNT_CODE_RANGES[accountType]

        // If parent code exists, suggest next in sequence
        if (parentCode) {
            const parentCodeNum = parseInt(parentCode)
            if (!isNaN(parentCodeNum)) {
                // Find next available code after parent
                const nextCode = await this.findNextAvailableCode(companyId, parentCodeNum + 1, range.end)
                return nextCode.toString()
            }
        }

        // Find first available code in range
        const nextCode = await this.findNextAvailableCode(companyId, range.start, range.end)
        return nextCode.toString()
    }

    /**
     * Validate account code follows standard patterns
     */
    static validateAccountCode(accountType: AccountType, accountCode: string): {
        valid: boolean
        message?: string
    } {
        const code = parseInt(accountCode)
        const range = ACCOUNT_CODE_RANGES[accountType]

        if (isNaN(code)) {
            return { valid: false, message: 'Account code must be numeric' }
        }

        if (code < range.start || code > range.end) {
            return {
                valid: false,
                message: `${accountType} accounts should be between ${range.start}-${range.end}`
            }
        }

        return { valid: true }
    }

    /**
     * Get smart suggestions for account codes
     */
    static getAccountCodeSuggestions(accountType: AccountType): {
        range: string
        examples: { code: string; name: string }[]
    } {
        const range = ACCOUNT_CODE_RANGES[accountType]
        const examples = this.getExampleCodes(accountType)

        return {
            range: `${range.start}-${range.end}`,
            examples
        }
    }

    private static async findNextAvailableCode(
        companyId: string,
        start: number,
        end: number
    ): Promise<number> {
        // Get existing codes in range
        const { data: existingCodes } = await supabase
            .from('accounts')
            .select('account_code')
            .eq('company_id', companyId)
            .gte('account_code', start.toString())
            .lte('account_code', end.toString())
            .order('account_code')

        const usedCodes = new Set(
            (existingCodes || [])
                .map(row => parseInt(row.account_code || '0'))
                .filter(code => !isNaN(code))
        )

        // Find first available code
        for (let code = start; code <= end; code++) {
            if (!usedCodes.has(code)) {
                return code
            }
        }

        // If no codes available, return end + 1 (will be caught by validation)
        return end + 1
    }

    private static getExampleCodes(accountType: AccountType): { code: string; name: string }[] {
        const examples = {
            'Asset': [
                { code: '1110', name: 'Cash' },
                { code: '1120', name: 'Bank Account' },
                { code: '1200', name: 'Accounts Receivable' },
                { code: '1510', name: 'Equipment' }
            ],
            'Liability': [
                { code: '2110', name: 'Accounts Payable' },
                { code: '2120', name: 'Sales Tax Payable' },
                { code: '2210', name: 'Long-term Debt' }
            ],
            'Equity': [
                { code: '3100', name: 'Owner Equity' },
                { code: '3200', name: 'Retained Earnings' }
            ],
            'Income': [
                { code: '4100', name: 'Sales Revenue' },
                { code: '4200', name: 'Service Revenue' }
            ],
            'Expense': [
                { code: '5100', name: 'Cost of Goods Sold' },
                { code: '5210', name: 'Rent Expense' },
                { code: '5220', name: 'Utilities Expense' }
            ]
        }

        return examples[accountType] || []
    }
}

/**
 * Document Numbering System
 */
export class DocumentNumberGenerator {
    /**
     * Generate next document number
     * Format: PREFIX-COMPANY_CODE-YEAR-SEQUENCE
     * Example: SINV-ACME-2024-00001
     */
    static async generateDocumentNumber(
        companyId: string,
        voucherType: VoucherType,
        companyCode?: string
    ): Promise<string> {
        const prefix = this.getDocumentPrefix(voucherType)
        const year = new Date().getFullYear()
        const company = companyCode || 'COMP'

        // Get or create sequence
        const sequence = await this.getNextSequence(companyId, voucherType, year)

        // Format: PREFIX-COMPANY-YEAR-SEQUENCE
        return `${prefix}-${company}-${year}-${sequence.toString().padStart(5, '0')}`
    }

    /**
     * Get document prefix based on type
     */
    private static getDocumentPrefix(voucherType: VoucherType): string {
        const prefixes = {
            'Sales Invoice': 'SINV',
            'Purchase Invoice': 'PINV',
            'Payment Entry': 'PAY',
            'Journal Entry': 'JE'
        }
        return prefixes[voucherType] || 'DOC'
    }

    /**
     * Get next sequence number for document type
     */
    private static async getNextSequence(
        companyId: string,
        voucherType: VoucherType,
        year: number
    ): Promise<number> {
        // For now, use a simple approach with database sequence
        // In production, this should be handled with proper sequence tables

        // Count existing documents of this type for this year
        const { count } = await supabase
            .from('gl_entries')
            .select('*', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .eq('voucher_type', voucherType)
            .gte('posting_date', `${year}-01-01`)
            .lt('posting_date', `${year + 1}-01-01`)

        return (count || 0) + 1
    }

    /**
     * Validate document number format
     */
    static validateDocumentNumber(documentNumber: string): {
        valid: boolean
        parts?: {
            prefix: string
            company: string
            year: string
            sequence: string
        }
        message?: string
    } {
        const parts = documentNumber.split('-')

        if (parts.length !== 4) {
            return {
                valid: false,
                message: 'Document number should have format: PREFIX-COMPANY-YEAR-SEQUENCE'
            }
        }

        const [prefix, company, year, sequence] = parts

        // Validate year
        const yearNum = parseInt(year)
        const currentYear = new Date().getFullYear()
        if (isNaN(yearNum) || yearNum < 2000 || yearNum > currentYear + 1) {
            return { valid: false, message: 'Invalid year in document number' }
        }

        // Validate sequence
        const seqNum = parseInt(sequence)
        if (isNaN(seqNum) || seqNum < 1) {
            return { valid: false, message: 'Invalid sequence number' }
        }

        return {
            valid: true,
            parts: { prefix, company, year, sequence }
        }
    }
}

/**
 * Company Code Generator
 */
export class CompanyCodeGenerator {
    /**
     * Generate company code from company name
     */
    static generateCompanyCode(companyName: string): string {
        return companyName
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '')
            .substring(0, 4)
            .padEnd(4, 'X')
    }

    /**
     * Validate company code format
     */
    static validateCompanyCode(code: string): {
        valid: boolean
        message?: string
    } {
        if (!/^[A-Z0-9]{3,4}$/.test(code)) {
            return {
                valid: false,
                message: 'Company code should be 3-4 uppercase letters/numbers'
            }
        }

        return { valid: true }
    }
}
