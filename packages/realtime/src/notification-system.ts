import { EventEmitter } from 'events';
import { WebSocketManager } from './websocket-manager';
import { RealtimeEventSystem } from './event-system';
import { PresenceSystem } from './presence-system';

export interface Notification {
    id: string;
    tenantId: string;
    userId: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'system';
    title: string;
    message: string;
    data?: unknown;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    category: string;
    read: boolean;
    createdAt: Date;
    expiresAt?: Date;
    actions?: NotificationAction[];
    metadata?: {
        source?: string;
        channel?: string;
        tags?: string[];
        custom?: Record<string, unknown>;
    };
}

export interface NotificationAction {
    id: string;
    label: string;
    type: 'button' | 'link' | 'dismiss';
    action: string;
    style?: 'primary' | 'secondary' | 'danger' | 'success';
    data?: unknown;
}

export interface NotificationPreferences {
    userId: string;
    tenantId: string;
    categories: Record<string, {
        enabled: boolean;
        channels: ('push' | 'email' | 'sms' | 'websocket')[];
        quietHours?: {
            start: string; // HH:MM format
            end: string;   // HH:MM format
            timezone: string;
        };
    }>;
    globalSettings: {
        enablePush: boolean;
        enableEmail: boolean;
        enableSMS: boolean;
        enableWebSocket: boolean;
        maxNotifications: number;
        autoMarkRead: boolean;
        autoMarkReadDelay: number; // seconds
    };
}

export interface NotificationStats {
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<string, number>;
    notificationsByCategory: Record<string, number>;
    notificationsByTenant: Record<string, number>;
    averageReadTime: number; // milliseconds
}

export class NotificationSystem extends EventEmitter {
    private wsManager: WebSocketManager;
    private eventSystem: RealtimeEventSystem;
    private presenceSystem: PresenceSystem;
    private notifications = new Map<string, Notification>();
    private userNotifications = new Map<string, Set<string>>(); // userId -> Set<notificationId>
    private tenantNotifications = new Map<string, Set<string>>(); // tenantId -> Set<notificationId>
    private preferences = new Map<string, NotificationPreferences>(); // userId -> preferences
    private readTimers = new Map<string, NodeJS.Timeout>(); // notificationId -> timer
    private config: {
        maxNotificationsPerUser: number;
        autoMarkReadDelay: number; // seconds
        notificationTTL: number; // seconds
        enablePersistence: boolean;
        enableCompression: boolean;
    };

    constructor(
        wsManager: WebSocketManager,
        eventSystem: RealtimeEventSystem,
        presenceSystem: PresenceSystem,
        config: Partial<NotificationSystem['config']> = {}
    ) {
        super();

        this.wsManager = wsManager;
        this.eventSystem = eventSystem;
        this.presenceSystem = presenceSystem;
        this.config = {
            maxNotificationsPerUser: 100,
            autoMarkReadDelay: 30, // 30 seconds
            notificationTTL: 86400, // 24 hours
            enablePersistence: false,
            enableCompression: true,
            ...config
        };

        this.setupEventHandlers();
        this.startCleanupProcess();
    }

