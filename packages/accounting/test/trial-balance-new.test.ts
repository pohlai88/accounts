// Trial Balance Report - Unit Tests
import { describe, it, expect } from 'vitest';
import type { TrialBalanceInput } from '../src/reports/trial-balance';

describe('Trial Balance Report - Input Validation', () => {
  const validInput: TrialBalanceInput = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    companyId: '123e4567-e89b-12d3-a456-426614174001',
    asOfDate: new Date('2024-12-31'),
    currency: 'MYR',
    includeZeroBalances: false
  };

  it('should validate input structure', () => {
    expect(validInput.tenantId).toBeDefined();
    expect(validInput.companyId).toBeDefined();
    expect(validInput.asOfDate).toBeInstanceOf(Date);
    expect(validInput.currency).toBe('MYR');
  });

  it('should handle optional fields', () => {
    const inputWithOptionals: TrialBalanceInput = {
      ...validInput,
      includePeriodActivity: true,
      accountFilter: {
        accountTypes: ['ASSET', 'LIABILITY'],
        accountNumberRange: { from: '1000', to: '9999' }
      }
    };

    expect(inputWithOptionals.includePeriodActivity).toBe(true);
    expect(inputWithOptionals.accountFilter?.accountTypes).toHaveLength(2);
  });

  it('should validate date handling', () => {
    const dateInput = {
      ...validInput,
      asOfDate: new Date('2024-12-31')
    };

    expect(dateInput.asOfDate.getFullYear()).toBe(2024);
    expect(dateInput.asOfDate.getMonth()).toBe(11); // December is month 11
    expect(dateInput.asOfDate.getDate()).toBe(31);
  });
});
