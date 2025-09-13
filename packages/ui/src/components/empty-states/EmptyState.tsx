/**
 * EmptyState Component - Steve Jobs Inspired
 * 
 * "Simplicity is the ultimate sophistication"
 * Empty states should feel inevitable and obvious - guiding users to their first action
 */

import React from 'react';
import { cn } from '@aibos/ui/utils';

export interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    };
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center space-y-6 p-12 text-center',
        className
      )}
      role="region"
      aria-labelledby="empty-state-title"
      aria-describedby="empty-state-description"
    >
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sys-fill-low text-sys-text-tertiary" aria-hidden="true">
          {icon}
        </div>
      )}

      <div className="space-y-2">
        <h3 id="empty-state-title" className="text-lg font-semibold text-sys-text-primary">{title}</h3>
        <p id="empty-state-description" className="text-sm text-sys-text-secondary max-w-md">{description}</p>
      </div>

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'btn',
            action.variant === 'primary' ? 'btn-primary' : 'btn-secondary',
            'px-6 py-2 focus:outline-none focus:ring-2 focus:ring-sys-accent focus:ring-offset-2'
          )}
          aria-describedby="empty-state-description"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
