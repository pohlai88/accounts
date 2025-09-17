"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronDownIcon,
  BuildingOfficeIcon,
  CheckIcon,
  PlusIcon,
  CogIcon,
  UserGroupIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { Button } from "../Button.js";
import { Card, CardContent } from "../Card.js";
import { Badge } from "../Badge.js";
import { cn } from "../utils.js";

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  permissions: Record<string, unknown>;
  company: {
    id: string;
    name: string;
    code: string;
  } | null;
  isActive: boolean;
  statistics?: {
    memberCount: number;
    companyCount: number;
  };
  subscription?: {
    planType: string;
    status: string;
  };
}

export interface TenantSwitcherProps {
  tenants: Tenant[];
  activeTenantId: string | null;
  onTenantSwitch: (tenantId: string) => Promise<void>;
  onCreateTenant?: () => void;
  onManageTenants?: () => void;
  loading?: boolean;
  className?: string;
  showStatistics?: boolean;
  showSubscription?: boolean;
}

export function TenantSwitcher({
  tenants,
  activeTenantId,
  onTenantSwitch,
  onCreateTenant,
  onManageTenants,
  loading = false,
  className = "",
  showStatistics = false,
  showSubscription = false,
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
      console.error("Failed to switch tenant:", error);
      // You might want to show a toast notification here
    } finally {
      setSwitching(null);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin": return "red";
      case "manager": return "blue";
      case "accountant": return "green";
      case "clerk": return "yellow";
      case "viewer": return "gray";
      default: return "gray";
    }
  };

  const getSubscriptionColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "green";
      case "TRIAL": return "blue";
      case "EXPIRED": return "red";
      case "CANCELLED": return "gray";
      default: return "gray";
    }
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-12 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  if (!activeTenant) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-md">
          <div className="text-center">
            <BuildingOfficeIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">No active organization</p>
            {onCreateTenant && (
              <Button size="sm" className="mt-2" onClick={onCreateTenant}>
                <PlusIcon className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        disabled={switching !== null}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">{activeTenant.name}</div>
            {activeTenant.company && (
              <div className="text-xs text-gray-500 truncate">{activeTenant.company.name}</div>
            )}
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {activeTenant.role}
              </Badge>
              {showSubscription && activeTenant.subscription && (
                <Badge
                  variant={getSubscriptionColor(activeTenant.subscription.status) === "green" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {activeTenant.subscription.planType}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <ChevronDownIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Enhanced Dropdown */}
          <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
            <div className="p-2">
              {/* Current Tenant Info */}
              <div className="px-3 py-2 mb-2 bg-blue-50 rounded-md">
                <div className="flex items-center space-x-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-blue-900 truncate">
                      {activeTenant.name}
                    </div>
                    <div className="text-xs text-blue-700">
                      Currently active • {activeTenant.role}
                    </div>
                  </div>
                  <CheckIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                </div>
                {showStatistics && activeTenant.statistics && (
                  <div className="flex items-center space-x-4 mt-2 text-xs text-blue-700">
                    <div className="flex items-center space-x-1">
                      <UserGroupIcon className="w-3 h-3" />
                      <span>{activeTenant.statistics.memberCount} members</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChartBarIcon className="w-3 h-3" />
                      <span>{activeTenant.statistics.companyCount} companies</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Other Tenants */}
              {tenants.filter(t => t.id !== activeTenantId).map(tenant => (
                <button
                  key={tenant.id}
                  type="button"
                  onClick={() => handleTenantSwitch(tenant.id)}
                  disabled={switching === tenant.id}
                  className={`flex items-center justify-between w-full px-3 py-3 text-sm text-left hover:bg-gray-50 rounded-md transition-colors ${switching === tenant.id ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{tenant.name}</div>
                      {tenant.company && (
                        <div className="text-xs text-gray-500 truncate">{tenant.company.name}</div>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {tenant.role}
                        </Badge>
                        {showSubscription && tenant.subscription && (
                          <Badge
                            variant={getSubscriptionColor(tenant.subscription.status) === "green" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {tenant.subscription.planType}
                          </Badge>
                        )}
                      </div>
                      {showStatistics && tenant.statistics && (
                        <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                          <span>{tenant.statistics.memberCount} members</span>
                          <span>{tenant.statistics.companyCount} companies</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {switching === tenant.id && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  )}
                </button>
              ))}

              {/* Action Buttons */}
              <div className="border-t border-gray-200 mt-2 pt-2">
                {onCreateTenant && (
                  <button
                    type="button"
                    onClick={() => {
                      onCreateTenant();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <PlusIcon className="w-4 h-4 mr-2 text-gray-400" />
                    Create New Organization
                  </button>
                )}
                {onManageTenants && (
                  <button
                    type="button"
                    onClick={() => {
                      onManageTenants();
                      setIsOpen(false);
                    }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <CogIcon className="w-4 h-4 mr-2 text-gray-400" />
                    Manage Organizations
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TenantSwitcher;
