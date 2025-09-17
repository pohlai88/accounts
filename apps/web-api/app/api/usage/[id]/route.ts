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

// Usage metric update schema
const UpdateUsageMetricSchema = z.object({
    metricValue: z.number().min(0).optional(),
    metricUnit: z.string().min(1).optional(),
    metadata: z.record(z.any()).optional(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const usageMetricId = params.id;

        // Get usage metric details
        const { data: usageMetric, error: usageMetricError } = await supabase
            .from("usage_metrics")
            .select("*")
            .eq("id", usageMetricId)
            .single();

        if (usageMetricError) {
            if (usageMetricError.code === "PGRST116") {
                return problem({
                    status: 404,
                    title: "Usage metric not found",
                    code: "USAGE_METRIC_NOT_FOUND",
                    detail: "The requested usage metric does not exist",
                    requestId: ctx.requestId,
                });
            }

            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch usage metric details",
                requestId: ctx.requestId,
            });
        }

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", usageMetric.tenant_id)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this usage metric",
                requestId: ctx.requestId,
            });
        }

        // Get related usage limit if exists
        const { data: usageLimit, error: limitError } = await supabase
            .from("usage_limits")
            .select("*")
            .eq("tenant_id", usageMetric.tenant_id)
            .eq("metric_type", usageMetric.metric_type)
            .eq("is_active", true)
            .single();

        if (limitError && limitError.code !== "PGRST116") {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch usage limit",
                requestId: ctx.requestId,
            });
        }

        // Calculate usage percentage if limit exists
        let usagePercentage = null;
        if (usageLimit) {
            usagePercentage = (parseFloat(usageMetric.metric_value) / parseFloat(usageLimit.limit_value)) * 100;
        }

        return ok(
            {
                id: usageMetric.id,
                tenantId: usageMetric.tenant_id,
                metricType: usageMetric.metric_type,
                metricValue: usageMetric.metric_value,
                metricUnit: usageMetric.metric_unit,
                recordedAt: usageMetric.recorded_at,
                metadata: usageMetric.metadata,
                createdAt: usageMetric.created_at,
                usageLimit: usageLimit ? {
                    id: usageLimit.id,
                    limitValue: usageLimit.limit_value,
                    limitUnit: usageLimit.limit_unit,
                    isHardLimit: usageLimit.is_hard_limit,
                    overagePrice: usageLimit.overage_price,
                } : null,
                usagePercentage,
                userRole: membership.role,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get usage metric error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const usageMetricId = params.id;
        const body = await req.json();
        const updateData = UpdateUsageMetricSchema.parse(body);

        // Get usage metric details first
        const { data: usageMetric, error: usageMetricError } = await supabase
            .from("usage_metrics")
            .select("tenant_id")
            .eq("id", usageMetricId)
            .single();

        if (usageMetricError) {
            if (usageMetricError.code === "PGRST116") {
                return problem({
                    status: 404,
                    title: "Usage metric not found",
                    code: "USAGE_METRIC_NOT_FOUND",
                    detail: "The requested usage metric does not exist",
                    requestId: ctx.requestId,
                });
            }

            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch usage metric",
                requestId: ctx.requestId,
            });
        }

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", usageMetric.tenant_id)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this usage metric",
                requestId: ctx.requestId,
            });
        }

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can update usage metrics",
                requestId: ctx.requestId,
            });
        }

        // Update usage metric
        const { data: updatedUsageMetric, error: updateError } = await supabase
            .from("usage_metrics")
            .update({
                ...updateData,
                metric_value: updateData.metricValue?.toString(),
            })
            .eq("id", usageMetricId)
            .select()
            .single();

        if (updateError) {
            return problem({
                status: 500,
                title: "Failed to update usage metric",
                code: "USAGE_METRIC_UPDATE_FAILED",
                detail: updateError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                id: updatedUsageMetric.id,
                tenantId: updatedUsageMetric.tenant_id,
                metricType: updatedUsageMetric.metric_type,
                metricValue: updatedUsageMetric.metric_value,
                metricUnit: updatedUsageMetric.metric_unit,
                recordedAt: updatedUsageMetric.recorded_at,
                metadata: updatedUsageMetric.metadata,
                createdAt: updatedUsageMetric.created_at,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Update usage metric error:", error);

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

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const ctx = await getSecurityContext(req);
        const usageMetricId = params.id;

        // Get usage metric details first
        const { data: usageMetric, error: usageMetricError } = await supabase
            .from("usage_metrics")
            .select("tenant_id")
            .eq("id", usageMetricId)
            .single();

        if (usageMetricError) {
            if (usageMetricError.code === "PGRST116") {
                return problem({
                    status: 404,
                    title: "Usage metric not found",
                    code: "USAGE_METRIC_NOT_FOUND",
                    detail: "The requested usage metric does not exist",
                    requestId: ctx.requestId,
                });
            }

            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch usage metric",
                requestId: ctx.requestId,
            });
        }

        // Verify user has admin access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", usageMetric.tenant_id)
            .single();

        if (membershipError || !membership) {
            return problem({
                status: 403,
                title: "Access denied",
                code: "TENANT_ACCESS_DENIED",
                detail: "You do not have access to this usage metric",
                requestId: ctx.requestId,
            });
        }

        if (membership.role !== "admin") {
            return problem({
                status: 403,
                title: "Insufficient permissions",
                code: "INSUFFICIENT_PERMISSIONS",
                detail: "Only admins can delete usage metrics",
                requestId: ctx.requestId,
            });
        }

        // Delete usage metric
        const { error: deleteError } = await supabase
            .from("usage_metrics")
            .delete()
            .eq("id", usageMetricId);

        if (deleteError) {
            return problem({
                status: 500,
                title: "Failed to delete usage metric",
                code: "USAGE_METRIC_DELETE_FAILED",
                detail: deleteError.message,
                requestId: ctx.requestId,
            });
        }

        return ok(
            {
                message: "Usage metric deleted successfully",
                usageMetricId,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Delete usage metric error:", error);

        return problem({
            status: 500,
            title: "Internal server error",
            code: "INTERNAL_ERROR",
            detail: "An unexpected error occurred",
            requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        });
    }
}
