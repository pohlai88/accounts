/**
 * Data Seeding Service
 * Creates default chart of accounts and sample data for new companies
 */

import { supabase } from './supabase'

export interface ChartOfAccountsTemplate {
    name: string
    account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'
    account_code: string
    parent_code?: string
    is_group: boolean
    description?: string
}

export class DataSeedingService {
    /**
     * Default Chart of Accounts Template (Based on ERPNext/Standard Accounting)
     */
    private static getDefaultChartOfAccounts(): ChartOfAccountsTemplate[] {
        return [
            // ASSETS
            { name: 'Assets', account_type: 'Asset', account_code: '1000', is_group: true },
            { name: 'Current Assets', account_type: 'Asset', account_code: '1100', parent_code: '1000', is_group: true },
            { name: 'Cash and Bank', account_type: 'Asset', account_code: '1110', parent_code: '1100', is_group: true },
            { name: 'Cash', account_type: 'Asset', account_code: '1111', parent_code: '1110', is_group: false },
            { name: 'Bank Account', account_type: 'Asset', account_code: '1112', parent_code: '1110', is_group: false },
            { name: 'Petty Cash', account_type: 'Asset', account_code: '1113', parent_code: '1110', is_group: false },

            { name: 'Accounts Receivable', account_type: 'Asset', account_code: '1120', parent_code: '1100', is_group: true },
            { name: 'Debtors', account_type: 'Asset', account_code: '1121', parent_code: '1120', is_group: false },
            { name: 'Allowance for Doubtful Accounts', account_type: 'Asset', account_code: '1122', parent_code: '1120', is_group: false },

            { name: 'Inventory', account_type: 'Asset', account_code: '1130', parent_code: '1100', is_group: true },
            { name: 'Stock in Hand', account_type: 'Asset', account_code: '1131', parent_code: '1130', is_group: false },
            { name: 'Work in Progress', account_type: 'Asset', account_code: '1132', parent_code: '1130', is_group: false },

            { name: 'Prepaid Expenses', account_type: 'Asset', account_code: '1140', parent_code: '1100', is_group: true },
            { name: 'Prepaid Insurance', account_type: 'Asset', account_code: '1141', parent_code: '1140', is_group: false },
            { name: 'Prepaid Rent', account_type: 'Asset', account_code: '1142', parent_code: '1140', is_group: false },

            { name: 'Fixed Assets', account_type: 'Asset', account_code: '1200', parent_code: '1000', is_group: true },
            { name: 'Property, Plant & Equipment', account_type: 'Asset', account_code: '1210', parent_code: '1200', is_group: true },
            { name: 'Land', account_type: 'Asset', account_code: '1211', parent_code: '1210', is_group: false },
            { name: 'Buildings', account_type: 'Asset', account_code: '1212', parent_code: '1210', is_group: false },
            { name: 'Equipment', account_type: 'Asset', account_code: '1213', parent_code: '1210', is_group: false },
            { name: 'Furniture and Fixtures', account_type: 'Asset', account_code: '1214', parent_code: '1210', is_group: false },
            { name: 'Vehicles', account_type: 'Asset', account_code: '1215', parent_code: '1210', is_group: false },

            { name: 'Accumulated Depreciation', account_type: 'Asset', account_code: '1220', parent_code: '1200', is_group: true },
            { name: 'Accumulated Depreciation - Buildings', account_type: 'Asset', account_code: '1221', parent_code: '1220', is_group: false },
            { name: 'Accumulated Depreciation - Equipment', account_type: 'Asset', account_code: '1222', parent_code: '1220', is_group: false },

            // LIABILITIES
            { name: 'Liabilities', account_type: 'Liability', account_code: '2000', is_group: true },
            { name: 'Current Liabilities', account_type: 'Liability', account_code: '2100', parent_code: '2000', is_group: true },
            { name: 'Accounts Payable', account_type: 'Liability', account_code: '2110', parent_code: '2100', is_group: true },
            { name: 'Creditors', account_type: 'Liability', account_code: '2111', parent_code: '2110', is_group: false },
            { name: 'Accrued Expenses', account_type: 'Liability', account_code: '2112', parent_code: '2110', is_group: false },

            { name: 'Tax Liabilities', account_type: 'Liability', account_code: '2120', parent_code: '2100', is_group: true },
            { name: 'Sales Tax Payable', account_type: 'Liability', account_code: '2121', parent_code: '2120', is_group: false },
            { name: 'Income Tax Payable', account_type: 'Liability', account_code: '2122', parent_code: '2120', is_group: false },

            { name: 'Short-term Loans', account_type: 'Liability', account_code: '2130', parent_code: '2100', is_group: true },
            { name: 'Bank Overdraft', account_type: 'Liability', account_code: '2131', parent_code: '2130', is_group: false },
            { name: 'Credit Card Payable', account_type: 'Liability', account_code: '2132', parent_code: '2130', is_group: false },

            { name: 'Long-term Liabilities', account_type: 'Liability', account_code: '2200', parent_code: '2000', is_group: true },
            { name: 'Long-term Loans', account_type: 'Liability', account_code: '2210', parent_code: '2200', is_group: false },
            { name: 'Mortgage Payable', account_type: 'Liability', account_code: '2220', parent_code: '2200', is_group: false },

            // EQUITY
            { name: 'Equity', account_type: 'Equity', account_code: '3000', is_group: true },
            { name: 'Share Capital', account_type: 'Equity', account_code: '3100', parent_code: '3000', is_group: false },
            { name: 'Retained Earnings', account_type: 'Equity', account_code: '3200', parent_code: '3000', is_group: false },
            { name: 'Current Year Earnings', account_type: 'Equity', account_code: '3300', parent_code: '3000', is_group: false },
            { name: 'Owner\'s Equity', account_type: 'Equity', account_code: '3400', parent_code: '3000', is_group: false },

            // INCOME
            { name: 'Income', account_type: 'Income', account_code: '4000', is_group: true },
            { name: 'Sales Revenue', account_type: 'Income', account_code: '4100', parent_code: '4000', is_group: true },
            { name: 'Product Sales', account_type: 'Income', account_code: '4110', parent_code: '4100', is_group: false },
            { name: 'Service Revenue', account_type: 'Income', account_code: '4120', parent_code: '4100', is_group: false },
            { name: 'Consulting Revenue', account_type: 'Income', account_code: '4130', parent_code: '4100', is_group: false },

            { name: 'Other Income', account_type: 'Income', account_code: '4200', parent_code: '4000', is_group: true },
            { name: 'Interest Income', account_type: 'Income', account_code: '4210', parent_code: '4200', is_group: false },
            { name: 'Rental Income', account_type: 'Income', account_code: '4220', parent_code: '4200', is_group: false },
            { name: 'Gain on Sale of Assets', account_type: 'Income', account_code: '4230', parent_code: '4200', is_group: false },

            // EXPENSES
            { name: 'Expenses', account_type: 'Expense', account_code: '5000', is_group: true },
            { name: 'Cost of Goods Sold', account_type: 'Expense', account_code: '5100', parent_code: '5000', is_group: true },
            { name: 'Material Cost', account_type: 'Expense', account_code: '5110', parent_code: '5100', is_group: false },
            { name: 'Labor Cost', account_type: 'Expense', account_code: '5120', parent_code: '5100', is_group: false },
            { name: 'Manufacturing Overhead', account_type: 'Expense', account_code: '5130', parent_code: '5100', is_group: false },

            { name: 'Operating Expenses', account_type: 'Expense', account_code: '5200', parent_code: '5000', is_group: true },
            { name: 'Salaries and Wages', account_type: 'Expense', account_code: '5210', parent_code: '5200', is_group: false },
            { name: 'Employee Benefits', account_type: 'Expense', account_code: '5220', parent_code: '5200', is_group: false },
            { name: 'Rent Expense', account_type: 'Expense', account_code: '5230', parent_code: '5200', is_group: false },
            { name: 'Utilities', account_type: 'Expense', account_code: '5240', parent_code: '5200', is_group: false },
            { name: 'Office Supplies', account_type: 'Expense', account_code: '5250', parent_code: '5200', is_group: false },
            { name: 'Marketing and Advertising', account_type: 'Expense', account_code: '5260', parent_code: '5200', is_group: false },
            { name: 'Professional Fees', account_type: 'Expense', account_code: '5270', parent_code: '5200', is_group: false },
            { name: 'Insurance Expense', account_type: 'Expense', account_code: '5280', parent_code: '5200', is_group: false },
            { name: 'Travel and Entertainment', account_type: 'Expense', account_code: '5290', parent_code: '5200', is_group: false },

            { name: 'Administrative Expenses', account_type: 'Expense', account_code: '5300', parent_code: '5000', is_group: true },
            { name: 'Depreciation Expense', account_type: 'Expense', account_code: '5310', parent_code: '5300', is_group: false },
            { name: 'Bad Debt Expense', account_type: 'Expense', account_code: '5320', parent_code: '5300', is_group: false },
            { name: 'Bank Charges', account_type: 'Expense', account_code: '5330', parent_code: '5300', is_group: false },
            { name: 'Interest Expense', account_type: 'Expense', account_code: '5340', parent_code: '5300', is_group: false },
            { name: 'Tax Expense', account_type: 'Expense', account_code: '5350', parent_code: '5300', is_group: false },
        ]
    }

