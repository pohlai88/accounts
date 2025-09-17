// @ts-nocheck
"use client";

import { useState, useEffect, useCallback } from "react";

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
}

export interface Member {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  permissions: Record<string, unknown>;
  company: {
    id: string;
    name: string;
    code: string;
  } | null;
  joinedAt: string;
  isCurrentUser: boolean;
}

export interface TenantManagementState {
  tenants: Tenant[];
  activeTenantId: string | null;
  members: Member[];
  currentUserRole: string;
  loading: boolean;
  error: string | null;
}

export function useTenantManagement() {
  const [state, setState] = useState<TenantManagementState>({
    tenants: [],
    activeTenantId: null,
    members: [],
    currentUserRole: "",
    loading: true,
    error: null,
  });

  // Fetch user's tenants and active tenant
  const fetchTenants = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/me/active-tenant");
      if (!response.ok) {
        throw new Error("Failed to fetch tenants");
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        tenants: data.data.availableTenants || [],
        activeTenantId: data.data.activeTenantId,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch tenants",
      }));
    }
  }, []);

  // Fetch members for a specific tenant
  const fetchMembers = useCallback(async (tenantId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch(`/api/tenants/${tenantId}/members`);
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }

      const data = await response.json();

      setState(prev => ({
        ...prev,
        members: data.data.members || [],
        currentUserRole: data.data.currentUserRole || "",
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching members:", error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Failed to fetch members",
      }));
    }
  }, []);

  // Switch active tenant
  const switchTenant = useCallback(
    async (tenantId: string) => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));

        const response = await fetch("/api/me/active-tenant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tenantId }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.detail || "Failed to switch tenant");
        }

        // Refresh the session to get new JWT with updated tenant context
        const { data } =
          (await (
            window as {
              supabase?: {
                auth: { refreshSession: () => Promise<{ data: { session: unknown } }> };
              };
            }
          ).supabase?.auth.refreshSession()) || {};
        const session = data?.session;

        if (!session) {
          throw new Error("Failed to refresh session");
        }

        // Update state
        setState(prev => ({
          ...prev,
          activeTenantId: tenantId,
          tenants: prev.tenants.map(t => ({
            ...t,
            isActive: t.id === tenantId,
          })),
          loading: false,
        }));

        // Refresh members for the new tenant
        await fetchMembers(tenantId);
      } catch (error) {
        console.error("Error switching tenant:", error);
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Failed to switch tenant",
        }));
        throw error;
      }
    },
    [fetchMembers],
  );

  // Invite user to tenant
  const inviteUser = useCallback(
    async (tenantId: string, email: string, role: string) => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, role }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.detail || "Failed to invite user");
        }

        // Refresh members list
        await fetchMembers(tenantId);
      } catch (error) {
        console.error("Error inviting user:", error);
        throw error;
      }
    },
    [fetchMembers],
  );

  // Remove member from tenant
  const removeMember = useCallback(
    async (tenantId: string, userId: string) => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}/members/${userId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.detail || "Failed to remove member");
        }

        // Refresh members list
        await fetchMembers(tenantId);
      } catch (error) {
        console.error("Error removing member:", error);
        throw error;
      }
    },
    [fetchMembers],
  );

  // Update member role
  const updateMemberRole = useCallback(
    async (tenantId: string, userId: string, role: string) => {
      try {
        const response = await fetch(`/api/tenants/${tenantId}/members/${userId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.detail || "Failed to update role");
        }

        // Refresh members list
        await fetchMembers(tenantId);
      } catch (error) {
        console.error("Error updating role:", error);
        throw error;
      }
    },
    [fetchMembers],
  );

  // Initialize on mount
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  // Fetch members when active tenant changes
  useEffect(() => {
    if (state.activeTenantId) {
      fetchMembers(state.activeTenantId);
    }
  }, [state.activeTenantId, fetchMembers]);

  return {
    ...state,
    switchTenant,
    inviteUser,
    removeMember,
    updateMemberRole,
    fetchTenants,
    fetchMembers,
  };
}
