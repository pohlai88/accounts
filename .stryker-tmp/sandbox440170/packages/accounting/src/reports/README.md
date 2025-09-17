# DOC-030: Documentation

**Version**: 1.0  
**Date**: 2025-09-17  
**Status**: Active  
**Owner**: Development Team  
**Last Updated**: 2025-09-17  
**Next Review**: 2025-12-17  

---

# Reports — Financial Reporting Module

> **TL;DR**: D4 Financial reporting engine generating Trial Balance, Balance Sheet, P&L, and Cash
> Flow from GL data with V1 compliance.  
> **Owner**: @aibos/accounting-team • **Status**: stable • **Since**: 2024-12  
> **Standards**: CommonMark • SemVer • Conventional Commits • Keep a Changelog

---

## 1) Scope & Boundaries

**Does**:

- Trial Balance generation from GL data
- Balance Sheet report generation
- Profit & Loss report generation
- Cash Flow Statement generation
- Financial report validation and balancing
- Multi-currency report support

**Does NOT**:

- Handle AP/AR posting (delegated to @aibos/accounting/src/ap and @aibos/accounting/src/ar)
- Process bank transactions (delegated to @aibos/accounting/src/bank)
- Manage FX operations (delegated to @aibos/accounting/src/fx)
- Handle period operations (delegated to @aibos/accounting/src/periods)

**Consumers**: @aibos/web-api, @aibos/accounting, external reporting systems

## 2) Quick Links

- **Trial Balance**: `trial-balance.ts`
- **Balance Sheet**: `balance-sheet.ts`
- **Profit & Loss**: `profit-loss.ts`
- **Cash Flow**: `cash-flow.ts`
- **Main Accounting**: `../README.md`

## 3) Getting Started

```typescript
import { generateTrialBalance, generateBalanceSheet } from "@aibos/accounting/reports";

// Generate Trial Balance
const trialBalance = await generateTrialBalance(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    asOfDate: new Date("2024-01-31"),
    includeZeroBalances: false,
  },
  dbClient,
);

// Generate Balance Sheet
const balanceSheet = await generateBalanceSheet(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    asOfDate: new Date("2024-01-31"),
    reportFormat: "STANDARD",
  },
  dbClient,
);
```

## 4) Architecture & Dependencies

**Dependencies**:

- Database client for GL data access
- Chart of accounts hierarchy
- GL journal line calculations

**Dependents**:

- @aibos/web-api reporting endpoints
- @aibos/accounting main module
- External reporting systems

**Build Order**: After GL posting module, before web-api integration

## 5) Development Workflow

**Local Dev**:

```bash
pnpm --filter @aibos/accounting dev
pnpm --filter @aibos/accounting test
```

**Testing**:

```bash
pnpm --filter @aibos/accounting test src/reports/
```

**Linting**:

```bash
pnpm --filter @aibos/accounting lint src/reports/
```

**Type Checking**:

```bash
pnpm --filter @aibos/accounting typecheck
```

## 6) API Surface

**Exports**:

### Trial Balance (`trial-balance.ts`)

- `generateTrialBalance()` - Main trial balance generation
- `exportTrialBalance()` - Export trial balance to various formats

### Balance Sheet (`balance-sheet.ts`)

- `generateBalanceSheet()` - Main balance sheet generation

### Profit & Loss (`profit-loss.ts`)

- `generateProfitLoss()` - Main P&L generation

### Cash Flow (`cash-flow.ts`)

- `generateCashFlowStatement()` - Main cash flow generation

**Public Types**:

- `TrialBalanceInput` - Trial balance input interface
- `TrialBalanceResult` - Trial balance result
- `BalanceSheetInput` - Balance sheet input interface
- `BalanceSheetResult` - Balance sheet result
- `ProfitLossInput` - P&L input interface
- `ProfitLossResult` - P&L result
- `CashFlowInput` - Cash flow input interface
- `CashFlowResult` - Cash flow result

**Configuration**:

- Report format options (STANDARD, COMPARATIVE, CONSOLIDATED)
- Multi-currency support
- Account filtering options

## 7) Performance & Monitoring

**Bundle Size**: ~35KB minified  
**Performance Budget**: <3s for trial balance, <5s for balance sheet, <4s for P&L  
**Monitoring**: Axiom telemetry integration for reporting operations

## 8) Security & Compliance

**Permissions**:

- Report generation requires 'accountant' or 'manager' role
- SoD compliance enforced for all operations

**Data Handling**:

- All report data validated and sanitized
- Multi-currency consolidation
- Audit trail for all report generation

**Compliance**:

- V1 compliance for financial reporting
- SoD enforcement for report generation
- Financial statement validation

## 9) Usage Examples

### Trial Balance Generation

