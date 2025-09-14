import { EventEmitter } from 'events';
import { WebSocketManager, ConnectionInfo } from './websocket-manager';
import { RealtimeEventSystem, EventFilter } from './event-system';

export interface PresenceInfo {
    userId: string;
    tenantId: string;
    status: 'online' | 'away' | 'busy' | 'offline';
    lastSeen: Date;
    connectionId?: string;
    metadata?: {
        device?: string;
        location?: string;
        activity?: string;
        custom?: Record<string, unknown>;
    };
}

export interface PresenceUpdate {
    userId: string;
    tenantId: string;
    status: PresenceInfo['status'];
    metadata?: PresenceInfo['metadata'];
    timestamp: number;
}

export interface PresenceStats {
    totalUsers: number;
    onlineUsers: number;
    awayUsers: number;
    busyUsers: number;
    offlineUsers: number;
    usersByTenant: Record<string, number>;
    averageSessionDuration: number;
}

export class PresenceSystem extends EventEmitter {
    private wsManager: WebSocketManager;
    private eventSystem: RealtimeEventSystem;
    private presence = new Map<string, PresenceInfo>(); // userId -> PresenceInfo
    private tenantPresence = new Map<string, Set<string>>(); // tenantId -> Set<userId>
    private sessionStartTimes = new Map<string, Date>(); // userId -> session start time
    private awayTimers = new Map<string, NodeJS.Timeout>(); // userId -> away timer
    private config: {
        awayTimeout: number; // milliseconds
        heartbeatInterval: number; // milliseconds
        enableMetadata: boolean;
        enableSessionTracking: boolean;
    };

    constructor(
        wsManager: WebSocketManager,
        eventSystem: RealtimeEventSystem,
        config: Partial<PresenceSystem['config']> = {}
    ) {
        super();

        this.wsManager = wsManager;
        this.eventSystem = eventSystem;
        this.config = {
            awayTimeout: 300000, // 5 minutes
            heartbeatInterval: 60000, // 1 minute
            enableMetadata: true,
            enableSessionTracking: true,
            ...config
        };

        this.setupWebSocketHandlers();
        this.startHeartbeat();
    }

    /**
     * Update user presence
     */
    updatePresence(
        userId: string,
        tenantId: string,
        status: PresenceInfo['status'],
        metadata?: PresenceInfo['metadata']
    ): void {
        const now = new Date();
        const previousPresence = this.presence.get(userId);

        const presenceInfo: PresenceInfo = {
            userId,
            tenantId,
            status,
            lastSeen: now,
            metadata: this.config.enableMetadata ? metadata : undefined
        };

        // Update presence
        this.presence.set(userId, presenceInfo);
        this.addToTenantPresence(tenantId, userId);

        // Track session start
        if (this.config.enableSessionTracking && status === 'online' && !previousPresence) {
            this.sessionStartTimes.set(userId, now);
        }

        // Clear away timer if user becomes active
        if (status === 'online' || status === 'busy') {
            this.clearAwayTimer(userId);
        }

        // Set away timer for online users
        if (status === 'online') {
            this.setAwayTimer(userId);
        }

        // Publish presence update event
        this.eventSystem.publishTenantEvent(tenantId, 'presence.update', {
            userId,
            status,
            metadata,
            timestamp: now.getTime()
        }, {
            channel: `presence:${tenantId}`,
            priority: 'normal'
        });

        this.emit('presenceUpdate', presenceInfo);
    }

    /**
     * Set user online
     */
    setOnline(userId: string, tenantId: string, metadata?: PresenceInfo['metadata']): void {
        this.updatePresence(userId, tenantId, 'online', metadata);
    }

    /**
     * Set user away
     */
    setAway(userId: string, tenantId: string, metadata?: PresenceInfo['metadata']): void {
        this.updatePresence(userId, tenantId, 'away', metadata);
    }

