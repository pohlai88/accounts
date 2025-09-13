/**
 * Universal Create Component - Steve Jobs Inspired
 * 
 * Cross-context action button that adapts based on current context
 * Provides quick access to create actions relevant to the current section
 */

import React, { useState, useEffect } from 'react';
import {
    Plus,
    FileText,
    Receipt,
    CreditCard,
    User,
    DollarSign,
    ArrowDown,
    Search
} from 'lucide-react';
import { cn } from '@aibos/ui/utils';

export interface UniversalCreateProps {
    className?: string;
    context?: 'sell' | 'buy' | 'cash' | 'close' | 'reports' | 'settings' | 'global';
    onCreate?: (action: CreateAction) => void;
    onSearch?: (query: string) => void;
}

export interface CreateAction {
    id: string;
    label: string;
    description: string;
    icon: React.ComponentType<any>;
    category: string;
    shortcut?: string;
    keywords?: string[];
}

// Context-specific create actions
const createActions: Record<string, CreateAction[]> = {
    sell: [
        {
            id: 'create-invoice',
            label: 'Create Invoice',
            description: 'Create a new invoice for a customer',
            icon: FileText,
            category: 'Sell',
            shortcut: 'Cmd+N',
            keywords: ['invoice', 'customer', 'bill']
        },
        {
            id: 'create-quote',
            label: 'Create Quote',
            description: 'Create a quote for a potential customer',
            icon: FileText,
            category: 'Sell',
            keywords: ['quote', 'estimate', 'proposal']
        },
        {
            id: 'add-customer',
            label: 'Add Customer',
            description: 'Add a new customer',
            icon: User,
            category: 'Sell',
            keywords: ['customer', 'client', 'contact']
        },
        {
            id: 'record-payment',
            label: 'Record Payment',
            description: 'Record a payment received',
            icon: DollarSign,
            category: 'Sell',
            keywords: ['payment', 'received', 'cash']
        }
    ],
    buy: [
        {
            id: 'create-bill',
            label: 'Create Bill',
            description: 'Create a new bill from a vendor',
            icon: Receipt,
            category: 'Buy',
            keywords: ['bill', 'vendor', 'expense']
        },
        {
            id: 'create-purchase-order',
            label: 'Create Purchase Order',
            description: 'Create a purchase order',
            icon: Receipt,
            category: 'Buy',
            keywords: ['purchase', 'order', 'po']
        },
        {
            id: 'add-vendor',
            label: 'Add Vendor',
            description: 'Add a new vendor',
            icon: User,
            category: 'Buy',
            keywords: ['vendor', 'supplier', 'contact']
        },
        {
            id: 'record-expense',
            label: 'Record Expense',
            description: 'Record a business expense',
            icon: DollarSign,
            category: 'Buy',
            keywords: ['expense', 'cost', 'spend']
        }
    ],
    cash: [
        {
            id: 'reconcile-bank',
            label: 'Reconcile Bank',
            description: 'Reconcile bank transactions',
            icon: CreditCard,
            category: 'Cash',
            keywords: ['reconcile', 'bank', 'transactions']
        },
        {
            id: 'record-deposit',
            label: 'Record Deposit',
            description: 'Record a bank deposit',
            icon: CreditCard,
            category: 'Cash',
            keywords: ['deposit', 'bank', 'income']
        },
        {
            id: 'record-transfer',
            label: 'Record Transfer',
            description: 'Record a bank transfer',
            icon: CreditCard,
            category: 'Cash',
            keywords: ['transfer', 'bank', 'move']
        },
        {
            id: 'add-bank-account',
            label: 'Add Bank Account',
            description: 'Add a new bank account',
            icon: CreditCard,
            category: 'Cash',
            keywords: ['bank', 'account', 'add']
        }
    ],
    close: [
        {
            id: 'create-journal-entry',
            label: 'Create Journal Entry',
            description: 'Create an adjusting journal entry',
            icon: FileText,
            category: 'Close',
            keywords: ['journal', 'entry', 'adjusting']
        },
        {
            id: 'lock-period',
            label: 'Lock Period',
            description: 'Lock the current period',
            icon: FileText,
            category: 'Close',
            keywords: ['lock', 'period', 'close']
        },
        {
            id: 'create-accrual',
            label: 'Create Accrual',
            description: 'Create an accrual entry',
            icon: FileText,
            category: 'Close',
            keywords: ['accrual', 'adjustment', 'entry']
        }
    ],
    global: [
        {
            id: 'create-invoice',
            label: 'Create Invoice',
            description: 'Create a new invoice for a customer',
            icon: FileText,
            category: 'Sell',
            shortcut: 'Cmd+N',
            keywords: ['invoice', 'customer', 'bill']
        },
        {
            id: 'create-bill',
            label: 'Create Bill',
            description: 'Create a new bill from a vendor',
            icon: Receipt,
            category: 'Buy',
            keywords: ['bill', 'vendor', 'expense']
        },
        {
            id: 'reconcile-bank',
            label: 'Reconcile Bank',
            description: 'Reconcile bank transactions',
            icon: CreditCard,
            category: 'Cash',
            keywords: ['reconcile', 'bank', 'transactions']
        },
        {
            id: 'add-customer',
            label: 'Add Customer',
            description: 'Add a new customer',
            icon: User,
            category: 'Sell',
            keywords: ['customer', 'client', 'contact']
        },
        {
            id: 'add-vendor',
            label: 'Add Vendor',
            description: 'Add a new vendor',
            icon: User,
            category: 'Buy',
            keywords: ['vendor', 'supplier', 'contact']
        }
    ]
};

