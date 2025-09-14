"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSystem = void 0;
const events_1 = require("events");
class NotificationSystem extends events_1.EventEmitter {
  constructor(wsManager, eventSystem, presenceSystem, config = {}) {
    super();
    this.notifications = new Map();
    this.userNotifications = new Map(); // userId -> Set<notificationId>
    this.tenantNotifications = new Map(); // tenantId -> Set<notificationId>
    this.preferences = new Map(); // userId -> preferences
    this.readTimers = new Map(); // notificationId -> timer
    this.wsManager = wsManager;
    this.eventSystem = eventSystem;
    this.presenceSystem = presenceSystem;
    this.config = {
      maxNotificationsPerUser: 100,
      autoMarkReadDelay: 30, // 30 seconds
      notificationTTL: 86400, // 24 hours
      enablePersistence: false,
      enableCompression: true,
      ...config,
    };
    this.setupEventHandlers();
    this.startCleanupProcess();
  }
  /**
   * Send notification to user
   */
  sendNotification(tenantId, userId, notification) {
    const notificationId = this.generateNotificationId();
    const now = new Date();
    const fullNotification = {
      ...notification,
      id: notificationId,
      tenantId,
      userId,
      read: false,
      createdAt: now,
    };
    // Check user preferences
    const userPrefs = this.getUserPreferences(userId, tenantId);
    if (!this.shouldSendNotification(fullNotification, userPrefs)) {
      return notificationId; // Still return ID for tracking
    }
    // Store notification
    this.notifications.set(notificationId, fullNotification);
    this.addToUserNotifications(userId, notificationId);
    this.addToTenantNotifications(tenantId, notificationId);
    // Send via WebSocket if user is online
    this.sendWebSocketNotification(fullNotification);
    // Set auto-mark as read timer
    if (this.config.autoMarkReadDelay > 0) {
      this.setAutoReadTimer(notificationId);
    }
    // Publish event
    this.eventSystem.publishUserEvent(
      tenantId,
      userId,
      "notification.created",
      {
        notification: fullNotification,
      },
      {
        channel: `notifications:${userId}`,
        priority: "normal",
      },
    );
    this.emit("notification", fullNotification);
    return notificationId;
  }
  /**
   * Send notification to multiple users
   */
  sendBulkNotification(tenantId, userIds, notification) {
    const notificationIds = [];
    for (const userId of userIds) {
      const id = this.sendNotification(tenantId, userId, notification);
      notificationIds.push(id);
    }
    return notificationIds;
  }
  /**
   * Send notification to tenant (all users)
   */
  sendTenantNotification(tenantId, notification) {
    const tenantUsers = this.presenceSystem.getTenantPresence(tenantId);
    const userIds = tenantUsers.map(presence => presence.userId);
    return this.sendBulkNotification(tenantId, userIds, notification);
  }
  /**
   * Mark notification as read
   */
  markAsRead(notificationId, userId) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId || notification.read) {
      return false;
    }
    notification.read = true;
    this.clearAutoReadTimer(notificationId);
    // Publish event
    this.eventSystem.publishUserEvent(
      notification.tenantId,
      userId,
      "notification.read",
      {
        notificationId,
        notification,
      },
      {
        channel: `notifications:${userId}`,
        priority: "low",
      },
    );
    this.emit("notificationRead", { notificationId, userId });
    return true;
  }
  /**
   * Mark all notifications as read for user
   */
  markAllAsRead(userId, tenantId) {
    const userNotificationIds = this.userNotifications.get(userId);
    if (!userNotificationIds) return 0;
    let markedCount = 0;
    for (const notificationId of userNotificationIds) {
      const notification = this.notifications.get(notificationId);
      if (notification && notification.tenantId === tenantId && !notification.read) {
        if (this.markAsRead(notificationId, userId)) {
          markedCount++;
        }
      }
    }
    return markedCount;
  }
  /**
   * Delete notification
   */
  deleteNotification(notificationId, userId) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      return false;
    }
    this.notifications.delete(notificationId);
    this.removeFromUserNotifications(userId, notificationId);
    this.removeFromTenantNotifications(notification.tenantId, notificationId);
    this.clearAutoReadTimer(notificationId);
    // Publish event
    this.eventSystem.publishUserEvent(
      notification.tenantId,
      userId,
      "notification.deleted",
      {
        notificationId,
      },
      {
        channel: `notifications:${userId}`,
        priority: "low",
      },
    );
    this.emit("notificationDeleted", { notificationId, userId });
    return true;
  }
  /**
   * Get user notifications
   */
  getUserNotifications(userId, tenantId, options = {}) {
    const userNotificationIds = this.userNotifications.get(userId);
    if (!userNotificationIds) return [];
    const { limit = 50, offset = 0, unreadOnly = false, category, type } = options;
    let notifications = Array.from(userNotificationIds)
      .map(id => this.notifications.get(id))
      .filter(notification => notification !== undefined && notification.tenantId === tenantId);
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }
    if (type) {
      notifications = notifications.filter(n => n.type === type);
    }
    return notifications
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }
  /**
   * Get notification count for user
   */
  getNotificationCount(userId, tenantId, unreadOnly = true) {
    const notifications = this.getUserNotifications(userId, tenantId, { unreadOnly });
    return notifications.length;
  }
  /**
   * Set user notification preferences
   */
  setUserPreferences(userId, tenantId, preferences) {
    this.preferences.set(userId, preferences);
    this.eventSystem.publishUserEvent(
      tenantId,
      userId,
      "notification.preferences.updated",
      {
        preferences,
      },
      {
        channel: `notifications:${userId}`,
        priority: "low",
      },
    );
    this.emit("preferencesUpdated", { userId, tenantId, preferences });
  }
  /**
   * Get user notification preferences
   */
  getUserPreferences(userId, tenantId) {
    return (
      this.preferences.get(userId) || {
        userId,
        tenantId,
        categories: {},
        globalSettings: {
          enablePush: true,
          enableEmail: false,
          enableSMS: false,
          enableWebSocket: true,
          maxNotifications: this.config.maxNotificationsPerUser,
          autoMarkRead: true,
          autoMarkReadDelay: this.config.autoMarkReadDelay,
        },
      }
    );
  }
  /**
   * Get notification statistics
   */
  getStats() {
    const stats = {
      totalNotifications: this.notifications.size,
      unreadNotifications: 0,
      notificationsByType: {},
      notificationsByCategory: {},
      notificationsByTenant: {},
      averageReadTime: 0,
    };
    let totalReadTime = 0;
    let readCount = 0;
    for (const notification of this.notifications.values()) {
      if (!notification.read) {
        stats.unreadNotifications++;
      }
      stats.notificationsByType[notification.type] =
        (stats.notificationsByType[notification.type] || 0) + 1;
      stats.notificationsByCategory[notification.category] =
        (stats.notificationsByCategory[notification.category] || 0) + 1;
      stats.notificationsByTenant[notification.tenantId] =
        (stats.notificationsByTenant[notification.tenantId] || 0) + 1;
      // Calculate read time (simplified)
      if (notification.read) {
        const readTime = Date.now() - notification.createdAt.getTime();
        totalReadTime += readTime;
        readCount++;
      }
    }
    if (readCount > 0) {
      stats.averageReadTime = totalReadTime / readCount;
    }
    return stats;
  }
  /**
   * Setup event handlers
   */
  setupEventHandlers() {
    this.wsManager.on("message", ({ connectionId, message }) => {
      if (message.type === "notification.action") {
        this.handleNotificationAction(connectionId, message);
      }
    });
  }
  /**
   * Handle notification action from client
   */
  handleNotificationAction(connectionId, message) {
    const connection = this.wsManager.getConnection(connectionId);
    if (!connection) return;
    const { notificationId, actionId, data } = message.data;
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== connection.userId) return;
    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) return;
    // Execute action
    this.executeNotificationAction(notification, action, data, connection.userId);
  }
  /**
   * Execute notification action
   */
  executeNotificationAction(notification, action, data, userId) {
    switch (action.type) {
      case "dismiss":
        this.deleteNotification(notification.id, userId);
        break;
      case "button":
      case "link":
        // Emit action event for handling by application
        this.emit("notificationAction", {
          notification,
          action,
          data,
          userId,
        });
        break;
    }
  }
  /**
   * Send notification via WebSocket
   */
  sendWebSocketNotification(notification) {
    this.wsManager.broadcastToTenant(notification.tenantId, {
      type: "notification",
      data: notification,
    });
  }
  /**
   * Check if notification should be sent based on preferences
   */
  shouldSendNotification(notification, preferences) {
    // Check global settings
    if (!preferences.globalSettings.enableWebSocket) return false;
    // Check category settings
    const categoryPrefs = preferences.categories[notification.category];
    if (categoryPrefs && !categoryPrefs.enabled) return false;
    // Check quiet hours
    if (categoryPrefs?.quietHours) {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const { start, end, timezone } = categoryPrefs.quietHours;
      // Simple quiet hours check (in production, use proper timezone handling)
      if (currentTime >= start && currentTime <= end) {
        return false;
      }
    }
    return true;
  }
  /**
   * Set auto-mark as read timer
   */
  setAutoReadTimer(notificationId) {
    this.clearAutoReadTimer(notificationId);
    const timer = setTimeout(() => {
      const notification = this.notifications.get(notificationId);
      if (notification && !notification.read) {
        this.markAsRead(notificationId, notification.userId);
      }
    }, this.config.autoMarkReadDelay * 1000);
    this.readTimers.set(notificationId, timer);
  }
  /**
   * Clear auto-mark as read timer
   */
  clearAutoReadTimer(notificationId) {
    const timer = this.readTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      this.readTimers.delete(notificationId);
    }
  }
  /**
   * Add notification to user index
   */
  addToUserNotifications(userId, notificationId) {
    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, new Set());
    }
    this.userNotifications.get(userId).add(notificationId);
  }
  /**
   * Remove notification from user index
   */
  removeFromUserNotifications(userId, notificationId) {
    const userNotifications = this.userNotifications.get(userId);
    if (userNotifications) {
      userNotifications.delete(notificationId);
      if (userNotifications.size === 0) {
        this.userNotifications.delete(userId);
      }
    }
  }
  /**
   * Add notification to tenant index
   */
  addToTenantNotifications(tenantId, notificationId) {
    if (!this.tenantNotifications.has(tenantId)) {
      this.tenantNotifications.set(tenantId, new Set());
    }
    this.tenantNotifications.get(tenantId).add(notificationId);
  }
  /**
   * Remove notification from tenant index
   */
  removeFromTenantNotifications(tenantId, notificationId) {
    const tenantNotifications = this.tenantNotifications.get(tenantId);
    if (tenantNotifications) {
      tenantNotifications.delete(notificationId);
      if (tenantNotifications.size === 0) {
        this.tenantNotifications.delete(tenantId);
      }
    }
  }
  /**
   * Start cleanup process
   */
  startCleanupProcess() {
    setInterval(() => {
      const now = Date.now();
      const ttl = this.config.notificationTTL * 1000;
      for (const [notificationId, notification] of this.notifications) {
        const isExpired = notification.expiresAt && notification.expiresAt.getTime() < now;
        const isOld = now - notification.createdAt.getTime() > ttl;
        if (isExpired || isOld) {
          this.deleteNotification(notificationId, notification.userId);
        }
      }
    }, 60000); // Clean up every minute
  }
  /**
   * Generate unique notification ID
   */
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
exports.NotificationSystem = NotificationSystem;
//# sourceMappingURL=notification-system.js.map
