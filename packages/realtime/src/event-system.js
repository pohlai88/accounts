"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeEventSystem = void 0;
const events_1 = require("events");
class RealtimeEventSystem extends events_1.EventEmitter {
  constructor(wsManager, config = {}) {
    super();
    this.subscriptions = new Map();
    this.eventHistory = [];
    this.eventIdCounter = 0;
    this.wsManager = wsManager;
    this.config = {
      maxEventHistory: 1000,
      eventTTL: 3600, // 1 hour
      enablePersistence: false,
      enableCompression: true,
      maxSubscriptionsPerConnection: 50,
      ...config,
    };
    this.setupWebSocketHandlers();
    this.startEventCleanup();
  }
  /**
   * Publish event to tenant
   */
  publishEvent(event) {
    const eventId = this.generateEventId();
    const fullEvent = {
      ...event,
      id: eventId,
      timestamp: Date.now(),
    };
    // Store in history
    this.addToHistory(fullEvent);
    // Broadcast to WebSocket connections
    this.broadcastEvent(fullEvent);
    // Emit for local listeners
    this.emit("event", fullEvent);
    return eventId;
  }
  /**
   * Subscribe to events
   */
  subscribe(tenantId, channels, callback, options = {}) {
    const subscriptionId = this.generateSubscriptionId();
    const subscription = {
      id: subscriptionId,
      tenantId,
      userId: options.userId,
      channels,
      filters: options.filters,
      callback,
      createdAt: new Date(),
      isActive: true,
    };
    this.subscriptions.set(subscriptionId, subscription);
    this.emit("subscription", subscription);
    return subscriptionId;
  }
  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;
    subscription.isActive = false;
    this.subscriptions.delete(subscriptionId);
    this.emit("unsubscription", subscription);
    return true;
  }
  /**
   * Subscribe to tenant events via WebSocket
   */
  subscribeToTenantEvents(connectionId, tenantId, channels) {
    const connection = this.wsManager.getConnection(connectionId);
    if (!connection || connection.tenantId !== tenantId) return;
    // Subscribe to each channel
    for (const channel of channels) {
      const fullChannel = `${tenantId}:${channel}`;
      this.wsManager.sendMessage(connectionId, {
        type: "subscribe",
        data: { channel: fullChannel },
        tenantId,
        userId: connection.userId,
        timestamp: Date.now(),
      });
    }
  }
  /**
   * Publish tenant-specific event
   */
  publishTenantEvent(tenantId, type, data, options = {}) {
    return this.publishEvent({
      type,
      tenantId,
      userId: options.userId,
      data,
      channel: options.channel,
      priority: options.priority || "normal",
      ttl: options.ttl,
    });
  }
  /**
   * Publish user-specific event
   */
  publishUserEvent(tenantId, userId, type, data, options = {}) {
    return this.publishEvent({
      type,
      tenantId,
      userId,
      data,
      channel: options.channel || `user:${userId}`,
      priority: options.priority || "normal",
      ttl: options.ttl,
    });
  }
  /**
   * Publish system event (high priority)
   */
  publishSystemEvent(tenantId, type, data, options = {}) {
    return this.publishEvent({
      type,
      tenantId,
      data,
      channel: options.channel || "system",
      priority: "high",
      ttl: options.ttl,
    });
  }
  /**
   * Get event history for tenant
   */
  getEventHistory(tenantId, options = {}) {
    const { limit = 100, since, types, channels } = options;
    let events = this.eventHistory.filter(event => event.tenantId === tenantId);
    if (since) {
      events = events.filter(event => event.timestamp >= since);
    }
    if (types && types.length > 0) {
      events = events.filter(event => types.includes(event.type));
    }
    if (channels && channels.length > 0) {
      events = events.filter(event => event.channel && channels.includes(event.channel));
    }
    return events.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }
  /**
   * Get active subscriptions for tenant
   */
  getTenantSubscriptions(tenantId) {
    return Array.from(this.subscriptions.values()).filter(
      sub => sub.tenantId === tenantId && sub.isActive,
    );
  }
  /**
   * Get statistics
   */
  getStats() {
    const now = Date.now();
    const eventsByTenant = {};
    const eventsByType = {};
    let totalAge = 0;
    for (const event of this.eventHistory) {
      eventsByTenant[event.tenantId] = (eventsByTenant[event.tenantId] || 0) + 1;
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      totalAge += now - event.timestamp;
    }
    const activeSubscriptions = Array.from(this.subscriptions.values()).filter(
      sub => sub.isActive,
    ).length;
    return {
      totalEvents: this.eventHistory.length,
      activeSubscriptions,
      eventsByTenant,
      eventsByType,
      averageEventAge: this.eventHistory.length > 0 ? totalAge / this.eventHistory.length : 0,
    };
  }
  /**
   * Setup WebSocket event handlers
   */
  setupWebSocketHandlers() {
    this.wsManager.on("message", ({ connectionId, message }) => {
      if (message.type === "event") {
        this.handleWebSocketEvent(connectionId, message);
      }
    });
    this.wsManager.on("disconnection", ({ connectionId }) => {
      this.handleConnectionDisconnect(connectionId);
    });
  }
  /**
   * Handle WebSocket event message
   */
  handleWebSocketEvent(connectionId, message) {
    const connection = this.wsManager.getConnection(connectionId);
    if (!connection) return;
    // Process event through local subscriptions
    const event = {
      id: this.generateEventId(),
      type: message.data.type,
      tenantId: connection.tenantId,
      userId: connection.userId,
      data: message.data.data,
      timestamp: Date.now(),
      channel: message.data.channel,
      priority: message.data.priority || "normal",
    };
    this.processEventForSubscriptions(event);
  }
  /**
   * Process event for local subscriptions
   */
  processEventForSubscriptions(event) {
    for (const subscription of this.subscriptions.values()) {
      if (!subscription.isActive) continue;
      if (subscription.tenantId !== event.tenantId) continue;
      if (subscription.userId && subscription.userId !== event.userId) continue;
      // Check channel match
      if (event.channel && !subscription.channels.includes(event.channel)) continue;
      // Check filters
      if (subscription.filters && !this.matchesFilters(event, subscription.filters)) continue;
      try {
        subscription.callback(event);
      } catch (error) {
        console.error("Subscription callback error:", error);
      }
    }
  }
  /**
   * Check if event matches filters
   */
  matchesFilters(event, filters) {
    return filters.every(filter => {
      const fieldValue = this.getFieldValue(event, filter.field);
      switch (filter.operator) {
        case "equals":
          return fieldValue === filter.value;
        case "contains":
          return String(fieldValue).includes(String(filter.value));
        case "startsWith":
          return String(fieldValue).startsWith(String(filter.value));
        case "endsWith":
          return String(fieldValue).endsWith(String(filter.value));
        case "regex":
          return new RegExp(filter.value).test(String(fieldValue));
        case "in":
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);
        case "notIn":
          return Array.isArray(filter.value) && !filter.value.includes(fieldValue);
        default:
          return false;
      }
    });
  }
  /**
   * Get field value from event (supports nested properties)
   */
  getFieldValue(event, field) {
    const parts = field.split(".");
    let value = event;
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part];
      } else {
        return undefined;
      }
    }
    return value;
  }
  /**
   * Broadcast event to WebSocket connections
   */
  broadcastEvent(event) {
    if (event.channel) {
      // Broadcast to channel subscribers
      this.wsManager.broadcastToChannel(event.channel, {
        type: "event",
        data: event,
      });
    } else {
      // Broadcast to tenant
      this.wsManager.broadcastToTenant(event.tenantId, {
        type: "event",
        data: event,
      });
    }
  }
  /**
   * Add event to history
   */
  addToHistory(event) {
    this.eventHistory.push(event);
    // Maintain history size
    if (this.eventHistory.length > this.config.maxEventHistory) {
      this.eventHistory = this.eventHistory.slice(-this.config.maxEventHistory);
    }
  }
  /**
   * Handle connection disconnect
   */
  handleConnectionDisconnect(connectionId) {
    // Remove any subscriptions associated with this connection
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.userId === connectionId) {
        subscription.isActive = false;
        this.subscriptions.delete(id);
      }
    }
  }
  /**
   * Start event cleanup process
   */
  startEventCleanup() {
    setInterval(() => {
      const now = Date.now();
      const ttl = this.config.eventTTL * 1000;
      this.eventHistory = this.eventHistory.filter(event => {
        if (event.ttl) {
          return now - event.timestamp < event.ttl * 1000;
        }
        return now - event.timestamp < ttl;
      });
    }, 60000); // Clean up every minute
  }
  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${++this.eventIdCounter}`;
  }
  /**
   * Generate unique subscription ID
   */
  generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
exports.RealtimeEventSystem = RealtimeEventSystem;
//# sourceMappingURL=event-system.js.map
