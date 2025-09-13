/**
 * Bulk Operations System
 * Handle bulk actions on multiple items
 */

export interface BulkOperation<T = any> {
    id: string
    name: string
    description: string
    icon: string
    action: (items: T[]) => Promise<BulkOperationResult>
    requiresConfirmation?: boolean
    confirmationMessage?: string
    isDestructive?: boolean
}

export interface BulkOperationResult {
    success: boolean
    processed: number
    failed: number
    errors?: string[]
    message?: string
}

export interface BulkSelection<T = any> {
    selectedItems: T[]
    allItems: T[]
    isAllSelected: boolean
    isIndeterminate: boolean
}

export class BulkOperationsManager<T = any> {
    private operations: Map<string, BulkOperation<T>> = new Map()
    private selection: BulkSelection<T> = {
        selectedItems: [],
        allItems: [],
        isAllSelected: false,
        isIndeterminate: false
    }

    /**
     * Register a bulk operation
     */
    registerOperation(operation: BulkOperation<T>): void {
        this.operations.set(operation.id, operation)
    }

    /**
     * Get all registered operations
     */
    getOperations(): BulkOperation<T>[] {
        return Array.from(this.operations.values())
    }

    /**
     * Get operations by category
     */
    getOperationsByCategory(category: string): BulkOperation<T>[] {
        return this.getOperations().filter(op => op.id.startsWith(category))
    }

    /**
     * Execute a bulk operation
     */
    async executeOperation(operationId: string, items: T[]): Promise<BulkOperationResult> {
        const operation = this.operations.get(operationId)
        if (!operation) {
            return {
                success: false,
                processed: 0,
                failed: 0,
                errors: ['Operation not found']
            }
        }

        try {
            const result = await operation.action(items)
            return result
        } catch (error) {
            return {
                success: false,
                processed: 0,
                failed: items.length,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            }
        }
    }

    /**
     * Update selection
     */
    updateSelection(selectedItems: T[], allItems: T[]): void {
        this.selection = {
            selectedItems,
            allItems,
            isAllSelected: selectedItems.length === allItems.length && allItems.length > 0,
            isIndeterminate: selectedItems.length > 0 && selectedItems.length < allItems.length
        }
    }

    /**
     * Get current selection
     */
    getSelection(): BulkSelection<T> {
        return this.selection
    }

    /**
     * Select all items
     */
    selectAll(): void {
        this.updateSelection([...this.selection.allItems], this.selection.allItems)
    }

    /**
     * Deselect all items
     */
    deselectAll(): void {
        this.updateSelection([], this.selection.allItems)
    }

    /**
     * Toggle item selection
     */
    toggleItem(item: T): void {
        const isSelected = this.selection.selectedItems.includes(item)
        let newSelection: T[]

        if (isSelected) {
            newSelection = this.selection.selectedItems.filter(i => i !== item)
        } else {
            newSelection = [...this.selection.selectedItems, item]
        }

        this.updateSelection(newSelection, this.selection.allItems)
    }

    /**
     * Check if item is selected
     */
    isItemSelected(item: T): boolean {
        return this.selection.selectedItems.includes(item)
    }

    /**
     * Get selected count
     */
    getSelectedCount(): number {
        return this.selection.selectedItems.length
    }

    /**
     * Get total count
     */
    getTotalCount(): number {
        return this.selection.allItems.length
    }

    /**
     * Check if any items are selected
     */
    hasSelection(): boolean {
        return this.selection.selectedItems.length > 0
    }

    /**
     * Get available operations for current selection
     */
    getAvailableOperations(): BulkOperation<T>[] {
        return this.getOperations().filter(operation => {
            // Filter operations based on selection criteria
            return this.hasSelection()
        })
    }
}

