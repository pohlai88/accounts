/**
 * Keyboard Shortcuts System
 * Global keyboard shortcuts for power users
 */

export interface KeyboardShortcut {
    key: string
    description: string
    action: () => void
    category: 'Navigation' | 'Actions' | 'Forms' | 'Reports' | 'System'
    modifier?: 'ctrl' | 'alt' | 'shift' | 'meta'
}

export class KeyboardShortcutsManager {
    private shortcuts: Map<string, KeyboardShortcut> = new Map()
    private isEnabled: boolean = true

    constructor() {
        this.setupGlobalShortcuts()
        this.bindEventListeners()
    }

    /**
     * Register a new keyboard shortcut
     */
    register(shortcut: KeyboardShortcut): void {
        const key = this.normalizeKey(shortcut.key, shortcut.modifier)
        this.shortcuts.set(key, shortcut)
    }

    /**
     * Unregister a keyboard shortcut
     */
    unregister(key: string, modifier?: string): void {
        const normalizedKey = this.normalizeKey(key, modifier)
        this.shortcuts.delete(normalizedKey)
    }

    /**
     * Enable/disable keyboard shortcuts
     */
    setEnabled(enabled: boolean): void {
        this.isEnabled = enabled
    }

    /**
     * Get all registered shortcuts
     */
    getAllShortcuts(): KeyboardShortcut[] {
        return Array.from(this.shortcuts.values())
    }

    /**
     * Get shortcuts by category
     */
    getShortcutsByCategory(category: string): KeyboardShortcut[] {
        return this.getAllShortcuts().filter(shortcut => shortcut.category === category)
    }

    /**
     * Setup default global shortcuts
     */
    private setupGlobalShortcuts(): void {
        // Navigation shortcuts
        this.register({
            key: 'h',
            description: 'Go to Dashboard',
            action: () => window.location.href = '/',
            category: 'Navigation',
            modifier: 'ctrl'
        })

        this.register({
            key: 'a',
            description: 'Go to Chart of Accounts',
            action: () => window.location.href = '/accounts',
            category: 'Navigation',
            modifier: 'ctrl'
        })

        this.register({
            key: 'i',
            description: 'Go to Invoices',
            action: () => window.location.href = '/invoices',
            category: 'Navigation',
            modifier: 'ctrl'
        })

        this.register({
            key: 'r',
            description: 'Go to Reports',
            action: () => window.location.href = '/reports',
            category: 'Navigation',
            modifier: 'ctrl'
        })

        this.register({
            key: 's',
            description: 'Go to Security',
            action: () => window.location.href = '/security',
            category: 'Navigation',
            modifier: 'ctrl'
        })

        this.register({
            key: 'f',
            description: 'Go to Fixed Assets',
            action: () => window.location.href = '/fixed-assets',
            category: 'Navigation',
            modifier: 'ctrl'
        })

        // Action shortcuts
        this.register({
            key: 'n',
            description: 'New Invoice',
            action: () => {
                const newInvoiceBtn = document.querySelector('[href="/invoices"]') as HTMLElement
                if (newInvoiceBtn) newInvoiceBtn.click()
            },
            category: 'Actions',
            modifier: 'ctrl'
        })

        this.register({
            key: 's',
            description: 'Save Current Form',
            action: () => {
                const saveBtn = document.querySelector('button[type="submit"]') as HTMLElement
                if (saveBtn) saveBtn.click()
            },
            category: 'Actions',
            modifier: 'ctrl'
        })

        this.register({
            key: 'e',
            description: 'Export Current View',
            action: () => {
                const exportBtn = document.querySelector('[data-action="export"]') as HTMLElement
                if (exportBtn) exportBtn.click()
            },
            category: 'Actions',
            modifier: 'ctrl'
        })

        // Form shortcuts
        this.register({
            key: 'Enter',
            description: 'Submit Form',
            action: () => {
                const submitBtn = document.querySelector('button[type="submit"]') as HTMLElement
                if (submitBtn) submitBtn.click()
            },
            category: 'Forms'
        })

        this.register({
            key: 'Escape',
            description: 'Cancel/Close Dialog',
            action: () => {
                const cancelBtn = document.querySelector('[data-action="cancel"]') as HTMLElement
                const closeBtn = document.querySelector('[data-action="close"]') as HTMLElement
                if (cancelBtn) cancelBtn.click()
                else if (closeBtn) closeBtn.click()
            },
            category: 'Forms'
        })

        this.register({
            key: 'Tab',
            description: 'Next Field',
            action: () => {
                const activeElement = document.activeElement as HTMLElement
                if (activeElement && activeElement.tagName === 'INPUT') {
                    const inputs = Array.from(document.querySelectorAll('input, select, textarea'))
                    const currentIndex = inputs.indexOf(activeElement)
                    const nextInput = inputs[currentIndex + 1] as HTMLElement
                    if (nextInput) nextInput.focus()
                }
            },
            category: 'Forms'
        })

        // Report shortcuts
        this.register({
            key: 'p',
            description: 'Print Current Report',
            action: () => window.print(),
            category: 'Reports',
            modifier: 'ctrl'
        })

        this.register({
            key: 'f',
            description: 'Focus Search/Filter',
            action: () => {
                const searchInput = document.querySelector('input[type="search"], input[placeholder*="search" i]') as HTMLElement
                if (searchInput) searchInput.focus()
            },
            category: 'Reports',
            modifier: 'ctrl'
        })

        // System shortcuts
        this.register({
            key: '?',
            description: 'Show Keyboard Shortcuts',
            action: () => this.showShortcutsDialog(),
            category: 'System',
            modifier: 'ctrl'
        })

        this.register({
            key: 'r',
            description: 'Refresh Page',
            action: () => window.location.reload(),
            category: 'System',
            modifier: 'ctrl'
        })

        this.register({
            key: 'k',
            description: 'Toggle Keyboard Shortcuts',
            action: () => this.toggleShortcuts(),
            category: 'System',
            modifier: 'ctrl'
        })
    }