export const UniversalCreate: React.FC<UniversalCreateProps> = ({
    className,
    context = 'global',
    onCreate,
    onSearch
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);

    const availableActions = createActions[context] || createActions.global || [];

    // Filter actions based on query
    const filteredActions = availableActions.filter(action => {
        if (!query) return true;

        const searchTerm = query.toLowerCase();
        return (
            action.label.toLowerCase().includes(searchTerm) ||
            action.description.toLowerCase().includes(searchTerm) ||
            action.keywords?.some(keyword => keyword.toLowerCase().includes(searchTerm)) ||
            action.category.toLowerCase().includes(searchTerm)
        );
    });

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+N or Ctrl+N for universal create
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                setIsOpen(true);
            }

            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev < filteredActions.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev =>
                    prev > 0 ? prev - 1 : filteredActions.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredActions[selectedIndex]) {
                    handleAction(filteredActions[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
        }
    };

    const handleAction = (action: CreateAction) => {
        onCreate?.(action);
        setIsOpen(false);
        setQuery('');
    };

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newQuery = e.target.value;
        setQuery(newQuery);
        onSearch?.(newQuery);
    };

    return (
        <>
            {/* Create Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    'btn btn-primary flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2',
                    className
                )}
                aria-label="Create new item. Shortcut: Cmd+N"
            >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>Create</span>
                <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-sys-fill-low text-sys-text-tertiary rounded border border-sys-border-hairline" aria-label="Shortcut: Cmd+N">
                    ⌘N
                </kbd>
            </button>

            {/* Create Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-start justify-center pt-20"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="create-modal-title"
                    aria-describedby="create-modal-description"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setIsOpen(false)}
                        aria-hidden="true"
                    />

                    {/* Modal */}
                    <div className={cn(
                        'relative w-full max-w-lg mx-4 bg-sys-bg-raised rounded-lg border border-sys-border-hairline shadow-lg'
                    )}>
                        {/* Header */}
                        <div className="p-4 border-b border-sys-border-hairline">
                            <h2 id="create-modal-title" className="text-lg font-semibold text-sys-text-primary">
                                Create New
                            </h2>
                            <p id="create-modal-description" className="text-sm text-sys-text-secondary">
                                Choose what you'd like to create
                            </p>
                        </div>

                        {/* Search */}
                        <div className="p-4 border-b border-sys-border-hairline">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                                <input
                                    type="search"
                                    placeholder="Search create actions..."
                                    value={query}
                                    onChange={handleQueryChange}
                                    onKeyDown={handleKeyDown}
                                    className="input pl-10 w-full"
                                    aria-label="Search create actions"
                                />
                            </div>
                        </div>

                        {/* Actions List */}
                        <div className="max-h-96 overflow-y-auto">
                            {filteredActions.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="text-sys-text-tertiary">
                                        <Plus className="h-12 w-12 mx-auto mb-4" aria-hidden="true" />
                                        <p className="text-lg font-medium">No actions found</p>
                                        <p className="text-sm">No create actions match your search.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-2">
                                    {filteredActions.map((action, index) => {
                                        const Icon = action.icon;
                                        const isSelected = index === selectedIndex;

                                        return (
                                            <button
                                                key={action.id}
                                                className={cn(
                                                    'w-full flex items-center space-x-3 px-3 py-3 rounded-md text-left transition-colors focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2',
                                                    isSelected ? 'bg-sys-fill-low' : 'hover:bg-sys-fill-low'
                                                )}
                                                onClick={() => handleAction(action)}
                                                role="option"
                                                aria-selected={isSelected}
                                                tabIndex={-1}
                                            >
                                                <div className="w-10 h-10 rounded-lg bg-brand-primary flex items-center justify-center">
                                                    <Icon className="h-5 w-5 text-white" aria-hidden="true" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-sys-text-primary font-medium">
                                                        {action.label}
                                                    </div>
                                                    <div className="text-sm text-sys-text-secondary">
                                                        {action.description}
                                                    </div>
                                                </div>
                                                {action.shortcut && (
                                                    <kbd className="px-2 py-1 text-xs bg-sys-fill-low text-sys-text-tertiary rounded border border-sys-border-hairline" aria-label={`Shortcut: ${action.shortcut}`}>
                                                        {action.shortcut}
                                                    </kbd>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-sys-border-hairline text-xs text-sys-text-tertiary">
                            <div className="flex items-center justify-between">
                                <span>Press Enter to create</span>
                                <span>Cmd+N to open</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default UniversalCreate;
