// @ts-nocheck

// Export all runtime functionality
export * from "./posting.js";
export * from "./fx/policy.js";
export * from "./fx/ingest.js";
export * from "./coa-validation.js";
export * from "./tax-calculations.js";
export * from "./repos/periodRepo.js";

// Export specific functions to avoid naming conflicts
export {
    validateInvoicePosting,
    calculateInvoiceTotals,
    validateInvoiceLines,
    generateInvoiceDescription,
    type InvoicePostingInput,
    type InvoiceLineInput
} from "./ar/invoice-posting.js";

export {
    validateBillPosting,
    calculateBillTotals,
    validateBillLines,
    generateBillNumber,
    validateBillBusinessRules,
    type BillPostingInput,
    type BillLineInput
} from "./ap/bill-posting.js";

export {
    validatePaymentProcessing,
    validatePaymentBusinessRules,
    generatePaymentNumber,
    calculatePaymentSummary,
    validatePaymentAllocations,
    type PaymentProcessingInput,
    type PaymentAllocationInput
} from "./ap/payment-processing.js";

export {
    validatePaymentProcessing as validatePaymentProcessingEnhanced,
    validatePaymentBusinessRules as validatePaymentBusinessRulesEnhanced,
    generatePaymentNumber as generatePaymentNumberEnhanced,
    calculatePaymentSummary as calculatePaymentSummaryEnhanced,
    type PaymentProcessingInput as PaymentProcessingInputEnhanced,
    type PaymentAllocationInput as PaymentAllocationInputEnhanced,
    type PaymentProcessingResult as PaymentProcessingResultEnhanced,
    type PaymentProcessingError as PaymentProcessingErrorEnhanced,
    type BankChargeInput,
    type WithholdingTaxInput
} from "./ap/payment-processing-enhanced.js";

export {
    closeFiscalPeriod,
    openFiscalPeriod,
    createPeriodLock
} from "./periods/period-management.js";

// D4 Reporting Functions
export { generateTrialBalance } from "./reports/trial-balance.js";
export { generateBalanceSheet } from "./reports/balance-sheet.js";
export { generateProfitLoss } from "./reports/profit-loss.js";
export { generateCashFlow } from "./reports/cash-flow.js";

// Export all types from SSOT types file
export * from "./types.js";
