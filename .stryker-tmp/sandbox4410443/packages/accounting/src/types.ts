// @ts-nocheck

// SSOT: Public types for @aibos/accounting
// This file re-exports all public types and constants for downstream consumers

// FX (Foreign Exchange) Types
export type {
	FxRateSource,
	FxRateData,
	FxIngestResult,
	FxIngestError
} from "./fx/ingest.js";
export { STALENESS_THRESHOLDS } from "./fx/ingest.js";
export type { FxPolicy, FxValidationResult } from "./fx/policy.js";
export { defaultFxPolicy } from "./fx/policy.js";

// Posting Types
export type { PostingContext, JournalPostingInput } from "./posting.js";

// AR (Accounts Receivable) Types
export type {
	InvoicePostingInput,
	InvoiceLineInput,
	TaxLineInput,
	InvoicePostingResult,
	InvoicePostingError
} from "./ar/invoice-posting.js";

// AP (Accounts Payable) Types
export type {
	BillPostingInput,
	BillLineInput,
	BillPostingResult,
	BillPostingError
} from "./ap/bill-posting.js";

export type {
	PaymentProcessingInput,
	PaymentAllocationInput,
	PaymentProcessingResult,
	PaymentProcessingError
} from "./ap/payment-processing.js";

// Period Management Types
export type {
	PeriodCloseInput,
	PeriodOpenInput,
	PeriodLockInput,
	PeriodCloseValidation,
	PeriodCloseResult,
	PeriodManagementError
} from "./periods/period-management.js";

// Reporting Types
export type {
	TrialBalanceInput,
	TrialBalanceAccount,
	TrialBalanceResult,
	TrialBalanceError
} from "./reports/trial-balance.js";

export type {
	BalanceSheetInput,
	BalanceSheetSection,
	BalanceSheetAccount,
	BalanceSheetResult,
	BalanceSheetError
} from "./reports/balance-sheet.js";

export type {
	ProfitLossInput,
	ProfitLossSection,
	ProfitLossAccount,
	ProfitLossResult,
	ProfitLossError
} from "./reports/profit-loss.js";

export type {
	CashFlowInput,
	CashFlowSection,
	CashFlowActivity,
	CashFlowResult,
	CashFlowError
} from "./reports/cash-flow.js";

// Bank Integration Types
export type {
	MatchCandidate,
	MatchResult,
	AutoMatchResult,
	MatchingConfig
} from "./bank/auto-matcher.js";

export type {
	BankTransactionImport,
	ImportResult,
	BankFormat
} from "./bank/csv-import.js";

// Tax Calculation Types
export type {
	TaxCalculationInput,
	TaxCalculationResult,
	LineTaxCalculation
} from "./tax-calculations.js";

// COA (Chart of Accounts) Types
export type { AccountType, COAValidationResult } from "./coa-validation.js";
