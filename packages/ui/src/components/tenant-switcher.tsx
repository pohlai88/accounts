'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDownIcon, BuildingOfficeIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    role: string;
    permissions: any;
    company: {
        id: string;
        name: string;
        code: string;
    } | null;
    isActive: boolean;
}

export interface TenantSwitcherProps {
    tenants: Tenant[];
    activeTenantId: string | null;
    onTenantSwitch: (tenantId: string) => Promise<void>;
    loading?: boolean;
    className?: string;
}

export function TenantSwitcher({
    tenants,
    activeTenantId,
    onTenantSwitch,
    loading = false,
    className = ''
}: TenantSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [switching, setSwitching] = useState<string | null>(null);

    const activeTenant = tenants.find(t => t.id === activeTenantId);

    const handleTenantSwitch = async (tenantId: string) => {
        if (switching || tenantId === activeTenantId) return;

        setSwitching(tenantId);
        try {
            await onTenantSwitch(tenantId);
            setIsOpen(false);
        } catch (error) {
            console.error('Failed to switch tenant:', error);
            // You might want to show a toast notification here
        } finally {
            setSwitching(null);
        }
    };

    if (loading) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className="h-10 bg-gray-200 rounded-md"></div>
            </div>
        );
    }

    if (!activeTenant) {
        return (
            <div className={`text-sm text-gray-500 ${className}`}>
                No active tenant
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={switching !== null}
            >
                <div className="flex items-center space-x-2">
                    <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                    <div className="text-left">
                        <div className="font-medium">{activeTenant.name}</div>
                        {activeTenant.company && (
                            <div className="text-xs text-gray-500">{activeTenant.company.name}</div>
                        )}
                    </div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                        <div className="py-1">
                            {tenants.map((tenant) => (
                                <button
                                    key={tenant.id}
                                    type="button"
                                    onClick={() => handleTenantSwitch(tenant.id)}
                                    disabled={switching === tenant.id}
                                    className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${tenant.isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                        } ${switching === tenant.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center space-x-2">
                                        <BuildingOfficeIcon className="w-4 h-4 text-gray-400" />
                                        <div>
                                            <div className="font-medium">{tenant.name}</div>
                                            {tenant.company && (
                                                <div className="text-xs text-gray-500">{tenant.company.name}</div>
                                            )}
                                            <div className="text-xs text-gray-400 capitalize">{tenant.role}</div>
                                        </div>
                                    </div>
                                    {tenant.isActive && (
                                        <CheckIcon className="w-4 h-4 text-blue-600" />
                                    )}
                                    {switching === tenant.id && (
                                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default TenantSwitcher;
