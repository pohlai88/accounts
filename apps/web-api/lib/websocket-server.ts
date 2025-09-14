// Production WebSocket Server Integration
import { WebSocketManager, PresenceSystem, RealtimeEventSystem, NotificationSystem } from '@aibos/realtime';
import { createClient } from '@supabase/supabase-js';
import { EventEmitter } from 'events';

// Initialize Supabase client
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
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
            console.log('WebSocket server already running');
            return;
        }

        try {
            // Initialize WebSocket Manager
            wsManager = new WebSocketManager({
                port,
                path: '/ws',
                heartbeatInterval: 30000,
                maxConnections: 1000,
                connectionTimeout: 60000,
                enableCompression: true,
                enablePerMessageDeflate: true
            });

            // Initialize real-time systems
            presenceSystem = new PresenceSystem(wsManager);
            eventSystem = new RealtimeEventSystem(wsManager);
            notificationSystem = new NotificationSystem(wsManager);

            // Start WebSocket server
            await wsManager.start();

            // Set up business logic integration
            this.setupBusinessLogicIntegration();

            this.isRunning = true;
            console.log(`🚀 Production WebSocket server started on port ${port}`);
            console.log(`📊 Real-time features: Presence, Events, Notifications`);

        } catch (error) {
            console.error('Failed to start WebSocket server:', error);
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
            console.log('WebSocket server stopped');
        } catch (error) {
            console.error('Error stopping WebSocket server:', error);
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

        console.log('✅ Business logic integration configured');
    }

    private setupAccountingEvents() {
        if (!eventSystem) return;

        // Journal entry events
        eventSystem.subscribe('journal.created', (data) => {
            console.log('📝 Journal entry created:', data);
            this.broadcastToTenant(data.tenantId, {
                type: 'journal.created',
                data: data,
                timestamp: Date.now()
            });
        });

        // Invoice events
        eventSystem.subscribe('invoice.updated', (data) => {
            console.log('🧾 Invoice updated:', data);
            this.broadcastToTenant(data.tenantId, {
                type: 'invoice.updated',
                data: data,
                timestamp: Date.now()
            });
        });

        // Rule events
        eventSystem.subscribe('rule.created', (data) => {
            console.log('📋 Rule created:', data);
            this.broadcastToTenant(data.tenantId, {
                type: 'rule.created',
                data: data,
                timestamp: Date.now()
            });
        });
    }

    private setupUserEvents() {
        if (!presenceSystem) return;

        // User presence events
        presenceSystem.on('presence.changed', (update) => {
            console.log('👤 User presence changed:', update);
            this.broadcastToTenant(update.tenantId, {
                type: 'presence.changed',
                data: update,
                timestamp: Date.now()
            });
        });
    }

    private setupTenantEvents() {
        if (!eventSystem) return;

        // Tenant switching events
        eventSystem.subscribe('tenant.switched', (data) => {
            console.log('🏢 Tenant switched:', data);
            this.broadcastToUser(data.userId, {
                type: 'tenant.switched',
                data: data,
                timestamp: Date.now()
            });
        });

        // Member invitation events
        eventSystem.subscribe('member.invited', (data) => {
            console.log('👥 Member invited:', data);
            this.broadcastToTenant(data.tenantId, {
                type: 'member.invited',
                data: data,
                timestamp: Date.now()
            });
        });
    }

    private setupNotificationEvents() {
        if (!notificationSystem) return;

        // System notifications
        notificationSystem.on('notification.created', (notification) => {
            console.log('🔔 Notification created:', notification);
            this.broadcastToUser(notification.userId, {
                type: 'notification.created',
                data: notification,
                timestamp: Date.now()
            });
        });
    }

    private broadcastToTenant(tenantId: string, message: unknown) {
        if (!wsManager) return;

        const connections = wsManager.getConnectionsByTenant(tenantId);
        connections.forEach(connection => {
            try {
                wsManager?.sendMessage(connection.id, message);
            } catch (error) {
                console.error('Error broadcasting to tenant:', error);
            }
        });
    }

    private broadcastToUser(userId: string, message: unknown) {
        if (!wsManager) return;

        const connections = wsManager.getConnectionsByUser(userId);
        connections.forEach(connection => {
            try {
                wsManager?.sendMessage(connection.id, message);
            } catch (error) {
                console.error('Error broadcasting to user:', error);
            }
        });
    }

    // Public API for triggering events from business logic
    public triggerJournalCreated(tenantId: string, journalData: unknown) {
        if (eventSystem) {
            eventSystem.publish('journal.created', {
                ...journalData,
                tenantId,
                timestamp: Date.now()
            });
        }
    }

    public triggerInvoiceUpdated(tenantId: string, invoiceData: unknown) {
        if (eventSystem) {
            eventSystem.publish('invoice.updated', {
                ...invoiceData,
                tenantId,
                timestamp: Date.now()
            });
        }
    }

    public triggerRuleCreated(tenantId: string, ruleData: unknown) {
        if (eventSystem) {
            eventSystem.publish('rule.created', {
                ...ruleData,
                tenantId,
                timestamp: Date.now()
            });
        }
    }

    public triggerTenantSwitched(userId: string, tenantData: unknown) {
        if (eventSystem) {
            eventSystem.publish('tenant.switched', {
                ...tenantData,
                userId,
                timestamp: Date.now()
            });
        }
    }

    public createNotification(userId: string, notification: unknown) {
        if (notificationSystem) {
            notificationSystem.createNotification({
                ...notification,
                userId,
                timestamp: Date.now()
            });
        }
    }

    // Health check
    public getStatus() {
        return {
            isRunning: this.isRunning,
            connections: wsManager?.getStats() || null,
            presence: presenceSystem?.getStats() || null,
            events: eventSystem?.getStats() || null,
            notifications: notificationSystem?.getStats() || null
        };
    }
}

// Export singleton instance
export const webSocketServer = new ProductionWebSocketServer();
