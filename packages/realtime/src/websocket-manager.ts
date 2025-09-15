import { WebSocket, WebSocketServer } from "ws";
import { createHash } from "crypto";
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

export interface EventMessage {
  type: string;
  data: unknown;
  channel: string;
  priority?: "low" | "normal" | "high";
}

export interface SubscribeMessage {
  channel: string;
}

export interface PresenceMessage {
  userId: string;
  tenantId?: string;
  status: string;
  metadata: Record<string, unknown>;
}

export interface NotificationActionMessage {
  notificationId: string;
  actionId: string;
  data: Record<string, unknown>;
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

export class WebSocketManager extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private connections = new Map<string, ConnectionInfo>();
  private tenantConnections = new Map<string, Set<string>>();
  private config: WebSocketConfig;
  private stats: WebSocketStats;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private startTime: number;

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();

    this.config = {
      port: 8080,
      path: "/ws",
      heartbeatInterval: 30000, // 30 seconds
      maxConnections: 1000,
      connectionTimeout: 60000, // 60 seconds
      enableCompression: true,
      enablePerMessageDeflate: true,
      ...config,
    };

    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      connectionsByTenant: {},
      messagesSent: 0,
      messagesReceived: 0,
      errors: 0,
      uptime: 0,
    };

    this.startTime = Date.now();
  }

  /**
   * Start WebSocket server
   */
  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({
          port: this.config.port,
          path: this.config.path,
          perMessageDeflate: this.config.enablePerMessageDeflate
            ? {
              threshold: 1024,
              concurrencyLimit: 10,
            }
            : false,
          maxPayload: 16 * 1024 * 1024, // 16MB
        });

        this.wss.on("connection", (socket, request) => {
          this.handleConnection(socket, request);
        });

        this.wss.on("error", error => {
          console.error("WebSocket server error:", error);
          this.stats.errors++;
          this.emit("error", error);
        });

        // Start heartbeat
        this.startHeartbeat();

        console.log(`WebSocket server started on port ${this.config.port}`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop WebSocket server
   */
  stop(): Promise<void> {
    return new Promise(resolve => {
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      if (this.wss) {
        this.wss.close(() => {
          console.log("WebSocket server stopped");
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Handle new connection
   */
  private handleConnection(socket: WebSocket, request: unknown): void {
    const connectionId = this.generateConnectionId();
    const req = request as { url: string; headers: { host: string } };
    const url = new URL(req.url, `http://${req.headers.host}`);
    const tenantId = url.searchParams.get("tenantId");
    const userId = url.searchParams.get("userId");
    const token = url.searchParams.get("token");

    // Validate connection parameters
    if (!tenantId || !userId || !token) {
      socket.close(1008, "Missing required parameters");
      return;
    }

    // Check connection limit
    if (this.connections.size >= this.config.maxConnections) {
      socket.close(1013, "Server overloaded");
      return;
    }

    // Validate token (in production, verify JWT)
    if (!this.validateToken(token, tenantId, userId)) {
      socket.close(1008, "Invalid token");
      return;
    }

    const connectionInfo: ConnectionInfo = {
      id: connectionId,
      tenantId,
      userId,
      socket,
      connectedAt: new Date(),
      lastPing: new Date(),
      subscriptions: new Set(),
      isAlive: true,
    };

    // Store connection
    this.connections.set(connectionId, connectionInfo);
    this.addTenantConnection(tenantId, connectionId);

    // Update stats
    this.stats.totalConnections++;
    this.stats.activeConnections++;
    this.updateTenantStats(tenantId, 1);

    // Set up event handlers
    this.setupConnectionHandlers(connectionInfo);

    // Send welcome message
    this.sendMessage(connectionId, {
      type: "connected",
      data: { connectionId, tenantId, userId },
      tenantId,
      userId,
      timestamp: Date.now(),
    });

    this.emit("connection", connectionInfo);
    console.log(`New connection: ${connectionId} (tenant: ${tenantId}, user: ${userId})`);
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers(connection: ConnectionInfo): void {
    const { socket, id } = connection;

    socket.on("message", data => {
      try {
        const message = JSON.parse(data.toString()) as WebSocketMessage;
        this.handleMessage(id, message);
      } catch (error) {
        console.error("Invalid message format:", error);
        this.stats.errors++;
      }
    });

    socket.on("pong", () => {
      connection.lastPing = new Date();
      connection.isAlive = true;
    });

    socket.on("close", (code, reason) => {
      this.handleDisconnection(id, code, reason.toString());
    });

    socket.on("error", error => {
      console.error(`Connection ${id} error:`, error);
      this.stats.errors++;
      this.emit("connectionError", { connectionId: id, error });
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(connectionId: string, message: WebSocketMessage): void {
    const connection = this.connections.get(connectionId);
    if (!connection) { return; }

    this.stats.messagesReceived++;

    // Validate message
    if (message.tenantId !== connection.tenantId) {
      console.warn(`Tenant mismatch for connection ${connectionId}`);
      return;
    }

    switch (message.type) {
      case "subscribe":
        this.handleSubscribe(connectionId, message.data as { channel: string });
        break;
      case "unsubscribe":
        this.handleUnsubscribe(connectionId, message.data as { channel: string });
        break;
      case "ping":
        this.handlePing(connectionId);
        break;
      default:
        this.emit("message", { connectionId, message });
    }
  }

  /**
   * Handle subscription
   */
  private handleSubscribe(connectionId: string, data: { channel: string }): void {
    const connection = this.connections.get(connectionId);
    if (!connection) { return; }

    const { channel } = data;
    if (!channel) { return; }

    // Validate channel format (tenant:channel)
    const expectedPrefix = `${connection.tenantId}:`;
    if (!channel.startsWith(expectedPrefix)) {
      console.warn(`Invalid channel subscription: ${channel}`);
      return;
    }

    connection.subscriptions.add(channel);
    this.emit("subscribe", { connectionId, channel, tenantId: connection.tenantId });

    this.sendMessage(connectionId, {
      type: "subscribed",
      data: { channel },
      tenantId: connection.tenantId,
      userId: connection.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle unsubscription
   */
  private handleUnsubscribe(connectionId: string, data: { channel: string }): void {
    const connection = this.connections.get(connectionId);
    if (!connection) { return; }

    const { channel } = data;
    if (!channel) { return; }

    connection.subscriptions.delete(channel);
    this.emit("unsubscribe", { connectionId, channel, tenantId: connection.tenantId });

    this.sendMessage(connectionId, {
      type: "unsubscribed",
      data: { channel },
      tenantId: connection.tenantId,
      userId: connection.userId,
      timestamp: Date.now(),
    });
  }

  /**
   * Handle ping
   */
  private handlePing(connectionId: string): void {
    this.sendMessage(connectionId, {
      type: "pong",
      data: {},
      tenantId: this.connections.get(connectionId)?.tenantId || "",
      userId: this.connections.get(connectionId)?.userId || "",
      timestamp: Date.now(),
    });
  }

  /**
   * Handle disconnection
   */
  private handleDisconnection(connectionId: string, code: number, reason: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) { return; }

    // Update stats
    this.stats.activeConnections--;
    this.updateTenantStats(connection.tenantId, -1);

    // Remove from tenant connections
    this.removeTenantConnection(connection.tenantId, connectionId);

    // Clean up
    this.connections.delete(connectionId);

    this.emit("disconnection", { connectionId, code, reason, connection });
    console.log(`Connection closed: ${connectionId} (code: ${code}, reason: ${reason})`);
  }

  /**
   * Send message to specific connection
   */
  sendMessage(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.socket.send(JSON.stringify(message));
      this.stats.messagesSent++;
      return true;
    } catch (error) {
      console.error(`Failed to send message to ${connectionId}:`, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Broadcast message to tenant
   */
  broadcastToTenant(
    tenantId: string,
    message: Omit<WebSocketMessage, "tenantId" | "userId" | "timestamp">,
  ): number {
    const tenantConnections = this.tenantConnections.get(tenantId);
    if (!tenantConnections) { return 0; }

    let sent = 0;
    const fullMessage: WebSocketMessage = {
      ...message,
      tenantId,
      timestamp: Date.now(),
    };

    for (const connectionId of tenantConnections) {
      if (this.sendMessage(connectionId, fullMessage)) {
        sent++;
      }
    }

    return sent;
  }

  /**
   * Broadcast message to channel subscribers
   */
  broadcastToChannel(
    channel: string,
    message: Omit<WebSocketMessage, "tenantId" | "userId" | "timestamp">,
  ): number {
    let sent = 0;
    const [tenantId] = channel.split(":");

    for (const [connectionId, connection] of this.connections) {
      if (connection.tenantId === tenantId && connection.subscriptions.has(channel)) {
        const fullMessage: WebSocketMessage = {
          ...message,
          tenantId: connection.tenantId,
          userId: connection.userId,
          timestamp: Date.now(),
        };

        if (this.sendMessage(connectionId, fullMessage)) {
          sent++;
        }
      }
    }

    return sent;
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      for (const [connectionId, connection] of this.connections) {
        if (!connection.isAlive) {
          connection.socket.terminate();
          continue;
        }

        connection.isAlive = false;
        connection.socket.ping();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Validate authentication token
   */
  private validateToken(token: string, tenantId: string, userId: string): boolean {
    // In production, verify JWT token
    // For now, basic validation
    return token.length > 10 && tenantId.length > 0 && userId.length > 0;
  }

  /**
   * Add connection to tenant group
   */
  private addTenantConnection(tenantId: string, connectionId: string): void {
    if (!this.tenantConnections.has(tenantId)) {
      this.tenantConnections.set(tenantId, new Set());
    }
    this.tenantConnections.get(tenantId)!.add(connectionId);
  }

  /**
   * Remove connection from tenant group
   */
  private removeTenantConnection(tenantId: string, connectionId: string): void {
    const tenantConnections = this.tenantConnections.get(tenantId);
    if (tenantConnections) {
      tenantConnections.delete(connectionId);
      if (tenantConnections.size === 0) {
        this.tenantConnections.delete(tenantId);
      }
    }
  }

  /**
   * Update tenant connection statistics
   */
  private updateTenantStats(tenantId: string, delta: number): void {
    this.stats.connectionsByTenant[tenantId] =
      (this.stats.connectionsByTenant[tenantId] || 0) + delta;
    if (this.stats.connectionsByTenant[tenantId] <= 0) {
      delete this.stats.connectionsByTenant[tenantId];
    }
  }

  /**
   * Get connection information
   */
  getConnection(connectionId: string): ConnectionInfo | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get tenant connections
   */
  getTenantConnections(tenantId: string): ConnectionInfo[] {
    const tenantConnectionIds = this.tenantConnections.get(tenantId);
    if (!tenantConnectionIds) { return []; }

    return Array.from(tenantConnectionIds)
      .map(id => this.connections.get(id))
      .filter((conn): conn is ConnectionInfo => conn !== undefined);
  }

  /**
   * Get statistics
   */
  getStats(): WebSocketStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime,
    };
  }

  /**
   * Get health status
   */
  getHealthStatus(): { status: "healthy" | "degraded" | "unhealthy"; issues: string[] } {
    const issues: string[] = [];
    const { activeConnections, errors, uptime } = this.stats;

    if (activeConnections > this.config.maxConnections * 0.9) {
      issues.push("High connection count");
    }

    if (errors > 100) {
      issues.push("High error rate");
    }

    if (uptime < 60000) {
      // Less than 1 minute
      issues.push("Recently started");
    }

    let status: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (issues.length > 0) {
      status = issues.length > 2 ? "unhealthy" : "degraded";
    }

    return { status, issues };
  }

  // Static methods for compatibility
  static getConnectionsByTenant(tenantId: string): ConnectionInfo[] {
    // This is a static method that would need access to a global instance
    // For now, return empty array as a compatibility bridge
    console.warn(`WebSocketManager.getConnectionsByTenant(${tenantId}) - static method not implemented, returning empty array`);
    return [];
  }

  static getConnectionsByUser(userId: string): ConnectionInfo[] {
    // This is a static method that would need access to a global instance
    // For now, return empty array as a compatibility bridge
    console.warn(`WebSocketManager.getConnectionsByUser(${userId}) - static method not implemented, returning empty array`);
    return [];
  }
}
