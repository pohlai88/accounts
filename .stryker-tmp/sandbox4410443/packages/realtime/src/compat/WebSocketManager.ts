/**
 * @deprecated Compatibility layer for WebSocketManager
 * This provides missing methods that are expected by consumers
 * TODO: Migrate callers to use the actual WebSocketManager implementation
 */
// @ts-nocheck


import { WebSocketManager as CoreWebSocketManager, ConnectionInfo } from "../websocket-manager";

export class WebSocketManager {
    /**
     * @deprecated Use CoreWebSocketManager.getConnectionsByTenant() instead
     */
    static getConnectionsByTenant(tenantId: string): ConnectionInfo[] {
        // TEMP bridge - return empty array for now
        // TODO: Implement actual tenant-based connection lookup
        console.warn(`getConnectionsByTenant(${tenantId}) - not implemented, returning empty array`);
        return [];
    }

    /**
     * @deprecated Use CoreWebSocketManager.getConnectionsByUser() instead
     */
    static getConnectionsByUser(userId: string): ConnectionInfo[] {
        // TEMP bridge - return empty array for now
        // TODO: Implement actual user-based connection lookup
        console.warn(`getConnectionsByUser(${userId}) - not implemented, returning empty array`);
        return [];
    }
}
