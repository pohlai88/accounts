import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useTenantManagement } from "./use-tenant-management";

// Mock fetch
global.fetch = vi.fn();

// Mock window.supabase
(global as any).window = {
  ...global.window,
  supabase: {
    auth: {
      refreshSession: vi.fn(),
    },
  },
};

describe("useTenantManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(global.fetch).mockClear();
  });

  it("should fetch tenants on mount", async () => {
    const mockTenants = [
      {
        id: "tenant-1",
        name: "Acme Corp",
        slug: "acme-corp",
        role: "admin",
        permissions: {},
        company: { id: "company-1", name: "Acme Corp", code: "ACME" },
        isActive: true,
      },
    ];

    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            availableTenants: mockTenants,
            activeTenantId: "tenant-1",
          },
        }),
    } as Response);

    const { result } = renderHook(() => useTenantManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tenants).toEqual(mockTenants);
    expect(result.current.activeTenantId).toBe("tenant-1");
  });

  it("should handle fetch error", async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useTenantManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Network error");
    expect(result.current.tenants).toEqual([]);
  });

  it("should switch tenant successfully", async () => {
    const mockTenants = [
      {
        id: "tenant-1",
        name: "Acme Corp",
        slug: "acme-corp",
        role: "admin",
        permissions: {},
        company: { id: "company-1", name: "Acme Corp", code: "ACME" },
        isActive: true,
      },
      {
        id: "tenant-2",
        name: "Beta Inc",
        slug: "beta-inc",
        role: "user",
        permissions: {},
        company: { id: "company-2", name: "Beta Inc", code: "BETA" },
        isActive: false,
      },
    ];

    // Mock initial fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            availableTenants: mockTenants,
            activeTenantId: "tenant-1",
          },
        }),
    } as Response);

    // Mock tenant switch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            message: "Active tenant updated successfully",
            tenant: { id: "tenant-2", name: "Beta Inc", slug: "beta-inc" },
          },
        }),
    } as Response);

    // Mock members fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: [],
            currentUserRole: "user",
          },
        }),
    } as Response);

    // Mock session refresh
    vi.mocked((global as any).window.supabase.auth.refreshSession).mockResolvedValue({
      data: { session: { access_token: "new-token" } },
      error: null,
    });

    const { result } = renderHook(() => useTenantManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Switch tenant
    await result.current.switchTenant("tenant-2");

    expect(result.current.activeTenantId).toBe("tenant-2");
    expect(result.current.tenants?.[1]?.isActive).toBe(true);
    expect(result.current.tenants?.[0]?.isActive).toBe(false);
  });

  it("should invite user successfully", async () => {
    const mockMembers = [
      {
        id: "member-1",
        userId: "user-1",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
        permissions: {},
        company: null,
        joinedAt: "2024-01-01T00:00:00Z",
        isCurrentUser: false,
      },
    ];

    // Mock initial state
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            availableTenants: [{ id: "tenant-1", name: "Test Tenant", isActive: true }],
            activeTenantId: "tenant-1",
          },
        }),
    } as Response);

    // Mock members fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: mockMembers,
            currentUserRole: "admin",
          },
        }),
    } as Response);

    // Mock invite user
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { message: "User invited successfully" },
        }),
    } as Response);

    // Mock members refresh after invite
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: [
              ...mockMembers,
              {
                id: "member-2",
                userId: "user-2",
                email: "newuser@example.com",
                firstName: "Jane",
                lastName: "Doe",
                role: "user",
                permissions: {},
                company: null,
                joinedAt: "2024-01-02T00:00:00Z",
                isCurrentUser: false,
              },
            ],
            currentUserRole: "admin",
          },
        }),
    } as Response);

    const { result } = renderHook(() => useTenantManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Invite user
    await result.current.inviteUser("tenant-1", "newuser@example.com", "user");

    expect(global.fetch).toHaveBeenCalledWith("/api/tenants/tenant-1/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "newuser@example.com", role: "user" }),
    });
  });

  it("should remove member successfully", async () => {
    const mockMembers = [
      {
        id: "member-1",
        userId: "user-1",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
        permissions: {},
        company: null,
        joinedAt: "2024-01-01T00:00:00Z",
        isCurrentUser: false,
      },
    ];

    // Mock initial state
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            availableTenants: [{ id: "tenant-1", name: "Test Tenant", isActive: true }],
            activeTenantId: "tenant-1",
          },
        }),
    } as Response);

    // Mock members fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: mockMembers,
            currentUserRole: "admin",
          },
        }),
    } as Response);

    // Mock remove member
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { message: "Member removed successfully" },
        }),
    } as Response);

    // Mock members refresh after removal
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: [],
            currentUserRole: "admin",
          },
        }),
    } as Response);

    const { result } = renderHook(() => useTenantManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Remove member
    await result.current.removeMember("tenant-1", "user-1");

    expect(global.fetch).toHaveBeenCalledWith("/api/tenants/tenant-1/members/user-1", {
      method: "DELETE",
    });
  });

  it("should update member role successfully", async () => {
    const mockMembers = [
      {
        id: "member-1",
        userId: "user-1",
        email: "user@example.com",
        firstName: "John",
        lastName: "Doe",
        role: "user",
        permissions: {},
        company: null,
        joinedAt: "2024-01-01T00:00:00Z",
        isCurrentUser: false,
      },
    ];

    // Mock initial state
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            availableTenants: [{ id: "tenant-1", name: "Test Tenant", isActive: true }],
            activeTenantId: "tenant-1",
          },
        }),
    } as Response);

    // Mock members fetch
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: mockMembers,
            currentUserRole: "admin",
          },
        }),
    } as Response);

    // Mock update role
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: { message: "User role updated successfully" },
        }),
    } as Response);

    // Mock members refresh after update
    vi.mocked(global.fetch).mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            members: [{ ...mockMembers[0], role: "manager" }],
            currentUserRole: "admin",
          },
        }),
    } as Response);

    const { result } = renderHook(() => useTenantManagement());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Update role
    await result.current.updateMemberRole("tenant-1", "user-1", "manager");

    expect(global.fetch).toHaveBeenCalledWith("/api/tenants/tenant-1/members/user-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "manager" }),
    });
  });
});
