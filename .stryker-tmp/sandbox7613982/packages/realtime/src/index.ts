// @ts-nocheck
export * from "./websocket-manager";
export * from "./event-system";
export * from "./presence-system";
export * from "./notification-system";
export { toWsMessage, WebSocketMessageSchema, type WebSocketMessage } from "./wsMessage";

// ============================================================================
// COMPATIBILITY LAYER (DEPRECATED)
// ============================================================================

// @deprecated Use WebSocketManager from ./websocket-manager instead
export { WebSocketManager as CompatWebSocketManager } from "./compat/WebSocketManager";

// @deprecated Use PresenceSystem from ./presence-system instead
export { PresenceSystem as CompatPresenceSystem } from "./compat/PresenceSystem";
