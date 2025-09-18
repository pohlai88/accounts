// Basic Offline Functionality
// DoD: Basic offline functionality
// SSOT: Use existing state management
// Tech Stack: Service Worker + Zustand

import React, { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OfflineState {
    isOnline: boolean;
    isOffline: boolean;
    lastOnline: Date | null;
    lastOffline: Date | null;
    connectionType: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
    saveData: boolean;
}

export interface OfflineAction {
    id: string;
    type: string;
    payload: any;
    timestamp: Date;
    retryCount: number;
    maxRetries: number;
    priority: "low" | "medium" | "high" | "critical";
    status: "pending" | "retrying" | "failed" | "completed";
}

export interface OfflineConfig {
    enableServiceWorker: boolean;
    enableCache: boolean;
    enableSync: boolean;
    maxRetries: number;
    retryDelay: number;
    cacheMaxAge: number;
    cacheMaxSize: number;
    syncInterval: number;
}

export interface OfflineStore {
    // State
    state: OfflineState;
    actions: OfflineAction[];
    config: OfflineConfig;

    // Actions
    setOnline: (online: boolean) => void;
    updateConnectionInfo: (info: Partial<OfflineState>) => void;
    addAction: (action: Omit<OfflineAction, "id" | "timestamp" | "retryCount" | "status">) => void;
    removeAction: (id: string) => void;
    updateActionStatus: (id: string, status: OfflineAction["status"]) => void;
    retryAction: (id: string) => void;
    clearCompletedActions: () => void;
    syncActions: () => Promise<void>;
    setConfig: (config: Partial<OfflineConfig>) => void;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const defaultConfig: OfflineConfig = {
    enableServiceWorker: true,
    enableCache: true,
    enableSync: true,
    maxRetries: 3,
    retryDelay: 5000,
    cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
    cacheMaxSize: 50 * 1024 * 1024, // 50MB
    syncInterval: 30000, // 30 seconds
};

// ============================================================================
// OFFLINE STORE
// ============================================================================

export const useOfflineStore = create<OfflineStore>()(
    persist(
        (set, get) => ({
            // Initial state
            state: {
                isOnline: navigator.onLine,
                isOffline: !navigator.onLine,
                lastOnline: null,
                lastOffline: null,
                connectionType: "unknown",
                effectiveType: "unknown",
                downlink: 0,
                rtt: 0,
                saveData: false,
            },
            actions: [],
            config: defaultConfig,

            // Set online status
            setOnline: (online: boolean) => {
                set((state) => ({
                    state: {
                        ...state.state,
                        isOnline: online,
                        isOffline: !online,
                        lastOnline: online ? new Date() : state.state.lastOnline,
                        lastOffline: !online ? new Date() : state.state.lastOffline,
                    },
                }));

                // If coming back online, sync actions
                if (online) {
                    get().syncActions();
                }
            },

            // Update connection information
            updateConnectionInfo: (info: Partial<OfflineState>) => {
                set((state) => ({
                    state: {
                        ...state.state,
                        ...info,
                    },
                }));
            },

            // Add action to queue
            addAction: (actionData) => {
                const action: OfflineAction = {
                    ...actionData,
                    id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date(),
                    retryCount: 0,
                    status: "pending",
                };

                set((state) => ({
                    actions: [...state.actions, action],
                }));

                // Try to execute immediately if online
                if (get().state.isOnline) {
                    (get() as any).executeAction?.(action.id);
                }
            },

            // Remove action from queue
            removeAction: (id: string) => {
                set((state) => ({
                    actions: state.actions.filter(action => action.id !== id),
                }));
            },

            // Update action status
            updateActionStatus: (id: string, status: OfflineAction["status"]) => {
                set((state) => ({
                    actions: state.actions.map(action =>
                        action.id === id ? { ...action, status } : action
                    ),
                }));
            },

            // Retry action
            retryAction: (id: string) => {
                const action = get().actions.find(a => a.id === id);
                if (!action) return;

                if (action.retryCount >= action.maxRetries) {
                    get().updateActionStatus(id, "failed");
                    return;
                }

                set((state) => ({
                    actions: state.actions.map(a =>
                        a.id === id
                            ? { ...a, retryCount: a.retryCount + 1, status: "retrying" }
                            : a
                    ),
                }));

                // Execute action after delay
                setTimeout(() => {
                    (get() as any).executeAction?.(id);
                }, get().config.retryDelay);
            },

            // Clear completed actions
            clearCompletedActions: () => {
                set((state) => ({
                    actions: state.actions.filter(action => action.status !== "completed"),
                }));
            },

            // Sync actions when online
            syncActions: async () => {
                const { actions, state } = get();

                if (!state.isOnline) return;

                const pendingActions = actions.filter(action => action.status === "pending");

                for (const action of pendingActions) {
                    try {
                        await (get() as any).executeAction?.(action.id);
                    } catch (error) {
                        console.error(`Failed to sync action ${action.id}:`, error);
                        get().retryAction(action.id);
                    }
                }
            },

            // Set configuration
            setConfig: (config: Partial<OfflineConfig>) => {
                set((state) => ({
                    config: { ...state.config, ...config },
                }));
            },

            // Execute action (internal method)
            executeAction: async (id: string) => {
                const action = get().actions.find(a => a.id === id);
                if (!action) return;

                try {
                    // Update status to retrying
                    get().updateActionStatus(id, "retrying");

                    // Execute based on action type
                    let result;
                    switch (action.type) {
                        case "api_call":
                            result = await executeAPICall(action.payload);
                            break;
                        case "data_sync":
                            result = await executeDataSync(action.payload);
                            break;
                        case "cache_update":
                            result = await executeCacheUpdate(action.payload);
                            break;
                        default:
                            throw new Error(`Unknown action type: ${action.type}`);
                    }

                    // Mark as completed
                    get().updateActionStatus(id, "completed");

                    // Remove from queue after successful execution
                    setTimeout(() => {
                        get().removeAction(id);
                    }, 1000);

                } catch (error) {
                    console.error(`Action execution failed: ${error}`);
                    get().retryAction(id);
                }
            },
        }),
        {
            name: "offline-store",
            partialize: (state) => ({
                state: state.state,
                actions: state.actions,
                config: state.config,
            }),
        }
    )
);

// ============================================================================
// ACTION EXECUTORS
// ============================================================================

async function executeAPICall(payload: any): Promise<any> {
    const { url, method, body, headers } = payload;

    const response = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

async function executeDataSync(payload: any): Promise<any> {
    const { data, endpoint } = payload;

    // Sync data to server
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        throw new Error(`Data sync failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

async function executeCacheUpdate(payload: any): Promise<any> {
    const { key, value, ttl } = payload;

    // Update cache
    if (typeof window !== "undefined" && "caches" in window) {
        const cache = await caches.open("offline-cache");
        const response = new Response(JSON.stringify(value));
        await cache.put(key, response);
    }

    return { success: true };
}

// ============================================================================
// OFFLINE MANAGER
// ============================================================================

export class OfflineManager {
    private store: typeof useOfflineStore;
    private syncInterval: NodeJS.Timeout | null = null;
    private serviceWorker: ServiceWorker | null = null;

    constructor() {
        this.store = useOfflineStore;
        this.initialize();
    }

    private async initialize(): Promise<void> {
        // Set up online/offline listeners
        this.setupNetworkListeners();

        // Set up connection info listeners
        this.setupConnectionListeners();

        // Initialize service worker
        if (this.store.getState().config.enableServiceWorker) {
            await this.initializeServiceWorker();
        }

        // Start sync interval
        this.startSyncInterval();
    }

    private setupNetworkListeners(): void {
        if (typeof window === "undefined") return;

        const handleOnline = () => {
            this.store.getState().setOnline(true);
        };

        const handleOffline = () => {
            this.store.getState().setOnline(false);
        };

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
    }

    private setupConnectionListeners(): void {
        if (typeof window === "undefined") return;

        const updateConnectionInfo = () => {
            const connection = (navigator as any).connection ||
                (navigator as any).mozConnection ||
                (navigator as any).webkitConnection;

            if (connection) {
                this.store.getState().updateConnectionInfo({
                    connectionType: connection.type || "unknown",
                    effectiveType: connection.effectiveType || "unknown",
                    downlink: connection.downlink || 0,
                    rtt: connection.rtt || 0,
                    saveData: connection.saveData || false,
                });
            }
        };

        const connection = (navigator as any).connection ||
            (navigator as any).mozConnection ||
            (navigator as any).webkitConnection;

        if (connection) {
            connection.addEventListener("change", updateConnectionInfo);
            updateConnectionInfo();
        }
    }

    private async initializeServiceWorker(): Promise<void> {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        try {
            const registration = await navigator.serviceWorker.register("/sw.js");
            this.serviceWorker = registration.active || registration.waiting || registration.installing;

            // Service Worker registered successfully
        } catch (error) {
            // Handle Service Worker registration error
        }
    }

    private startSyncInterval(): void {
        const { config } = this.store.getState();

        if (config.enableSync && config.syncInterval > 0) {
            this.syncInterval = setInterval(() => {
                this.store.getState().syncActions();
            }, config.syncInterval);
        }
    }

    private stopSyncInterval(): void {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // Public methods
    async queueAPICall(url: string, method: string, body?: any, headers?: Record<string, string>): Promise<void> {
        this.store.getState().addAction({
            type: "api_call",
            payload: { url, method, body, headers },
            maxRetries: this.store.getState().config.maxRetries,
            priority: "medium",
        });
    }

    async queueDataSync(data: any, endpoint: string): Promise<void> {
        this.store.getState().addAction({
            type: "data_sync",
            payload: { data, endpoint },
            maxRetries: this.store.getState().config.maxRetries,
            priority: "high",
        });
    }

    async queueCacheUpdate(key: string, value: any, ttl?: number): Promise<void> {
        this.store.getState().addAction({
            type: "cache_update",
            payload: { key, value, ttl },
            maxRetries: this.store.getState().config.maxRetries,
            priority: "low",
        });
    }

    getPendingActions(): OfflineAction[] {
        return this.store.getState().actions.filter(action => action.status === "pending");
    }

    getFailedActions(): OfflineAction[] {
        return this.store.getState().actions.filter(action => action.status === "failed");
    }

    retryFailedActions(): void {
        const failedActions = this.getFailedActions();
        failedActions.forEach(action => {
            this.store.getState().retryAction(action.id);
        });
    }

    clearAllActions(): void {
        this.store.getState().actions.forEach(action => {
            this.store.getState().removeAction(action.id);
        });
    }

    updateConfig(config: Partial<OfflineConfig>): void {
        this.store.getState().setConfig(config);

        // Restart sync interval if interval changed
        if (config.syncInterval !== undefined) {
            this.stopSyncInterval();
            this.startSyncInterval();
        }
    }

    destroy(): void {
        this.stopSyncInterval();
    }
}

// ============================================================================
// HOOKS
// ============================================================================

export function useOffline(): OfflineState {
    return useOfflineStore((state) => state.state);
}

export function useOfflineActions(): OfflineAction[] {
    return useOfflineStore((state) => state.actions);
}

export function useOfflineConfig(): OfflineConfig {
    return useOfflineStore((state) => state.config);
}

export function useOfflineManager(): OfflineManager {
    const [manager] = useState(() => new OfflineManager());

    useEffect(() => {
        return () => {
            manager.destroy();
        };
    }, [manager]);

    return manager;
}

// ============================================================================
// OFFLINE INDICATOR COMPONENT
// ============================================================================

interface OfflineIndicatorProps {
    className?: string;
    showWhenOnline?: boolean;
    showWhenOffline?: boolean;
}

export function OfflineIndicator({
    className,
    showWhenOnline = false,
    showWhenOffline = true,
}: OfflineIndicatorProps) {
    const { isOnline, isOffline } = useOffline();
    const actions = useOfflineActions();
    const pendingCount = actions.filter(action => action.status === "pending").length;
    const failedCount = actions.filter(action => action.status === "failed").length;

    if (isOnline && !showWhenOnline) return null;
    if (isOffline && !showWhenOffline) return null;

    return (
        <div className={`fixed top-4 right-4 z-50 ${className || ""}`}>
            {isOffline && (
                <div className="bg-red-500 text-white px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        <span className="text-sm font-medium">Offline</span>
                    </div>
                    {pendingCount > 0 && (
                        <div className="text-xs mt-1">
                            {pendingCount} action{pendingCount !== 1 ? "s" : ""} pending
                        </div>
                    )}
                </div>
            )}

            {isOnline && showWhenOnline && (
                <div className="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-white rounded-full" />
                        <span className="text-sm font-medium">Online</span>
                    </div>
                    {failedCount > 0 && (
                        <div className="text-xs mt-1">
                            {failedCount} action{failedCount !== 1 ? "s" : ""} failed
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const offlineManager = new OfflineManager();

export default OfflineManager;
