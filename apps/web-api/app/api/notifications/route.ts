import { NextRequest } from "next/server";
import { z } from "zod";
import { getSecurityContext } from "../_lib/request";
import { ok, problem } from "../_lib/response";
import { NotificationSchema, type Notification } from "@aibos/contracts";
import { getErrorMessage, getErrorCode } from "@aibos/utils";

// Mock notification system (in production, use real instance)
const mockNotifications = new Map<string, Notification>();

const CreateNotificationSchema = z.object({
  type: z.enum(["info", "success", "warning", "error", "system"]).default("info"),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.any().optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  category: z.string().min(1).max(50),
  expiresAt: z.string().datetime().optional(),
  actions: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.enum(["button", "link", "dismiss"]),
        action: z.string(),
        style: z.enum(["primary", "secondary", "danger", "success"]).optional(),
        data: z.any().optional(),
      }),
    )
    .optional(),
  metadata: z
    .object({
      source: z.string().optional(),
      channel: z.string().optional(),
      tags: z.array(z.string()).optional(),
      custom: z.record(z.any()).optional(),
    })
    .optional(),
});

const NotificationQuerySchema = z.object({
  limit: z.string().optional().transform(val => {
    const num = Number(val || "50");
    if (num < 1 || num > 100) throw new Error("Limit must be between 1 and 100");
    return num;
  }),
  offset: z.string().optional().transform(val => {
    const num = Number(val || "0");
    if (num < 0) throw new Error("Offset must be non-negative");
    return num;
  }),
  unreadOnly: z
    .union([z.string(), z.boolean()])
    .optional()
    .transform(val => val === "true" || val === true)
    .default(false),
  category: z.string().optional(),
  type: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const url = new URL(req.url);
    const query = NotificationQuerySchema.parse(Object.fromEntries(url.searchParams));

    // Mock implementation - in production, use real notification system
    const notifications = Array.from(mockNotifications.values())
      .filter((n) => n.tenantId === ctx.tenantId && n.userId === ctx.userId)
      .filter((n) => {
        if (query.unreadOnly && n.read) { return false; }
        if (query.category && n.category !== query.category) { return false; }
        if (query.type && n.type !== query.type) { return false; }
        return true;
      })
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(query.offset as number, (query.offset as number) + (query.limit as number));

    const unreadCount = Array.from(mockNotifications.values()).filter(
      (n) => n.tenantId === ctx.tenantId && n.userId === ctx.userId && !n.read,
    ).length;

    return ok(
      {
        notifications,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total: notifications.length,
          hasMore: notifications.length === query.limit,
        },
        unreadCount,
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Get notifications error:", error);

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

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to get notifications",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSecurityContext(req);
    const body = await req.json();
    const notificationData = CreateNotificationSchema.parse(body);

    // Create notification
    const notification: Notification = {
      id: crypto.randomUUID(),
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      title: notificationData.title,
      message: notificationData.message,
      category: notificationData.category,
      type: notificationData.type as "info" | "warning" | "error" | "success",
      read: false,
      createdAt: Date.now(),
      data: notificationData.data,
    };

    // Store notification (mock)
    mockNotifications.set(notification.id, notification);

    // In production, send via real-time system
    // notificationSystem.sendNotification(ctx.tenantId, ctx.userId, notificationData);

    return ok(
      {
        notification,
        message: "Notification created successfully",
      },
      ctx.requestId,
    );
  } catch (error: unknown) {
    console.error("Create notification error:", error);

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

    if (error instanceof z.ZodError) {
      return problem({
        status: 400,
        title: "Validation error",
        code: "VALIDATION_ERROR",
        detail: `Invalid notification data: ${error.errors.map(e => e.message).join(', ')}`,
        requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      });
    }

    return problem({
      status: 500,
      title: "Internal server error",
      code: "INTERNAL_ERROR",
      detail: "Failed to create notification",
      requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
