// @ts-nocheck
// React Hooks for Permission Checking
// Client-side hooks that work with the enhanced auth system

"use client";

import { useMemo } from "react";
import { canPerformAction, isFeatureEnabled } from "@aibos/auth";
import type { UserContext, FeatureFlags, PolicySettings, Decision } from "@aibos/auth/types";

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
  context: { amount?: number; module?: string; creatorRole?: string } = {},
): boolean {
  return useMemo(() => {
  if (!user) { return false; }

    const userContext: UserContext = {
      id: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.memberPermissions,
    };

    try {
      const decision = canPerformAction(
        userContext,
        action,
        context,
        user.featureFlags,
        user.policySettings,
      ) as Decision;
      if (typeof decision === "object" && decision !== null && "allowed" in decision) {
        return !!decision.allowed;
      }
    } catch {}
    return false;
  }, [user, action, context]);
}

/**
 * Hook to check if feature is enabled
 */
export function useHasFeature(user: ClientUserContext | null, feature: string): boolean {
  return useMemo(() => {
  if (!user) { return false; }
        try {
          const result = isFeatureEnabled(feature, user.featureFlags, user.roles) as boolean;
          return typeof result === "boolean" ? result : false;
        } catch {
          return false;
        }
  }, [user, feature]);
}

/**
 * Hook to get permission decision with details
 */
export function usePermissionDecision(
  user: ClientUserContext | null,
  action: string,
  context: { amount?: number; module?: string; creatorRole?: string } = {},
): Decision {
  return useMemo(() => {
    if (!user) {
      return { allowed: false, reason: "No user context" } as Decision;
    }

    const userContext: UserContext = {
      id: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.memberPermissions,
    };

    try {
      const decision = canPerformAction(userContext, action, context, user.featureFlags, user.policySettings) as Decision;
      if (typeof decision === "object" && decision !== null && "allowed" in decision) {
        return decision as Decision;
      }
    } catch {}
    return { allowed: false, reason: "Permission check error" } as Decision;
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
        getDecision: () => ({ allowed: false, reason: "No user context" }),
      };
    }

    const userContext: UserContext = {
      id: user.id,
      tenantId: user.tenantId,
      companyId: user.companyId,
      roles: user.roles,
      permissions: user.memberPermissions,
    };

    return {
      canPerform: (
        action: string,
        context: { amount?: number; module?: string; creatorRole?: string } = {},
      ) => {
        try {
          const decision = canPerformAction(
            userContext,
            action,
            context,
            user.featureFlags,
            user.policySettings,
          ) as Decision;
          if (typeof decision === "object" && decision !== null && Object.prototype.hasOwnProperty.call(decision, "allowed")) {
            return !!decision.allowed;
          }
        } catch {}
        return false;
      },
      hasFeature: (feature: string) => {
  try {
    const enabled = isFeatureEnabled(feature, user.featureFlags, user.roles) as boolean;
    return typeof enabled === "boolean" ? enabled : false;
  } catch {
    return false;
  }
      },
      getDecision: (
        action: string,
        context: { amount?: number; module?: string; creatorRole?: string } = {},
      ): Decision => {
        try {
          const decision = canPerformAction(
            userContext,
            action,
            context,
            user.featureFlags,
            user.policySettings,
          ) as Decision;
          if (typeof decision === "object" && decision !== null && Object.prototype.hasOwnProperty.call(decision, "allowed")) {
            return decision as Decision;
          }
        } catch {}
        return { allowed: false, reason: "Permission check error" } as Decision;
      },
    };
  }, [user]);
}
