import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyAccessToken, buildSecurityContext, toSecurityContext } from "./auth";

// Mock environment variables
vi.mock("process", () => ({
  env: {
    SUPABASE_JWKS_URL: "https://test.supabase.co/auth/v1/jwks",
    SUPABASE_ISSUER: "https://test.supabase.co/",
    SUPABASE_AUDIENCE: "authenticated",
  },
}));

// Mock jose
vi.mock("jose", () => ({
  createRemoteJWKSet: vi.fn(() => "mock-jwks"),
  jwtVerify: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe("Security Auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("verifyAccessToken", () => {
    it("should throw error for missing authorization header", async () => {
      await expect(verifyAccessToken()).rejects.toThrow("Missing token");
    });

    it("should throw error for invalid authorization format", async () => {
      await expect(verifyAccessToken("Invalid token")).rejects.toThrow("Missing token");
    });

    it("should throw error for missing JWT configuration", async () => {
      // Mock missing environment variables
      vi.mocked(process.env).SUPABASE_JWKS_URL = undefined;

      await expect(verifyAccessToken("Bearer token")).rejects.toThrow("Token verification failed");
    });

    it("should verify valid JWT token", async () => {
      const mockUserData = {
        id: "user-123",
        email: "test@example.com",
        app_metadata: {
          tenant_id: "tenant-123",
          company_id: "company-123",
        },
        user_metadata: {},
        role: "authenticated",
      };

      // Mock the fetch response
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUserData),
      } as any);

      const result = await verifyAccessToken("Bearer valid-token");
      expect(result).toEqual({
        sub: "user-123",
        email: "test@example.com",
        app_metadata: {
          tenant_id: "tenant-123",
          company_id: "company-123",
        },
        user_metadata: {},
        role: "authenticated",
      });
    });
  });

  describe("buildSecurityContext", () => {
    it("should build security context from JWT payload", () => {
      const payload = {
        sub: "user-123",
        email: "test@example.com",
        app_metadata: {
          tenant_id: "tenant-123",
          company_id: "company-123",
          tenant_name: "Test Tenant",
          company_name: "Test Company",
          available_tenants: [{ tenantId: "tenant-123", role: "admin", permissions: {} }],
        },
      };

      const result = buildSecurityContext(payload, "req-123");

      expect(result).toEqual({
        userId: "user-123",
        email: "test@example.com",
        tenantId: "tenant-123",
        companyId: "company-123",
        tenantName: "Test Tenant",
        companyName: "Test Company",
        scopes: [],
        requestId: "req-123",
        availableTenants: [{ tenantId: "tenant-123", role: "admin", permissions: {} }],
      });
    });

    it("should handle missing app_metadata gracefully", () => {
      const payload = {
        sub: "user-123",
        email: "test@example.com",
      };

      const result = buildSecurityContext(payload, "req-123");

      expect(result).toEqual({
        userId: "user-123",
        email: "test@example.com",
        tenantId: "",
        companyId: null,
        tenantName: null,
        companyName: null,
        scopes: [],
        requestId: "req-123",
        availableTenants: undefined,
      });
    });

    it("should handle scopes from JWT claims", () => {
      const payload = {
        sub: "user-123",
        email: "test@example.com",
        scp: ["read", "write"],
      };

      const result = buildSecurityContext(payload, "req-123");

      expect(result.scopes).toEqual(["read", "write"]);
    });
  });

  describe("toSecurityContext", () => {
    it("should convert AuthUser to SecurityContext", () => {
      const authUser = {
        id: "user-123",
        email: "test@example.com",
        tenant_id: "tenant-123",
        role: "admin",
        company_id: "company-123",
      };

      const result = toSecurityContext(authUser, "req-123");

      expect(result).toEqual({
        userId: "user-123",
        email: "test@example.com",
        tenantId: "tenant-123",
        companyId: "company-123",
        tenantName: null,
        companyName: null,
        scopes: ["admin"],
        requestId: "req-123",
      });
    });

    it("should handle missing company_id", () => {
      const authUser = {
        id: "user-123",
        email: "test@example.com",
        tenant_id: "tenant-123",
        role: "admin",
      };

      const result = toSecurityContext(authUser, "req-123");

      expect(result.companyId).toBeNull();
    });
  });
});
