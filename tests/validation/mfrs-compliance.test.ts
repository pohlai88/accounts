// MFRS (Malaysian Financial Reporting Standards) Compliance Validation Tests
// Validates adherence to Malaysian accounting standards and regulations

import { describe, it, expect } from 'vitest';
import { validateMFRSCompliance, validateMalaysianTaxCompliance } from '@aibos/accounting/compliance/mfrs-validation';

describe('MFRS Compliance Validation', () => {
    describe('MFRS 1 - First-time Adoption of Malaysian Financial Reporting Standards', () => {
        it('should validate first-time adoption requirements', () => {
            const adoptionData = {
                reportingDate: '2024-01-01',
                previousGAAP: 'PERS',
                mfrsAdoption: true,
                transitionAdjustments: [
                    {
                        account: 'Retained Earnings',
                        adjustment: 50000,
                        reason: 'MFRS 1 transition adjustment',
                    },
                ],
            };

            const result = validateMFRSCompliance('MFRS1', adoptionData);
            expect(result.valid).toBe(true);
            expect(result.mfrs1Compliance).toBe(true);
            expect(result.transitionAdjustments).toBeDefined();
        });

        it('should validate comparative information restatement', () => {
            const comparativeData = {
                currentYear: 2024,
                priorYear: 2023,
                restatedPriorYear: true,
                restatementReasons: ['MFRS 1 adoption', 'Accounting policy changes'],
            };

            const result = validateMFRSCompliance('MFRS1', { comparativeData });
            expect(result.valid).toBe(true);
            expect(result.comparativeRestatement).toBe(true);
        });
    });

    describe('MFRS 9 - Financial Instruments', () => {
        it('should validate financial instrument classification', () => {
            const financialInstrument = {
                type: 'DEBT_INSTRUMENT',
                classification: 'AMORTIZED_COST',
                businessModel: 'HOLD_TO_COLLECT',
                cashFlowCharacteristics: 'SPPI',
                fairValue: 100000,
                amortizedCost: 95000,
            };

            const result = validateMFRSCompliance('MFRS9', { financialInstrument });
            expect(result.valid).toBe(true);
            expect(result.mfrs9Classification).toBe(true);
            expect(result.businessModelTest).toBe(true);
            expect(result.sppiTest).toBe(true);
        });

        it('should validate expected credit loss (ECL) calculation', () => {
            const eclData = {
                grossCarryingAmount: 1000000,
                probabilityOfDefault: 0.05,
                lossGivenDefault: 0.4,
                exposureAtDefault: 1000000,
                expectedCreditLoss: 20000, // 5% * 40% * 1,000,000
            };

            const result = validateMFRSCompliance('MFRS9', { eclData });
            expect(result.valid).toBe(true);
            expect(result.eclCalculation).toBe(true);
            expect(result.eclAmount).toBe(20000);
        });

        it('should validate hedge accounting requirements', () => {
            const hedgeData = {
                hedgeType: 'CASH_FLOW_HEDGE',
                hedgedItem: 'FOREIGN_CURRENCY_EXPOSURE',
                hedgingInstrument: 'FORWARD_CONTRACT',
                hedgeEffectiveness: 0.95, // 95% effectiveness
                hedgeDocumentation: true,
                hedgeTesting: true,
            };

            const result = validateMFRSCompliance('MFRS9', { hedgeData });
            expect(result.valid).toBe(true);
            expect(result.hedgeAccounting).toBe(true);
            expect(result.hedgeEffectiveness).toBe(true);
        });
    });

    describe('MFRS 15 - Revenue from Contracts with Customers', () => {
        it('should validate five-step revenue recognition model', () => {
            const revenueData = {
                step1_identifyContract: true,
                step2_identifyPerformanceObligations: true,
                step3_determineTransactionPrice: 100000,
                step4_allocateTransactionPrice: true,
                step5_recognizeRevenue: true,
                performanceObligations: [
                    {
                        id: '1',
                        description: 'Software License',
                        standaloneSellingPrice: 80000,
                        allocatedPrice: 80000,
                    },
                    {
                        id: '2',
                        description: 'Support Services',
                        standaloneSellingPrice: 20000,
                        allocatedPrice: 20000,
                    },
                ],
            };

            const result = validateMFRSCompliance('MFRS15', { revenueData });
            expect(result.valid).toBe(true);
            expect(result.fiveStepModel).toBe(true);
            expect(result.performanceObligations).toBeDefined();
        });

        it('should validate contract modifications', () => {
            const contractModification = {
                originalContractValue: 100000,
                modificationValue: 20000,
                modificationType: 'ADDITIONAL_GOODS',
                separateContract: false,
                cumulativeCatchUp: 5000,
            };

            const result = validateMFRSCompliance('MFRS15', { contractModification });
            expect(result.valid).toBe(true);
            expect(result.contractModification).toBe(true);
        });

        it('should validate variable consideration', () => {
            const variableConsideration = {
                type: 'BONUS_PAYMENT',
                amount: 10000,
                probability: 0.8,
                expectedValue: 8000,
                constraint: 'REVERSE_ACCUMULATED_PROBABILITY',
            };

            const result = validateMFRSCompliance('MFRS15', { variableConsideration });
            expect(result.valid).toBe(true);
            expect(result.variableConsideration).toBe(true);
        });
    });

    describe('MFRS 16 - Leases', () => {
        it('should validate lease classification', () => {
            const leaseData = {
                leaseTerm: 5,
                assetUsefulLife: 10,
                presentValue: 80000,
                fairValue: 100000,
                classification: 'FINANCE_LEASE',
                criteria: {
                    ownershipTransfer: false,
                    purchaseOption: false,
                    leaseTerm: true, // 5/10 = 50% > 50%
                    presentValue: true, // 80% > 90%
                    specializedAsset: false,
                },
            };

            const result = validateMFRSCompliance('MFRS16', { leaseData });
            expect(result.valid).toBe(true);
            expect(result.leaseClassification).toBe(true);
            expect(result.financeLease).toBe(true);
        });

        it('should validate lease measurement', () => {
            const leaseMeasurement = {
                leaseLiability: 80000,
                rightOfUseAsset: 80000,
                initialDirectCosts: 2000,
                leaseIncentives: 1000,
                dismantlingCosts: 3000,
                netInvestment: 84000,
            };

            const result = validateMFRSCompliance('MFRS16', { leaseMeasurement });
            expect(result.valid).toBe(true);
            expect(result.leaseMeasurement).toBe(true);
        });

        it('should validate lease modifications', () => {
            const leaseModification = {
                originalLease: {
                    term: 5,
                    payments: 20000,
                },
                modification: {
                    additionalTerm: 2,
                    additionalPayments: 15000,
                    modificationType: 'LEASE_EXTENSION',
                },
                remeasurement: true,
                newLease: false,
            };

            const result = validateMFRSCompliance('MFRS16', { leaseModification });
            expect(result.valid).toBe(true);
            expect(result.leaseModification).toBe(true);
        });
    });

    describe('MFRS 109 - Income Taxes', () => {
        it('should validate deferred tax calculation', () => {
            const taxData = {
                taxableProfit: 100000,
                accountingProfit: 120000,
                temporaryDifferences: {
                    depreciation: 20000,
                    provisions: 5000,
                    revaluations: 10000,
                },
                taxRate: 0.24, // Malaysia corporate tax rate
                currentTax: 24000,
                deferredTaxLiability: 8400, // 35,000 * 0.24
                deferredTaxAsset: 0,
            };

            const result = validateMFRSCompliance('MFRS109', { taxData });
            expect(result.valid).toBe(true);
            expect(result.deferredTaxCalculation).toBe(true);
            expect(result.taxRate).toBe(0.24);
        });

        it('should validate tax base calculations', () => {
            const taxBaseData = {
                carryingAmount: 100000,
                taxBase: 80000,
                temporaryDifference: 20000,
                taxableTemporaryDifference: true,
                deductibleTemporaryDifference: false,
            };

            const result = validateMFRSCompliance('MFRS109', { taxBaseData });
            expect(result.valid).toBe(true);
            expect(result.taxBaseCalculation).toBe(true);
        });
    });

    describe('Malaysian Tax Compliance', () => {
        it('should validate SST (Sales and Service Tax) compliance', () => {
            const sstData = {
                taxableSales: 1000000,
                sstRate: 0.06, // 6% SST rate
                sstAmount: 60000,
                inputSST: 30000,
                netSST: 30000,
                sstRegistration: true,
                sstReturn: {
                    period: '2024-01',
                    dueDate: '2024-02-28',
                    filed: true,
                },
            };

            const result = validateMalaysianTaxCompliance('SST', sstData);
            expect(result.valid).toBe(true);
            expect(result.sstCompliance).toBe(true);
            expect(result.sstCalculation).toBe(true);
        });

        it('should validate corporate tax compliance', () => {
            const corporateTaxData = {
                chargeableIncome: 500000,
                taxRate: 0.24, // 24% for companies
                taxPayable: 120000,
                taxPaid: 30000, // Quarterly payments
                balancePayable: 90000,
                taxReturn: {
                    year: 2024,
                    dueDate: '2025-07-31',
                    filed: false,
                },
            };

            const result = validateMalaysianTaxCompliance('CORPORATE_TAX', corporateTaxData);
            expect(result.valid).toBe(true);
            expect(result.corporateTaxCompliance).toBe(true);
            expect(result.taxCalculation).toBe(true);
        });

        it('should validate withholding tax compliance', () => {
            const withholdingTaxData = {
                payments: [
                    {
                        type: 'DIVIDEND',
                        amount: 100000,
                        withholdingRate: 0.25,
                        withholdingAmount: 25000,
                    },
                    {
                        type: 'INTEREST',
                        amount: 50000,
                        withholdingRate: 0.15,
                        withholdingAmount: 7500,
                    },
                ],
                totalWithholding: 32500,
                remittance: {
                    dueDate: '2024-02-15',
                    remitted: true,
                },
            };

            const result = validateMalaysianTaxCompliance('WITHHOLDING_TAX', withholdingTaxData);
            expect(result.valid).toBe(true);
            expect(result.withholdingTaxCompliance).toBe(true);
        });
    });

    describe('Malaysian Regulatory Compliance', () => {
        it('should validate Companies Act 2016 compliance', () => {
            const companiesActData = {
                companyType: 'PRIVATE_LIMITED',
                shareCapital: 1000000,
                paidUpCapital: 500000,
                directors: 2,
                minimumDirectors: 1,
                companySecretary: true,
                registeredOffice: true,
                annualReturn: {
                    dueDate: '2024-01-31',
                    filed: true,
                },
            };

            const result = validateMFRSCompliance('COMPANIES_ACT_2016', companiesActData);
            expect(result.valid).toBe(true);
            expect(result.companiesActCompliance).toBe(true);
        });

        it('should validate Bursa Malaysia listing requirements', () => {
            const bursaData = {
                listingStatus: 'MAIN_MARKET',
                marketCapitalization: 500000000, // RM 500 million
                minimumMarketCap: 500000000,
                publicShareholding: 0.25, // 25%
                minimumPublicShareholding: 0.25,
                quarterlyReporting: true,
                annualReport: {
                    dueDate: '2024-04-30',
                    filed: true,
                },
            };

            const result = validateMFRSCompliance('BURSA_MALAYSIA', bursaData);
            expect(result.valid).toBe(true);
            expect(result.bursaCompliance).toBe(true);
        });

        it('should validate Securities Commission requirements', () => {
            const scData = {
                prospectus: {
                    required: true,
                    approved: true,
                    validityPeriod: 6, // months
                },
                continuousDisclosure: true,
                corporateGovernance: {
                    boardComposition: 'INDEPENDENT_MAJORITY',
                    auditCommittee: true,
                    nominationCommittee: true,
                    remunerationCommittee: true,
                },
            };

            const result = validateMFRSCompliance('SECURITIES_COMMISSION', scData);
            expect(result.valid).toBe(true);
            expect(result.scCompliance).toBe(true);
        });
    });

    describe('Multi-Currency and FX Compliance', () => {
        it('should validate foreign exchange translation', () => {
            const fxData = {
                functionalCurrency: 'MYR',
                presentationCurrency: 'MYR',
                foreignOperations: [
                    {
                        currency: 'USD',
                        netAssets: 100000,
                        exchangeRate: 4.5,
                        translatedAmount: 450000,
                        translationMethod: 'CURRENT_RATE',
                    },
                ],
                translationReserve: 50000,
            };

            const result = validateMFRSCompliance('MFRS21', fxData);
            expect(result.valid).toBe(true);
            expect(result.fxTranslation).toBe(true);
        });

        it('should validate foreign exchange hedging', () => {
            const hedgingData = {
                hedgedItem: 'FOREIGN_CURRENCY_ASSET',
                hedgingInstrument: 'FORWARD_CONTRACT',
                hedgeRatio: 1.0,
                hedgeEffectiveness: 0.95,
                hedgeDocumentation: true,
                hedgeTesting: true,
            };

            const result = validateMFRSCompliance('MFRS9', hedgingData);
            expect(result.valid).toBe(true);
            expect(result.fxHedging).toBe(true);
        });
    });

    describe('Consolidation and Group Reporting', () => {
        it('should validate group consolidation requirements', () => {
            const consolidationData = {
                parentCompany: {
                    id: 'parent-001',
                    ownership: 100,
                    control: true,
                },
                subsidiaries: [
                    {
                        id: 'sub-001',
                        ownership: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                    },
                    {
                        id: 'sub-002',
                        ownership: 30,
                        control: false,
                        consolidationMethod: 'EQUITY',
                    },
                ],
                intercompanyEliminations: true,
                minorityInterests: 20000,
            };

            const result = validateMFRSCompliance('MFRS10', consolidationData);
            expect(result.valid).toBe(true);
            expect(result.consolidationCompliance).toBe(true);
        });

        it('should validate joint arrangements', () => {
            const jointArrangementData = {
                type: 'JOINT_VENTURE',
                ownership: 50,
                control: false,
                significantInfluence: true,
                accountingMethod: 'EQUITY_METHOD',
                jointControl: true,
            };

            const result = validateMFRSCompliance('MFRS11', jointArrangementData);
            expect(result.valid).toBe(true);
            expect(result.jointArrangementCompliance).toBe(true);
        });
    });

    describe('Disclosure Requirements', () => {
        it('should validate financial statement disclosures', () => {
            const disclosureData = {
                accountingPolicies: true,
                significantAccountingEstimates: true,
                relatedPartyTransactions: true,
                contingentLiabilities: true,
                commitments: true,
                subsequentEvents: true,
                goingConcern: true,
                segmentReporting: true,
            };

            const result = validateMFRSCompliance('MFRS1', { disclosureData });
            expect(result.valid).toBe(true);
            expect(result.disclosureCompliance).toBe(true);
        });

        it('should validate notes to financial statements', () => {
            const notesData = {
                note1_basisOfPreparation: true,
                note2_significantAccountingPolicies: true,
                note3_criticalAccountingJudgments: true,
                note4_estimatesAndAssumptions: true,
                note5_cashAndCashEquivalents: true,
                note6_tradeReceivables: true,
                note7_inventories: true,
                note8_propertyPlantAndEquipment: true,
                note9_intangibleAssets: true,
                note10_investments: true,
                note11_tradePayables: true,
                note12_borrowings: true,
                note13_provisions: true,
                note14_equity: true,
                note15_revenue: true,
                note16_otherIncome: true,
                note17_employeeBenefits: true,
                note18_financeCosts: true,
                note19_taxExpense: true,
                note20_earningsPerShare: true,
                note21_relatedPartyTransactions: true,
                note22_commitmentsAndContingencies: true,
                note23_subsequentEvents: true,
            };

            const result = validateMFRSCompliance('MFRS1', { notesData });
            expect(result.valid).toBe(true);
            expect(result.notesCompliance).toBe(true);
        });
    });
});
