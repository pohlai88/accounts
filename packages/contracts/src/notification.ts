import { z } from "zod";

/**
 * Notification Schema - Type-safe notification data
 */
export const NotificationSchema = z.object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    userId: z.string().uuid(),
    title: z.string(),
    message: z.string(),
    category: z.string(),
    type: z.enum(["info", "warning", "error", "success"]),
    read: z.boolean().default(false),
    createdAt: z.number(),
    updatedAt: z.number().optional(),
    data: z.record(z.unknown()).optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

/**
 * Notification Query Schema
 */
export const NotificationQuerySchema = z.object({
    offset: z.number().int().min(0).default(0),
    limit: z.number().int().min(1).max(100).default(20),
    unreadOnly: z.boolean().default(false),
    category: z.string().optional(),
    type: z.enum(["info", "warning", "error", "success"]).optional(),
});

export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;

/**
 * Notification Response Schema
 */
export const NotificationResponseSchema = z.object({
    notifications: z.array(NotificationSchema),
    unreadCount: z.number().int().min(0),
    totalCount: z.number().int().min(0),
    hasMore: z.boolean(),
});

export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
