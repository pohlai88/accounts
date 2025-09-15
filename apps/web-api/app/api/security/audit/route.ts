import { NextRequest } from "next/server";
import { z } from "zod";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Mock audit logger (in production, use real instance)
const mockAuditEvents = [
  {
    id: "audit_1",
    timestamp: Date.now() - 3600000,
    tenantId: "tenant-1",
    userId: "user-1",
    action: "login",
    resource: "authentication",
    details: { ipAddress: "192.168.1.1", userAgent: "Mozilla/5.0" },
    severity: "low",
    category: "authentication",
    outcome: "success",
    riskScore: 20,
    complianceFlags: [],
    metadata: { eventType: "authentication" },
  },
  {
    id: "audit_2",
    timestamp: Date.now() - 1800000,
    tenantId: "tenant-1",
    userId: "user-1",
    action: "data_export",
    resource: "financial_data",
    details: { recordCount: 1500, dataType: "transactions" },
    severity: "high",
    category: "data_access",
    outcome: "success",
    riskScore: 75,
    complianceFlags: ["GDPR Data Export"],
    metadata: { eventType: "data_access" },
  },
];

const AuditQuerySchema = z.object({
  category: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  action: z.string().optional(),
  startDate: z
    .string()
    .transform(val => new Date(val).getTime())
    .optional(),
  endDate: z
    .string()
    .transform(val => new Date(val).getTime())
    .optional(),
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
    const query = AuditQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Filter events by tenant
    let events = mockAuditEvents.filter(event => event.tenantId === ctx.tenantId);

    // Apply filters
    if (query.category) {
      events = events.filter(event => event.category === query.category);
    }

    if (query.severity) {
      events = events.filter(event => event.severity === query.severity);
    }

    if (query.action) {
      events = events.filter(event => event.action.includes(query.action as string));
    }

    if (query.startDate) {
      events = events.filter(event => event.timestamp >= (query.startDate as number));
    }

    if (query.endDate) {
      events = events.filter(event => event.timestamp <= (query.endDate as number));
    }

    // Sort by timestamp (newest first)
    events.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const paginatedEvents = events.slice(query.offset as number, (query.offset as number) + (query.limit as number));

    // Calculate statistics
    const stats = {
      total: events.length,
      byCategory: events.reduce(
        (acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      bySeverity: events.reduce(
        (acc, event) => {
          acc[event.severity] = (acc[event.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byOutcome: events.reduce(
        (acc, event) => {
          acc[event.outcome] = (acc[event.outcome] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      averageRiskScore:
        events.length > 0
          ? events.reduce((sum, event) => sum + event.riskScore, 0) / events.length
          : 0,
      highRiskEvents: events.filter(event => event.riskScore > 70).length,
      complianceViolations: events.filter(event => event.complianceFlags.length > 0).length,
    };

    return ok(
      {
        events: paginatedEvents,
        pagination: {
          limit: query.limit as number,
          offset: query.offset as number,
          total: events.length,
          hasMore: (query.offset as number) + (query.limit as number) < events.length,
        },
        statistics: stats,
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Get audit events error:", error);

    if (error && typeof error === "object" && "status" in error && "message" in error) {
      const errorObj = error as { status: unknown; message: unknown };
      return problem({
        status: Number(errorObj.status) || 500,
        title: String(errorObj.message),
        code: "AUTHENTICATION_ERROR",
        detail: String(errorObj.message),
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any; // ZodError has errors property
      return problem({
        status: 400,
        title: "Validation error",
        code: "VALIDATION_ERROR",
        detail: `Invalid query parameters: ${zodError.errors.map((e: z.ZodIssue) => e.message).join(', ')}`,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to get audit events",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
