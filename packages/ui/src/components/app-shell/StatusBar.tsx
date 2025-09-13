/**
 * StatusBar Component - Steve Jobs Inspired
 * 
 * Minimal, persistent global actions with brand subtly integrated
 * Shows company/period switcher, search, notifications, user profile
 */

import React, { useState, useEffect } from 'react';
import { Search, Bell, User, ChevronDown, Command } from 'lucide-react';
import { cn } from '@aibos/ui/utils';

export interface StatusBarProps {
    className?: string;
    onSearch?: (query: string) => void;
    onCommandPalette?: () => void;
    onCompanySwitch?: () => void;
    onNotifications?: () => void;
    onUserMenu?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
    className,
    onSearch,
    onCommandPalette,
    onCompanySwitch,
    onNotifications,
    onUserMenu
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [unreadNotifications, setUnreadNotifications] = useState(2);
    const [currentCompany] = useState('AI-BOS');
    const [currentPeriod] = useState('January 2024');
    const [currentUser] = useState('John Doe');

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Cmd+K or Ctrl+K for command palette
            if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
                event.preventDefault();
                onCommandPalette?.();
            }

            // Cmd+/ or Ctrl+/ for search focus
            if ((event.metaKey || event.ctrlKey) && event.key === '/') {
                event.preventDefault();
                const searchInput = document.getElementById('global-search');
                searchInput?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onCommandPalette]);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        onSearch?.(query);
    };

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            onSearch?.(searchQuery);
        } else if (e.key === 'Escape') {
            setSearchQuery('');
            onSearch?.('');
        }
    };
    return (
        <header
            className={cn(
                'fixed top-0 left-0 right-0 z-50 h-16 bg-sys-bg-raised border-b border-sys-border-hairline',
                'flex items-center justify-between px-6',
                className
            )}
            role="banner"
            aria-label="Main navigation"
        >
            {/* Left: Company/Period Switcher */}
            <div className="flex items-center space-x-4">
                <button
                    className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2 rounded-md p-1"
                    aria-label={`Switch company or period. Current: ${currentCompany}, ${currentPeriod}`}
                    aria-expanded="false"
                    aria-haspopup="menu"
                    onClick={onCompanySwitch}
                >
                    <div className="h-8 w-8 rounded-md bg-brand-primary flex items-center justify-center" aria-hidden="true">
                        <span className="text-sm font-semibold text-sys-text-primary">{currentCompany.charAt(0)}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-sys-text-primary">{currentCompany}</span>
                        <span className="text-xs text-sys-text-secondary">{currentPeriod}</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                </button>
            </div>

            {/* Center: Search */}
            <div className="flex-1 max-w-md mx-8">
                <div className="relative">
                    <label htmlFor="global-search" className="sr-only">
                        Search invoices, bills, customers, and more
                    </label>
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-sys-text-tertiary" aria-hidden="true" />
                    <input
                        id="global-search"
                        type="search"
                        placeholder="Search invoices, bills, customers..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onKeyDown={handleSearchKeyDown}
                        className="input pl-10 w-full"
                        aria-label="Search invoices, bills, customers, and more"
                        aria-describedby="search-help"
                    />
                    <div id="search-help" className="sr-only">
                        Press Enter to search, Escape to clear, Cmd+K for command palette
                    </div>
                    {/* Command Palette Shortcut Hint */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <kbd className="px-2 py-1 text-xs bg-sys-fill-low text-sys-text-tertiary rounded border border-sys-border-hairline" aria-label="Command palette shortcut">
                            ⌘K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right: Notifications & User */}
            <div className="flex items-center space-x-4">
                <button
                    className="relative p-2 text-sys-text-tertiary hover:text-sys-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2 rounded-md"
                    aria-label={`View notifications (${unreadNotifications} unread)`}
                    aria-expanded="false"
                    aria-haspopup="menu"
                    onClick={onNotifications}
                >
                    <Bell className="h-5 w-5" aria-hidden="true" />
                    {unreadNotifications > 0 && (
                        <span
                            className="absolute -top-1 -right-1 h-3 w-3 bg-sys-status-error rounded-full"
                            aria-label={`${unreadNotifications} unread notifications`}
                        ></span>
                    )}
                </button>

                <button
                    className="flex items-center space-x-2 p-2 text-sys-text-tertiary hover:text-sys-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2 rounded-md"
                    aria-label={`User menu for ${currentUser}`}
                    aria-expanded="false"
                    aria-haspopup="menu"
                    onClick={onUserMenu}
                >
                    <User className="h-5 w-5" aria-hidden="true" />
                    <span className="text-sm font-medium">{currentUser}</span>
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
            </div>
        </header>
    );
};

export default StatusBar;
