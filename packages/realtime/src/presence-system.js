"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceSystem = void 0;
const events_1 = require("events");
class PresenceSystem extends events_1.EventEmitter {
    constructor(wsManager, eventSystem, config = {}) {
        super();
        this.presence = new Map(); // userId -> PresenceInfo
        this.tenantPresence = new Map(); // tenantId -> Set<userId>
        this.sessionStartTimes = new Map(); // userId -> session start time
        this.awayTimers = new Map(); // userId -> away timer
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
    updatePresence(userId, tenantId, status, metadata) {
        const now = new Date();
        const previousPresence = this.presence.get(userId);
        const presenceInfo = {
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
    setOnline(userId, tenantId, metadata) {
        this.updatePresence(userId, tenantId, 'online', metadata);
    }
    /**
     * Set user away
     */
    setAway(userId, tenantId, metadata) {
        this.updatePresence(userId, tenantId, 'away', metadata);
    }
    /**
     * Set user busy
     */
    setBusy(userId, tenantId, metadata) {
        this.updatePresence(userId, tenantId, 'busy', metadata);
    }
    /**
     * Set user offline
     */
    setOffline(userId, tenantId) {
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
    getUserPresence(userId) {
        return this.presence.get(userId);
    }
    /**
     * Get tenant presence
     */
    getTenantPresence(tenantId) {
        const userIds = this.tenantPresence.get(tenantId);
        if (!userIds)
            return [];
        return Array.from(userIds)
            .map(userId => this.presence.get(userId))
            .filter((presence) => presence !== undefined);
    }
    /**
     * Get online users for tenant
     */
    getOnlineUsers(tenantId) {
        return this.getTenantPresence(tenantId)
            .filter(presence => presence.status === 'online');
    }
    /**
     * Get presence statistics
     */
    getPresenceStats() {
        const stats = {
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
    getPresenceHistory(userId, limit = 50) {
        return this.eventSystem.getEventHistory('', {
            limit,
            types: ['presence.update'],
            channels: [`presence:${userId}`]
        }).map(event => ({
            userId: event.data.userId,
            tenantId: event.data.tenantId || '',
            status: event.data.status,
            metadata: event.data.metadata,
            timestamp: event.timestamp
        }));
    }
    /**
     * Subscribe to presence updates
     */
    subscribeToPresence(tenantId, callback, options = {}) {
        const filters = [
            { field: 'data.tenantId', operator: 'equals', value: tenantId }
        ];
        if (options.userId) {
            filters.push({ field: 'data.userId', operator: 'equals', value: options.userId });
        }
        if (options.statuses && options.statuses.length > 0) {
            filters.push({ field: 'data.status', operator: 'in', value: options.statuses });
        }
        return this.eventSystem.subscribe(tenantId, [`presence:${tenantId}`], (event) => {
            callback({
                userId: event.data.userId,
                tenantId: event.data.tenantId || tenantId,
                status: event.data.status,
                metadata: event.data.metadata,
                timestamp: event.timestamp
            });
        }, { filters });
    }
    /**
     * Setup WebSocket event handlers
     */
    setupWebSocketHandlers() {
        this.wsManager.on('connection', (connection) => {
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
    handleConnection(connection) {
        this.setOnline(connection.userId, connection.tenantId, {
            device: 'web',
            activity: 'connected'
        });
    }
    /**
     * Handle connection disconnect
     */
    handleDisconnection(connectionId) {
        const connection = this.wsManager.getConnection(connectionId);
        if (connection) {
            this.setOffline(connection.userId, connection.tenantId);
        }
    }
    /**
     * Handle presence message from client
     */
    handlePresenceMessage(connectionId, message) {
        const connection = this.wsManager.getConnection(connectionId);
        if (!connection)
            return;
        const { status, metadata } = message.data;
        this.updatePresence(connection.userId, connection.tenantId, status, metadata);
    }
    /**
     * Add user to tenant presence
     */
    addToTenantPresence(tenantId, userId) {
        if (!this.tenantPresence.has(tenantId)) {
            this.tenantPresence.set(tenantId, new Set());
        }
        this.tenantPresence.get(tenantId).add(userId);
    }
    /**
     * Remove user from tenant presence
     */
    removeFromTenantPresence(tenantId, userId) {
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
    setAwayTimer(userId) {
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
    clearAwayTimer(userId) {
        const timer = this.awayTimers.get(userId);
        if (timer) {
            clearTimeout(timer);
            this.awayTimers.delete(userId);
        }
    }
    /**
     * Start heartbeat to update last seen
     */
    startHeartbeat() {
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
    cleanup() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
        for (const [userId, presence] of this.presence) {
            if (presence.status === 'offline' && presence.lastSeen.getTime() < cutoff) {
                this.presence.delete(userId);
                this.removeFromTenantPresence(presence.tenantId, userId);
            }
        }
    }
}
exports.PresenceSystem = PresenceSystem;
//# sourceMappingURL=presence-system.js.map