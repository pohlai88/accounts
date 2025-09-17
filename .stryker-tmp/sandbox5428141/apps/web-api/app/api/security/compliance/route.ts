// @ts-nocheck
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSecurityContext } from "@aibos/web-api/_lib/request";
import { ok, problem } from "@aibos/web-api/_lib/response";

// Mock compliance rules (in production, use real instance)
const mockComplianceRules = [
  {
    id: "rule_1",
    name: "GDPR Data Export",
    description: "Monitor large data exports for GDPR compliance",
    category: "data_protection",
    severity: "high",
    conditions: [
      { field: "action", operator: "equals", value: "export" },
      { field: "details.recordCount", operator: "greater_than", value: 1000 },
    ],
    actions: [{ type: "alert", target: "security_team", parameters: { priority: "high" } }],
    enabled: true,
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: "rule_2",
    name: "SOX Financial Data Access",
    description: "Monitor access to financial data for SOX compliance",
    category: "financial_compliance",
    severity: "high",
    conditions: [
      { field: "resource", operator: "contains", value: "financial" },
      { field: "action", operator: "in", value: ["read", "export", "download"] },
    ],
    actions: [
      { type: "log", target: "audit_log", parameters: {} },
      { type: "notify", target: "compliance_team", parameters: { immediate: true } },
    ],
    enabled: true,
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
];

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.string().min(1).max(100),
  severity: z.enum(["low", "medium", "high", "critical"]),
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.enum([
        "equals",
        "not_equals",
        "contains",
        "not_contains",
        "greater_than",
        "less_than",
        "in",
        "not_in",
      ]),
      value: z.any(),
      caseSensitive: z.boolean().optional(),
    }),
  ),
  actions: z.array(
    z.object({
      type: z.enum(["alert", "block", "log", "notify", "escalate"]),
      target: z.string(),
      parameters: z.record(z.any()),
    }),
  ),
  enabled: z.boolean().default(true),
});

const UpdateRuleSchema = CreateRuleSchema.partial();

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const enabled = url.searchParams.get("enabled");

    // Filter rules
    let rules = mockComplianceRules;

    if (category) {
      rules = rules.filter(rule => rule.category === category);
    }

    if (enabled !== null) {
      const isEnabled = enabled === "true";
      rules = rules.filter(rule => rule.enabled === isEnabled);
    }

    // Calculate statistics
    const stats = {
      total: rules.length,
      enabled: rules.filter(rule => rule.enabled).length,
      byCategory: rules.reduce(
        (acc, rule) => {
          acc[rule.category] = (acc[rule.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
      bySeverity: rules.reduce(
        (acc, rule) => {
          acc[rule.severity] = (acc[rule.severity] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };

    return ok(
      {
        rules,
        statistics: stats,
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Get compliance rules error:", error);

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

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to get compliance rules",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const body = await req.json();
    const ruleData = CreateRuleSchema.parse(body);

    // Create new rule
    const newRule = {
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...ruleData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // Add to mock store
    mockComplianceRules.push(newRule as any);

    return ok(
      {
        rule: newRule,
        message: "Compliance rule created successfully",
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Create compliance rule error:", error);

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
        detail: `Invalid rule data: ${zodError.errors.map((e: z.ZodIssue) => e.message).join(', ')}`,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to create compliance rule",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
