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

// Usage recording schema
const RecordUsageSchema = z.object({
    tenantId: z.string().uuid(),
    metricType: z.string().min(1),
    metricValue: z.number().min(0),
    metricUnit: z.string().min(1),
    metadata: z.record(z.any()).optional(),
});

// Usage query schema
const UsageQuerySchema = z.object({
    tenantId: z.string().uuid(),
    metricType: z.string().optional(),
    startDate: z.string().transform(val => new Date(val)).optional(),
    endDate: z.string().transform(val => new Date(val)).optional(),
    limit: z.string().optional().transform(val => {
        const num = Number(val || "100");
        if (num < 1 || num > 1000) throw new Error("Limit must be between 1 and 1000");
        return num;
    }),
    offset: z.string().optional().transform(val => {
        const num = Number(val || "0");
        if (num < 0) throw new Error("Offset must be non-negative");
        return num;
    }),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const query = UsageQuerySchema.parse(Object.fromEntries(url.searchParams));

        // Verify user has access to this tenant
        const { data: membership, error: membershipError } = await supabase
            .from("memberships")
            .select("role")
            .eq("user_id", ctx.userId)
            .eq("tenant_id", query.tenantId)
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

        // Build usage query
        let usageQuery = supabase
            .from("usage_metrics")
            .select("*")
            .eq("tenant_id", query.tenantId)
            .range(query.offset, query.offset + query.limit - 1)
            .order("recorded_at", { ascending: false });

        if (query.metricType) {
            usageQuery = usageQuery.eq("metric_type", query.metricType);
        }

        if (query.startDate) {
            usageQuery = usageQuery.gte("recorded_at", query.startDate.toISOString());
        }

        if (query.endDate) {
            usageQuery = usageQuery.lte("recorded_at", query.endDate.toISOString());
        }

        const { data: usageMetrics, error: usageError } = await usageQuery;

        if (usageError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch usage metrics",
                requestId: ctx.requestId,
            });
        }

        // Get usage limits for this tenant
        const { data: usageLimits, error: limitsError } = await supabase
            .from("usage_limits")
            .select("*")
            .eq("tenant_id", query.tenantId)
            .eq("is_active", true);

        if (limitsError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch usage limits",
                requestId: ctx.requestId,
            });
        }

        // Get current usage summary
        const { data: currentUsage, error: currentUsageError } = await supabase
            .from("usage_metrics")
            .select("metric_type, metric_value, metric_unit")
            .eq("tenant_id", query.tenantId)
            .gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

        if (currentUsageError) {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to fetch current usage",
                requestId: ctx.requestId,
            });
        }

        // Calculate usage summary by metric type
        const usageSummary = (currentUsage || []).reduce((acc: any, metric: any) => {
            const key = metric.metric_type;
            if (!acc[key]) {
                acc[key] = {
                    metricType: metric.metric_type,
                    totalValue: 0,
                    unit: metric.metric_unit,
                    recordCount: 0,
                };
            }
            acc[key].totalValue += parseFloat(metric.metric_value);
            acc[key].recordCount += 1;
            return acc;
        }, {});

        // Add limit information to summary
        Object.keys(usageSummary).forEach(metricType => {
            const limit = usageLimits?.find(l => l.metric_type === metricType);
            if (limit) {
                usageSummary[metricType].limit = {
                    value: limit.limit_value,
                    unit: limit.limit_unit,
                    isHardLimit: limit.is_hard_limit,
                    overagePrice: limit.overage_price,
                };
                usageSummary[metricType].usagePercentage = (usageSummary[metricType].totalValue / parseFloat(limit.limit_value)) * 100;
            }
        });

        return ok(
            {
                usageMetrics: usageMetrics || [],
                usageSummary,
                usageLimits: usageLimits || [],
                total: usageMetrics?.length || 0,
                limit: query.limit,
                offset: query.offset,
                tenantId: query.tenantId,
                userRole: membership.role,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get usage error:", error);

        if (error instanceof z.ZodError) {
            return problem({
                status: 400,
                title: "Invalid request data",
                code: "VALIDATION_ERROR",
                detail: "Please check your request parameters",
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
        const { tenantId, metricType, metricValue, metricUnit, metadata } = RecordUsageSchema.parse(body);

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

        // Check usage limits if this is a hard limit
        const { data: usageLimit, error: limitError } = await supabase
            .from("usage_limits")
            .select("*")
            .eq("tenant_id", tenantId)
            .eq("metric_type", metricType)
            .eq("is_active", true)
            .eq("is_hard_limit", true)
            .single();

        if (limitError && limitError.code !== "PGRST116") {
            return problem({
                status: 500,
                title: "Database error",
                code: "DATABASE_ERROR",
                detail: "Failed to check usage limits",
                requestId: ctx.requestId,
            });
        }

        if (usageLimit) {
            // Get current usage for this metric type
            const { data: currentUsage, error: currentUsageError } = await supabase
                .from("usage_metrics")
                .select("metric_value")
                .eq("tenant_id", tenantId)
                .eq("metric_type", metricType)
                .gte("recorded_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()); // Last 30 days

            if (currentUsageError) {
                return problem({
                    status: 500,
                    title: "Database error",
                    code: "DATABASE_ERROR",
                    detail: "Failed to check current usage",
                    requestId: ctx.requestId,
                });
            }

            const currentTotal = (currentUsage || []).reduce((sum: number, usage: any) => sum + parseFloat(usage.metric_value), 0);
            const newTotal = currentTotal + metricValue;

            if (newTotal > parseFloat(usageLimit.limit_value)) {
                return problem({
                    status: 429,
                    title: "Usage limit exceeded",
                    code: "USAGE_LIMIT_EXCEEDED",
                    detail: `Usage limit for ${metricType} exceeded. Current: ${currentTotal}, Limit: ${usageLimit.limit_value}`,
                    requestId: ctx.requestId,
                });
            }
        }

        // Record usage metric
        const { data: usageMetric, error: usageError } = await supabase
            .from("usage_metrics")
            .insert({
                tenant_id: tenantId,
                metric_type: metricType,
                metric_value: metricValue.toString(),
                metric_unit: metricUnit,
                recorded_at: new Date().toISOString(),
                metadata: metadata || {},
            })
            .select()
            .single();

        if (usageError) {
            return problem({
                status: 500,
                title: "Failed to record usage",
                code: "USAGE_RECORDING_FAILED",
                detail: usageError.message,
                requestId: ctx.requestId,
            });
        }

        // Check if we need to trigger usage alerts
        if (usageLimit) {
            const usagePercentage = (parseFloat(usageMetric.metric_value) / parseFloat(usageLimit.limit_value)) * 100;

            // Check for alert thresholds
            const { data: alerts, error: alertsError } = await supabase
                .from("usage_alerts")
                .select("*")
                .eq("tenant_id", tenantId)
                .eq("metric_type", metricType)
                .eq("is_active", true);

            if (!alertsError && alerts) {
                for (const alert of alerts) {
                    const thresholdPercentage = parseFloat(alert.threshold_percentage);
                    if (usagePercentage >= thresholdPercentage) {
                        // Trigger alert (in a real implementation, this would send notifications)
                        console.log(`Usage alert triggered for tenant ${tenantId}: ${metricType} usage is at ${usagePercentage.toFixed(2)}% (threshold: ${thresholdPercentage}%)`);

                        // Update last triggered time
                        await supabase
                            .from("usage_alerts")
                            .update({ last_triggered_at: new Date().toISOString() })
                            .eq("id", alert.id);
                    }
                }
            }
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
            },
            ctx.requestId,
            201,
        );
    } catch (error) {
        console.error("Record usage error:", error);

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
