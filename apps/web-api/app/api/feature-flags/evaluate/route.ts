import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Feature evaluation schema
const FeatureEvaluationSchema = z.object({
    tenantId: z.string().uuid(),
    features: z.array(z.string()),
    userId: z.string().uuid().optional(),
    context: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const body = await req.json();
        const { tenantId, features, userId, context } = FeatureEvaluationSchema.parse(body);

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role, permissions")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", tenantId)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this tenant",
                requestId: ctx.requestId,
            });
        }

        // Get tenant feature flags
        const { data: tenant, error: tenantError } = await supabase
            .from("tenants")
            .select("feature_flags")
            .eq("id", tenantId)
            .single();

        if (tenantError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch feature flags",
                requestId: ctx.requestId,
            });
        }

        // Get subscription plan features
        const { data: subscription, error: subscriptionError } = await supabase
            .from("tenant_subscriptions")
            .select(`
        status,
        subscription_plans!inner(
          features,
          limits,
          plan_type
        )
      `)
            .eq("tenant_id", tenantId)
            .eq("status", "ACTIVE")
            .single();

        let planFeatures: Record<string, any> = {};
        let planLimits: Record<string, any> = {};
        let planType = "FREE";

        if (!subscriptionError && subscription) {
            planFeatures = subscription.subscription_plans[0]?.features || {};
            planLimits = subscription.subscription_plans[0]?.limits || {};
            planType = subscription.subscription_plans[0]?.plan_type || "FREE";
        }

        // Get user-specific feature overrides if userId provided
        let userOverrides: Record<string, any> = {};
        if (userId) {
            const { data: userFeatures, error: userFeaturesError } = await supabase
                .from("user_feature_overrides")
                .select("feature_flags")
                .eq("user_id", userId)
                .eq("tenant_id", tenantId)
                .single();

            if (!userFeaturesError && userFeatures) {
                userOverrides = userFeatures.feature_flags || {};
            }
        }

        // Evaluate each feature
        const evaluation = features.reduce((acc, feature) => {
            const tenantFlag = tenant.feature_flags?.[feature];
            const planFlag = planFeatures[feature];
            const userOverride = userOverrides[feature];

            // Priority: user override > tenant flag > plan flag > default (false)
            let enabled = false;
            let source = "default";

            if (userOverride !== undefined) {
                enabled = userOverride;
                source = "user_override";
            } else if (tenantFlag !== undefined) {
                enabled = tenantFlag;
                source = "tenant_setting";
            } else if (planFlag !== undefined) {
                enabled = planFlag;
                source = "plan_feature";
            }

            // Apply context-based rules
            const contextRules = applyContextRules(feature, enabled, context || {}, membership || {});

            acc[feature] = {
                enabled: contextRules.enabled,
                source: contextRules.source || source,
                reason: contextRules.reason,
                metadata: {
                    planType,
                    userRole: membership.role,
                    context,
                },
            };

            return acc;
        }, {} as Record<string, any>);

        return ok(
            {
                tenantId,
                evaluation,
                evaluatedAt: new Date().toISOString(),
                planType,
                userRole: membership.role,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Evaluate features error:", error);

        if (error instanceof z.ZodError) {
            return problem({
                status: 400,
                title: "Invalid request data",
                code: "VALIDATION_ERROR",
                detail: "Please check your request format",
                requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            });
        }

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}

function applyContextRules(
    feature: string,
    baseEnabled: boolean,
    context: Record<string, any>,
    membership: any
): { enabled: boolean; source?: string; reason?: string } {
    // Apply role-based restrictions
    const roleRestrictions: Record<string, string[]> = {
        admin_only: ["admin"],
        manager_and_above: ["admin", "manager"],
        accountant_and_above: ["admin", "manager", "accountant"],
    };

    // Check if feature requires specific role
    if (feature.includes("admin") && roleRestrictions.admin_only && !roleRestrictions.admin_only.includes(membership.role)) {
        return {
            enabled: false,
            source: "role_restriction",
            reason: "Feature requires admin role",
        };
    }

    if (feature.includes("manager") && roleRestrictions.manager_and_above && !roleRestrictions.manager_and_above.includes(membership.role)) {
        return {
            enabled: false,
            source: "role_restriction",
            reason: "Feature requires manager role or above",
        };
    }

    // Apply usage-based restrictions
    if (context?.usageLimit && context?.currentUsage) {
        const usagePercentage = (context.currentUsage / context.usageLimit) * 100;

        if (usagePercentage >= 90 && feature.includes("premium")) {
            return {
                enabled: false,
                source: "usage_limit",
                reason: "Usage limit exceeded",
            };
        }
    }

    // Apply time-based restrictions
    if (context?.timeOfDay) {
        const hour = new Date().getHours();

        // Restrict certain features during off-hours for non-admin users
        if ((hour < 8 || hour > 18) && roleRestrictions.admin_only && !roleRestrictions.admin_only.includes(membership.role)) {
            if (feature.includes("bulk_operation")) {
                return {
                    enabled: false,
                    source: "time_restriction",
                    reason: "Feature restricted during off-hours",
                };
            }
        }
    }

    // Apply IP-based restrictions
    if (context?.ipAddress && context?.allowedIPs) {
        if (!context.allowedIPs.includes(context.ipAddress) && feature.includes("sensitive")) {
            return {
                enabled: false,
                source: "ip_restriction",
                reason: "IP address not allowed for this feature",
            };
        }
    }

    return { enabled: baseEnabled };
}
