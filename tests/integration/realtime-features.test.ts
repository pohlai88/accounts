import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  WebSocketManager,
  RealtimeEventSystem,
  PresenceSystem,
  NotificationSystem,
} from "@aibos/realtime";

// Skip tests if WebSocket dependencies are not available
const skipTests = typeof WebSocket === "undefined";

describe.skipIf(skipTests)("Real-time Features Integration", () => {
  let wsManager: WebSocketManager;
  let eventSystem: RealtimeEventSystem;
  let presenceSystem: PresenceSystem;
  let notificationSystem: NotificationSystem;

  beforeAll(async () => {
    // Initialize real-time systems
    wsManager = new WebSocketManager({
      port: 8081, // Use different port for testing
      path: "/ws",
      heartbeatInterval: 10000,
      maxConnections: 100,
      connectionTimeout: 30000,
    });

    await wsManager.start();

    eventSystem = new RealtimeEventSystem(wsManager, {
      maxEventHistory: 100,
      eventTTL: 300,
      enablePersistence: false,
    });

    presenceSystem = new PresenceSystem(wsManager, eventSystem, {
      awayTimeout: 60000,
      heartbeatInterval: 30000,
      enableMetadata: true,
      enableSessionTracking: true,
    });

    notificationSystem = new NotificationSystem(wsManager, eventSystem, presenceSystem, {
      maxNotificationsPerUser: 50,
      autoMarkReadDelay: 10,
      notificationTTL: 3600,
      enablePersistence: false,
    });
  });

  afterAll(async () => {
    if (wsManager) {
      await wsManager.stop();
    }
  });

  describe("WebSocket Manager", () => {
    it("should start and stop WebSocket server", async () => {
      expect(wsManager).toBeDefined();

      const stats = wsManager.getStats();
      expect(stats).toHaveProperty("totalConnections");
      expect(stats).toHaveProperty("activeConnections");
      expect(stats).toHaveProperty("uptime");
    });

    it("should handle health checks", () => {
      const health = wsManager.getHealthStatus();
      expect(health).toHaveProperty("status");
      expect(health).toHaveProperty("issues");
      expect(["healthy", "degraded", "unhealthy"]).toContain(health.status);
    });
  });

  describe("Event System", () => {
    it("should publish and subscribe to events", async () => {
      const tenantId = "test-tenant-1";
      const eventType = "test.event";
      const eventData = { message: "Hello World" };

      let receivedEvent: any = null;
      const subscriptionId = eventSystem.subscribe(tenantId, [`${tenantId}:test`], event => {
        receivedEvent = event;
      });

      // Publish event
      const eventId = eventSystem.publishTenantEvent(tenantId, eventType, eventData, {
        channel: `${tenantId}:test`,
      });

      expect(eventId).toBeDefined();
      expect(receivedEvent).toBeDefined();
      expect(receivedEvent.type).toBe(eventType);
      expect(receivedEvent.data).toEqual(eventData);

      // Cleanup
      eventSystem.unsubscribe(subscriptionId);
    });

    it("should filter events by criteria", async () => {
      const tenantId = "test-tenant-2";
      let receivedEvents: any[] = [];

      const subscriptionId = eventSystem.subscribe(
        tenantId,
        [`${tenantId}:filtered`],
        event => {
          receivedEvents.push(event);
        },
        {
          filters: [{ field: "data.priority", operator: "equals", value: "high" }],
        },
      );

      // Publish events with different priorities
      eventSystem.publishTenantEvent(
        tenantId,
        "test.event",
        { priority: "low" },
        {
          channel: `${tenantId}:filtered`,
        },
      );
      eventSystem.publishTenantEvent(
        tenantId,
        "test.event",
        { priority: "high" },
        {
          channel: `${tenantId}:filtered`,
        },
      );

      // Wait for events to be processed
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(receivedEvents).toHaveLength(1);
      expect(receivedEvents[0].data.priority).toBe("high");

      // Cleanup
      eventSystem.unsubscribe(subscriptionId);
    });
  });

  describe("Presence System", () => {
    it("should update and track user presence", () => {
      const userId = "test-user-1";
      const tenantId = "test-tenant-3";

      // Set user online
      presenceSystem.setOnline(userId, tenantId, {
        device: "web",
        activity: "testing",
      });

      const presence = presenceSystem.getUserPresence(userId);
      expect(presence).toBeDefined();
      expect(presence?.status).toBe("online");
      expect(presence?.userId).toBe(userId);
      expect(presence?.tenantId).toBe(tenantId);

      // Set user away
      presenceSystem.setAway(userId, tenantId);
      const awayPresence = presenceSystem.getUserPresence(userId);
      expect(awayPresence?.status).toBe("away");

      // Set user offline
      presenceSystem.setOffline(userId, tenantId);
      const offlinePresence = presenceSystem.getUserPresence(userId);
      expect(offlinePresence?.status).toBe("offline");
    });

    it("should track tenant presence", () => {
      const tenantId = "test-tenant-4";
      const userIds = ["user-1", "user-2", "user-3"];

      // Set multiple users online
      userIds.forEach(userId => {
        presenceSystem.setOnline(userId, tenantId);
      });

      const tenantPresence = presenceSystem.getTenantPresence(tenantId);
      expect(tenantPresence).toHaveLength(3);
      expect(tenantPresence.every(p => p.status === "online")).toBe(true);

      // Set one user away
      presenceSystem.setAway("user-1", tenantId);
      const updatedPresence = presenceSystem.getTenantPresence(tenantId);
      const awayUser = updatedPresence.find(p => p.userId === "user-1");
      expect(awayUser?.status).toBe("away");
    });

    it("should provide presence statistics", () => {
      const tenantId = "test-tenant-5";
      const userIds = ["user-1", "user-2", "user-3", "user-4"];

      // Set users with different statuses
      presenceSystem.setOnline("user-1", tenantId);
      presenceSystem.setOnline("user-2", tenantId);
      presenceSystem.setAway("user-3", tenantId);
      presenceSystem.setBusy("user-4", tenantId);

      const stats = presenceSystem.getPresenceStats();
      expect(stats.totalUsers).toBeGreaterThanOrEqual(4);
      expect(stats.onlineUsers).toBeGreaterThanOrEqual(2);
      expect(stats.awayUsers).toBeGreaterThanOrEqual(1);
      expect(stats.busyUsers).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Notification System", () => {
    it("should send and retrieve notifications", () => {
      const tenantId = "test-tenant-6";
      const userId = "test-user-2";

      // Send notification
      const notificationId = notificationSystem.sendNotification(tenantId, userId, {
        type: "info",
        title: "Test Notification",
        message: "This is a test notification",
        category: "test",
        priority: "normal",
      });

      expect(notificationId).toBeDefined();

      // Get user notifications
      const notifications = notificationSystem.getUserNotifications(userId, tenantId);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].title).toBe("Test Notification");
      expect(notifications[0].read).toBe(false);

      // Mark as read
      const marked = notificationSystem.markAsRead(notificationId, userId);
      expect(marked).toBe(true);

      const updatedNotifications = notificationSystem.getUserNotifications(userId, tenantId);
      expect(updatedNotifications[0].read).toBe(true);
    });

    it("should handle notification preferences", () => {
      const tenantId = "test-tenant-7";
      const userId = "test-user-3";

      const preferences: any = {
        userId,
        tenantId,
        categories: {
          test: {
            enabled: true,
            channels: ["websocket"],
          },
        },
        globalSettings: {
          enableWebSocket: true,
          enableEmail: false,
          maxNotifications: 100,
        },
      };

      notificationSystem.setUserPreferences(userId, tenantId, preferences);
      const retrievedPrefs = notificationSystem.getUserPreferences(userId, tenantId);

      expect(retrievedPrefs.userId).toBe(userId);
      expect(retrievedPrefs.tenantId).toBe(tenantId);
      expect(retrievedPrefs.categories.test.enabled).toBe(true);
    });

    it("should provide notification statistics", () => {
      const tenantId = "test-tenant-8";
      const userId = "test-user-4";

      // Send multiple notifications
      notificationSystem.sendNotification(tenantId, userId, {
        type: "info",
        title: "Info Notification",
        message: "Info message",
        category: "info",
        priority: "normal",
      });

      notificationSystem.sendNotification(tenantId, userId, {
        type: "warning",
        title: "Warning Notification",
        message: "Warning message",
        category: "warning",
        priority: "high",
      });

      const stats = notificationSystem.getStats();
      expect(stats.totalNotifications).toBeGreaterThanOrEqual(2);
      expect(stats.notificationsByType.info).toBeGreaterThanOrEqual(1);
      expect(stats.notificationsByType.warning).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Integration Tests", () => {
    it("should handle end-to-end real-time flow", async () => {
      const tenantId = "test-tenant-9";
      const userId = "test-user-5";

      // Set user presence
      presenceSystem.setOnline(userId, tenantId, {
        device: "web",
        activity: "testing",
      });

      // Send notification
      const notificationId = notificationSystem.sendNotification(tenantId, userId, {
        type: "system",
        title: "System Update",
        message: "Real-time system is working",
        category: "system",
        priority: "high",
      });

      // Publish event
      const eventId = eventSystem.publishUserEvent(tenantId, userId, "user.activity", {
        action: "notification_received",
        notificationId,
      });

      // Verify all systems are working
      const presence = presenceSystem.getUserPresence(userId);
      const notifications = notificationSystem.getUserNotifications(userId, tenantId);
      const events = eventSystem.getEventHistory(tenantId, { limit: 10 });

      expect(presence?.status).toBe("online");
      expect(notifications.some(n => n.id === notificationId)).toBe(true);
      expect(events.some(e => e.id === eventId)).toBe(true);
    });
  });
});
