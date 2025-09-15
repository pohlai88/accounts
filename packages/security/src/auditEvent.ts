import { z } from "zod";
import type { Ok, Err, Result } from "./types.js";

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/**
 * Audit Event Schema - Single source of truth for all audit events
 * Uses discriminated unions for type-safe event handling
 */
export const AuditEventSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("auth.login"),
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        companyId: z.string().uuid().optional(),
        ip: z.string().min(3),
        ua: z.string().optional(),
        ts: z.coerce.date(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
        category: z.string().default("authentication"),
    }),
    z.object({
        action: z.literal("auth.logout"),
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        companyId: z.string().uuid().optional(),
        ts: z.coerce.date(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
        category: z.string().default("authentication"),
    }),
    z.object({
        action: z.literal("permission.denied"),
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        resource: z.string(),
        required: z.array(z.string()).nonempty(),
        ts: z.coerce.date(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("high"),
        category: z.string().default("security"),
    }),
    z.object({
        action: z.literal("api.request"),
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        method: z.string(),
        resource: z.string(),
        statusCode: z.number().int().min(100).max(599),
        duration: z.number().positive(),
        ip: z.string().min(3),
        ua: z.string().optional(),
        ts: z.coerce.date(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("low"),
        category: z.string().default("system"),
    }),
    z.object({
        action: z.literal("data.export"),
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
        resource: z.string(),
        recordCount: z.number().int().nonnegative(),
        ts: z.coerce.date(),
        severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
        category: z.string().default("data_protection"),
    }),
]);

export type AuditEvent = z.infer<typeof AuditEventSchema>;

/**
 * Parse and validate audit event from unknown input
 * @param input - Unknown input to parse
 * @returns Result containing parsed AuditEvent or ZodError
 */
export function parseAuditEvent(input: unknown): Result<AuditEvent, z.ZodError> {
    const p = AuditEventSchema.safeParse(input);
    return p.success ? ok(p.data) : err(p.error);
}

/**
 * Create a typed audit event with defaults
 * @param event - Partial audit event data
 * @returns Parsed AuditEvent
 */
export function createAuditEvent(event: Partial<AuditEvent> & { action: AuditEvent["action"] }): AuditEvent {
    const now = new Date();
    return AuditEventSchema.parse({
        ts: now,
        severity: "low",
        category: "system",
        ...event,
    });
}
