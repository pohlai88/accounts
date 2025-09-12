// React Hooks for Permission Checking
// Client-side hooks that work with the enhanced auth system

"use client";

import { useMemo } from 'react';
import { canPerformAction, isFeatureEnabled, type UserContext, type FeatureFlags, type PolicySettings } from '@aibos/auth';

// Client-side user context (passed from server)
export interface ClientUserContext {
    id: string;
    tenantId: string;
    companyId: string;
    roles: string[];
    featureFlags: FeatureFlags;
    policySettings: PolicySettings;
    memberPermissions?: {
        roles?: string[];
        allow?: string[];
        deny?: string[];
        overrides?: Record<string, unknown>;
    };
}

/**
 * Hook to check if user can perform an action
 */
export function useCanPerform(
    user: ClientUserContext | null,
    action: string,
    context: { amount?: number; module?: string; creatorRole?: string } = {}
): boolean {
    return useMemo(() => {
        if (!user) return false;

        const userContext: UserContext = {
            id: user.id,
            tenantId: user.tenantId,
            companyId: user.companyId,
            roles: user.roles,
            permissions: user.memberPermissions
        };

        const decision = canPerformAction(
            userContext,
            action,
            context,
            user.featureFlags,
            user.policySettings
        );

        return decision.allowed;
    }, [user, action, context]);
}

/**
 * Hook to check if feature is enabled
 */
export function useHasFeature(
    user: ClientUserContext | null,
    feature: string
): boolean {
    return useMemo(() => {
        if (!user) return false;
        return isFeatureEnabled(feature, user.featureFlags, user.roles);
    }, [user, feature]);
}

/**
 * Hook to get permission decision with details
 */
export function usePermissionDecision(
    user: ClientUserContext | null,
    action: string,
    context: { amount?: number; module?: string; creatorRole?: string } = {}
): { allowed: boolean; requiresApproval?: boolean; reason?: string } {
    return useMemo(() => {
        if (!user) {
            return { allowed: false, reason: 'No user context' };
        }

        const userContext: UserContext = {
            id: user.id,
            tenantId: user.tenantId,
            companyId: user.companyId,
            roles: user.roles,
            permissions: user.memberPermissions
        };

        return canPerformAction(
            userContext,
            action,
            context,
            user.featureFlags,
            user.policySettings
        );
    }, [user, action, context]);
}

/**
 * Hook to get all user capabilities
 */
export function useUserCapabilities(user: ClientUserContext | null) {
    return useMemo(() => {
        if (!user) {
            return {
                canPerform: () => false,
                hasFeature: () => false,
                getDecision: () => ({ allowed: false, reason: 'No user context' })
            };
        }

        const userContext: UserContext = {
            id: user.id,
            tenantId: user.tenantId,
            companyId: user.companyId,
            roles: user.roles,
            permissions: user.memberPermissions
        };

        return {
            canPerform: (action: string, context: { amount?: number; module?: string; creatorRole?: string } = {}) => {
                const decision = canPerformAction(userContext, action, context, user.featureFlags, user.policySettings);
                return decision.allowed;
            },
            hasFeature: (feature: string) => {
                return isFeatureEnabled(feature, user.featureFlags, user.roles);
            },
            getDecision: (action: string, context: { amount?: number; module?: string; creatorRole?: string } = {}) => {
                return canPerformAction(userContext, action, context, user.featureFlags, user.policySettings);
            }
        };
    }, [user]);
}
