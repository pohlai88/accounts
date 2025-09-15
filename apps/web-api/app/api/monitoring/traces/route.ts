import { NextRequest } from "next/server";
import { z } from "zod";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Mock trace data (in production, use real TracingManager)
const mockTraces = [
  {
    traceId: "trace_1",
    spans: [
      {
        id: "span_1",
        traceId: "trace_1",
        name: "HTTP GET /api/users",
        kind: "server",
        startTime: Date.now() - 1000,
        endTime: Date.now() - 500,
        duration: 500,
        status: "ok",
        attributes: {
          "http.method": "GET",
          "http.url": "/api/users",
          "http.status_code": 200,
          "service.name": "web-api",
          "service.version": "1.0.0",
        },
        events: [],
        links: [],
        tenantId: "tenant-1",
        userId: "user-1",
        serviceName: "web-api",
        serviceVersion: "1.0.0",
        resource: {},
      },
      {
        id: "span_2",
        traceId: "trace_1",
        parentId: "span_1",
        name: "Database Query",
        kind: "internal",
        startTime: Date.now() - 800,
        endTime: Date.now() - 600,
        duration: 200,
        status: "ok",
        attributes: {
          "db.operation": "SELECT",
          "db.table": "users",
          "db.rows_affected": 10,
        },
        events: [],
        links: [],
        tenantId: "tenant-1",
        userId: "user-1",
        serviceName: "web-api",
        serviceVersion: "1.0.0",
        resource: {},
      },
    ],
    startTime: Date.now() - 1000,
    endTime: Date.now() - 500,
    duration: 500,
    serviceName: "web-api",
    tenantId: "tenant-1",
    userId: "user-1",
    status: "ok",
    attributes: {},
  },
  {
    traceId: "trace_2",
    spans: [
      {
        id: "span_3",
        traceId: "trace_2",
        name: "HTTP POST /api/tenants",
        kind: "server",
        startTime: Date.now() - 2000,
        endTime: Date.now() - 1500,
        duration: 500,
        status: "ok",
        attributes: {
          "http.method": "POST",
          "http.url": "/api/tenants",
          "http.status_code": 201,
          "service.name": "web-api",
          "service.version": "1.0.0",
        },
        events: [],
        links: [],
        tenantId: "tenant-2",
        userId: "user-2",
        serviceName: "web-api",
        serviceVersion: "1.0.0",
        resource: {},
      },
    ],
    startTime: Date.now() - 2000,
    endTime: Date.now() - 1500,
    duration: 500,
    serviceName: "web-api",
    tenantId: "tenant-2",
    userId: "user-2",
    status: "ok",
    attributes: {},
  },
];

const TracesQuerySchema = z.object({
  tenantId: z.string().optional(),
  userId: z.string().optional(),
  serviceName: z.string().optional(),
  startTime: z
    .string()
    .transform(val => new Date(val).getTime())
    .optional(),
  endTime: z
    .string()
    .transform(val => new Date(val).getTime())
    .optional(),
  status: z.enum(["ok", "error", "partial"]).optional(),
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
    const query = TracesQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Filter traces based on query
    let filteredTraces = mockTraces;

    if (query.tenantId) {
      filteredTraces = filteredTraces.filter(t => t.tenantId === query.tenantId);
    }

    if (query.userId) {
      filteredTraces = filteredTraces.filter(t => t.userId === query.userId);
    }

    if (query.serviceName) {
      filteredTraces = filteredTraces.filter(t => t.serviceName === query.serviceName);
    }

    if (query.startTime !== undefined) {
      filteredTraces = filteredTraces.filter(t => t.startTime >= (query.startTime as number));
    }

    if (query.endTime !== undefined) {
      filteredTraces = filteredTraces.filter(t => t.endTime <= (query.endTime as number));
    }

    if (query.status) {
      filteredTraces = filteredTraces.filter(t => t.status === query.status);
    }

    // Sort by start time (newest first)
    filteredTraces.sort((a, b) => b.startTime - a.startTime);

    // Apply pagination
    const paginatedTraces = filteredTraces.slice(query.offset as number, (query.offset as number) + (query.limit as number));

    // Calculate statistics
    const stats = {
      total: filteredTraces.length,
      byStatus: filteredTraces.reduce(
        (acc, trace) => {
          acc[trace.status] = (acc[trace.status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byService: filteredTraces.reduce(
        (acc, trace) => {
          acc[trace.serviceName] = (acc[trace.serviceName] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      averageDuration:
        filteredTraces.length > 0
          ? filteredTraces.reduce((sum, trace) => sum + trace.duration, 0) / filteredTraces.length
          : 0,
      p95Duration: calculatePercentile(
        filteredTraces.map(t => t.duration),
        95,
      ),
      p99Duration: calculatePercentile(
        filteredTraces.map(t => t.duration),
        99,
      ),
    };

    return ok(
      {
        traces: paginatedTraces,
        pagination: {
          limit: query.limit as number,
          offset: query.offset as number,
          total: filteredTraces.length,
          hasMore: (query.offset as number) + (query.limit as number) < filteredTraces.length,
        },
        statistics: stats,
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Get traces error:", error);

    if (error && typeof error === "object" && "status" in error) {
      const apiError = error as { status: number; message: string };
      return problem({
        status: apiError.status,
        title: apiError.message,
        code: "AUTHENTICATION_ERROR",
        detail: apiError.message,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    if (error && typeof error === "object" && "name" in error && error.name === "ZodError") {
      const zodError = error as { name: string; errors: any[] };
      return problem({
        status: 400,
        title: "Validation error",
        code: "VALIDATION_ERROR",
        detail: `Invalid query parameters: ${zodError.errors.map(e => e.message).join(', ')}`,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to get traces",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) { return 0; }

  const sorted = values.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1 as number;
  return sorted[Math.max(0, index)] || 0;
}
