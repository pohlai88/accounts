/**
 * Dock Component - Steve Jobs Inspired
 * 
 * Verb-first navigation that feels natural and obvious
 * Flat navigation structure avoiding over-nesting
 */

import React, { useEffect } from 'react';
import {
  FileText,
  Receipt,
  CreditCard,
  Lock,
  BarChart3,
  Settings,
  Plus
} from 'lucide-react';
import { cn } from '@aibos/ui/utils';

export interface DockProps {
  className?: string;
  activeItem?: string;
  onNavigate?: (itemId: string) => void;
  onCreate?: () => void;
}

const navigationItems = [
  { id: 'sell', label: 'Sell', icon: FileText, href: '/sell', shortcut: 'g s' },
  { id: 'buy', label: 'Buy', icon: Receipt, href: '/buy', shortcut: 'g b' },
  { id: 'cash', label: 'Cash', icon: CreditCard, href: '/cash', shortcut: 'g c' },
  { id: 'close', label: 'Close', icon: Lock, href: '/close', shortcut: 'g l' },
  { id: 'reports', label: 'Reports', icon: BarChart3, href: '/reports', shortcut: 'g r' },
  { id: 'settings', label: 'Settings', icon: Settings, href: '/settings', shortcut: 'g t' },
];

export const Dock: React.FC<DockProps> = ({
  className,
  activeItem = 'sell',
  onNavigate,
  onCreate
}) => {
  // Handle keyboard shortcuts for navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Handle 'g' + letter shortcuts
      if (event.key === 'g' && !event.repeat) {
        const nextKeyHandler = (e: KeyboardEvent) => {
          const shortcuts: Record<string, string> = {
            's': 'sell',
            'b': 'buy',
            'c': 'cash',
            'l': 'close',
            'r': 'reports',
            't': 'settings'
          };

          if (shortcuts[e.key]) {
            e.preventDefault();
            onNavigate?.(shortcuts[e.key]!);
          }
          document.removeEventListener('keydown', nextKeyHandler);
        };

        document.addEventListener('keydown', nextKeyHandler);
        // Clear handler after 1 second
        setTimeout(() => {
          document.removeEventListener('keydown', nextKeyHandler);
        }, 1000);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  return (
    <nav
      className={cn(
        'w-64 bg-sys-bg-subtle border-r border-sys-border-hairline flex flex-col',
        className
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="p-6 border-b border-sys-border-hairline">
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-md bg-brand-primary flex items-center justify-center" aria-hidden="true">
            <span className="text-sm font-semibold text-sys-text-primary">A</span>
          </div>
          <span className="text-lg font-semibold text-sys-text-primary">AI-BOS</span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 p-4 space-y-2" role="list">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate?.(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2',
                isActive
                  ? 'bg-brand-primary text-sys-text-primary'
                  : 'text-sys-text-secondary hover:text-sys-text-primary hover:bg-sys-fill-low'
              )}
              role="listitem"
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Navigate to ${item.label} section. Shortcut: ${item.shortcut}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" aria-hidden="true" />
                <span className="font-medium">{item.label}</span>
              </div>
              {/* Keyboard shortcut hint */}
              <kbd className="px-1.5 py-0.5 text-xs bg-sys-fill-low text-sys-text-tertiary rounded border border-sys-border-hairline" aria-label={`Shortcut: ${item.shortcut}`}>
                {item.shortcut?.split(' ')[1]?.toUpperCase()}
              </kbd>
            </button>
          );
        })}
      </div>

      {/* Universal Create Button */}
      <div className="p-4 border-t border-sys-border-hairline">
        <button
          className="w-full btn btn-primary flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2"
          aria-label="Create new item. Shortcut: Cmd+N"
          onClick={onCreate}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span>Create</span>
          <kbd className="ml-2 px-1.5 py-0.5 text-xs bg-sys-fill-low text-sys-text-tertiary rounded border border-sys-border-hairline" aria-label="Shortcut: Cmd+N">
            ⌘N
          </kbd>
        </button>
      </div>
    </nav>
  );
};

export default Dock;
