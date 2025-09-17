/**
 * Malaysia-Ready Company Scaffold
 * Instant setup with MYR, MFRS COA, SST/GST presets, and demo data
 */
// @ts-nocheck


import { supabase } from "./supabase";

export interface MalaysiaCompanySetup {
  company_name: string;
  email: string;
  user_id: string;
  industry?: string;
}

// MFRS-Aligned Chart of Accounts for Malaysia
export const MFRS_CHART_OF_ACCOUNTS = [
  // ASSETS (1000-1999)
  { code: "1000", name: "ASSETS", type: "Asset", is_group: true, parent_code: null },

  // Current Assets (1100-1199)
  { code: "1100", name: "Current Assets", type: "Asset", is_group: true, parent_code: "1000" },
  {
    code: "1110",
    name: "Cash and Cash Equivalents",
    type: "Asset",
    is_group: false,
    parent_code: "1100",
  },
  { code: "1111", name: "Petty Cash", type: "Asset", is_group: false, parent_code: "1110" },
  {
    code: "1112",
    name: "Bank - Current Account",
    type: "Asset",
    is_group: false,
    parent_code: "1110",
  },
  {
    code: "1113",
    name: "Bank - Savings Account",
    type: "Asset",
    is_group: false,
    parent_code: "1110",
  },
  { code: "1114", name: "Fixed Deposits", type: "Asset", is_group: false, parent_code: "1110" },

  {
    code: "1120",
    name: "Trade and Other Receivables",
    type: "Asset",
    is_group: false,
    parent_code: "1100",
  },
  { code: "1121", name: "Trade Receivables", type: "Asset", is_group: false, parent_code: "1120" },
  { code: "1122", name: "Other Receivables", type: "Asset", is_group: false, parent_code: "1120" },
  { code: "1123", name: "Prepayments", type: "Asset", is_group: false, parent_code: "1120" },
  { code: "1124", name: "Deposits", type: "Asset", is_group: false, parent_code: "1120" },

  { code: "1130", name: "Inventories", type: "Asset", is_group: false, parent_code: "1100" },
  { code: "1140", name: "Tax Recoverable", type: "Asset", is_group: false, parent_code: "1100" },
  { code: "1141", name: "SST Input Tax", type: "Asset", is_group: false, parent_code: "1140" },
  { code: "1142", name: "Withholding Tax", type: "Asset", is_group: false, parent_code: "1140" },

  // Non-Current Assets (1200-1299)
  { code: "1200", name: "Non-Current Assets", type: "Asset", is_group: true, parent_code: "1000" },
  {
    code: "1210",
    name: "Property, Plant and Equipment",
    type: "Asset",
    is_group: false,
    parent_code: "1200",
  },
  { code: "1211", name: "Land and Buildings", type: "Asset", is_group: false, parent_code: "1210" },
  { code: "1212", name: "Motor Vehicles", type: "Asset", is_group: false, parent_code: "1210" },
  {
    code: "1213",
    name: "Furniture and Fittings",
    type: "Asset",
    is_group: false,
    parent_code: "1210",
  },
  { code: "1214", name: "Office Equipment", type: "Asset", is_group: false, parent_code: "1210" },
  { code: "1215", name: "Computer Equipment", type: "Asset", is_group: false, parent_code: "1210" },

  {
    code: "1220",
    name: "Accumulated Depreciation",
    type: "Asset",
    is_group: false,
    parent_code: "1200",
  },
  { code: "1230", name: "Intangible Assets", type: "Asset", is_group: false, parent_code: "1200" },
  {
    code: "1240",
    name: "Long-term Investments",
    type: "Asset",
    is_group: false,
    parent_code: "1200",
  },

  // LIABILITIES (2000-2999)
  { code: "2000", name: "LIABILITIES", type: "Liability", is_group: true, parent_code: null },

  // Current Liabilities (2100-2199)
  {
    code: "2100",
    name: "Current Liabilities",
    type: "Liability",
    is_group: true,
    parent_code: "2000",
  },
  {
    code: "2110",
    name: "Trade and Other Payables",
    type: "Liability",
    is_group: false,
    parent_code: "2100",
  },
  { code: "2111", name: "Trade Payables", type: "Liability", is_group: false, parent_code: "2110" },
  { code: "2112", name: "Other Payables", type: "Liability", is_group: false, parent_code: "2110" },
  {
    code: "2113",
    name: "Accrued Expenses",
    type: "Liability",
    is_group: false,
    parent_code: "2110",
  },

  { code: "2120", name: "Tax Payable", type: "Liability", is_group: false, parent_code: "2100" },
  {
    code: "2121",
    name: "Corporate Income Tax",
    type: "Liability",
    is_group: false,
    parent_code: "2120",
  },
  { code: "2122", name: "SST Output Tax", type: "Liability", is_group: false, parent_code: "2120" },
  {
    code: "2123",
    name: "Withholding Tax Payable",
    type: "Liability",
    is_group: false,
    parent_code: "2120",
  },

  {
    code: "2130",
    name: "Employee Benefits",
    type: "Liability",
    is_group: false,
    parent_code: "2100",
  },
  { code: "2131", name: "EPF Payable", type: "Liability", is_group: false, parent_code: "2130" },
  { code: "2132", name: "SOCSO Payable", type: "Liability", is_group: false, parent_code: "2130" },
  { code: "2133", name: "EIS Payable", type: "Liability", is_group: false, parent_code: "2130" },
  { code: "2134", name: "Salary Payable", type: "Liability", is_group: false, parent_code: "2130" },

  {
    code: "2140",
    name: "Short-term Borrowings",
    type: "Liability",
    is_group: false,
    parent_code: "2100",
  },

  // Non-Current Liabilities (2200-2299)
  {
    code: "2200",
    name: "Non-Current Liabilities",
    type: "Liability",
    is_group: true,
    parent_code: "2000",
  },
  {
    code: "2210",
    name: "Long-term Borrowings",
    type: "Liability",
    is_group: false,
    parent_code: "2200",
  },
  {
    code: "2220",
    name: "Deferred Tax Liabilities",
    type: "Liability",
    is_group: false,
    parent_code: "2200",
  },

  // EQUITY (3000-3999)
  { code: "3000", name: "EQUITY", type: "Equity", is_group: true, parent_code: null },
  { code: "3100", name: "Share Capital", type: "Equity", is_group: false, parent_code: "3000" },
  { code: "3200", name: "Retained Earnings", type: "Equity", is_group: false, parent_code: "3000" },
  {
    code: "3300",
    name: "Current Year Earnings",
    type: "Equity",
    is_group: false,
    parent_code: "3000",
  },
  {
    code: "3400",
    name: "Opening Balance Equity",
    type: "Equity",
    is_group: false,
    parent_code: "3000",
  },

  // REVENUE (4000-4999)
  { code: "4000", name: "REVENUE", type: "Income", is_group: true, parent_code: null },
  { code: "4100", name: "Sales Revenue", type: "Income", is_group: false, parent_code: "4000" },
  { code: "4110", name: "Local Sales", type: "Income", is_group: false, parent_code: "4100" },
  { code: "4120", name: "Export Sales", type: "Income", is_group: false, parent_code: "4100" },
  { code: "4200", name: "Other Income", type: "Income", is_group: false, parent_code: "4000" },
  { code: "4210", name: "Interest Income", type: "Income", is_group: false, parent_code: "4200" },
  { code: "4220", name: "Dividend Income", type: "Income", is_group: false, parent_code: "4200" },
  { code: "4230", name: "Rental Income", type: "Income", is_group: false, parent_code: "4200" },
  {
    code: "4240",
    name: "Foreign Exchange Gain",
    type: "Income",
    is_group: false,
    parent_code: "4200",
  },

  // EXPENSES (5000-5999)
  { code: "5000", name: "EXPENSES", type: "Expense", is_group: true, parent_code: null },

  // Cost of Sales (5100-5199)
  { code: "5100", name: "Cost of Sales", type: "Expense", is_group: false, parent_code: "5000" },
  {
    code: "5110",
    name: "Cost of Goods Sold",
    type: "Expense",
    is_group: false,
    parent_code: "5100",
  },
  { code: "5120", name: "Direct Labour", type: "Expense", is_group: false, parent_code: "5100" },
  { code: "5130", name: "Direct Materials", type: "Expense", is_group: false, parent_code: "5100" },

  // Operating Expenses (5200-5999)
  {
    code: "5200",
    name: "Administrative Expenses",
    type: "Expense",
    is_group: false,
    parent_code: "5000",
  },
  {
    code: "5210",
    name: "Salaries and Wages",
    type: "Expense",
    is_group: false,
    parent_code: "5200",
  },
  { code: "5211", name: "EPF Contribution", type: "Expense", is_group: false, parent_code: "5210" },
  {
    code: "5212",
    name: "SOCSO Contribution",
    type: "Expense",
    is_group: false,
    parent_code: "5210",
  },
  { code: "5213", name: "EIS Contribution", type: "Expense", is_group: false, parent_code: "5210" },

  { code: "5220", name: "Rent Expense", type: "Expense", is_group: false, parent_code: "5200" },
  { code: "5230", name: "Utilities", type: "Expense", is_group: false, parent_code: "5200" },
  { code: "5231", name: "Electricity", type: "Expense", is_group: false, parent_code: "5230" },
  { code: "5232", name: "Water", type: "Expense", is_group: false, parent_code: "5230" },
  {
    code: "5233",
    name: "Telephone and Internet",
    type: "Expense",
    is_group: false,
    parent_code: "5230",
  },

  {
    code: "5240",
    name: "Professional Fees",
    type: "Expense",
    is_group: false,
    parent_code: "5200",
  },
  { code: "5241", name: "Audit Fees", type: "Expense", is_group: false, parent_code: "5240" },
  { code: "5242", name: "Legal Fees", type: "Expense", is_group: false, parent_code: "5240" },
  { code: "5243", name: "Accounting Fees", type: "Expense", is_group: false, parent_code: "5240" },

  {
    code: "5250",
    name: "Motor Vehicle Expenses",
    type: "Expense",
    is_group: false,
    parent_code: "5200",
  },
  { code: "5260", name: "Depreciation", type: "Expense", is_group: false, parent_code: "5200" },
  { code: "5270", name: "Insurance", type: "Expense", is_group: false, parent_code: "5200" },
  { code: "5280", name: "Office Supplies", type: "Expense", is_group: false, parent_code: "5200" },
  {
    code: "5290",
    name: "Travel and Entertainment",
    type: "Expense",
    is_group: false,
    parent_code: "5200",
  },

  {
    code: "5300",
    name: "Marketing Expenses",
    type: "Expense",
    is_group: false,
    parent_code: "5000",
  },
  { code: "5400", name: "Finance Costs", type: "Expense", is_group: false, parent_code: "5000" },
  { code: "5410", name: "Interest Expense", type: "Expense", is_group: false, parent_code: "5400" },
  { code: "5420", name: "Bank Charges", type: "Expense", is_group: false, parent_code: "5400" },
  {
    code: "5430",
    name: "Foreign Exchange Loss",
    type: "Expense",
    is_group: false,
    parent_code: "5400",
  },
];

