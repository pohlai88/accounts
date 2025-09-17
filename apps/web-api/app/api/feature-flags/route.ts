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

// Feature flags schema
const FeatureFlagsSchema = z.object({
    attachments: z.boolean().optional(),
    reports: z.boolean().optional(),
    ar: z.boolean().optional(),
    ap: z.boolean().optional(),
    je: z.boolean().optional(),
    regulated_mode: z.boolean().optional(),
    // Additional SaaS features
    multi_company: z.boolean().optional(),
    advanced_reporting: z.boolean().optional(),
    api_access: z.boolean().optional(),
    white_label: z.boolean().optional(),
    custom_fields: z.boolean().optional(),
    workflow_automation: z.boolean().optional(),
    data_export: z.boolean().optional(),
    audit_trail: z.boolean().optional(),
});

// Feature flag update schema
const UpdateFeatureFlagsSchema = z.object({
    tenantId: z.string().uuid(),
    featureFlags: FeatureFlagsSchema,
});

// Feature flag evaluation schema
const EvaluateFeatureFlagsSchema = z.object({
    tenantId: z.string().uuid(),
    features: z.array(z.string()),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const tenantId = url.searchParams.get("tenantId");
        const feature = url.searchParams.get("feature");

        if (!tenantId) {
            return problem({
                status: 400,
                title: "Missing tenant ID",
                code: "MISSING_TENANT_ID",
                detail: "tenantId parameter is required",
                requestId: ctx.requestId,
            });
        }

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
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

        const featureFlags = tenant.feature_flags || {};

        // If specific feature requested, return only that feature
        if (feature) {
            return ok(
                {
                    feature,
                    enabled: featureFlags[feature] || false,
                    tenantId,
                },
                ctx.requestId,
            );
        }

        // Get subscription plan features if available
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

        let planFeatures = {};
        let planLimits = {};
        let planType = "FREE";

        if (!subscriptionError && subscription) {
            planFeatures = subscription.subscription_plans[0]?.features || {};
            planLimits = subscription.subscription_plans[0]?.limits || {};
            planType = subscription.subscription_plans[0]?.plan_type || "FREE";
        }

        // Merge tenant feature flags with plan features
        const effectiveFeatures = {
            ...planFeatures,
            ...featureFlags,
        };

        return ok(
            {
                tenantId,
                featureFlags: effectiveFeatures,
                planFeatures,
                planLimits,
                planType,
                userRole: membership.role,
                lastUpdated: new Date().toISOString(),
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get feature flags error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const body = await req.json();
        const { tenantId, featureFlags } = UpdateFeatureFlagsSchema.parse(body);

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
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

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can update feature flags",
                requestId: ctx.requestId,
            });
        }

        // Get current feature flags
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
                detail: "Failed to fetch current feature flags",
                requestId: ctx.requestId,
            });
        }

        // Merge with existing feature flags
        const currentFlags = tenant.feature_flags || {};
        const updatedFlags = {
            ...currentFlags,
            ...featureFlags,
        };

        // Update tenant feature flags
        const { data: updatedTenant, error: updateError } = await supabase
            .from("tenants")
            .update({
                feature_flags: updatedFlags,
                updated_at: new Date().toISOString(),
            })
            .eq("id", tenantId)
            .select("feature_flags, updated_at")
            .single();

        if (updateError) {
            return problem({
                status: 500,
                title: "Failed to update feature flags",
                code: "FEATURE_FLAGS_UPDATE_FAILED",
                detail: updateError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                tenantId,
                featureFlags: updatedFlags,
                lastUpdated: updatedTenant.updated_at,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Update feature flags error:", error);

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

export async function POST(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const body = await req.json();
        const { tenantId, features } = EvaluateFeatureFlagsSchema.parse(body);

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
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

        const featureFlags = tenant.feature_flags || {};

        // Evaluate each requested feature
        const evaluation = features.reduce((acc, feature) => {
            acc[feature] = featureFlags[feature] || false;
            return acc;
        }, {} as Record<string, boolean>);

        return ok(
            {
                tenantId,
                evaluation,
                evaluatedAt: new Date().toISOString(),
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Evaluate feature flags error:", error);

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
