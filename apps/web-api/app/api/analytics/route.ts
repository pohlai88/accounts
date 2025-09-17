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

// Analytics query schema
const AnalyticsQuerySchema = z.object({
  tenantId: z.string().uuid(),
  metricType: z.string().optional(),
  startDate: z.string().transform(val => new Date(val)).optional(),
  endDate: z.string().transform(val => new Date(val)).optional(),
  granularity: z.enum(["hour", "day", "week", "month"]).default("day"),
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

// Analytics aggregation schema
const AnalyticsAggregationSchema = z.object({
  tenantId: z.string().uuid(),
  metricTypes: z.array(z.string()),
  startDate: z.string().transform(val => new Date(val)),
  endDate: z.string().transform(val => new Date(val)),
  groupBy: z.enum(["tenant", "metric_type", "date"]).default("date"),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const url = new URL(req.url);
    const query = AnalyticsQuerySchema.parse(Object.fromEntries(url.searchParams));

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

    // Build analytics query
    let analyticsQuery = supabase
      .from("usage_metrics")
      .select("*")
      .eq("tenant_id", query.tenantId)
      .range(query.offset, query.offset + query.limit - 1)
      .order("recorded_at", { ascending: false });

    if (query.metricType) {
      analyticsQuery = analyticsQuery.eq("metric_type", query.metricType);
    }

    if (query.startDate) {
      analyticsQuery = analyticsQuery.gte("recorded_at", query.startDate.toISOString());
    }

    if (query.endDate) {
      analyticsQuery = analyticsQuery.lte("recorded_at", query.endDate.toISOString());
    }

    const { data: metrics, error: metricsError } = await analyticsQuery;

    if (metricsError) {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to fetch analytics data",
        requestId: ctx.requestId,
      });
    }

    // Get usage limits for context
    const { data: limits, error: limitsError } = await supabase
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

    // Calculate analytics summary
    const summary = calculateAnalyticsSummary(metrics || [], limits || []);

    // Generate time series data
    const timeSeries = generateTimeSeriesData(metrics || [], query.granularity);

    return ok(
      {
        tenantId: query.tenantId,
        metrics: metrics || [],
        summary,
        timeSeries,
        limits: limits || [],
        query: {
          metricType: query.metricType,
          startDate: query.startDate?.toISOString(),
          endDate: query.endDate?.toISOString(),
          granularity: query.granularity,
          limit: query.limit,
          offset: query.offset,
        },
        userRole: membership.role,
        generatedAt: new Date().toISOString(),
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Get analytics error:", error);

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
    const aggregationData = AnalyticsAggregationSchema.parse(body);

    // Verify user has access to this tenant
    const { data: membership, error: membershipError } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", ctx.userId)
      .eq("tenant_id", aggregationData.tenantId)
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

    // Build aggregation query
    let aggregationQuery = supabase
      .from("usage_metrics")
      .select("*")
      .eq("tenant_id", aggregationData.tenantId)
      .gte("recorded_at", aggregationData.startDate.toISOString())
      .lte("recorded_at", aggregationData.endDate.toISOString());

    if (aggregationData.metricTypes.length > 0) {
      aggregationQuery = aggregationQuery.in("metric_type", aggregationData.metricTypes);
    }

    const { data: metrics, error: metricsError } = await aggregationQuery;

    if (metricsError) {
      return problem({
        status: 500,
        title: "Database error",
        code: "DATABASE_ERROR",
        detail: "Failed to fetch aggregation data",
        requestId: ctx.requestId,
      });
    }

    // Perform aggregation based on groupBy
    const aggregatedData = performAggregation(metrics || [], aggregationData.groupBy);

    return ok(
      {
        tenantId: aggregationData.tenantId,
        aggregation: aggregatedData,
        query: {
          metricTypes: aggregationData.metricTypes,
          startDate: aggregationData.startDate.toISOString(),
          endDate: aggregationData.endDate.toISOString(),
          groupBy: aggregationData.groupBy,
        },
        userRole: membership.role,
        generatedAt: new Date().toISOString(),
      },
      ctx.requestId,
    );
  } catch (error) {
    console.error("Get analytics aggregation error:", error);

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

// Helper functions
function calculateAnalyticsSummary(metrics: any[], limits: any[]) {
  const summary = {
    totalMetrics: metrics.length,
    uniqueMetricTypes: new Set(metrics.map(m => m.metric_type)).size,
    totalUsage: 0,
    averageUsage: 0,
    peakUsage: 0,
    metricTypeBreakdown: {} as Record<string, any>,
    limitUtilization: {} as Record<string, any>,
  };

  if (metrics.length === 0) {
    return summary;
  }

  // Calculate totals and averages
  const totalUsage = metrics.reduce((sum, metric) => sum + parseFloat(metric.metric_value), 0);
  summary.totalUsage = totalUsage;
  summary.averageUsage = totalUsage / metrics.length;
  summary.peakUsage = Math.max(...metrics.map(m => parseFloat(m.metric_value)));

  // Calculate metric type breakdown
  const metricTypeGroups = metrics.reduce((acc, metric) => {
    const type = metric.metric_type;
    if (!acc[type]) {
      acc[type] = {
        count: 0,
        total: 0,
        average: 0,
        peak: 0,
        unit: metric.metric_unit,
      };
    }
    acc[type].count++;
    acc[type].total += parseFloat(metric.metric_value);
    acc[type].peak = Math.max(acc[type].peak, parseFloat(metric.metric_value));
    return acc;
  }, {} as Record<string, any>);

  // Calculate averages
  Object.keys(metricTypeGroups).forEach(type => {
    metricTypeGroups[type].average = metricTypeGroups[type].total / metricTypeGroups[type].count;
  });

  summary.metricTypeBreakdown = metricTypeGroups;

  // Calculate limit utilization
  limits.forEach(limit => {
    const metricType = limit.metric_type;
    const limitValue = parseFloat(limit.limit_value);
    const usage = metricTypeGroups[metricType]?.total || 0;
    const utilization = (usage / limitValue) * 100;

    summary.limitUtilization[metricType] = {
      usage,
      limit: limitValue,
      utilization: Math.min(utilization, 100),
      unit: limit.limit_unit,
      isHardLimit: limit.is_hard_limit,
    };
  });

  return summary;
}

function generateTimeSeriesData(metrics: any[], granularity: string) {
  const timeSeries: Record<string, any[]> = {};

  // Group metrics by type and time period
  metrics.forEach(metric => {
    const type = metric.metric_type;
    const date = new Date(metric.recorded_at);

    // Skip invalid dates
    if (isNaN(date.getTime())) {
      return;
    }

    let timeKey: string;
    switch (granularity) {
      case "hour":
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
        break;
      case "day":
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        break;
      case "week":
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        timeKey = `${weekStart.getFullYear()}-W${String(Math.ceil((weekStart.getDate() + 1) / 7)).padStart(2, '0')}`;
        break;
      case "month":
        timeKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        timeKey = date.toISOString().split('T')[0] || 'unknown';
    }

    if (!timeSeries[type]) {
      timeSeries[type] = [];
    }

    const existingData = timeSeries[type].find(item => item.timeKey === timeKey);
    if (existingData) {
      existingData.value += parseFloat(metric.metric_value);
      existingData.count++;
    } else {
      timeSeries[type].push({
        timeKey,
        value: parseFloat(metric.metric_value),
        count: 1,
        unit: metric.metric_unit,
      });
    }
  });

  // Sort by time key
  Object.keys(timeSeries).forEach(type => {
    if (timeSeries[type]) {
      timeSeries[type].sort((a, b) => a.timeKey.localeCompare(b.timeKey));
    }
  });

  return timeSeries;
}

function performAggregation(metrics: any[], groupBy: string) {
  const aggregation: Record<string, any> = {};

  switch (groupBy) {
    case "tenant":
      aggregation.totalMetrics = metrics.length;
      aggregation.totalUsage = metrics.reduce((sum, m) => sum + parseFloat(m.metric_value), 0);
      aggregation.averageUsage = aggregation.totalUsage / metrics.length;
      break;

    case "metric_type":
      const typeGroups = metrics.reduce((acc, metric) => {
        const type = metric.metric_type;
        if (!acc[type]) {
          acc[type] = {
            count: 0,
            total: 0,
            average: 0,
            peak: 0,
            unit: metric.metric_unit,
          };
        }
        acc[type].count++;
        acc[type].total += parseFloat(metric.metric_value);
        acc[type].peak = Math.max(acc[type].peak, parseFloat(metric.metric_value));
        return acc;
      }, {} as Record<string, any>);

      // Calculate averages
      Object.keys(typeGroups).forEach(type => {
        typeGroups[type].average = typeGroups[type].total / typeGroups[type].count;
      });

      aggregation.metricTypes = typeGroups;
      break;

    case "date":
      const dateGroups = metrics.reduce((acc, metric) => {
        const date = new Date(metric.recorded_at).toISOString().split('T')[0];
        if (date && !acc[date]) {
          acc[date] = {
            count: 0,
            total: 0,
            average: 0,
            peak: 0,
            metricTypes: new Set(),
          };
        }
        if (date) {
          acc[date].count++;
          acc[date].total += parseFloat(metric.metric_value);
          acc[date].peak = Math.max(acc[date].peak, parseFloat(metric.metric_value));
          acc[date].metricTypes.add(metric.metric_type);
        }
        return acc;
      }, {} as Record<string, any>);

      // Calculate averages and convert sets to arrays
      Object.keys(dateGroups).forEach(date => {
        dateGroups[date].average = dateGroups[date].total / dateGroups[date].count;
        dateGroups[date].metricTypes = Array.from(dateGroups[date].metricTypes);
      });

      aggregation.dates = dateGroups;
      break;
  }

  return aggregation;
}