// Malaysia Tax Presets (SST/GST)
export const MALAYSIA_TAX_PRESETS = [
  {
    name: "SST - Standard Rate",
    rate: 6.0,
    type: "SST",
    description: "Sales and Service Tax - Standard Rate 6%",
  },
  {
    name: "SST - Service Tax",
    rate: 6.0,
    type: "SST",
    description: "Service Tax 6%",
  },
  {
    name: "SST - Zero Rate",
    rate: 0.0,
    type: "SST",
    description: "SST Zero Rate",
  },
  {
    name: "SST - Exempt",
    rate: 0.0,
    type: "SST",
    description: "SST Exempt",
  },
];

// Demo transactions for immediate value
export const DEMO_TRANSACTIONS = [
  {
    type: "sales_invoice",
    customer: "Sample Customer Sdn Bhd",
    amount: 1200.0,
    tax_amount: 72.0,
    description: "Professional Services - December 2024",
    date: new Date().toISOString().split("T")[0],
  },
  {
    type: "purchase_bill",
    supplier: "Office Supplies Sdn Bhd",
    amount: 450.0,
    tax_amount: 27.0,
    description: "Office Equipment Purchase",
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  },
  {
    type: "journal_entry",
    description: "Bank Interest Received",
    amount: 125.5,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  },
];

