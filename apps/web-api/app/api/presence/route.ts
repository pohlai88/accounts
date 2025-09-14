import { NextRequest } from "next/server";
import { z } from "zod";
import { getSecurityContext } from "../_lib/request";
import { ok, problem } from "../_lib/response";

// Mock presence system (in production, use real instance)
const mockPresence = new Map<string, unknown>();

const UpdatePresenceSchema = z.object({
  status: z.enum(["online", "away", "busy", "offline"]),
  metadata: z
    .object({
      device: z.string().optional(),
      location: z.string().optional(),
      activity: z.string().optional(),
      custom: z.record(z.any()).optional(),
    })
    .optional(),
});

const PresenceQuerySchema = z.object({
  status: z.enum(["online", "away", "busy", "offline"]).optional(),
  includeOffline: z
    .string()
    .transform(val => val === "true")
    .default(false),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const url = new URL(req.url);
    const query = PresenceQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Mock implementation - in production, use real presence system
    const presenceList = Array.from(mockPresence.values())
      .filter((p: unknown) => p.tenantId === ctx.tenantId)
      .filter((p: unknown) => {
        if (query.status && p.status !== query.status) return false;
        if (!query.includeOffline && p.status === "offline") return false;
        return true;
      })
      .sort((a: unknown, b: unknown) => a.userId.localeCompare(b.userId));

    // Calculate statistics
    const stats = {
      total: presenceList.length,
      online: presenceList.filter((p: unknown) => p.status === "online").length,
      away: presenceList.filter((p: unknown) => p.status === "away").length,
      busy: presenceList.filter((p: unknown) => p.status === "busy").length,
      offline: presenceList.filter((p: unknown) => p.status === "offline").length,
    };

    return ok(
      {
        presence: presenceList,
        statistics: stats,
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Get presence error:", error);

    if (error && typeof error === "object" && "status" in error) {
      return problem({
        status: error.status,
        title: error.message,
        code: "AUTHENTICATION_ERROR",
        detail: error.message,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to get presence information",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const body = await req.json();
    const presenceData = UpdatePresenceSchema.parse(body);

    // Update presence
    const presence = {
      userId: ctx.userId,
      tenantId: ctx.tenantId,
      ...presenceData,
      lastSeen: new Date().toISOString(),
    };

    // Store presence (mock)
    mockPresence.set(ctx.userId, presence);

    // In production, update via real-time system
    // presenceSystem.updatePresence(ctx.userId, ctx.tenantId, presenceData.status, presenceData.metadata);

    return ok(
      {
        presence,
        message: "Presence updated successfully",
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Update presence error:", error);

    if (error && typeof error === "object" && "status" in error) {
      return problem({
        status: error.status,
        title: error.message,
        code: "AUTHENTICATION_ERROR",
        detail: error.message,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    if (error.name === "ZodError") {
      return problem({
        status: 400,
        title: "Validation error",
        code: "VALIDATION_ERROR",
        detail: "Invalid presence data",
        errors: error.errors,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to update presence",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
