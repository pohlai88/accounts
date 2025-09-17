// @ts-nocheck
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketManager = void 0;
const ws_1 = require("ws");
const events_1 = require("events");
class WebSocketManager extends events_1.EventEmitter {
  constructor(config = {}) {
    super();
    this.wss = null;
    this.connections = new Map();
    this.tenantConnections = new Map();
    this.heartbeatInterval = null;
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
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new ws_1.WebSocketServer({
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
  stop() {
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
  handleConnection(socket, request) {
    const connectionId = this.generateConnectionId();
    const url = new URL(request.url, `http://${request.headers.host}`);
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
    const connectionInfo = {
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
  setupConnectionHandlers(connection) {
    const { socket, id } = connection;
    socket.on("message", data => {
      try {
        const message = JSON.parse(data.toString());
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
  handleMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    this.stats.messagesReceived++;
    // Validate message
    if (message.tenantId !== connection.tenantId) {
      console.warn(`Tenant mismatch for connection ${connectionId}`);
      return;
    }
    switch (message.type) {
      case "subscribe":
        this.handleSubscribe(connectionId, message.data);
        break;
      case "unsubscribe":
        this.handleUnsubscribe(connectionId, message.data);
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
  handleSubscribe(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    const { channel } = data;
    if (!channel) return;
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
  handleUnsubscribe(connectionId, data) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
    const { channel } = data;
    if (!channel) return;
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
  handlePing(connectionId) {
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
  handleDisconnection(connectionId, code, reason) {
    const connection = this.connections.get(connectionId);
    if (!connection) return;
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
  sendMessage(connectionId, message) {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.socket.readyState !== ws_1.WebSocket.OPEN) {
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
  broadcastToTenant(tenantId, message) {
    const tenantConnections = this.tenantConnections.get(tenantId);
    if (!tenantConnections) return 0;
    let sent = 0;
    const fullMessage = {
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
  broadcastToChannel(channel, message) {
    let sent = 0;
    const [tenantId] = channel.split(":");
    for (const [connectionId, connection] of this.connections) {
      if (connection.tenantId === tenantId && connection.subscriptions.has(channel)) {
        const fullMessage = {
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
  startHeartbeat() {
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
  generateConnectionId() {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Validate authentication token
   */
  validateToken(token, tenantId, userId) {
    // In production, verify JWT token
    // For now, basic validation
    return token.length > 10 && tenantId.length > 0 && userId.length > 0;
  }
  /**
   * Add connection to tenant group
   */
  addTenantConnection(tenantId, connectionId) {
    if (!this.tenantConnections.has(tenantId)) {
      this.tenantConnections.set(tenantId, new Set());
    }
    this.tenantConnections.get(tenantId).add(connectionId);
  }
  /**
   * Remove connection from tenant group
   */
  removeTenantConnection(tenantId, connectionId) {
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
  updateTenantStats(tenantId, delta) {
    this.stats.connectionsByTenant[tenantId] =
      (this.stats.connectionsByTenant[tenantId] || 0) + delta;
    if (this.stats.connectionsByTenant[tenantId] <= 0) {
      delete this.stats.connectionsByTenant[tenantId];
    }
  }
  /**
   * Get connection information
   */
  getConnection(connectionId) {
    return this.connections.get(connectionId);
  }
  /**
   * Get tenant connections
   */
  getTenantConnections(tenantId) {
    const tenantConnectionIds = this.tenantConnections.get(tenantId);
    if (!tenantConnectionIds) return [];
    return Array.from(tenantConnectionIds)
      .map(id => this.connections.get(id))
      .filter(conn => conn !== undefined);
  }
  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime,
    };
  }
  /**
   * Get health status
   */
  getHealthStatus() {
    const issues = [];
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
    let status = "healthy";
    if (issues.length > 0) {
      status = issues.length > 2 ? "unhealthy" : "degraded";
    }
    return { status, issues };
  }
}
exports.WebSocketManager = WebSocketManager;
//# sourceMappingURL=websocket-manager.js.map
