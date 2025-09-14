import { EventEmitter } from "events";
import { WebSocketManager } from "./websocket-manager";
import { RealtimeEventSystem } from "./event-system";
export interface PresenceInfo {
  userId: string;
  tenantId: string;
  status: "online" | "away" | "busy" | "offline";
  lastSeen: Date;
  connectionId?: string;
  metadata?: {
    device?: string;
    location?: string;
    activity?: string;
    custom?: Record<string, unknown>;
  };
}
export interface PresenceUpdate {
  userId: string;
  tenantId: string;
  status: PresenceInfo["status"];
  metadata?: PresenceInfo["metadata"];
  timestamp: number;
}
export interface PresenceStats {
  totalUsers: number;
  onlineUsers: number;
  awayUsers: number;
  busyUsers: number;
  offlineUsers: number;
  usersByTenant: Record<string, number>;
  averageSessionDuration: number;
}
export declare class PresenceSystem extends EventEmitter {
  private wsManager;
  private eventSystem;
  private presence;
  private tenantPresence;
  private sessionStartTimes;
  private awayTimers;
  private config;
  constructor(
    wsManager: WebSocketManager,
    eventSystem: RealtimeEventSystem,
    config?: Partial<PresenceSystem["config"]>,
  );
  /**
   * Update user presence
   */
  updatePresence(
    userId: string,
    tenantId: string,
    status: PresenceInfo["status"],
    metadata?: PresenceInfo["metadata"],
  ): void;
  /**
   * Set user online
   */
  setOnline(userId: string, tenantId: string, metadata?: PresenceInfo["metadata"]): void;
  /**
   * Set user away
   */
  setAway(userId: string, tenantId: string, metadata?: PresenceInfo["metadata"]): void;
  /**
   * Set user busy
   */
  setBusy(userId: string, tenantId: string, metadata?: PresenceInfo["metadata"]): void;
  /**
   * Set user offline
   */
  setOffline(userId: string, tenantId: string): void;
  /**
   * Get user presence
   */
  getUserPresence(userId: string): PresenceInfo | undefined;
  /**
   * Get tenant presence
   */
  getTenantPresence(tenantId: string): PresenceInfo[];
  /**
   * Get online users for tenant
   */
  getOnlineUsers(tenantId: string): PresenceInfo[];
  /**
   * Get presence statistics
   */
  getPresenceStats(): PresenceStats;
  /**
   * Get presence history for user
   */
  getPresenceHistory(userId: string, limit?: number): PresenceUpdate[];
  /**
   * Subscribe to presence updates
   */
  subscribeToPresence(
    tenantId: string,
    callback: (update: PresenceUpdate) => void,
    options?: {
      userId?: string;
      statuses?: PresenceInfo["status"][];
    },
  ): string;
  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers;
  /**
   * Handle new connection
   */
  private handleConnection;
  /**
   * Handle connection disconnect
   */
  private handleDisconnection;
  /**
   * Handle presence message from client
   */
  private handlePresenceMessage;
  /**
   * Add user to tenant presence
   */
  private addToTenantPresence;
  /**
   * Remove user from tenant presence
   */
  private removeFromTenantPresence;
  /**
   * Set away timer for user
   */
  private setAwayTimer;
  /**
   * Clear away timer for user
   */
  private clearAwayTimer;
  /**
   * Start heartbeat to update last seen
   */
  private startHeartbeat;
  /**
   * Clean up old presence data
   */
  cleanup(): void;
}
//# sourceMappingURL=presence-system.d.ts.map
