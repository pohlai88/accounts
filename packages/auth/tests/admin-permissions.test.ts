// Admin Permission System Tests
// Validates the enhanced RBAC + ABAC + Feature Flag system

import { describe, it, expect } from 'vitest';
import {
    canPerformAction,
    isFeatureEnabled,
    GOVERNANCE_PACKS,
    applyGovernancePack,
    getRecommendedPack,
    type UserContext,
    type FeatureFlags,
    type PolicySettings
} from '../src';

describe('Enhanced Permission System', () => {
    const mockUser: UserContext = {
        id: 'user-123',
        tenantId: 'tenant-456',
        companyId: 'company-789',
        roles: ['accountant']
    };

    const mockFeatureFlags: FeatureFlags = {
        attachments: true,
        reports: true,
        ar: true,
        ap: false,
        je: false,
        regulated_mode: false
    };

    const mockPolicySettings: PolicySettings = {
        approval_threshold_rm: 50000,
        export_requires_reason: false,
        mfa_required_for_admin: true,
        session_timeout_minutes: 480
    };

    describe('RBAC (Role-Based Access Control)', () => {
        it('should allow accountant to create invoices', () => {
            const decision = canPerformAction(
                mockUser,
                'invoice:create',
                {},
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(true);
        });

        it('should deny accountant admin access', () => {
            const decision = canPerformAction(
                mockUser,
                'admin:access',
                {},
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(false);
            expect(decision.reason).toContain('not authorized');
        });

        it('should allow admin to access admin panel', () => {
            const adminUser: UserContext = {
                ...mockUser,
                roles: ['admin']
            };

            const decision = canPerformAction(
                adminUser,
                'admin:access',
                {},
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(true);
        });
    });

    describe('ABAC (Attribute-Based Access Control)', () => {
        it('should allow small amounts without approval', () => {
            const decision = canPerformAction(
                mockUser,
                'invoice:post',
                { amount: 10000, module: 'AR' },
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(true);
            expect(decision.requiresApproval).toBe(false);
        });

        it('should deny large amounts for non-approvers', () => {
            const decision = canPerformAction(
                mockUser,
                'invoice:post',
                { amount: 100000, module: 'AR' },
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(false);
            expect(decision.reason).toContain('exceeds threshold');
        });

        it('should allow large amounts for approvers', () => {
            const approverUser: UserContext = {
                ...mockUser,
                roles: ['admin'] // Admin is an approver role
            };

            const decision = canPerformAction(
                approverUser,
                'invoice:post',
                { amount: 100000, module: 'AR' },
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(true);
        });

        it('should respect user permission overrides', () => {
            const userWithOverrides: UserContext = {
                ...mockUser,
                permissions: {
                    overrides: {
                        approval_threshold_rm: 100000 // Higher personal threshold
                    }
                }
            };

            const decision = canPerformAction(
                userWithOverrides,
                'invoice:post',
                { amount: 75000, module: 'AR' },
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(true);
        });
    });

    describe('Feature Flags', () => {
        it('should deny actions when feature is disabled', () => {
            const decision = canPerformAction(
                mockUser,
                'payment:create',
                {},
                mockFeatureFlags, // AP is disabled
                mockPolicySettings
            );

            expect(decision.allowed).toBe(false);
            expect(decision.reason).toContain('Feature \'ap\' is disabled');
        });

        it('should check feature availability correctly', () => {
            expect(isFeatureEnabled('attachments', mockFeatureFlags, mockUser.roles)).toBe(true);
            expect(isFeatureEnabled('ap', mockFeatureFlags, mockUser.roles)).toBe(false);
        });

        it('should respect role-based feature restrictions', () => {
            const flagsWithRegulated: FeatureFlags = {
                ...mockFeatureFlags,
                regulated_mode: true
            };

            // Accountant should not have access to regulated mode
            expect(isFeatureEnabled('regulated_mode', flagsWithRegulated, ['accountant'])).toBe(false);

            // Admin should have access
            expect(isFeatureEnabled('regulated_mode', flagsWithRegulated, ['admin'])).toBe(true);
        });
    });

    describe('Permission Overrides', () => {
        it('should respect explicit allow permissions', () => {
            const userWithExplicitAllow: UserContext = {
                ...mockUser,
                roles: ['viewer'], // Viewer normally can't post invoices
                permissions: {
                    allow: ['invoice:post']
                }
            };

            const decision = canPerformAction(
                userWithExplicitAllow,
                'invoice:post',
                { amount: 1000 },
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(true);
        });

        it('should respect explicit deny permissions', () => {
            const userWithExplicitDeny: UserContext = {
                ...mockUser,
                roles: ['admin'], // Admin normally can access admin panel
                permissions: {
                    deny: ['admin:access']
                }
            };

            const decision = canPerformAction(
                userWithExplicitDeny,
                'admin:access',
                {},
                mockFeatureFlags,
                mockPolicySettings
            );

            expect(decision.allowed).toBe(false);
            expect(decision.reason).toBe('Explicitly denied');
        });
    });
});

describe('Governance Packs', () => {
    it('should provide correct pack recommendations', () => {
        expect(getRecommendedPack(5)).toBe('starter');
        expect(getRecommendedPack(50)).toBe('business');
        expect(getRecommendedPack(500)).toBe('enterprise');
        expect(getRecommendedPack(50, true)).toBe('regulated');
    });

    it('should have valid starter pack configuration', () => {
        const pack = applyGovernancePack('starter');

        expect(pack.name).toBe('Starter Pack');
        expect(pack.featureFlags.ar).toBe(true);
        expect(pack.featureFlags.ap).toBe(false);
        expect(pack.policySettings.approval_threshold_rm).toBe(50000);
        expect(pack.defaultRoles).toContain('owner');
        expect(pack.defaultRoles).toContain('accountant');
    });

    it('should have valid enterprise pack configuration', () => {
        const pack = applyGovernancePack('enterprise');

        expect(pack.name).toBe('Enterprise Pack');
        expect(pack.featureFlags.regulated_mode).toBe(true);
        expect(pack.policySettings.approval_threshold_rm).toBe(10000);
        expect(pack.policySettings.session_timeout_minutes).toBe(120);
        expect(pack.defaultRoles).toContain('auditor');
    });

    it('should have proper SoD separation in regulated pack', () => {
        const pack = applyGovernancePack('regulated');

        // CFO should not be able to create transactions (SoD)
        const cfoTemplate = pack.memberPermissionTemplates.cfo;
        expect(cfoTemplate.deny).toContain('invoice:create');
        expect(cfoTemplate.deny).toContain('payment:create');

        // Controller should not be able to create what they approve (SoD)
        const controllerTemplate = pack.memberPermissionTemplates.controller;
        expect(controllerTemplate.deny).toContain('invoice:create');
        expect(controllerTemplate.deny).toContain('payment:create');

        // Accountant should not be able to approve what they create (SoD)
        const accountantTemplate = pack.memberPermissionTemplates.accountant;
        expect(accountantTemplate.deny).toContain('invoice:approve');
        expect(accountantTemplate.deny).toContain('payment:approve');
    });

    it('should have all required governance packs', () => {
        expect(GOVERNANCE_PACKS.starter).toBeDefined();
        expect(GOVERNANCE_PACKS.business).toBeDefined();
        expect(GOVERNANCE_PACKS.enterprise).toBeDefined();
        expect(GOVERNANCE_PACKS.regulated).toBeDefined();
        expect(GOVERNANCE_PACKS.franchise).toBeDefined();
    });
});