    /**
     * Set user busy
     */
    setBusy(userId: string, tenantId: string, metadata?: PresenceInfo['metadata']): void {
        this.updatePresence(userId, tenantId, 'busy', metadata);
    }

    /**
     * Set user offline
     */
    setOffline(userId: string, tenantId: string): void {
        this.updatePresence(userId, tenantId, 'offline');

        // Clear session tracking
        if (this.config.enableSessionTracking) {
            this.sessionStartTimes.delete(userId);
        }

        // Clear away timer
        this.clearAwayTimer(userId);
    }

    /**
     * Get user presence
     */
    getUserPresence(userId: string): PresenceInfo | undefined {
        return this.presence.get(userId);
    }

    /**
     * Get tenant presence
     */
    getTenantPresence(tenantId: string): PresenceInfo[] {
        const userIds = this.tenantPresence.get(tenantId);
        if (!userIds) return [];

        return Array.from(userIds)
            .map(userId => this.presence.get(userId))
            .filter((presence): presence is PresenceInfo => presence !== undefined);
    }

    /**
     * Get online users for tenant
     */
    getOnlineUsers(tenantId: string): PresenceInfo[] {
        return this.getTenantPresence(tenantId)
            .filter(presence => presence.status === 'online');
    }

    /**
     * Get presence statistics
     */
    getPresenceStats(): PresenceStats {
        const stats: PresenceStats = {
            totalUsers: this.presence.size,
            onlineUsers: 0,
            awayUsers: 0,
            busyUsers: 0,
            offlineUsers: 0,
            usersByTenant: {},
            averageSessionDuration: 0
        };

        let totalSessionDuration = 0;
        let activeSessions = 0;

        for (const presence of this.presence.values()) {
            // Count by status
            switch (presence.status) {
                case 'online':
                    stats.onlineUsers++;
                    break;
                case 'away':
                    stats.awayUsers++;
                    break;
                case 'busy':
                    stats.busyUsers++;
                    break;
                case 'offline':
                    stats.offlineUsers++;
                    break;
            }

            // Count by tenant
            stats.usersByTenant[presence.tenantId] = (stats.usersByTenant[presence.tenantId] || 0) + 1;

            // Calculate session duration
            if (this.config.enableSessionTracking && presence.status !== 'offline') {
                const sessionStart = this.sessionStartTimes.get(presence.userId);
                if (sessionStart) {
                    const duration = Date.now() - sessionStart.getTime();
                    totalSessionDuration += duration;
                    activeSessions++;
                }
            }
        }

        if (activeSessions > 0) {
            stats.averageSessionDuration = totalSessionDuration / activeSessions;
        }

        return stats;
    }

    /**
     * Get presence history for user
     */
    getPresenceHistory(userId: string, limit: number = 50): PresenceUpdate[] {
        return this.eventSystem.getEventHistory('', {
            limit,
            types: ['presence.update'],
            channels: [`presence:${userId}`]
        }).map(event => {
            const eventData = event.data as { userId: string; tenantId?: string; status: 'online' | 'away' | 'busy' | 'offline'; metadata: Record<string, unknown> };
            return {
                userId: eventData.userId,
                tenantId: eventData.tenantId || '',
                status: eventData.status,
                metadata: eventData.metadata,
                timestamp: event.timestamp
            };
        });
    }

    /**
     * Subscribe to presence updates
     */
    subscribeToPresence(
        tenantId: string,
        callback: (update: PresenceUpdate) => void,
        options: {
            userId?: string;
            statuses?: PresenceInfo['status'][];
        } = {}
    ): string {
        const filters: unknown[] = [
            { field: 'data.tenantId', operator: 'equals', value: tenantId }
        ];

        if (options.userId) {
            filters.push({ field: 'data.userId', operator: 'equals', value: options.userId });
        }

        if (options.statuses && options.statuses.length > 0) {
            filters.push({ field: 'data.status', operator: 'in', value: options.statuses });
        }

        return this.eventSystem.subscribe(
            tenantId,
            [`presence:${tenantId}`],
            (event) => {
                const eventData = event.data as { userId: string; tenantId?: string; status: 'online' | 'away' | 'busy' | 'offline'; metadata: Record<string, unknown> };
                callback({
                    userId: eventData.userId,
                    tenantId: eventData.tenantId || tenantId,
                    status: eventData.status,
                    metadata: eventData.metadata,
                    timestamp: event.timestamp
                });
            },
            { filters: filters as EventFilter[] }
        );
    }