    /**
     * Seed chart of accounts for a new company
     */
    static async seedChartOfAccounts(companyId: string): Promise<void> {
        const template = this.getDefaultChartOfAccounts()
        const accountMap = new Map<string, string>() // code -> id mapping

        try {
            // First pass: Create all accounts
            for (const account of template) {
                const { data, error } = await supabase
                    .from('accounts')
                    .insert({
                        name: account.name,
                        account_type: account.account_type,
                        account_code: account.account_code,
                        company_id: companyId,
                        is_group: account.is_group,
                        is_active: true,
                        currency: 'USD', // Default currency, should be company's default
                    })
                    .select('id')
                    .single()

                if (error) {
                    console.error(`Error creating account ${account.name}:`, error)
                    continue
                }

                accountMap.set(account.account_code, data.id)
            }

            // Second pass: Update parent relationships
            for (const account of template) {
                if (account.parent_code) {
                    const accountId = accountMap.get(account.account_code)
                    const parentId = accountMap.get(account.parent_code)

                    if (accountId && parentId) {
                        const { error } = await supabase
                            .from('accounts')
                            .update({ parent_id: parentId })
                            .eq('id', accountId)

                        if (error) {
                            console.error(`Error updating parent for ${account.name}:`, error)
                        }
                    }
                }
            }

            console.log(`Successfully seeded chart of accounts for company ${companyId}`)
        } catch (error) {
            console.error('Error seeding chart of accounts:', error)
            throw error
        }
    }

