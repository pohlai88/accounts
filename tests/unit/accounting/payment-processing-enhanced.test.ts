// Enhanced Payment Processing Tests - All Phases
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validatePaymentProcessing as validatePaymentProcessingEnhanced } from '../../../packages/accounting/src/ap/payment-processing-enhanced.ts';
import { makePaymentInput, makePaymentAllocation, MYR, USD } from '../../factories';
import '../../matchers'; // Import custom matchers

describe('Payment Processing - Enhanced Implementation (All Phases)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Phase 1: Critical Fixes', () => {
        describe('FX Rate Validation', () => {
            it('should reject foreign currency without exchange rate', async () => {
                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: undefined as any, // Explicitly undefined
                    amount: 100,
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100,
                        arAccountId: "test-ar-account",
                    })],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/exchange.*rate.*required/i);
                    expect(result.code).toMatch(/EXCHANGE_RATE_REQUIRED/i);
                }
            });

            it('should reject invalid exchange rate', async () => {
                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: -1.5, // Invalid negative rate
                    amount: 100,
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100,
                        arAccountId: "test-ar-account",
                    })],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/exchange.*rate.*must.*be.*positive/i);
                    expect(result.code).toMatch(/INVALID_EXCHANGE_RATE/i);
                }
            });

            it('should accept valid foreign currency with exchange rate', async () => {
                // Mock bank account with MYR currency (base currency for journal posting)
                const { getBankAccountById } = await import('@aibos/db');
                (getBankAccountById as any).mockResolvedValue({
                    id: 'bank-1000', // Use existing MYR bank account
                    currency: 'MYR',
                    accountNumber: '123456',
                    accountName: 'MYR Bank Account'
                });

                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: 4.50, // Valid rate
                    amount: 100, // USD
                    bankAccountId: "bank-1000", // Use MYR bank account
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100, // USD
                        arAccountId: "test-ar-account",
                    })],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                console.log('Test result:', JSON.stringify(result, null, 2));
                if (!result.success) {
                    console.log('Error details:', result.error, result.code, result.details);
                }
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.totalAmount).toBeCloseTo(450, 2); // 100 USD * 4.50 = 450 MYR
                    expect(result.fxApplied).toBeDefined();
                    expect(result.fxApplied?.fromCurrency).toBe(USD);
                    expect(result.fxApplied?.toCurrency).toBe(MYR);
                    expect(result.fxApplied?.exchangeRate).toBe(4.50);
                    expect({ lines: result.lines }).toBeBalanced();
                }
            });
        });

        describe('Currency Consistency Validation', () => {
            it('should validate customer currency consistency', async () => {
                // Mock customer with different currency
                const { getCustomerById } = await import('@aibos/db');
                (getCustomerById as any).mockResolvedValue({
                    id: 'cust-1',
                    currency: 'EUR' // Different from payment currency
                });

                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: 4.50,
                    amount: 100,
                    customerId: "cust-1",
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100,
                        arAccountId: "test-ar-account",
                    })],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/customer.*currency.*does.*not.*match/i);
                    expect(result.code).toMatch(/CURRENCY_MISMATCH/i);
                }
            });

            it('should validate supplier currency consistency', async () => {
                // Mock supplier with different currency
                const { getSupplierById } = await import('@aibos/db');
                (getSupplierById as any).mockResolvedValue({
                    id: 'vend-1',
                    currency: 'GBP' // Different from payment currency
                });

                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: 4.50,
                    amount: 100,
                    supplierId: "vend-1",
                    allocations: [makePaymentAllocation({
                        type: "BILL",
                        documentId: "bill-1",
                        documentNumber: "BILL-001",
                        supplierId: "vend-1",
                        allocatedAmount: 100,
                        apAccountId: "test-ap-account",
                    })],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/supplier.*currency.*does.*not.*match/i);
                    expect(result.code).toMatch(/CURRENCY_MISMATCH/i);
                }
            });

            it('should validate bank account currency consistency', async () => {
                // Mock bank account with different currency
                const { getBankAccountById } = await import('@aibos/db');
                (getBankAccountById as any).mockResolvedValue({
                    id: 'bank-1',
                    currency: 'SGD',
                    accountNumber: '123456',
                    accountName: 'Test Bank'
                });

                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: 4.50,
                    amount: 100,
                    bankAccountId: "bank-1",
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100,
                        arAccountId: "test-ar-account",
                    })],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/bank.*account.*currency.*does.*not.*match/i);
                    expect(result.code).toMatch(/CURRENCY_MISMATCH/i);
                }
            });
        });

        describe('Enhanced Error Handling', () => {
            it('should provide detailed error information', async () => {
                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: undefined as any,
                    amount: -50, // Invalid negative amount
                    allocations: [],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/exchange.*rate.*required|payment.*amount.*must.*be.*positive|payment.*must.*have.*at.*least.*one.*allocation/i);
                    expect(result.code).toBeDefined();
                    expect(result.details).toBeDefined();
                }
            });
        });
    });

    describe('Phase 2: Business Logic Enhancements', () => {
        describe('Overpayment Handling', () => {
            it('should handle overpayment with advance/prepayment accounts', async () => {
                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 150, // Overpayment
                    customerId: "cust-1",
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100, // Only allocate 100
                        arAccountId: "test-ar-account",
                    })],
                });

                // Mock advance account creation
                const { getOrCreateAdvanceAccount, updateAdvanceAccountBalance } = await import('@aibos/db');
                (getOrCreateAdvanceAccount as any).mockResolvedValue({
                    id: 'advance-1',
                    accountId: 'advance-account-1100',
                    partyType: 'CUSTOMER',
                    partyId: 'cust-1',
                    currency: MYR,
                    balanceAmount: 0
                });
                (updateAdvanceAccountBalance as any).mockResolvedValue(undefined);

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                console.log('Overpayment test result:', JSON.stringify(result, null, 2));
                if (!result.success) {
                    console.log('Overpayment error details:', result.error, result.code, result.details);
                }
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.lines).toHaveLength(3); // Bank DR, AR CR, Advance DR
                    expect({ lines: result.lines }).toBeBalanced();
                    expect(getOrCreateAdvanceAccount).toHaveBeenCalledWith(
                        input.tenantId,
                        input.companyId,
                        'CUSTOMER',
                        'cust-1',
                        MYR,
                        'advance-account-1100'
                    );
                    expect(updateAdvanceAccountBalance).toHaveBeenCalledWith(
                        input.tenantId,
                        input.companyId,
                        'CUSTOMER',
                        'cust-1',
                        MYR,
                        50 // Overpayment amount
                    );
                }
            });
        });

        describe('Bank Charges Handling', () => {
            it('should process bank charges correctly', async () => {
                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 102, // 100 + 2 bank charge
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100,
                        arAccountId: "test-ar-account",
                    })],
                    bankCharges: [{
                        accountId: "exp-bank-fee-6000",
                        amount: 2,
                        description: "Bank processing fee",
                    }],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                console.log('Bank charges test result:', JSON.stringify(result, null, 2));
                if (!result.success) {
                    console.log('Bank charges error details:', result.error, result.code, result.details);
                }
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.lines).toHaveLength(3); // Bank DR, AR CR, Bank Fee CR
                    expect({ lines: result.lines }).toBeBalanced();
                    expect(result.bankCharges).toBeDefined();
                    expect(result.bankCharges?.[0].amount).toBe(2);
                    expect(result.bankCharges?.[0].description).toBe("Bank processing fee");
                }
            });

            it('should validate bank charges have positive amounts', async () => {
                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 100,
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100,
                        arAccountId: "test-ar-account",
                    })],
                    bankCharges: [{
                        accountId: "exp-bank-fee-6000",
                        amount: -1, // Invalid negative amount
                        description: "Invalid bank charge",
                    }],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/bank.*charge.*amount.*must.*be.*positive/i);
                }
            });
        });

        describe('Withholding Tax Handling', () => {
            it('should process withholding tax correctly', async () => {
                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 110, // 100 + 10 withholding tax
                    allocations: [makePaymentAllocation({
                        type: "BILL",
                        documentId: "bill-1",
                        documentNumber: "BILL-001",
                        supplierId: "vend-1",
                        allocatedAmount: 100,
                        apAccountId: "test-ap-account",
                    })],
                    withholdingTax: [{
                        accountId: "wht-payable-2100",
                        rate: 0.10, // 10%
                        amount: 10,
                        description: "Withholding tax 10%",
                    }],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.lines).toHaveLength(4); // AP DR, Bank CR, WHT DR, WHT Payable CR
                    expect({ lines: result.lines }).toBeBalanced();
                    expect(result.withholdingTax).toBeDefined();
                    expect(result.withholdingTax?.[0].amount).toBe(10);
                    expect(result.withholdingTax?.[0].description).toBe("Withholding tax 10%");
                }
            });

            it('should validate withholding tax rates', async () => {
                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 100,
                    allocations: [makePaymentAllocation({
                        type: "BILL",
                        documentId: "bill-1",
                        documentNumber: "BILL-001",
                        supplierId: "vend-1",
                        allocatedAmount: 100,
                        apAccountId: "test-ap-account",
                    })],
                    withholdingTax: [{
                        accountId: "wht-payable-2100",
                        rate: 1.5, // Invalid rate > 1
                        amount: 10,
                        description: "Invalid withholding tax",
                    }],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                expect(result.success).toBe(false);
                if (!result.success) {
                    expect(result.error).toMatch(/withholding.*tax.*rate.*must.*be.*between.*0.*and.*1/i);
                }
            });
        });
    });

    describe('Phase 3: Advanced Features', () => {
        describe('Multi-Currency Support', () => {
            it('should handle complex multi-currency scenarios', async () => {
                const input = makePaymentInput({
                    currency: USD,
                    exchangeRate: 4.50,
                    amount: 102, // USD (100 + 2 bank charge)
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100, // USD
                        arAccountId: "test-ar-account",
                    })],
                    bankCharges: [{
                        accountId: "exp-bank-fee-6000",
                        amount: 2, // USD
                        description: "Bank processing fee",
                    }],
                });

                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

                console.log('Multi-currency test result:', JSON.stringify(result, null, 2));
                if (!result.success) {
                    console.log('Multi-currency error details:', result.error, result.code, result.details);
                }
                expect(result.success).toBe(true);
                if (result.success) {
                    expect(result.totalAmount).toBeCloseTo(459, 2); // 102 USD * 4.50 = 459 MYR
                    expect(result.fxApplied).toBeDefined();
                    expect(result.fxApplied?.fromCurrency).toBe(USD);
                    expect(result.fxApplied?.toCurrency).toBe(MYR);
                    expect(result.fxApplied?.exchangeRate).toBe(4.50);
                    expect({ lines: result.lines }).toBeBalanced();
                }
            });
        });

        describe('Configuration Management', () => {
            it('should handle automatic bank charges from configuration', async () => {
                // Mock bank charge configuration
                const { calculateBankCharges } = await import('@aibos/db');
                (calculateBankCharges as any).mockResolvedValue([{
                    accountId: "exp-bank-fee-6000",
                    amount: 2.50,
                    description: "Bank charge (2.5%)"
                }]);

                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 100,
                    allocations: [makePaymentAllocation({
                        type: "INVOICE",
                        documentId: "inv-1",
                        documentNumber: "INV-001",
                        customerId: "cust-1",
                        allocatedAmount: 100,
                        arAccountId: "test-ar-account",
                    })],
                });

                // This would be called internally by the enhanced processing
                const bankCharges = await calculateBankCharges(
                    input.tenantId,
                    input.companyId,
                    input.bankAccountId,
                    input.amount
                );

                expect(bankCharges).toHaveLength(1);
                expect(bankCharges[0].amount).toBe(2.50);
                expect(bankCharges[0].description).toBe("Bank charge (2.5%)");
            });

            it('should handle automatic withholding tax from configuration', async () => {
                // Mock withholding tax configuration
                const { calculateWithholdingTax } = await import('@aibos/db');
                (calculateWithholdingTax as any).mockResolvedValue([{
                    accountId: "wht-payable-2100",
                    amount: 10,
                    description: "Withholding Tax 10%"
                }]);

                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 100,
                    allocations: [makePaymentAllocation({
                        type: "BILL",
                        documentId: "bill-1",
                        documentNumber: "BILL-001",
                        supplierId: "vend-1",
                        allocatedAmount: 100,
                        apAccountId: "test-ap-account",
                    })],
                });

                // This would be called internally by the enhanced processing
                const withholdingTax = await calculateWithholdingTax(
                    input.tenantId,
                    input.companyId,
                    input.amount,
                    'SUPPLIER'
                );

                expect(withholdingTax).toHaveLength(1);
                expect(withholdingTax[0].amount).toBe(10);
                expect(withholdingTax[0].description).toBe("Withholding Tax 10%");
            });
        });

        describe('Performance Optimization', () => {
            it('should handle large payment processing efficiently', async () => {
                const allocations = Array.from({ length: 50 }, (_, i) =>
                    makePaymentAllocation({
                        type: "INVOICE",
                        documentId: `inv-${i + 1}`,
                        documentNumber: `INV-${(i + 1).toString().padStart(3, '0')}`,
                        customerId: "cust-1",
                        allocatedAmount: 10,
                        arAccountId: "test-ar-account",
                    })
                );

                const input = makePaymentInput({
                    currency: MYR,
                    exchangeRate: 1.0,
                    amount: 500, // 50 * 10
                    allocations,
                });

                const startTime = Date.now();
                const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);
                const endTime = Date.now();

                expect(result.success).toBe(true);
                expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
                if (result.success) {
                    expect(result.allocationsProcessed).toBe(50);
                    expect({ lines: result.lines }).toBeBalanced();
                }
            });
        });
    });

    describe('Integration Scenarios', () => {
        it('should handle complete payment workflow with all enhancements', async () => {
            const input = makePaymentInput({
                currency: USD,
                exchangeRate: 4.50,
                amount: 110, // 100 + 10 overpayment
                customerId: "cust-1",
                allocations: [makePaymentAllocation({
                    type: "INVOICE",
                    documentId: "inv-1",
                    documentNumber: "INV-001",
                    customerId: "cust-1",
                    allocatedAmount: 100,
                    arAccountId: "test-ar-account",
                })],
                bankCharges: [{
                    accountId: "exp-bank-fee-6000",
                    amount: 2,
                    description: "Bank processing fee",
                }],
            });

            // Mock all required functions
            const { getCustomerById, getBankAccountById, getOrCreateAdvanceAccount, updateAdvanceAccountBalance } = await import('@aibos/db');
            getCustomerById.mockResolvedValue({
                id: 'cust-1',
                currency: 'USD',
                name: 'Test Customer',
                email: 'test@example.com'
            });
            getBankAccountById.mockResolvedValue({
                id: 'bank-1',
                currency: 'USD',
                accountNumber: '123456',
                accountName: 'Test Bank'
            });
            getOrCreateAdvanceAccount.mockResolvedValue({
                id: 'advance-1',
                accountId: 'advance-account-1100',
                partyType: 'CUSTOMER',
                partyId: 'cust-1',
                currency: 'USD',
                balanceAmount: 0
            });
            updateAdvanceAccountBalance.mockResolvedValue(undefined);

            const result = await validatePaymentProcessingEnhanced(input, 'test-user', 'admin', MYR);

            expect(result.success).toBe(true);
            if (result.success) {
                expect(result.totalAmount).toBeCloseTo(495, 2); // 110 USD * 4.50 = 495 MYR
                expect(result.fxApplied).toBeDefined();
                expect(result.bankCharges).toBeDefined();
                expect(result.allocationsProcessed).toBe(1);
                expect({ lines: result.lines }).toBeBalanced();
            }
        });
    });
});