```typescript
import { generateTrialBalance, exportTrialBalance } from "@aibos/accounting/reports";

// Generate trial balance
const trialBalance = await generateTrialBalance(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    asOfDate: new Date("2024-01-31"),
    includeZeroBalances: false,
    includePeriodActivity: true,
    accountFilter: {
      accountTypes: ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"],
    },
    currency: "MYR",
  },
  dbClient,
);

if (trialBalance.success) {
  console.log("Trial Balance generated successfully");
  console.log("As of date:", trialBalance.asOfDate);
  console.log("Currency:", trialBalance.currency);
  console.log("Total accounts:", trialBalance.accounts.length);
  console.log("Is balanced:", trialBalance.isBalanced);

  // Check totals
  console.log("Total debits:", trialBalance.totals.totalDebits);
  console.log("Total credits:", trialBalance.totals.totalCredits);
  console.log("Total assets:", trialBalance.totals.totalAssets);
  console.log("Total liabilities:", trialBalance.totals.totalLiabilities);
  console.log("Total equity:", trialBalance.totals.totalEquity);
  console.log("Net income:", trialBalance.totals.netIncome);

  // Export to CSV
  const csvData = exportTrialBalance(trialBalance, "CSV");
  console.log("CSV export ready");
} else {
  console.error("Trial Balance generation failed:", trialBalance.error);
}
```

### Balance Sheet Generation

```typescript
import { generateBalanceSheet } from "@aibos/accounting/reports";

// Generate balance sheet
const balanceSheet = await generateBalanceSheet(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    asOfDate: new Date("2024-01-31"),
    comparativePeriod: new Date("2023-01-31"), // For comparative BS
    includeZeroBalances: false,
    currency: "MYR",
    reportFormat: "COMPARATIVE",
  },
  dbClient,
);

if (balanceSheet.success) {
  console.log("Balance Sheet generated successfully");
  console.log("As of date:", balanceSheet.asOfDate);
  console.log("Comparative date:", balanceSheet.comparativeDate);
  console.log("Report format:", balanceSheet.reportFormat);
  console.log("Is balanced:", balanceSheet.isBalanced);

  // Check balance equation
  console.log(
    "Assets = Liabilities + Equity:",
    balanceSheet.balanceCheck.assetsEqualsLiabilitiesPlusEquity,
  );
  console.log("Difference:", balanceSheet.balanceCheck.difference);

  // Check totals
  console.log("Total assets:", balanceSheet.totals.totalAssets);
  console.log("Total current assets:", balanceSheet.totals.totalCurrentAssets);
  console.log("Total non-current assets:", balanceSheet.totals.totalNonCurrentAssets);
  console.log("Total liabilities:", balanceSheet.totals.totalLiabilities);
  console.log("Total current liabilities:", balanceSheet.totals.totalCurrentLiabilities);
  console.log("Total non-current liabilities:", balanceSheet.totals.totalNonCurrentLiabilities);
  console.log("Total equity:", balanceSheet.totals.totalEquity);
  console.log("Retained earnings:", balanceSheet.totals.retainedEarnings);

  // Process asset sections
  for (const assetSection of balanceSheet.assets) {
    console.log(`${assetSection.sectionName}: ${assetSection.subtotal}`);
    for (const account of assetSection.accounts) {
      console.log(`  ${account.accountNumber} ${account.accountName}: ${account.currentBalance}`);
    }
  }
} else {
  console.error("Balance Sheet generation failed:", balanceSheet.error);
}
```

### Profit & Loss Generation

```typescript
import { generateProfitLoss } from "@aibos/accounting/reports";

// Generate P&L statement
const profitLoss = await generateProfitLoss(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    asOfDate: new Date("2024-01-31"),
    comparativePeriod: new Date("2023-01-31"), // For comparative P&L
    includeZeroBalances: false,
    currency: "MYR",
    reportFormat: "COMPARATIVE",
  },
  dbClient,
);

if (profitLoss.success) {
  console.log("P&L generated successfully");
  console.log("As of date:", profitLoss.asOfDate);
  console.log("Comparative date:", profitLoss.comparativeDate);
  console.log("Report format:", profitLoss.reportFormat);

  // Check totals
  console.log("Total revenue:", profitLoss.totals.totalRevenue);
  console.log("Total expenses:", profitLoss.totals.totalExpenses);
  console.log("Gross profit:", profitLoss.totals.grossProfit);
  console.log("Operating profit:", profitLoss.totals.operatingProfit);
  console.log("Net profit:", profitLoss.totals.netProfit);

  // Process revenue sections
  for (const revenueSection of profitLoss.revenue) {
    console.log(`${revenueSection.sectionName}: ${revenueSection.subtotal}`);
    for (const account of revenueSection.accounts) {
      console.log(`  ${account.accountNumber} ${account.accountName}: ${account.currentBalance}`);
    }
  }

  // Process expense sections
  for (const expenseSection of profitLoss.expenses) {
    console.log(`${expenseSection.sectionName}: ${expenseSection.subtotal}`);
    for (const account of expenseSection.accounts) {
      console.log(`  ${account.accountNumber} ${account.accountName}: ${account.currentBalance}`);
    }
  }
} else {
  console.error("P&L generation failed:", profitLoss.error);
}
```

