// @ts-nocheck
"use client";

import React from "react";
import { useTenantManagement } from "@aibos/ui/hooks/use-tenant-management";
import { TenantSwitcher } from "@aibos/ui/components/tenant-switcher";
import { MemberManagement } from "@aibos/ui/components/member-management";

export function TenantManagementPage() {
  const {
    tenants,
    activeTenantId,
    members,
    currentUserRole,
    loading,
    error,
    switchTenant,
    inviteUser,
    removeMember,
    updateMemberRole,
  } = useTenantManagement();

  const handleTenantSwitch = async (tenantId: string) => {
    await switchTenant(tenantId);
  };

  const handleInviteUser = async (email: string, role: string) => {
    if (!activeTenantId) return;
    await inviteUser(activeTenantId, email, role);
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeTenantId) return;
    await removeMember(activeTenantId, userId);
  };

  const handleUpdateRole = async (userId: string, role: string) => {
    if (!activeTenantId) return;
    await updateMemberRole(activeTenantId, userId, role);
  };

  if (loading && tenants.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tenant Management</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your tenants and team members</p>
        </div>

        {/* Tenant Switcher */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Active Tenant</h2>
          <TenantSwitcher
            tenants={tenants}
            activeTenantId={activeTenantId}
            onTenantSwitch={handleTenantSwitch}
            loading={loading}
            className="max-w-md"
          />
        </div>

        {/* Member Management */}
        {activeTenantId && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Team Members</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage members and their roles for the current tenant
              </p>
            </div>
            <div className="p-6">
              <MemberManagement
                members={members}
                currentUserRole={currentUserRole}
                onInviteUser={handleInviteUser}
                onRemoveMember={handleRemoveMember}
                onUpdateRole={handleUpdateRole}
                loading={loading}
              />
            </div>
          </div>
        )}

        {/* No Active Tenant Message */}
        {!activeTenantId && tenants.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">No Active Tenant</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Please select a tenant from the dropdown above to manage members.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Tenants Message */}
        {tenants.length === 0 && !loading && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You don't have access to any tenants yet. Contact your administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TenantManagementPage;
