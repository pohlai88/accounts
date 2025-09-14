import { EventEmitter } from 'events';
import { WebSocketManager } from './websocket-manager';
export interface RealtimeEvent {
    id: string;
    type: string;
    tenantId: string;
    userId?: string;
    data: unknown;
    timestamp: number;
    channel?: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;
}
export interface EventSubscription {
    id: string;
    tenantId: string;
    userId?: string;
    channels: string[];
    filters?: EventFilter[];
    callback: (event: RealtimeEvent) => void;
    createdAt: Date;
    isActive: boolean;
}
export interface EventFilter {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'in' | 'notIn';
    value: unknown;
}
export interface EventSystemConfig {
    maxEventHistory: number;
    eventTTL: number;
    enablePersistence: boolean;
    enableCompression: boolean;
    maxSubscriptionsPerConnection: number;
}
export declare class RealtimeEventSystem extends EventEmitter {
    private wsManager;
    private subscriptions;
    private eventHistory;
    private config;
    private eventIdCounter;
    constructor(wsManager: WebSocketManager, config?: Partial<EventSystemConfig>);
    /**
     * Publish event to tenant
     */
    publishEvent(event: Omit<RealtimeEvent, 'id' | 'timestamp'>): string;
    /**
     * Subscribe to events
     */
    subscribe(tenantId: string, channels: string[], callback: (event: RealtimeEvent) => void, options?: {
        userId?: string;
        filters?: EventFilter[];
    }): string;
    /**
     * Unsubscribe from events
     */
    unsubscribe(subscriptionId: string): boolean;
    /**
     * Subscribe to tenant events via WebSocket
     */
    subscribeToTenantEvents(connectionId: string, tenantId: string, channels: string[]): void;
    /**
     * Publish tenant-specific event
     */
    publishTenantEvent(tenantId: string, type: string, data: unknown, options?: {
        userId?: string;
        channel?: string;
        priority?: RealtimeEvent['priority'];
        ttl?: number;
    }): string;
    /**
     * Publish user-specific event
     */
    publishUserEvent(tenantId: string, userId: string, type: string, data: unknown, options?: {
        channel?: string;
        priority?: RealtimeEvent['priority'];
        ttl?: number;
    }): string;
    /**
     * Publish system event (high priority)
     */
    publishSystemEvent(tenantId: string, type: string, data: unknown, options?: {
        channel?: string;
        ttl?: number;
    }): string;
    /**
     * Get event history for tenant
     */
    getEventHistory(tenantId: string, options?: {
        limit?: number;
        since?: number;
        types?: string[];
        channels?: string[];
    }): RealtimeEvent[];
    /**
     * Get active subscriptions for tenant
     */
    getTenantSubscriptions(tenantId: string): EventSubscription[];
    /**
     * Get statistics
     */
    getStats(): {
        totalEvents: number;
        activeSubscriptions: number;
        eventsByTenant: Record<string, number>;
        eventsByType: Record<string, number>;
        averageEventAge: number;
    };
    /**
     * Setup WebSocket event handlers
     */
    private setupWebSocketHandlers;
    /**
     * Handle WebSocket event message
     */
    private handleWebSocketEvent;
    /**
     * Process event for local subscriptions
     */
    private processEventForSubscriptions;
    /**
     * Check if event matches filters
     */
    private matchesFilters;
    /**
     * Get field value from event (supports nested properties)
     */
    private getFieldValue;
    /**
     * Broadcast event to WebSocket connections
     */
    private broadcastEvent;
    /**
     * Add event to history
     */
    private addToHistory;
    /**
     * Handle connection disconnect
     */
    private handleConnectionDisconnect;
    /**
     * Start event cleanup process
     */
    private startEventCleanup;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Generate unique subscription ID
     */
    private generateSubscriptionId;
}
//# sourceMappingURL=event-system.d.ts.map