### Cash Flow Statement Generation

```typescript
import { generateCashFlowStatement } from "@aibos/accounting/reports";

// Generate cash flow statement
const cashFlow = await generateCashFlowStatement(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    asOfDate: new Date("2024-01-31"),
    comparativePeriod: new Date("2023-01-31"), // For comparative CF
    includeZeroBalances: false,
    currency: "MYR",
    reportFormat: "COMPARATIVE",
  },
  dbClient,
);

if (cashFlow.success) {
  console.log("Cash Flow Statement generated successfully");
  console.log("As of date:", cashFlow.asOfDate);
  console.log("Comparative date:", cashFlow.comparativeDate);
  console.log("Report format:", cashFlow.reportFormat);

  // Check totals
  console.log("Net cash from operations:", cashFlow.totals.netCashFromOperations);
  console.log("Net cash from investing:", cashFlow.totals.netCashFromInvesting);
  console.log("Net cash from financing:", cashFlow.totals.netCashFromFinancing);
  console.log("Net change in cash:", cashFlow.totals.netChangeInCash);
  console.log("Beginning cash:", cashFlow.totals.beginningCash);
  console.log("Ending cash:", cashFlow.totals.endingCash);

  // Process operating activities
  for (const operatingSection of cashFlow.operating) {
    console.log(`${operatingSection.sectionName}: ${operatingSection.subtotal}`);
    for (const account of operatingSection.accounts) {
      console.log(`  ${account.accountNumber} ${account.accountName}: ${account.currentBalance}`);
    }
  }

  // Process investing activities
  for (const investingSection of cashFlow.investing) {
    console.log(`${investingSection.sectionName}: ${investingSection.subtotal}`);
    for (const account of investingSection.accounts) {
      console.log(`  ${account.accountNumber} ${account.accountName}: ${account.currentBalance}`);
    }
  }

  // Process financing activities
  for (const financingSection of cashFlow.financing) {
    console.log(`${financingSection.sectionName}: ${financingSection.subtotal}`);
    for (const account of financingSection.accounts) {
      console.log(`  ${account.accountNumber} ${account.accountName}: ${account.currentBalance}`);
    }
  }
} else {
  console.error("Cash Flow Statement generation failed:", cashFlow.error);
}
```

### Report Export

```typescript
import { exportTrialBalance } from "@aibos/accounting/reports";

// Export trial balance to different formats
const trialBalance = await generateTrialBalance(
  {
    tenantId: "tenant-123",
    companyId: "company-456",
    asOfDate: new Date("2024-01-31"),
  },
  dbClient,
);

if (trialBalance.success) {
  // Export to CSV
  const csvData = exportTrialBalance(trialBalance, "CSV");
  console.log("CSV export:", csvData);

  // Export to XLSX (when implemented)
  try {
    const xlsxData = exportTrialBalance(trialBalance, "XLSX");
    console.log("XLSX export ready");
  } catch (error) {
    console.log("XLSX export not yet implemented");
  }

  // Export to PDF (when implemented)
  try {
    const pdfData = exportTrialBalance(trialBalance, "PDF");
    console.log("PDF export ready");
  } catch (error) {
    console.log("PDF export not yet implemented");
  }
}
```

## 10) Troubleshooting

**Common Issues**:

- **Trial Balance Out of Balance**: Check for posting errors or missing journal entries
- **Balance Sheet Not Balanced**: Verify Assets = Liabilities + Equity equation
- **Missing Accounts**: Check chart of accounts configuration
- **Currency Issues**: Verify multi-currency setup and FX rates
- **Performance Issues**: Optimize database queries and consider pagination

**Debug Mode**:

```typescript
// Enable detailed logging
process.env.DEBUG_REPORTS = "true";
```

**Logs**: Check Axiom telemetry for reporting operation logs

## 11) Contributing

**Code Style**:

- Follow TypeScript best practices
- Use descriptive function names
- Implement proper error handling
- Document complex financial logic

**Testing**:

- Test all report generation scenarios
- Test multi-currency support
- Test report validation
- Test export functionality

**Review Process**:

- All report operations must be validated
- Financial calculations must be accurate
- Report formats must be compliant
- Performance must be optimized

---

## 📚 **Additional Resources**

- [Accounting Package README](../README.md)
- [Trial Balance Module](./trial-balance.ts)
- [Balance Sheet Module](./balance-sheet.ts)
- [Profit & Loss Module](./profit-loss.ts)
- [Cash Flow Module](./cash-flow.ts)

---

**Last Updated**: 2025-09-13 • **Version**: 0.1.0