// Common bulk operations for accounting
export const createCommonBulkOperations = <T extends { id: string; is_active?: boolean }>() => {
    const manager = new BulkOperationsManager<T>()

    // Activate/Deactivate operations
    manager.registerOperation({
        id: 'activate',
        name: 'Activate',
        description: 'Activate selected items',
        icon: 'check-circle',
        action: async (items) => {
            // This would typically call an API
            console.log('Activating items:', items.map(item => item.id))
            return {
                success: true,
                processed: items.length,
                failed: 0,
                message: `${items.length} items activated successfully`
            }
        },
        requiresConfirmation: true,
        confirmationMessage: `Are you sure you want to activate ${items.length} items?`
    })

    manager.registerOperation({
        id: 'deactivate',
        name: 'Deactivate',
        description: 'Deactivate selected items',
        icon: 'x-circle',
        action: async (items) => {
            console.log('Deactivating items:', items.map(item => item.id))
            return {
                success: true,
                processed: items.length,
                failed: 0,
                message: `${items.length} items deactivated successfully`
            }
        },
        requiresConfirmation: true,
        confirmationMessage: `Are you sure you want to deactivate ${items.length} items?`,
        isDestructive: true
    })

    // Delete operation
    manager.registerOperation({
        id: 'delete',
        name: 'Delete',
        description: 'Delete selected items',
        icon: 'trash-2',
        action: async (items) => {
            console.log('Deleting items:', items.map(item => item.id))
            return {
                success: true,
                processed: items.length,
                failed: 0,
                message: `${items.length} items deleted successfully`
            }
        },
        requiresConfirmation: true,
        confirmationMessage: `Are you sure you want to delete ${items.length} items? This action cannot be undone.`,
        isDestructive: true
    })

    // Export operation
    manager.registerOperation({
        id: 'export',
        name: 'Export',
        description: 'Export selected items',
        icon: 'download',
        action: async (items) => {
            console.log('Exporting items:', items.map(item => item.id))
            return {
                success: true,
                processed: items.length,
                failed: 0,
                message: `${items.length} items exported successfully`
            }
        }
    })

    // Print operation
    manager.registerOperation({
        id: 'print',
        name: 'Print',
        description: 'Print selected items',
        icon: 'printer',
        action: async (items) => {
            console.log('Printing items:', items.map(item => item.id))
            return {
                success: true,
                processed: items.length,
                failed: 0,
                message: `${items.length} items sent to printer`
            }
        }
    })

    return manager
}

// React hook for bulk operations
export function useBulkOperations<T = any>(items: T[]) {
    const [selection, setSelection] = React.useState<BulkSelection<T>>({
        selectedItems: [],
        allItems: items,
        isAllSelected: false,
        isIndeterminate: false
    })

    const manager = React.useMemo(() => createCommonBulkOperations<T>(), [])

    // Update manager when items change
    React.useEffect(() => {
        manager.updateSelection(selection.selectedItems, items)
    }, [items, selection.selectedItems])

    const selectAll = () => {
        const newSelection = {
            selectedItems: [...items],
            allItems: items,
            isAllSelected: true,
            isIndeterminate: false
        }
        setSelection(newSelection)
        manager.updateSelection(newSelection.selectedItems, newSelection.allItems)
    }

    const deselectAll = () => {
        const newSelection = {
            selectedItems: [],
            allItems: items,
            isAllSelected: false,
            isIndeterminate: false
        }
        setSelection(newSelection)
        manager.updateSelection(newSelection.selectedItems, newSelection.allItems)
    }

    const toggleItem = (item: T) => {
        const isSelected = selection.selectedItems.includes(item)
        let newSelectedItems: T[]

        if (isSelected) {
            newSelectedItems = selection.selectedItems.filter(i => i !== item)
        } else {
            newSelectedItems = [...selection.selectedItems, item]
        }

        const newSelection = {
            selectedItems: newSelectedItems,
            allItems: items,
            isAllSelected: newSelectedItems.length === items.length && items.length > 0,
            isIndeterminate: newSelectedItems.length > 0 && newSelectedItems.length < items.length
        }

        setSelection(newSelection)
        manager.updateSelection(newSelection.selectedItems, newSelection.allItems)
    }

    const executeOperation = async (operationId: string) => {
        return await manager.executeOperation(operationId, selection.selectedItems)
    }

    return {
        selection,
        selectAll,
        deselectAll,
        toggleItem,
        executeOperation,
        operations: manager.getAvailableOperations(),
        hasSelection: selection.selectedItems.length > 0,
        selectedCount: selection.selectedItems.length,
        totalCount: items.length
    }
}
