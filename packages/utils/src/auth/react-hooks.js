// React Hooks for Permission Checking
// Client-side hooks that work with the enhanced auth system
"use client";
import { useMemo } from "react";
import { canPerformAction, isFeatureEnabled } from "@aibos/auth";
/**
 * Hook to check if user can perform an action
 */
export function useCanPerform(user, action, context = {}) {
  return useMemo(() => {
    if (!user) return false;
    const userContext = {
      id: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.memberPermissions,
    };
    const decision = canPerformAction(
      userContext,
      action,
      context,
      user.featureFlags,
      user.policySettings,
    );
    return decision.allowed;
  }, [user, action, context]);
}
/**
 * Hook to check if feature is enabled
 */
export function useHasFeature(user, feature) {
  return useMemo(() => {
    if (!user) return false;
    return isFeatureEnabled(feature, user.featureFlags, user.roles);
  }, [user, feature]);
}
/**
 * Hook to get permission decision with details
 */
export function usePermissionDecision(user, action, context = {}) {
  return useMemo(() => {
    if (!user) {
      return { allowed: false, reason: "No user context" };
    }
    const userContext = {
      id: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.memberPermissions,
    };
    return canPerformAction(userContext, action, context, user.featureFlags, user.policySettings);
  }, [user, action, context]);
}
/**
 * Hook to get all user capabilities
 */
export function useUserCapabilities(user) {
  return useMemo(() => {
    if (!user) {
      return {
        canPerform: () => false,
        hasFeature: () => false,
        getDecision: () => ({ allowed: false, reason: "No user context" }),
      };
    }
    const userContext = {
      id: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.memberPermissions,
    };
    return {
      canPerform: (action, context = {}) => {
        const decision = canPerformAction(
          userContext,
          action,
          context,
          user.featureFlags,
          user.policySettings,
        );
        return decision.allowed;
      },
      hasFeature: feature => {
        return isFeatureEnabled(feature, user.featureFlags, user.roles);
      },
      getDecision: (action, context = {}) => {
        return canPerformAction(
          userContext,
          action,
          context,
          user.featureFlags,
          user.policySettings,
        );
      },
    };
  }, [user]);
}
//# sourceMappingURL=react-hooks.js.map
