import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";

// Mock Supabase client
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
      upsert: vi.fn(),
    })),
    auth: {
      admin: {
        inviteUserByEmail: vi.fn(),
      },
    },
  })),
}));

// Mock security context
vi.mock("../../../../_lib/request", () => ({
  getSecurityContext: vi.fn(),
}));

describe.skip("Tenant Invite API", () => {
  const mockSupabase = {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      insert: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    })),
    auth: {
      admin: {
        inviteUserByEmail: vi.fn(),
      },
    },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { createClient } = await import("@supabase/supabase-js");
    vi.mocked(createClient).mockReturnValue(mockSupabase as any);

    // Mock getSecurityContext for all tests
    const { getSecurityContext } = await import("../../../../_lib/request");
    vi.mocked(getSecurityContext).mockResolvedValue({
      userId: "admin-123",
      email: "admin@example.com",
      tenantId: "tenant-123",
      companyId: "company-123",
      tenantName: "Test Tenant",
      companyName: "Test Company",
      scopes: ["admin"],
      requestId: "req-123",
    });
  });

  it("should invite new user successfully", async () => {

    // Mock membership check
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });

    // Mock user doesn't exist
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: null,
        error: { code: "PGRST116" },
      });

    // Mock auth invite
    mockSupabase.auth.admin.inviteUserByEmail.mockResolvedValue({
      data: { user: { id: "new-user-123" } },
      error: null,
    });

    // Mock membership creation
    mockSupabase.from().upsert.mockResolvedValue({
      data: null,
      error: null,
    });

    // Mock invitation creation
    mockSupabase.from().insert.mockResolvedValue({
      data: null,
      error: null,
    });

    const request = new NextRequest("http://localhost/api/tenants/tenant-123/invite", {
      method: "POST",
      body: JSON.stringify({
        email: "newuser@example.com",
        role: "user",
      }),
    });

    const response = await POST(request, { params: { id: "tenant-123" } });
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.email).toBe("newuser@example.com");
    expect(data.data.role).toBe("user");
  });

  it("should return 403 for non-admin users", async () => {
    const { getSecurityContext } = await import("../../../../_lib/request");

    // Mock security context
    vi.mocked(getSecurityContext).mockResolvedValue({
      userId: "user-123",
      email: "user@example.com",
      tenantId: "tenant-123",
      companyId: "company-123",
      tenantName: "Test Tenant",
      companyName: "Test Company",
      scopes: ["user"],
      requestId: "req-123",
    });

    // Mock membership check - user role
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "user" },
        error: null,
      });

    const request = new NextRequest("http://localhost/api/tenants/tenant-123/invite", {
      method: "POST",
      body: JSON.stringify({
        email: "newuser@example.com",
        role: "user",
      }),
    });

    const response = await POST(request, { params: { id: "tenant-123" } });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("INSUFFICIENT_PERMISSIONS");
  });

  it("should handle existing user reactivation", async () => {
    const { getSecurityContext } = await import("../../../../_lib/request");

    // Mock security context
    vi.mocked(getSecurityContext).mockResolvedValue({
      userId: "admin-123",
      email: "admin@example.com",
      tenantId: "tenant-123",
      companyId: "company-123",
      tenantName: "Test Tenant",
      companyName: "Test Company",
      scopes: ["admin"],
      requestId: "req-123",
    });

    // Mock membership check
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });

    // Mock existing user
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: { id: "existing-user-123" },
        error: null,
      });

    // Mock existing membership (disabled)
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: { id: "membership-123", status: "disabled" },
        error: null,
      });

    // Mock membership update
    mockSupabase.from().update().eq().mockResolvedValue({
      data: null,
      error: null,
    });

    const request = new NextRequest("http://localhost/api/tenants/tenant-123/invite", {
      method: "POST",
      body: JSON.stringify({
        email: "existing@example.com",
        role: "user",
      }),
    });

    const response = await POST(request, { params: { id: "tenant-123" } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe("reactivated");
  });

  it("should return 409 for already active member", async () => {
    const { getSecurityContext } = await import("../../../../_lib/request");

    // Mock security context
    vi.mocked(getSecurityContext).mockResolvedValue({
      userId: "admin-123",
      email: "admin@example.com",
      tenantId: "tenant-123",
      companyId: "company-123",
      tenantName: "Test Tenant",
      companyName: "Test Company",
      scopes: ["admin"],
      requestId: "req-123",
    });

    // Mock membership check
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValue({
        data: { role: "admin" },
        error: null,
      });

    // Mock existing user
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: { id: "existing-user-123" },
        error: null,
      });

    // Mock existing active membership
    mockSupabase
      .from()
      .select()
      .eq()
      .single.mockResolvedValueOnce({
        data: { id: "membership-123", status: "active" },
        error: null,
      });

    const request = new NextRequest("http://localhost/api/tenants/tenant-123/invite", {
      method: "POST",
      body: JSON.stringify({
        email: "existing@example.com",
        role: "user",
      }),
    });

    const response = await POST(request, { params: { id: "tenant-123" } });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("USER_ALREADY_MEMBER");
  });
});
