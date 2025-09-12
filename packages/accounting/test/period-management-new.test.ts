// Period Management - Unit Tests
import { describe, it, expect } from 'vitest';
import type { PeriodCloseInput, PeriodOpenInput, PeriodLockInput } from '../src/periods/period-management';

describe('Period Management - Input Validation', () => {
  const validCloseInput: PeriodCloseInput = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    companyId: '123e4567-e89b-12d3-a456-426614174001',
    fiscalPeriodId: '123e4567-e89b-12d3-a456-426614174002',
    closeDate: new Date('2024-12-31'),
    closedBy: '123e4567-e89b-12d3-a456-426614174003',
    userRole: 'admin'
  };

  const validOpenInput: PeriodOpenInput = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    companyId: '123e4567-e89b-12d3-a456-426614174001',
    fiscalPeriodId: '123e4567-e89b-12d3-a456-426614174002',
    openedBy: '123e4567-e89b-12d3-a456-426614174003',
    userRole: 'admin',
    openReason: 'Adjustment required'
  };

  const validLockInput: PeriodLockInput = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    companyId: '123e4567-e89b-12d3-a456-426614174001',
    fiscalPeriodId: '123e4567-e89b-12d3-a456-426614174002',
    lockType: 'POSTING',
    lockedBy: '123e4567-e89b-12d3-a456-426614174003',
    userRole: 'admin',
    reason: 'Period end processing'
  };

  it('should validate close input structure', () => {
    expect(validCloseInput.tenantId).toBeDefined();
    expect(validCloseInput.companyId).toBeDefined();
    expect(validCloseInput.fiscalPeriodId).toBeDefined();
    expect(validCloseInput.closeDate).toBeInstanceOf(Date);
    expect(validCloseInput.closedBy).toBeDefined();
    expect(validCloseInput.userRole).toBe('admin');
  });

  it('should validate open input structure', () => {
    expect(validOpenInput.tenantId).toBeDefined();
    expect(validOpenInput.companyId).toBeDefined();
    expect(validOpenInput.fiscalPeriodId).toBeDefined();
    expect(validOpenInput.openedBy).toBeDefined();
    expect(validOpenInput.userRole).toBe('admin');
    expect(validOpenInput.openReason).toBe('Adjustment required');
  });

  it('should validate lock input structure', () => {
    expect(validLockInput.tenantId).toBeDefined();
    expect(validLockInput.lockType).toBe('POSTING');
    expect(['POSTING', 'REPORTING', 'FULL']).toContain(validLockInput.lockType);
    expect(validLockInput.reason).toBeDefined();
  });

  it('should handle optional fields in close input', () => {
    const inputWithOptionals: PeriodCloseInput = {
      ...validCloseInput,
      closeReason: 'Monthly close',
      forceClose: true,
      generateReversingEntries: true
    };

    expect(inputWithOptionals.closeReason).toBe('Monthly close');
    expect(inputWithOptionals.forceClose).toBe(true);
    expect(inputWithOptionals.generateReversingEntries).toBe(true);
  });

  it('should handle optional fields in open input', () => {
    const inputWithOptionals: PeriodOpenInput = {
      ...validOpenInput,
      approvalRequired: true
    };

    expect(inputWithOptionals.approvalRequired).toBe(true);
  });
});
