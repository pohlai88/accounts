/**
 * ThemeToggle Component - Steve Jobs Inspired
 * 
 * "Accessibility is not a compromise, it's a fundamental need"
 * Toggle between aesthetic and accessibility modes
 */

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { cn } from '@aibos/ui/utils';

export interface ThemeToggleProps {
    className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
    const { mode, toggleMode } = useTheme();

    return (
        <button
            onClick={toggleMode}
            className={cn(
                'flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                'hover:bg-sys-fill-low text-sys-text-secondary hover:text-sys-text-primary',
                className
            )}
            title={`Switch to ${mode === 'aesthetic' ? 'accessibility' : 'aesthetic'} mode`}
        >
            {mode === 'aesthetic' ? (
                <Eye className="h-4 w-4" />
            ) : (
                <EyeOff className="h-4 w-4" />
            )}
            <span>
                {mode === 'aesthetic' ? 'Accessibility Mode' : 'Aesthetic Mode'}
            </span>
        </button>
    );
};

export default ThemeToggle;
