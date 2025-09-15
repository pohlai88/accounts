import { z } from "zod";
// Simple Result type for this package
export type Ok<T> = { ok: true; value: T };
export type Err<E = Error> = { ok: false; error: E };
export type Result<T, E = Error> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

/**
 * WebSocket Message Schema - Type-safe message envelope
 * Centralizes all WebSocket message validation
 */
export const WebSocketMessageSchema = z.object({
    type: z.enum(["presence.update", "metrics.update", "notification", "system.alert", "data.sync"]),
    tenantId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    payload: z.unknown(), // Can be refined per type incrementally
    ts: z.coerce.date(),
    id: z.string().uuid().optional(),
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

/**
 * Parse and validate WebSocket message from unknown input
 * @param input - Unknown input to parse
 * @returns Result containing parsed WebSocketMessage or ZodError
 */
export function toWsMessage(input: unknown): Result<WebSocketMessage, z.ZodError> {
    const p = WebSocketMessageSchema.safeParse(input);
    return p.success ? ok(p.data) : err(p.error);
}

/**
 * Create a typed WebSocket message with defaults
 * @param message - Partial message data
 * @returns Parsed WebSocketMessage
 */
export function createWsMessage(message: Partial<WebSocketMessage> & { type: WebSocketMessage["type"] }): WebSocketMessage {
    const now = new Date();
    return WebSocketMessageSchema.parse({
        ts: now,
        id: crypto.randomUUID(),
        ...message,
    });
}

/**
 * Type guards for specific message types
 */
export function isPresenceUpdate(msg: WebSocketMessage): msg is WebSocketMessage & { type: "presence.update" } {
    return msg.type === "presence.update";
}

export function isMetricsUpdate(msg: WebSocketMessage): msg is WebSocketMessage & { type: "metrics.update" } {
    return msg.type === "metrics.update";
}

export function isNotification(msg: WebSocketMessage): msg is WebSocketMessage & { type: "notification" } {
    return msg.type === "notification";
}
