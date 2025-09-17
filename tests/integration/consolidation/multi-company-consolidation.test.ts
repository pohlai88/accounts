// Integration Tests for Multi-Company Consolidation Features
// Tests consolidation workflows, intercompany eliminations, and group reporting

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { testConfig, createTestConsolidationGroup, createTestCompany, createTestIntercompanyTransaction } from '../../config/test-config';
import { ApiClient } from '@aibos/ui/lib/api-client';

describe('Multi-Company Consolidation Integration', () => {
    let apiClient: ApiClient;
    let consolidationGroup: any;
    let parentCompany: any;
    let subsidiary1: any;
    let subsidiary2: any;

    beforeAll(async () => {
        apiClient = new ApiClient();

        // Create consolidation group
        consolidationGroup = await createTestConsolidationGroup({
            name: 'Test Consolidation Group',
            reportingCurrency: 'MYR',
            reportingPeriod: '2024-Q1',
        });
    });

    afterAll(async () => {
        // Cleanup consolidation group
        if (consolidationGroup?.id) {
            await apiClient.deleteConsolidationGroup(consolidationGroup.id);
        }
    });

    beforeEach(async () => {
        // Create test companies for each test
        parentCompany = await createTestCompany({
            name: 'Parent Company Sdn Bhd',
            registrationNumber: '123456-A',
            country: 'Malaysia',
            currency: 'MYR',
            companyType: 'PRIVATE_LIMITED',
        });

        subsidiary1 = await createTestCompany({
            name: 'Subsidiary 1 Sdn Bhd',
            registrationNumber: '123457-A',
            country: 'Malaysia',
            currency: 'MYR',
            companyType: 'PRIVATE_LIMITED',
        });

        subsidiary2 = await createTestCompany({
            name: 'Subsidiary 2 Sdn Bhd',
            registrationNumber: '123458-A',
            country: 'Malaysia',
            currency: 'MYR',
            companyType: 'PRIVATE_LIMITED',
        });
    });

    afterEach(async () => {
        // Cleanup test companies
        if (parentCompany?.id) await apiClient.deleteCompany(parentCompany.id);
        if (subsidiary1?.id) await apiClient.deleteCompany(subsidiary1.id);
        if (subsidiary2?.id) await apiClient.deleteCompany(subsidiary2.id);
    });

    describe('Consolidation Group Management', () => {
        it('should create consolidation group with companies', async () => {
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                reportingPeriod: '2024-Q1',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const result = await apiClient.createConsolidationGroup(groupData);

            expect(result.success).toBe(true);
            expect(result.group).toBeDefined();
            expect(result.group.companies).toHaveLength(2);
            expect(result.group.reportingCurrency).toBe('MYR');
        });

        it('should add company to consolidation group', async () => {
            // First create group with parent
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Add subsidiary
            const addCompanyData = {
                companyId: subsidiary1.id,
                ownershipPercentage: 80,
                control: true,
                consolidationMethod: 'FULL',
                role: 'SUBSIDIARY',
            };

            const result = await apiClient.addCompanyToGroup(groupId, addCompanyData);

            expect(result.success).toBe(true);
            expect(result.group.companies).toHaveLength(2);
        });

        it('should update company ownership in group', async () => {
            // Create group with companies
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Update ownership
            const updateData = {
                companyId: subsidiary1.id,
                ownershipPercentage: 90,
                control: true,
            };

            const result = await apiClient.updateCompanyOwnership(groupId, updateData);

            expect(result.success).toBe(true);
            expect(result.group.companies.find((c: any) => c.companyId === subsidiary1.id).ownershipPercentage).toBe(90);
        });
    });

    describe('Intercompany Transaction Management', () => {
        it('should create intercompany transaction', async () => {
            const transactionData = {
                fromCompanyId: parentCompany.id,
                toCompanyId: subsidiary1.id,
                transactionType: 'SALE',
                amount: 100000,
                currency: 'MYR',
                description: 'Intercompany sale of goods',
                transactionDate: '2024-01-15',
                lineItems: [
                    {
                        description: 'Goods sold',
                        quantity: 100,
                        unitPrice: 1000,
                        total: 100000,
                    },
                ],
            };

            const result = await apiClient.createIntercompanyTransaction(transactionData);

            expect(result.success).toBe(true);
            expect(result.transaction).toBeDefined();
            expect(result.transaction.fromCompanyId).toBe(parentCompany.id);
            expect(result.transaction.toCompanyId).toBe(subsidiary1.id);
        });

        it('should eliminate intercompany transactions', async () => {
            // Create intercompany transaction
            const transactionData = {
                fromCompanyId: parentCompany.id,
                toCompanyId: subsidiary1.id,
                transactionType: 'SALE',
                amount: 100000,
                currency: 'MYR',
                description: 'Intercompany sale',
                transactionDate: '2024-01-15',
            };

            const transactionResult = await apiClient.createIntercompanyTransaction(transactionData);
            const transactionId = transactionResult.transaction.id;

            // Create consolidation group
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Run consolidation with elimination
            const consolidationData = {
                groupId: groupId,
                period: '2024-Q1',
                eliminateIntercompany: true,
            };

            const result = await apiClient.runConsolidation(consolidationData);

            expect(result.success).toBe(true);
            expect(result.consolidation).toBeDefined();
            expect(result.consolidation.eliminations).toBeDefined();
            expect(result.consolidation.eliminations.length).toBeGreaterThan(0);
        });

        it('should handle intercompany receivables and payables', async () => {
            // Create intercompany transaction
            const transactionData = {
                fromCompanyId: parentCompany.id,
                toCompanyId: subsidiary1.id,
                transactionType: 'SALE',
                amount: 100000,
                currency: 'MYR',
                description: 'Intercompany sale',
                transactionDate: '2024-01-15',
                paymentTerms: 30,
            };

            await apiClient.createIntercompanyTransaction(transactionData);

            // Create consolidation group
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Run consolidation
            const consolidationData = {
                groupId: groupId,
                period: '2024-Q1',
                eliminateIntercompany: true,
            };

            const result = await apiClient.runConsolidation(consolidationData);

            expect(result.success).toBe(true);
            expect(result.consolidation.eliminations).toBeDefined();

            // Check that intercompany receivables and payables are eliminated
            const receivablesElimination = result.consolidation.eliminations.find(
                (e: any) => e.type === 'INTERCOMPANY_RECEIVABLES'
            );
            const payablesElimination = result.consolidation.eliminations.find(
                (e: any) => e.type === 'INTERCOMPANY_PAYABLES'
            );

            expect(receivablesElimination).toBeDefined();
            expect(payablesElimination).toBeDefined();
            expect(receivablesElimination.amount).toBe(100000);
            expect(payablesElimination.amount).toBe(100000);
        });
    });

    describe('Consolidated Financial Statements', () => {
        it('should generate consolidated balance sheet', async () => {
            // Create consolidation group
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Run consolidation
            const consolidationData = {
                groupId: groupId,
                period: '2024-Q1',
                eliminateIntercompany: true,
            };

            const consolidationResult = await apiClient.runConsolidation(consolidationData);

            // Generate consolidated balance sheet
            const balanceSheetData = {
                consolidationId: consolidationResult.consolidation.id,
                statementType: 'BALANCE_SHEET',
                asAtDate: '2024-03-31',
            };

            const result = await apiClient.generateConsolidatedStatement(balanceSheetData);

            expect(result.success).toBe(true);
            expect(result.statement).toBeDefined();
            expect(result.statement.type).toBe('BALANCE_SHEET');
            expect(result.statement.assets).toBeDefined();
            expect(result.statement.liabilities).toBeDefined();
            expect(result.statement.equity).toBeDefined();
        });

        it('should generate consolidated profit and loss', async () => {
            // Create consolidation group
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Run consolidation
            const consolidationData = {
                groupId: groupId,
                period: '2024-Q1',
                eliminateIntercompany: true,
            };

            const consolidationResult = await apiClient.runConsolidation(consolidationData);

            // Generate consolidated P&L
            const pnlData = {
                consolidationId: consolidationResult.consolidation.id,
                statementType: 'PROFIT_LOSS',
                period: '2024-Q1',
            };

            const result = await apiClient.generateConsolidatedStatement(pnlData);

            expect(result.success).toBe(true);
            expect(result.statement).toBeDefined();
            expect(result.statement.type).toBe('PROFIT_LOSS');
            expect(result.statement.revenue).toBeDefined();
            expect(result.statement.expenses).toBeDefined();
            expect(result.statement.netIncome).toBeDefined();
        });

        it('should generate consolidated cash flow statement', async () => {
            // Create consolidation group
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Run consolidation
            const consolidationData = {
                groupId: groupId,
                period: '2024-Q1',
                eliminateIntercompany: true,
            };

            const consolidationResult = await apiClient.runConsolidation(consolidationData);

            // Generate consolidated cash flow
            const cashFlowData = {
                consolidationId: consolidationResult.consolidation.id,
                statementType: 'CASH_FLOW',
                period: '2024-Q1',
            };

            const result = await apiClient.generateConsolidatedStatement(cashFlowData);

            expect(result.success).toBe(true);
            expect(result.statement).toBeDefined();
            expect(result.statement.type).toBe('CASH_FLOW');
            expect(result.statement.operatingActivities).toBeDefined();
            expect(result.statement.investingActivities).toBeDefined();
            expect(result.statement.financingActivities).toBeDefined();
        });
    });

    describe('Multi-Currency Consolidation', () => {
        it('should handle multi-currency consolidation', async () => {
            // Create foreign subsidiary
            const foreignSubsidiary = await createTestCompany({
                name: 'Foreign Subsidiary Ltd',
                registrationNumber: '987654',
                country: 'Singapore',
                currency: 'SGD',
                companyType: 'PRIVATE_LIMITED',
            });

            // Create consolidation group with multi-currency
            const groupData = {
                name: 'Multi-Currency Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: foreignSubsidiary.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Set exchange rates
            const exchangeRates = {
                'SGD': 3.4, // 1 SGD = 3.4 MYR
                'MYR': 1.0,
            };

            await apiClient.setExchangeRates(groupId, exchangeRates);

            // Run consolidation
            const consolidationData = {
                groupId: groupId,
                period: '2024-Q1',
                eliminateIntercompany: true,
                translateCurrencies: true,
            };

            const result = await apiClient.runConsolidation(consolidationData);

            expect(result.success).toBe(true);
            expect(result.consolidation).toBeDefined();
            expect(result.consolidation.currencyTranslation).toBeDefined();
            expect(result.consolidation.currencyTranslation.SGD).toBe(3.4);
        });
    });

    describe('Minority Interests', () => {
        it('should calculate minority interests correctly', async () => {
            // Create consolidation group with partial ownership
            const groupData = {
                name: 'Test Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 70, // 70% ownership, 30% minority
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const groupResult = await apiClient.createConsolidationGroup(groupData);
            const groupId = groupResult.group.id;

            // Run consolidation
            const consolidationData = {
                groupId: groupId,
                period: '2024-Q1',
                eliminateIntercompany: true,
            };

            const result = await apiClient.runConsolidation(consolidationData);

            expect(result.success).toBe(true);
            expect(result.consolidation).toBeDefined();
            expect(result.consolidation.minorityInterests).toBeDefined();
            expect(result.consolidation.minorityInterests.percentage).toBe(30);
        });
    });

    describe('Consolidation Validation', () => {
        it('should validate consolidation group requirements', async () => {
            const invalidGroupData = {
                name: 'Invalid Group',
                reportingCurrency: 'MYR',
                companies: [], // No companies
            };

            const result = await apiClient.createConsolidationGroup(invalidGroupData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('At least one company required');
        });

        it('should validate ownership percentages', async () => {
            const invalidGroupData = {
                name: 'Invalid Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 150, // Invalid percentage
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                ],
            };

            const result = await apiClient.createConsolidationGroup(invalidGroupData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Ownership percentage must be between 0 and 100');
        });

        it('should validate consolidation method consistency', async () => {
            const invalidGroupData = {
                name: 'Invalid Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    {
                        companyId: subsidiary1.id,
                        ownershipPercentage: 30,
                        control: false, // No control but using FULL method
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    },
                ],
            };

            const result = await apiClient.createConsolidationGroup(invalidGroupData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Full consolidation requires control');
        });
    });

    describe('Performance Testing', () => {
        it('should handle large consolidation groups efficiently', async () => {
            // Create multiple subsidiaries
            const subsidiaries = [];
            for (let i = 0; i < 10; i++) {
                const subsidiary = await createTestCompany({
                    name: `Subsidiary ${i} Sdn Bhd`,
                    registrationNumber: `12345${i}-A`,
                    country: 'Malaysia',
                    currency: 'MYR',
                    companyType: 'PRIVATE_LIMITED',
                });
                subsidiaries.push(subsidiary);
            }

            // Create consolidation group with many companies
            const groupData = {
                name: 'Large Group',
                reportingCurrency: 'MYR',
                companies: [
                    {
                        companyId: parentCompany.id,
                        ownershipPercentage: 100,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'PARENT',
                    },
                    ...subsidiaries.map((sub, index) => ({
                        companyId: sub.id,
                        ownershipPercentage: 80,
                        control: true,
                        consolidationMethod: 'FULL',
                        role: 'SUBSIDIARY',
                    })),
                ],
            };

            const startTime = performance.now();
            const result = await apiClient.createConsolidationGroup(groupData);
            const duration = performance.now() - startTime;

            expect(result.success).toBe(true);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

            // Cleanup
            await apiClient.deleteConsolidationGroup(result.group.id);
            for (const sub of subsidiaries) {
                await apiClient.deleteCompany(sub.id);
            }
        });
    });
});
