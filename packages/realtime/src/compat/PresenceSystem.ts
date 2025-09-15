/**
 * @deprecated Compatibility layer for PresenceSystem
 * This provides missing methods that are expected by consumers
 * TODO: Migrate callers to use the actual PresenceSystem implementation
 */

import { PresenceSystem as CorePresenceSystem, PresenceStats } from "../presence-system";

export class PresenceSystem {
    /**
     * @deprecated Use CorePresenceSystem.getStats() instead
     */
    static getStats(): PresenceStats {
        // TEMP bridge - return empty stats for now
        // TODO: Implement actual presence statistics
        console.warn("PresenceSystem.getStats() - not implemented, returning empty stats");
        return {
            totalUsers: 0,
            onlineUsers: 0,
            awayUsers: 0,
            busyUsers: 0,
            offlineUsers: 0,
            usersByTenant: {},
            averageSessionDuration: 0
        };
    }
}