    /**
     * Send notification to user
     */
    sendNotification(
        tenantId: string,
        userId: string,
        notification: Omit<Notification, 'id' | 'tenantId' | 'userId' | 'read' | 'createdAt'>
    ): string {
        const notificationId = this.generateNotificationId();
        const now = new Date();

        const fullNotification: Notification = {
            ...notification,
            id: notificationId,
            tenantId,
            userId,
            read: false,
            createdAt: now
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
        this.eventSystem.publishUserEvent(tenantId, userId, 'notification.created', {
            notification: fullNotification
        }, {
            channel: `notifications:${userId}`,
            priority: 'normal'
        });

        this.emit('notification', fullNotification);
        return notificationId;
    }

    /**
     * Send notification to multiple users
     */
    sendBulkNotification(
        tenantId: string,
        userIds: string[],
        notification: Omit<Notification, 'id' | 'tenantId' | 'userId' | 'read' | 'createdAt'>
    ): string[] {
        const notificationIds: string[] = [];

        for (const userId of userIds) {
            const id = this.sendNotification(tenantId, userId, notification);
            notificationIds.push(id);
        }

        return notificationIds;
    }

    /**
     * Send notification to tenant (all users)
     */
    sendTenantNotification(
        tenantId: string,
        notification: Omit<Notification, 'id' | 'tenantId' | 'userId' | 'read' | 'createdAt'>
    ): string[] {
        const tenantUsers = this.presenceSystem.getTenantPresence(tenantId);
        const userIds = tenantUsers.map(presence => presence.userId);

        return this.sendBulkNotification(tenantId, userIds, notification);
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string, userId: string): boolean {
        const notification = this.notifications.get(notificationId);
        if (!notification || notification.userId !== userId || notification.read) {
            return false;
        }

        notification.read = true;
        this.clearAutoReadTimer(notificationId);

        // Publish event
        this.eventSystem.publishUserEvent(notification.tenantId, userId, 'notification.read', {
            notificationId,
            notification
        }, {
            channel: `notifications:${userId}`,
            priority: 'low'
        });

        this.emit('notificationRead', { notificationId, userId });
        return true;
    }

    /**
     * Mark all notifications as read for user
     */
    markAllAsRead(userId: string, tenantId: string): number {
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
    deleteNotification(notificationId: string, userId: string): boolean {
        const notification = this.notifications.get(notificationId);
        if (!notification || notification.userId !== userId) {
            return false;
        }

        this.notifications.delete(notificationId);
        this.removeFromUserNotifications(userId, notificationId);
        this.removeFromTenantNotifications(notification.tenantId, notificationId);
        this.clearAutoReadTimer(notificationId);

        // Publish event
        this.eventSystem.publishUserEvent(notification.tenantId, userId, 'notification.deleted', {
            notificationId
        }, {
            channel: `notifications:${userId}`,
            priority: 'low'
        });

        this.emit('notificationDeleted', { notificationId, userId });
        return true;
    }

    /**
     * Get user notifications
     */
    getUserNotifications(
        userId: string,
        tenantId: string,
        options: {
            limit?: number;
            offset?: number;
            unreadOnly?: boolean;
            category?: string;
            type?: Notification['type'];
        } = {}
    ): Notification[] {
        const userNotificationIds = this.userNotifications.get(userId);
        if (!userNotificationIds) return [];

        const { limit = 50, offset = 0, unreadOnly = false, category, type } = options;

        let notifications = Array.from(userNotificationIds)
            .map(id => this.notifications.get(id))
            .filter((notification): notification is Notification =>
                notification !== undefined && notification.tenantId === tenantId
            );

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
    getNotificationCount(userId: string, tenantId: string, unreadOnly: boolean = true): number {
        const notifications = this.getUserNotifications(userId, tenantId, { unreadOnly });
        return notifications.length;
    }

    /**
     * Set user notification preferences
     */
    setUserPreferences(userId: string, tenantId: string, preferences: NotificationPreferences): void {
        this.preferences.set(userId, preferences);

        this.eventSystem.publishUserEvent(tenantId, userId, 'notification.preferences.updated', {
            preferences
        }, {
            channel: `notifications:${userId}`,
            priority: 'low'
        });

        this.emit('preferencesUpdated', { userId, tenantId, preferences });
    }

    /**
     * Get user notification preferences
     */
    getUserPreferences(userId: string, tenantId: string): NotificationPreferences {
        return this.preferences.get(userId) || {
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
                autoMarkReadDelay: this.config.autoMarkReadDelay
            }
        };
    }

    /**
     * Get notification statistics
     */
    getStats(): NotificationStats {
        const stats: NotificationStats = {
            totalNotifications: this.notifications.size,
            unreadNotifications: 0,
            notificationsByType: {},
            notificationsByCategory: {},
            notificationsByTenant: {},
            averageReadTime: 0
        };

        let totalReadTime = 0;
        let readCount = 0;

        for (const notification of this.notifications.values()) {
            if (!notification.read) {
                stats.unreadNotifications++;
            }

            stats.notificationsByType[notification.type] = (stats.notificationsByType[notification.type] || 0) + 1;
            stats.notificationsByCategory[notification.category] = (stats.notificationsByCategory[notification.category] || 0) + 1;
            stats.notificationsByTenant[notification.tenantId] = (stats.notificationsByTenant[notification.tenantId] || 0) + 1;

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
    private setupEventHandlers(): void {
        this.wsManager.on('message', ({ connectionId, message }) => {
            if (message.type === 'notification.action') {
                this.handleNotificationAction(connectionId, message);
            }
        });
    }

    /**
     * Handle notification action from client
     */
    private handleNotificationAction(connectionId: string, message: { data: unknown }): void {
        const connection = this.wsManager.getConnection(connectionId);
        if (!connection) return;

        const { notificationId, actionId, data } = message.data as { notificationId: string; actionId: string; data: Record<string, unknown> };
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
    private executeNotificationAction(
        notification: Notification,
        action: NotificationAction,
        data: unknown,
        userId: string
    ): void {
        switch (action.type) {
            case 'dismiss':
                this.deleteNotification(notification.id, userId);
                break;
            case 'button':
            case 'link':
                // Emit action event for handling by application
                this.emit('notificationAction', {
                    notification,
                    action,
                    data,
                    userId
                });
                break;
        }
    }

    /**
     * Send notification via WebSocket
     */
    private sendWebSocketNotification(notification: Notification): void {
        this.wsManager.broadcastToTenant(notification.tenantId, {
            type: 'notification',
            data: notification
        });
    }

    /**
     * Check if notification should be sent based on preferences
     */
    private shouldSendNotification(
        notification: Notification,
        preferences: NotificationPreferences
    ): boolean {
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
    private setAutoReadTimer(notificationId: string): void {
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
    private clearAutoReadTimer(notificationId: string): void {
        const timer = this.readTimers.get(notificationId);
        if (timer) {
            clearTimeout(timer);
            this.readTimers.delete(notificationId);
        }
    }

    /**
     * Add notification to user index
     */
    private addToUserNotifications(userId: string, notificationId: string): void {
        if (!this.userNotifications.has(userId)) {
            this.userNotifications.set(userId, new Set());
        }
        this.userNotifications.get(userId)!.add(notificationId);
    }

    /**
     * Remove notification from user index
     */
    private removeFromUserNotifications(userId: string, notificationId: string): void {
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
    private addToTenantNotifications(tenantId: string, notificationId: string): void {
        if (!this.tenantNotifications.has(tenantId)) {
            this.tenantNotifications.set(tenantId, new Set());
        }
        this.tenantNotifications.get(tenantId)!.add(notificationId);
    }

    /**
     * Remove notification from tenant index
     */
    private removeFromTenantNotifications(tenantId: string, notificationId: string): void {
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
    private startCleanupProcess(): void {
        setInterval(() => {
            const now = Date.now();
            const ttl = this.config.notificationTTL * 1000;

            for (const [notificationId, notification] of this.notifications) {
                const isExpired = notification.expiresAt && notification.expiresAt.getTime() < now;
                const isOld = (now - notification.createdAt.getTime()) > ttl;

                if (isExpired || isOld) {
                    this.deleteNotification(notificationId, notification.userId);
                }
            }
        }, 60000); // Clean up every minute
    }

    /**
     * Generate unique notification ID
     */
    private generateNotificationId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
