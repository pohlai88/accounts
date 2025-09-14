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
            start: string;
            end: string;
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
        autoMarkReadDelay: number;
    };
}
export interface NotificationStats {
    totalNotifications: number;
    unreadNotifications: number;
    notificationsByType: Record<string, number>;
    notificationsByCategory: Record<string, number>;
    notificationsByTenant: Record<string, number>;
    averageReadTime: number;
}
export declare class NotificationSystem extends EventEmitter {
    private wsManager;
    private eventSystem;
    private presenceSystem;
    private notifications;
    private userNotifications;
    private tenantNotifications;
    private preferences;
    private readTimers;
    private config;
    constructor(wsManager: WebSocketManager, eventSystem: RealtimeEventSystem, presenceSystem: PresenceSystem, config?: Partial<NotificationSystem['config']>);
    /**
     * Send notification to user
     */
    sendNotification(tenantId: string, userId: string, notification: Omit<Notification, 'id' | 'tenantId' | 'userId' | 'read' | 'createdAt'>): string;
    /**
     * Send notification to multiple users
     */
    sendBulkNotification(tenantId: string, userIds: string[], notification: Omit<Notification, 'id' | 'tenantId' | 'userId' | 'read' | 'createdAt'>): string[];
    /**
     * Send notification to tenant (all users)
     */
    sendTenantNotification(tenantId: string, notification: Omit<Notification, 'id' | 'tenantId' | 'userId' | 'read' | 'createdAt'>): string[];
    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string, userId: string): boolean;
    /**
     * Mark all notifications as read for user
     */
    markAllAsRead(userId: string, tenantId: string): number;
    /**
     * Delete notification
     */
    deleteNotification(notificationId: string, userId: string): boolean;
    /**
     * Get user notifications
     */
    getUserNotifications(userId: string, tenantId: string, options?: {
        limit?: number;
        offset?: number;
        unreadOnly?: boolean;
        category?: string;
        type?: Notification['type'];
    }): Notification[];
    /**
     * Get notification count for user
     */
    getNotificationCount(userId: string, tenantId: string, unreadOnly?: boolean): number;
    /**
     * Set user notification preferences
     */
    setUserPreferences(userId: string, tenantId: string, preferences: NotificationPreferences): void;
    /**
     * Get user notification preferences
     */
    getUserPreferences(userId: string, tenantId: string): NotificationPreferences;
    /**
     * Get notification statistics
     */
    getStats(): NotificationStats;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Handle notification action from client
     */
    private handleNotificationAction;
    /**
     * Execute notification action
     */
    private executeNotificationAction;
    /**
     * Send notification via WebSocket
     */
    private sendWebSocketNotification;
    /**
     * Check if notification should be sent based on preferences
     */
    private shouldSendNotification;
    /**
     * Set auto-mark as read timer
     */
    private setAutoReadTimer;
    /**
     * Clear auto-mark as read timer
     */
    private clearAutoReadTimer;
    /**
     * Add notification to user index
     */
    private addToUserNotifications;
    /**
     * Remove notification from user index
     */
    private removeFromUserNotifications;
    /**
     * Add notification to tenant index
     */
    private addToTenantNotifications;
    /**
     * Remove notification from tenant index
     */
    private removeFromTenantNotifications;
    /**
     * Start cleanup process
     */
    private startCleanupProcess;
    /**
     * Generate unique notification ID
     */
    private generateNotificationId;
}
//# sourceMappingURL=notification-system.d.ts.map