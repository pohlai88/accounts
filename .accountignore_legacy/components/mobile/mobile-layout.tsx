// =====================================================
// Phase 9: Mobile Layout Component
// Mobile-first responsive layout with touch optimization
// =====================================================

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
    Menu,
    X,
    Home,
    FileText,
    DollarSign,
    Users,
    BarChart3,
    Settings,
    Bell,
    Search,
    Plus,
    Wifi,
    WifiOff,
    Battery,
    BatteryLow
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

interface MobileLayoutProps {
    children: React.ReactNode;
    title?: string;
    showBackButton?: boolean;
    showSearch?: boolean;
    showNotifications?: boolean;
    showAddButton?: boolean;
    onAddClick?: () => void;
    onSearchClick?: () => void;
    onNotificationClick?: () => void;
}

export function MobileLayout({
    children,
    title = 'Modern Accounting',
    showBackButton = false,
    showSearch = false,
    showNotifications = false,
    showAddButton = false,
    onAddClick,
    onSearchClick,
    onNotificationClick
}: MobileLayoutProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [batteryLevel, setBatteryLevel] = useState(100);
    const [notificationCount, setNotificationCount] = useState(0);
    const router = useRouter();
    const pathname = usePathname();

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Monitor battery level (if supported)
    useEffect(() => {
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((battery: any) => {
                setBatteryLevel(Math.round(battery.level * 100));

                const updateBatteryLevel = () => {
                    setBatteryLevel(Math.round(battery.level * 100));
                };

                battery.addEventListener('levelchange', updateBatteryLevel);

                return () => {
                    battery.removeEventListener('levelchange', updateBatteryLevel);
                };
            });
        }
    }, []);

    // Mock notification count (in real app, this would come from state management)
    useEffect(() => {
        // Simulate notification count
        setNotificationCount(Math.floor(Math.random() * 5));
    }, []);

    const navigationItems = [
        { name: 'Dashboard', href: '/', icon: Home, current: pathname === '/' },
        { name: 'Invoices', href: '/invoices', icon: FileText, current: pathname.startsWith('/invoices') },
        { name: 'Payments', href: '/payments', icon: DollarSign, current: pathname.startsWith('/payments') },
        { name: 'Suppliers', href: '/suppliers', icon: Users, current: pathname.startsWith('/suppliers') },
        { name: 'Tax', href: '/tax-management', icon: Calculator, current: pathname.startsWith('/tax-management') },
        { name: 'Reports', href: '/reports', icon: BarChart3, current: pathname.startsWith('/reports') }
    ];

    const handleNavigation = (href: string) => {
        router.push(href);
        setIsMenuOpen(false);
    };

    const handleBack = () => {
        router.back();
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Mobile Header */}
            <header className="sticky top-0 z-50 bg-background border-b border-border">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Left side */}
                    <div className="flex items-center space-x-2">
                        {showBackButton ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleBack}
                                className="p-2"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        ) : (
                            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-2">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="w-80">
                                    <div className="flex flex-col h-full">
                                        {/* Logo */}
                                        <div className="flex items-center space-x-2 mb-8">
                                            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                <span className="text-white font-bold text-sm">MA</span>
                                            </div>
                                            <span className="text-lg font-bold">Modern Accounting</span>
                                        </div>

                                        {/* Navigation */}
                                        <nav className="flex-1">
                                            <ul className="space-y-2">
                                                {navigationItems.map((item) => {
                                                    const Icon = item.icon;
                                                    return (
                                                        <li key={item.name}>
                                                            <Button
                                                                variant={item.current ? "secondary" : "ghost"}
                                                                className="w-full justify-start"
                                                                onClick={() => handleNavigation(item.href)}
                                                            >
                                                                <Icon className="h-4 w-4 mr-3" />
                                                                {item.name}
                                                            </Button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </nav>

                                        {/* Status indicators */}
                                        <div className="mt-auto space-y-2">
                                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                                {isOnline ? (
                                                    <Wifi className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <WifiOff className="h-4 w-4 text-red-500" />
                                                )}
                                                <span>{isOnline ? 'Online' : 'Offline'}</span>
                                            </div>

                                            {batteryLevel < 20 && (
                                                <div className="flex items-center space-x-2 text-sm text-yellow-500">
                                                    <BatteryLow className="h-4 w-4" />
                                                    <span>Low Battery ({batteryLevel}%)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        )}

                        <h1 className="text-lg font-semibold truncate">{title}</h1>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-2">
                        {/* Search button */}
                        {showSearch && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onSearchClick}
                                className="p-2"
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Notifications */}
                        {showNotifications && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onNotificationClick}
                                className="p-2 relative"
                            >
                                <Bell className="h-4 w-4" />
                                {notificationCount > 0 && (
                                    <Badge
                                        variant="destructive"
                                        className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                                    >
                                        {notificationCount}
                                    </Badge>
                                )}
                            </Button>
                        )}

                        {/* Add button */}
                        {showAddButton && (
                            <Button
                                size="sm"
                                onClick={onAddClick}
                                className="p-2"
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Status bar */}
                <div className="px-4 pb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center space-x-2">
                            {isOnline ? (
                                <div className="flex items-center space-x-1">
                                    <Wifi className="h-3 w-3 text-green-500" />
                                    <span>Connected</span>
                                </div>
                            ) : (
                                <div className="flex items-center space-x-1">
                                    <WifiOff className="h-3 w-3 text-red-500" />
                                    <span>Offline Mode</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Battery className="h-3 w-3" />
                            <span>{batteryLevel}%</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="pb-20">
                {children}
            </main>

            {/* Bottom navigation for mobile */}
            <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
                <div className="flex items-center justify-around py-2">
                    {navigationItems.slice(0, 5).map((item) => {
                        const Icon = item.icon;
                        return (
                            <Button
                                key={item.name}
                                variant={item.current ? "secondary" : "ghost"}
                                size="sm"
                                onClick={() => handleNavigation(item.href)}
                                className="flex flex-col items-center space-y-1 p-2 h-auto"
                            >
                                <Icon className="h-4 w-4" />
                                <span className="text-xs">{item.name}</span>
                            </Button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}

// Mobile-specific utility components
export function MobileCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <div className={`bg-card border border-border rounded-lg p-4 mx-4 mb-4 ${className}`}>
            {children}
        </div>
    );
}

export function MobileButton({
    children,
    variant = "default",
    size = "default",
    className = "",
    ...props
}: {
    children: React.ReactNode;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    className?: string;
    [key: string]: any;
}) {
    return (
        <Button
            variant={variant}
            size={size}
            className={`w-full ${className}`}
            {...props}
        >
            {children}
        </Button>
    );
}

export function MobileInput({
    label,
    className = "",
    ...props
}: {
    label: string;
    className?: string;
    [key: string]: any;
}) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{label}</label>
            <input
                className={`w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent ${className}`}
                {...props}
            />
        </div>
    );
}

export function MobileSwipeableCard({
    children,
    onSwipeLeft,
    onSwipeRight,
    className = ""
}: {
    children: React.ReactNode;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    className?: string;
}) {
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;

        const deltaX = currentX - startX;
        const threshold = 50;

        if (Math.abs(deltaX) > threshold) {
            if (deltaX > 0 && onSwipeRight) {
                onSwipeRight();
            } else if (deltaX < 0 && onSwipeLeft) {
                onSwipeLeft();
            }
        }

        setIsDragging(false);
        setCurrentX(0);
    };

    return (
        <div
            className={`touch-pan-y ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                transform: isDragging ? `translateX(${currentX - startX}px)` : 'translateX(0)',
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
            }}
        >
            {children}
        </div>
    );
}