    /**
     * Setup WebSocket event handlers
     */
    private setupWebSocketHandlers(): void {
        this.wsManager.on('connection', (connection: ConnectionInfo) => {
            this.handleConnection(connection);
        });

        this.wsManager.on('disconnection', ({ connectionId }) => {
            this.handleDisconnection(connectionId);
        });

        this.wsManager.on('message', ({ connectionId, message }) => {
            if (message.type === 'presence.update') {
                this.handlePresenceMessage(connectionId, message);
            }
        });
    }

    /**
     * Handle new connection
     */
    private handleConnection(connection: ConnectionInfo): void {
        this.setOnline(connection.userId, connection.tenantId, {
            device: 'web',
            activity: 'connected'
        });
    }

    /**
     * Handle connection disconnect
     */
    private handleDisconnection(connectionId: string): void {
        const connection = this.wsManager.getConnection(connectionId);
        if (connection) {
            this.setOffline(connection.userId, connection.tenantId);
        }
    }

    /**
     * Handle presence message from client
     */
    private handlePresenceMessage(connectionId: string, message: { data: unknown }): void {
        const connection = this.wsManager.getConnection(connectionId);
        if (!connection) return;

        const { status, metadata } = message.data as { status: 'online' | 'away' | 'busy' | 'offline'; metadata: Record<string, unknown> };
        this.updatePresence(connection.userId, connection.tenantId, status, metadata);
    }

    /**
     * Add user to tenant presence
     */
    private addToTenantPresence(tenantId: string, userId: string): void {
        if (!this.tenantPresence.has(tenantId)) {
            this.tenantPresence.set(tenantId, new Set());
        }
        this.tenantPresence.get(tenantId)!.add(userId);
    }

    /**
     * Remove user from tenant presence
     */
    private removeFromTenantPresence(tenantId: string, userId: string): void {
        const tenantUsers = this.tenantPresence.get(tenantId);
        if (tenantUsers) {
            tenantUsers.delete(userId);
            if (tenantUsers.size === 0) {
                this.tenantPresence.delete(tenantId);
            }
        }
    }

    /**
     * Set away timer for user
     */
    private setAwayTimer(userId: string): void {
        this.clearAwayTimer(userId);

        const timer = setTimeout(() => {
            const presence = this.presence.get(userId);
            if (presence && presence.status === 'online') {
                this.setAway(userId, presence.tenantId, {
                    ...presence.metadata,
                    activity: 'away'
                });
            }
        }, this.config.awayTimeout);

        this.awayTimers.set(userId, timer);
    }

    /**
     * Clear away timer for user
     */
    private clearAwayTimer(userId: string): void {
        const timer = this.awayTimers.get(userId);
        if (timer) {
            clearTimeout(timer);
            this.awayTimers.delete(userId);
        }
    }

    /**
     * Start heartbeat to update last seen
     */
    private startHeartbeat(): void {
        setInterval(() => {
            const now = new Date();

            for (const [userId, presence] of this.presence) {
                if (presence.status === 'online' || presence.status === 'busy') {
                    presence.lastSeen = now;
                }
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Clean up old presence data
     */
    cleanup(): void {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

        for (const [userId, presence] of this.presence) {
            if (presence.status === 'offline' && presence.lastSeen.getTime() < cutoff) {
                this.presence.delete(userId);
                this.removeFromTenantPresence(presence.tenantId, userId);
            }
        }
    }
}
