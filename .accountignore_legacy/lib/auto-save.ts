/**
 * Auto-save System
 * Automatically save form data to prevent data loss
 */

export interface AutoSaveConfig {
    debounceMs?: number
    storageKey?: string
    maxRetries?: number
    retryDelayMs?: number
    onSave?: (data: any) => Promise<void>
    onLoad?: () => Promise<any>
    onError?: (error: Error) => void
}

export interface AutoSaveState {
    isDirty: boolean
    isSaving: boolean
    lastSaved: Date | null
    hasError: boolean
    errorMessage?: string
    retryCount: number
}

export class AutoSaveManager {
    private config: Required<AutoSaveConfig>
    private state: AutoSaveState
    private debounceTimer: NodeJS.Timeout | null = null
    private retryTimer: NodeJS.Timeout | null = null
    private listeners: Set<(state: AutoSaveState) => void> = new Set()

    constructor(config: AutoSaveConfig = {}) {
        this.config = {
            debounceMs: config.debounceMs || 2000,
            storageKey: config.storageKey || 'auto-save',
            maxRetries: config.maxRetries || 3,
            retryDelayMs: config.retryDelayMs || 1000,
            onSave: config.onSave || (() => Promise.resolve()),
            onLoad: config.onLoad || (() => Promise.resolve(null)),
            onError: config.onError || (() => { })
        }

        this.state = {
            isDirty: false,
            isSaving: false,
            lastSaved: null,
            hasError: false,
            retryCount: 0
        }
    }

    /**
     * Mark data as dirty and trigger auto-save
     */
    markDirty(data: any): void {
        this.state.isDirty = true
        this.notifyListeners()

        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
        }

        // Set new timer
        this.debounceTimer = setTimeout(() => {
            this.save(data)
        }, this.config.debounceMs)
    }

    /**
     * Save data
     */
    async save(data: any): Promise<void> {
        if (!this.state.isDirty) return

        this.state.isSaving = true
        this.state.hasError = false
        this.state.errorMessage = undefined
        this.notifyListeners()

        try {
            // Save to localStorage as backup
            localStorage.setItem(this.config.storageKey, JSON.stringify({
                data,
                timestamp: new Date().toISOString()
            }))

            // Call custom save function
            await this.config.onSave(data)

            this.state.isDirty = false
            this.state.isSaving = false
            this.state.lastSaved = new Date()
            this.state.retryCount = 0
            this.notifyListeners()

        } catch (error) {
            this.handleSaveError(error as Error)
        }
    }

    /**
     * Load saved data
     */
    async load(): Promise<any> {
        try {
            // Try custom load function first
            const customData = await this.config.onLoad()
            if (customData) {
                return customData
            }

            // Fallback to localStorage
            const saved = localStorage.getItem(this.config.storageKey)
            if (saved) {
                const parsed = JSON.parse(saved)
                return parsed.data
            }

            return null
        } catch (error) {
            console.error('Error loading auto-saved data:', error)
            return null
        }
    }

    /**
     * Clear saved data
     */
    clear(): void {
        localStorage.removeItem(this.config.storageKey)
        this.state.isDirty = false
        this.state.isSaving = false
        this.state.hasError = false
        this.state.errorMessage = undefined
        this.state.retryCount = 0
        this.notifyListeners()
    }

    /**
     * Get current state
     */
    getState(): AutoSaveState {
        return { ...this.state }
    }

    /**
     * Subscribe to state changes
     */
    subscribe(listener: (state: AutoSaveState) => void): () => void {
        this.listeners.add(listener)
        return () => this.listeners.delete(listener)
    }

    /**
     * Handle save error
     */
    private handleSaveError(error: Error): void {
        this.state.isSaving = false
        this.state.hasError = true
        this.state.errorMessage = error.message
        this.notifyListeners()

        this.config.onError(error)

        // Retry if within limits
        if (this.state.retryCount < this.config.maxRetries) {
            this.state.retryCount++
            this.retryTimer = setTimeout(() => {
                this.save({}) // Retry with empty data
            }, this.config.retryDelayMs)
        }
    }

    /**
     * Notify listeners of state changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state))
    }

    /**
     * Cleanup
     */
    destroy(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer)
        }
        if (this.retryTimer) {
            clearTimeout(this.retryTimer)
        }
        this.listeners.clear()
    }
}

// React hook for auto-save
export function useAutoSave<T = any>(
    data: T,
    config: AutoSaveConfig = {}
) {
    const [state, setState] = React.useState<AutoSaveState>({
        isDirty: false,
        isSaving: false,
        lastSaved: null,
        hasError: false,
        retryCount: 0
    })

    const manager = React.useRef<AutoSaveManager | null>(null)

    // Initialize manager
    React.useEffect(() => {
        manager.current = new AutoSaveManager({
            ...config,
            onSave: async (data) => {
                if (config.onSave) {
                    await config.onSave(data)
                }
            },
            onLoad: async () => {
                if (config.onLoad) {
                    return await config.onLoad()
                }
                return null
            },
            onError: (error) => {
                if (config.onError) {
                    config.onError(error)
                }
            }
        })

        // Subscribe to state changes
        const unsubscribe = manager.current.subscribe(setState)

        return () => {
            unsubscribe()
            manager.current?.destroy()
        }
    }, [])

    // Auto-save when data changes
    React.useEffect(() => {
        if (manager.current && data) {
            manager.current.markDirty(data)
        }
    }, [data])

    const save = React.useCallback(async () => {
        if (manager.current) {
            await manager.current.save(data)
        }
    }, [data])

    const load = React.useCallback(async () => {
        if (manager.current) {
            return await manager.current.load()
        }
        return null
    }, [])

    const clear = React.useCallback(() => {
        if (manager.current) {
            manager.current.clear()
        }
    }, [])

    return {
        state,
        save,
        load,
        clear
    }
}

// Form-specific auto-save hook
export function useFormAutoSave<T extends Record<string, any>>(
    formData: T,
    formId: string,
    onSave?: (data: T) => Promise<void>
) {
    const storageKey = `form-auto-save-${formId}`

    return useAutoSave(formData, {
        storageKey,
        onSave: async (data) => {
            if (onSave) {
                await onSave(data)
            }
        },
        onLoad: async () => {
            try {
                const saved = localStorage.getItem(storageKey)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    return parsed.data
                }
            } catch (error) {
                console.error('Error loading form data:', error)
            }
            return null
        }
    })
}

// Page-specific auto-save hook
export function usePageAutoSave<T = any>(
    pageData: T,
    pageId: string,
    onSave?: (data: T) => Promise<void>
) {
    const storageKey = `page-auto-save-${pageId}`

    return useAutoSave(pageData, {
        storageKey,
        onSave: async (data) => {
            if (onSave) {
                await onSave(data)
            }
        },
        onLoad: async () => {
            try {
                const saved = localStorage.getItem(storageKey)
                if (saved) {
                    const parsed = JSON.parse(saved)
                    return parsed.data
                }
            } catch (error) {
                console.error('Error loading page data:', error)
            }
            return null
        }
    })
}
