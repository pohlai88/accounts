import { z } from "zod";

/**
 * Presence Schema - Type-safe presence data
 */
export const PresenceSchema = z.object({
    userId: z.string().uuid(),
    tenantId: z.string().uuid(),
    status: z.enum(["online", "away", "busy", "offline"]),
    lastSeen: z.number(),
    device: z.string().optional(),
    location: z.string().optional(),
    metadata: z.record(z.unknown()).optional(),
});

export type Presence = z.infer<typeof PresenceSchema>;

/**
 * Presence Query Schema
 */
export const PresenceQuerySchema = z.object({
    status: z.enum(["online", "away", "busy", "offline"]).optional(),
    includeOffline: z.boolean().default(false),
    limit: z.number().int().min(1).max(100).default(50),
});

export type PresenceQuery = z.infer<typeof PresenceQuerySchema>;

/**
 * Presence Response Schema
 */
export const PresenceResponseSchema = z.object({
    presence: z.array(PresenceSchema),
    stats: z.object({
        total: z.number().int().min(0),
        online: z.number().int().min(0),
        away: z.number().int().min(0),
        busy: z.number().int().min(0),
        offline: z.number().int().min(0),
    }),
});

export type PresenceResponse = z.infer<typeof PresenceResponseSchema>;