    /**
     * Bind event listeners
     */
    private bindEventListeners(): void {
        document.addEventListener('keydown', this.handleKeyDown.bind(this))
    }

    /**
     * Handle keydown events
     */
    private handleKeyDown(event: KeyboardEvent): void {
        if (!this.isEnabled) return

        // Don't trigger shortcuts when typing in inputs
        if (event.target instanceof HTMLInputElement ||
            event.target instanceof HTMLTextAreaElement ||
            event.target instanceof HTMLSelectElement) {
            return
        }

        const key = this.normalizeKey(event.key, this.getModifier(event))
        const shortcut = this.shortcuts.get(key)

        if (shortcut) {
            event.preventDefault()
            shortcut.action()
        }
    }

    /**
     * Normalize key combination
     */
    private normalizeKey(key: string, modifier?: string): string {
        const normalizedKey = key.toLowerCase()
        if (modifier) {
            return `${modifier}+${normalizedKey}`
        }
        return normalizedKey
    }

    /**
     * Get modifier from event
     */
    private getModifier(event: KeyboardEvent): string | undefined {
        if (event.ctrlKey || event.metaKey) return 'ctrl'
        if (event.altKey) return 'alt'
        if (event.shiftKey) return 'shift'
        return undefined
    }

    /**
     * Show shortcuts dialog
     */
    private showShortcutsDialog(): void {
        // This would typically open a modal with all shortcuts
        // For now, we'll log them to console
        console.log('Keyboard Shortcuts:', this.getAllShortcuts())

        // Create a simple dialog
        const dialog = document.createElement('div')
        dialog.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
        dialog.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-2xl max-h-96 overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Keyboard Shortcuts</h2>
        <div class="space-y-2">
          ${this.getAllShortcuts().map(shortcut => `
            <div class="flex justify-between items-center py-2 border-b">
              <span class="font-medium">${shortcut.description}</span>
              <kbd class="px-2 py-1 bg-gray-100 rounded text-sm">
                ${shortcut.modifier ? `${shortcut.modifier}+` : ''}${shortcut.key}
              </kbd>
            </div>
          `).join('')}
        </div>
        <button onclick="this.closest('.fixed').remove()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          Close
        </button>
      </div>
    `
        document.body.appendChild(dialog)
    }

    /**
     * Toggle shortcuts on/off
     */
    private toggleShortcuts(): void {
        this.isEnabled = !this.isEnabled
        console.log(`Keyboard shortcuts ${this.isEnabled ? 'enabled' : 'disabled'}`)
    }

    /**
     * Cleanup
     */
    destroy(): void {
        document.removeEventListener('keydown', this.handleKeyDown.bind(this))
        this.shortcuts.clear()
    }
}

// Global instance
export const keyboardShortcuts = new KeyboardShortcutsManager()

// React hook for using shortcuts in components
export function useKeyboardShortcut(
    key: string,
    action: () => void,
    description: string,
    category: KeyboardShortcut['category'] = 'Actions',
    modifier?: string,
    deps: any[] = []
) {
    React.useEffect(() => {
        const shortcut: KeyboardShortcut = {
            key,
            action,
            description,
            category,
            modifier
        }

        keyboardShortcuts.register(shortcut)

        return () => {
            keyboardShortcuts.unregister(key, modifier)
        }
    }, deps)
}
