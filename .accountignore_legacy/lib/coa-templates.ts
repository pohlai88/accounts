/**
 * Chart of Accounts Templates by Industry
 * Based on competitor analysis (QuickBooks, Odoo, Zoho, ERPNext)
 */

export type IndustryType = 
  | 'general' 
  | 'retail' 
  | 'service' 
  | 'manufacturing' 
  | 'construction' 
  | 'professional'

export interface CoATemplate {
  industry: IndustryType
  name: string
  description: string
  accounts: CoAAccount[]
}

export interface CoAAccount {
  name: string
  account_type: 'Asset' | 'Liability' | 'Equity' | 'Income' | 'Expense'
  account_code: string
  parent_code?: string
  is_group: boolean
  description?: string
}

/**
 * Industry Templates - Based on QuickBooks and Odoo best practices
 */
export const COA_TEMPLATES: CoATemplate[] = [
  {
    industry: 'general',
    name: 'General Business',
    description: 'Standard chart of accounts for most businesses',
    accounts: [
      // Assets
      { name: 'Assets', account_type: 'Asset', account_code: '1000', is_group: true },
      { name: 'Current Assets', account_type: 'Asset', account_code: '1100', parent_code: '1000', is_group: true },
      { name: 'Cash', account_type: 'Asset', account_code: '1110', parent_code: '1100', is_group: false },
      { name: 'Bank Account', account_type: 'Asset', account_code: '1120', parent_code: '1100', is_group: false },
      { name: 'Accounts Receivable', account_type: 'Asset', account_code: '1200', parent_code: '1100', is_group: false },
      { name: 'Inventory', account_type: 'Asset', account_code: '1300', parent_code: '1100', is_group: false },
      { name: 'Prepaid Expenses', account_type: 'Asset', account_code: '1400', parent_code: '1100', is_group: false },
      
      { name: 'Fixed Assets', account_type: 'Asset', account_code: '1500', parent_code: '1000', is_group: true },
      { name: 'Equipment', account_type: 'Asset', account_code: '1510', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Equipment', account_type: 'Asset', account_code: '1515', parent_code: '1500', is_group: false },
      { name: 'Furniture & Fixtures', account_type: 'Asset', account_code: '1520', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Furniture', account_type: 'Asset', account_code: '1525', parent_code: '1500', is_group: false },

      // Liabilities
      { name: 'Liabilities', account_type: 'Liability', account_code: '2000', is_group: true },
      { name: 'Current Liabilities', account_type: 'Liability', account_code: '2100', parent_code: '2000', is_group: true },
      { name: 'Accounts Payable', account_type: 'Liability', account_code: '2110', parent_code: '2100', is_group: false },
      { name: 'Sales Tax Payable', account_type: 'Liability', account_code: '2120', parent_code: '2100', is_group: false },
      { name: 'Payroll Liabilities', account_type: 'Liability', account_code: '2130', parent_code: '2100', is_group: false },
      { name: 'Accrued Expenses', account_type: 'Liability', account_code: '2140', parent_code: '2100', is_group: false },

      { name: 'Long-term Liabilities', account_type: 'Liability', account_code: '2200', parent_code: '2000', is_group: true },
      { name: 'Long-term Debt', account_type: 'Liability', account_code: '2210', parent_code: '2200', is_group: false },

      // Equity
      { name: 'Equity', account_type: 'Equity', account_code: '3000', is_group: true },
      { name: 'Owner Equity', account_type: 'Equity', account_code: '3100', parent_code: '3000', is_group: false },
      { name: 'Retained Earnings', account_type: 'Equity', account_code: '3200', parent_code: '3000', is_group: false },

      // Income
      { name: 'Income', account_type: 'Income', account_code: '4000', is_group: true },
      { name: 'Sales Revenue', account_type: 'Income', account_code: '4100', parent_code: '4000', is_group: false },
      { name: 'Service Revenue', account_type: 'Income', account_code: '4200', parent_code: '4000', is_group: false },
      { name: 'Other Income', account_type: 'Income', account_code: '4900', parent_code: '4000', is_group: false },

      // Expenses
      { name: 'Expenses', account_type: 'Expense', account_code: '5000', is_group: true },
      { name: 'Cost of Goods Sold', account_type: 'Expense', account_code: '5100', parent_code: '5000', is_group: false },
      
      { name: 'Operating Expenses', account_type: 'Expense', account_code: '5200', parent_code: '5000', is_group: true },
      { name: 'Rent Expense', account_type: 'Expense', account_code: '5210', parent_code: '5200', is_group: false },
      { name: 'Utilities Expense', account_type: 'Expense', account_code: '5220', parent_code: '5200', is_group: false },
      { name: 'Office Supplies', account_type: 'Expense', account_code: '5230', parent_code: '5200', is_group: false },
      { name: 'Insurance Expense', account_type: 'Expense', account_code: '5240', parent_code: '5200', is_group: false },
      { name: 'Professional Services', account_type: 'Expense', account_code: '5250', parent_code: '5200', is_group: false },
      { name: 'Depreciation Expense', account_type: 'Expense', account_code: '5260', parent_code: '5200', is_group: false },
    ]
  },

  {
    industry: 'retail',
    name: 'Retail Business',
    description: 'Optimized for retail stores and e-commerce',
    accounts: [
      // Assets (Retail-specific)
      { name: 'Assets', account_type: 'Asset', account_code: '1000', is_group: true },
      { name: 'Current Assets', account_type: 'Asset', account_code: '1100', parent_code: '1000', is_group: true },
      { name: 'Cash', account_type: 'Asset', account_code: '1110', parent_code: '1100', is_group: false },
      { name: 'Petty Cash', account_type: 'Asset', account_code: '1115', parent_code: '1100', is_group: false },
      { name: 'Bank Account', account_type: 'Asset', account_code: '1120', parent_code: '1100', is_group: false },
      { name: 'Merchant Account Receivable', account_type: 'Asset', account_code: '1125', parent_code: '1100', is_group: false },
      { name: 'Accounts Receivable', account_type: 'Asset', account_code: '1200', parent_code: '1100', is_group: false },
      
      { name: 'Inventory', account_type: 'Asset', account_code: '1300', parent_code: '1100', is_group: true },
      { name: 'Finished Goods', account_type: 'Asset', account_code: '1310', parent_code: '1300', is_group: false },
      { name: 'Inventory Adjustment', account_type: 'Asset', account_code: '1315', parent_code: '1300', is_group: false },
      
      { name: 'Fixed Assets', account_type: 'Asset', account_code: '1500', parent_code: '1000', is_group: true },
      { name: 'Store Equipment', account_type: 'Asset', account_code: '1510', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Store Equipment', account_type: 'Asset', account_code: '1515', parent_code: '1500', is_group: false },
      { name: 'Point of Sale System', account_type: 'Asset', account_code: '1520', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - POS', account_type: 'Asset', account_code: '1525', parent_code: '1500', is_group: false },

      // Liabilities (Retail-specific)
      { name: 'Liabilities', account_type: 'Liability', account_code: '2000', is_group: true },
      { name: 'Current Liabilities', account_type: 'Liability', account_code: '2100', parent_code: '2000', is_group: true },
      { name: 'Accounts Payable', account_type: 'Liability', account_code: '2110', parent_code: '2100', is_group: false },
      { name: 'Sales Tax Payable', account_type: 'Liability', account_code: '2120', parent_code: '2100', is_group: false },
      { name: 'Gift Card Liability', account_type: 'Liability', account_code: '2130', parent_code: '2100', is_group: false },
      { name: 'Customer Deposits', account_type: 'Liability', account_code: '2140', parent_code: '2100', is_group: false },
      { name: 'Credit Card Processing Fees Payable', account_type: 'Liability', account_code: '2150', parent_code: '2100', is_group: false },

      // Equity
      { name: 'Equity', account_type: 'Equity', account_code: '3000', is_group: true },
      { name: 'Owner Equity', account_type: 'Equity', account_code: '3100', parent_code: '3000', is_group: false },
      { name: 'Retained Earnings', account_type: 'Equity', account_code: '3200', parent_code: '3000', is_group: false },

      // Income (Retail-specific)
      { name: 'Income', account_type: 'Income', account_code: '4000', is_group: true },
      { name: 'Sales Revenue', account_type: 'Income', account_code: '4100', parent_code: '4000', is_group: true },
      { name: 'In-Store Sales', account_type: 'Income', account_code: '4110', parent_code: '4100', is_group: false },
      { name: 'Online Sales', account_type: 'Income', account_code: '4120', parent_code: '4100', is_group: false },
      { name: 'Sales Returns', account_type: 'Income', account_code: '4130', parent_code: '4100', is_group: false },
      { name: 'Sales Discounts', account_type: 'Income', account_code: '4140', parent_code: '4100', is_group: false },
      { name: 'Shipping & Handling Income', account_type: 'Income', account_code: '4200', parent_code: '4000', is_group: false },

      // Expenses (Retail-specific)
      { name: 'Expenses', account_type: 'Expense', account_code: '5000', is_group: true },
      { name: 'Cost of Goods Sold', account_type: 'Expense', account_code: '5100', parent_code: '5000', is_group: true },
      { name: 'Product Costs', account_type: 'Expense', account_code: '5110', parent_code: '5100', is_group: false },
      { name: 'Freight & Shipping Costs', account_type: 'Expense', account_code: '5120', parent_code: '5100', is_group: false },
      { name: 'Inventory Shrinkage', account_type: 'Expense', account_code: '5130', parent_code: '5100', is_group: false },
      
      { name: 'Operating Expenses', account_type: 'Expense', account_code: '5200', parent_code: '5000', is_group: true },
      { name: 'Store Rent', account_type: 'Expense', account_code: '5210', parent_code: '5200', is_group: false },
      { name: 'Credit Card Processing Fees', account_type: 'Expense', account_code: '5220', parent_code: '5200', is_group: false },
      { name: 'Marketing & Advertising', account_type: 'Expense', account_code: '5230', parent_code: '5200', is_group: false },
      { name: 'Store Supplies', account_type: 'Expense', account_code: '5240', parent_code: '5200', is_group: false },
      { name: 'Utilities', account_type: 'Expense', account_code: '5250', parent_code: '5200', is_group: false },
      { name: 'Employee Wages', account_type: 'Expense', account_code: '5260', parent_code: '5200', is_group: false },
      { name: 'Depreciation Expense', account_type: 'Expense', account_code: '5270', parent_code: '5200', is_group: false },
    ]
  },

  {
    industry: 'service',
    name: 'Service Business',
    description: 'For consulting, professional services, and service providers',
    accounts: [
      // Assets (Service-focused)
      { name: 'Assets', account_type: 'Asset', account_code: '1000', is_group: true },
      { name: 'Current Assets', account_type: 'Asset', account_code: '1100', parent_code: '1000', is_group: true },
      { name: 'Cash', account_type: 'Asset', account_code: '1110', parent_code: '1100', is_group: false },
      { name: 'Bank Account', account_type: 'Asset', account_code: '1120', parent_code: '1100', is_group: false },
      { name: 'Accounts Receivable', account_type: 'Asset', account_code: '1200', parent_code: '1100', is_group: false },
      { name: 'Unbilled Revenue', account_type: 'Asset', account_code: '1210', parent_code: '1100', is_group: false },
      { name: 'Prepaid Expenses', account_type: 'Asset', account_code: '1300', parent_code: '1100', is_group: false },
      { name: 'Prepaid Insurance', account_type: 'Asset', account_code: '1310', parent_code: '1100', is_group: false },

      { name: 'Fixed Assets', account_type: 'Asset', account_code: '1500', parent_code: '1000', is_group: true },
      { name: 'Computer Equipment', account_type: 'Asset', account_code: '1510', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Computer Equipment', account_type: 'Asset', account_code: '1515', parent_code: '1500', is_group: false },
      { name: 'Office Furniture', account_type: 'Asset', account_code: '1520', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Office Furniture', account_type: 'Asset', account_code: '1525', parent_code: '1500', is_group: false },

      // Liabilities (Service-focused)
      { name: 'Liabilities', account_type: 'Liability', account_code: '2000', is_group: true },
      { name: 'Current Liabilities', account_type: 'Liability', account_code: '2100', parent_code: '2000', is_group: true },
      { name: 'Accounts Payable', account_type: 'Liability', account_code: '2110', parent_code: '2100', is_group: false },
      { name: 'Accrued Expenses', account_type: 'Liability', account_code: '2120', parent_code: '2100', is_group: false },
      { name: 'Deferred Revenue', account_type: 'Liability', account_code: '2130', parent_code: '2100', is_group: false },
      { name: 'Payroll Liabilities', account_type: 'Liability', account_code: '2140', parent_code: '2100', is_group: false },
      { name: 'Sales Tax Payable', account_type: 'Liability', account_code: '2150', parent_code: '2100', is_group: false },

      // Equity
      { name: 'Equity', account_type: 'Equity', account_code: '3000', is_group: true },
      { name: 'Owner Equity', account_type: 'Equity', account_code: '3100', parent_code: '3000', is_group: false },
      { name: 'Retained Earnings', account_type: 'Equity', account_code: '3200', parent_code: '3000', is_group: false },

      // Income (Service-focused)
      { name: 'Income', account_type: 'Income', account_code: '4000', is_group: true },
      { name: 'Service Revenue', account_type: 'Income', account_code: '4100', parent_code: '4000', is_group: true },
      { name: 'Consulting Revenue', account_type: 'Income', account_code: '4110', parent_code: '4100', is_group: false },
      { name: 'Professional Services', account_type: 'Income', account_code: '4120', parent_code: '4100', is_group: false },
      { name: 'Training Revenue', account_type: 'Income', account_code: '4130', parent_code: '4100', is_group: false },
      { name: 'Maintenance Revenue', account_type: 'Income', account_code: '4140', parent_code: '4100', is_group: false },
      { name: 'Other Income', account_type: 'Income', account_code: '4900', parent_code: '4000', is_group: false },

      // Expenses (Service-focused)
      { name: 'Expenses', account_type: 'Expense', account_code: '5000', is_group: true },
      { name: 'Direct Costs', account_type: 'Expense', account_code: '5100', parent_code: '5000', is_group: true },
      { name: 'Subcontractor Costs', account_type: 'Expense', account_code: '5110', parent_code: '5100', is_group: false },
      { name: 'Direct Labor', account_type: 'Expense', account_code: '5120', parent_code: '5100', is_group: false },
      { name: 'Project Materials', account_type: 'Expense', account_code: '5130', parent_code: '5100', is_group: false },

      { name: 'Operating Expenses', account_type: 'Expense', account_code: '5200', parent_code: '5000', is_group: true },
      { name: 'Office Rent', account_type: 'Expense', account_code: '5210', parent_code: '5200', is_group: false },
      { name: 'Professional Development', account_type: 'Expense', account_code: '5220', parent_code: '5200', is_group: false },
      { name: 'Software Subscriptions', account_type: 'Expense', account_code: '5230', parent_code: '5200', is_group: false },
      { name: 'Marketing & Business Development', account_type: 'Expense', account_code: '5240', parent_code: '5200', is_group: false },
      { name: 'Travel & Entertainment', account_type: 'Expense', account_code: '5250', parent_code: '5200', is_group: false },
      { name: 'Professional Services', account_type: 'Expense', account_code: '5260', parent_code: '5200', is_group: false },
      { name: 'Depreciation Expense', account_type: 'Expense', account_code: '5270', parent_code: '5200', is_group: false },
    ]
  },

  {
    industry: 'manufacturing',
    name: 'Manufacturing',
    description: 'For manufacturers with raw materials, work-in-process, and finished goods',
    accounts: [
      // Assets (Manufacturing-specific)
      { name: 'Assets', account_type: 'Asset', account_code: '1000', is_group: true },
      { name: 'Current Assets', account_type: 'Asset', account_code: '1100', parent_code: '1000', is_group: true },
      { name: 'Cash', account_type: 'Asset', account_code: '1110', parent_code: '1100', is_group: false },
      { name: 'Bank Account', account_type: 'Asset', account_code: '1120', parent_code: '1100', is_group: false },
      { name: 'Accounts Receivable', account_type: 'Asset', account_code: '1200', parent_code: '1100', is_group: false },

      { name: 'Inventory', account_type: 'Asset', account_code: '1300', parent_code: '1100', is_group: true },
      { name: 'Raw Materials', account_type: 'Asset', account_code: '1310', parent_code: '1300', is_group: false },
      { name: 'Work in Process', account_type: 'Asset', account_code: '1320', parent_code: '1300', is_group: false },
      { name: 'Finished Goods', account_type: 'Asset', account_code: '1330', parent_code: '1300', is_group: false },
      { name: 'Manufacturing Supplies', account_type: 'Asset', account_code: '1340', parent_code: '1300', is_group: false },

      { name: 'Fixed Assets', account_type: 'Asset', account_code: '1500', parent_code: '1000', is_group: true },
      { name: 'Manufacturing Equipment', account_type: 'Asset', account_code: '1510', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Manufacturing Equipment', account_type: 'Asset', account_code: '1515', parent_code: '1500', is_group: false },
      { name: 'Factory Building', account_type: 'Asset', account_code: '1520', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Building', account_type: 'Asset', account_code: '1525', parent_code: '1500', is_group: false },

      // Liabilities
      { name: 'Liabilities', account_type: 'Liability', account_code: '2000', is_group: true },
      { name: 'Current Liabilities', account_type: 'Liability', account_code: '2100', parent_code: '2000', is_group: true },
      { name: 'Accounts Payable', account_type: 'Liability', account_code: '2110', parent_code: '2100', is_group: false },
      { name: 'Accrued Wages', account_type: 'Liability', account_code: '2120', parent_code: '2100', is_group: false },
      { name: 'Manufacturing Overhead Payable', account_type: 'Liability', account_code: '2130', parent_code: '2100', is_group: false },

      // Equity
      { name: 'Equity', account_type: 'Equity', account_code: '3000', is_group: true },
      { name: 'Owner Equity', account_type: 'Equity', account_code: '3100', parent_code: '3000', is_group: false },
      { name: 'Retained Earnings', account_type: 'Equity', account_code: '3200', parent_code: '3000', is_group: false },

      // Income
      { name: 'Income', account_type: 'Income', account_code: '4000', is_group: true },
      { name: 'Sales Revenue', account_type: 'Income', account_code: '4100', parent_code: '4000', is_group: false },
      { name: 'Other Income', account_type: 'Income', account_code: '4900', parent_code: '4000', is_group: false },

      // Expenses (Manufacturing-specific)
      { name: 'Expenses', account_type: 'Expense', account_code: '5000', is_group: true },
      { name: 'Cost of Goods Sold', account_type: 'Expense', account_code: '5100', parent_code: '5000', is_group: true },
      { name: 'Raw Material Costs', account_type: 'Expense', account_code: '5110', parent_code: '5100', is_group: false },
      { name: 'Direct Labor', account_type: 'Expense', account_code: '5120', parent_code: '5100', is_group: false },
      { name: 'Manufacturing Overhead', account_type: 'Expense', account_code: '5130', parent_code: '5100', is_group: false },
      { name: 'Factory Utilities', account_type: 'Expense', account_code: '5140', parent_code: '5100', is_group: false },

      { name: 'Operating Expenses', account_type: 'Expense', account_code: '5200', parent_code: '5000', is_group: true },
      { name: 'Factory Rent', account_type: 'Expense', account_code: '5210', parent_code: '5200', is_group: false },
      { name: 'Equipment Maintenance', account_type: 'Expense', account_code: '5220', parent_code: '5200', is_group: false },
      { name: 'Quality Control', account_type: 'Expense', account_code: '5230', parent_code: '5200', is_group: false },
      { name: 'Depreciation Expense', account_type: 'Expense', account_code: '5240', parent_code: '5200', is_group: false },
    ]
  },

  {
    industry: 'professional',
    name: 'Professional Services',
    description: 'For lawyers, accountants, doctors, and other professionals',
    accounts: [
      // Assets
      { name: 'Assets', account_type: 'Asset', account_code: '1000', is_group: true },
      { name: 'Current Assets', account_type: 'Asset', account_code: '1100', parent_code: '1000', is_group: true },
      { name: 'Operating Account', account_type: 'Asset', account_code: '1110', parent_code: '1100', is_group: false },
      { name: 'Client Trust Account', account_type: 'Asset', account_code: '1115', parent_code: '1100', is_group: false },
      { name: 'Accounts Receivable', account_type: 'Asset', account_code: '1200', parent_code: '1100', is_group: false },
      { name: 'Unbilled Time & Expenses', account_type: 'Asset', account_code: '1210', parent_code: '1100', is_group: false },
      { name: 'Prepaid Professional Insurance', account_type: 'Asset', account_code: '1300', parent_code: '1100', is_group: false },

      { name: 'Fixed Assets', account_type: 'Asset', account_code: '1500', parent_code: '1000', is_group: true },
      { name: 'Office Equipment', account_type: 'Asset', account_code: '1510', parent_code: '1500', is_group: false },
      { name: 'Accumulated Depreciation - Office Equipment', account_type: 'Asset', account_code: '1515', parent_code: '1500', is_group: false },
      { name: 'Law Library', account_type: 'Asset', account_code: '1520', parent_code: '1500', is_group: false },

      // Liabilities
      { name: 'Liabilities', account_type: 'Liability', account_code: '2000', is_group: true },
      { name: 'Current Liabilities', account_type: 'Liability', account_code: '2100', parent_code: '2000', is_group: true },
      { name: 'Accounts Payable', account_type: 'Liability', account_code: '2110', parent_code: '2100', is_group: false },
      { name: 'Client Trust Liability', account_type: 'Liability', account_code: '2115', parent_code: '2100', is_group: false },
      { name: 'Professional Liability Insurance Payable', account_type: 'Liability', account_code: '2120', parent_code: '2100', is_group: false },
      { name: 'Deferred Revenue', account_type: 'Liability', account_code: '2130', parent_code: '2100', is_group: false },

      // Equity
      { name: 'Equity', account_type: 'Equity', account_code: '3000', is_group: true },
      { name: 'Partner Equity', account_type: 'Equity', account_code: '3100', parent_code: '3000', is_group: false },
      { name: 'Retained Earnings', account_type: 'Equity', account_code: '3200', parent_code: '3000', is_group: false },

      // Income
      { name: 'Income', account_type: 'Income', account_code: '4000', is_group: true },
      { name: 'Professional Fees', account_type: 'Income', account_code: '4100', parent_code: '4000', is_group: true },
      { name: 'Legal Fees', account_type: 'Income', account_code: '4110', parent_code: '4100', is_group: false },
      { name: 'Consultation Fees', account_type: 'Income', account_code: '4120', parent_code: '4100', is_group: false },
      { name: 'Retainer Fees', account_type: 'Income', account_code: '4130', parent_code: '4100', is_group: false },
      { name: 'Court Representation', account_type: 'Income', account_code: '4140', parent_code: '4100', is_group: false },

      // Expenses
      { name: 'Expenses', account_type: 'Expense', account_code: '5000', is_group: true },
      { name: 'Professional Expenses', account_type: 'Expense', account_code: '5100', parent_code: '5000', is_group: true },
      { name: 'Professional Liability Insurance', account_type: 'Expense', account_code: '5110', parent_code: '5100', is_group: false },
      { name: 'Continuing Education', account_type: 'Expense', account_code: '5120', parent_code: '5100', is_group: false },
      { name: 'Professional Dues', account_type: 'Expense', account_code: '5130', parent_code: '5100', is_group: false },
      { name: 'Legal Research', account_type: 'Expense', account_code: '5140', parent_code: '5100', is_group: false },

      { name: 'Operating Expenses', account_type: 'Expense', account_code: '5200', parent_code: '5000', is_group: true },
      { name: 'Office Rent', account_type: 'Expense', account_code: '5210', parent_code: '5200', is_group: false },
      { name: 'Professional Staff Salaries', account_type: 'Expense', account_code: '5220', parent_code: '5200', is_group: false },
      { name: 'Office Supplies', account_type: 'Expense', account_code: '5230', parent_code: '5200', is_group: false },
      { name: 'Client Entertainment', account_type: 'Expense', account_code: '5240', parent_code: '5200', is_group: false },
    ]
  }
]

/**
 * Get template by industry type
 */
export function getCoATemplate(industry: IndustryType): CoATemplate | undefined {
  return COA_TEMPLATES.find(template => template.industry === industry)
}

/**
 * Get all available industry types
 */
export function getAvailableIndustries(): { value: IndustryType; label: string; description: string }[] {
  return COA_TEMPLATES.map(template => ({
    value: template.industry,
    label: template.name,
    description: template.description
  }))
}