    /**
     * Create sample customer data
     */
    static async seedSampleCustomers(companyId: string): Promise<void> {
        const sampleCustomers = [
            {
                customer_name: 'ABC Corporation',
                customer_code: 'CUST-001',
                customer_type: 'Company',
                email: 'billing@abccorp.com',
                phone: '+1-555-0123',
                credit_limit: 50000,
                credit_days: 30,
                payment_terms: 'Net 30',
                company_id: companyId,
            },
            {
                customer_name: 'XYZ Industries',
                customer_code: 'CUST-002',
                customer_type: 'Company',
                email: 'accounts@xyzind.com',
                phone: '+1-555-0456',
                credit_limit: 75000,
                credit_days: 45,
                payment_terms: 'Net 45',
                company_id: companyId,
            },
            {
                customer_name: 'John Smith',
                customer_code: 'CUST-003',
                customer_type: 'Individual',
                email: 'john.smith@email.com',
                phone: '+1-555-0789',
                credit_limit: 10000,
                credit_days: 15,
                payment_terms: 'Net 15',
                company_id: companyId,
            },
        ]

        try {
            const { error } = await supabase
                .from('customers')
                .insert(sampleCustomers)

            if (error) {
                console.error('Error seeding sample customers:', error)
                throw error
            }

            console.log(`Successfully seeded sample customers for company ${companyId}`)
        } catch (error) {
            console.error('Error seeding sample customers:', error)
            throw error
        }
    }

    /**
     * Create sample supplier data
     */
    static async seedSampleSuppliers(companyId: string): Promise<void> {
        const sampleSuppliers = [
            {
                supplier_name: 'Office Supplies Inc.',
                supplier_code: 'SUPP-001',
                supplier_type: 'Company',
                email: 'orders@officesupplies.com',
                phone: '+1-555-1111',
                payment_terms: 'Net 30',
                default_payment_days: 30,
                company_id: companyId,
            },
            {
                supplier_name: 'Tech Solutions Ltd.',
                supplier_code: 'SUPP-002',
                supplier_type: 'Company',
                email: 'billing@techsolutions.com',
                phone: '+1-555-2222',
                payment_terms: 'Net 15',
                default_payment_days: 15,
                company_id: companyId,
            },
        ]

        try {
            const { error } = await supabase
                .from('suppliers')
                .insert(sampleSuppliers)

            if (error) {
                console.error('Error seeding sample suppliers:', error)
                throw error
            }

            console.log(`Successfully seeded sample suppliers for company ${companyId}`)
        } catch (error) {
            console.error('Error seeding sample suppliers:', error)
            throw error
        }
    }

    /**
     * Complete company setup with all initial data
     */
    static async setupNewCompany(companyId: string): Promise<void> {
        try {
            console.log(`Setting up new company: ${companyId}`)

            // Seed chart of accounts
            await this.seedChartOfAccounts(companyId)

            // Seed sample customers
            await this.seedSampleCustomers(companyId)

            // Seed sample suppliers
            await this.seedSampleSuppliers(companyId)

            console.log(`Company setup completed successfully: ${companyId}`)
        } catch (error) {
            console.error('Error setting up new company:', error)
            throw error
        }
    }

    /**
     * Check if company has been initialized
     */
    static async isCompanyInitialized(companyId: string): Promise<boolean> {
        try {
            const { data, error } = await supabase
                .from('accounts')
                .select('id')
                .eq('company_id', companyId)
                .limit(1)

            if (error) {
                console.error('Error checking company initialization:', error)
                return false
            }

            return (data && data.length > 0)
        } catch (error) {
            console.error('Error checking company initialization:', error)
            return false
        }
    }
}
