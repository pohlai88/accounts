// Enhanced Auth Context - Integrates with Admin Configuration
// Extends existing auth patterns with permission checking and feature flags

import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  canPerformAction,
  isFeatureEnabled,
  type FeatureFlags,
  type PolicySettings,
  type MemberPermissions,
} from "@aibos/auth";
import { extractUserContext } from "../context/request-context";

// Enhanced user context with admin configuration
export interface EnhancedUserContext {
  id: string;
  tenantId: string;
  companyId: string;
  roles: string[];
  permissions?: MemberPermissions;
  featureFlags: FeatureFlags;
  policySettings: PolicySettings;
}

// Decision result for permission checks
export interface PermissionDecision {
  allowed: boolean;
  requiresApproval?: boolean;
  reason?: string;
}

/**
 * Get enhanced user context with admin configuration from database
 */
export async function getEnhancedUserContext(request: NextRequest): Promise<EnhancedUserContext> {
  const basicContext = extractUserContext(request);

  if (!basicContext.tenantId || !basicContext.companyId || !basicContext.userId) {
    throw new Error("Missing required context: tenantId, companyId, or userId");
  }

  // Create Supabase client (you may want to use your existing client)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  try {
    // Fetch tenant feature flags, company policy settings, and user membership in parallel
    const [tenantResult, companyResult, membershipResult] = await Promise.all([
      supabase.from("tenants").select("feature_flags").eq("id", basicContext.tenantId).single(),

      supabase
        .from("companies")
        .select("policy_settings")
        .eq("id", basicContext.companyId)
        .single(),

      supabase
        .from("memberships")
        .select("role, permissions")
        .eq("user_id", basicContext.userId)
        .eq("tenant_id", basicContext.tenantId)
        .eq("company_id", basicContext.companyId)
        .single(),
    ]);

    // Extract data with fallbacks
    const featureFlags: FeatureFlags = tenantResult.data?.feature_flags || {
      attachments: true,
      reports: true,
      ar: true,
      ap: false,
      je: false,
      regulated_mode: false,
    };

    const policySettings: PolicySettings = companyResult.data?.policy_settings || {
      approval_threshold_rm: 50000,
      export_requires_reason: false,
      mfa_required_for_admin: true,
      session_timeout_minutes: 480,
    };

    const memberPermissions: MemberPermissions | undefined =
      membershipResult.data?.permissions || undefined;

    // Get user roles (primary role + any additional roles from permissions)
    const primaryRole = membershipResult.data?.role || basicContext.userRole || "user";
    const additionalRoles = memberPermissions?.roles || [];
    const allRoles = [primaryRole, ...additionalRoles].filter(
      (role, index, arr) => arr.indexOf(role) === index,
    );

    return {
      id: basicContext.userId,
      tenantId: basicContext.tenantId,
      companyId: basicContext.companyId,
      roles: allRoles,
      permissions: memberPermissions,
      featureFlags,
      policySettings,
    };
  } catch (error) {
    console.error("Failed to fetch enhanced user context:", error);

    // Return basic context with defaults on error
    return {
      id: basicContext.userId,
      tenantId: basicContext.tenantId,
      companyId: basicContext.companyId,
      roles: [basicContext.userRole || "user"],
      featureFlags: {
        attachments: true,
        reports: true,
        ar: true,
        ap: false,
        je: false,
        regulated_mode: false,
      },
      policySettings: {
        approval_threshold_rm: 50000,
        export_requires_reason: false,
        mfa_required_for_admin: true,
        session_timeout_minutes: 480,
      },
    };
  }
}

/**
 * Check if user can perform an action
 */
export async function checkPermission(
  request: NextRequest,
  action: string,
  context: { amount?: number; module?: string; creatorRole?: string } = {},
): Promise<PermissionDecision> {
  try {
    const userContext = await getEnhancedUserContext(request);

    const decision = canPerformAction(
      userContext,
      action,
      {
        amount: context.amount,
        module: context.module,
        creatorRole: context.creatorRole,
        ip: request.ip || request.headers.get("x-forwarded-for") || "unknown",
      },
      userContext.featureFlags,
      userContext.policySettings,
    );

    return {
      allowed: decision.allowed,
      requiresApproval: decision.requiresApproval,
      reason: decision.reason,
    };
  } catch (error) {
    console.error("Permission check failed:", error);
    return {
      allowed: false,
      reason: "Permission check failed",
    };
  }
}

/**
 * Assert permission (throws error if not allowed)
 */
export async function assertPermission(
  request: NextRequest,
  action: string,
  context: { amount?: number; module?: string; creatorRole?: string } = {},
): Promise<void> {
  const decision = await checkPermission(request, action, context);

  if (!decision.allowed) {
    const error = new Error(
      `Forbidden: ${action}${decision.reason ? ` (${decision.reason})` : ""}`,
    );
    (error as Error & { status?: number; code?: string }).status = 403;
    (error as Error & { status?: number; code?: string }).code = "PERMISSION_DENIED";
    throw error;
  }
}

/**
 * Check if feature is enabled for user
 */
export async function checkFeature(request: NextRequest, feature: string): Promise<boolean> {
  try {
    const userContext = await getEnhancedUserContext(request);
    return isFeatureEnabled(feature, userContext.featureFlags, userContext.roles);
  } catch (error) {
    console.error("Feature check failed:", error);
    return false;
  }
}

/**
 * Get user context for React components (simplified)
 */
export async function getUserContextForUI(request: NextRequest): Promise<{
  user: EnhancedUserContext;
  canPerform: (action: string, context?: { amount?: number; module?: string }) => Promise<boolean>;
  hasFeature: (feature: string) => boolean;
}> {
  const user = await getEnhancedUserContext(request);

  return {
    user,
    canPerform: async (action: string, context = {}) => {
      const decision = canPerformAction(
        user,
        action,
        { ...context, ip: request.ip || "unknown" },
        user.featureFlags,
        user.policySettings,
      );
      return decision.allowed;
    },
    hasFeature: (feature: string) => {
      return isFeatureEnabled(feature, user.featureFlags, user.roles);
    },
  };
}
