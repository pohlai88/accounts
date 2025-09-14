import { WebSocket } from "ws";
import { EventEmitter } from "events";
export interface WebSocketConfig {
  port: number;
  path: string;
  heartbeatInterval: number;
  maxConnections: number;
  connectionTimeout: number;
  enableCompression: boolean;
  enablePerMessageDeflate: boolean;
}
export interface ConnectionInfo {
  id: string;
  tenantId: string;
  userId: string;
  socket: WebSocket;
  connectedAt: Date;
  lastPing: Date;
  subscriptions: Set<string>;
  isAlive: boolean;
}
export interface WebSocketMessage {
  type: string;
  data: unknown;
  tenantId: string;
  userId?: string;
  timestamp: number;
  requestId?: string;
}
export interface WebSocketStats {
  totalConnections: number;
  activeConnections: number;
  connectionsByTenant: Record<string, number>;
  messagesSent: number;
  messagesReceived: number;
  errors: number;
  uptime: number;
}
export declare class WebSocketManager extends EventEmitter {
  private wss;
  private connections;
  private tenantConnections;
  private config;
  private stats;
  private heartbeatInterval;
  private startTime;
  constructor(config?: Partial<WebSocketConfig>);
  /**
   * Start WebSocket server
   */
  start(): Promise<void>;
  /**
   * Stop WebSocket server
   */
  stop(): Promise<void>;
  /**
   * Handle new connection
   */
  private handleConnection;
  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers;
  /**
   * Handle incoming message
   */
  private handleMessage;
  /**
   * Handle subscription
   */
  private handleSubscribe;
  /**
   * Handle unsubscription
   */
  private handleUnsubscribe;
  /**
   * Handle ping
   */
  private handlePing;
  /**
   * Handle disconnection
   */
  private handleDisconnection;
  /**
   * Send message to specific connection
   */
  sendMessage(connectionId: string, message: WebSocketMessage): boolean;
  /**
   * Broadcast message to tenant
   */
  broadcastToTenant(
    tenantId: string,
    message: Omit<WebSocketMessage, "tenantId" | "userId" | "timestamp">,
  ): number;
  /**
   * Broadcast message to channel subscribers
   */
  broadcastToChannel(
    channel: string,
    message: Omit<WebSocketMessage, "tenantId" | "userId" | "timestamp">,
  ): number;
  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat;
  /**
   * Generate unique connection ID
   */
  private generateConnectionId;
  /**
   * Validate authentication token
   */
  private validateToken;
  /**
   * Add connection to tenant group
   */
  private addTenantConnection;
  /**
   * Remove connection from tenant group
   */
  private removeTenantConnection;
  /**
   * Update tenant connection statistics
   */
  private updateTenantStats;
  /**
   * Get connection information
   */
  getConnection(connectionId: string): ConnectionInfo | undefined;
  /**
   * Get tenant connections
   */
  getTenantConnections(tenantId: string): ConnectionInfo[];
  /**
   * Get statistics
   */
  getStats(): WebSocketStats;
  /**
   * Get health status
   */
  getHealthStatus(): {
    status: "healthy" | "degraded" | "unhealthy";
    issues: string[];
  };
}
//# sourceMappingURL=websocket-manager.d.ts.map
