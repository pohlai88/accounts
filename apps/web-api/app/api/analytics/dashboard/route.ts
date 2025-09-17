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

// Dashboard query schema
const DashboardQuerySchema = z.object({
    tenantId: z.string().uuid(),
    period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
    includeComparison: z.string().optional().transform(val => val === "true"),
});

export async function GET(req: NextRequest) {
    try {
        const ctx = await getSecurityContext(req);
        const url = new URL(req.url);
        const query = DashboardQuerySchema.parse(Object.fromEntries(url.searchParams));

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

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();

        switch (query.period) {
            case "7d":
                startDate.setDate(endDate.getDate() - 7);
                break;
            case "30d":
                startDate.setDate(endDate.getDate() - 30);
                break;
            case "90d":
                startDate.setDate(endDate.getDate() - 90);
                break;
            case "1y":
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
        }

        // Get analytics data in parallel
        const [
            usageMetrics,
            subscriptionData,
            userActivity,
            systemHealth,
            comparisonData
        ] = await Promise.all([
            getUsageMetrics(query.tenantId, startDate, endDate),
            getSubscriptionData(query.tenantId),
            getUserActivity(query.tenantId, startDate, endDate),
            getSystemHealth(query.tenantId, startDate, endDate),
            query.includeComparison ? getComparisonData(query.tenantId, query.period) : null,
        ]);

        // Generate dashboard summary
        const dashboard = {
            summary: generateDashboardSummary(usageMetrics, subscriptionData, userActivity),
            charts: generateChartData(usageMetrics, userActivity),
            metrics: {
                usage: usageMetrics,
                subscription: subscriptionData,
                activity: userActivity,
                health: systemHealth,
            },
            comparison: comparisonData,
            period: query.period,
            generatedAt: new Date().toISOString(),
        };

        return ok(
            {
                tenantId: query.tenantId,
                dashboard,
                userRole: membership.role,
            },
            ctx.requestId,
        );
    } catch (error) {
        console.error("Get analytics dashboard error:", error);

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

async function getUsageMetrics(tenantId: string, startDate: Date, endDate: Date) {
    const { data: metrics, error } = await supabase
        .from("usage_metrics")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("recorded_at", startDate.toISOString())
        .lte("recorded_at", endDate.toISOString())
        .order("recorded_at", { ascending: false });

    if (error) {
        console.error("Error fetching usage metrics:", error);
        return [];
    }

    return metrics || [];
}

async function getSubscriptionData(tenantId: string) {
    const { data: subscription, error } = await supabase
        .from("tenant_subscriptions")
        .select(`
      id,
      status,
      start_date,
      end_date,
      next_billing_date,
      auto_renew,
      trial_ends_at,
      subscription_plans!inner(
        name,
        plan_type,
        price,
        currency,
        billing_cycle,
        features,
        limits
      )
    `)
        .eq("tenant_id", tenantId)
        .single();

    if (error) {
        console.error("Error fetching subscription data:", error);
        return null;
    }

    return subscription;
}

async function getUserActivity(tenantId: string, startDate: Date, endDate: Date) {
    const { data: activity, error } = await supabase
        .from("user_activity_logs")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching user activity:", error);
        return [];
    }

    return activity || [];
}

async function getSystemHealth(tenantId: string, startDate: Date, endDate: Date) {
    const { data: health, error } = await supabase
        .from("system_health_metrics")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("recorded_at", startDate.toISOString())
        .lte("recorded_at", endDate.toISOString())
        .order("recorded_at", { ascending: false });

    if (error) {
        console.error("Error fetching system health:", error);
        return [];
    }

    return health || [];
}

async function getComparisonData(tenantId: string, period: string) {
    const endDate = new Date();
    const startDate = new Date();

    // Calculate previous period
    switch (period) {
        case "7d":
            startDate.setDate(endDate.getDate() - 14);
            endDate.setDate(endDate.getDate() - 7);
            break;
        case "30d":
            startDate.setDate(endDate.getDate() - 60);
            endDate.setDate(endDate.getDate() - 30);
            break;
        case "90d":
            startDate.setDate(endDate.getDate() - 180);
            endDate.setDate(endDate.getDate() - 90);
            break;
        case "1y":
            startDate.setFullYear(endDate.getFullYear() - 2);
            endDate.setFullYear(endDate.getFullYear() - 1);
            break;
    }

    const previousMetrics = await getUsageMetrics(tenantId, startDate, endDate);
    const previousActivity = await getUserActivity(tenantId, startDate, endDate);

    return {
        usage: previousMetrics,
        activity: previousActivity,
        period: `previous_${period}`,
    };
}

function generateDashboardSummary(usageMetrics: any[], subscriptionData: any, userActivity: any[]) {
    const totalUsage = usageMetrics.reduce((sum, metric) => sum + parseFloat(metric.metric_value), 0);
    const uniqueUsers = new Set(userActivity.map(activity => activity.user_id)).size;
    const totalActivities = userActivity.length;

    // Calculate growth metrics
    const currentPeriodUsage = usageMetrics.length > 0 ? totalUsage : 0;
    const averageUsagePerDay = currentPeriodUsage / Math.max(usageMetrics.length, 1);

    return {
        totalUsage,
        uniqueUsers,
        totalActivities,
        averageUsagePerDay,
        subscriptionStatus: subscriptionData?.status || "INACTIVE",
        planType: subscriptionData?.subscription_plans?.plan_type || "FREE",
        healthScore: calculateHealthScore(usageMetrics, userActivity),
    };
}

function generateChartData(usageMetrics: any[], userActivity: any[]) {
    // Generate time series data for charts
    const usageByDay = usageMetrics.reduce((acc, metric) => {
        const date = new Date(metric.recorded_at).toISOString().split('T')[0];
        if (date && !acc[date]) {
            acc[date] = { date, usage: 0, count: 0 };
        }
        if (date) {
            acc[date].usage += parseFloat(metric.metric_value);
            acc[date].count++;
        }
        return acc;
    }, {} as Record<string, any>);

    const activityByDay = userActivity.reduce((acc, activity) => {
        const date = new Date(activity.created_at).toISOString().split('T')[0];
        if (date && !acc[date]) {
            acc[date] = { date, activities: 0, uniqueUsers: new Set() };
        }
        if (date) {
            acc[date].activities++;
            acc[date].uniqueUsers.add(activity.user_id);
        }
        return acc;
    }, {} as Record<string, any>);

    // Convert to arrays and sort by date
    const usageChartData = Object.values(usageByDay)
        .map((item: any) => ({
            date: item.date,
            usage: item.usage,
            count: item.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    const activityChartData = Object.values(activityByDay)
        .map((item: any) => ({
            date: item.date,
            activities: item.activities,
            uniqueUsers: item.uniqueUsers.size,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        usageOverTime: usageChartData,
        activityOverTime: activityChartData,
        topFeatures: getTopFeatures(usageMetrics),
        userEngagement: getUserEngagement(userActivity),
    };
}

function getTopFeatures(usageMetrics: any[]) {
    const featureUsage = usageMetrics.reduce((acc, metric) => {
        const feature = metric.metric_type;
        if (!acc[feature]) {
            acc[feature] = { feature, usage: 0, count: 0 };
        }
        acc[feature].usage += parseFloat(metric.metric_value);
        acc[feature].count++;
        return acc;
    }, {} as Record<string, any>);

    return Object.values(featureUsage)
        .sort((a: any, b: any) => b.usage - a.usage)
        .slice(0, 10);
}

function getUserEngagement(userActivity: any[]) {
    const userEngagement = userActivity.reduce((acc, activity) => {
        const userId = activity.user_id;
        if (!acc[userId]) {
            acc[userId] = { userId, activities: 0, lastActivity: activity.created_at };
        }
        acc[userId].activities++;
        if (new Date(activity.created_at) > new Date(acc[userId].lastActivity)) {
            acc[userId].lastActivity = activity.created_at;
        }
        return acc;
    }, {} as Record<string, any>);

    return Object.values(userEngagement)
        .sort((a: any, b: any) => b.activities - a.activities)
        .slice(0, 10);
}

function calculateHealthScore(usageMetrics: any[], userActivity: any[]): number {
    // Simple health score calculation based on usage patterns and activity
    const usageScore = Math.min(usageMetrics.length / 100, 1) * 40; // Max 40 points
    const activityScore = Math.min(userActivity.length / 50, 1) * 30; // Max 30 points
    const consistencyScore = calculateConsistencyScore(usageMetrics) * 30; // Max 30 points

    return Math.round(usageScore + activityScore + consistencyScore);
}

function calculateConsistencyScore(usageMetrics: any[]): number {
    if (usageMetrics.length < 2) return 0;

    // Calculate variance in usage patterns
    const values = usageMetrics.map(m => parseFloat(m.metric_value));
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Lower coefficient of variation = more consistent = higher score
    return Math.max(0, 1 - coefficientOfVariation);
}
