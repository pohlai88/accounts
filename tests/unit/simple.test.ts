// Simple Unit Test - Test Configuration Validation
// This test validates that our SSOT-compliant configuration works correctly

import { describe, it, expect } from 'vitest';
import { testConfig } from '../config/test-config';

describe('Test Configuration Validation', () => {
    it('should have valid test configuration', () => {
        // Test that our test configuration is properly loaded
        expect(testConfig).toBeDefined();
        expect(testConfig.testData).toBeDefined();
        expect(testConfig.testData.tenantId).toBe('test-tenant-001');
        expect(testConfig.testData.companyId).toBe('test-company-001');
        expect(testConfig.testData.baseCurrency).toBe('MYR');
    });

    it('should have valid performance thresholds', () => {
        // Test that performance thresholds are set correctly
        expect(testConfig.performance).toBeDefined();
        expect(testConfig.performance.apiResponseTime.p95).toBe(500);
        expect(testConfig.performance.apiResponseTime.p99).toBe(1000);
        expect(testConfig.performance.errorRate.max).toBe(1);
        expect(testConfig.performance.throughput.min).toBe(100);
    });

    it('should have valid coverage requirements', () => {
        // Test that coverage requirements are set correctly
        expect(testConfig.coverage).toBeDefined();
        expect(testConfig.coverage.global.branches).toBe(95);
        expect(testConfig.coverage.global.functions).toBe(95);
        expect(testConfig.coverage.global.lines).toBe(95);
        expect(testConfig.coverage.global.statements).toBe(95);
    });

    it('should have valid API endpoints', () => {
        // Test that API endpoints are configured correctly
        expect(testConfig.endpoints).toBeDefined();
        expect(testConfig.endpoints.baseUrl).toBeDefined();
        expect(testConfig.endpoints.invoices).toBe('/api/invoices');
        expect(testConfig.endpoints.bills).toBe('/api/bills');
        expect(testConfig.endpoints.payments).toBe('/api/payments');
    });

    it('should have valid security settings', () => {
        // Test that security settings are enabled
        expect(testConfig.security).toBeDefined();
        expect(testConfig.security.rlsEnabled).toBe(true);
        expect(testConfig.security.auditLogging).toBe(true);
        expect(testConfig.security.encryption).toBe(true);
    });
});

describe('Malaysian Test Data Validation', () => {
    it('should validate Malaysian test data generation', async () => {
        // Test that we can generate Malaysian-specific test data
        const { createTestCustomer, createTestInvoice } = await import('../config/deterministic-test-data');

        const customer = createTestCustomer();
        expect(customer).toBeDefined();
        expect(customer.country).toBe('Malaysia');
        expect(customer.currency).toBe('MYR');
        expect(customer.registrationNumber).toMatch(/^\d{6}-A$/);
    });

    it('should validate Malaysian tax rates', async () => {
        // Test that Malaysian tax rates are correctly configured
        const { MALAYSIAN_TEST_DATA } = await import('../config/deterministic-test-data');

        expect(MALAYSIAN_TEST_DATA.taxRates.SST).toBe(0.06); // 6% SST
        expect(MALAYSIAN_TEST_DATA.taxRates.corporateTax).toBe(0.24); // 24% Corporate Tax
        expect(MALAYSIAN_TEST_DATA.currencies.primary).toBe('MYR');
    });
});

describe('Environment Configuration', () => {
    it('should have correct environment variables', () => {
        // Test that environment variables are set correctly
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.TEST_DETERMINISTIC).toBe('true');
        expect(process.env.TEST_SEED).toBe('12345');
    });
});
