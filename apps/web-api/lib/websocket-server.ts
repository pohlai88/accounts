// Production WebSocket Server Integration
import {
  WebSocketManager,
  PresenceSystem,
  RealtimeEventSystem,
  NotificationSystem,
  toWsMessage,
} from "@aibos/realtime";
import { createClient } from "@supabase/supabase-js";
import { EventEmitter } from "events";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Global instances
let wsManager: WebSocketManager | null = null;
let presenceSystem: PresenceSystem | null = null;
let eventSystem: RealtimeEventSystem | null = null;
let notificationSystem: NotificationSystem | null = null;

export class ProductionWebSocketServer extends EventEmitter {
  private isRunning = false;

  async start(port: number = 8080) {
    if (this.isRunning) {
      // Log WebSocket server status to monitoring service
      if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console

      }
      return;
    }

    try {
      // Initialize WebSocket Manager
      wsManager = new WebSocketManager({
        port,
        path: "/ws",
        heartbeatInterval: 30000,
        maxConnections: 1000,
        connectionTimeout: 60000,
        enableCompression: true,
        enablePerMessageDeflate: true,
      });

      // Initialize real-time systems
      eventSystem = new RealtimeEventSystem(wsManager);
      presenceSystem = new PresenceSystem(wsManager, eventSystem);
      notificationSystem = new NotificationSystem(wsManager, eventSystem, presenceSystem);

      // Start WebSocket server
      await wsManager.start();

      // Set up business logic integration
      this.setupBusinessLogicIntegration();

      this.isRunning = true;
      // Log WebSocket server startup to monitoring service
      if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console

        // eslint-disable-next-line no-console

      }
    } catch (error) {
      // Log WebSocket server startup error to monitoring service
      if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
      }
      throw error;
    }
  }

  async stop() {
    if (!this.isRunning) {
      return;
    }

    try {
      if (wsManager) {
        await wsManager.stop();
      }
      this.isRunning = false;
      // Log WebSocket server stop to monitoring service
      if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console

      }
    } catch (error) {
      // Log WebSocket server stop error to monitoring service
      if ((process.env.NODE_ENV as string) === 'development') {
        // eslint-disable-next-line no-console
      }
    }
  }

  private setupBusinessLogicIntegration() {
    if (!wsManager || !presenceSystem || !eventSystem || !notificationSystem) {
      return;
    }

    // Set up business event handlers
    this.setupAccountingEvents();
    this.setupUserEvents();
    this.setupTenantEvents();
    this.setupNotificationEvents();

    // Log business logic integration to monitoring service
    if ((process.env.NODE_ENV as string) === 'development') {
      // eslint-disable-next-line no-console

    }
  }

  private setupAccountingEvents() {
    if (!eventSystem) { return; }

    // Journal entry events
    eventSystem.subscribe("system", ["journal.created"], data => {

      const eventData = data.data as { tenantId: string; userId: string;[key: string]: unknown };
      this.broadcastToTenant(eventData.tenantId, {
        type: "journal.created",
        data: eventData,
        timestamp: Date.now(),
      });
    });

    // Invoice events
    eventSystem.subscribe("system", ["invoice.updated"], data => {

      const eventData = data.data as { tenantId: string; userId: string;[key: string]: unknown };
      this.broadcastToTenant(eventData.tenantId, {
        type: "invoice.updated",
        data: eventData,
        timestamp: Date.now(),
      });
    });

    // Rule events
    eventSystem.subscribe("system", ["rule.created"], data => {

      const eventData = data.data as { tenantId: string; userId: string;[key: string]: unknown };
      this.broadcastToTenant(eventData.tenantId, {
        type: "rule.created",
        data: eventData,
        timestamp: Date.now(),
      });
    });
  }

  private setupUserEvents() {
    if (!presenceSystem) { return; }

    // User presence events
    presenceSystem.on("presence.changed", update => {

      this.broadcastToTenant(update.tenantId, {
        type: "presence.changed",
        data: update,
        timestamp: Date.now(),
      });
    });
  }

  private setupTenantEvents() {
    if (!eventSystem) { return; }

    // Tenant switching events
    eventSystem.subscribe("system", ["tenant.switched"], data => {

      const eventData = data.data as { tenantId: string; userId: string;[key: string]: unknown };
      this.broadcastToUser(eventData.userId, {
        type: "tenant.switched",
        data: eventData,
        timestamp: Date.now(),
      });
    });

    // Member invitation events
    eventSystem.subscribe("system", ["member.invited"], data => {

      const eventData = data.data as { tenantId: string; userId: string;[key: string]: unknown };
      this.broadcastToTenant(eventData.tenantId, {
        type: "member.invited",
        data: eventData,
        timestamp: Date.now(),
      });
    });
  }

  private setupNotificationEvents() {
    if (!notificationSystem) { return; }

    // System notifications
    notificationSystem.on("notification.created", notification => {

      this.broadcastToUser(notification.userId, {
        type: "notification.created",
        data: notification,
        timestamp: Date.now(),
      });
    });
  }

  private broadcastToTenant(tenantId: string, message: unknown) {
    if (!wsManager) { return; }

    const connections = wsManager.getTenantConnections(tenantId);
    connections.forEach(connection => {
      try {
        const wsMessage = toWsMessage(message);
        if (wsMessage.ok) {
          // Convert from wsMessage format to websocket-manager format
          const convertedMessage = {
            type: wsMessage.value.type,
            data: wsMessage.value.payload,
            tenantId: wsMessage.value.tenantId,
            userId: wsMessage.value.userId,
            timestamp: wsMessage.value.ts.getTime(),
            requestId: wsMessage.value.id,
          };
          wsManager?.sendMessage(connection.id, convertedMessage);
        } else {
        }
      } catch (error) {
        console.error("Error broadcasting to tenant:", error);
      }
    });
  }

  private broadcastToUser(userId: string, message: unknown) {
    if (!wsManager) { return; }

    const connections = WebSocketManager.getConnectionsByUser(userId);
    connections.forEach(connection => {
      try {
        const wsMessage = toWsMessage(message);
        if (wsMessage.ok) {
          // Convert from wsMessage format to websocket-manager format
          const convertedMessage = {
            type: wsMessage.value.type,
            data: wsMessage.value.payload,
            tenantId: wsMessage.value.tenantId,
            userId: wsMessage.value.userId,
            timestamp: wsMessage.value.ts.getTime(),
            requestId: wsMessage.value.id,
          };
          wsManager?.sendMessage(connection.id, convertedMessage);
        } else {
        }
      } catch (error) {
        console.error("Error broadcasting to user:", error);
      }
    });
  }

  // Public API for triggering events from business logic
  public triggerJournalCreated(tenantId: string, journalData: unknown) {
    if (eventSystem) {
      eventSystem.publishEvent({
        type: "journal.created",
        tenantId,
        data: journalData,
        priority: "normal",
      });
    }
  }

  public triggerInvoiceUpdated(tenantId: string, invoiceData: unknown) {
    if (eventSystem) {
      eventSystem.publishEvent({
        type: "invoice.updated",
        tenantId,
        data: invoiceData,
        priority: "normal",
      });
    }
  }

  public triggerRuleCreated(tenantId: string, ruleData: unknown) {
    if (eventSystem) {
      eventSystem.publishEvent({
        type: "rule.created",
        tenantId,
        data: ruleData,
        priority: "normal",
      });
    }
  }

  public triggerTenantSwitched(userId: string, tenantData: unknown) {
    if (eventSystem) {
      eventSystem.publishEvent({
        type: "tenant.switched",
        tenantId: "", // This event doesn't have a tenantId, use empty string
        userId,
        data: tenantData,
        priority: "normal",
      });
    }
  }

  public createNotification(tenantId: string, userId: string, notification: unknown) {
    if (notificationSystem) {
      notificationSystem.sendNotification(
        tenantId,
        userId,
        {
          title: "Notification",
          message: "A notification was created",
          category: "system",
          type: "info",
          ...(typeof notification === "object" && notification !== null ? notification : {}),
        } as {
          type: "system" | "info" | "success" | "warning" | "error";
          priority: "normal" | "low" | "high" | "urgent";
          title: string;
          message: string;
          category: string;
          [key: string]: unknown;
        }
      );
    }
  }

  // Health check
  public getStatus() {
    return {
      isRunning: this.isRunning,
      connections: wsManager?.getStats() || null,
      presence: PresenceSystem.getStats() || null,
      events: eventSystem?.getStats() || null,
      notifications: notificationSystem?.getStats() || null,
    };
  }
}

// Export singleton instance
export const webSocketServer = new ProductionWebSocketServer();