export class MalaysiaScaffold {
  /**
   * Create complete Malaysia-ready company setup
   */
  static async createMalaysiaCompany(setup: MalaysiaCompanySetup) {
    try {
      // 1. Create company with Malaysia defaults
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .insert({
          name: setup.company_name,
          country: "Malaysia",
          default_currency: "MYR",
          fiscal_year_start: "January",
          date_format: "DD/MM/YYYY",
          number_format: "1,234.56",
          timezone: "Asia/Kuala_Lumpur",
          accounting_method: "accrual",
          enable_sst: true,
          sst_registration_number: null,
          industry: setup.industry || "General Business",
        })
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Create user profile with owner role
      const { error: profileError } = await supabase.from("user_profiles").insert({
        id: setup.user_id,
        email: setup.email,
        company_id: company.id,
        role: "owner",
        is_active: true,
      });

      if (profileError) throw profileError;

      // 3. Create company membership
      const { error: memberError } = await supabase.from("company_members").insert({
        user_id: setup.user_id,
        company_id: company.id,
        role: "owner",
        invited_by: setup.user_id,
        invited_at: new Date().toISOString(),
        accepted_at: new Date().toISOString(),
        is_active: true,
      });

      if (memberError) throw memberError;

      // 4. Create MFRS-aligned Chart of Accounts
      await this.createMFRSChartOfAccounts(company.id);

      // 5. Create Malaysia tax presets
      await this.createMalaysiaTaxPresets(company.id);

      // 6. Create demo transactions
      await this.createDemoTransactions(company.id);

      // 7. Create onboarding tasks
      await this.createOnboardingTasks(setup.user_id, company.id);

      return { success: true, company };
    } catch (error) {
      console.error("Malaysia scaffold creation failed:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create MFRS-aligned Chart of Accounts
   */
  private static async createMFRSChartOfAccounts(companyId: string) {
    const accountMap = new Map<string, string>();

    // Create accounts in order (parents first)
    for (const account of MFRS_CHART_OF_ACCOUNTS) {
      const parentId = account.parent_code ? accountMap.get(account.parent_code) : null;

      const { data: createdAccount } = await supabase
        .from("accounts")
        .insert({
          company_id: companyId,
          account_code: account.code,
          name: account.name,
          account_type: account.type,
          parent_id: parentId,
          is_group: account.is_group,
          is_active: true,
          description: `MFRS-aligned ${account.type} account`,
        })
        .select("id")
        .single();

      if (createdAccount) {
        accountMap.set(account.code, createdAccount.id);
      }
    }
  }

  /**
   * Create Malaysia tax presets
   */
  private static async createMalaysiaTaxPresets(companyId: string) {
    for (const tax of MALAYSIA_TAX_PRESETS) {
      await supabase.from("tax_rates").insert({
        company_id: companyId,
        name: tax.name,
        rate: tax.rate,
        type: tax.type,
        description: tax.description,
        is_active: true,
      });
    }
  }

  /**
   * Create demo transactions for immediate value
   */
  private static async createDemoTransactions(companyId: string) {
    // Get some account IDs for demo transactions
    const { data: accounts } = await supabase
      .from("accounts")
      .select("id, account_code, name")
      .eq("company_id", companyId)
      .in("account_code", ["1112", "1121", "2111", "4110", "5280"]);

    if (!accounts || accounts.length === 0) return;

    const accountMap = new Map(accounts.map(acc => [acc.account_code, acc.id]));

    // Create demo customers and suppliers
    const { data: customer } = await supabase
      .from("customers")
      .insert({
        company_id: companyId,
        name: "Sample Customer Sdn Bhd",
        email: "customer@sample.com.my",
        phone: "+60 3-1234 5678",
        is_active: true,
      })
      .select()
      .single();

    const { data: supplier } = await supabase
      .from("suppliers")
      .insert({
        company_id: companyId,
        name: "Office Supplies Sdn Bhd",
        email: "supplier@office.com.my",
        phone: "+60 3-8765 4321",
        is_active: true,
      })
      .select()
      .single();

    // Create demo transactions (simplified for now)
    // In a real implementation, these would create proper invoices, bills, and journal entries
    // with corresponding GL entries following double-entry bookkeeping
  }

  /**
   * Create onboarding tasks
   */
  private static async createOnboardingTasks(userId: string, companyId: string) {
    const tasks = [
      {
        title: "Send your first invoice",
        description: "Create and send an invoice to see how easy it is",
        category: "first_win",
        priority: "high",
        estimated_minutes: 3,
      },
      {
        title: "Add a bank account",
        description: "Connect your bank for automatic reconciliation",
        category: "setup",
        priority: "medium",
        estimated_minutes: 2,
      },
      {
        title: "Invite your accountant",
        description: "Give your team access with role-based permissions",
        category: "team",
        priority: "medium",
        estimated_minutes: 1,
      },
      {
        title: "Review your Chart of Accounts",
        description: "Your MFRS-aligned COA is ready, but you can customize it",
        category: "setup",
        priority: "low",
        estimated_minutes: 5,
      },
    ];

    for (const task of tasks) {
      await supabase.from("onboarding_tasks").insert({
        user_id: userId,
        company_id: companyId,
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes,
        is_completed: false,
        created_at: new Date().toISOString(),
      });
    }
  }
}
